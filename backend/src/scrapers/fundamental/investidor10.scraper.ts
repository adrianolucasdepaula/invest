import { Injectable } from '@nestjs/common';
import { AbstractScraper } from '../base/abstract-scraper';
import { RateLimiterService } from '../rate-limiter.service'; // ✅ FASE 3
import * as cheerio from 'cheerio';

export interface Investidor10Data {
  ticker: string;
  companyName: string;
  price: number;
  minPrice52w: number;
  maxPrice52w: number;
  volume: number;
  valorMercado: number;
  valorFirma: number;
  numeroAcoes: number;

  // Valuation
  pl: number;
  pvp: number;
  psr: number;
  pAtivos: number;
  pCapitalGiro: number;
  pEbit: number;
  pAtivosCircLiq: number;
  evEbit: number;
  evEbitda: number;
  pegRatio: number;

  // Dividends
  dy: number;
  payout: number;

  // Profitability
  margemBruta: number;
  margemEbit: number;
  margemLiquida: number;
  roe: number;
  roa: number;
  roic: number;
  giroAtivos: number;

  // Debt
  dividaLiquidaPL: number;
  dividaLiquidaEbit: number;
  plSobreAtivos: number;
  passivosAtivos: number;
  liquidezCorrente: number;

  // Growth
  cagr5anos: number;

  // Financial Data
  receitaLiquida: number;
  ebit: number;
  lucroLiquido: number;
}

@Injectable()
export class Investidor10Scraper extends AbstractScraper<Investidor10Data> {
  readonly name = 'Investidor10 Scraper';
  readonly source = 'investidor10';
  readonly requiresLogin = false;
  readonly baseUrl = 'https://investidor10.com.br'; // ✅ FASE 3

  constructor(rateLimiter: RateLimiterService) {
    super();
    this.rateLimiter = rateLimiter; // ✅ FASE 3
  }

  protected async scrapeData(ticker: string): Promise<Investidor10Data> {
    const url = `https://investidor10.com.br/acoes/${ticker.toLowerCase()}/`;

    await this.page.goto(url, { waitUntil: 'networkidle', timeout: this.config.timeout });

    // Wait for main content
    await this.page.waitForSelector('._card', { timeout: 10000 }).catch(() => {});

    const content = await this.page.content();
    const $ = cheerio.load(content);

    const cleanValue = (text: string): number => {
      if (!text) return 0;

      text = text
        .replace(/\./g, '')
        .replace(',', '.')
        .replace('%', '')
        .replace('R$', '')
        .replace(/\s/g, '')
        .replace(/[^\d.-]/g, '')
        .trim();

      const num = parseFloat(text);
      return isNaN(num) ? 0 : num;
    };

    const getValueByLabel = (label: string): number => {
      const element = $(`.info ._card:contains("${label}")`).find('._card-body span').first();
      return cleanValue(element.text());
    };

    const getIndicatorValue = (label: string): number => {
      let value = 0;

      // Try different selectors
      $('._card-header').each((i, elem) => {
        if ($(elem).text().includes(label)) {
          value = cleanValue($(elem).next('._card-body').find('span').first().text());
          return false; // break
        }
      });

      if (value === 0) {
        value = cleanValue($(`td:contains("${label}")`).next('td').text());
      }

      return value;
    };

    // Get company name and price
    const companyName =
      $('.symbol-name').text().trim() || $('h1').first().text().trim() || ticker.toUpperCase();

    const priceText =
      $('.cotacao').text() || $('.value').first().text() || $('[data-type="price"]').text();
    const price = cleanValue(priceText);

    const data: Investidor10Data = {
      ticker: ticker.toUpperCase(),
      companyName,
      price,

      // Price range
      minPrice52w: getIndicatorValue('Mínima 52 sem') || getIndicatorValue('Min 52'),
      maxPrice52w: getIndicatorValue('Máxima 52 sem') || getIndicatorValue('Max 52'),
      volume: getIndicatorValue('Volume') || getIndicatorValue('Vol. Médio'),

      // Market data
      valorMercado: getIndicatorValue('Valor de mercado') || getIndicatorValue('Val. Mercado'),
      valorFirma: getIndicatorValue('Valor da firma') || getIndicatorValue('Enterprise Value'),
      numeroAcoes: getIndicatorValue('Nro. Ações') || getIndicatorValue('Ações'),

      // Valuation
      pl: getIndicatorValue('P/L') || getIndicatorValue('Preço/Lucro'),
      pvp: getIndicatorValue('P/VP') || getIndicatorValue('Preço/VPA'),
      psr: getIndicatorValue('PSR') || getIndicatorValue('P/Receita'),
      pAtivos: getIndicatorValue('P/Ativos') || getIndicatorValue('P/Ativo'),
      pCapitalGiro: getIndicatorValue('P/Cap. Giro') || getIndicatorValue('P/Capital de Giro'),
      pEbit: getIndicatorValue('P/EBIT'),
      pAtivosCircLiq: getIndicatorValue('P/Ativ Circ Liq') || getIndicatorValue('P/ACL'),
      evEbit: getIndicatorValue('EV/EBIT') || getIndicatorValue('EV / EBIT'),
      evEbitda: getIndicatorValue('EV/EBITDA') || getIndicatorValue('EV / EBITDA'),
      pegRatio: getIndicatorValue('PEG Ratio') || getIndicatorValue('PEG'),

      // Dividends
      dy: getIndicatorValue('Div. Yield') || getIndicatorValue('DY'),
      payout: getIndicatorValue('Payout'),

      // Profitability
      margemBruta: getIndicatorValue('Margem Bruta') || getIndicatorValue('M. Bruta'),
      margemEbit: getIndicatorValue('Margem EBIT') || getIndicatorValue('M. EBIT'),
      margemLiquida: getIndicatorValue('Margem Líquida') || getIndicatorValue('M. Líquida'),
      roe: getIndicatorValue('ROE'),
      roa: getIndicatorValue('ROA'),
      roic: getIndicatorValue('ROIC'),
      giroAtivos: getIndicatorValue('Giro Ativos'),

      // Debt
      dividaLiquidaPL: getIndicatorValue('Dív. Líq./PL') || getIndicatorValue('Dív Liq/Pat'),
      dividaLiquidaEbit: getIndicatorValue('Dív. Líq./EBIT') || getIndicatorValue('Dív Liq/EBIT'),
      plSobreAtivos: getIndicatorValue('PL/Ativos') || getIndicatorValue('Pat Liq/Ativos'),
      passivosAtivos: getIndicatorValue('Passivos/Ativos') || getIndicatorValue('Pass/Ativos'),
      liquidezCorrente:
        getIndicatorValue('Liquidez Corrente') || getIndicatorValue('Liq. Corrente'),

      // Growth
      cagr5anos: getIndicatorValue('CAGR Receitas 5 anos') || getIndicatorValue('CAGR 5a'),

      // Financial Data
      receitaLiquida: getIndicatorValue('Receita Líquida') || getIndicatorValue('Rec. Líquida'),
      ebit: getIndicatorValue('EBIT'),
      lucroLiquido: getIndicatorValue('Lucro Líquido') || getIndicatorValue('Lucro Liq'),
    };

    return data;
  }

  validate(data: Investidor10Data): boolean {
    // ✅ FASE 5.2: Validação mais permissiva para aceitar dados parciais
    // Aceita se ticker existe E pelo menos 1 indicador válido (não zero)
    if (!data.ticker) return false;

    const hasValidPrice = data.price > 0;
    const hasValidValuation = data.pl !== 0 || data.pvp !== 0 || data.psr !== 0;
    const hasValidFinancials = data.receitaLiquida !== 0 || data.ebit !== 0 || data.lucroLiquido !== 0;
    const hasValidMarket = data.valorMercado !== 0 || data.volume !== 0;

    return hasValidPrice || hasValidValuation || hasValidFinancials || hasValidMarket;
  }

  protected async login(): Promise<void> {
    this.logger.log('Investidor10 scraper running without login');
  }
}
