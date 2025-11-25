import { Controller, Get, Post, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HistoricalPricesQueryDto } from './dto/historical-prices-query.dto';
import { SyncOptionsLiquidityResponseDto } from './dto/sync-options-liquidity.dto';
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

  @Get(':ticker')
  @ApiOperation({ summary: 'Get asset by ticker' })
  async getAsset(@Param('ticker') ticker: string) {
    return this.assetsService.findByTicker(ticker);
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
      'Queues a background job to sync all assets. Returns immediately with job ID. Use GET /assets/sync-status/:jobId to check progress. Supports range parameter: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max. Default: 3mo',
  })
  async syncAllAssets(@Query('range') range?: string) {
    console.log('[sync-all] Queueing bulk sync, range:', range || '3mo');

    // Get all assets tickers
    const assets = await this.assetsService.findAll();
    const tickers = assets.map((asset: any) => asset.ticker);

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
      message: `Sync job queued for ${tickers.length} assets. Use GET /assets/sync-status/${jobId} to check progress.`,
      statusUrl: `/api/v1/assets/sync-status/${jobId}`,
    };
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
}
