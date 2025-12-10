import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
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
 */
export class BulkUpdateAllAssetsDto {
  @ApiPropertyOptional({
    description: 'User ID who triggered the update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter to only update assets that have options (hasOptions=true)',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  hasOptionsOnly?: boolean;
}
