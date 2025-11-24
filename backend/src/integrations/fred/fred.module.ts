import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { FREDService } from './fred.service';

/**
 * FREDModule - Módulo de integração com Federal Reserve Economic Data API
 *
 * Fornece:
 * - FREDService: Busca indicadores econômicos dos EUA e commodities
 *   - Payroll (PAYEMS)
 *   - Brent Oil (DCOILBRENTEU)
 *   - Fed Funds Rate (DFF)
 *   - CPI USA (CPIAUCSL)
 *
 * @created 2025-11-22 - FASE 1.4 (FRED Integration)
 */
@Module({
  imports: [HttpModule],
  providers: [FREDService],
  exports: [FREDService],
})
export class FREDModule {}
