import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HistoricalPricesQueryDto } from './dto/historical-prices-query.dto';

@ApiTags('assets')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

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

  @Post('sync-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync all assets data from sources',
    description:
      'Fetches current price and historical data for ALL assets from BRAPI. Supports range parameter: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max. Default: 1y. WARNING: range=max will fetch full historical data (may take several minutes)',
  })
  async syncAllAssets(@Query('range') range?: string) {
    console.log('syncAllAssets endpoint reached, range:', range);
    return this.assetsService.syncAllAssets(range || '1y');
  }
}
