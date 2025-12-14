import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UpdateTrigger } from '@database/entities';

export class UpdateSingleAssetDto {
  @ApiProperty({
    description: 'Asset ticker symbol',
    example: 'PETR4',
  })
  @IsString()
  ticker: string;

  @ApiPropertyOptional({
    description: 'User ID who triggered the update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'How the update was triggered',
    enum: UpdateTrigger,
    example: UpdateTrigger.MANUAL,
    default: UpdateTrigger.MANUAL,
  })
  @IsOptional()
  @IsEnum(UpdateTrigger)
  triggeredBy?: UpdateTrigger;
}

export class UpdateMultipleAssetsDto {
  @ApiProperty({
    description: 'Array of asset ticker symbols to update',
    example: ['PETR4', 'VALE3', 'ITUB4'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  tickers: string[];

  @ApiPropertyOptional({
    description: 'User ID who triggered the update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'How the update was triggered',
    enum: UpdateTrigger,
    example: UpdateTrigger.MANUAL,
    default: UpdateTrigger.MANUAL,
  })
  @IsOptional()
  @IsEnum(UpdateTrigger)
  triggeredBy?: UpdateTrigger;
}

export class UpdatePortfolioAssetsDto {
  @ApiProperty({
    description: 'Portfolio ID whose assets should be updated',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  portfolioId: string;

  @ApiProperty({
    description: 'User ID (must be portfolio owner)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;
}

export class UpdateAssetsBySectorDto {
  @ApiProperty({
    description: 'Sector name to update all assets from',
    example: 'Petróleo e Gás',
  })
  @IsString()
  sector: string;

  @ApiPropertyOptional({
    description: 'User ID who triggered the update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class GetOutdatedAssetsDto {
  @ApiPropertyOptional({
    description: 'Filter by portfolio ID (optional)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  portfolioId?: string;
}

/**
 * DTO for bulk updating ALL assets fundamentals
 * FASE 86: Proper DTO with validators for the bulk-all endpoint
 *
 * TROUBLESHOOTING (2025-12-14):
 * ============================
 * BUG: hasOptionsOnly chegava como undefined no controller mesmo quando frontend enviava true.
 *
 * ROOT CAUSE: Cache de compilação do Docker.
 * - O código TypeScript é montado como volume (./backend:/app)
 * - Mas a pasta /app/dist pode conter código compilado antigo
 * - O docker-entrypoint.sh só reconstrói se dist não existir
 * - nest start --watch pode não detectar todas as mudanças
 *
 * SOLUÇÃO:
 * 1. @Transform decorator adicionado para garantir conversão robusta de boolean
 * 2. Limpar dist antes de restart: `docker exec invest_backend rm -rf /app/dist`
 * 3. Reiniciar container: `docker-compose restart backend`
 *
 * EVIDÊNCIA DO BUG (logs do backend):
 * - GlobalExceptionFilter mostrou body: {"hasOptionsOnly":true} (frontend enviou correto)
 * - Controller logou: hasOptionsOnly: undefined (backend recebeu errado)
 *
 * PREVENÇÃO: Se o filtro não funcionar, verificar se dist está atualizado.
 */
export class BulkUpdateAllAssetsDto {
  @ApiPropertyOptional({
    description: 'User ID who triggered the update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  /**
   * Filter to only update assets that have options (hasOptions=true)
   *
   * IMPORTANTE: O @Transform é necessário para garantir conversão robusta.
   * Sem ele, valores podem chegar como undefined devido a problemas de
   * serialização/deserialização entre frontend e backend.
   *
   * @see BUG_REPORT_HASOPTIONS_ONLY_2025-12-14.md
   */
  @ApiPropertyOptional({
    description: 'Filter to only update assets that have options (hasOptions=true)',
    example: true,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Conversão robusta de boolean - trata strings, numbers e booleans
    if (value === 'true' || value === true || value === 1) return true;
    if (value === 'false' || value === false || value === 0) return false;
    return value;
  })
  @IsBoolean()
  hasOptionsOnly?: boolean;
}
