import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Asset } from './asset.entity';

/**
 * Enum for intraday timeframes
 * Aligned with TradingView conventions
 */
export enum IntradayTimeframe {
  M1 = '1m', // 1 minute
  M5 = '5m', // 5 minutes
  M15 = '15m', // 15 minutes
  M30 = '30m', // 30 minutes
  H1 = '1h', // 1 hour
  H4 = '4h', // 4 hours
}

/**
 * Enum for intraday data sources
 */
export enum IntradaySource {
  YAHOO = 'yahoo',
  BRAPI = 'brapi',
  TRADINGVIEW = 'tradingview',
  B3 = 'b3',
}

/**
 * IntradayPrice Entity - High frequency price data
 *
 * IMPORTANTE: Esta tabela será convertida em TimescaleDB Hypertable
 * para suportar grandes volumes de dados de alta frequência.
 *
 * Particionamento: Por timestamp (automático pelo TimescaleDB)
 * Retenção: Configurável via TimescaleDB policies
 *
 * Capacidade estimada:
 * - 1 minuto: ~400 candles/dia/ativo × 861 ativos = 344.400 registros/dia
 * - Com compressão TimescaleDB: ~10x redução de espaço
 */
@Entity('intraday_prices')
@Index(['assetId', 'timestamp']) // Índice composto para queries por ativo + período
@Index(['timestamp']) // Índice para range queries
@Index(['timeframe']) // Índice para filtrar por timeframe
export class IntradayPrice {
  /**
   * Composite primary key: asset_id + timestamp + timeframe
   * TimescaleDB hypertable não suporta UUID como PK bem
   */
  @Column({ name: 'asset_id', primary: true })
  assetId: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  /**
   * Timestamp do candle (início do período)
   * Timezone: America/Sao_Paulo (B3)
   */
  @Column({ type: 'timestamptz', primary: true })
  timestamp: Date;

  /**
   * Timeframe do candle
   */
  @Column({
    type: 'enum',
    enum: IntradayTimeframe,
    primary: true,
  })
  timeframe: IntradayTimeframe;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  open: number;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  high: number;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  low: number;

  @Column({ type: 'decimal', precision: 18, scale: 4 })
  close: number;

  @Column({ type: 'bigint' })
  volume: number;

  /**
   * Volume financeiro em BRL
   */
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'volume_financial', nullable: true })
  volumeFinancial: number;

  /**
   * Número de negócios no período
   */
  @Column({ name: 'number_of_trades', nullable: true })
  numberOfTrades: number;

  /**
   * VWAP (Volume Weighted Average Price) do período
   */
  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  vwap: number;

  /**
   * Fonte dos dados para auditoria
   */
  @Column({
    type: 'enum',
    enum: IntradaySource,
    nullable: false,
  })
  source: IntradaySource;

  /**
   * Timestamp de coleta para auditoria
   */
  @Column({ name: 'collected_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  collectedAt: Date;
}
