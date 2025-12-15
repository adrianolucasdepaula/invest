import { IsString, IsOptional, IsObject, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePortfolioDto {
  @ApiProperty({
    description: 'Portfolio name',
    example: 'Minha Carteira de Dividendos',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Portfolio description',
    example: 'Carteira focada em ações pagadoras de dividendos',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Portfolio settings (JSON object)',
    example: { showDividends: true, currency: 'BRL' },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
