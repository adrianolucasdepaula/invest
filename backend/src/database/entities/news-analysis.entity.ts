import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { News } from './news.entity';

/**
 * AIProvider - Provedores de IA para análise de sentimento
 * @see PLANO_FASE_75_AI_SENTIMENT_MULTI_PROVIDER.md
 *
 * Modelos mais recentes (06/Dez/2025):
 * - OpenAI: GPT-5 (default)
 * - Anthropic: Claude Sonnet 4.5
 * - Google: Gemini 2.5 Pro
 * - DeepSeek: DeepSeek-V3.2
 * - xAI: Grok 4.1
 * - Perplexity: Sonar Pro
 */
export enum AIProvider {
  CHATGPT = 'chatgpt',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  DEEPSEEK = 'deepseek',
  GROK = 'grok',
  PERPLEXITY = 'perplexity',
}

/**
 * AnalysisStatus - Status da análise individual
 */
export enum NewsAnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
}

/**
 * KeyFactors - Fatores identificados na análise
 */
export interface KeyFactors {
  bullish: string[];
  bearish: string[];
  neutral: string[];
}

/**
 * NewsAnalysis - Análise de sentimento por provider de IA
 *
 * FASE 75: AI Sentiment Multi-Provider
 * Cada notícia pode ter até 6 análises (uma por provider).
 */
@Entity('news_analysis')
@Index(['news'])
@Index(['provider'])
@Index(['status'])
@Index(['createdAt'])
export class NewsAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => News, (news) => news.analyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'news_id' })
  news: News;

  @Column({ name: 'news_id' })
  newsId: string;

  @Column({
    type: 'enum',
    enum: AIProvider,
  })
  provider: AIProvider;

  @Column({ name: 'model_version', nullable: true })
  modelVersion: string;

  @Column({
    type: 'enum',
    enum: NewsAnalysisStatus,
    default: NewsAnalysisStatus.PENDING,
  })
  status: NewsAnalysisStatus;

  @Column({ name: 'sentiment_score', type: 'decimal', precision: 5, scale: 4, nullable: true })
  sentimentScore: number; // -1.0000 to +1.0000

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  confidence: number; // 0.0000 to 1.0000

  @Column({ name: 'analysis_text', type: 'text', nullable: true })
  analysisText: string;

  @Column({ name: 'key_factors', type: 'jsonb', nullable: true })
  keyFactors: KeyFactors;

  @Column({ name: 'raw_response', type: 'jsonb', nullable: true })
  rawResponse: Record<string, unknown>;

  @Column({ name: 'processing_time', type: 'int', nullable: true })
  processingTime: number; // in milliseconds

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ name: 'retry_count', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp with time zone', nullable: true })
  completedAt: Date;
}
