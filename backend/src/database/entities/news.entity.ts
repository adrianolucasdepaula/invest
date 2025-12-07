import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Asset } from './asset.entity';
import { NewsAnalysis } from './news-analysis.entity';
import { SentimentConsensus } from './sentiment-consensus.entity';

/**
 * NewsSource - Fontes de notícias suportadas
 * @see PLANO_FASE_75_AI_SENTIMENT_MULTI_PROVIDER.md
 */
export enum NewsSource {
  GOOGLE_NEWS = 'google_news',
  INFOMONEY = 'infomoney',
  VALOR_ECONOMICO = 'valor_economico',
  ESTADAO = 'estadao',
  EXAME = 'exame',
  BLOOMBERG = 'bloomberg',
  INVESTING = 'investing',
  RSS = 'rss',
  OTHER = 'other',
}

/**
 * News - Entidade de notícias financeiras
 *
 * FASE 75: AI Sentiment Multi-Provider
 * Armazena notícias coletadas de múltiplas fontes para análise de sentimento.
 */
@Entity('news')
@Index(['ticker'])
@Index(['source'])
@Index(['publishedAt'])
@Index(['url'], { unique: true })
export class News {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Asset, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'asset_id' })
  asset: Asset;

  @Column({ name: 'asset_id', nullable: true })
  assetId: string;

  @Column()
  ticker: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ unique: true })
  url: string;

  @Column({
    type: 'enum',
    enum: NewsSource,
    default: NewsSource.OTHER,
  })
  source: NewsSource;

  @Column({ name: 'source_name', nullable: true })
  sourceName: string;

  @Column({ name: 'author', nullable: true })
  author: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'published_at', type: 'timestamp with time zone' })
  publishedAt: Date;

  @Column({ name: 'collected_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  collectedAt: Date;

  @Column({ name: 'is_analyzed', default: false })
  isAnalyzed: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => NewsAnalysis, (analysis) => analysis.news)
  analyses: NewsAnalysis[];

  @OneToOne(() => SentimentConsensus, (consensus) => consensus.news)
  consensus: SentimentConsensus;
}
