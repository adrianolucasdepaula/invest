import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import Decimal from 'decimal.js';
import { Asset } from './asset.entity';
import { User } from './user.entity';
import { DecimalTransformer } from '../transformers/decimal.transformer';

/**
 * Backtest Configuration Interface
 */
export interface BacktestConfig {
  initialCapital: number;
  targetDelta: number;
  minROE: number;
  minDividendYield: number;
  maxDebtEbitda: number;
  minMargemLiquida?: number;
  expirationDays?: number;
  weeklyDistribution: boolean;
  maxWeeklyAllocation?: number;
  reinvestDividends: boolean;
  includeLendingIncome: boolean;
}

/**
 * Equity Curve Point Interface
 */
export interface EquityCurvePoint {
  date: string;
  equity: number;
  dailyReturn: number;
  cumulativeReturn: number;
  drawdown: number;
}

/**
 * Simulated Trade Interface
 */
export interface SimulatedTrade {
  date: string;
  type: 'sell_put' | 'sell_call' | 'exercise_put' | 'exercise_call';
  strike: number;
  premium: number;
  contracts?: number;
  expiration: string;
  result: 'win' | 'loss' | 'exercise';
  pnl: number;
  underlyingPrice?: number;
  delta?: number;
}

/**
 * Backtest Status Enum
 */
export enum BacktestStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * BacktestResult Entity
 *
 * Armazena resultados de backtests da estratégia WHEEL.
 * Inclui métricas de performance, equity curve e trades simulados.
 *
 * @created 2025-12-21
 * @phase FASE 101 - Wheel Turbinada (Backtesting Engine)
 */
@Entity('backtest_results')
@Index('IDX_BACKTEST_USER', ['userId'])
@Index('IDX_BACKTEST_ASSET', ['assetId'])
@Index('IDX_BACKTEST_STATUS', ['status'])
@Index('IDX_BACKTEST_CREATED', ['createdAt'])
export class BacktestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ─────────────────────────────────────────────────────────────────
  // Foreign Keys
  // ─────────────────────────────────────────────────────────────────

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'asset_id' })
  assetId: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  // ─────────────────────────────────────────────────────────────────
  // Basic Info
  // ─────────────────────────────────────────────────────────────────

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'date', name: 'start_date' })
  startDate: Date;

  @Column({ type: 'date', name: 'end_date' })
  endDate: Date;

  // ─────────────────────────────────────────────────────────────────
  // Configuration (JSONB)
  // ─────────────────────────────────────────────────────────────────

  @Column({ type: 'jsonb' })
  config: BacktestConfig;

  // ─────────────────────────────────────────────────────────────────
  // Capital & Returns
  // ─────────────────────────────────────────────────────────────────

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'initial_capital',
    transformer: new DecimalTransformer(),
  })
  initialCapital: Decimal;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'final_capital',
    transformer: new DecimalTransformer(),
  })
  finalCapital: Decimal;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'total_return',
    transformer: new DecimalTransformer(),
  })
  totalReturn: Decimal;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'total_return_percent',
    transformer: new DecimalTransformer(),
  })
  totalReturnPercent: Decimal;

  // ─────────────────────────────────────────────────────────────────
  // Risk Metrics
  // ─────────────────────────────────────────────────────────────────

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    comment: 'Compound Annual Growth Rate (%)',
    transformer: new DecimalTransformer(),
  })
  cagr: Decimal;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'sharpe_ratio',
    comment: 'Sharpe Ratio (risk-adjusted return)',
    transformer: new DecimalTransformer(),
  })
  sharpeRatio: Decimal;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'sortino_ratio',
    comment: 'Sortino Ratio (downside risk-adjusted)',
    transformer: new DecimalTransformer(),
  })
  sortinoRatio: Decimal;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'max_drawdown',
    comment: 'Maximum Drawdown (%)',
    transformer: new DecimalTransformer(),
  })
  maxDrawdown: Decimal;

  @Column({
    type: 'int',
    name: 'max_drawdown_days',
    comment: 'Days in max drawdown',
  })
  maxDrawdownDays: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'win_rate',
    comment: 'Win Rate (%)',
    transformer: new DecimalTransformer(),
  })
  winRate: Decimal;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'profit_factor',
    comment: 'Profit Factor (gross profit / gross loss)',
    transformer: new DecimalTransformer(),
  })
  profitFactor: Decimal;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'calmar_ratio',
    nullable: true,
    comment: 'Calmar Ratio (CAGR / MaxDD)',
    transformer: new DecimalTransformer(),
  })
  calmarRatio: Decimal | null;

  // ─────────────────────────────────────────────────────────────────
  // Trade Statistics
  // ─────────────────────────────────────────────────────────────────

  @Column({ type: 'int', name: 'total_trades' })
  totalTrades: number;

  @Column({ type: 'int', name: 'winning_trades' })
  winningTrades: number;

  @Column({ type: 'int', name: 'losing_trades' })
  losingTrades: number;

  @Column({
    type: 'int',
    comment: 'Number of option exercises (PUT or CALL)',
  })
  exercises: number;

  // ─────────────────────────────────────────────────────────────────
  // Income Breakdown
  // ─────────────────────────────────────────────────────────────────

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'premium_income',
    comment: 'Total income from option premiums (R$)',
    transformer: new DecimalTransformer(),
  })
  premiumIncome: Decimal;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'dividend_income',
    comment: 'Total income from dividends/JCP (R$)',
    transformer: new DecimalTransformer(),
  })
  dividendIncome: Decimal;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'lending_income',
    comment: 'Total income from stock lending (R$)',
    transformer: new DecimalTransformer(),
  })
  lendingIncome: Decimal;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'selic_income',
    comment: 'Total income from Selic (collateral) (R$)',
    transformer: new DecimalTransformer(),
  })
  selicIncome: Decimal;

  // ─────────────────────────────────────────────────────────────────
  // Detailed Results (JSONB)
  // ─────────────────────────────────────────────────────────────────

  @Column({
    type: 'jsonb',
    name: 'equity_curve',
    comment: 'Daily equity curve for charting',
  })
  equityCurve: EquityCurvePoint[];

  @Column({
    type: 'jsonb',
    name: 'simulated_trades',
    comment: 'All simulated trades during backtest',
  })
  simulatedTrades: SimulatedTrade[];

  // ─────────────────────────────────────────────────────────────────
  // Status & Metadata
  // ─────────────────────────────────────────────────────────────────

  @Column({
    type: 'varchar',
    length: 20,
    default: BacktestStatus.RUNNING,
  })
  status: BacktestStatus;

  @Column({
    type: 'text',
    name: 'error_message',
    nullable: true,
    comment: 'Error message if status is FAILED',
  })
  errorMessage: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Progress percentage (0-100)',
  })
  progress: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'execution_time',
    nullable: true,
    comment: 'Execution time in seconds',
    transformer: new DecimalTransformer(),
  })
  executionTime: Decimal | null;

  // ─────────────────────────────────────────────────────────────────
  // Timestamps
  // ─────────────────────────────────────────────────────────────────

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
