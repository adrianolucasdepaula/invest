import {
  IsEnum,
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
import { DividendType, DividendStatus } from '@database/entities/dividend.entity';

/**
 * DTO for creating a new dividend record
 */
export class CreateDividendDto {
  @ApiProperty({ description: 'ID do ativo (UUID)' })
  @IsUUID()
  assetId: string;

  @ApiProperty({
    enum: DividendType,
    description: 'Tipo de provento',
    example: DividendType.DIVIDENDO,
  })
  @IsEnum(DividendType)
  tipo: DividendType;

  @ApiPropertyOptional({
    enum: DividendStatus,
    default: DividendStatus.ANUNCIADO,
    description: 'Status do pagamento',
  })
  @IsEnum(DividendStatus)
  @IsOptional()
  status?: DividendStatus;

  @ApiProperty({
    description: 'Valor bruto por acao',
    example: '0.45',
    type: 'string',
  })
  @IsNotEmpty()
  @Transform(({ value }) => new Decimal(value))
  valorBruto: Decimal;

  @ApiPropertyOptional({
    description: 'Valor liquido por acao',
    type: 'string',
  })
  @IsOptional()
  @Transform(({ value }) => (value != null ? new Decimal(value) : null))
  valorLiquido?: Decimal | null;

  @ApiPropertyOptional({
    description: 'Imposto retido na fonte',
    type: 'string',
  })
  @IsOptional()
  @Transform(({ value }) => (value != null ? new Decimal(value) : null))
  impostoRetido?: Decimal | null;

  @ApiProperty({
    description: 'Data EX (YYYY-MM-DD)',
    example: '2025-12-21',
  })
  @IsDateString()
  dataEx: string;

  @ApiPropertyOptional({ description: 'Data COM (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dataCom?: string;

  @ApiPropertyOptional({ description: 'Data de pagamento (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dataPagamento?: string;

  @ApiPropertyOptional({ description: 'Data de aprovacao (YYYY-MM-DD)' })
  @IsDateString()
  @IsOptional()
  dataAprovacao?: string;

  @ApiPropertyOptional({ description: 'Frequencia de distribuicao' })
  @IsString()
  @IsOptional()
  frequencia?: string;

  @ApiPropertyOptional({ description: 'Fonte dos dados' })
  @IsString()
  @IsOptional()
  source?: string;
}

/**
 * DTO for querying dividends
 */
export class DividendQueryDto {
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

  @ApiPropertyOptional({ enum: DividendType })
  @IsEnum(DividendType)
  @IsOptional()
  tipo?: DividendType;

  @ApiPropertyOptional({ enum: DividendStatus })
  @IsEnum(DividendStatus)
  @IsOptional()
  status?: DividendStatus;

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
 * DTO for dividend yield calculation
 */
export class DividendYieldQueryDto {
  @ApiPropertyOptional({
    description: 'Periodo em meses para calculo',
    default: 12,
    example: 12,
  })
  @IsInt()
  @Min(1)
  @Max(120)
  @Type(() => Number)
  @IsOptional()
  months?: number;
}

/**
 * Response DTO for dividend yield summary
 * Note: Decimal fields serialize to string in JSON automatically
 */
export class DividendYieldSummaryDto {
  @ApiProperty({ description: 'Ticker do ativo' })
  ticker: string;

  @ApiProperty({ description: 'DY 12 meses (%)', type: 'string' })
  dy12m: Decimal;

  @ApiProperty({ description: 'DY 24 meses (%)', type: 'string' })
  dy24m: Decimal;

  @ApiProperty({ description: 'Total pago ultimos 12 meses (R$)', type: 'string' })
  totalPago12m: Decimal;

  @ApiProperty({ description: 'Quantidade de pagamentos 12m' })
  pagamentos12m: number;

  @ApiProperty({ description: 'Media por pagamento', type: 'string' })
  mediaPorPagamento: Decimal;

  @ApiProperty({ description: 'Frequencia predominante' })
  frequenciaPredominante: string;

  @ApiPropertyOptional({ description: 'Proximo provento estimado' })
  proximoProventoEstimado?: {
    dataEx: string;
    valorEstimado: Decimal;
  };
}

/**
 * Response DTO for sync operation
 */
export class DividendSyncResponseDto {
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
