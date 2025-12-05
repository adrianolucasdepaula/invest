import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  Matches,
} from 'class-validator';

/**
 * Intraday timeframe options for sync
 * Maps to BRAPI interval parameter
 */
export enum SyncIntradayTimeframe {
  M1 = '1m',
  M5 = '5m',
  M15 = '15m',
  M30 = '30m',
  H1 = '1h',
  H4 = '4h',
}

/**
 * Range options for intraday sync
 * Maps to BRAPI range parameter
 */
export enum SyncIntradayRange {
  D1 = '1d',
  D5 = '5d',
  MO1 = '1mo',
  MO3 = '3mo', // Max for FREE plan
}

/**
 * DTO for single ticker intraday sync
 */
export class SyncIntradayDto {
  @ApiProperty({
    description: 'Ticker symbol to sync',
    example: 'PETR4',
  })
  @IsString()
  @Matches(/^[A-Z]{4}[0-9]{1,2}$/, {
    message: 'Ticker must be in format XXXX# or XXXX## (e.g., PETR4, BOVA11)',
  })
  ticker: string;

  @ApiPropertyOptional({
    description: 'Candle timeframe for intraday data',
    enum: SyncIntradayTimeframe,
    default: SyncIntradayTimeframe.H1,
    example: '1h',
  })
  @IsOptional()
  @IsEnum(SyncIntradayTimeframe)
  timeframe?: SyncIntradayTimeframe = SyncIntradayTimeframe.H1;

  @ApiPropertyOptional({
    description: 'Period range to fetch (max 3mo for FREE plan)',
    enum: SyncIntradayRange,
    default: SyncIntradayRange.D5,
    example: '5d',
  })
  @IsOptional()
  @IsEnum(SyncIntradayRange)
  range?: SyncIntradayRange = SyncIntradayRange.D5;
}

/**
 * DTO for bulk intraday sync (multiple tickers)
 */
export class SyncIntradayBulkDto {
  @ApiProperty({
    description: 'List of tickers to sync (max 10)',
    example: ['PETR4', 'VALE3', 'ITUB4'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least 1 ticker is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 tickers per bulk sync' })
  @IsString({ each: true })
  @Matches(/^[A-Z]{4}[0-9]{1,2}$/, {
    each: true,
    message: 'Each ticker must be in format XXXX# or XXXX## (e.g., PETR4, BOVA11)',
  })
  tickers: string[];

  @ApiPropertyOptional({
    description: 'Candle timeframe for intraday data',
    enum: SyncIntradayTimeframe,
    default: SyncIntradayTimeframe.H1,
    example: '1h',
  })
  @IsOptional()
  @IsEnum(SyncIntradayTimeframe)
  timeframe?: SyncIntradayTimeframe = SyncIntradayTimeframe.H1;

  @ApiPropertyOptional({
    description: 'Period range to fetch (max 3mo for FREE plan)',
    enum: SyncIntradayRange,
    default: SyncIntradayRange.D5,
    example: '5d',
  })
  @IsOptional()
  @IsEnum(SyncIntradayRange)
  range?: SyncIntradayRange = SyncIntradayRange.D5;
}

/**
 * Response DTO for intraday sync operation
 */
export class SyncIntradayResponseDto {
  @ApiProperty({
    description: 'Ticker that was synced',
    example: 'PETR4',
  })
  ticker: string;

  @ApiProperty({
    description: 'Timeframe of synced data',
    example: '1h',
  })
  timeframe: string;

  @ApiProperty({
    description: 'Number of records synced',
    example: 120,
  })
  recordsSynced: number;

  @ApiProperty({
    description: 'Processing time in seconds',
    example: 2.5,
  })
  processingTime: number;

  @ApiProperty({
    description: 'Period of synced data',
    example: { start: '2025-12-01T10:00:00Z', end: '2025-12-05T18:00:00Z' },
  })
  period: {
    start: string;
    end: string;
  };

  @ApiProperty({
    description: 'Data source used',
    example: 'brapi',
  })
  source: string;
}

/**
 * Response DTO for bulk intraday sync
 */
export class SyncIntradayBulkResponseDto {
  @ApiProperty({
    description: 'Status message',
    example: 'Intraday sync started in background',
  })
  message: string;

  @ApiProperty({
    description: 'Total tickers to sync',
    example: 5,
  })
  totalTickers: number;

  @ApiProperty({
    description: 'Timeframe being synced',
    example: '1h',
  })
  timeframe: string;

  @ApiProperty({
    description: 'Range being fetched',
    example: '5d',
  })
  range: string;

  @ApiProperty({
    description: 'Estimated time in minutes',
    example: 2.5,
  })
  estimatedMinutes: number;

  @ApiPropertyOptional({
    description: 'Instructions for tracking progress',
    example: 'Monitor progress via WebSocket event: sync:intraday:progress',
  })
  instructions?: string;
}
