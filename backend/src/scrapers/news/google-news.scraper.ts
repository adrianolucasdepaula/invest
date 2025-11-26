import { Injectable, Logger } from '@nestjs/common';
import { AbstractScraper } from '../base/abstract-scraper';
import { RateLimiterService } from '../rate-limiter.service'; // ✅ FASE 3
import * as cheerio from 'cheerio';

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  snippet: string;
  imageUrl?: string;
}

@Injectable()
export class GoogleNewsScraper extends AbstractScraper<NewsArticle[]> {
  protected readonly logger = new Logger(GoogleNewsScraper.name);
  readonly name = 'Google News';
  readonly source = 'google-news';
  readonly requiresLogin = false;
  readonly baseUrl = 'https://news.google.com'; // ✅ FASE 3

  constructor(rateLimiter: RateLimiterService) {
    super();
    this.rateLimiter = rateLimiter; // ✅ FASE 3
  }

  protected async scrapeData(ticker: string): Promise<NewsArticle[]> {
    const startTime = Date.now();
    this.logger.log(`Iniciando scraping de notícias para ${ticker}`);

    try {
      await this.initialize();

      const searchQuery = `${ticker} B3 ações`;
      const url = `https://news.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Aguardar carregamento do conteúdo
      await this.page.waitForSelector('article', { timeout: 10000 });

      const content = await this.page.content();
      const $ = cheerio.load(content);

      const articles: NewsArticle[] = [];

      $('article').each((_, element) => {
        try {
          const $article = $(element);

          const title = $article.find('h3, h4').first().text().trim();
          const relativeUrl = $article.find('a').first().attr('href');
          const source = $article.find('a[data-n-tid]').text().trim();
          const timeText = $article.find('time').attr('datetime');
          const snippet = $article.find('p').first().text().trim();

          if (!title || !relativeUrl) return;

          const url = relativeUrl.startsWith('http')
            ? relativeUrl
            : `https://news.google.com${relativeUrl}`;

          const publishedAt = timeText ? new Date(timeText) : new Date();

          articles.push({
            title,
            url,
            source: source || 'Desconhecido',
            publishedAt,
            snippet,
          });
        } catch (error) {
          this.logger.warn(`Erro ao processar artigo: ${error.message}`);
        }
      });

      const duration = Date.now() - startTime;
      this.logger.log(
        `Scraping concluído para ${ticker}. ${articles.length} notícias encontradas em ${duration}ms`,
      );

      return articles;
    } catch (error) {
      this.logger.error(`Erro ao fazer scraping de notícias para ${ticker}:`, error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}
