import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { CacheService } from '../../common/services/cache.service';
import { AssetsService } from '../assets/assets.service';
import { PriceRange } from '../assets/dto/historical-prices-query.dto';
import { PythonServiceClient } from './clients/python-service.client';
import { PriceDataPoint, TechnicalIndicators } from './interfaces';
import { TechnicalDataResponseDto } from './dto/technical-data-response.dto';

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
  ) {}

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
   * Invalidate cache for a specific ticker (all timeframes)
   * For future use (FASE 31)
   */
  async invalidateTickerCache(ticker: string): Promise<void> {
    this.logger.log(`Invalidating cache for ticker: ${ticker}`);
    // TODO: Implement SCAN-based pattern invalidation
    // For now, just log (TTL will handle expiration)
  }
}
