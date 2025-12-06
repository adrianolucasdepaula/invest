import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledJobsService } from './scheduled-jobs.service';
import { Asset, AssetType } from '@database/entities';

describe('ScheduledJobsService', () => {
  let service: ScheduledJobsService;
  let assetRepository: Repository<Asset>;
  let scrapingQueue: any;
  let analysisQueue: any;

  const createMockAsset = (overrides: Partial<Asset> = {}): Asset => ({
    id: 'test-uuid',
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: AssetType.STOCK,
    sector: 'Petróleo',
    subSector: 'Exploração',
    segment: 'Petróleo e Gás',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    fundamentalData: null,
    prices: [],
    analyses: [],
    portfolioPositions: [],
    optionsLiquidity: null,
    ...overrides,
  } as Asset);

  let mockScrapingQueue: any;
  let mockAnalysisQueue: any;
  let mockAssetRepository: any;

  beforeEach(async () => {
    // Create fresh mocks for each test
    mockScrapingQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-1' }),
    };

    mockAnalysisQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-2' }),
    };

    mockAssetRepository = {
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledJobsService,
        {
          provide: getQueueToken('scraping'),
          useValue: mockScrapingQueue,
        },
        {
          provide: getQueueToken('analysis'),
          useValue: mockAnalysisQueue,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: mockAssetRepository,
        },
      ],
    }).compile();

    service = module.get<ScheduledJobsService>(ScheduledJobsService);
    assetRepository = module.get<Repository<Asset>>(getRepositoryToken(Asset));
    scrapingQueue = module.get(getQueueToken('scraping'));
    analysisQueue = module.get(getQueueToken('analysis'));
  });

  describe('updateFundamentalData', () => {
    it('should fetch active stocks and add bulk scraping job', async () => {
      const assets = [
        createMockAsset({ ticker: 'PETR4' }),
        createMockAsset({ ticker: 'VALE3' }),
        createMockAsset({ ticker: 'ITUB4' }),
      ];
      mockAssetRepository.find.mockResolvedValue(assets);

      await service.updateFundamentalData();

      expect(mockAssetRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, type: AssetType.STOCK },
        take: 50,
      });
      expect(mockScrapingQueue.add).toHaveBeenCalledWith(
        'bulk-scraping',
        { tickers: ['PETR4', 'VALE3', 'ITUB4'] },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    });

    it('should handle empty asset list', async () => {
      mockAssetRepository.find.mockResolvedValue([]);

      await service.updateFundamentalData();

      expect(mockScrapingQueue.add).toHaveBeenCalledWith(
        'bulk-scraping',
        { tickers: [] },
        expect.any(Object),
      );
    });

    it('should handle repository error gracefully', async () => {
      mockAssetRepository.find.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(service.updateFundamentalData()).resolves.not.toThrow();
    });

    it('should handle queue error gracefully', async () => {
      mockAssetRepository.find.mockResolvedValue([createMockAsset()]);
      mockScrapingQueue.add.mockRejectedValue(new Error('Queue error'));

      // Should not throw
      await expect(service.updateFundamentalData()).resolves.not.toThrow();
    });
  });

  describe('updateOptionsData', () => {
    it('should fetch active stocks and add options jobs for each', async () => {
      const assets = [
        createMockAsset({ ticker: 'PETR4' }),
        createMockAsset({ ticker: 'VALE3' }),
      ];
      mockAssetRepository.find.mockResolvedValue(assets);

      await service.updateOptionsData();

      expect(mockAssetRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, type: AssetType.STOCK },
        take: 20,
      });
      expect(mockScrapingQueue.add).toHaveBeenCalledTimes(2);
      expect(mockScrapingQueue.add).toHaveBeenCalledWith(
        'options',
        { ticker: 'PETR4', type: 'options' },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
      expect(mockScrapingQueue.add).toHaveBeenCalledWith(
        'options',
        { ticker: 'VALE3', type: 'options' },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      );
    });

    it('should handle empty asset list', async () => {
      mockAssetRepository.find.mockResolvedValue([]);

      await service.updateOptionsData();

      expect(mockScrapingQueue.add).not.toHaveBeenCalled();
    });

    it('should handle repository error gracefully', async () => {
      mockAssetRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.updateOptionsData()).resolves.not.toThrow();
    });

    it('should handle queue error gracefully for one asset', async () => {
      mockAssetRepository.find.mockResolvedValue([
        createMockAsset({ ticker: 'PETR4' }),
      ]);
      mockScrapingQueue.add.mockRejectedValue(new Error('Queue error'));

      // Service catches error internally, so it should not throw
      await expect(service.updateOptionsData()).resolves.not.toThrow();
    });
  });

  describe('cleanOldData', () => {
    it('should complete without error', async () => {
      await expect(service.cleanOldData()).resolves.not.toThrow();
    });
  });

  describe('updatePriceData', () => {
    it('should fetch active assets', async () => {
      const assets = [
        createMockAsset({ ticker: 'PETR4' }),
        createMockAsset({ ticker: 'VALE3' }),
      ];
      mockAssetRepository.find.mockResolvedValue(assets);

      await service.updatePriceData();

      expect(mockAssetRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        take: 100,
      });
    });

    it('should handle empty asset list', async () => {
      mockAssetRepository.find.mockResolvedValue([]);

      await expect(service.updatePriceData()).resolves.not.toThrow();
    });

    it('should handle repository error gracefully', async () => {
      mockAssetRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.updatePriceData()).resolves.not.toThrow();
    });
  });

  describe('triggerImmediateScraping', () => {
    it('should add fundamental scraping job with high priority', async () => {
      const result = await service.triggerImmediateScraping('PETR4', 'fundamental');

      expect(result).toEqual({
        success: true,
        ticker: 'PETR4',
        type: 'fundamental',
      });
      expect(mockScrapingQueue.add).toHaveBeenCalledWith(
        'fundamental',
        { ticker: 'PETR4', type: 'fundamental' },
        {
          priority: 1,
          attempts: 3,
        },
      );
    });

    it('should add options scraping job with high priority', async () => {
      const result = await service.triggerImmediateScraping('VALE3', 'options');

      expect(result).toEqual({
        success: true,
        ticker: 'VALE3',
        type: 'options',
      });
      expect(mockScrapingQueue.add).toHaveBeenCalledWith(
        'options',
        { ticker: 'VALE3', type: 'options' },
        {
          priority: 1,
          attempts: 3,
        },
      );
    });

    it('should default to fundamental type if not specified', async () => {
      const result = await service.triggerImmediateScraping('ITUB4');

      expect(result.type).toBe('fundamental');
      expect(mockScrapingQueue.add).toHaveBeenCalledWith(
        'fundamental',
        { ticker: 'ITUB4', type: 'fundamental' },
        expect.any(Object),
      );
    });

    it('should throw error when queue fails', async () => {
      mockScrapingQueue.add.mockRejectedValue(new Error('Queue error'));

      await expect(service.triggerImmediateScraping('PETR4')).rejects.toThrow(
        'Queue error',
      );
    });

    it('should handle special characters in ticker', async () => {
      const result = await service.triggerImmediateScraping('PETR4F');

      expect(result.ticker).toBe('PETR4F');
    });
  });

  describe('edge cases', () => {
    it('should handle large number of assets for fundamental update', async () => {
      const assets = Array.from({ length: 50 }, (_, i) =>
        createMockAsset({ ticker: `TICK${i}` }),
      );
      mockAssetRepository.find.mockResolvedValue(assets);

      await service.updateFundamentalData();

      expect(mockScrapingQueue.add).toHaveBeenCalledWith(
        'bulk-scraping',
        { tickers: expect.arrayContaining(['TICK0', 'TICK49']) },
        expect.any(Object),
      );
    });

    it('should handle large number of assets for options update', async () => {
      const assets = Array.from({ length: 20 }, (_, i) =>
        createMockAsset({ ticker: `TICK${i}` }),
      );
      mockAssetRepository.find.mockResolvedValue(assets);

      await service.updateOptionsData();

      expect(mockScrapingQueue.add).toHaveBeenCalledTimes(20);
    });

    it('should handle concurrent calls to triggerImmediateScraping', async () => {
      const results = await Promise.all([
        service.triggerImmediateScraping('PETR4'),
        service.triggerImmediateScraping('VALE3'),
        service.triggerImmediateScraping('ITUB4'),
      ]);

      expect(results).toHaveLength(3);
      expect(mockScrapingQueue.add).toHaveBeenCalledTimes(3);
    });
  });
});
