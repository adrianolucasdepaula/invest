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
    summary: 'Get historical price data for a ticker',
    description: 'Fetches OHLCV price data from database. Supports timeframe or days parameter.',
  })
  @ApiParam({ name: 'ticker', example: 'VALE3', description: 'Ticker symbol' })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['1D', '1MO', '3MO', '6MO', '1Y', '2Y', '5Y', 'MAX'] })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 30 })
  @ApiResponse({ status: 200, description: 'Price data retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPrices(
    @Param('ticker') ticker: string,
    @Query() query: GetPricesDto,
  ) {
    const timeframe = query.timeframe || '1MO';
    return this.marketDataService.getPrices(ticker, timeframe);
  }

  @Post(':ticker/technical')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get technical analysis data (prices + indicators) with caching',
    description: 'Fetches price data and calculates technical indicators via Python Service. Results are cached for 5 minutes. Returns partial data if Python Service is unavailable or insufficient data points (<200).',
  })
  @ApiParam({ name: 'ticker', example: 'VALE3', description: 'Ticker symbol' })
  @ApiQuery({ name: 'timeframe', required: false, enum: ['1D', '1MO', '3MO', '6MO', '1Y', '2Y', '5Y', 'MAX'], example: '1MO' })
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
    const timeframe = query.timeframe || '1MO';
    return this.marketDataService.getTechnicalData(ticker, timeframe);
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
}
