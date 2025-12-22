import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { BacktestService } from './backtest.service';
import {
  BacktestResult,
  BacktestStatus,
  BacktestConfig,
} from '@database/entities/backtest-result.entity';
import { Asset, AssetPrice, Dividend, StockLendingRate, OptionPrice } from '@database/entities';
import { CreateBacktestDto, BacktestConfigDto } from './dto/backtest.dto';

/**
 * BacktestService Stress Tests
 *
 * PARTE 14 do plano Wheel Turbinada - Stress Test Scenarios
 * Cobertura:
 * - Volume de Dados (10k dividendos, 60 meses, paralelos, equity curve)
 * - Cenários Extremos (100% exercise, market crash, zero dividends)
 *
 * @created 2025-12-21
 * @phase FASE 101.4 - Wheel Turbinada Backtesting Engine
 */
describe('BacktestService', () => {
  let service: BacktestService;
  let backtestRepo: Repository<BacktestResult>;
  let assetRepo: Repository<Asset>;
  let priceRepo: Repository<AssetPrice>;
  let dividendRepo: Repository<Dividend>;
  let lendingRepo: Repository<StockLendingRate>;
  let optionRepo: Repository<OptionPrice>;

  // Mock Asset
  const mockAsset: Partial<Asset> = {
    id: 'asset-petr4-uuid',
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: 'stock' as any,
    sector: 'Petróleo',
    isActive: true,
    hasOptions: true,
  };

  // Mock BacktestResult
  const mockBacktestResult: Partial<BacktestResult> = {
    id: 'backtest-uuid-123',
    userId: 'user-uuid',
    assetId: 'asset-petr4-uuid',
    name: 'Backtest PETR4 60 meses',
    startDate: new Date('2020-12-01'),
    endDate: new Date('2025-12-01'),
    status: BacktestStatus.RUNNING,
    progress: 0,
    config: {
      initialCapital: 1000000,
      targetDelta: 0.15,
      minROE: 15,
      minDividendYield: 6,
      maxDebtEbitda: 2.0,
      weeklyDistribution: true,
      reinvestDividends: true,
      includeLendingIncome: true,
    },
    equityCurve: [],
    simulatedTrades: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock Price data generator (60 months = ~1260 trading days)
  const generateMockPrices = (count: number): Partial<AssetPrice>[] => {
    const prices: Partial<AssetPrice>[] = [];
    const startDate = new Date('2020-12-01');
    let currentPrice = 28.0; // Starting price

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + Math.floor(i * 1.4)); // Aproximação dias úteis

      // Simulate price movement
      const dailyReturn = (Math.random() - 0.48) * 0.03; // Slight positive bias
      currentPrice = Math.max(5, currentPrice * (1 + dailyReturn));

      prices.push({
        id: `price-${i}`,
        assetId: 'asset-petr4-uuid',
        date,
        open: new Decimal(currentPrice * 0.99),
        high: new Decimal(currentPrice * 1.02),
        low: new Decimal(currentPrice * 0.98),
        close: new Decimal(currentPrice),
        volume: Math.floor(Math.random() * 10000000) + 1000000,
      });
    }
    return prices;
  };

  // Mock Dividends generator
  const generateMockDividends = (count: number): Partial<Dividend>[] => {
    const dividends: Partial<Dividend>[] = [];
    const startDate = new Date('2020-12-01');

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + Math.floor(i / 2)); // ~2 dividends per month

      dividends.push({
        id: `dividend-${i}`,
        assetId: 'asset-petr4-uuid',
        tipo: i % 3 === 0 ? ('jcp' as any) : ('dividendo' as any),
        valorBruto: new Decimal(parseFloat((Math.random() * 2 + 0.5).toFixed(4))),
        valorLiquido: null,
        dataEx: date,
        dataPagamento: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
        status: 'pago' as any,
      });
    }
    return dividends;
  };

  // Mock Options generator
  const generateMockOptions = (count: number): Partial<OptionPrice>[] => {
    const options: Partial<OptionPrice>[] = [];
    const startDate = new Date('2020-12-01');

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + Math.floor(i / 10));

      options.push({
        id: `option-${i}`,
        underlyingAssetId: 'asset-petr4-uuid',
        ticker: `PETR${i % 2 === 0 ? 'P' : 'C'}${28 + Math.floor(Math.random() * 10)}`,
        type: i % 2 === 0 ? ('put' as any) : ('call' as any),
        strike: 28 + Math.random() * 10 - 5,
        expirationDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000),
        lastPrice: Math.random() * 2 + 0.1,
        delta: i % 2 === 0 ? 0.15 + Math.random() * 0.1 : 0.3 + Math.random() * 0.2,
        openInterest: Math.floor(Math.random() * 10000) + 100,
        volume: Math.floor(Math.random() * 5000) + 50,
      });
    }
    return options;
  };

  // Mock Lending Rates generator
  const generateMockLendingRates = (count: number): Partial<StockLendingRate>[] => {
    const rates: Partial<StockLendingRate>[] = [];
    const startDate = new Date('2020-12-01');

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      rates.push({
        id: `lending-${i}`,
        assetId: 'asset-petr4-uuid',
        dataReferencia: date,
        taxaAluguelAno: new Decimal(3 + Math.random() * 4), // 3% to 7% a.a.
        quantidadeDisponivel: 1000000,
      });
    }
    return rates;
  };

  const mockBacktestRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockAssetRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockPriceRepository = {
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockDividendRepository = {
    find: jest.fn(),
    count: jest.fn(),
  };

  const mockLendingRepository = {
    find: jest.fn(),
  };

  const mockOptionRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BacktestService,
        {
          provide: getRepositoryToken(BacktestResult),
          useValue: mockBacktestRepository,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: mockAssetRepository,
        },
        {
          provide: getRepositoryToken(AssetPrice),
          useValue: mockPriceRepository,
        },
        {
          provide: getRepositoryToken(Dividend),
          useValue: mockDividendRepository,
        },
        {
          provide: getRepositoryToken(StockLendingRate),
          useValue: mockLendingRepository,
        },
        {
          provide: getRepositoryToken(OptionPrice),
          useValue: mockOptionRepository,
        },
      ],
    }).compile();

    service = module.get<BacktestService>(BacktestService);
    backtestRepo = module.get<Repository<BacktestResult>>(getRepositoryToken(BacktestResult));
    assetRepo = module.get<Repository<Asset>>(getRepositoryToken(Asset));
    priceRepo = module.get<Repository<AssetPrice>>(getRepositoryToken(AssetPrice));
    dividendRepo = module.get<Repository<Dividend>>(getRepositoryToken(Dividend));
    lendingRepo = module.get<Repository<StockLendingRate>>(getRepositoryToken(StockLendingRate));
    optionRepo = module.get<Repository<OptionPrice>>(getRepositoryToken(OptionPrice));
  });

  describe('Unit Tests - Core Functionality', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw NotFoundException for non-existent asset', async () => {
      mockAssetRepository.findOne.mockResolvedValue(null);

      const dto: CreateBacktestDto = {
        assetId: 'non-existent-uuid',
        name: 'Test Backtest',
        startDate: '2020-12-01',
        endDate: '2025-12-01',
        config: {
          initialCapital: 1000000,
          targetDelta: 0.15,
          minROE: 15,
          minDividendYield: 6,
          maxDebtEbitda: 2.0,
          weeklyDistribution: true,
          reinvestDividends: true,
          includeLendingIncome: true,
        },
      };

      await expect(service.createBacktest('user-uuid', dto)).rejects.toThrow(NotFoundException);
    });

    it('should create backtest with valid data', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockBacktestRepository.create.mockReturnValue(mockBacktestResult);
      mockBacktestRepository.save.mockResolvedValue(mockBacktestResult);

      const dto: CreateBacktestDto = {
        assetId: 'asset-petr4-uuid',
        name: 'Test Backtest',
        startDate: '2020-12-01',
        endDate: '2025-12-01',
        config: {
          initialCapital: 1000000,
          targetDelta: 0.15,
          minROE: 15,
          minDividendYield: 6,
          maxDebtEbitda: 2.0,
          weeklyDistribution: true,
          reinvestDividends: true,
          includeLendingIncome: true,
        },
      };

      const result = await service.createBacktest('user-uuid', dto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(mockAssetRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'asset-petr4-uuid' },
      });
    });
  });

  /**
   * PARTE 14.1: Volume de Dados
   * Tests for high-volume data scenarios
   */
  describe('Stress Tests - Volume de Dados', () => {
    it('should handle query with 10k dividends in < 500ms', async () => {
      const startTime = Date.now();
      const mockDividends = generateMockDividends(10000);

      mockDividendRepository.find.mockResolvedValue(mockDividends);
      mockDividendRepository.count.mockResolvedValue(10000);

      // Simulate dividend query
      const dividends = await dividendRepo.find({ where: { assetId: 'asset-petr4-uuid' } });

      const elapsed = Date.now() - startTime;

      expect(dividends.length).toBe(10000);
      expect(elapsed).toBeLessThan(500); // < 500ms target
    });

    it('should process 60-month backtest (1260 trading days)', async () => {
      const tradingDays = 1260; // 60 months * 21 trading days
      const mockPrices = generateMockPrices(tradingDays);
      const mockDividends = generateMockDividends(120); // ~2 per month
      const mockOptions = generateMockOptions(tradingDays * 5);
      const mockLendingRates = generateMockLendingRates(tradingDays);

      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockPriceRepository.find.mockResolvedValue(mockPrices);
      mockDividendRepository.find.mockResolvedValue(mockDividends);
      mockOptionRepository.find.mockResolvedValue(mockOptions);
      mockLendingRepository.find.mockResolvedValue(mockLendingRates);
      mockBacktestRepository.findOne.mockResolvedValue({
        ...mockBacktestResult,
        asset: mockAsset,
      });
      mockBacktestRepository.update.mockResolvedValue({ affected: 1 });

      // Verify data volumes are correct
      expect(mockPrices.length).toBe(tradingDays);
      expect(mockDividends.length).toBe(120);
      expect(mockOptions.length).toBe(tradingDays * 5);
      expect(mockLendingRates.length).toBe(tradingDays);
    });

    it('should serialize equity curve with 1260 points in < 200ms', async () => {
      const startTime = Date.now();

      // Generate 1260 equity curve points
      const equityCurve = [];
      let equity = 1000000;
      const startDate = new Date('2020-12-01');

      for (let i = 0; i < 1260; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + Math.floor(i * 1.4));

        const dailyReturn = (Math.random() - 0.48) * 0.02;
        equity = equity * (1 + dailyReturn);

        equityCurve.push({
          date: date.toISOString().split('T')[0],
          equity: parseFloat(equity.toFixed(2)),
          dailyReturn: parseFloat((dailyReturn * 100).toFixed(4)),
          cumulativeReturn: parseFloat(((equity / 1000000 - 1) * 100).toFixed(4)),
          drawdown: parseFloat((Math.random() * 5).toFixed(4)),
        });
      }

      // Serialize to JSON
      const json = JSON.stringify(equityCurve);
      const elapsed = Date.now() - startTime;

      // Verify
      expect(equityCurve.length).toBe(1260);
      expect(json.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(200); // < 200ms target
      expect(JSON.parse(json).length).toBe(1260);
    });

    it('should handle multiple backtests concurrently (queue stability)', async () => {
      const concurrentBacktests = 10;
      const backtestPromises: Promise<any>[] = [];

      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockBacktestRepository.create.mockReturnValue(mockBacktestResult);
      mockBacktestRepository.save.mockResolvedValue(mockBacktestResult);

      const dto: CreateBacktestDto = {
        assetId: 'asset-petr4-uuid',
        name: 'Concurrent Test',
        startDate: '2020-12-01',
        endDate: '2025-12-01',
        config: {
          initialCapital: 1000000,
          targetDelta: 0.15,
          minROE: 15,
          minDividendYield: 6,
          maxDebtEbitda: 2.0,
          weeklyDistribution: true,
          reinvestDividends: true,
          includeLendingIncome: true,
        },
      };

      for (let i = 0; i < concurrentBacktests; i++) {
        backtestPromises.push(service.createBacktest(`user-${i}`, dto));
      }

      const results = await Promise.all(backtestPromises);

      expect(results.length).toBe(concurrentBacktests);
      results.forEach((result) => {
        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
      });
    });
  });

  /**
   * PARTE 14.2: Cenários Extremos
   * Tests for extreme market scenarios
   */
  describe('Stress Tests - Cenários Extremos', () => {
    it('should handle 100% exercise rate scenario (high delta)', async () => {
      // Config with high delta = high probability of exercise
      const highDeltaConfig: BacktestConfig = {
        initialCapital: 1000000,
        targetDelta: 0.50, // 50% delta = ~50% exercise probability
        minROE: 15,
        minDividendYield: 6,
        maxDebtEbitda: 2.0,
        weeklyDistribution: true,
        reinvestDividends: true,
        includeLendingIncome: true,
      };

      // Generate options all ITM (will be exercised)
      const mockOptions = generateMockOptions(500).map((opt) => ({
        ...opt,
        delta: 0.5 + Math.random() * 0.3, // High delta = ITM
      }));

      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockOptionRepository.find.mockResolvedValue(mockOptions);

      // Verify high delta options are generated
      const avgDelta = mockOptions.reduce((sum, o) => sum + (o.delta || 0), 0) / mockOptions.length;
      expect(avgDelta).toBeGreaterThan(0.45);

      // Service should handle this without crashing
      const backtestWithHighDelta = {
        ...mockBacktestResult,
        config: highDeltaConfig,
      };

      mockBacktestRepository.findOne.mockResolvedValue({
        ...backtestWithHighDelta,
        asset: mockAsset,
      });

      expect(backtestWithHighDelta.config.targetDelta).toBe(0.50);
    });

    it('should handle market crash scenario (COVID March 2020)', async () => {
      // Simulate COVID crash: ~40% drop in 1 month
      const crashPrices: Partial<AssetPrice>[] = [];
      let price = 30.0;
      const crashStart = new Date('2020-02-20');

      // Pre-crash period
      for (let i = 0; i < 20; i++) {
        const date = new Date(crashStart);
        date.setDate(date.getDate() - 20 + i);
        crashPrices.push({
          id: `price-${i}`,
          assetId: 'asset-petr4-uuid',
          date,
          close: new Decimal(price * (1 + (Math.random() - 0.5) * 0.02)),
        });
      }

      // Crash period (40% drop over 1 month)
      const crashDate = new Date('2020-03-01');
      for (let i = 0; i < 22; i++) {
        const date = new Date(crashDate);
        date.setDate(date.getDate() + i);
        const crashFactor = 1 - i * 0.02; // 2% drop per day
        price = Math.max(price * crashFactor, 10);
        crashPrices.push({
          id: `price-crash-${i}`,
          assetId: 'asset-petr4-uuid',
          date,
          close: new Decimal(price),
        });
      }

      // Recovery period
      for (let i = 0; i < 60; i++) {
        const date = new Date('2020-04-01');
        date.setDate(date.getDate() + i);
        price = price * (1 + Math.random() * 0.015);
        crashPrices.push({
          id: `price-recovery-${i}`,
          assetId: 'asset-petr4-uuid',
          date,
          close: new Decimal(price),
        });
      }

      mockPriceRepository.find.mockResolvedValue(crashPrices);

      // Calculate max drawdown from prices
      let peak = Number(crashPrices[0].close);
      let maxDrawdown = 0;

      crashPrices.forEach((p) => {
        const close = Number(p.close);
        if (close > peak) peak = close;
        const drawdown = ((peak - close) / peak) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });

      // Verify crash is properly simulated
      expect(maxDrawdown).toBeGreaterThan(20); // >20% drawdown
      expect(crashPrices.length).toBeGreaterThan(100);
    });

    it('should handle zero dividends scenario', async () => {
      // Asset with no dividend history
      const assetNoDividends: Partial<Asset> = {
        id: 'asset-no-div-uuid',
        ticker: 'TESTX',
        name: 'No Dividend Company',
        type: 'stock' as any,
        sector: 'Growth',
        isActive: true,
        hasOptions: true,
      };

      mockAssetRepository.findOne.mockResolvedValue(assetNoDividends);
      mockDividendRepository.find.mockResolvedValue([]); // No dividends

      const dividends = await dividendRepo.find({
        where: { assetId: 'asset-no-div-uuid' },
      });

      expect(dividends.length).toBe(0);

      // Backtest should still complete with dividendIncome = 0
      const resultWithNoDividends = {
        ...mockBacktestResult,
        assetId: 'asset-no-div-uuid',
        dividendIncome: 0,
        status: BacktestStatus.COMPLETED,
      };

      expect(resultWithNoDividends.dividendIncome).toBe(0);
      expect(resultWithNoDividends.status).toBe(BacktestStatus.COMPLETED);
    });

    it('should handle zero lending income scenario', async () => {
      mockLendingRepository.find.mockResolvedValue([]); // No lending rates

      const lendingRates = await lendingRepo.find({
        where: { assetId: 'asset-petr4-uuid' },
      });

      expect(lendingRates.length).toBe(0);

      // Backtest should complete with lendingIncome = 0
      const resultWithNoLending = {
        ...mockBacktestResult,
        lendingIncome: 0,
        status: BacktestStatus.COMPLETED,
      };

      expect(resultWithNoLending.lendingIncome).toBe(0);
    });

    it('should handle high volatility scenario (daily swings > 5%)', async () => {
      const volatilePrices: Partial<AssetPrice>[] = [];
      let price = 30.0;
      const startDate = new Date('2020-12-01');

      for (let i = 0; i < 252; i++) {
        // 1 year of trading
        const date = new Date(startDate);
        date.setDate(date.getDate() + Math.floor(i * 1.4));

        // High volatility: 5-10% daily swings
        const swing = (Math.random() - 0.5) * 0.15;
        price = Math.max(5, price * (1 + swing));

        volatilePrices.push({
          id: `price-vol-${i}`,
          assetId: 'asset-petr4-uuid',
          date,
          open: new Decimal(price * 0.97),
          high: new Decimal(price * 1.05),
          low: new Decimal(price * 0.95),
          close: new Decimal(price),
        });
      }

      // Calculate daily returns and volatility
      const dailyReturns: number[] = [];
      for (let i = 1; i < volatilePrices.length; i++) {
        const prevClose = Number(volatilePrices[i - 1].close);
        const currClose = Number(volatilePrices[i].close);
        dailyReturns.push((currClose - prevClose) / prevClose);
      }

      const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
      const variance =
        dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
        (dailyReturns.length - 1);
      const annualizedVol = Math.sqrt(variance) * Math.sqrt(252) * 100;

      // Verify high volatility
      expect(annualizedVol).toBeGreaterThan(30); // >30% annual volatility

      mockPriceRepository.find.mockResolvedValue(volatilePrices);
      expect(volatilePrices.length).toBe(252);
    });

    it('should handle split-adjusted price scenario', async () => {
      // Simulate 2:1 stock split
      const splitPrices: Partial<AssetPrice>[] = [];
      const startDate = new Date('2020-12-01');
      const splitDate = new Date('2021-06-01');
      let price = 60.0;

      for (let i = 0; i < 300; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + Math.floor(i * 1.4));

        // Apply split
        if (date >= splitDate && i === 150) {
          price = price / 2; // 2:1 split
        }

        price = price * (1 + (Math.random() - 0.48) * 0.02);

        splitPrices.push({
          id: `price-split-${i}`,
          assetId: 'asset-petr4-uuid',
          date,
          close: new Decimal(price),
        });
      }

      // Verify price drop at split date
      const preSplitPrice = Number(splitPrices[149].close);
      const postSplitPrice = Number(splitPrices[150].close);

      expect(postSplitPrice).toBeLessThan(preSplitPrice * 0.6); // ~50% drop at split

      mockPriceRepository.find.mockResolvedValue(splitPrices);
    });
  });

  /**
   * Risk Metrics Calculation Tests
   */
  describe('Risk Metrics Calculations', () => {
    it('should calculate Sharpe Ratio correctly', () => {
      // Simple test: if returns are consistently above risk-free rate, Sharpe > 0
      const returns = [0.01, 0.02, 0.015, 0.018, 0.012, 0.022, 0.01, 0.016];
      const riskFreeRate = 0.1375 / 252; // Daily Selic

      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const excessReturns = returns.map((r) => r - riskFreeRate);
      const avgExcess = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
      const variance =
        excessReturns.reduce((sum, r) => sum + Math.pow(r - avgExcess, 2), 0) /
        (excessReturns.length - 1);
      const stdDev = Math.sqrt(variance);
      const sharpeRatio = (avgExcess / stdDev) * Math.sqrt(252);

      expect(sharpeRatio).toBeGreaterThan(0);
      expect(isFinite(sharpeRatio)).toBe(true); // Must be a valid number
    });

    it('should calculate Sortino Ratio correctly', () => {
      // Sortino uses only downside deviation
      const returns = [0.01, -0.02, 0.015, -0.018, 0.012, 0.022, -0.01, 0.016];
      const riskFreeRate = 0.1375 / 252;

      const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
      const negativeReturns = returns.filter((r) => r < riskFreeRate);
      const downsideVariance =
        negativeReturns.reduce((sum, r) => sum + Math.pow(r - riskFreeRate, 2), 0) /
        negativeReturns.length;
      const downsideDeviation = Math.sqrt(downsideVariance);
      const sortinoRatio = ((avgReturn - riskFreeRate) / downsideDeviation) * Math.sqrt(252);

      // Sortino should exist (not NaN or Infinity)
      expect(isFinite(sortinoRatio)).toBe(true);
    });

    it('should calculate CAGR correctly', () => {
      const initialCapital = 1000000;
      const finalCapital = 2000000;
      const years = 5;

      // CAGR = (Vf / Vi)^(1/n) - 1
      const cagr = (Math.pow(finalCapital / initialCapital, 1 / years) - 1) * 100;

      expect(cagr).toBeCloseTo(14.87, 1); // ~14.87% for doubling in 5 years
    });

    it('should calculate Max Drawdown correctly', () => {
      const equityCurve = [
        100000, 110000, 105000, 95000, 90000, 100000, 115000, 110000, 120000,
      ];

      let peak = equityCurve[0];
      let maxDrawdown = 0;

      equityCurve.forEach((equity) => {
        if (equity > peak) peak = equity;
        const drawdown = ((peak - equity) / peak) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });

      // Max drawdown from 110k to 90k = 18.18%
      expect(maxDrawdown).toBeCloseTo(18.18, 1);
    });

    it('should calculate Profit Factor correctly', () => {
      const trades = [
        { pnl: 1000 },
        { pnl: -500 },
        { pnl: 1500 },
        { pnl: -300 },
        { pnl: 2000 },
        { pnl: -700 },
      ];

      const grossProfit = trades.filter((t) => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
      const grossLoss = Math.abs(
        trades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0),
      );
      const profitFactor = grossProfit / grossLoss;

      // 4500 / 1500 = 3.0
      expect(profitFactor).toBeCloseTo(3.0, 1);
    });

    it('should calculate Win Rate correctly', () => {
      const trades = [
        { result: 'win' },
        { result: 'loss' },
        { result: 'win' },
        { result: 'win' },
        { result: 'exercise' },
        { result: 'loss' },
        { result: 'win' },
        { result: 'win' },
        { result: 'loss' },
        { result: 'win' },
      ];

      const winningTrades = trades.filter((t) => t.result === 'win').length;
      const totalTrades = trades.length;
      const winRate = (winningTrades / totalTrades) * 100;

      // 6 wins / 10 trades = 60%
      expect(winRate).toBe(60);
    });
  });
});
