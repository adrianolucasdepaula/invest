import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import {
  Analysis,
  AnalysisType,
  AnalysisStatus,
  Asset,
  AssetPrice,
  Recommendation,
} from '@database/entities';
import { ScrapersService } from '@scrapers/scrapers.service';

describe('AnalysisService', () => {
  let service: AnalysisService;
  let analysisRepository: Repository<Analysis>;
  let assetRepository: Repository<Asset>;
  let assetPriceRepository: Repository<AssetPrice>;
  let scrapersService: ScrapersService;

  const mockAsset: Partial<Asset> = {
    id: 'asset-123',
    ticker: 'PETR4',
    name: 'Petrobras PN',
    isActive: true,
  };

  const mockAnalysis: Partial<Analysis> = {
    id: 'analysis-123',
    assetId: 'asset-123',
    type: AnalysisType.FUNDAMENTAL,
    status: AnalysisStatus.COMPLETED,
    confidenceScore: 0.85,
    dataSources: ['fundamentus', 'statusinvest'],
    sourcesCount: 2,
  };

  // Generate mock price data for technical analysis
  const generatePrices = (count: number, basePrice: number = 35): Partial<AssetPrice>[] => {
    const prices: Partial<AssetPrice>[] = [];
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (count - i - 1));
      // Add some variance to make prices realistic
      const variance = Math.sin(i * 0.1) * 2 + Math.random() * 0.5;
      prices.push({
        id: `price-${i}`,
        assetId: 'asset-123',
        date,
        open: basePrice + variance - 0.5,
        high: basePrice + variance + 0.5,
        low: basePrice + variance - 1,
        close: basePrice + variance,
        volume: 1000000 + Math.random() * 500000,
      });
    }
    return prices;
  };

  const mockAnalysisRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockAssetRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAssetPriceRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockScrapersService = {
    scrapeFundamentalData: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalysisService,
        { provide: getRepositoryToken(Analysis), useValue: mockAnalysisRepository },
        { provide: getRepositoryToken(Asset), useValue: mockAssetRepository },
        { provide: getRepositoryToken(AssetPrice), useValue: mockAssetPriceRepository },
        { provide: ScrapersService, useValue: mockScrapersService },
      ],
    }).compile();

    service = module.get<AnalysisService>(AnalysisService);
    analysisRepository = module.get<Repository<Analysis>>(getRepositoryToken(Analysis));
    assetRepository = module.get<Repository<Asset>>(getRepositoryToken(Asset));
    assetPriceRepository = module.get<Repository<AssetPrice>>(getRepositoryToken(AssetPrice));
    scrapersService = module.get<ScrapersService>(ScrapersService);
  });

  describe('Technical Indicator Calculations (private methods via reflection)', () => {
    let calculateRSI: (prices: number[], period?: number) => number;
    let calculateSMA: (prices: number[], period: number) => number | null;
    let calculateEMA: (prices: number[], period: number) => number | null;
    let calculateMACD: (prices: number[]) => { line: number | null; signal: number | null; histogram: number | null };

    beforeEach(() => {
      calculateRSI = (service as any).calculateRSI.bind(service);
      calculateSMA = (service as any).calculateSMA.bind(service);
      calculateEMA = (service as any).calculateEMA.bind(service);
      calculateMACD = (service as any).calculateMACD.bind(service);
    });

    describe('calculateRSI', () => {
      it('should return 50 (neutral) for insufficient data', () => {
        const prices = [10, 11, 12, 13, 14]; // Only 5 data points
        expect(calculateRSI(prices, 14)).toBe(50);
      });

      it('should return 100 when avgLoss is 0 (all gains)', () => {
        // Monotonically increasing prices
        const prices = Array(20).fill(0).map((_, i) => 10 + i);
        expect(calculateRSI(prices, 14)).toBe(100);
      });

      it('should return RSI below 30 for oversold conditions', () => {
        // Monotonically decreasing prices
        const prices = Array(20).fill(0).map((_, i) => 100 - i * 3);
        const rsi = calculateRSI(prices, 14);
        expect(rsi).toBeLessThan(30);
      });

      it('should return RSI above 70 for overbought conditions', () => {
        // Strong uptrend
        const prices = Array(20).fill(0).map((_, i) => 10 + i * 2);
        const rsi = calculateRSI(prices, 14);
        expect(rsi).toBeGreaterThan(70);
      });

      it('should return RSI around 50 for flat prices', () => {
        // Alternating up/down
        const prices = Array(30).fill(0).map((_, i) => 50 + (i % 2 === 0 ? 1 : -1));
        const rsi = calculateRSI(prices, 14);
        expect(rsi).toBeGreaterThan(40);
        expect(rsi).toBeLessThan(60);
      });
    });

    describe('calculateSMA', () => {
      it('should return null for insufficient data', () => {
        const prices = [10, 20, 30]; // 3 prices, period 5
        expect(calculateSMA(prices, 5)).toBeNull();
      });

      it('should calculate SMA correctly', () => {
        const prices = [10, 20, 30, 40, 50];
        expect(calculateSMA(prices, 5)).toBe(30); // (10+20+30+40+50)/5
      });

      it('should use last N values for SMA', () => {
        const prices = [5, 10, 20, 30, 40, 50];
        expect(calculateSMA(prices, 3)).toBe(40); // (30+40+50)/3
      });
    });

    describe('calculateEMA', () => {
      it('should return null for insufficient data', () => {
        const prices = [10, 20]; // 2 prices, period 5
        expect(calculateEMA(prices, 5)).toBeNull();
      });

      it('should calculate EMA correctly', () => {
        const prices = [22, 24, 23, 25, 26, 28, 27, 29, 30, 28, 31, 30, 32];
        const ema = calculateEMA(prices, 5);
        expect(ema).toBeDefined();
        expect(typeof ema).toBe('number');
        // EMA should be close to recent prices
        expect(ema).toBeGreaterThan(28);
        expect(ema).toBeLessThan(32);
      });
    });

    describe('calculateMACD', () => {
      it('should return nulls for insufficient data', () => {
        const prices = Array(10).fill(50);
        const macd = calculateMACD(prices);
        expect(macd.line).toBeNull();
        expect(macd.signal).toBeNull();
        expect(macd.histogram).toBeNull();
      });

      it('should calculate MACD values for sufficient data', () => {
        const prices = Array(30).fill(0).map((_, i) => 50 + i * 0.5);
        const macd = calculateMACD(prices);
        expect(macd.line).not.toBeNull();
        expect(macd.signal).not.toBeNull();
        expect(macd.histogram).not.toBeNull();
      });

      it('should return positive MACD line for uptrend', () => {
        const prices = Array(30).fill(0).map((_, i) => 30 + i);
        const macd = calculateMACD(prices);
        expect(macd.line).toBeGreaterThan(0);
      });
    });
  });

  describe('Recommendation Logic (private methods via reflection)', () => {
    let generateRecommendation: (indicators: any) => Recommendation;
    let calculateConfidence: (indicators: any) => number;
    let scoreFundamentals: (data: any) => number;
    let scoreRecommendation: (rec: Recommendation) => number;

    beforeEach(() => {
      generateRecommendation = (service as any).generateRecommendation.bind(service);
      calculateConfidence = (service as any).calculateConfidence.bind(service);
      scoreFundamentals = (service as any).scoreFundamentals.bind(service);
      scoreRecommendation = (service as any).scoreRecommendation.bind(service);
    });

    describe('generateRecommendation', () => {
      it('should return STRONG_BUY for strong bullish indicators', () => {
        const indicators = {
          rsi: 25, // Oversold
          sma20: 30,
          sma50: 28,
          current_price: 35,
          macd: { histogram: 1 },
          price_change_5d: 6,
        };
        expect(generateRecommendation(indicators)).toBe(Recommendation.STRONG_BUY);
      });

      it('should return STRONG_SELL for strong bearish indicators', () => {
        const indicators = {
          rsi: 80, // Overbought
          sma20: 40,
          sma50: 42,
          current_price: 35,
          macd: { histogram: -1 },
          price_change_5d: -6,
        };
        expect(generateRecommendation(indicators)).toBe(Recommendation.STRONG_SELL);
      });

      it('should return HOLD for neutral indicators', () => {
        const indicators = {
          rsi: 50,
          sma20: 35,
          sma50: 35,
          current_price: 35,
          macd: { histogram: 0 },
          price_change_5d: 0,
        };
        expect(generateRecommendation(indicators)).toBe(Recommendation.HOLD);
      });

      it('should return BUY for moderately bullish indicators', () => {
        const indicators = {
          rsi: 35, // Slightly oversold
          sma20: 32,
          current_price: 35,
          macd: { histogram: 0.5 },
          price_change_5d: 2,
        };
        const rec = generateRecommendation(indicators);
        expect([Recommendation.BUY, Recommendation.STRONG_BUY]).toContain(rec);
      });
    });

    describe('calculateConfidence', () => {
      it('should return higher confidence for aligned indicators', () => {
        const indicators = {
          rsi: 25, // Strong oversold
          sma20: 30,
          sma50: 28,
          current_price: 35,
          macd: { histogram: 1 },
        };
        const conf = calculateConfidence(indicators);
        expect(conf).toBeGreaterThan(0.5);
      });

      it('should return lower confidence for mixed signals', () => {
        const indicators = {
          rsi: 50, // Neutral
          sma20: 35,
          sma50: 35,
          current_price: 35,
          macd: { histogram: 0 },
        };
        const conf = calculateConfidence(indicators);
        expect(conf).toBeLessThan(0.8);
      });

      it('should not exceed 1.0', () => {
        const indicators = {
          rsi: 20,
          sma20: 30,
          sma50: 28,
          current_price: 35,
          macd: { histogram: 2 },
        };
        const conf = calculateConfidence(indicators);
        expect(conf).toBeLessThanOrEqual(1);
      });
    });

    describe('scoreFundamentals', () => {
      it('should return positive score for undervalued stock', () => {
        const data = { pl: 8, pvp: 1.2, roe: 18 };
        expect(scoreFundamentals(data)).toBeGreaterThan(0);
      });

      it('should return negative score for overvalued stock', () => {
        const data = { pl: 30, pvp: 4, roe: 3 };
        expect(scoreFundamentals(data)).toBeLessThan(0);
      });

      it('should add bonus for high dividend yield', () => {
        const dataWithDy = { pl: 15, pvp: 2, roe: 10, dividendYield: 8 };
        const dataWithoutDy = { pl: 15, pvp: 2, roe: 10 };
        expect(scoreFundamentals(dataWithDy)).toBeGreaterThan(scoreFundamentals(dataWithoutDy));
      });

      it('should clamp score to [-2, 2]', () => {
        const veryGood = { pl: 5, pvp: 0.8, roe: 25, dividendYield: 10 };
        const veryBad = { pl: 50, pvp: 5, roe: 1 };
        expect(scoreFundamentals(veryGood)).toBeLessThanOrEqual(2);
        expect(scoreFundamentals(veryBad)).toBeGreaterThanOrEqual(-2);
      });
    });

    describe('scoreRecommendation', () => {
      it('should return correct scores for each recommendation', () => {
        expect(scoreRecommendation(Recommendation.STRONG_BUY)).toBe(2);
        expect(scoreRecommendation(Recommendation.BUY)).toBe(1);
        expect(scoreRecommendation(Recommendation.HOLD)).toBe(0);
        expect(scoreRecommendation(Recommendation.SELL)).toBe(-1);
        expect(scoreRecommendation(Recommendation.STRONG_SELL)).toBe(-2);
      });
    });
  });

  describe('Signal and Trend Identification (private methods)', () => {
    let identifySignals: (indicators: any) => string[];
    let identifyTrends: (indicators: any) => any;
    let generateSummary: (indicators: any, recommendation: Recommendation) => string;

    beforeEach(() => {
      identifySignals = (service as any).identifySignals.bind(service);
      identifyTrends = (service as any).identifyTrends.bind(service);
      generateSummary = (service as any).generateSummary.bind(service);
    });

    describe('identifySignals', () => {
      it('should identify oversold RSI signal', () => {
        const signals = identifySignals({ rsi: 25, macd: { histogram: 0 } });
        expect(signals).toContain('RSI indica sobrevenda (possível reversão de alta)');
      });

      it('should identify overbought RSI signal', () => {
        const signals = identifySignals({ rsi: 75, macd: { histogram: 0 } });
        expect(signals).toContain('RSI indica sobrecompra (possível reversão de baixa)');
      });

      it('should identify price above SMA20', () => {
        const signals = identifySignals({ sma20: 30, current_price: 35, macd: { histogram: 0 } });
        expect(signals).toContain('Preço acima da SMA 20 (tendência de alta)');
      });

      it('should identify positive MACD', () => {
        const signals = identifySignals({ macd: { histogram: 0.5 } });
        expect(signals).toContain('MACD positivo (momentum de alta)');
      });

      it('should identify negative MACD', () => {
        const signals = identifySignals({ macd: { histogram: -0.5 } });
        expect(signals).toContain('MACD negativo (momentum de baixa)');
      });
    });

    describe('identifyTrends', () => {
      it('should identify bullish trends', () => {
        const trends = identifyTrends({
          sma20: 30,
          sma50: 28,
          sma200: 25,
          current_price: 35,
        });
        expect(trends.short_term).toBe('bullish');
        expect(trends.medium_term).toBe('bullish');
        expect(trends.long_term).toBe('bullish');
      });

      it('should identify bearish trends', () => {
        const trends = identifyTrends({
          sma20: 40,
          sma50: 42,
          sma200: 45,
          current_price: 35,
        });
        expect(trends.short_term).toBe('bearish');
        expect(trends.medium_term).toBe('bearish');
        expect(trends.long_term).toBe('bearish');
      });
    });

    describe('generateSummary', () => {
      it('should generate summary with price and RSI', () => {
        const indicators = {
          current_price: 35.50,
          rsi: 45.6,
          price_change_5d: 2.5,
        };
        const summary = generateSummary(indicators, Recommendation.HOLD);
        expect(summary).toContain('HOLD');
        expect(summary).toContain('35.50');
        expect(summary).toContain('45.6');
        expect(summary).toContain('2.50%');
      });

      it('should handle missing price_change_5d', () => {
        const indicators = {
          current_price: 35.50,
          rsi: 45.6,
          price_change_5d: null,
        };
        const summary = generateSummary(indicators, Recommendation.BUY);
        expect(summary).toContain('N/A');
      });
    });
  });

  describe('Combined Analysis (private methods)', () => {
    let combineRecommendations: (fundamentalData: any, technicalRec?: Recommendation | null) => Recommendation;
    let combinedConfidence: (fundamentalConf: number, technicalConf: number) => number;
    let generateCombinedExplanation: (fundamentalConf: number, technicalRec: Recommendation | null, technicalConf: number) => string;

    beforeEach(() => {
      combineRecommendations = (service as any).combineRecommendations.bind(service);
      combinedConfidence = (service as any).combinedConfidence.bind(service);
      generateCombinedExplanation = (service as any).generateCombinedExplanation.bind(service);
    });

    describe('combineRecommendations', () => {
      it('should use only fundamentals when no technical data', () => {
        const fundamentalData = { pl: 8, pvp: 1.2, roe: 18 };
        const rec = combineRecommendations(fundamentalData, null);
        expect([Recommendation.BUY, Recommendation.STRONG_BUY, Recommendation.HOLD]).toContain(rec);
      });

      it('should combine both recommendations', () => {
        const fundamentalData = { pl: 8, pvp: 1.2, roe: 18 }; // Bullish
        const rec = combineRecommendations(fundamentalData, Recommendation.BUY);
        expect([Recommendation.BUY, Recommendation.STRONG_BUY]).toContain(rec);
      });

      it('should balance conflicting signals', () => {
        const fundamentalData = { pl: 30, pvp: 4, roe: 3 }; // Bearish
        const rec = combineRecommendations(fundamentalData, Recommendation.STRONG_BUY);
        // Should moderate to something between extremes
        expect(rec).not.toBe(Recommendation.STRONG_SELL);
        expect(rec).not.toBe(Recommendation.STRONG_BUY);
      });
    });

    describe('combinedConfidence', () => {
      it('should apply 60/40 weighting', () => {
        const combined = combinedConfidence(1.0, 0.5);
        // 1.0 * 0.6 + 0.5 * 0.4 = 0.6 + 0.2 = 0.8
        expect(combined).toBeCloseTo(0.8, 2);
      });

      it('should handle equal confidences', () => {
        const combined = combinedConfidence(0.7, 0.7);
        expect(combined).toBeCloseTo(0.7, 2);
      });
    });

    describe('generateCombinedExplanation', () => {
      it('should explain when no technical data', () => {
        const explanation = generateCombinedExplanation(0.85, null, 0);
        expect(explanation).toContain('apenas em análise fundamentalista');
        expect(explanation).toContain('85%');
        expect(explanation).toContain('insuficientes');
      });

      it('should explain combined analysis', () => {
        const explanation = generateCombinedExplanation(0.80, Recommendation.BUY, 0.70);
        expect(explanation).toContain('60%');
        expect(explanation).toContain('40%');
        expect(explanation).toContain('80%');
        expect(explanation).toContain('70%');
        expect(explanation.toLowerCase()).toContain('buy'); // Recommendation enum value is lowercase
      });
    });
  });

  describe('generateFundamentalAnalysis', () => {
    it('should throw NotFoundException for unknown ticker', async () => {
      mockAssetRepository.findOne.mockResolvedValue(null);

      await expect(service.generateFundamentalAnalysis('UNKNOWN')).rejects.toThrow(NotFoundException);
    });

    it('should create and save analysis record', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockAnalysisRepository.create.mockReturnValue(mockAnalysis);
      mockAnalysisRepository.save.mockResolvedValue(mockAnalysis);
      mockScrapersService.scrapeFundamentalData.mockResolvedValue({
        data: { pl: 10, pvp: 1.5 },
        sources: ['fundamentus'],
        sourcesCount: 1,
        confidence: 0.8,
      });

      const result = await service.generateFundamentalAnalysis('PETR4');

      expect(mockAssetRepository.findOne).toHaveBeenCalledWith({
        where: { ticker: 'PETR4' },
      });
      expect(mockAnalysisRepository.create).toHaveBeenCalled();
      expect(mockAnalysisRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should mark analysis as failed on error', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockAnalysisRepository.create.mockReturnValue({ ...mockAnalysis });
      mockAnalysisRepository.save.mockResolvedValue(mockAnalysis);
      mockScrapersService.scrapeFundamentalData.mockRejectedValue(new Error('Scraper error'));

      await expect(service.generateFundamentalAnalysis('PETR4')).rejects.toThrow('Scraper error');
      expect(mockAnalysisRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AnalysisStatus.FAILED }),
      );
    });
  });

  describe('generateTechnicalAnalysis', () => {
    it('should throw NotFoundException for unknown ticker', async () => {
      mockAssetRepository.findOne.mockResolvedValue(null);

      await expect(service.generateTechnicalAnalysis('UNKNOWN')).rejects.toThrow(NotFoundException);
    });

    it('should throw error for insufficient price data', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockAnalysisRepository.create.mockReturnValue({ ...mockAnalysis });
      mockAnalysisRepository.save.mockResolvedValue(mockAnalysis);
      mockAssetPriceRepository.find.mockResolvedValue(generatePrices(10)); // Only 10 days

      await expect(service.generateTechnicalAnalysis('PETR4')).rejects.toThrow(
        'Insufficient price data',
      );
    });

    it('should complete technical analysis with sufficient data', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      const savedAnalysis = { ...mockAnalysis, type: AnalysisType.TECHNICAL };
      mockAnalysisRepository.create.mockReturnValue(savedAnalysis);
      mockAnalysisRepository.save.mockResolvedValue(savedAnalysis);
      mockAssetPriceRepository.find.mockResolvedValue(generatePrices(50));

      const result = await service.generateTechnicalAnalysis('PETR4');

      expect(result).toBeDefined();
      expect(mockAnalysisRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AnalysisStatus.COMPLETED }),
      );
    });
  });

  describe('findAll', () => {
    it('should return analyses for user', async () => {
      mockAnalysisRepository.find.mockResolvedValue([mockAnalysis]);

      const result = await service.findAll('user-123');

      expect(mockAnalysisRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123' },
          relations: ['asset'],
          order: { createdAt: 'DESC' },
        }),
      );
      expect(result).toEqual([mockAnalysis]);
    });

    it('should filter by type when provided', async () => {
      mockAnalysisRepository.find.mockResolvedValue([]);

      await service.findAll('user-123', { type: AnalysisType.TECHNICAL });

      expect(mockAnalysisRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123', type: AnalysisType.TECHNICAL },
        }),
      );
    });

    it('should filter by ticker when provided', async () => {
      mockAnalysisRepository.find.mockResolvedValue([]);

      await service.findAll('user-123', { ticker: 'petr4' });

      expect(mockAnalysisRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-123', asset: { ticker: 'PETR4' } },
        }),
      );
    });

    it('should apply pagination', async () => {
      mockAnalysisRepository.find.mockResolvedValue([]);

      await service.findAll('user-123', { limit: 10, offset: 5 });

      expect(mockAnalysisRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 5,
        }),
      );
    });
  });

  describe('findByTicker', () => {
    it('should find analyses by ticker', async () => {
      mockAnalysisRepository.find.mockResolvedValue([mockAnalysis]);

      const result = await service.findByTicker('PETR4');

      expect(mockAnalysisRepository.find).toHaveBeenCalledWith({
        where: { asset: { ticker: 'PETR4' } },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockAnalysis]);
    });

    it('should filter by type when provided', async () => {
      mockAnalysisRepository.find.mockResolvedValue([]);

      await service.findByTicker('PETR4', AnalysisType.FUNDAMENTAL);

      expect(mockAnalysisRepository.find).toHaveBeenCalledWith({
        where: { asset: { ticker: 'PETR4' }, type: AnalysisType.FUNDAMENTAL },
        order: { createdAt: 'DESC' },
      });
    });

    it('should convert ticker to uppercase', async () => {
      mockAnalysisRepository.find.mockResolvedValue([]);

      await service.findByTicker('petr4');

      expect(mockAnalysisRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { asset: { ticker: 'PETR4' } },
        }),
      );
    });
  });

  describe('findById', () => {
    it('should throw NotFoundException when analysis not found', async () => {
      mockAnalysisRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(NotFoundException);
    });

    it('should return analysis with current price', async () => {
      const analysisWithAsset = { ...mockAnalysis, asset: mockAsset };
      mockAnalysisRepository.findOne.mockResolvedValue(analysisWithAsset);
      mockAssetPriceRepository.findOne.mockResolvedValue({
        close: 35.50,
        date: new Date(),
        changePercent: 1.5,
      });

      const result = await service.findById('analysis-123');

      expect(result).toMatchObject({
        ...analysisWithAsset,
        currentPrice: 35.50,
        changePercent: 1.5,
      });
    });
  });

  describe('deleteAnalysis', () => {
    it('should throw NotFoundException when analysis not found', async () => {
      mockAnalysisRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteAnalysis('analysis-123', 'user-123')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete analysis and return confirmation', async () => {
      mockAnalysisRepository.findOne.mockResolvedValue({ ...mockAnalysis, userId: 'user-123' });
      mockAnalysisRepository.remove.mockResolvedValue(mockAnalysis);

      const result = await service.deleteAnalysis('analysis-123', 'user-123');

      expect(mockAnalysisRepository.remove).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Analysis deleted successfully', id: 'analysis-123' });
    });
  });

  describe('requestBulkAnalysis', () => {
    it('should return empty result when no active assets', async () => {
      mockAssetRepository.find.mockResolvedValue([]);

      const result = await service.requestBulkAnalysis(AnalysisType.FUNDAMENTAL, 'user-123');

      expect(result).toEqual({
        message: 'No active assets found',
        total: 0,
        requested: 0,
      });
    });

    it('should skip assets with recent analysis', async () => {
      const assets = [mockAsset, { ...mockAsset, id: 'asset-456', ticker: 'VALE3' }];
      mockAssetRepository.find.mockResolvedValue(assets);

      // First asset has recent analysis (within 7 days)
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3);
      mockAnalysisRepository.findOne
        .mockResolvedValueOnce({ createdAt: recentDate })
        .mockResolvedValueOnce(null);
      mockAnalysisRepository.create.mockReturnValue({ id: 'new-analysis' });
      mockAnalysisRepository.save.mockResolvedValue({ id: 'new-analysis' });

      const result = await service.requestBulkAnalysis(AnalysisType.FUNDAMENTAL, 'user-123');

      expect(result.skipped).toBe(1);
      expect(result.requested).toBe(1);
      expect(result.skippedAssets).toContain('PETR4');
      expect(result.requestedAssets).toContain('VALE3');
    });

    it('should create pending analysis for all active assets', async () => {
      const assets = [mockAsset];
      mockAssetRepository.find.mockResolvedValue(assets);
      mockAnalysisRepository.findOne.mockResolvedValue(null);
      mockAnalysisRepository.create.mockReturnValue({ id: 'new-analysis' });
      mockAnalysisRepository.save.mockResolvedValue({ id: 'new-analysis' });

      const result = await service.requestBulkAnalysis(AnalysisType.TECHNICAL, 'user-123');

      expect(mockAnalysisRepository.create).toHaveBeenCalledWith({
        assetId: 'asset-123',
        type: AnalysisType.TECHNICAL,
        userId: 'user-123',
        status: AnalysisStatus.PENDING,
      });
      expect(result.requested).toBe(1);
    });
  });

  describe('generateCompleteAnalysis', () => {
    it('should throw NotFoundException for unknown ticker', async () => {
      mockAssetRepository.findOne.mockResolvedValue(null);

      await expect(service.generateCompleteAnalysis('UNKNOWN')).rejects.toThrow(NotFoundException);
    });

    it('should remove existing analysis before creating new one', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      const existingAnalysis = { id: 'old-analysis' };
      mockAnalysisRepository.findOne.mockResolvedValueOnce(existingAnalysis);
      mockAnalysisRepository.remove.mockResolvedValue(existingAnalysis);
      mockAnalysisRepository.create.mockReturnValue({ ...mockAnalysis });
      mockAnalysisRepository.save.mockResolvedValue({ ...mockAnalysis });
      mockScrapersService.scrapeFundamentalData.mockResolvedValue({
        data: {},
        sources: [],
        sourcesCount: 0,
        confidence: 0.5,
      });
      mockAssetPriceRepository.find.mockResolvedValue([]);

      await service.generateCompleteAnalysis('PETR4', 'user-123');

      expect(mockAnalysisRepository.remove).toHaveBeenCalledWith(existingAnalysis);
    });

    it('should handle analysis without technical data', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockAnalysisRepository.findOne.mockResolvedValue(null);
      const savedAnalysis = { ...mockAnalysis, type: AnalysisType.COMPLETE };
      mockAnalysisRepository.create.mockReturnValue(savedAnalysis);
      mockAnalysisRepository.save.mockResolvedValue(savedAnalysis);
      mockScrapersService.scrapeFundamentalData.mockResolvedValue({
        data: { pl: 10 },
        sources: ['fundamentus'],
        sourcesCount: 1,
        confidence: 0.8,
      });
      mockAssetPriceRepository.find.mockResolvedValue([]); // No price data

      const result = await service.generateCompleteAnalysis('PETR4');

      expect(result).toBeDefined();
      expect(mockAnalysisRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: AnalysisStatus.COMPLETED }),
      );
    });

    it('should combine fundamental and technical analysis', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockAnalysisRepository.findOne.mockResolvedValue(null);
      const savedAnalysis = { ...mockAnalysis, type: AnalysisType.COMPLETE };
      mockAnalysisRepository.create.mockReturnValue(savedAnalysis);
      mockAnalysisRepository.save.mockResolvedValue(savedAnalysis);
      mockScrapersService.scrapeFundamentalData.mockResolvedValue({
        data: { pl: 10, pvp: 1.5, roe: 18 },
        sources: ['fundamentus', 'statusinvest'],
        sourcesCount: 2,
        confidence: 0.9,
      });
      mockAssetPriceRepository.find.mockResolvedValue(generatePrices(50));

      const result = await service.generateCompleteAnalysis('PETR4');

      expect(result).toBeDefined();
      expect(mockAnalysisRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AnalysisStatus.COMPLETED,
          dataSources: expect.arrayContaining(['fundamentus', 'statusinvest', 'database']),
        }),
      );
    });
  });
});
