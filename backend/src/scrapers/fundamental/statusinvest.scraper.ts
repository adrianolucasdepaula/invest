import { Injectable } from '@nestjs/common';
import { AbstractScraper } from '../base/abstract-scraper';
import { RateLimiterService } from '../rate-limiter.service'; // ✅ FASE 3
import * as cheerio from 'cheerio';

export interface StatusInvestData {
  ticker: string;
  companyName: string;
  sector: string; // Setor da empresa
  segment: string; // Segmento da empresa
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
  readonly baseUrl = 'https://statusinvest.com.br'; // ✅ FASE 3

  constructor(rateLimiter: RateLimiterService) {
    super();
    this.rateLimiter = rateLimiter; // ✅ FASE 3
  }

  /**
   * Detect if ticker is a FII (Fundo Imobiliário)
   * FIIs typically end with "11" and have 6-7 characters (e.g., BRCR11, KNRI11, BTLG11)
   */
  private isFII(ticker: string): boolean {
    const upperTicker = ticker.toUpperCase();
    return upperTicker.endsWith('11') && upperTicker.length >= 5 && upperTicker.length <= 7;
  }

  protected async scrapeData(ticker: string): Promise<StatusInvestData> {
    // ✅ FII Support: Use correct URL path based on asset type
    const assetType = this.isFII(ticker) ? 'fundos-imobiliarios' : 'acoes';
    const url = `https://statusinvest.com.br/${assetType}/${ticker.toLowerCase()}`;

    // Using 'load' instead of 'networkidle' - StatusInvest loads many analytics scripts that cause timeout
    await this.page.goto(url, { waitUntil: 'load', timeout: 60000 });

    // Wait for indicators section to load
    await this.page.waitForSelector('h3', { timeout: 15000 }).catch(() => {});

    const content = await this.page.content();
    const $ = cheerio.load(content);

    // Helper to clean and parse numeric values
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
      return parseFloat(text) || 0;
    };

    // StatusInvest 2024-12 structure: h3 (label) in link, strong (value) in sibling container
    const getIndicatorValue = (label: string): number => {
      // Find h3 elements that contain the label
      const h3Elements = $('h3').filter(function () {
        const text = $(this).text().trim();
        return text === label || text.startsWith(label);
      });

      if (h3Elements.length > 0) {
        // Navigate up to find the container with strong value
        // Structure: grandparent > (link with h3) + (sibling div with strong)
        const grandparent = h3Elements.first().parent().parent();
        const strongValue = grandparent.find('strong').first();
        if (strongValue.length > 0) {
          return cleanValue(strongValue.text().trim());
        }
        // Fallback: try parent's siblings
        const parent = h3Elements.first().parent();
        const siblingStrong = parent.siblings().find('strong').first();
        if (siblingStrong.length > 0) {
          return cleanValue(siblingStrong.text().trim());
        }
      }
      return 0;
    };

    // Get company name from h1
    const companyName = $('h1').first().text().trim().split(' - ')[0] || ticker.toUpperCase();

    // Get price from the "Valor atual" section
    let price = 0;
    const valorAtualH3 = $('h3:contains("Valor atual")');
    if (valorAtualH3.length > 0) {
      const priceStrong = valorAtualH3.parent().find('strong').first();
      price = cleanValue(priceStrong.text());
    }

    // Get sector from "Setor de Atuação" link
    let sector = '';
    let segment = '';
    const sectorLink = $('a[href*="/setor/"]').first();
    if (sectorLink.length > 0) {
      sector = sectorLink.find('strong').text().trim() || sectorLink.text().trim();
    }
    const segmentLink = $('a[href*="/segmento/"]').first();
    if (segmentLink.length > 0) {
      segment = segmentLink.find('strong').text().trim() || segmentLink.text().trim();
    }

    // Clean sector/segment text
    const cleanText = (text: string): string => {
      return text
        .replace(/arrow_forward|arrow_back/gi, '')
        .replace(/[\n\r\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };
    sector = cleanText(sector);
    segment = cleanText(segment);

    const data: StatusInvestData = {
      ticker: ticker.toUpperCase(),
      companyName,
      sector,
      segment,
      price,

      // Valuation indicators (from INDICADORES section)
      dy: getIndicatorValue('D.Y'),
      pl: getIndicatorValue('P/L'),
      pvp: getIndicatorValue('P/VP'),
      psr: getIndicatorValue('P/SR'),
      pAtivos: getIndicatorValue('P/Ativo'),
      pCapGiro: getIndicatorValue('P/Cap. Giro'),
      pEbit: getIndicatorValue('P/EBIT'),
      pAtivCircLiq: getIndicatorValue('P/Ativo Circ. Liq.'),
      evEbit: getIndicatorValue('EV/EBIT'),
      evEbitda: getIndicatorValue('EV/EBITDA'),

      // Efficiency indicators
      margemEbit: getIndicatorValue('M. EBIT'),
      margemLiquida: getIndicatorValue('M. Líquida'),
      liquidezCorr: getIndicatorValue('Liq. corrente'),
      roic: getIndicatorValue('ROIC'),
      roe: getIndicatorValue('ROE'),

      // Liquidity (from header section)
      liquidez2meses: 0, // Not visible in current structure

      // Financial data (from company info section)
      patrimonioLiq: getIndicatorValue('Patrimônio líquido'),
      dividaBruta: getIndicatorValue('Dívida bruta'),
      disponibilidades: getIndicatorValue('Disponibilidade'),
      ativoTotal: getIndicatorValue('Ativos'),
      receitaLiquida: 0, // In DRE section, complex to extract
      ebit: 0, // In DRE section, complex to extract
      lucroLiquido: 0, // In DRE section, complex to extract

      // Market data
      valorMercado: getIndicatorValue('Valor de mercado'),
      valorFirma: getIndicatorValue('Valor de firma'),
      numeroAcoes: getIndicatorValue('Nº total de papéis'),
    };

    this.logger.debug(`[STATUSINVEST] Extracted: ${JSON.stringify(data)}`);
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
