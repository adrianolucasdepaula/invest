import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PriceData } from './technical-indicators.service';
import { TechnicalIndicators } from '../../api/market-data/interfaces';

/**
 * Python Service Client
 * Descrição: Cliente HTTP para comunicação com Python Technical Analysis Service
 * Performance: 10-50x mais rápido que cálculos em TypeScript
 */
@Injectable()
export class PythonClientService {
  private readonly logger = new Logger(PythonClientService.name);
  private readonly httpClient: AxiosInstance;
  private readonly pythonServiceUrl: string;
  private readonly timeout: number = 30000; // 30s timeout

  constructor(private configService: ConfigService) {
    this.pythonServiceUrl =
      this.configService.get<string>('PYTHON_SERVICE_URL') || 'http://python-service:8001';

    this.httpClient = axios.create({
      baseURL: this.pythonServiceUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`Python Service URL: ${this.pythonServiceUrl}`);
  }

  /**
   * Calculate technical indicators using Python Service
   *
   * @param ticker Asset ticker symbol
   * @param prices Array of OHLCV price data
   * @returns TechnicalIndicators calculated by Python pandas_ta
   */
  async calculateIndicators(ticker: string, prices: PriceData[]): Promise<TechnicalIndicators> {
    const startTime = Date.now();

    try {
      this.logger.log(
        `Requesting indicators from Python Service for ${ticker} (${prices.length} data points)`,
      );

      // Transform PriceData to Python-compatible format
      const requestPayload = {
        ticker,
        prices: prices.map((p) => ({
          date: p.date instanceof Date ? p.date.toISOString().split('T')[0] : p.date,
          open: Number(p.open),
          high: Number(p.high),
          low: Number(p.low),
          close: Number(p.close),
          volume: Number(p.volume),
        })),
      };

      // Call Python Service
      const response = await this.httpClient.post('/indicators', requestPayload);

      const endTime = Date.now();
      const durationMs = endTime - startTime;

      this.logger.log(
        `✅ Indicators calculated successfully for ${ticker} in ${durationMs}ms (Python Service)`,
      );

      // Transform Python response to TechnicalIndicators
      const pythonIndicators = response.data.indicators;

      return {
        // Trend Indicators
        sma_20: pythonIndicators.sma_20,
        sma_50: pythonIndicators.sma_50,
        sma_200: pythonIndicators.sma_200,
        ema_9: pythonIndicators.ema_9,
        ema_21: pythonIndicators.ema_21,

        // Momentum Indicators
        rsi: pythonIndicators.rsi,
        macd: {
          macd: pythonIndicators.macd.macd,
          signal: pythonIndicators.macd.signal,
          histogram: pythonIndicators.macd.histogram,
        },
        stochastic: {
          k: pythonIndicators.stochastic.k,
          d: pythonIndicators.stochastic.d,
        },

        // Volatility Indicators
        bollinger_bands: {
          upper: pythonIndicators.bollinger_bands.upper,
          middle: pythonIndicators.bollinger_bands.middle,
          lower: pythonIndicators.bollinger_bands.lower,
          bandwidth: pythonIndicators.bollinger_bands.bandwidth,
        },
        atr: pythonIndicators.atr,

        // Volume Indicators
        obv: pythonIndicators.obv,
        volume_sma: pythonIndicators.volume_sma,

        // Support and Resistance
        pivot: {
          pivot: pythonIndicators.pivot.pivot,
          r1: pythonIndicators.pivot.r1,
          r2: pythonIndicators.pivot.r2,
          r3: pythonIndicators.pivot.r3,
          s1: pythonIndicators.pivot.s1,
          s2: pythonIndicators.pivot.s2,
          s3: pythonIndicators.pivot.s3,
        },

        // Trend Analysis
        trend: pythonIndicators.trend,
        trend_strength: pythonIndicators.trend_strength,
      };
    } catch (error) {
      const endTime = Date.now();
      const durationMs = endTime - startTime;

      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.detail || error.message;

        this.logger.error(
          `❌ Python Service error for ${ticker} after ${durationMs}ms: ${message}`,
        );

        throw new HttpException(
          {
            statusCode: status,
            message: `Python Service error: ${message}`,
            service: 'python-technical-analysis',
          },
          status === 400 ? HttpStatus.BAD_REQUEST : HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      this.logger.error(
        `❌ Unexpected error calling Python Service for ${ticker} after ${durationMs}ms`,
        error.stack,
      );

      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to calculate indicators',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check for Python Service
   *
   * @returns true if Python Service is healthy, false otherwise
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('/health', { timeout: 5000 });
      return response.data.status === 'healthy';
    } catch (error) {
      this.logger.warn(`Python Service health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Ping Python Service
   *
   * @returns true if Python Service is reachable, false otherwise
   */
  async ping(): Promise<boolean> {
    try {
      await this.httpClient.get('/ping', { timeout: 3000 });
      return true;
    } catch (error) {
      this.logger.warn(`Python Service ping failed: ${error.message}`);
      return false;
    }
  }
}
