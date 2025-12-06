import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { EconomicIndicatorsService } from './economic-indicators.service';
import { EconomicIndicator } from '../../database/entities/economic-indicator.entity';
import { CacheService } from '../../common/services/cache.service';
import { BrapiService } from '../../integrations/brapi/brapi.service';

describe('EconomicIndicatorsService', () => {
  let service: EconomicIndicatorsService;

  const mockIndicators: Partial<EconomicIndicator>[] = [
    {
      id: '1',
      indicatorType: 'SELIC',
      value: 11.25,
      referenceDate: new Date('2025-01-01'),
      source: 'BRAPI',
      metadata: { unit: '% a.a.' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      indicatorType: 'SELIC',
      value: 11.0,
      referenceDate: new Date('2024-12-01'),
      source: 'BRAPI',
      metadata: { unit: '% a.a.' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      indicatorType: 'IPCA',
      value: 0.52,
      referenceDate: new Date('2025-01-01'),
      source: 'BRAPI',
      metadata: { unit: '% a.m.' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockIndicatorRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockBrapiService = {
    getSelic: jest.fn(),
    getInflation: jest.fn(),
    getIPCAAccumulated12m: jest.fn(),
    getCDI: jest.fn(),
    getIPCA15: jest.fn(),
    getIDPIngressos: jest.fn(),
    getIDESaidas: jest.fn(),
    getIDPLiquido: jest.fn(),
    getOuroMonetario: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockIndicatorRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EconomicIndicatorsService,
        {
          provide: getRepositoryToken(EconomicIndicator),
          useValue: mockIndicatorRepository,
        },
        { provide: CacheService, useValue: mockCacheService },
        { provide: BrapiService, useValue: mockBrapiService },
      ],
    }).compile();

    service = module.get<EconomicIndicatorsService>(EconomicIndicatorsService);
  });

  describe('getAll', () => {
    it('should return cached data if available', async () => {
      const cachedResponse = {
        indicators: [],
        total: 0,
        updatedAt: new Date(),
      };
      mockCacheService.get.mockResolvedValue(cachedResponse);

      const result = await service.getAll({});

      expect(result).toEqual(cachedResponse);
      expect(mockIndicatorRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should fetch from database if cache is empty', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockIndicators, 3]);

      const result = await service.getAll({});

      expect(result.indicators).toBeDefined();
      expect(result.total).toBe(3);
      expect(mockIndicatorRepository.createQueryBuilder).toHaveBeenCalled();
    });

    it('should filter by type when not ALL', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([
        mockIndicators.filter((i) => i.indicatorType === 'SELIC'),
        2,
      ]);

      await service.getAll({ type: 'SELIC' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'indicator.indicatorType = :type',
        { type: 'SELIC' },
      );
    });

    it('should filter by date range', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      await service.getAll({ startDate, endDate });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'indicator.referenceDate BETWEEN :startDate AND :endDate',
        { startDate, endDate },
      );
    });

    it('should apply limit when provided', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getAll({ limit: 10 });

      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
    });

    it('should cache results for 5 minutes', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.getAll({});

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        300,
      );
    });
  });

  describe('getLatestByType', () => {
    it('should return cached data if available', async () => {
      const cachedResponse = {
        type: 'SELIC',
        currentValue: 11.25,
        referenceDate: new Date(),
        source: 'BRAPI',
        unit: '% a.a.',
      };
      mockCacheService.get.mockResolvedValue(cachedResponse);

      const result = await service.getLatestByType('SELIC');

      expect(result).toEqual(cachedResponse);
    });

    it('should fetch from database if cache is empty', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockIndicatorRepository.find.mockResolvedValue([
        mockIndicators[0],
        mockIndicators[1],
      ]);

      const result = await service.getLatestByType('SELIC');

      expect(result.type).toBe('SELIC');
      expect(result.currentValue).toBe(11.25);
      expect(result.previousValue).toBe(11.0);
    });

    it('should calculate change between current and previous', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockIndicatorRepository.find.mockResolvedValue([
        mockIndicators[0],
        mockIndicators[1],
      ]);

      const result = await service.getLatestByType('SELIC');

      expect(result.change).toBeCloseTo(0.25, 2);
    });

    it('should throw NotFoundException when no data exists', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockIndicatorRepository.find.mockResolvedValue([]);

      await expect(service.getLatestByType('NONEXISTENT')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should cache results for 1 minute', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockIndicatorRepository.find.mockResolvedValue([mockIndicators[0]]);

      await service.getLatestByType('SELIC');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('indicators:latest:SELIC'),
        expect.any(Object),
        60,
      );
    });
  });

  describe('getLatestWithAccumulated', () => {
    it('should return latest with accumulated 12 months', async () => {
      mockCacheService.get.mockResolvedValue(null);
      // First call for getLatestByType
      mockIndicatorRepository.find
        .mockResolvedValueOnce([mockIndicators[0], mockIndicators[1]])
        // Second call for historical data
        .mockResolvedValueOnce(
          Array(12).fill({ value: 0.9, indicatorType: 'SELIC' }),
        );

      const result = await service.getLatestWithAccumulated('SELIC');

      expect(result).toHaveProperty('accumulated12Months');
      expect(result).toHaveProperty('monthsCount');
    });

    it('should use official BC IPCA accumulated for IPCA type', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockIndicatorRepository.find.mockResolvedValue([mockIndicators[2]]);
      mockIndicatorRepository.findOne.mockResolvedValue({
        value: 4.83,
        indicatorType: 'IPCA_ACUM_12M',
      });

      const result = await service.getLatestWithAccumulated('IPCA');

      expect(result.accumulated12Months).toBe(4.83);
      expect(result.monthsCount).toBe(12);
    });

    it('should fallback to calculation if IPCA_ACUM_12M not found', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockIndicatorRepository.find
        .mockResolvedValueOnce([mockIndicators[2]])
        .mockResolvedValueOnce(Array(10).fill({ value: 0.5, indicatorType: 'IPCA' }));
      mockIndicatorRepository.findOne.mockResolvedValue(null);

      const result = await service.getLatestWithAccumulated('IPCA');

      expect(result.accumulated12Months).toBeCloseTo(5.0, 2);
      expect(result.monthsCount).toBe(10);
    });

    it('should cache results for 1 minute', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockIndicatorRepository.find.mockResolvedValue([mockIndicators[0]]);

      await service.getLatestWithAccumulated('SELIC');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.stringContaining('indicators:accumulated:SELIC'),
        expect.any(Object),
        60,
      );
    });
  });

  describe('syncFromBrapi', () => {
    const mockApiData = [
      { value: 11.25, date: new Date('2025-01-01') },
      { value: 11.0, date: new Date('2024-12-01') },
    ];

    beforeEach(() => {
      mockBrapiService.getSelic.mockResolvedValue(mockApiData);
      mockBrapiService.getInflation.mockResolvedValue(mockApiData);
      mockBrapiService.getIPCAAccumulated12m.mockResolvedValue(mockApiData);
      mockBrapiService.getCDI.mockResolvedValue(mockApiData);
      mockBrapiService.getIPCA15.mockResolvedValue(mockApiData);
      mockBrapiService.getIDPIngressos.mockResolvedValue(mockApiData);
      mockBrapiService.getIDESaidas.mockResolvedValue(mockApiData);
      mockBrapiService.getIDPLiquido.mockResolvedValue(mockApiData);
      mockBrapiService.getOuroMonetario.mockResolvedValue(mockApiData);
      mockIndicatorRepository.findOne.mockResolvedValue(null);
      mockIndicatorRepository.save.mockResolvedValue({});
    });

    it('should sync SELIC indicators from BRAPI', async () => {
      await service.syncFromBrapi();

      expect(mockBrapiService.getSelic).toHaveBeenCalledWith(13);
    });

    it('should sync IPCA indicators from BRAPI', async () => {
      await service.syncFromBrapi();

      expect(mockBrapiService.getInflation).toHaveBeenCalledWith(13);
    });

    it('should sync IPCA accumulated 12m from BRAPI', async () => {
      await service.syncFromBrapi();

      expect(mockBrapiService.getIPCAAccumulated12m).toHaveBeenCalledWith(13);
    });

    it('should sync CDI indicators from BRAPI', async () => {
      await service.syncFromBrapi();

      expect(mockBrapiService.getCDI).toHaveBeenCalledWith(13);
    });

    it('should sync all 9 indicators', async () => {
      await service.syncFromBrapi();

      expect(mockBrapiService.getSelic).toHaveBeenCalled();
      expect(mockBrapiService.getInflation).toHaveBeenCalled();
      expect(mockBrapiService.getIPCAAccumulated12m).toHaveBeenCalled();
      expect(mockBrapiService.getCDI).toHaveBeenCalled();
      expect(mockBrapiService.getIPCA15).toHaveBeenCalled();
      expect(mockBrapiService.getIDPIngressos).toHaveBeenCalled();
      expect(mockBrapiService.getIDESaidas).toHaveBeenCalled();
      expect(mockBrapiService.getIDPLiquido).toHaveBeenCalled();
      expect(mockBrapiService.getOuroMonetario).toHaveBeenCalled();
    });

    it('should insert new indicators', async () => {
      mockIndicatorRepository.findOne.mockResolvedValue(null);

      await service.syncFromBrapi();

      expect(mockIndicatorRepository.save).toHaveBeenCalled();
    });

    it('should update existing indicators', async () => {
      mockIndicatorRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      await service.syncFromBrapi();

      expect(mockIndicatorRepository.update).toHaveBeenCalled();
    });

    it('should clear cache after sync', async () => {
      await service.syncFromBrapi();

      expect(mockCacheService.del).toHaveBeenCalledWith('indicators:*');
    });

    it('should continue sync if one indicator type fails', async () => {
      mockBrapiService.getSelic.mockRejectedValue(new Error('API error'));

      await service.syncFromBrapi();

      // Other indicators should still be synced
      expect(mockBrapiService.getInflation).toHaveBeenCalled();
      expect(mockBrapiService.getCDI).toHaveBeenCalled();
    });
  });
});
