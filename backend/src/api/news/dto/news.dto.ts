import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsUUID,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NewsSource, AIProvider, SentimentLabel } from '../../../database/entities';

/**
 * DTO para buscar notícias com filtros
 */
export class GetNewsQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por ticker' })
  @IsOptional()
  @IsString()
  ticker?: string;

  @ApiPropertyOptional({ enum: NewsSource, description: 'Filtrar por fonte' })
  @IsOptional()
  @IsEnum(NewsSource)
  source?: NewsSource;

  @ApiPropertyOptional({ description: 'Apenas notícias analisadas' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isAnalyzed?: boolean;

  @ApiPropertyOptional({ description: 'Data inicial (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Limite de resultados', default: 50 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(500)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Offset para paginação', default: 0 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  offset?: number = 0;
}

/**
 * DTO para resumo de sentimento (DEVE vir antes de NewsResponseDto)
 */
export class SentimentSummaryDto {
  @ApiProperty({ description: 'Score final de sentimento (-1 a +1)' })
  finalSentiment: number;

  @ApiProperty({ enum: SentimentLabel })
  label: SentimentLabel;

  @ApiProperty({ description: 'Score de confiança (0 a 1)' })
  confidenceScore: number;

  @ApiProperty({ description: 'Número de providers que analisaram' })
  providersCount: number;

  @ApiProperty({ description: 'Número de providers em acordo' })
  agreementCount: number;

  @ApiProperty({ description: 'Se é alta confiança (>=0.7 e >=3 providers)' })
  isHighConfidence: boolean;
}

/**
 * DTO para resposta de notícia
 */
export class NewsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  ticker: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiProperty()
  url: string;

  @ApiProperty({ enum: NewsSource })
  source: NewsSource;

  @ApiPropertyOptional()
  sourceName?: string;

  @ApiPropertyOptional()
  author?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  publishedAt: Date;

  @ApiProperty()
  isAnalyzed: boolean;

  @ApiPropertyOptional({ description: 'Sentimento consolidado (se analisado)' })
  sentiment?: SentimentSummaryDto;

  @ApiProperty()
  createdAt: Date;
}

/**
 * DTO para análise individual por provider
 */
export class NewsAnalysisDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AIProvider })
  provider: AIProvider;

  @ApiPropertyOptional()
  modelVersion?: string;

  @ApiProperty({ description: 'Score de sentimento (-1 a +1)' })
  sentimentScore: number;

  @ApiProperty({ description: 'Confiança (0 a 1)' })
  confidence: number;

  @ApiPropertyOptional()
  analysisText?: string;

  @ApiPropertyOptional()
  keyFactors?: {
    bullish: string[];
    bearish: string[];
    neutral: string[];
  };

  @ApiProperty()
  processingTime: number;

  @ApiProperty()
  createdAt: Date;
}

/**
 * DTO para solicitar análise de notícia
 */
export class AnalyzeNewsDto {
  @ApiProperty({ description: 'ID da notícia' })
  @IsUUID()
  newsId: string;

  @ApiPropertyOptional({
    description: 'Providers específicos para usar',
    type: [String],
    enum: AIProvider,
  })
  @IsOptional()
  @IsEnum(AIProvider, { each: true })
  providers?: AIProvider[];

  @ApiPropertyOptional({ description: 'Forçar re-análise mesmo se já existe', default: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean = false;
}

/**
 * DTO para coletar notícias
 */
export class CollectNewsDto {
  @ApiProperty({ description: 'Ticker do ativo' })
  @IsString()
  ticker: string;

  @ApiPropertyOptional({
    description: 'Fontes específicas para usar',
    type: [String],
    enum: NewsSource,
  })
  @IsOptional()
  @IsEnum(NewsSource, { each: true })
  sources?: NewsSource[];

  @ApiPropertyOptional({ description: 'Limite de notícias por fonte', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(50)
  limit?: number = 10;
}

/**
 * DTO para resumo de sentimento do mercado
 */
export class MarketSentimentSummaryDto {
  @ApiProperty({ description: 'Sentimento geral do mercado (-1 a +1)' })
  overallSentiment: number;

  @ApiProperty({ enum: SentimentLabel })
  overallLabel: SentimentLabel;

  @ApiProperty({ description: 'Total de notícias analisadas' })
  totalNewsAnalyzed: number;

  @ApiProperty({ description: 'Notícias nas últimas 24h' })
  newsLast24h: number;

  @ApiProperty({ description: 'Breakdown por sentimento' })
  breakdown: {
    veryBullish: number;
    bullish: number;
    slightlyBullish: number;
    neutral: number;
    slightlyBearish: number;
    bearish: number;
    veryBearish: number;
  };

  @ApiProperty({ description: 'Top 5 notícias mais recentes com sentimento' })
  recentNews: NewsResponseDto[];
}

/**
 * DTO para resumo de sentimento de um ticker específico
 */
export class TickerSentimentSummaryDto {
  @ApiProperty({ description: 'Ticker do ativo' })
  ticker: string;

  @ApiProperty({ description: 'Sentimento do ativo (-1 a +1)' })
  overallSentiment: number;

  @ApiProperty({ enum: SentimentLabel })
  overallLabel: SentimentLabel;

  @ApiProperty({ description: 'Score de confiança médio (0 a 1)' })
  avgConfidence: number;

  @ApiProperty({ description: 'Total de notícias do ticker' })
  totalNews: number;

  @ApiProperty({ description: 'Notícias analisadas' })
  analyzedNews: number;

  @ApiProperty({ description: 'Notícias nas últimas 24h' })
  newsLast24h: number;

  @ApiProperty({ description: 'Breakdown por sentimento' })
  breakdown: {
    veryBullish: number;
    bullish: number;
    slightlyBullish: number;
    neutral: number;
    slightlyBearish: number;
    bearish: number;
    veryBearish: number;
  };

  @ApiProperty({ description: 'Últimas notícias do ticker com sentimento' })
  recentNews: NewsResponseDto[];

  @ApiProperty({ description: 'Data da última atualização' })
  lastUpdated: Date;
}

/**
 * Enum de períodos para análise de sentimento
 * FASE 76: Time-Weighted Multi-Timeframe Sentiment
 */
export enum SentimentPeriod {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual',
}

/**
 * DTO para sentimento por período específico
 * Inclui temporal decay e source tier weighting
 */
export class TimeframeSentimentDto {
  @ApiProperty({ enum: SentimentPeriod, description: 'Período da análise' })
  period: SentimentPeriod;

  @ApiProperty({ description: 'Score de sentimento ponderado (-1 a +1)' })
  sentiment: number;

  @ApiProperty({ enum: SentimentLabel, description: 'Label do sentimento' })
  label: SentimentLabel;

  @ApiProperty({ description: 'Confiança média ponderada (0 a 1)' })
  confidence: number;

  @ApiProperty({ description: 'Número de notícias no período' })
  newsCount: number;

  @ApiPropertyOptional({ description: 'Data da notícia mais antiga no período' })
  oldestNews?: Date;

  @ApiPropertyOptional({ description: 'Data da notícia mais recente no período' })
  newestNews?: Date;
}

/**
 * DTO para sentimento multi-período de um ticker
 * Retorna todos os timeframes de uma vez
 */
export class MultiTimeframeSentimentDto {
  @ApiProperty({ description: 'Ticker do ativo' })
  ticker: string;

  @ApiProperty({ type: [TimeframeSentimentDto], description: 'Sentimento por período' })
  timeframes: TimeframeSentimentDto[];

  @ApiProperty({ description: 'Breakdown por label de sentimento (across all periods)' })
  breakdown: {
    veryBullish: number;
    bullish: number;
    slightlyBullish: number;
    neutral: number;
    slightlyBearish: number;
    bearish: number;
    veryBearish: number;
  };

  @ApiProperty({ description: 'Data da última atualização' })
  lastUpdated: Date;
}
