import { Controller, Get, Post, Body, Param, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NewsService } from './news.service';
import {
  AIOrchestatorService,
  ConsensusService,
  NewsCollectorsService,
  EconomicCalendarService,
} from './services';
import {
  GetNewsQueryDto,
  NewsResponseDto,
  MarketSentimentSummaryDto,
  CollectNewsDto,
  AnalyzeNewsDto,
} from './dto/news.dto';

/**
 * NewsController - FASE 75
 *
 * Endpoints para gerenciamento de notícias e análise de sentimento.
 *
 * @see PLANO_FASE_75_AI_SENTIMENT_MULTI_PROVIDER.md
 */
@ApiTags('News & Sentiment')
@Controller('news')
export class NewsController {
  private readonly logger = new Logger(NewsController.name);

  constructor(
    private readonly newsService: NewsService,
    private readonly aiOrchestrator: AIOrchestatorService,
    private readonly consensusService: ConsensusService,
    private readonly newsCollectors: NewsCollectorsService,
    private readonly economicCalendar: EconomicCalendarService,
  ) {}

  /**
   * Lista notícias com filtros
   */
  @Get()
  @ApiOperation({ summary: 'Listar notícias com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de notícias', type: [NewsResponseDto] })
  async findAll(
    @Query() query: GetNewsQueryDto,
  ): Promise<{ data: NewsResponseDto[]; total: number }> {
    this.logger.log(`GET /news - Query: ${JSON.stringify(query)}`);
    return this.newsService.findAll(query);
  }

  /**
   * Resumo de sentimento do mercado (para dashboard)
   */
  @Get('market-sentiment')
  @ApiOperation({ summary: 'Obter resumo de sentimento do mercado' })
  @ApiResponse({ status: 200, description: 'Resumo de sentimento', type: MarketSentimentSummaryDto })
  async getMarketSentiment(): Promise<MarketSentimentSummaryDto> {
    this.logger.log('GET /news/market-sentiment');
    return this.newsService.getMarketSentimentSummary();
  }

  /**
   * Notícias por ticker
   */
  @Get('ticker/:ticker')
  @ApiOperation({ summary: 'Listar notícias de um ativo específico' })
  @ApiParam({ name: 'ticker', description: 'Ticker do ativo (ex: PETR4)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de resultados' })
  @ApiResponse({ status: 200, description: 'Lista de notícias do ativo', type: [NewsResponseDto] })
  async findByTicker(
    @Param('ticker') ticker: string,
    @Query('limit') limit?: number,
  ): Promise<NewsResponseDto[]> {
    this.logger.log(`GET /news/ticker/${ticker} - Limit: ${limit || 20}`);
    return this.newsService.findByTicker(ticker, limit || 20);
  }

  /**
   * Detalhes de uma notícia
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma notícia' })
  @ApiParam({ name: 'id', description: 'ID da notícia' })
  @ApiResponse({ status: 200, description: 'Detalhes da notícia', type: NewsResponseDto })
  @ApiResponse({ status: 404, description: 'Notícia não encontrada' })
  async findOne(@Param('id') id: string): Promise<NewsResponseDto> {
    this.logger.log(`GET /news/${id}`);
    return this.newsService.findOne(id);
  }

  /**
   * Coletar notícias de um ticker
   */
  @Post('collect')
  @ApiOperation({ summary: 'Coletar notícias de um ticker' })
  @ApiResponse({ status: 201, description: 'Notícias coletadas', type: [NewsResponseDto] })
  async collectNews(@Body() dto: CollectNewsDto): Promise<{
    message: string;
    collected: number;
    sources: string[];
  }> {
    this.logger.log(`POST /news/collect - Ticker: ${dto.ticker}`);

    const news = await this.newsCollectors.collectForTicker(
      dto.ticker,
      dto.sources,
      dto.limit,
    );

    return {
      message: `Collected ${news.length} news articles for ${dto.ticker}`,
      collected: news.length,
      sources: [...new Set(news.map(n => n.source))],
    };
  }

  /**
   * Analisar notícia com AI Multi-Provider
   */
  @Post('analyze')
  @ApiOperation({ summary: 'Analisar notícia com múltiplos providers de IA' })
  @ApiResponse({ status: 201, description: 'Análise iniciada' })
  async analyzeNews(@Body() dto: AnalyzeNewsDto): Promise<{
    message: string;
    analysesCompleted: number;
    hasConsensus: boolean;
  }> {
    this.logger.log(`POST /news/analyze - NewsId: ${dto.newsId}`);

    const news = await this.newsService.findOneEntity(dto.newsId);

    // Executar análises com providers
    const analyses = await this.aiOrchestrator.analyzeNews(news, dto.providers);

    // Tentar calcular consenso se temos análises suficientes
    const consensus = await this.consensusService.calculateConsensus(dto.newsId);

    return {
      message: `Analysis completed with ${analyses.length} providers`,
      analysesCompleted: analyses.length,
      hasConsensus: !!consensus,
    };
  }

  /**
   * Obter providers de IA habilitados
   */
  @Get('ai-providers')
  @ApiOperation({ summary: 'Listar providers de IA habilitados' })
  @ApiResponse({ status: 200, description: 'Lista de providers' })
  async getAIProviders(): Promise<{ providers: string[]; count: number }> {
    const providers = this.aiOrchestrator.getEnabledProviders();
    return {
      providers,
      count: providers.length,
    };
  }

  /**
   * Obter fontes de notícias habilitadas
   */
  @Get('news-sources')
  @ApiOperation({ summary: 'Listar fontes de notícias habilitadas' })
  @ApiResponse({ status: 200, description: 'Lista de fontes' })
  async getNewsSources(): Promise<{ sources: string[]; count: number }> {
    const sources = this.newsCollectors.getEnabledSources();
    return {
      sources,
      count: sources.length,
    };
  }

  /**
   * Estatísticas de análise
   */
  @Get('stats')
  @ApiOperation({ summary: 'Obter estatísticas de coleta e análise' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getStats(): Promise<{
    collection: Awaited<ReturnType<NewsCollectorsService['getCollectionStats']>>;
    analysis: Awaited<ReturnType<AIOrchestatorService['getAnalysisStats']>>;
    consensus: Awaited<ReturnType<ConsensusService['getConsensusStats']>>;
  }> {
    const [collection, analysis, consensus] = await Promise.all([
      this.newsCollectors.getCollectionStats(),
      this.aiOrchestrator.getAnalysisStats(),
      this.consensusService.getConsensusStats(),
    ]);

    return { collection, analysis, consensus };
  }

  // ==================== ECONOMIC CALENDAR ENDPOINTS ====================

  /**
   * Eventos econômicos da semana
   */
  @Get('economic-calendar/week')
  @ApiOperation({ summary: 'Obter eventos econômicos da semana' })
  @ApiQuery({ name: 'country', required: false, description: 'Filtrar por país (BRA, USA)' })
  @ApiResponse({ status: 200, description: 'Eventos da semana' })
  async getWeekEvents(
    @Query('country') country?: string,
  ): Promise<{ events: unknown[]; count: number }> {
    this.logger.log(`GET /news/economic-calendar/week - Country: ${country || 'all'}`);
    const events = await this.economicCalendar.getWeekEvents(country);
    return { events, count: events.length };
  }

  /**
   * Próximos eventos de alto impacto
   */
  @Get('economic-calendar/high-impact')
  @ApiOperation({ summary: 'Obter próximos eventos de alto impacto' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite de eventos' })
  @ApiResponse({ status: 200, description: 'Eventos de alto impacto' })
  async getHighImpactEvents(
    @Query('limit') limit?: number,
  ): Promise<{ events: unknown[]; count: number }> {
    this.logger.log(`GET /news/economic-calendar/high-impact - Limit: ${limit || 10}`);
    const events = await this.economicCalendar.getUpcomingHighImpact(limit || 10);
    return { events, count: events.length };
  }

  /**
   * Coletar eventos econômicos
   */
  @Post('economic-calendar/collect')
  @ApiOperation({ summary: 'Coletar eventos do calendário econômico' })
  @ApiResponse({ status: 201, description: 'Eventos coletados' })
  async collectEconomicEvents(): Promise<{
    message: string;
    total: number;
    bySource: Record<string, number>;
  }> {
    this.logger.log('POST /news/economic-calendar/collect');
    const result = await this.economicCalendar.collectAll();
    return {
      message: `Collected ${result.total} economic events`,
      total: result.total,
      bySource: result.bySource,
    };
  }

  /**
   * Estatísticas do calendário econômico
   */
  @Get('economic-calendar/stats')
  @ApiOperation({ summary: 'Estatísticas do calendário econômico' })
  @ApiResponse({ status: 200, description: 'Estatísticas' })
  async getCalendarStats(): Promise<Awaited<ReturnType<EconomicCalendarService['getStats']>>> {
    this.logger.log('GET /news/economic-calendar/stats');
    return this.economicCalendar.getStats();
  }
}
