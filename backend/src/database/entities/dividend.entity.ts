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
 * Tipo de provento
 */
export enum DividendType {
  DIVIDENDO = 'dividendo',
  JCP = 'jcp', // Juros sobre Capital Próprio
  BONUS = 'bonus',
  RENDIMENTO = 'rendimento',
  FRACAO = 'fracao', // Venda de frações (split)
  SUBSCRICAO = 'subscricao',
}

/**
 * Status do pagamento
 */
export enum DividendStatus {
  ANUNCIADO = 'anunciado', // Aprovado mas não pago
  PAGO = 'pago', // Já foi creditado
  PROJETADO = 'projetado', // Estimativa futura
}

/**
 * Dividend Entity - Histórico de Proventos
 *
 * Armazena todos os proventos (dividendos, JCP, bonificações) de ativos B3
 * com rastreamento de datas-ex, pagamento e valores brutos/líquidos.
 *
 * Usado na estratégia WHEEL para:
 * - Calcular yield histórico
 * - Projetar dividendos futuros
 * - Identificar datas-ex para ajuste de posições
 *
 * @entity dividends
 * @created 2025-12-21
 */
@Entity('dividends')
@Index('IDX_DIVIDEND_ASSET_DATA_EX', ['assetId', 'dataEx'])
@Index('IDX_DIVIDEND_ASSET_DATA_PAGAMENTO', ['assetId', 'dataPagamento'])
@Index('IDX_DIVIDEND_TIPO', ['tipo'])
@Index('IDX_DIVIDEND_STATUS', ['status'])
@Index('IDX_DIVIDEND_DATA_EX', ['dataEx'])
export class Dividend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'asset_id' })
  assetId: string;

  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  /**
   * Tipo de provento
   */
  @Column({
    type: 'enum',
    enum: DividendType,
    comment: 'Tipo de provento: dividendo, jcp, bonus, etc.',
  })
  tipo: DividendType;

  /**
   * Status do pagamento
   */
  @Column({
    type: 'enum',
    enum: DividendStatus,
    default: DividendStatus.ANUNCIADO,
    comment: 'Status: anunciado, pago ou projetado',
  })
  status: DividendStatus;

  /**
   * Valor bruto por ação (antes de impostos)
   * @precision 18 digits, 8 decimals para valores pequenos
   * @type Decimal.js para precisão perfeita (CLAUDE.md Financial Data Rules)
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8,
    name: 'valor_bruto',
    comment: 'Valor bruto por ação (antes de IR)',
    transformer: new DecimalTransformer(),
  })
  valorBruto: Decimal;

  /**
   * Valor líquido por ação (após impostos)
   * JCP: 15% IR retido na fonte
   * Dividendos: isentos para PF
   * @type Decimal.js para precisão perfeita (CLAUDE.md Financial Data Rules)
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8,
    name: 'valor_liquido',
    nullable: true,
    comment: 'Valor líquido por ação (após IR)',
    transformer: new DecimalTransformer(),
  })
  valorLiquido: Decimal | null;

  /**
   * Imposto retido na fonte
   * JCP: 15% IR, Dividendos: 0%
   * @type Decimal.js para precisão perfeita (CLAUDE.md Financial Data Rules)
   */
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 8,
    name: 'imposto_retido',
    nullable: true,
    default: 0,
    comment: 'Valor do IR retido na fonte (JCP: 15%)',
    transformer: new DecimalTransformer(),
  })
  impostoRetido: Decimal | null;

  /**
   * Data COM - última data para ter direito ao provento
   * Quem comprar após essa data NÃO recebe
   */
  @Column({
    type: 'date',
    name: 'data_com',
    nullable: true,
    comment: 'Data COM - última data para ter direito',
  })
  dataCom: Date;

  /**
   * Data EX - primeiro dia que a ação negocia sem direito ao provento
   * Geralmente D+1 da data COM
   */
  @Column({
    type: 'date',
    name: 'data_ex',
    comment: 'Data EX - ação negocia sem direito ao provento',
  })
  dataEx: Date;

  /**
   * Data de aprovação/anúncio em assembleia
   */
  @Column({
    type: 'date',
    name: 'data_aprovacao',
    nullable: true,
    comment: 'Data de aprovação em assembleia',
  })
  dataAprovacao: Date;

  /**
   * Data efetiva de pagamento
   */
  @Column({
    type: 'date',
    name: 'data_pagamento',
    nullable: true,
    comment: 'Data efetiva de pagamento/crédito',
  })
  dataPagamento: Date;

  /**
   * Data base para cálculo (referência do lucro)
   */
  @Column({
    type: 'date',
    name: 'data_base',
    nullable: true,
    comment: 'Data base para cálculo do provento',
  })
  dataBase: Date;

  /**
   * Frequência de distribuição
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Frequência: mensal, trimestral, semestral, anual, irregular',
  })
  frequencia: string;

  /**
   * Fonte dos dados
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Fonte: statusinvest, fundamentei, b3, etc.',
  })
  source: string;

  /**
   * Metadados adicionais
   */
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados: deliberacao, observacoes, etc.',
  })
  metadata: {
    deliberacao?: string; // Ata/documento de aprovação
    observacoes?: string;
    fatorAjuste?: number; // Para splits/inplits
    relacaoTroca?: string; // Para bonificações
    precoSubscricao?: number; // Para subscrições
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
