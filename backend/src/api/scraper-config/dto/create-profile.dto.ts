import {
  IsString,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Configuração do perfil
 */
export class ProfileConfigDto {
  @ApiProperty({ description: 'Mínimo de scrapers que devem estar ativos', minimum: 2 })
  @IsInt()
  @Min(2) // Cross-validation requer mínimo 2
  minScrapers: number;

  @ApiProperty({ description: 'Máximo de scrapers simultâneos', minimum: 2 })
  @IsInt()
  @Min(2)
  maxScrapers: number;

  @ApiProperty({ description: 'IDs dos scrapers incluídos', type: [String] })
  @IsArray()
  @IsString({ each: true })
  scraperIds: string[];

  @ApiProperty({ description: 'Ordem de prioridade (primeiro = maior prioridade)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  priorityOrder: string[];

  @ApiProperty({ description: 'Ativar fallback Python quando insuficiente' })
  @IsBoolean()
  fallbackEnabled: boolean;

  @ApiProperty({ description: 'Duração estimada em segundos', minimum: 0 })
  @IsInt()
  @Min(0)
  estimatedDuration: number;

  @ApiProperty({ description: 'Custo estimado (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  estimatedCost: number;
}

/**
 * DTO para criar perfil de execução customizado
 *
 * FASE: Dynamic Scraper Configuration
 */
export class CreateProfileDto {
  @ApiProperty({ description: 'Nome técnico do perfil (snake_case)', minLength: 3, maxLength: 100 })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Nome amigável para UI', minLength: 3, maxLength: 200 })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  displayName: string;

  @ApiProperty({ description: 'Descrição completa do perfil' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Marcar como perfil padrão' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ description: 'Configuração do perfil', type: ProfileConfigDto })
  @ValidateNested()
  @Type(() => ProfileConfigDto)
  config: ProfileConfigDto;
}

/**
 * DTO para atualizar perfil existente
 */
export class UpdateProfileDto extends CreateProfileDto {}
