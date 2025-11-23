import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ScraperResult } from '../base/base-scraper.interface';

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
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  readonly name = 'BRAPI Scraper';
  readonly source = 'brapi';
  readonly requiresLogin = false;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BRAPI_API_KEY');
    this.client = axios.create({
      baseURL: 'https://brapi.dev/api',
      timeout: 30000,
    });
  }

  async scrape(ticker: string, range: string = '1y'): Promise<ScraperResult<BrapiData>> {
    const startTime = Date.now();

    try {
      this.logger.log(`Scraping ${ticker} from BRAPI`);

      const response = await this.client.get(`/quote/${ticker}`, {
        params: {
          token: this.apiKey, // BRAPI requires token as query param, not header
          range,
          interval: '1d',
          fundamental: true,
        },
      });

      if (!response.data || !response.data.results || response.data.results.length === 0) {
        throw new Error('No data returned from BRAPI');
      }

      const result = response.data.results[0];

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
    }
  }

  async getQuote(ticker: string): Promise<any> {
    try {
      const response = await this.client.get(`/quote/${ticker}`);
      return response.data.results[0];
    } catch (error) {
      this.logger.error(`Failed to get quote for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  async getHistoricalPrices(
    ticker: string,
    range: string = '1y',
    interval: string = '1d',
  ): Promise<any[]> {
    try {
      const response = await this.client.get(`/quote/${ticker}`, {
        params: { range, interval },
      });
      return response.data.results[0]?.historicalDataPrice || [];
    } catch (error) {
      this.logger.error(`Failed to get historical prices for ${ticker}: ${error.message}`);
      throw error;
    }
  }
}
