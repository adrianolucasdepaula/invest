import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
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

export interface ScraperQualityStatsDto {
  id: string;
  name: string;
  avgConsensus: number;
  totalFieldsTracked: number;
  fieldsWithDiscrepancy: number;
  assetsAnalyzed: number;
  lastUpdate: string | null;
}

export interface QualityStatsResponseDto {
  scrapers: ScraperQualityStatsDto[];
  overall: {
    avgConsensus: number;
    totalDiscrepancies: number;
    totalAssetsAnalyzed: number;
    totalFieldsTracked: number;
    scrapersActive: number;
  };
}

// FASE 5: Discrepancy Alert DTOs
export interface DivergentSourceDto {
  source: string;
  value: number;
  deviation: number; // percentage deviation from consensus
}

export interface DiscrepancyDto {
  ticker: string;
  field: string;
  fieldLabel: string;
  consensusValue: number;
  consensusPercentage: number;
  divergentSources: DivergentSourceDto[];
  severity: 'high' | 'medium' | 'low';
  lastUpdate: string;
}

export interface DiscrepanciesResponseDto {
  discrepancies: DiscrepancyDto[];
  summary: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  pagination?: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
  };
}

// FASE 70: Discrepancy Stats DTOs
export interface TopAssetDiscrepancyDto {
  ticker: string;
  assetName: string;
  count: number;
  avgDeviation: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface TopFieldDiscrepancyDto {
  field: string;
  fieldLabel: string;
  count: number;
  avgDeviation: number;
}

export interface DiscrepancyStatsResponseDto {
  topAssets: TopAssetDiscrepancyDto[];
  topFields: TopFieldDiscrepancyDto[];
  timeline: Array<{
    date: string;
    high: number;
    medium: number;
    low: number;
    total: number;
  }>;
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
  async testScraper(@Param('scraperId') scraperId: string, @Body() body?: { ticker?: string }) {
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

  @Get('quality-stats')
  @ApiOperation({ summary: 'Get quality statistics for all scrapers based on consensus data' })
  @ApiResponse({
    status: 200,
    description: 'Returns quality statistics aggregated from field_sources data',
  })
  async getQualityStats(): Promise<QualityStatsResponseDto> {
    this.logger.log('Fetching quality statistics from field_sources');

    try {
      const stats = await this.scrapersService.getQualityStats();
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get quality stats: ${error.message}`);
      throw new HttpException(
        `Failed to get quality statistics: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('discrepancies')
  @ApiOperation({ summary: 'Get list of field discrepancies across all assets' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 50, ignored if page is set)' })
  @ApiQuery({ name: 'severity', required: false, enum: ['all', 'high', 'medium', 'low'], description: 'Filter by severity' })
  @ApiQuery({ name: 'field', required: false, type: String, description: 'Filter by specific field' })
  @ApiQuery({ name: 'ticker', required: false, type: String, description: 'Filter by asset ticker' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (1-indexed)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Items per page (default 50)' })
  @ApiQuery({ name: 'orderBy', required: false, enum: ['severity', 'deviation', 'ticker', 'field', 'date'], description: 'Order by field' })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['asc', 'desc'], description: 'Order direction (default desc)' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of discrepancies ordered by severity',
  })
  async getDiscrepancies(
    @Query('limit') limit?: string,
    @Query('severity') severity?: string,
    @Query('field') field?: string,
    @Query('ticker') ticker?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderDirection') orderDirection?: string,
  ): Promise<DiscrepanciesResponseDto> {
    this.logger.log(`Fetching discrepancies: limit=${limit}, severity=${severity}, field=${field}, ticker=${ticker}, page=${page}`);

    try {
      const discrepancies = await this.scrapersService.getDiscrepancies({
        limit: limit ? parseInt(limit, 10) : undefined,
        severity: severity as 'all' | 'high' | 'medium' | 'low' | undefined,
        field,
        ticker: ticker?.toUpperCase(),
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : 50,
        orderBy: orderBy as 'severity' | 'deviation' | 'ticker' | 'field' | 'date' | undefined,
        orderDirection: orderDirection as 'asc' | 'desc' | undefined,
      });
      return discrepancies;
    } catch (error) {
      this.logger.error(`Failed to get discrepancies: ${error.message}`);
      throw new HttpException(
        `Failed to get discrepancies: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('discrepancies/stats')
  @ApiOperation({ summary: 'Get aggregated statistics for discrepancies' })
  @ApiQuery({ name: 'topLimit', required: false, type: Number, description: 'Limit for top lists (default 10)' })
  @ApiResponse({
    status: 200,
    description: 'Returns aggregated discrepancy statistics',
  })
  async getDiscrepancyStats(
    @Query('topLimit') topLimit?: string,
  ): Promise<DiscrepancyStatsResponseDto> {
    this.logger.log(`Fetching discrepancy stats: topLimit=${topLimit}`);

    try {
      const stats = await this.scrapersService.getDiscrepancyStats({
        topLimit: topLimit ? parseInt(topLimit, 10) : 10,
      });
      return stats;
    } catch (error) {
      this.logger.error(`Failed to get discrepancy stats: ${error.message}`);
      throw new HttpException(
        `Failed to get discrepancy stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
