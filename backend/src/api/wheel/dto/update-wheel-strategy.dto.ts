import { IsString, IsOptional, IsNumber, IsEnum, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MarketTrend, WheelPhase, WheelStrategyStatus } from '@database/entities';
import { WheelConfigDto } from './create-wheel-strategy.dto';

export class UpdateWheelStrategyDto {
  @ApiPropertyOptional({ description: 'Strategy name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Strategy description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Strategy status', enum: WheelStrategyStatus })
  @IsOptional()
  @IsEnum(WheelStrategyStatus)
  status?: WheelStrategyStatus;

  @ApiPropertyOptional({ description: 'Current phase', enum: WheelPhase })
  @IsOptional()
  @IsEnum(WheelPhase)
  phase?: WheelPhase;

  @ApiPropertyOptional({ description: 'Market trend', enum: MarketTrend })
  @IsOptional()
  @IsEnum(MarketTrend)
  marketTrend?: MarketTrend;

  @ApiPropertyOptional({ description: 'Total notional capital' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  notional?: number;

  @ApiPropertyOptional({ description: 'Strategy configuration', type: WheelConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WheelConfigDto)
  config?: WheelConfigDto;
}
