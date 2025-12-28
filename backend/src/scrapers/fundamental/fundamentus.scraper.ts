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

    // FASE 144 DEBUG: Save HTML to file for analysis
    if (ticker === 'PETR4') {
      const fs = require('fs');
      const path = require('path');
      const debugPath = path.join(process.cwd(), '..', 'fundamentus_petr4_debug.html');
      fs.writeFileSync(debugPath, content, 'utf8');
      this.logger.log(`[FUNDAMENTUS-TS] Saved HTML to ${debugPath}`);
    }

    const $ = cheerio.load(content);

    // FASE 144 BUGFIX: Rewritten to use exact label matching (like Python scraper)
    // Old approach used :contains() which matched "P/EBIT" when searching for "EBIT"
    const getValue = (label: string): number => {
      let rawText = '';
      const allLabelsFound: string[] = [];  // FASE 144 ULTRA-DEBUG

      // Find exact label match using table navigation (like Python BeautifulSoup)
      $('table.w728').each((_, table) => {
        $(table).find('tr').each((__, row) => {
          const cells = $(row).find('td');

          // FASE 144 CRITICAL FIX: Fundamentus has structure: value(3m) | label | value(12m)
          // We need to find labels and get the value AFTER them (12-month data)
          for (let i = 0; i < cells.length; i++) {
            const labelCell = $(cells[i]).find('.txt').text().trim();
            if (labelCell) allLabelsFound.push(labelCell);  // FASE 144 ULTRA-DEBUG

            // EXACT match (case-insensitive, normalized)
            const normalizedLabel = labelCell.toLowerCase().replace('?', '').trim();
            const searchLabel = label.toLowerCase().replace('?', '').trim();

            if (normalizedLabel === searchLabel) {
              // Get the NEXT cell (12-month value), NOT the previous cell (3-month value)
              if (i + 1 < cells.length) {
                const valueCell = $(cells[i + 1]);

                // FASE 144 ULTRA-DEBUG: Log cell structure for financial fields
                if (label === 'Receita Líquida' || label === 'Lucro Líquido' || label === 'EBIT') {
                  this.logger.log(`[FUNDAMENTUS-TS] Found "${label}" at cell ${i}, getting value from cell ${i+1}`);
                  this.logger.log(`[FUNDAMENTUS-TS] Cell ${i+1} HTML: ${valueCell.html()}`);
                }

                rawText = valueCell.find('.txt').text().trim();
                return false; // Break out of loop
              }
            }
          }
        });

        if (rawText) return false; // Break out of table loop
      });

      // FASE 144 ULTRA-DEBUG: If not found, log all labels
      if (!rawText && (label === 'Receita Líquida' || label === 'Lucro Líquido' || label === 'EBIT')) {
        this.logger.warn(`[FUNDAMENTUS-TS] Label "${label}" NOT FOUND. All labels found in tables: ${JSON.stringify(allLabelsFound.slice(0, 50))}`);
      }

      if (!rawText) {
        this.logger.debug(`[FUNDAMENTUS-TS] Label "${label}" not found in tables`);
        return 0;
      }

      // FASE 144 DEBUG: Log raw extractions for critical fields
      if (label === 'Receita Líquida' || label === 'Lucro Líquido' || label === 'EBIT') {
        this.logger.debug(`[FUNDAMENTUS-TS] "${label}" raw HTML text: "${rawText}"`);
      }

      const text = rawText
        .replace('R$', '')
        .replace('%', '')
        .trim();

      // FASE 144 BUGFIX: Handle Brazilian number format correctly
      // "1.234.567,89" → 1234567.89
      // "1,5 Bi" → 1500000000
      let value = text;
      let multiplier = 1;

      // Handle magnitude suffixes (case-insensitive)
      const lowerText = text.toLowerCase();
      if (lowerText.includes(' bi') || lowerText.endsWith('bi')) {
        multiplier = 1_000_000_000;
        value = value.replace(/\s*bi\s*/gi, '');
      } else if (lowerText.includes(' mi') || lowerText.endsWith('mi')) {
        multiplier = 1_000_000;
        value = value.replace(/\s*mi\s*/gi, '');
      } else if (lowerText.includes(' k') || lowerText.endsWith('k')) {
        multiplier = 1_000;
        value = value.replace(/\s*k\s*/gi, '');
      }

      // Brazilian format: remove thousand separators (dots) and convert decimal (comma to dot)
      value = value.replace(/\./g, '').replace(',', '.');

      const parsed = parseFloat(value) * multiplier;

      // FASE 144: Reject scientifically improbable values
      if (parsed > 1e20 || isNaN(parsed)) {
        this.logger.warn(`[FUNDAMENTUS-TS] Suspicious value for "${label}": text="${text}" → parsed=${parsed.toExponential()}`);
        return 0;  // Return 0 for invalid values (will be filtered by cross-validation)
      }

      return parsed || 0;
    };

    // Get text value (for sector, subsetor, etc.) - EXACT match like getValue()
    const getTextValue = (label: string): string => {
      let rawText = '';

      // Find exact label match using table navigation
      $('table.w728').each((_, table) => {
        $(table).find('tr').each((__, row) => {
          const cells = $(row).find('td');

          // Process in pairs
          for (let i = 0; i < cells.length - 1; i += 2) {
            const labelCell = $(cells[i]).find('.txt').text().trim();

            // EXACT match (case-insensitive)
            if (labelCell.toLowerCase() === label.toLowerCase()) {
              // For text values, check for links first, then .txt
              const valueCell = $(cells[i + 1]);
              const linkText = valueCell.find('a').text().trim();
              if (linkText) {
                rawText = linkText;
              } else {
                rawText = valueCell.find('.txt').text().trim();
              }
              return false; // Break
            }
          }
        });

        if (rawText) return false; // Break
      });

      return rawText;
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
      liquidezCorrente: getValue('Liquidez Corr'),
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
