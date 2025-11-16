import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MarketDataService } from './market-data.service';
import { GetPricesDto, GetTechnicalDataDto, TechnicalDataResponseDto } from './dto';

@ApiTags('market-data')
@Controller('market-data')
export class MarketDataController {
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
}
