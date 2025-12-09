import { ApiProperty } from '@nestjs/swagger';

export class SyncOptionsLiquidityResponseDto {
  @ApiProperty({ example: 150, description: 'Total de ativos com hasOptions alterado' })
  totalUpdated: number;

  @ApiProperty({ example: 145, description: 'Ativos que passaram a ter opções' })
  optionsAdded: number;

  @ApiProperty({ example: 5, description: 'Ativos que deixaram de ter opções' })
  optionsRemoved: number;

  @ApiProperty({ example: ['PETR4', 'VALE3', 'ITUB4'], description: 'Lista de tickers com opções' })
  assetsWithOptions: string[];

  @ApiProperty({ example: 174, description: 'Total de ativos com opções disponíveis' })
  totalWithOptions: number;

  @ApiProperty({ example: 15230, description: 'Duração da sincronização em milissegundos' })
  duration: number;
}
