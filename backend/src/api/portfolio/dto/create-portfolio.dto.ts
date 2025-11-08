import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePortfolioDto {
  @ApiProperty({
    description: 'Nome do portfólio',
    example: 'Meu Portfólio Principal',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição do portfólio',
    example: 'Portfólio de investimentos em ações brasileiras',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
