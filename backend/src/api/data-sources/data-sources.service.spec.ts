import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { DataSourcesService } from './data-sources.service';
import { DataSource, DataSourceStatus, DataSourceType } from '@database/entities';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DataSourcesService', () => {
  let service: DataSourcesService;
  let repository: Repository<DataSource>;
  let queue: Queue;

  const mockDataSource: DataSource = {
    id: '1',
    name: 'Test Source',
    code: 'test_source',
    url: 'https://example.com',
    type: DataSourceType.FUNDAMENTAL,
    status: DataSourceStatus.ACTIVE,
    description: 'Test description',
    requiresLogin: false,
    loginType: null,
    isVerified: true,
    isTrusted: true,
    reliabilityScore: 0.9,
    lastSuccessAt: new Date('2025-01-01'),
    lastErrorAt: null,
    errorCount: 0,
    successCount: 10,
    averageResponseTime: 200,
    config: {},
    metadata: {},
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataSourcesService,
        {
          provide: getRepositoryToken(DataSource),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getQueueToken('scraping'),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DataSourcesService>(DataSourcesService);
    repository = module.get<Repository<DataSource>>(
      getRepositoryToken(DataSource),
    );
    queue = module.get<Queue>(getQueueToken('scraping'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all data sources ordered by name', async () => {
      const dataSources = [mockDataSource];
      jest.spyOn(repository, 'find').mockResolvedValue(dataSources);

      const result = await service.findAll();

      expect(result).toEqual(dataSources);
      expect(repository.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
    });
  });

  describe('getStatus', () => {
    it('should return status information for all data sources', async () => {
      const dataSources = [mockDataSource];
      jest.spyOn(repository, 'find').mockResolvedValue(dataSources);

      const result = await service.getStatus();

      expect(result).toEqual([
        {
          name: mockDataSource.name,
          code: mockDataSource.code,
          status: mockDataSource.status,
          reliabilityScore: mockDataSource.reliabilityScore,
          lastSuccessAt: mockDataSource.lastSuccessAt,
          errorCount: mockDataSource.errorCount,
        },
      ]);
    });
  });

  describe('findOne', () => {
    it('should return a data source by id', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDataSource);

      const result = await service.findOne('1');

      expect(result).toEqual(mockDataSource);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw error if data source not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(
        'Data source with id 999 not found',
      );
    });
  });

  describe('update', () => {
    it('should update a data source', async () => {
      const updateData = { status: DataSourceStatus.MAINTENANCE };
      const updatedSource = { ...mockDataSource, ...updateData };

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDataSource);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedSource);

      const result = await service.update('1', updateData);

      expect(result.status).toBe(DataSourceStatus.MAINTENANCE);
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('triggerScrape', () => {
    it('should add a scraping job to the queue', async () => {
      const mockJob = { id: 'job-123' };
      jest.spyOn(queue, 'add').mockResolvedValue(mockJob as any);

      const result = await service.triggerScrape('PETR4', 'fundamental');

      expect(result).toEqual({
        message: 'Scraping job created for PETR4',
        jobId: 'job-123',
        ticker: 'PETR4',
        type: 'fundamental',
        status: 'queued',
      });
      expect(queue.add).toHaveBeenCalledWith('fundamental', {
        ticker: 'PETR4',
        type: 'fundamental',
      });
    });

    it('should convert ticker to uppercase', async () => {
      const mockJob = { id: 'job-123' };
      jest.spyOn(queue, 'add').mockResolvedValue(mockJob as any);

      await service.triggerScrape('petr4', 'fundamental');

      expect(queue.add).toHaveBeenCalledWith('fundamental', {
        ticker: 'PETR4',
        type: 'fundamental',
      });
    });
  });

  describe('testConnection', () => {
    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(1000);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully test connection and update statistics', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDataSource);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockDataSource,
        lastSuccessAt: new Date(),
        successCount: 11,
      });

      mockedAxios.get.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: {},
        headers: {},
        config: {} as any,
      });

      const result = await service.testConnection('1');

      expect(result.success).toBe(true);
      expect(result.dataSource.id).toBe('1');
      expect(result.test.statusCode).toBe(200);
      expect(result.test.error).toBeNull();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle connection failure and update error count', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDataSource);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockDataSource,
        lastErrorAt: new Date(),
        errorCount: 1,
      });

      mockedAxios.get.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'Timeout',
      });

      const result = await service.testConnection('1');

      expect(result.success).toBe(false);
      expect(result.test.error).toBe('Connection timeout');
      expect(repository.save).toHaveBeenCalled();
    });

    it('should handle DNS resolution failure', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDataSource);
      jest.spyOn(repository, 'save').mockResolvedValue({
        ...mockDataSource,
        lastErrorAt: new Date(),
        errorCount: 1,
      });

      mockedAxios.get.mockRejectedValue({
        code: 'ENOTFOUND',
        message: 'DNS lookup failed',
      });

      const result = await service.testConnection('1');

      expect(result.success).toBe(false);
      expect(result.test.error).toBe('DNS resolution failed');
    });

    it('should update average response time', async () => {
      const startTime = 1000;
      const endTime = 1500;
      const responseTime = endTime - startTime; // 500ms
      const expectedAverage = Math.round((mockDataSource.averageResponseTime + responseTime) / 2);
      // Expected: (200 + 500) / 2 = 350

      jest.spyOn(Date, 'now').mockReturnValueOnce(startTime).mockReturnValueOnce(endTime);

      jest.spyOn(repository, 'findOne').mockResolvedValue(mockDataSource);
      let savedSource: any;
      jest.spyOn(repository, 'save').mockImplementation((source: any) => {
        savedSource = source;
        return Promise.resolve(source);
      });

      mockedAxios.get.mockResolvedValue({
        status: 200,
        statusText: 'OK',
        data: {},
        headers: {},
        config: {} as any,
      });

      await service.testConnection('1');

      expect(savedSource.averageResponseTime).toBe(expectedAverage);
    });
  });
});
