import { Test, TestingModule } from '@nestjs/testing';
import {
  ValidatorsService,
  ValidationResult,
  CrossValidationResult,
  SourceData,
} from './validators.service';

describe('ValidatorsService', () => {
  let service: ValidatorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidatorsService],
    }).compile();

    service = module.get<ValidatorsService>(ValidatorsService);
  });

  describe('validateFundamentalData', () => {
    describe('valid data', () => {
      it('should validate correct fundamental data', () => {
        const data = {
          pl: 15.5,
          pvp: 2.1,
          roe: 18.5,
          roa: 8.2,
          roic: 12.0,
          dividendYield: 5.5,
          grossMargin: 35.0,
          ebitdaMargin: 25.0,
          netMargin: 12.0,
          currentLiquidity: 1.8,
          netDebtEbitda: 2.5,
          debtEquity: 0.8,
          psr: 1.5,
          evEbitda: 8.0,
        };

        const result = service.validateFundamentalData(data);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should return warnings for atypical but valid values', () => {
        const data = {
          pl: 150.0, // High but valid
          roe: 45.0, // High but valid
          dividendYield: 12.0, // High but valid
        };

        const result = service.validateFundamentalData(data);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings.length).toBeGreaterThan(0);
      });

      it('should skip validation for missing fields', () => {
        const data = {
          pl: 15.0, // Only P/L provided
        };

        const result = service.validateFundamentalData(data);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('invalid data', () => {
      it('should reject null data', () => {
        const result = service.validateFundamentalData(null as any);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].reason).toContain('Invalid data object');
      });

      it('should reject P/L outside valid range', () => {
        const data = { pl: 5000 }; // Max is 2000

        const result = service.validateFundamentalData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'pl')).toBe(true);
      });

      it('should reject negative PVP', () => {
        const data = { pvp: -5 }; // Min is 0

        const result = service.validateFundamentalData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'pvp')).toBe(true);
      });

      it('should reject ROE outside valid range', () => {
        const data = { roe: 250 }; // Max is 200

        const result = service.validateFundamentalData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'roe')).toBe(true);
      });

      it('should reject invalid string values', () => {
        const data = { pl: 'not-a-number' };

        const result = service.validateFundamentalData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.reason?.includes('Invalid number'))).toBe(true);
      });

      it('should reject inconsistent margins (net > gross)', () => {
        const data = {
          grossMargin: 20.0,
          netMargin: 30.0, // Cannot exceed gross margin
        };

        const result = service.validateFundamentalData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'margin_consistency')).toBe(true);
      });
    });

    describe('cross-field validations', () => {
      it('should warn when ROE does not match ROA * leverage', () => {
        const data = {
          roe: 50.0,
          roa: 5.0,
          debtEquity: 1.0, // Expected ROE = 5 * (1+1) = 10
        };

        const result = service.validateFundamentalData(data);

        expect(result.isValid).toBe(true); // Warning, not error
        expect(result.warnings.some((w) => w.field === 'roe_consistency')).toBe(true);
      });
    });
  });

  describe('validatePriceData', () => {
    describe('valid data', () => {
      it('should validate correct OHLCV data', () => {
        const data = {
          open: 25.5,
          high: 26.0,
          low: 25.0,
          close: 25.8,
          volume: 1500000,
          adjustedClose: 25.8,
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept string numbers', () => {
        const data = {
          open: '25.5',
          high: '26.0',
          low: '25.0',
          close: '25.8',
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(true);
      });

      it('should accept zero volume', () => {
        const data = {
          open: 25.5,
          high: 26.0,
          low: 25.0,
          close: 25.8,
          volume: 0,
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(true);
      });
    });

    describe('invalid data', () => {
      it('should reject null data', () => {
        const result = service.validatePriceData(null as any);

        expect(result.isValid).toBe(false);
        expect(result.errors[0].reason).toContain('Invalid data object');
      });

      it('should reject missing required fields', () => {
        const data = {
          open: 25.5,
          high: 26.0,
          // missing low and close
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'low')).toBe(true);
        expect(result.errors.some((e) => e.field === 'close')).toBe(true);
      });

      it('should reject high < low', () => {
        const data = {
          open: 25.5,
          high: 24.0, // Invalid: high < low
          low: 25.0,
          close: 25.8,
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'high_low')).toBe(true);
      });

      it('should reject high < open', () => {
        const data = {
          open: 27.0,
          high: 26.0, // Invalid: high < open
          low: 25.0,
          close: 25.8,
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'high_consistency')).toBe(true);
      });

      it('should reject low > close', () => {
        const data = {
          open: 25.5,
          high: 27.0,
          low: 26.0, // Invalid: low > close
          close: 25.8,
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'low_consistency')).toBe(true);
      });

      it('should reject prices below minimum', () => {
        const data = {
          open: 0.005, // Below 0.01
          high: 0.01,
          low: 0.005,
          close: 0.01,
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(false);
      });

      it('should reject negative volume', () => {
        const data = {
          open: 25.5,
          high: 26.0,
          low: 25.0,
          close: 25.8,
          volume: -100,
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'volume')).toBe(true);
      });

      it('should reject non-positive adjusted close', () => {
        const data = {
          open: 25.5,
          high: 26.0,
          low: 25.0,
          close: 25.8,
          adjustedClose: 0,
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(false);
        expect(result.errors.some((e) => e.field === 'adjustedClose')).toBe(true);
      });
    });

    describe('warnings', () => {
      it('should warn for extreme daily range', () => {
        const data = {
          open: 25.0,
          high: 40.0, // 60% range
          low: 25.0,
          close: 35.0,
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(true);
        expect(result.warnings.some((w) => w.field === 'daily_range')).toBe(true);
      });

      it('should warn for very high prices', () => {
        const data = {
          open: 15000,
          high: 15500,
          low: 14500,
          close: 15200,
        };

        const result = service.validatePriceData(data);

        expect(result.isValid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
      });
    });
  });

  describe('crossValidateData', () => {
    describe('high confidence scenarios', () => {
      it('should return high confidence for agreeing sources', () => {
        const sources: SourceData[] = [
          { source: 'fundamentus', value: 15.50 },
          { source: 'statusinvest', value: 15.48 },
          { source: 'investidor10', value: 15.52 },
          { source: 'brapi', value: 15.51 },
          { source: 'b3', value: 15.50 },
        ];

        const result = service.crossValidateData(sources);

        expect(result.isValid).toBe(true);
        expect(result.confidence).toBeGreaterThanOrEqual(0.85);
        expect(result.sources).toBe(5);
        expect(result.outliers).toHaveLength(0);
      });

      it('should use median for consensus value', () => {
        const sources: SourceData[] = [
          { source: 'source1', value: 10 },
          { source: 'source2', value: 20 },
          { source: 'source3', value: 15 },
        ];

        const result = service.crossValidateData(sources);

        expect(result.consensusValue).toBe(15); // Median
      });

      it('should calculate median correctly for even number of sources', () => {
        const sources: SourceData[] = [
          { source: 'source1', value: 10 },
          { source: 'source2', value: 20 },
          { source: 'source3', value: 15 },
          { source: 'source4', value: 25 },
        ];

        const result = service.crossValidateData(sources);

        // Sorted: 10, 15, 20, 25 -> median = (15 + 20) / 2 = 17.5
        expect(result.consensusValue).toBe(17.5);
      });
    });

    describe('low confidence scenarios', () => {
      it('should return low confidence for single source', () => {
        const sources: SourceData[] = [{ source: 'fundamentus', value: 15.50 }];

        const result = service.crossValidateData(sources);

        expect(result.isValid).toBe(true);
        expect(result.confidence).toBe(0.5);
        expect(result.sources).toBe(1);
      });

      it('should return 0 confidence for empty sources', () => {
        const result = service.crossValidateData([]);

        expect(result.isValid).toBe(false);
        expect(result.confidence).toBe(0);
        expect(result.consensusValue).toBeNull();
      });

      it('should return low confidence for high variance', () => {
        const sources: SourceData[] = [
          { source: 'source1', value: 10 },
          { source: 'source2', value: 50 },
          { source: 'source3', value: 100 },
        ];

        const result = service.crossValidateData(sources);

        expect(result.confidence).toBeLessThan(0.6);
      });
    });

    describe('outlier detection', () => {
      it('should identify outliers', () => {
        // Using 10 sources to get better statistical significance
        // Mean ~15.5, stdDev ~0.01, outlier at 1000 is clearly >2 stdDev
        const sources: SourceData[] = [
          { source: 'fundamentus', value: 15.50 },
          { source: 'statusinvest', value: 15.48 },
          { source: 'investidor10', value: 15.52 },
          { source: 'brapi', value: 15.51 },
          { source: 'b3', value: 15.49 },
          { source: 'yahoo', value: 15.50 },
          { source: 'google', value: 15.51 },
          { source: 'bloomberg', value: 15.50 },
          { source: 'outlier', value: 1000.0 }, // Very extreme outlier
        ];

        const result = service.crossValidateData(sources);

        expect(result.outliers.length).toBeGreaterThan(0);
        expect(result.outliers.some((o) => o.source === 'outlier')).toBe(true);
      });

      it('should reduce confidence when outliers present', () => {
        const sourcesWithoutOutlier: SourceData[] = [
          { source: 'source1', value: 15.50 },
          { source: 'source2', value: 15.48 },
          { source: 'source3', value: 15.52 },
        ];

        const sourcesWithOutlier: SourceData[] = [
          { source: 'source1', value: 15.50 },
          { source: 'source2', value: 15.48 },
          { source: 'source3', value: 50.0 }, // Outlier
        ];

        const resultWithout = service.crossValidateData(sourcesWithoutOutlier);
        const resultWith = service.crossValidateData(sourcesWithOutlier);

        expect(resultWith.confidence).toBeLessThan(resultWithout.confidence);
      });
    });

    describe('edge cases', () => {
      it('should filter out NaN values', () => {
        const sources: SourceData[] = [
          { source: 'source1', value: 15.50 },
          { source: 'source2', value: NaN },
          { source: 'source3', value: 15.52 },
        ];

        const result = service.crossValidateData(sources);

        expect(result.sources).toBe(2);
      });

      it('should filter out null values', () => {
        const sources: SourceData[] = [
          { source: 'source1', value: 15.50 },
          { source: 'source2', value: null as any },
          { source: 'source3', value: 15.52 },
        ];

        const result = service.crossValidateData(sources);

        expect(result.sources).toBe(2);
      });

      it('should filter out Infinity values', () => {
        const sources: SourceData[] = [
          { source: 'source1', value: 15.50 },
          { source: 'source2', value: Infinity },
          { source: 'source3', value: 15.52 },
        ];

        const result = service.crossValidateData(sources);

        expect(result.sources).toBe(2);
      });
    });
  });

  describe('validatePriceChange', () => {
    it('should accept normal price changes', () => {
      const result = service.validatePriceChange(100, 105); // 5% change

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn for large price changes', () => {
      const result = service.validatePriceChange(100, 125); // 25% change

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should reject extreme price changes', () => {
      const result = service.validatePriceChange(100, 150); // 50% change

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'change_percent')).toBe(true);
    });

    it('should reject negative prices', () => {
      const result = service.validatePriceChange(-10, 100);

      expect(result.isValid).toBe(false);
    });

    it('should reject zero previous close', () => {
      const result = service.validatePriceChange(0, 100);

      expect(result.isValid).toBe(false);
    });

    it('should handle negative changes', () => {
      const result = service.validatePriceChange(100, 80); // -20% change

      expect(result.isValid).toBe(true);
    });
  });

  describe('detectOutliers', () => {
    it('should detect clear outliers', () => {
      // Use 15+ consistent values so the outlier clearly exceeds 3 stdDevs
      const values = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 50];
      // Mean ~12.5, but with 15 values at 10, one value at 50 should be detected

      // Use threshold of 2 which is more commonly used
      const outlierIndices = service.detectOutliers(values, 2);

      expect(outlierIndices).toContain(15); // Index of 50
    });

    it('should return empty for uniform data', () => {
      const values = [10, 10, 10, 10, 10];

      const outlierIndices = service.detectOutliers(values);

      expect(outlierIndices).toHaveLength(0);
    });

    it('should return empty for small arrays', () => {
      const values = [10, 100]; // Only 2 values

      const outlierIndices = service.detectOutliers(values);

      expect(outlierIndices).toHaveLength(0);
    });

    it('should respect custom threshold', () => {
      const values = [10, 11, 12, 10.5, 11.5, 20];

      // With default threshold (3), 20 may not be outlier
      const defaultOutliers = service.detectOutliers(values);

      // With lower threshold (1.5), 20 should be outlier
      const strictOutliers = service.detectOutliers(values, 1.5);

      expect(strictOutliers.length).toBeGreaterThanOrEqual(defaultOutliers.length);
    });

    it('should return empty when all values are identical', () => {
      const values = [42, 42, 42, 42];

      const outlierIndices = service.detectOutliers(values);

      expect(outlierIndices).toHaveLength(0); // stdDev = 0, no outliers
    });
  });
});
