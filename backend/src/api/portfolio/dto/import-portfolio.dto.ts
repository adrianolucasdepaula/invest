import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ImportSource {
  B3_CEI = 'b3_cei',
  KINVO = 'kinvo',
  MANUAL = 'manual',
}

export class ImportPositionDto {
  @ApiProperty({ description: 'Asset ticker', example: 'PETR4' })
  @IsString()
  ticker: string;

  @ApiProperty({ description: 'Quantity', example: 100 })
  quantity: number;

  @ApiProperty({ description: 'Average price', example: 32.50 })
  averagePrice: number;

  @ApiPropertyOptional({ description: 'Total invested', example: 3250.00 })
  @IsOptional()
  totalInvested?: number;

  @ApiPropertyOptional({ description: 'Current price', example: 35.00 })
  @IsOptional()
  currentPrice?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Imported from B3' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ImportPortfolioDto {
  @ApiPropertyOptional({
    description: 'Import source',
    enum: ImportSource,
    default: ImportSource.MANUAL,
  })
  @IsOptional()
  @IsEnum(ImportSource)
  source?: ImportSource;

  @ApiPropertyOptional({
    description: 'Portfolio name',
    example: 'Carteira Importada',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Array of positions to import',
    type: [ImportPositionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportPositionDto)
  positions?: ImportPositionDto[];

  @ApiPropertyOptional({
    description: 'Raw file data (base64 encoded)',
    example: 'SGVsbG8gV29ybGQ=',
  })
  @IsOptional()
  @IsString()
  fileData?: string;

  @ApiPropertyOptional({
    description: 'Original filename',
    example: 'portfolio_b3.xlsx',
  })
  @IsOptional()
  @IsString()
  filename?: string;
}
