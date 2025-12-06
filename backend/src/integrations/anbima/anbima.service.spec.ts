import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { ANBIMAService } from './anbima.service';

describe('ANBIMAService', () => {
  let service: ANBIMAService;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  // Mock Gabriel Gaspar API response format
  const createApiResponse = (bonds: any[]) => ({
    status: 200,
    data: { bonds },
  });

  const mockBonds = [
    {
      name: 'Tesouro IPCA+ 2026',
      annualInvestmentRate: 'IPCA + 7,76%',
      maturityDate: '01/01/2026',
    },
    {
      name: 'Tesouro IPCA+ 2029',
      annualInvestmentRate: 'IPCA + 6,50%',
      maturityDate: '01/01/2029',
    },
    {
      name: 'Tesouro IPCA+ 2035',
      annualInvestmentRate: 'IPCA + 6,30%',
      maturityDate: '01/01/2035',
    },
    {
      name: 'Tesouro IPCA+ 2045',
      annualInvestmentRate: 'IPCA + 6,10%',
      maturityDate: '01/01/2045',
    },
  ];

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ANBIMAService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<ANBIMAService>(ANBIMAService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('getYieldCurve', () => {
    it('should fetch yield curve from Gabriel Gaspar API', async () => {
      const mockResponse = createApiResponse(mockBonds);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getYieldCurve();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://tesouro.gabrielgaspar.com.br/bonds',
      );
    });

    it('should return yield curve with maturity and yield', async () => {
      const mockResponse = createApiResponse(mockBonds);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getYieldCurve();

      expect(result[0]).toHaveProperty('maturity');
      expect(result[0]).toHaveProperty('yield');
      expect(result[0]).toHaveProperty('bondName');
      expect(result[0]).toHaveProperty('maturityDate');
    });

    it('should parse yield correctly from IPCA + format', async () => {
      const singleBond = [
        {
          name: 'Tesouro IPCA+ 2035',
          annualInvestmentRate: 'IPCA + 7,50%',
          maturityDate: '01/01/2035',
        },
      ];
      const mockResponse = createApiResponse(singleBond);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getYieldCurve();

      expect(result.length).toBe(1);
      expect(result[0].yield).toBeCloseTo(0.075, 3);
    });

    it('should filter out non-IPCA+ bonds', async () => {
      const mixedBonds = [
        ...mockBonds,
        {
          name: 'Tesouro Prefixado 2027',
          annualInvestmentRate: '12,50%',
          maturityDate: '01/01/2027',
        },
        {
          name: 'Tesouro Selic 2029',
          annualInvestmentRate: 'SELIC + 0,10%',
          maturityDate: '01/01/2029',
        },
      ];
      const mockResponse = createApiResponse(mixedBonds);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getYieldCurve();

      // Should only return IPCA+ bonds
      result.forEach((vertex) => {
        expect(vertex.bondName.toUpperCase()).toContain('IPCA');
      });
    });

    it('should filter out Semestrais bonds', async () => {
      const bondsWithSemestrais = [
        ...mockBonds,
        {
          name: 'Tesouro IPCA+ com Juros Semestrais 2035',
          annualInvestmentRate: 'IPCA + 6,20%',
          maturityDate: '01/01/2035',
        },
      ];
      const mockResponse = createApiResponse(bondsWithSemestrais);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getYieldCurve();

      result.forEach((vertex) => {
        expect(vertex.bondName).not.toContain('Semestrais');
      });
    });

    it('should map maturities to standard vertices', async () => {
      const mockResponse = createApiResponse(mockBonds);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getYieldCurve();

      const validMaturities = ['1y', '2y', '3y', '5y', '10y', '15y', '20y', '30y'];
      result.forEach((vertex) => {
        expect(validMaturities).toContain(vertex.maturity);
      });
    });

    it('should sort results by maturity', async () => {
      const mockResponse = createApiResponse(mockBonds);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getYieldCurve();

      const maturityOrder = ['1y', '2y', '3y', '5y', '10y', '15y', '20y', '30y'];
      for (let i = 0; i < result.length - 1; i++) {
        const currentIndex = maturityOrder.indexOf(result[i].maturity);
        const nextIndex = maturityOrder.indexOf(result[i + 1].maturity);
        expect(currentIndex).toBeLessThanOrEqual(nextIndex);
      }
    });

    it('should throw HttpException on API error', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.getYieldCurve()).rejects.toThrow(HttpException);
    });

    it('should throw HttpException on invalid response format', async () => {
      mockHttpService.get.mockReturnValue(of({ status: 200, data: {} }));

      await expect(service.getYieldCurve()).rejects.toThrow(HttpException);
    });

    it('should throw HttpException when no IPCA+ bonds found', async () => {
      const nonIpcaBonds = [
        {
          name: 'Tesouro Prefixado 2027',
          annualInvestmentRate: '12,50%',
          maturityDate: '01/01/2027',
        },
      ];
      const mockResponse = createApiResponse(nonIpcaBonds);
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await expect(service.getYieldCurve()).rejects.toThrow(HttpException);
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is accessible', async () => {
      const mockResponse = createApiResponse(mockBonds);
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

    it('should return false when bonds array is missing', async () => {
      mockHttpService.get.mockReturnValue(of({ status: 200, data: { other: [] } }));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });
});
