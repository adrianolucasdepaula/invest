import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para valor de uma fonte específica
 */
export class FieldSourceValueDto {
  @ApiProperty({ description: 'Nome do scraper/fonte', example: 'fundamentus' })
  source: string;

  @ApiPropertyOptional({ description: 'Valor coletado', example: 5.42 })
  value: number | null;

  @ApiProperty({ description: 'Data/hora da coleta', example: '2025-12-02T10:30:00Z' })
  scrapedAt: string;
}

/**
 * DTO para fonte divergente
 */
export class DivergentSourceDto {
  @ApiProperty({ description: 'Nome da fonte', example: 'investidor10' })
  source: string;

  @ApiProperty({ description: 'Valor da fonte', example: 5.19 })
  value: number;

  @ApiProperty({ description: 'Desvio percentual do valor final', example: 4.24 })
  deviation: number;
}

/**
 * DTO para informações de um campo específico
 */
export class FieldSourceInfoDto {
  @ApiProperty({
    description: 'Lista de valores de cada fonte',
    type: [FieldSourceValueDto],
  })
  values: FieldSourceValueDto[];

  @ApiPropertyOptional({ description: 'Valor final escolhido por consenso', example: 5.42 })
  finalValue: number | null;

  @ApiProperty({ description: 'Fonte do valor final', example: 'fundamentus' })
  finalSource: string;

  @ApiProperty({ description: 'Quantidade de fontes com dados', example: 4 })
  sourcesCount: number;

  @ApiProperty({ description: 'Quantidade de fontes que concordam', example: 3 })
  agreementCount: number;

  @ApiProperty({ description: 'Porcentagem de consenso (0-100)', example: 75 })
  consensus: number;

  @ApiProperty({ description: 'Se há discrepância significativa', example: true })
  hasDiscrepancy: boolean;

  @ApiPropertyOptional({
    description: 'Fontes divergentes (se houver discrepância)',
    type: [DivergentSourceDto],
  })
  divergentSources?: DivergentSourceDto[];
}

/**
 * DTO de resposta para endpoint GET /assets/:ticker/data-sources
 */
export class AssetDataSourcesResponseDto {
  @ApiProperty({ description: 'Ticker do ativo', example: 'PETR4' })
  ticker: string;

  @ApiProperty({ description: 'Nome do ativo', example: 'Petróleo Brasileiro S.A.' })
  assetName: string;

  @ApiProperty({ description: 'Data da última atualização', example: '2025-12-02T10:30:00Z' })
  lastUpdate: string;

  @ApiProperty({ description: 'Confiança geral dos dados (0-1)', example: 0.85 })
  overallConfidence: number;

  @ApiProperty({
    description: 'Lista de fontes utilizadas',
    example: ['fundamentus', 'statusinvest', 'investidor10'],
  })
  sourcesUsed: string[];

  @ApiProperty({ description: 'Total de fontes consultadas', example: 6 })
  totalSourcesQueried: number;

  @ApiProperty({ description: 'Total de fontes com sucesso', example: 4 })
  totalSourcesSuccessful: number;

  @ApiProperty({ description: 'Total de campos rastreados', example: 35 })
  totalFieldsTracked: number;

  @ApiProperty({ description: 'Campos com discrepância', example: 5 })
  fieldsWithDiscrepancy: number;

  @ApiProperty({ description: 'Campos com consenso alto (>= 67%)', example: 28 })
  fieldsWithHighConsensus: number;

  @ApiProperty({
    description: 'Mapa de informações por campo',
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/FieldSourceInfoDto' },
  })
  fields: Record<string, FieldSourceInfoDto>;
}
