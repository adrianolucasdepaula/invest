import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { DataSourceStatus } from '@database/entities/data-source.entity';

export class UpdateDataSourceDto {
  @ApiPropertyOptional({
    description: 'Status da fonte de dados',
    enum: DataSourceStatus,
    example: DataSourceStatus.ACTIVE,
  })
  @IsEnum(DataSourceStatus)
  @IsOptional()
  status?: DataSourceStatus;

  @ApiPropertyOptional({
    description: 'Descrição da fonte de dados',
    example: 'Fonte premium de dados fundamentalistas',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Score de confiabilidade (0.0 a 1.0)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  reliabilityScore?: number;

  @ApiPropertyOptional({
    description: 'Fonte verificada pela equipe',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Fonte confiável para análises',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isTrusted?: boolean;

  @ApiPropertyOptional({
    description: 'Configurações específicas da fonte',
    example: { timeout: 5000, retries: 3 },
  })
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Metadados adicionais',
    example: { lastMaintenance: '2025-01-01' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
