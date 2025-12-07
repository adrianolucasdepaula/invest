import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { News } from './news.entity';

/**
 * ProviderResult - Resultado individual de cada provider
 */
export interface ProviderResult {
  name: string;
  score: number;
  confidence: number;
  weight: number;
  agreed: boolean;
  isOutlier: boolean;
}

/**
 * ConsensusDetails - Detalhes do cálculo de consenso
 */
export interface ConsensusDetails {
  providers: ProviderResult[];
  outliers: string[];
  methodology: 'weighted_average' | 'median' | 'mode';
  standardDeviation: number;
  agreementThreshold: number;
}

/**
 * SentimentLabel - Rótulo de sentimento
 */
export enum SentimentLabel {
  VERY_BULLISH = 'very_bullish',
  BULLISH = 'bullish',
  SLIGHTLY_BULLISH = 'slightly_bullish',
  NEUTRAL = 'neutral',
  SLIGHTLY_BEARISH = 'slightly_bearish',
  BEARISH = 'bearish',
  VERY_BEARISH = 'very_bearish',
}

/**
 * SentimentConsensus - Resultado consolidado de cross-validation
 *
 * FASE 75: AI Sentiment Multi-Provider
 * Armazena o resultado final após cross-validation de múltiplos providers.
 *
 * Algoritmo de consenso:
 * 1. Weighted average baseado em provider reliability
 * 2. Outlier detection (> 2 std devs from mean)
 * 3. Recálculo sem outliers
 * 4. Confidence = agreement ratio * average confidence
 */
@Entity('sentiment_consensus')
@Index(['news'], { unique: true })
@Index(['finalSentiment'])
@Index(['sentimentLabel'])
@Index(['createdAt'])
export class SentimentConsensus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => News, (news) => news.consensus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'news_id' })
  news: News;

  @Column({ name: 'news_id' })
  newsId: string;

  @Column({ name: 'final_sentiment', type: 'decimal', precision: 5, scale: 4 })
  finalSentiment: number; // -1.0000 to +1.0000 (weighted consensus)

  @Column({
    name: 'sentiment_label',
    type: 'enum',
    enum: SentimentLabel,
  })
  sentimentLabel: SentimentLabel;

  @Column({ name: 'confidence_score', type: 'decimal', precision: 5, scale: 4 })
  confidenceScore: number; // 0.0000 to 1.0000

  @Column({ name: 'providers_count', type: 'int' })
  providersCount: number; // How many providers analyzed (max 6)

  @Column({ name: 'agreement_count', type: 'int' })
  agreementCount: number; // How many agreed with consensus

  @Column({ name: 'outliers_count', type: 'int', default: 0 })
  outliersCount: number; // How many were outliers

  @Column({ name: 'consensus_details', type: 'jsonb' })
  consensusDetails: ConsensusDetails;

  @Column({ name: 'is_high_confidence', default: false })
  isHighConfidence: boolean; // confidence >= 0.7 && agreementCount >= 3

  @Column({ name: 'processing_time', type: 'int', nullable: true })
  processingTime: number; // Total time for all providers + consensus (ms)

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
