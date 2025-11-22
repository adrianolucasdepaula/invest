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
 *   - Série 4390: SELIC acumulada no mês (% a.m.)
 *   - Série 433: IPCA mensal (% a.m.)
 *   - Série 13522: IPCA acumulado 12 meses (% - calculado pelo BC)
 *   - Série 7478: IPCA-15 mensal (% a.m.)
 *   - Série 22886: IDP Ingressos (US$ milhões)
 *   - Série 22867: IDE Saídas (US$ milhões)
 *   - Série 22888: IDP Líquido (US$ milhões)
 *   - Série 23044: Ouro Monetário (US$ milhões)
 *
 * @created 2025-11-21 - FASE 2 (Backend Economic Indicators)
 * @updated 2025-11-21 - Migrado de BRAPI para API do Banco Central (gratuita)
 * @updated 2025-11-22 - FASE 1.2: Adicionada Série 13522 (IPCA acumulado 12m)
 * @updated 2025-11-22 - FASE 1.4: Adicionadas 5 novas séries (IPCA-15, IDP/IDE, Ouro)
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
   * Série 4390: Taxa SELIC acumulada no mês (% a.m.)
   * CORRIGIDO: Anteriormente usava Série 11 (diária), agora usa 4390 (mensal)
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getSelic(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    try {
      this.logger.log(`Fetching last ${count} SELIC monthly rates from Banco Central API...`);

      // BCB API: últimos N registros da série 4390 (SELIC acumulada no mês)
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.4390/dados/ultimos/${count}`, {
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

      // BCB response format: [{ "data": "01/10/2025", "valor": "1.28" }, ...]
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
   * Get IPCA accumulated 12 months (Inflação acumulada 12 meses - IBGE via Banco Central)
   * Série 13522: IPCA acumulado 12 meses (calculado oficialmente pelo BC usando índices encadeados)
   * NOVO: Adicionado na FASE 1.2 para corrigir cálculo de acumulado (era soma simples, incorreto)
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getIPCAAccumulated12m(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    try {
      this.logger.log(`Fetching last ${count} IPCA accumulated 12m from Banco Central API...`);

      // BCB API: últimos N registros da série 13522 (IPCA acumulado 12 meses)
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.13522/dados/ultimos/${count}`, {
            params: { formato: 'json' },
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error) => {
              this.logger.error(`Banco Central API error: ${error.message}`);
              throw new HttpException(
                `Failed to fetch IPCA accumulated 12m: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              );
            }),
          ),
      );

      // BCB response format: [{ "data": "01/10/2025", "valor": "4.68" }, ...]
      const ipcaAccumDataArray = response.data;

      if (!Array.isArray(ipcaAccumDataArray) || ipcaAccumDataArray.length === 0) {
        throw new HttpException(
          'Invalid response format from Banco Central API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const results = ipcaAccumDataArray.map((item) => ({
        value: parseFloat(item.valor),
        date: parseBCBDate(item.data), // Parse DD/MM/YYYY to Date
      }));

      this.logger.log(`IPCA accumulated 12m fetched: ${results.length} records (latest: ${results[0].value}%)`);

      return results;
    } catch (error) {
      this.logger.error(`getIPCAAccumulated12m failed: ${error.message}`, error.stack);
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
   * Get IPCA-15 inflation rate (Prévia da Inflação - IBGE via Banco Central)
   * Série 7478: IPCA-15 mensal
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getIPCA15(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    try {
      this.logger.log(`Fetching last ${count} IPCA-15 records from Banco Central API...`);

      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.7478/dados/ultimos/${count}`, {
            params: { formato: 'json' },
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error) => {
              this.logger.error(`Banco Central API error: ${error.message}`);
              throw new HttpException(
                `Failed to fetch IPCA-15 rate: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              );
            }),
          ),
      );

      const ipca15DataArray = response.data;

      if (!Array.isArray(ipca15DataArray) || ipca15DataArray.length === 0) {
        throw new HttpException(
          'Invalid response format from Banco Central API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const results = ipca15DataArray.map((item) => ({
        value: parseFloat(item.valor),
        date: parseBCBDate(item.data),
      }));

      this.logger.log(`IPCA-15 fetched: ${results.length} records (latest: ${results[0].value}%)`);

      return results;
    } catch (error) {
      this.logger.error(`getIPCA15 failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get IDP Ingressos (Investimento Direto no País - Ingressos)
   * Série 22886: IDP Ingressos (US$ milhões)
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getIDPIngressos(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    try {
      this.logger.log(`Fetching last ${count} IDP Ingressos records from Banco Central API...`);

      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.22886/dados/ultimos/${count}`, {
            params: { formato: 'json' },
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error) => {
              this.logger.error(`Banco Central API error: ${error.message}`);
              throw new HttpException(
                `Failed to fetch IDP Ingressos: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              );
            }),
          ),
      );

      const idpDataArray = response.data;

      if (!Array.isArray(idpDataArray) || idpDataArray.length === 0) {
        throw new HttpException(
          'Invalid response format from Banco Central API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const results = idpDataArray.map((item) => ({
        value: parseFloat(item.valor),
        date: parseBCBDate(item.data),
      }));

      this.logger.log(`IDP Ingressos fetched: ${results.length} records (latest: US$ ${results[0].value}M)`);

      return results;
    } catch (error) {
      this.logger.error(`getIDPIngressos failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get IDE Saídas (Investimento Direto no Exterior - Saídas)
   * Série 22867: IDE Saídas (US$ milhões)
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getIDESaidas(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    try {
      this.logger.log(`Fetching last ${count} IDE Saídas records from Banco Central API...`);

      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.22867/dados/ultimos/${count}`, {
            params: { formato: 'json' },
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error) => {
              this.logger.error(`Banco Central API error: ${error.message}`);
              throw new HttpException(
                `Failed to fetch IDE Saídas: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              );
            }),
          ),
      );

      const ideDataArray = response.data;

      if (!Array.isArray(ideDataArray) || ideDataArray.length === 0) {
        throw new HttpException(
          'Invalid response format from Banco Central API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const results = ideDataArray.map((item) => ({
        value: parseFloat(item.valor),
        date: parseBCBDate(item.data),
      }));

      this.logger.log(`IDE Saídas fetched: ${results.length} records (latest: US$ ${results[0].value}M)`);

      return results;
    } catch (error) {
      this.logger.error(`getIDESaidas failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get IDP Líquido (Investimento Direto no País - Líquido)
   * Série 22888: IDP Líquido (US$ milhões)
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getIDPLiquido(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    try {
      this.logger.log(`Fetching last ${count} IDP Líquido records from Banco Central API...`);

      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.22888/dados/ultimos/${count}`, {
            params: { formato: 'json' },
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error) => {
              this.logger.error(`Banco Central API error: ${error.message}`);
              throw new HttpException(
                `Failed to fetch IDP Líquido: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              );
            }),
          ),
      );

      const idpLiquidoDataArray = response.data;

      if (!Array.isArray(idpLiquidoDataArray) || idpLiquidoDataArray.length === 0) {
        throw new HttpException(
          'Invalid response format from Banco Central API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const results = idpLiquidoDataArray.map((item) => ({
        value: parseFloat(item.valor),
        date: parseBCBDate(item.data),
      }));

      this.logger.log(`IDP Líquido fetched: ${results.length} records (latest: US$ ${results[0].value}M)`);

      return results;
    } catch (error) {
      this.logger.error(`getIDPLiquido failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get Ouro Monetário (Reservas em Ouro)
   * Série 23044: Ouro Monetário (US$ milhões)
   * @param count Number of records to fetch (default: 1)
   * @returns Array of { value: number, date: Date }
   */
  async getOuroMonetario(count: number = 1): Promise<Array<{ value: number; date: Date }>> {
    try {
      this.logger.log(`Fetching last ${count} Ouro Monetário records from Banco Central API...`);

      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.23044/dados/ultimos/${count}`, {
            params: { formato: 'json' },
          })
          .pipe(
            timeout(this.requestTimeout),
            catchError((error) => {
              this.logger.error(`Banco Central API error: ${error.message}`);
              throw new HttpException(
                `Failed to fetch Ouro Monetário: ${error.message}`,
                HttpStatus.BAD_GATEWAY,
              );
            }),
          ),
      );

      const ouroDataArray = response.data;

      if (!Array.isArray(ouroDataArray) || ouroDataArray.length === 0) {
        throw new HttpException(
          'Invalid response format from Banco Central API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const results = ouroDataArray.map((item) => ({
        value: parseFloat(item.valor),
        date: parseBCBDate(item.data),
      }));

      this.logger.log(`Ouro Monetário fetched: ${results.length} records (latest: US$ ${results[0].value}M)`);

      return results;
    } catch (error) {
      this.logger.error(`getOuroMonetario failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Health check: Verifica se Banco Central API está acessível
   * CORRIGIDO: Usa série 4390 (SELIC mensal) ao invés de 11 (diária)
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService
          .get(`${this.bcbBaseUrl}.4390/dados/ultimos/1`, {
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
