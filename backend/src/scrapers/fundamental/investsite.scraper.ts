import { Injectable } from '@nestjs/common';
import { AbstractScraper } from '../base/abstract-scraper';
import { RateLimiterService } from '../rate-limiter.service'; // ✅ FASE 3
import * as cheerio from 'cheerio';

export interface InvestsiteData {
  ticker: string;
  companyName: string;
  price: number;
  pl: number; // P/L
  pvp: number; // P/VP
  roe: number; // ROE
  dy: number; // Dividend Yield
  evEbitda: number; // EV/EBITDA
  liquidezCorrente: number; // Liquidez Corrente
  margemLiquida: number; // Margem Líquida
  margemBruta: number; // Margem Bruta
  margemOperacional: number; // Margem Operacional
  receitaLiquida: number; // Receita Líquida
  lucroLiquido: number; // Lucro Líquido
  patrimonioLiquido: number; // Patrimônio Líquido
}

@Injectable()
export class InvestsiteScraper extends AbstractScraper<InvestsiteData> {
  readonly name = 'Investsite Scraper';
  readonly source = 'investsite';
  readonly requiresLogin = false; // Site público
  readonly baseUrl = 'https://www.investsite.com.br'; // ✅ FASE 3

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

  protected async scrapeData(ticker: string): Promise<InvestsiteData> {
    // ✅ FII Support: Investsite uses different page for FIIs
    // Stocks: principais_indicadores.php?cod_negociacao=TICKER
    // FIIs: fii_indicadores.php?cod_negociacao=TICKER
    const page = this.isFII(ticker) ? 'fii_indicadores.php' : 'principais_indicadores.php';
    const url = `https://www.investsite.com.br/${page}?cod_negociacao=${ticker.toUpperCase()}`;

    try {
      // Navegar para a página do ativo
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: this.config.timeout });

      // Aguardar conteúdo carregar
      await this.page
        .waitForSelector('table, .tabela, h1', {
          timeout: 10000,
        })
        .catch(() => {
          this.logger.warn('Main content selector not found, continuing anyway');
        });

      // Obter HTML da página
      const content = await this.page.content();
      const $ = cheerio.load(content);

      // Função auxiliar para extrair valores numéricos
      const getValue = (textOrElement: string | cheerio.Cheerio<any>, attr?: string): number => {
        let text: string;

        // Se recebeu um texto diretamente
        if (typeof textOrElement === 'string') {
          text = textOrElement;
        }
        // Se recebeu um seletor CSS ou elemento Cheerio
        else {
          try {
            if (attr) {
              text = textOrElement.attr(attr) || '0';
            } else {
              text = textOrElement.text().trim();
            }
          } catch (error) {
            // Se falhar, retornar 0
            return 0;
          }
        }

        // Limpar texto
        text = text
          .replace(/\./g, '') // Remover pontos (milhares)
          .replace(',', '.') // Vírgula para ponto decimal
          .replace('%', '') // Remover %
          .replace('R$', '') // Remover R$
          .replace(/[^\d.-]/g, '') // Remover caracteres não numéricos
          .trim();

        return parseFloat(text) || 0;
      };

      // Função para buscar valor em tabela por label de linha
      const getValueFromTable = (label: string): number => {
        // Investsite usa tabelas HTML tradicionais
        // Procurar células que contenham o label no texto
        const labelCells = $('td, th').filter(function () {
          const text = $(this).text().trim();
          return text === label || text.includes(label);
        });

        if (labelCells.length > 0) {
          // Tentar pegar o próximo <td>
          const valueCell = labelCells.first().next('td');
          if (valueCell.length > 0) {
            const text = valueCell.text().trim();
            return getValue(text);
          }
        }

        // Tentar formato alternativo: procurar <tr> que contenha o label
        const rows = $('tr').filter(function () {
          return $(this).text().includes(label);
        });

        if (rows.length > 0) {
          const cells = rows.first().find('td');
          if (cells.length >= 2) {
            // Assumir que valor está na segunda célula
            const text = cells.eq(1).text().trim();
            return getValue(text);
          }
        }

        return 0;
      };

      // Extrair nome da empresa (geralmente está no título ou cabeçalho)
      const companyName =
        $('h1').first().text().trim().replace(ticker.toUpperCase(), '').trim() ||
        $('h2').first().text().trim() ||
        $('.nome-empresa').text().trim() ||
        ticker.toUpperCase();

      // Extrair preço (pode estar em destaque)
      const price =
        getValueFromTable('Cotação') ||
        getValueFromTable('Preço') ||
        getValueFromTable('Último') ||
        getValue('.preco-atual') ||
        getValue('.cotacao') ||
        0;

      // Construir objeto de dados
      const data: InvestsiteData = {
        ticker: ticker.toUpperCase(),
        companyName,
        price,

        // Indicadores de Valuation
        pl:
          getValueFromTable('P/L') ||
          getValueFromTable('P / L') ||
          getValueFromTable('Preço/Lucro'),

        pvp:
          getValueFromTable('P/VP') ||
          getValueFromTable('P / VP') ||
          getValueFromTable('Preço/Valor Patrimonial'),

        evEbitda:
          getValueFromTable('EV/EBITDA') ||
          getValueFromTable('EV / EBITDA') ||
          getValueFromTable('Enterprise Value / EBITDA'),

        // Indicadores de Rentabilidade
        roe:
          getValueFromTable('ROE') ||
          getValueFromTable('Return on Equity') ||
          getValueFromTable('Retorno sobre Patrimônio'),

        margemLiquida:
          getValueFromTable('Margem Líquida') ||
          getValueFromTable('Margem Liq.') ||
          getValueFromTable('ML'),

        margemBruta: getValueFromTable('Margem Bruta') || getValueFromTable('MB'),

        margemOperacional:
          getValueFromTable('Margem Operacional') ||
          getValueFromTable('Margem EBIT') ||
          getValueFromTable('MO'),

        // Indicadores de Dividendos
        dy:
          getValueFromTable('Dividend Yield') ||
          getValueFromTable('DY') ||
          getValueFromTable('Rendimento de Dividendos'),

        // Indicadores de Liquidez
        liquidezCorrente:
          getValueFromTable('Liquidez Corrente') ||
          getValueFromTable('Liq. Corrente') ||
          getValueFromTable('LC'),

        // Indicadores Financeiros (valores absolutos)
        receitaLiquida:
          getValueFromTable('Receita Líquida') ||
          getValueFromTable('Receita') ||
          getValueFromTable('Faturamento'),

        lucroLiquido:
          getValueFromTable('Lucro Líquido') ||
          getValueFromTable('Lucro') ||
          getValueFromTable('LL'),

        patrimonioLiquido:
          getValueFromTable('Patrimônio Líquido') ||
          getValueFromTable('PL') ||
          getValueFromTable('Equity'),
      };

      this.logger.log(`Successfully scraped ${ticker} from Investsite`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to scrape ${ticker} from Investsite: ${error.message}`);
      throw error;
    }
  }

  validate(data: InvestsiteData): boolean {
    // Validação básica - verificar se obtivemos pelo menos alguns dados
    return (
      data.ticker !== '' && (data.price > 0 || data.pl !== 0 || data.pvp !== 0 || data.roe !== 0)
    );
  }

  protected async login(): Promise<void> {
    // Investsite é um site público, não requer login
    this.logger.log('Investsite scraper running without login (public site)');
  }
}
