import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HistoricalPricesQueryDto } from './dto/historical-prices-query.dto';
import { SyncOptionsLiquidityResponseDto } from './dto/sync-options-liquidity.dto';
import { AssetDataSourcesResponseDto } from './dto/asset-data-sources.dto';
import { AssetUpdateJobsService } from '../../queue/jobs/asset-update-jobs.service';
import { UpdateTrigger } from '@database/entities';
import { CacheInterceptor } from '@common/interceptors/cache.interceptor';
import { CacheKey } from '@common/decorators/cache.decorator';

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  private readonly logger = new Logger(AssetsController.name);

  constructor(
    private readonly assetsService: AssetsService,
    private readonly assetUpdateJobsService: AssetUpdateJobsService,
  ) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheKey('assets:list', 300) // 5 minutes cache
  @ApiOperation({ summary: 'Get all assets' })
  async getAllAssets(@Query('type') type?: string) {
    return this.assetsService.findAll(type);
  }

  // ============================================================================
  // STATIC ROUTES (must come BEFORE dynamic :ticker routes)
  // ============================================================================

  @Get('bulk-update-status')
  @ApiOperation({
    summary: 'Get current bulk update status',
    description:
      'Check if there is a bulk update in progress. Returns queue statistics with active jobs.',
  })
  async getBulkUpdateStatus() {
    return this.assetUpdateJobsService.getQueueStats();
  }

  @Get('sync-status/:jobId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get sync job status',
    description: 'Check the status of a queued sync job. Returns job progress and results.',
  })
  async getSyncStatus(@Param('jobId') jobId: string) {
    return this.assetUpdateJobsService.getJobStatus(jobId);
  }

  @Post('sync-options-liquidity')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync options liquidity data from opcoes.net.br' })
  async syncOptionsLiquidity(): Promise<SyncOptionsLiquidityResponseDto> {
    return this.assetsService.syncOptionsLiquidity();
  }

  @Post('sync-all')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Queue bulk sync for all assets (ASYNC)',
    description:
      'Queues a background job to sync all assets with smart prioritization: options-enabled assets first, then by last update date (never updated first, oldest to newest). Returns immediately with job ID. Use GET /assets/sync-status/:jobId to check progress.',
  })
  async syncAllAssets(@Query('range') range?: string) {
    this.logger.log(`Queueing bulk sync with smart prioritization, range: ${range || '3mo'}`);

    // Get all assets with prioritized ordering:
    // 1. Options-enabled assets first (hasOptions = true)
    // 2. Never updated assets first (lastUpdated IS NULL)
    // 3. Then oldest to newest (lastUpdated ASC)
    const assets = await this.assetsService.findAllForBulkUpdate();
    const tickers = assets.map((asset) => asset.ticker);

    const optionsCount = assets.filter((a) => a.hasOptions).length;
    const neverUpdatedCount = assets.filter((a) => !a.lastUpdated).length;
    this.logger.log(
      `Prioritization: ${optionsCount} with options, ${neverUpdatedCount} never updated, ${tickers.length} total`,
    );

    // Queue the job (returns immediately)
    const jobId = await this.assetUpdateJobsService.queueMultipleAssets(
      tickers,
      undefined, // userId (optional)
      UpdateTrigger.MANUAL,
    );

    this.logger.log(`Job queued successfully: ${jobId}`);

    return {
      jobId,
      total: tickers.length,
      optionsFirst: optionsCount,
      neverUpdated: neverUpdatedCount,
      message: `Sync job queued for ${tickers.length} assets (${optionsCount} with options first). Use GET /assets/sync-status/${jobId} to check progress.`,
      statusUrl: `/api/v1/assets/sync-status/${jobId}`,
    };
  }

  @Post('bulk-update-cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancel bulk update',
    description:
      'Cancel all pending jobs in the queue (waiting + active). Jobs in execution will complete but be removed from queue to prevent retry.',
  })
  async cancelBulkUpdate() {
    return this.assetUpdateJobsService.cancelAllPendingJobs();
  }

  @Post('bulk-update-pause')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Pause bulk update queue',
    description:
      'Pause the queue. Active jobs will complete but no new jobs will start until resumed.',
  })
  async pauseBulkUpdate() {
    await this.assetUpdateJobsService.pauseQueue();
    return { message: 'Queue paused. Active jobs will complete.' };
  }

  @Post('bulk-update-resume')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Resume bulk update queue',
    description: 'Resume the queue after pause.',
  })
  async resumeBulkUpdate() {
    await this.assetUpdateJobsService.resumeQueue();
    return { message: 'Queue resumed.' };
  }

  @Post('bulk-update-clean-stale')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clean stale jobs from queue',
    description:
      'Remove orphaned jobs that have been waiting for more than 2 hours. Useful to clear "ghost" updates from previous sessions.',
  })
  async cleanStaleJobs() {
    await this.assetUpdateJobsService.cleanStaleJobs();
    return { message: 'Stale jobs cleaned.' };
  }

  @Post(':ticker/update-fundamentals')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Queue fundamental data update for a single asset (ASYNC)',
    description:
      'Queues a background job to update fundamental data for a single asset using the same process as bulk update. Returns immediately with job ID.',
  })
  async updateAssetFundamentals(@Param('ticker') ticker: string) {
    this.logger.log(`Queueing fundamental update for: ${ticker}`);

    const jobId = await this.assetUpdateJobsService.queueSingleAsset(
      ticker,
      undefined,
      UpdateTrigger.MANUAL,
    );

    this.logger.log(`Job queued successfully for ${ticker}: ${jobId}`);

    return {
      jobId,
      ticker,
      message: `Fundamental data update job queued for ${ticker}. Use GET /assets/sync-status/${jobId} to check progress.`,
      statusUrl: `/api/v1/assets/sync-status/${jobId}`,
    };
  }

  // ============================================================================
  // DYNAMIC :ticker ROUTES (must come AFTER static routes)
  // ============================================================================

  @Get(':ticker')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('assets:ticker', 300) // 5 minutes cache
  @ApiOperation({ summary: 'Get asset by ticker' })
  async getAsset(@Param('ticker') ticker: string) {
    return this.assetsService.findByTicker(ticker);
  }

  @Get(':ticker/data-sources')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('assets:data-sources', 300) // 5 minutes cache
  @ApiOperation({
    summary: 'Get data sources information for an asset',
    description:
      'Returns detailed information about data sources used for each field, including consensus percentage, discrepancies detected, and values from each scraper source.',
  })
  @ApiResponse({
    status: 200,
    description: 'Data sources information',
    type: AssetDataSourcesResponseDto,
  })
  async getAssetDataSources(@Param('ticker') ticker: string) {
    return this.assetsService.getDataSources(ticker);
  }

  @Get(':ticker/price-history')
  @UseInterceptors(CacheInterceptor)
  @CacheKey('assets:price-history', 60) // 1 minute cache (price data changes more frequently)
  @ApiOperation({
    summary: 'Get asset price history with configurable range',
    description:
      'Fetches historical price data for a ticker. Supports BRAPI ranges (1mo, 3mo, 1y, etc.) or custom date ranges.',
  })
  async getPriceHistory(@Param('ticker') ticker: string, @Query() query: HistoricalPricesQueryDto) {
    return this.assetsService.getPriceHistory(ticker, query);
  }

  @Post(':ticker/sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync asset data from sources',
    description:
      'Fetches current price and historical data from BRAPI. Supports range parameter: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max. Default: 1y',
  })
  async syncAsset(@Param('ticker') ticker: string, @Query('range') range?: string) {
    return this.assetsService.syncAsset(ticker, range || '1y');
  }

  @Post(':ticker/populate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Populate fundamental data for asset (DEVELOPMENT/TESTING)',
    description:
      'Scrapes fundamental data from multiple sources and saves to database. Validates data quality (min 3 sources, 0.7 confidence). Returns detailed results.',
  })
  async populateFundamentalData(@Param('ticker') ticker: string) {
    return this.assetsService.populateFundamentalData(ticker);
  }
}
