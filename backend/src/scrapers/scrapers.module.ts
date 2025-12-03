import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperMetric, FundamentalData } from '@database/entities';
import { FundamentusScraper } from './fundamental/fundamentus.scraper';
import { BrapiScraper } from './fundamental/brapi.scraper';
import { StatusInvestScraper } from './fundamental/statusinvest.scraper';
import { Investidor10Scraper } from './fundamental/investidor10.scraper';
import { FundamenteiScraper } from './fundamental/fundamentei.scraper';
import { InvestsiteScraper } from './fundamental/investsite.scraper';
import { OpcoesScraper } from './options/opcoes.scraper';
import { ScrapersService } from './scrapers.service';
import { ScraperMetricsService } from './scraper-metrics.service';
import { ScrapersController } from './scrapers.controller';
import { RateLimiterService } from './rate-limiter.service'; // ✅ FASE 3

@Module({
  imports: [TypeOrmModule.forFeature([ScraperMetric, FundamentalData])], // ✅ FASE 4: Added FundamentalData
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
    RateLimiterService, // ✅ FASE 3
  ],
})
export class ScrapersModule {}
