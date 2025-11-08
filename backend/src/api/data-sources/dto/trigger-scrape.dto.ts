import { IsString, IsEnum, IsUppercase, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ScrapeType {
  FUNDAMENTAL = 'fundamental',
  TECHNICAL = 'technical',
  OPTIONS = 'options',
}

export class TriggerScrapeDto {
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

  @ApiPropertyOptional({
    description: 'Tipo de dados para scraping',
    enum: ScrapeType,
    example: 'fundamental',
    default: 'fundamental',
  })
  @IsEnum(ScrapeType)
  @IsOptional()
  type?: ScrapeType;
}
