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
import type { FieldSourcesMap } from '../../scrapers/interfaces/field-source.interface';

@Entity('fundamental_data')
@Index(['asset', 'referenceDate'])
export class FundamentalData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset, (asset) => asset.fundamentalData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'asset_id' })
  assetId: string;

  @Column({ type: 'date', name: 'reference_date' })
  referenceDate: Date;

  // Valuation Indicators
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  pl: Decimal | null; // P/L - Preço/Lucro

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  pvp: Decimal | null; // P/VP - Preço/Valor Patrimonial

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  psr: Decimal | null; // P/SR - Preço/Receita

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'p_ativos', nullable: true, transformer: new DecimalTransformer() })
  pAtivos: Decimal | null; // P/Ativos

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'p_capital_giro', nullable: true, transformer: new DecimalTransformer() })
  pCapitalGiro: Decimal | null; // P/Capital de Giro

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'p_ebit', nullable: true, transformer: new DecimalTransformer() })
  pEbit: Decimal | null; // P/EBIT

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'ev_ebit', nullable: true, transformer: new DecimalTransformer() })
  evEbit: Decimal | null; // EV/EBIT

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'ev_ebitda', nullable: true, transformer: new DecimalTransformer() })
  evEbitda: Decimal | null; // EV/EBITDA

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'peg_ratio', nullable: true, transformer: new DecimalTransformer() })
  pegRatio: Decimal | null; // PEG Ratio

  // Debt Indicators
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'divida_liquida_patrimonio',
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  dividaLiquidaPatrimonio: Decimal | null;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'divida_liquida_ebitda',
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  dividaLiquidaEbitda: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'divida_liquida_ebit', nullable: true, transformer: new DecimalTransformer() })
  dividaLiquidaEbit: Decimal | null;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    name: 'patrimonio_liquido_ativos',
    nullable: true,
    transformer: new DecimalTransformer(),
  })
  patrimonioLiquidoAtivos: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'passivos_ativos', nullable: true, transformer: new DecimalTransformer() })
  passivosAtivos: Decimal | null;

  // Efficiency Indicators
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'margem_bruta', nullable: true, transformer: new DecimalTransformer() })
  margemBruta: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'margem_ebit', nullable: true, transformer: new DecimalTransformer() })
  margemEbit: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'margem_ebitda', nullable: true, transformer: new DecimalTransformer() })
  margemEbitda: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'margem_liquida', nullable: true, transformer: new DecimalTransformer() })
  margemLiquida: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  roe: Decimal | null; // Return on Equity

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  roa: Decimal | null; // Return on Assets

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  roic: Decimal | null; // Return on Invested Capital

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'giro_ativos', nullable: true, transformer: new DecimalTransformer() })
  giroAtivos: Decimal | null;

  // Growth Indicators
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'cagr_receitas_5anos', nullable: true, transformer: new DecimalTransformer() })
  cagrReceitas5anos: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'cagr_lucros_5anos', nullable: true, transformer: new DecimalTransformer() })
  cagrLucros5anos: Decimal | null;

  // Dividend Indicators
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'dividend_yield', nullable: true, transformer: new DecimalTransformer() })
  dividendYield: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  payout: Decimal | null;

  // Financial Statement Data (in millions)
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'receita_liquida', nullable: true, transformer: new DecimalTransformer() })
  receitaLiquida: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  ebit: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  ebitda: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'lucro_liquido', nullable: true, transformer: new DecimalTransformer() })
  lucroLiquido: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'patrimonio_liquido', nullable: true, transformer: new DecimalTransformer() })
  patrimonioLiquido: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'ativo_total', nullable: true, transformer: new DecimalTransformer() })
  ativoTotal: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'divida_bruta', nullable: true, transformer: new DecimalTransformer() })
  dividaBruta: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'divida_liquida', nullable: true, transformer: new DecimalTransformer() })
  dividaLiquida: Decimal | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'disponibilidades', nullable: true, transformer: new DecimalTransformer() })
  disponibilidades: Decimal | null;

  // Per Share Indicators
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  lpa: Decimal | null; // Lucro por Acao

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true, transformer: new DecimalTransformer() })
  vpa: Decimal | null; // Valor Patrimonial por Acao

  // Liquidity Indicators
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'liquidez_corrente', nullable: true, transformer: new DecimalTransformer() })
  liquidezCorrente: Decimal | null; // Liquidez Corrente

  // Governance Indicator - Tag Along (FASE 101.4 - Wheel Turbinada)
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    name: 'tag_along',
    nullable: true,
    comment: 'Tag Along % - protecao minoritarios (0-100)',
    transformer: new DecimalTransformer(),
  })
  tagAlong: Decimal | null;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  /**
   * Rastreamento de origem por campo
   *
   * FASE 1.2 - Sistema de Rastreamento de Fontes
   *
   * Estrutura:
   * {
   *   "pl": {
   *     "values": [
   *       {"source": "fundamentus", "value": 5.42, "scrapedAt": "2025-12-02T10:30:00Z"},
   *       {"source": "statusinvest", "value": 5.45, "scrapedAt": "2025-12-02T10:30:00Z"}
   *     ],
   *     "finalValue": 5.42,
   *     "finalSource": "fundamentus",
   *     "sourcesCount": 2,
   *     "variance": 0.012,
   *     "consensus": 95.5
   *   }
   * }
   */
  @Column({ type: 'jsonb', name: 'field_sources', nullable: true, default: () => "'{}'" })
  fieldSources: FieldSourcesMap;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
