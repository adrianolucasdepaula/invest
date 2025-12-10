import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScraperMetric, FundamentalData, DiscrepancyResolution, Asset } from '@database/entities';
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
import { ScrapersController } from './scrapers.controller';
import { RateLimiterService } from './rate-limiter.service'; // ✅ FASE 3

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScraperMetric,
      FundamentalData,
      DiscrepancyResolution, // FASE 90
      Asset, // FASE 90 (necessário para resolução)
    ]),
    HttpModule.register({
      timeout: 120000, // 2 minutos para fallback Python (múltiplos scrapers)
      maxRedirects: 3,
    }),
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
    RateLimiterService, // ✅ FASE 3
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
    RateLimiterService, // ✅ FASE 3
  ],
})
export class ScrapersModule {}
