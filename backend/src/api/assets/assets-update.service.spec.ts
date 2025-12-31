import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { AssetsUpdateService, UpdateResult, BatchUpdateResult } from './assets-update.service';
import {
  Asset,
  FundamentalData,
  UpdateLog,
  UpdateStatus,
  UpdateTrigger,
  Portfolio,
  PortfolioPosition,
} from '@database/entities';
import { ScrapersService } from '../../scrapers/scrapers.service';
import { OpcoesScraper } from '../../scrapers/options/opcoes.scraper';
import { AppWebSocketGateway } from '../../websocket/websocket.gateway';
import { TelemetryService } from '../../telemetry/telemetry.service';
import {
  NewsCollectorsService,
  AIOrchestatorService,
  ConsensusService,
} from '../news/services';
import { NewsService } from '../news/news.service';

describe('AssetsUpdateService', () => {
  let service: AssetsUpdateService;
  let assetRepository: Repository<Asset>;
  let fundamentalDataRepository: Repository<FundamentalData>;
  let updateLogRepository: Repository<UpdateLog>;
  let portfolioRepository: Repository<Portfolio>;
  let portfolioPositionRepository: Repository<PortfolioPosition>;
  let scrapersService: ScrapersService;
  let webSocketGateway: AppWebSocketGateway;

  const mockAsset: Partial<Asset> = {
    id: 'asset-123',
    ticker: 'PETR4',
    name: 'Petrobras PN',
    isActive: true,
    autoUpdateEnabled: true,
    updateRetryCount: 0,
  };

  const mockScrapedResult = {
    data: {
      pl: 8.5,
      pvp: 1.2,
      roe: 18.5,
      dividendYield: 6.5,
    },
    sources: ['fundamentus', 'statusinvest', 'investidor10'],
    sourcesCount: 3,
    confidence: 0.85,
    discrepancies: [],
    rawSourcesData: [
      { source: 'fundamentus', data: { pl: 8.5, sector: 'Petróleo e Gás' }, scrapedAt: new Date().toISOString() },
      { source: 'statusinvest', data: { pl: 8.6, sector: 'Petróleo' }, scrapedAt: new Date().toISOString() },
    ],
    fieldSources: {
      pl: { finalValue: 8.5, sources: ['fundamentus', 'statusinvest'] },
      pvp: { finalValue: 1.2, sources: ['fundamentus'] },
    },
  };

  const mockAssetRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockFundamentalDataRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnThis(),
      into: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      onConflict: jest.fn().mockReturnThis(),
      execute: jest.fn().mockResolvedValue({ identifiers: [{ id: 'fd-123' }] }),
    }),
    findOne: jest.fn().mockResolvedValue({ id: 'fd-123' }),
  };

  const mockUpdateLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPortfolioRepository = {
    findOne: jest.fn(),
  };

  const mockPortfolioPositionRepository = {};

  const mockScrapersService = {
    scrapeFundamentalData: jest.fn(),
  };

  const mockWebSocketGateway = {
    emitAssetUpdateStarted: jest.fn(),
    emitAssetUpdateCompleted: jest.fn(),
    emitAssetUpdateFailed: jest.fn(),
    emitBatchUpdateStarted: jest.fn(),
    emitBatchUpdateProgress: jest.fn(),
    emitBatchUpdateCompleted: jest.fn(),
  };

  const mockOpcoesScraper = {
    scrapeLiquidityWithDetails: jest.fn().mockResolvedValue(new Map()),
  };

  const mockTelemetryService = {
    withSpan: jest.fn((name, fn, opts) => fn({ setAttributes: jest.fn() })),
    addSpanEvent: jest.fn(),
    recordScraperDuration: jest.fn(),
  };

  const mockNewsCollectorsService = {
    collectForTicker: jest.fn().mockResolvedValue([]),
  };

  const mockAIOrchestatorService = {
    analyzeNews: jest.fn().mockResolvedValue({}),
  };

  const mockConsensusService = {
    calculateConsensus: jest.fn().mockResolvedValue({}),
  };

  const mockNewsService = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOneEntity: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsUpdateService,
        { provide: getRepositoryToken(Asset), useValue: mockAssetRepository },
        { provide: getRepositoryToken(FundamentalData), useValue: mockFundamentalDataRepository },
        { provide: getRepositoryToken(UpdateLog), useValue: mockUpdateLogRepository },
        { provide: getRepositoryToken(Portfolio), useValue: mockPortfolioRepository },
        { provide: getRepositoryToken(PortfolioPosition), useValue: mockPortfolioPositionRepository },
        { provide: ScrapersService, useValue: mockScrapersService },
        { provide: OpcoesScraper, useValue: mockOpcoesScraper },
        { provide: AppWebSocketGateway, useValue: mockWebSocketGateway },
        { provide: TelemetryService, useValue: mockTelemetryService },
        { provide: NewsCollectorsService, useValue: mockNewsCollectorsService },
        { provide: AIOrchestatorService, useValue: mockAIOrchestatorService },
        { provide: ConsensusService, useValue: mockConsensusService },
        { provide: NewsService, useValue: mockNewsService },
      ],
    }).compile();

    service = module.get<AssetsUpdateService>(AssetsUpdateService);
    assetRepository = module.get<Repository<Asset>>(getRepositoryToken(Asset));
    fundamentalDataRepository = module.get<Repository<FundamentalData>>(getRepositoryToken(FundamentalData));
    updateLogRepository = module.get<Repository<UpdateLog>>(getRepositoryToken(UpdateLog));
    portfolioRepository = module.get<Repository<Portfolio>>(getRepositoryToken(Portfolio));
    scrapersService = module.get<ScrapersService>(ScrapersService);
    webSocketGateway = module.get<AppWebSocketGateway>(AppWebSocketGateway);
  });

  describe('sanitizeNumericValue (private method via reflection)', () => {
    let sanitizeNumericValue: (value: any) => any;

    beforeEach(() => {
      sanitizeNumericValue = (service as any).sanitizeNumericValue.bind(service);
    });

    it('should return null for null input', () => {
      expect(sanitizeNumericValue(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(sanitizeNumericValue(undefined)).toBeNull();
    });

    it('should return null for NaN', () => {
      expect(sanitizeNumericValue(NaN)).toBeNull();
    });

    it('should return null for Infinity', () => {
      expect(sanitizeNumericValue(Infinity)).toBeNull();
      expect(sanitizeNumericValue(-Infinity)).toBeNull();
    });

    it('should reject value exceeding max (FASE 144: no clamping)', () => {
      const result = sanitizeNumericValue(1e20); // Much larger than max
      // FASE 144: Invalid financial data is REJECTED, not clamped
      expect(result).toBeNull();
    });

    it('should reject negative value below min (FASE 144: no clamping)', () => {
      const result = sanitizeNumericValue(-1e20);
      // FASE 144: Invalid financial data is REJECTED, not clamped
      expect(result).toBeNull();
    });

    it('should return Decimal for valid number', () => {
      const result = sanitizeNumericValue(123.456789);
      // Returns Decimal.js instance
      expect(result).not.toBeNull();
      expect(result.toNumber()).toBe(123.456789);
    });

    it('should parse numeric string to Decimal', () => {
      const result = sanitizeNumericValue('45.67');
      // Returns Decimal.js instance
      expect(result).not.toBeNull();
      expect(result.toNumber()).toBe(45.67);
    });
  });

  describe('extractSectorFromSources (private method via reflection)', () => {
    let extractSectorFromSources: (rawSourcesData: any[]) => string | null;

    beforeEach(() => {
      extractSectorFromSources = (service as any).extractSectorFromSources.bind(service);
    });

    it('should return null for empty array', () => {
      expect(extractSectorFromSources([])).toBeNull();
    });

    it('should return null for null input', () => {
      expect(extractSectorFromSources(null as any)).toBeNull();
    });

    it('should extract sector from fundamentus (priority source)', () => {
      const rawData = [
        { source: 'fundamentus', data: { sector: 'Petróleo e Gás' }, scrapedAt: new Date().toISOString() },
        { source: 'brapi', data: { sector: 'Energia' }, scrapedAt: new Date().toISOString() },
      ];
      expect(extractSectorFromSources(rawData)).toBe('Petróleo e Gás');
    });

    it('should use brapi when fundamentus not available', () => {
      const rawData = [
        { source: 'brapi', data: { sector: 'Tecnologia' }, scrapedAt: new Date().toISOString() },
        { source: 'statusinvest', data: { sector: 'Tech' }, scrapedAt: new Date().toISOString() },
      ];
      expect(extractSectorFromSources(rawData)).toBe('Tecnologia');
    });

    it('should reject invalid sector values', () => {
      const rawData = [
        { source: 'fundamentus', data: { sector: 'ações' }, scrapedAt: new Date().toISOString() },
        { source: 'brapi', data: { sector: 'Financeiro' }, scrapedAt: new Date().toISOString() },
      ];
      // 'ações' is invalid, should fall back to brapi
      expect(extractSectorFromSources(rawData)).toBe('Financeiro');
    });

    it('should reject very short sector values', () => {
      const rawData = [
        { source: 'fundamentus', data: { sector: 'AB' }, scrapedAt: new Date().toISOString() },
      ];
      expect(extractSectorFromSources(rawData)).toBeNull();
    });

    it('should clean sector text with newlines', () => {
      const rawData = [
        { source: 'fundamentus', data: { sector: 'Petróleo\n e Gás\t ' }, scrapedAt: new Date().toISOString() },
      ];
      expect(extractSectorFromSources(rawData)).toBe('Petróleo e Gás');
    });

    it('should reject ticker-like values', () => {
      const rawData = [
        { source: 'fundamentus', data: { sector: 'PETR4' }, scrapedAt: new Date().toISOString() },
        { source: 'brapi', data: { sector: 'Energia' }, scrapedAt: new Date().toISOString() },
      ];
      expect(extractSectorFromSources(rawData)).toBe('Energia');
    });
  });

  describe('updateSingleAsset', () => {
    it('should throw NotFoundException for unknown ticker', async () => {
      mockAssetRepository.findOne.mockResolvedValue(null);

      await expect(service.updateSingleAsset('UNKNOWN')).rejects.toThrow(NotFoundException);
    });

    it('should skip cron update when auto-update is disabled', async () => {
      mockAssetRepository.findOne.mockResolvedValue({
        ...mockAsset,
        autoUpdateEnabled: false,
      });

      const result = await service.updateSingleAsset('PETR4', undefined, UpdateTrigger.CRON);

      expect(result.success).toBe(false);
      expect(result.status).toBe(UpdateStatus.CANCELLED);
      expect(result.error).toContain('Auto-update disabled');
    });

    it('should successfully update asset with sufficient data', async () => {
      mockAssetRepository.findOne.mockResolvedValue({ ...mockAsset });
      mockAssetRepository.save.mockResolvedValue({ ...mockAsset });
      mockUpdateLogRepository.create.mockReturnValue({ id: 'log-123' });
      mockUpdateLogRepository.save.mockResolvedValue({ id: 'log-123' });
      mockScrapersService.scrapeFundamentalData.mockResolvedValue(mockScrapedResult);
      mockFundamentalDataRepository.create.mockReturnValue({});
      mockFundamentalDataRepository.save.mockResolvedValue({});

      const result = await service.updateSingleAsset('PETR4', 'user-123', UpdateTrigger.MANUAL);

      expect(result.success).toBe(true);
      expect(result.status).toBe(UpdateStatus.SUCCESS);
      expect(mockWebSocketGateway.emitAssetUpdateStarted).toHaveBeenCalled();
      expect(mockWebSocketGateway.emitAssetUpdateCompleted).toHaveBeenCalled();
    });

    it('should fail when insufficient data sources', async () => {
      mockAssetRepository.findOne.mockResolvedValue({ ...mockAsset });
      mockAssetRepository.save.mockResolvedValue({ ...mockAsset });
      mockUpdateLogRepository.create.mockReturnValue({ id: 'log-123' });
      mockUpdateLogRepository.save.mockResolvedValue({ id: 'log-123' });
      mockScrapersService.scrapeFundamentalData.mockResolvedValue({
        ...mockScrapedResult,
        sourcesCount: 1, // Less than MIN_SOURCES (2)
      });

      const result = await service.updateSingleAsset('PETR4');

      expect(result.success).toBe(false);
      expect(result.status).toBe(UpdateStatus.FAILED);
      expect(result.error).toContain('Insufficient data sources');
    });

    it('should fail when confidence is too low', async () => {
      mockAssetRepository.findOne.mockResolvedValue({ ...mockAsset });
      mockAssetRepository.save.mockResolvedValue({ ...mockAsset });
      mockUpdateLogRepository.create.mockReturnValue({ id: 'log-123' });
      mockUpdateLogRepository.save.mockResolvedValue({ id: 'log-123' });
      mockScrapersService.scrapeFundamentalData.mockResolvedValue({
        ...mockScrapedResult,
        confidence: 0.3, // Less than MIN_CONFIDENCE (0.5)
      });

      const result = await service.updateSingleAsset('PETR4');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Low confidence');
    });

    it('should increment retry count on failure', async () => {
      mockAssetRepository.findOne.mockResolvedValue({ ...mockAsset, updateRetryCount: 0 });
      mockAssetRepository.save.mockResolvedValue({ ...mockAsset });
      mockUpdateLogRepository.create.mockReturnValue({ id: 'log-123' });
      mockUpdateLogRepository.save.mockResolvedValue({ id: 'log-123' });
      mockScrapersService.scrapeFundamentalData.mockRejectedValue(new Error('Scraper error'));

      await service.updateSingleAsset('PETR4');

      expect(mockAssetRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ updateRetryCount: 1 }),
      );
    });

    it('should reset retry count after max retries (FASE 144: never disable asset)', async () => {
      mockAssetRepository.findOne.mockResolvedValue({ ...mockAsset, updateRetryCount: 2 }); // Already at 2
      mockAssetRepository.save.mockResolvedValue({ ...mockAsset });
      mockUpdateLogRepository.create.mockReturnValue({ id: 'log-123' });
      mockUpdateLogRepository.save.mockResolvedValue({ id: 'log-123' });
      mockScrapersService.scrapeFundamentalData.mockRejectedValue(new Error('Scraper error'));

      await service.updateSingleAsset('PETR4');

      // FASE 144: Max retries now RESETS counter instead of disabling
      // Assets are NEVER disabled, allowing retry in next batch
      expect(mockAssetRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          updateRetryCount: 0, // Reset to 0 for next batch
          autoUpdateEnabled: true, // Never disabled
        }),
      );
    });
  });

  describe('updatePortfolioAssets', () => {
    it('should throw NotFoundException for unknown portfolio', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue(null);

      await expect(service.updatePortfolioAssets('portfolio-123', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty result for portfolio with no assets', async () => {
      mockPortfolioRepository.findOne.mockResolvedValue({
        id: 'portfolio-123',
        positions: [],
      });

      const result = await service.updatePortfolioAssets('portfolio-123', 'user-123');

      expect(result.totalAssets).toBe(0);
      expect(result.successCount).toBe(0);
    });

    it('should update all portfolio assets', async () => {
      const mockPortfolio = {
        id: 'portfolio-123',
        positions: [
          { asset: { ...mockAsset, ticker: 'PETR4' } },
          { asset: { ...mockAsset, id: 'asset-456', ticker: 'VALE3' } },
        ],
      };
      mockPortfolioRepository.findOne.mockResolvedValue(mockPortfolio);
      mockAssetRepository.findOne.mockResolvedValue({ ...mockAsset });
      mockAssetRepository.save.mockResolvedValue({ ...mockAsset });
      mockUpdateLogRepository.create.mockReturnValue({ id: 'log-123' });
      mockUpdateLogRepository.save.mockResolvedValue({ id: 'log-123' });
      mockScrapersService.scrapeFundamentalData.mockResolvedValue(mockScrapedResult);
      mockFundamentalDataRepository.create.mockReturnValue({});
      mockFundamentalDataRepository.save.mockResolvedValue({});

      const result = await service.updatePortfolioAssets('portfolio-123', 'user-123');

      expect(result.totalAssets).toBe(2);
      expect(mockWebSocketGateway.emitBatchUpdateStarted).toHaveBeenCalledWith(
        expect.objectContaining({ portfolioId: 'portfolio-123' }),
      );
      expect(mockWebSocketGateway.emitBatchUpdateCompleted).toHaveBeenCalled();
    });
  });

  describe('updateMultipleAssets', () => {
    it('should throw BadRequestException for empty tickers', async () => {
      await expect(service.updateMultipleAssets([])).rejects.toThrow(BadRequestException);
    });

    it('should warn about not found tickers', async () => {
      mockAssetRepository.find.mockResolvedValue([{ ...mockAsset, ticker: 'PETR4' }]);
      mockAssetRepository.findOne.mockResolvedValue({ ...mockAsset });
      mockAssetRepository.save.mockResolvedValue({ ...mockAsset });
      mockUpdateLogRepository.create.mockReturnValue({ id: 'log-123' });
      mockUpdateLogRepository.save.mockResolvedValue({ id: 'log-123' });
      mockScrapersService.scrapeFundamentalData.mockResolvedValue(mockScrapedResult);
      mockFundamentalDataRepository.create.mockReturnValue({});
      mockFundamentalDataRepository.save.mockResolvedValue({});

      const result = await service.updateMultipleAssets(['PETR4', 'INVALID']);

      expect(result.totalAssets).toBe(1); // Only PETR4 found
    });

    it('should update multiple assets with rate limiting', async () => {
      const assets = [
        { ...mockAsset, ticker: 'PETR4' },
        { ...mockAsset, id: 'asset-456', ticker: 'VALE3' },
      ];
      mockAssetRepository.find.mockResolvedValue(assets);
      mockAssetRepository.findOne.mockResolvedValue({ ...mockAsset });
      mockAssetRepository.save.mockResolvedValue({ ...mockAsset });
      mockUpdateLogRepository.create.mockReturnValue({ id: 'log-123' });
      mockUpdateLogRepository.save.mockResolvedValue({ id: 'log-123' });
      mockScrapersService.scrapeFundamentalData.mockResolvedValue(mockScrapedResult);
      mockFundamentalDataRepository.create.mockReturnValue({});
      mockFundamentalDataRepository.save.mockResolvedValue({});

      const result = await service.updateMultipleAssets(['PETR4', 'VALE3']);

      expect(result.totalAssets).toBe(2);
      expect(mockWebSocketGateway.emitBatchUpdateProgress).toHaveBeenCalledTimes(2);
    });
  });

  describe('getOutdatedAssets', () => {
    it('should return outdated assets', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAsset]),
      };
      mockAssetRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getOutdatedAssets();

      expect(result).toEqual([mockAsset]);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('asset.isActive = :isActive', { isActive: true });
    });

    it('should filter by portfolio when provided', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAsset]),
      };
      mockAssetRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await service.getOutdatedAssets('portfolio-123');

      expect(mockQueryBuilder.innerJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'position.portfolioId = :portfolioId',
        { portfolioId: 'portfolio-123' },
      );
    });
  });

  describe('updateAssetsBySector', () => {
    it('should throw NotFoundException when no assets in sector', async () => {
      mockAssetRepository.find.mockResolvedValue([]);

      await expect(service.updateAssetsBySector('NonExistent')).rejects.toThrow(NotFoundException);
    });

    it('should update all assets in sector', async () => {
      const sectorAssets = [
        { ...mockAsset, ticker: 'PETR4', sector: 'Petróleo' },
        { ...mockAsset, id: 'asset-456', ticker: 'PETR3', sector: 'Petróleo' },
      ];
      mockAssetRepository.find
        .mockResolvedValueOnce(sectorAssets) // First call: find by sector
        .mockResolvedValueOnce(sectorAssets); // Second call: updateMultipleAssets validation

      mockAssetRepository.findOne.mockResolvedValue({ ...mockAsset });
      mockAssetRepository.save.mockResolvedValue({ ...mockAsset });
      mockUpdateLogRepository.create.mockReturnValue({ id: 'log-123' });
      mockUpdateLogRepository.save.mockResolvedValue({ id: 'log-123' });
      mockScrapersService.scrapeFundamentalData.mockResolvedValue(mockScrapedResult);
      mockFundamentalDataRepository.create.mockReturnValue({});
      mockFundamentalDataRepository.save.mockResolvedValue({});

      const result = await service.updateAssetsBySector('Petróleo');

      expect(result.totalAssets).toBe(2);
    });
  });

  describe('retryFailedAssets', () => {
    it('should return empty result when no failed assets', async () => {
      mockAssetRepository.find.mockResolvedValue([]);

      const result = await service.retryFailedAssets();

      expect(result.totalAssets).toBe(0);
      expect(result.results).toEqual([]);
    });

    it('should retry failed assets', async () => {
      const failedAssets = [
        { ...mockAsset, ticker: 'PETR4', lastUpdateStatus: 'failed' },
      ];
      mockAssetRepository.find
        .mockResolvedValueOnce(failedAssets) // First call: find failed
        .mockResolvedValueOnce(failedAssets); // Second call: updateMultipleAssets validation

      mockAssetRepository.findOne.mockResolvedValue({ ...mockAsset });
      mockAssetRepository.save.mockResolvedValue({ ...mockAsset });
      mockUpdateLogRepository.create.mockReturnValue({ id: 'log-123' });
      mockUpdateLogRepository.save.mockResolvedValue({ id: 'log-123' });
      mockScrapersService.scrapeFundamentalData.mockResolvedValue(mockScrapedResult);
      mockFundamentalDataRepository.create.mockReturnValue({});
      mockFundamentalDataRepository.save.mockResolvedValue({});

      const result = await service.retryFailedAssets();

      expect(result.totalAssets).toBe(1);
    });
  });

  describe('getAllActiveAssets', () => {
    it('should return all active assets ordered by ticker', async () => {
      const assets = [
        { ...mockAsset, ticker: 'PETR4' },
        { ...mockAsset, id: 'asset-456', ticker: 'VALE3' },
      ];
      mockAssetRepository.find.mockResolvedValue(assets);

      const result = await service.getAllActiveAssets();

      expect(mockAssetRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { ticker: 'ASC' },
      });
      expect(result).toEqual(assets);
    });
  });

  describe('getAssetsWithPriority', () => {
    it('should return assets ordered by priority (hasOptions, lastUpdated)', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { ...mockAsset, ticker: 'PETR4', hasOptions: true, lastUpdated: null },
          { ...mockAsset, id: 'asset-456', ticker: 'VALE3', hasOptions: true, lastUpdated: new Date('2024-01-01') },
          { ...mockAsset, id: 'asset-789', ticker: 'ITUB4', hasOptions: false, lastUpdated: null },
        ]),
      };

      mockAssetRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder);

      const result = await service.getAssetsWithPriority();

      expect(mockAssetRepository.createQueryBuilder).toHaveBeenCalledWith('asset');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('asset.isActive = :isActive', { isActive: true });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('asset.autoUpdateEnabled = :autoUpdateEnabled', { autoUpdateEnabled: true });
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('asset.hasOptions', 'DESC');
      expect(result).toHaveLength(3);
      // First asset should have hasOptions=true and lastUpdated=null
      expect(result[0].hasOptions).toBe(true);
      expect(result[0].lastUpdated).toBeNull();
    });
  });

  describe('saveFundamentalData (private method)', () => {
    let saveFundamentalData: (asset: Asset, scrapedResult: any) => Promise<FundamentalData>;

    beforeEach(() => {
      saveFundamentalData = (service as any).saveFundamentalData.bind(service);
    });

    it('should create fundamental data with field sources', async () => {
      mockFundamentalDataRepository.create.mockReturnValue({ id: 'fd-123' });

      await saveFundamentalData(mockAsset as Asset, mockScrapedResult);

      // Values are now Decimal.js instances, check assetId and fieldSources
      expect(mockFundamentalDataRepository.create).toHaveBeenCalled();
      const createCall = mockFundamentalDataRepository.create.mock.calls[0][0];
      expect(createCall.assetId).toBe('asset-123');
      expect(createCall.fieldSources).toEqual(mockScrapedResult.fieldSources);
      // Decimal values: check toNumber()
      expect(createCall.pl?.toNumber()).toBe(8.5);
      expect(createCall.pvp?.toNumber()).toBe(1.2);
    });

    it('should reject invalid large values (FASE 144: no clamping)', async () => {
      const scrapedWithLargeValue = {
        ...mockScrapedResult,
        data: { pl: 1e20 }, // Very large value - exceeds max
        fieldSources: {},
      };
      mockFundamentalDataRepository.create.mockReturnValue({ id: 'fd-123' });

      await saveFundamentalData(mockAsset as Asset, scrapedWithLargeValue);

      // FASE 144: Invalid financial data is REJECTED (null), not clamped
      expect(mockFundamentalDataRepository.create).toHaveBeenCalled();
      const createCall = mockFundamentalDataRepository.create.mock.calls[0][0];
      expect(createCall.pl).toBeNull();
    });
  });
});
