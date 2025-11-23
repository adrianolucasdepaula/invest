import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';

/**
 * DTO para consulta de indicadores econômicos
 */
export class GetIndicatorsDto {
  @ApiProperty({
    description: 'Tipo de indicador (SELIC, IPCA, CDI, PIB, etc)',
    required: false,
    enum: ['SELIC', 'IPCA', 'CDI', 'PIB', 'IGPM', 'DI', 'POUPANCA', 'ALL'],
    example: 'SELIC',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Data inicial (formato: YYYY-MM-DD)',
    required: false,
    example: '2025-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Data final (formato: YYYY-MM-DD)',
    required: false,
    example: '2025-11-21',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Limite de registros retornados',
    required: false,
    default: 10,
    example: 10,
  })
  @IsOptional()
  limit?: number = 10;
}
