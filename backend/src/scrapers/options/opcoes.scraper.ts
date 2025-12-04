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
        waitUntil: 'load',
        timeout: 60000,
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
        this.page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }),
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

    await this.page.goto(url, { waitUntil: 'load', timeout: 60000 });

    // Wait for main table with options data (updated selector 2024-12)
    await this.page
      .waitForSelector('table tbody tr td', {
        timeout: 15000,
      })
      .catch(() => {
        this.logger.warn('Options table not found - page may still be loading');
      });

    // Small delay to ensure data is loaded
    await new Promise((resolve) => setTimeout(resolve, 2000));

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

      // Get asset price - 2024-12: price is in a div after the volatility table
      // Format: "R$ 32,07 +0,69% 02/12/2025"
      let precoAtivo = 0;
      const allText = document.body.innerText;
      const priceMatch = allText.match(/R\$\s*([\d.,]+)\s*[+-][\d.,]+%/);
      if (priceMatch) {
        precoAtivo = getNumber(priceMatch[1]);
      }

      // Get volatility data from the volatility table
      // Look for "Volatilidade Histórica" row
      let volatilidade = 0;
      let ivRank = 0;
      const tables = document.querySelectorAll('table');
      tables.forEach((table) => {
        const rows = table.querySelectorAll('tr');
        rows.forEach((row) => {
          const text = row.textContent || '';
          if (text.includes('Volatilidade Histórica')) {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              volatilidade = getNumber(cells[1]?.textContent || '0');
            }
            if (cells.length >= 3) {
              ivRank = getNumber(cells[2]?.textContent || '0');
            }
          }
        });
      });

      // Get first checked expiration date from checkboxes
      let proximoVencimento = new Date();
      const checkedExp = document.querySelector('input[type="checkbox"]:checked + *');
      if (checkedExp) {
        const expText = checkedExp.textContent || '';
        const dateMatch = expText.match(/(\d{2}\/\d{2}(?:\/\d{4})?)/);
        if (dateMatch) {
          proximoVencimento = getDate(dateMatch[1]);
        }
      }

      // Parse options table - 2024-12 structure
      // Columns: Ticker, Tipo, F.M., Mod., Strike, A/I/OTM, Dist.%, Último, Var.%, Data, Neg., Vol.Fin, Vol.Impl%, Delta, Gamma, Theta$, Theta%, Vega, IQ, Coberto, Travado, Descob, Tit, Lanç
      const calls: any[] = [];
      const puts: any[] = [];

      // Find the main data table (has tbody with actual option rows)
      const dataTables = document.querySelectorAll('table tbody');
      dataTables.forEach((tbody) => {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          // Valid option row has many columns (20+)
          if (cells.length < 10) return;

          const tickerCell = cells[0]?.textContent?.trim() || '';
          const tipoCell = cells[1]?.textContent?.trim() || '';

          // Skip header rows or invalid rows
          if (!tickerCell || tickerCell.includes('Ticker') || !tipoCell) return;

          const tipo = tipoCell === 'CALL' ? 'CALL' : tipoCell === 'PUT' ? 'PUT' : null;
          if (!tipo) return;

          const opcao = {
            ticker: tickerCell,
            strike: getNumber(cells[4]?.textContent || '0'), // Strike column
            tipo: tipo,
            vencimento: proximoVencimento,
            premium: getNumber(cells[7]?.textContent || '0'), // Último (last price)
            bid: 0, // Not directly available
            ask: 0, // Not directly available
            volume: getNumber(cells[10]?.textContent || '0'), // Núm. de Neg.
            openInterest: 0, // Would need to calculate from Coberto/Travado/Descob
            impliedVolatility: getNumber(cells[12]?.textContent || '0'), // Vol. Impl. (%)
            delta: getNumber(cells[13]?.textContent || '0'),
            gamma: getNumber(cells[14]?.textContent || '0'),
            theta: getNumber(cells[15]?.textContent || '0'), // Theta ($)
            vega: getNumber(cells[17]?.textContent || '0'),
            rho: 0, // Not available
            intrinsicValue: 0,
            timeValue: 0,
          };

          if (tipo === 'CALL') {
            calls.push(opcao);
          } else {
            puts.push(opcao);
          }
        });
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

    this.logger.debug(
      `[OPCOES] Extracted: precoAtivo=${data.precoAtivo}, vol=${data.volatilidade}, calls=${data.calls.length}, puts=${data.puts.length}`,
    );

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
        waitUntil: 'load',
        timeout: 60000,
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
