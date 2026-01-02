import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News, NewsSource, Asset } from '../../../database/entities';

/**
 * Configuração de cada fonte de notícias
 */
interface NewsSourceConfig {
  source: NewsSource;
  name: string;
  baseUrl: string;
  rssUrl?: string;
  apiKey?: string;
  enabled: boolean;
  rateLimit: number; // requests por minuto
}

/**
 * Notícia coletada (antes de salvar no banco)
 */
interface CollectedNews {
  title: string;
  url: string;
  summary?: string;
  content?: string;
  author?: string;
  imageUrl?: string;
  publishedAt: Date;
  source: NewsSource;
  sourceName: string;
}

/**
 * FASE 75.2: News Collectors Service
 *
 * Coleta notícias de 7 fontes diferentes:
 * 1. Google News - RSS/Search API
 * 2. InfoMoney - RSS/Scraping
 * 3. Valor Econômico - RSS
 * 4. Estadão Economia - RSS
 * 5. Exame - RSS
 * 6. Bloomberg Brasil - RSS
 * 7. Investing.com Brasil - RSS
 */
@Injectable()
export class NewsCollectorsService {
  private readonly logger = new Logger(NewsCollectorsService.name);
  private readonly sources: Map<NewsSource, NewsSourceConfig> = new Map();

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {
    this.initializeSources();
  }

  /**
   * Inicializa configurações de todas as fontes
   */
  private initializeSources(): void {
    // Google News
    this.sources.set(NewsSource.GOOGLE_NEWS, {
      source: NewsSource.GOOGLE_NEWS,
      name: 'Google News',
      baseUrl: 'https://news.google.com',
      rssUrl: 'https://news.google.com/rss/search',
      enabled: true,
      rateLimit: 30,
    });

    // InfoMoney
    this.sources.set(NewsSource.INFOMONEY, {
      source: NewsSource.INFOMONEY,
      name: 'InfoMoney',
      baseUrl: 'https://www.infomoney.com.br',
      rssUrl: 'https://www.infomoney.com.br/feed/',
      enabled: true,
      rateLimit: 20,
    });

    // Valor Econômico
    this.sources.set(NewsSource.VALOR_ECONOMICO, {
      source: NewsSource.VALOR_ECONOMICO,
      name: 'Valor Econômico',
      baseUrl: 'https://valor.globo.com',
      rssUrl: 'https://valor.globo.com/rss/mercados/',
      enabled: true,
      rateLimit: 20,
    });

    // Estadão
    this.sources.set(NewsSource.ESTADAO, {
      source: NewsSource.ESTADAO,
      name: 'Estadão Economia',
      baseUrl: 'https://economia.estadao.com.br',
      rssUrl: 'https://economia.estadao.com.br/rss/ultimas',
      enabled: true,
      rateLimit: 20,
    });

    // Exame
    this.sources.set(NewsSource.EXAME, {
      source: NewsSource.EXAME,
      name: 'Exame',
      baseUrl: 'https://exame.com',
      rssUrl: 'https://exame.com/feed/',
      enabled: true,
      rateLimit: 20,
    });

    // Bloomberg Brasil
    this.sources.set(NewsSource.BLOOMBERG, {
      source: NewsSource.BLOOMBERG,
      name: 'Bloomberg Brasil',
      baseUrl: 'https://www.bloomberg.com.br',
      rssUrl: 'https://www.bloomberg.com/feed/podcast/brasil.xml',
      enabled: true,
      rateLimit: 15,
    });

    // Investing.com Brasil
    this.sources.set(NewsSource.INVESTING, {
      source: NewsSource.INVESTING,
      name: 'Investing.com Brasil',
      baseUrl: 'https://br.investing.com',
      rssUrl: 'https://br.investing.com/rss/news.rss',
      enabled: true,
      rateLimit: 15,
    });

    const enabledCount = Array.from(this.sources.values()).filter((s) => s.enabled).length;
    this.logger.log(`Initialized ${enabledCount}/7 news sources`);
  }

  /**
   * Coleta notícias para um ticker de todas as fontes
   */
  async collectForTicker(
    ticker: string,
    specificSources?: NewsSource[],
    limit: number = 10,
  ): Promise<News[]> {
    const sourcesToUse = specificSources || this.getEnabledSources();

    this.logger.log(`Collecting news for ${ticker} from ${sourcesToUse.length} sources`);

    // Buscar asset
    const asset = await this.assetRepository.findOne({ where: { ticker } });

    // Coletar de todas as fontes em paralelo
    const collectionPromises = sourcesToUse.map((source) =>
      this.collectFromSource(source, ticker, limit),
    );

    const results = await Promise.allSettled(collectionPromises);

    // Agregar resultados
    const allNews: CollectedNews[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allNews.push(...result.value);
      }
    }

    // Salvar notícias novas
    const savedNews: News[] = [];
    for (const collected of allNews) {
      try {
        // Verificar se já existe
        const existing = await this.newsRepository.findOne({
          where: { url: collected.url },
        });

        if (!existing) {
          const news = this.newsRepository.create({
            ticker,
            assetId: asset?.id,
            title: collected.title,
            url: collected.url,
            summary: collected.summary,
            content: collected.content,
            author: collected.author,
            imageUrl: collected.imageUrl,
            publishedAt: collected.publishedAt,
            source: collected.source,
            sourceName: collected.sourceName,
          });

          const saved = await this.newsRepository.save(news);
          savedNews.push(saved);
        }
      } catch (_error) {
        // URL duplicada ou outro erro
        this.logger.debug(`Skipping duplicate or error: ${collected.url}`);
      }
    }

    this.logger.log(`Saved ${savedNews.length} new articles for ${ticker}`);
    return savedNews;
  }

  /**
   * Coleta de uma fonte específica
   */
  private async collectFromSource(
    source: NewsSource,
    ticker: string,
    limit: number,
  ): Promise<CollectedNews[]> {
    const config = this.sources.get(source);
    if (!config || !config.enabled) {
      return [];
    }

    try {
      switch (source) {
        case NewsSource.GOOGLE_NEWS:
          return await this.collectFromGoogleNews(config, ticker, limit);
        case NewsSource.INFOMONEY:
          return await this.collectFromInfoMoney(config, ticker, limit);
        case NewsSource.VALOR_ECONOMICO:
          return await this.collectFromValorEconomico(config, ticker, limit);
        case NewsSource.ESTADAO:
          return await this.collectFromEstadao(config, ticker, limit);
        case NewsSource.EXAME:
          return await this.collectFromExame(config, ticker, limit);
        case NewsSource.BLOOMBERG:
          return await this.collectFromBloomberg(config, ticker, limit);
        case NewsSource.INVESTING:
          return await this.collectFromInvesting(config, ticker, limit);
        default:
          return [];
      }
    } catch (error) {
      this.logger.error(`Error collecting from ${source}: ${error.message}`);
      return [];
    }
  }

  /**
   * Coleta do Google News via RSS
   */
  private async collectFromGoogleNews(
    config: NewsSourceConfig,
    ticker: string,
    limit: number,
  ): Promise<CollectedNews[]> {
    const query = encodeURIComponent(`${ticker} B3 ações`);
    const url = `${config.rssUrl}?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; B3AnalysisBot/1.0)' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Google News RSS error: ${response.status}`);
    }

    const xml = await response.text();
    return this.parseRSS(xml, config, limit);
  }

  /**
   * Coleta do InfoMoney via RSS
   */
  private async collectFromInfoMoney(
    config: NewsSourceConfig,
    ticker: string,
    limit: number,
  ): Promise<CollectedNews[]> {
    const response = await fetch(config.rssUrl!, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; B3AnalysisBot/1.0)' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`InfoMoney RSS error: ${response.status}`);
    }

    const xml = await response.text();
    const allNews = this.parseRSS(xml, config, 50);

    // Filtrar por ticker
    return allNews
      .filter(
        (n) =>
          n.title.toLowerCase().includes(ticker.toLowerCase()) ||
          (n.summary && n.summary.toLowerCase().includes(ticker.toLowerCase())),
      )
      .slice(0, limit);
  }

  /**
   * Coleta do Valor Econômico via RSS
   */
  private async collectFromValorEconomico(
    config: NewsSourceConfig,
    ticker: string,
    limit: number,
  ): Promise<CollectedNews[]> {
    const response = await fetch(config.rssUrl!, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; B3AnalysisBot/1.0)' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Valor Econômico RSS error: ${response.status}`);
    }

    const xml = await response.text();
    const allNews = this.parseRSS(xml, config, 50);

    return allNews
      .filter(
        (n) =>
          n.title.toLowerCase().includes(ticker.toLowerCase()) ||
          (n.summary && n.summary.toLowerCase().includes(ticker.toLowerCase())),
      )
      .slice(0, limit);
  }

  /**
   * Coleta do Estadão via RSS
   */
  private async collectFromEstadao(
    config: NewsSourceConfig,
    ticker: string,
    limit: number,
  ): Promise<CollectedNews[]> {
    const response = await fetch(config.rssUrl!, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; B3AnalysisBot/1.0)' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Estadão RSS error: ${response.status}`);
    }

    const xml = await response.text();
    const allNews = this.parseRSS(xml, config, 50);

    return allNews
      .filter(
        (n) =>
          n.title.toLowerCase().includes(ticker.toLowerCase()) ||
          (n.summary && n.summary.toLowerCase().includes(ticker.toLowerCase())),
      )
      .slice(0, limit);
  }

  /**
   * Coleta do Exame via RSS
   */
  private async collectFromExame(
    config: NewsSourceConfig,
    ticker: string,
    limit: number,
  ): Promise<CollectedNews[]> {
    const response = await fetch(config.rssUrl!, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; B3AnalysisBot/1.0)' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Exame RSS error: ${response.status}`);
    }

    const xml = await response.text();
    const allNews = this.parseRSS(xml, config, 50);

    return allNews
      .filter(
        (n) =>
          n.title.toLowerCase().includes(ticker.toLowerCase()) ||
          (n.summary && n.summary.toLowerCase().includes(ticker.toLowerCase())),
      )
      .slice(0, limit);
  }

  /**
   * Coleta do Bloomberg via RSS
   */
  private async collectFromBloomberg(
    config: NewsSourceConfig,
    ticker: string,
    limit: number,
  ): Promise<CollectedNews[]> {
    try {
      const response = await fetch(config.rssUrl!, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; B3AnalysisBot/1.0)' },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`Bloomberg RSS error: ${response.status}`);
      }

      const xml = await response.text();
      const allNews = this.parseRSS(xml, config, 50);

      return allNews
        .filter(
          (n) =>
            n.title.toLowerCase().includes(ticker.toLowerCase()) ||
            (n.summary && n.summary.toLowerCase().includes(ticker.toLowerCase())),
        )
        .slice(0, limit);
    } catch {
      // Bloomberg pode ter proteção, retornar vazio
      return [];
    }
  }

  /**
   * Coleta do Investing.com via RSS
   */
  private async collectFromInvesting(
    config: NewsSourceConfig,
    ticker: string,
    limit: number,
  ): Promise<CollectedNews[]> {
    const response = await fetch(config.rssUrl!, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; B3AnalysisBot/1.0)' },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Investing.com RSS error: ${response.status}`);
    }

    const xml = await response.text();
    const allNews = this.parseRSS(xml, config, 50);

    return allNews
      .filter(
        (n) =>
          n.title.toLowerCase().includes(ticker.toLowerCase()) ||
          (n.summary && n.summary.toLowerCase().includes(ticker.toLowerCase())),
      )
      .slice(0, limit);
  }

  /**
   * Parser genérico de RSS
   */
  private parseRSS(xml: string, config: NewsSourceConfig, limit: number): CollectedNews[] {
    const news: CollectedNews[] = [];

    // Parser simples de RSS usando regex
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    let count = 0;

    while ((match = itemRegex.exec(xml)) !== null && count < limit) {
      const item = match[1];

      const title = this.extractTag(item, 'title');
      const url = this.extractTag(item, 'link') || this.extractTag(item, 'guid');
      const summary = this.extractTag(item, 'description');
      const author = this.extractTag(item, 'author') || this.extractTag(item, 'dc:creator');
      const pubDate = this.extractTag(item, 'pubDate');
      const imageUrl = this.extractMediaContent(item);

      if (title && url) {
        news.push({
          title: this.cleanHtml(title),
          url: url.trim(),
          summary: summary ? this.cleanHtml(summary).substring(0, 500) : undefined,
          author: author ? this.cleanHtml(author) : undefined,
          imageUrl,
          publishedAt: pubDate ? new Date(pubDate) : new Date(),
          source: config.source,
          sourceName: config.name,
        });
        count++;
      }
    }

    return news;
  }

  /**
   * Extrai conteúdo de uma tag XML
   */
  private extractTag(xml: string, tagName: string): string | undefined {
    // Tenta com CDATA
    const cdataRegex = new RegExp(
      `<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`,
      'i',
    );
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) {
      return cdataMatch[1];
    }

    // Tenta sem CDATA
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : undefined;
  }

  /**
   * Extrai URL de mídia
   */
  private extractMediaContent(xml: string): string | undefined {
    // media:content
    const mediaMatch = xml.match(/url="([^"]+\.(jpg|jpeg|png|gif|webp)[^"]*)"/i);
    if (mediaMatch) {
      return mediaMatch[1];
    }

    // enclosure
    const enclosureMatch = xml.match(/<enclosure[^>]+url="([^"]+)"/i);
    if (enclosureMatch) {
      return enclosureMatch[1];
    }

    return undefined;
  }

  /**
   * Remove HTML e limpa texto
   */
  private cleanHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, '') // Remove tags HTML
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Retorna fontes habilitadas
   */
  getEnabledSources(): NewsSource[] {
    return Array.from(this.sources.entries())
      .filter(([, config]) => config.enabled)
      .map(([source]) => source);
  }

  /**
   * Retorna estatísticas de coleta
   */
  async getCollectionStats(): Promise<{
    total: number;
    bySource: Record<NewsSource, number>;
    last24h: number;
    lastWeek: number;
  }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const all = await this.newsRepository.find();

    const bySource = {} as Record<NewsSource, number>;
    for (const source of Object.values(NewsSource)) {
      bySource[source] = 0;
    }

    let last24hCount = 0;
    let lastWeekCount = 0;

    for (const news of all) {
      bySource[news.source]++;
      if (news.collectedAt >= yesterday) last24hCount++;
      if (news.collectedAt >= lastWeek) lastWeekCount++;
    }

    return {
      total: all.length,
      bySource,
      last24h: last24hCount,
      lastWeek: lastWeekCount,
    };
  }
}
