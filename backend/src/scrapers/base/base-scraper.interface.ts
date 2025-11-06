export interface ScraperResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  source: string;
  timestamp: Date;
  responseTime: number;
  metadata?: Record<string, any>;
}

export interface BaseScraper<T = any> {
  /**
   * Name of the scraper
   */
  readonly name: string;

  /**
   * Data source code
   */
  readonly source: string;

  /**
   * Whether the scraper requires login
   */
  readonly requiresLogin: boolean;

  /**
   * Initialize the scraper (e.g., login, setup browser)
   */
  initialize?(): Promise<void>;

  /**
   * Cleanup resources (e.g., close browser)
   */
  cleanup?(): Promise<void>;

  /**
   * Scrape data for a specific ticker
   */
  scrape(ticker: string): Promise<ScraperResult<T>>;

  /**
   * Validate scraped data
   */
  validate?(data: T): boolean;
}

export interface ScraperConfig {
  timeout?: number;
  retries?: number;
  headless?: boolean;
  userAgent?: string;
  credentials?: {
    username?: string;
    password?: string;
    token?: string;
  };
}
