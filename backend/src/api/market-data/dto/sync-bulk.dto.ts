import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsInt,
  Min,
  Max,
  ArrayMinSize,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

/**
 * Validador customizado para garantir que endYear >= startYear
 */
@ValidatorConstraint({ name: 'IsEndYearGreaterThanOrEqualToStartYear', async: false })
export class IsEndYearGreaterThanOrEqualToStartYear implements ValidatorConstraintInterface {
  validate(endYear: number, args: ValidationArguments) {
    const object = args.object as any;
    const startYear = object.startYear;

    if (typeof startYear !== 'number' || typeof endYear !== 'number') {
      return false;
    }

    return endYear >= startYear;
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as any;
    return `Ano final (${object.endYear}) deve ser maior ou igual ao ano inicial (${object.startYear})`;
  }
}

/**
 * DTO para sincronização em massa de múltiplos ativos
 * FASE 35 - Sistema de Gerenciamento de Sync B3
 *
 * Características:
 * - Sem limite máximo de tickers (processamento em background via BullMQ)
 * - Processamento sequencial (1 por vez) para estabilidade Python Service
 * - Período: 1986-2025 (histórico completo COTAHIST B3)
 * - Retorna HTTP 202 Accepted imediatamente (não aguarda conclusão)
 * - Acompanhamento em tempo real via WebSocket (evento: sync:progress)
 */
export class SyncBulkDto {
  @ApiProperty({
    example: ['VALE3', 'PETR4', 'ABEV3'],
    description: 'Lista de tickers para sincronizar (mínimo 1, sem limite máximo)',
    type: [String],
    minItems: 1,
  })
  @IsArray({ message: 'tickers deve ser um array' })
  @IsString({ each: true, message: 'Cada ticker deve ser uma string' })
  @ArrayMinSize(1, { message: 'Pelo menos 1 ticker é necessário' })
  tickers: string[];

  @ApiProperty({
    example: 1986,
    description: 'Ano inicial do histórico (1986 = início COTAHIST B3)',
    minimum: 1986,
    maximum: 2025,
  })
  @IsInt({ message: 'startYear deve ser um número inteiro' })
  @Min(1986, { message: 'Ano inicial mínimo é 1986 (início COTAHIST B3)' })
  @Max(2025, { message: 'Ano inicial máximo é 2025' })
  startYear: number;

  @ApiProperty({
    example: 2025,
    description: 'Ano final do histórico (até 2025 - ano corrente)',
    minimum: 1986,
    maximum: 2025,
  })
  @IsInt({ message: 'endYear deve ser um número inteiro' })
  @Min(1986, { message: 'Ano final mínimo é 1986' })
  @Max(2025, { message: 'Ano final máximo é 2025' })
  @Validate(IsEndYearGreaterThanOrEqualToStartYear)
  endYear: number;
}

/**
 * DTO para resposta de sync bulk
 * Retorna resumo da operação (não aguarda conclusão - async)
 */
export class SyncBulkResponseDto {
  @ApiProperty({
    example: 'Sync iniciado em background',
    description: 'Mensagem de confirmação',
  })
  message: string;

  @ApiProperty({
    example: 20,
    description: 'Quantidade total de tickers para sincronizar',
  })
  totalTickers: number;

  @ApiProperty({
    example: 50,
    description: 'Tempo estimado total (minutos) baseado em 2.5min/ativo',
    nullable: true,
  })
  estimatedMinutes: number | null;

  @ApiProperty({
    example: 'Acompanhe o progresso em tempo real via WebSocket (evento: sync:progress)',
    description: 'Instruções para acompanhamento do progresso',
  })
  instructions: string;
}
