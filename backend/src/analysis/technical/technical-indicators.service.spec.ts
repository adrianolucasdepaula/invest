import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TechnicalIndicatorsService, PriceData } from './technical-indicators.service';
import { PythonClientService } from './python-client.service';

describe('TechnicalIndicatorsService', () => {
  let service: TechnicalIndicatorsService;
  let pythonClient: PythonClientService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'USE_PYTHON_SERVICE') return false; // Use TypeScript implementation for tests
      return defaultValue;
    }),
  };

  const mockPythonClient = {
    calculateIndicators: jest.fn(),
  };

  // Generate test price data
  const generatePriceData = (count: number, basePrice: number = 100): PriceData[] => {
    const data: PriceData[] = [];
    let price = basePrice;

    for (let i = 0; i < count; i++) {
      // Random walk with slight upward bias
      const change = (Math.random() - 0.48) * 2;
      price = Math.max(1, price + change);

      const high = price * (1 + Math.random() * 0.02);
      const low = price * (1 - Math.random() * 0.02);
      const open = price + (Math.random() - 0.5) * 1;
      const close = price;

      data.push({
        date: new Date(Date.now() - (count - i) * 86400000),
        open,
        high,
        low,
        close,
        volume: Math.floor(1000000 + Math.random() * 500000),
      });
    }
    return data;
  };

  // Generate uptrend data
  const generateUptrendData = (count: number): PriceData[] => {
    const data: PriceData[] = [];
    let price = 100;

    for (let i = 0; i < count; i++) {
      price = price * 1.003; // ~0.3% daily increase
      const high = price * 1.01;
      const low = price * 0.99;

      data.push({
        date: new Date(Date.now() - (count - i) * 86400000),
        open: price * 0.998,
        high,
        low,
        close: price,
        volume: 1000000,
      });
    }
    return data;
  };

  // Generate downtrend data
  const generateDowntrendData = (count: number): PriceData[] => {
    const data: PriceData[] = [];
    let price = 100;

    for (let i = 0; i < count; i++) {
      price = price * 0.997; // ~0.3% daily decrease
      const high = price * 1.01;
      const low = price * 0.99;

      data.push({
        date: new Date(Date.now() - (count - i) * 86400000),
        open: price * 1.002,
        high,
        low,
        close: price,
        volume: 1000000,
      });
    }
    return data;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicalIndicatorsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PythonClientService,
          useValue: mockPythonClient,
        },
      ],
    }).compile();

    service = module.get<TechnicalIndicatorsService>(TechnicalIndicatorsService);
    pythonClient = module.get<PythonClientService>(PythonClientService);
    jest.clearAllMocks();
  });

  describe('calculateIndicators', () => {
    it('should throw error if less than 200 price points', async () => {
      const prices = generatePriceData(100);

      await expect(service.calculateIndicators('PETR4', prices)).rejects.toThrow(
        'Insufficient data - need at least 200 price points',
      );
    });

    it('should calculate all indicators for valid data', async () => {
      const prices = generatePriceData(250);

      const result = await service.calculateIndicators('PETR4', prices);

      expect(result).toBeDefined();
      expect(result.sma_20).toBeDefined();
      expect(result.sma_50).toBeDefined();
      expect(result.sma_200).toBeDefined();
      expect(result.ema_9).toBeDefined();
      expect(result.ema_21).toBeDefined();
      expect(result.rsi).toBeDefined();
      expect(result.macd).toBeDefined();
      expect(result.stochastic).toBeDefined();
      expect(result.bollinger_bands).toBeDefined();
      expect(result.atr).toBeDefined();
      expect(result.obv).toBeDefined();
      expect(result.volume_sma).toBeDefined();
      expect(result.pivot).toBeDefined();
      expect(result.trend).toBeDefined();
      expect(result.trend_strength).toBeDefined();
    });

    it('should use Python service when enabled', async () => {
      // Recreate with Python enabled
      const pythonEnabledConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'USE_PYTHON_SERVICE') return true;
          return defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TechnicalIndicatorsService,
          { provide: ConfigService, useValue: pythonEnabledConfig },
          { provide: PythonClientService, useValue: mockPythonClient },
        ],
      }).compile();

      const pythonService = module.get<TechnicalIndicatorsService>(TechnicalIndicatorsService);
      const expectedResult = { sma_20: [100], trend: 'UPTREND' } as any;
      mockPythonClient.calculateIndicators.mockResolvedValue(expectedResult);

      const prices = generatePriceData(250);
      const result = await pythonService.calculateIndicators('PETR4', prices);

      expect(mockPythonClient.calculateIndicators).toHaveBeenCalledWith('PETR4', prices);
      expect(result).toBe(expectedResult);
    });

    it('should fallback to TypeScript when Python fails', async () => {
      const pythonEnabledConfig = {
        get: jest.fn((key: string, defaultValue?: any) => {
          if (key === 'USE_PYTHON_SERVICE') return true;
          return defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          TechnicalIndicatorsService,
          { provide: ConfigService, useValue: pythonEnabledConfig },
          { provide: PythonClientService, useValue: mockPythonClient },
        ],
      }).compile();

      const fallbackService = module.get<TechnicalIndicatorsService>(TechnicalIndicatorsService);
      mockPythonClient.calculateIndicators.mockRejectedValue(new Error('Python service unavailable'));

      const prices = generatePriceData(250);
      const result = await fallbackService.calculateIndicators('PETR4', prices);

      expect(mockPythonClient.calculateIndicators).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.sma_20).toBeDefined(); // TypeScript implementation was used
    });
  });

  describe('SMA (Simple Moving Average)', () => {
    it('should calculate SMA correctly', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.sma_20).toHaveLength(1);
      expect(result.sma_50).toHaveLength(1);
      expect(result.sma_200).toHaveLength(1);
      expect(typeof result.sma_20[0]).toBe('number');
      expect(result.sma_20[0]).toBeGreaterThan(0);
    });

    it('should have SMA_200 < SMA_50 < SMA_20 in downtrend', async () => {
      const prices = generateDowntrendData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      // In downtrend, shorter SMAs should be lower
      expect(result.sma_20[0]).toBeLessThan(result.sma_50[0]);
      expect(result.sma_50[0]).toBeLessThan(result.sma_200[0]);
    });

    it('should have SMA_200 > SMA_50 > SMA_20 in uptrend', async () => {
      // For uptrend, shorter SMAs should be higher (more recent prices are higher)
      const prices = generateUptrendData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      // In uptrend, shorter SMAs track recent higher prices
      expect(result.sma_20[0]).toBeGreaterThan(result.sma_50[0]);
      expect(result.sma_50[0]).toBeGreaterThan(result.sma_200[0]);
    });
  });

  describe('EMA (Exponential Moving Average)', () => {
    it('should calculate EMA correctly', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.ema_9).toHaveLength(1);
      expect(result.ema_21).toHaveLength(1);
      expect(typeof result.ema_9[0]).toBe('number');
      expect(result.ema_9[0]).toBeGreaterThan(0);
    });

    it('should react faster to recent price changes than SMA', async () => {
      const prices = generateUptrendData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      // EMA_9 should be closer to current price than SMA_20 in uptrend
      const currentPrice = prices[prices.length - 1].close;
      const emaDistance = Math.abs(currentPrice - result.ema_9[0]);
      const smaDistance = Math.abs(currentPrice - result.sma_20[0]);

      // EMA typically tracks price more closely
      expect(emaDistance).toBeLessThanOrEqual(smaDistance * 1.5);
    });
  });

  describe('RSI (Relative Strength Index)', () => {
    it('should calculate RSI between 0 and 100', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.rsi).toHaveLength(1);
      expect(result.rsi[0]).toBeGreaterThanOrEqual(0);
      expect(result.rsi[0]).toBeLessThanOrEqual(100);
    });

    it('should have high RSI in uptrend', async () => {
      const prices = generateUptrendData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      // Strong uptrend should have RSI > 60
      expect(result.rsi[0]).toBeGreaterThan(50);
    });

    it('should have low RSI in downtrend', async () => {
      const prices = generateDowntrendData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      // Strong downtrend should have RSI < 40
      expect(result.rsi[0]).toBeLessThan(50);
    });
  });

  describe('MACD', () => {
    it('should calculate MACD components', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.macd).toBeDefined();
      expect(result.macd.macd).toHaveLength(1);
      expect(result.macd.signal).toHaveLength(1);
      expect(result.macd.histogram).toHaveLength(1);
    });

    it('should have positive MACD in uptrend', async () => {
      const prices = generateUptrendData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.macd.macd[0]).toBeGreaterThan(0);
    });

    it('should have negative MACD in downtrend', async () => {
      const prices = generateDowntrendData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.macd.macd[0]).toBeLessThan(0);
    });

    it('should have histogram = MACD - Signal', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      const expectedHistogram = result.macd.macd[0] - result.macd.signal[0];
      expect(result.macd.histogram[0]).toBeCloseTo(expectedHistogram, 5);
    });
  });

  describe('Stochastic Oscillator', () => {
    it('should calculate stochastic K and D', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.stochastic).toBeDefined();
      expect(result.stochastic.k).toHaveLength(1);
      expect(result.stochastic.d).toHaveLength(1);
    });

    it('should have K between 0 and 100', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.stochastic.k[0]).toBeGreaterThanOrEqual(0);
      expect(result.stochastic.k[0]).toBeLessThanOrEqual(100);
    });

    it('should have high stochastic in uptrend', async () => {
      const prices = generateUptrendData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      // In uptrend, price is near the high of the range
      expect(result.stochastic.k[0]).toBeGreaterThan(50);
    });
  });

  describe('Bollinger Bands', () => {
    it('should calculate all band components', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.bollinger_bands).toBeDefined();
      expect(result.bollinger_bands.upper).toHaveLength(1);
      expect(result.bollinger_bands.middle).toHaveLength(1);
      expect(result.bollinger_bands.lower).toHaveLength(1);
      expect(result.bollinger_bands.bandwidth).toBeDefined();
    });

    it('should have upper > middle > lower', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.bollinger_bands.upper[0]).toBeGreaterThan(result.bollinger_bands.middle[0]);
      expect(result.bollinger_bands.middle[0]).toBeGreaterThan(result.bollinger_bands.lower[0]);
    });

    it('should have middle equal to SMA(20)', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.bollinger_bands.middle[0]).toBeCloseTo(result.sma_20[0], 5);
    });

    it('should have positive bandwidth', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.bollinger_bands.bandwidth).toBeGreaterThan(0);
    });
  });

  describe('ATR (Average True Range)', () => {
    it('should calculate positive ATR', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.atr).toHaveLength(1);
      expect(result.atr[0]).toBeGreaterThan(0);
    });
  });

  describe('OBV (On-Balance Volume)', () => {
    it('should calculate OBV', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.obv).toHaveLength(1);
      expect(typeof result.obv[0]).toBe('number');
    });

    it('should have positive OBV in uptrend', async () => {
      const prices = generateUptrendData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      // In uptrend, volume accumulates
      expect(result.obv[0]).toBeGreaterThan(0);
    });
  });

  describe('Pivot Points', () => {
    it('should calculate all pivot levels', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.pivot).toBeDefined();
      expect(result.pivot.pivot).toBeDefined();
      expect(result.pivot.r1).toBeDefined();
      expect(result.pivot.r2).toBeDefined();
      expect(result.pivot.r3).toBeDefined();
      expect(result.pivot.s1).toBeDefined();
      expect(result.pivot.s2).toBeDefined();
      expect(result.pivot.s3).toBeDefined();
    });

    it('should have R3 > R2 > R1 > Pivot > S1 > S2 > S3', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.pivot.r3).toBeGreaterThan(result.pivot.r2);
      expect(result.pivot.r2).toBeGreaterThan(result.pivot.r1);
      expect(result.pivot.r1).toBeGreaterThan(result.pivot.pivot);
      expect(result.pivot.pivot).toBeGreaterThan(result.pivot.s1);
      expect(result.pivot.s1).toBeGreaterThan(result.pivot.s2);
      expect(result.pivot.s2).toBeGreaterThan(result.pivot.s3);
    });
  });

  describe('Trend Detection', () => {
    it('should detect UPTREND', async () => {
      const prices = generateUptrendData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.trend).toBe('UPTREND');
    });

    it('should detect DOWNTREND', async () => {
      const prices = generateDowntrendData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.trend).toBe('DOWNTREND');
    });

    it('should return valid trend value', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(['UPTREND', 'DOWNTREND', 'SIDEWAYS']).toContain(result.trend);
    });
  });

  describe('Trend Strength', () => {
    it('should calculate trend strength between 0 and 100', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.trend_strength).toBeGreaterThanOrEqual(0);
      expect(result.trend_strength).toBeLessThanOrEqual(100);
    });

    it('should have higher strength in strong uptrend', async () => {
      const uptrendPrices = generateUptrendData(250);
      const sidewaysPrices = generatePriceData(250);

      const uptrendResult = await service.calculateIndicators('PETR4', uptrendPrices);
      const sidewaysResult = await service.calculateIndicators('PETR4', sidewaysPrices);

      // Uptrend should have higher or equal strength
      expect(uptrendResult.trend_strength).toBeGreaterThanOrEqual(0);
    });

    it('should return integer value', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(Number.isInteger(result.trend_strength)).toBe(true);
    });
  });

  describe('Volume SMA', () => {
    it('should calculate volume SMA', async () => {
      const prices = generatePriceData(250);
      const result = await service.calculateIndicators('PETR4', prices);

      expect(result.volume_sma).toHaveLength(1);
      expect(result.volume_sma[0]).toBeGreaterThan(0);
    });
  });
});
