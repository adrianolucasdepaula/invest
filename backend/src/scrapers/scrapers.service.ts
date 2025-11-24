import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FundamentusScraper } from './fundamental/fundamentus.scraper';
import { BrapiScraper } from './fundamental/brapi.scraper';
import { StatusInvestScraper } from './fundamental/statusinvest.scraper';
import { Investidor10Scraper } from './fundamental/investidor10.scraper';
import { FundamenteiScraper } from './fundamental/fundamentei.scraper';
import { InvestsiteScraper } from './fundamental/investsite.scraper';
import { OpcoesScraper } from './options/opcoes.scraper';
import { ScraperResult } from './base/base-scraper.interface';

export interface CrossValidationResult<T = any> {
  isValid: boolean;
  data: T;
  sources: string[];
  sourcesCount: number;
  discrepancies?: any[];
  confidence: number;
}

@Injectable()
export class ScrapersService {
  private readonly logger = new Logger(ScrapersService.name);
  private readonly minSources: number;

  constructor(
    private configService: ConfigService,
    private fundamentusScraper: FundamentusScraper,
    private brapiScraper: BrapiScraper,
    private statusInvestScraper: StatusInvestScraper,
    private investidor10Scraper: Investidor10Scraper,
    private fundamenteiScraper: FundamenteiScraper,
    private investsiteScraper: InvestsiteScraper,
    private opcoesScraper: OpcoesScraper,
  ) {
    this.minSources = this.configService.get<number>('MIN_DATA_SOURCES', 3);
  }

  /**
   * Scrape fundamental data from multiple sources and cross-validate
   */
  async scrapeFundamentalData(ticker: string): Promise<CrossValidationResult> {
    this.logger.log(`Scraping fundamental data for ${ticker} from multiple sources`);

    const results = await Promise.allSettled([
      this.fundamentusScraper.scrape(ticker),
      this.brapiScraper.scrape(ticker),
      this.statusInvestScraper.scrape(ticker),
      this.investidor10Scraper.scrape(ticker),
      this.fundamenteiScraper.scrape(ticker),
      this.investsiteScraper.scrape(ticker),
    ]);

    const successfulResults = results
      .filter((result) => result.status === 'fulfilled' && result.value.success)
      .map((result: any) => result.value as ScraperResult);

    if (successfulResults.length < this.minSources) {
      this.logger.warn(
        `Only ${successfulResults.length} sources available for ${ticker}, minimum required: ${this.minSources}`,
      );
    }

    return this.crossValidateData(successfulResults);
  }

  /**
   * Test a single scraper
   */
  async testSingleScraper(scraperId: string, ticker: string): Promise<ScraperResult> {
    this.logger.log(`Testing single scraper ${scraperId} for ticker ${ticker}`);

    const scraperMap: Record<string, any> = {
      fundamentus: this.fundamentusScraper,
      brapi: this.brapiScraper,
      statusinvest: this.statusInvestScraper,
      investidor10: this.investidor10Scraper,
      fundamentei: this.fundamenteiScraper,
      investsite: this.investsiteScraper,
    };

    const scraper = scraperMap[scraperId];
    if (!scraper) {
      throw new Error(`Scraper ${scraperId} not found`);
    }

    try {
      const result = await scraper.scrape(ticker);
      this.logger.log(
        `Scraper ${scraperId} test completed: ${result.success ? 'SUCCESS' : 'FAILED'}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Scraper ${scraperId} test failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync data from a single scraper for multiple tickers
   */
  async syncSingleScraper(
    scraperId: string,
    tickers: string[],
  ): Promise<{
    scraperId: string;
    results: Array<{ ticker: string; success: boolean; data?: any; error?: string }>;
    successful: number;
    failed: number;
  }> {
    this.logger.log(`Syncing scraper ${scraperId} for ${tickers.length} tickers`);

    const scraperMap: Record<string, any> = {
      fundamentus: this.fundamentusScraper,
      brapi: this.brapiScraper,
      statusinvest: this.statusInvestScraper,
      investidor10: this.investidor10Scraper,
      fundamentei: this.fundamenteiScraper,
      investsite: this.investsiteScraper,
    };

    const scraper = scraperMap[scraperId];
    if (!scraper) {
      throw new Error(`Scraper ${scraperId} not found`);
    }

    const results = await Promise.allSettled(
      tickers.map(async (ticker) => {
        try {
          const result = await scraper.scrape(ticker);
          return {
            ticker,
            success: result.success,
            data: result.data,
          };
        } catch (error) {
          return {
            ticker,
            success: false,
            error: error.message,
          };
        }
      }),
    );

    const processedResults = results.map((r) =>
      r.status === 'fulfilled'
        ? r.value
        : { ticker: 'unknown', success: false, error: 'Promise rejected' },
    );

    const successful = processedResults.filter((r) => r.success).length;
    const failed = processedResults.filter((r) => !r.success).length;

    this.logger.log(`Sync completed for ${scraperId}: ${successful} successful, ${failed} failed`);

    return {
      scraperId,
      results: processedResults,
      successful,
      failed,
    };
  }

  /**
   * Cross-validate data from multiple sources
   */
  private crossValidateData(results: ScraperResult[]): CrossValidationResult {
    if (results.length === 0) {
      return {
        isValid: false,
        data: null,
        sources: [],
        sourcesCount: 0,
        confidence: 0,
      };
    }

    const sources = results.map((r) => r.source);
    const threshold = this.configService.get<number>('DATA_VALIDATION_THRESHOLD', 0.05);

    // Merge data from all sources
    const mergedData = this.mergeData(results);

    // Check for discrepancies
    const discrepancies = this.findDiscrepancies(results, threshold);

    // Calculate confidence score
    const confidence = this.calculateConfidence(results, discrepancies);

    return {
      isValid: results.length >= this.minSources && confidence >= 0.7,
      data: mergedData,
      sources,
      sourcesCount: results.length,
      discrepancies,
      confidence,
    };
  }

  /**
   * Merge data from multiple sources (taking average or most recent)
   */
  private mergeData(results: ScraperResult[]): any {
    if (results.length === 0) return null;

    // Simple strategy: take the most recent data (first result)
    // TODO: Implement more sophisticated merging logic (e.g., weighted average)
    const baseData = results[0].data;

    // Add metadata about sources
    return {
      ...baseData,
      _metadata: {
        sources: results.map((r) => r.source),
        timestamp: new Date(),
        sourcesCount: results.length,
      },
    };
  }

  /**
   * Find discrepancies between data from different sources
   */
  private findDiscrepancies(results: ScraperResult[], threshold: number): any[] {
    const discrepancies = [];

    if (results.length < 2) return discrepancies;

    // Compare numeric fields across sources
    const numericFields = this.getNumericFields(results[0].data);

    for (const field of numericFields) {
      const values = results
        .map((r) => r.data[field])
        .filter((v) => v !== null && v !== undefined && !isNaN(v));

      if (values.length < 2) continue;

      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const maxDeviation = Math.max(...values.map((v) => Math.abs(v - avg) / avg));

      if (maxDeviation > threshold) {
        discrepancies.push({
          field,
          values: results.map((r) => ({ source: r.source, value: r.data[field] })),
          average: avg,
          maxDeviation: maxDeviation * 100, // as percentage
        });
      }
    }

    return discrepancies;
  }

  /**
   * Get numeric fields from data object
   */
  private getNumericFields(data: any): string[] {
    return Object.keys(data).filter((key) => typeof data[key] === 'number');
  }

  /**
   * Calculate confidence score based on source count and discrepancies
   *
   * Methodology:
   * - Base score: number of sources (6 sources = 100%)
   * - Penalty: only for significant discrepancies (> 20%)
   * - Minimum: 40% if >= 3 sources (never returns 0)
   */
  private calculateConfidence(results: ScraperResult[], discrepancies: any[]): number {
    if (results.length === 0) {
      this.logger.warn('[Confidence] No results available, confidence = 0');
      return 0;
    }

    // ✅ BASE SCORE: 6 sources = 100%, proportional scaling
    const sourcesScore = Math.min(results.length / 6, 1.0);
    this.logger.debug(
      `[Confidence] Base score from ${results.length} sources: ${(sourcesScore * 100).toFixed(1)}%`,
    );

    // ✅ PENALTY: Only for significant discrepancies (> 20%)
    let discrepancyPenalty = 0;
    if (discrepancies.length > 0) {
      // Filter only significant discrepancies (normal variance is expected)
      const significantDiscrepancies = discrepancies.filter((d) => d.maxDeviation > 20);

      if (significantDiscrepancies.length > 0) {
        const avgDeviation =
          significantDiscrepancies.reduce((sum, d) => sum + d.maxDeviation, 0) /
          significantDiscrepancies.length;
        // Maximum penalty of 30% (not 100%)
        discrepancyPenalty = Math.min(avgDeviation / 200, 0.3);
        this.logger.debug(
          `[Confidence] ${significantDiscrepancies.length} significant discrepancies (avg ${avgDeviation.toFixed(1)}%), penalty: ${(discrepancyPenalty * 100).toFixed(1)}%`,
        );
      } else {
        this.logger.debug(
          `[Confidence] ${discrepancies.length} discrepancies but all < 20% (acceptable variance)`,
        );
      }
    }

    // ✅ FINAL CONFIDENCE: Apply penalty
    const confidence = sourcesScore * (1 - discrepancyPenalty);

    // ✅ MINIMUM GUARANTEE: 40% if >= minSources (never return 0 with valid data)
    const minConfidence = results.length >= this.minSources ? 0.4 : 0;
    const finalConfidence = Math.max(confidence, minConfidence);

    this.logger.log(
      `[Confidence] Final: ${(finalConfidence * 100).toFixed(1)}% (${results.length} sources, ${discrepancies.length} discrepancies)`,
    );

    return finalConfidence;
  }

  /**
   * Scrape options data
   */
  async scrapeOptionsData(ticker: string): Promise<any> {
    this.logger.log(`Scraping options data for ${ticker}`);

    try {
      const result = await this.opcoesScraper.scrape(ticker);
      return result;
    } catch (error) {
      this.logger.error(`Failed to scrape options data for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all available scrapers
   */
  getAvailableScrapers(): any[] {
    return [
      {
        name: this.fundamentusScraper.name,
        source: this.fundamentusScraper.source,
        requiresLogin: this.fundamentusScraper.requiresLogin,
      },
      {
        name: this.brapiScraper.name,
        source: this.brapiScraper.source,
        requiresLogin: this.brapiScraper.requiresLogin,
      },
      {
        name: this.statusInvestScraper.name,
        source: this.statusInvestScraper.source,
        requiresLogin: this.statusInvestScraper.requiresLogin,
      },
      {
        name: this.investidor10Scraper.name,
        source: this.investidor10Scraper.source,
        requiresLogin: this.investidor10Scraper.requiresLogin,
      },
      {
        name: this.fundamenteiScraper.name,
        source: this.fundamenteiScraper.source,
        requiresLogin: this.fundamenteiScraper.requiresLogin,
      },
      {
        name: this.investsiteScraper.name,
        source: this.investsiteScraper.source,
        requiresLogin: this.investsiteScraper.requiresLogin,
      },
      {
        name: this.opcoesScraper.name,
        source: this.opcoesScraper.source,
        requiresLogin: this.opcoesScraper.requiresLogin,
      },
    ];
  }
}
