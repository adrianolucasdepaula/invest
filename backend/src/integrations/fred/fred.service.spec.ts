import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { FREDService } from './fred.service';

describe('FREDService', () => {
  let service: FREDService;
  let httpService: HttpService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'FRED_API_KEY') return 'test-api-key';
      return defaultValue;
    }),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  // Mock FRED response format
  const createFREDResponse = (observations: Array<{ date: string; value: string }>) => ({
    status: 200,
    data: { observations },
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FREDService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<FREDService>(FREDService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('getPayroll', () => {
    it('should fetch Non-Farm Payroll from FRED API', async () => {
      const mockResponse = createFREDResponse([
        { date: '2025-10-01', value: '161234.0' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getPayroll(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(161234);
      expect(result[0].date).toBeInstanceOf(Date);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('series/observations'),
        expect.objectContaining({
          params: expect.objectContaining({
            series_id: 'PAYEMS',
            api_key: 'test-api-key',
          }),
        }),
      );
    });

    it('should fetch multiple payroll records', async () => {
      const mockResponse = createFREDResponse([
        { date: '2025-10-01', value: '161234.0' },
        { date: '2025-09-01', value: '161000.0' },
        { date: '2025-08-01', value: '160800.0' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getPayroll(3);

      expect(result).toHaveLength(3);
    });
  });

  describe('getBrentOil', () => {
    it('should fetch Brent Oil price from FRED API', async () => {
      const mockResponse = createFREDResponse([
        { date: '2025-11-01', value: '78.50' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getBrentOil(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(78.5);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            series_id: 'DCOILBRENTEU',
          }),
        }),
      );
    });
  });

  describe('getFedFunds', () => {
    it('should fetch Federal Funds Rate from FRED API', async () => {
      const mockResponse = createFREDResponse([
        { date: '2025-11-01', value: '5.33' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getFedFunds(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(5.33);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            series_id: 'DFF',
          }),
        }),
      );
    });
  });

  describe('getCPIUSA', () => {
    it('should fetch CPI USA from FRED API', async () => {
      const mockResponse = createFREDResponse([
        { date: '2025-10-01', value: '314.175' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getCPIUSA(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(314.175);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            series_id: 'CPIAUCSL',
          }),
        }),
      );
    });
  });

  describe('Error handling', () => {
    it('should throw HttpException when API key is not configured', async () => {
      const noKeyConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => defaultValue || ''),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FREDService,
          { provide: HttpService, useValue: mockHttpService },
          { provide: ConfigService, useValue: noKeyConfigService },
        ],
      }).compile();

      const serviceWithoutKey = module.get<FREDService>(FREDService);

      await expect(serviceWithoutKey.getPayroll(1)).rejects.toThrow(HttpException);
    });

    it('should throw on API error', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.getPayroll(1)).rejects.toThrow();
    });

    it('should throw on invalid response format', async () => {
      mockHttpService.get.mockReturnValue(of({ status: 200, data: {} }));

      await expect(service.getPayroll(1)).rejects.toThrow(HttpException);
    });

    it('should throw on empty observations', async () => {
      const emptyResponse = createFREDResponse([]);

      mockHttpService.get.mockReturnValue(of(emptyResponse));

      await expect(service.getPayroll(1)).rejects.toThrow(HttpException);
    });

    it('should filter out missing values (.)', async () => {
      const responseWithMissing = createFREDResponse([
        { date: '2025-11-01', value: '.' },
        { date: '2025-10-01', value: '78.50' },
      ]);

      mockHttpService.get.mockReturnValue(of(responseWithMissing));

      const result = await service.getBrentOil(2);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(78.5);
    });
  });

  describe('healthCheck', () => {
    it('should return true when FRED API is accessible', async () => {
      const mockResponse = createFREDResponse([{ date: '2025-11-01', value: '78.50' }]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when API key is not configured', async () => {
      const noKeyConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => defaultValue || ''),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FREDService,
          { provide: HttpService, useValue: mockHttpService },
          { provide: ConfigService, useValue: noKeyConfigService },
        ],
      }).compile();

      const serviceWithoutKey = module.get<FREDService>(FREDService);

      const result = await serviceWithoutKey.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false on API error', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('API unavailable')),
      );

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false on invalid response', async () => {
      mockHttpService.get.mockReturnValue(of({ status: 200, data: null }));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });
});
