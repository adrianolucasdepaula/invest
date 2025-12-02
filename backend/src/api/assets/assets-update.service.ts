import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import {
  Asset,
  FundamentalData,
  UpdateLog,
  UpdateStatus,
  UpdateTrigger,
  Portfolio,
  PortfolioPosition,
} from '@database/entities';
import { ScrapersService } from '../../scrapers/scrapers.service';
import { AppWebSocketGateway } from '../../websocket/websocket.gateway';

export interface UpdateResult {
  success: boolean;
  assetId: string;
  ticker: string;
  status: UpdateStatus;
  error?: string;
  duration?: number;
  metadata?: {
    sources?: string[];
    sourcesCount?: number;
    confidence?: number;
    dataPoints?: number;
    discrepancies?: any[];
  };
}

export interface BatchUpdateResult {
  totalAssets: number;
  successCount: number;
  failedCount: number;
  results: UpdateResult[];
  duration: number;
}

@Injectable()
export class AssetsUpdateService {
  private readonly logger = new Logger(AssetsUpdateService.name);

  // Configuration
  private readonly MAX_RETRY_COUNT = 3;
  private readonly OUTDATED_THRESHOLD_DAYS = 7;
  private readonly MIN_SOURCES = 2; // Reduced from 3 to 2 - more realistic for B3 assets
  private readonly MIN_CONFIDENCE = 0.5; // Reduced from 0.7 to 0.5 - matches minConfidence guarantee in scrapers
  private readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(FundamentalData)
    private fundamentalDataRepository: Repository<FundamentalData>,
    @InjectRepository(UpdateLog)
    private updateLogRepository: Repository<UpdateLog>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(PortfolioPosition)
    private portfolioPositionRepository: Repository<PortfolioPosition>,
    private scrapersService: ScrapersService,
    private webSocketGateway: AppWebSocketGateway,
  ) {}

  /**
   * MÉTODO 1: Atualizar um único ativo
   * Usado para atualizações manuais de ativos individuais
   */
  async updateSingleAsset(
    ticker: string,
    userId?: string,
    triggeredBy: UpdateTrigger = UpdateTrigger.MANUAL,
  ): Promise<UpdateResult> {
    this.logger.log(`[UPDATE-SINGLE] Starting update for ${ticker} (user: ${userId || 'system'})`);
    const startTime = Date.now();

    // 1. Find asset in database
    const asset = await this.assetRepository.findOne({ where: { ticker } });
    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    // 2. Check if asset has auto-update disabled
    if (!asset.autoUpdateEnabled && triggeredBy === UpdateTrigger.CRON) {
      this.logger.warn(`[UPDATE-SINGLE] Auto-update disabled for ${ticker}, skipping cron update`);
      return {
        success: false,
        assetId: asset.id,
        ticker: asset.ticker,
        status: UpdateStatus.CANCELLED,
        error: 'Auto-update disabled for this asset',
      };
    }

    // 3. Create update log entry
    const updateLog = this.updateLogRepository.create({
      asset,
      assetId: asset.id,
      userId,
      startedAt: new Date(),
      status: UpdateStatus.RUNNING,
      triggeredBy,
    });
    await this.updateLogRepository.save(updateLog);

    // 4. Emit WebSocket event: update started
    this.webSocketGateway.emitAssetUpdateStarted({
      assetId: asset.id,
      ticker: asset.ticker,
      updateLogId: updateLog.id,
      triggeredBy,
    });

    try {
      // 5. Execute scrapers
      this.logger.log(`[UPDATE-SINGLE] Scraping data for ${ticker}...`);
      const scrapedResult = await this.scrapersService.scrapeFundamentalData(ticker);

      // 6. Validate data quality
      if (!scrapedResult || scrapedResult.sourcesCount < this.MIN_SOURCES) {
        throw new Error(
          `Insufficient data sources: ${scrapedResult?.sourcesCount || 0} < ${this.MIN_SOURCES}`,
        );
      }

      if (scrapedResult.confidence < this.MIN_CONFIDENCE) {
        throw new Error(`Low confidence: ${scrapedResult.confidence} < ${this.MIN_CONFIDENCE}`);
      }

      // 7. Map and save fundamental data
      const fundamentalData = await this.saveFundamentalData(asset, scrapedResult);

      // 8. Update asset tracking fields
      asset.lastUpdated = new Date();
      asset.lastUpdateStatus = 'success';
      asset.lastUpdateError = null;
      asset.updateRetryCount = 0;
      await this.assetRepository.save(asset);

      // 9. Complete update log
      const duration = Date.now() - startTime;
      updateLog.completedAt = new Date();
      updateLog.status = UpdateStatus.SUCCESS;
      updateLog.metadata = {
        sources: scrapedResult.sources,
        sourcesCount: scrapedResult.sourcesCount,
        confidence: scrapedResult.confidence,
        dataPoints: Object.keys(scrapedResult.data).length,
        discrepancies: scrapedResult.discrepancies,
        duration,
      };
      await this.updateLogRepository.save(updateLog);

      // 10. Emit WebSocket event: update completed
      this.webSocketGateway.emitAssetUpdateCompleted({
        assetId: asset.id,
        ticker: asset.ticker,
        updateLogId: updateLog.id,
        status: UpdateStatus.SUCCESS,
        duration,
        metadata: updateLog.metadata,
      });

      this.logger.log(`[UPDATE-SINGLE] ✅ Successfully updated ${ticker} in ${duration}ms`);

      return {
        success: true,
        assetId: asset.id,
        ticker: asset.ticker,
        status: UpdateStatus.SUCCESS,
        duration,
        metadata: updateLog.metadata,
      };
    } catch (error) {
      // Handle failure
      const duration = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';

      this.logger.error(`[UPDATE-SINGLE] ❌ Failed to update ${ticker}: ${errorMessage}`);

      // Update asset tracking fields
      asset.lastUpdateStatus = 'failed';
      asset.lastUpdateError = errorMessage;
      asset.updateRetryCount += 1;

      // If max retries reached, disable auto-update
      if (asset.updateRetryCount >= this.MAX_RETRY_COUNT) {
        this.logger.warn(
          `[UPDATE-SINGLE] Max retries reached for ${ticker}, disabling auto-update`,
        );
        asset.autoUpdateEnabled = false;
      }

      await this.assetRepository.save(asset);

      // Update log with failure
      updateLog.completedAt = new Date();
      updateLog.status = UpdateStatus.FAILED;
      updateLog.error = errorMessage;
      updateLog.metadata = { duration };
      await this.updateLogRepository.save(updateLog);

      // Emit WebSocket event: update failed
      this.webSocketGateway.emitAssetUpdateFailed({
        assetId: asset.id,
        ticker: asset.ticker,
        updateLogId: updateLog.id,
        error: errorMessage,
        duration,
      });

      return {
        success: false,
        assetId: asset.id,
        ticker: asset.ticker,
        status: UpdateStatus.FAILED,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * MÉTODO 2: Atualizar todos os ativos de um portfólio
   * Usado quando o usuário quer atualizar todos os ativos do seu portfólio
   */
  async updatePortfolioAssets(portfolioId: string, userId: string): Promise<BatchUpdateResult> {
    this.logger.log(`[UPDATE-PORTFOLIO] Starting update for portfolio ${portfolioId}`);
    const startTime = Date.now();

    // 1. Find portfolio and verify ownership
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId, user: { id: userId } },
      relations: ['positions', 'positions.asset'],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio ${portfolioId} not found or unauthorized`);
    }

    // 2. Extract unique assets from positions
    const assets = portfolio.positions.map((pos) => pos.asset);
    const uniqueTickers = [...new Set(assets.map((a) => a.ticker))];

    if (uniqueTickers.length === 0) {
      this.logger.warn(`[UPDATE-PORTFOLIO] Portfolio ${portfolioId} has no assets`);
      return {
        totalAssets: 0,
        successCount: 0,
        failedCount: 0,
        results: [],
        duration: Date.now() - startTime,
      };
    }

    this.logger.log(`[UPDATE-PORTFOLIO] Found ${uniqueTickers.length} unique assets to update`);

    // 3. Emit WebSocket event: batch update started
    this.webSocketGateway.emitBatchUpdateStarted({
      portfolioId,
      totalAssets: uniqueTickers.length,
      tickers: uniqueTickers,
    });

    // 4. Update all assets with rate limiting
    const results: UpdateResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < uniqueTickers.length; i++) {
      const ticker = uniqueTickers[i];

      // Emit progress
      this.webSocketGateway.emitBatchUpdateProgress({
        portfolioId,
        current: i + 1,
        total: uniqueTickers.length,
        currentTicker: ticker,
      });

      // Update asset
      const result = await this.updateSingleAsset(ticker, userId, UpdateTrigger.MANUAL);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }

      // Rate limiting: wait between requests (except last one)
      if (i < uniqueTickers.length - 1) {
        await this.sleep(this.RATE_LIMIT_DELAY);
      }
    }

    const duration = Date.now() - startTime;

    // 5. Emit WebSocket event: batch update completed
    this.webSocketGateway.emitBatchUpdateCompleted({
      portfolioId,
      totalAssets: uniqueTickers.length,
      successCount,
      failedCount,
      duration,
    });

    this.logger.log(
      `[UPDATE-PORTFOLIO] ✅ Completed portfolio ${portfolioId}: ${successCount}/${uniqueTickers.length} successful in ${duration}ms`,
    );

    return {
      totalAssets: uniqueTickers.length,
      successCount,
      failedCount,
      results,
      duration,
    };
  }

  /**
   * MÉTODO 3: Atualizar múltiplos ativos específicos
   * Usado para atualizações em lote de ativos selecionados
   */
  async updateMultipleAssets(
    tickers: string[],
    userId?: string,
    triggeredBy: UpdateTrigger = UpdateTrigger.MANUAL,
  ): Promise<BatchUpdateResult> {
    this.logger.log(`[UPDATE-MULTIPLE] Starting batch update for ${tickers.length} assets`);
    const startTime = Date.now();

    if (tickers.length === 0) {
      throw new BadRequestException('No tickers provided');
    }

    // 1. Validate all tickers exist
    const assets = await this.assetRepository.find({
      where: { ticker: In(tickers) },
    });

    const foundTickers = assets.map((a) => a.ticker);
    const notFoundTickers = tickers.filter((t) => !foundTickers.includes(t));

    if (notFoundTickers.length > 0) {
      this.logger.warn(`[UPDATE-MULTIPLE] Tickers not found: ${notFoundTickers.join(', ')}`);
    }

    // 2. Emit WebSocket event: batch update started
    this.webSocketGateway.emitBatchUpdateStarted({
      totalAssets: foundTickers.length,
      tickers: foundTickers,
    });

    // 3. Update all assets with rate limiting
    const results: UpdateResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < foundTickers.length; i++) {
      const ticker = foundTickers[i];

      // Emit progress
      this.webSocketGateway.emitBatchUpdateProgress({
        current: i + 1,
        total: foundTickers.length,
        currentTicker: ticker,
      });

      // Update asset
      const result = await this.updateSingleAsset(ticker, userId, triggeredBy);
      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failedCount++;
      }

      // Rate limiting: wait between requests (except last one)
      if (i < foundTickers.length - 1) {
        await this.sleep(this.RATE_LIMIT_DELAY);
      }
    }

    const duration = Date.now() - startTime;

    // 4. Emit WebSocket event: batch update completed
    this.webSocketGateway.emitBatchUpdateCompleted({
      totalAssets: foundTickers.length,
      successCount,
      failedCount,
      duration,
    });

    this.logger.log(
      `[UPDATE-MULTIPLE] ✅ Completed batch: ${successCount}/${foundTickers.length} successful in ${duration}ms`,
    );

    return {
      totalAssets: foundTickers.length,
      successCount,
      failedCount,
      results,
      duration,
    };
  }

  /**
   * MÉTODO 4: Buscar ativos desatualizados
   * Usado para identificar quais ativos precisam de atualização
   */
  async getOutdatedAssets(portfolioId?: string): Promise<Asset[]> {
    this.logger.log(`[GET-OUTDATED] Finding outdated assets (portfolio: ${portfolioId || 'all'})`);

    // Calculate outdated threshold
    const outdatedDate = new Date();
    outdatedDate.setDate(outdatedDate.getDate() - this.OUTDATED_THRESHOLD_DAYS);

    let query = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.isActive = :isActive', { isActive: true })
      .andWhere('asset.autoUpdateEnabled = :autoUpdateEnabled', { autoUpdateEnabled: true })
      .andWhere(
        '(asset.lastUpdated IS NULL OR asset.lastUpdated < :outdatedDate OR asset.lastUpdateStatus = :failedStatus)',
        { outdatedDate, failedStatus: 'failed' },
      );

    // If portfolioId provided, filter by portfolio assets
    if (portfolioId) {
      query = query
        .innerJoin('portfolio_positions', 'position', 'position.assetId = asset.id')
        .andWhere('position.portfolioId = :portfolioId', { portfolioId });
    }

    const outdatedAssets = await query.getMany();

    this.logger.log(`[GET-OUTDATED] Found ${outdatedAssets.length} outdated assets`);

    return outdatedAssets;
  }

  /**
   * MÉTODO 5: Atualizar ativos por setor
   * Usado para atualizações temáticas (ex: atualizar todos bancos)
   */
  async updateAssetsBySector(sector: string, userId?: string): Promise<BatchUpdateResult> {
    this.logger.log(`[UPDATE-SECTOR] Starting update for sector: ${sector}`);
    const startTime = Date.now();

    // 1. Find all assets in sector
    const assets = await this.assetRepository.find({
      where: {
        sector,
        isActive: true,
        autoUpdateEnabled: true,
      },
    });

    if (assets.length === 0) {
      throw new NotFoundException(`No active assets found for sector: ${sector}`);
    }

    const tickers = assets.map((a) => a.ticker);
    this.logger.log(`[UPDATE-SECTOR] Found ${tickers.length} assets in sector ${sector}`);

    // 2. Update all assets using updateMultipleAssets
    return this.updateMultipleAssets(tickers, userId, UpdateTrigger.BATCH);
  }

  /**
   * MÉTODO 6: Processar retry de ativos com falha
   * Usado pelo cron job para reprocessar ativos que falharam
   */
  async retryFailedAssets(): Promise<BatchUpdateResult> {
    this.logger.log(`[RETRY-FAILED] Starting retry for failed assets`);
    const startTime = Date.now();

    // 1. Find assets with failed status that haven't reached max retry count
    const failedAssets = await this.assetRepository.find({
      where: {
        lastUpdateStatus: 'failed',
        updateRetryCount: LessThan(this.MAX_RETRY_COUNT),
        autoUpdateEnabled: true,
        isActive: true,
      },
    });

    if (failedAssets.length === 0) {
      this.logger.log(`[RETRY-FAILED] No failed assets to retry`);
      return {
        totalAssets: 0,
        successCount: 0,
        failedCount: 0,
        results: [],
        duration: Date.now() - startTime,
      };
    }

    const tickers = failedAssets.map((a) => a.ticker);
    this.logger.log(`[RETRY-FAILED] Found ${tickers.length} failed assets to retry`);

    // 2. Update all assets using updateMultipleAssets
    return this.updateMultipleAssets(tickers, undefined, UpdateTrigger.RETRY);
  }

  /**
   * MÉTODO AUXILIAR: Sanitizar valor numérico para evitar overflow no PostgreSQL
   * numeric(18,2) permite valores até 9999999999999999.99
   *
   * IMPORTANTE: JavaScript não consegue representar 9999999999999999.99 precisamente
   * (Number.MAX_SAFE_INTEGER = 9007199254740991), então usamos um valor menor seguro.
   * Para dados financeiros, 999_999_999_999_999 (999 trilhões) é mais que suficiente
   * para qualquer market cap ou valor de empresa.
   */
  private sanitizeNumericValue(value: any): number | null {
    if (value === null || value === undefined) return null;

    const num = Number(value);

    // Handle invalid numbers
    if (isNaN(num) || !isFinite(num)) return null;

    // Max safe value that JS can represent precisely and fits in numeric(18,2)
    // Using 999_999_999_999_999.99 (15 nines) - well within JS safe integer range
    // and leaves room for 3 more digits in numeric(18,2)
    const MAX_VALUE = 999999999999999.99;
    const MIN_VALUE = -999999999999999.99;

    // Clamp to valid range
    if (num > MAX_VALUE) {
      this.logger.warn(`[SANITIZE] Value ${num} exceeds max (${MAX_VALUE}), clamping`);
      return MAX_VALUE;
    }
    if (num < MIN_VALUE) {
      this.logger.warn(`[SANITIZE] Value ${num} below min (${MIN_VALUE}), clamping`);
      return MIN_VALUE;
    }

    // Round to 2 decimal places
    return Math.round(num * 100) / 100;
  }

  /**
   * MÉTODO AUXILIAR: Salvar dados fundamentalistas
   */
  private async saveFundamentalData(asset: Asset, scrapedResult: any): Promise<FundamentalData> {
    const data = scrapedResult.data;

    // Sanitize all numeric values to prevent overflow
    const sanitize = (v: any) => this.sanitizeNumericValue(v);

    const fundamentalData = this.fundamentalDataRepository.create({
      assetId: asset.id,
      referenceDate: new Date(),

      // Valuation (sanitized to prevent numeric overflow)
      pl: sanitize(data.pl || data.pe),
      pvp: sanitize(data.pvp || data.pb),
      psr: sanitize(data.psr),
      pAtivos: sanitize(data.pAtivos || data.pa),
      pCapitalGiro: sanitize(data.pCapitalGiro || data.pcg),
      pEbit: sanitize(data.pEbit),
      evEbit: sanitize(data.evEbit),
      evEbitda: sanitize(data.evEbitda),
      pegRatio: sanitize(data.pegRatio),

      // Profitability (sanitized)
      roe: sanitize(data.roe),
      roa: sanitize(data.roa),
      roic: sanitize(data.roic),
      margemBruta: sanitize(data.margemBruta),
      margemEbit: sanitize(data.margemEbit),
      margemEbitda: sanitize(data.margemEbitda),
      margemLiquida: sanitize(data.margemLiquida),
      giroAtivos: sanitize(data.giroAtivos),

      // Debt (sanitized)
      dividaBruta: sanitize(data.dividaBruta),
      dividaLiquida: sanitize(data.dividaLiquida),
      dividaLiquidaEbitda: sanitize(data.dividaLiquidaEbitda || data.dividaEbitda),
      dividaLiquidaEbit: sanitize(data.dividaLiquidaEbit),
      dividaLiquidaPatrimonio: sanitize(data.dividaLiquidaPatrimonio || data.dividaPatrimonio),
      patrimonioLiquidoAtivos: sanitize(data.patrimonioLiquidoAtivos),
      passivosAtivos: sanitize(data.passivosAtivos),

      // Growth (sanitized)
      cagrReceitas5anos: sanitize(data.cagrReceitas5anos || data.cagr5Anos),
      cagrLucros5anos: sanitize(data.cagrLucros5anos),

      // Dividends (sanitized)
      dividendYield: sanitize(data.dividendYield || data.dy),
      payout: sanitize(data.payout),

      // Financial Statement Data (sanitized)
      receitaLiquida: sanitize(data.receitaLiquida),
      ebit: sanitize(data.ebit),
      ebitda: sanitize(data.ebitda),
      lucroLiquido: sanitize(data.lucroLiquido),
      patrimonioLiquido: sanitize(data.patrimonioLiquido),
      ativoTotal: sanitize(data.ativoTotal),
      disponibilidades: sanitize(data.disponibilidades),

      // Metadata
      metadata: {
        sources: scrapedResult.sources,
        sourcesCount: scrapedResult.sourcesCount,
        confidence: scrapedResult.confidence,
        discrepancies: scrapedResult.discrepancies,
        rawData: data,
      },
    });

    return this.fundamentalDataRepository.save(fundamentalData);
  }

  /**
   * MÉTODO AUXILIAR: Buscar todos os ativos ativos
   */
  async getAllActiveAssets(): Promise<Asset[]> {
    return this.assetRepository.find({
      where: { isActive: true },
      order: { ticker: 'ASC' },
    });
  }

  /**
   * MÉTODO AUXILIAR: Sleep para rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
