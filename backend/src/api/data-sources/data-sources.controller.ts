import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSourcesService } from './data-sources.service';

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
}
