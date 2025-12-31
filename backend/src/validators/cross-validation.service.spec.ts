import { Test, TestingModule } from '@nestjs/testing';
import {
  CrossValidationService,
  SourceValue,
} from './cross-validation.service';
import {
  DEFAULT_TOLERANCES,
  SOURCE_PRIORITY,
} from '../scrapers/interfaces/field-source.interface';

describe('CrossValidationService', () => {
  let service: CrossValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrossValidationService],
    }).compile();

    service = module.get<CrossValidationService>(CrossValidationService);
  });

  describe('valuesAreEqual', () => {
    it('should return true for identical values', () => {
      expect(service.valuesAreEqual(10, 10)).toBe(true);
    });

    it('should return true for values within tolerance', () => {
      // 10 vs 10.4 = 4% deviation, within 5% tolerance
      expect(service.valuesAreEqual(10, 10.4, 0.05)).toBe(true);
    });

    it('should return false for values outside tolerance', () => {
      // 10 vs 11 = 10% deviation, outside 5% tolerance
      expect(service.valuesAreEqual(10, 11, 0.05)).toBe(false);
    });

    it('should handle zero values with absolute comparison', () => {
      expect(service.valuesAreEqual(0, 0.03, 0.05)).toBe(true);
      expect(service.valuesAreEqual(0, 0.1, 0.05)).toBe(false);
    });

    it('should handle negative values', () => {
      expect(service.valuesAreEqual(-10, -10.4, 0.05)).toBe(true);
      expect(service.valuesAreEqual(-10, -11, 0.05)).toBe(false);
    });

    it('should use default tolerance of 5%', () => {
      expect(service.valuesAreEqual(100, 104)).toBe(true);
      expect(service.valuesAreEqual(100, 106)).toBe(false);
    });
  });

  describe('calculateDeviation', () => {
    it('should calculate percentage deviation correctly', () => {
      expect(service.calculateDeviation(110, 100)).toBe(10);
      expect(service.calculateDeviation(90, 100)).toBe(10);
    });

    it('should handle zero reference', () => {
      expect(service.calculateDeviation(0, 0)).toBe(0);
      expect(service.calculateDeviation(10, 0)).toBe(10000); // MAX_DEVIATION cap
    });

    it('should return 0 for identical values', () => {
      expect(service.calculateDeviation(50, 50)).toBe(0);
    });

    it('should round to 2 decimal places', () => {
      // 15 / 100 = 15%
      expect(service.calculateDeviation(115, 100)).toBe(15);
      // 3.33... -> 3.33
      expect(service.calculateDeviation(103.33, 100)).toBeCloseTo(3.33, 1);
    });
  });

  describe('getFieldTolerance', () => {
    it('should return specific tolerance for known fields', () => {
      // Stricter tolerances per FASE DISCREPANCY-FIX
      expect(service.getFieldTolerance('pl')).toBe(0.02); // 2%
      expect(service.getFieldTolerance('pvp')).toBe(0.02); // 2%
      expect(service.getFieldTolerance('roe')).toBe(0.005); // 0.5%
      expect(service.getFieldTolerance('dividendYield')).toBe(0.005); // 0.5%
    });

    it('should return default tolerance for unknown fields', () => {
      expect(service.getFieldTolerance('unknownField')).toBe(0.01); // 1% default
      expect(service.getFieldTolerance('customMetric')).toBe(0.01);
    });
  });

  describe('groupSimilarValues', () => {
    it('should group identical values together', () => {
      const values: SourceValue[] = [
        { source: 'a', value: 10 },
        { source: 'b', value: 10 },
        { source: 'c', value: 10 },
      ];

      const groups = service.groupSimilarValues(values, 0.05);

      expect(groups).toHaveLength(1);
      expect(groups[0].sources).toHaveLength(3);
    });

    it('should group similar values within tolerance', () => {
      const values: SourceValue[] = [
        { source: 'a', value: 10.0 },
        { source: 'b', value: 10.3 },
        { source: 'c', value: 10.4 },
      ];

      const groups = service.groupSimilarValues(values, 0.05);

      expect(groups).toHaveLength(1);
      expect(groups[0].sources).toContain('a');
      expect(groups[0].sources).toContain('b');
      expect(groups[0].sources).toContain('c');
    });

    it('should create separate groups for divergent values', () => {
      const values: SourceValue[] = [
        { source: 'a', value: 10 },
        { source: 'b', value: 10 },
        { source: 'c', value: 20 },
      ];

      const groups = service.groupSimilarValues(values, 0.05);

      expect(groups).toHaveLength(2);
    });

    it('should skip null values', () => {
      const values: SourceValue[] = [
        { source: 'a', value: 10 },
        { source: 'b', value: null },
        { source: 'c', value: 10 },
      ];

      const groups = service.groupSimilarValues(values, 0.05);

      expect(groups).toHaveLength(1);
      expect(groups[0].sources).toHaveLength(2);
    });

    it('should return empty array for all null values', () => {
      const values: SourceValue[] = [
        { source: 'a', value: null },
        { source: 'b', value: null },
      ];

      const groups = service.groupSimilarValues(values, 0.05);

      expect(groups).toHaveLength(0);
    });
  });

  describe('selectByConsensus', () => {
    it('should return null result for empty values', () => {
      const result = service.selectByConsensus('pl', []);

      expect(result.finalValue).toBeNull();
      expect(result.finalSource).toBe('');
      expect(result.agreementCount).toBe(0);
      expect(result.consensus).toBe(0);
      expect(result.hasDiscrepancy).toBe(false);
    });

    it('should return single value directly', () => {
      const values: SourceValue[] = [{ source: 'fundamentus', value: 15.5 }];

      const result = service.selectByConsensus('pl', values);

      expect(result.finalValue).toBe(15.5);
      expect(result.finalSource).toBe('fundamentus');
      expect(result.agreementCount).toBe(1);
      expect(result.consensus).toBe(100);
      expect(result.hasDiscrepancy).toBe(false);
    });

    it('should select majority consensus', () => {
      const values: SourceValue[] = [
        { source: 'fundamentus', value: 10 },
        { source: 'statusinvest', value: 10 },
        { source: 'investidor10', value: 10 },
        { source: 'brapi', value: 50 },
      ];

      const result = service.selectByConsensus('pl', values);

      expect(result.finalValue).toBe(10);
      expect(result.agreementCount).toBe(3);
      expect(result.consensus).toBe(75);
      expect(result.hasDiscrepancy).toBe(true);
    });

    it('should prefer priority source within consensus group', () => {
      const values: SourceValue[] = [
        { source: 'investidor10', value: 10 },
        { source: 'fundamentus', value: 10 },
        { source: 'statusinvest', value: 10 },
      ];

      const result = service.selectByConsensus('pl', values);

      // fundamentus has higher priority
      expect(result.finalSource).toBe('fundamentus');
    });

    it('should identify divergent sources', () => {
      const values: SourceValue[] = [
        { source: 'fundamentus', value: 10 },
        { source: 'statusinvest', value: 10 },
        { source: 'brapi', value: 50 },
      ];

      const result = service.selectByConsensus('pl', values);

      expect(result.hasDiscrepancy).toBe(true);
      expect(result.divergentSources).toBeDefined();
      expect(result.divergentSources).toHaveLength(1);
      expect(result.divergentSources![0].source).toBe('brapi');
    });

    it('should calculate deviation for divergent sources', () => {
      const values: SourceValue[] = [
        { source: 'fundamentus', value: 100 },
        { source: 'statusinvest', value: 100 },
        { source: 'brapi', value: 150 },
      ];

      const result = service.selectByConsensus('pl', values);

      expect(result.divergentSources![0].deviation).toBe(50); // 50% deviation
    });

    it('should use field-specific tolerance', () => {
      // P/L has 2% tolerance (stricter per FASE DISCREPANCY-FIX)
      const values: SourceValue[] = [
        { source: 'fundamentus', value: 10 },
        { source: 'statusinvest', value: 10.15 }, // 1.5% deviation - within 2%
      ];

      const result = service.selectByConsensus('pl', values);

      expect(result.agreementCount).toBe(2);
      expect(result.hasDiscrepancy).toBe(false);
    });

    it('should use custom tolerance when provided', () => {
      const values: SourceValue[] = [
        { source: 'fundamentus', value: 10 },
        { source: 'statusinvest', value: 10.8 },
      ];

      // With 5% tolerance, 8% deviation should create discrepancy
      const result = service.selectByConsensus('pl', values, 0.05);

      expect(result.hasDiscrepancy).toBe(true);
    });
  });

  describe('calculateConfidence', () => {
    it('should return 0 for no sources', () => {
      expect(service.calculateConfidence(0, 0)).toBe(0);
    });

    it('should return max confidence for 6 sources without discrepancies', () => {
      expect(service.calculateConfidence(6, 0)).toBe(1);
    });

    it('should scale confidence based on source count', () => {
      expect(service.calculateConfidence(3, 0)).toBe(0.5);
      expect(service.calculateConfidence(4, 0)).toBeCloseTo(0.67, 1);
    });

    it('should apply penalty for high deviation discrepancies', () => {
      const withoutPenalty = service.calculateConfidence(6, 0, 0);
      const withPenalty = service.calculateConfidence(6, 2, 30);

      expect(withPenalty).toBeLessThan(withoutPenalty);
    });

    it('should not apply penalty for low deviation', () => {
      const withoutDiscrepancy = service.calculateConfidence(6, 0, 0);
      const withLowDeviation = service.calculateConfidence(6, 2, 10);

      expect(withLowDeviation).toBe(withoutDiscrepancy);
    });

    it('should guarantee minimum 50% for minSources met', () => {
      // Even with penalties, should not go below 50% if minSources met
      expect(service.calculateConfidence(3, 5, 50, 3)).toBeGreaterThanOrEqual(0.5);
    });

    it('should not guarantee minimum if minSources not met', () => {
      const confidence = service.calculateConfidence(2, 0, 0, 3);
      expect(confidence).toBeLessThan(0.5);
    });
  });

  describe('isZeroValidForField', () => {
    it('should return true for debt-related fields', () => {
      expect(service.isZeroValidForField('dividaLiquida')).toBe(true);
      expect(service.isZeroValidForField('dividaBruta')).toBe(true);
      expect(service.isZeroValidForField('dividaLiquidaEbitda')).toBe(true);
      expect(service.isZeroValidForField('dividaLiquidaPatrimonio')).toBe(true);
    });

    it('should return false for other fields', () => {
      expect(service.isZeroValidForField('pl')).toBe(false);
      expect(service.isZeroValidForField('roe')).toBe(false);
      expect(service.isZeroValidForField('price')).toBe(false);
    });
  });

  describe('filterValidValues', () => {
    it('should filter out null values', () => {
      const values: SourceValue[] = [
        { source: 'a', value: 10 },
        { source: 'b', value: null },
        { source: 'c', value: 20 },
      ];

      const result = service.filterValidValues(values, 'pl');

      expect(result).toHaveLength(2);
      expect(result.map((v) => v.source)).toEqual(['a', 'c']);
    });

    it('should filter out zero for most fields', () => {
      const values: SourceValue[] = [
        { source: 'a', value: 10 },
        { source: 'b', value: 0 },
        { source: 'c', value: 20 },
      ];

      const result = service.filterValidValues(values, 'pl');

      expect(result).toHaveLength(2);
    });

    it('should keep zero for debt fields', () => {
      const values: SourceValue[] = [
        { source: 'a', value: 10 },
        { source: 'b', value: 0 },
        { source: 'c', value: 20 },
      ];

      const result = service.filterValidValues(values, 'dividaLiquida');

      expect(result).toHaveLength(3);
    });
  });

  describe('buildFieldSourceInfo', () => {
    it('should return null for no valid values', () => {
      const values: SourceValue[] = [
        { source: 'a', value: null },
        { source: 'b', value: null },
      ];

      const result = service.buildFieldSourceInfo('pl', values);

      expect(result).toBeNull();
    });

    it('should build complete field info', () => {
      const values: SourceValue[] = [
        { source: 'fundamentus', value: 10 },
        { source: 'statusinvest', value: 10 },
        { source: 'brapi', value: 50 },
      ];

      const result = service.buildFieldSourceInfo('pl', values);

      expect(result).not.toBeNull();
      expect(result!.finalValue).toBe(10);
      expect(result!.finalSource).toBe('fundamentus');
      expect(result!.sourcesCount).toBe(3);
      expect(result!.agreementCount).toBe(2);
      expect(result!.hasDiscrepancy).toBe(true);
      expect(result!.values).toEqual(values);
    });

    it('should include divergent sources info', () => {
      const values: SourceValue[] = [
        { source: 'fundamentus', value: 100 },
        { source: 'statusinvest', value: 100 },
        { source: 'brapi', value: 200 },
      ];

      const result = service.buildFieldSourceInfo('pl', values);

      expect(result!.divergentSources).toHaveLength(1);
      expect(result!.divergentSources![0].source).toBe('brapi');
    });
  });

  describe('hasSignificantDiscrepancies', () => {
    it('should return true for low confidence', () => {
      const result = service.hasSignificantDiscrepancies(0.5, {});

      expect(result).toBe(true);
    });

    it('should return false for high confidence without issues', () => {
      const fieldSources = {
        pl: {
          values: [],
          finalValue: 10,
          finalSource: 'fundamentus',
          sourcesCount: 3,
          agreementCount: 3,
          consensus: 100,
          hasDiscrepancy: false,
        },
      };

      const result = service.hasSignificantDiscrepancies(0.8, fieldSources);

      expect(result).toBe(false);
    });

    it('should return true when >30% of fields have high discrepancy', () => {
      const fieldSources = {
        pl: {
          values: [],
          finalValue: 10,
          finalSource: 'fundamentus',
          sourcesCount: 2,
          agreementCount: 1,
          consensus: 50,
          hasDiscrepancy: true,
          divergentSources: [{ source: 'brapi', value: 50, deviation: 25 }],
        },
        roe: {
          values: [],
          finalValue: 15,
          finalSource: 'fundamentus',
          sourcesCount: 2,
          agreementCount: 1,
          consensus: 50,
          hasDiscrepancy: true,
          divergentSources: [{ source: 'brapi', value: 30, deviation: 25 }],
        },
        pvp: {
          values: [],
          finalValue: 1.5,
          finalSource: 'fundamentus',
          sourcesCount: 2,
          agreementCount: 2,
          consensus: 100,
          hasDiscrepancy: false,
        },
      };

      const result = service.hasSignificantDiscrepancies(0.7, fieldSources);

      expect(result).toBe(true);
    });

    it('should return true when 2+ critical fields have issues', () => {
      const fieldSources = {
        pl: {
          values: [],
          finalValue: 10,
          finalSource: 'fundamentus',
          sourcesCount: 2,
          agreementCount: 1,
          consensus: 50,
          hasDiscrepancy: true,
          divergentSources: [{ source: 'brapi', value: 12, deviation: 20 }],
        },
        roe: {
          values: [],
          finalValue: 15,
          finalSource: 'fundamentus',
          sourcesCount: 2,
          agreementCount: 1,
          consensus: 50,
          hasDiscrepancy: true,
          divergentSources: [{ source: 'brapi', value: 18, deviation: 20 }],
        },
      };

      const result = service.hasSignificantDiscrepancies(0.8, fieldSources);

      expect(result).toBe(true);
    });

    it('should skip fields with less than 2 sources', () => {
      const fieldSources = {
        pl: {
          values: [],
          finalValue: 10,
          finalSource: 'fundamentus',
          sourcesCount: 1,
          agreementCount: 1,
          consensus: 100,
          hasDiscrepancy: true,
          divergentSources: [{ source: 'brapi', value: 50, deviation: 400 }],
        },
      };

      const result = service.hasSignificantDiscrepancies(0.8, fieldSources);

      expect(result).toBe(false);
    });
  });

  describe('DEFAULT_TOLERANCES', () => {
    it('should have correct default tolerance', () => {
      // Stricter 1% default per FASE DISCREPANCY-FIX
      expect(DEFAULT_TOLERANCES.default).toBe(0.01);
    });

    it('should have field-specific tolerances', () => {
      // Stricter tolerances per FASE DISCREPANCY-FIX
      expect(DEFAULT_TOLERANCES.byField.pl).toBe(0.02); // 2%
      expect(DEFAULT_TOLERANCES.byField.pvp).toBe(0.02); // 2%
      expect(DEFAULT_TOLERANCES.byField.evEbitda).toBe(0.02); // 2%
    });
  });

  describe('SOURCE_PRIORITY', () => {
    it('should have fundamentus as highest priority', () => {
      expect(SOURCE_PRIORITY[0]).toBe('fundamentus');
    });

    it('should have 6 sources in priority order', () => {
      expect(SOURCE_PRIORITY).toHaveLength(6);
      expect(SOURCE_PRIORITY).toContain('brapi');
      expect(SOURCE_PRIORITY).toContain('statusinvest');
    });
  });
});
