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
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getSelic(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    try {
      this.logger.log(`Fetching last ${count} SELIC rates from Banco Central API...`);

      // BCB API: últimos N registros da série 11 (SELIC)
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.11/dados/ultimos/${count}`, {
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

      // BCB response format: [{ "data": "19/11/2025", "valor": "0.055131" }, ...]
      const selicDataArray = response.data;

      if (!Array.isArray(selicDataArray) || selicDataArray.length === 0) {
        throw new HttpException(
          'Invalid response format from Banco Central API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const results = selicDataArray.map((item) => ({
        value: parseFloat(item.valor),
        date: parseBCBDate(item.data), // Parse DD/MM/YYYY to Date
      }));

      this.logger.log(`SELIC fetched: ${results.length} records (latest: ${results[0].value}%)`);

      return results;
    } catch (error) {
      this.logger.error(`getSelic failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get IPCA inflation rate (Inflação - IBGE via Banco Central)
   * Série 433: IPCA mensal
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getInflation(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    try {
      this.logger.log(`Fetching last ${count} IPCA records from Banco Central API...`);

      // BCB API: últimos N registros da série 433 (IPCA)
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.433/dados/ultimos/${count}`, {
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

      // BCB response format: [{ "data": "01/10/2025", "valor": "0.09" }, ...]
      const ipcaDataArray = response.data;

      if (!Array.isArray(ipcaDataArray) || ipcaDataArray.length === 0) {
        throw new HttpException(
          'Invalid response format from Banco Central API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const results = ipcaDataArray.map((item) => ({
        value: parseFloat(item.valor),
        date: parseBCBDate(item.data), // Parse DD/MM/YYYY to Date
      }));

      this.logger.log(`IPCA fetched: ${results.length} records (latest: ${results[0].value}%)`);

      return results;
    } catch (error) {
      this.logger.error(`getInflation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get CDI rate (Certificado de Depósito Interbancário)
   * BRAPI não tem endpoint público para CDI, então calculamos baseado em SELIC
   * CDI geralmente fica ~0.10% abaixo da SELIC
   *
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getCDI(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    try {
      this.logger.log(`Calculating last ${count} CDI records based on SELIC...`);

      // Buscar SELIC e calcular CDI aproximado para cada registro
      const selicRecords = await this.getSelic(count);

      const cdiRecords = selicRecords.map((selic) => ({
        value: parseFloat((selic.value - 0.1).toFixed(4)), // CDI ~0.10% menor que SELIC
        date: selic.date,
      }));

      this.logger.log(`CDI calculated: ${cdiRecords.length} records (latest: ${cdiRecords[0].value}%)`);

      return cdiRecords;
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
