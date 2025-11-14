import { Injectable } from '@nestjs/common';
import { AbstractScraper } from '../base/abstract-scraper';
import { GoogleAuthHelper } from '../auth/google-auth.helper';
import * as cheerio from 'cheerio';
import * as path from 'path';

export interface FundamenteiData {
  ticker: string;
  companyName: string;
  price: number;
  pl: number;           // P/L
  pvp: number;          // P/VP
  roe: number;          // ROE
  dy: number;           // Dividend Yield
  dividaLiquidaEbitda: number;  // Dívida Líquida/EBITDA
  margemLiquida: number;        // Margem Líquida
  valorMercado: number;         // Valor de Mercado
  receitaLiquida: number;       // Receita Líquida
  lucroLiquido: number;         // Lucro Líquido
}

@Injectable()
export class FundamenteiScraper extends AbstractScraper<FundamenteiData> {
  readonly name = 'Fundamentei Scraper';
  readonly source = 'fundamentei';
  readonly requiresLogin = true;

  private readonly cookiesPath = path.join(
    process.cwd(),
    'data',
    'cookies',
    'fundamentei_session.json'
  );

  protected async scrapeData(ticker: string): Promise<FundamenteiData> {
    // URL do Fundamentei para o ticker
    const url = `https://fundamentei.com/acoes/${ticker.toUpperCase()}`;

    try {
      // Tentar carregar sessão OAuth salva
      const sessionLoaded = await GoogleAuthHelper.loadSession(this.page, this.cookiesPath);

      if (sessionLoaded) {
        this.logger.log('Loaded existing Fundamentei OAuth session from cookies');
      } else {
        this.logger.warn('No OAuth session found - manual OAuth login required via /oauth-manager');
        this.logger.warn('Please complete OAuth login at http://localhost:3100/oauth-manager');
      }

      // Navegar para a página do ativo
      await this.page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeout });

      // Verificar se está logado (se não redirecionar para login)
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/sign-up')) {
        throw new Error(
          'Not authenticated - Please complete OAuth login at http://localhost:3100/oauth-manager'
        );
      }

      // Aguardar conteúdo carregar
      await this.page.waitForSelector('.company-info, .stock-header, h1', {
        timeout: 15000
      }).catch(() => {
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
        // Se recebeu um elemento Cheerio
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
          .replace(/\./g, '')           // Remover pontos (milhares)
          .replace(',', '.')            // Vírgula para ponto decimal
          .replace('%', '')             // Remover %
          .replace('R$', '')            // Remover R$
          .replace(/[^\d.-]/g, '')      // Remover caracteres não numéricos
          .trim();

        return parseFloat(text) || 0;
      };

      // Função para buscar valor por label
      const getValueByLabel = (label: string): number => {
        // Tentar múltiplos seletores comuns do Fundamentei
        // Procurar elementos que contenham o label no texto
        const elements = $('dt, div, span, td, th').filter(function() {
          return $(this).text().trim() === label ||
                 $(this).text().trim().includes(label);
        });

        if (elements.length > 0) {
          // Tentar pegar o próximo elemento (irmão ou filho)
          const nextElement = elements.first().next();
          if (nextElement.length > 0) {
            const text = nextElement.text().trim();
            const value = getValue(text);
            if (value !== 0) return value;
          }

          // Tentar pegar elemento filho com classe .value
          const valueChild = elements.first().find('.value, [class*="value"]');
          if (valueChild.length > 0) {
            const text = valueChild.text().trim();
            const value = getValue(text);
            if (value !== 0) return value;
          }
        }

        return 0;
      };

      // Extrair nome da empresa
      const companyName =
        $('h1').first().text().trim() ||
        $('.company-name').text().trim() ||
        $('.stock-header h1').text().trim() ||
        ticker.toUpperCase();

      // Extrair preço atual
      const price =
        getValue('.current-price') ||
        getValue('.stock-price') ||
        getValue('[data-price]') ||
        getValue('.price-value') ||
        0;

      // Construir objeto de dados
      const data: FundamenteiData = {
        ticker: ticker.toUpperCase(),
        companyName,
        price,

        // Indicadores fundamentalistas
        pl: getValueByLabel('P/L') ||
            getValueByLabel('P / L') ||
            getValueByLabel('Preço / Lucro'),

        pvp: getValueByLabel('P/VP') ||
             getValueByLabel('P / VP') ||
             getValueByLabel('Preço / Valor Patrimonial'),

        roe: getValueByLabel('ROE') ||
             getValueByLabel('Return on Equity'),

        dy: getValueByLabel('DY') ||
            getValueByLabel('Dividend Yield') ||
            getValueByLabel('Dividendos'),

        dividaLiquidaEbitda: getValueByLabel('Dívida Líquida / EBITDA') ||
                             getValueByLabel('Dív. Líq. / EBITDA'),

        margemLiquida: getValueByLabel('Margem Líquida') ||
                       getValueByLabel('Margem Liq.'),

        valorMercado: getValueByLabel('Valor de Mercado') ||
                      getValueByLabel('Market Cap'),

        receitaLiquida: getValueByLabel('Receita Líquida') ||
                        getValueByLabel('Receita'),

        lucroLiquido: getValueByLabel('Lucro Líquido') ||
                      getValueByLabel('Lucro'),
      };

      this.logger.log(`Successfully scraped ${ticker} from Fundamentei`);
      return data;

    } catch (error) {
      this.logger.error(`Failed to scrape ${ticker} from Fundamentei: ${error.message}`);
      throw error;
    }
  }

  validate(data: FundamenteiData): boolean {
    // Validação relaxada - verificar se obtivemos pelo menos 3 campos válidos (além do ticker)
    const filledFields = [
      data.price > 0,
      data.pl !== 0,
      data.pvp !== 0,
      data.roe !== 0,
      data.dy !== 0,
      data.dividaLiquidaEbitda !== 0,
      data.margemLiquida !== 0,
      data.valorMercado > 0,
      data.receitaLiquida > 0,
      data.lucroLiquido !== 0
    ].filter(Boolean).length;

    return data.ticker !== '' && filledFields >= 3;
  }

  protected async login(): Promise<void> {
    try {
      // Tentar carregar sessão OAuth salva pelos cookies do Python OAuth Manager
      const sessionLoaded = await GoogleAuthHelper.loadSession(this.page, this.cookiesPath);

      if (sessionLoaded) {
        this.logger.log('Loaded Fundamentei OAuth session from cookies');

        // Verificar se a sessão ainda é válida navegando para a home
        await this.page.goto('https://fundamentei.com/', {
          waitUntil: 'networkidle2',
          timeout: 15000
        });

        const url = this.page.url();
        if (!url.includes('/login') && !url.includes('/sign-up')) {
          this.logger.log('Fundamentei OAuth session is valid');
          return;
        }
      }

      // Se chegou aqui, não tem sessão válida
      this.logger.warn('='.repeat(80));
      this.logger.warn('NO VALID OAUTH SESSION FOUND FOR FUNDAMENTEI');
      this.logger.warn('Please complete OAuth login process:');
      this.logger.warn('1. Open: http://localhost:3100/oauth-manager');
      this.logger.warn('2. Click "Iniciar Renovação de Sessões OAuth"');
      this.logger.warn('3. Follow the instructions in the VNC viewer');
      this.logger.warn('4. After completing, cookies will be saved automatically');
      this.logger.warn('='.repeat(80));

      throw new Error('OAuth session required - Please use /oauth-manager to authenticate');

    } catch (error) {
      this.logger.error(`Fundamentei login failed: ${error.message}`);
      throw error;
    }
  }
}
