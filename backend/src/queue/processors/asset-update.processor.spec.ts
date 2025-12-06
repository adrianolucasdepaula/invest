import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';
import {
  AssetUpdateProcessor,
  SingleAssetUpdateJob,
  MultipleAssetsUpdateJob,
  PortfolioUpdateJob,
  SectorUpdateJob,
  RetryFailedJob,
  DailyUpdateJob,
  AssetUpdateJobData,
} from './asset-update.processor';
import { AssetsUpdateService } from '../../api/assets/assets-update.service';
import { UpdateTrigger } from '@database/entities';

describe('AssetUpdateProcessor', () => {
  let processor: AssetUpdateProcessor;
  let assetsUpdateService: jest.Mocked<AssetsUpdateService>;

  const createMockJob = <T>(data: T, overrides: Partial<Job<T>> = {}): Job<T> =>
    ({
      id: 'job-123',
      name: 'test-job',
      data,
      attemptsMade: 0,
      ...overrides,
    }) as Job<T>;

  const mockUpdateResult = {
    totalAssets: 1,
    successCount: 1,
    failedCount: 0,
    results: [{ ticker: 'PETR4', success: true }],
    duration: 1500,
  };

  beforeEach(async () => {
    const mockAssetsUpdateService = {
      updateSingleAsset: jest.fn().mockResolvedValue(mockUpdateResult),
      updateMultipleAssets: jest.fn().mockResolvedValue(mockUpdateResult),
      updatePortfolioAssets: jest.fn().mockResolvedValue(mockUpdateResult),
      updateAssetsBySector: jest.fn().mockResolvedValue(mockUpdateResult),
      retryFailedAssets: jest.fn().mockResolvedValue(mockUpdateResult),
      getOutdatedAssets: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetUpdateProcessor,
        {
          provide: AssetsUpdateService,
          useValue: mockAssetsUpdateService,
        },
      ],
    }).compile();

    processor = module.get<AssetUpdateProcessor>(AssetUpdateProcessor);
    assetsUpdateService = module.get(AssetsUpdateService);
  });

  describe('handleSingleAsset', () => {
    it('should process single asset update', async () => {
      const jobData: SingleAssetUpdateJob = {
        type: 'single',
        ticker: 'PETR4',
        userId: 'user-123',
        triggeredBy: UpdateTrigger.MANUAL,
      };
      const job = createMockJob(jobData);

      const result = await processor.handleSingleAsset(job);

      expect(result).toEqual(mockUpdateResult);
      expect(assetsUpdateService.updateSingleAsset).toHaveBeenCalledWith(
        'PETR4',
        'user-123',
        UpdateTrigger.MANUAL,
      );
    });

    it('should process single asset without userId', async () => {
      const jobData: SingleAssetUpdateJob = {
        type: 'single',
        ticker: 'VALE3',
        triggeredBy: UpdateTrigger.CRON,
      };
      const job = createMockJob(jobData);

      await processor.handleSingleAsset(job);

      expect(assetsUpdateService.updateSingleAsset).toHaveBeenCalledWith(
        'VALE3',
        undefined,
        UpdateTrigger.CRON,
      );
    });

    it('should handle different trigger types', async () => {
      const triggers = [UpdateTrigger.MANUAL, UpdateTrigger.CRON, UpdateTrigger.BATCH];

      for (const trigger of triggers) {
        const jobData: SingleAssetUpdateJob = {
          type: 'single',
          ticker: 'ITUB4',
          triggeredBy: trigger,
        };
        const job = createMockJob(jobData);

        await processor.handleSingleAsset(job);

        expect(assetsUpdateService.updateSingleAsset).toHaveBeenCalledWith(
          'ITUB4',
          undefined,
          trigger,
        );
      }
    });
  });

  describe('handleMultipleAssets', () => {
    it('should process batch update', async () => {
      const jobData: MultipleAssetsUpdateJob = {
        type: 'multiple',
        tickers: ['PETR4', 'VALE3', 'ITUB4'],
        userId: 'user-123',
        triggeredBy: UpdateTrigger.MANUAL,
      };
      const job = createMockJob(jobData);

      const result = await processor.handleMultipleAssets(job);

      expect(result).toEqual(mockUpdateResult);
      expect(assetsUpdateService.updateMultipleAssets).toHaveBeenCalledWith(
        ['PETR4', 'VALE3', 'ITUB4'],
        'user-123',
        UpdateTrigger.MANUAL,
      );
    });

    it('should handle empty tickers array', async () => {
      const jobData: MultipleAssetsUpdateJob = {
        type: 'multiple',
        tickers: [],
        triggeredBy: UpdateTrigger.CRON,
      };
      const job = createMockJob(jobData);

      await processor.handleMultipleAssets(job);

      expect(assetsUpdateService.updateMultipleAssets).toHaveBeenCalledWith(
        [],
        undefined,
        UpdateTrigger.CRON,
      );
    });

    it('should handle large batch of tickers', async () => {
      const tickers = Array.from({ length: 100 }, (_, i) => `TICK${i}`);
      const jobData: MultipleAssetsUpdateJob = {
        type: 'multiple',
        tickers,
        triggeredBy: UpdateTrigger.MANUAL,
      };
      const job = createMockJob(jobData);

      await processor.handleMultipleAssets(job);

      expect(assetsUpdateService.updateMultipleAssets).toHaveBeenCalledWith(
        tickers,
        undefined,
        UpdateTrigger.MANUAL,
      );
    });
  });

  describe('handlePortfolio', () => {
    it('should process portfolio update', async () => {
      const jobData: PortfolioUpdateJob = {
        type: 'portfolio',
        portfolioId: 'portfolio-123',
        userId: 'user-123',
      };
      const job = createMockJob(jobData);

      const result = await processor.handlePortfolio(job);

      expect(result).toEqual(mockUpdateResult);
      expect(assetsUpdateService.updatePortfolioAssets).toHaveBeenCalledWith(
        'portfolio-123',
        'user-123',
      );
    });
  });

  describe('handleSector', () => {
    it('should process sector update', async () => {
      const jobData: SectorUpdateJob = {
        type: 'sector',
        sector: 'Petróleo',
        userId: 'user-123',
      };
      const job = createMockJob(jobData);

      const result = await processor.handleSector(job);

      expect(result).toEqual(mockUpdateResult);
      expect(assetsUpdateService.updateAssetsBySector).toHaveBeenCalledWith(
        'Petróleo',
        'user-123',
      );
    });

    it('should process sector update without userId', async () => {
      const jobData: SectorUpdateJob = {
        type: 'sector',
        sector: 'Bancos',
      };
      const job = createMockJob(jobData);

      await processor.handleSector(job);

      expect(assetsUpdateService.updateAssetsBySector).toHaveBeenCalledWith(
        'Bancos',
        undefined,
      );
    });
  });

  describe('handleRetryFailed', () => {
    it('should process retry failed assets', async () => {
      const jobData: RetryFailedJob = { type: 'retry_failed' };
      const job = createMockJob(jobData);

      const result = await processor.handleRetryFailed(job);

      expect(result).toEqual(mockUpdateResult);
      expect(assetsUpdateService.retryFailedAssets).toHaveBeenCalled();
    });
  });

  describe('handleDailyOutdated', () => {
    it('should return empty result when no outdated assets', async () => {
      assetsUpdateService.getOutdatedAssets.mockResolvedValue([]);
      const jobData: DailyUpdateJob = { type: 'daily_outdated' };
      const job = createMockJob(jobData);

      const result = await processor.handleDailyOutdated(job);

      expect(result).toEqual({
        totalAssets: 0,
        successCount: 0,
        failedCount: 0,
        results: [],
        duration: 0,
      });
      expect(assetsUpdateService.updateMultipleAssets).not.toHaveBeenCalled();
    });

    it('should update outdated assets when found', async () => {
      const outdatedAssets = [
        { ticker: 'PETR4' },
        { ticker: 'VALE3' },
        { ticker: 'ITUB4' },
      ];
      assetsUpdateService.getOutdatedAssets.mockResolvedValue(outdatedAssets as any);
      const jobData: DailyUpdateJob = { type: 'daily_outdated' };
      const job = createMockJob(jobData);

      const result = await processor.handleDailyOutdated(job);

      expect(assetsUpdateService.updateMultipleAssets).toHaveBeenCalledWith(
        ['PETR4', 'VALE3', 'ITUB4'],
        undefined,
        UpdateTrigger.CRON,
      );
      expect(result).toEqual(mockUpdateResult);
    });
  });

  describe('event handlers', () => {
    it('should handle onActive event', () => {
      const job = createMockJob({ type: 'single', ticker: 'PETR4', triggeredBy: UpdateTrigger.MANUAL } as SingleAssetUpdateJob);

      // Should not throw
      expect(() => processor.onActive(job as Job<AssetUpdateJobData>)).not.toThrow();
    });

    it('should handle onCompleted event', () => {
      const job = createMockJob({ type: 'single', ticker: 'PETR4', triggeredBy: UpdateTrigger.MANUAL } as SingleAssetUpdateJob);

      // Should not throw
      expect(() => processor.onCompleted(job as Job<AssetUpdateJobData>, mockUpdateResult)).not.toThrow();
    });

    it('should handle onFailed event', () => {
      const job = createMockJob({ type: 'single', ticker: 'PETR4', triggeredBy: UpdateTrigger.MANUAL } as SingleAssetUpdateJob);
      const error = new Error('Test error');

      // Should not throw
      expect(() => processor.onFailed(job as Job<AssetUpdateJobData>, error)).not.toThrow();
    });

    it('should handle onActive with multiple attempts', () => {
      const job = createMockJob(
        { type: 'single', ticker: 'PETR4', triggeredBy: UpdateTrigger.MANUAL } as SingleAssetUpdateJob,
        { attemptsMade: 2 },
      );

      expect(() => processor.onActive(job as Job<AssetUpdateJobData>)).not.toThrow();
    });

    it('should handle onCompleted with large result', () => {
      const job = createMockJob({ type: 'multiple', tickers: [], triggeredBy: UpdateTrigger.CRON } as MultipleAssetsUpdateJob);
      const largeResult = {
        totalAssets: 100,
        successCount: 95,
        failedCount: 5,
        results: Array.from({ length: 100 }, (_, i) => ({
          ticker: `TICK${i}`,
          success: i < 95,
        })),
        duration: 60000,
      };

      expect(() => processor.onCompleted(job as Job<AssetUpdateJobData>, largeResult)).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should propagate service errors for single asset', async () => {
      assetsUpdateService.updateSingleAsset.mockRejectedValue(new Error('Service error'));
      const jobData: SingleAssetUpdateJob = {
        type: 'single',
        ticker: 'PETR4',
        triggeredBy: UpdateTrigger.MANUAL,
      };
      const job = createMockJob(jobData);

      await expect(processor.handleSingleAsset(job)).rejects.toThrow('Service error');
    });

    it('should propagate service errors for multiple assets', async () => {
      assetsUpdateService.updateMultipleAssets.mockRejectedValue(new Error('Batch error'));
      const jobData: MultipleAssetsUpdateJob = {
        type: 'multiple',
        tickers: ['PETR4'],
        triggeredBy: UpdateTrigger.MANUAL,
      };
      const job = createMockJob(jobData);

      await expect(processor.handleMultipleAssets(job)).rejects.toThrow('Batch error');
    });

    it('should propagate service errors for portfolio', async () => {
      assetsUpdateService.updatePortfolioAssets.mockRejectedValue(new Error('Portfolio error'));
      const jobData: PortfolioUpdateJob = {
        type: 'portfolio',
        portfolioId: 'port-1',
        userId: 'user-1',
      };
      const job = createMockJob(jobData);

      await expect(processor.handlePortfolio(job)).rejects.toThrow('Portfolio error');
    });

    it('should propagate service errors for sector', async () => {
      assetsUpdateService.updateAssetsBySector.mockRejectedValue(new Error('Sector error'));
      const jobData: SectorUpdateJob = {
        type: 'sector',
        sector: 'Banks',
      };
      const job = createMockJob(jobData);

      await expect(processor.handleSector(job)).rejects.toThrow('Sector error');
    });

    it('should propagate service errors for retry failed', async () => {
      assetsUpdateService.retryFailedAssets.mockRejectedValue(new Error('Retry error'));
      const jobData: RetryFailedJob = { type: 'retry_failed' };
      const job = createMockJob(jobData);

      await expect(processor.handleRetryFailed(job)).rejects.toThrow('Retry error');
    });
  });
});
