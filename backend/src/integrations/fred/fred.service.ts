import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError } from 'rxjs';

/**
 * FREDService - Integração com Federal Reserve Economic Data API
 *
 * FONTES:
 * - FRED API: https://api.stlouisfed.org/fred
 *   - PAYEMS: Non-Farm Payroll (milhares de empregos)
 *   - DCOILBRENTEU: Brent Oil (USD/barril)
 *   - DFF: Federal Funds Rate (%)
 *   - CPIAUCSL: Consumer Price Index USA (%)
 *
 * REQUISITOS:
 * - API Key gratuita: https://fredaccount.stlouisfed.org/apikeys
 * - Configurar variável de ambiente: FRED_API_KEY
 *
 * @created 2025-11-22 - FASE 1.4 (FRED Integration)
 */
@Injectable()
export class FREDService {
  private readonly logger = new Logger(FREDService.name);
  private readonly fredBaseUrl = 'https://api.stlouisfed.org/fred';
  private readonly requestTimeout = 15000; // 15s timeout
  private readonly apiKey: string;

  // FRED series codes
  private readonly SERIES = {
    payroll: 'PAYEMS', // Non-Farm Payroll
    brent: 'DCOILBRENTEU', // Brent Oil
    fedFunds: 'DFF', // Fed Funds Rate
    cpiUSA: 'CPIAUCSL', // CPI USA
  };

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('FRED_API_KEY', '');
    if (!this.apiKey) {
      this.logger.warn(
        '⚠️ FRED_API_KEY not configured - FRED endpoints will not work. Get free API key at https://fredaccount.stlouisfed.org/apikeys',
      );
    }
  }

  /**
   * Get Non-Farm Payroll (USA employment data)
   * Series: PAYEMS (thousands of jobs)
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getPayroll(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    return this.fetchSeries('payroll', this.SERIES.payroll, count);
  }

  /**
   * Get Brent Oil price
   * Series: DCOILBRENTEU (USD per barrel)
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getBrentOil(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    return this.fetchSeries('brent', this.SERIES.brent, count);
  }

  /**
   * Get Federal Funds Rate
   * Series: DFF (%)
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getFedFunds(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    return this.fetchSeries('fedFunds', this.SERIES.fedFunds, count);
  }

  /**
   * Get Consumer Price Index USA
   * Series: CPIAUCSL (index)
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getCPIUSA(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    return this.fetchSeries('cpiUSA', this.SERIES.cpiUSA, count);
  }

  /**
   * Generic method to fetch FRED series
   * @param name Series name (for logging)
   * @param seriesId FRED series ID
   * @param count Number of records to fetch
   * @returns Array of { value: number, date: Date }
   */
  private async fetchSeries(
    name: string,
    seriesId: string,
    count: number,
  ): Promise<Array<{ value: number; date: Date }>> {
    try {
      if (!this.apiKey) {
        throw new HttpException(
          'FRED_API_KEY not configured. Get free API key at https://fredaccount.stlouisfed.org/apikeys',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      this.logger.log(`Fetching last ${count} ${name} records from FRED API...`);

      // Calculate date range (last N months)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - count);

      const response = await firstValueFrom(
        this.httpService
          .get(`${this.fredBaseUrl}/series/observations`, {
            params: {
              series_id: seriesId,
              api_key: this.apiKey,
              file_type: 'json',
              observation_start: startDate.toISOString().split('T')[0],
              observation_end: endDate.toISOString().split('T')[0],
              sort_order: 'desc',
              limit: count,
            },
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error) => {
              this.logger.error(`FRED API error: ${error.message}`);
              throw new HttpException(
                `Failed to fetch ${name}: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              );
            }),
          ),
      );

      // FRED response format: { observations: [{ date: "2025-10-01", value: "161234.0" }, ...] }
      const observations = response.data?.observations;

      if (!Array.isArray(observations) || observations.length === 0) {
        throw new HttpException(
          'Invalid response format from FRED API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Filter out "." values (missing data)
      const validObservations = observations.filter((obs) => obs.value !== '.');

      const results = validObservations.slice(0, count).map((obs) => ({
        value: parseFloat(obs.value),
        date: new Date(obs.date), // Format: YYYY-MM-DD
      }));

      this.logger.log(`${name} fetched: ${results.length} records (latest: ${results[0]?.value || 'N/A'})`);

      return results;
    } catch (error) {
      this.logger.error(`fetchSeries (${name}) failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Health check: Verifica se FRED API está acessível
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        this.logger.warn('FRED_API_KEY not configured - health check skipped');
        return false;
      }

      const response = await firstValueFrom(
        this.httpService
          .get(`${this.fredBaseUrl}/series/observations`, {
            params: {
              series_id: this.SERIES.brent,
              api_key: this.apiKey,
              file_type: 'json',
              limit: 1,
            },
          })
          .pipe(
            timeout(5000),
            catchError(() => {
              throw new Error('FRED API is not accessible');
            }),
          ),
      );

      return response.status === 200 && response.data && Array.isArray(response.data.observations);
    } catch (error) {
      this.logger.error(`FRED API health check failed: ${error.message}`);
      return false;
    }
  }
}
