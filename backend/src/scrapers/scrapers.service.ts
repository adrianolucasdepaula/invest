import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { FundamentusScraper } from './fundamental/fundamentus.scraper';
import { BrapiScraper } from './fundamental/brapi.scraper';
import { StatusInvestScraper } from './fundamental/statusinvest.scraper';
import { Investidor10Scraper } from './fundamental/investidor10.scraper';
import { FundamenteiScraper } from './fundamental/fundamentei.scraper';
import { InvestsiteScraper } from './fundamental/investsite.scraper';
import { OpcoesScraper } from './options/opcoes.scraper';
import { ScraperResult } from './base/base-scraper.interface';
import { FundamentalData } from '../database/entities/fundamental-data.entity';
import {
  FieldSourcesMap,
  FieldSourceValue,
  SelectionStrategy,
  FIELD_SELECTION_STRATEGY,
  SOURCE_PRIORITY,
  TRACKABLE_FIELDS,
  DEFAULT_TOLERANCES,
} from './interfaces';
import {
  QualityStatsResponseDto,
  ScraperQualityStatsDto,
  DiscrepanciesResponseDto,
  DiscrepancyDto,
} from './scrapers.controller';

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
    @InjectRepository(FundamentalData)
    private fundamentalDataRepository: Repository<FundamentalData>,
    private fundamentusScraper: FundamentusScraper,
    private brapiScraper: BrapiScraper,
    private statusInvestScraper: StatusInvestScraper,
    private investidor10Scraper: Investidor10Scraper,
    private fundamenteiScraper: FundamenteiScraper,
    private investsiteScraper: InvestsiteScraper,
    private opcoesScraper: OpcoesScraper,
  ) {
    // FASE 2: Aumentado de 2 para 3 - maior confiança com sistema de consenso
    // Com 6 scrapers ativos, 3 fontes é o mínimo razoável para validação por consenso
    this.minSources = this.configService.get<number>('MIN_DATA_SOURCES', 3);
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
      opcoes: this.opcoesScraper,
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
   * IMPORTANTE: Dados financeiros são ABSOLUTOS.
   * Usamos CONSENSO para validar qual valor está correto,
   * NÃO calculamos média/mediana.
   *
   * Lógica:
   * 1. Coleta valores de todas as fontes
   * 2. Agrupa valores similares (dentro da tolerância)
   * 3. Seleciona o valor com maior consenso
   * 4. Se não há consenso, usa fonte prioritária + flag de alerta
   */
  private buildFieldSources(
    rawSourcesData: Array<{ source: string; data: any; scrapedAt: string }>,
  ): FieldSourcesMap {
    const fieldSources: FieldSourcesMap = {};

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

      // Filtrar valores válidos (não-nulos e não-zero para a maioria dos campos)
      const validValues = values.filter(
        (v) => v.value !== null && (v.value !== 0 || this.isZeroValidForField(field)),
      );

      if (validValues.length === 0) {
        continue; // Pular campos sem dados
      }

      // Aplicar seleção por consenso
      const result = this.selectByConsensus(field, validValues);

      fieldSources[field] = {
        values,
        finalValue: result.finalValue,
        finalSource: result.finalSource,
        sourcesCount: validValues.length,
        agreementCount: result.agreementCount,
        consensus: result.consensus,
        hasDiscrepancy: result.hasDiscrepancy,
        divergentSources: result.divergentSources,
      };
    }

    return fieldSources;
  }

  /**
   * Verifica se zero é um valor válido para um campo
   * (alguns campos podem legitimamente ser zero)
   */
  private isZeroValidForField(field: string): boolean {
    const zeroValidFields = [
      'dividaLiquida', // Empresa sem dívida líquida
      'dividaBruta', // Empresa sem dívida
      'dividaLiquidaEbitda', // Empresa sem dívida
      'dividaLiquidaPatrimonio', // Empresa sem dívida
    ];
    return zeroValidFields.includes(field);
  }

  /**
   * Seleciona valor por CONSENSO entre fontes
   *
   * Algoritmo:
   * 1. Agrupa valores similares (dentro da tolerância)
   * 2. Encontra o grupo com mais fontes concordando
   * 3. Se há empate ou nenhum consenso, usa fonte prioritária
   * 4. Marca discrepâncias para análise posterior
   */
  private selectByConsensus(
    field: string,
    validValues: FieldSourceValue[],
  ): {
    finalValue: number | null;
    finalSource: string;
    agreementCount: number;
    consensus: number;
    hasDiscrepancy: boolean;
    divergentSources?: Array<{ source: string; value: number; deviation: number }>;
  } {
    if (validValues.length === 0) {
      return {
        finalValue: null,
        finalSource: '',
        agreementCount: 0,
        consensus: 0,
        hasDiscrepancy: false,
      };
    }

    // Se apenas uma fonte, usar diretamente
    if (validValues.length === 1) {
      return {
        finalValue: validValues[0].value,
        finalSource: validValues[0].source,
        agreementCount: 1,
        consensus: 100,
        hasDiscrepancy: false,
      };
    }

    // Obter tolerância para este campo
    const tolerance = this.getFieldTolerance(field);

    // Agrupar valores similares
    const groups = this.groupSimilarValues(validValues, tolerance);

    // Encontrar grupo com maior consenso
    let bestGroup = groups[0];
    for (const group of groups) {
      if (group.sources.length > bestGroup.sources.length) {
        bestGroup = group;
      }
    }

    // Calcular consenso
    const agreementCount = bestGroup.sources.length;
    const consensus = Math.round((agreementCount / validValues.length) * 100);

    // Verificar se há discrepância significativa
    const hasDiscrepancy = agreementCount < validValues.length && groups.length > 1;

    // Selecionar fonte prioritária dentro do grupo de consenso
    let finalSource = bestGroup.sources[0];
    for (const source of SOURCE_PRIORITY) {
      if (bestGroup.sources.includes(source)) {
        finalSource = source;
        break;
      }
    }

    // Obter o valor da fonte selecionada
    const selectedValue = validValues.find((v) => v.source === finalSource);
    const finalValue = selectedValue?.value ?? bestGroup.representativeValue;

    // Identificar fontes divergentes
    let divergentSources: Array<{ source: string; value: number; deviation: number }> | undefined;
    if (hasDiscrepancy) {
      divergentSources = validValues
        .filter((v) => !bestGroup.sources.includes(v.source) && v.value !== null)
        .map((v) => ({
          source: v.source,
          value: v.value as number,
          deviation: this.calculateDeviation(v.value as number, finalValue as number),
        }));
    }

    return {
      finalValue,
      finalSource,
      agreementCount,
      consensus,
      hasDiscrepancy,
      divergentSources,
    };
  }

  /**
   * Obtém tolerância configurada para um campo
   */
  private getFieldTolerance(field: string): number {
    return DEFAULT_TOLERANCES.byField?.[field] ?? DEFAULT_TOLERANCES.default;
  }

  /**
   * Agrupa valores similares (dentro da tolerância)
   */
  private groupSimilarValues(
    values: FieldSourceValue[],
    tolerance: number,
  ): Array<{ representativeValue: number; sources: string[] }> {
    const groups: Array<{ representativeValue: number; sources: string[] }> = [];

    for (const v of values) {
      if (v.value === null) continue;

      // Procurar grupo existente compatível
      let foundGroup = false;
      for (const group of groups) {
        if (this.valuesAreEqual(v.value, group.representativeValue, tolerance)) {
          group.sources.push(v.source);
          foundGroup = true;
          break;
        }
      }

      // Se não encontrou grupo compatível, criar novo
      if (!foundGroup) {
        groups.push({
          representativeValue: v.value,
          sources: [v.source],
        });
      }
    }

    return groups;
  }

  /**
   * Verifica se dois valores são iguais dentro da tolerância
   */
  private valuesAreEqual(value1: number, value2: number, tolerance: number): boolean {
    if (value1 === value2) return true;
    if (value1 === 0 || value2 === 0) {
      // Se um é zero, comparar valor absoluto
      return Math.abs(value1 - value2) <= tolerance;
    }
    // Comparação percentual
    const deviation = Math.abs(value1 - value2) / Math.abs(value2);
    return deviation <= tolerance;
  }

  /**
   * Calcula desvio percentual entre dois valores
   */
  private calculateDeviation(value: number, reference: number): number {
    if (reference === 0) return value === 0 ? 0 : 100;
    return Math.round(Math.abs((value - reference) / reference) * 10000) / 100; // Em percentual
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
   * FASE 1 - Constrói dados mesclados a partir do fieldSources
   *
   * Usa valores validados por CONSENSO (não média/mediana)
   */
  private mergeDataWithStrategies(
    rawSourcesData: Array<{ source: string; data: any; scrapedAt: string }>,
    fieldSources: FieldSourcesMap,
  ): any {
    if (rawSourcesData.length === 0) return null;

    const mergedData: Record<string, any> = {};

    // Contadores para metadados
    let fieldsWithConsensus = 0;
    let fieldsWithDiscrepancy = 0;

    // Para cada campo com dados, usar o valor validado por consenso
    for (const [field, info] of Object.entries(fieldSources)) {
      if (info.finalValue !== null) {
        mergedData[field] = info.finalValue;

        if (info.hasDiscrepancy) {
          fieldsWithDiscrepancy++;
        } else if (info.agreementCount >= 2) {
          fieldsWithConsensus++;
        }
      }
    }

    // Adicionar metadados
    mergedData._metadata = {
      sources: rawSourcesData.map((r) => r.source),
      timestamp: new Date(),
      sourcesCount: rawSourcesData.length,
      selectionMethod: 'consensus', // Validação por consenso
      fieldsWithConsensus,
      fieldsWithDiscrepancy,
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
    // FASE 2: minSources agora é 3 para maior confiança via consenso
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

  /**
   * Get quality statistics for all scrapers based on field_sources data
   *
   * FASE 4 - Dashboard de Qualidade de Scrapers
   * Agrega estatísticas de consenso e discrepância por scraper
   */
  async getQualityStats(): Promise<QualityStatsResponseDto> {
    this.logger.log('[QUALITY] Calculating quality statistics from field_sources');

    // Scraper configurations (same as status endpoint)
    const scraperConfigs: Record<string, string> = {
      fundamentus: 'Fundamentus',
      brapi: 'BRAPI',
      statusinvest: 'Status Invest',
      investidor10: 'Investidor10',
      fundamentei: 'Fundamentei',
      investsite: 'Investsite',
    };

    // Query all fundamental data with field_sources
    const fundamentalData = await this.fundamentalDataRepository.find({
      where: {
        fieldSources: Not(IsNull()),
      },
      select: ['id', 'assetId', 'fieldSources', 'updatedAt'],
    });

    this.logger.log(`[QUALITY] Found ${fundamentalData.length} records with field_sources`);

    // Initialize statistics per scraper
    const scraperStats: Record<
      string,
      {
        consensusSum: number;
        consensusCount: number;
        fieldsTracked: Set<string>;
        fieldsWithDiscrepancy: Set<string>;
        assetsAnalyzed: Set<string>;
        lastUpdate: Date | null;
      }
    > = {};

    for (const scraperId of Object.keys(scraperConfigs)) {
      scraperStats[scraperId] = {
        consensusSum: 0,
        consensusCount: 0,
        fieldsTracked: new Set(),
        fieldsWithDiscrepancy: new Set(),
        assetsAnalyzed: new Set(),
        lastUpdate: null,
      };
    }

    // Overall statistics
    let totalDiscrepancies = 0;
    const allAssetsAnalyzed = new Set<string>();
    const allFieldsTracked = new Set<string>();

    // Process each fundamental data record
    for (const data of fundamentalData) {
      if (!data.fieldSources) continue;

      allAssetsAnalyzed.add(data.assetId);

      // Process each field in field_sources
      for (const [fieldName, fieldInfo] of Object.entries(data.fieldSources)) {
        if (!fieldInfo || !fieldInfo.values) continue;

        allFieldsTracked.add(fieldName);

        // Track which scrapers contributed to this field
        for (const valueEntry of fieldInfo.values) {
          const scraperId = valueEntry.source;
          if (!scraperStats[scraperId]) continue;

          const stats = scraperStats[scraperId];
          stats.fieldsTracked.add(fieldName);
          stats.assetsAnalyzed.add(data.assetId);

          // Track consensus for this scraper
          if (typeof fieldInfo.consensus === 'number') {
            stats.consensusSum += fieldInfo.consensus;
            stats.consensusCount++;
          }

          // Track discrepancies
          if (fieldInfo.hasDiscrepancy) {
            stats.fieldsWithDiscrepancy.add(`${data.assetId}-${fieldName}`);
          }

          // Track last update
          if (data.updatedAt) {
            if (!stats.lastUpdate || data.updatedAt > stats.lastUpdate) {
              stats.lastUpdate = data.updatedAt;
            }
          }
        }

        // Count discrepancies overall
        if (fieldInfo.hasDiscrepancy) {
          totalDiscrepancies++;
        }
      }
    }

    // Build response
    const scrapers: ScraperQualityStatsDto[] = Object.entries(scraperConfigs).map(
      ([id, name]) => {
        const stats = scraperStats[id];
        const avgConsensus =
          stats.consensusCount > 0
            ? Math.round((stats.consensusSum / stats.consensusCount) * 10) / 10
            : 0;

        return {
          id,
          name,
          avgConsensus,
          totalFieldsTracked: stats.fieldsTracked.size,
          fieldsWithDiscrepancy: stats.fieldsWithDiscrepancy.size,
          assetsAnalyzed: stats.assetsAnalyzed.size,
          lastUpdate: stats.lastUpdate?.toISOString() || null,
        };
      },
    );

    // Calculate overall average consensus
    const overallConsensusSum = scrapers.reduce((sum, s) => sum + s.avgConsensus, 0);
    const scrapersWithData = scrapers.filter((s) => s.avgConsensus > 0).length;
    const overallAvgConsensus =
      scrapersWithData > 0
        ? Math.round((overallConsensusSum / scrapersWithData) * 10) / 10
        : 0;

    const response: QualityStatsResponseDto = {
      scrapers,
      overall: {
        avgConsensus: overallAvgConsensus,
        totalDiscrepancies,
        totalAssetsAnalyzed: allAssetsAnalyzed.size,
        totalFieldsTracked: allFieldsTracked.size,
        scrapersActive: scrapersWithData,
      },
    };

    this.logger.log(
      `[QUALITY] Stats calculated: ${response.overall.totalAssetsAnalyzed} assets, ${response.overall.avgConsensus}% avg consensus`,
    );

    return response;
  }

  /**
   * Get list of field discrepancies across all assets
   *
   * FASE 5 - Alertas de Discrepância
   * Retorna lista de discrepâncias ordenadas por severidade
   */
  async getDiscrepancies(options: {
    limit?: number;
    severity?: 'all' | 'high' | 'medium' | 'low';
    field?: string;
  }): Promise<DiscrepanciesResponseDto> {
    const { limit = 50, severity = 'all', field } = options;

    this.logger.log(`[DISCREPANCIES] Fetching discrepancies: limit=${limit}, severity=${severity}, field=${field}`);

    // Field labels for display
    const fieldLabels: Record<string, string> = {
      pl: 'P/L',
      pvp: 'P/VP',
      psr: 'P/SR',
      dividendYield: 'Dividend Yield',
      roe: 'ROE',
      roa: 'ROA',
      roic: 'ROIC',
      margemBruta: 'Margem Bruta',
      margemEbit: 'Margem EBIT',
      margemLiquida: 'Margem Líquida',
      evEbit: 'EV/EBIT',
      evEbitda: 'EV/EBITDA',
      lpa: 'LPA',
      vpa: 'VPA',
      liquidezCorrente: 'Liquidez Corrente',
      dividaBrutaPatrimonio: 'Dív. Bruta/Pat.',
      dividaLiquidaEbitda: 'Dív. Líq./EBITDA',
      patrimonioLiquido: 'Patrimônio Líquido',
      receitaLiquida: 'Receita Líquida',
      lucroLiquido: 'Lucro Líquido',
      ebit: 'EBIT',
      ebitda: 'EBITDA',
    };

    // Query all fundamental data with field_sources and asset info
    const fundamentalData = await this.fundamentalDataRepository.find({
      where: {
        fieldSources: Not(IsNull()),
      },
      relations: ['asset'],
      select: ['id', 'assetId', 'fieldSources', 'updatedAt', 'asset'],
    });

    this.logger.log(`[DISCREPANCIES] Found ${fundamentalData.length} records with field_sources`);

    // Collect all discrepancies
    const allDiscrepancies: DiscrepancyDto[] = [];

    for (const data of fundamentalData) {
      if (!data.fieldSources || !data.asset) continue;

      const ticker = data.asset.ticker;

      // Process each field in field_sources
      for (const [fieldName, fieldInfo] of Object.entries(data.fieldSources)) {
        if (!fieldInfo || !fieldInfo.hasDiscrepancy || !fieldInfo.divergentSources) continue;

        // Filter by specific field if provided
        if (field && fieldName !== field) continue;

        // Calculate max deviation for severity
        const maxDeviation = Math.max(...fieldInfo.divergentSources.map((s: any) => s.deviation || 0));

        // Determine severity
        let severityLevel: 'high' | 'medium' | 'low';
        if (maxDeviation > 20) {
          severityLevel = 'high';
        } else if (maxDeviation > 10) {
          severityLevel = 'medium';
        } else {
          severityLevel = 'low';
        }

        // Filter by severity if specified
        if (severity !== 'all' && severityLevel !== severity) continue;

        allDiscrepancies.push({
          ticker,
          field: fieldName,
          fieldLabel: fieldLabels[fieldName] || fieldName,
          consensusValue: fieldInfo.finalValue ?? 0,
          consensusPercentage: fieldInfo.consensus ?? 0,
          divergentSources: fieldInfo.divergentSources.map((s: any) => ({
            source: s.source,
            value: s.value,
            deviation: s.deviation || 0,
          })),
          severity: severityLevel,
          lastUpdate: data.updatedAt?.toISOString() || new Date().toISOString(),
        });
      }
    }

    // Sort by severity (high > medium > low) and then by max deviation
    const severityOrder = { high: 0, medium: 1, low: 2 };
    allDiscrepancies.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;

      // Within same severity, sort by max deviation descending
      const maxDeviationA = Math.max(...a.divergentSources.map((s) => s.deviation));
      const maxDeviationB = Math.max(...b.divergentSources.map((s) => s.deviation));
      return maxDeviationB - maxDeviationA;
    });

    // Apply limit
    const limitedDiscrepancies = allDiscrepancies.slice(0, limit);

    // Calculate summary
    const summary = {
      total: allDiscrepancies.length,
      high: allDiscrepancies.filter((d) => d.severity === 'high').length,
      medium: allDiscrepancies.filter((d) => d.severity === 'medium').length,
      low: allDiscrepancies.filter((d) => d.severity === 'low').length,
    };

    this.logger.log(
      `[DISCREPANCIES] Found ${summary.total} discrepancies (${summary.high} high, ${summary.medium} medium, ${summary.low} low)`,
    );

    return {
      discrepancies: limitedDiscrepancies,
      summary,
    };
  }
}
