import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import Decimal from 'decimal.js';
import {
  BacktestResult,
  BacktestStatus,
  BacktestConfig,
  EquityCurvePoint,
  SimulatedTrade,
} from '@database/entities/backtest-result.entity';
import { Asset, AssetPrice, Dividend, StockLendingRate, OptionPrice } from '@database/entities';
import {
  CreateBacktestDto,
  BacktestQueryDto,
  BacktestResultDto,
  BacktestSummaryDto,
  BacktestCreatedDto,
} from './dto/backtest.dto';

/**
 * Backtest state during simulation
 */
interface BacktestState {
  date: Date;
  cash: number;
  selicPrincipal: number;
  sharesHeld: number;
  averagePrice: number;
  phase: 'selling_puts' | 'holding_shares' | 'selling_calls';
  openTrades: SimulatedTrade[];
  closedTrades: SimulatedTrade[];
  equityCurve: EquityCurvePoint[];
  dividendsReceived: number;
  lendingReceived: number;
  premiumsReceived: number;
  selicAccrued: number;
}

/**
 * Historical data loaded for simulation
 */
interface HistoricalData {
  prices: AssetPrice[];
  options: OptionPrice[];
  dividends: Dividend[];
  lendingRates: StockLendingRate[];
  priceMap: Map<string, number>;
}

/**
 * BacktestService
 *
 * Executa backtests da estratégia WHEEL com simulação completa:
 * - Venda de PUT (cash-secured)
 * - Holding de ações (após exercício)
 * - Venda de CALL coberta
 * - Receitas: prêmios + dividendos + aluguel + Selic
 *
 * @created 2025-12-21
 * @phase FASE 101.4 - Wheel Turbinada Backtesting Engine
 */
@Injectable()
export class BacktestService {
  private readonly logger = new Logger(BacktestService.name);

  /** Dias úteis no ano (B3) */
  private readonly TRADING_DAYS_PER_YEAR = 252;

  /** Taxa Selic média histórica (aproximação) */
  private readonly DEFAULT_SELIC_RATE = 0.1375; // 13.75% a.a.

  constructor(
    @InjectRepository(BacktestResult)
    private readonly backtestRepo: Repository<BacktestResult>,
    @InjectRepository(Asset)
    private readonly assetRepo: Repository<Asset>,
    @InjectRepository(AssetPrice)
    private readonly priceRepo: Repository<AssetPrice>,
    @InjectRepository(Dividend)
    private readonly dividendRepo: Repository<Dividend>,
    @InjectRepository(StockLendingRate)
    private readonly lendingRepo: Repository<StockLendingRate>,
    @InjectRepository(OptionPrice)
    private readonly optionRepo: Repository<OptionPrice>,
  ) {}

  /**
   * Cria e inicia um novo backtest
   */
  async createBacktest(userId: string, dto: CreateBacktestDto): Promise<BacktestCreatedDto> {
    this.logger.log(`Creating backtest for user ${userId}, asset ${dto.assetId}`);

    // Validate asset exists
    const asset = await this.assetRepo.findOne({ where: { id: dto.assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset ${dto.assetId} not found`);
    }

    // Validate date range
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Create backtest record
    const backtest = this.backtestRepo.create({
      userId,
      assetId: dto.assetId,
      name: dto.name,
      startDate,
      endDate,
      config: dto.config,
      initialCapital: dto.config.initialCapital,
      finalCapital: dto.config.initialCapital,
      totalReturn: 0,
      totalReturnPercent: 0,
      cagr: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdown: 0,
      maxDrawdownDays: 0,
      winRate: 0,
      profitFactor: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      exercises: 0,
      premiumIncome: 0,
      dividendIncome: 0,
      lendingIncome: 0,
      selicIncome: 0,
      equityCurve: [],
      simulatedTrades: [],
      status: BacktestStatus.RUNNING,
      progress: 0,
    });

    const saved = await this.backtestRepo.save(backtest);

    // Start async execution
    this.executeBacktest(saved.id).catch((error) => {
      this.logger.error(`Backtest ${saved.id} failed: ${error.message}`);
    });

    // Estimate time based on date range
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const estimatedTime = Math.max(30, Math.ceil(days / 20)); // ~20 days per second

    return {
      id: saved.id,
      status: saved.status,
      progress: 0,
      estimatedTime,
      createdAt: saved.createdAt,
    };
  }

  /**
   * Executa o backtest (async)
   */
  async executeBacktest(backtestId: string): Promise<void> {
    const startTime = Date.now();
    this.logger.log(`Starting backtest execution: ${backtestId}`);

    const backtest = await this.backtestRepo.findOne({
      where: { id: backtestId },
      relations: ['asset'],
    });

    if (!backtest) {
      throw new NotFoundException(`Backtest ${backtestId} not found`);
    }

    try {
      // Load historical data
      const historicalData = await this.loadHistoricalData(
        backtest.assetId,
        backtest.startDate,
        backtest.endDate,
      );

      // Initialize state
      const state = this.initializeState(backtest.config);

      // Get business days
      const businessDays = this.getBusinessDays(backtest.startDate, backtest.endDate);
      const totalDays = businessDays.length;

      // Simulation loop
      for (let i = 0; i < totalDays; i++) {
        const date = businessDays[i];
        state.date = date;

        // Update Selic yield
        this.updateSelicYield(state);

        // Check expirations
        this.checkExpirations(state, date, historicalData);

        // Check dividends
        await this.checkDividends(state, date, backtest.assetId, historicalData);

        // Calculate lending income
        if (state.sharesHeld > 0) {
          this.calculateLendingIncome(state, date, historicalData);
        }

        // Open new positions (weekly)
        if (this.shouldOpenNewPosition(state, date, i)) {
          this.openNewPosition(state, date, historicalData, backtest.config);
        }

        // Record equity curve
        const equity = this.calculateTotalEquity(state, date, historicalData);
        state.equityCurve.push({
          date: date.toISOString().split('T')[0],
          equity,
          dailyReturn: this.calculateDailyReturn(state.equityCurve, equity),
          cumulativeReturn: (equity / backtest.config.initialCapital - 1) * 100,
          drawdown: this.calculateDrawdown(state.equityCurve, equity),
        });

        // Update progress every 50 days
        if (i % 50 === 0) {
          const progress = Math.round((i / totalDays) * 100);
          await this.backtestRepo.update(backtestId, { progress });
        }
      }

      // Calculate final metrics
      const metrics = this.calculateFinalMetrics(state, backtest.config.initialCapital);

      // Update result
      const executionTime = (Date.now() - startTime) / 1000;
      await this.backtestRepo.update(backtestId, {
        status: BacktestStatus.COMPLETED,
        progress: 100,
        finalCapital: metrics.finalCapital,
        totalReturn: metrics.totalReturn,
        totalReturnPercent: metrics.totalReturnPercent,
        cagr: metrics.cagr,
        sharpeRatio: metrics.sharpeRatio,
        sortinoRatio: metrics.sortinoRatio,
        maxDrawdown: metrics.maxDrawdown,
        maxDrawdownDays: metrics.maxDrawdownDays,
        winRate: metrics.winRate,
        profitFactor: metrics.profitFactor,
        calmarRatio: metrics.calmarRatio,
        totalTrades: state.closedTrades.length,
        winningTrades: state.closedTrades.filter((t) => t.result === 'win').length,
        losingTrades: state.closedTrades.filter((t) => t.result === 'loss').length,
        exercises: state.closedTrades.filter(
          (t) => t.type === 'exercise_put' || t.type === 'exercise_call',
        ).length,
        premiumIncome: state.premiumsReceived,
        dividendIncome: state.dividendsReceived,
        lendingIncome: state.lendingReceived,
        selicIncome: state.selicAccrued,
        equityCurve: state.equityCurve,
        simulatedTrades: state.closedTrades,
        executionTime,
      });

      this.logger.log(`Backtest ${backtestId} completed in ${executionTime.toFixed(2)}s`);
    } catch (error) {
      this.logger.error(`Backtest ${backtestId} failed: ${error.message}`);
      await this.backtestRepo.update(backtestId, {
        status: BacktestStatus.FAILED,
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Busca backtest por ID
   */
  async findById(id: string, userId: string): Promise<BacktestResultDto> {
    const backtest = await this.backtestRepo.findOne({
      where: { id, userId },
      relations: ['asset'],
    });

    if (!backtest) {
      throw new NotFoundException(`Backtest ${id} not found`);
    }

    return this.mapToResultDto(backtest);
  }

  /**
   * Lista backtests do usuário
   */
  async findAll(userId: string, query: BacktestQueryDto): Promise<BacktestSummaryDto[]> {
    const { assetId, status, limit = 20, offset = 0 } = query;

    const qb = this.backtestRepo
      .createQueryBuilder('backtest')
      .leftJoinAndSelect('backtest.asset', 'asset')
      .where('backtest.userId = :userId', { userId })
      .orderBy('backtest.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    if (assetId) {
      qb.andWhere('backtest.assetId = :assetId', { assetId });
    }

    if (status) {
      qb.andWhere('backtest.status = :status', { status });
    }

    const results = await qb.getMany();
    return results.map((r) => this.mapToSummaryDto(r));
  }

  /**
   * Deleta um backtest
   */
  async delete(id: string, userId: string): Promise<void> {
    const result = await this.backtestRepo.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Backtest ${id} not found`);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Data Loading
  // ─────────────────────────────────────────────────────────────────────────

  private async loadHistoricalData(
    assetId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<HistoricalData> {
    // Load prices
    const prices = await this.priceRepo.find({
      where: {
        assetId,
        date: Between(startDate, endDate),
      },
      order: { date: 'ASC' },
    });

    // Create price map for quick lookup
    const priceMap = new Map<string, number>();
    prices.forEach((p) => {
      priceMap.set(p.date.toISOString().split('T')[0], Number(p.close));
    });

    // Load options (if available)
    const options = await this.optionRepo.find({
      where: {
        underlyingAssetId: assetId,
        quoteTime: Between(startDate, endDate),
      },
      order: { quoteTime: 'ASC' },
    });

    // Load dividends
    const dividends = await this.dividendRepo.find({
      where: {
        assetId,
        dataEx: Between(startDate, endDate),
      },
      order: { dataEx: 'ASC' },
    });

    // Load lending rates
    const lendingRates = await this.lendingRepo.find({
      where: {
        assetId,
        dataReferencia: Between(startDate, endDate),
      },
      order: { dataReferencia: 'ASC' },
    });

    return { prices, options, dividends, lendingRates, priceMap };
  }

  private initializeState(config: BacktestConfig): BacktestState {
    return {
      date: new Date(),
      cash: config.initialCapital * 0.5, // 50% in cash
      selicPrincipal: config.initialCapital * 0.5, // 50% in Selic
      sharesHeld: 0,
      averagePrice: 0,
      phase: 'selling_puts',
      openTrades: [],
      closedTrades: [],
      equityCurve: [],
      dividendsReceived: 0,
      lendingReceived: 0,
      premiumsReceived: 0,
      selicAccrued: 0,
    };
  }

  private getBusinessDays(startDate: Date, endDate: Date): Date[] {
    const days: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not weekend
        days.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Simulation Logic
  // ─────────────────────────────────────────────────────────────────────────

  private updateSelicYield(state: BacktestState): void {
    // Daily Selic yield
    const dailyRate = this.DEFAULT_SELIC_RATE / this.TRADING_DAYS_PER_YEAR;
    const dailyYield = state.selicPrincipal * dailyRate;
    state.selicAccrued += dailyYield;
    state.selicPrincipal += dailyYield;
  }

  private checkExpirations(state: BacktestState, date: Date, data: HistoricalData): void {
    const dateStr = date.toISOString().split('T')[0];
    const price = data.priceMap.get(dateStr);

    if (!price) return;

    const expired = state.openTrades.filter((t) => t.expiration <= dateStr);

    for (const trade of expired) {
      // Remove from open trades
      state.openTrades = state.openTrades.filter((t) => t !== trade);

      if (trade.type === 'sell_put') {
        if (price < trade.strike) {
          // PUT exercised - buy shares
          const shares = (trade.contracts || 1) * 100;
          const cost = trade.strike * shares;

          state.cash -= cost;
          state.sharesHeld += shares;
          state.averagePrice = trade.strike;
          state.phase = 'selling_calls';

          state.closedTrades.push({
            ...trade,
            result: 'exercise',
            pnl: trade.premium - (trade.strike - price) * shares,
          });
        } else {
          // PUT expired worthless - keep premium
          state.closedTrades.push({
            ...trade,
            result: 'win',
            pnl: trade.premium,
          });
        }
      } else if (trade.type === 'sell_call') {
        if (price > trade.strike) {
          // CALL exercised - sell shares
          const shares = (trade.contracts || 1) * 100;
          const proceeds = trade.strike * shares;

          state.cash += proceeds;
          state.sharesHeld -= shares;
          state.phase = 'selling_puts';

          const gainOnShares = (trade.strike - state.averagePrice) * shares;
          state.closedTrades.push({
            ...trade,
            result: 'exercise',
            pnl: trade.premium + gainOnShares,
          });
        } else {
          // CALL expired worthless - keep premium
          state.closedTrades.push({
            ...trade,
            result: 'win',
            pnl: trade.premium,
          });
        }
      }
    }
  }

  private async checkDividends(
    state: BacktestState,
    date: Date,
    assetId: string,
    data: HistoricalData,
  ): Promise<void> {
    if (state.sharesHeld <= 0) return;

    const dateStr = date.toISOString().split('T')[0];
    const dividends = data.dividends.filter(
      (d) => d.dataEx.toISOString().split('T')[0] === dateStr,
    );

    for (const div of dividends) {
      const amount = Number(div.valorLiquido || div.valorBruto) * state.sharesHeld;
      state.dividendsReceived += amount;
      state.cash += amount;
    }
  }

  private calculateLendingIncome(state: BacktestState, date: Date, data: HistoricalData): void {
    const dateStr = date.toISOString().split('T')[0];
    const price = data.priceMap.get(dateStr);

    if (!price || state.sharesHeld <= 0) return;

    // Find lending rate for this date
    const rate = data.lendingRates.find(
      (r) => r.dataReferencia.toISOString().split('T')[0] === dateStr,
    );

    if (rate) {
      const dailyRate = Number(rate.taxaAluguelDia) / 100;
      const dailyIncome = state.sharesHeld * price * dailyRate;
      state.lendingReceived += dailyIncome;
      state.cash += dailyIncome;
    }
  }

  private shouldOpenNewPosition(state: BacktestState, date: Date, dayIndex: number): boolean {
    // Open new position every 5 business days (weekly)
    return dayIndex % 5 === 0 && state.openTrades.length < 10;
  }

  private openNewPosition(
    state: BacktestState,
    date: Date,
    data: HistoricalData,
    config: BacktestConfig,
  ): void {
    const dateStr = date.toISOString().split('T')[0];
    const price = data.priceMap.get(dateStr);

    if (!price) return;

    if (state.phase === 'selling_puts' || state.phase === 'selling_calls') {
      // Simulate option sale
      const isCall = state.phase === 'selling_calls';
      const delta = config.targetDelta;

      // Estimate strike and premium based on delta
      const strikeMultiplier = isCall ? 1 + delta * 0.5 : 1 - delta * 0.5;
      const strike = Math.round(price * strikeMultiplier * 100) / 100;

      // Premium estimate: ~2% of stock price for 30-day options
      const premiumRate = 0.02;
      const contracts = Math.floor(
        (state.cash * (config.maxWeeklyAllocation || 0.25)) / (strike * 100),
      );

      if (contracts <= 0) return;

      const premium = contracts * 100 * price * premiumRate;

      // Add expiration date (30 days)
      const expiration = new Date(date);
      expiration.setDate(expiration.getDate() + (config.expirationDays || 30));

      const trade: SimulatedTrade = {
        date: dateStr,
        type: isCall ? 'sell_call' : 'sell_put',
        strike,
        premium,
        contracts,
        expiration: expiration.toISOString().split('T')[0],
        result: 'win', // Placeholder
        pnl: 0,
        underlyingPrice: price,
        delta,
      };

      state.openTrades.push(trade);
      state.premiumsReceived += premium;
      state.cash += premium;
    }
  }

  private calculateTotalEquity(state: BacktestState, date: Date, data: HistoricalData): number {
    const dateStr = date.toISOString().split('T')[0];
    const price = data.priceMap.get(dateStr) || 0;

    const sharesValue = state.sharesHeld * price;
    return state.cash + state.selicPrincipal + sharesValue;
  }

  private calculateDailyReturn(equityCurve: EquityCurvePoint[], currentEquity: number): number {
    if (equityCurve.length === 0) return 0;
    const previousEquity = equityCurve[equityCurve.length - 1].equity;
    return ((currentEquity - previousEquity) / previousEquity) * 100;
  }

  private calculateDrawdown(equityCurve: EquityCurvePoint[], currentEquity: number): number {
    if (equityCurve.length === 0) return 0;

    const peak = Math.max(...equityCurve.map((p) => p.equity), currentEquity);
    return ((peak - currentEquity) / peak) * 100;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - Metrics Calculation
  // ─────────────────────────────────────────────────────────────────────────

  private calculateFinalMetrics(
    state: BacktestState,
    initialCapital: number,
  ): {
    finalCapital: number;
    totalReturn: number;
    totalReturnPercent: number;
    cagr: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    maxDrawdownDays: number;
    winRate: number;
    profitFactor: number;
    calmarRatio: number;
  } {
    const finalEquity =
      state.equityCurve.length > 0
        ? state.equityCurve[state.equityCurve.length - 1].equity
        : initialCapital;
    const totalReturn = finalEquity - initialCapital;
    const totalReturnPercent = (totalReturn / initialCapital) * 100;

    // Calculate years
    const days = state.equityCurve.length;
    const years = days / this.TRADING_DAYS_PER_YEAR;

    // CAGR
    const cagr = years > 0 ? (Math.pow(finalEquity / initialCapital, 1 / years) - 1) * 100 : 0;

    // Daily returns
    const dailyReturns = state.equityCurve.map((p) => p.dailyReturn / 100);

    // Sharpe Ratio
    const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length || 0;
    const riskFreeRate = this.DEFAULT_SELIC_RATE / this.TRADING_DAYS_PER_YEAR;
    const excessReturn = avgReturn - riskFreeRate;
    const stdDev = this.calculateStdDev(dailyReturns);
    const sharpeRatio =
      stdDev > 0 ? (excessReturn / stdDev) * Math.sqrt(this.TRADING_DAYS_PER_YEAR) : 0;

    // Sortino Ratio
    const negativeReturns = dailyReturns.filter((r) => r < 0);
    const downsideStdDev = this.calculateStdDev(negativeReturns);
    const sortinoRatio =
      downsideStdDev > 0
        ? (excessReturn / downsideStdDev) * Math.sqrt(this.TRADING_DAYS_PER_YEAR)
        : 0;

    // Max Drawdown
    const { maxDrawdown, maxDrawdownDays } = this.calculateMaxDrawdownWithDays(state.equityCurve);

    // Win Rate
    const trades = state.closedTrades;
    const winningTrades = trades.filter((t) => t.result === 'win').length;
    const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

    // Profit Factor
    const grossProfit = trades.filter((t) => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(trades.filter((t) => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;

    // Calmar Ratio
    const calmarRatio = maxDrawdown > 0 ? cagr / maxDrawdown : 0;

    return {
      finalCapital: finalEquity,
      totalReturn,
      totalReturnPercent,
      cagr,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      maxDrawdownDays,
      winRate,
      profitFactor,
      calmarRatio,
    };
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  private calculateMaxDrawdownWithDays(equityCurve: EquityCurvePoint[]): {
    maxDrawdown: number;
    maxDrawdownDays: number;
  } {
    let maxDrawdown = 0;
    let maxDrawdownDays = 0;
    let peak = equityCurve[0]?.equity || 0;
    let drawdownStart = 0;

    for (let i = 0; i < equityCurve.length; i++) {
      const equity = equityCurve[i].equity;

      if (equity > peak) {
        peak = equity;
        drawdownStart = i;
      }

      const drawdown = ((peak - equity) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownDays = i - drawdownStart;
      }
    }

    return { maxDrawdown, maxDrawdownDays };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Private Methods - DTO Mapping
  // ─────────────────────────────────────────────────────────────────────────

  private mapToResultDto(backtest: BacktestResult): BacktestResultDto {
    const totalIncome =
      Number(backtest.premiumIncome) +
      Number(backtest.dividendIncome) +
      Number(backtest.lendingIncome) +
      Number(backtest.selicIncome);

    return {
      id: backtest.id,
      userId: backtest.userId,
      assetId: backtest.assetId,
      ticker: backtest.asset?.ticker || '',
      name: backtest.name,
      startDate: backtest.startDate.toISOString().split('T')[0],
      endDate: backtest.endDate.toISOString().split('T')[0],
      status: backtest.status,
      progress: backtest.progress || 0,
      initialCapital: backtest.initialCapital,
      finalCapital: backtest.finalCapital,
      totalReturn: backtest.totalReturn,
      totalReturnPercent: backtest.totalReturnPercent,
      config: backtest.config,
      riskMetrics: {
        cagr: backtest.cagr,
        sharpeRatio: backtest.sharpeRatio,
        sortinoRatio: backtest.sortinoRatio,
        maxDrawdown: backtest.maxDrawdown,
        maxDrawdownDays: backtest.maxDrawdownDays,
        winRate: backtest.winRate,
        profitFactor: backtest.profitFactor,
        calmarRatio: backtest.calmarRatio ?? null,
      },
      tradeStats: {
        totalTrades: backtest.totalTrades,
        winningTrades: backtest.winningTrades,
        losingTrades: backtest.losingTrades,
        exercises: backtest.exercises,
        averageProfit: new Decimal(
          this.calculateAverageProfit(backtest.simulatedTrades).toFixed(2),
        ),
        averageLoss: new Decimal(this.calculateAverageLoss(backtest.simulatedTrades).toFixed(2)),
        maxProfit: new Decimal(this.calculateMaxProfit(backtest.simulatedTrades).toFixed(2)),
        maxLoss: new Decimal(this.calculateMaxLoss(backtest.simulatedTrades).toFixed(2)),
      },
      incomeBreakdown: {
        premiumIncome: backtest.premiumIncome,
        dividendIncome: backtest.dividendIncome,
        lendingIncome: backtest.lendingIncome,
        selicIncome: backtest.selicIncome,
        total: new Decimal(totalIncome.toFixed(2)),
        premiumPercent: new Decimal(
          totalIncome > 0 ? ((Number(backtest.premiumIncome) / totalIncome) * 100).toFixed(2) : '0',
        ),
        dividendPercent: new Decimal(
          totalIncome > 0
            ? ((Number(backtest.dividendIncome) / totalIncome) * 100).toFixed(2)
            : '0',
        ),
        lendingPercent: new Decimal(
          totalIncome > 0 ? ((Number(backtest.lendingIncome) / totalIncome) * 100).toFixed(2) : '0',
        ),
        selicPercent: new Decimal(
          totalIncome > 0 ? ((Number(backtest.selicIncome) / totalIncome) * 100).toFixed(2) : '0',
        ),
      },
      equityCurve: backtest.equityCurve,
      simulatedTrades: backtest.simulatedTrades,
      executionTime: backtest.executionTime ?? null,
      errorMessage: backtest.errorMessage,
      createdAt: backtest.createdAt,
      updatedAt: backtest.updatedAt,
    };
  }

  private mapToSummaryDto(backtest: BacktestResult): BacktestSummaryDto {
    const startStr = backtest.startDate.toISOString().split('T')[0];
    const endStr = backtest.endDate.toISOString().split('T')[0];

    return {
      id: backtest.id,
      name: backtest.name,
      ticker: backtest.asset?.ticker || '',
      status: backtest.status,
      period: `${startStr} - ${endStr}`,
      initialCapital: backtest.initialCapital,
      finalCapital: backtest.finalCapital,
      totalReturnPercent: backtest.totalReturnPercent,
      cagr: backtest.cagr,
      sharpeRatio: backtest.sharpeRatio,
      maxDrawdown: backtest.maxDrawdown,
      createdAt: backtest.createdAt,
    };
  }

  private calculateAverageProfit(trades: SimulatedTrade[]): number {
    const profits = trades.filter((t) => t.pnl > 0).map((t) => t.pnl);
    return profits.length > 0 ? profits.reduce((a, b) => a + b, 0) / profits.length : 0;
  }

  private calculateAverageLoss(trades: SimulatedTrade[]): number {
    const losses = trades.filter((t) => t.pnl < 0).map((t) => Math.abs(t.pnl));
    return losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
  }

  private calculateMaxProfit(trades: SimulatedTrade[]): number {
    const profits = trades.filter((t) => t.pnl > 0).map((t) => t.pnl);
    return profits.length > 0 ? Math.max(...profits) : 0;
  }

  private calculateMaxLoss(trades: SimulatedTrade[]): number {
    const losses = trades.filter((t) => t.pnl < 0).map((t) => Math.abs(t.pnl));
    return losses.length > 0 ? Math.max(...losses) : 0;
  }
}
