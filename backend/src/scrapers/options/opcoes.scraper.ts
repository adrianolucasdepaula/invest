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

/**
 * Interface para dados de liquidez de opções
 * Dados extraídos da tabela https://opcoes.net.br/estudos/liquidez/opcoes
 */
export interface OptionsLiquidityData {
  ticker: string;
  periodo: string; // Período da análise (ex: "30 dias", "60 dias")
  totalNegocios: number; // Número total de negócios
  volumeFinanceiro: number; // Volume financeiro total (R$)
  quantidadeNegociada: number; // Quantidade total negociada
  mediaNegocios: number; // Média de negócios por dia
  mediaVolume: number; // Média de volume por dia
  lastUpdated: Date;
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

  /**
   * FASE 115: Login com logging detalhado e retry em caso de crash
   */
  protected async login(): Promise<void> {
    try {
      this.logger.log('[OPCOES-LOGIN] Starting login process...');

      if (!this.page) {
        this.logger.error('[OPCOES-LOGIN] Page not initialized!');
        await this.initialize();
      }

      this.logger.log(`[OPCOES-LOGIN] Navigating to login page...`);
      await this.page.goto('https://opcoes.net.br/login', {
        waitUntil: 'domcontentloaded',
        timeout: 90000,
      });

      // Screenshot de debug
      try {
        await this.page.screenshot({
          path: '/app/logs/opcoes-login-debug.png',
          fullPage: true,
        });
        this.logger.log('[OPCOES-LOGIN] Debug screenshot saved');
      } catch (e) {
        this.logger.warn('[OPCOES-LOGIN] Could not save screenshot');
      }

      const currentUrl = this.page.url();
      this.logger.log(`[OPCOES-LOGIN] After navigation URL: ${currentUrl}`);

      // Check if already logged in
      if (!currentUrl.includes('/login')) {
        this.logger.log('[OPCOES-LOGIN] Already logged in, skipping');
        return;
      }

      // Use credentials from documentation/env or fallback
      const username = process.env.OPCOES_USERNAME || '312.862.178-06';
      const password = process.env.OPCOES_PASSWORD || 'Safra998266@#';

      this.logger.log('[OPCOES-LOGIN] Waiting for CPF field...');
      await this.page.waitForSelector('#CPF', { timeout: 30000 });

      await this.page.type('#CPF', username);
      await this.page.type('#Password', password);

      this.logger.log('[OPCOES-LOGIN] Submitting login form...');
      await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 60000 }),
        this.page.click('button[type="submit"]'),
      ]);

      this.logger.log('[OPCOES-LOGIN] Successfully logged in to Opções.net.br');
    } catch (error) {
      this.logger.error(`[OPCOES-LOGIN] Failed: ${error.message}`);

      // Screenshot de erro para debug
      if (this.page) {
        try {
          await this.page.screenshot({ path: '/app/logs/opcoes-login-error.png' });
          this.logger.log('[OPCOES-LOGIN] Error screenshot saved');
        } catch (e) {
          // Ignore screenshot errors
        }
      }

      // FASE 115: NÃO silenciar erro - propagar para retry
      throw error;
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

  /**
   * FASE 115: Scrape liquidez de opções com dados detalhados
   * COM RETRY E RECUPERAÇÃO DE CRASH
   *
   * Extrai todas as colunas da tabela de liquidez (não apenas os tickers)
   * Fonte: https://opcoes.net.br/estudos/liquidez/opcoes
   *
   * Colunas esperadas da tabela:
   * - Ticker (Ativo-objeto)
   * - Núm. Negócios (total de negócios no período)
   * - Volume Financeiro (R$)
   * - Quantidade Negociada
   * - Média Negócios/dia
   * - Média Volume/dia
   */
  async scrapeLiquidityWithDetails(): Promise<Map<string, OptionsLiquidityData>> {
    const result = new Map<string, OptionsLiquidityData>();
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        this.logger.log(`[OPTIONS-LIQUIDITY] Attempt ${attempt}/${MAX_RETRIES}`);

        if (!this.page) {
          this.logger.log('[OPTIONS-LIQUIDITY] Page not initialized, initializing...');
          await this.initialize();
        }

        // Ensure login
        await this.login();

        this.logger.log('[OPTIONS-LIQUIDITY] Navigating to liquidity page...');
        const url = 'https://opcoes.net.br/estudos/liquidez/opcoes';

        await this.page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 90000,
        });

        // Screenshot para debug
        try {
          await this.page.screenshot({
            path: `/app/logs/opcoes-liquidity-page${attempt}.png`,
            fullPage: true,
          });
          this.logger.log('[OPTIONS-LIQUIDITY] Debug screenshot saved');
        } catch (e) {
          this.logger.warn('[OPTIONS-LIQUIDITY] Could not save screenshot');
        }

        // Wait for table to load
        this.logger.log('[OPTIONS-LIQUIDITY] Waiting for table...');
        await this.page.waitForSelector('table tbody tr', { timeout: 45000 });

        // Small delay to ensure data is fully loaded
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Try to get the analysis period from page header/title
        const periodo = await this.page.evaluate(() => {
          // Look for period information in the page
          const headerText = document.body.innerText;
          const periodMatch = headerText.match(/(\d+)\s*dias?/i);
          return periodMatch ? `${periodMatch[1]} dias` : '30 dias'; // Default to 30 dias
        });

        let hasNextPage = true;
        let pageNum = 1;

        while (hasNextPage) {
          this.logger.log(`Scraping detailed data from page ${pageNum}...`);

          // Extract all columns from the current page
          const pageData = await this.page.evaluate(() => {
            const getNumber = (text: string): number => {
              if (!text) return 0;
              // Remove dots as thousand separators, replace comma with dot for decimals
              const cleaned = text
                .replace(/\./g, '')
                .replace(',', '.')
                .replace(/[^\d.-]/g, '');
              return parseFloat(cleaned) || 0;
            };

            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            return rows
              .map((row) => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 2) return null;

                const ticker = cells[0]?.textContent?.trim() || '';
                if (!ticker || ticker.includes('Ticker')) return null;

                // Try to extract data from available columns
                // Table structure may vary, but typically:
                // Col 0: Ticker, Col 1: Num Negocios, Col 2: Vol Financeiro, Col 3: Qtd, Col 4: Media Neg, Col 5: Media Vol
                return {
                  ticker,
                  totalNegocios: getNumber(cells[1]?.textContent || '0'),
                  volumeFinanceiro: getNumber(cells[2]?.textContent || '0'),
                  quantidadeNegociada: getNumber(cells[3]?.textContent || '0'),
                  mediaNegocios: getNumber(cells[4]?.textContent || '0'),
                  mediaVolume: getNumber(cells[5]?.textContent || '0'),
                };
              })
              .filter((item): item is NonNullable<typeof item> => item !== null);
          });

          // Add page data to results
          for (const item of pageData) {
            if (!result.has(item.ticker)) {
              result.set(item.ticker, {
                ticker: item.ticker,
                periodo,
                totalNegocios: item.totalNegocios,
                volumeFinanceiro: item.volumeFinanceiro,
                quantidadeNegociada: item.quantidadeNegociada,
                mediaNegocios: item.mediaNegocios,
                mediaVolume: item.mediaVolume,
                lastUpdated: new Date(),
              });
            }
          }

          this.logger.log(
            `Found ${pageData.length} tickers on page ${pageNum}. Total unique: ${result.size}`,
          );

          // Pagination logic (same as scrapeLiquidity)
          const nextButtonSelectors = [
            'button.dt-paging-button.next',
            'button.next',
            '[aria-label="Next"]',
            'button:has(span.dt-paging-button.next)',
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
            await nextButton.click();
            await new Promise((resolve) => setTimeout(resolve, 3000));
            pageNum++;
          } else {
            // Try DOM evaluation fallback
            const moved = await this.page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button.dt-paging-button'));
              const current = document.querySelector('button.dt-paging-button.current');
              if (current) {
                const currentIndex = buttons.indexOf(current as HTMLButtonElement);
                if (currentIndex >= 0 && currentIndex < buttons.length - 1) {
                  const next = buttons[currentIndex + 1];
                  if (
                    next &&
                    !next.classList.contains('disabled') &&
                    !next.classList.contains('next') &&
                    !next.classList.contains('last')
                  ) {
                    (next as HTMLElement).click();
                    return true;
                  }
                }
                const nextBtn = document.querySelector('button.dt-paging-button.next');
                if (nextBtn && !nextBtn.classList.contains('disabled')) {
                  (nextBtn as HTMLElement).click();
                  return true;
                }
              }
              return false;
            });

            if (moved) {
              await new Promise((resolve) => setTimeout(resolve, 3000));
              pageNum++;
            } else {
              hasNextPage = false;
            }
          }

          // Safety break
          if (pageNum > 20) hasNextPage = false;
        }

        this.logger.log(
          `[OPTIONS-LIQUIDITY] Success! Found ${result.size} unique tickers with options data`,
        );

        // Se chegou aqui, sucesso - retornar resultado
        return result;
      } catch (error) {
        this.logger.error(`[OPTIONS-LIQUIDITY] Attempt ${attempt} failed: ${error.message}`);

        // FASE 115: Verificar se é erro de crash e tentar recuperar
        if (
          error.message.includes('Page crashed') ||
          error.message.includes('Target closed') ||
          error.message.includes('Protocol error') ||
          error.message.includes('page.goto')
        ) {
          this.logger.warn('[OPTIONS-LIQUIDITY] Page crashed, reinitializing browser...');
          await this.cleanup();
          await new Promise((resolve) => setTimeout(resolve, 5000));

          // Reinicializar para próxima tentativa
          this.page = null;
          this.browser = null;

          if (attempt < MAX_RETRIES) {
            const waitTime = Math.pow(2, attempt) * 2000;
            this.logger.log(`[OPTIONS-LIQUIDITY] Waiting ${waitTime}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
        }

        if (attempt === MAX_RETRIES) {
          this.logger.error(`[OPTIONS-LIQUIDITY] All ${MAX_RETRIES} attempts failed`);
          return result; // Retorna o que conseguiu coletar
        }

        // Aguardar antes de tentar novamente
        const waitTime = Math.pow(2, attempt) * 2000;
        this.logger.log(`[OPTIONS-LIQUIDITY] Waiting ${waitTime}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    return result;
  }

  /**
   * Check if a single ticker has options available
   * Uses cached data from scrapeLiquidityWithDetails if available
   * @param ticker - Ticker to check
   * @param liquidityData - Optional pre-fetched liquidity data map
   */
  async checkSingleTicker(
    ticker: string,
    liquidityData?: Map<string, OptionsLiquidityData>,
  ): Promise<OptionsLiquidityData | null> {
    const upperTicker = ticker.toUpperCase();

    // If we have cached data, use it
    if (liquidityData) {
      return liquidityData.get(upperTicker) || null;
    }

    // Otherwise, we need to check the liquidity page
    // This is less efficient for single checks, but necessary for individual asset updates
    try {
      const allData = await this.scrapeLiquidityWithDetails();
      return allData.get(upperTicker) || null;
    } catch (error) {
      this.logger.error(`Error checking ticker ${ticker} for options: ${error.message}`);
      return null;
    }
  }
}
