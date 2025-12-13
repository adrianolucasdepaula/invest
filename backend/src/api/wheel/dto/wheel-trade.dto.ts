import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsEnum, IsNumber, IsString, IsDate, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { WheelTradeType, WheelTradeStatus } from '@database/entities';

/**
 * DTO for creating a new WHEEL trade
 */
export class CreateWheelTradeDto {
  @ApiProperty({ description: 'Strategy ID' })
  @IsUUID()
  strategyId: string;

  @ApiProperty({ description: 'Trade type', enum: WheelTradeType })
  @IsEnum(WheelTradeType)
  tradeType: WheelTradeType;

  @ApiProperty({ description: 'Option symbol (e.g., PETR4A30)' })
  @IsString()
  optionSymbol: string;

  @ApiProperty({ description: 'Underlying ticker (e.g., PETR4)' })
  @IsString()
  underlyingTicker: string;

  @ApiProperty({ description: 'Option type: CALL or PUT' })
  @IsString()
  optionType: string;

  @ApiProperty({ description: 'Strike price' })
  @IsNumber()
  @Min(0)
  strike: number;

  @ApiProperty({ description: 'Expiration date' })
  @Type(() => Date)
  @IsDate()
  expiration: Date;

  @ApiProperty({ description: 'Number of contracts' })
  @IsNumber()
  @Min(1)
  contracts: number;

  @ApiProperty({ description: 'Entry price (premium per share)' })
  @IsNumber()
  @Min(0)
  entryPrice: number;

  @ApiProperty({ description: 'Underlying price at entry' })
  @IsNumber()
  @Min(0)
  underlyingPriceAtEntry: number;

  // Optional Greeks
  @ApiPropertyOptional({ description: 'Delta at entry' })
  @IsOptional()
  @IsNumber()
  @Min(-1)
  @Max(1)
  delta?: number;

  @ApiPropertyOptional({ description: 'Gamma at entry' })
  @IsOptional()
  @IsNumber()
  gamma?: number;

  @ApiPropertyOptional({ description: 'Theta at entry' })
  @IsOptional()
  @IsNumber()
  theta?: number;

  @ApiPropertyOptional({ description: 'Vega at entry' })
  @IsOptional()
  @IsNumber()
  vega?: number;

  @ApiPropertyOptional({ description: 'IV at entry (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ivAtEntry?: number;

  @ApiPropertyOptional({ description: 'IV Rank at entry (%)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ivRankAtEntry?: number;

  @ApiPropertyOptional({ description: 'Distribution week (1-4)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  distributionWeek?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for closing a WHEEL trade
 */
export class CloseWheelTradeDto {
  @ApiProperty({ description: 'Exit price (premium per share)' })
  @IsNumber()
  @Min(0)
  exitPrice: number;

  @ApiProperty({ description: 'Underlying price at exit' })
  @IsNumber()
  @Min(0)
  underlyingPriceAtExit: number;

  @ApiProperty({ description: 'Trade status after closing', enum: WheelTradeStatus })
  @IsEnum(WheelTradeStatus)
  status: WheelTradeStatus;

  @ApiPropertyOptional({ description: 'Commission paid' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commission?: number;

  @ApiPropertyOptional({ description: 'B3 fees' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  b3Fees?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for option recommendation (PUT or CALL)
 */
export class OptionRecommendationDto {
  @ApiProperty({ description: 'Option symbol' })
  symbol: string;

  @ApiProperty({ description: 'Option type: CALL or PUT' })
  type: string;

  @ApiProperty({ description: 'Strike price' })
  strike: number;

  @ApiProperty({ description: 'Expiration date' })
  expiration: Date;

  @ApiProperty({ description: 'Days to expiration' })
  daysToExpiration: number;

  @ApiProperty({ description: 'Current premium (last price)' })
  premium: number;

  @ApiProperty({ description: 'Bid price' })
  bid: number;

  @ApiProperty({ description: 'Ask price' })
  ask: number;

  // Greeks
  @ApiProperty({ description: 'Delta' })
  delta: number;

  @ApiPropertyOptional({ description: 'Gamma' })
  gamma?: number;

  @ApiPropertyOptional({ description: 'Theta' })
  theta?: number;

  @ApiPropertyOptional({ description: 'Vega' })
  vega?: number;

  // Volatility
  @ApiProperty({ description: 'Implied Volatility (%)' })
  iv: number;

  @ApiPropertyOptional({ description: 'IV Rank (%)' })
  ivRank?: number;

  // Liquidity
  @ApiProperty({ description: 'Volume' })
  volume: number;

  @ApiProperty({ description: 'Open Interest' })
  openInterest: number;

  // Returns
  @ApiProperty({ description: 'Premium return if expires OTM (%)' })
  premiumReturnPercent: number;

  @ApiProperty({ description: 'Annualized return (%)' })
  annualizedReturn: number;

  // Moneyness
  @ApiProperty({ description: 'Moneyness: ITM, ATM, OTM' })
  moneyness: string;

  @ApiProperty({ description: 'Distance from current price (%)' })
  distancePercent: number;

  // Score
  @ApiProperty({ description: 'Recommendation score (0-100)' })
  score: number;
}

/**
 * DTO for weekly PUT distribution schedule
 */
export class WeeklyScheduleDto {
  @ApiProperty({ description: 'Week number (1-4)' })
  week: number;

  @ApiProperty({ description: 'Capital to allocate' })
  capitalToAllocate: number;

  @ApiProperty({ description: 'Suggested contracts' })
  suggestedContracts: number;

  @ApiProperty({ description: 'Target expiration date' })
  targetExpiration: Date;

  @ApiProperty({ description: 'Days to expiration' })
  daysToExpiration: number;

  @ApiProperty({ description: 'Recommended options', type: [OptionRecommendationDto] })
  recommendations: OptionRecommendationDto[];
}

/**
 * DTO for WHEEL trade response
 */
export class WheelTradeResponseDto {
  @ApiProperty({ description: 'Trade ID' })
  id: string;

  @ApiProperty({ description: 'Strategy ID' })
  strategyId: string;

  @ApiProperty({ description: 'Trade type', enum: WheelTradeType })
  tradeType: WheelTradeType;

  @ApiProperty({ description: 'Trade status', enum: WheelTradeStatus })
  status: WheelTradeStatus;

  @ApiProperty({ description: 'Option symbol' })
  optionSymbol: string;

  @ApiProperty({ description: 'Option type' })
  optionType: string;

  @ApiProperty({ description: 'Strike price' })
  strike: number;

  @ApiProperty({ description: 'Expiration date' })
  expiration: Date;

  @ApiProperty({ description: 'Contracts' })
  contracts: number;

  @ApiProperty({ description: 'Entry price' })
  entryPrice: number;

  @ApiPropertyOptional({ description: 'Exit price' })
  exitPrice?: number;

  @ApiProperty({ description: 'Premium received' })
  premiumReceived: number;

  @ApiProperty({ description: 'Realized P&L' })
  realizedPnL: number;

  @ApiProperty({ description: 'Unrealized P&L' })
  unrealizedPnL: number;

  @ApiPropertyOptional({ description: 'Annualized return (%)' })
  annualizedReturn?: number;

  @ApiProperty({ description: 'Opened at' })
  openedAt: Date;

  @ApiPropertyOptional({ description: 'Closed at' })
  closedAt?: Date;
}

/**
 * DTO for cash yield calculation (Tesouro Selic)
 */
export class CashYieldDto {
  @ApiProperty({ description: 'Principal amount (cash not allocated)' })
  principal: number;

  @ApiProperty({ description: 'Number of days' })
  days: number;

  @ApiProperty({ description: 'Current SELIC rate (% a.a.)' })
  selicRate: number;

  @ApiProperty({ description: 'Expected yield in BRL' })
  expectedYield: number;

  @ApiProperty({ description: 'Effective annualized rate (%)' })
  effectiveRate: number;

  @ApiProperty({ description: 'Daily rate (%)' })
  dailyRate: number;

  @ApiProperty({ description: 'Final amount (principal + yield)' })
  finalAmount: number;
}

/**
 * DTO for strategy P&L analytics
 */
export class StrategyAnalyticsDto {
  @ApiProperty({ description: 'Strategy ID' })
  strategyId: string;

  @ApiProperty({ description: 'Total capital (notional)' })
  totalCapital: number;

  @ApiProperty({ description: 'Allocated capital' })
  allocatedCapital: number;

  @ApiProperty({ description: 'Available capital (cash)' })
  availableCapital: number;

  @ApiProperty({ description: 'Shares value' })
  sharesValue: number;

  @ApiProperty({ description: 'Realized P&L' })
  realizedPnL: number;

  @ApiProperty({ description: 'Unrealized P&L' })
  unrealizedPnL: number;

  @ApiProperty({ description: 'Total premium received' })
  totalPremiumReceived: number;

  @ApiProperty({ description: 'Total premium paid' })
  totalPremiumPaid: number;

  @ApiProperty({ description: 'Cash yield from Tesouro Selic' })
  cashYield: number;

  @ApiProperty({ description: 'Dividends received' })
  dividendsReceived: number;

  @ApiProperty({ description: 'Total return (%)' })
  totalReturn: number;

  @ApiProperty({ description: 'Annualized return (%)' })
  annualizedReturn: number;

  @ApiProperty({ description: 'Win rate (%)' })
  winRate: number;

  @ApiProperty({ description: 'Exercise rate (%)' })
  exerciseRate: number;

  @ApiPropertyOptional({ description: 'Cash yield projection', type: CashYieldDto })
  cashYieldProjection?: CashYieldDto;
}
