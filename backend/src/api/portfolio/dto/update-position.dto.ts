import { IsNumber, IsOptional, IsObject, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePositionDto {
  @ApiPropertyOptional({
    description: 'Updated quantity of shares/units',
    example: 150,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Updated average purchase price per share/unit',
    example: 35.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  averagePrice?: number;

  @ApiPropertyOptional({
    description: 'Current market price per share/unit',
    example: 38.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentPrice?: number;

  @ApiPropertyOptional({
    description: 'Additional notes for the position (JSON object)',
    example: { reason: 'Aumentou posição após resultados', strategy: 'buy and hold' },
  })
  @IsOptional()
  @IsObject()
  notes?: Record<string, any>;
}
