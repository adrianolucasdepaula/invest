import { IsString, IsNumber, IsPositive, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPositionDto {
  @ApiProperty({
    description: 'Ticker do ativo (código B3)',
    example: 'PETR4',
  })
  @IsString()
  ticker: string;

  @ApiProperty({
    description: 'Quantidade de ações/cotas',
    example: 100,
    minimum: 1,
  })
  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Preço médio de compra',
    example: 28.50,
    minimum: 0.01,
  })
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  averagePrice: number;
}
