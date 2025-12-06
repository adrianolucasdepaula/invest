import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, DeleteQueryBuilder } from 'typeorm';
import { ScraperMetricsService, ScraperMetricsSummary } from './scraper-metrics.service';
import { ScraperMetric } from '@database/entities';

describe('ScraperMetricsService', () => {
  let service: ScraperMetricsService;
  let repository: Repository<ScraperMetric>;

  const createMockMetric = (overrides: Partial<ScraperMetric> = {}): ScraperMetric => ({
    id: 'test-uuid',
    scraperId: 'fundamentus',
    operationType: 'test',
    ticker: 'PETR4',
    success: true,
    responseTime: 1500,
    errorMessage: null,
    createdAt: new Date(),
    ...overrides,
  });

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn().mockResolvedValue({ affected: 5 }),
    getMany: jest.fn().mockResolvedValue([]),
  };

  const mockRepository = {
    create: jest.fn((dto) => ({ ...dto, id: 'generated-uuid', createdAt: new Date() })),
    save: jest.fn((entity) => Promise.resolve(entity)),
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScraperMetricsService,
        {
          provide: getRepositoryToken(ScraperMetric),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ScraperMetricsService>(ScraperMetricsService);
    repository = module.get<Repository<ScraperMetric>>(getRepositoryToken(ScraperMetric));
  });

  describe('saveMetric', () => {
    it('should save a successful metric', async () => {
      const result = await service.saveMetric(
        'fundamentus',
        'test',
        'PETR4',
        true,
        1500,
        null,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        scraperId: 'fundamentus',
        operationType: 'test',
        ticker: 'PETR4',
        success: true,
        responseTime: 1500,
        errorMessage: null,
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should save a failed metric with error message', async () => {
      await service.saveMetric(
        'brapi',
        'sync',
        'VALE3',
        false,
        null,
        'Connection timeout',
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        scraperId: 'brapi',
        operationType: 'sync',
        ticker: 'VALE3',
        success: false,
        responseTime: null,
        errorMessage: 'Connection timeout',
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should save metric with null ticker', async () => {
      await service.saveMetric(
        'fundamentus',
        'test',
        null,
        true,
        1000,
        null,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ticker: null,
        }),
      );
    });

    it('should handle negative response time by setting to null', async () => {
      await service.saveMetric(
        'fundamentus',
        'test',
        'PETR4',
        true,
        -100,
        null,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          responseTime: null,
        }),
      );
    });

    it('should allow zero response time', async () => {
      await service.saveMetric(
        'fundamentus',
        'test',
        'PETR4',
        true,
        0,
        null,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          responseTime: 0,
        }),
      );
    });

    it('should save metric for sync operation', async () => {
      await service.saveMetric(
        'statusinvest',
        'sync',
        'ITUB4',
        true,
        2000,
        null,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          operationType: 'sync',
        }),
      );
    });
  });

  describe('getMetricsSummary', () => {
    it('should return empty summary when no metrics exist', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      const result = await service.getMetricsSummary('fundamentus');

      expect(result).toEqual({
        scraperId: 'fundamentus',
        successRate: 0,
        totalRequests: 0,
        failedRequests: 0,
        avgResponseTime: 0,
        lastTest: null,
        lastSync: null,
      });
    });

    it('should calculate correct success rate', async () => {
      const metrics = [
        createMockMetric({ success: true, responseTime: 1000 }),
        createMockMetric({ success: true, responseTime: 1500 }),
        createMockMetric({ success: false, responseTime: null }),
        createMockMetric({ success: true, responseTime: 2000 }),
      ];
      mockQueryBuilder.getMany.mockResolvedValue(metrics);

      const result = await service.getMetricsSummary('fundamentus');

      expect(result.successRate).toBe(75);
      expect(result.totalRequests).toBe(4);
      expect(result.failedRequests).toBe(1);
    });

    it('should calculate average response time from successful requests only', async () => {
      const metrics = [
        createMockMetric({ success: true, responseTime: 1000 }),
        createMockMetric({ success: true, responseTime: 2000 }),
        createMockMetric({ success: false, responseTime: null }), // Failed - excluded
        createMockMetric({ success: true, responseTime: 3000 }),
      ];
      mockQueryBuilder.getMany.mockResolvedValue(metrics);

      const result = await service.getMetricsSummary('fundamentus');

      // Average of 1000, 2000, 3000 = 2000
      expect(result.avgResponseTime).toBe(2000);
    });

    it('should filter out outliers when calculating average response time', async () => {
      const metrics = [
        createMockMetric({ success: true, responseTime: 1000 }),
        createMockMetric({ success: true, responseTime: 2000 }),
        createMockMetric({ success: true, responseTime: 70000 }), // Outlier > 60000ms
        createMockMetric({ success: true, responseTime: 0 }), // Should be filtered
        createMockMetric({ success: true, responseTime: -100 }), // Invalid, filtered
      ];
      mockQueryBuilder.getMany.mockResolvedValue(metrics);

      const result = await service.getMetricsSummary('fundamentus');

      // Only 1000 and 2000 should be counted (average = 1500)
      expect(result.avgResponseTime).toBe(1500);
    });

    it('should identify last test and last sync dates', async () => {
      const testDate = new Date('2025-12-01T10:00:00Z');
      const syncDate = new Date('2025-12-02T15:00:00Z');

      const metrics = [
        createMockMetric({ operationType: 'test', createdAt: testDate }),
        createMockMetric({ operationType: 'sync', createdAt: syncDate }),
      ];
      mockQueryBuilder.getMany.mockResolvedValue(metrics);

      const result = await service.getMetricsSummary('fundamentus');

      expect(result.lastTest).toEqual(testDate);
      expect(result.lastSync).toEqual(syncDate);
    });

    it('should return null for lastTest when no test metrics exist', async () => {
      const metrics = [
        createMockMetric({ operationType: 'sync' }),
      ];
      mockQueryBuilder.getMany.mockResolvedValue(metrics);

      const result = await service.getMetricsSummary('fundamentus');

      expect(result.lastTest).toBeNull();
      expect(result.lastSync).toBeDefined();
    });

    it('should round success rate to one decimal place', async () => {
      const metrics = [
        createMockMetric({ success: true }),
        createMockMetric({ success: true }),
        createMockMetric({ success: false }),
      ];
      mockQueryBuilder.getMany.mockResolvedValue(metrics);

      const result = await service.getMetricsSummary('fundamentus');

      // 66.666...% should round to 66.7
      expect(result.successRate).toBe(66.7);
    });

    it('should handle 100% success rate', async () => {
      const metrics = [
        createMockMetric({ success: true, responseTime: 1000 }),
        createMockMetric({ success: true, responseTime: 1500 }),
      ];
      mockQueryBuilder.getMany.mockResolvedValue(metrics);

      const result = await service.getMetricsSummary('fundamentus');

      expect(result.successRate).toBe(100);
      expect(result.failedRequests).toBe(0);
    });

    it('should handle 0% success rate', async () => {
      const metrics = [
        createMockMetric({ success: false }),
        createMockMetric({ success: false }),
      ];
      mockQueryBuilder.getMany.mockResolvedValue(metrics);

      const result = await service.getMetricsSummary('fundamentus');

      expect(result.successRate).toBe(0);
      expect(result.failedRequests).toBe(2);
    });

    it('should call query builder with correct parameters', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getMetricsSummary('brapi');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('metric');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'metric.scraper_id = :scraperId',
        { scraperId: 'brapi' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('metric.created_at', 'DESC');
    });
  });

  describe('getAllMetricsSummaries', () => {
    it('should return summaries for all scrapers', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([
        createMockMetric({ success: true, responseTime: 1000 }),
      ]);

      const result = await service.getAllMetricsSummaries();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(6);
      expect(result.has('fundamentus')).toBe(true);
      expect(result.has('brapi')).toBe(true);
      expect(result.has('statusinvest')).toBe(true);
      expect(result.has('investidor10')).toBe(true);
      expect(result.has('fundamentei')).toBe(true);
      expect(result.has('investsite')).toBe(true);
    });

    it('should query metrics for each scraper', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);

      await service.getAllMetricsSummaries();

      // Should be called once for each of the 6 scrapers
      expect(mockQueryBuilder.where).toHaveBeenCalledTimes(6);
    });
  });

  describe('getRecentMetrics', () => {
    it('should return recent metrics with default limit', async () => {
      const metrics = [createMockMetric(), createMockMetric()];
      mockRepository.find.mockResolvedValue(metrics);

      const result = await service.getRecentMetrics('fundamentus');

      expect(result).toEqual(metrics);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { scraperId: 'fundamentus' },
        order: { createdAt: 'DESC' },
        take: 10,
      });
    });

    it('should respect custom limit parameter', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.getRecentMetrics('brapi', 5);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { scraperId: 'brapi' },
        order: { createdAt: 'DESC' },
        take: 5,
      });
    });

    it('should return empty array when no metrics exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.getRecentMetrics('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('cleanupOldMetrics', () => {
    it('should delete old metrics with default retention period', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 10 });

      const result = await service.cleanupOldMetrics();

      expect(result).toBe(10);
      expect(mockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockQueryBuilder.delete).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.execute).toHaveBeenCalled();
    });

    it('should delete metrics older than custom days', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 5 });

      const result = await service.cleanupOldMetrics(30);

      expect(result).toBe(5);
    });

    it('should return 0 when no metrics are deleted', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: 0 });

      const result = await service.cleanupOldMetrics();

      expect(result).toBe(0);
    });

    it('should handle null affected count', async () => {
      mockQueryBuilder.execute.mockResolvedValue({ affected: null });

      const result = await service.cleanupOldMetrics();

      expect(result).toBe(0);
    });

    it('should use correct cutoff date', async () => {
      // Reset mock to track specific call
      mockQueryBuilder.where.mockClear();

      await service.cleanupOldMetrics(90);

      // Verify where was called with created_at condition
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'created_at < :cutoffDate',
        expect.any(Object),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle metrics with all null optional fields', async () => {
      await service.saveMetric(
        'fundamentus',
        'test',
        null,
        false,
        null,
        null,
      );

      expect(mockRepository.create).toHaveBeenCalledWith({
        scraperId: 'fundamentus',
        operationType: 'test',
        ticker: null,
        success: false,
        responseTime: null,
        errorMessage: null,
      });
    });

    it('should handle very large response times', async () => {
      await service.saveMetric(
        'fundamentus',
        'sync',
        'PETR4',
        true,
        999999,
        null,
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          responseTime: 999999,
        }),
      );
    });

    it('should handle metrics summary with only null response times', async () => {
      const metrics = [
        createMockMetric({ success: true, responseTime: null }),
        createMockMetric({ success: true, responseTime: null }),
      ];
      mockQueryBuilder.getMany.mockResolvedValue(metrics);

      const result = await service.getMetricsSummary('fundamentus');

      expect(result.avgResponseTime).toBe(0);
      expect(result.successRate).toBe(100);
    });

    it('should handle concurrent getAllMetricsSummaries calls', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([
        createMockMetric({ success: true }),
      ]);

      const [result1, result2] = await Promise.all([
        service.getAllMetricsSummaries(),
        service.getAllMetricsSummaries(),
      ]);

      expect(result1.size).toBe(6);
      expect(result2.size).toBe(6);
    });
  });
});
