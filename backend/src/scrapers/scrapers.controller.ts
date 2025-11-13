import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ScrapersService } from './scrapers.service';

export interface DataSourceStatusDto {
  id: string;
  name: string;
  url: string;
  type: 'fundamental' | 'technical' | 'options' | 'prices' | 'news';
  status: 'active' | 'inactive' | 'error';
  lastSync: string | null;
  successRate: number;
  totalRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requiresAuth: boolean;
  errorMessage?: string;
}

@ApiTags('Scrapers')
@Controller('scrapers')
export class ScrapersController {
  private readonly logger = new Logger(ScrapersController.name);

  constructor(private readonly scrapersService: ScrapersService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get status of all data sources' })
  @ApiResponse({
    status: 200,
    description: 'Returns status of all configured data sources',
  })
  async getDataSourcesStatus(): Promise<DataSourceStatusDto[]> {
    this.logger.log('Fetching data sources status');

    // TODO: Implement real metrics from database
    // For now, returning static info about configured scrapers

    const sources: DataSourceStatusDto[] = [
      {
        id: 'fundamentus',
        name: 'Fundamentus',
        url: 'https://fundamentus.com.br',
        type: 'fundamental',
        status: 'active',
        lastSync: new Date().toISOString(),
        successRate: 98.5,
        totalRequests: 0, // TODO: Get from metrics table
        failedRequests: 0,
        avgResponseTime: 1250,
        requiresAuth: false,
      },
      {
        id: 'brapi',
        name: 'BRAPI',
        url: 'https://brapi.dev',
        type: 'fundamental',
        status: 'active',
        lastSync: new Date().toISOString(),
        successRate: 99.2,
        totalRequests: 0,
        failedRequests: 0,
        avgResponseTime: 850,
        requiresAuth: true,
      },
      {
        id: 'statusinvest',
        name: 'Status Invest',
        url: 'https://statusinvest.com.br',
        type: 'fundamental',
        status: 'active',
        lastSync: new Date().toISOString(),
        successRate: 96.8,
        totalRequests: 0,
        failedRequests: 0,
        avgResponseTime: 2100,
        requiresAuth: true,
      },
      {
        id: 'investidor10',
        name: 'Investidor10',
        url: 'https://investidor10.com.br',
        type: 'fundamental',
        status: 'active',
        lastSync: new Date().toISOString(),
        successRate: 95.3,
        totalRequests: 0,
        failedRequests: 0,
        avgResponseTime: 1890,
        requiresAuth: true,
      },
    ];

    return sources;
  }
}
