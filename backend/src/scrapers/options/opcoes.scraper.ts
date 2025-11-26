import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AbstractScraper } from '../base/abstract-scraper';
import { RateLimiterService } from '../rate-limiter.service'; // ✅ FASE 3

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
  readonly baseUrl = 'https://opcoes.net.br'; // ✅ FASE 3

  private username: string;
  private password: string;

  constructor(
    private configService: ConfigService,
    rateLimiter: RateLimiterService, // ✅ FASE 3
  ) {
    super();
    this.rateLimiter = rateLimiter; // ✅ FASE 3
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

      // Check if already logged in
      if (this.page.url() !== 'https://opcoes.net.br/login') {
        return;
      }

      // Use credentials from documentation/env or fallback
      const username = process.env.OPCOES_USERNAME || '312.862.178-06';
      const password = process.env.OPCOES_PASSWORD || 'Safra998266@#';

      await this.page.waitForSelector('#CPF', { timeout: 10000 });
      await this.page.type('#CPF', username);
      await this.page.type('#Password', password);

      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        this.page.click('button[type="submit"]'),
      ]);

      this.logger.log('Successfully logged in to Opções.net.br');
    } catch (error) {
      this.logger.error(`Failed to login to Opções.net.br: ${error.message}`);
      // Don't throw, try to proceed
    }
  }

  protected async scrapeData(ticker: string): Promise<OpcoesData> {
    const url = `https://opcoes.net.br/opcoes/bovespa/${ticker.toUpperCase()}`;

    await this.page.goto(url, { waitUntil: 'networkidle2', timeout: this.config.timeout });

    // Wait for options table
    await this.page
      .waitForSelector('.options-table, .opcoes-table', {
        timeout: 10000,
      })
      .catch(() => {
        this.logger.warn('Options table not found');
      });

    const data = await this.page.evaluate(() => {
      const getNumber = (text: string): number => {
        if (!text) return 0;
        const cleaned = text
          .replace(/\./g, '')
          .replace(',', '.')
          .replace(/[^\d.-]/g, '');
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

  async scrapeLiquidity(): Promise<string[]> {
    try {
      if (!this.page) {
        await this.initialize();
      }

      // Ensure login
      await this.login();

      this.logger.log('Scraping options liquidity data from opcoes.net.br');
      const url = 'https://opcoes.net.br/estudos/liquidez/opcoes';

      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for table to load
      await this.page.waitForSelector('table', { timeout: 30000 });

      const allTickers: Set<string> = new Set();
      let hasNextPage = true;
      let pageNum = 1;

      while (hasNextPage) {
        this.logger.log(`Scraping page ${pageNum}...`);

        // Extract tickers from the current page
        const tickers = await this.page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows
            .map((row) => {
              const cell = row.querySelector('td:first-child');
              return cell ? cell.textContent?.trim() || '' : '';
            })
            .filter((t) => t.length > 0);
        });

        tickers.forEach((t) => allTickers.add(t));
        this.logger.log(
          `Found ${tickers.length} tickers on page ${pageNum}. Total unique: ${allTickers.size}`,
        );

        // Check for next page
        // Try multiple selectors for the next button
        const nextButtonSelectors = [
          'button.dt-paging-button.next',
          'button.next',
          '[aria-label="Next"]',
          'button:has(span.dt-paging-button.next)',
          // Fallback: find the current button and get the next one
        ];

        let nextButton = null;
        for (const selector of nextButtonSelectors) {
          try {
            const btn = await this.page.$(selector);
            if (btn) {
              const isDisabled = await btn.evaluate(
                (el) => el.classList.contains('disabled') || el.hasAttribute('disabled'),
              );
              if (!isDisabled) {
                nextButton = btn;
                break;
              }
            }
          } catch (e) {
            // Ignore errors
          }
        }

        if (nextButton) {
          this.logger.log(`Clicking next page button (selector found)...`);
          await nextButton.click();
          // Wait for table update
          await new Promise((resolve) => setTimeout(resolve, 3000));
          pageNum++;
        } else {
          this.logger.log(`Standard next button not found. Trying DOM evaluation...`);
          // Try to find the button by text "›" or similar if standard selectors fail, or by position
          const moved = await this.page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button.dt-paging-button'));
            const current = document.querySelector('button.dt-paging-button.current');
            if (current) {
              const currentIndex = buttons.indexOf(current as HTMLButtonElement);
              // Log for debugging (will be visible if we return it, but here we return boolean)
              // console.log('Current index:', currentIndex, 'Total buttons:', buttons.length);

              if (currentIndex >= 0 && currentIndex < buttons.length - 1) {
                const next = buttons[currentIndex + 1];
                if (
                  next &&
                  !next.classList.contains('disabled') &&
                  !next.classList.contains('next') &&
                  !next.classList.contains('last')
                ) {
                  // If the next button is a number, click it
                  (next as HTMLElement).click();
                  return true;
                }
              }
              // If the next button is "next" (›), click it
              const nextBtn = document.querySelector('button.dt-paging-button.next');
              if (nextBtn && !nextBtn.classList.contains('disabled')) {
                (nextBtn as HTMLElement).click();
                return true;
              }
            }
            return false;
          });

          if (moved) {
            this.logger.log(`Clicked next page via DOM evaluation. Moving to page ${pageNum + 1}`);
            await new Promise((resolve) => setTimeout(resolve, 3000));
            pageNum++;
          } else {
            this.logger.log(`No next page found via DOM evaluation. Stopping at page ${pageNum}.`);
            // Log the HTML of pagination for debugging
            const paginationHtml = await this.page.evaluate(() => {
              const nav = document.querySelector('.dt-paging');
              return nav ? nav.outerHTML : 'Pagination container not found';
            });
            this.logger.log(`Pagination HTML: ${paginationHtml}`);
            hasNextPage = false;
          }
        }

        // Safety break to prevent infinite loops
        if (pageNum > 20) hasNextPage = false;
      }

      this.logger.log(
        `Finished scraping. Found ${allTickers.size} unique tickers with liquid options`,
      );
      return Array.from(allTickers);
    } catch (error) {
      this.logger.error(`Error scraping options liquidity: ${error.message}`);
      return [];
    }
  }
}
