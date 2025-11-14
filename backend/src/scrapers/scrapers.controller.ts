import { Controller, Get, Post, Param, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ScrapersService } from './scrapers.service';
import { ScraperMetricsService } from './scraper-metrics.service';

export interface DataSourceStatusDto {
  id: string;
  name: string;
  url: string;
  type: 'fundamental' | 'technical' | 'options' | 'prices' | 'news';
  status: 'active' | 'inactive' | 'error';
  lastTest: string | null;
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

  constructor(
    private readonly scrapersService: ScrapersService,
    private readonly scraperMetricsService: ScraperMetricsService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get status of all data sources' })
  @ApiResponse({
    status: 200,
    description: 'Returns status of all configured data sources',
  })
  async getDataSourcesStatus(): Promise<DataSourceStatusDto[]> {
    this.logger.log('Fetching data sources status with real metrics');

    // Fetch real metrics from database
    const metricsMap = await this.scraperMetricsService.getAllMetricsSummaries();

    // Static scraper configurations
    const scraperConfigs = [
      {
        id: 'fundamentus',
        name: 'Fundamentus',
        url: 'https://fundamentus.com.br',
        requiresAuth: false,
      },
      {
        id: 'brapi',
        name: 'BRAPI',
        url: 'https://brapi.dev',
        requiresAuth: true,
      },
      {
        id: 'statusinvest',
        name: 'Status Invest',
        url: 'https://statusinvest.com.br',
        requiresAuth: true,
      },
      {
        id: 'investidor10',
        name: 'Investidor10',
        url: 'https://investidor10.com.br',
        requiresAuth: true,
      },
      {
        id: 'fundamentei',
        name: 'Fundamentei',
        url: 'https://fundamentei.com',
        requiresAuth: true,
      },
      {
        id: 'investsite',
        name: 'Investsite',
        url: 'https://www.investsite.com.br',
        requiresAuth: false,
      },
    ];

    // Combine static config with real metrics
    const sources: DataSourceStatusDto[] = scraperConfigs.map((config) => {
      const metrics = metricsMap.get(config.id);

      return {
        id: config.id,
        name: config.name,
        url: config.url,
        type: 'fundamental' as const,
        status: metrics && metrics.totalRequests > 0 ? 'active' : ('inactive' as const),
        lastTest: metrics?.lastTest?.toISOString() || null,
        lastSync: metrics?.lastSync?.toISOString() || null,
        successRate: metrics?.successRate || 0,
        totalRequests: metrics?.totalRequests || 0,
        failedRequests: metrics?.failedRequests || 0,
        avgResponseTime: metrics?.avgResponseTime || 0,
        requiresAuth: config.requiresAuth,
      };
    });

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
  async testScraper(
    @Param('scraperId') scraperId: string,
    @Body() body?: { ticker?: string },
  ) {
    this.logger.log(`Testing scraper: ${scraperId}`);

    const availableScrapers = this.scrapersService.getAvailableScrapers();
    const scraper = availableScrapers.find((s) => s.source === scraperId);

    if (!scraper) {
      throw new HttpException('Scraper not found', HttpStatus.NOT_FOUND);
    }

    // Use ticker from body if provided, otherwise default to PETR4
    const testTicker = body?.ticker || 'PETR4';
    const startTime = Date.now();

    try {
      // Test ONLY this specific scraper with the specified ticker
      const result = await this.scrapersService.testSingleScraper(scraperId, testTicker);
      const responseTime = Date.now() - startTime;

      // Save metrics to database
      await this.scraperMetricsService.saveMetric(
        scraperId,
        'test',
        testTicker,
        result.success,
        responseTime,
        result.success ? null : result.error,
      );

      return {
        success: result.success,
        scraperId,
        message: result.success
          ? `Scraper ${scraperId} tested successfully`
          : `Scraper ${scraperId} test failed: ${result.error}`,
        data: result.data,
        source: result.source,
        responseTime,
        testedAt: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // Save failed test metric
      await this.scraperMetricsService.saveMetric(
        scraperId,
        'test',
        testTicker,
        false,
        responseTime,
        error.message,
      );

      this.logger.error(`Failed to test scraper ${scraperId}: ${error.message}`);
      throw new HttpException(
        `Failed to test scraper: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
