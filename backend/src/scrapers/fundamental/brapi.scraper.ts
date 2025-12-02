import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScraperResult } from '../base/base-scraper.interface';
import { RateLimiterService } from '../rate-limiter.service'; // ✅ FASE 3

export interface BrapiData {
  ticker: string;
  name: string;
  logoUrl: string;
  sector: string;
  currency: string;
  marketCap: number;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  eps: number;
  pe: number;
  dividendYield: number;
  week52High: number;
  week52Low: number;
  historicalPrices?: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    adjustedClose: number;
  }>;
}

@Injectable()
export class BrapiScraper {
  private readonly logger = new Logger(BrapiScraper.name);
  private readonly apiKey: string;
  private readonly apiBaseUrl = 'https://brapi.dev/api';

  readonly name = 'BRAPI Scraper';
  readonly source = 'brapi';
  readonly requiresLogin = false;
  readonly baseUrl = 'https://brapi.dev'; // ✅ FASE 3

  // ✅ BRAPI Mutex: Garante requisições sequenciais (evita 403)
  private static requestQueue: Promise<void> = Promise.resolve();
  private static readonly MIN_DELAY_MS = 12000; // 12s entre requisições (conservative)

  constructor(
    private configService: ConfigService,
    private rateLimiter: RateLimiterService, // ✅ FASE 3
  ) {
    this.apiKey = this.configService.get<string>('BRAPI_API_KEY');
  }

  /**
   * Make HTTP request using native fetch (avoids axios Cloudflare issues)
   */
  private async fetchApi(endpoint: string, params: Record<string, string> = {}): Promise<any> {
    const url = new URL(`${this.apiBaseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'curl/8.14.1', // ✅ Mimic curl to bypass Cloudflare
        Accept: '*/*',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  /**
   * Mutex para BRAPI - garante que apenas UMA requisição é feita por vez
   * e com espaçamento mínimo de MIN_DELAY_MS entre requisições
   *
   * @returns Função release() para liberar o lock após a requisição
   */
  private async acquireLock(): Promise<() => void> {
    // Encadeia na fila de requisições existente
    const previousRequest = BrapiScraper.requestQueue;

    let resolveThisRequest: () => void;
    BrapiScraper.requestQueue = new Promise((resolve) => {
      resolveThisRequest = resolve;
    });

    // Aguarda a requisição anterior terminar + delay mínimo
    await previousRequest;

    this.logger.debug(`[BRAPI MUTEX] Lock acquired, waiting ${BrapiScraper.MIN_DELAY_MS}ms`);

    // Retorna função para liberar o lock
    return () => {
      this.logger.debug(`[BRAPI MUTEX] Lock released`);
      resolveThisRequest!();
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ✅ BRAPI free plan only supports: '1d', '5d', '1mo', '3mo' (NOT '1y')
  async scrape(ticker: string, range: string = '3mo'): Promise<ScraperResult<BrapiData>> {
    const startTime = Date.now();
    let release: (() => void) | null = null;

    try {
      this.logger.log(`Scraping ${ticker} from BRAPI`);

      // ✅ BRAPI Mutex: Adquirir lock antes de qualquer requisição
      release = await this.acquireLock();

      // ✅ Delay obrigatório APÓS adquirir lock (evita 403)
      await this.sleep(BrapiScraper.MIN_DELAY_MS);

      this.logger.debug(`[BRAPI] Making API request for ${ticker}`);

      // ✅ Use native fetch instead of axios to bypass Cloudflare
      const response = await this.fetchApi(`/quote/${ticker}`, {
        token: this.apiKey,
        range,
        interval: '1d',
        fundamental: 'true',
      });

      if (!response || !response.results || response.results.length === 0) {
        throw new Error('No data returned from BRAPI');
      }

      const result = response.results[0];

      const data: BrapiData = {
        ticker: result.symbol,
        name: result.longName || result.shortName,
        logoUrl: result.logourl,
        sector: result.sector,
        currency: result.currency,
        marketCap: result.marketCap,
        price: result.regularMarketPrice,
        change: result.regularMarketChange,
        changePercent: result.regularMarketChangePercent,
        open: result.regularMarketOpen,
        high: result.regularMarketDayHigh,
        low: result.regularMarketDayLow,
        volume: result.regularMarketVolume,
        previousClose: result.regularMarketPreviousClose,
        eps: result.epsTrailingTwelveMonths,
        pe: result.priceEarnings,
        dividendYield: result.dividendYield,
        week52High: result.fiftyTwoWeekHigh,
        week52Low: result.fiftyTwoWeekLow,
        historicalPrices: result.historicalDataPrice?.map((price: any) => ({
          date: new Date(price.date * 1000).toISOString().split('T')[0],
          open: +price.open, // BUGFIX 2025-11-22: Normalizar string→number (BRAPI retorna strings)
          high: +price.high,
          low: +price.low,
          close: +price.close,
          volume: +price.volume,
          adjustedClose: +price.adjustedClose,
        })),
      };

      const responseTime = Date.now() - startTime;

      this.logger.log(`Successfully scraped ${ticker} from BRAPI in ${responseTime}ms`);

      return {
        success: true,
        data,
        source: this.source,
        timestamp: new Date(),
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`Failed to scrape ${ticker} from BRAPI: ${error.message}`);

      return {
        success: false,
        error: error.message,
        source: this.source,
        timestamp: new Date(),
        responseTime,
      };
    } finally {
      // ✅ SEMPRE liberar o lock, mesmo em caso de erro
      if (release) {
        release();
      }
    }
  }

  async getQuote(ticker: string): Promise<any> {
    try {
      const data = await this.fetchApi(`/quote/${ticker}`, {
        token: this.apiKey,
      });
      return data.results[0];
    } catch (error) {
      this.logger.error(`Failed to get quote for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  // ✅ BRAPI free plan only supports: '1d', '5d', '1mo', '3mo' (NOT '1y')
  async getHistoricalPrices(
    ticker: string,
    range: string = '3mo',
    interval: string = '1d',
  ): Promise<any[]> {
    try {
      const data = await this.fetchApi(`/quote/${ticker}`, {
        token: this.apiKey,
        range,
        interval,
      });
      return data.results[0]?.historicalDataPrice || [];
    } catch (error) {
      this.logger.error(`Failed to get historical prices for ${ticker}: ${error.message}`);
      throw error;
    }
  }
}
