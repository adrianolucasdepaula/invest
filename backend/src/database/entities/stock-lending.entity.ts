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
import { DecimalTransformer } from '../transformers/decimal.transformer';

/**
 * StockLendingRate Entity - Taxas de Aluguel de Ações (BTC)
 *
 * Armazena histórico de taxas de aluguel do Banco de Títulos B3.
 * Usado na estratégia WHEEL para:
 * - Calcular renda adicional durante fase HOLDING_SHARES
 * - Estimar rendimento total da estratégia
 * - Comparar custo de oportunidade
 *
 * @entity stock_lending_rates
 * @created 2025-12-21
 */
@Entity('stock_lending_rates')
@Index('IDX_LENDING_ASSET_DATE', ['assetId', 'dataReferencia'], { unique: true })
@Index('IDX_LENDING_ASSET', ['assetId'])
@Index('IDX_LENDING_DATE', ['dataReferencia'])
@Index('IDX_LENDING_TAXA', ['taxaAluguelAno'])
export class StockLendingRate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'asset_id' })
  assetId: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  /**
   * Taxa média anual de aluguel (% a.a.)
   * Exemplo: 5.5000 = 5.5% ao ano
   * @type Decimal.js para precisão perfeita (CLAUDE.md Financial Data Rules)
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'taxa_aluguel_ano',
    comment: 'Taxa média anual em % (ex: 5.5000 = 5.5% a.a.)',
    transformer: new DecimalTransformer(),
  })
  taxaAluguelAno: Decimal;

  /**
   * Taxa diária calculada = taxa_ano / 252
   * Usado para cálculo de rendimento diário
   * @type Decimal.js para precisão perfeita (CLAUDE.md Financial Data Rules)
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
    name: 'taxa_aluguel_dia',
    nullable: true,
    comment: 'Taxa diária = taxa_ano / 252',
    transformer: new DecimalTransformer(),
  })
  taxaAluguelDia: Decimal | null;

  /**
   * Taxa mínima do dia (para range de negociação)
   * @type Decimal.js para precisão perfeita (CLAUDE.md Financial Data Rules)
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'taxa_min',
    nullable: true,
    comment: 'Taxa mínima negociada no dia',
    transformer: new DecimalTransformer(),
  })
  taxaMin: Decimal | null;

  /**
   * Taxa máxima do dia (para range de negociação)
   * @type Decimal.js para precisão perfeita (CLAUDE.md Financial Data Rules)
   */
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    name: 'taxa_max',
    nullable: true,
    comment: 'Taxa máxima negociada no dia',
    transformer: new DecimalTransformer(),
  })
  taxaMax: Decimal | null;

  /**
   * Quantidade de ações disponíveis para aluguel
   */
  @Column({
    type: 'bigint',
    name: 'quantidade_disponivel',
    nullable: true,
    comment: 'Quantidade disponível para aluguel',
  })
  quantidadeDisponivel: number;

  /**
   * Quantidade já alugada no mercado
   */
  @Column({
    type: 'bigint',
    name: 'quantidade_alugada',
    nullable: true,
    comment: 'Quantidade já alugada',
  })
  quantidadeAlugada: number;

  /**
   * Volume financeiro negociado no dia
   * @type Decimal.js para precisão perfeita (CLAUDE.md Financial Data Rules)
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'volume_financeiro',
    nullable: true,
    comment: 'Volume financeiro em R$',
    transformer: new DecimalTransformer(),
  })
  volumeFinanceiro: Decimal | null;

  /**
   * Data de referência da cotação
   */
  @Column({
    type: 'date',
    name: 'data_referencia',
    comment: 'Data de referência da taxa',
  })
  dataReferencia: Date;

  /**
   * Timestamp da coleta do dado
   */
  @Column({
    type: 'timestamp',
    name: 'data_coleta',
    nullable: true,
    comment: 'Data/hora da coleta do dado',
  })
  dataColeta: Date;

  /**
   * Fonte dos dados
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Fonte: STATUSINVEST, B3_BTC, TRADEMAP, etc.',
  })
  source: string;

  /**
   * Metadados adicionais
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados: custodiante, prazo, tipo contrato',
  })
  metadata: {
    custodiante?: string; // B3, Clear, XP, etc
    prazoMedio?: number; // Prazo médio em dias
    tipoContrato?: string; // D+0, D+1, termo
    openInterest?: number; // Contratos em aberto
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
