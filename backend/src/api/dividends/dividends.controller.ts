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
import { DividendsService } from './dividends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateDividendDto,
  DividendQueryDto,
  DividendYieldQueryDto,
  DividendYieldSummaryDto,
  DividendSyncResponseDto,
} from './dto/dividend.dto';
import { Dividend } from '@database/entities/dividend.entity';

/**
 * Dividends Controller
 *
 * Gerencia endpoints de proventos (dividendos, JCP, bonificações) de ativos B3.
 * Usado na estratégia WHEEL para:
 * - Consultar histórico de dividendos
 * - Calcular dividend yield
 * - Sincronizar dados do scraper Python
 *
 * @created 2025-12-21
 * @phase FASE 101 - Wheel Turbinada
 */
@ApiTags('dividends')
@Controller('dividends')
export class DividendsController {
  private readonly logger = new Logger(DividendsController.name);

  constructor(private readonly dividendsService: DividendsService) {}

  /**
   * GET /dividends
   * Lista dividendos com filtros opcionais
   */
  @Get()
  @ApiOperation({
    summary: 'List dividends with optional filters',
    description:
      'Returns a list of dividends with optional filters by asset, ticker, date range, type, and status. Supports pagination.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of dividends',
    type: [Dividend],
  })
  async findAll(@Query() query: DividendQueryDto): Promise<Dividend[]> {
    this.logger.log(`Finding dividends with filters: ${JSON.stringify(query)}`);
    return this.dividendsService.findAll(query);
  }

  /**
   * GET /dividends/upcoming
   * Retorna próximos dividendos anunciados
   */
  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming dividends',
    description:
      'Returns dividends announced but not yet paid, within the specified number of days.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to look ahead (default: 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of upcoming dividends',
    type: [Dividend],
  })
  async getUpcoming(@Query('days') days?: number): Promise<Dividend[]> {
    this.logger.log(`Fetching upcoming dividends for next ${days || 30} days`);
    return this.dividendsService.getUpcomingDividends(days);
  }

  /**
   * GET /dividends/yield/:assetId
   * Calcula dividend yield histórico
   */
  @Get('yield/:assetId')
  @ApiOperation({
    summary: 'Calculate dividend yield for an asset',
    description:
      'Calculates historical dividend yield (DY) for a specific asset. Returns DY 12m, DY 24m, payment frequency, and next dividend estimate.',
  })
  @ApiParam({
    name: 'assetId',
    type: String,
    description: 'Asset UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Dividend yield summary',
    type: DividendYieldSummaryDto,
  })
  async calculateDividendYield(
    @Param('assetId', ParseUUIDPipe) assetId: string,
    @Query() query: DividendYieldQueryDto,
  ): Promise<DividendYieldSummaryDto> {
    this.logger.log(`Calculating DY for asset ${assetId}, months: ${query.months || 12}`);
    return this.dividendsService.calculateDividendYield(assetId, query.months);
  }

  /**
   * GET /dividends/ticker/:ticker
   * Busca dividendos por ticker
   */
  @Get('ticker/:ticker')
  @ApiOperation({
    summary: 'Get dividends by ticker',
    description: 'Returns the dividend history for a specific ticker.',
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
    description: 'List of dividends for the ticker',
    type: [Dividend],
  })
  async findByTicker(
    @Param('ticker') ticker: string,
    @Query('limit') limit?: number,
  ): Promise<Dividend[]> {
    this.logger.log(`Fetching dividends for ticker: ${ticker}`);
    return this.dividendsService.findByTicker(ticker, limit);
  }

  /**
   * GET /dividends/:id
   * Busca dividendo por ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get dividend by ID',
    description: 'Returns a specific dividend record by its UUID.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Dividend UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Dividend record',
    type: Dividend,
  })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<Dividend> {
    this.logger.log(`Fetching dividend: ${id}`);
    return this.dividendsService.findById(id);
  }

  /**
   * POST /dividends
   * Cria novo registro de dividendo (protegido)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new dividend record',
    description:
      'Creates a new dividend record. Automatically calculates net value and tax for JCP (15% IR). Requires authentication.',
  })
  @ApiResponse({
    status: 201,
    description: 'Dividend created successfully',
    type: Dividend,
  })
  async create(@Body() dto: CreateDividendDto): Promise<Dividend> {
    this.logger.log(`Creating dividend for asset ${dto.assetId}: R$ ${dto.valorBruto}`);
    return this.dividendsService.create(dto);
  }

  /**
   * POST /dividends/sync/:ticker
   * Sincroniza dividendos do scraper Python (protegido)
   */
  @Post('sync/:ticker')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Sync dividends from Python scraper',
    description:
      'Triggers dividend synchronization for a ticker from StatusInvest scraper. Imports new dividends and skips duplicates. Requires authentication.',
  })
  @ApiParam({
    name: 'ticker',
    type: String,
    description: 'Asset ticker to sync (e.g., PETR4)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync results',
    type: DividendSyncResponseDto,
  })
  async syncFromScraper(@Param('ticker') ticker: string): Promise<DividendSyncResponseDto> {
    this.logger.log(`Triggering dividend sync for: ${ticker}`);

    // TODO: Integrar com Python scraper via HTTP ou Redis queue
    // Por enquanto, retorna resposta indicando que precisa de dados do scraper
    return {
      success: false,
      ticker: ticker.toUpperCase(),
      imported: 0,
      skipped: 0,
      errors: ['Scraper integration pending - send scraperData in request body'],
      source: 'STATUSINVEST_DIVIDENDS',
      elapsedTime: 0,
    };
  }

  /**
   * POST /dividends/import/:ticker
   * Importa dividendos com dados do scraper
   */
  @Post('import/:ticker')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Import dividends from scraper data',
    description:
      'Imports dividend data received from Python scraper. Expects array of dividend objects in request body.',
  })
  @ApiParam({
    name: 'ticker',
    type: String,
    description: 'Asset ticker (e.g., PETR4)',
  })
  @ApiResponse({
    status: 200,
    description: 'Import results',
    type: DividendSyncResponseDto,
  })
  async importFromScraper(
    @Param('ticker') ticker: string,
    @Body()
    scraperData: Array<{
      tipo: string;
      valor_bruto: number;
      valor_liquido?: number;
      imposto_retido?: number;
      data_ex: string;
      data_com?: string;
      data_pagamento?: string;
      status?: string;
    }>,
  ): Promise<DividendSyncResponseDto> {
    this.logger.log(`Importing ${scraperData.length} dividends for: ${ticker}`);
    return this.dividendsService.importFromScraper(ticker, scraperData);
  }
}
