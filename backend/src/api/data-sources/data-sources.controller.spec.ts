import { Test, TestingModule } from '@nestjs/testing';
import { DataSourcesController } from './data-sources.controller';
import { DataSourcesService } from './data-sources.service';
import { DataSourceStatus, DataSourceType } from '@database/entities';
import { UpdateDataSourceDto } from './dto/update-data-source.dto';
import { TriggerScrapeDto, ScrapeType } from './dto/trigger-scrape.dto';

describe('DataSourcesController', () => {
  let controller: DataSourcesController;
  let service: DataSourcesService;

  const mockDataSource = {
    id: '1',
    name: 'Test Source',
    code: 'test_source',
    url: 'https://example.com',
    type: DataSourceType.FUNDAMENTAL,
    status: DataSourceStatus.ACTIVE,
    description: 'Test description',
    requiresLogin: false,
    isVerified: true,
    isTrusted: true,
    reliabilityScore: 0.9,
    lastSuccessAt: new Date('2025-01-01'),
    errorCount: 0,
    successCount: 10,
    averageResponseTime: 200,
  };

  const mockDataSourcesService = {
    findAll: jest.fn(),
    getStatus: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    testConnection: jest.fn(),
    triggerScrape: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DataSourcesController],
      providers: [
        {
          provide: DataSourcesService,
          useValue: mockDataSourcesService,
        },
      ],
    }).compile();

    controller = module.get<DataSourcesController>(DataSourcesController);
    service = module.get<DataSourcesService>(DataSourcesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllDataSources', () => {
    it('should return all data sources', async () => {
      const dataSources = [mockDataSource];
      mockDataSourcesService.findAll.mockResolvedValue(dataSources);

      const result = await controller.getAllDataSources();

      expect(result).toEqual(dataSources);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('getDataSourcesStatus', () => {
    it('should return status of all data sources', async () => {
      const statusData = [
        {
          name: mockDataSource.name,
          code: mockDataSource.code,
          status: mockDataSource.status,
          reliabilityScore: mockDataSource.reliabilityScore,
          lastSuccessAt: mockDataSource.lastSuccessAt,
          errorCount: mockDataSource.errorCount,
        },
      ];
      mockDataSourcesService.getStatus.mockResolvedValue(statusData);

      const result = await controller.getDataSourcesStatus();

      expect(result).toEqual(statusData);
      expect(service.getStatus).toHaveBeenCalled();
    });
  });

  describe('getDataSourceById', () => {
    it('should return a data source by id', async () => {
      mockDataSourcesService.findOne.mockResolvedValue(mockDataSource);

      const result = await controller.getDataSourceById('1');

      expect(result).toEqual(mockDataSource);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('updateDataSource', () => {
    it('should update a data source', async () => {
      const updateDto: UpdateDataSourceDto = {
        status: DataSourceStatus.MAINTENANCE,
        description: 'Updated description',
      };
      const updatedSource = { ...mockDataSource, ...updateDto };
      mockDataSourcesService.update.mockResolvedValue(updatedSource);

      const result = await controller.updateDataSource('1', updateDto);

      expect(result.status).toBe(DataSourceStatus.MAINTENANCE);
      expect(result.description).toBe('Updated description');
      expect(service.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should update reliability score', async () => {
      const updateDto: UpdateDataSourceDto = {
        reliabilityScore: 0.95,
      };
      const updatedSource = { ...mockDataSource, reliabilityScore: 0.95 };
      mockDataSourcesService.update.mockResolvedValue(updatedSource);

      const result = await controller.updateDataSource('1', updateDto);

      expect(result.reliabilityScore).toBe(0.95);
      expect(service.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should update verification flags', async () => {
      const updateDto: UpdateDataSourceDto = {
        isVerified: true,
        isTrusted: true,
      };
      const updatedSource = { ...mockDataSource, ...updateDto };
      mockDataSourcesService.update.mockResolvedValue(updatedSource);

      const result = await controller.updateDataSource('1', updateDto);

      expect(result.isVerified).toBe(true);
      expect(result.isTrusted).toBe(true);
      expect(service.update).toHaveBeenCalledWith('1', updateDto);
    });
  });

  describe('testDataSource', () => {
    it('should test connection to a data source', async () => {
      const testResult = {
        success: true,
        dataSource: {
          id: '1',
          name: 'Test Source',
          code: 'test_source',
          url: 'https://example.com',
          status: DataSourceStatus.ACTIVE,
        },
        test: {
          responseTime: 250,
          statusCode: 200,
          error: null,
          timestamp: new Date(),
        },
        statistics: {
          successCount: 11,
          errorCount: 0,
          lastSuccessAt: new Date(),
          lastErrorAt: null,
          averageResponseTime: 225,
        },
      };
      mockDataSourcesService.testConnection.mockResolvedValue(testResult);

      const result = await controller.testDataSource('1');

      expect(result.success).toBe(true);
      expect(result.test.statusCode).toBe(200);
      expect(result.statistics.successCount).toBe(11);
      expect(service.testConnection).toHaveBeenCalledWith('1');
    });

    it('should handle failed connection test', async () => {
      const testResult = {
        success: false,
        dataSource: {
          id: '1',
          name: 'Test Source',
          code: 'test_source',
          url: 'https://example.com',
          status: DataSourceStatus.ACTIVE,
        },
        test: {
          responseTime: 10000,
          statusCode: null,
          error: 'Connection timeout',
          timestamp: new Date(),
        },
        statistics: {
          successCount: 10,
          errorCount: 1,
          lastSuccessAt: new Date(),
          lastErrorAt: new Date(),
          averageResponseTime: 200,
        },
      };
      mockDataSourcesService.testConnection.mockResolvedValue(testResult);

      const result = await controller.testDataSource('1');

      expect(result.success).toBe(false);
      expect(result.test.error).toBe('Connection timeout');
      expect(result.statistics.errorCount).toBe(1);
    });
  });

  describe('triggerScrape', () => {
    it('should trigger scraping for a ticker', async () => {
      const dto: TriggerScrapeDto = {
        ticker: 'PETR4',
        type: ScrapeType.FUNDAMENTAL,
      };
      const scrapeResult = {
        message: 'Scraping job created for PETR4',
        jobId: 'job-123',
        ticker: 'PETR4',
        type: 'fundamental',
        status: 'queued',
      };
      mockDataSourcesService.triggerScrape.mockResolvedValue(scrapeResult);

      const result = await controller.triggerScrape(dto);

      expect(result.jobId).toBe('job-123');
      expect(result.ticker).toBe('PETR4');
      expect(service.triggerScrape).toHaveBeenCalledWith('PETR4', ScrapeType.FUNDAMENTAL);
    });

    it('should handle technical scraping', async () => {
      const dto: TriggerScrapeDto = {
        ticker: 'VALE3',
        type: ScrapeType.TECHNICAL,
      };
      const scrapeResult = {
        message: 'Scraping job created for VALE3',
        jobId: 'job-456',
        ticker: 'VALE3',
        type: 'technical',
        status: 'queued',
      };
      mockDataSourcesService.triggerScrape.mockResolvedValue(scrapeResult);

      const result = await controller.triggerScrape(dto);

      expect(result.type).toBe('technical');
      expect(result.ticker).toBe('VALE3');
    });

    it('should handle options scraping', async () => {
      const dto: TriggerScrapeDto = {
        ticker: 'ITUB4',
        type: ScrapeType.OPTIONS,
      };
      const scrapeResult = {
        message: 'Scraping job created for ITUB4',
        jobId: 'job-789',
        ticker: 'ITUB4',
        type: 'options',
        status: 'queued',
      };
      mockDataSourcesService.triggerScrape.mockResolvedValue(scrapeResult);

      const result = await controller.triggerScrape(dto);

      expect(result.type).toBe('options');
      expect(result.ticker).toBe('ITUB4');
    });
  });
});
