import { Injectable } from '@nestjs/common';
import { AbstractScraper } from '../base/abstract-scraper';
import { GoogleAuthHelper } from '../auth/google-auth.helper';
import { RateLimiterService } from '../rate-limiter.service';
import * as cheerio from 'cheerio';
import * as path from 'path';

export interface FundamenteiData {
  ticker: string;
  companyName: string;
  price: number;
  pl: number; // P/L
  pvp: number; // P/VP
  roe: number; // ROE
  dy: number; // Dividend Yield
  dividaLiquidaEbitda: number; // Dívida Líquida/EBITDA
  margemLiquida: number; // Margem Líquida
  valorMercado: number; // Valor de Mercado
  receitaLiquida: number; // Receita Líquida
  lucroLiquido: number; // Lucro Líquido
}

@Injectable()
export class FundamenteiScraper extends AbstractScraper<FundamenteiData> {
  readonly name = 'Fundamentei Scraper';
  readonly source = 'fundamentei';
  readonly requiresLogin = true;
  readonly baseUrl = 'https://fundamentei.com';

  private readonly cookiesPath = path.join(
    process.cwd(),
    'data',
    'cookies',
    'fundamentei_session.json',
  );

  constructor(rateLimiter: RateLimiterService) {
    super();
    this.rateLimiter = rateLimiter;
  }

  protected async scrapeData(ticker: string): Promise<FundamenteiData> {
    // ✅ URL Format Updated 2024-12: Fundamentei now uses /br/{ticker}/valuation format
    // Old format was /acoes/{TICKER} - no longer works (returns 404)
    const url = `https://fundamentei.com/br/${ticker.toLowerCase()}/valuation`;

    // Using 'load' instead of 'networkidle' - Fundamentei loads many analytics scripts that cause timeout
    await this.page.goto(url, { waitUntil: 'load', timeout: 60000 });

    // Wait for main content to load
    await this.page.waitForSelector('h4, h1', { timeout: 10000 }).catch(() => {
      // If element doesn't exist, continue anyway
    });

    const content = await this.page.content();
    const $ = cheerio.load(content);

    const getValue = (text: string): number => {
      if (!text) return 0;
      text = text
        .replace(/\./g, '')
        .replace(',', '.')
        .replace('%', '')
        .replace('R$', '')
        .replace(/[^\d.-]/g, '')
        .trim();
      return parseFloat(text) || 0;
    };

    // Fundamentei 2024-12 structure: h4 (value) + h2 (label) in same container
    const getValueByLabel = (label: string): number => {
      const h2Elements = $('h2').filter(function () {
        const text = $(this).text().trim();
        return text === label || text.includes(label);
      });

      if (h2Elements.length > 0) {
        const container = h2Elements.first().parent();
        const h4Value = container.find('h4').first();
        if (h4Value.length > 0) {
          return getValue(h4Value.text().trim());
        }
      }
      return 0;
    };

    // Extract company name from h1 in header
    const companyName =
      $('h1').first().text().trim().replace('Valuation •', '').trim() ||
      ticker.toUpperCase();

    const data: FundamenteiData = {
      ticker: ticker.toUpperCase(),
      companyName,
      price: 0, // Not available on valuation page

      // Fundamentei valuation indicators (2024-12)
      pl: getValueByLabel('P/L'),
      pvp: getValueByLabel('P/VPA'),
      roe: getValueByLabel('ROE'),
      dy: getValueByLabel('DY'),
      dividaLiquidaEbitda: getValueByLabel('P/EBITDA'),
      margemLiquida: getValueByLabel('Margem Líquida'),
      valorMercado: 0, // Not on valuation page
      receitaLiquida: 0, // Not on valuation page
      lucroLiquido: getValueByLabel('LPA'),
    };

    this.logger.debug(`[FUNDAMENTEI] Extracted: ${JSON.stringify(data)}`);
    return data;
  }

  validate(data: FundamenteiData): boolean {
    // Relaxed validation - need at least 2 valid indicators
    const filledFields = [
      data.pl !== 0,
      data.pvp !== 0,
      data.roe !== 0,
      data.dy !== 0,
      data.dividaLiquidaEbitda !== 0,
      data.lucroLiquido !== 0,
    ].filter(Boolean).length;

    return data.ticker !== '' && filledFields >= 2;
  }

  protected async login(): Promise<void> {
    // Load OAuth session from cookies (saved by Python OAuth Manager)
    const sessionLoaded = await GoogleAuthHelper.loadSession(this.page, this.cookiesPath);

    if (!sessionLoaded) {
      this.logger.warn('No OAuth session found - manual OAuth login required via /oauth-manager');
      throw new Error('OAuth session required - Please use /oauth-manager to authenticate');
    }

    this.logger.log('Loaded Fundamentei OAuth session from cookies');
  }
}
