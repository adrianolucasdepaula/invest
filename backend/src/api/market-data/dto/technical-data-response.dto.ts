import { ApiProperty } from '@nestjs/swagger';
import { PriceDataPoint, TechnicalIndicators } from '../interfaces';

class MetadataDto {
  @ApiProperty({ description: 'Number of data points', example: 250 })
  data_points: number;

  @ApiProperty({ description: 'Whether data was served from cache', example: true })
  cached: boolean;

  @ApiProperty({ description: 'Response time in milliseconds', example: 15 })
  duration: number;

  @ApiProperty({ description: 'Error code (if any)', required: false })
  error?: string;

  @ApiProperty({ description: 'Error message (if any)', required: false })
  message?: string;

  @ApiProperty({ description: 'Data points available (if insufficient)', required: false })
  available?: number;

  @ApiProperty({ description: 'Data points required (if insufficient)', required: false })
  required?: number;
}

export class TechnicalDataResponseDto {
  @ApiProperty({
    description: 'Ticker symbol',
    example: 'VALE3',
  })
  ticker: string;

  @ApiProperty({
    description: 'Price data (OHLCV)',
    type: [Object],
  })
  prices: PriceDataPoint[];

  @ApiProperty({
    description: 'Technical indicators (null if insufficient data)',
    type: Object,
    nullable: true,
  })
  indicators: TechnicalIndicators | null;

  @ApiProperty({
    description: 'Metadata about the response',
    type: MetadataDto,
  })
  metadata: MetadataDto;
}
