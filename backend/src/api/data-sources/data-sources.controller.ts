import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataSourcesService } from './data-sources.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TriggerScrapeDto } from './dto/trigger-scrape.dto';
import { UpdateDataSourceDto } from './dto/update-data-source.dto';

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

  @Get(':id')
  @ApiOperation({ summary: 'Get a data source by ID' })
  async getDataSourceById(@Param('id') id: string) {
    return this.dataSourcesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a data source' })
  async updateDataSource(
    @Param('id') id: string,
    @Body() dto: UpdateDataSourceDto,
  ) {
    return this.dataSourcesService.update(id, dto);
  }

  @Post(':id/test')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Test connection to a data source' })
  async testDataSource(@Param('id') id: string) {
    return this.dataSourcesService.testConnection(id);
  }
}
