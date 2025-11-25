import { ApiProperty } from '@nestjs/swagger';

export class SyncOptionsLiquidityResponseDto {
  @ApiProperty({ example: 150 })
  totalUpdated: number;

  @ApiProperty({ example: ['PETR4', 'VALE3', 'ITUB4'] })
  assetsWithOptions: string[];
}
