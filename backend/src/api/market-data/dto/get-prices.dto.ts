import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Candle Timeframe - Intervalo de agregação dos candles
 * 1D = Daily (1 candle por dia - sem agregação)
 * 1W = Weekly (1 candle por semana - agrega 5 dias úteis)
 * 1M = Monthly (1 candle por mês - agrega ~21 dias úteis)
 */
export enum CandleTimeframe {
  ONE_DAY = '1D',
  ONE_WEEK = '1W',
  ONE_MONTH = '1M',
}

/**
 * Viewing Range - Período de dados a retornar
 * Quanto histórico mostrar no gráfico
 */
export enum ViewingRange {
  ONE_MONTH = '1mo',
  THREE_MONTHS = '3mo',
  SIX_MONTHS = '6mo',
  ONE_YEAR = '1y',
  TWO_YEARS = '2y',
  FIVE_YEARS = '5y',
  MAX = 'max',
}

export class GetPricesDto {
  @ApiProperty({
    description: 'Candle timeframe (aggregation interval)',
    enum: CandleTimeframe,
    example: '1D',
    default: '1D',
    required: false,
  })
  @IsOptional()
  @IsEnum(CandleTimeframe, {
    message: 'Timeframe must be one of: 1D (Daily), 1W (Weekly), 1M (Monthly)',
  })
  timeframe?: CandleTimeframe = CandleTimeframe.ONE_DAY;

  @ApiProperty({
    description: 'Viewing range (how much historical data to return)',
    enum: ViewingRange,
    example: '1y',
    default: '1y',
    required: false,
  })
  @IsOptional()
  @IsEnum(ViewingRange, {
    message: 'Range must be one of: 1mo, 3mo, 6mo, 1y, 2y, 5y, max',
  })
  range?: ViewingRange = ViewingRange.ONE_YEAR;

  @ApiProperty({
    description: 'Number of days (alternative to range)',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650) // Max 10 years
  @Type(() => Number)
  days?: number;

  @ApiProperty({
    description: 'Custom start date (YYYY-MM-DD) - for unified history',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    description: 'Custom end date (YYYY-MM-DD) - for unified history',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}
