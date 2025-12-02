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
import {
  FieldSourcesMap,
  FieldSourceValue,
  MergeStrategy,
  DEFAULT_FIELD_MERGE_CONFIG,
  SOURCE_PRIORITY,
  TRACKABLE_FIELDS,
} from './interfaces';

/**
 * Resultado individual de uma fonte para um campo específico
 */
export interface SourceFieldData {
  source: string;
  value: number | null;
  scrapedAt: string;
}

/**
 * Resultado da cross-validation com rastreamento de origem por campo
 *
 * FASE 1 - Sistema de Rastreamento de Fontes
 */
export interface CrossValidationResult<T = any> {
  isValid: boolean;
  data: T;
  sources: string[];
  sourcesCount: number;
  discrepancies?: any[];
  confidence: number;
  /** Mapa de rastreamento de origem por campo */
  fieldSources: FieldSourcesMap;
  /** Dados brutos de cada fonte */
  rawSourcesData: Array<{ source: string; data: any; scrapedAt: string }>;
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
    // Reduced from 3 to 2 - more realistic for B3 assets (many tickers only available in 2 sources)
    this.minSources = this.configService.get<number>('MIN_DATA_SOURCES', 2);
  }

  /**
   * Scrape fundamental data from multiple sources and cross-validate
   *
   * FASE 1 - Sistema de Rastreamento de Fontes
   * ✅ Coleta de TODAS as fontes para aumentar confiança
   * ✅ Rastreamento de origem por campo
   * ✅ Execução sequencial para evitar sobrecarga do browser
   */
  async scrapeFundamentalData(ticker: string): Promise<CrossValidationResult> {
    this.logger.log(`[SCRAPE] Starting fundamental data collection for ${ticker} from ALL sources`);

    const scrapers = [
      { name: 'fundamentus', scraper: this.fundamentusScraper },
      { name: 'brapi', scraper: this.brapiScraper },
      { name: 'statusinvest', scraper: this.statusInvestScraper },
      { name: 'investidor10', scraper: this.investidor10Scraper },
      { name: 'fundamentei', scraper: this.fundamenteiScraper },
      { name: 'investsite', scraper: this.investsiteScraper },
    ];

    const successfulResults: ScraperResult[] = [];
    const rawSourcesData: Array<{ source: string; data: any; scrapedAt: string }> = [];

    // ✅ FASE 1: Coletar de TODAS as fontes (sem early exit)
    // Isso aumenta a confiança dos dados e permite rastreamento completo
    for (const { name, scraper } of scrapers) {
      const scrapedAt = new Date().toISOString();
      try {
        const result = await scraper.scrape(ticker);
        if (result.success && result.data) {
          successfulResults.push(result);
          rawSourcesData.push({
            source: name,
            data: result.data,
            scrapedAt,
          });
          this.logger.debug(`[${ticker}] ${name}: SUCCESS (${Object.keys(result.data).length} fields)`);
        } else {
          this.logger.debug(`[${ticker}] ${name}: FAILED (no data)`);
        }
      } catch (error) {
        this.logger.debug(`[${ticker}] ${name}: ERROR - ${error.message}`);
      }
    }

    this.logger.log(
      `[SCRAPE] ${ticker}: Collected from ${successfulResults.length}/${scrapers.length} sources`,
    );

    if (successfulResults.length < this.minSources) {
      this.logger.warn(
        `[SCRAPE] ${ticker}: Only ${successfulResults.length} sources available, minimum required: ${this.minSources}`,
      );
    }

    return this.crossValidateData(successfulResults, rawSourcesData);
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
   *
   * FASE 1 - Sistema de Rastreamento de Fontes
   * ✅ Constrói fieldSources com origem de cada campo
   * ✅ Usa estratégias de merge inteligente (MEDIAN/AVERAGE/PRIORITY)
   */
  private crossValidateData(
    results: ScraperResult[],
    rawSourcesData: Array<{ source: string; data: any; scrapedAt: string }> = [],
  ): CrossValidationResult {
    if (results.length === 0) {
      return {
        isValid: false,
        data: null,
        sources: [],
        sourcesCount: 0,
        confidence: 0,
        fieldSources: {},
        rawSourcesData: [],
      };
    }

    const sources = results.map((r) => r.source);
    const threshold = this.configService.get<number>('DATA_VALIDATION_THRESHOLD', 0.05);

    // ✅ FASE 1: Construir fieldSources com rastreamento por campo
    const fieldSources = this.buildFieldSources(rawSourcesData);

    // ✅ FASE 1: Merge inteligente usando estratégias configuradas
    const mergedData = this.mergeDataWithStrategies(rawSourcesData, fieldSources);

    // Check for discrepancies
    const discrepancies = this.findDiscrepancies(results, threshold);

    // Calculate confidence score
    const confidence = this.calculateConfidence(results, discrepancies);

    return {
      isValid: results.length >= this.minSources && confidence >= 0.5,
      data: mergedData,
      sources,
      sourcesCount: results.length,
      discrepancies,
      confidence,
      fieldSources,
      rawSourcesData,
    };
  }

  /**
   * Merge data from multiple sources (taking average or most recent)
   * @deprecated Use mergeDataWithStrategies instead
   */
  private mergeData(results: ScraperResult[]): any {
    if (results.length === 0) return null;

    // Simple strategy: take the most recent data (first result)
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
   * FASE 1 - Construir mapa de rastreamento de origem por campo
   *
   * Para cada campo rastreável, coleta os valores de todas as fontes
   * e calcula variância e consenso.
   */
  private buildFieldSources(
    rawSourcesData: Array<{ source: string; data: any; scrapedAt: string }>,
  ): FieldSourcesMap {
    const fieldSources: FieldSourcesMap = {};

    // Para cada campo rastreável
    for (const field of TRACKABLE_FIELDS) {
      const values: FieldSourceValue[] = [];

      // Coletar valores de todas as fontes
      for (const sourceData of rawSourcesData) {
        const value = this.extractFieldValue(sourceData.data, field);
        values.push({
          source: sourceData.source,
          value,
          scrapedAt: sourceData.scrapedAt,
        });
      }

      // Filtrar valores não-nulos para cálculos
      const validValues = values.filter((v) => v.value !== null);

      if (validValues.length === 0) {
        continue; // Pular campos sem dados
      }

      // Aplicar estratégia de merge para determinar valor final
      const strategy = DEFAULT_FIELD_MERGE_CONFIG[field] || MergeStrategy.MEDIAN;
      const { finalValue, finalSource } = this.applyMergeStrategy(validValues, strategy);

      // Calcular variância
      const variance = this.calculateVariance(validValues.map((v) => v.value as number));

      // Calcular consenso (% de fontes com valores similares)
      const consensus = this.calculateConsensus(validValues.map((v) => v.value as number));

      fieldSources[field] = {
        values,
        finalValue,
        finalSource,
        sourcesCount: validValues.length,
        variance,
        consensus,
      };
    }

    return fieldSources;
  }

  /**
   * FASE 1 - Extrai valor de um campo considerando aliases
   */
  private extractFieldValue(data: any, field: string): number | null {
    if (!data) return null;

    // Mapa de aliases para cada campo
    const fieldAliases: Record<string, string[]> = {
      pl: ['pl', 'pe', 'p_l', 'preco_lucro'],
      pvp: ['pvp', 'pb', 'p_vp', 'preco_vpa'],
      psr: ['psr', 'ps', 'p_sr'],
      dividendYield: ['dividendYield', 'dy', 'dividend_yield', 'yield'],
      roe: ['roe', 'retorno_patrimonio'],
      roa: ['roa', 'retorno_ativos'],
      roic: ['roic', 'retorno_capital'],
      margemBruta: ['margemBruta', 'margem_bruta', 'gross_margin'],
      margemEbit: ['margemEbit', 'margem_ebit', 'ebit_margin'],
      margemEbitda: ['margemEbitda', 'margem_ebitda', 'ebitda_margin'],
      margemLiquida: ['margemLiquida', 'margem_liquida', 'net_margin'],
      evEbit: ['evEbit', 'ev_ebit'],
      evEbitda: ['evEbitda', 'ev_ebitda'],
      dividaLiquidaEbitda: ['dividaLiquidaEbitda', 'divida_liquida_ebitda', 'dividaEbitda'],
      dividaLiquidaPatrimonio: ['dividaLiquidaPatrimonio', 'divida_patrimonio', 'dividaPatrimonio'],
      cagrReceitas5anos: ['cagrReceitas5anos', 'cagr_receitas', 'cagr5Anos'],
      cagrLucros5anos: ['cagrLucros5anos', 'cagr_lucros'],
      pAtivos: ['pAtivos', 'p_ativos', 'pa'],
      pCapitalGiro: ['pCapitalGiro', 'p_capital_giro', 'pcg'],
      pEbit: ['pEbit', 'p_ebit'],
      pegRatio: ['pegRatio', 'peg', 'peg_ratio'],
    };

    const aliases = fieldAliases[field] || [field];

    for (const alias of aliases) {
      const value = data[alias];
      if (value !== undefined && value !== null && !isNaN(Number(value))) {
        return Number(value);
      }
    }

    return null;
  }

  /**
   * FASE 1 - Aplica estratégia de merge para determinar valor final
   */
  private applyMergeStrategy(
    values: FieldSourceValue[],
    strategy: MergeStrategy,
  ): { finalValue: number | null; finalSource: string } {
    const validValues = values.filter((v) => v.value !== null);

    if (validValues.length === 0) {
      return { finalValue: null, finalSource: '' };
    }

    switch (strategy) {
      case MergeStrategy.MEDIAN: {
        const sorted = [...validValues].sort((a, b) => (a.value as number) - (b.value as number));
        const midIndex = Math.floor(sorted.length / 2);
        const medianValue = sorted[midIndex];
        return {
          finalValue: medianValue.value,
          finalSource: medianValue.source,
        };
      }

      case MergeStrategy.AVERAGE: {
        const sum = validValues.reduce((acc, v) => acc + (v.value as number), 0);
        const avg = sum / validValues.length;
        // Fonte é a mais próxima da média
        const closest = validValues.reduce((prev, curr) =>
          Math.abs((curr.value as number) - avg) < Math.abs((prev.value as number) - avg)
            ? curr
            : prev,
        );
        return {
          finalValue: Math.round(avg * 100) / 100,
          finalSource: closest.source,
        };
      }

      case MergeStrategy.PRIORITY: {
        // Usar ordem de prioridade de fontes
        for (const source of SOURCE_PRIORITY) {
          const found = validValues.find((v) => v.source === source);
          if (found) {
            return {
              finalValue: found.value,
              finalSource: found.source,
            };
          }
        }
        // Fallback: primeiro valor
        return {
          finalValue: validValues[0].value,
          finalSource: validValues[0].source,
        };
      }

      case MergeStrategy.MOST_RECENT: {
        // Ordenar por data de coleta (mais recente primeiro)
        const sorted = [...validValues].sort(
          (a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime(),
        );
        return {
          finalValue: sorted[0].value,
          finalSource: sorted[0].source,
        };
      }

      case MergeStrategy.CONSENSUS:
      default: {
        // Usar valor mais comum (ou mediana se todos diferentes)
        const valueCounts = new Map<number, { count: number; source: string }>();
        for (const v of validValues) {
          const rounded = Math.round((v.value as number) * 100) / 100;
          const existing = valueCounts.get(rounded);
          if (existing) {
            existing.count++;
          } else {
            valueCounts.set(rounded, { count: 1, source: v.source });
          }
        }
        // Encontrar valor mais comum
        let maxCount = 0;
        let consensusValue = validValues[0].value;
        let consensusSource = validValues[0].source;
        for (const [value, info] of valueCounts) {
          if (info.count > maxCount) {
            maxCount = info.count;
            consensusValue = value;
            consensusSource = info.source;
          }
        }
        return {
          finalValue: consensusValue,
          finalSource: consensusSource,
        };
      }
    }
  }

  /**
   * FASE 1 - Calcula variância normalizada (0-1)
   */
  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;

    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

    // Normalizar: coeficiente de variação (desvio padrão / média)
    const stdDev = Math.sqrt(variance);
    const cv = Math.abs(stdDev / mean);

    // Limitar entre 0 e 1
    return Math.min(cv, 1);
  }

  /**
   * FASE 1 - Calcula consenso entre fontes (0-100%)
   */
  private calculateConsensus(values: number[]): number {
    if (values.length < 2) return 100;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 100;

    // Contar quantos valores estão dentro de 10% da média
    const threshold = Math.abs(mean * 0.1);
    const withinThreshold = values.filter((v) => Math.abs(v - mean) <= threshold).length;

    return Math.round((withinThreshold / values.length) * 100);
  }

  /**
   * FASE 1 - Merge inteligente usando fieldSources já calculado
   */
  private mergeDataWithStrategies(
    rawSourcesData: Array<{ source: string; data: any; scrapedAt: string }>,
    fieldSources: FieldSourcesMap,
  ): any {
    if (rawSourcesData.length === 0) return null;

    const mergedData: Record<string, any> = {};

    // Para cada campo com dados, usar o valor final calculado
    for (const [field, info] of Object.entries(fieldSources)) {
      if (info.finalValue !== null) {
        mergedData[field] = info.finalValue;
      }
    }

    // Adicionar metadados
    mergedData._metadata = {
      sources: rawSourcesData.map((r) => r.source),
      timestamp: new Date(),
      sourcesCount: rawSourcesData.length,
      mergeStrategy: 'smart', // Indicar que usou merge inteligente
    };

    return mergedData;
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

    // ✅ MINIMUM GUARANTEE: 50% if >= minSources (never return 0 with valid data)
    // Increased from 40% to 50% since we reduced minSources from 3 to 2
    const minConfidence = results.length >= this.minSources ? 0.5 : 0;
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
