import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsObject,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePositionDto {
  @ApiProperty({
    description: 'Asset ticker symbol',
    example: 'PETR4',
    pattern: '^[A-Z]{4}[0-9A-Z]{1,2}$',
  })
  @IsString()
  @MaxLength(10)
  @Matches(/^[A-Z]{4}[0-9A-Z]{1,2}$/, {
    message: 'Ticker must be a valid B3 ticker format (e.g., PETR4, VALE3, ITUB11)',
  })
  ticker: string;

  @ApiProperty({
    description: 'Quantity of shares/units',
    example: 100,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    description: 'Average purchase price per share/unit',
    example: 32.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  averagePrice: number;

  @ApiPropertyOptional({
    description: 'Date of first purchase (ISO 8601 format)',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  purchaseDate?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the position (JSON object)',
    example: { reason: 'Comprado na queda de mercado', strategy: 'buy and hold' },
  })
  @IsOptional()
  @IsObject()
  notes?: Record<string, any>;
}
