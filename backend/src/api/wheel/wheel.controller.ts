import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/guards/jwt-auth.guard';
import { WheelService } from './wheel.service';
import {
  CreateWheelStrategyDto,
  UpdateWheelStrategyDto,
  WheelCandidateQueryDto,
  WheelCandidatesListResponseDto,
  CreateWheelTradeDto,
  CloseWheelTradeDto,
  OptionRecommendationDto,
  WeeklyScheduleDto,
  CashYieldDto,
} from './dto';
import { WheelStrategy, WheelTrade } from '@database/entities';

interface AuthenticatedRequest extends Request {
  user: { id: string; email: string };
}

@ApiTags('wheel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wheel')
export class WheelController {
  constructor(private readonly wheelService: WheelService) {}

  // ===========================================
  // CANDIDATES
  // ===========================================

  @Get('candidates')
  @ApiOperation({
    summary: 'Find WHEEL-suitable candidates based on fundamental and options criteria',
  })
  @ApiResponse({ status: 200, description: 'List of WHEEL candidates with scores' })
  async findCandidates(
    @Query() query: WheelCandidateQueryDto,
  ): Promise<WheelCandidatesListResponseDto> {
    return this.wheelService.findWheelCandidates(query);
  }

  // ===========================================
  // STRATEGIES
  // ===========================================

  @Post('strategies')
  @ApiOperation({ summary: 'Create a new WHEEL strategy' })
  @ApiResponse({ status: 201, description: 'Strategy created successfully' })
  async createStrategy(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateWheelStrategyDto,
  ): Promise<WheelStrategy> {
    return this.wheelService.createStrategy(req.user.id, dto);
  }

  @Get('strategies')
  @ApiOperation({ summary: 'Get all WHEEL strategies for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of user strategies' })
  async getUserStrategies(@Req() req: AuthenticatedRequest): Promise<WheelStrategy[]> {
    return this.wheelService.findUserStrategies(req.user.id);
  }

  @Get('strategies/:id')
  @ApiOperation({ summary: 'Get a specific WHEEL strategy' })
  @ApiParam({ name: 'id', description: 'Strategy ID' })
  @ApiResponse({ status: 200, description: 'Strategy details' })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  async getStrategy(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WheelStrategy> {
    return this.wheelService.findStrategy(id, req.user.id);
  }

  @Put('strategies/:id')
  @ApiOperation({ summary: 'Update a WHEEL strategy' })
  @ApiParam({ name: 'id', description: 'Strategy ID' })
  @ApiResponse({ status: 200, description: 'Strategy updated successfully' })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  async updateStrategy(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWheelStrategyDto,
  ): Promise<WheelStrategy> {
    return this.wheelService.updateStrategy(id, req.user.id, dto);
  }

  @Delete('strategies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a WHEEL strategy' })
  @ApiParam({ name: 'id', description: 'Strategy ID' })
  @ApiResponse({ status: 204, description: 'Strategy deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete strategy with open trades' })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  async deleteStrategy(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.wheelService.deleteStrategy(id, req.user.id);
  }

  // ===========================================
  // OPTION RECOMMENDATIONS
  // ===========================================

  @Get('strategies/:id/put-recommendations')
  @ApiOperation({ summary: 'Get PUT selling recommendations for a strategy' })
  @ApiParam({ name: 'id', description: 'Strategy ID' })
  @ApiResponse({ status: 200, description: 'List of PUT recommendations sorted by score' })
  async getPutRecommendations(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OptionRecommendationDto[]> {
    const strategy = await this.wheelService.findStrategy(id, req.user.id);
    return this.wheelService.findBestPutToSell(
      strategy.assetId,
      Number(strategy.availableCapital),
      strategy.config,
    );
  }

  @Get('strategies/:id/call-recommendations')
  @ApiOperation({ summary: 'Get covered CALL recommendations for a strategy' })
  @ApiParam({ name: 'id', description: 'Strategy ID' })
  @ApiResponse({ status: 200, description: 'List of CALL recommendations sorted by score' })
  async getCallRecommendations(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OptionRecommendationDto[]> {
    const strategy = await this.wheelService.findStrategy(id, req.user.id);

    // For inProfit calculation, we let the service handle it
    // since it has access to current prices via getLatestPrice()
    // Default to false here and the service will calculate properly
    const inProfit =
      strategy.sharesHeld > 0 && strategy.averagePrice !== null && strategy.unrealizedPnL > 0;

    return this.wheelService.findBestCoveredCall(
      strategy.assetId,
      strategy.sharesHeld,
      Number(strategy.averagePrice) || 0,
      inProfit,
      strategy.config,
    );
  }

  @Get('strategies/:id/weekly-schedule')
  @ApiOperation({ summary: 'Get weekly PUT distribution schedule' })
  @ApiParam({ name: 'id', description: 'Strategy ID' })
  @ApiResponse({ status: 200, description: 'Weekly schedule with recommendations' })
  async getWeeklySchedule(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WeeklyScheduleDto[]> {
    const strategy = await this.wheelService.findStrategy(id, req.user.id);
    return this.wheelService.calculateWeeklyPutSchedule(
      strategy.assetId,
      Number(strategy.availableCapital),
      strategy.config,
    );
  }

  // ===========================================
  // TRADES
  // ===========================================

  @Post('trades')
  @ApiOperation({ summary: 'Create a new WHEEL trade' })
  @ApiResponse({ status: 201, description: 'Trade created successfully' })
  async createTrade(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateWheelTradeDto,
  ): Promise<WheelTrade> {
    return this.wheelService.createTrade(req.user.id, dto);
  }

  @Get('strategies/:id/trades')
  @ApiOperation({ summary: 'Get all trades for a strategy' })
  @ApiParam({ name: 'id', description: 'Strategy ID' })
  @ApiResponse({ status: 200, description: 'List of trades' })
  async getStrategyTrades(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<WheelTrade[]> {
    return this.wheelService.getStrategyTrades(id, req.user.id);
  }

  @Put('trades/:id/close')
  @ApiOperation({ summary: 'Close a WHEEL trade' })
  @ApiParam({ name: 'id', description: 'Trade ID' })
  @ApiResponse({ status: 200, description: 'Trade closed successfully' })
  @ApiResponse({ status: 400, description: 'Trade already closed' })
  @ApiResponse({ status: 404, description: 'Trade not found' })
  async closeTrade(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseWheelTradeDto,
  ): Promise<WheelTrade> {
    return this.wheelService.closeTrade(id, req.user.id, dto);
  }

  // ===========================================
  // ANALYTICS
  // ===========================================

  @Get('strategies/:id/analytics')
  @ApiOperation({ summary: 'Get P&L analytics for a strategy' })
  @ApiParam({ name: 'id', description: 'Strategy ID' })
  @ApiResponse({ status: 200, description: 'Strategy analytics' })
  async getStrategyAnalytics(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.wheelService.calculateStrategyPnL(id, req.user.id);
  }

  // ===========================================
  // CASH YIELD (TESOURO SELIC)
  // ===========================================

  @Get('strategies/:id/cash-yield')
  @ApiOperation({
    summary: 'Calculate expected cash yield from Tesouro Selic for unallocated capital',
  })
  @ApiParam({ name: 'id', description: 'Strategy ID' })
  @ApiQuery({ name: 'days', required: false, description: 'Days to project (default: 30)' })
  @ApiResponse({ status: 200, description: 'Cash yield projection', type: CashYieldDto })
  async getStrategyCashYield(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('days') days?: string,
  ): Promise<CashYieldDto> {
    const projectionDays = days ? parseInt(days, 10) : 30;
    return this.wheelService.calculateStrategyCashYield(id, req.user.id, projectionDays);
  }

  @Get('cash-yield')
  @ApiOperation({ summary: 'Calculate cash yield for a given amount' })
  @ApiQuery({ name: 'principal', required: true, description: 'Principal amount in BRL' })
  @ApiQuery({ name: 'days', required: false, description: 'Days to project (default: 30)' })
  @ApiResponse({ status: 200, description: 'Cash yield projection', type: CashYieldDto })
  async calculateCashYield(
    @Query('principal') principal: string,
    @Query('days') days?: string,
  ): Promise<CashYieldDto> {
    const principalAmount = parseFloat(principal);
    const projectionDays = days ? parseInt(days, 10) : 30;

    if (isNaN(principalAmount) || principalAmount <= 0) {
      throw new BadRequestException('Principal must be a positive number');
    }

    return this.wheelService.calculateCashYield(principalAmount, projectionDays);
  }
}
