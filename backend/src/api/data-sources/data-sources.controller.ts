import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataSourcesService } from './data-sources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TriggerScrapeDto } from './dto/trigger-scrape.dto';

@ApiTags('data-sources')
@Controller('data-sources')
export class DataSourcesController {
  constructor(private readonly dataSourcesService: DataSourcesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all data sources' })
  async getAllDataSources() {
    return this.dataSourcesService.findAll();
  }

  @Get('status')
  @ApiOperation({ summary: 'Get data sources status' })
  async getDataSourcesStatus() {
    return this.dataSourcesService.getStatus();
  }

  @Post('scrape')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger manual scraping for an asset' })
  async triggerScrape(@Body() dto: TriggerScrapeDto) {
    return this.dataSourcesService.triggerScrape(dto.ticker, dto.type);
  }
}
