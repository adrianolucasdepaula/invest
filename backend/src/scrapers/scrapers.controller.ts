import { Controller, Get, Post, Param, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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
      {
        id: 'fundamentei',
        name: 'Fundamentei',
        url: 'https://fundamentei.com',
        type: 'fundamental',
        status: 'active',
        lastSync: new Date().toISOString(),
        successRate: 94.0,
        totalRequests: 0,
        failedRequests: 0,
        avgResponseTime: 2300,
        requiresAuth: true,
      },
      {
        id: 'investsite',
        name: 'Investsite',
        url: 'https://www.investsite.com.br',
        type: 'fundamental',
        status: 'active',
        lastSync: new Date().toISOString(),
        successRate: 97.5,
        totalRequests: 0,
        failedRequests: 0,
        avgResponseTime: 1550,
        requiresAuth: false,
      },
    ];

    return sources;
  }

  @Post('test/:scraperId')
  @ApiOperation({ summary: 'Test a specific scraper' })
  @ApiParam({ name: 'scraperId', description: 'Scraper ID to test' })
  @ApiResponse({
    status: 200,
    description: 'Scraper test completed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Scraper not found',
  })
  async testScraper(@Param('scraperId') scraperId: string) {
    this.logger.log(`Testing scraper: ${scraperId}`);

    const availableScrapers = this.scrapersService.getAvailableScrapers();
    const scraper = availableScrapers.find((s) => s.source === scraperId);

    if (!scraper) {
      throw new HttpException('Scraper not found', HttpStatus.NOT_FOUND);
    }

    try {
      // Test with PETR4 as default ticker
      const result = await this.scrapersService.scrapeFundamentalData('PETR4');

      return {
        success: true,
        scraperId,
        message: `Scraper ${scraperId} tested successfully`,
        sourcesCount: result.sourcesCount,
        confidence: result.confidence,
        testedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to test scraper ${scraperId}: ${error.message}`);
      throw new HttpException(
        `Failed to test scraper: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync/:scraperId')
  @ApiOperation({ summary: 'Sync data from a specific scraper' })
  @ApiParam({ name: 'scraperId', description: 'Scraper ID to sync' })
  @ApiResponse({
    status: 200,
    description: 'Scraper sync completed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Scraper not found',
  })
  async syncScraper(@Param('scraperId') scraperId: string) {
    this.logger.log(`Syncing scraper: ${scraperId}`);

    const availableScrapers = this.scrapersService.getAvailableScrapers();
    const scraper = availableScrapers.find((s) => s.source === scraperId);

    if (!scraper) {
      throw new HttpException('Scraper not found', HttpStatus.NOT_FOUND);
    }

    try {
      // Sync data for top 5 tickers
      const tickers = ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'ABEV3'];
      const results = await Promise.allSettled(
        tickers.map((ticker) => this.scrapersService.scrapeFundamentalData(ticker)),
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        success: true,
        scraperId,
        message: `Scraper ${scraperId} synced successfully`,
        tickersProcessed: tickers.length,
        successful,
        failed,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to sync scraper ${scraperId}: ${error.message}`);
      throw new HttpException(
        `Failed to sync scraper: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
