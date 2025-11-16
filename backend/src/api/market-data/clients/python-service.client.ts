import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
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
}
