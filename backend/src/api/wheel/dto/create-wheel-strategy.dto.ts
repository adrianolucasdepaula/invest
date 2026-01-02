import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsEnum,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketTrend } from '@database/entities';

export class WheelConfigDto {
  @ApiPropertyOptional({ description: 'Minimum ROE for asset selection', default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minROE?: number;

  @ApiPropertyOptional({ description: 'Minimum Dividend Yield', default: 6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minDividendYield?: number;

  @ApiPropertyOptional({ description: 'Maximum Debt/EBITDA ratio', default: 2.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDividaEbitda?: number;

  @ApiPropertyOptional({ description: 'Minimum Net Margin', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minMargemLiquida?: number;

  @ApiPropertyOptional({ description: 'Target delta for option selection', default: 0.15 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(1)
  targetDelta?: number;

  @ApiPropertyOptional({ description: 'Minimum Open Interest', default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOpenInterest?: number;

  @ApiPropertyOptional({ description: 'Minimum Volume', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minVolume?: number;

  @ApiPropertyOptional({ description: 'Minimum IV Rank', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minIVRank?: number;

  @ApiPropertyOptional({ description: 'Target days to expiration (monthly)', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  expirationDays?: number;

  @ApiPropertyOptional({ description: 'Distribute PUTs across 4 weeks', default: true })
  @IsOptional()
  weeklyDistribution?: boolean;

  @ApiPropertyOptional({ description: 'Maximum weekly allocation (%)', default: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxWeeklyAllocation?: number;
}

export class CreateWheelStrategyDto {
  @ApiProperty({ description: 'Asset ID for the WHEEL strategy' })
  @IsUUID()
  assetId: string;

  @ApiPropertyOptional({ description: 'Strategy name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Strategy description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Total capital allocated (notional)', example: 100000 })
  @IsNumber()
  @Min(0)
  notional: number;

  @ApiPropertyOptional({ description: 'Market trend assessment', enum: MarketTrend })
  @IsOptional()
  @IsEnum(MarketTrend)
  marketTrend?: MarketTrend;

  @ApiPropertyOptional({ description: 'Strategy configuration', type: WheelConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WheelConfigDto)
  config?: WheelConfigDto;
}
