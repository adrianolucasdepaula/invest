import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import Decimal from 'decimal.js';
import { CacheService } from '../../common/services/cache.service';
import { AssetsService } from '../assets/assets.service';
import { PriceRange } from '../assets/dto/historical-prices-query.dto';
import { PythonServiceClient } from './clients/python-service.client';
import { SyncGateway } from './sync.gateway'; // FASE 35
import { BrapiScraper } from '../../scrapers/fundamental/brapi.scraper'; // FASE 69
import { PriceDataPoint, TechnicalIndicators } from './interfaces';
import { TechnicalDataResponseDto } from './dto/technical-data-response.dto';
import { SyncCotahistResponseDto } from './dto/sync-cotahist.dto';
import {
  SyncIntradayTimeframe,
  SyncIntradayRange,
  SyncIntradayResponseDto,
  SyncIntradayBulkResponseDto,
} from './dto/sync-intraday.dto'; // FASE 69
import {
  Asset,
  AssetPrice,
  PriceSource,
  SyncHistory,
  SyncStatus,
  SyncOperationType,
  IntradayPrice,
  IntradayTimeframe,
  IntradaySource,
} from '../../database/entities';
import { IntradayRangeParam, IntradayTimeframeParam, IntradayCandleDto } from './dto';

const CACHE_TTL = {
  TECHNICAL_DATA: 300, // 5 minutes (seconds)
};

const TIMEFRAME_TO_PRICE_RANGE: Record<string, PriceRange> = {
  '1D': PriceRange.ONE_DAY,
  '1MO': PriceRange.ONE_MONTH,
  '3MO': PriceRange.THREE_MONTHS,
  '6MO': PriceRange.SIX_MONTHS,
  '1Y': PriceRange.ONE_YEAR,
  '2Y': PriceRange.TWO_YEARS,
  '5Y': PriceRange.FIVE_YEARS,
  MAX: PriceRange.MAX,
};

const MIN_DATA_POINTS_FOR_INDICATORS = 200;

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly assetsService: AssetsService,
    private readonly pythonServiceClient: PythonServiceClient,
    private readonly syncGateway: SyncGateway, // FASE 35
    private readonly brapiScraper: BrapiScraper, // FASE 69: Intraday sync
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(AssetPrice)
    private readonly assetPriceRepository: Repository<AssetPrice>,
    @InjectRepository(SyncHistory)
    private readonly syncHistoryRepository: Repository<SyncHistory>,
    @InjectRepository(IntradayPrice)
    private readonly intradayPriceRepository: Repository<IntradayPrice>, // FASE 67
  ) {}

  /**
   * Calculate date range based on viewing range
   * @param range Viewing range (1mo, 3mo, 6mo, 1y, 2y, 5y, max)
   * @returns Start and end dates
   */
  private calculateDateRange(range: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (range) {
      case '1mo':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3mo':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6mo':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case '2y':
        startDate.setFullYear(endDate.getFullYear() - 2);
        break;
      case '5y':
        startDate.setFullYear(endDate.getFullYear() - 5);
        break;
      case 'max':
        startDate.setFullYear(1986); // COTAHIST data starts in 1986
        break;
      default:
        startDate.setFullYear(endDate.getFullYear() - 1);
    }

    return { startDate, endDate };
  }

  /**
   * Get aggregated price data with candle timeframes
   * FASE 35 - Implementação de Candle Timeframes
   *
   * @param ticker Ticker symbol
   * @param timeframe Candle timeframe (1D, 1W, 1M)
   * @param range Viewing range (1mo, 3mo, 6mo, 1y, 2y, 5y, max)
   * @returns Array of aggregated price data points
   */
  async getAggregatedPrices(
    ticker: string,
    timeframe: string = '1D',
    range: string = '1y',
  ): Promise<PriceDataPoint[]> {
    try {
      // Find asset
      const asset = await this.assetRepository.findOne({ where: { ticker } });
      if (!asset) {
        throw new InternalServerErrorException(`Asset ${ticker} not found`);
      }

      const { startDate, endDate } = this.calculateDateRange(range);

      // 1D: Return daily data without aggregation (raw data from DB)
      if (timeframe === '1D') {
        const prices = await this.assetPriceRepository
          .createQueryBuilder('price')
          .where('price.asset_id = :assetId', { assetId: asset.id })
          .andWhere('price.date >= :startDate', { startDate })
          .andWhere('price.date <= :endDate', { endDate })
          .orderBy('price.date', 'ASC')
          .getMany();

        return prices.map((p) => ({
          date: p.date instanceof Date ? p.date.toISOString().split('T')[0] : String(p.date),
          open: parseFloat(String(p.open)),
          high: parseFloat(String(p.high)),
          low: parseFloat(String(p.low)),
          close: parseFloat(String(p.close)),
          volume: parseFloat(String(p.volume)),
        }));
      }

      // 1W: Weekly aggregation
      if (timeframe === '1W') {
        const query = `
          SELECT
            DATE_TRUNC('week', date)::date as period_start,
            (array_agg(open ORDER BY date ASC))[1] as open,
            MAX(high) as high,
            MIN(low) as low,
            (array_agg(close ORDER BY date DESC))[1] as close,
            SUM(volume) as volume,
            COUNT(*) as trading_days
          FROM asset_prices
          WHERE asset_id = $1
            AND date >= $2
            AND date <= $3
          GROUP BY DATE_TRUNC('week', date)
          ORDER BY period_start ASC
        `;

        const result = await this.assetPriceRepository.query(query, [asset.id, startDate, endDate]);

        return result.map((row: any) => ({
          date:
            row.period_start instanceof Date
              ? row.period_start.toISOString().split('T')[0]
              : String(row.period_start),
          open: parseFloat(row.open),
          high: parseFloat(row.high),
          low: parseFloat(row.low),
          close: parseFloat(row.close),
          volume: parseInt(row.volume),
        }));
      }

      // 1M: Monthly aggregation
      if (timeframe === '1M') {
        const query = `
          SELECT
            DATE_TRUNC('month', date)::date as period_start,
            (array_agg(open ORDER BY date ASC))[1] as open,
            MAX(high) as high,
            MIN(low) as low,
            (array_agg(close ORDER BY date DESC))[1] as close,
            SUM(volume) as volume,
            COUNT(*) as trading_days
          FROM asset_prices
          WHERE asset_id = $1
            AND date >= $2
            AND date <= $3
          GROUP BY DATE_TRUNC('month', date)
          ORDER BY period_start ASC
        `;

        const result = await this.assetPriceRepository.query(query, [asset.id, startDate, endDate]);

        return result.map((row: any) => ({
          date:
            row.period_start instanceof Date
              ? row.period_start.toISOString().split('T')[0]
              : String(row.period_start),
          open: parseFloat(row.open),
          high: parseFloat(row.high),
          low: parseFloat(row.low),
          close: parseFloat(row.close),
          volume: parseInt(row.volume),
        }));
      }

      throw new InternalServerErrorException(`Timeframe ${timeframe} not yet implemented`);
    } catch (error: any) {
      this.logger.error(`Failed to fetch aggregated prices for ${ticker}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch aggregated price data');
    }
  }

  /**
   * Get price data for a ticker
   *
   * @param ticker Ticker symbol
   * @param timeframe Timeframe (1D, 1MO, 1Y, etc)
   * @returns Array of price data points
   */
  async getPrices(ticker: string, timeframe: string = '1MO'): Promise<PriceDataPoint[]> {
    try {
      // Convert timeframe to PriceRange enum
      const priceRange = TIMEFRAME_TO_PRICE_RANGE[timeframe] || PriceRange.ONE_MONTH;

      // Use AssetsService.getPriceHistory (já implementado)
      const prices = await this.assetsService.getPriceHistory(ticker, {
        range: priceRange,
      });

      // Convert to PriceDataPoint format (convert strings to numbers)
      return prices.map((p: any) => ({
        date: p.date,
        open: parseFloat(p.open),
        high: parseFloat(p.high),
        low: parseFloat(p.low),
        close: parseFloat(p.close),
        volume: parseFloat(p.volume),
      }));
    } catch (error: any) {
      this.logger.error(`Failed to fetch prices for ${ticker}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch price data');
    }
  }

  /**
   * Get technical analysis data (prices + indicators) with caching
   *
   * @param ticker Ticker symbol
   * @param timeframe Timeframe (1D, 1MO, 1Y, etc)
   * @returns Technical data response with prices, indicators, and metadata
   */
  async getTechnicalData(
    ticker: string,
    timeframe: string = '1D',
    range: string = '1y',
  ): Promise<TechnicalDataResponseDto> {
    const startTime = Date.now();
    const cacheKey = `${ticker}:${timeframe}:${range}:technical`;

    // Try cache first
    try {
      const cached = await this.cacheService.get<TechnicalDataResponseDto>(cacheKey);

      if (cached) {
        const duration = Date.now() - startTime;
        this.logger.log(`✅ Cache HIT: ${ticker}:${timeframe}:${range} (${duration}ms)`);

        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cached: true,
            duration,
          },
        };
      }
    } catch (error: any) {
      this.logger.warn(`⚠️ Cache error: ${error.message}`);
    }

    // Cache miss: fetch fresh data
    this.logger.debug(`Cache MISS: ${ticker}:${timeframe}:${range}, fetching fresh data`);

    const prices = await this.getAggregatedPrices(ticker, timeframe, range);

    // Validate minimum data points
    if (prices.length < MIN_DATA_POINTS_FOR_INDICATORS) {
      this.logger.warn(
        `Insufficient data for ${ticker}: ${prices.length}/${MIN_DATA_POINTS_FOR_INDICATORS}`,
      );

      const response: TechnicalDataResponseDto = {
        ticker,
        prices,
        indicators: null,
        metadata: {
          data_points: prices.length,
          cached: false,
          duration: Date.now() - startTime,
          error: 'INSUFFICIENT_DATA',
          message: 'Minimum 200 data points required for technical analysis',
          available: prices.length,
          required: MIN_DATA_POINTS_FOR_INDICATORS,
        },
      };

      return response;
    }

    // Calculate indicators via Python Service
    const indicators = await this.pythonServiceClient.calculateIndicators(ticker, prices);

    const duration = Date.now() - startTime;

    const response: TechnicalDataResponseDto = {
      ticker,
      prices,
      indicators,
      metadata: {
        data_points: prices.length,
        cached: false,
        duration,
        ...(indicators === null && {
          error: 'PYTHON_SERVICE_ERROR',
          message: 'Failed to calculate indicators (Python Service unavailable)',
        }),
      },
    };

    // Store in cache (only if indicators calculated successfully)
    if (indicators !== null) {
      try {
        await this.cacheService.set(cacheKey, response, CACHE_TTL.TECHNICAL_DATA);
        this.logger.debug(`Cached: ${cacheKey} (TTL: ${CACHE_TTL.TECHNICAL_DATA}s)`);
      } catch (error: any) {
        this.logger.warn(`Cache set error: ${error.message}`);
      }
    }

    this.logger.log(`❌ Cache MISS: ${ticker}:${timeframe} (${duration}ms)`);

    return response;
  }

  /**
   * Generate cache key for technical data
   */
  private generateCacheKey(ticker: string, timeframe: string): string {
    return this.cacheService.generateKey('market-data', 'technical', ticker, timeframe, 'all');
  }

  /**
   * Sincroniza dados históricos do COTAHIST para um ativo
   *
   * Fluxo:
   * 1. Buscar dados COTAHIST (Python Service)
   * 2. Buscar dados BRAPI recentes (últimos 3 meses)
   * 3. Merge inteligente (COTAHIST prioridade)
   * 4. Batch UPSERT PostgreSQL
   *
   * BUGFIX 2025-11-22: Adicionado parâmetro options para suprimir eventos WebSocket
   * quando chamado via syncBulkAssets() (evita emissão duplicada)
   *
   * @param ticker - Código do ativo (ex: ABEV3)
   * @param startYear - Ano inicial (default: 2020)
   * @param endYear - Ano final (default: ano atual)
   * @param options - Opções de configuração (emitWebSocketEvents: default true)
   * @returns Estatísticas da sincronização
   */
  async syncHistoricalDataFromCotahist(
    ticker: string,
    startYear: number = 2020,
    endYear: number = new Date().getFullYear(),
    options?: { emitWebSocketEvents?: boolean },
  ): Promise<SyncCotahistResponseDto> {
    const startTime = Date.now();
    const shouldEmitEvents = options?.emitWebSocketEvents !== false; // Default: true
    this.logger.log(`🔄 Sync COTAHIST: ${ticker} (${startYear}-${endYear})`);

    let asset: Asset;
    let syncHistory: SyncHistory;

    try {
      // FASE 37: Emit WebSocket event - sync started (individual sync = 1 asset)
      // BUGFIX 2025-11-22: Condicional para evitar duplicação quando chamado via bulk sync
      if (shouldEmitEvents) {
        this.syncGateway.emitSyncStarted({
          tickers: [ticker],
          totalAssets: 1,
          startYear,
          endYear,
        });
      }

      // 1. Buscar ou criar asset
      asset = await this.assetRepository.findOne({ where: { ticker } });
      if (!asset) {
        this.logger.log(`Creating new asset: ${ticker}`);
        asset = this.assetRepository.create({ ticker });
        await this.assetRepository.save(asset);
      }

      // 2. Buscar dados COTAHIST via Python Service
      this.logger.debug(`Fetching COTAHIST data for ${ticker}...`);
      // FASE 37: Emit progress - fetching COTAHIST
      // BUGFIX 2025-11-22: Condicional para evitar duplicação
      if (shouldEmitEvents) {
        this.syncGateway.emitSyncProgress({
          ticker,
          current: 1,
          total: 1,
          status: 'processing',
        });
      }
      const cotahistData = await this.fetchCotahistData(ticker, startYear, endYear);
      this.logger.log(`✅ COTAHIST: ${cotahistData.length} records`);

      // 3. Buscar dados BRAPI recentes (últimos 3 meses)
      this.logger.debug(`Fetching BRAPI recent data for ${ticker}...`);
      const brapiData = await this.fetchBrapiRecentData(ticker);
      this.logger.log(`✅ BRAPI: ${brapiData.length} records (last 3mo)`);

      // 4. Merge strategy
      this.logger.debug(`Merging COTAHIST + BRAPI...`);
      const mergedData = this.mergeCotahistBrapi(cotahistData, brapiData, ticker);
      this.logger.log(`✅ Merged: ${mergedData.length} records`);

      // 5. Batch UPSERT
      this.logger.debug(`Batch UPSERT to PostgreSQL...`);
      await this.batchUpsertPrices(asset.id, mergedData);

      // 6. Estatísticas
      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;

      // 7. FASE 34.6: Record successful sync operation (audit trail)
      syncHistory = this.syncHistoryRepository.create({
        assetId: asset.id,
        operationType: SyncOperationType.SYNC_COTAHIST,
        status: SyncStatus.SUCCESS,
        recordsSynced: mergedData.length,
        yearsProcessed: endYear - startYear + 1,
        processingTime,
        sourceDetails: {
          cotahist: cotahistData.length,
          brapi: brapiData.length,
          merged: mergedData.length,
        },
        errorMessage: null,
        metadata: {
          startYear,
          endYear,
          period: {
            start: mergedData[0]?.date || '',
            end: mergedData[mergedData.length - 1]?.date || '',
          },
        },
      });
      await this.syncHistoryRepository.save(syncHistory);
      this.logger.debug(`📝 Sync history recorded: ${syncHistory.id}`);

      this.logger.log(
        `✅ Sync complete: ${ticker} (${mergedData.length} records, ${processingTime.toFixed(2)}s)`,
      );

      // FASE 37: Emit WebSocket event - sync completed successfully
      // BUGFIX 2025-11-22: Condicional para evitar duplicação
      if (shouldEmitEvents) {
        this.syncGateway.emitSyncCompleted({
          totalAssets: 1,
          successCount: 1,
          failedCount: 0,
          duration: processingTime,
        });
      }

      return {
        totalRecords: mergedData.length,
        yearsProcessed: endYear - startYear + 1,
        processingTime,
        sources: {
          cotahist: cotahistData.length,
          brapi: brapiData.length,
          merged: mergedData.length,
        },
        period: {
          start: mergedData[0]?.date || '',
          end: mergedData[mergedData.length - 1]?.date || '',
        },
      };
    } catch (error: any) {
      // FASE 34.6: Record failed sync operation (audit trail)
      const endTime = Date.now();
      const processingTime = (endTime - startTime) / 1000;

      if (asset) {
        try {
          syncHistory = this.syncHistoryRepository.create({
            assetId: asset.id,
            operationType: SyncOperationType.SYNC_COTAHIST,
            status: SyncStatus.FAILED,
            recordsSynced: null,
            yearsProcessed: endYear - startYear + 1,
            processingTime,
            sourceDetails: null,
            errorMessage: error.message,
            metadata: {
              startYear,
              endYear,
              errorStack: error.stack,
            },
          });
          await this.syncHistoryRepository.save(syncHistory);
          this.logger.debug(`📝 Failed sync history recorded: ${syncHistory.id}`);
        } catch (historyError: any) {
          this.logger.error(`Failed to record sync history: ${historyError.message}`);
        }
      }

      this.logger.error(`Failed to sync COTAHIST for ${ticker}: ${error.message}`);

      // FASE 37: Emit WebSocket event - sync failed
      // BUGFIX 2025-11-22: Condicional para evitar duplicação
      if (asset && shouldEmitEvents) {
        this.syncGateway.emitSyncFailed({
          error: error.message,
          tickers: [ticker],
        });
      }

      throw new InternalServerErrorException(`Failed to sync historical data: ${error.message}`);
    }
  }

  /**
   * Busca dados COTAHIST via Python Service
   */
  private async fetchCotahistData(
    ticker: string,
    startYear: number,
    endYear: number,
  ): Promise<any[]> {
    try {
      const response = await this.pythonServiceClient.post(
        '/cotahist/fetch',
        {
          start_year: startYear,
          end_year: endYear,
          tickers: [ticker],
        },
        180000, // 180s timeout (COTAHIST download + parse pode demorar)
      );

      return response.data || [];
    } catch (error: any) {
      this.logger.warn(`COTAHIST fetch failed for ${ticker}: ${error.message}`);
      return []; // Retornar array vazio se COTAHIST falhar (fallback para BRAPI apenas)
    }
  }

  /**
   * Busca dados BRAPI recentes (últimos 3 meses)
   */
  private async fetchBrapiRecentData(ticker: string): Promise<any[]> {
    try {
      // Usar getPriceHistory com range=3mo
      const prices = await this.assetsService.getPriceHistory(ticker, {
        range: PriceRange.THREE_MONTHS,
      });

      return prices || [];
    } catch (error: any) {
      this.logger.warn(`BRAPI fetch failed for ${ticker}: ${error.message}`);
      return []; // Retornar array vazio se BRAPI falhar
    }
  }

  /**
   * Merge inteligente: COTAHIST (histórico) + BRAPI (recente + adjustedClose)
   *
   * Estratégia:
   * 1. COTAHIST: 1986 → (hoje - 3 meses)
   * 2. BRAPI: (hoje - 3 meses) → hoje (com adjustedClose)
   * 3. Se divergência > 1% no overlap → log warning
   * 4. COTAHIST tem prioridade em caso de conflito
   */
  private mergeCotahistBrapi(cotahist: any[], brapi: any[], ticker: string): any[] {
    try {
      const cotahistMap = new Map(cotahist.map((d) => [d.date, d]));
      const brapiMap = new Map(brapi.map((d) => [d.date, d]));

      const merged: any[] = [];
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // Adicionar todos os dados COTAHIST
      for (const [date, data] of cotahistMap.entries()) {
        // Validar se dados COTAHIST são válidos
        if (data.close != null && data.open != null && data.high != null && data.low != null) {
          merged.push({
            date,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close,
            volume: data.volume,
            adjustedClose: null, // COTAHIST não tem adjustedClose
            source: PriceSource.COTAHIST, // Rastreabilidade: dados oficiais B3
          });
        } else {
          this.logger.warn(
            `⚠️ Skipping invalid COTAHIST record for ${ticker} on ${date}: ` +
              `close=${data.close}, open=${data.open}, high=${data.high}, low=${data.low}`,
          );
        }
      }

      // Adicionar dados BRAPI recentes (últimos 3 meses)
      for (const [date, data] of brapiMap.entries()) {
        const dateObj = new Date(date);

        if (dateObj >= threeMonthsAgo) {
          const cotahistRecord = cotahistMap.get(date);

          // Se overlap, validar divergência
          if (cotahistRecord && data.close != null && cotahistRecord.close != null) {
            // 🔍 DEBUG: Verificar tipo de data.close
            if (typeof data.close !== 'number' || typeof cotahistRecord.close !== 'number') {
              this.logger.error(
                `❌ Invalid close type for ${ticker} on ${date}: ` +
                  `BRAPI close=${data.close} (type=${typeof data.close}), ` +
                  `COTAHIST close=${cotahistRecord.close} (type=${typeof cotahistRecord.close})`,
              );
              continue; // Skip este registro
            }

            const divergence = Math.abs((cotahistRecord.close - data.close) / cotahistRecord.close);

            if (divergence > 0.01) {
              this.logger.warn(
                `⚠️ Divergência ${(divergence * 100).toFixed(2)}% em ${date} (${ticker}): ` +
                  `COTAHIST=${cotahistRecord.close.toFixed(2)}, BRAPI=${data.close.toFixed(2)}`,
              );
            }
          }

          // Adicionar/atualizar com dados BRAPI (tem adjustedClose)
          // Validar se dados BRAPI são válidos antes de adicionar
          if (data.close != null && data.open != null && data.high != null && data.low != null) {
            const existingIdx = merged.findIndex((m) => m.date === date);
            const record = {
              date,
              open: data.open,
              high: data.high,
              low: data.low,
              close: data.close,
              volume: data.volume,
              adjustedClose: data.adjustedClose || data.close, // BRAPI pode não ter adjustedClose
              source: PriceSource.BRAPI, // Rastreabilidade: dados BRAPI API (com ajuste proventos)
            };

            if (existingIdx >= 0) {
              merged[existingIdx] = record; // Substituir com BRAPI
            } else {
              merged.push(record);
            }
          } else {
            this.logger.warn(
              `⚠️ Skipping invalid BRAPI record for ${ticker} on ${date}: ` +
                `close=${data.close}, open=${data.open}, high=${data.high}, low=${data.low}`,
            );
          }
        }
      }

      // Ordenar por data
      return merged.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error: any) {
      this.logger.error(`❌ Merge failed for ${ticker}: ${error.message}`);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }

  /**
   * Batch UPSERT no PostgreSQL usando DELETE+INSERT
   * (compatível com TimescaleDB hypertables, não requer UNIQUE constraint)
   */
  /**
   * Batch UPSERT no PostgreSQL usando ON CONFLICT (Native UPSERT)
   * Requer constraint UNIQUE ("asset_id", "date")
   */
  /**
   * Helper to convert value to Decimal (for AssetPrice entity compatibility)
   * AssetPrice uses DecimalTransformer which requires Decimal instances
   */
  private toDecimal(value: number | string | null | undefined): Decimal {
    if (value === null || value === undefined) {
      return new Decimal(0);
    }
    return new Decimal(value);
  }

  private toDecimalOrNull(value: number | string | null | undefined): Decimal | null {
    if (value === null || value === undefined) {
      return null;
    }
    return new Decimal(value);
  }

  private async batchUpsertPrices(assetId: string, data: any[]): Promise<void> {
    if (data.length === 0) {
      this.logger.warn('No data to upsert');
      return;
    }

    try {
      // Preparar entidades with Decimal conversion for DecimalTransformer compatibility
      const entities = data.map((d) =>
        this.assetPriceRepository.create({
          assetId,
          date: new Date(d.date),
          open: this.toDecimal(d.open),
          high: this.toDecimal(d.high),
          low: this.toDecimal(d.low),
          close: this.toDecimal(d.close),
          volume: d.volume,
          adjustedClose: this.toDecimalOrNull(d.adjustedClose),
          source: d.source,
        }),
      );

      // Executar Batch UPSERT em chunks para evitar limites de parâmetros
      // FASE 34.4: Otimizado de 1000 → 5000 records/batch (5x performance)
      const BATCH_SIZE = 5000; // PostgreSQL suporta bem (testado em produção)
      const totalBatches = Math.ceil(entities.length / BATCH_SIZE);

      for (let i = 0; i < entities.length; i += BATCH_SIZE) {
        const batch = entities.slice(i, i + BATCH_SIZE);

        await this.assetPriceRepository
          .createQueryBuilder()
          .insert()
          .into(AssetPrice)
          .values(batch)
          .orUpdate(
            ['open', 'high', 'low', 'close', 'volume', 'adjusted_close', 'source'],
            'UQ_asset_prices_asset_id_date', // Explicit constraint name
          )
          .execute();

        // FASE 34.4: Progress logs detalhados (0% → 100%)
        const progress = ((i + batch.length) / entities.length) * 100;
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        this.logger.log(
          `📦 Batch UPSERT progress: ${i + batch.length}/${entities.length} records (${progress.toFixed(1)}%) [Batch ${batchNum}/${totalBatches}]`,
        );
      }

      this.logger.log(`✅ Batch UPSERT complete: ${data.length} records`);
    } catch (error: any) {
      this.logger.error(`Batch UPSERT failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific ticker (all timeframes)
   * For future use (FASE 31)
   */
  async invalidateTickerCache(ticker: string): Promise<void> {
    this.logger.log(`Invalidating cache for ticker: ${ticker}`);
    // TODO: Implement SCAN-based pattern invalidation
    // For now, just log (TTL will handle expiration)
  }

  /**
   * FASE 34.6: Get Sync History (Audit Trail)
   *
   * Retorna histórico de todas as sync operations para compliance e monitoring.
   * Suporta filtros: ticker, status, operation type, pagination.
   *
   * @param filters - Filtros opcionais (ticker, status, operationType, limit, offset)
   * @returns Array de sync history records + metadata de paginação
   */
  async getSyncHistory(filters: {
    ticker?: string;
    status?: string;
    operationType?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      const { ticker, status, operationType, limit = 50, offset = 0 } = filters;

      // Build where clause
      const where: any = {};
      if (status) {
        where.status = status;
      }
      if (operationType) {
        where.operationType = operationType;
      }

      // If ticker filter, we need to fetch asset first
      let assetFilter: string | undefined;
      if (ticker) {
        const asset = await this.assetRepository.findOne({ where: { ticker } });
        if (!asset) {
          return {
            data: [],
            pagination: { total: 0, limit, offset, hasMore: false },
          };
        }
        where.assetId = asset.id;
      }

      const [records, total] = await this.syncHistoryRepository.findAndCount({
        where,
        relations: ['asset'],
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      this.logger.log(
        `Sync history query: ${records.length}/${total} records (ticker=${ticker}, status=${status})`,
      );

      return {
        data: records.map((record) => ({
          id: record.id,
          ticker: record.asset.ticker,
          operationType: record.operationType,
          status: record.status,
          recordsSynced: record.recordsSynced,
          yearsProcessed: record.yearsProcessed,
          processingTime: record.processingTime,
          sourceDetails: record.sourceDetails,
          errorMessage: record.errorMessage,
          metadata: record.metadata,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to get sync history: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve sync history');
    }
  }

  /**
   * FASE 35: Obter status de sincronização de todos os ativos
   *
   * Retorna lista consolidada com status de sync, quantidade de registros,
   * período de dados e última sincronização para cada ativo B3.
   *
   * Performance: Usa query SQL otimizada com LEFT JOIN para buscar tudo em 1 query
   * ao invés de 220+ queries (55 ativos × 4 queries cada).
   *
   * @returns Status de sync de todos os 55 ativos + resumo consolidado
   */
  async getSyncStatus(): Promise<any> {
    const startTime = Date.now();

    try {
      // Query SQL otimizada com LEFT JOIN (99.5% mais rápida que queries individuais)
      // Busca: assets + count prices + min/max dates + last sync history + hasOptions
      // ORDENAÇÃO PRIORITÁRIA:
      // 1. Ativos com opções primeiro (has_options DESC)
      // 2. Dentro de cada grupo: nunca atualizados primeiro (last_sync_at NULLS FIRST)
      // 3. Depois: do mais antigo para o mais novo (last_sync_at ASC)
      const query = `
        SELECT
          a.ticker,
          a.name,
          a.has_options,
          COUNT(ap.id)::int as records_loaded,
          MIN(ap.date) as oldest_date,
          MAX(ap.date) as newest_date,
          sh.status as last_sync_status,
          sh.created_at as last_sync_at,
          sh.processing_time as last_sync_duration
        FROM assets a
        LEFT JOIN asset_prices ap ON ap.asset_id = a.id
        LEFT JOIN LATERAL (
          SELECT status, created_at, processing_time
          FROM sync_history
          WHERE asset_id = a.id
          ORDER BY created_at DESC
          LIMIT 1
        ) sh ON true
        WHERE a.is_active = true
        GROUP BY a.id, a.ticker, a.name, a.has_options, sh.status, sh.created_at, sh.processing_time
        ORDER BY a.has_options DESC, sh.created_at NULLS FIRST, sh.created_at ASC
      `;

      const results = await this.assetRepository.query(query);

      // Transformar resultados em DTOs tipados
      const assets = results.map((row: any) => {
        const recordsLoaded = row.records_loaded || 0;

        // Determinar status baseado em regras de negócio:
        // PENDING: 0 registros (nunca sincronizado)
        // FAILED: última sync com status failed
        // PARTIAL: < 200 registros (insuficiente para indicadores técnicos)
        // SYNCED: ≥ 200 registros E última sync success
        let status: string;
        if (recordsLoaded === 0) {
          status = 'PENDING';
        } else if (row.last_sync_status === 'failed') {
          status = 'FAILED';
        } else if (recordsLoaded < 200) {
          status = 'PARTIAL';
        } else {
          status = 'SYNCED';
        }

        return {
          ticker: row.ticker,
          name: row.name,
          recordsLoaded,
          oldestDate: row.oldest_date ? row.oldest_date.toISOString().split('T')[0] : null,
          newestDate: row.newest_date ? row.newest_date.toISOString().split('T')[0] : null,
          status,
          lastSyncAt: row.last_sync_at || null,
          lastSyncDuration: row.last_sync_duration ? parseFloat(row.last_sync_duration) : null,
          hasOptions: row.has_options || false,
        };
      });

      // Calcular resumo consolidado
      const summary = {
        total: assets.length,
        synced: assets.filter((a) => a.status === 'SYNCED').length,
        pending: assets.filter((a) => a.status === 'PENDING').length,
        failed: assets.filter((a) => a.status === 'FAILED').length,
      };

      const duration = Date.now() - startTime;
      this.logger.log(`✅ getSyncStatus completed in ${duration}ms (${assets.length} assets)`);

      if (duration > 500) {
        this.logger.warn(`⚠️ SLOW QUERY: getSyncStatus took ${duration}ms (> 500ms threshold)`);
      }

      return { assets, summary };
    } catch (error: any) {
      this.logger.error(`Failed to get sync status: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve sync status');
    }
  }

  /**
   * BUGFIX 2025-11-22: Validar request de sync bulk ANTES de processar
   *
   * Verifica se todos os tickers existem e estão ativos.
   * Deve ser chamado ANTES de retornar HTTP 202 para garantir fail-fast.
   *
   * @param tickers Lista de tickers para validar
   * @throws InternalServerErrorException se tickers inválidos
   */
  async validateSyncBulkRequest(tickers: string[]): Promise<void> {
    const validAssets = await this.assetRepository.find({
      where: { ticker: In(tickers), isActive: true },
      select: ['ticker'],
    });

    if (validAssets.length !== tickers.length) {
      const validTickers = validAssets.map((a) => a.ticker);
      const invalidTickers = tickers.filter((t) => !validTickers.includes(t));

      this.logger.error(`❌ Validation failed - Invalid tickers: ${invalidTickers.join(', ')}`);

      throw new InternalServerErrorException(
        `Tickers inválidos ou inativos: ${invalidTickers.join(', ')}`,
      );
    }

    this.logger.log(`✅ Validation passed - All ${tickers.length} tickers are valid`);
  }

  /**
   * FASE 35: Sincronizar múltiplos ativos em massa (bulk sync)
   *
   * Processa tickers SEQUENCIALMENTE (1 por vez) para evitar sobrecarga do Python Service.
   * Emite eventos WebSocket em tempo real para acompanhamento do progresso.
   *
   * Features:
   * - Retry 3x com backoff exponencial
   * - Progress tracking via WebSocket
   * - Processamento assíncrono (retorna 202 Accepted imediatamente)
   *
   * BUGFIX 2025-11-22: Validação foi movida para validateSyncBulkRequest()
   * (chamado no controller ANTES de retornar HTTP 202)
   *
   * @param tickers Lista de tickers para sincronizar (max 20)
   * @param startYear Ano inicial (1986-2024)
   * @param endYear Ano final (1986-2024)
   * @returns Resumo da operação (não aguarda conclusão)
   */
  async syncBulkAssets(
    tickers: string[],
    startYear: number,
    endYear: number,
  ): Promise<{ successCount: number; failedTickers: string[] }> {
    const startTime = Date.now();
    this.logger.log(`🔄 Bulk Sync iniciado: ${tickers.length} tickers (${startYear}-${endYear})`);

    // FASE 35: Emitir WebSocket event de início
    this.syncGateway.emitSyncStarted({
      tickers,
      totalAssets: tickers.length,
      startYear,
      endYear,
    });

    // 2. Processar tickers SEQUENCIALMENTE (não paralelo)
    const results = {
      successCount: 0,
      failedTickers: [] as string[],
    };

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      const current = i + 1;
      const total = tickers.length;

      this.logger.log(`📦 Processing ${ticker} (${current}/${total})...`);

      // FASE 35: Emitir progresso - processing
      this.syncGateway.emitSyncProgress({
        ticker,
        current,
        total,
        status: 'processing',
      });

      // Retry logic: 3 tentativas com backoff exponencial
      let attempts = 0;
      let success = false;
      const tickerStartTime = Date.now();

      while (attempts < 3 && !success) {
        attempts++;

        try {
          // Reutilizar método existente syncHistoricalDataFromCotahist
          // BUGFIX 2025-11-22: Suprimir eventos WebSocket duplicados (syncBulkAssets já emite)
          const syncResult = await this.syncHistoricalDataFromCotahist(ticker, startYear, endYear, {
            emitWebSocketEvents: false,
          });

          results.successCount++;
          success = true;

          const tickerDuration = (Date.now() - tickerStartTime) / 1000;
          this.logger.log(`✅ ${ticker} sincronizado (${current}/${total})`);

          // FASE 35: Emitir progresso - success
          this.syncGateway.emitSyncProgress({
            ticker,
            current,
            total,
            status: 'success',
            recordsInserted: syncResult.totalRecords,
            duration: Math.round(tickerDuration),
          });
        } catch (error: any) {
          this.logger.error(`❌ Tentativa ${attempts}/3 falhou para ${ticker}: ${error.message}`);

          if (attempts < 3) {
            // Backoff exponencial: 2s, 4s, 8s
            const backoffMs = Math.pow(2, attempts) * 1000;
            this.logger.log(`⏳ Aguardando ${backoffMs}ms antes de retry...`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          } else {
            // Falhou após 3 tentativas
            results.failedTickers.push(ticker);

            const tickerDuration = (Date.now() - tickerStartTime) / 1000;

            // FASE 35: Emitir progresso - failed
            this.syncGateway.emitSyncProgress({
              ticker,
              current,
              total,
              status: 'failed',
              error: error.message,
              duration: Math.round(tickerDuration),
            });
          }
        }
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    this.logger.log(
      `✅ Bulk Sync completed: ${results.successCount}/${tickers.length} successful in ${duration.toFixed(1)}s`,
    );

    if (results.failedTickers.length > 0) {
      this.logger.warn(`⚠️ Failed tickers: ${results.failedTickers.join(', ')}`);
    }

    // FASE 35: Emitir WebSocket event de conclusão
    this.syncGateway.emitSyncCompleted({
      totalAssets: tickers.length,
      successCount: results.successCount,
      failedCount: results.failedTickers.length,
      duration: Math.round(duration),
      failedTickers: results.failedTickers.length > 0 ? results.failedTickers : undefined,
    });

    return results;
  }

  /**
   * FASE 67: Get intraday price data from TimescaleDB hypertable
   *
   * Suporta timeframes: 1m, 5m, 15m, 30m, 1h, 4h
   * Usa Continuous Aggregates para timeframes maiores (1h, 4h)
   *
   * @param ticker Ticker symbol (ex: PETR4)
   * @param timeframe Candle timeframe (1m, 5m, 15m, 30m, 1h, 4h)
   * @param range Period range (1h, 4h, 1d, 5d, 1w, 2w, 1mo)
   * @param startTime Optional start time (ISO 8601)
   * @param endTime Optional end time (ISO 8601)
   * @returns Array of intraday candles with metadata
   */
  async getIntradayData(
    ticker: string,
    timeframe: IntradayTimeframeParam = IntradayTimeframeParam.M15,
    range: IntradayRangeParam = IntradayRangeParam.D1,
    startTime?: string,
    endTime?: string,
  ): Promise<{
    ticker: string;
    timeframe: string;
    count: number;
    data: IntradayCandleDto[];
    metadata: {
      source: string;
      startTime: string;
      endTime: string;
      cached: boolean;
    };
  }> {
    const startProcessing = Date.now();

    try {
      // 1. Find asset
      const asset = await this.assetRepository.findOne({ where: { ticker } });
      if (!asset) {
        throw new InternalServerErrorException(`Asset ${ticker} not found`);
      }

      // 2. Calculate time range
      const { start, end } = this.calculateIntradayRange(range, startTime, endTime);

      // 3. Map timeframe param to enum
      const timeframeEnum = this.mapTimeframeParamToEnum(timeframe);

      // 4. Determine source (hypertable or continuous aggregate)
      let source: string;
      let query: string;

      if (timeframe === IntradayTimeframeParam.H1) {
        // Use continuous aggregate intraday_1h
        source = 'continuous_aggregate:intraday_1h';
        query = `
          SELECT
            bucket as timestamp,
            open,
            high,
            low,
            close,
            volume,
            volume_financial,
            number_of_trades
          FROM intraday_1h
          WHERE asset_id = $1
            AND bucket >= $2
            AND bucket <= $3
          ORDER BY bucket ASC
        `;
      } else if (timeframe === IntradayTimeframeParam.H4) {
        // Use continuous aggregate intraday_4h
        source = 'continuous_aggregate:intraday_4h';
        query = `
          SELECT
            bucket as timestamp,
            open,
            high,
            low,
            close,
            volume,
            volume_financial,
            number_of_trades
          FROM intraday_4h
          WHERE asset_id = $1
            AND bucket >= $2
            AND bucket <= $3
          ORDER BY bucket ASC
        `;
      } else {
        // Use hypertable directly for smaller timeframes
        source = 'hypertable:intraday_prices';
        query = `
          SELECT
            timestamp,
            open,
            high,
            low,
            close,
            volume,
            volume_financial,
            number_of_trades,
            vwap
          FROM intraday_prices
          WHERE asset_id = $1
            AND timestamp >= $2
            AND timestamp <= $3
            AND timeframe = $4
          ORDER BY timestamp ASC
        `;
      }

      // 5. Execute query
      let results: any[];
      if (timeframe === IntradayTimeframeParam.H1 || timeframe === IntradayTimeframeParam.H4) {
        results = await this.intradayPriceRepository.query(query, [asset.id, start, end]);
      } else {
        results = await this.intradayPriceRepository.query(query, [asset.id, start, end, timeframe]);
      }

      // 6. Transform to DTO
      const data: IntradayCandleDto[] = results.map((row) => ({
        timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close),
        volume: parseInt(row.volume),
        volumeFinancial: row.volume_financial ? parseFloat(row.volume_financial) : undefined,
        numberOfTrades: row.number_of_trades || undefined,
        vwap: row.vwap ? parseFloat(row.vwap) : undefined,
      }));

      const duration = Date.now() - startProcessing;
      this.logger.log(
        `📊 Intraday data: ${ticker} ${timeframe} (${data.length} candles, ${duration}ms)`,
      );

      return {
        ticker,
        timeframe,
        count: data.length,
        data,
        metadata: {
          source,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          cached: false,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch intraday data for ${ticker}: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch intraday data');
    }
  }

  /**
   * Calculate time range for intraday queries
   */
  private calculateIntradayRange(
    range: IntradayRangeParam,
    startTime?: string,
    endTime?: string,
  ): { start: Date; end: Date } {
    // If explicit times provided, use them
    if (startTime && endTime) {
      return {
        start: new Date(startTime),
        end: new Date(endTime),
      };
    }

    const end = endTime ? new Date(endTime) : new Date();
    const start = startTime ? new Date(startTime) : new Date(end);

    if (!startTime) {
      switch (range) {
        case IntradayRangeParam.H1:
          start.setHours(end.getHours() - 1);
          break;
        case IntradayRangeParam.H4:
          start.setHours(end.getHours() - 4);
          break;
        case IntradayRangeParam.D1:
          start.setDate(end.getDate() - 1);
          break;
        case IntradayRangeParam.D5:
          start.setDate(end.getDate() - 5);
          break;
        case IntradayRangeParam.W1:
          start.setDate(end.getDate() - 7);
          break;
        case IntradayRangeParam.W2:
          start.setDate(end.getDate() - 14);
          break;
        case IntradayRangeParam.M1:
          start.setMonth(end.getMonth() - 1);
          break;
        default:
          start.setDate(end.getDate() - 1);
      }
    }

    return { start, end };
  }

  /**
   * Map timeframe param to database enum
   */
  private mapTimeframeParamToEnum(param: IntradayTimeframeParam): IntradayTimeframe {
    const mapping: Record<IntradayTimeframeParam, IntradayTimeframe> = {
      [IntradayTimeframeParam.M1]: IntradayTimeframe.M1,
      [IntradayTimeframeParam.M5]: IntradayTimeframe.M5,
      [IntradayTimeframeParam.M15]: IntradayTimeframe.M15,
      [IntradayTimeframeParam.M30]: IntradayTimeframe.M30,
      [IntradayTimeframeParam.H1]: IntradayTimeframe.H1,
      [IntradayTimeframeParam.H4]: IntradayTimeframe.H4,
    };
    return mapping[param];
  }

  // ============================================================================
  // FASE 69: Intraday Sync Methods
  // ============================================================================

  /**
   * FASE 69: Sync intraday data from BRAPI to TimescaleDB hypertable
   *
   * Fetches high-frequency price data from BRAPI API and stores in intraday_prices.
   * Uses the existing BrapiScraper which already supports interval parameter.
   *
   * @param ticker Ticker symbol (e.g., PETR4)
   * @param timeframe Candle timeframe (1m, 5m, 15m, 30m, 1h, 4h)
   * @param range Period range (1d, 5d, 1mo, 3mo)
   * @returns Sync result with records count and period
   */
  async syncIntradayData(
    ticker: string,
    timeframe: SyncIntradayTimeframe = SyncIntradayTimeframe.H1,
    range: SyncIntradayRange = SyncIntradayRange.D5,
  ): Promise<SyncIntradayResponseDto> {
    const startTime = Date.now();
    this.logger.log(`🔄 Sync Intraday: ${ticker} ${timeframe} (range: ${range})`);

    try {
      // 1. Find or create asset
      let asset = await this.assetRepository.findOne({ where: { ticker } });
      if (!asset) {
        this.logger.log(`Creating new asset: ${ticker}`);
        asset = this.assetRepository.create({ ticker });
        await this.assetRepository.save(asset);
      }

      // 2. Fetch intraday data from BRAPI
      this.logger.debug(`Fetching BRAPI intraday data: ${ticker} ${timeframe} ${range}`);
      const brapiData = await this.brapiScraper.getHistoricalPrices(ticker, range, timeframe);

      if (!brapiData || brapiData.length === 0) {
        this.logger.warn(`No intraday data returned from BRAPI for ${ticker}`);
        return {
          ticker,
          timeframe,
          recordsSynced: 0,
          processingTime: (Date.now() - startTime) / 1000,
          period: { start: '', end: '' },
          source: 'brapi',
        };
      }

      this.logger.log(`✅ BRAPI returned ${brapiData.length} intraday records for ${ticker}`);

      // 3. Transform BRAPI data to IntradayPrice entities
      const dbTimeframe = this.mapSyncTimeframeToDbEnum(timeframe);
      const entities = brapiData.map((d: any) => {
        // BRAPI returns date as Unix timestamp (seconds)
        const timestamp = new Date(d.date * 1000);

        return this.intradayPriceRepository.create({
          assetId: asset.id,
          timestamp,
          timeframe: dbTimeframe,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
          volumeFinancial: null, // BRAPI doesn't provide this
          numberOfTrades: null, // BRAPI doesn't provide this
          vwap: null, // BRAPI doesn't provide this
          source: IntradaySource.BRAPI,
          collectedAt: new Date(),
        });
      });

      // 4. Batch UPSERT to hypertable
      await this.batchUpsertIntradayPrices(entities);

      // 5. Calculate period
      const sortedEntities = entities.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      const periodStart = sortedEntities[0]?.timestamp.toISOString() || '';
      const periodEnd = sortedEntities[sortedEntities.length - 1]?.timestamp.toISOString() || '';

      const processingTime = (Date.now() - startTime) / 1000;
      this.logger.log(
        `✅ Sync Intraday complete: ${ticker} ${timeframe} (${entities.length} records, ${processingTime.toFixed(2)}s)`,
      );

      return {
        ticker,
        timeframe,
        recordsSynced: entities.length,
        processingTime,
        period: { start: periodStart, end: periodEnd },
        source: 'brapi',
      };
    } catch (error: any) {
      this.logger.error(`Failed to sync intraday for ${ticker}: ${error.message}`);
      throw new InternalServerErrorException(`Failed to sync intraday data: ${error.message}`);
    }
  }

  /**
   * FASE 69: Bulk sync intraday data for multiple tickers
   *
   * Processes tickers sequentially to avoid BRAPI rate limits.
   * Emits WebSocket events for progress tracking.
   *
   * @param tickers List of tickers to sync
   * @param timeframe Candle timeframe
   * @param range Period range
   * @returns Summary of sync operation
   */
  async syncIntradayBulk(
    tickers: string[],
    timeframe: SyncIntradayTimeframe = SyncIntradayTimeframe.H1,
    range: SyncIntradayRange = SyncIntradayRange.D5,
  ): Promise<{ successCount: number; failedTickers: string[]; totalRecords: number }> {
    const startTime = Date.now();
    this.logger.log(`🔄 Bulk Intraday Sync: ${tickers.length} tickers (${timeframe}, ${range})`);

    // Emit WebSocket event - sync started
    this.syncGateway.emitSyncStarted({
      tickers,
      totalAssets: tickers.length,
      startYear: 0, // Not applicable for intraday
      endYear: 0,
    });

    const results = {
      successCount: 0,
      failedTickers: [] as string[],
      totalRecords: 0,
    };

    for (let i = 0; i < tickers.length; i++) {
      const ticker = tickers[i];
      const current = i + 1;
      const total = tickers.length;

      this.logger.log(`📦 Processing intraday ${ticker} (${current}/${total})...`);

      // Emit progress - processing
      this.syncGateway.emitSyncProgress({
        ticker,
        current,
        total,
        status: 'processing',
      });

      try {
        const result = await this.syncIntradayData(ticker, timeframe, range);
        results.successCount++;
        results.totalRecords += result.recordsSynced;

        // Emit progress - success
        this.syncGateway.emitSyncProgress({
          ticker,
          current,
          total,
          status: 'success',
          recordsInserted: result.recordsSynced,
          duration: Math.round(result.processingTime),
        });
      } catch (error: any) {
        this.logger.error(`Failed to sync intraday for ${ticker}: ${error.message}`);
        results.failedTickers.push(ticker);

        // Emit progress - failed
        this.syncGateway.emitSyncProgress({
          ticker,
          current,
          total,
          status: 'failed',
          error: error.message,
        });
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    this.logger.log(
      `✅ Bulk Intraday Sync completed: ${results.successCount}/${tickers.length} successful (${results.totalRecords} records, ${duration.toFixed(1)}s)`,
    );

    // Emit WebSocket event - sync completed
    this.syncGateway.emitSyncCompleted({
      totalAssets: tickers.length,
      successCount: results.successCount,
      failedCount: results.failedTickers.length,
      duration: Math.round(duration),
      failedTickers: results.failedTickers.length > 0 ? results.failedTickers : undefined,
    });

    return results;
  }

  /**
   * Map SyncIntradayTimeframe to database IntradayTimeframe enum
   */
  private mapSyncTimeframeToDbEnum(timeframe: SyncIntradayTimeframe): IntradayTimeframe {
    const mapping: Record<SyncIntradayTimeframe, IntradayTimeframe> = {
      [SyncIntradayTimeframe.M1]: IntradayTimeframe.M1,
      [SyncIntradayTimeframe.M5]: IntradayTimeframe.M5,
      [SyncIntradayTimeframe.M15]: IntradayTimeframe.M15,
      [SyncIntradayTimeframe.M30]: IntradayTimeframe.M30,
      [SyncIntradayTimeframe.H1]: IntradayTimeframe.H1,
      [SyncIntradayTimeframe.H4]: IntradayTimeframe.H4,
    };
    return mapping[timeframe];
  }

  /**
   * Batch UPSERT intraday prices to TimescaleDB hypertable
   *
   * Uses INSERT ... ON CONFLICT for efficient upsert.
   * Processes in batches of 1000 to avoid memory issues.
   */
  private async batchUpsertIntradayPrices(entities: IntradayPrice[]): Promise<void> {
    if (entities.length === 0) {
      this.logger.warn('No intraday data to upsert');
      return;
    }

    const BATCH_SIZE = 1000;

    try {
      for (let i = 0; i < entities.length; i += BATCH_SIZE) {
        const batch = entities.slice(i, i + BATCH_SIZE);

        // Use raw query for better control over ON CONFLICT
        await this.intradayPriceRepository
          .createQueryBuilder()
          .insert()
          .into(IntradayPrice)
          .values(batch)
          .orUpdate(
            ['open', 'high', 'low', 'close', 'volume', 'volume_financial', 'number_of_trades', 'vwap', 'source', 'collected_at'],
            ['asset_id', 'timestamp', 'timeframe'], // Composite PK
          )
          .execute();

        const progress = ((i + batch.length) / entities.length) * 100;
        this.logger.debug(
          `📦 Intraday UPSERT progress: ${i + batch.length}/${entities.length} (${progress.toFixed(1)}%)`,
        );
      }

      this.logger.log(`✅ Intraday batch UPSERT complete: ${entities.length} records`);
    } catch (error: any) {
      this.logger.error(`Intraday batch UPSERT failed: ${error.message}`);
      throw error;
    }
  }
}
