import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

enum Timeframe {
  ONE_DAY = '1D',
  ONE_MONTH = '1MO',
  THREE_MONTHS = '3MO',
  SIX_MONTHS = '6MO',
  ONE_YEAR = '1Y',
  TWO_YEARS = '2Y',
  FIVE_YEARS = '5Y',
  MAX = 'MAX',
}

export class GetPricesDto {
  @ApiProperty({
    description: 'Timeframe for price data',
    enum: Timeframe,
    example: '1MO',
    required: false,
  })
  @IsOptional()
  @IsEnum(Timeframe)
  timeframe?: Timeframe;

  @ApiProperty({
    description: 'Number of days (alternative to timeframe)',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650) // Max 10 years
  @Type(() => Number)
  days?: number;
}
