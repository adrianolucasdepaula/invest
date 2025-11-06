import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FundamentusScraper } from './fundamental/fundamentus.scraper';
import { BrapiScraper } from './fundamental/brapi.scraper';
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
      // Add more scrapers here
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
   */
  private calculateConfidence(results: ScraperResult[], discrepancies: any[]): number {
    // Base confidence on number of sources
    let confidence = Math.min(results.length / this.minSources, 1.0);

    // Reduce confidence based on discrepancies
    if (discrepancies.length > 0) {
      const avgDeviation =
        discrepancies.reduce((sum, d) => sum + d.maxDeviation, 0) / discrepancies.length;
      confidence *= Math.max(0, 1 - avgDeviation / 100);
    }

    return confidence;
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
    ];
  }
}
