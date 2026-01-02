import { Injectable, Logger } from '@nestjs/common';

/**
 * Validation result for individual field
 */
export interface FieldValidationResult {
  field: string;
  isValid: boolean;
  value: any;
  reason?: string;
}

/**
 * Complete validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: FieldValidationResult[];
  warnings: FieldValidationResult[];
}

/**
 * Cross-validation result from multiple sources
 */
export interface CrossValidationResult {
  isValid: boolean;
  confidence: number;
  consensusValue: number | null;
  sources: number;
  variance: number;
  outliers: { source: string; value: number; deviation: number }[];
}

/**
 * Source data for cross-validation
 */
export interface SourceData {
  source: string;
  value: number;
  timestamp?: Date;
}

@Injectable()
export class ValidatorsService {
  private readonly logger = new Logger(ValidatorsService.name);

  // Validation ranges for fundamental data (based on Brazilian market reality)
  private readonly FUNDAMENTAL_RANGES = {
    // P/L: Price/Earnings - can be negative, typically -100 to 500
    pl: { min: -1000, max: 2000, warnMin: -50, warnMax: 100 },
    // P/VP: Price/Book Value - typically 0.1 to 50
    pvp: { min: 0, max: 100, warnMin: 0.3, warnMax: 20 },
    // ROE: Return on Equity - typically -50% to 100%
    roe: { min: -100, max: 200, warnMin: -20, warnMax: 50 },
    // ROA: Return on Assets - typically -30% to 50%
    roa: { min: -50, max: 100, warnMin: -10, warnMax: 30 },
    // ROIC: Return on Invested Capital - typically -30% to 80%
    roic: { min: -50, max: 150, warnMin: -10, warnMax: 40 },
    // Dividend Yield: typically 0% to 30%
    dividendYield: { min: 0, max: 50, warnMin: 0, warnMax: 15 },
    // Margins: typically -50% to 80%
    grossMargin: { min: -100, max: 100, warnMin: 0, warnMax: 70 },
    ebitdaMargin: { min: -100, max: 100, warnMin: 0, warnMax: 50 },
    netMargin: { min: -100, max: 100, warnMin: -10, warnMax: 40 },
    // Liquidity ratios: typically 0 to 10
    currentLiquidity: { min: 0, max: 50, warnMin: 0.5, warnMax: 5 },
    // Debt ratios
    netDebtEbitda: { min: -20, max: 50, warnMin: -5, warnMax: 5 },
    debtEquity: { min: 0, max: 20, warnMin: 0, warnMax: 3 },
    // PSR: Price/Sales Ratio - typically 0.1 to 30
    psr: { min: 0, max: 100, warnMin: 0.2, warnMax: 10 },
    // EV/EBITDA: typically -50 to 100
    evEbitda: { min: -100, max: 200, warnMin: 0, warnMax: 30 },
  };

  // Price validation thresholds
  private readonly PRICE_THRESHOLDS = {
    // Maximum daily price change percentage (circuit breaker levels)
    maxDailyChange: 30, // 30% - extreme but possible
    // Maximum gap between high and low
    maxDailyRange: 50, // 50% intraday range is extreme
    // Minimum price (centavos)
    minPrice: 0.01,
    // Maximum price (realistic for B3)
    maxPrice: 10000,
  };

  /**
   * Validate fundamental data from scrapers
   * Checks for realistic ranges and data consistency
   */
  validateFundamentalData(data: Record<string, any>): ValidationResult {
    const errors: FieldValidationResult[] = [];
    const warnings: FieldValidationResult[] = [];

    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        errors: [{ field: 'data', isValid: false, value: data, reason: 'Invalid data object' }],
        warnings: [],
      };
    }

    // Validate each fundamental field
    for (const [field, range] of Object.entries(this.FUNDAMENTAL_RANGES)) {
      const value = data[field];

      // Skip if field is not present
      if (value === undefined || value === null) {
        continue;
      }

      // Check if value is a valid number
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) {
        errors.push({
          field,
          isValid: false,
          value,
          reason: `Invalid number: ${value}`,
        });
        continue;
      }

      // Check hard limits
      if (numValue < range.min || numValue > range.max) {
        errors.push({
          field,
          isValid: false,
          value: numValue,
          reason: `Value ${numValue} out of valid range [${range.min}, ${range.max}]`,
        });
      }
      // Check warning limits
      else if (numValue < range.warnMin || numValue > range.warnMax) {
        warnings.push({
          field,
          isValid: true,
          value: numValue,
          reason: `Value ${numValue} outside typical range [${range.warnMin}, ${range.warnMax}]`,
        });
      }
    }

    // Cross-field validations
    this.validateFundamentalConsistency(data, errors, warnings);

    const isValid = errors.length === 0;

    if (!isValid) {
      this.logger.warn(`Fundamental data validation failed: ${errors.length} errors`, {
        errors: errors.map((e) => `${e.field}: ${e.reason}`),
      });
    }

    return { isValid, errors, warnings };
  }

  /**
   * Validate cross-field consistency for fundamental data
   */
  private validateFundamentalConsistency(
    data: Record<string, any>,
    errors: FieldValidationResult[],
    warnings: FieldValidationResult[],
  ): void {
    // ROE should be approximately ROA * financial leverage
    if (data.roe !== undefined && data.roa !== undefined && data.debtEquity !== undefined) {
      const expectedRoe = data.roa * (1 + data.debtEquity);
      const roeDeviation = Math.abs(data.roe - expectedRoe);
      if (roeDeviation > 20 && data.roe !== 0) {
        warnings.push({
          field: 'roe_consistency',
          isValid: true,
          value: { roe: data.roe, expectedRoe },
          reason: `ROE (${data.roe}) significantly differs from expected (${expectedRoe.toFixed(2)}) based on ROA and leverage`,
        });
      }
    }

    // Net margin should be less than gross margin
    if (data.netMargin !== undefined && data.grossMargin !== undefined) {
      if (data.netMargin > data.grossMargin && data.grossMargin > 0) {
        errors.push({
          field: 'margin_consistency',
          isValid: false,
          value: { netMargin: data.netMargin, grossMargin: data.grossMargin },
          reason: 'Net margin cannot exceed gross margin',
        });
      }
    }

    // EBITDA margin should be between gross and net margin
    if (
      data.ebitdaMargin !== undefined &&
      data.grossMargin !== undefined &&
      data.netMargin !== undefined
    ) {
      if (data.ebitdaMargin > data.grossMargin && data.grossMargin > 0) {
        warnings.push({
          field: 'ebitda_margin_consistency',
          isValid: true,
          value: { ebitdaMargin: data.ebitdaMargin, grossMargin: data.grossMargin },
          reason: 'EBITDA margin typically should not exceed gross margin',
        });
      }
    }
  }

  /**
   * Validate OHLCV price data
   * Checks for realistic values and internal consistency
   */
  validatePriceData(data: Record<string, any>): ValidationResult {
    const errors: FieldValidationResult[] = [];
    const warnings: FieldValidationResult[] = [];

    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        errors: [{ field: 'data', isValid: false, value: data, reason: 'Invalid data object' }],
        warnings: [],
      };
    }

    const { open, high, low, close, volume, adjustedClose } = data;

    // Validate price fields exist and are numbers
    const priceFields = { open, high, low, close };
    for (const [field, value] of Object.entries(priceFields)) {
      if (value === undefined || value === null) {
        errors.push({
          field,
          isValid: false,
          value,
          reason: `Missing required field: ${field}`,
        });
        continue;
      }

      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(numValue)) {
        errors.push({
          field,
          isValid: false,
          value,
          reason: `Invalid number for ${field}: ${value}`,
        });
        continue;
      }

      // Check price range
      if (numValue < this.PRICE_THRESHOLDS.minPrice) {
        errors.push({
          field,
          isValid: false,
          value: numValue,
          reason: `Price below minimum: ${numValue} < ${this.PRICE_THRESHOLDS.minPrice}`,
        });
      }
      if (numValue > this.PRICE_THRESHOLDS.maxPrice) {
        warnings.push({
          field,
          isValid: true,
          value: numValue,
          reason: `Unusually high price: ${numValue} > ${this.PRICE_THRESHOLDS.maxPrice}`,
        });
      }
    }

    // OHLC consistency checks (only if all values are valid numbers)
    const numOpen = parseFloat(open);
    const numHigh = parseFloat(high);
    const numLow = parseFloat(low);
    const numClose = parseFloat(close);

    if (!isNaN(numOpen) && !isNaN(numHigh) && !isNaN(numLow) && !isNaN(numClose)) {
      // High must be >= Low
      if (numHigh < numLow) {
        errors.push({
          field: 'high_low',
          isValid: false,
          value: { high: numHigh, low: numLow },
          reason: `High (${numHigh}) cannot be less than Low (${numLow})`,
        });
      }

      // High must be >= Open and Close
      if (numHigh < numOpen || numHigh < numClose) {
        errors.push({
          field: 'high_consistency',
          isValid: false,
          value: { high: numHigh, open: numOpen, close: numClose },
          reason: `High (${numHigh}) must be >= Open (${numOpen}) and Close (${numClose})`,
        });
      }

      // Low must be <= Open and Close
      if (numLow > numOpen || numLow > numClose) {
        errors.push({
          field: 'low_consistency',
          isValid: false,
          value: { low: numLow, open: numOpen, close: numClose },
          reason: `Low (${numLow}) must be <= Open (${numOpen}) and Close (${numClose})`,
        });
      }

      // Check for extreme daily range
      const dailyRange = ((numHigh - numLow) / numLow) * 100;
      if (dailyRange > this.PRICE_THRESHOLDS.maxDailyRange) {
        warnings.push({
          field: 'daily_range',
          isValid: true,
          value: dailyRange,
          reason: `Extreme daily range: ${dailyRange.toFixed(2)}% > ${this.PRICE_THRESHOLDS.maxDailyRange}%`,
        });
      }
    }

    // Volume validation
    if (volume !== undefined && volume !== null) {
      const numVolume = typeof volume === 'string' ? parseFloat(volume) : volume;
      if (isNaN(numVolume) || numVolume < 0) {
        errors.push({
          field: 'volume',
          isValid: false,
          value: volume,
          reason: 'Volume must be a non-negative number',
        });
      }
    }

    // Adjusted close validation
    if (adjustedClose !== undefined && adjustedClose !== null) {
      const numAdjusted =
        typeof adjustedClose === 'string' ? parseFloat(adjustedClose) : adjustedClose;
      if (isNaN(numAdjusted) || numAdjusted <= 0) {
        errors.push({
          field: 'adjustedClose',
          isValid: false,
          value: adjustedClose,
          reason: 'Adjusted close must be a positive number',
        });
      }
    }

    const isValid = errors.length === 0;

    if (!isValid) {
      this.logger.warn(`Price data validation failed: ${errors.length} errors`, {
        errors: errors.map((e) => `${e.field}: ${e.reason}`),
      });
    }

    return { isValid, errors, warnings };
  }

  /**
   * Cross-validate data from multiple sources
   * Returns consensus value and confidence based on source agreement
   */
  crossValidateData(sources: SourceData[]): CrossValidationResult {
    this.logger.log(`Cross-validating data from ${sources.length} sources`);

    // Need at least 2 sources for cross-validation
    if (!sources || sources.length < 2) {
      return {
        isValid: sources?.length === 1,
        confidence: sources?.length === 1 ? 0.5 : 0,
        consensusValue: sources?.[0]?.value ?? null,
        sources: sources?.length ?? 0,
        variance: 0,
        outliers: [],
      };
    }

    // Filter out invalid values
    const validSources = sources.filter(
      (s) => s.value !== undefined && s.value !== null && !isNaN(s.value) && isFinite(s.value),
    );

    if (validSources.length < 2) {
      return {
        isValid: validSources.length === 1,
        confidence: validSources.length === 1 ? 0.5 : 0,
        consensusValue: validSources[0]?.value ?? null,
        sources: validSources.length,
        variance: 0,
        outliers: [],
      };
    }

    const values = validSources.map((s) => s.value);

    // Calculate statistics
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Calculate coefficient of variation (CV)
    const cv = mean !== 0 ? (stdDev / Math.abs(mean)) * 100 : 0;

    // Identify outliers (values > 2 standard deviations from mean)
    const outliers = validSources
      .filter((s) => Math.abs(s.value - mean) > 2 * stdDev)
      .map((s) => ({
        source: s.source,
        value: s.value,
        deviation: ((s.value - mean) / (stdDev || 1)).toFixed(2) as unknown as number,
      }));

    // Calculate median for consensus (more robust than mean)
    const sorted = [...values].sort((a, b) => a - b);
    const median =
      sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    // Calculate confidence based on:
    // 1. Number of sources (more = better)
    // 2. Agreement between sources (lower CV = better)
    // 3. Absence of outliers
    let confidence = 0;

    // Base confidence from number of sources (min 3 for high confidence)
    if (validSources.length >= 5) {
      confidence += 0.3;
    } else if (validSources.length >= 3) {
      confidence += 0.25;
    } else {
      confidence += 0.15;
    }

    // Agreement bonus (lower CV = higher confidence)
    if (cv < 1) {
      confidence += 0.4; // Excellent agreement (<1% variation)
    } else if (cv < 5) {
      confidence += 0.3; // Good agreement (<5% variation)
    } else if (cv < 10) {
      confidence += 0.2; // Moderate agreement (<10% variation)
    } else if (cv < 20) {
      confidence += 0.1; // Poor agreement (<20% variation)
    }
    // cv >= 20% gets no bonus

    // Outlier penalty
    const outlierRatio = outliers.length / validSources.length;
    if (outlierRatio === 0) {
      confidence += 0.3; // No outliers
    } else if (outlierRatio < 0.2) {
      confidence += 0.2; // Few outliers (<20%)
    } else if (outlierRatio < 0.4) {
      confidence += 0.1; // Some outliers (<40%)
    }
    // More than 40% outliers gets no bonus

    // Cap confidence at 0.99 (never 100% certain)
    confidence = Math.min(0.99, confidence);

    // Data is valid if confidence >= 0.6 and we have at least 3 agreeing sources
    const agreeing = validSources.length - outliers.length;
    const isValid = confidence >= 0.6 && agreeing >= 2;

    this.logger.log(
      `Cross-validation result: confidence=${(confidence * 100).toFixed(1)}%, ` +
        `sources=${validSources.length}, outliers=${outliers.length}, CV=${cv.toFixed(2)}%`,
    );

    return {
      isValid,
      confidence: parseFloat(confidence.toFixed(4)),
      consensusValue: parseFloat(median.toFixed(4)),
      sources: validSources.length,
      variance: parseFloat(variance.toFixed(6)),
      outliers,
    };
  }

  /**
   * Validate price change percentage
   * Returns true if change is within circuit breaker limits
   */
  validatePriceChange(previousClose: number, currentClose: number): ValidationResult {
    const errors: FieldValidationResult[] = [];
    const warnings: FieldValidationResult[] = [];

    if (previousClose <= 0 || currentClose <= 0) {
      errors.push({
        field: 'prices',
        isValid: false,
        value: { previousClose, currentClose },
        reason: 'Prices must be positive numbers',
      });
      return { isValid: false, errors, warnings };
    }

    const changePercent = ((currentClose - previousClose) / previousClose) * 100;

    if (Math.abs(changePercent) > this.PRICE_THRESHOLDS.maxDailyChange) {
      errors.push({
        field: 'change_percent',
        isValid: false,
        value: changePercent,
        reason: `Price change ${changePercent.toFixed(2)}% exceeds maximum allowed ${this.PRICE_THRESHOLDS.maxDailyChange}%`,
      });
    } else if (Math.abs(changePercent) > this.PRICE_THRESHOLDS.maxDailyChange * 0.7) {
      warnings.push({
        field: 'change_percent',
        isValid: true,
        value: changePercent,
        reason: `Large price change: ${changePercent.toFixed(2)}%`,
      });
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Detect potential outliers in a time series
   * Uses Z-score method with configurable threshold
   */
  detectOutliers(values: number[], threshold: number = 3): number[] {
    if (values.length < 3) {
      return [];
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length,
    );

    if (stdDev === 0) {
      return [];
    }

    return values
      .map((val, idx) => ({ val, idx, zScore: Math.abs((val - mean) / stdDev) }))
      .filter((item) => item.zScore > threshold)
      .map((item) => item.idx);
  }
}
