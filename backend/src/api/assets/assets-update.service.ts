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
  private readonly MIN_SOURCES = 3;
  private readonly MIN_CONFIDENCE = 0.7;
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
   * MÉTODO AUXILIAR: Salvar dados fundamentalistas
   */
  private async saveFundamentalData(asset: Asset, scrapedResult: any): Promise<FundamentalData> {
    const data = scrapedResult.data;

    const fundamentalData = this.fundamentalDataRepository.create({
      assetId: asset.id,
      referenceDate: new Date(),

      // Valuation
      pl: data.pl || data.pe || null,
      pvp: data.pvp || data.pb || null,
      psr: data.psr || null,
      pAtivos: data.pAtivos || data.pa || null,
      pCapitalGiro: data.pCapitalGiro || data.pcg || null,
      pEbit: data.pEbit || null,
      evEbit: data.evEbit || null,
      evEbitda: data.evEbitda || null,
      pegRatio: data.pegRatio || null,

      // Profitability
      roe: data.roe || null,
      roa: data.roa || null,
      roic: data.roic || null,
      margemBruta: data.margemBruta || null,
      margemEbit: data.margemEbit || null,
      margemEbitda: data.margemEbitda || null,
      margemLiquida: data.margemLiquida || null,
      giroAtivos: data.giroAtivos || null,

      // Debt
      dividaBruta: data.dividaBruta || null,
      dividaLiquida: data.dividaLiquida || null,
      dividaLiquidaEbitda: data.dividaLiquidaEbitda || data.dividaEbitda || null,
      dividaLiquidaEbit: data.dividaLiquidaEbit || null,
      dividaLiquidaPatrimonio: data.dividaLiquidaPatrimonio || data.dividaPatrimonio || null,
      patrimonioLiquidoAtivos: data.patrimonioLiquidoAtivos || null,
      passivosAtivos: data.passivosAtivos || null,

      // Growth
      cagrReceitas5anos: data.cagrReceitas5anos || data.cagr5Anos || null,
      cagrLucros5anos: data.cagrLucros5anos || null,

      // Dividends
      dividendYield: data.dividendYield || data.dy || null,
      payout: data.payout || null,

      // Financial Statement Data
      receitaLiquida: data.receitaLiquida || null,
      ebit: data.ebit || null,
      ebitda: data.ebitda || null,
      lucroLiquido: data.lucroLiquido || null,
      patrimonioLiquido: data.patrimonioLiquido || null,
      ativoTotal: data.ativoTotal || null,
      disponibilidades: data.disponibilidades || null,

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
