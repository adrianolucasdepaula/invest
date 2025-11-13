import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScraperMetric } from '@database/entities';
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

@Module({
  imports: [TypeOrmModule.forFeature([ScraperMetric])],
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
  ],
})
export class ScrapersModule {}
