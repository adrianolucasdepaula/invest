import { Module } from '@nestjs/common';
import { FundamentusScraper } from './fundamental/fundamentus.scraper';
import { BrapiScraper } from './fundamental/brapi.scraper';
import { ScrapersService } from './scrapers.service';

@Module({
  providers: [FundamentusScraper, BrapiScraper, ScrapersService],
  exports: [FundamentusScraper, BrapiScraper, ScrapersService],
})
export class ScrapersModule {}
