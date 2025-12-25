import { IsArray, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para preview de impacto de mudanças de configuração
 *
 * FASE: Dynamic Scraper Configuration
 */
export class PreviewImpactDto {
  @ApiProperty({ description: 'IDs dos scrapers que ficarão ativos', type: [String] })
  @IsArray()
  @IsString({ each: true })
  enabledScrapers: string[];

  @ApiPropertyOptional({ description: 'Ticker para teste (default: PETR4)' })
  @IsOptional()
  @IsString()
  testTicker?: string;
}

/**
 * Resposta da análise de impacto
 */
export interface ImpactAnalysis {
  /** Duração estimada em segundos por asset */
  estimatedDuration: number;

  /** Memória estimada em MB */
  estimatedMemory: number;

  /** CPU estimado em porcentagem */
  estimatedCPU: number;

  /** Mínimo de fontes esperadas */
  minSources: number;

  /** Máximo de fontes esperadas */
  maxSources: number;

  /** Nível de confiança esperado */
  confidenceLevel: 'low' | 'medium' | 'high';

  /** Warnings sobre a configuração */
  warnings: string[];
}
