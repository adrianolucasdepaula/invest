import { Controller, Get, Post, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HistoricalPricesQueryDto } from './dto/historical-prices-query.dto';
import { SyncOptionsLiquidityResponseDto } from './dto/sync-options-liquidity.dto';
import { AssetDataSourcesResponseDto } from './dto/asset-data-sources.dto';
import { AssetUpdateJobsService } from '../../queue/jobs/asset-update-jobs.service';
import { UpdateTrigger } from '@database/entities';

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(
    private readonly assetsService: AssetsService,
    private readonly assetUpdateJobsService: AssetUpdateJobsService,
  ) {}

  @Get()
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
    description: 'Check if there is a bulk update in progress. Returns queue statistics with active jobs.',
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
    console.log('[sync-all] Queueing bulk sync with smart prioritization, range:', range || '3mo');

    // Get all assets with prioritized ordering:
    // 1. Options-enabled assets first (hasOptions = true)
    // 2. Never updated assets first (lastUpdated IS NULL)
    // 3. Then oldest to newest (lastUpdated ASC)
    const assets = await this.assetsService.findAllForBulkUpdate();
    const tickers = assets.map((asset) => asset.ticker);

    const optionsCount = assets.filter(a => a.hasOptions).length;
    const neverUpdatedCount = assets.filter(a => !a.lastUpdated).length;
    console.log(`[sync-all] Prioritization: ${optionsCount} with options, ${neverUpdatedCount} never updated, ${tickers.length} total`);

    // Queue the job (returns immediately)
    const jobId = await this.assetUpdateJobsService.queueMultipleAssets(
      tickers,
      undefined, // userId (optional)
      UpdateTrigger.MANUAL,
    );

    console.log(`[sync-all] Job queued successfully: ${jobId}`);

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
    description: 'Cancel all pending jobs in the queue. Active jobs will complete but no new jobs will start.',
  })
  async cancelBulkUpdate() {
    return this.assetUpdateJobsService.cancelAllPendingJobs();
  }

  @Post('bulk-update-pause')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Pause bulk update queue',
    description: 'Pause the queue. Active jobs will complete but no new jobs will start until resumed.',
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
    description: 'Remove orphaned jobs that have been waiting for more than 2 hours. Useful to clear "ghost" updates from previous sessions.',
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
    console.log('[update-fundamentals] Queueing fundamental update for:', ticker);

    const jobId = await this.assetUpdateJobsService.queueSingleAsset(
      ticker,
      undefined,
      UpdateTrigger.MANUAL,
    );

    console.log(`[update-fundamentals] Job queued successfully: ${jobId}`);

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
  @ApiOperation({ summary: 'Get asset by ticker' })
  async getAsset(@Param('ticker') ticker: string) {
    return this.assetsService.findByTicker(ticker);
  }

  @Get(':ticker/data-sources')
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
  @ApiOperation({
    summary: 'Populate fundamental data for asset (DEVELOPMENT/TESTING)',
    description:
      'Scrapes fundamental data from multiple sources and saves to database. Validates data quality (min 3 sources, 0.7 confidence). Returns detailed results.',
  })
  async populateFundamentalData(@Param('ticker') ticker: string) {
    return this.assetsService.populateFundamentalData(ticker);
  }
}
