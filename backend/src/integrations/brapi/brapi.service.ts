import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { parseBCBDate } from '../../common/utils/date-parser.util';

/**
 * BrapiService - Integração com APIs de Indicadores Econômicos
 *
 * FONTES:
 * - Banco Central Brasil API: https://api.bcb.gov.br/dados/serie/bcdata.sgs
 *   - Série 11: SELIC (Taxa diária)
 *   - Série 433: IPCA (Mensal)
 *
 * @created 2025-11-21 - FASE 2 (Backend Economic Indicators)
 * @updated 2025-11-21 - Migrado de BRAPI para API do Banco Central (gratuita)
 */
@Injectable()
export class BrapiService {
  private readonly logger = new Logger(BrapiService.name);
  private readonly bcbBaseUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';
  private readonly requestTimeout = 10000; // 10s timeout
  private readonly apiKey: string; // Mantido para compatibilidade futura

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('BRAPI_API_KEY', '');
    if (!this.apiKey) {
      this.logger.warn(
        '⚠️ BRAPI_API_KEY not configured - some endpoints may require authentication',
      );
    }
  }

  /**
   * Get request config with API Key as query parameter
   * @private
   */
  private getRequestConfig(): { params: Record<string, string> } {
    return this.apiKey ? { params: { token: this.apiKey } } : { params: {} };
  }

  /**
   * Get SELIC rate (Taxa básica de juros - Banco Central)
   * Série 11: Taxa SELIC diária
   * @returns { value: 0.055131, date: Date(2025-11-19) }
   */
  async getSelic(): Promise<{ value: number; date: Date }> {
    try {
      this.logger.log('Fetching SELIC rate from Banco Central API...');

      // BCB API: últimos 1 registro da série 11 (SELIC)
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.11/dados/ultimos/1`, {
            params: { formato: 'json' },
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error) => {
              this.logger.error(`Banco Central API error: ${error.message}`);
              throw new HttpException(
                `Failed to fetch SELIC rate: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              );
            }),
          ),
      );

      // BCB response format: [{ "data": "19/11/2025", "valor": "0.055131" }]
      const selicData = response.data?.[0];

      if (!selicData) {
        throw new HttpException(
          'Invalid response format from Banco Central API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const value = parseFloat(selicData.valor);
      const date = parseBCBDate(selicData.data); // Parse DD/MM/YYYY to Date

      this.logger.log(`SELIC fetched: ${value}% (ref: ${date.toISOString().split('T')[0]})`);

      return { value, date };
    } catch (error) {
      this.logger.error(`getSelic failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get IPCA inflation rate (Inflação - IBGE via Banco Central)
   * Série 433: IPCA mensal
   * @param country Parâmetro mantido para compatibilidade (não utilizado)
   * @returns { value: 0.09, date: Date(2025-10-01) }
   */
  async getInflation(country: string = 'brazil'): Promise<{ value: number; date: Date }> {
    try {
      this.logger.log(`Fetching IPCA inflation from Banco Central API...`);

      // BCB API: últimos 1 registro da série 433 (IPCA)
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.433/dados/ultimos/1`, {
            params: { formato: 'json' },
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error) => {
              this.logger.error(`Banco Central API error: ${error.message}`);
              throw new HttpException(
                `Failed to fetch inflation rate: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              );
            }),
          ),
      );

      // BCB response format: [{ "data": "01/10/2025", "valor": "0.09" }]
      const ipcaData = response.data?.[0];

      if (!ipcaData) {
        throw new HttpException(
          'Invalid response format from Banco Central API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const value = parseFloat(ipcaData.valor);
      const date = parseBCBDate(ipcaData.data); // Parse DD/MM/YYYY to Date

      this.logger.log(`IPCA fetched: ${value}% (ref: ${date.toISOString().split('T')[0]})`);

      return { value, date };
    } catch (error) {
      this.logger.error(`getInflation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get CDI rate (Certificado de Depósito Interbancário)
   * BRAPI não tem endpoint público para CDI, então retornamos mock baseado em SELIC
   * CDI geralmente fica ~0.10% abaixo da SELIC
   *
   * @returns { value: -0.0449, date: Date(2025-11-19) }
   */
  async getCDI(): Promise<{ value: number; date: Date }> {
    try {
      this.logger.log('Calculating CDI based on SELIC (BRAPI does not have CDI endpoint)');

      // Buscar SELIC e calcular CDI aproximado
      const selic = await this.getSelic();
      const cdiValue = parseFloat((selic.value - 0.1).toFixed(4)); // CDI ~0.10% menor que SELIC

      this.logger.log(`CDI calculated: ${cdiValue}% (based on SELIC ${selic.value}%)`);

      return {
        value: cdiValue,
        date: selic.date,
      };
    } catch (error) {
      this.logger.error(`getCDI failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Health check: Verifica se Banco Central API está acessível
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.11/dados/ultimos/1`, {
            params: { formato: 'json' },
          })
          .pipe(
            timeout(5000),
            catchError(() => {
              throw new Error('Banco Central API is not accessible');
            }),
          ),
      );

      return response.status === 200 && Array.isArray(response.data) && response.data.length > 0;
    } catch (error) {
      this.logger.error(`Banco Central API health check failed: ${error.message}`);
      return false;
    }
  }
}
