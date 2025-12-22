import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { StockLendingService } from './stock-lending.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateStockLendingRateDto,
  StockLendingQueryDto,
  CurrentLendingRateDto,
  LendingRateStatsDto,
  LendingIncomeEstimateDto,
  StockLendingSyncResponseDto,
} from './dto/stock-lending.dto';
import { StockLendingRate } from '@database/entities/stock-lending.entity';

/**
 * Stock Lending Controller
 *
 * Gerencia endpoints de taxas de aluguel de ações (BTC - Banco de Títulos B3).
 * Usado na estratégia WHEEL para:
 * - Consultar taxas atuais e históricas
 * - Estimar renda de aluguel durante fase HOLDING_SHARES
 * - Sincronizar dados do scraper Python
 *
 * @created 2025-12-21
 * @phase FASE 101 - Wheel Turbinada
 */
@ApiTags('stock-lending')
@Controller('stock-lending')
export class StockLendingController {
  private readonly logger = new Logger(StockLendingController.name);

  constructor(private readonly stockLendingService: StockLendingService) {}

  /**
   * GET /stock-lending
   * Lista taxas de aluguel com filtros opcionais
   */
  @Get()
  @ApiOperation({
    summary: 'List stock lending rates with optional filters',
    description:
      'Returns a list of stock lending rates with optional filters by asset, ticker, date range. Supports pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of stock lending rates',
    type: [StockLendingRate],
  })
  async findAll(@Query() query: StockLendingQueryDto): Promise<StockLendingRate[]> {
    this.logger.log(`Finding lending rates with filters: ${JSON.stringify(query)}`);
    return this.stockLendingService.findAll(query);
  }

  /**
   * GET /stock-lending/current/:ticker
   * Retorna taxa atual de aluguel por ticker
   */
  @Get('current/:ticker')
  @ApiOperation({
    summary: 'Get current lending rate for a ticker',
    description:
      'Returns the most recent lending rate for a specific ticker. Includes annual and daily rates.',
  })
  @ApiParam({
    name: 'ticker',
    type: String,
    description: 'Asset ticker (e.g., PETR4, VALE3)',
  })
  @ApiResponse({
    status: 200,
    description: 'Current lending rate',
    type: CurrentLendingRateDto,
  })
  async getCurrentRate(@Param('ticker') ticker: string): Promise<CurrentLendingRateDto> {
    this.logger.log(`Fetching current lending rate for: ${ticker}`);
    return this.stockLendingService.getCurrentRate(ticker);
  }

  /**
   * GET /stock-lending/stats/:ticker
   * Retorna estatísticas de taxas de aluguel
   */
  @Get('stats/:ticker')
  @ApiOperation({
    summary: 'Get lending rate statistics for a ticker',
    description:
      'Returns historical statistics including average, min, max rates and trend analysis over the specified period.',
  })
  @ApiParam({
    name: 'ticker',
    type: String,
    description: 'Asset ticker (e.g., PETR4, VALE3)',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to analyze (default: 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lending rate statistics',
    type: LendingRateStatsDto,
  })
  async getLendingStats(
    @Param('ticker') ticker: string,
    @Query('days') days?: number,
  ): Promise<LendingRateStatsDto> {
    this.logger.log(`Fetching lending stats for ${ticker}, days: ${days || 30}`);
    return this.stockLendingService.getLendingStats(ticker, days);
  }

  /**
   * GET /stock-lending/estimate/:ticker
   * Estima renda de aluguel para quantidade de ações
   */
  @Get('estimate/:ticker')
  @ApiOperation({
    summary: 'Estimate lending income for shares held',
    description:
      'Calculates estimated daily, monthly and annual lending income based on current rate and share quantity. Used for WHEEL strategy HOLDING_SHARES phase.',
  })
  @ApiParam({
    name: 'ticker',
    type: String,
    description: 'Asset ticker (e.g., PETR4, VALE3)',
  })
  @ApiQuery({
    name: 'quantidade',
    required: true,
    type: Number,
    description: 'Number of shares held',
  })
  @ApiResponse({
    status: 200,
    description: 'Estimated lending income',
    type: LendingIncomeEstimateDto,
  })
  async estimateLendingIncome(
    @Param('ticker') ticker: string,
    @Query('quantidade') quantidade: number,
  ): Promise<LendingIncomeEstimateDto> {
    this.logger.log(`Estimating lending income for ${ticker}: ${quantidade} shares`);
    return this.stockLendingService.estimateLendingIncome(ticker, Number(quantidade));
  }

  /**
   * GET /stock-lending/ticker/:ticker
   * Busca histórico de taxas por ticker
   */
  @Get('ticker/:ticker')
  @ApiOperation({
    summary: 'Get lending rates history by ticker',
    description: 'Returns the lending rate history for a specific ticker.',
  })
  @ApiParam({
    name: 'ticker',
    type: String,
    description: 'Asset ticker (e.g., PETR4, VALE3)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of records to return (default: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of lending rates for the ticker',
    type: [StockLendingRate],
  })
  async findByTicker(
    @Param('ticker') ticker: string,
    @Query('limit') limit?: number,
  ): Promise<StockLendingRate[]> {
    this.logger.log(`Fetching lending rates for ticker: ${ticker}`);
    return this.stockLendingService.findByTicker(ticker, limit);
  }

  /**
   * GET /stock-lending/:id
   * Busca taxa de aluguel por ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get lending rate by ID',
    description: 'Returns a specific lending rate record by its UUID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Lending rate UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Lending rate record',
    type: StockLendingRate,
  })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<StockLendingRate> {
    this.logger.log(`Fetching lending rate: ${id}`);
    return this.stockLendingService.findById(id);
  }

  /**
   * POST /stock-lending
   * Cria novo registro de taxa de aluguel (protegido)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new lending rate record',
    description:
      'Creates a new stock lending rate record. Automatically calculates daily rate if not provided. Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Lending rate created successfully',
    type: StockLendingRate,
  })
  async create(@Body() dto: CreateStockLendingRateDto): Promise<StockLendingRate> {
    this.logger.log(`Creating lending rate for asset ${dto.assetId}: ${dto.taxaAluguelAno}% a.a.`);
    return this.stockLendingService.create(dto);
  }

  /**
   * POST /stock-lending/import/:ticker
   * Importa taxas de aluguel do scraper Python (protegido)
   */
  @Post('import/:ticker')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Import lending rates from scraper data',
    description:
      'Imports lending rate data received from Python scraper. Expects array of rate objects in request body. Skips duplicates based on asset + date.',
  })
  @ApiParam({
    name: 'ticker',
    type: String,
    description: 'Asset ticker (e.g., PETR4)',
  })
  @ApiResponse({
    status: 200,
    description: 'Import results',
    type: StockLendingSyncResponseDto,
  })
  async importFromScraper(
    @Param('ticker') ticker: string,
    @Body()
    scraperData: Array<{
      taxa_aluguel_ano: number;
      taxa_aluguel_dia?: number;
      quantidade_disponivel?: number;
      quantidade_alugada?: number;
      data_referencia: string;
      source_detail?: string;
    }>,
  ): Promise<StockLendingSyncResponseDto> {
    this.logger.log(`Importing ${scraperData.length} lending rates for: ${ticker}`);
    return this.stockLendingService.importFromScraper(ticker, scraperData);
  }
}
