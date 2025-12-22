import {
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import Decimal from 'decimal.js';

/**
 * DTO for creating a new stock lending rate record
 */
export class CreateStockLendingRateDto {
  @ApiProperty({ description: 'ID do ativo (UUID)' })
  @IsUUID()
  assetId: string;

  @ApiProperty({
    description: 'Taxa de aluguel anual (%)',
    example: '5.5',
    type: 'string',
  })
  @IsNotEmpty()
  @Transform(({ value }) => new Decimal(value))
  taxaAluguelAno: Decimal;

  @ApiPropertyOptional({
    description: 'Taxa de aluguel diaria (% - calculada automaticamente se nao informada)',
    example: '0.0218',
    type: 'string',
  })
  @IsOptional()
  @Transform(({ value }) => (value != null ? new Decimal(value) : null))
  taxaAluguelDia?: Decimal | null;

  @ApiPropertyOptional({
    description: 'Taxa minima do dia (%)',
    type: 'string',
  })
  @IsOptional()
  @Transform(({ value }) => (value != null ? new Decimal(value) : null))
  taxaMin?: Decimal | null;

  @ApiPropertyOptional({
    description: 'Taxa maxima do dia (%)',
    type: 'string',
  })
  @IsOptional()
  @Transform(({ value }) => (value != null ? new Decimal(value) : null))
  taxaMax?: Decimal | null;

  @ApiPropertyOptional({ description: 'Quantidade disponivel para aluguel' })
  @IsInt()
  @Min(0)
  @IsOptional()
  quantidadeDisponivel?: number;

  @ApiPropertyOptional({ description: 'Quantidade ja alugada' })
  @IsInt()
  @Min(0)
  @IsOptional()
  quantidadeAlugada?: number;

  @ApiPropertyOptional({
    description: 'Volume financeiro (R$)',
    type: 'string',
  })
  @IsOptional()
  @Transform(({ value }) => (value != null ? new Decimal(value) : null))
  volumeFinanceiro?: Decimal | null;

  @ApiProperty({
    description: 'Data de referencia (YYYY-MM-DD)',
    example: '2025-12-21',
  })
  @IsDateString()
  dataReferencia: string;

  @ApiPropertyOptional({ description: 'Fonte dos dados' })
  @IsString()
  @IsOptional()
  source?: string;
}

/**
 * DTO for querying stock lending rates
 */
export class StockLendingQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por asset ID' })
  @IsUUID()
  @IsOptional()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por ticker' })
  @IsString()
  @IsOptional()
  ticker?: string;

  @ApiPropertyOptional({ description: 'Data inicial (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Numero de dias (alternativa a startDate/endDate)', default: 30 })
  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  @IsOptional()
  days?: number;

  @ApiPropertyOptional({ description: 'Limite de resultados', default: 100 })
  @IsInt()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset para paginacao', default: 0 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  offset?: number;
}

/**
 * Response DTO for current lending rate
 * Note: Decimal fields serialize to string in JSON automatically
 */
export class CurrentLendingRateDto {
  @ApiProperty({ description: 'Ticker do ativo' })
  ticker: string;

  @ApiProperty({ description: 'Taxa de aluguel anual (%)', type: 'string' })
  taxaAluguelAno: Decimal;

  @ApiProperty({ description: 'Taxa de aluguel diaria (%)', type: 'string' })
  taxaAluguelDia: Decimal;

  @ApiPropertyOptional({ description: 'Quantidade disponivel' })
  quantidadeDisponivel?: number;

  @ApiPropertyOptional({ description: 'Quantidade alugada' })
  quantidadeAlugada?: number;

  @ApiProperty({ description: 'Data de referencia' })
  dataReferencia: string;

  @ApiProperty({ description: 'Fonte dos dados' })
  source: string;
}

/**
 * Response DTO for lending rate statistics
 * Note: Decimal fields serialize to string in JSON automatically
 */
export class LendingRateStatsDto {
  @ApiProperty({ description: 'Ticker do ativo' })
  ticker: string;

  @ApiProperty({ description: 'Taxa atual' })
  currentRate: CurrentLendingRateDto;

  @ApiProperty({ description: 'Historico de taxas' })
  historico: Array<{
    data: string;
    taxa: Decimal;
  }>;

  @ApiProperty({ description: 'Estatisticas do periodo' })
  estatisticas: {
    mediaUltimos30Dias: Decimal;
    minimo30Dias: Decimal;
    maximo30Dias: Decimal;
    tendencia: 'alta' | 'baixa' | 'estavel';
  };
}

/**
 * Response DTO for estimated lending income
 * Note: Decimal fields serialize to string in JSON automatically
 */
export class LendingIncomeEstimateDto {
  @ApiProperty({ description: 'Ticker do ativo' })
  ticker: string;

  @ApiProperty({ description: 'Quantidade de acoes' })
  quantidade: number;

  @ApiProperty({ description: 'Preco atual da acao (R$)', type: 'string' })
  precoAtual: Decimal;

  @ApiProperty({ description: 'Valor total em acoes (R$)', type: 'string' })
  valorTotal: Decimal;

  @ApiProperty({ description: 'Taxa de aluguel anual (%)', type: 'string' })
  taxaAluguelAno: Decimal;

  @ApiProperty({ description: 'Renda estimada diaria (R$)', type: 'string' })
  rendaDiaria: Decimal;

  @ApiProperty({ description: 'Renda estimada mensal (R$)', type: 'string' })
  rendaMensal: Decimal;

  @ApiProperty({ description: 'Renda estimada anual (R$)', type: 'string' })
  rendaAnual: Decimal;

  @ApiProperty({ description: 'Data de referencia' })
  dataReferencia: string;
}

/**
 * Response DTO for sync operation
 */
export class StockLendingSyncResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  ticker: string;

  @ApiProperty({ description: 'Quantidade importada' })
  imported: number;

  @ApiProperty({ description: 'Quantidade ignorada (duplicatas)' })
  skipped: number;

  @ApiPropertyOptional({ description: 'Erros encontrados' })
  errors?: string[];

  @ApiProperty({ description: 'Fonte dos dados' })
  source: string;

  @ApiProperty({ description: 'Tempo de execucao em segundos' })
  elapsedTime: number;
}
