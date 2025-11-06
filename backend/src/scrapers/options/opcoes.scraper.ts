import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractScraper } from '../base/abstract-scraper';

export interface OpcaoData {
  ticker: string;
  strike: number;
  tipo: 'CALL' | 'PUT';
  vencimento: Date;
  premium: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  intrinsicValue: number;
  timeValue: number;
}

export interface OpcoesData {
  ticker: string;
  precoAtivo: number;
  volatilidade: number;
  ivRank: number;
  proximoVencimento: Date;
  calls: OpcaoData[];
  puts: OpcaoData[];
}

@Injectable()
export class OpcoesScraper extends AbstractScraper<OpcoesData> {
  readonly name = 'Opções.net.br Scraper';
  readonly source = 'opcoes';
  readonly requiresLogin = true;

  private username: string;
  private password: string;

  constructor(private configService: ConfigService) {
    super();
    this.username = this.configService.get<string>('OPCOES_USERNAME');
    this.password = this.configService.get<string>('OPCOES_PASSWORD');
  }

  protected async login(): Promise<void> {
    try {
      this.logger.log('Logging in to Opções.net.br');

      await this.page.goto('https://opcoes.net.br/login', {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for login form
      await this.page.waitForSelector('input[name="username"], input[type="email"]', {
        timeout: 10000,
      });

      // Fill login form
      await this.page.type('input[name="username"], input[type="email"]', this.username);
      await this.page.type('input[name="password"], input[type="password"]', this.password);

      // Click login button
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        this.page.click('button[type="submit"], input[type="submit"]'),
      ]);

      // Verify login success
      const url = this.page.url();
      if (url.includes('login')) {
        throw new Error('Login failed - still on login page');
      }

      this.logger.log('Successfully logged in to Opções.net.br');
    } catch (error) {
      this.logger.error(`Failed to login to Opções.net.br: ${error.message}`);
      throw error;
    }
  }

  protected async scrapeData(ticker: string): Promise<OpcoesData> {
    const url = `https://opcoes.net.br/opcoes/bovespa/${ticker.toUpperCase()}`;

    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeout });

    // Wait for options table
    await this.page.waitForSelector('.options-table, .opcoes-table', {
      timeout: 10000,
    }).catch(() => {
      this.logger.warn('Options table not found');
    });

    const data = await this.page.evaluate(() => {
      const getNumber = (text: string): number => {
        if (!text) return 0;
        const cleaned = text.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
        return parseFloat(cleaned) || 0;
      };

      const getDate = (text: string): Date => {
        // Parse date in format DD/MM/YYYY
        const parts = text.split('/');
        if (parts.length === 3) {
          return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return new Date();
      };

      // Get asset price
      const priceElement = document.querySelector('.cotacao-atual, .preco-ativo');
      const precoAtivo = getNumber(priceElement?.textContent || '0');

      // Get volatility data
      const volElement = document.querySelector('.volatilidade, [data-field="volatility"]');
      const volatilidade = getNumber(volElement?.textContent || '0');

      const ivRankElement = document.querySelector('.iv-rank, [data-field="ivrank"]');
      const ivRank = getNumber(ivRankElement?.textContent || '0');

      // Get next expiration
      const expElement = document.querySelector('.proximo-vencimento, [data-field="expiration"]');
      const proximoVencimento = getDate(expElement?.textContent || '');

      // Parse options table
      const calls: any[] = [];
      const puts: any[] = [];

      document.querySelectorAll('.options-row, tr[data-option]').forEach((row: any) => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return;

        const opcao = {
          ticker: cells[0]?.textContent?.trim() || '',
          strike: getNumber(cells[1]?.textContent || '0'),
          tipo: cells[0]?.textContent?.includes('CALL') ? 'CALL' : 'PUT',
          vencimento: proximoVencimento,
          premium: getNumber(cells[2]?.textContent || '0'),
          bid: getNumber(cells[3]?.textContent || '0'),
          ask: getNumber(cells[4]?.textContent || '0'),
          volume: getNumber(cells[5]?.textContent || '0'),
          openInterest: getNumber(cells[6]?.textContent || '0'),
          impliedVolatility: getNumber(cells[7]?.textContent || '0'),
          delta: getNumber(cells[8]?.textContent || '0'),
          gamma: getNumber(cells[9]?.textContent || '0'),
          theta: getNumber(cells[10]?.textContent || '0'),
          vega: getNumber(cells[11]?.textContent || '0'),
          rho: getNumber(cells[12]?.textContent || '0'),
          intrinsicValue: 0,
          timeValue: 0,
        };

        if (opcao.tipo === 'CALL') {
          calls.push(opcao);
        } else {
          puts.push(opcao);
        }
      });

      return {
        precoAtivo,
        volatilidade,
        ivRank,
        proximoVencimento,
        calls,
        puts,
      };
    });

    return {
      ticker: ticker.toUpperCase(),
      ...data,
    };
  }

  validate(data: OpcoesData): boolean {
    return data.ticker !== '' && data.precoAtivo > 0;
  }
}
