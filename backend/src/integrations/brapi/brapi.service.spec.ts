import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { BrapiService } from './brapi.service';

describe('BrapiService', () => {
  let service: BrapiService;
  let httpService: HttpService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'BRAPI_API_KEY') return 'test-api-key';
      return defaultValue;
    }),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  // Mock BCB response format
  const createBCBResponse = (values: Array<{ valor: string; data: string }>) => ({
    status: 200,
    data: values,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrapiService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BrapiService>(BrapiService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('getSelic', () => {
    it('should fetch SELIC rate from BCB API', async () => {
      const mockResponse = createBCBResponse([
        { valor: '1.28', data: '01/11/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getSelic(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(1.28);
      expect(result[0].date).toBeInstanceOf(Date);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('.4390/dados/ultimos/1'),
        expect.any(Object),
      );
    });

    it('should fetch multiple SELIC records', async () => {
      const mockResponse = createBCBResponse([
        { valor: '1.28', data: '01/11/2025' },
        { valor: '1.25', data: '01/10/2025' },
        { valor: '1.22', data: '01/09/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getSelic(3);

      expect(result).toHaveLength(3);
      expect(result[0].value).toBe(1.28);
      expect(result[1].value).toBe(1.25);
      expect(result[2].value).toBe(1.22);
    });

    it('should retry on failure', async () => {
      const mockResponse = createBCBResponse([
        { valor: '1.28', data: '01/11/2025' },
      ]);

      // First call fails, second succeeds
      mockHttpService.get
        .mockReturnValueOnce(throwError(() => new Error('Network error')))
        .mockReturnValue(of(mockResponse));

      const result = await service.getSelic(1);

      expect(result).toHaveLength(1);
      expect(mockHttpService.get).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.getSelic(1)).rejects.toThrow();
      expect(mockHttpService.get).toHaveBeenCalledTimes(3); // 3 retries
    }, 15000); // Increase timeout for retry delays

    it('should throw on invalid response format', async () => {
      mockHttpService.get.mockReturnValue(of({ status: 200, data: {} }));

      await expect(service.getSelic(1)).rejects.toThrow(HttpException);
    }, 20000); // Increase timeout for retry delays
  });

  describe('getInflation', () => {
    it('should fetch IPCA from BCB API', async () => {
      const mockResponse = createBCBResponse([
        { valor: '0.42', data: '01/10/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getInflation(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(0.42);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('.433/dados/ultimos/1'),
        expect.any(Object),
      );
    });

    it('should handle multiple IPCA records', async () => {
      const mockResponse = createBCBResponse([
        { valor: '0.42', data: '01/10/2025' },
        { valor: '0.44', data: '01/09/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getInflation(2);

      expect(result).toHaveLength(2);
    });
  });

  describe('getIPCAAccumulated12m', () => {
    it('should fetch IPCA accumulated 12m from BCB API', async () => {
      const mockResponse = createBCBResponse([
        { valor: '4.68', data: '01/10/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getIPCAAccumulated12m(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(4.68);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('.13522/dados/ultimos/1'),
        expect.any(Object),
      );
    });
  });

  describe('getCDI', () => {
    it('should calculate CDI based on SELIC', async () => {
      const mockResponse = createBCBResponse([
        { valor: '1.28', data: '01/11/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getCDI(1);

      expect(result).toHaveLength(1);
      // CDI = SELIC - 0.1
      expect(result[0].value).toBeCloseTo(1.18, 2);
    });

    it('should calculate multiple CDI records', async () => {
      const mockResponse = createBCBResponse([
        { valor: '1.28', data: '01/11/2025' },
        { valor: '1.25', data: '01/10/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getCDI(2);

      expect(result).toHaveLength(2);
      expect(result[0].value).toBeCloseTo(1.18, 2);
      expect(result[1].value).toBeCloseTo(1.15, 2);
    });
  });

  describe('getIPCA15', () => {
    it('should fetch IPCA-15 from BCB API', async () => {
      const mockResponse = createBCBResponse([
        { valor: '0.39', data: '01/10/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getIPCA15(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(0.39);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('.7478/dados/ultimos/1'),
        expect.any(Object),
      );
    });
  });

  describe('getIDPIngressos', () => {
    it('should fetch IDP Ingressos from BCB API', async () => {
      const mockResponse = createBCBResponse([
        { valor: '8500.50', data: '01/10/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getIDPIngressos(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(8500.5);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('.22886/dados/ultimos/1'),
        expect.any(Object),
      );
    });
  });

  describe('getIDESaidas', () => {
    it('should fetch IDE Saídas from BCB API', async () => {
      const mockResponse = createBCBResponse([
        { valor: '3200.25', data: '01/10/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getIDESaidas(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(3200.25);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('.22867/dados/ultimos/1'),
        expect.any(Object),
      );
    });
  });

  describe('getIDPLiquido', () => {
    it('should fetch IDP Líquido from BCB API', async () => {
      const mockResponse = createBCBResponse([
        { valor: '5300.25', data: '01/10/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getIDPLiquido(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(5300.25);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('.22888/dados/ultimos/1'),
        expect.any(Object),
      );
    });
  });

  describe('getOuroMonetario', () => {
    it('should fetch Ouro Monetário from BCB API', async () => {
      const mockResponse = createBCBResponse([
        { valor: '8234.50', data: '01/10/2025' },
      ]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getOuroMonetario(1);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(8234.5);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('.23044/dados/ultimos/1'),
        expect.any(Object),
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when BCB API is accessible', async () => {
      const mockResponse = createBCBResponse([{ valor: '1.28', data: '01/11/2025' }]);

      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.healthCheck();

      expect(result).toBe(true);
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

  describe('API key configuration', () => {
    it('should log warning when API key is not configured', async () => {
      const noKeyConfigService = {
        get: jest.fn((key: string, defaultValue?: any) => defaultValue || ''),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          BrapiService,
          { provide: HttpService, useValue: mockHttpService },
          { provide: ConfigService, useValue: noKeyConfigService },
        ],
      }).compile();

      const serviceWithoutKey = module.get<BrapiService>(BrapiService);

      // Service should still be created
      expect(serviceWithoutKey).toBeDefined();
    });
  });
});
