import { IsString, IsOptional, IsBoolean, IsObject, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePortfolioDto {
  @ApiPropertyOptional({
    description: 'Portfolio name',
    example: 'Carteira de Dividendos 2025',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Portfolio description',
    example: 'Carteira focada em dividendos para 2025',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the portfolio is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Portfolio settings (JSON object)',
    example: { showDividends: true, currency: 'BRL' },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
