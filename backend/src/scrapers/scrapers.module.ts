import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import {
  ScraperMetric,
  FundamentalData,
  DiscrepancyResolution,
  Asset,
  CrossValidationConfig, // FASE 93
} from '@database/entities';
import { FundamentusScraper } from './fundamental/fundamentus.scraper';
import { BrapiScraper } from './fundamental/brapi.scraper';
import { StatusInvestScraper } from './fundamental/statusinvest.scraper';
import { Investidor10Scraper } from './fundamental/investidor10.scraper';
import { FundamenteiScraper } from './fundamental/fundamentei.scraper';
import { InvestsiteScraper } from './fundamental/investsite.scraper';
import { OpcoesScraper } from './options/opcoes.scraper';
import { ScrapersService } from './scrapers.service';
import { ScraperMetricsService } from './scraper-metrics.service';
import { DiscrepancyResolutionService } from './discrepancy-resolution.service'; // FASE 90
import { CrossValidationConfigService } from './cross-validation-config.service'; // FASE 93
import { ScrapersController } from './scrapers.controller';
import { RateLimiterService } from './rate-limiter.service'; // ✅ FASE 3
import { CircuitBreakerService } from './circuit-breaker.service'; // ✅ FASE 117
import { WebSocketModule } from '../websocket/websocket.module'; // FASE 93.4
import { ScraperConfigModule } from '../api/scraper-config/scraper-config.module'; // FASE: Dynamic Scraper Configuration

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScraperMetric,
      FundamentalData,
      DiscrepancyResolution, // FASE 90
      Asset, // FASE 90 (necessário para resolução)
      CrossValidationConfig, // FASE 93
    ]),
    HttpModule.register({
      timeout: 120000, // 2 minutos para fallback Python (múltiplos scrapers)
      maxRedirects: 3,
    }),
    forwardRef(() => WebSocketModule), // FASE 93.4: WebSocket for test-all progress
    ScraperConfigModule, // FASE: Dynamic Scraper Configuration - Import para usar ScraperConfigService
  ],
  controllers: [ScrapersController],
  providers: [
    FundamentusScraper,
    BrapiScraper,
    StatusInvestScraper,
    Investidor10Scraper,
    FundamenteiScraper,
    InvestsiteScraper,
    OpcoesScraper,
    ScrapersService,
    ScraperMetricsService,
    DiscrepancyResolutionService, // FASE 90
    CrossValidationConfigService, // FASE 93
    RateLimiterService, // ✅ FASE 3
    CircuitBreakerService, // ✅ FASE 117
  ],
  exports: [
    FundamentusScraper,
    BrapiScraper,
    StatusInvestScraper,
    Investidor10Scraper,
    FundamenteiScraper,
    InvestsiteScraper,
    OpcoesScraper,
    ScrapersService,
    ScraperMetricsService,
    DiscrepancyResolutionService, // FASE 90
    CrossValidationConfigService, // FASE 93
    RateLimiterService, // ✅ FASE 3
    CircuitBreakerService, // ✅ FASE 117
  ],
})
export class ScrapersModule {}
