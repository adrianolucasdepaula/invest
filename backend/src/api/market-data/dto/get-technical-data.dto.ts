import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

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

export class GetTechnicalDataDto {
  @ApiProperty({
    description: 'Timeframe for technical analysis',
    enum: Timeframe,
    example: '1MO',
    default: '1MO',
  })
  @IsOptional()
  @IsEnum(Timeframe)
  timeframe?: Timeframe = Timeframe.ONE_MONTH;
}
