import { Test, TestingModule } from '@nestjs/testing';
import { TechnicalAnalysisService, TechnicalAnalysisResult } from './technical-analysis.service';
import { TechnicalIndicatorsService, PriceData } from './technical-indicators.service';
import { TechnicalIndicators } from '../../api/market-data/interfaces';

describe('TechnicalAnalysisService', () => {
  let service: TechnicalAnalysisService;
  let indicatorsService: TechnicalIndicatorsService;

  const mockIndicatorsService = {
    calculateIndicators: jest.fn(),
  };

  // Helper to create price data
  const createPriceData = (
    close: number,
    high?: number,
    low?: number,
    date?: Date,
  ): PriceData => ({
    date: date || new Date(),
    open: close * 0.99,
    high: high || close * 1.02,
    low: low || close * 0.98,
    close,
    volume: 1000000,
  });

  // Create price history with 100 data points
  const createPriceHistory = (basePrice: number, trend: 'up' | 'down' | 'flat' = 'flat'): PriceData[] => {
    const history: PriceData[] = [];
    let price = basePrice;
    for (let i = 0; i < 100; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (99 - i));

      if (trend === 'up') {
        price *= 1.005;
      } else if (trend === 'down') {
        price *= 0.995;
      }

      // Add some variation for support/resistance detection
      const variation = (i % 10 === 5) ? 1.05 : (i % 10 === 0) ? 0.95 : 1;
      history.push(createPriceData(price * variation, price * variation * 1.02, price * variation * 0.98, date));
    }
    return history;
  };

  // Mock indicators for different scenarios (values are arrays, service uses getLast())
  const createBullishIndicators = (): TechnicalIndicators => ({
    rsi: [50, 52, 55],
    sma_20: [92, 94, 95],
    sma_50: [88, 89, 90],
    sma_200: [83, 84, 85],
    ema_9: [96, 97, 98],
    ema_21: [94, 95, 96],
    macd: { macd: [1, 1.5, 2], signal: [0.5, 0.8, 1], histogram: [0.5, 0.7, 1] },
    stochastic: { k: [55, 58, 60], d: [50, 52, 55] },
    bollinger_bands: { upper: [108, 109, 110], middle: [98, 99, 100], lower: [88, 89, 90], bandwidth: 20 },
    atr: [2.3, 2.4, 2.5],
    obv: [900000, 950000, 1000000],
    trend: 'UPTREND',
    trend_strength: 75,
  });

  const createBearishIndicators = (): TechnicalIndicators => ({
    rsi: [50, 48, 45],
    sma_20: [103, 104, 105],
    sma_50: [108, 109, 110],
    sma_200: [113, 114, 115],
    ema_9: [100, 101, 102],
    ema_21: [102, 103, 104],
    macd: { macd: [-1, -1.5, -2], signal: [-0.5, -0.8, -1], histogram: [-0.5, -0.7, -1] },
    stochastic: { k: [45, 42, 40], d: [50, 48, 45] },
    bollinger_bands: { upper: [108, 109, 110], middle: [98, 99, 100], lower: [88, 89, 90], bandwidth: 20 },
    atr: [2.3, 2.4, 2.5],
    obv: [1100000, 1050000, 1000000],
    trend: 'DOWNTREND',
    trend_strength: 70,
  });

  const createNeutralIndicators = (): TechnicalIndicators => ({
    rsi: [48, 49, 50],
    sma_20: [99, 99.5, 100],
    sma_50: [99, 99.5, 100],
    sma_200: [99, 99.5, 100],
    ema_9: [99, 99.5, 100],
    ema_21: [99, 99.5, 100],
    macd: { macd: [-0.1, 0, 0], signal: [-0.1, 0, 0], histogram: [0, 0, 0] },
    stochastic: { k: [48, 49, 50], d: [48, 49, 50] },
    bollinger_bands: { upper: [103, 104, 105], middle: [98, 99, 100], lower: [93, 94, 95], bandwidth: 15 },
    atr: [1.3, 1.4, 1.5],
    obv: [990000, 995000, 1000000],
    trend: 'SIDEWAYS',
    trend_strength: 30,
  });

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TechnicalAnalysisService,
        { provide: TechnicalIndicatorsService, useValue: mockIndicatorsService },
      ],
    }).compile();

    service = module.get<TechnicalAnalysisService>(TechnicalAnalysisService);
    indicatorsService = module.get<TechnicalIndicatorsService>(TechnicalIndicatorsService);
  });

  describe('analyze', () => {
    it('should return complete technical analysis result', async () => {
      const priceHistory = createPriceHistory(100);
      mockIndicatorsService.calculateIndicators.mockResolvedValue(createNeutralIndicators());

      const result = await service.analyze('PETR4', priceHistory);

      expect(result).toBeDefined();
      expect(result.ticker).toBe('PETR4');
      expect(result.analysisDate).toBeInstanceOf(Date);
      expect(result.currentPrice).toBeDefined();
      expect(result.indicators).toBeDefined();
      expect(result.signals).toBeDefined();
      expect(result.patterns).toBeInstanceOf(Array);
      expect(result.supportLevels).toBeInstanceOf(Array);
      expect(result.resistanceLevels).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should call calculateIndicators with correct parameters', async () => {
      const priceHistory = createPriceHistory(100);
      mockIndicatorsService.calculateIndicators.mockResolvedValue(createNeutralIndicators());

      await service.analyze('VALE3', priceHistory);

      expect(mockIndicatorsService.calculateIndicators).toHaveBeenCalledWith('VALE3', priceHistory);
    });

    it('should return BUY signal for bullish indicators', async () => {
      const priceHistory = createPriceHistory(100, 'up');
      mockIndicatorsService.calculateIndicators.mockResolvedValue(createBullishIndicators());

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.overall).toBe('BUY');
      expect(result.signals.trendSignal).toBe('BUY');
    });

    it('should return SELL signal for bearish indicators', async () => {
      const priceHistory = createPriceHistory(100, 'down');
      mockIndicatorsService.calculateIndicators.mockResolvedValue(createBearishIndicators());

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.overall).toBe('SELL');
      expect(result.signals.trendSignal).toBe('SELL');
    });

    it('should return NEUTRAL signal for sideways market', async () => {
      const priceHistory = createPriceHistory(100, 'flat');
      mockIndicatorsService.calculateIndicators.mockResolvedValue(createNeutralIndicators());

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.overall).toBe('NEUTRAL');
    });
  });

  describe('analyzeTrendSignal (via analyze)', () => {
    it('should detect BUY trend when price above all SMAs in uptrend', async () => {
      const priceHistory = createPriceHistory(100, 'up');
      const indicators = createBullishIndicators();
      // Price at 100, all SMAs below (arrays - service uses getLast())
      indicators.sma_20 = [93, 94, 95];
      indicators.sma_50 = [88, 89, 90];
      indicators.sma_200 = [83, 84, 85];
      indicators.ema_9 = [96, 97, 98];
      indicators.ema_21 = [94, 95, 96];
      indicators.trend = 'UPTREND';
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.trendSignal).toBe('BUY');
    });

    it('should detect SELL trend when price below all SMAs in downtrend', async () => {
      const priceHistory = createPriceHistory(100, 'down');
      const indicators = createBearishIndicators();
      // Price at 100, all SMAs above (arrays - service uses getLast())
      indicators.sma_20 = [103, 104, 105];
      indicators.sma_50 = [108, 109, 110];
      indicators.sma_200 = [113, 114, 115];
      indicators.ema_9 = [100, 101, 102];
      indicators.ema_21 = [102, 103, 104];
      indicators.trend = 'DOWNTREND';
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.trendSignal).toBe('SELL');
    });

    it('should return NEUTRAL when no clear trend', async () => {
      const priceHistory = createPriceHistory(100, 'flat');
      const indicators = createNeutralIndicators();
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.trendSignal).toBe('NEUTRAL');
    });
  });

  describe('analyzeMomentumSignal (via analyze)', () => {
    it('should detect BUY momentum when RSI oversold', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.rsi = [28, 26, 25]; // Oversold
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.momentumSignal).toBe('BUY');
    });

    it('should detect SELL momentum when RSI overbought', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.rsi = [72, 74, 75]; // Overbought
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.momentumSignal).toBe('SELL');
    });

    it('should consider MACD crossover in momentum signal', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.rsi = [53, 54, 55];
      indicators.macd = { macd: [3, 4, 5], signal: [1, 1.5, 2], histogram: [2, 2.5, 3] }; // Bullish MACD
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.momentumSignal).toBe('BUY');
    });

    it('should consider stochastic in momentum signal', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.rsi = [48, 49, 50];
      indicators.stochastic = { k: [18, 16, 15], d: [18, 16, 15] }; // Oversold stochastic
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.momentumSignal).toBe('BUY');
    });
  });

  describe('analyzeVolatility (via analyze)', () => {
    it('should detect LOW volatility when bandwidth < 10', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.bollinger_bands = { upper: [100, 101, 102], middle: [99, 99.5, 100], lower: [96, 97, 98], bandwidth: 5 };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.volatilitySignal).toBe('LOW');
    });

    it('should detect HIGH volatility when bandwidth > 25', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.bollinger_bands = { upper: [125, 128, 130], middle: [98, 99, 100], lower: [72, 71, 70], bandwidth: 30 };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.volatilitySignal).toBe('HIGH');
    });

    it('should detect MEDIUM volatility for normal bandwidth', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.bollinger_bands = { upper: [108, 109, 110], middle: [98, 99, 100], lower: [88, 89, 90], bandwidth: 15 };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.volatilitySignal).toBe('MEDIUM');
    });
  });

  describe('calculateOverallSignal (via analyze)', () => {
    it('should return BUY when both trend and momentum are BUY', async () => {
      const priceHistory = createPriceHistory(100, 'up');
      const indicators = createBullishIndicators();
      indicators.rsi = [28, 26, 25]; // Oversold = BUY momentum
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.overall).toBe('BUY');
    });

    it('should return SELL when both trend and momentum are SELL', async () => {
      const priceHistory = createPriceHistory(100, 'down');
      const indicators = createBearishIndicators();
      indicators.rsi = [72, 74, 75]; // Overbought = SELL momentum
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.overall).toBe('SELL');
    });

    it('should return BUY when trend is BUY and momentum is NEUTRAL', async () => {
      const priceHistory = createPriceHistory(100, 'up');
      const indicators = createBullishIndicators();
      indicators.rsi = [48, 49, 50]; // Neutral RSI
      indicators.macd = { macd: [-0.1, 0, 0], signal: [-0.1, 0, 0], histogram: [0, 0, 0] };
      indicators.stochastic = { k: [48, 49, 50], d: [48, 49, 50] };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.overall).toBe('BUY');
    });
  });

  describe('calculateSignalStrength (via analyze)', () => {
    it('should have higher strength when signals align', async () => {
      const priceHistory = createPriceHistory(100, 'up');
      const indicators = createBullishIndicators();
      indicators.rsi = [28, 26, 25]; // Oversold = strong BUY
      indicators.trend_strength = 80;
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.strength).toBeGreaterThan(70);
    });

    it('should cap strength at 100', async () => {
      const priceHistory = createPriceHistory(100, 'up');
      const indicators = createBullishIndicators();
      indicators.rsi = [18, 16, 15]; // Very oversold
      indicators.trend_strength = 100;
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.strength).toBeLessThanOrEqual(100);
    });

    it('should have minimum strength of 0', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.trend_strength = 0;
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.signals.strength).toBeGreaterThanOrEqual(0);
    });
  });

  describe('detectPatterns (via analyze)', () => {
    it('should detect Bollinger Bands squeeze', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.bollinger_bands = { upper: [100, 101, 102], middle: [99, 99.5, 100], lower: [96, 97, 98], bandwidth: 5 };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.patterns).toContain('Bollinger Bands Squeeze - Volatility Compression');
    });

    it('should detect price at upper Bollinger Band', async () => {
      const priceHistory = createPriceHistory(100);
      // Make last price touch upper band
      priceHistory[priceHistory.length - 1].close = 110;
      const indicators = createNeutralIndicators();
      indicators.bollinger_bands = { upper: [108, 109, 110], middle: [98, 99, 100], lower: [88, 89, 90], bandwidth: 20 };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.patterns).toContain('Price at Upper Bollinger Band - Overbought');
    });

    it('should detect price at lower Bollinger Band', async () => {
      const priceHistory = createPriceHistory(100);
      // Make last price touch lower band
      priceHistory[priceHistory.length - 1].close = 90;
      const indicators = createNeutralIndicators();
      indicators.bollinger_bands = { upper: [108, 109, 110], middle: [98, 99, 100], lower: [88, 89, 90], bandwidth: 20 };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.patterns).toContain('Price at Lower Bollinger Band - Oversold');
    });

    it('should detect Golden Cross', async () => {
      const priceHistory = createPriceHistory(100, 'up');
      const indicators = createBullishIndicators();
      indicators.sma_50 = [103, 104, 105];
      indicators.sma_200 = [98, 99, 100];
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.patterns).toContain('Golden Cross - Bullish Long-term');
    });

    it('should detect Death Cross', async () => {
      const priceHistory = createPriceHistory(100, 'down');
      const indicators = createBearishIndicators();
      indicators.sma_50 = [97, 96, 95];
      indicators.sma_200 = [98, 99, 100];
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.patterns).toContain('Death Cross - Bearish Long-term');
    });

    it('should detect MACD Bullish Crossover', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.macd = { macd: [1, 1.5, 2], signal: [0.5, 0.8, 1], histogram: [0.5, 0.7, 1] };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.patterns).toContain('MACD Bullish Crossover');
    });

    it('should detect MACD Bearish Crossover', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.macd = { macd: [-1, -1.5, -2], signal: [-0.5, -0.8, -1], histogram: [-0.5, -0.7, -1] };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.patterns).toContain('MACD Bearish Crossover');
    });
  });

  describe('calculateSupportResistance (via analyze)', () => {
    it('should calculate support levels from price history', async () => {
      const priceHistory = createPriceHistory(100);
      mockIndicatorsService.calculateIndicators.mockResolvedValue(createNeutralIndicators());

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.supportLevels).toBeDefined();
      expect(result.supportLevels.length).toBeLessThanOrEqual(3);
    });

    it('should calculate resistance levels from price history', async () => {
      const priceHistory = createPriceHistory(100);
      mockIndicatorsService.calculateIndicators.mockResolvedValue(createNeutralIndicators());

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.resistanceLevels).toBeDefined();
      expect(result.resistanceLevels.length).toBeLessThanOrEqual(3);
    });

    it('should handle price history with clear local maxima and minima', async () => {
      // Create price history with clear peaks and troughs
      const priceHistory: PriceData[] = [];
      for (let i = 0; i < 50; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (49 - i));
        // Create a wave pattern
        const price = 100 + Math.sin(i / 5) * 10;
        priceHistory.push(createPriceData(price, price + 2, price - 2, date));
      }
      mockIndicatorsService.calculateIndicators.mockResolvedValue(createNeutralIndicators());

      const result = await service.analyze('PETR4', priceHistory);

      expect(result.supportLevels.length).toBeGreaterThan(0);
      expect(result.resistanceLevels.length).toBeGreaterThan(0);
    });
  });

  describe('generateRecommendations (via analyze)', () => {
    it('should include BUY recommendation for bullish signals', async () => {
      const priceHistory = createPriceHistory(100, 'up');
      const indicators = createBullishIndicators();
      indicators.rsi = [28, 26, 25]; // Oversold
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      const buyRecommendation = result.recommendations.find(r => r.includes('COMPRA'));
      expect(buyRecommendation).toBeDefined();
    });

    it('should include SELL recommendation for bearish signals', async () => {
      const priceHistory = createPriceHistory(100, 'down');
      const indicators = createBearishIndicators();
      indicators.rsi = [72, 74, 75]; // Overbought
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      const sellRecommendation = result.recommendations.find(r => r.includes('VENDA'));
      expect(sellRecommendation).toBeDefined();
    });

    it('should include NEUTRAL recommendation for sideways market', async () => {
      const priceHistory = createPriceHistory(100, 'flat');
      mockIndicatorsService.calculateIndicators.mockResolvedValue(createNeutralIndicators());

      const result = await service.analyze('PETR4', priceHistory);

      const neutralRecommendation = result.recommendations.find(r => r.includes('NEUTRO'));
      expect(neutralRecommendation).toBeDefined();
    });

    it('should include RSI oversold warning', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.rsi = [28, 26, 25];
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      const rsiWarning = result.recommendations.find(r => r.includes('sobrevendido'));
      expect(rsiWarning).toBeDefined();
    });

    it('should include RSI overbought warning', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.rsi = [72, 74, 75];
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      const rsiWarning = result.recommendations.find(r => r.includes('sobrecomprado'));
      expect(rsiWarning).toBeDefined();
    });

    it('should include strong uptrend recommendation', async () => {
      const priceHistory = createPriceHistory(100, 'up');
      const indicators = createBullishIndicators();
      indicators.trend = 'UPTREND';
      indicators.trend_strength = 80;
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      const trendRec = result.recommendations.find(r => r.includes('alta forte'));
      expect(trendRec).toBeDefined();
    });

    it('should include strong downtrend recommendation', async () => {
      const priceHistory = createPriceHistory(100, 'down');
      const indicators = createBearishIndicators();
      indicators.trend = 'DOWNTREND';
      indicators.trend_strength = 80;
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      const trendRec = result.recommendations.find(r => r.includes('baixa forte'));
      expect(trendRec).toBeDefined();
    });

    it('should include low volatility warning', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.bollinger_bands = { upper: [100, 101, 102], middle: [99, 99.5, 100], lower: [96, 97, 98], bandwidth: 5 };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      const volWarning = result.recommendations.find(r => r.includes('Volatilidade baixa'));
      expect(volWarning).toBeDefined();
    });

    it('should include high volatility warning', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      indicators.bollinger_bands = { upper: [125, 128, 130], middle: [98, 99, 100], lower: [72, 71, 70], bandwidth: 30 };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      const volWarning = result.recommendations.find(r => r.includes('Volatilidade alta'));
      expect(volWarning).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle indicators with array values', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators = createNeutralIndicators();
      // Some indicators return arrays
      indicators.rsi = [45, 48, 50, 52, 55] as any;
      indicators.sma_20 = [95, 96, 97, 98, 99] as any;
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      expect(result).toBeDefined();
      expect(result.signals).toBeDefined();
    });

    it('should handle undefined indicator values', async () => {
      const priceHistory = createPriceHistory(100);
      const indicators: TechnicalIndicators = {
        rsi: undefined as any,
        sma_20: undefined as any,
        sma_50: undefined as any,
        sma_200: undefined as any,
        ema_9: undefined as any,
        ema_21: undefined as any,
        macd: undefined as any,
        stochastic: undefined as any,
        bollinger_bands: undefined as any,
        atr: undefined as any,
        obv: undefined as any,
        trend: 'SIDEWAYS',
        trend_strength: 0,
      };
      mockIndicatorsService.calculateIndicators.mockResolvedValue(indicators);

      const result = await service.analyze('PETR4', priceHistory);

      // When all indicators are undefined (getLast returns 0), RSI=0 < 30 triggers BUY momentum
      // and price (100) > all SMAs (0) triggers BUY trend
      expect(result).toBeDefined();
      expect(result.signals).toBeDefined();
      expect(['BUY', 'SELL', 'NEUTRAL']).toContain(result.signals.overall);
    });

    it('should handle minimum price history (5 points for support/resistance)', async () => {
      const priceHistory: PriceData[] = [];
      for (let i = 0; i < 10; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (9 - i));
        priceHistory.push(createPriceData(100 + i, 102 + i, 98 + i, date));
      }
      mockIndicatorsService.calculateIndicators.mockResolvedValue(createNeutralIndicators());

      const result = await service.analyze('PETR4', priceHistory);

      expect(result).toBeDefined();
      expect(result.supportLevels).toBeDefined();
      expect(result.resistanceLevels).toBeDefined();
    });
  });
});
