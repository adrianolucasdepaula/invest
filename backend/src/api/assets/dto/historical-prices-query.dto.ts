import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Enum for BRAPI-compatible price range values
 * Source: https://brapi.dev/docs
 */
export enum PriceRange {
  ONE_DAY = '1d',
  FIVE_DAYS = '5d',
  ONE_MONTH = '1mo',
  THREE_MONTHS = '3mo',
  SIX_MONTHS = '6mo',
  ONE_YEAR = '1y',
  TWO_YEARS = '2y',
  FIVE_YEARS = '5y',
  TEN_YEARS = '10y',
  YTD = 'ytd',
  MAX = 'max',
}

/**
 * DTO for querying historical price data
 * Supports both BRAPI range shortcuts and custom date ranges
 */
export class HistoricalPricesQueryDto {
  @ApiPropertyOptional({
    enum: PriceRange,
    description: 'Predefined time range for historical data (e.g., 1mo, 3mo, 1y)',
    example: PriceRange.ONE_YEAR,
  })
  @IsOptional()
  @IsEnum(PriceRange)
  range?: PriceRange;

  @ApiPropertyOptional({
    description: 'Custom start date (YYYY-MM-DD). Overrides range if provided.',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Custom end date (YYYY-MM-DD). Defaults to today if not provided.',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
