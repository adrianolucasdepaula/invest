import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsUUID, IsNumber, Min, Max } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Providers específicos para usar', type: [String], enum: AIProvider })
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

  @ApiPropertyOptional({ description: 'Fontes específicas para usar', type: [String], enum: NewsSource })
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
