import { Injectable } from '@nestjs/common';
import { AbstractScraper } from '../base/abstract-scraper';
import * as cheerio from 'cheerio';

export interface StatusInvestData {
  ticker: string;
  companyName: string;
  price: number;
  dy: number;
  pl: number;
  pvp: number;
  psr: number;
  pAtivos: number;
  pCapGiro: number;
  pEbit: number;
  pAtivCircLiq: number;
  evEbit: number;
  evEbitda: number;
  margemEbit: number;
  margemLiquida: number;
  liquidezCorr: number;
  roic: number;
  roe: number;
  liquidez2meses: number;
  patrimonioLiq: number;
  dividaBruta: number;
  disponibilidades: number;
  ativoTotal: number;
  receitaLiquida: number;
  ebit: number;
  lucroLiquido: number;
  valorMercado: number;
  valorFirma: number;
  numeroAcoes: number;
}

@Injectable()
export class StatusInvestScraper extends AbstractScraper<StatusInvestData> {
  readonly name = 'StatusInvest Scraper';
  readonly source = 'statusinvest';
  readonly requiresLogin = false; // Pode funcionar sem login, mas com login tem mais dados

  protected async scrapeData(ticker: string): Promise<StatusInvestData> {
    const url = `https://statusinvest.com.br/acoes/${ticker.toLowerCase()}`;

    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeout });

    // Wait for main content to load
    await this.page.waitForSelector('.top-info', { timeout: 10000 }).catch(() => {
      // If element doesn't exist, continue anyway
    });

    const content = await this.page.content();
    const $ = cheerio.load(content);

    const getValue = (selector: string, attr?: string): number => {
      let text: string;
      if (attr) {
        text = $(selector).attr(attr) || '0';
      } else {
        text = $(selector).text().trim();
      }

      // Clean the text
      text = text
        .replace(/\./g, '')
        .replace(',', '.')
        .replace('%', '')
        .replace('R$', '')
        .replace(/\s/g, '')
        .trim();

      return parseFloat(text) || 0;
    };

    const getValueByLabel = (label: string): number => {
      const element = $(`strong:contains("${label}")`).parent().find('.value');
      return getValue(element.first().text());
    };

    // Get company name
    const companyName =
      $('.company-name').text().trim() || $('h1.lh-4').text().trim() || ticker.toUpperCase();

    // Get price
    const price = getValue('.value') || getValue('.top-info-price');

    const data: StatusInvestData = {
      ticker: ticker.toUpperCase(),
      companyName,
      price,

      // Valuation indicators
      dy: getValueByLabel('DY') || getValue('[title="Dividend Yield"]'),
      pl: getValueByLabel('P/L') || getValue('[title="Preço sobre Lucro"]'),
      pvp: getValueByLabel('P/VP') || getValue('[title="Preço sobre Valor Patrimonial"]'),
      psr: getValueByLabel('PSR') || getValue('[title="Price Sales Ratio"]'),
      pAtivos: getValueByLabel('P/ATIVOS') || getValue('[title="Preço sobre Ativos"]'),
      pCapGiro: getValueByLabel('P/CAP. GIRO') || getValue('[title="Preço sobre Capital de Giro"]'),
      pEbit: getValueByLabel('P/EBIT') || getValue('[title="Preço sobre EBIT"]'),
      pAtivCircLiq:
        getValueByLabel('P/ATIV CIRC LIQ') ||
        getValue('[title="Preço sobre Ativo Circulante Líquido"]'),
      evEbit: getValueByLabel('EV/EBIT') || getValue('[title="Enterprise Value sobre EBIT"]'),
      evEbitda: getValueByLabel('EV/EBITDA') || getValue('[title="Enterprise Value sobre EBITDA"]'),

      // Efficiency indicators
      margemEbit: getValueByLabel('M. EBIT') || getValue('[title="Margem EBIT"]'),
      margemLiquida: getValueByLabel('M. LÍQUIDA') || getValue('[title="Margem Líquida"]'),
      liquidezCorr: getValueByLabel('LIQ. CORR.') || getValue('[title="Liquidez Corrente"]'),
      roic: getValueByLabel('ROIC') || getValue('[title="Return on Invested Capital"]'),
      roe: getValueByLabel('ROE') || getValue('[title="Return on Equity"]'),

      // Liquidity
      liquidez2meses: getValueByLabel('LIQ. 2 MESES') || getValue('[title="Liquidez 2 meses"]'),

      // Financial data
      patrimonioLiq: getValueByLabel('PATRIM. LÍQ') || getValue('[title="Patrimônio Líquido"]'),
      dividaBruta: getValueByLabel('DÍV. BRUTA') || getValue('[title="Dívida Bruta"]'),
      disponibilidades:
        getValueByLabel('DISPONIBILIDADES') || getValue('[title="Disponibilidades"]'),
      ativoTotal: getValueByLabel('ATIVO') || getValue('[title="Ativo Total"]'),
      receitaLiquida: getValueByLabel('RECEITA LÍQUIDA') || getValue('[title="Receita Líquida"]'),
      ebit: getValueByLabel('EBIT') || getValue('[title="EBIT"]'),
      lucroLiquido: getValueByLabel('LUCRO LÍQUIDO') || getValue('[title="Lucro Líquido"]'),

      // Market data
      valorMercado: getValueByLabel('VALOR DE MERCADO') || getValue('[title="Valor de Mercado"]'),
      valorFirma: getValueByLabel('VALOR DA FIRMA') || getValue('[title="Valor da Firma"]'),
      numeroAcoes: getValueByLabel('NRO. AÇÕES') || getValue('[title="Número de Ações"]'),
    };

    return data;
  }

  validate(data: StatusInvestData): boolean {
    // Basic validation - check if we got at least some data
    return data.ticker !== '' && (data.price > 0 || data.pl !== 0 || data.pvp !== 0);
  }

  protected async login(): Promise<void> {
    // StatusInvest can work without login
    // If login is needed in the future, implement Google OAuth login here
    this.logger.log('StatusInvest scraper running without login');
  }
}
