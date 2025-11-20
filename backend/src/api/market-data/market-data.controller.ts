import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MarketDataService } from './market-data.service';
import { GetPricesDto, GetTechnicalDataDto, TechnicalDataResponseDto } from './dto';
import { SyncCotahistDto, SyncCotahistResponseDto } from './dto/sync-cotahist.dto';

@ApiTags('market-data')
@Controller('market-data')
export class MarketDataController {
  private readonly logger = new Logger(MarketDataController.name);

  constructor(private readonly marketDataService: MarketDataService) {}

  @Get(':ticker/prices')
  @ApiOperation({
    summary: 'Get historical price data for a ticker with candle aggregation',
    description: 'Fetches OHLCV price data from database with support for daily (1D), weekly (1W), and monthly (1M) candle aggregation. Use timeframe to set candle interval and range to set viewing period.',
  })
  @ApiParam({ name: 'ticker', example: 'VALE3', description: 'Ticker symbol' })
  @ApiQuery({
    name: 'timeframe',
    required: false,
    enum: ['1D', '1W', '1M'],
    description: 'Candle timeframe: 1D (Daily), 1W (Weekly), 1M (Monthly)',
    example: '1D'
  })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'],
    description: 'Viewing range: how much historical data to return',
    example: '1y'
  })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30, description: 'Alternative to range: specify exact number of days' })
  @ApiResponse({ status: 200, description: 'Price data retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPrices(
    @Param('ticker') ticker: string,
    @Query() query: GetPricesDto,
  ) {
    const timeframe = query.timeframe || '1D';
    const range = query.range || '1y';
    return this.marketDataService.getAggregatedPrices(ticker, timeframe, range);
  }

  @Post(':ticker/technical')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get technical analysis data (prices + indicators) with caching',
    description: 'Fetches price data and calculates technical indicators via Python Service. Results are cached for 5 minutes. Returns partial data if Python Service is unavailable or insufficient data points (<200).',
  })
  @ApiParam({ name: 'ticker', example: 'VALE3', description: 'Ticker symbol' })
  @ApiQuery({
    name: 'timeframe',
    required: false,
    enum: ['1D', '1W', '1M'],
    description: 'Candle timeframe: 1D (Daily), 1W (Weekly), 1M (Monthly)',
    example: '1D'
  })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'],
    description: 'Viewing range: how much historical data to return',
    example: '1y'
  })
  @ApiResponse({
    status: 200,
    description: 'Technical data retrieved successfully',
    type: TechnicalDataResponseDto,
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getTechnicalData(
    @Param('ticker') ticker: string,
    @Query() query: GetTechnicalDataDto,
  ): Promise<TechnicalDataResponseDto> {
    const timeframe = query.timeframe || '1D';
    const range = query.range || '1y';
    return this.marketDataService.getTechnicalData(ticker, timeframe, range);
  }

  @Post('sync-cotahist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sincronizar dados históricos COTAHIST',
    description:
      'Busca dados históricos do COTAHIST (1986-2025) via Python Service ' +
      'e sincroniza com PostgreSQL. Merge inteligente com BRAPI para adjustedClose. ' +
      'Resolve problema de dados insuficientes (67 → 1200+ pontos).',
  })
  @ApiResponse({
    status: 200,
    description: 'Sincronização concluída com sucesso',
    type: SyncCotahistResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos (ticker, anos)',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro ao sincronizar (Python Service offline, timeout, etc)',
  })
  async syncCotahist(
    @Body() dto: SyncCotahistDto,
  ): Promise<SyncCotahistResponseDto> {
    this.logger.log(
      `Sync COTAHIST request: ${dto.ticker} (${dto.startYear}-${dto.endYear})`
    );

    return this.marketDataService.syncHistoricalDataFromCotahist(
      dto.ticker,
      dto.startYear,
      dto.endYear,
    );
  }

  /**
   * FASE 34.6: Sync History Audit Trail
   */
  @Get('/sync-history')
  @ApiOperation({
    summary: 'Get sync history (audit trail)',
    description: 'Returns audit trail of all sync operations (COTAHIST, BRAPI, Bulk). Supports filtering by ticker, status, operation type, and date range. For compliance and monitoring.'
  })
  @ApiResponse({
    status: 200,
    description: 'Sync history retrieved successfully',
  })
  async getSyncHistory(
    @Query('ticker') ticker?: string,
    @Query('status') status?: string,
    @Query('operationType') operationType?: string,
    @Query('limit') limitParam?: string,
    @Query('offset') offsetParam?: string,
  ) {
    const limit = parseInt(limitParam || '50', 10);
    const offset = parseInt(offsetParam || '0', 10);

    this.logger.log(`Get sync history request: ticker=${ticker}, status=${status}, limit=${limit}`);
    return this.marketDataService.getSyncHistory({
      ticker,
      status,
      operationType,
      limit: Math.min(limit, 100), // Max 100 records per request
      offset,
    });
  }
}
