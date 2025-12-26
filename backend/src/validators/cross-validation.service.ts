import { Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_TOLERANCES,
  SOURCE_PRIORITY,
  isPercentageField,
  normalizePercentageValue,
} from '../scrapers/interfaces/field-source.interface';

/**
 * Source data for cross-validation
 */
export interface SourceValue {
  source: string;
  value: number | null;
  scrapedAt?: string;
}

/**
 * Result of grouping similar values
 */
export interface ValueGroup {
  representativeValue: number;
  sources: string[];
}

/**
 * Result of consensus selection
 */
export interface ConsensusResult {
  finalValue: number | null;
  finalSource: string;
  agreementCount: number;
  consensus: number;
  hasDiscrepancy: boolean;
  divergentSources?: Array<{ source: string; value: number; deviation: number }>;
}

/**
 * Field source tracking information
 */
export interface FieldSourceInfo {
  values: SourceValue[];
  finalValue: number | null;
  finalSource: string;
  sourcesCount: number;
  agreementCount: number;
  consensus: number;
  hasDiscrepancy: boolean;
  divergentSources?: Array<{ source: string; value: number; deviation: number }>;
}

// NOTE: DEFAULT_TOLERANCES e SOURCE_PRIORITY importados de field-source.interface.ts
// para manter única fonte de verdade (FASE DISCREPANCY-FIX)

/**
 * Cross-Validation Service
 *
 * Provides algorithms for validating financial data from multiple sources
 * using consensus-based selection rather than averaging.
 */
@Injectable()
export class CrossValidationService {
  private readonly logger = new Logger(CrossValidationService.name);

  /**
   * Check if two values are equal within a given tolerance
   *
   * @param value1 - First value to compare
   * @param value2 - Second value to compare
   * @param tolerance - Tolerance threshold (0.05 = 5%)
   * @returns true if values are within tolerance
   */
  valuesAreEqual(value1: number, value2: number, tolerance: number = 0.05): boolean {
    if (value1 === value2) return true;

    // If either is zero, use absolute comparison
    if (value1 === 0 || value2 === 0) {
      return Math.abs(value1 - value2) <= tolerance;
    }

    // Percentage comparison
    const deviation = Math.abs(value1 - value2) / Math.abs(value2);
    return deviation <= tolerance;
  }

  /**
   * Maximum deviation cap to prevent astronomical values
   * 10000 = 10,000% (100x difference)
   */
  private readonly MAX_DEVIATION = 10000;

  /**
   * Calculate the percentage deviation between two values
   *
   * @param value - Value to compare
   * @param reference - Reference value
   * @returns Deviation as percentage (0-10000, capped)
   */
  calculateDeviation(value: number, reference: number): number {
    // Protection: if reference is 0, cap the deviation
    if (reference === 0) {
      return value === 0 ? 0 : this.MAX_DEVIATION;
    }

    // Protection: if reference is very small (could cause overflow)
    if (Math.abs(reference) < 0.0001) {
      return this.MAX_DEVIATION;
    }

    const deviation = Math.round(Math.abs((value - reference) / reference) * 10000) / 100;

    // Cap the deviation to prevent astronomical values
    return Math.min(deviation, this.MAX_DEVIATION);
  }

  /**
   * Get the tolerance for a specific field
   *
   * @param field - Field name
   * @returns Tolerance threshold
   */
  getFieldTolerance(field: string): number {
    return DEFAULT_TOLERANCES.byField[field] ?? DEFAULT_TOLERANCES.default;
  }

  /**
   * Normalize values for comparison
   *
   * For percentage fields, normalizes to 0-1 format to handle
   * different scraper formats (Fundamentus 0-100 vs Investidor10 0-1)
   *
   * @param values - Array of source values
   * @param field - Field name
   * @returns Array with normalized values
   */
  normalizeValuesForComparison(values: SourceValue[], field: string): SourceValue[] {
    if (!isPercentageField(field)) {
      return values;
    }

    return values.map((v) => ({
      ...v,
      value: v.value !== null ? normalizePercentageValue(v.value, field) : null,
    }));
  }

  /**
   * Group similar values together based on tolerance
   *
   * @param values - Array of source values
   * @param tolerance - Tolerance threshold
   * @returns Array of value groups
   */
  groupSimilarValues(values: SourceValue[], tolerance: number): ValueGroup[] {
    const groups: ValueGroup[] = [];

    for (const v of values) {
      if (v.value === null) continue;

      // Find existing compatible group
      let foundGroup = false;
      for (const group of groups) {
        if (this.valuesAreEqual(v.value, group.representativeValue, tolerance)) {
          group.sources.push(v.source);
          foundGroup = true;
          break;
        }
      }

      // Create new group if no compatible one found
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
   * Select a value by consensus from multiple sources
   *
   * Algorithm:
   * 1. Normalize percentage fields for comparison (0-100 → 0-1)
   * 2. Group similar values (within tolerance)
   * 3. Find the group with most sources agreeing
   * 4. If tie or no consensus, use priority source
   * 5. Mark discrepancies for analysis
   *
   * @param field - Field name for tolerance lookup
   * @param validValues - Array of valid (non-null) values
   * @param customTolerance - Optional custom tolerance
   * @returns Consensus result
   */
  selectByConsensus(
    field: string,
    validValues: SourceValue[],
    customTolerance?: number,
  ): ConsensusResult {
    if (validValues.length === 0) {
      return {
        finalValue: null,
        finalSource: '',
        agreementCount: 0,
        consensus: 0,
        hasDiscrepancy: false,
      };
    }

    // Single source - use directly
    if (validValues.length === 1) {
      return {
        finalValue: validValues[0].value,
        finalSource: validValues[0].source,
        agreementCount: 1,
        consensus: 100,
        hasDiscrepancy: false,
      };
    }

    // Get tolerance for this field (increased for percentage fields)
    let tolerance = customTolerance ?? this.getFieldTolerance(field);

    // Increase tolerance for percentage fields due to format conversion uncertainty
    if (isPercentageField(field) && !customTolerance) {
      tolerance = Math.max(tolerance, 0.05); // Minimum 5% tolerance for percentage fields
    }

    // Normalize percentage fields before comparison
    // This handles Fundamentus (0-100) vs Investidor10 (0-1) format difference
    const normalizedValues = this.normalizeValuesForComparison(validValues, field);

    // Group similar values using normalized values
    const groups = this.groupSimilarValues(normalizedValues, tolerance);

    // Find group with most consensus
    let bestGroup = groups[0];
    for (const group of groups) {
      if (group.sources.length > bestGroup.sources.length) {
        bestGroup = group;
      }
    }

    // Calculate consensus
    const agreementCount = bestGroup.sources.length;
    const consensus = Math.round((agreementCount / validValues.length) * 100);

    // Check for significant discrepancy
    const hasDiscrepancy = agreementCount < validValues.length && groups.length > 1;

    // Select priority source within consensus group
    let finalSource = bestGroup.sources[0];
    for (const source of SOURCE_PRIORITY) {
      if (bestGroup.sources.includes(source)) {
        finalSource = source;
        break;
      }
    }

    // Get value from selected source
    const selectedValue = validValues.find((v) => v.source === finalSource);
    const finalValue = selectedValue?.value ?? bestGroup.representativeValue;

    // Identify divergent sources
    // For percentage fields, calculate deviation using normalized values to avoid 9900% deviations
    let divergentSources: Array<{ source: string; value: number; deviation: number }> | undefined;
    if (hasDiscrepancy) {
      const isPercent = isPercentageField(field);
      const normalizedFinal = isPercent
        ? normalizePercentageValue(finalValue as number, field)
        : (finalValue as number);

      divergentSources = validValues
        .filter((v) => !bestGroup.sources.includes(v.source) && v.value !== null)
        .map((v) => {
          const normalizedValue = isPercent
            ? normalizePercentageValue(v.value as number, field)
            : (v.value as number);
          return {
            source: v.source,
            value: v.value as number, // Keep original value for display
            deviation: this.calculateDeviation(normalizedValue, normalizedFinal),
          };
        });
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
   * Calculate confidence score based on sources and discrepancies
   *
   * @param sourcesCount - Number of data sources
   * @param discrepanciesCount - Number of discrepancies found
   * @param avgDeviation - Average deviation of discrepancies
   * @param minSources - Minimum required sources for high confidence
   * @returns Confidence score (0-1)
   */
  calculateConfidence(
    sourcesCount: number,
    discrepanciesCount: number,
    avgDeviation: number = 0,
    minSources: number = 3,
  ): number {
    if (sourcesCount === 0) {
      return 0;
    }

    // Base score: 6 sources = 100%
    const sourcesScore = Math.min(sourcesCount / 6, 1.0);

    // Penalty for significant discrepancies (> 20% deviation)
    let discrepancyPenalty = 0;
    if (discrepanciesCount > 0 && avgDeviation > 20) {
      // Maximum penalty of 30%
      discrepancyPenalty = Math.min(avgDeviation / 200, 0.3);
    }

    // Calculate final confidence
    const confidence = sourcesScore * (1 - discrepancyPenalty);

    // Minimum guarantee: 50% if >= minSources
    const minConfidence = sourcesCount >= minSources ? 0.5 : 0;
    return Math.max(confidence, minConfidence);
  }

  /**
   * Check if zero is a valid value for a field
   * Some fields can legitimately be zero
   *
   * @param field - Field name
   * @returns true if zero is valid
   */
  isZeroValidForField(field: string): boolean {
    const zeroValidFields = [
      'dividaLiquida',
      'dividaBruta',
      'dividaLiquidaEbitda',
      'dividaLiquidaPatrimonio',
    ];
    return zeroValidFields.includes(field);
  }

  /**
   * Filter valid values from source data
   *
   * @param values - Array of source values
   * @param field - Field name for zero validation
   * @returns Array of valid values
   */
  filterValidValues(values: SourceValue[], field: string): SourceValue[] {
    return values.filter(
      (v) => v.value !== null && (v.value !== 0 || this.isZeroValidForField(field)),
    );
  }

  /**
   * Build field source info from raw source data
   *
   * @param field - Field name
   * @param values - Array of source values
   * @returns Field source info with consensus data
   */
  buildFieldSourceInfo(field: string, values: SourceValue[]): FieldSourceInfo | null {
    const validValues = this.filterValidValues(values, field);

    if (validValues.length === 0) {
      return null;
    }

    const result = this.selectByConsensus(field, validValues);

    return {
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

  /**
   * Detect significant discrepancies that warrant fallback
   *
   * Criteria:
   * 1. Confidence < 60%
   * 2. > 30% of fields have high discrepancy (>20%)
   * 3. Critical fields (P/L, ROE, DY) with divergence > 15%
   *
   * @param confidence - Overall confidence score
   * @param fieldSources - Map of field source info
   * @returns true if significant discrepancies found
   */
  hasSignificantDiscrepancies(
    confidence: number,
    fieldSources: Record<string, FieldSourceInfo>,
  ): boolean {
    // Low confidence needs more sources
    if (confidence < 0.6) {
      return true;
    }

    const criticalFields = ['pl', 'pvp', 'roe', 'roic', 'dividendYield', 'margemLiquida'];
    let fieldsWithHighDiscrepancy = 0;
    let totalFieldsAnalyzed = 0;
    let criticalFieldsWithIssue = 0;

    for (const [fieldName, fieldInfo] of Object.entries(fieldSources)) {
      if (!fieldInfo || fieldInfo.sourcesCount < 2) continue;

      totalFieldsAnalyzed++;

      if (fieldInfo.hasDiscrepancy && fieldInfo.divergentSources) {
        const maxDeviation = Math.max(
          ...fieldInfo.divergentSources.map((s) => s.deviation || 0),
        );

        if (maxDeviation > 20) {
          fieldsWithHighDiscrepancy++;
        }

        if (criticalFields.includes(fieldName) && maxDeviation > 15) {
          criticalFieldsWithIssue++;
        }
      }
    }

    // Criteria: >30% of fields with high discrepancy
    const discrepancyRatio =
      totalFieldsAnalyzed > 0 ? fieldsWithHighDiscrepancy / totalFieldsAnalyzed : 0;

    if (discrepancyRatio > 0.3) {
      return true;
    }

    // Criteria: 2+ critical fields with issues
    if (criticalFieldsWithIssue >= 2) {
      return true;
    }

    return false;
  }
}
