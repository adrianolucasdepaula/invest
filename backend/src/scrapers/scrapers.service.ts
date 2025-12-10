import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
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
  DiscrepancyStatsResponseDto,
} from './scrapers.controller';

/**
 * Python API Scraper Information
 * Matches the response from Python API /api/scrapers/list
 */
export interface PythonScraperInfo {
  id: string;
  name: string;
  source: string;
  requires_login: boolean;
  category: string;
  description: string;
  url: string;
}

/**
 * Python API Scraper Test Result
 * Matches the response from Python API /api/scrapers/test
 */
export interface PythonScraperTestResult {
  success: boolean;
  scraper: string;
  query: string;
  data?: any;
  error?: string;
  execution_time: number;
  timestamp?: string;
  metadata?: any;
}

/**
 * Unified Scraper Status for Data Sources page
 * Combines TypeScript and Python scrapers
 */
export interface UnifiedScraperStatus {
  id: string;
  name: string;
  url: string;
  type: 'fundamental' | 'technical' | 'options' | 'prices' | 'news' | 'ai' | 'market_data' | 'crypto' | 'macro';
  status: 'active' | 'inactive' | 'error';
  lastTest: string | null;
  lastTestSuccess: boolean | null; // FASE 90
  lastSync: string | null;
  lastSyncSuccess: boolean | null; // FASE 90
  successRate: number;
  totalRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requiresAuth: boolean;
  runtime: 'typescript' | 'python';
  category: string;
  description?: string;
  errorMessage?: string;
}

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

  private readonly pythonApiUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(FundamentalData)
    private fundamentalDataRepository: Repository<FundamentalData>,
    private httpService: HttpService,
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
    // URL da API Python para fallback
    this.pythonApiUrl = this.configService.get<string>('PYTHON_API_URL', 'http://localhost:8000');
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

    // ✅ FASE 3: Cross-validate inicial para detectar discrepâncias
    const initialValidation = this.crossValidateData(successfulResults, rawSourcesData);

    // Detectar se precisa de fallback Python
    const needsFallbackDueToSources = successfulResults.length < this.minSources;
    const needsFallbackDueToDiscrepancy = this.hasSignificantDiscrepancies(initialValidation);

    if (needsFallbackDueToSources || needsFallbackDueToDiscrepancy) {
      const reason = needsFallbackDueToSources
        ? `only ${successfulResults.length} sources (min: ${this.minSources})`
        : `significant discrepancies detected (confidence: ${(initialValidation.confidence * 100).toFixed(1)}%)`;

      this.logger.warn(
        `[SCRAPE] ${ticker}: Activating Python fallback - ${reason}`,
      );

      // Solicitar mais fontes para resolver discrepâncias ou completar mínimo
      const neededSources = needsFallbackDueToSources
        ? this.minSources - successfulResults.length
        : 2; // Pedir 2 fontes extras para resolver discrepâncias

      const pythonResults = await this.runPythonFallbackScrapers(ticker, neededSources);

      // Adicionar resultados do fallback Python
      for (const pyResult of pythonResults) {
        // Evitar duplicar fontes que já temos
        const sourceKey = `python-${pyResult.source.toLowerCase()}`;
        const alreadyHasSource = rawSourcesData.some(
          (s) => s.source.toLowerCase().includes(pyResult.source.toLowerCase()),
        );

        if (!alreadyHasSource) {
          successfulResults.push({
            success: true,
            source: sourceKey,
            data: pyResult.data,
            timestamp: new Date(),
            responseTime: pyResult.execution_time * 1000, // Converter para ms
          });
          rawSourcesData.push({
            source: sourceKey,
            data: pyResult.data,
            scrapedAt: new Date().toISOString(),
          });
        }
      }

      this.logger.log(
        `[SCRAPE] ${ticker}: After Python fallback: ${successfulResults.length} sources total`,
      );

      // Re-validar com as novas fontes
      return this.crossValidateData(successfulResults, rawSourcesData);
    }

    return initialValidation;
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
      // Per Share - Lucro e Valor Patrimonial por Ação
      lpa: ['lpa', 'lucro_acao', 'earningsPerShare'],
      vpa: ['vpa', 'valor_patrimonial_acao', 'bookValuePerShare'],
      // Liquidez
      liquidezCorrente: ['liquidezCorrente', 'liquidez_corrente', 'current_ratio'],
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
   * FASE 3 - Detecta se há discrepâncias significativas que justificam fallback
   *
   * Critérios para acionar fallback por discrepância:
   * 1. Confidence < 60% (indica baixo consenso entre fontes)
   * 2. Mais de 30% dos campos têm discrepâncias significativas (>20%)
   * 3. Campos críticos (P/L, ROE, DY) com divergência > 15%
   *
   * @param validation - Resultado da cross-validation inicial
   * @returns true se há discrepâncias significativas
   */
  private hasSignificantDiscrepancies(validation: CrossValidationResult): boolean {
    // Se confidence já é baixa, precisa de mais fontes
    if (validation.confidence < 0.6) {
      this.logger.debug(
        `[DISCREPANCY] Confidence ${(validation.confidence * 100).toFixed(1)}% < 60%, needs fallback`,
      );
      return true;
    }

    // Analisar fieldSources para discrepâncias
    if (!validation.fieldSources) {
      return false;
    }

    const criticalFields = ['pl', 'pvp', 'roe', 'roic', 'dividendYield', 'margemLiquida'];
    let fieldsWithHighDiscrepancy = 0;
    let totalFieldsAnalyzed = 0;
    let criticalFieldsWithIssue = 0;

    for (const [fieldName, fieldInfo] of Object.entries(validation.fieldSources)) {
      if (!fieldInfo || fieldInfo.sourcesCount < 2) continue;

      totalFieldsAnalyzed++;

      // Verificar discrepância do campo
      if (fieldInfo.hasDiscrepancy && fieldInfo.divergentSources) {
        const maxDeviation = Math.max(
          ...fieldInfo.divergentSources.map((s: any) => s.deviation || 0),
        );

        if (maxDeviation > 20) {
          fieldsWithHighDiscrepancy++;
        }

        // Verificar campos críticos
        if (criticalFields.includes(fieldName) && maxDeviation > 15) {
          criticalFieldsWithIssue++;
          this.logger.debug(
            `[DISCREPANCY] Critical field ${fieldName} has ${maxDeviation.toFixed(1)}% deviation`,
          );
        }
      }
    }

    // Critério: >30% dos campos com discrepância alta OU campos críticos com problema
    const discrepancyRatio = totalFieldsAnalyzed > 0 ? fieldsWithHighDiscrepancy / totalFieldsAnalyzed : 0;

    if (discrepancyRatio > 0.3) {
      this.logger.debug(
        `[DISCREPANCY] ${(discrepancyRatio * 100).toFixed(1)}% of fields have high discrepancy (>30%), needs fallback`,
      );
      return true;
    }

    if (criticalFieldsWithIssue >= 2) {
      this.logger.debug(
        `[DISCREPANCY] ${criticalFieldsWithIssue} critical fields have issues, needs fallback`,
      );
      return true;
    }

    return false;
  }

  /**
   * FASE 3 - Fallback para scrapers Python quando TypeScript scrapers falham
   *
   * Chama a API Python em /api/scrapers/fundamental/{ticker} para obter
   * dados de fontes adicionais quando os scrapers TypeScript não atingem
   * o mínimo de fontes requerido.
   *
   * @param ticker - Código do ativo (ex: PETR4)
   * @param minSources - Número mínimo de fontes necessárias
   * @returns Array de resultados das fontes Python
   */
  async runPythonFallbackScrapers(
    ticker: string,
    minSources: number,
  ): Promise<Array<{ source: string; data: any; execution_time: number }>> {
    this.logger.log(
      `[PYTHON-FALLBACK] Requesting ${minSources} sources for ${ticker} from Python API`,
    );

    try {
      const url = `${this.pythonApiUrl}/api/scrapers/fundamental/${ticker}`;
      const response = await firstValueFrom(
        this.httpService.post(url, {
          min_sources: minSources,
          timeout_per_scraper: 60,
        }),
      );

      const data = response.data;

      if (!data.min_sources_met) {
        this.logger.warn(
          `[PYTHON-FALLBACK] ${ticker}: Python API got only ${data.sources_count}/${minSources} sources`,
        );
      } else {
        this.logger.log(
          `[PYTHON-FALLBACK] ${ticker}: Got ${data.sources_count} sources from Python API in ${data.execution_time}s`,
        );
      }

      // Retornar apenas os dados bem-sucedidos
      return data.data.map((result: any) => ({
        source: result.source,
        data: result.data,
        execution_time: result.execution_time,
      }));
    } catch (error) {
      this.logger.error(
        `[PYTHON-FALLBACK] ${ticker}: Failed to call Python API - ${error.message}`,
      );
      return []; // Retorna array vazio em caso de erro
    }
  }

  /**
   * Get all available scrapers (TypeScript only)
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
   * Get list of all Python scrapers from Python API
   *
   * Calls GET http://localhost:8000/api/scrapers/list
   * Returns list of 26 scrapers with metadata
   */
  async getPythonScrapersList(): Promise<PythonScraperInfo[]> {
    this.logger.log('[PYTHON-API] Fetching scrapers list from Python API');

    try {
      const url = `${this.pythonApiUrl}/api/scrapers/list`;
      const response = await firstValueFrom(
        this.httpService.get(url, { timeout: 10000 }),
      );

      const data = response.data;
      this.logger.log(`[PYTHON-API] Got ${data.total} scrapers (${data.public} public, ${data.private} private)`);

      return data.scrapers || [];
    } catch (error) {
      this.logger.error(`[PYTHON-API] Failed to get scrapers list: ${error.message}`);
      return [];
    }
  }

  /**
   * Test a Python scraper via Python API
   *
   * Calls POST http://localhost:8000/api/scrapers/test
   */
  async testPythonScraper(scraperId: string, ticker: string): Promise<PythonScraperTestResult> {
    this.logger.log(`[PYTHON-API] Testing scraper ${scraperId} with ticker ${ticker}`);

    try {
      const url = `${this.pythonApiUrl}/api/scrapers/test`;
      const response = await firstValueFrom(
        this.httpService.post(url, {
          scraper: scraperId.toUpperCase(),
          query: ticker,
        }, { timeout: 120000 }), // 2 minute timeout for scraper tests
      );

      const result = response.data;
      this.logger.log(
        `[PYTHON-API] Scraper ${scraperId} test ${result.success ? 'SUCCESS' : 'FAILED'} in ${result.execution_time}s`,
      );

      return result;
    } catch (error) {
      this.logger.error(`[PYTHON-API] Failed to test scraper ${scraperId}: ${error.message}`);
      return {
        success: false,
        scraper: scraperId,
        query: ticker,
        error: error.message,
        execution_time: 0,
      };
    }
  }

  /**
   * Map Python category to frontend type
   */
  private mapCategoryToType(category: string): UnifiedScraperStatus['type'] {
    const categoryMap: Record<string, UnifiedScraperStatus['type']> = {
      fundamental_analysis: 'fundamental',
      technical_analysis: 'technical',
      options: 'options',
      news: 'news',
      ai_analysis: 'ai',
      market_data: 'market_data',
      crypto: 'crypto',
      official_data: 'macro',
    };
    return categoryMap[category] || 'fundamental';
  }

  /**
   * Get unified status of ALL scrapers (TypeScript + Python)
   *
   * Merges TypeScript scrapers with Python API scrapers
   * Returns comprehensive list for Data Sources page
   */
  async getAllScrapersStatus(
    metricsMap: Map<string, any>,
  ): Promise<UnifiedScraperStatus[]> {
    this.logger.log('[UNIFIED] Building unified scrapers status');

    const results: UnifiedScraperStatus[] = [];

    // 1. Add TypeScript scrapers (with real metrics)
    const typescriptScrapers = [
      {
        id: 'fundamentus',
        name: 'Fundamentus',
        url: 'https://fundamentus.com.br',
        requiresAuth: false,
        category: 'fundamental_analysis',
        description: 'Dados fundamentalistas públicos - scraper TypeScript nativo',
      },
      {
        id: 'brapi',
        name: 'BRAPI',
        url: 'https://brapi.dev',
        requiresAuth: true,
        category: 'fundamental_analysis',
        description: 'API de dados financeiros brasileiros',
      },
      {
        id: 'statusinvest',
        name: 'Status Invest',
        url: 'https://statusinvest.com.br',
        requiresAuth: true,
        category: 'fundamental_analysis',
        description: 'Plataforma de análise fundamentalista',
      },
      {
        id: 'investidor10',
        name: 'Investidor10',
        url: 'https://investidor10.com.br',
        requiresAuth: true,
        category: 'fundamental_analysis',
        description: 'Portal de análise de investimentos',
      },
      {
        id: 'fundamentei',
        name: 'Fundamentei',
        url: 'https://fundamentei.com',
        requiresAuth: true,
        category: 'fundamental_analysis',
        description: 'Análise fundamentalista de ações',
      },
      {
        id: 'investsite',
        name: 'Investsite',
        url: 'https://www.investsite.com.br',
        requiresAuth: false,
        category: 'fundamental_analysis',
        description: 'Portal de dados de ações e FIIs',
      },
      {
        id: 'opcoes',
        name: 'Opções.net',
        url: 'https://opcoes.net.br',
        requiresAuth: false,
        category: 'options',
        description: 'Dados de opções (calls/puts) - scraper TypeScript',
      },
    ];

    for (const config of typescriptScrapers) {
      const metrics = metricsMap.get(config.id);

      // FASE 90: Determinar status baseado em métricas e último resultado
      let status: 'active' | 'inactive' | 'error' = 'inactive';
      if (metrics && metrics.totalRequests > 0) {
        // Se tem métricas recentes, verificar último resultado
        if (metrics.lastTestSuccess === false || metrics.successRate < 50) {
          status = 'error';
        } else {
          status = 'active';
        }
      }

      results.push({
        id: config.id,
        name: config.name,
        url: config.url,
        type: this.mapCategoryToType(config.category),
        status,
        lastTest: metrics?.lastTest?.toISOString() || null,
        lastTestSuccess: metrics?.lastTestSuccess ?? null, // FASE 90
        lastSync: metrics?.lastSync?.toISOString() || null,
        lastSyncSuccess: metrics?.lastSyncSuccess ?? null, // FASE 90
        successRate: metrics?.successRate || 0,
        totalRequests: metrics?.totalRequests || 0,
        failedRequests: metrics?.failedRequests || 0,
        avgResponseTime: metrics?.avgResponseTime || 0,
        requiresAuth: config.requiresAuth,
        runtime: 'typescript',
        category: config.category,
        description: config.description,
        errorMessage: metrics?.lastErrorMessage || undefined, // FASE 90
      });
    }

    // 2. Fetch Python scrapers and add them
    // FASE 90: Handle Python API offline scenario
    let pythonScrapers: PythonScraperInfo[] = [];
    let pythonApiOnline = true;

    try {
      pythonScrapers = await this.getPythonScrapersList();
    } catch (error) {
      this.logger.warn(`[UNIFIED] Python API is offline: ${error.message}`);
      pythonApiOnline = false;
    }

    // Se Python API está offline, adicionar status de erro
    if (!pythonApiOnline) {
      results.push({
        id: 'python-api',
        name: 'Python Scrapers API',
        url: this.pythonApiUrl,
        type: 'fundamental',
        status: 'error',
        lastTest: null,
        lastTestSuccess: null,
        lastSync: null,
        lastSyncSuccess: null,
        successRate: 0,
        totalRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        requiresAuth: false,
        runtime: 'python',
        category: 'api',
        description: 'API Python offline - verifique se o container scrapers está rodando',
        errorMessage: 'Connection refused - Python API not responding',
      });
    }

    for (const pyScraper of pythonScrapers) {
      // Skip if already added as TypeScript scraper (avoid duplicates)
      const existingTs = results.find(
        (r) => r.id.toLowerCase() === pyScraper.id.toLowerCase() ||
               r.name.toLowerCase() === pyScraper.name.toLowerCase(),
      );

      if (existingTs) {
        this.logger.debug(`[UNIFIED] Skipping Python scraper ${pyScraper.id} - already exists as TypeScript`);
        continue;
      }

      // FASE 90: Buscar métricas para scrapers Python também!
      const scraperId = pyScraper.id.toLowerCase();
      const metrics = metricsMap.get(scraperId);

      // Determinar status baseado em métricas
      let status: 'active' | 'inactive' | 'error' = 'inactive';
      if (metrics && metrics.totalRequests > 0) {
        if (metrics.lastTestSuccess === false || metrics.successRate < 50) {
          status = 'error';
        } else {
          status = 'active';
        }
      } else {
        // Sem métricas = nunca testado, mas está disponível
        status = 'inactive';
      }

      results.push({
        id: scraperId,
        name: pyScraper.name,
        url: pyScraper.url,
        type: this.mapCategoryToType(pyScraper.category),
        status,
        lastTest: metrics?.lastTest?.toISOString() || null,
        lastTestSuccess: metrics?.lastTestSuccess ?? null, // FASE 90
        lastSync: metrics?.lastSync?.toISOString() || null,
        lastSyncSuccess: metrics?.lastSyncSuccess ?? null, // FASE 90
        successRate: metrics?.successRate || 0,
        totalRequests: metrics?.totalRequests || 0,
        failedRequests: metrics?.failedRequests || 0,
        avgResponseTime: metrics?.avgResponseTime || 0,
        requiresAuth: pyScraper.requires_login,
        runtime: 'python',
        category: pyScraper.category,
        description: pyScraper.description,
        errorMessage: metrics?.lastErrorMessage || undefined, // FASE 90
      });
    }

    this.logger.log(`[UNIFIED] Total scrapers: ${results.length} (Python API: ${pythonApiOnline ? 'online' : 'offline'})`);

    return results;
  }

  /**
   * Check if a scraper ID belongs to a Python scraper
   */
  isPythonScraper(scraperId: string): boolean {
    const typescriptScraperIds = [
      'fundamentus', 'brapi', 'statusinvest',
      'investidor10', 'fundamentei', 'investsite', 'opcoes',
    ];
    return !typescriptScraperIds.includes(scraperId.toLowerCase());
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
   * FASE 70 - Dashboard de Discrepâncias (expanded)
   * Retorna lista de discrepâncias ordenadas por severidade
   */
  async getDiscrepancies(options: {
    limit?: number;
    severity?: 'all' | 'high' | 'medium' | 'low';
    field?: string;
    ticker?: string;
    page?: number;
    pageSize?: number;
    orderBy?: 'severity' | 'deviation' | 'ticker' | 'field' | 'date';
    orderDirection?: 'asc' | 'desc';
  }): Promise<DiscrepanciesResponseDto> {
    const {
      limit,
      severity = 'all',
      field,
      ticker,
      page,
      pageSize = 50,
      orderBy = 'severity',
      orderDirection = 'desc',
    } = options;

    this.logger.log(`[DISCREPANCIES] Fetching discrepancies: limit=${limit}, severity=${severity}, field=${field}, ticker=${ticker}, page=${page}`);

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

      const assetTicker = data.asset.ticker;

      // Filter by ticker if specified
      if (ticker && assetTicker.toUpperCase() !== ticker.toUpperCase()) continue;

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
          ticker: assetTicker,
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

    // Sort based on orderBy and orderDirection
    const severityOrder = { high: 0, medium: 1, low: 2 };
    const direction = orderDirection === 'asc' ? 1 : -1;

    allDiscrepancies.sort((a, b) => {
      let comparison = 0;

      switch (orderBy) {
        case 'severity':
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          if (comparison === 0) {
            // Secondary sort by deviation
            const maxDeviationA = Math.max(...a.divergentSources.map((s) => s.deviation));
            const maxDeviationB = Math.max(...b.divergentSources.map((s) => s.deviation));
            comparison = maxDeviationB - maxDeviationA;
          }
          break;
        case 'deviation':
          const deviationA = Math.max(...a.divergentSources.map((s) => s.deviation));
          const deviationB = Math.max(...b.divergentSources.map((s) => s.deviation));
          comparison = deviationB - deviationA;
          break;
        case 'ticker':
          comparison = a.ticker.localeCompare(b.ticker);
          break;
        case 'field':
          comparison = a.fieldLabel.localeCompare(b.fieldLabel);
          break;
        case 'date':
          comparison = new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
          break;
        default:
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
      }

      return comparison * direction;
    });

    // Calculate summary (before pagination)
    const summary = {
      total: allDiscrepancies.length,
      high: allDiscrepancies.filter((d) => d.severity === 'high').length,
      medium: allDiscrepancies.filter((d) => d.severity === 'medium').length,
      low: allDiscrepancies.filter((d) => d.severity === 'low').length,
    };

    // Apply pagination or limit
    let resultDiscrepancies: DiscrepancyDto[];
    let pagination: { page: number; pageSize: number; totalPages: number; totalItems: number } | undefined;

    if (page !== undefined) {
      // Pagination mode
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      resultDiscrepancies = allDiscrepancies.slice(startIndex, endIndex);
      pagination = {
        page,
        pageSize,
        totalPages: Math.ceil(allDiscrepancies.length / pageSize),
        totalItems: allDiscrepancies.length,
      };
    } else if (limit !== undefined) {
      // Legacy limit mode
      resultDiscrepancies = allDiscrepancies.slice(0, limit);
    } else {
      // Default limit
      resultDiscrepancies = allDiscrepancies.slice(0, 50);
    }

    this.logger.log(
      `[DISCREPANCIES] Found ${summary.total} discrepancies (${summary.high} high, ${summary.medium} medium, ${summary.low} low)`,
    );

    return {
      discrepancies: resultDiscrepancies,
      summary,
      pagination,
    };
  }

  /**
   * Get aggregated statistics for discrepancies
   *
   * FASE 70 - Dashboard de Discrepâncias
   * Returns top assets, top fields, and timeline data
   */
  async getDiscrepancyStats(options: {
    topLimit?: number;
  }): Promise<DiscrepancyStatsResponseDto> {
    const { topLimit = 10 } = options;

    this.logger.log(`[DISCREPANCY_STATS] Fetching stats with topLimit=${topLimit}`);

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

    // Aggregate data
    const assetStats = new Map<string, {
      ticker: string;
      assetName: string;
      count: number;
      totalDeviation: number;
      highCount: number;
      mediumCount: number;
      lowCount: number;
    }>();

    const fieldStats = new Map<string, {
      field: string;
      fieldLabel: string;
      count: number;
      totalDeviation: number;
    }>();

    const timelineMap = new Map<string, {
      date: string;
      high: number;
      medium: number;
      low: number;
      total: number;
    }>();

    for (const data of fundamentalData) {
      if (!data.fieldSources || !data.asset) continue;

      const ticker = data.asset.ticker;
      const assetName = data.asset.name;
      const updateDate = data.updatedAt ? data.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

      for (const [fieldName, fieldInfo] of Object.entries(data.fieldSources)) {
        if (!fieldInfo || !fieldInfo.hasDiscrepancy || !fieldInfo.divergentSources) continue;

        const maxDeviation = Math.max(...fieldInfo.divergentSources.map((s: any) => s.deviation || 0));
        let severityLevel: 'high' | 'medium' | 'low';
        if (maxDeviation > 20) {
          severityLevel = 'high';
        } else if (maxDeviation > 10) {
          severityLevel = 'medium';
        } else {
          severityLevel = 'low';
        }

        // Update asset stats
        const existingAsset = assetStats.get(ticker) || {
          ticker,
          assetName,
          count: 0,
          totalDeviation: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
        };
        existingAsset.count++;
        existingAsset.totalDeviation += maxDeviation;
        if (severityLevel === 'high') existingAsset.highCount++;
        if (severityLevel === 'medium') existingAsset.mediumCount++;
        if (severityLevel === 'low') existingAsset.lowCount++;
        assetStats.set(ticker, existingAsset);

        // Update field stats
        const existingField = fieldStats.get(fieldName) || {
          field: fieldName,
          fieldLabel: fieldLabels[fieldName] || fieldName,
          count: 0,
          totalDeviation: 0,
        };
        existingField.count++;
        existingField.totalDeviation += maxDeviation;
        fieldStats.set(fieldName, existingField);

        // Update timeline
        const existingDate = timelineMap.get(updateDate) || {
          date: updateDate,
          high: 0,
          medium: 0,
          low: 0,
          total: 0,
        };
        existingDate.total++;
        if (severityLevel === 'high') existingDate.high++;
        if (severityLevel === 'medium') existingDate.medium++;
        if (severityLevel === 'low') existingDate.low++;
        timelineMap.set(updateDate, existingDate);
      }
    }

    // Convert to arrays and sort
    const topAssets = Array.from(assetStats.values())
      .map((a) => ({
        ...a,
        avgDeviation: a.count > 0 ? Math.round((a.totalDeviation / a.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topLimit);

    const topFields = Array.from(fieldStats.values())
      .map((f) => ({
        ...f,
        avgDeviation: f.count > 0 ? Math.round((f.totalDeviation / f.count) * 100) / 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topLimit);

    const timeline = Array.from(timelineMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    this.logger.log(`[DISCREPANCY_STATS] Stats calculated: ${topAssets.length} top assets, ${topFields.length} top fields`);

    return {
      topAssets,
      topFields,
      timeline,
    };
  }
}
