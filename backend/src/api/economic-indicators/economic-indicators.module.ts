import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Agent as HttpsAgent } from 'https';
import { EconomicIndicatorsController } from './economic-indicators.controller';
import { EconomicIndicatorsService } from './economic-indicators.service';
import { BrapiService } from '../../integrations/brapi/brapi.service';
import { EconomicIndicator } from '../../database/entities/economic-indicator.entity';

/**
 * EconomicIndicatorsModule - Módulo de Indicadores Macroeconômicos
 *
 * Gerencia indicadores econômicos brasileiros (SELIC, IPCA, CDI, PIB, etc)
 * com integração BRAPI, cache Redis e sincronização automática.
 *
 * @created 2025-11-21 - FASE 2 (Backend Economic Indicators)
 */
@Module({
  imports: [
    // HTTP client for BRAPI integration
    HttpModule.register({
      timeout: 10000, // 10s timeout
      maxRedirects: 5,
      // Fix SSL certificate verification issues on Windows (development only)
      httpsAgent: new HttpsAgent({
        rejectUnauthorized: false, // Accept self-signed certificates
      }),
    }),

    // TypeORM entities
    TypeOrmModule.forFeature([EconomicIndicator]),

    // Config for API keys (future use)
    ConfigModule,
  ],
  controllers: [EconomicIndicatorsController],
  providers: [EconomicIndicatorsService, BrapiService],
  exports: [EconomicIndicatorsService], // Export for use in jobs/scheduler
})
export class EconomicIndicatorsModule {}
