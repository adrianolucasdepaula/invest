import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { AxiosResponse } from 'axios';
import { firstValueFrom, timeout, retry, timer } from 'rxjs';
import { PriceDataPoint, TechnicalIndicators } from '../interfaces';

@Injectable()
export class PythonServiceClient {
  private readonly logger = new Logger(PythonServiceClient.name);
  private readonly pythonServiceUrl: string;
  private readonly requestTimeout: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.pythonServiceUrl = this.configService.get<string>(
      'PYTHON_SERVICE_URL',
      'http://localhost:8001',
    );
    this.requestTimeout = this.configService.get<number>(
      'PYTHON_SERVICE_TIMEOUT',
      30000, // 30s
    );
  }

  /**
   * Call Python Service to calculate technical indicators
   *
   * @param ticker Ticker symbol
   * @param prices Array of price data points (min 200 required)
   * @returns Technical indicators or null if error
   */
  async calculateIndicators(
    ticker: string,
    prices: PriceDataPoint[],
  ): Promise<TechnicalIndicators | null> {
    const startTime = Date.now();

    try {
      this.logger.debug(
        `Calling Python Service for ${ticker} (${prices.length} points)`,
      );

      // Log sample prices to verify format
      if (prices.length > 0) {
        this.logger.debug(
          `Sample prices (first 3): ${JSON.stringify(prices.slice(0, 3), null, 2)}`,
        );
      }

      const response: AxiosResponse<{ indicators: TechnicalIndicators }> = await firstValueFrom(
        this.httpService
          .post<{ indicators: TechnicalIndicators }>(
            `${this.pythonServiceUrl}/indicators`,
            {
              ticker,
              prices,
            },
          )
          .pipe(
            timeout(this.requestTimeout),
            retry({
              count: 3,
              delay: (error: any, retryCount: number) => {
                this.logger.warn(
                  `Python Service retry ${retryCount}/3: ${error.message}`,
                );
                return timer(retryCount * 1000); // 1s, 2s, 3s
              },
            }),
          ),
      );

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Python Service success: ${ticker} (${duration}ms)`,
      );

      return response.data.indicators;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error.code === 'ECONNREFUSED') {
        this.logger.error(
          `❌ Python Service unavailable (${duration}ms): ${error.message}`,
        );
      } else if (error.name === 'TimeoutError') {
        this.logger.error(
          `⏱️ Python Service timeout (${duration}ms): ${error.message}`,
        );
      } else {
        this.logger.error(
          `❌ Python Service error (${duration}ms): ${error.message}`,
        );

        // Log detailed error response for debugging
        if (error.response) {
          this.logger.error(
            `Response status: ${error.response.status}`,
          );
          this.logger.error(
            `Response data: ${JSON.stringify(error.response.data, null, 2)}`,
          );
        }
      }

      // Return null instead of throwing (graceful degradation)
      return null;
    }
  }

  /**
   * Health check for Python Service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService
          .get(`${this.pythonServiceUrl}/health`)
          .pipe(timeout(5000)),
      );

      return response.status === 200;
    } catch (error: any) {
      this.logger.error(`Python Service health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generic POST request to Python Service with Redis cache
   * Used for COTAHIST and other endpoints
   *
   * Cache Strategy (Cache-Aside Pattern):
   * 1. Generate cache key from endpoint + data
   * 2. Check cache first (CACHE HIT → return immediately)
   * 3. On CACHE MISS → fetch from Python Service
   * 4. Store successful response in cache (TTL 24h)
   * 5. Return data
   *
   * Benefits:
   * - Reduces FTP bandwidth (COTAHIST ZIPs ~10-50MB)
   * - Improves performance (45s → <1s for cached data)
   * - Reduces load on Python Service
   *
   * @param endpoint - Endpoint path (ex: '/cotahist/fetch')
   * @param data - Request body
   * @param timeoutMs - Optional timeout (default: 60s for COTAHIST)
   * @returns Response data
   */
  async post<T = any>(
    endpoint: string,
    data: any,
    timeoutMs: number = 60000, // 60s default (COTAHIST pode demorar)
  ): Promise<T> {
    // 1. Generate cache key (deterministic hash of endpoint + data)
    const cacheKey = `python-service:${endpoint}:${JSON.stringify(data)}`;

    // 2. Check cache first (CACHE HIT scenario)
    try {
      const cached = await this.cacheManager.get<T>(cacheKey);
      if (cached) {
        this.logger.log(
          `🎯 CACHE HIT: ${endpoint} (instant response)`,
        );
        return cached;
      }

      this.logger.log(`❌ CACHE MISS: ${endpoint} (fetching from Python Service...)`);
    } catch (cacheError: any) {
      // Cache read failed (non-critical) - proceed with fetch
      this.logger.warn(
        `⚠️ Cache read error for ${endpoint}: ${cacheError.message} (proceeding with fetch)`,
      );
    }

    // 3. CACHE MISS: Fetch from Python Service
    const startTime = Date.now();

    try {
      this.logger.debug(`POST ${endpoint}: ${JSON.stringify(data).substring(0, 100)}...`);

      const response: AxiosResponse<T> = await firstValueFrom(
        this.httpService
          .post<T>(`${this.pythonServiceUrl}${endpoint}`, data)
          .pipe(
            timeout(timeoutMs),
            retry({
              count: 3,
              delay: (error: any, retryCount: number) => {
                this.logger.warn(
                  `Python Service retry ${retryCount}/3 (${endpoint}): ${error.message}`,
                );
                return timer(retryCount * 2000); // 2s, 4s, 6s
              },
            }),
          ),
      );

      const duration = Date.now() - startTime;

      // 4. Store in cache (TTL 24h = 86400000ms)
      try {
        await this.cacheManager.set(cacheKey, response.data, 86400000);
        this.logger.log(
          `✅ POST ${endpoint} success (${duration}ms) + CACHED (TTL 24h)`,
        );
      } catch (cacheError: any) {
        // Cache write failed (non-critical) - return data anyway
        this.logger.warn(
          `⚠️ Cache write error for ${endpoint}: ${cacheError.message} (data returned)`,
        );
        this.logger.log(`✅ POST ${endpoint} success (${duration}ms) [cache unavailable]`);
      }

      // 5. Return data
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ POST ${endpoint} failed (${duration}ms): ${error.message}`,
      );

      throw error;
    }
  }
}
