import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { randomBytes } from 'crypto';
import Decimal from 'decimal.js';
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
import { OpcoesScraper, OptionsLiquidityData } from '../../scrapers/options/opcoes.scraper';
import { AppWebSocketGateway } from '../../websocket/websocket.gateway';
import { TelemetryService } from '../../telemetry/telemetry.service';
import { SpanKind } from '@opentelemetry/api';
import {
  NewsCollectorsService,
  AIOrchestatorService,
  ConsensusService,
} from '../news/services';
import { NewsService } from '../news/news.service';
import { News } from '@database/entities';
// FASE 144: Dividends/StockLending DESABILITADOS (Issue #DIVID-001)
// import { DividendsService } from '../dividends/dividends.service';
// import { StockLendingService } from '../stock-lending/stock-lending.service';

export interface UpdateResult {
  success: boolean;
  assetId: string;
  ticker: string;
  status: UpdateStatus;
  error?: string;
  duration?: number;
  traceId?: string;
  metadata?: {
    sources?: string[];
    sourcesCount?: number;
    confidence?: number;
    dataPoints?: number;
    discrepancies?: any[];
    traceId?: string;
    batchPosition?: number;
    batchSize?: number;
  };
}

export interface BatchUpdateResult {
  traceId: string;
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
  private readonly MIN_CONFIDENCE = 0.33; // FASE DISCREPANCY-FIX: Aceita 2 fontes (era 0.5) devido a instabilidade do StatusInvest
  private readonly RATE_LIMIT_DELAY = 2000; // 2 seconds between requests

  /**
   * Gera um trace ID único de 8 caracteres para rastreamento de operações
   * Usa crypto.randomBytes que é nativo do Node.js e compatível com Jest
   */
  private generateTraceId(): string {
    return randomBytes(4).toString('hex');
  }

  // Cache for options liquidity data to avoid repeated scraping during batch updates
  private optionsLiquidityCache: Map<string, OptionsLiquidityData> | null = null;
  private optionsLiquidityCacheTime: Date | null = null;
  private readonly OPTIONS_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

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
    private opcoesScraper: OpcoesScraper,
    private webSocketGateway: AppWebSocketGateway,
    private telemetryService: TelemetryService,
    private newsCollectorsService: NewsCollectorsService,
    private aiOrchestatorService: AIOrchestatorService,
    private consensusService: ConsensusService,
    private newsService: NewsService,
    // FASE 144: Dividends/StockLending DESABILITADOS (Issue #DIVID-001 - Cloudflare blocking)
    // private dividendsService: DividendsService,
    // private stockLendingService: StockLendingService,
  ) {}

  /**
   * MÉTODO 1: Atualizar um único ativo
   * Usado para atualizações manuais de ativos individuais
   *
   * @param ticker - Ticker do ativo
   * @param userId - ID do usuário que solicitou (opcional)
   * @param triggeredBy - Origem da atualização (MANUAL, CRON, BATCH)
   * @param traceContext - Contexto de rastreamento para batch updates (opcional)
   */
  async updateSingleAsset(
    ticker: string,
    userId?: string,
    triggeredBy: UpdateTrigger = UpdateTrigger.MANUAL,
    traceContext?: { traceId: string; position: number; batchSize: number },
  ): Promise<UpdateResult> {
    // Generate trace ID if not provided (for standalone calls)
    const traceId = traceContext?.traceId || this.generateTraceId();
    const positionInfo = traceContext
      ? `[${traceContext.position}/${traceContext.batchSize}]`
      : '';
    const logPrefix = `[TRACE-${traceId}]${positionInfo}`;

    this.logger.log(`${logPrefix} [PRE-SPAN] updateSingleAsset called for ${ticker}`);

    // OpenTelemetry span for the entire update operation
    return this.telemetryService.withSpan(
      'asset.update.single',
      async (span) => {
        this.logger.log(`${logPrefix} [IN-SPAN] Inside withSpan callback`);
        span.setAttributes({
          'asset.ticker': ticker,
          'asset.trigger': triggeredBy,
          'asset.user_id': userId || 'system',
          'asset.batch_position': traceContext?.position || 0,
          'asset.batch_size': traceContext?.batchSize || 1,
        });

    this.logger.log(
      `${logPrefix} Starting update for ${ticker} (user: ${userId || 'system'}, trigger: ${triggeredBy})`,
    );
    this.logger.debug(`${logPrefix} DEBUG 1: Method called successfully`);
    const startTime = Date.now();

    this.logger.debug(`${logPrefix} DEBUG 2: Looking up asset...`);
    // 1. Find asset in database
    const asset = await this.assetRepository.findOne({ where: { ticker } });
    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }
    this.logger.debug(`${logPrefix} DEBUG 3: Asset found: ${asset.id}`);

    // 2. Check if asset has auto-update disabled
    if (!asset.autoUpdateEnabled && triggeredBy === UpdateTrigger.CRON) {
      this.logger.warn(`${logPrefix} Auto-update disabled for ${ticker}, skipping cron update`);
      return {
        success: false,
        assetId: asset.id,
        ticker: asset.ticker,
        status: UpdateStatus.CANCELLED,
        traceId,
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
      // 5. Execute scrapers with nested span
      this.logger.log(`${logPrefix} Scraping data for ${ticker}...`);
      this.logger.debug(`${logPrefix} DEBUG 4: Starting scrapers...`);
      const scraperStartTime = Date.now();

      // Add event for scraper start
      this.telemetryService.addSpanEvent('scraper.start', { ticker });

      const scrapedResult = await this.scrapersService.scrapeFundamentalData(ticker);
      this.logger.debug(`${logPrefix} DEBUG 5: Scrapers returned, duration: ${Date.now() - scraperStartTime}ms`);
      this.logger.debug(`${logPrefix} DEBUG 6: scrapedResult = ${JSON.stringify(scrapedResult).substring(0, 200)}...`);
      const scraperDuration = Date.now() - scraperStartTime;

      // Record scraper duration metric
      this.telemetryService.recordScraperDuration('fundamental_data', scraperDuration, 'success');
      this.telemetryService.addSpanEvent('scraper.complete', {
        ticker,
        duration_ms: scraperDuration,
        sources_count: scrapedResult?.sourcesCount || 0,
      });

      this.logger.debug(`${logPrefix} Scrapers completed for ${ticker} in ${scraperDuration}ms`);

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

      // 7.1. Collect and analyze news automatically (FASE 75.6)
      // This updates the sentiment thermometer for the asset
      await this.collectAndAnalyzeNews(ticker, logPrefix);

      // 7.2. FASE 144: DESABILITADO - Issue #DIVID-001 (Cloudflare blocking)
      // StatusInvest Dividends/StockLending requer OAuth (adiado para FASE 145)
      /*
      const [dividendsResult, lendingResult] = await Promise.allSettled([
        this.scrapersService.fetchDividendsData(ticker),
        this.scrapersService.fetchStockLendingData(ticker),
      ]);

      if (dividendsResult.status === 'fulfilled' && dividendsResult.value.success) {
        try {
          const syncResult = await this.dividendsService.importFromScraper(
            ticker,
            dividendsResult.value.data,
          );

          this.logger.log(
            `${logPrefix} Dividends: ${syncResult.imported} imported, ${syncResult.skipped} skipped`,
          );

          span.setAttributes({
            'dividends.imported': syncResult.imported,
            'dividends.skipped': syncResult.skipped,
            'dividends.total': dividendsResult.value.data.length,
          });
        } catch (error) {
          this.logger.error(`${logPrefix} Failed to import dividends: ${error.message}`);
        }
      } else {
        const reason =
          dividendsResult.status === 'fulfilled'
            ? dividendsResult.value.error
            : dividendsResult.reason;
        this.logger.warn(`${logPrefix} Dividends scraping failed: ${reason}`);
      }

      if (lendingResult.status === 'fulfilled' && lendingResult.value.success) {
        try {
          const syncResult = await this.stockLendingService.importFromScraper(
            ticker,
            lendingResult.value.data,
          );

          this.logger.log(
            `${logPrefix} Stock Lending: ${syncResult.imported} imported, ${syncResult.skipped} skipped`,
          );

          span.setAttributes({
            'lending.imported': syncResult.imported,
            'lending.skipped': syncResult.skipped,
          });
        } catch (error) {
          this.logger.error(`${logPrefix} Failed to import lending: ${error.message}`);
        }
      } else {
        const reason =
          lendingResult.status === 'fulfilled'
            ? lendingResult.value.error
            : lendingResult.reason;
        this.logger.warn(`${logPrefix} Stock lending scraping failed: ${reason}`);
      }
      */

      // 8. Extract sector from rawSourcesData (BRAPI provides this)
      // Try BRAPI first (most reliable for sector), then other sources
      this.logger.debug(
        `${logPrefix} rawSourcesData for ${ticker}: ${JSON.stringify(
          scrapedResult.rawSourcesData?.map((s) => ({
            source: s.source,
            hasSector: !!s.data?.sector,
            sector: s.data?.sector,
          })),
        )}`,
      );
      const sectorFromSources = this.extractSectorFromSources(scrapedResult.rawSourcesData);
      if (sectorFromSources && !asset.sector) {
        asset.sector = sectorFromSources;
        this.logger.debug(`${logPrefix} Extracted sector "${sectorFromSources}" for ${ticker}`);
      } else if (!sectorFromSources) {
        this.logger.debug(`${logPrefix} No sector found in sources for ${ticker}`);
      }

      // 8.1. Check options liquidity for this asset
      try {
        const optionsData = await this.checkOptionsForAsset(ticker);
        if (optionsData) {
          asset.hasOptions = true;
          asset.optionsLiquidityMetadata = {
            periodo: optionsData.periodo,
            totalNegocios: optionsData.totalNegocios,
            volumeFinanceiro: optionsData.volumeFinanceiro,
            quantidadeNegociada: optionsData.quantidadeNegociada,
            mediaNegocios: optionsData.mediaNegocios,
            mediaVolume: optionsData.mediaVolume,
            lastUpdated: optionsData.lastUpdated,
          };
          this.logger.debug(`${logPrefix} Asset ${ticker} has options available`);
        } else if (asset.hasOptions) {
          // Asset no longer has options
          asset.hasOptions = false;
          asset.optionsLiquidityMetadata = null;
          this.logger.debug(`${logPrefix} Asset ${ticker} no longer has options`);
        }
      } catch (optionsError) {
        this.logger.warn(`${logPrefix} Failed to check options for ${ticker}: ${optionsError.message}`);
        // Continue without failing - options check is not critical
      }

      // 9. Update asset tracking fields
      asset.lastUpdated = new Date();
      asset.lastUpdateStatus = 'success';
      asset.lastUpdateError = null;
      asset.updateRetryCount = 0;
      await this.assetRepository.save(asset);

      // 10. Complete update log
      const duration = Date.now() - startTime;
      updateLog.completedAt = new Date();
      updateLog.status = UpdateStatus.SUCCESS;
      updateLog.metadata = {
        sources: scrapedResult.sources,
        sourcesCount: scrapedResult.sourcesCount,
        confidence: scrapedResult.confidence,
        dataPoints: scrapedResult.data ? Object.keys(scrapedResult.data).length : 0,  // BUGFIX: Handle undefined data
        discrepancies: scrapedResult.discrepancies,
        duration,
        traceId,
        batchPosition: traceContext?.position,
        batchSize: traceContext?.batchSize,
      };
      await this.updateLogRepository.save(updateLog);

      // 11. Emit WebSocket event: update completed
      this.webSocketGateway.emitAssetUpdateCompleted({
        assetId: asset.id,
        ticker: asset.ticker,
        updateLogId: updateLog.id,
        status: UpdateStatus.SUCCESS,
        duration,
        metadata: updateLog.metadata,
      });

      this.logger.log(`${logPrefix} ✅ Successfully updated ${ticker} in ${duration}ms`);

      // Record telemetry metrics for success
      this.telemetryService.recordScraperDuration('asset_update', duration, 'success');
      span.setAttributes({
        'asset.success': true,
        'asset.duration_ms': duration,
        'asset.sources_count': scrapedResult.sourcesCount,
        'asset.confidence': scrapedResult.confidence,
      });

      return {
        success: true,
        assetId: asset.id,
        ticker: asset.ticker,
        status: UpdateStatus.SUCCESS,
        duration,
        traceId,
        metadata: updateLog.metadata,
      };
    } catch (error) {
      // Handle failure
      const duration = Date.now() - startTime;
      const errorMessage = error.message || 'Unknown error';

      this.logger.error(`${logPrefix} ❌ Failed to update ${ticker}: ${errorMessage}`);

      // Update asset tracking fields
      asset.lastUpdateStatus = 'failed';
      asset.lastUpdateError = errorMessage;
      asset.updateRetryCount += 1;

      // If max retries reached, reset counter for next batch (NEVER disable asset)
      if (asset.updateRetryCount >= this.MAX_RETRY_COUNT) {
        this.logger.warn(
          `${logPrefix} Max retries reached for ${ticker}, resetting counter for next batch`,
        );
        asset.updateRetryCount = 0; // Reset para próxima tentativa
      }

      await this.assetRepository.save(asset);

      // Update log with failure
      updateLog.completedAt = new Date();
      updateLog.status = UpdateStatus.FAILED;
      updateLog.error = errorMessage;
      updateLog.metadata = {
        duration,
        traceId,
        batchPosition: traceContext?.position,
        batchSize: traceContext?.batchSize,
      };
      await this.updateLogRepository.save(updateLog);

      // Emit WebSocket event: update failed
      this.webSocketGateway.emitAssetUpdateFailed({
        assetId: asset.id,
        ticker: asset.ticker,
        updateLogId: updateLog.id,
        error: errorMessage,
        duration,
      });

      // Record telemetry metric for failure
      this.telemetryService.recordScraperDuration('asset_update', duration, 'failure');

      return {
        success: false,
        assetId: asset.id,
        ticker: asset.ticker,
        status: UpdateStatus.FAILED,
        error: errorMessage,
        duration,
        traceId,
      };
    }
      },
      { kind: SpanKind.INTERNAL, attributes: { 'operation.type': 'asset_update' } },
    );
  }

  /**
   * MÉTODO 2: Atualizar todos os ativos de um portfólio
   * Usado quando o usuário quer atualizar todos os ativos do seu portfólio
   *
   * @param portfolioId - ID do portfólio
   * @param userId - ID do usuário dono do portfólio
   */
  async updatePortfolioAssets(portfolioId: string, userId: string): Promise<BatchUpdateResult> {
    // Generate unique trace ID for this portfolio update operation
    const traceId = this.generateTraceId();
    const logPrefix = `[PORTFOLIO-${traceId}]`;

    this.logger.log(`${logPrefix} Starting update for portfolio ${portfolioId}`);
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
      this.logger.warn(`${logPrefix} Portfolio ${portfolioId} has no assets`);
      return {
        traceId,
        totalAssets: 0,
        successCount: 0,
        failedCount: 0,
        results: [],
        duration: Date.now() - startTime,
      };
    }

    this.logger.log(`${logPrefix} Found ${uniqueTickers.length} unique assets to update`);

    // 3. Emit WebSocket event: batch update started
    // ✅ FIX FASE 114: Added batchId (using traceId) to prevent race condition
    this.webSocketGateway.emitBatchUpdateStarted({
      batchId: traceId,
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
      const position = i + 1;

      this.logger.debug(
        `${logPrefix}[${position}/${uniqueTickers.length}] Processing ${ticker}...`,
      );

      // Emit progress
      // ✅ FIX FASE 114: Added batchId to prevent race condition
      this.webSocketGateway.emitBatchUpdateProgress({
        batchId: traceId,
        portfolioId,
        current: position,
        total: uniqueTickers.length,
        currentTicker: ticker,
      });

      // Update asset with trace context
      const traceContext = {
        traceId,
        position,
        batchSize: uniqueTickers.length,
      };
      const result = await this.updateSingleAsset(ticker, userId, UpdateTrigger.MANUAL, traceContext);
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
    const durationMinutes = (duration / 60000).toFixed(2);

    // 5. Emit WebSocket event: batch update completed
    // ✅ FIX FASE 114: Added batchId to prevent race condition
    this.webSocketGateway.emitBatchUpdateCompleted({
      batchId: traceId,
      portfolioId,
      totalAssets: uniqueTickers.length,
      successCount,
      failedCount,
      duration,
    });

    this.logger.log(
      `${logPrefix} ✅ Portfolio ${portfolioId} completed: ${successCount}/${uniqueTickers.length} successful, ${failedCount} failed (${durationMinutes}min)`,
    );

    return {
      traceId,
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
   *
   * @param tickers - Lista de tickers a atualizar
   * @param userId - ID do usuário (opcional)
   * @param triggeredBy - Origem da atualização
   */
  async updateMultipleAssets(
    tickers: string[],
    userId?: string,
    triggeredBy: UpdateTrigger = UpdateTrigger.MANUAL,
  ): Promise<BatchUpdateResult> {
    // Generate unique trace ID for this batch operation
    const traceId = this.generateTraceId();
    const logPrefix = `[BATCH-${traceId}]`;

    this.logger.log(
      `${logPrefix} Starting batch update for ${tickers.length} assets (trigger: ${triggeredBy})`,
    );
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
      this.logger.warn(`${logPrefix} Tickers not found: ${notFoundTickers.join(', ')}`);
    }

    this.logger.log(
      `${logPrefix} Validated ${foundTickers.length}/${tickers.length} tickers`,
    );

    // 2. Emit WebSocket event: batch update started
    // ✅ FIX FASE 114: Added batchId (using traceId) to prevent race condition
    this.webSocketGateway.emitBatchUpdateStarted({
      batchId: traceId,
      totalAssets: foundTickers.length,
      tickers: foundTickers,
    });

    // 3. Update all assets with rate limiting
    const results: UpdateResult[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < foundTickers.length; i++) {
      const ticker = foundTickers[i];
      const position = i + 1;

      this.logger.debug(
        `${logPrefix}[${position}/${foundTickers.length}] Processing ${ticker}...`,
      );

      // Emit progress
      // ✅ FIX FASE 114: Added batchId to prevent race condition
      this.webSocketGateway.emitBatchUpdateProgress({
        batchId: traceId,
        current: position,
        total: foundTickers.length,
        currentTicker: ticker,
      });

      // Update asset with trace context
      const traceContext = {
        traceId,
        position,
        batchSize: foundTickers.length,
      };
      const result = await this.updateSingleAsset(ticker, userId, triggeredBy, traceContext);
      results.push(result);

      if (result.success) {
        successCount++;
        this.logger.debug(
          `${logPrefix}[${position}/${foundTickers.length}] ✅ ${ticker} completed in ${result.duration}ms`,
        );
      } else {
        failedCount++;
        this.logger.debug(
          `${logPrefix}[${position}/${foundTickers.length}] ❌ ${ticker} failed: ${result.error}`,
        );
      }

      // Rate limiting: wait between requests (except last one)
      if (i < foundTickers.length - 1) {
        await this.sleep(this.RATE_LIMIT_DELAY);
      }
    }

    const duration = Date.now() - startTime;
    const durationMinutes = (duration / 60000).toFixed(2);

    // 4. Emit WebSocket event: batch update completed
    // ✅ FIX FASE 114: Added batchId to prevent race condition
    this.webSocketGateway.emitBatchUpdateCompleted({
      batchId: traceId,
      totalAssets: foundTickers.length,
      successCount,
      failedCount,
      duration,
    });

    this.logger.log(
      `${logPrefix} ✅ Batch completed: ${successCount}/${foundTickers.length} successful, ${failedCount} failed (${durationMinutes}min)`,
    );

    // Log summary statistics
    this.logger.log(
      `${logPrefix} Summary: success_rate=${((successCount / foundTickers.length) * 100).toFixed(1)}%, avg_time=${(duration / foundTickers.length / 1000).toFixed(2)}s/asset`,
    );

    return {
      traceId,
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
    const traceId = this.generateTraceId();
    const logPrefix = `[RETRY-${traceId}]`;

    this.logger.log(`${logPrefix} Starting retry for failed assets`);
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
      this.logger.log(`${logPrefix} No failed assets to retry`);
      return {
        traceId,
        totalAssets: 0,
        successCount: 0,
        failedCount: 0,
        results: [],
        duration: Date.now() - startTime,
      };
    }

    const tickers = failedAssets.map((a) => a.ticker);
    this.logger.log(`${logPrefix} Found ${tickers.length} failed assets to retry`);

    // 2. Update all assets using updateMultipleAssets (returns BatchUpdateResult with its own traceId)
    return this.updateMultipleAssets(tickers, undefined, UpdateTrigger.RETRY);
  }

  /**
   * MÉTODO AUXILIAR: Sanitizar valor numérico para evitar overflow no PostgreSQL
   * numeric(18,2) permite valores até 9999999999999999.99
   *
   * IMPORTANTE: Retorna Decimal.js para precisão perfeita (CLAUDE.md Financial Data Rules)
   * Para dados financeiros, 999_999_999_999_999 (999 trilhões) é mais que suficiente
   * para qualquer market cap ou valor de empresa.
   */
  private sanitizeNumericValue(value: any): Decimal | null {
    if (value === null || value === undefined) return null;

    const num = Number(value);

    // Handle invalid numbers
    if (isNaN(num) || !isFinite(num)) return null;

    // Max safe value that JS can represent precisely and fits in numeric(18,2)
    const MAX_VALUE = 999999999999999.99;
    const MIN_VALUE = -999999999999999.99;

    // FASE 144: REJECT invalid values (do NOT clamp - violates financial data rules)
    // Financial data must NEVER be manipulated. If invalid, return null.
    if (num > MAX_VALUE) {
      this.logger.error(`[SANITIZE] Value ${num} exceeds max (${MAX_VALUE}), REJECTING (invalid data)`);
      return null;  // BUGFIX: Reject instead of clamp
    }
    if (num < MIN_VALUE) {
      this.logger.error(`[SANITIZE] Value ${num} below min (${MIN_VALUE}), REJECTING (invalid data)`);
      return null;  // BUGFIX: Reject instead of clamp
    }

    // Return Decimal for precise financial calculations
    return new Decimal(num);
  }

  /**
   * MÉTODO AUXILIAR: Salvar dados fundamentalistas
   *
   * FASE 1 - Sistema de Rastreamento de Fontes
   * ✅ Popula fieldSources com origem de cada campo
   * ✅ Usa valores do merge inteligente
   */
  private async saveFundamentalData(asset: Asset, scrapedResult: any): Promise<FundamentalData> {
    const data = scrapedResult.data;
    const fieldSources = scrapedResult.fieldSources || {};

    // Sanitize all numeric values to prevent overflow
    const sanitize = (v: any) => this.sanitizeNumericValue(v);

    // FASE 1: Função auxiliar para obter valor do fieldSources ou fallback
    const getFieldValue = (field: string, ...fallbacks: string[]): Decimal | null => {
      // Primeiro: tentar do fieldSources (valor já mergeado)
      if (fieldSources[field]?.finalValue !== undefined) {
        return sanitize(fieldSources[field].finalValue);
      }
      // Fallback: usar data diretamente (compatibilidade)
      for (const key of [field, ...fallbacks]) {
        if (data[key] !== undefined && data[key] !== null) {
          return sanitize(data[key]);
        }
      }
      return null;
    };

    const fundamentalData = this.fundamentalDataRepository.create({
      assetId: asset.id,
      referenceDate: new Date(),

      // Valuation (usando fieldSources quando disponível)
      pl: getFieldValue('pl', 'pe'),
      pvp: getFieldValue('pvp', 'pb'),
      psr: getFieldValue('psr'),
      pAtivos: getFieldValue('pAtivos', 'pa'),
      pCapitalGiro: getFieldValue('pCapitalGiro', 'pcg'),
      pEbit: getFieldValue('pEbit'),
      evEbit: getFieldValue('evEbit'),
      evEbitda: getFieldValue('evEbitda'),
      pegRatio: getFieldValue('pegRatio'),

      // Profitability
      roe: getFieldValue('roe'),
      roa: getFieldValue('roa'),
      roic: getFieldValue('roic'),
      margemBruta: getFieldValue('margemBruta'),
      margemEbit: getFieldValue('margemEbit'),
      margemEbitda: getFieldValue('margemEbitda'),
      margemLiquida: getFieldValue('margemLiquida'),
      giroAtivos: getFieldValue('giroAtivos'),

      // Debt
      dividaBruta: getFieldValue('dividaBruta'),
      dividaLiquida: getFieldValue('dividaLiquida'),
      dividaLiquidaEbitda: getFieldValue('dividaLiquidaEbitda', 'dividaEbitda'),
      dividaLiquidaEbit: getFieldValue('dividaLiquidaEbit'),
      dividaLiquidaPatrimonio: getFieldValue('dividaLiquidaPatrimonio', 'dividaPatrimonio'),
      patrimonioLiquidoAtivos: getFieldValue('patrimonioLiquidoAtivos'),
      passivosAtivos: getFieldValue('passivosAtivos'),

      // Growth
      cagrReceitas5anos: getFieldValue('cagrReceitas5anos', 'cagr5Anos'),
      cagrLucros5anos: getFieldValue('cagrLucros5anos'),

      // Dividends
      dividendYield: getFieldValue('dividendYield', 'dy'),
      payout: getFieldValue('payout'),

      // Financial Statement Data
      receitaLiquida: getFieldValue('receitaLiquida'),
      ebit: getFieldValue('ebit'),
      ebitda: getFieldValue('ebitda'),
      lucroLiquido: getFieldValue('lucroLiquido'),
      patrimonioLiquido: getFieldValue('patrimonioLiquido'),
      ativoTotal: getFieldValue('ativoTotal'),
      disponibilidades: getFieldValue('disponibilidades'),

      // Per Share Data
      lpa: getFieldValue('lpa'),
      vpa: getFieldValue('vpa'),

      // Liquidity
      liquidezCorrente: getFieldValue('liquidezCorrente', 'liquidez_corrente'),

      // FASE 1: Rastreamento de origem por campo
      fieldSources: fieldSources,

      // Metadata
      metadata: {
        sources: scrapedResult.sources,
        sourcesCount: scrapedResult.sourcesCount,
        confidence: scrapedResult.confidence,
        discrepancies: scrapedResult.discrepancies,
        rawSourcesData: scrapedResult.rawSourcesData,
        mergeStrategy: 'smart',
      },
    });

    // FASE 144: UPSERT para prevenir duplicatas (ON CONFLICT DO UPDATE)
    // BUGFIX: orUpdate() nao funciona no TypeORM 0.3.27 - usar onConflict() explicito
    await this.fundamentalDataRepository
      .createQueryBuilder()
      .insert()
      .into(FundamentalData)
      .values(fundamentalData)
      .onConflict(`("asset_id", "reference_date") DO UPDATE SET
        "pl" = EXCLUDED."pl",
        "pvp" = EXCLUDED."pvp",
        "psr" = EXCLUDED."psr",
        "p_ativos" = EXCLUDED."p_ativos",
        "p_capital_giro" = EXCLUDED."p_capital_giro",
        "p_ebit" = EXCLUDED."p_ebit",
        "ev_ebit" = EXCLUDED."ev_ebit",
        "ev_ebitda" = EXCLUDED."ev_ebitda",
        "peg_ratio" = EXCLUDED."peg_ratio",
        "roe" = EXCLUDED."roe",
        "roa" = EXCLUDED."roa",
        "roic" = EXCLUDED."roic",
        "margem_bruta" = EXCLUDED."margem_bruta",
        "margem_ebit" = EXCLUDED."margem_ebit",
        "margem_ebitda" = EXCLUDED."margem_ebitda",
        "margem_liquida" = EXCLUDED."margem_liquida",
        "giro_ativos" = EXCLUDED."giro_ativos",
        "divida_bruta" = EXCLUDED."divida_bruta",
        "divida_liquida" = EXCLUDED."divida_liquida",
        "divida_liquida_ebitda" = EXCLUDED."divida_liquida_ebitda",
        "divida_liquida_ebit" = EXCLUDED."divida_liquida_ebit",
        "divida_liquida_patrimonio" = EXCLUDED."divida_liquida_patrimonio",
        "patrimonio_liquido_ativos" = EXCLUDED."patrimonio_liquido_ativos",
        "passivos_ativos" = EXCLUDED."passivos_ativos",
        "cagr_receitas_5anos" = EXCLUDED."cagr_receitas_5anos",
        "cagr_lucros_5anos" = EXCLUDED."cagr_lucros_5anos",
        "dividend_yield" = EXCLUDED."dividend_yield",
        "payout" = EXCLUDED."payout",
        "receita_liquida" = EXCLUDED."receita_liquida",
        "ebit" = EXCLUDED."ebit",
        "ebitda" = EXCLUDED."ebitda",
        "lucro_liquido" = EXCLUDED."lucro_liquido",
        "patrimonio_liquido" = EXCLUDED."patrimonio_liquido",
        "ativo_total" = EXCLUDED."ativo_total",
        "disponibilidades" = EXCLUDED."disponibilidades",
        "lpa" = EXCLUDED."lpa",
        "vpa" = EXCLUDED."vpa",
        "liquidez_corrente" = EXCLUDED."liquidez_corrente",
        "metadata" = EXCLUDED."metadata",
        "field_sources" = EXCLUDED."field_sources",
        "updated_at" = EXCLUDED."updated_at"
      `)
      .execute();

    // Retornar o registro (buscar do banco após UPSERT)
    return this.fundamentalDataRepository.findOne({
      where: {
        assetId: asset.id,
        referenceDate: fundamentalData.referenceDate,
      },
    });
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
   * MÉTODO AUXILIAR: Buscar ativos ordenados por prioridade de atualização
   *
   * Ordem de prioridade:
   * 1. hasOptions = true (ativos com opções primeiro - mais importantes para trading)
   * 2. lastUpdated IS NULL (nunca atualizados - precisam de dados)
   * 3. lastUpdated ASC (mais antigos primeiro - dados mais desatualizados)
   *
   * @param hasOptionsOnly - Se true, retorna apenas ativos com opções
   * @returns Lista de ativos ordenada por prioridade de atualização
   */
  async getAssetsWithPriority(hasOptionsOnly: boolean = false): Promise<Asset[]> {
    this.logger.log(
      `[GET-PRIORITY] Fetching assets with priority ordering (hasOptionsOnly=${hasOptionsOnly})`,
    );

    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .where('asset.isActive = :isActive', { isActive: true })
      .andWhere('asset.autoUpdateEnabled = :autoUpdateEnabled', {
        autoUpdateEnabled: true,
      });

    // Se filtro ativo, apenas ativos com opções
    if (hasOptionsOnly) {
      queryBuilder.andWhere('asset.hasOptions = :hasOptions', {
        hasOptions: true,
      });
    }

    const assets = await queryBuilder
      .orderBy('asset.hasOptions', 'DESC') // Opções primeiro
      .addOrderBy(
        'CASE WHEN asset.lastUpdated IS NULL THEN 0 ELSE 1 END',
        'ASC',
      ) // Nunca atualizados primeiro
      .addOrderBy('asset.lastUpdated', 'ASC', 'NULLS FIRST') // Mais antigos primeiro
      .getMany();

    this.logger.log(
      `[GET-PRIORITY] Returned ${assets.length} assets ordered by priority`,
    );

    // Log first 5 assets for debugging
    if (assets.length > 0) {
      const first5 = assets.slice(0, 5).map((a) => ({
        ticker: a.ticker,
        hasOptions: a.hasOptions,
        lastUpdated: a.lastUpdated ? a.lastUpdated.toISOString() : 'NULL',
      }));
      this.logger.debug(`[GET-PRIORITY] First 5 assets: ${JSON.stringify(first5)}`);
    }

    return assets;
  }

  /**
   * MÉTODO AUXILIAR: Sleep para rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * MÉTODO AUXILIAR: Extrair setor dos dados brutos das fontes
   *
   * Prioridade:
   * 1. BRAPI (mais confiável para setor)
   * 2. StatusInvest
   * 3. Fundamentus
   * 4. Outras fontes
   */
  private extractSectorFromSources(
    rawSourcesData: Array<{ source: string; data: any; scrapedAt: string }>,
  ): string | null {
    if (!rawSourcesData || rawSourcesData.length === 0) return null;

    // Invalid/generic sector values to ignore
    const invalidSectors = [
      'ações', 'acoes', 'fiis', 'fii', 'home', 'início', 'inicio',
      'de atuação', 'de atuacao', 'setor de atuação', 'setor',
      'arrow_forward', 'arrow_back', 'papéis', 'papeis', 'misto',
    ];

    // Helper to validate sector value
    const isValidSector = (sector: string): boolean => {
      if (!sector || sector.length < 3) return false;
      // Reject sectors that are too long (likely garbage data)
      if (sector.length > 50) return false;
      const normalized = sector.toLowerCase().trim();
      // Check if sector is in invalid list or contains newlines/special chars
      if (invalidSectors.includes(normalized)) return false;
      if (/[\n\r\t]/.test(sector)) return false;
      if (/arrow_/.test(sector)) return false;
      // Reject if it looks like numeric data (many numbers/percentages)
      if (/(\d+[,.]?\d*%?\s*){5,}/.test(sector)) return false;
      // Reject if it looks like a ticker (4-6 letters followed by 1-2 numbers)
      if (/^[A-Z]{4,6}\d{1,2}$/i.test(sector)) return false;
      // Reject if contains "Subsetor:" repeated (garbage from Investidor10)
      if (/Subsetor:/i.test(sector)) return false;
      return true;
    };

    // Clean sector text
    const cleanSector = (sector: string): string => {
      return sector
        .replace(/[\n\r\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/arrow_forward|arrow_back|chevron_right|chevron_left/gi, '')
        .trim();
    };

    // Priority order: Fundamentus first (best sector data), then others
    const priorityOrder = ['fundamentus', 'brapi', 'fundamentei', 'statusinvest', 'investidor10', 'investsite'];

    // Try priority sources first
    for (const sourceId of priorityOrder) {
      const sourceData = rawSourcesData.find((s) => s.source === sourceId);
      if (sourceData?.data?.sector) {
        const sector = cleanSector(String(sourceData.data.sector));
        if (isValidSector(sector)) {
          return sector;
        }
      }
    }

    // If no priority source has valid sector, check all sources
    for (const sourceData of rawSourcesData) {
      if (sourceData?.data?.sector) {
        const sector = cleanSector(String(sourceData.data.sector));
        if (isValidSector(sector)) {
          return sector;
        }
      }
    }

    return null;
  }

  /**
   * MÉTODO AUXILIAR: Coletar e analisar notícias automaticamente
   *
   * Chamado após a atualização de dados fundamentais para manter
   * o termômetro de sentimento atualizado.
   *
   * FASE 75.6 FIX: Agora também busca notícias existentes não analisadas
   * do banco de dados, não apenas as recém-coletadas.
   *
   * @param ticker - Ticker do ativo
   * @param logPrefix - Prefixo para logs (inclui traceId)
   */
  private async collectAndAnalyzeNews(ticker: string, logPrefix: string): Promise<void> {
    try {
      this.logger.log(`${logPrefix} Iniciando coleta de notícias para ${ticker}...`);

      // 1. Coletar novas notícias de todas as fontes RSS
      const collectedNews = await this.newsCollectorsService.collectForTicker(ticker);

      this.logger.log(
        `${logPrefix} ${collectedNews?.length || 0} notícias novas coletadas para ${ticker}`,
      );

      // 2. Buscar notícias existentes não analisadas do banco (FIX para o bug)
      const existingUnanalyzed = await this.newsService.findAll({
        ticker,
        isAnalyzed: false,
        limit: 10,
        offset: 0,
      });

      this.logger.log(
        `${logPrefix} ${existingUnanalyzed.total} notícias existentes não analisadas para ${ticker}`,
      );

      // 3. Combinar: novas + existentes não analisadas
      const allUnanalyzed: News[] = [];

      // Adicionar novas não analisadas
      if (collectedNews?.length > 0) {
        const newUnanalyzed = collectedNews.filter((news) => !news.isAnalyzed);
        allUnanalyzed.push(...newUnanalyzed);
      }

      // Adicionar existentes não analisadas (evitar duplicatas por ID)
      const existingIds = new Set(allUnanalyzed.map((n) => n.id));
      for (const dto of existingUnanalyzed.data) {
        if (!existingIds.has(dto.id)) {
          // Buscar entidade completa para análise
          const newsEntity = await this.newsService.findOneEntity(dto.id);
          allUnanalyzed.push(newsEntity);
        }
      }

      if (allUnanalyzed.length === 0) {
        this.logger.log(`${logPrefix} Nenhuma notícia pendente de análise para ${ticker}`);
        return;
      }

      this.logger.log(
        `${logPrefix} Analisando ${allUnanalyzed.length} notícias de ${ticker}...`,
      );

      // 4. Analisar até 5 notícias por ativo (evitar sobrecarga de API)
      const newsToAnalyze = allUnanalyzed.slice(0, 5);
      let analyzedCount = 0;

      for (const news of newsToAnalyze) {
        try {
          // Analisar com os 6 providers de IA
          await this.aiOrchestatorService.analyzeNews(news);

          // Calcular consenso
          await this.consensusService.calculateConsensus(news.id);

          analyzedCount++;
          this.logger.debug(`${logPrefix} ✅ Notícia ${news.id} analisada`);
        } catch (error) {
          this.logger.warn(
            `${logPrefix} Erro ao analisar notícia ${news.id}: ${error.message}`,
          );
          // Continua com a próxima notícia
        }
      }

      this.logger.log(
        `${logPrefix} ✅ Análise de sentimento concluída: ${analyzedCount}/${newsToAnalyze.length} notícias de ${ticker}`,
      );
    } catch (error) {
      // Log do erro mas não propaga - fundamentais já foram salvos
      this.logger.error(
        `${logPrefix} ❌ Erro na coleta/análise de notícias de ${ticker}: ${error.message}`,
      );
    }
  }

  /**
   * MÉTODO AUXILIAR: Verificar se um ativo tem opções disponíveis
   *
   * Usa cache para evitar múltiplas requisições ao scraper durante batch updates.
   * O cache tem TTL de 30 minutos.
   *
   * @param ticker - Ticker do ativo
   * @returns Dados de liquidez de opções ou null se não tem opções
   */
  private async checkOptionsForAsset(ticker: string): Promise<OptionsLiquidityData | null> {
    // Check if cache is valid
    const now = new Date();
    const cacheValid =
      this.optionsLiquidityCache &&
      this.optionsLiquidityCacheTime &&
      now.getTime() - this.optionsLiquidityCacheTime.getTime() < this.OPTIONS_CACHE_TTL_MS;

    if (!cacheValid) {
      // Refresh cache
      await this.refreshOptionsCache();
    }

    // Return data for this ticker (or null if not in cache)
    return this.optionsLiquidityCache?.get(ticker) || null;
  }

  /**
   * MÉTODO AUXILIAR: Atualizar cache de liquidez de opções
   *
   * Faz scraping de todos os ativos com opções e armazena em cache.
   */
  private async refreshOptionsCache(): Promise<void> {
    this.logger.log('[OPTIONS-CACHE] Refreshing options liquidity cache...');
    const startTime = Date.now();

    try {
      this.optionsLiquidityCache = await this.opcoesScraper.scrapeLiquidityWithDetails();
      this.optionsLiquidityCacheTime = new Date();

      const duration = Date.now() - startTime;
      this.logger.log(
        `[OPTIONS-CACHE] Cache refreshed: ${this.optionsLiquidityCache.size} assets with options (${duration}ms)`,
      );
    } catch (error) {
      this.logger.error(`[OPTIONS-CACHE] Failed to refresh cache: ${error.message}`);
      // Keep old cache if refresh fails
      if (!this.optionsLiquidityCache) {
        this.optionsLiquidityCache = new Map();
      }
    }
  }

  /**
   * MÉTODO PÚBLICO: Sincronizar opções antes de batch update
   *
   * Chamado pelo controller antes de iniciar "Atualizar Todos".
   * Atualiza o cache de opções e sincroniza com o banco de dados.
   *
   * @returns Estatísticas da sincronização
   */
  async syncOptionsBeforeBatchUpdate(): Promise<{
    totalWithOptions: number;
    cacheRefreshed: boolean;
    duration: number;
  }> {
    this.logger.log('[OPTIONS-SYNC] Syncing options liquidity before batch update...');
    const startTime = Date.now();

    try {
      // Force refresh the cache
      await this.refreshOptionsCache();

      // Update all assets in database based on cache
      const allAssets = await this.assetRepository.find({ where: { isActive: true } });
      let updatedCount = 0;

      for (const asset of allAssets) {
        const optionsData = this.optionsLiquidityCache?.get(asset.ticker);
        const hadOptions = asset.hasOptions;
        const hasOptions = !!optionsData;

        // Only update if status changed or data needs refresh
        if (hadOptions !== hasOptions || (hasOptions && optionsData)) {
          asset.hasOptions = hasOptions;
          asset.optionsLiquidityMetadata = hasOptions
            ? {
                periodo: optionsData.periodo,
                totalNegocios: optionsData.totalNegocios,
                volumeFinanceiro: optionsData.volumeFinanceiro,
                quantidadeNegociada: optionsData.quantidadeNegociada,
                mediaNegocios: optionsData.mediaNegocios,
                mediaVolume: optionsData.mediaVolume,
                lastUpdated: optionsData.lastUpdated,
              }
            : null;
          await this.assetRepository.save(asset);
          updatedCount++;
        }
      }

      const duration = Date.now() - startTime;
      const totalWithOptions = this.optionsLiquidityCache?.size || 0;

      this.logger.log(
        `[OPTIONS-SYNC] Sync completed: ${totalWithOptions} assets with options, ${updatedCount} updated (${duration}ms)`,
      );

      return {
        totalWithOptions,
        cacheRefreshed: true,
        duration,
      };
    } catch (error) {
      this.logger.error(`[OPTIONS-SYNC] Sync failed: ${error.message}`);
      throw error;
    }
  }
}
