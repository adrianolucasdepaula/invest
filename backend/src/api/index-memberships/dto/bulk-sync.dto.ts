import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsObject,
  ValidateNested,
  ArrayMinSize,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Metadata for the composition period
 */
export class CompositionMetadataDto {
  @ApiPropertyOptional({
    example: 'B3',
    description: 'Source of the data (e.g., B3, CVM)',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    example: '2025-01-01T12:00:00Z',
    description: 'Timestamp when the data was scraped',
  })
  @IsOptional()
  @IsString()
  scrapedAt?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Confidence level (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  confidence?: number;
}

/**
 * Individual asset in the composition
 */
export class CompositionAssetDto {
  @ApiProperty({
    example: 'PETR4',
    description: 'Asset ticker',
  })
  @IsString()
  ticker: string;

  @ApiPropertyOptional({
    example: 3.456789,
    description: 'Participation percentage in the index',
  })
  @IsOptional()
  @IsNumber()
  participation?: number;

  @ApiPropertyOptional({
    example: 3.456789,
    description: 'Participation percentage (alternative field name)',
  })
  @IsOptional()
  @IsNumber()
  participationPercent?: number;

  @ApiPropertyOptional({
    example: 1000000,
    description: 'Theoretical quantity in the index',
  })
  @IsOptional()
  @IsNumber()
  quantity?: number;

  @ApiPropertyOptional({
    example: 1000000,
    description: 'Theoretical quantity (alternative field name)',
  })
  @IsOptional()
  @IsNumber()
  theoreticalQuantity?: number;

  @ApiPropertyOptional({
    example: 'B3',
    description: 'Data source',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Confidence level',
  })
  @IsOptional()
  @IsNumber()
  confidence?: number;
}

/**
 * Single period composition
 */
export class PeriodCompositionDto {
  @ApiProperty({
    type: [CompositionAssetDto],
    description: 'Array of assets in the composition',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompositionAssetDto)
  @ArrayMinSize(1, { message: 'Composition must have at least 1 asset' })
  composition: CompositionAssetDto[];

  @ApiProperty({
    example: '2019-01-07',
    description: 'Start date of the validity period (YYYY-MM-DD)',
  })
  @IsDateString({}, { message: 'validFrom must be a valid ISO 8601 date string' })
  validFrom: string;

  @ApiPropertyOptional({
    example: '2019-04-30',
    description: 'End date of the validity period (YYYY-MM-DD), null for current period',
  })
  @IsOptional()
  @IsDateString({}, { message: 'validTo must be a valid ISO 8601 date string' })
  validTo?: string | null;

  @ApiPropertyOptional({
    type: CompositionMetadataDto,
    description: 'Metadata for this composition period',
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CompositionMetadataDto)
  metadata?: CompositionMetadataDto;
}

/**
 * Bulk sync request DTO
 * Input for POST /api/v1/index-memberships/sync/:indexName/bulk
 */
export class BulkSyncDto {
  @ApiProperty({
    type: [PeriodCompositionDto],
    description: 'Array of historical period compositions to import',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeriodCompositionDto)
  @ArrayMinSize(1, { message: 'At least 1 composition period is required' })
  compositions: PeriodCompositionDto[];
}

/**
 * Error detail for failed period
 */
export class PeriodErrorDto {
  @ApiProperty({
    example: '2019-01-07',
    description: 'validFrom of the failed period',
  })
  validFrom: string;

  @ApiProperty({
    example: 'Asset XXXX4 not found in database',
    description: 'Error message',
  })
  error: string;
}

/**
 * Bulk sync response DTO
 * Response for POST /api/v1/index-memberships/sync/:indexName/bulk
 */
export class BulkSyncResultDto {
  @ApiProperty({
    example: true,
    description: 'Overall success status (true if at least one period was successful)',
  })
  success: boolean;

  @ApiProperty({
    example: 20,
    description: 'Total number of periods in the request',
  })
  totalPeriods: number;

  @ApiProperty({
    example: 18,
    description: 'Number of successfully processed periods',
  })
  successful: number;

  @ApiProperty({
    example: 2,
    description: 'Number of failed periods',
  })
  failed: number;

  @ApiProperty({
    example: 1640,
    description: 'Total number of assets inserted across all periods',
  })
  totalAssets: number;

  @ApiProperty({
    type: [PeriodErrorDto],
    description: 'List of errors for failed periods',
  })
  errors: PeriodErrorDto[];

  @ApiProperty({
    example: 'Bulk sync completed: 18/20 periods successful, 1640 assets imported',
    description: 'Summary message',
  })
  message: string;
}
