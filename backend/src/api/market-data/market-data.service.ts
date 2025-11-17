import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CacheService } from '../../common/services/cache.service';
import { AssetsService } from '../assets/assets.service';
import { PriceRange } from '../assets/dto/historical-prices-query.dto';
import { PythonServiceClient } from './clients/python-service.client';
import { PriceDataPoint, TechnicalIndicators } from './interfaces';
import { TechnicalDataResponseDto } from './dto/technical-data-response.dto';
import { SyncCotahistResponseDto } from './dto/sync-cotahist.dto';
import { Asset, AssetPrice } from '../../database/entities';

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
  'MAX': PriceRange.MAX,
};

const MIN_DATA_POINTS_FOR_INDICATORS = 200;

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly assetsService: AssetsService,
    private readonly pythonServiceClient: PythonServiceClient,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(AssetPrice)
    private readonly assetPriceRepository: Repository<AssetPrice>,
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

        return prices.map(p => ({
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

        const result = await this.assetPriceRepository.query(query, [
          asset.id,
          startDate,
          endDate,
        ]);

        return result.map((row: any) => ({
          date: row.period_start instanceof Date ? row.period_start.toISOString().split('T')[0] : String(row.period_start),
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

        const result = await this.assetPriceRepository.query(query, [
          asset.id,
          startDate,
          endDate,
        ]);

        return result.map((row: any) => ({
          date: row.period_start instanceof Date ? row.period_start.toISOString().split('T')[0] : String(row.period_start),
          open: parseFloat(row.open),
          high: parseFloat(row.high),
          low: parseFloat(row.low),
          close: parseFloat(row.close),
          volume: parseInt(row.volume),
        }));
      }

      throw new InternalServerErrorException(
        `Timeframe ${timeframe} not yet implemented`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch aggregated prices for ${ticker}: ${error.message}`,
      );
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
    timeframe: string = '1MO',
  ): Promise<TechnicalDataResponseDto> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(ticker, timeframe);

    // Try cache first
    try {
      const cached = await this.cacheService.get<TechnicalDataResponseDto>(cacheKey);

      if (cached) {
        const duration = Date.now() - startTime;
        this.logger.log(`✅ Cache HIT: ${ticker}:${timeframe} (${duration}ms)`);

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
    this.logger.debug(`Cache MISS: ${ticker}:${timeframe}, fetching fresh data`);

    const prices = await this.getPrices(ticker, timeframe);

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
   * @param ticker - Código do ativo (ex: ABEV3)
   * @param startYear - Ano inicial (default: 2020)
   * @param endYear - Ano final (default: ano atual)
   * @returns Estatísticas da sincronização
   */
  async syncHistoricalDataFromCotahist(
    ticker: string,
    startYear: number = 2020,
    endYear: number = new Date().getFullYear(),
  ): Promise<SyncCotahistResponseDto> {
    const startTime = Date.now();
    this.logger.log(
      `🔄 Sync COTAHIST: ${ticker} (${startYear}-${endYear})`
    );

    try {
      // 1. Buscar ou criar asset
      let asset = await this.assetRepository.findOne({ where: { ticker } });
      if (!asset) {
        this.logger.log(`Creating new asset: ${ticker}`);
        asset = this.assetRepository.create({ ticker });
        await this.assetRepository.save(asset);
      }

      // 2. Buscar dados COTAHIST via Python Service
      this.logger.debug(`Fetching COTAHIST data for ${ticker}...`);
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

      this.logger.log(
        `✅ Sync complete: ${ticker} (${mergedData.length} records, ${processingTime.toFixed(2)}s)`
      );

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
      this.logger.error(`Failed to sync COTAHIST for ${ticker}: ${error.message}`);
      throw new InternalServerErrorException(
        `Failed to sync historical data: ${error.message}`
      );
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
  private mergeCotahistBrapi(
    cotahist: any[],
    brapi: any[],
    ticker: string,
  ): any[] {
    const cotahistMap = new Map(cotahist.map(d => [d.date, d]));
    const brapiMap = new Map(brapi.map(d => [d.date, d]));

    const merged: any[] = [];
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Adicionar todos os dados COTAHIST
    for (const [date, data] of cotahistMap.entries()) {
      merged.push({
        date,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
        adjustedClose: null, // COTAHIST não tem adjustedClose
      });
    }

    // Adicionar dados BRAPI recentes (últimos 3 meses)
    for (const [date, data] of brapiMap.entries()) {
      const dateObj = new Date(date);

      if (dateObj >= threeMonthsAgo) {
        const cotahistRecord = cotahistMap.get(date);

        // Se overlap, validar divergência
        if (cotahistRecord) {
          const divergence = Math.abs(
            (cotahistRecord.close - data.close) / cotahistRecord.close
          );

          if (divergence > 0.01) {
            this.logger.warn(
              `⚠️ Divergência ${(divergence * 100).toFixed(2)}% em ${date} (${ticker}): ` +
              `COTAHIST=${cotahistRecord.close.toFixed(2)}, BRAPI=${data.close.toFixed(2)}`
            );
          }
        }

        // Adicionar/atualizar com dados BRAPI (tem adjustedClose)
        const existingIdx = merged.findIndex(m => m.date === date);
        const record = {
          date,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: data.volume,
          adjustedClose: data.adjustedClose || data.close, // BRAPI pode não ter adjustedClose
        };

        if (existingIdx >= 0) {
          merged[existingIdx] = record; // Substituir com BRAPI
        } else {
          merged.push(record);
        }
      }
    }

    // Ordenar por data
    return merged.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Batch UPSERT no PostgreSQL usando DELETE+INSERT
   * (compatível com TimescaleDB hypertables, não requer UNIQUE constraint)
   */
  private async batchUpsertPrices(assetId: string, data: any[]): Promise<void> {
    if (data.length === 0) {
      this.logger.warn('No data to upsert');
      return;
    }

    try {
      // 1. Deletar registros existentes para este asset (para evitar duplicatas)
      const dates = data.map(d => new Date(d.date));
      if (dates.length > 0) {
        await this.assetPriceRepository.delete({
          assetId,
          date: In(dates), // TypeORM In() operator for array of dates
        });
      }

      this.logger.debug(`  Deleted existing records for asset ${assetId}`);

      // 2. Inserir novos registros em batches
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);

        // Criar entidades
        const entities = batch.map(d =>
          this.assetPriceRepository.create({
            assetId,
            date: new Date(d.date),
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume,
            adjustedClose: d.adjustedClose,
          })
        );

        // Batch INSERT
        await this.assetPriceRepository
          .createQueryBuilder()
          .insert()
          .into(AssetPrice)
          .values(entities)
          .execute();

        this.logger.debug(`  Batch ${i / batchSize + 1}: ${batch.length} records inserted`);
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
}
