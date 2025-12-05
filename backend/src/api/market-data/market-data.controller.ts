import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MarketDataService } from './market-data.service';
import { GetPricesDto, GetTechnicalDataDto, TechnicalDataResponseDto } from './dto';
import { SyncCotahistDto, SyncCotahistResponseDto } from './dto/sync-cotahist.dto';
import { SyncStatusResponseDto, SyncBulkDto, SyncBulkResponseDto } from './dto'; // FASE 35
import { GetIntradayDto, IntradayDataResponseDto, IntradayTimeframeParam, IntradayRangeParam } from './dto'; // FASE 67

import { TickerMergeService } from './ticker-merge.service';

@ApiTags('market-data')
@Controller('market-data')
export class MarketDataController {
  private readonly logger = new Logger(MarketDataController.name);

  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly tickerMergeService: TickerMergeService,
  ) {}

  @Get(':ticker/prices')
  @ApiOperation({
    summary: 'Get historical price data for a ticker with candle aggregation',
    description:
      'Fetches OHLCV price data from database with support for daily (1D), weekly (1W), and monthly (1M) candle aggregation. Use timeframe to set candle interval and range to set viewing period.',
  })
  @ApiParam({ name: 'ticker', example: 'VALE3', description: 'Ticker symbol' })
  @ApiQuery({
    name: 'timeframe',
    required: false,
    enum: ['1D', '1W', '1M'],
    description: 'Candle timeframe: 1D (Daily), 1W (Weekly), 1M (Monthly)',
    example: '1D',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'],
    description: 'Viewing range: how much historical data to return',
    example: '1y',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    example: 30,
    description: 'Alternative to range: specify exact number of days',
  })
  @ApiQuery({
    name: 'unified',
    required: false,
    type: Boolean,
    example: true,
    description: 'If true, merges history from previous tickers (e.g. ELET3 -> AXIA3)',
  })
  @ApiResponse({ status: 200, description: 'Price data retrieved successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPrices(
    @Param('ticker') ticker: string,
    @Query() query: GetPricesDto & { unified?: boolean },
  ) {
    const timeframe = query.timeframe || '1D';
    const range = query.range || '1y';
    const unified = query.unified === true || String(query.unified) === 'true';

    if (unified) {
      // Pass complete query object (not just range) to preserve startDate/endDate
      const historicalQuery = {
        range,
        startDate: query.startDate,
        endDate: query.endDate,
      };
      return this.tickerMergeService.getUnifiedHistory(ticker, historicalQuery as any);
    }

    return this.marketDataService.getAggregatedPrices(ticker, timeframe, range);
  }

  @Post(':ticker/technical')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get technical analysis data (prices + indicators) with caching',
    description:
      'Fetches price data and calculates technical indicators via Python Service. Results are cached for 5 minutes. Returns partial data if Python Service is unavailable or insufficient data points (<200).',
  })
  @ApiParam({ name: 'ticker', example: 'VALE3', description: 'Ticker symbol' })
  @ApiQuery({
    name: 'timeframe',
    required: false,
    enum: ['1D', '1W', '1M'],
    description: 'Candle timeframe: 1D (Daily), 1W (Weekly), 1M (Monthly)',
    example: '1D',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: ['1mo', '3mo', '6mo', '1y', '2y', '5y', 'max'],
    description: 'Viewing range: how much historical data to return',
    example: '1y',
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
  async syncCotahist(@Body() dto: SyncCotahistDto): Promise<SyncCotahistResponseDto> {
    this.logger.log(`Sync COTAHIST request: ${dto.ticker} (${dto.startYear}-${dto.endYear})`);

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
    description:
      'Returns audit trail of all sync operations (COTAHIST, BRAPI, Bulk). Supports filtering by ticker, status, operation type, and date range. For compliance and monitoring.',
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

  /**
   * FASE 35: Sistema de Gerenciamento de Sync B3
   */
  @Get('sync-status')
  @ApiOperation({
    summary: 'Obter status de sincronização de todos os ativos B3',
    description:
      'Retorna lista consolidada (55 ativos) com status de sync, quantidade de registros carregados, período de dados (data mais antiga/recente) e última sincronização para cada ativo. Performance otimizada com query SQL única (LEFT JOIN). Status: SYNCED (≥200 registros), PENDING (0 registros), PARTIAL (<200 registros), FAILED (última sync falhou).',
  })
  @ApiResponse({
    status: 200,
    description: 'Status de sync retornado com sucesso',
    type: SyncStatusResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Erro ao buscar status de sync',
  })
  async getSyncStatus(): Promise<SyncStatusResponseDto> {
    this.logger.log('Get sync status request');
    return this.marketDataService.getSyncStatus();
  }

  @Post('sync-bulk')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Sincronização em massa de múltiplos ativos B3',
    description:
      'Inicia sincronização de múltiplos tickers em background (sem limite máximo, processamento sequencial). Retorna HTTP 202 Accepted imediatamente APÓS validar tickers. Acompanhe o progresso em tempo real via WebSocket (evento: sync:progress). Período: 1986-2025 (histórico completo COTAHIST B3). Validação prévia de tickers com fail-fast. Retry automático 3x com exponencial backoff (2s, 4s, 8s). Tempo estimado: 2.5min/ativo.',
  })
  @ApiResponse({
    status: 202,
    description: 'Sincronização iniciada em background (acompanhe via WebSocket)',
    type: SyncBulkResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Parâmetros inválidos (tickers inválidos, anos fora do range, etc)',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro ao iniciar sincronização em massa',
  })
  async syncBulk(@Body() dto: SyncBulkDto): Promise<SyncBulkResponseDto> {
    this.logger.log(
      `Sync bulk request: ${dto.tickers.length} tickers (${dto.startYear}-${dto.endYear})`,
    );

    // BUGFIX 2025-11-22: Validar tickers ANTES de retornar HTTP 202
    // Se tickers inválidos, lança exceção (HTTP 500) ao invés de processar em background
    await this.marketDataService.validateSyncBulkRequest(dto.tickers);

    // Processar em background (não aguardar conclusão)
    // Validação já passou, então erros aqui são apenas de processamento (logados)
    this.marketDataService
      .syncBulkAssets(dto.tickers, dto.startYear, dto.endYear)
      .catch((error) => {
        this.logger.error(`Sync bulk background error: ${error.message}`, error.stack);
      });

    // Retornar resposta imediata (HTTP 202 Accepted)
    const estimatedMinutes = dto.tickers.length * 2.5; // 2.5min/ativo (média observada)
    return {
      message: 'Sincronização iniciada em background',
      totalTickers: dto.tickers.length,
      estimatedMinutes: Math.round(estimatedMinutes),
      instructions: 'Acompanhe o progresso em tempo real via WebSocket (evento: sync:progress)',
    };
  }

  /**
   * FASE 67: Get intraday price data from TimescaleDB hypertable
   */
  @Get(':ticker/intraday')
  @ApiOperation({
    summary: 'Get intraday price data (1m, 5m, 15m, 30m, 1h, 4h)',
    description:
      'Fetches high-frequency price data from TimescaleDB hypertable. Supports multiple timeframes and uses Continuous Aggregates for 1h and 4h candles. Data retention: 90 days.',
  })
  @ApiParam({ name: 'ticker', example: 'PETR4', description: 'Ticker symbol' })
  @ApiQuery({
    name: 'timeframe',
    required: false,
    enum: IntradayTimeframeParam,
    description: 'Candle timeframe: 1m, 5m, 15m, 30m, 1h, 4h',
    example: '15m',
  })
  @ApiQuery({
    name: 'range',
    required: false,
    enum: IntradayRangeParam,
    description: 'Period range: 1h, 4h, 1d, 5d, 1w, 2w, 1mo',
    example: '1d',
  })
  @ApiQuery({
    name: 'startTime',
    required: false,
    type: String,
    description: 'Start time (ISO 8601). Overrides range if provided.',
    example: '2025-12-04T10:00:00-03:00',
  })
  @ApiQuery({
    name: 'endTime',
    required: false,
    type: String,
    description: 'End time (ISO 8601). Default: now.',
    example: '2025-12-04T18:00:00-03:00',
  })
  @ApiResponse({
    status: 200,
    description: 'Intraday data retrieved successfully',
    type: IntradayDataResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getIntradayData(
    @Param('ticker') ticker: string,
    @Query() query: GetIntradayDto,
  ): Promise<IntradayDataResponseDto> {
    const timeframe = query.timeframe || IntradayTimeframeParam.M15;
    const range = query.range || IntradayRangeParam.D1;

    this.logger.log(`Intraday request: ${ticker} ${timeframe} ${range}`);

    return this.marketDataService.getIntradayData(
      ticker,
      timeframe,
      range,
      query.startTime,
      query.endTime,
    );
  }
}
