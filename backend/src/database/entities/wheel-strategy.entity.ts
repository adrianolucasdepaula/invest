import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Asset } from './asset.entity';
import { User } from './user.entity';
import { WheelTrade } from './wheel-trade.entity';

/**
 * Fases da estratégia WHEEL
 * SELLING_PUTS: Vendendo PUTs com dinheiro em renda fixa
 * HOLDING_SHARES: Ações exercidas em carteira (disponíveis para aluguel)
 * SELLING_CALLS: Vendendo CALLs cobertas sobre as ações
 */
export enum WheelPhase {
  SELLING_PUTS = 'selling_puts',
  HOLDING_SHARES = 'holding_shares',
  SELLING_CALLS = 'selling_calls',
}

/**
 * Tendência de mercado para ajustar a estratégia
 */
export enum MarketTrend {
  BULLISH = 'bullish',
  BEARISH = 'bearish',
  NEUTRAL = 'neutral',
}

/**
 * Status da estratégia WHEEL
 */
export enum WheelStrategyStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CLOSED = 'closed',
}

/**
 * Configurações da estratégia WHEEL
 */
export interface WheelConfig {
  // Filtros fundamentais
  minROE?: number;              // Default: 15%
  minDividendYield?: number;    // Default: 6%
  maxDividaEbitda?: number;     // Default: 2.0
  minMargemLiquida?: number;    // Default: 10%

  // Filtros de opções
  targetDelta?: number;         // Default: 0.15 (15 delta)
  minOpenInterest?: number;     // Default: 100
  minVolume?: number;           // Default: 50
  minIVRank?: number;           // Default: 30%
  expirationDays?: number;      // Default: 30 (mensal)

  // Distribuição de capital
  weeklyDistribution?: boolean; // Default: true (distribuir em 4 semanas)
  maxWeeklyAllocation?: number; // Default: 25% do notional

  // Regras de CALL coberta
  callAboveAvgPrice?: boolean;  // Em prejuízo: CALL acima do preço médio
  callAtMoney?: boolean;        // Em lucro: CALL na linha do dinheiro
}

@Entity('wheel_strategies')
@Index(['userId', 'status'])
@Index(['assetId', 'status'])
@Index(['phase'])
export class WheelStrategy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: WheelStrategyStatus,
    default: WheelStrategyStatus.ACTIVE,
  })
  status: WheelStrategyStatus;

  @Column({
    type: 'enum',
    enum: WheelPhase,
    default: WheelPhase.SELLING_PUTS,
  })
  phase: WheelPhase;

  @Column({
    type: 'enum',
    enum: MarketTrend,
    default: MarketTrend.NEUTRAL,
    name: 'market_trend',
  })
  marketTrend: MarketTrend;

  // Capital alocado
  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  notional: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'allocated_capital', default: 0 })
  allocatedCapital: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'available_capital', default: 0 })
  availableCapital: number;

  // Ações em carteira (quando exercido)
  @Column({ type: 'int', name: 'shares_held', default: 0 })
  sharesHeld: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, name: 'average_price', nullable: true })
  averagePrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'shares_total_cost', default: 0 })
  sharesTotalCost: number;

  // P&L acumulado
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'total_premium_received', default: 0 })
  totalPremiumReceived: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'total_premium_paid', default: 0 })
  totalPremiumPaid: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'realized_pnl', default: 0 })
  realizedPnL: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'unrealized_pnl', default: 0 })
  unrealizedPnL: number;

  // Rendimento do dinheiro em renda fixa
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'cash_yield', default: 0 })
  cashYield: number;

  // Dividendos recebidos das ações
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'dividends_received', default: 0 })
  dividendsReceived: number;

  // Configurações
  @Column({ type: 'jsonb', nullable: true })
  config: WheelConfig;

  // Estatísticas
  @Column({ type: 'int', name: 'total_trades', default: 0 })
  totalTrades: number;

  @Column({ type: 'int', name: 'winning_trades', default: 0 })
  winningTrades: number;

  @Column({ type: 'int', name: 'exercises', default: 0 })
  exercises: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', name: 'closed_at', nullable: true })
  closedAt: Date;

  // Relacionamentos
  @OneToMany(() => WheelTrade, (trade) => trade.strategy)
  trades: WheelTrade[];
}
