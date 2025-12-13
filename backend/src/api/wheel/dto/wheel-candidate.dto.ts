import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

/**
 * Query parameters for filtering WHEEL candidates
 */
export class WheelCandidateQueryDto {
  @ApiPropertyOptional({ description: 'Minimum ROE (%)', default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minROE?: number;

  @ApiPropertyOptional({ description: 'Minimum Dividend Yield (%)', default: 6 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minDividendYield?: number;

  @ApiPropertyOptional({ description: 'Maximum Debt/EBITDA', default: 2.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDividaEbitda?: number;

  @ApiPropertyOptional({ description: 'Minimum Net Margin (%)', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minMargemLiquida?: number;

  @ApiPropertyOptional({ description: 'Minimum IV Rank (%)', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minIVRank?: number;

  @ApiPropertyOptional({ description: 'Minimum Open Interest', default: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOpenInterest?: number;

  @ApiPropertyOptional({ description: 'Must have options available', default: true })
  @IsOptional()
  @IsBoolean()
  hasOptions?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Response DTO for a WHEEL candidate asset
 */
export class WheelCandidateResponseDto {
  @ApiProperty({ description: 'Asset ID' })
  id: string;

  @ApiProperty({ description: 'Asset ticker' })
  ticker: string;

  @ApiProperty({ description: 'Company name' })
  name: string;

  @ApiProperty({ description: 'Current price' })
  currentPrice: number;

  // Fundamental indicators
  @ApiPropertyOptional({ description: 'Return on Equity (%)' })
  roe?: number;

  @ApiPropertyOptional({ description: 'Dividend Yield (%)' })
  dividendYield?: number;

  @ApiPropertyOptional({ description: 'Net Debt/EBITDA' })
  dividaEbitda?: number;

  @ApiPropertyOptional({ description: 'Net Margin (%)' })
  margemLiquida?: number;

  @ApiPropertyOptional({ description: 'P/L ratio' })
  pl?: number;

  // Options data
  @ApiPropertyOptional({ description: 'IV Rank (%)' })
  ivRank?: number;

  @ApiPropertyOptional({ description: 'IV Percentile (%)' })
  ivPercentile?: number;

  @ApiPropertyOptional({ description: 'Historical Volatility (%)' })
  historicalVolatility?: number;

  @ApiPropertyOptional({ description: 'Has options available' })
  hasOptions?: boolean;

  @ApiPropertyOptional({ description: 'Total open interest' })
  totalOpenInterest?: number;

  // WHEEL score
  @ApiProperty({ description: 'WHEEL suitability score (0-100)' })
  wheelScore: number;

  @ApiPropertyOptional({ description: 'Score breakdown' })
  scoreBreakdown?: {
    fundamentalScore: number;
    liquidityScore: number;
    volatilityScore: number;
  };
}

/**
 * Paginated response for candidates
 */
export class WheelCandidatesListResponseDto {
  @ApiProperty({ type: [WheelCandidateResponseDto] })
  data: WheelCandidateResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;
}
