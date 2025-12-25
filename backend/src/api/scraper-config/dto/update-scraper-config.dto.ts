import {
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsArray,
  IsString,
  ValidateNested,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para parâmetros ajustáveis de scrapers
 */
export class ScraperParametersDto {
  @ApiProperty({ description: 'Timeout em millisegundos', minimum: 10000, maximum: 300000 })
  @IsInt()
  @Min(10000) // Mínimo 10s
  @Max(300000) // Máximo 5min
  timeout: number;

  @ApiProperty({ description: 'Número de tentativas em caso de falha', minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  @Max(10)
  retryAttempts: number;

  @ApiProperty({ description: 'Delay entre retries em millisegundos', minimum: 500, maximum: 10000 })
  @IsInt()
  @Min(500)
  @Max(10000)
  retryDelay: number;

  @ApiProperty({ description: 'Máximo de scrapers simultâneos', minimum: 1, maximum: 10 })
  @IsInt()
  @Min(1)
  @Max(10)
  maxConcurrency: number;

  @ApiProperty({ description: 'Tempo de cache em segundos', minimum: 0, maximum: 86400 })
  @IsInt()
  @Min(0)
  @Max(86400) // Máximo 24h
  cacheExpiry: number;

  @ApiProperty({ description: 'Estratégia de espera do Playwright', enum: ['load', 'networkidle'] })
  @IsEnum(['load', 'networkidle'])
  waitStrategy: 'load' | 'networkidle';

  @ApiPropertyOptional({ description: 'Headless mode do browser' })
  @IsOptional()
  @IsBoolean()
  headless?: boolean;

  @ApiPropertyOptional({ description: 'Slow motion em ms para debug', minimum: 0, maximum: 5000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5000)
  slowMo?: number;

  @ApiProperty({ description: 'Peso na cross-validation (0.0-1.0)', minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  validationWeight: number;
}

/**
 * DTO para atualizar configuração de scraper individual
 *
 * FASE: Dynamic Scraper Configuration
 * REF: C:\Users\adria\.claude\plans\sprightly-singing-narwhal.md - Seção 3.2
 */
export class UpdateScraperConfigDto {
  @ApiPropertyOptional({ description: 'Habilitar/desabilitar scraper' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Prioridade de execução (1 = maior)', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Filtro de tickers (null = todos, [\'PETR4\'] = específicos)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledFor?: string[] | null;

  @ApiPropertyOptional({ description: 'Parâmetros ajustáveis do scraper', type: ScraperParametersDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScraperParametersDto)
  parameters?: ScraperParametersDto;
}
