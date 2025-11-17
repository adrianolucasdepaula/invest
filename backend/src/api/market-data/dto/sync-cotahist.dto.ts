import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class SyncCotahistDto {
  @ApiProperty({
    description: 'Ticker do ativo (ex: ABEV3, PETR4, VALE3)',
    example: 'ABEV3',
  })
  @IsString()
  ticker: string;

  @ApiProperty({
    description: 'Ano inicial para sincronização (1986-2025)',
    example: 2020,
    minimum: 1986,
    maximum: 2025,
    required: false,
  })
  @IsInt()
  @Min(1986)
  @Max(2025)
  @IsOptional()
  startYear?: number = 2020; // Default: últimos 5 anos

  @ApiProperty({
    description: 'Ano final para sincronização (1986-2025)',
    example: 2025,
    minimum: 1986,
    maximum: 2025,
    required: false,
  })
  @IsInt()
  @Min(1986)
  @Max(2025)
  @IsOptional()
  endYear?: number = new Date().getFullYear();
}

export class SyncCotahistResponseDto {
  @ApiProperty({
    description: 'Total de registros sincronizados no PostgreSQL',
    example: 1200,
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Número de anos processados',
    example: 5,
  })
  yearsProcessed: number;

  @ApiProperty({
    description: 'Tempo de processamento em segundos',
    example: 12.5,
  })
  processingTime: number;

  @ApiProperty({
    description: 'Estatísticas de fontes de dados utilizadas',
    example: {
      cotahist: 1150,
      brapi: 67,
      merged: 1200,
    },
  })
  sources: {
    cotahist: number;
    brapi: number;
    merged: number;
  };

  @ApiProperty({
    description: 'Período dos dados sincronizados',
    example: {
      start: '2020-01-02',
      end: '2024-11-15',
    },
  })
  period: {
    start: string;
    end: string;
  };
}
