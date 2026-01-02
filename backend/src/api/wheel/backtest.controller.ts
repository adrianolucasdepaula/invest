import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import Decimal from 'decimal.js';
import { JwtAuthGuard } from '@api/auth/guards/jwt-auth.guard';
import { BacktestService } from './backtest.service';
import {
  CreateBacktestDto,
  BacktestQueryDto,
  BacktestResultDto,
  BacktestSummaryDto,
  BacktestCreatedDto,
} from './dto';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

/**
 * Controller for WHEEL Strategy Backtesting
 *
 * Provides endpoints to run, monitor, and retrieve backtests
 * for the Wheel Turbinada strategy.
 *
 * @phase FASE 101.4 - Wheel Turbinada Backtesting Engine
 */
@ApiTags('wheel-backtest')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wheel/backtest')
export class BacktestController {
  private readonly logger = new Logger(BacktestController.name);

  constructor(private readonly backtestService: BacktestService) {}

  // ===========================================
  // CREATE BACKTEST
  // ===========================================

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Create and start a new WHEEL backtest',
    description: `
      Initiates a new backtest for the WHEEL Turbinada strategy.
      The backtest runs asynchronously and can be monitored via GET /wheel/backtest/:id.

      Configuration includes:
      - Initial capital (min R$ 10,000)
      - Target delta for option selection (0.05-0.30)
      - Fundamental filters (ROE, DY, Debt/EBITDA)
      - Income options (dividends, stock lending)
    `,
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Backtest created and started',
    type: BacktestCreatedDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid configuration',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Asset not found',
  })
  async createBacktest(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBacktestDto,
  ): Promise<BacktestCreatedDto> {
    this.logger.log(`Creating backtest for user ${req.user.id}, asset ${dto.assetId}`);
    return this.backtestService.createBacktest(req.user.id, dto);
  }

  // ===========================================
  // LIST BACKTESTS
  // ===========================================

  @Get()
  @ApiOperation({
    summary: 'List all backtests for the authenticated user',
    description: `
      Returns a paginated list of backtests with summary information.
      Can filter by asset ID and status (running, completed, failed).
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of backtests',
    type: [BacktestSummaryDto],
  })
  async listBacktests(
    @Req() req: AuthenticatedRequest,
    @Query() query: BacktestQueryDto,
  ): Promise<BacktestSummaryDto[]> {
    return this.backtestService.findAll(req.user.id, query);
  }

  // ===========================================
  // GET BACKTEST RESULT
  // ===========================================

  @Get(':id')
  @ApiOperation({
    summary: 'Get full backtest result',
    description: `
      Returns the complete backtest result including:
      - Risk metrics (CAGR, Sharpe, Sortino, Max Drawdown)
      - Trade statistics (win rate, profit factor)
      - Income breakdown (premiums, dividends, lending, Selic)
      - Equity curve (for charting)
      - Simulated trades list

      If backtest is still running, returns current progress.
    `,
  })
  @ApiParam({ name: 'id', description: 'Backtest ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Backtest result',
    type: BacktestResultDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Backtest not found',
  })
  async getBacktest(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BacktestResultDto> {
    return this.backtestService.findById(id, req.user.id);
  }

  // ===========================================
  // GET BACKTEST PROGRESS
  // ===========================================

  @Get(':id/progress')
  @ApiOperation({
    summary: 'Get backtest execution progress',
    description: 'Returns the current progress percentage for a running backtest.',
  })
  @ApiParam({ name: 'id', description: 'Backtest ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Backtest progress',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string', enum: ['running', 'completed', 'failed'] },
        progress: { type: 'number', minimum: 0, maximum: 100 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Backtest not found',
  })
  async getBacktestProgress(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ id: string; status: string; progress: number }> {
    const backtest = await this.backtestService.findById(id, req.user.id);
    return {
      id: backtest.id,
      status: backtest.status,
      progress: backtest.progress,
    };
  }

  // ===========================================
  // DELETE BACKTEST
  // ===========================================

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a backtest result',
    description: 'Permanently deletes a backtest and all associated data.',
  })
  @ApiParam({ name: 'id', description: 'Backtest ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Backtest deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Backtest not found',
  })
  async deleteBacktest(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    this.logger.log(`Deleting backtest ${id} for user ${req.user.id}`);
    return this.backtestService.delete(id, req.user.id);
  }

  // ===========================================
  // COMPARE BACKTESTS
  // ===========================================

  @Get('compare/:id1/:id2')
  @ApiOperation({
    summary: 'Compare two backtests',
    description: 'Returns a side-by-side comparison of two backtest results.',
  })
  @ApiParam({ name: 'id1', description: 'First Backtest ID' })
  @ApiParam({ name: 'id2', description: 'Second Backtest ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comparison result',
    schema: {
      type: 'object',
      properties: {
        backtest1: { $ref: '#/components/schemas/BacktestSummaryDto' },
        backtest2: { $ref: '#/components/schemas/BacktestSummaryDto' },
        comparison: {
          type: 'object',
          properties: {
            cagrDiff: { type: 'number' },
            sharpeDiff: { type: 'number' },
            maxDrawdownDiff: { type: 'number' },
            winner: { type: 'string', enum: ['backtest1', 'backtest2', 'tie'] },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'One or both backtests not found',
  })
  async compareBacktests(
    @Req() req: AuthenticatedRequest,
    @Param('id1', ParseUUIDPipe) id1: string,
    @Param('id2', ParseUUIDPipe) id2: string,
  ): Promise<{
    backtest1: BacktestSummaryDto;
    backtest2: BacktestSummaryDto;
    comparison: {
      cagrDiff: number;
      sharpeDiff: number;
      maxDrawdownDiff: number;
      winner: 'backtest1' | 'backtest2' | 'tie';
    };
  }> {
    const [b1, b2] = await Promise.all([
      this.backtestService.findById(id1, req.user.id),
      this.backtestService.findById(id2, req.user.id),
    ]);

    const cagrDiff = Number(b1.riskMetrics.cagr) - Number(b2.riskMetrics.cagr);
    const sharpeDiff = Number(b1.riskMetrics.sharpeRatio) - Number(b2.riskMetrics.sharpeRatio);
    const maxDrawdownDiff = Number(b1.riskMetrics.maxDrawdown) - Number(b2.riskMetrics.maxDrawdown);

    // Determine winner based on Sharpe ratio (best risk-adjusted return)
    let winner: 'backtest1' | 'backtest2' | 'tie' = 'tie';
    if (sharpeDiff > 0.1) winner = 'backtest1';
    else if (sharpeDiff < -0.1) winner = 'backtest2';

    return {
      backtest1: this.toSummary(b1),
      backtest2: this.toSummary(b2),
      comparison: {
        cagrDiff,
        sharpeDiff,
        maxDrawdownDiff,
        winner,
      },
    };
  }

  /**
   * Convert full result to summary
   */
  private toSummary(result: BacktestResultDto): BacktestSummaryDto {
    const startDate = new Date(result.startDate);
    const endDate = new Date(result.endDate);

    return {
      id: result.id,
      name: result.name,
      ticker: result.ticker,
      status: result.status,
      period: `${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      initialCapital: result.initialCapital,
      finalCapital: result.finalCapital,
      totalReturnPercent: result.totalReturnPercent,
      cagr: result.riskMetrics.cagr,
      sharpeRatio: result.riskMetrics.sharpeRatio,
      maxDrawdown: result.riskMetrics.maxDrawdown,
      createdAt: result.createdAt,
    };
  }
}
