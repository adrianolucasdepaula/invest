import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Logger,
  HttpException,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../api/auth/guards/jwt-auth.guard';
import { ScrapersService } from './scrapers.service';
import { ScraperMetricsService } from './scraper-metrics.service';
import {
  DiscrepancyResolutionService,
  ResolveDiscrepancyDto,
  AutoResolveOptionsDto,
  ResolutionResult,
  DiscrepancyDetailDto,
} from './discrepancy-resolution.service';
import { CrossValidationConfigService } from './cross-validation-config.service'; // FASE 93
import {
  CrossValidationConfigDto,
  UpdateCrossValidationConfigDto,
  ImpactPreviewDto,
  BatchTestResultDto,
} from './dto/cross-validation-config.dto'; // FASE 93

export interface DataSourceStatusDto {
  id: string;
  name: string;
  url: string;
  type: 'fundamental' | 'technical' | 'options' | 'prices' | 'news' | 'ai' | 'market_data' | 'crypto' | 'macro';
  status: 'active' | 'inactive' | 'error';
  lastTest: string | null;
  lastTestSuccess: boolean | null; // FASE 90: resultado do último teste
  lastSync: string | null;
  lastSyncSuccess: boolean | null; // FASE 90: resultado do último sync
  successRate: number;
  totalRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requiresAuth: boolean;
  runtime: 'typescript' | 'python';
  category: string;
  description?: string;
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
  runtime?: 'typescript' | 'python'; // FASE 93.2: Include runtime type
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
    private readonly discrepancyResolutionService: DiscrepancyResolutionService, // FASE 90
    private readonly crossValidationConfigService: CrossValidationConfigService, // FASE 93
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get status of all data sources (TypeScript + Python)' })
  @ApiResponse({
    status: 200,
    description: 'Returns status of all configured data sources including Python scrapers',
  })
  async getDataSourcesStatus(): Promise<DataSourceStatusDto[]> {
    this.logger.log('Fetching unified data sources status (TypeScript + Python)');

    // Fetch real metrics from database for TypeScript scrapers
    const metricsMap = await this.scraperMetricsService.getAllMetricsSummaries();

    // Get unified status from all scrapers (TypeScript + Python)
    const sources = await this.scrapersService.getAllScrapersStatus(metricsMap);

    this.logger.log(`Returning ${sources.length} data sources`);
    return sources;
  }

  @Post('test/:scraperId')
  @ApiOperation({ summary: 'Test a specific scraper (TypeScript or Python)' })
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

    // Use ticker from body if provided, otherwise default to PETR4
    const testTicker = body?.ticker || 'PETR4';
    const startTime = Date.now();

    // Check if this is a Python scraper or TypeScript scraper
    const isPythonScraper = this.scrapersService.isPythonScraper(scraperId);

    if (isPythonScraper) {
      // Test via Python API
      this.logger.log(`Testing Python scraper: ${scraperId}`);

      try {
        const result = await this.scrapersService.testPythonScraper(scraperId, testTicker);
        const responseTime = result.execution_time * 1000; // Convert to ms

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
            ? `Python scraper ${scraperId} tested successfully`
            : `Python scraper ${scraperId} test failed: ${result.error}`,
          data: result.data,
          source: result.scraper,
          responseTime,
          testedAt: new Date().toISOString(),
          runtime: 'python',
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;

        await this.scraperMetricsService.saveMetric(
          scraperId,
          'test',
          testTicker,
          false,
          responseTime,
          error.message,
        );

        this.logger.error(`Failed to test Python scraper ${scraperId}: ${error.message}`);
        throw new HttpException(
          `Failed to test Python scraper: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // TypeScript scraper test
    const availableScrapers = this.scrapersService.getAvailableScrapers();
    const scraper = availableScrapers.find((s) => s.source === scraperId);

    if (!scraper) {
      throw new HttpException(`Scraper ${scraperId} not found`, HttpStatus.NOT_FOUND);
    }

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
          ? `TypeScript scraper ${scraperId} tested successfully`
          : `TypeScript scraper ${scraperId} test failed: ${result.error}`,
        data: result.data,
        source: result.source,
        responseTime,
        testedAt: new Date().toISOString(),
        runtime: 'typescript',
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

      this.logger.error(`Failed to test TypeScript scraper ${scraperId}: ${error.message}`);
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

  // ========================================
  // FASE 90: Discrepancy Resolution Endpoints
  // ========================================

  @Get('discrepancies/:ticker/:field')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get detailed discrepancy info for a ticker/field' })
  @ApiParam({ name: 'ticker', description: 'Asset ticker (e.g., PETR4)' })
  @ApiParam({ name: 'field', description: 'Field name (e.g., pl, roe, dividendYield)' })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed discrepancy info with all source values and history',
  })
  @ApiResponse({ status: 404, description: 'Asset or field not found' })
  async getDiscrepancyDetail(
    @Param('ticker') ticker: string,
    @Param('field') field: string,
  ): Promise<DiscrepancyDetailDto> {
    this.logger.log(`Getting discrepancy detail: ${ticker} - ${field}`);
    return this.discrepancyResolutionService.getDiscrepancyDetail(ticker, field);
  }

  @Post('discrepancies/:ticker/:field/resolve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Manually resolve a discrepancy by selecting the correct value' })
  @ApiParam({ name: 'ticker', description: 'Asset ticker' })
  @ApiParam({ name: 'field', description: 'Field name' })
  @ApiResponse({ status: 200, description: 'Discrepancy resolved successfully' })
  @ApiResponse({ status: 404, description: 'Asset or field not found' })
  @ApiResponse({ status: 400, description: 'Invalid resolution data' })
  async resolveDiscrepancy(
    @Param('ticker') ticker: string,
    @Param('field') field: string,
    @Body()
    body: {
      selectedValue: number;
      selectedSource?: string;
      notes?: string;
    },
    @Req() req: Request,
  ): Promise<ResolutionResult> {
    this.logger.log(`Resolving discrepancy: ${ticker} - ${field} -> ${body.selectedValue}`);

    if (body.selectedValue === undefined || body.selectedValue === null) {
      throw new HttpException('selectedValue is required', HttpStatus.BAD_REQUEST);
    }

    // FASE 90.1: Validação robusta de selectedValue (NaN/Infinity)
    if (typeof body.selectedValue !== 'number' || isNaN(body.selectedValue) || !Number.isFinite(body.selectedValue)) {
      throw new HttpException('selectedValue must be a valid finite number', HttpStatus.BAD_REQUEST);
    }

    // FASE 90.2: Extrair email do usuário autenticado do JWT
    const user = req.user as { email?: string; id?: string } | undefined;
    const resolvedBy = user?.email || user?.id || 'unknown';

    return this.discrepancyResolutionService.resolveManually({
      ticker,
      fieldName: field,
      selectedValue: body.selectedValue,
      selectedSource: body.selectedSource,
      notes: body.notes,
      resolvedBy,
    });
  }

  @Post('discrepancies/auto-resolve')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Auto-resolve discrepancies using consensus or priority method',
    description: `
      Auto-resolve discrepancies in batch:
      - method: 'consensus' uses value with most sources agreeing
      - method: 'priority' uses highest priority source (Fundamentus > BRAPI > ...)
      - severity filter: 'all', 'high', 'medium', 'low'
      - dryRun: if true, returns what would be resolved without saving
    `,
  })
  @ApiResponse({ status: 200, description: 'Auto-resolution completed' })
  async autoResolveDiscrepancies(
    @Body()
    body: {
      method: 'consensus' | 'priority';
      severity?: 'all' | 'high' | 'medium' | 'low';
      tickerFilter?: string;
      fieldFilter?: string;
      dryRun?: boolean;
    },
  ): Promise<{
    resolved: number;
    skipped: number;
    errors: number;
    results: ResolutionResult[];
  }> {
    this.logger.log(
      `Auto-resolving discrepancies: method=${body.method}, severity=${body.severity}, dryRun=${body.dryRun}`,
    );

    if (!body.method || !['consensus', 'priority'].includes(body.method)) {
      throw new HttpException('method must be "consensus" or "priority"', HttpStatus.BAD_REQUEST);
    }

    return this.discrepancyResolutionService.autoResolve({
      method: body.method,
      severity: body.severity,
      tickerFilter: body.tickerFilter,
      fieldFilter: body.fieldFilter,
      dryRun: body.dryRun,
    });
  }

  @Get('discrepancies/resolution-history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get history of discrepancy resolutions' })
  @ApiQuery({ name: 'ticker', required: false, description: 'Filter by ticker' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 50)' })
  @ApiQuery({ name: 'method', required: false, enum: ['manual', 'auto_consensus', 'auto_priority'] })
  @ApiResponse({ status: 200, description: 'Returns resolution history' })
  async getResolutionHistory(
    @Query('ticker') ticker?: string,
    @Query('limit') limit?: string,
    @Query('method') method?: string,
  ) {
    return this.discrepancyResolutionService.getResolutionHistory({
      ticker,
      limit: limit ? parseInt(limit, 10) : 50,
      method: method as any,
    });
  }

  // ============================================
  // FASE 93: Cross-Validation Configuration
  // ============================================

  @Get('cross-validation-config')
  @ApiOperation({ summary: 'Get current cross-validation configuration' })
  @ApiResponse({
    status: 200,
    description: 'Returns current cross-validation configuration',
    type: CrossValidationConfigDto,
  })
  async getCrossValidationConfig(): Promise<CrossValidationConfigDto> {
    this.logger.log('[CONFIG] Fetching cross-validation configuration');
    return this.crossValidationConfigService.getConfig();
  }

  @Put('cross-validation-config')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update cross-validation configuration' })
  @ApiBody({ type: UpdateCrossValidationConfigDto })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
    type: CrossValidationConfigDto,
  })
  async updateCrossValidationConfig(
    @Body() dto: UpdateCrossValidationConfigDto,
  ): Promise<CrossValidationConfigDto> {
    this.logger.log(`[CONFIG] Updating cross-validation configuration: ${JSON.stringify(dto)}`);
    return this.crossValidationConfigService.updateConfig(dto);
  }

  @Post('cross-validation-config/preview')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Preview impact of configuration changes before applying' })
  @ApiBody({ type: UpdateCrossValidationConfigDto })
  @ApiResponse({
    status: 200,
    description: 'Returns preview of how changes would affect discrepancies',
    type: ImpactPreviewDto,
  })
  async previewConfigImpact(
    @Body() dto: UpdateCrossValidationConfigDto,
  ): Promise<ImpactPreviewDto> {
    this.logger.log('[CONFIG] Previewing configuration impact');
    return this.crossValidationConfigService.previewImpact(dto);
  }

  // ============================================
  // FASE 93.4: Test All Scrapers
  // ============================================

  @Post('test-all')
  @ApiOperation({ summary: 'Test ALL scrapers in batch with progress tracking' })
  @ApiQuery({
    name: 'concurrency',
    required: false,
    type: Number,
    description: 'Maximum parallel tests (default: 5)',
  })
  @ApiQuery({
    name: 'runtime',
    required: false,
    enum: ['all', 'typescript', 'python'],
    description: 'Filter scrapers by runtime (default: all)',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns batch test results',
    type: BatchTestResultDto,
  })
  async testAllScrapers(
    @Query('concurrency') concurrency?: string,
    @Query('runtime') runtime?: 'all' | 'typescript' | 'python',
  ): Promise<BatchTestResultDto> {
    const maxConcurrency = concurrency ? parseInt(concurrency, 10) : 5;
    const runtimeFilter = runtime || 'all';
    this.logger.log(`[TEST-ALL] Starting batch test with concurrency=${maxConcurrency}, runtime=${runtimeFilter}`);

    return this.scrapersService.testAllScrapers(maxConcurrency, runtimeFilter);
  }
}
