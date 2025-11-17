import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CandleTimeframe, ViewingRange } from './get-prices.dto';

/**
 * DTO para requisição de dados técnicos (prices + indicators)
 * Usa mesmos enums de GetPricesDto para consistência
 */
export class GetTechnicalDataDto {
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
}
