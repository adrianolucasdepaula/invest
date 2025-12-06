import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { Asset, AssetPrice, FundamentalData, TickerChange, PriceSource } from '@database/entities';
import { ScrapersService } from '../../scrapers/scrapers.service';
import { BrapiScraper } from '../../scrapers/fundamental/brapi.scraper';
import { OpcoesScraper } from '../../scrapers/options/opcoes.scraper';
import { PriceRange } from './dto/historical-prices-query.dto';

describe('AssetsService', () => {
  let service: AssetsService;
  let assetRepository: Repository<Asset>;
  let assetPriceRepository: Repository<AssetPrice>;
  let fundamentalDataRepository: Repository<FundamentalData>;
  let tickerChangeRepository: Repository<TickerChange>;
  let scrapersService: ScrapersService;
  let brapiScraper: BrapiScraper;
  let opcoesScraper: OpcoesScraper;

  const mockAsset: Partial<Asset> = {
    id: 'asset-123',
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: 'stock' as any,
    sector: 'Petróleo',
    isActive: true,
    hasOptions: true,
  };

  const mockAssetPrice: Partial<AssetPrice> = {
    id: 'price-123',
    assetId: 'asset-123',
    date: new Date('2024-01-15'),
    open: 35.5,
    high: 36.0,
    low: 35.0,
    close: 35.8,
    volume: 1000000,
    source: PriceSource.BRAPI,
  };

  const mockQueryBuilder = {
    createQueryBuilder: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn(),
    getMany: jest.fn(),
  };

  const mockAssetRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockAssetPriceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockFundamentalDataRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTickerChangeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockScrapersService = {
    scrapeFundamentalData: jest.fn(),
  };

  const mockBrapiScraper = {
    scrape: jest.fn(),
  };

  const mockOpcoesScraper = {
    scrapeLiquidity: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: getRepositoryToken(Asset), useValue: mockAssetRepository },
        { provide: getRepositoryToken(AssetPrice), useValue: mockAssetPriceRepository },
        { provide: getRepositoryToken(FundamentalData), useValue: mockFundamentalDataRepository },
        { provide: getRepositoryToken(TickerChange), useValue: mockTickerChangeRepository },
        { provide: ScrapersService, useValue: mockScrapersService },
        { provide: BrapiScraper, useValue: mockBrapiScraper },
        { provide: OpcoesScraper, useValue: mockOpcoesScraper },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
    assetRepository = module.get<Repository<Asset>>(getRepositoryToken(Asset));
    assetPriceRepository = module.get<Repository<AssetPrice>>(getRepositoryToken(AssetPrice));
    fundamentalDataRepository = module.get<Repository<FundamentalData>>(getRepositoryToken(FundamentalData));
    tickerChangeRepository = module.get<Repository<TickerChange>>(getRepositoryToken(TickerChange));
    scrapersService = module.get<ScrapersService>(ScrapersService);
    brapiScraper = module.get<BrapiScraper>(BrapiScraper);
    opcoesScraper = module.get<OpcoesScraper>(OpcoesScraper);
  });

  describe('sanitizeNumericValue (private method via reflection)', () => {
    // Access private method for testing
    let sanitizeNumericValue: (value: any, maxValue?: number, decimalPlaces?: number) => number | null;

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
    });

    it('should return null for non-numeric string', () => {
      expect(sanitizeNumericValue('abc')).toBeNull();
    });

    it('should parse numeric string correctly', () => {
      expect(sanitizeNumericValue('123.45')).toBe(123.45);
    });

    it('should clamp value exceeding max', () => {
      const result = sanitizeNumericValue(1000000000000000, 999999999999.99);
      expect(result).toBe(999999999999.99);
    });

    it('should clamp negative value below min', () => {
      const result = sanitizeNumericValue(-1000000000000000, 999999999999.99);
      expect(result).toBe(-999999999999.99);
    });

    it('should round to specified decimal places', () => {
      const result = sanitizeNumericValue(123.456789, 999999999999.99, 4);
      expect(result).toBe(123.4568);
    });

    it('should round to 2 decimal places by default', () => {
      const result = sanitizeNumericValue(123.456789);
      expect(result).toBe(123.46);
    });
  });

  describe('sanitizePriceData (private method via reflection)', () => {
    let sanitizePriceData: (data: any) => any;

    beforeEach(() => {
      sanitizePriceData = (service as any).sanitizePriceData.bind(service);
    });

    it('should sanitize all price fields', () => {
      const data = {
        open: 35.5,
        high: 36.0,
        low: 35.0,
        close: 35.8,
        adjustedClose: 35.8,
        marketCap: 100000000,
        change: 0.5,
        changePercent: 1.42,
      };

      const result = sanitizePriceData(data);

      expect(result.open).toBe(35.5);
      expect(result.high).toBe(36);
      expect(result.low).toBe(35);
      expect(result.close).toBe(35.8);
      expect(result.changePercent).toBe(1.42);
    });

    it('should handle null values', () => {
      const data = {
        open: null,
        high: null,
        low: null,
        close: null,
      };

      const result = sanitizePriceData(data);

      expect(result.open).toBeNull();
      expect(result.high).toBeNull();
    });

    it('should clamp excessive changePercent', () => {
      const data = {
        open: 35.5,
        changePercent: 9999999.9999, // Max for changePercent is 999999.9999
      };

      const result = sanitizePriceData(data);

      expect(result.changePercent).toBe(999999.9999);
    });
  });

  describe('rangeToStartDate (private method via reflection)', () => {
    let rangeToStartDate: (range: string) => string;

    beforeEach(() => {
      rangeToStartDate = (service as any).rangeToStartDate.bind(service);
    });

    it('should return start date for 1d range', () => {
      const result = rangeToStartDate('1d');
      const expected = new Date();
      expected.setDate(expected.getDate() - 1);
      expect(result).toContain(expected.toISOString().split('T')[0].slice(0, 7)); // Match year-month
    });

    it('should return start date for 1mo range', () => {
      const result = rangeToStartDate('1mo');
      const startDate = new Date(result);
      const now = new Date();
      const daysDiff = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(28);
      expect(daysDiff).toBeLessThanOrEqual(32);
    });

    it('should return start date for 1y range', () => {
      const result = rangeToStartDate('1y');
      const startDate = new Date(result);
      const now = new Date();
      const daysDiff = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(360);
      expect(daysDiff).toBeLessThanOrEqual(370);
    });

    it('should default to 1y for unknown range', () => {
      const result = rangeToStartDate('unknown');
      const startDate = new Date(result);
      const now = new Date();
      const daysDiff = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(360);
      expect(daysDiff).toBeLessThanOrEqual(370);
    });
  });

  describe('getExpectedDays (private method via reflection)', () => {
    let getExpectedDays: (range: string) => number;

    beforeEach(() => {
      getExpectedDays = (service as any).getExpectedDays.bind(service);
    });

    it('should return 1 for 1d range', () => {
      expect(getExpectedDays('1d')).toBe(1);
    });

    it('should return 5 for 5d range', () => {
      expect(getExpectedDays('5d')).toBe(5);
    });

    it('should return 20 trading days for 1mo range', () => {
      expect(getExpectedDays('1mo')).toBe(20);
    });

    it('should return 250 trading days for 1y range', () => {
      expect(getExpectedDays('1y')).toBe(250);
    });

    it('should return 250 for unknown range', () => {
      expect(getExpectedDays('unknown')).toBe(250);
    });
  });

  describe('shouldRefetchData (private method via reflection)', () => {
    let shouldRefetchData: (prices: AssetPrice[], range: string) => boolean;

    beforeEach(() => {
      shouldRefetchData = (service as any).shouldRefetchData.bind(service);
    });

    it('should return true for empty prices array', () => {
      expect(shouldRefetchData([], '1y')).toBe(true);
    });

    it('should return true for null prices', () => {
      expect(shouldRefetchData(null as any, '1y')).toBe(true);
    });

    it('should return true for stale data (> 24h old)', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2); // 2 days old

      const prices = [
        { date: oldDate } as AssetPrice,
      ];

      expect(shouldRefetchData(prices, '1y')).toBe(true);
    });

    it('should return false for fresh data', () => {
      const freshDate = new Date();
      freshDate.setHours(freshDate.getHours() - 1); // 1 hour old

      // Need enough data points (at least 50% of expected 250 for 1y)
      // Prices must be sorted ASC (oldest first, newest last) for shouldRefetchData
      const prices = Array(150).fill(null).map((_, i) => {
        const date = new Date(freshDate);
        date.setDate(date.getDate() - (149 - i)); // oldest at index 0, freshest at index 149
        return { date } as AssetPrice;
      });

      expect(shouldRefetchData(prices, '1y')).toBe(false);
    });

    it('should return true for incomplete data', () => {
      const freshDate = new Date();
      freshDate.setHours(freshDate.getHours() - 1); // 1 hour old

      // Only 10 data points for 1y range (expected 250, 50% = 125)
      // Prices must be sorted ASC (oldest first, newest last) for shouldRefetchData
      const prices = Array(10).fill(null).map((_, i) => {
        const date = new Date(freshDate);
        date.setDate(date.getDate() - (9 - i)); // oldest at index 0, freshest at index 9
        return { date } as AssetPrice;
      });

      expect(shouldRefetchData(prices, '1y')).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all assets with enriched data', async () => {
      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [mockAsset],
        raw: [{
          price1_close: '35.80',
          price1_change: '0.50',
          price1_change_percent: '1.42',
          price1_volume: '1000000',
          price1_market_cap: '100000000',
          price1_date: new Date('2024-01-15'),
          price1_collected_at: new Date(),
        }],
      });

      const result = await service.findAll();

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
      expect(result[0].ticker).toBe('PETR4');
      expect(result[0].price).toBe(35.8);
      expect(result[0].change).toBe(0.5);
      expect(result[0].changePercent).toBe(1.42);
    });

    it('should filter by type when provided', async () => {
      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [mockAsset],
        raw: [{ price1_close: '35.80' }],
      });

      await service.findAll('stock');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('asset.type = :type', { type: 'stock' });
    });

    it('should return empty array for invalid type', async () => {
      const result = await service.findAll('invalid_type');

      expect(result).toEqual([]);
    });

    it('should return null values when no price data', async () => {
      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [mockAsset],
        raw: [{}], // No price data
      });

      const result = await service.findAll();

      expect(result[0].price).toBeNull();
      expect(result[0].change).toBeNull();
      expect(result[0].changePercent).toBeNull();
    });
  });

  describe('findByTicker', () => {
    it('should return asset with enriched price data', async () => {
      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [mockAsset],
        raw: [{
          price1_close: '35.80',
          price1_change: '0.50',
          price1_change_percent: '1.42',
        }],
      });

      const result = await service.findByTicker('PETR4');

      expect(result).toBeDefined();
      expect(result.ticker).toBe('PETR4');
      expect(result.price).toBe(35.8);
    });

    it('should throw NotFoundException for unknown ticker', async () => {
      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [],
        raw: [],
      });

      await expect(service.findByTicker('INVALID')).rejects.toThrow(NotFoundException);
    });

    it('should handle ticker case insensitively', async () => {
      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [mockAsset],
        raw: [{ price1_close: '35.80' }],
      });

      await service.findByTicker('petr4');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'UPPER(asset.ticker) = :ticker',
        { ticker: 'PETR4' },
      );
    });
  });

  describe('create', () => {
    it('should create and save a new asset', async () => {
      const newAsset = { ticker: 'VALE3', name: 'Vale' };
      mockAssetRepository.create.mockReturnValue(newAsset);
      mockAssetRepository.save.mockResolvedValue({ ...newAsset, id: 'new-id' });

      const result = await service.create(newAsset);

      expect(mockAssetRepository.create).toHaveBeenCalledWith(newAsset);
      expect(mockAssetRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('new-id');
    });
  });

  describe('update', () => {
    it('should update an existing asset', async () => {
      mockQueryBuilder.getRawAndEntities.mockResolvedValue({
        entities: [mockAsset],
        raw: [{ price1_close: '35.80' }],
      });
      mockAssetRepository.save.mockResolvedValue({ ...mockAsset, name: 'Updated Name' });

      const result = await service.update('PETR4', { name: 'Updated Name' });

      expect(mockAssetRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('syncOptionsLiquidity', () => {
    it('should update assets with options liquidity', async () => {
      mockOpcoesScraper.scrapeLiquidity.mockResolvedValue(['PETR4', 'VALE3']);
      mockAssetRepository.find.mockResolvedValue([
        { ticker: 'PETR4', hasOptions: false },
        { ticker: 'VALE3', hasOptions: false },
        { ticker: 'ABEV3', hasOptions: true },
      ]);
      mockAssetRepository.save.mockResolvedValue([]);

      const result = await service.syncOptionsLiquidity();

      expect(result.totalUpdated).toBe(3); // 2 get options=true, 1 gets options=false
      expect(result.assetsWithOptions).toContain('PETR4');
      expect(result.assetsWithOptions).toContain('VALE3');
    });

    it('should handle scraper errors', async () => {
      mockOpcoesScraper.scrapeLiquidity.mockRejectedValue(new Error('Scraper failed'));

      await expect(service.syncOptionsLiquidity()).rejects.toThrow('Scraper failed');
    });
  });

  describe('getDataSources', () => {
    it('should return data sources for an asset', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockFundamentalDataRepository.findOne.mockResolvedValue({
        updatedAt: new Date(),
        fieldSources: {
          pl: {
            values: [
              { source: 'fundamentus', value: 10.5 },
              { source: 'investidor10', value: 10.6 },
            ],
            consensus: 95,
            hasDiscrepancy: false,
          },
          pvp: {
            values: [
              { source: 'fundamentus', value: 2.1 },
              { source: 'investidor10', value: 2.5 },
            ],
            consensus: 60,
            hasDiscrepancy: true,
          },
        },
      });

      const result = await service.getDataSources('PETR4');

      expect(result.ticker).toBe('PETR4');
      expect(result.totalFieldsTracked).toBe(2);
      expect(result.fieldsWithDiscrepancy).toBe(1);
      expect(result.fieldsWithHighConsensus).toBe(1);
    });

    it('should throw NotFoundException for unknown ticker', async () => {
      mockAssetRepository.findOne.mockResolvedValue(null);

      await expect(service.getDataSources('INVALID')).rejects.toThrow(NotFoundException);
    });

    it('should return empty data when no fundamental data exists', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockFundamentalDataRepository.findOne.mockResolvedValue(null);

      const result = await service.getDataSources('PETR4');

      expect(result.overallConfidence).toBe(0);
      expect(result.sourcesUsed).toEqual([]);
      expect(result.totalFieldsTracked).toBe(0);
    });
  });

  describe('normalizePriceTypes (private method via reflection)', () => {
    let normalizePriceTypes: (prices: AssetPrice[]) => AssetPrice[];

    beforeEach(() => {
      normalizePriceTypes = (service as any).normalizePriceTypes.bind(service);
    });

    it('should convert string values to numbers', () => {
      const prices = [
        {
          open: '35.5' as any,
          high: '36.0' as any,
          low: '35.0' as any,
          close: '35.8' as any,
          volume: '1000000' as any,
          adjustedClose: '35.8' as any,
          change: '0.5' as any,
          changePercent: '1.42' as any,
          marketCap: '100000000' as any,
        } as AssetPrice,
      ];

      const result = normalizePriceTypes(prices);

      expect(typeof result[0].open).toBe('number');
      expect(typeof result[0].close).toBe('number');
      expect(typeof result[0].volume).toBe('number');
      expect(result[0].open).toBe(35.5);
      expect(result[0].volume).toBe(1000000);
    });

    it('should keep number values unchanged', () => {
      const prices = [
        {
          open: 35.5,
          high: 36.0,
          low: 35.0,
          close: 35.8,
          volume: 1000000,
        } as AssetPrice,
      ];

      const result = normalizePriceTypes(prices);

      expect(result[0].open).toBe(35.5);
      expect(result[0].volume).toBe(1000000);
    });
  });

  describe('mapScraperDataToEntity (private method via reflection)', () => {
    let mapScraperDataToEntity: (scrapedData: any) => Partial<FundamentalData>;

    beforeEach(() => {
      mapScraperDataToEntity = (service as any).mapScraperDataToEntity.bind(service);
    });

    it('should map scraper data to entity fields', () => {
      const scrapedData = {
        pl: 10.5,
        pvp: 2.1,
        roe: 15.5,
        dividendYield: 6.5,
        receitaLiquida: 100000000,
      };

      const result = mapScraperDataToEntity(scrapedData);

      expect(result.pl).toBe(10.5);
      expect(result.pvp).toBe(2.1);
      expect(result.roe).toBe(15.5);
      expect(result.dividendYield).toBe(6.5);
      expect(result.receitaLiquida).toBe(100000000);
    });

    it('should handle alternative field names', () => {
      const scrapedData = {
        pe: 10.5, // Alternative for pl
        pb: 2.1, // Alternative for pvp
        returnOnEquity: 15.5, // Alternative for roe
        dy: 6.5, // Alternative for dividendYield
      };

      const result = mapScraperDataToEntity(scrapedData);

      expect(result.pl).toBe(10.5);
      expect(result.pvp).toBe(2.1);
      expect(result.roe).toBe(15.5);
      expect(result.dividendYield).toBe(6.5);
    });

    it('should return null for missing fields', () => {
      const scrapedData = {};

      const result = mapScraperDataToEntity(scrapedData);

      expect(result.pl).toBeNull();
      expect(result.pvp).toBeNull();
      expect(result.roe).toBeNull();
    });

    it('should include metadata', () => {
      const scrapedData = {
        sources: ['fundamentus', 'investidor10'],
        confidence: 0.95,
        discrepancies: [],
      };

      const result = mapScraperDataToEntity(scrapedData);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.originalData).toBeDefined();
      expect(result.metadata.sources).toEqual(['fundamentus', 'investidor10']);
      expect(result.metadata.confidence).toBe(0.95);
    });
  });
});
