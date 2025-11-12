import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '../../../database/entities/asset.entity';
import { AnalysisType, AnalysisStatus, Recommendation } from '../../../database/entities/analysis.entity';

/**
 * DTO que combina dados de Asset + Status da Análise
 *
 * Usado para exibir lista de ativos com informações sobre análises
 */
export class AssetWithAnalysisStatusDto {
  // ========================================
  // DADOS DO ATIVO
  // ========================================

  @ApiProperty({
    description: 'ID do ativo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Ticker do ativo (código de negociação)',
    example: 'PETR4',
  })
  ticker: string;

  @ApiProperty({
    description: 'Nome completo do ativo',
    example: 'Petróleo Brasileiro S.A. - Petrobras',
  })
  name: string;

  @ApiProperty({
    description: 'Tipo do ativo',
    enum: AssetType,
    example: AssetType.STOCK,
  })
  type: AssetType;

  @ApiProperty({
    description: 'Setor do ativo',
    example: 'Petróleo, Gás e Biocombustíveis',
  })
  sector: string;

  @ApiPropertyOptional({
    description: 'Preço atual do ativo',
    example: 38.45,
  })
  currentPrice?: number;

  @ApiPropertyOptional({
    description: 'Variação percentual do dia',
    example: 1.23,
  })
  changePercent?: number;

  // ========================================
  // STATUS DA ANÁLISE
  // ========================================

  @ApiProperty({
    description: 'Se existe análise para este ativo',
    example: true,
  })
  hasAnalysis: boolean;

  @ApiPropertyOptional({
    description: 'ID da última análise',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  lastAnalysisId?: string;

  @ApiPropertyOptional({
    description: 'Data da última análise',
    example: '2025-11-12T10:30:00.000Z',
  })
  lastAnalysisDate?: Date;

  @ApiPropertyOptional({
    description: 'Tipo da última análise',
    enum: AnalysisType,
    example: AnalysisType.COMPLETE,
  })
  lastAnalysisType?: AnalysisType;

  @ApiPropertyOptional({
    description: 'Status da última análise',
    enum: AnalysisStatus,
    example: AnalysisStatus.COMPLETED,
  })
  lastAnalysisStatus?: AnalysisStatus;

  @ApiPropertyOptional({
    description: 'Recomendação da última análise',
    enum: Recommendation,
    example: Recommendation.BUY,
  })
  lastAnalysisRecommendation?: Recommendation;

  @ApiPropertyOptional({
    description: 'Score de confiança da última análise (0-1)',
    example: 0.85,
  })
  lastAnalysisConfidence?: number;

  @ApiPropertyOptional({
    description: 'Resumo da última análise',
    example: 'Ativo com fundamentos sólidos e preço atrativo.',
  })
  lastAnalysisSummary?: string;

  // ========================================
  // FLAGS COMPUTADAS
  // ========================================

  @ApiProperty({
    description: 'Se a análise é recente (<7 dias)',
    example: true,
  })
  isAnalysisRecent: boolean;

  @ApiProperty({
    description: 'Se a análise está desatualizada (>30 dias)',
    example: false,
  })
  isAnalysisOutdated: boolean;

  @ApiProperty({
    description: 'Se pode solicitar nova análise',
    example: false,
  })
  canRequestAnalysis: boolean;

  @ApiPropertyOptional({
    description: 'Quantidade de dias desde a última análise',
    example: 5,
  })
  daysSinceLastAnalysis?: number;
}
