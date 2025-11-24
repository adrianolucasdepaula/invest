import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ANBIMAService } from './anbima.service';

/**
 * ANBIMAModule - Módulo de integração com Gabriel Gaspar API (Tesouro Direto)
 *
 * Fornece:
 * - ANBIMAService: Busca curva de juros Tesouro IPCA+
 *
 * @created 2025-11-22 - FASE 1.4 (ANBIMA Integration)
 */
@Module({
  imports: [HttpModule],
  providers: [ANBIMAService],
  exports: [ANBIMAService],
})
export class ANBIMAModule {}
