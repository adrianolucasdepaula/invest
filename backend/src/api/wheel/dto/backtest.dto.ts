import {
  IsUUID,
  IsString,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import Decimal from 'decimal.js';
import {
  BacktestStatus,
  BacktestConfig,
  EquityCurvePoint,
  SimulatedTrade,
} from '@database/entities/backtest-result.entity';

/**
 * DTO for backtest configuration
 */
export class BacktestConfigDto implements BacktestConfig {
  @ApiProperty({
    description: 'Capital inicial em R$',
    example: 1000000,
    minimum: 10000,
  })
  @IsNumber()
  @Min(10000)
  initialCapital: number;

  @ApiProperty({
    description: 'Delta alvo para seleção de opções (0.05 a 0.30)',
    example: 0.15,
  })
  @IsNumber()
  @Min(0.05)
  @Max(0.3)
  targetDelta: number;

  @ApiProperty({
    description: 'ROE mínimo para seleção de ativos (%)',
    example: 15,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  minROE: number;

  @ApiProperty({
    description: 'Dividend Yield mínimo (%)',
    example: 6,
  })
  @IsNumber()
  @Min(0)
  @Max(50)
  minDividendYield: number;

  @ApiProperty({
    description: 'Dívida/EBITDA máximo',
    example: 2.0,
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  maxDebtEbitda: number;

  @ApiPropertyOptional({
    description: 'Margem líquida mínima (%)',
    example: 10,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  minMargemLiquida?: number;

  @ApiPropertyOptional({
    description: 'Dias até expiração preferido',
    example: 30,
  })
  @IsNumber()
  @IsOptional()
  @Min(7)
  @Max(90)
  expirationDays?: number;

  @ApiProperty({
    description: 'Distribuir vendas semanalmente',
    example: true,
  })
  @IsBoolean()
  weeklyDistribution: boolean;

  @ApiPropertyOptional({
    description: 'Alocação máxima por semana (0.10 a 0.50)',
    example: 0.25,
  })
  @IsNumber()
  @IsOptional()
  @Min(0.1)
  @Max(0.5)
  maxWeeklyAllocation?: number;

  @ApiProperty({
    description: 'Reinvestir dividendos automaticamente',
    example: true,
  })
  @IsBoolean()
  reinvestDividends: boolean;

  @ApiProperty({
    description: 'Incluir renda de aluguel de ações',
    example: true,
  })
  @IsBoolean()
  includeLendingIncome: boolean;
}

/**
 * DTO for creating a new backtest
 */
export class CreateBacktestDto {
  @ApiProperty({ description: 'ID do ativo para backtest' })
  @IsUUID()
  assetId: string;

  @ApiProperty({
    description: 'Nome do backtest',
    example: 'Backtest PETR4 60 meses',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Data inicial do backtest (YYYY-MM-DD)',
    example: '2020-12-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Data final do backtest (YYYY-MM-DD)',
    example: '2025-12-01',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Configuração do backtest' })
  @ValidateNested()
  @Type(() => BacktestConfigDto)
  config: BacktestConfigDto;
}

/**
 * DTO for backtest query
 */
export class BacktestQueryDto {
  @ApiPropertyOptional({ description: 'Filtrar por asset ID' })
  @IsUUID()
  @IsOptional()
  assetId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por status' })
  @IsEnum(BacktestStatus)
  @IsOptional()
  status?: BacktestStatus;

  @ApiPropertyOptional({ description: 'Limite de resultados', default: 20 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset para paginação', default: 0 })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  offset?: number;
}

/**
 * Response DTO for income breakdown
 * Note: Decimal fields serialize to string in JSON automatically
 */
export class IncomeBreakdownDto {
  @ApiProperty({ description: 'Renda de prêmios de opções (R$)', type: 'string' })
  premiumIncome: Decimal;

  @ApiProperty({ description: 'Renda de dividendos/JCP (R$)', type: 'string' })
  dividendIncome: Decimal;

  @ApiProperty({ description: 'Renda de aluguel de ações (R$)', type: 'string' })
  lendingIncome: Decimal;

  @ApiProperty({ description: 'Renda de Selic (colateral) (R$)', type: 'string' })
  selicIncome: Decimal;

  @ApiProperty({ description: 'Total de renda (R$)', type: 'string' })
  total: Decimal;

  @ApiProperty({ description: 'Percentual de prêmios', type: 'string' })
  premiumPercent: Decimal;

  @ApiProperty({ description: 'Percentual de dividendos', type: 'string' })
  dividendPercent: Decimal;

  @ApiProperty({ description: 'Percentual de aluguel', type: 'string' })
  lendingPercent: Decimal;

  @ApiProperty({ description: 'Percentual de Selic', type: 'string' })
  selicPercent: Decimal;
}

/**
 * Response DTO for risk metrics
 * Note: Decimal fields serialize to string in JSON automatically
 */
export class RiskMetricsDto {
  @ApiProperty({ description: 'CAGR - Compound Annual Growth Rate (%)', type: 'string' })
  cagr: Decimal;

  @ApiProperty({ description: 'Sharpe Ratio', type: 'string' })
  sharpeRatio: Decimal;

  @ApiProperty({ description: 'Sortino Ratio', type: 'string' })
  sortinoRatio: Decimal;

  @ApiProperty({ description: 'Maximum Drawdown (%)', type: 'string' })
  maxDrawdown: Decimal;

  @ApiProperty({ description: 'Dias no maior drawdown' })
  maxDrawdownDays: number;

  @ApiProperty({ description: 'Win Rate (%)', type: 'string' })
  winRate: Decimal;

  @ApiProperty({ description: 'Profit Factor', type: 'string' })
  profitFactor: Decimal;

  @ApiPropertyOptional({ description: 'Calmar Ratio', type: 'string' })
  calmarRatio?: Decimal | null;
}

/**
 * Response DTO for trade statistics
 * Note: Decimal fields serialize to string in JSON automatically
 */
export class TradeStatsDto {
  @ApiProperty({ description: 'Total de trades' })
  totalTrades: number;

  @ApiProperty({ description: 'Trades vencedores' })
  winningTrades: number;

  @ApiProperty({ description: 'Trades perdedores' })
  losingTrades: number;

  @ApiProperty({ description: 'Número de exercícios' })
  exercises: number;

  @ApiProperty({ description: 'Lucro médio por trade (R$)', type: 'string' })
  averageProfit: Decimal;

  @ApiProperty({ description: 'Perda média por trade (R$)', type: 'string' })
  averageLoss: Decimal;

  @ApiProperty({ description: 'Maior lucro (R$)', type: 'string' })
  maxProfit: Decimal;

  @ApiProperty({ description: 'Maior perda (R$)', type: 'string' })
  maxLoss: Decimal;
}

/**
 * Response DTO for benchmark comparison
 * Note: Decimal fields serialize to string in JSON automatically
 */
export class BenchmarkComparisonDto {
  @ApiProperty({ description: 'Nome do benchmark' })
  name: string;

  @ApiProperty({ description: 'Retorno total (%)', type: 'string' })
  totalReturn: Decimal;

  @ApiProperty({ description: 'CAGR (%)', type: 'string' })
  cagr: Decimal;

  @ApiPropertyOptional({ description: 'Volatilidade anualizada (%)', type: 'string' })
  volatility?: Decimal | null;
}

/**
 * Complete response DTO for backtest result
 * Note: Decimal fields serialize to string in JSON automatically
 */
export class BacktestResultDto {
  @ApiProperty({ description: 'ID do backtest' })
  id: string;

  @ApiProperty({ description: 'ID do usuário' })
  userId: string;

  @ApiProperty({ description: 'ID do ativo' })
  assetId: string;

  @ApiProperty({ description: 'Ticker do ativo' })
  ticker: string;

  @ApiProperty({ description: 'Nome do backtest' })
  name: string;

  @ApiProperty({ description: 'Data inicial' })
  startDate: string;

  @ApiProperty({ description: 'Data final' })
  endDate: string;

  @ApiProperty({ description: 'Status do backtest' })
  status: BacktestStatus;

  @ApiProperty({ description: 'Progresso (0-100)' })
  progress: number;

  // Capital & Returns
  @ApiProperty({ description: 'Capital inicial (R$)', type: 'string' })
  initialCapital: Decimal;

  @ApiProperty({ description: 'Capital final (R$)', type: 'string' })
  finalCapital: Decimal;

  @ApiProperty({ description: 'Retorno total (R$)', type: 'string' })
  totalReturn: Decimal;

  @ApiProperty({ description: 'Retorno total (%)', type: 'string' })
  totalReturnPercent: Decimal;

  // Nested DTOs
  @ApiProperty({ description: 'Configuração usada' })
  config: BacktestConfig;

  @ApiProperty({ description: 'Métricas de risco' })
  riskMetrics: RiskMetricsDto;

  @ApiProperty({ description: 'Estatísticas de trades' })
  tradeStats: TradeStatsDto;

  @ApiProperty({ description: 'Breakdown de renda' })
  incomeBreakdown: IncomeBreakdownDto;

  @ApiPropertyOptional({ description: 'Comparação com benchmarks' })
  benchmarks?: BenchmarkComparisonDto[];

  // Detailed data (optional - for full result)
  @ApiPropertyOptional({ description: 'Curva de patrimônio' })
  equityCurve?: EquityCurvePoint[];

  @ApiPropertyOptional({ description: 'Trades simulados' })
  simulatedTrades?: SimulatedTrade[];

  // Metadata
  @ApiPropertyOptional({ description: 'Tempo de execução (segundos)', type: 'string' })
  executionTime?: Decimal | null;

  @ApiPropertyOptional({ description: 'Mensagem de erro (se falhou)' })
  errorMessage?: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

/**
 * Summary DTO for listing backtests
 * Note: Decimal fields serialize to string in JSON automatically
 */
export class BacktestSummaryDto {
  @ApiProperty({ description: 'ID do backtest' })
  id: string;

  @ApiProperty({ description: 'Nome do backtest' })
  name: string;

  @ApiProperty({ description: 'Ticker do ativo' })
  ticker: string;

  @ApiProperty({ description: 'Status' })
  status: BacktestStatus;

  @ApiProperty({ description: 'Período' })
  period: string;

  @ApiProperty({ description: 'Capital inicial (R$)', type: 'string' })
  initialCapital: Decimal;

  @ApiProperty({ description: 'Capital final (R$)', type: 'string' })
  finalCapital: Decimal;

  @ApiProperty({ description: 'Retorno total (%)', type: 'string' })
  totalReturnPercent: Decimal;

  @ApiProperty({ description: 'CAGR (%)', type: 'string' })
  cagr: Decimal;

  @ApiProperty({ description: 'Sharpe Ratio', type: 'string' })
  sharpeRatio: Decimal;

  @ApiProperty({ description: 'Max Drawdown (%)', type: 'string' })
  maxDrawdown: Decimal;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;
}

/**
 * Response DTO for backtest creation (async)
 */
export class BacktestCreatedDto {
  @ApiProperty({ description: 'ID do backtest criado' })
  id: string;

  @ApiProperty({ description: 'Status inicial' })
  status: BacktestStatus;

  @ApiProperty({ description: 'Progresso inicial' })
  progress: number;

  @ApiProperty({ description: 'Tempo estimado em segundos' })
  estimatedTime: number;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;
}
