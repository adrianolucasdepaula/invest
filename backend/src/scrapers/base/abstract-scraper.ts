import { Logger } from '@nestjs/common';
import { BaseScraper, ScraperConfig, ScraperResult } from './base-scraper.interface';
import { chromium, Browser, Page } from 'playwright';
import { RateLimiterService } from '../rate-limiter.service'; // ✅ FASE 3

export abstract class AbstractScraper<T = any> implements BaseScraper<T> {
  protected readonly logger: Logger;
  protected browser: Browser | null = null;
  protected page: Page | null = null;
  protected config: ScraperConfig;
  protected rateLimiter: RateLimiterService | null = null; // ✅ FASE 3

  abstract readonly name: string;
  abstract readonly source: string;
  abstract readonly requiresLogin: boolean;
  abstract readonly baseUrl: string; // ✅ FASE 3: URL base do site para rate limiting

  /**
   * FASE 4 - SOLUÇÃO DEFINITIVA: Fila de inicialização de browsers
   *
   * PROBLEMA: Chrome DevTools Protocol (CDP) sobrecarregado durante inicialização concorrente
   * - Stealth plugin injeta ~15 scripts via addScriptToEvaluateOnNewDocument
   * - Concurrency 3 = 3 browsers x 15 scripts = 45 operações CDP simultâneas
   * - CDP não suporta essa carga → ProtocolError timeout
   *
   * SOLUÇÃO: Serializar inicialização de browsers (1 por vez)
   * - Fila estática compartilhada entre todas instâncias de scrapers
   * - Cada browser aguarda anterior terminar + 2s de gap
   * - Evita sobrecarga CDP mantendo todas funcionalidades (stealth, rate limit)
   *
   * TRADE-OFF: +28s overhead para 21 assets, mas 0% crash rate (vs 100% antes)
   */
  private static initializationQueue: Promise<void> = Promise.resolve();

  constructor(config?: ScraperConfig) {
    this.logger = new Logger(this.constructor.name);
    this.config = {
      timeout: 180000, // ✅ FASE 5.5: Aumentado de 90s para 180s (3min) - prevenir ERR_ABORTED em páginas lentas
      retries: 3,
      headless: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...config,
    };
  }

  async initialize(): Promise<void> {
    // ✅ FASE 4: Aguardar fila de inicialização para evitar sobrecarga CDP
    await AbstractScraper.initializationQueue;

    // Criar novo promise para próximo scraper aguardar
    let resolveQueue: () => void;
    AbstractScraper.initializationQueue = new Promise((resolve) => {
      resolveQueue = resolve;
    });

    try {
      this.logger.log(`[INIT QUEUE] Initializing scraper: ${this.name}`);

      // Use system Chromium if env variable is set (for Alpine Linux)
      const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

      this.browser = await chromium.launch({
        headless: this.config.headless,
        timeout: 180000, // ✅ FASE 5.5: Aumentado de 90s para 180s (3min) - prevenir ERR_ABORTED
        executablePath: executablePath || undefined, // Use system Chromium if available
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      this.page = await this.browser.newPage();
      await this.page.setViewportSize({ width: 1920, height: 1080 });
      await this.page.setExtraHTTPHeaders({
        'User-Agent': this.config.userAgent,
      });
      this.page.setDefaultTimeout(180000); // ✅ FASE 5.5: Aumentado de 90s para 180s (3min)

      if (this.requiresLogin) {
        await this.login();
      }

      this.logger.log(`[INIT QUEUE] ✅ Scraper initialized: ${this.name}`);

      // ✅ FASE 4: Gap de 2s antes de liberar próximo browser
      // Evita sobrecarga permitindo operações assíncronas finalizarem
      await this.wait(2000);
    } catch (error) {
      this.logger.error(`[INIT QUEUE] ❌ Failed to initialize scraper: ${error.message}`);
      throw error;
    } finally {
      // Sempre liberar fila, mesmo em erro
      resolveQueue();
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.logger.log(`Scraper cleaned up: ${this.name}`);
    } catch (error) {
      this.logger.error(`Failed to cleanup scraper: ${error.message}`);
    }
  }

  async scrape(ticker: string): Promise<ScraperResult<T>> {
    const startTime = Date.now();

    try {
      this.logger.log(`Scraping ${ticker} from ${this.source}`);

      // ✅ FASE 3: Aplicar rate limiting ANTES de scraping
      if (this.rateLimiter && this.baseUrl) {
        const domain = this.rateLimiter.extractDomain(this.baseUrl);
        await this.rateLimiter.throttle(domain);
      }

      if (!this.page) {
        await this.initialize();
      }

      const data = await this.scrapeData(ticker);

      if (this.validate && !this.validate(data)) {
        throw new Error('Data validation failed');
      }

      const responseTime = Date.now() - startTime;

      this.logger.log(`Successfully scraped ${ticker} from ${this.source} in ${responseTime}ms`);

      return {
        success: true,
        data,
        source: this.source,
        timestamp: new Date(),
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      // ✅ FASE 5.4: Tratamento específico para net::ERR_ABORTED
      // ERR_ABORTED indica que a navegação foi cancelada (página não existe, timeout, redirect falhou)
      // Não é um erro crítico - apenas indica que o ticker não tem dados neste source
      if (error.message && error.message.includes('net::ERR_ABORTED')) {
        this.logger.warn(
          `⚠️ Page not available for ${ticker} on ${this.source} (ERR_ABORTED) - skipping`,
        );
        return {
          success: false,
          error: 'Page not available (ERR_ABORTED)',
          source: this.source,
          timestamp: new Date(),
          responseTime,
        };
      }

      // Para outros erros, manter log de ERROR
      this.logger.error(`Failed to scrape ${ticker} from ${this.source}: ${error.message}`);

      return {
        success: false,
        error: error.message,
        source: this.source,
        timestamp: new Date(),
        responseTime,
      };
    }
  }

  /**
   * Login to the data source (if required)
   * Override this method in child classes
   */
  protected async login(): Promise<void> {
    // Override in child classes
  }

  /**
   * Scrape data for a specific ticker
   * Must be implemented by child classes
   */
  protected abstract scrapeData(ticker: string): Promise<T>;

  /**
   * Validate scraped data
   * Override in child classes for custom validation
   */
  validate?(data: T): boolean;

  /**
   * Wait for a specific amount of time
   */
  protected async wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry a function with exponential backoff
   */
  protected async retry<R>(
    fn: () => Promise<R>,
    retries: number = this.config.retries,
  ): Promise<R> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      const delay = Math.pow(2, this.config.retries - retries) * 1000;
      this.logger.warn(`Retrying in ${delay}ms... (${retries} retries left)`);
      await this.wait(delay);
      return this.retry(fn, retries - 1);
    }
  }
}
