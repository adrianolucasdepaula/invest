import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Job } from 'bull';
import { ScrapingProcessor, ScrapingJob } from './scraping.processor';
import { ScrapersService } from '@scrapers/scrapers.service';
import { Asset, AssetType, ScrapedData, DataSource } from '@database/entities';

describe('ScrapingProcessor', () => {
  let processor: ScrapingProcessor;
  let scrapersService: jest.Mocked<ScrapersService>;
  let assetRepository: any;
  let scrapedDataRepository: any;
  let dataSourceRepository: any;

  const createMockJob = <T>(data: T, overrides: Partial<Job<T>> = {}): Job<T> =>
    ({
      id: 'job-123',
      name: 'test-job',
      data,
      ...overrides,
    }) as Job<T>;

  const mockAsset: Partial<Asset> = {
    id: 'asset-123',
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: AssetType.STOCK,
    isActive: true,
  };

  const mockDataSource: Partial<DataSource> = {
    id: 'ds-123',
    code: 'fundamentus',
    name: 'Fundamentus',
    lastSuccessAt: new Date(),
    successCount: 10,
  };

  const mockFundamentalResult = {
    isValid: true,
    data: { priceToEarnings: 10.5, dividendYield: 0.08 },
    sources: ['fundamentus', 'brapi'],
    sourcesCount: 2,
    confidence: 85,
    fieldSources: {
      priceToEarnings: {
        values: [
          { source: 'fundamentus', value: 10.5, scrapedAt: new Date().toISOString() },
          { source: 'brapi', value: 10.6, scrapedAt: new Date().toISOString() },
        ],
        finalValue: 10.5,
        finalSource: 'fundamentus',
        sourcesCount: 2,
        agreementCount: 2,
        consensus: 100,
        hasDiscrepancy: false,
      },
    },
    rawSourcesData: [
      { source: 'fundamentus', data: { priceToEarnings: 10.5 }, scrapedAt: new Date().toISOString() },
      { source: 'brapi', data: { priceToEarnings: 10.6 }, scrapedAt: new Date().toISOString() },
    ],
  };

  const mockOptionsResult = {
    success: true,
    data: { calls: [], puts: [] },
  };

  beforeEach(async () => {
    assetRepository = {
      findOne: jest.fn().mockResolvedValue(mockAsset),
      save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'new-asset', ...data })),
    };

    scrapedDataRepository = {
      save: jest.fn().mockResolvedValue({ id: 'scraped-data-123' }),
    };

    dataSourceRepository = {
      findOne: jest.fn().mockResolvedValue(mockDataSource),
      save: jest.fn().mockResolvedValue(mockDataSource),
    };

    const mockScrapersService = {
      scrapeFundamentalData: jest.fn().mockResolvedValue(mockFundamentalResult),
      scrapeOptionsData: jest.fn().mockResolvedValue(mockOptionsResult),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrapingProcessor,
        {
          provide: ScrapersService,
          useValue: mockScrapersService,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: assetRepository,
        },
        {
          provide: getRepositoryToken(ScrapedData),
          useValue: scrapedDataRepository,
        },
        {
          provide: getRepositoryToken(DataSource),
          useValue: dataSourceRepository,
        },
      ],
    }).compile();

    processor = module.get<ScrapingProcessor>(ScrapingProcessor);
    scrapersService = module.get(ScrapersService);
  });

  describe('event handlers', () => {
    it('should handle onActive event', () => {
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'fundamental' });
      expect(() => processor.onActive(job)).not.toThrow();
    });

    it('should handle onCompleted event', () => {
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'fundamental' });
      expect(() => processor.onCompleted(job, { success: true })).not.toThrow();
    });

    it('should handle onFailed event', () => {
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'fundamental' });
      const error = new Error('Test error');
      expect(() => processor.onFailed(job, error)).not.toThrow();
    });
  });

  describe('processFundamentalScraping', () => {
    it('should process fundamental scraping for existing asset', async () => {
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'fundamental' });

      const result = await processor.processFundamentalScraping(job);

      expect(result).toEqual({
        success: true,
        ticker: 'PETR4',
        sourcesCount: 2,
        confidence: 85,
      });
      expect(assetRepository.findOne).toHaveBeenCalledWith({
        where: { ticker: 'PETR4' },
      });
      expect(scrapersService.scrapeFundamentalData).toHaveBeenCalledWith('PETR4');
    });

    it('should create new asset if not found', async () => {
      assetRepository.findOne.mockResolvedValue(null);
      const job = createMockJob<ScrapingJob>({ ticker: 'NEWT4', type: 'fundamental' });

      await processor.processFundamentalScraping(job);

      expect(assetRepository.save).toHaveBeenCalledWith({
        ticker: 'NEWT4',
        name: 'NEWT4',
        type: AssetType.STOCK,
        isActive: true,
      });
    });

    it('should convert ticker to uppercase', async () => {
      const job = createMockJob<ScrapingJob>({ ticker: 'petr4', type: 'fundamental' });

      await processor.processFundamentalScraping(job);

      expect(assetRepository.findOne).toHaveBeenCalledWith({
        where: { ticker: 'PETR4' },
      });
    });

    it('should save scraped data for each source', async () => {
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'fundamental' });

      await processor.processFundamentalScraping(job);

      expect(scrapedDataRepository.save).toHaveBeenCalledTimes(2);
      expect(dataSourceRepository.findOne).toHaveBeenCalledTimes(2);
    });

    it('should update data source stats on success', async () => {
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'fundamental' });

      await processor.processFundamentalScraping(job);

      expect(dataSourceRepository.save).toHaveBeenCalled();
    });

    it('should not save data if result is invalid', async () => {
      scrapersService.scrapeFundamentalData.mockResolvedValue({
        isValid: false,
        data: null,
        sources: [],
        sourcesCount: 0,
        confidence: 0,
        fieldSources: {},
        rawSourcesData: [],
      });
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'fundamental' });

      await processor.processFundamentalScraping(job);

      expect(scrapedDataRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error on scraping failure', async () => {
      scrapersService.scrapeFundamentalData.mockRejectedValue(new Error('Scraping failed'));
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'fundamental' });

      await expect(processor.processFundamentalScraping(job)).rejects.toThrow('Scraping failed');
    });

    it('should skip saving if data source not found', async () => {
      dataSourceRepository.findOne.mockResolvedValue(null);
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'fundamental' });

      await processor.processFundamentalScraping(job);

      expect(scrapedDataRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('processOptionsScraping', () => {
    it('should process options scraping for existing asset', async () => {
      dataSourceRepository.findOne.mockResolvedValue({ ...mockDataSource, code: 'opcoes' });
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'options' });

      const result = await processor.processOptionsScraping(job);

      expect(result).toEqual({
        success: true,
        ticker: 'PETR4',
      });
      expect(scrapersService.scrapeOptionsData).toHaveBeenCalledWith('PETR4');
    });

    it('should throw error if asset not found', async () => {
      assetRepository.findOne.mockResolvedValue(null);
      const job = createMockJob<ScrapingJob>({ ticker: 'UNKNOWN', type: 'options' });

      await expect(processor.processOptionsScraping(job)).rejects.toThrow('Asset UNKNOWN not found');
    });

    it('should save options data', async () => {
      dataSourceRepository.findOne.mockResolvedValue({ ...mockDataSource, code: 'opcoes' });
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'options' });

      await processor.processOptionsScraping(job);

      expect(scrapedDataRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          dataType: 'options',
          isValid: true,
        }),
      );
    });

    it('should not save data if options scraping fails', async () => {
      scrapersService.scrapeOptionsData.mockResolvedValue({
        success: false,
        data: null,
      });
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'options' });

      await processor.processOptionsScraping(job);

      expect(scrapedDataRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error on scraping failure', async () => {
      scrapersService.scrapeOptionsData.mockRejectedValue(new Error('Options scraping failed'));
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'options' });

      await expect(processor.processOptionsScraping(job)).rejects.toThrow('Options scraping failed');
    });

    it('should update data source stats on success', async () => {
      dataSourceRepository.findOne.mockResolvedValue({ ...mockDataSource, code: 'opcoes' });
      const job = createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'options' });

      await processor.processOptionsScraping(job);

      expect(dataSourceRepository.save).toHaveBeenCalled();
    });
  });

  describe('processBulkScraping', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should process multiple tickers', async () => {
      const job = createMockJob({ tickers: ['PETR4', 'VALE3'] });

      const processPromise = processor.processBulkScraping(job);

      // Fast-forward through the delays
      await jest.runAllTimersAsync();

      const result = await processPromise;

      expect(result.total).toBe(2);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should handle empty tickers array', async () => {
      const job = createMockJob({ tickers: [] });

      const result = await processor.processBulkScraping(job);

      expect(result.total).toBe(0);
      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should continue processing on individual ticker failure', async () => {
      scrapersService.scrapeFundamentalData
        .mockRejectedValueOnce(new Error('First ticker failed'))
        .mockResolvedValueOnce(mockFundamentalResult);

      const job = createMockJob({ tickers: ['FAIL', 'PETR4'] });

      const processPromise = processor.processBulkScraping(job);
      await jest.runAllTimersAsync();

      const result = await processPromise;

      expect(result.total).toBe(2);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toBe('First ticker failed');
      expect(result.results[1].success).toBe(true);
    });

    it('should include error message in failed results', async () => {
      scrapersService.scrapeFundamentalData.mockRejectedValue(new Error('Timeout'));
      const job = createMockJob({ tickers: ['FAIL'] });

      const processPromise = processor.processBulkScraping(job);
      await jest.runAllTimersAsync();

      const result = await processPromise;

      expect(result.results[0]).toEqual({
        ticker: 'FAIL',
        success: false,
        error: 'Timeout',
      });
    });
  });

  describe('edge cases', () => {
    it('should handle ticker with special characters', async () => {
      assetRepository.findOne.mockResolvedValue({
        ...mockAsset,
        ticker: 'PETR4F',
      });
      const job = createMockJob<ScrapingJob>({ ticker: 'petr4f', type: 'fundamental' });

      await processor.processFundamentalScraping(job);

      expect(assetRepository.findOne).toHaveBeenCalledWith({
        where: { ticker: 'PETR4F' },
      });
    });

    it('should handle concurrent processing', async () => {
      const jobs = [
        createMockJob<ScrapingJob>({ ticker: 'PETR4', type: 'fundamental' }),
        createMockJob<ScrapingJob>({ ticker: 'VALE3', type: 'fundamental' }),
        createMockJob<ScrapingJob>({ ticker: 'ITUB4', type: 'fundamental' }),
      ];

      const results = await Promise.all(
        jobs.map((job) => processor.processFundamentalScraping(job)),
      );

      expect(results).toHaveLength(3);
      expect(scrapersService.scrapeFundamentalData).toHaveBeenCalledTimes(3);
    });
  });
});
