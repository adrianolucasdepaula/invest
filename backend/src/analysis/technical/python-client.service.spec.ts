import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { PythonClientService } from './python-client.service';
import { PriceData } from './technical-indicators.service';

jest.mock('axios', () => ({
  create: jest.fn().mockReturnValue({
    post: jest.fn(),
    get: jest.fn(),
  }),
  isAxiosError: jest.fn(),
}));

describe('PythonClientService', () => {
  let service: PythonClientService;
  let mockAxiosInstance: any;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'PYTHON_SERVICE_URL') return 'http://test-python:8001';
      return null;
    }),
  };

  // Generate test price data
  const generatePriceData = (count: number): PriceData[] => {
    return Array(count)
      .fill(null)
      .map((_, i) => ({
        date: new Date(Date.now() - (count - i) * 86400000),
        open: 100 + i * 0.1,
        high: 101 + i * 0.1,
        low: 99 + i * 0.1,
        close: 100.5 + i * 0.1,
        volume: 1000000,
      }));
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
    };

    (axios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PythonClientService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PythonClientService>(PythonClientService);
  });

  describe('constructor', () => {
    it('should create axios instance with correct configuration', () => {
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://test-python:8001',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use default URL when not configured', async () => {
      const defaultConfigService = {
        get: jest.fn(() => null),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PythonClientService,
          { provide: ConfigService, useValue: defaultConfigService },
        ],
      }).compile();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'http://python-service:8001',
        }),
      );
    });
  });

  describe('calculateIndicators', () => {
    const mockIndicatorsResponse = {
      data: {
        indicators: {
          sma_20: [100],
          sma_50: [99],
          sma_200: [98],
          ema_9: [101],
          ema_21: [100.5],
          rsi: [55],
          macd: { macd: [1.5], signal: [1.2], histogram: [0.3] },
          stochastic: { k: [65], d: [62] },
          bollinger_bands: {
            upper: [105],
            middle: [100],
            lower: [95],
            bandwidth: 10,
          },
          atr: [2.5],
          obv: [5000000],
          volume_sma: [1000000],
          pivot: {
            pivot: 100,
            r1: 102,
            r2: 104,
            r3: 106,
            s1: 98,
            s2: 96,
            s3: 94,
          },
          trend: 'UPTREND',
          trend_strength: 65,
        },
      },
    };

    it('should call Python service with correct payload', async () => {
      mockAxiosInstance.post.mockResolvedValue(mockIndicatorsResponse);

      const prices = generatePriceData(5);
      await service.calculateIndicators('PETR4', prices);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/indicators',
        expect.objectContaining({
          ticker: 'PETR4',
          prices: expect.arrayContaining([
            expect.objectContaining({
              date: expect.any(String),
              open: expect.any(Number),
              high: expect.any(Number),
              low: expect.any(Number),
              close: expect.any(Number),
              volume: expect.any(Number),
            }),
          ]),
        }),
      );
    });

    it('should transform Date to ISO string', async () => {
      mockAxiosInstance.post.mockResolvedValue(mockIndicatorsResponse);

      const prices = [
        {
          date: new Date('2025-01-15'),
          open: 100,
          high: 101,
          low: 99,
          close: 100.5,
          volume: 1000000,
        },
      ];

      await service.calculateIndicators('PETR4', prices);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/indicators',
        expect.objectContaining({
          prices: expect.arrayContaining([
            expect.objectContaining({
              date: '2025-01-15',
            }),
          ]),
        }),
      );
    });

    it('should return transformed indicators', async () => {
      mockAxiosInstance.post.mockResolvedValue(mockIndicatorsResponse);

      const prices = generatePriceData(5);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result).toEqual({
        sma_20: [100],
        sma_50: [99],
        sma_200: [98],
        ema_9: [101],
        ema_21: [100.5],
        rsi: [55],
        macd: { macd: [1.5], signal: [1.2], histogram: [0.3] },
        stochastic: { k: [65], d: [62] },
        bollinger_bands: {
          upper: [105],
          middle: [100],
          lower: [95],
          bandwidth: 10,
        },
        atr: [2.5],
        obv: [5000000],
        volume_sma: [1000000],
        pivot: {
          pivot: 100,
          r1: 102,
          r2: 104,
          r3: 106,
          s1: 98,
          s2: 96,
          s3: 94,
        },
        trend: 'UPTREND',
        trend_strength: 65,
      });
    });

    it('should throw HttpException on axios error with 400 status', async () => {
      const axiosError = {
        response: {
          status: 400,
          data: { detail: 'Invalid input' },
        },
        message: 'Bad Request',
      };

      mockAxiosInstance.post.mockRejectedValue(axiosError);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

      const prices = generatePriceData(5);

      await expect(service.calculateIndicators('PETR4', prices)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException on axios error with 500 status', async () => {
      const axiosError = {
        response: {
          status: 500,
          data: { detail: 'Server error' },
        },
        message: 'Internal Server Error',
      };

      mockAxiosInstance.post.mockRejectedValue(axiosError);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

      const prices = generatePriceData(5);

      await expect(service.calculateIndicators('PETR4', prices)).rejects.toThrow(HttpException);
    });

    it('should throw HttpException on network error', async () => {
      const networkError = new Error('Network timeout');

      mockAxiosInstance.post.mockRejectedValue(networkError);
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);

      const prices = generatePriceData(5);

      await expect(service.calculateIndicators('PETR4', prices)).rejects.toThrow(HttpException);
    });

    it('should handle string dates in price data', async () => {
      mockAxiosInstance.post.mockResolvedValue(mockIndicatorsResponse);

      const prices = [
        {
          date: '2025-01-15',
          open: 100,
          high: 101,
          low: 99,
          close: 100.5,
          volume: 1000000,
        },
      ];

      await service.calculateIndicators('PETR4', prices as any);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/indicators',
        expect.objectContaining({
          prices: expect.arrayContaining([
            expect.objectContaining({
              date: '2025-01-15',
            }),
          ]),
        }),
      );
    });
  });

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { status: 'healthy' } });

      const result = await service.healthCheck();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health', { timeout: 5000 });
    });

    it('should return false when service is not healthy', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { status: 'unhealthy' } });

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection refused'));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('ping', () => {
    it('should return true when service responds', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: 'pong' });

      const result = await service.ping();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/ping', { timeout: 3000 });
    });

    it('should return false on error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Timeout'));

      const result = await service.ping();

      expect(result).toBe(false);
    });
  });
});
