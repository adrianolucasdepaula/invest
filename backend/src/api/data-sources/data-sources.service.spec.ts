import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSourcesService } from './data-sources.service';
import { DataSource } from '@database/entities';

describe('DataSourcesService', () => {
  let service: DataSourcesService;

  const mockDataSources = [
    {
      id: '1',
      name: 'Fundamentus',
      code: 'FUNDAMENTUS',
      status: 'active',
      reliabilityScore: 0.95,
      lastSuccessAt: new Date('2025-01-01'),
      errorCount: 0,
    },
    {
      id: '2',
      name: 'Status Invest',
      code: 'STATUSINVEST',
      status: 'active',
      reliabilityScore: 0.92,
      lastSuccessAt: new Date('2025-01-01'),
      errorCount: 1,
    },
    {
      id: '3',
      name: 'Investidor 10',
      code: 'INVESTIDOR10',
      status: 'maintenance',
      reliabilityScore: 0.88,
      lastSuccessAt: new Date('2024-12-15'),
      errorCount: 5,
    },
  ];

  const mockDataSourceRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataSourcesService,
        {
          provide: getRepositoryToken(DataSource),
          useValue: mockDataSourceRepository,
        },
      ],
    }).compile();

    service = module.get<DataSourcesService>(DataSourcesService);
  });

  describe('findAll', () => {
    it('should return all data sources ordered by name', async () => {
      mockDataSourceRepository.find.mockResolvedValue(mockDataSources);

      const result = await service.findAll();

      expect(result).toEqual(mockDataSources);
      expect(mockDataSourceRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });

    it('should return empty array when no data sources exist', async () => {
      mockDataSourceRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('getStatus', () => {
    it('should return status of all data sources', async () => {
      mockDataSourceRepository.find.mockResolvedValue(mockDataSources);

      const result = await service.getStatus();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: 'Fundamentus',
        code: 'FUNDAMENTUS',
        status: 'active',
        reliabilityScore: 0.95,
        lastSuccessAt: mockDataSources[0].lastSuccessAt,
        errorCount: 0,
      });
    });

    it('should only include status-relevant fields', async () => {
      mockDataSourceRepository.find.mockResolvedValue(mockDataSources);

      const result = await service.getStatus();

      result.forEach((source) => {
        expect(source).toHaveProperty('name');
        expect(source).toHaveProperty('code');
        expect(source).toHaveProperty('status');
        expect(source).toHaveProperty('reliabilityScore');
        expect(source).toHaveProperty('lastSuccessAt');
        expect(source).toHaveProperty('errorCount');
        expect(source).not.toHaveProperty('id');
      });
    });

    it('should return empty array when no data sources exist', async () => {
      mockDataSourceRepository.find.mockResolvedValue([]);

      const result = await service.getStatus();

      expect(result).toEqual([]);
    });

    it('should include sources with different statuses', async () => {
      mockDataSourceRepository.find.mockResolvedValue(mockDataSources);

      const result = await service.getStatus();

      const statuses = result.map((s) => s.status);
      expect(statuses).toContain('active');
      expect(statuses).toContain('maintenance');
    });

    it('should preserve reliability scores', async () => {
      mockDataSourceRepository.find.mockResolvedValue(mockDataSources);

      const result = await service.getStatus();

      expect(result[0].reliabilityScore).toBe(0.95);
      expect(result[1].reliabilityScore).toBe(0.92);
      expect(result[2].reliabilityScore).toBe(0.88);
    });
  });
});
