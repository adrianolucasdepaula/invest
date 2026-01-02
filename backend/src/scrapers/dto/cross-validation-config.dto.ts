import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsObject, IsOptional, Min, Max } from 'class-validator';

/**
 * DTO para tolerâncias por campo
 */
export interface FieldTolerancesDto {
  default: number;
  byField: Record<string, number>;
}

/**
 * DTO para configuração completa de validação cruzada
 *
 * FASE 93.1 - Cross-Validation Configuration
 */
export class CrossValidationConfigDto {
  @ApiProperty({ description: 'Número mínimo de fontes para validação', example: 3 })
  @IsNumber()
  @Min(1)
  @Max(10)
  minSources: number;

  @ApiProperty({ description: 'Threshold para severidade ALTA (%)', example: 20 })
  @IsNumber()
  @Min(1)
  @Max(100)
  severityThresholdHigh: number;

  @ApiProperty({ description: 'Threshold para severidade MÉDIA (%)', example: 10 })
  @IsNumber()
  @Min(1)
  @Max(100)
  severityThresholdMedium: number;

  @ApiProperty({
    description: 'Ordem de prioridade das fontes',
    example: ['fundamentus', 'statusinvest', 'investidor10', 'brapi', 'investsite', 'fundamentei'],
  })
  @IsArray()
  @IsString({ each: true })
  sourcePriority: string[];

  @ApiProperty({ description: 'Tolerâncias por campo' })
  @IsObject()
  fieldTolerances: FieldTolerancesDto;
}

/**
 * DTO para atualização parcial de configuração
 */
export class UpdateCrossValidationConfigDto {
  @ApiPropertyOptional({ description: 'Número mínimo de fontes', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  minSources?: number;

  @ApiPropertyOptional({ description: 'Threshold severidade ALTA (%)', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  severityThresholdHigh?: number;

  @ApiPropertyOptional({ description: 'Threshold severidade MÉDIA (%)', example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  severityThresholdMedium?: number;

  @ApiPropertyOptional({
    description: 'Ordem de prioridade das fontes',
    example: ['fundamentus', 'statusinvest'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sourcePriority?: string[];

  @ApiPropertyOptional({ description: 'Tolerâncias por campo' })
  @IsOptional()
  @IsObject()
  fieldTolerances?: FieldTolerancesDto;
}

/**
 * DTO para mudanças por severidade no preview
 */
export interface SeverityChangeDto {
  current: number;
  new: number;
  delta: number;
}

/**
 * DTO para preview de impacto de mudanças de configuração
 */
export class ImpactPreviewDto {
  @ApiProperty({ description: 'Total atual de discrepâncias' })
  currentTotal: number;

  @ApiProperty({ description: 'Total após mudanças' })
  newTotal: number;

  @ApiProperty({ description: 'Diferença (+ ou -)' })
  delta: number;

  @ApiProperty({ description: 'Mudanças por severidade' })
  bySeverity: {
    high: SeverityChangeDto;
    medium: SeverityChangeDto;
    low: SeverityChangeDto;
  };

  @ApiProperty({ description: 'Ativos afetados pela mudança' })
  affectedAssets: string[];

  @ApiProperty({ description: 'Campos afetados pela mudança' })
  affectedFields: string[];

  @ApiProperty({ description: 'Amostra de mudanças' })
  sampleChanges: Array<{
    ticker: string;
    field: string;
    currentSeverity: string | null;
    newSeverity: string | null;
    reason: string;
  }>;
}

/**
 * DTO para resultado de teste em lote de scrapers
 *
 * FASE 93.4 - Test All Scrapers
 */
export class BatchTestResultDto {
  @ApiProperty({ description: 'Total de scrapers testados' })
  totalScrapers: number;

  @ApiProperty({ description: 'Quantidade de sucessos' })
  successCount: number;

  @ApiProperty({ description: 'Quantidade de falhas' })
  failedCount: number;

  @ApiProperty({ description: 'Duração total em ms' })
  duration: number;

  @ApiProperty({ description: 'Resultados individuais' })
  results: Array<{
    scraperId: string;
    scraperName: string;
    success: boolean;
    responseTime: number;
    error?: string;
    runtime: 'typescript' | 'python';
  }>;
}

/**
 * DTO para progresso de teste em lote
 */
export class BatchTestProgressDto {
  @ApiProperty({ description: 'Scraper atual sendo testado' })
  currentScraperId: string;

  @ApiProperty({ description: 'Índice atual (1-based)' })
  current: number;

  @ApiProperty({ description: 'Total de scrapers' })
  total: number;

  @ApiProperty({ description: 'Resultado do scraper atual' })
  success: boolean;

  @ApiProperty({ description: 'Tempo de resposta em ms' })
  responseTime: number;

  @ApiProperty({ description: 'Mensagem de erro se falhou' })
  error?: string;
}
