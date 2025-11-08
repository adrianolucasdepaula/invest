import { Injectable, Logger } from '@nestjs/common';
import { AbstractScraper } from '../base/abstract-scraper';
import * as cheerio from 'cheerio';

export interface ValorArticle {
  title: string;
  url: string;
  author: string;
  publishedAt: Date;
  summary: string;
  category: string;
  imageUrl?: string;
}

@Injectable()
export class ValorScraper extends AbstractScraper<ValorArticle[]> {
  protected readonly logger = new Logger(ValorScraper.name);
  readonly name = 'Valor Econômico';
  readonly source = 'valor';
  readonly requiresLogin = false;

  protected async scrapeData(ticker: string): Promise<ValorArticle[]> {
    const startTime = Date.now();
    this.logger.log(`Iniciando scraping Valor para ${ticker}`);

    try {
      await this.initialize();

      const searchUrl = `https://valor.globo.com/busca/?q=${encodeURIComponent(ticker)}`;

      await this.page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Aguardar resultados
      await this.page.waitForSelector('.widget--card, .widget--info', { timeout: 10000 });

      const content = await this.page.content();
      const $ = cheerio.load(content);

      const articles: ValorArticle[] = [];

      $('.widget--card, .widget--info').each((_, element) => {
        try {
          const $article = $(element);

          const title = $article.find('.widget--info__title, h2').text().trim();
          const url = $article.find('a').first().attr('href');
          const author = $article.find('.widget--info__meta-author').text().trim();
          const timeText = $article.find('time').attr('datetime') ||
                          $article.find('.widget--info__meta-time').text().trim();
          const summary = $article.find('.widget--info__description, p').first().text().trim();
          const category = $article.find('.widget--info__header-title').text().trim();
          const imageUrl = $article.find('img').first().attr('src');

          if (!title || !url) return;

          const fullUrl = url.startsWith('http') ? url : `https://valor.globo.com${url}`;

          let publishedAt: Date;
          try {
            publishedAt = timeText ? new Date(timeText) : new Date();
          } catch {
            publishedAt = new Date();
          }

          articles.push({
            title,
            url: fullUrl,
            author: author || 'Redação Valor',
            publishedAt,
            summary,
            category: category || 'Mercados',
            imageUrl,
          });
        } catch (error) {
          this.logger.warn(`Erro ao processar artigo Valor: ${error.message}`);
        }
      });

      const duration = Date.now() - startTime;
      this.logger.log(`Scraping Valor concluído para ${ticker}. ${articles.length} artigos em ${duration}ms`);

      return articles.slice(0, 20); // Limitar a 20 artigos mais recentes
    } catch (error) {
      this.logger.error(`Erro ao fazer scraping Valor para ${ticker}:`, error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}
