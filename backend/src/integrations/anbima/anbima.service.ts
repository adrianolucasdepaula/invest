import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';

/**
 * ANBIMAService - Integração com API Gabriel Gaspar para Tesouro Direto
 *
 * FONTES:
 * - Gabriel Gaspar API: https://tesouro.gabrielgaspar.com.br/bonds
 *   - Fornece dados de títulos Tesouro Direto (incluindo Tesouro IPCA+)
 *   - Extrai curva de juros baseada em vencimentos dos títulos
 *
 * OBSERVAÇÃO:
 * - API oficial Tesouro Direto foi descontinuada (HTTP 410)
 * - Gabriel Gaspar API é alternativa pública e confiável
 *
 * @created 2025-11-22 - FASE 1.4 (ANBIMA Integration)
 */
@Injectable()
export class ANBIMAService {
  private readonly logger = new Logger(ANBIMAService.name);
  private readonly gabrielGasparApi = 'https://tesouro.gabrielgaspar.com.br/bonds';
  private readonly requestTimeout = 15000; // 15s timeout

  constructor(private readonly httpService: HttpService) {}

  /**
   * Get yield curve from Tesouro IPCA+ bonds
   * Extracts bonds and maps them to standard curve vertices (1y, 2y, 3y, 5y, 10y, 15y, 20y, 30y)
   * @returns Array of { maturity: string, yield: number, bondName: string }
   */
  async getYieldCurve(): Promise<
    Array<{ maturity: string; yield: number; bondName: string; maturityDate: Date }>
  > {
    try {
      this.logger.log('Fetching Tesouro IPCA+ bonds from Gabriel Gaspar API...');

      const response = await firstValueFrom(
        this.httpService.get(this.gabrielGasparApi).pipe(
          timeout(this.requestTimeout),
          catchError((error) => {
            this.logger.error(`Gabriel Gaspar API error: ${error.message}`);
            throw new HttpException(
              `Failed to fetch Tesouro Direto bonds: ${error.message}`,
              HttpStatus.BAD_GATEWAY,
            );
          }),
        ),
      );

      // API response format: { bonds: [...] }
      const apiData = response.data;

      if (!apiData || !Array.isArray(apiData.bonds)) {
        throw new HttpException(
          'Invalid response format from Gabriel Gaspar API',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Filter Tesouro IPCA+ bonds (excluding "Semestrais")
      const ipcaBonds = apiData.bonds.filter((bond: any) => {
        const bondName = bond.name || '';
        return (
          bondName.toUpperCase().includes('IPCA') &&
          bondName.toUpperCase().includes('IPCA+') &&
          !bondName.includes('Semestrais')
        );
      });

      this.logger.log(`Found ${ipcaBonds.length} Tesouro IPCA+ bonds`);

      if (ipcaBonds.length === 0) {
        throw new HttpException('No Tesouro IPCA+ bonds found', HttpStatus.NOT_FOUND);
      }

      // Extract yield curve vertices
      const yieldCurve = ipcaBonds.map((bond: any) => {
        const bondName = bond.name;
        const annualYieldStr = bond.annualInvestmentRate || '';
        const maturityDateStr = bond.maturityDate || '';

        // Parse yield: "IPCA + 7,76%" -> 0.0776
        let yieldValue = 0;
        if (annualYieldStr.includes('IPCA +')) {
          const yieldPart = annualYieldStr.split('IPCA +')[1].trim();
          const yieldNumStr = yieldPart.replace('%', '').replace(',', '.');
          yieldValue = parseFloat(yieldNumStr) / 100;
        }

        // Parse maturity date: "01/01/2035" -> Date
        const [day, month, year] = maturityDateStr.split('/');
        const maturityDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        // Calculate years to maturity
        const now = new Date();
        const yearsToMaturity = (maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365);

        // Map to standard vertices
        let maturity = '';
        if (yearsToMaturity < 1.5) maturity = '1y';
        else if (yearsToMaturity < 2.5) maturity = '2y';
        else if (yearsToMaturity < 4) maturity = '3y';
        else if (yearsToMaturity < 7.5) maturity = '5y';
        else if (yearsToMaturity < 12.5) maturity = '10y';
        else if (yearsToMaturity < 17.5) maturity = '15y';
        else if (yearsToMaturity < 25) maturity = '20y';
        else maturity = '30y';

        return {
          maturity,
          yield: yieldValue,
          bondName,
          maturityDate,
        };
      });

      // Group by maturity and average yields (if multiple bonds for same vertex)
      const maturityMap = new Map<string, { yields: number[]; bondNames: string[] }>();

      yieldCurve.forEach((item) => {
        if (!maturityMap.has(item.maturity)) {
          maturityMap.set(item.maturity, { yields: [], bondNames: [] });
        }
        maturityMap.get(item.maturity)!.yields.push(item.yield);
        maturityMap.get(item.maturity)!.bondNames.push(item.bondName);
      });

      // Calculate average yield for each vertex
      const curveVertices = Array.from(maturityMap.entries()).map(([maturity, data]) => {
        const avgYield = data.yields.reduce((sum, y) => sum + y, 0) / data.yields.length;
        return {
          maturity,
          yield: Number(avgYield.toFixed(4)),
          bondName: data.bondNames.join(', '),
          maturityDate: new Date(), // Placeholder, can be refined
        };
      });

      // Sort by maturity order
      const maturityOrder = ['1y', '2y', '3y', '5y', '10y', '15y', '20y', '30y'];
      curveVertices.sort((a, b) => {
        return maturityOrder.indexOf(a.maturity) - maturityOrder.indexOf(b.maturity);
      });

      this.logger.log(
        `Yield curve extracted: ${curveVertices.length} vertices - ${curveVertices.map((v) => `${v.maturity}=${(v.yield * 100).toFixed(2)}%`).join(', ')}`,
      );

      return curveVertices;
    } catch (error) {
      this.logger.error(`getYieldCurve failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Health check: Verifica se Gabriel Gaspar API está acessível
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.gabrielGasparApi).pipe(
          timeout(5000),
          catchError(() => {
            throw new Error('Gabriel Gaspar API is not accessible');
          }),
        ),
      );

      return response.status === 200 && response.data && Array.isArray(response.data.bonds);
    } catch (error) {
      this.logger.error(`Gabriel Gaspar API health check failed: ${error.message}`);
      return false;
    }
  }
}
