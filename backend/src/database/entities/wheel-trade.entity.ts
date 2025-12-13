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
import { WheelStrategy } from './wheel-strategy.entity';

/**
 * Tipo de operação WHEEL
 */
export enum WheelTradeType {
  SELL_PUT = 'sell_put',           // Venda de PUT
  SELL_CALL = 'sell_call',         // Venda de CALL coberta
  BUY_PUT = 'buy_put',             // Compra de PUT (fechamento)
  BUY_CALL = 'buy_call',           // Compra de CALL (fechamento)
  EXERCISE_PUT = 'exercise_put',   // Exercício de PUT (compra de ações)
  EXERCISE_CALL = 'exercise_call', // Exercício de CALL (venda de ações)
}

/**
 * Status do trade
 */
export enum WheelTradeStatus {
  OPEN = 'open',           // Posição aberta
  CLOSED = 'closed',       // Fechada antes do vencimento
  EXERCISED = 'exercised', // Exercida no vencimento
  EXPIRED = 'expired',     // Expirou OTM (lucro máximo para vendedor)
}

@Entity('wheel_trades')
@Index(['strategyId', 'status'])
@Index(['optionSymbol'])
@Index(['expiration'])
@Index(['tradeType', 'status'])
export class WheelTrade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'strategy_id' })
  strategyId: string;

  @ManyToOne(() => WheelStrategy, (strategy) => strategy.trades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'strategy_id' })
  strategy: WheelStrategy;

  @Column({
    type: 'enum',
    enum: WheelTradeType,
  })
  tradeType: WheelTradeType;

  @Column({
    type: 'enum',
    enum: WheelTradeStatus,
    default: WheelTradeStatus.OPEN,
  })
  status: WheelTradeStatus;

  // Dados da opção
  @Column({ type: 'varchar', length: 20, name: 'option_symbol' })
  optionSymbol: string;

  @Column({ type: 'varchar', length: 10, name: 'underlying_ticker' })
  underlyingTicker: string;

  @Column({ type: 'varchar', length: 10, name: 'option_type' })
  optionType: string; // 'CALL' ou 'PUT'

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  strike: number;

  @Column({ type: 'date' })
  expiration: Date;

  @Column({ type: 'int', name: 'days_to_expiration', nullable: true })
  daysToExpiration: number;

  // Quantidade
  @Column({ type: 'int' })
  contracts: number;

  @Column({ type: 'int', name: 'shares_per_contract', default: 100 })
  sharesPerContract: number;

  // Preços
  @Column({ type: 'decimal', precision: 18, scale: 8, name: 'entry_price' })
  entryPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, name: 'exit_price', nullable: true })
  exitPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, name: 'underlying_price_at_entry' })
  underlyingPriceAtEntry: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, name: 'underlying_price_at_exit', nullable: true })
  underlyingPriceAtExit: number;

  // Prêmios
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'premium_received', default: 0 })
  premiumReceived: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'premium_paid', default: 0 })
  premiumPaid: number;

  // Greeks no momento da entrada
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  delta: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  gamma: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  theta: number;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  vega: number;

  // IV no momento da entrada
  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'iv_at_entry', nullable: true })
  ivAtEntry: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'iv_rank_at_entry', nullable: true })
  ivRankAtEntry: number;

  // P&L
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'realized_pnl', default: 0 })
  realizedPnL: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'unrealized_pnl', default: 0 })
  unrealizedPnL: number;

  // Taxas
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'commission', default: 0 })
  commission: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'b3_fees', default: 0 })
  b3Fees: number;

  // Rendimento anualizado
  @Column({ type: 'decimal', precision: 10, scale: 4, name: 'annualized_return', nullable: true })
  annualizedReturn: number;

  // Semana de distribuição (1-4 para weekly PUT schedule)
  @Column({ type: 'int', name: 'distribution_week', nullable: true })
  distributionWeek: number;

  // Notas
  @Column({ type: 'text', nullable: true })
  notes: string;

  // Timestamps
  @Column({ type: 'timestamp', name: 'opened_at' })
  openedAt: Date;

  @Column({ type: 'timestamp', name: 'closed_at', nullable: true })
  closedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Metadata adicional
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    moneyness?: string;      // ITM, ATM, OTM
    openInterest?: number;
    volume?: number;
    bidAtEntry?: number;
    askAtEntry?: number;
    spreadPercent?: number;
    fundamentals?: {
      roe?: number;
      dividendYield?: number;
      dividaEbitda?: number;
    };
  };
}
