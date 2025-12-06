import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalServerErrorException } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { CacheService } from '../../common/services/cache.service';
import { AssetsService } from '../assets/assets.service';
import { PythonServiceClient } from './clients/python-service.client';
import { SyncGateway } from './sync.gateway';
import { BrapiScraper } from '../../scrapers/fundamental/brapi.scraper';
import {
  Asset,
  AssetPrice,
  SyncHistory,
  IntradayPrice,
  PriceSource,
} from '../../database/entities';
import { IntradayRangeParam, IntradayTimeframeParam } from './dto';

describe('MarketDataService', () => {
  let service: MarketDataService;
  let cacheService: CacheService;
  let assetsService: AssetsService;
  let pythonServiceClient: PythonServiceClient;
  let syncGateway: SyncGateway;
  let brapiScraper: BrapiScraper;
  let assetRepository: Repository<Asset>;
  let assetPriceRepository: Repository<AssetPrice>;
  let syncHistoryRepository: Repository<SyncHistory>;
  let intradayPriceRepository: Repository<IntradayPrice>;

  const mockAsset: Partial<Asset> = {
    id: 'asset-123',
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: 'stock' as any,
    isActive: true,
  };

  const mockPrices = [
    { date: '2024-01-15', open: 35.5, high: 36.0, low: 35.0, close: 35.8, volume: 1000000 },
    { date: '2024-01-16', open: 35.8, high: 36.5, low: 35.5, close: 36.2, volume: 1200000 },
    { date: '2024-01-17', open: 36.2, high: 37.0, low: 36.0, close: 36.8, volume: 1100000 },
  ];

  const mockQueryBuilder = {
    createQueryBuilder: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    into: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    orUpdate: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    query: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    generateKey: jest.fn(),
  };

  const mockAssetsService = {
    getPriceHistory: jest.fn(),
  };

  const mockPythonServiceClient = {
    calculateIndicators: jest.fn(),
    post: jest.fn(),
  };

  const mockSyncGateway = {
    emitSyncStarted: jest.fn(),
    emitSyncProgress: jest.fn(),
    emitSyncCompleted: jest.fn(),
    emitSyncFailed: jest.fn(),
  };

  const mockBrapiScraper = {
    getHistoricalPrices: jest.fn(),
  };

  const mockAssetRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    query: jest.fn(),
  };

  const mockAssetPriceRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    query: jest.fn(),
  };

  const mockSyncHistoryRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  };

  const mockIntradayPriceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    query: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataService,
        { provide: CacheService, useValue: mockCacheService },
        { provide: AssetsService, useValue: mockAssetsService },
        { provide: PythonServiceClient, useValue: mockPythonServiceClient },
        { provide: SyncGateway, useValue: mockSyncGateway },
        { provide: BrapiScraper, useValue: mockBrapiScraper },
        { provide: getRepositoryToken(Asset), useValue: mockAssetRepository },
        { provide: getRepositoryToken(AssetPrice), useValue: mockAssetPriceRepository },
        { provide: getRepositoryToken(SyncHistory), useValue: mockSyncHistoryRepository },
        { provide: getRepositoryToken(IntradayPrice), useValue: mockIntradayPriceRepository },
      ],
    }).compile();

    service = module.get<MarketDataService>(MarketDataService);
    cacheService = module.get<CacheService>(CacheService);
    assetsService = module.get<AssetsService>(AssetsService);
    pythonServiceClient = module.get<PythonServiceClient>(PythonServiceClient);
    syncGateway = module.get<SyncGateway>(SyncGateway);
    brapiScraper = module.get<BrapiScraper>(BrapiScraper);
    assetRepository = module.get<Repository<Asset>>(getRepositoryToken(Asset));
    assetPriceRepository = module.get<Repository<AssetPrice>>(getRepositoryToken(AssetPrice));
    syncHistoryRepository = module.get<Repository<SyncHistory>>(getRepositoryToken(SyncHistory));
    intradayPriceRepository = module.get<Repository<IntradayPrice>>(getRepositoryToken(IntradayPrice));
  });

  describe('calculateDateRange (private method via reflection)', () => {
    let calculateDateRange: (range: string) => { startDate: Date; endDate: Date };

    beforeEach(() => {
      calculateDateRange = (service as any).calculateDateRange.bind(service);
    });

    it('should calculate 1mo range', () => {
      const { startDate, endDate } = calculateDateRange('1mo');
      const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(28);
      expect(daysDiff).toBeLessThanOrEqual(32);
    });

    it('should calculate 3mo range', () => {
      const { startDate, endDate } = calculateDateRange('3mo');
      const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(85);
      expect(daysDiff).toBeLessThanOrEqual(95);
    });

    it('should calculate 1y range', () => {
      const { startDate, endDate } = calculateDateRange('1y');
      const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(360);
      expect(daysDiff).toBeLessThanOrEqual(370);
    });

    it('should calculate max range starting from 1986', () => {
      const { startDate } = calculateDateRange('max');
      expect(startDate.getFullYear()).toBe(1986);
    });

    it('should default to 1y for unknown range', () => {
      const { startDate, endDate } = calculateDateRange('unknown');
      const daysDiff = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(360);
      expect(daysDiff).toBeLessThanOrEqual(370);
    });
  });

  describe('getAggregatedPrices', () => {
    it('should return daily prices for 1D timeframe', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockQueryBuilder.getMany.mockResolvedValue([
        { date: new Date('2024-01-15'), open: 35.5, high: 36.0, low: 35.0, close: 35.8, volume: 1000000 },
      ]);

      const result = await service.getAggregatedPrices('PETR4', '1D', '1mo');

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].date).toBe('2024-01-15');
    });

    it('should throw error for unknown asset', async () => {
      mockAssetRepository.findOne.mockResolvedValue(null);

      await expect(service.getAggregatedPrices('INVALID', '1D', '1mo'))
        .rejects.toThrow(InternalServerErrorException);
    });

    it('should execute aggregation query for 1W timeframe', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockAssetPriceRepository.query.mockResolvedValue([
        {
          period_start: new Date('2024-01-15'),
          open: '35.5',
          high: '37.0',
          low: '35.0',
          close: '36.8',
          volume: '3300000',
        },
      ]);

      const result = await service.getAggregatedPrices('PETR4', '1W', '1mo');

      expect(mockAssetPriceRepository.query).toHaveBeenCalled();
      expect(result[0].volume).toBe(3300000);
    });

    it('should execute aggregation query for 1M timeframe', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockAssetPriceRepository.query.mockResolvedValue([
        {
          period_start: new Date('2024-01-01'),
          open: '35.5',
          high: '40.0',
          low: '34.0',
          close: '38.5',
          volume: '20000000',
        },
      ]);

      const result = await service.getAggregatedPrices('PETR4', '1M', '1y');

      expect(result[0].close).toBe(38.5);
    });
  });

  describe('getPrices', () => {
    it('should fetch prices using AssetsService', async () => {
      mockAssetsService.getPriceHistory.mockResolvedValue(mockPrices);

      const result = await service.getPrices('PETR4', '1MO');

      expect(mockAssetsService.getPriceHistory).toHaveBeenCalledWith('PETR4', expect.any(Object));
      expect(result.length).toBe(3);
    });

    it('should convert string values to numbers', async () => {
      mockAssetsService.getPriceHistory.mockResolvedValue([
        { date: '2024-01-15', open: '35.5', high: '36.0', low: '35.0', close: '35.8', volume: '1000000' },
      ]);

      const result = await service.getPrices('PETR4', '1MO');

      expect(typeof result[0].open).toBe('number');
      expect(typeof result[0].volume).toBe('number');
    });

    it('should handle errors gracefully', async () => {
      mockAssetsService.getPriceHistory.mockRejectedValue(new Error('Service error'));

      await expect(service.getPrices('PETR4', '1MO'))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getTechnicalData', () => {
    it('should return cached data if available', async () => {
      const cachedData = {
        ticker: 'PETR4',
        prices: mockPrices,
        indicators: { sma: [35, 36, 37] },
        metadata: { data_points: 3, cached: true, duration: 10 },
      };
      mockCacheService.get.mockResolvedValue(cachedData);

      const result = await service.getTechnicalData('PETR4', '1D', '1y');

      expect(result.metadata.cached).toBe(true);
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    it('should fetch fresh data on cache miss', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);

      // Need 200+ data points for indicators
      const manyPrices = Array(250).fill(null).map((_, i) => ({
        date: new Date(2024, 0, 15 - i),
        open: 35 + i * 0.1,
        high: 36 + i * 0.1,
        low: 34 + i * 0.1,
        close: 35.5 + i * 0.1,
        volume: 1000000 + i * 1000,
      }));
      mockQueryBuilder.getMany.mockResolvedValue(manyPrices);
      mockPythonServiceClient.calculateIndicators.mockResolvedValue({ sma: [] });

      const result = await service.getTechnicalData('PETR4', '1D', '1y');

      expect(result.metadata.cached).toBe(false);
      expect(mockPythonServiceClient.calculateIndicators).toHaveBeenCalled();
    });

    it('should return error metadata for insufficient data', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockQueryBuilder.getMany.mockResolvedValue(mockPrices); // Only 3 prices

      const result = await service.getTechnicalData('PETR4', '1D', '1mo');

      expect(result.indicators).toBeNull();
      expect(result.metadata.error).toBe('INSUFFICIENT_DATA');
      expect(result.metadata.required).toBe(200);
    });
  });

  describe('getSyncHistory', () => {
    it('should return sync history with pagination', async () => {
      const mockRecords = [
        {
          id: 'sync-1',
          asset: { ticker: 'PETR4' },
          operationType: 'sync_cotahist',
          status: 'success',
          recordsSynced: 1000,
          processingTime: 5.5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockSyncHistoryRepository.findAndCount.mockResolvedValue([mockRecords, 1]);

      const result = await service.getSyncHistory({ limit: 50, offset: 0 });

      expect(result.data.length).toBe(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should filter by ticker', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockSyncHistoryRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getSyncHistory({ ticker: 'PETR4', limit: 50, offset: 0 });

      expect(mockAssetRepository.findOne).toHaveBeenCalledWith({ where: { ticker: 'PETR4' } });
    });

    it('should return empty for unknown ticker', async () => {
      mockAssetRepository.findOne.mockResolvedValue(null);

      const result = await service.getSyncHistory({ ticker: 'INVALID', limit: 50, offset: 0 });

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getSyncStatus', () => {
    it('should return sync status for all assets', async () => {
      mockAssetRepository.query.mockResolvedValue([
        {
          ticker: 'PETR4',
          name: 'Petrobras PN',
          records_loaded: 1000,
          oldest_date: new Date('2020-01-01'),
          newest_date: new Date('2024-01-15'),
          last_sync_status: 'success',
          last_sync_at: new Date(),
          last_sync_duration: '5.5',
        },
        {
          ticker: 'VALE3',
          name: 'Vale',
          records_loaded: 0,
          oldest_date: null,
          newest_date: null,
          last_sync_status: null,
          last_sync_at: null,
          last_sync_duration: null,
        },
      ]);

      const result = await service.getSyncStatus();

      expect(result.assets.length).toBe(2);
      expect(result.assets[0].status).toBe('SYNCED');
      expect(result.assets[1].status).toBe('PENDING');
      expect(result.summary.synced).toBe(1);
      expect(result.summary.pending).toBe(1);
    });

    it('should mark as PARTIAL when records < 200', async () => {
      mockAssetRepository.query.mockResolvedValue([
        {
          ticker: 'ABEV3',
          name: 'Ambev',
          records_loaded: 50,
          oldest_date: new Date('2024-01-01'),
          newest_date: new Date('2024-01-15'),
          last_sync_status: 'success',
        },
      ]);

      const result = await service.getSyncStatus();

      expect(result.assets[0].status).toBe('PARTIAL');
    });

    it('should mark as FAILED when last sync failed', async () => {
      mockAssetRepository.query.mockResolvedValue([
        {
          ticker: 'ITUB4',
          name: 'Itau Unibanco',
          records_loaded: 500,
          last_sync_status: 'failed',
        },
      ]);

      const result = await service.getSyncStatus();

      expect(result.assets[0].status).toBe('FAILED');
    });
  });

  describe('validateSyncBulkRequest', () => {
    it('should pass validation for valid tickers', async () => {
      mockAssetRepository.find.mockResolvedValue([
        { ticker: 'PETR4' },
        { ticker: 'VALE3' },
      ]);

      await expect(service.validateSyncBulkRequest(['PETR4', 'VALE3']))
        .resolves.not.toThrow();
    });

    it('should throw error for invalid tickers', async () => {
      mockAssetRepository.find.mockResolvedValue([
        { ticker: 'PETR4' },
      ]);

      await expect(service.validateSyncBulkRequest(['PETR4', 'INVALID']))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('calculateIntradayRange (private method via reflection)', () => {
    let calculateIntradayRange: (range: IntradayRangeParam, startTime?: string, endTime?: string) => { start: Date; end: Date };

    beforeEach(() => {
      calculateIntradayRange = (service as any).calculateIntradayRange.bind(service);
    });

    it('should use explicit times when provided', () => {
      const { start, end } = calculateIntradayRange(
        IntradayRangeParam.D1,
        '2024-01-15T09:00:00Z',
        '2024-01-15T18:00:00Z',
      );

      expect(start.toISOString()).toBe('2024-01-15T09:00:00.000Z');
      expect(end.toISOString()).toBe('2024-01-15T18:00:00.000Z');
    });

    it('should calculate H1 range', () => {
      const { start, end } = calculateIntradayRange(IntradayRangeParam.H1);
      const hoursDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeCloseTo(1, 0);
    });

    it('should calculate D1 range', () => {
      const { start, end } = calculateIntradayRange(IntradayRangeParam.D1);
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(1, 0);
    });

    it('should calculate W1 range', () => {
      const { start, end } = calculateIntradayRange(IntradayRangeParam.W1);
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(7, 0);
    });
  });

  describe('mergeCotahistBrapi (private method via reflection)', () => {
    let mergeCotahistBrapi: (cotahist: any[], brapi: any[], ticker: string) => any[];

    beforeEach(() => {
      mergeCotahistBrapi = (service as any).mergeCotahistBrapi.bind(service);
    });

    it('should merge COTAHIST and BRAPI data', () => {
      // COTAHIST: old data (> 3 months ago)
      const cotahist = [
        { date: '2023-01-10', open: 35.0, high: 36.0, low: 34.0, close: 35.5, volume: 1000000 },
      ];
      // BRAPI: recent data (within 3 months) - merge logic only adds BRAPI if >= 3 months ago
      const today = new Date();
      const recentDate = new Date(today);
      recentDate.setDate(recentDate.getDate() - 30); // 30 days ago (within 3 months)
      const dateStr = recentDate.toISOString().split('T')[0];

      const brapi = [
        { date: dateStr, open: 36.0, high: 37.0, low: 35.0, close: 36.5, volume: 1200000, adjustedClose: 36.5 },
      ];

      const result = mergeCotahistBrapi(cotahist, brapi, 'PETR4');

      expect(result.length).toBe(2);
      expect(result[0].source).toBe(PriceSource.COTAHIST);
      expect(result[1].source).toBe(PriceSource.BRAPI);
    });

    it('should prefer BRAPI for recent overlapping dates', () => {
      const today = new Date();
      const recentDate = new Date(today);
      recentDate.setDate(recentDate.getDate() - 30); // Within 3 months
      const dateStr = recentDate.toISOString().split('T')[0];

      const cotahist = [
        { date: dateStr, open: 35.0, high: 36.0, low: 34.0, close: 35.5, volume: 1000000 },
      ];
      const brapi = [
        { date: dateStr, open: 35.1, high: 36.1, low: 34.1, close: 35.6, volume: 1000100, adjustedClose: 35.6 },
      ];

      const result = mergeCotahistBrapi(cotahist, brapi, 'PETR4');

      // BRAPI should replace COTAHIST for recent dates
      expect(result.length).toBe(1);
      expect(result[0].source).toBe(PriceSource.BRAPI);
    });

    it('should skip invalid records', () => {
      const cotahist = [
        { date: '2024-01-10', open: null, high: null, low: null, close: null, volume: null },
      ];
      const brapi: any[] = [];

      const result = mergeCotahistBrapi(cotahist, brapi, 'PETR4');

      expect(result.length).toBe(0);
    });

    it('should sort by date', () => {
      const cotahist = [
        { date: '2024-01-15', open: 35.0, high: 36.0, low: 34.0, close: 35.5, volume: 1000000 },
        { date: '2024-01-10', open: 34.0, high: 35.0, low: 33.0, close: 34.5, volume: 900000 },
      ];

      const result = mergeCotahistBrapi(cotahist, [], 'PETR4');

      expect(result[0].date).toBe('2024-01-10');
      expect(result[1].date).toBe('2024-01-15');
    });
  });

  describe('getIntradayData', () => {
    it('should fetch intraday data for asset', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockIntradayPriceRepository.query.mockResolvedValue([
        {
          timestamp: new Date('2024-01-15T10:00:00Z'),
          open: 35.5,
          high: 36.0,
          low: 35.0,
          close: 35.8,
          volume: 100000,
        },
      ]);

      const result = await service.getIntradayData('PETR4', IntradayTimeframeParam.M15, IntradayRangeParam.D1);

      expect(result.ticker).toBe('PETR4');
      expect(result.data.length).toBe(1);
      expect(result.metadata.source).toContain('hypertable');
    });

    it('should throw error for unknown asset', async () => {
      mockAssetRepository.findOne.mockResolvedValue(null);

      await expect(service.getIntradayData('INVALID'))
        .rejects.toThrow(InternalServerErrorException);
    });

    it('should use continuous aggregate for H1 timeframe', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockIntradayPriceRepository.query.mockResolvedValue([]);

      const result = await service.getIntradayData('PETR4', IntradayTimeframeParam.H1);

      expect(result.metadata.source).toContain('continuous_aggregate:intraday_1h');
    });

    it('should use continuous aggregate for H4 timeframe', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockIntradayPriceRepository.query.mockResolvedValue([]);

      const result = await service.getIntradayData('PETR4', IntradayTimeframeParam.H4);

      expect(result.metadata.source).toContain('continuous_aggregate:intraday_4h');
    });
  });

  describe('generateCacheKey (private method via reflection)', () => {
    let generateCacheKey: (ticker: string, timeframe: string) => string;

    beforeEach(() => {
      generateCacheKey = (service as any).generateCacheKey.bind(service);
      mockCacheService.generateKey.mockImplementation((...args) => args.join(':'));
    });

    it('should generate cache key with correct format', () => {
      const key = generateCacheKey('PETR4', '1D');

      expect(mockCacheService.generateKey).toHaveBeenCalledWith(
        'market-data',
        'technical',
        'PETR4',
        '1D',
        'all',
      );
    });
  });
});
