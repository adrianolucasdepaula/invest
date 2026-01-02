import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Timeframes disponíveis para dados intraday
 * Alinhados com TradingView e outros providers
 */
export enum IntradayTimeframeParam {
  M1 = '1m',
  M5 = '5m',
  M15 = '15m',
  M30 = '30m',
  H1 = '1h',
  H4 = '4h',
}

/**
 * Range de período para consulta
 */
export enum IntradayRangeParam {
  H1 = '1h', // Última hora
  H4 = '4h', // Últimas 4 horas
  D1 = '1d', // Último dia
  D5 = '5d', // Últimos 5 dias
  W1 = '1w', // Última semana
  W2 = '2w', // Últimas 2 semanas
  M1 = '1mo', // Último mês
}

export class GetIntradayDto {
  @ApiPropertyOptional({
    description: 'Timeframe do candle intraday',
    enum: IntradayTimeframeParam,
    default: IntradayTimeframeParam.M15,
    example: '15m',
  })
  @IsOptional()
  @IsEnum(IntradayTimeframeParam)
  timeframe?: IntradayTimeframeParam;

  @ApiPropertyOptional({
    description: 'Período de dados a retornar',
    enum: IntradayRangeParam,
    default: IntradayRangeParam.D1,
    example: '1d',
  })
  @IsOptional()
  @IsEnum(IntradayRangeParam)
  range?: IntradayRangeParam;

  @ApiPropertyOptional({
    description: 'Data/hora inicial (ISO 8601). Sobrescreve range se fornecido.',
    example: '2025-12-04T10:00:00-03:00',
  })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'Data/hora final (ISO 8601). Default: agora.',
    example: '2025-12-04T18:00:00-03:00',
  })
  @IsOptional()
  @IsDateString()
  endTime?: string;
}

/**
 * Response DTO para dados intraday
 */
export class IntradayDataResponseDto {
  @ApiProperty({ example: 'PETR4' })
  ticker: string;

  @ApiProperty({ enum: IntradayTimeframeParam, example: '15m' })
  timeframe: string;

  @ApiProperty({ example: 96 })
  count: number;

  @ApiProperty({
    description: 'Array de candles OHLCV',
    example: [
      {
        timestamp: '2025-12-04T10:00:00-03:00',
        open: 37.5,
        high: 37.65,
        low: 37.45,
        close: 37.6,
        volume: 1234567,
      },
    ],
  })
  data: IntradayCandleDto[];

  @ApiProperty({
    description: 'Metadados da consulta',
    example: {
      source: 'hypertable',
      startTime: '2025-12-04T10:00:00-03:00',
      endTime: '2025-12-04T18:00:00-03:00',
      cached: false,
    },
  })
  metadata: {
    source: string;
    startTime: string;
    endTime: string;
    cached: boolean;
  };
}

export class IntradayCandleDto {
  @ApiProperty({ example: '2025-12-04T10:00:00-03:00' })
  timestamp: string;

  @ApiProperty({ example: 37.5 })
  open: number;

  @ApiProperty({ example: 37.65 })
  high: number;

  @ApiProperty({ example: 37.45 })
  low: number;

  @ApiProperty({ example: 37.6 })
  close: number;

  @ApiProperty({ example: 1234567 })
  volume: number;

  @ApiPropertyOptional({ example: 46234567.89 })
  volumeFinancial?: number;

  @ApiPropertyOptional({ example: 5432 })
  numberOfTrades?: number;

  @ApiPropertyOptional({ example: 37.55 })
  vwap?: number;
}
