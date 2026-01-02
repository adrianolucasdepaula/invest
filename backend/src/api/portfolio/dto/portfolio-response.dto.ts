import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PositionResponseDto } from './position-response.dto';

export class PortfolioResponseDto {
  @ApiProperty({
    description: 'Portfolio unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Portfolio name',
    example: 'Minha Carteira de Dividendos',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Portfolio description',
    example: 'Carteira focada em ações pagadoras de dividendos',
  })
  description?: string;

  @ApiProperty({
    description: 'Whether the portfolio is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Total amount invested in the portfolio',
    example: 50000.0,
  })
  totalInvested: number;

  @ApiProperty({
    description: 'Current market value of the portfolio',
    example: 55000.0,
  })
  currentValue: number;

  @ApiProperty({
    description: 'Absolute profit/loss',
    example: 5000.0,
  })
  profit: number;

  @ApiProperty({
    description: 'Profit/loss percentage',
    example: 10.0,
  })
  profitPercentage: number;

  @ApiPropertyOptional({
    description: 'Portfolio settings',
    example: { showDividends: true, currency: 'BRL' },
  })
  settings?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Array of positions in the portfolio',
    type: [PositionResponseDto],
  })
  positions?: PositionResponseDto[];

  @ApiProperty({
    description: 'Portfolio creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Portfolio last update timestamp',
    example: '2024-12-15T14:45:00.000Z',
  })
  updatedAt: Date;
}
