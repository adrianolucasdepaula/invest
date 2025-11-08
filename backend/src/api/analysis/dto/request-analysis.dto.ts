import { IsString, IsEnum, IsUppercase, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AnalysisTypeRequest {
  FUNDAMENTAL = 'fundamental',
  TECHNICAL = 'technical',
  COMPLETE = 'complete',
}

export class RequestAnalysisDto {
  @ApiProperty({
    description: 'Ticker do ativo',
    example: 'PETR4',
    pattern: '^[A-Z]{4}[0-9]{1,2}$',
  })
  @IsString()
  @IsUppercase()
  @Matches(/^[A-Z]{4}[0-9]{1,2}$/, {
    message: 'Ticker deve estar no formato válido da B3 (ex: PETR4, VALE3)',
  })
  ticker: string;

  @ApiProperty({
    description: 'Tipo de análise',
    enum: AnalysisTypeRequest,
    example: 'technical',
  })
  @IsEnum(AnalysisTypeRequest)
  type: AnalysisTypeRequest;
}
