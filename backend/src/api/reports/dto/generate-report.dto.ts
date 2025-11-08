import { IsString, IsUppercase, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateReportDto {
  @ApiProperty({
    description: 'Ticker do ativo para gerar relatório',
    example: 'PETR4',
    pattern: '^[A-Z]{4}[0-9]{1,2}$',
  })
  @IsString()
  @IsUppercase()
  @Matches(/^[A-Z]{4}[0-9]{1,2}$/, {
    message: 'Ticker deve estar no formato válido da B3 (ex: PETR4, VALE3)',
  })
  ticker: string;
}
