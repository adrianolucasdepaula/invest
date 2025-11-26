import { Injectable } from '@nestjs/common';
import { AbstractScraper } from '../base/abstract-scraper';
import { RateLimiterService } from '../rate-limiter.service'; // ✅ FASE 3
import * as cheerio from 'cheerio';

export interface FundamentusData {
  ticker: string;
  cotacao: number;
  pl: number;
  pvp: number;
  psr: number;
  dividendYield: number;
  pAtivo: number;
  pCapitalGiro: number;
  pEbit: number;
  pAtivoCirculante: number;
  evEbit: number;
  evEbitda: number;
  margemEbit: number;
  margemLiquida: number;
  liquidezCorrente: number;
  roic: number;
  roe: number;
  liquidez2Meses: number;
  patrimonioLiquido: number;
  dividaBruta: number;
  disponibilidades: number;
  ativoTotal: number;
  receitaLiquida: number;
  ebit: number;
  lucroLiquido: number;
}

@Injectable()
export class FundamentusScraper extends AbstractScraper<FundamentusData> {
  readonly name = 'Fundamentus Scraper';
  readonly source = 'fundamentus';
  readonly requiresLogin = false;
  readonly baseUrl = 'https://www.fundamentus.com.br'; // ✅ FASE 3

  constructor(rateLimiter: RateLimiterService) {
    super();
    this.rateLimiter = rateLimiter; // ✅ FASE 3: Injetar rate limiter
  }

  protected async scrapeData(ticker: string): Promise<FundamentusData> {
    const url = `https://www.fundamentus.com.br/detalhes.php?papel=${ticker.toUpperCase()}`;

    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeout });

    const content = await this.page.content();
    const $ = cheerio.load(content);

    const getValue = (label: string): number => {
      const text = $(`td:contains("${label}")`)
        .next('td')
        .text()
        .trim()
        .replace(/\./g, '')
        .replace(',', '.')
        .replace('%', '')
        .replace('R$', '')
        .trim();

      return parseFloat(text) || 0;
    };

    const data: FundamentusData = {
      ticker: ticker.toUpperCase(),
      cotacao: getValue('Cotação'),
      pl: getValue('P/L'),
      pvp: getValue('P/VP'),
      psr: getValue('PSR'),
      dividendYield: getValue('Div. Yield'),
      pAtivo: getValue('P/Ativo'),
      pCapitalGiro: getValue('P/Cap. Giro'),
      pEbit: getValue('P/EBIT'),
      pAtivoCirculante: getValue('P/Ativ Circ Liq'),
      evEbit: getValue('EV / EBIT'),
      evEbitda: getValue('EV / EBITDA'),
      margemEbit: getValue('Marg. EBIT'),
      margemLiquida: getValue('Marg. Líquida'),
      liquidezCorrente: getValue('Liq. Corrente'),
      roic: getValue('ROIC'),
      roe: getValue('ROE'),
      liquidez2Meses: getValue('Liq. 2 meses'),
      patrimonioLiquido: getValue('Patrim. Líq'),
      dividaBruta: getValue('Dív. Bruta'),
      disponibilidades: getValue('Disponibilidades'),
      ativoTotal: getValue('Ativo'),
      receitaLiquida: getValue('Receita Líquida'),
      ebit: getValue('EBIT'),
      lucroLiquido: getValue('Lucro Líquido'),
    };

    return data;
  }

  validate(data: FundamentusData): boolean {
    // Basic validation - check if we got at least some data
    return data.ticker !== '' && (data.cotacao > 0 || data.pl !== 0 || data.pvp !== 0);
  }
}
