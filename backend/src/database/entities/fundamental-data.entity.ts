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
import { Asset } from './asset.entity';

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
  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  pl: number; // P/L - Preço/Lucro

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  pvp: number; // P/VP - Preço/Valor Patrimonial

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  psr: number; // P/SR - Preço/Receita

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'p_ativos', nullable: true })
  pAtivos: number; // P/Ativos

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'p_capital_giro', nullable: true })
  pCapitalGiro: number; // P/Capital de Giro

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'p_ebit', nullable: true })
  pEbit: number; // P/EBIT

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'ev_ebit', nullable: true })
  evEbit: number; // EV/EBIT

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'ev_ebitda', nullable: true })
  evEbitda: number; // EV/EBITDA

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'peg_ratio', nullable: true })
  pegRatio: number; // PEG Ratio

  // Debt Indicators
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'divida_liquida_patrimonio', nullable: true })
  dividaLiquidaPatrimonio: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'divida_liquida_ebitda', nullable: true })
  dividaLiquidaEbitda: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'divida_liquida_ebit', nullable: true })
  dividaLiquidaEbit: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'patrimonio_liquido_ativos', nullable: true })
  patrimonioLiquidoAtivos: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'passivos_ativos', nullable: true })
  passivosAtivos: number;

  // Efficiency Indicators
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'margem_bruta', nullable: true })
  margemBruta: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'margem_ebit', nullable: true })
  margemEbit: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'margem_ebitda', nullable: true })
  margemEbitda: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'margem_liquida', nullable: true })
  margemLiquida: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  roe: number; // Return on Equity

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  roa: number; // Return on Assets

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  roic: number; // Return on Invested Capital

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'giro_ativos', nullable: true })
  giroAtivos: number;

  // Growth Indicators
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'cagr_receitas_5anos', nullable: true })
  cagrReceitas5anos: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'cagr_lucros_5anos', nullable: true })
  cagrLucros5anos: number;

  // Dividend Indicators
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'dividend_yield', nullable: true })
  dividendYield: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  payout: number;

  // Financial Statement Data (in millions)
  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'receita_liquida', nullable: true })
  receitaLiquida: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  ebit: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  ebitda: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'lucro_liquido', nullable: true })
  lucroLiquido: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'patrimonio_liquido', nullable: true })
  patrimonioLiquido: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'ativo_total', nullable: true })
  ativoTotal: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'divida_bruta', nullable: true })
  dividaBruta: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'divida_liquida', nullable: true })
  dividaLiquida: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, name: 'disponibilidades', nullable: true })
  disponibilidades: number;

  // Additional metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
