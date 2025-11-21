import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de resposta para indicador econômico individual
 */
export class IndicatorResponseDto {
  @ApiProperty({
    description: 'ID do indicador (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Tipo do indicador',
    example: 'SELIC',
  })
  indicatorType: string;

  @ApiProperty({
    description: 'Valor do indicador',
    example: 13.75,
  })
  value: number;

  @ApiProperty({
    description: 'Data de referência',
    example: '2025-11-21',
  })
  referenceDate: Date;

  @ApiProperty({
    description: 'Fonte dos dados',
    example: 'BCB',
    required: false,
  })
  source?: string;

  @ApiProperty({
    description: 'Metadados adicionais',
    example: { unit: '% a.a.', period: 'annual' },
    required: false,
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-11-21T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-11-21T10:30:00Z',
  })
  updatedAt: Date;
}

/**
 * DTO de resposta para lista de indicadores
 */
export class IndicatorsListResponseDto {
  @ApiProperty({
    description: 'Lista de indicadores',
    type: [IndicatorResponseDto],
  })
  indicators: IndicatorResponseDto[];

  @ApiProperty({
    description: 'Total de registros',
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: 'Data de atualização dos dados',
    example: '2025-11-21T10:30:00Z',
  })
  updatedAt: Date;
}

/**
 * DTO de resposta para indicador mais recente por tipo
 */
export class LatestIndicatorResponseDto {
  @ApiProperty({
    description: 'Tipo do indicador',
    example: 'SELIC',
  })
  type: string;

  @ApiProperty({
    description: 'Valor atual',
    example: 13.75,
  })
  currentValue: number;

  @ApiProperty({
    description: 'Valor anterior (última leitura)',
    example: 13.25,
    required: false,
  })
  previousValue?: number;

  @ApiProperty({
    description: 'Variação em pontos percentuais',
    example: 0.5,
    required: false,
  })
  change?: number;

  @ApiProperty({
    description: 'Data de referência do valor atual',
    example: '2025-11-21',
  })
  referenceDate: Date;

  @ApiProperty({
    description: 'Fonte dos dados',
    example: 'BCB',
  })
  source: string;

  @ApiProperty({
    description: 'Unidade de medida',
    example: '% a.a.',
    required: false,
  })
  unit?: string;
}
