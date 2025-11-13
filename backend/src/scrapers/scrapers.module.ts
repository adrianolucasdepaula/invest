import { Module } from '@nestjs/common';
import { FundamentusScraper } from './fundamental/fundamentus.scraper';
import { BrapiScraper } from './fundamental/brapi.scraper';
import { StatusInvestScraper } from './fundamental/statusinvest.scraper';
import { Investidor10Scraper } from './fundamental/investidor10.scraper';
import { OpcoesScraper } from './options/opcoes.scraper';
import { ScrapersService } from './scrapers.service';
import { ScrapersController } from './scrapers.controller';

@Module({
  controllers: [ScrapersController],
  providers: [
    FundamentusScraper,
    BrapiScraper,
    StatusInvestScraper,
    Investidor10Scraper,
    OpcoesScraper,
    ScrapersService,
  ],
  exports: [
    FundamentusScraper,
    BrapiScraper,
    StatusInvestScraper,
    Investidor10Scraper,
    OpcoesScraper,
    ScrapersService,
  ],
})
export class ScrapersModule {}
