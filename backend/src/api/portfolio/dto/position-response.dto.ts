import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssetSummaryDto {
  @ApiProperty({ description: 'Asset ID', example: 'asset-uuid-here' })
  id: string;

  @ApiProperty({ description: 'Ticker symbol', example: 'PETR4' })
  ticker: string;

  @ApiProperty({ description: 'Asset name', example: 'Petrobras PN' })
  name: string;

  @ApiPropertyOptional({ description: 'Asset type', example: 'STOCK' })
  type?: string;
}

export class PositionResponseDto {
  @ApiProperty({
    description: 'Position unique identifier',
    example: 'p1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Portfolio ID this position belongs to',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  portfolioId: string;

  @ApiProperty({
    description: 'Asset ID',
    example: 'asset-uuid-here',
  })
  assetId: string;

  @ApiPropertyOptional({
    description: 'Asset summary information',
    type: AssetSummaryDto,
  })
  asset?: AssetSummaryDto;

  @ApiProperty({
    description: 'Quantity of shares/units held',
    example: 100,
  })
  quantity: number;

  @ApiProperty({
    description: 'Average purchase price per share/unit',
    example: 32.5,
  })
  averagePrice: number;

  @ApiPropertyOptional({
    description: 'Current market price per share/unit',
    example: 35.0,
  })
  currentPrice?: number;

  @ApiProperty({
    description: 'Total amount invested in this position',
    example: 3250.0,
  })
  totalInvested: number;

  @ApiPropertyOptional({
    description: 'Current market value of this position',
    example: 3500.0,
  })
  currentValue?: number;

  @ApiPropertyOptional({
    description: 'Absolute profit/loss for this position',
    example: 250.0,
  })
  profit?: number;

  @ApiPropertyOptional({
    description: 'Profit/loss percentage for this position',
    example: 7.69,
  })
  profitPercentage?: number;

  @ApiPropertyOptional({
    description: 'Date of first purchase',
    example: '2024-01-15',
  })
  firstBuyDate?: Date;

  @ApiPropertyOptional({
    description: 'Date of last price update',
    example: '2024-12-15',
  })
  lastUpdateDate?: Date;

  @ApiPropertyOptional({
    description: 'Additional notes for the position',
    example: { reason: 'Long term investment', strategy: 'buy and hold' },
  })
  notes?: Record<string, any>;

  @ApiProperty({
    description: 'Position creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Position last update timestamp',
    example: '2024-12-15T14:45:00.000Z',
  })
  updatedAt: Date;
}
