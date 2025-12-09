import { Injectable } from '@nestjs/common';
import { AbstractScraper } from '../base/abstract-scraper';
import { RateLimiterService } from '../rate-limiter.service'; // ✅ FASE 3
import * as cheerio from 'cheerio';

export interface FundamentusData {
  ticker: string;
  sector: string; // Setor de atuação
  subsetor: string; // Subsetor
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
  // Per Share Data - FASE LPA/VPA
  lpa: number; // Lucro por Ação
  vpa: number; // Valor Patrimonial por Ação
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

  /**
   * Detect if ticker is a FII (Fundo Imobiliário)
   * FIIs typically end with "11" and have 6-7 characters (e.g., BRCR11, KNRI11, BTLG11)
   */
  private isFII(ticker: string): boolean {
    const upperTicker = ticker.toUpperCase();
    return upperTicker.endsWith('11') && upperTicker.length >= 5 && upperTicker.length <= 7;
  }

  protected async scrapeData(ticker: string): Promise<FundamentusData> {
    // ✅ FII Support: Fundamentus uses different page for FIIs
    // Stocks: detalhes.php?papel=TICKER
    // FIIs: fii_detalhes.php?papel=TICKER
    const page = this.isFII(ticker) ? 'fii_detalhes.php' : 'detalhes.php';
    const url = `https://www.fundamentus.com.br/${page}?papel=${ticker.toUpperCase()}`;

    // IMPORTANTE: Usar 'load' em vez de 'networkidle' para evitar timeout
    // O 'networkidle' aguarda todas as requisições (incluindo analytics lentos)
    // causando timeout de 3min. O Python scraper usa 'load' e funciona em ~10s.
    await this.page.goto(url, { waitUntil: 'load', timeout: this.config.timeout });

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

    // Get text value (for sector, subsetor, etc.)
    const getTextValue = (label: string): string => {
      return $(`td:contains("${label}")`)
        .next('td')
        .text()
        .trim();
    };

    // Extract sector and subsetor from Fundamentus
    // Fundamentus has "Setor" and "Subsetor" fields in the company info table
    const sector = getTextValue('Setor') || '';
    const subsetor = getTextValue('Subsetor') || '';

    const data: FundamentusData = {
      ticker: ticker.toUpperCase(),
      sector,
      subsetor,
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
      // Per Share Data - FASE LPA/VPA
      lpa: getValue('LPA'),
      vpa: getValue('VPA'),
    };

    return data;
  }

  validate(data: FundamentusData): boolean {
    // Basic validation - check if we got at least some data
    return data.ticker !== '' && (data.cotacao > 0 || data.pl !== 0 || data.pvp !== 0);
  }
}
