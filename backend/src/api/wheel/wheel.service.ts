import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual } from 'typeorm';
import {
  WheelStrategy,
  WheelTrade,
  WheelPhase,
  WheelTradeType,
  WheelTradeStatus,
  WheelStrategyStatus,
  MarketTrend,
  Asset,
  FundamentalData,
  OptionPrice,
  OptionType,
  AssetPrice,
} from '@database/entities';
import { EconomicIndicatorsService } from '../economic-indicators/economic-indicators.service';

// Extended metadata type to include ivRank
interface OptionMetadataExtended {
  lotSize?: number;
  exerciseStyle?: string;
  settlementType?: string;
  currency?: string;
  exchange?: string;
  rawData?: Record<string, unknown>;
  ivRank?: number;
}
import {
  CreateWheelStrategyDto,
  UpdateWheelStrategyDto,
  CreateWheelTradeDto,
  CloseWheelTradeDto,
  WheelCandidateQueryDto,
  WheelCandidateResponseDto,
  WheelCandidatesListResponseDto,
  OptionRecommendationDto,
  WeeklyScheduleDto,
  CashYieldDto,
} from './dto';

/**
 * Default WHEEL configuration values
 */
const DEFAULT_CONFIG = {
  minROE: 15,
  minDividendYield: 6,
  maxDividaEbitda: 2.0,
  minMargemLiquida: 10,
  targetDelta: 0.15,
  minOpenInterest: 100,
  minVolume: 50,
  minIVRank: 30,
  expirationDays: 30,
  weeklyDistribution: true,
  maxWeeklyAllocation: 25,
};

@Injectable()
export class WheelService {
  private readonly logger = new Logger(WheelService.name);

  constructor(
    @InjectRepository(WheelStrategy)
    private strategyRepository: Repository<WheelStrategy>,
    @InjectRepository(WheelTrade)
    private tradeRepository: Repository<WheelTrade>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(FundamentalData)
    private fundamentalRepository: Repository<FundamentalData>,
    @InjectRepository(OptionPrice)
    private optionRepository: Repository<OptionPrice>,
    @InjectRepository(AssetPrice)
    private assetPriceRepository: Repository<AssetPrice>,
    private dataSource: DataSource,
    // FASE 4: Inject EconomicIndicatorsService for Selic rate access
    private economicIndicatorsService: EconomicIndicatorsService,
  ) {}

  /**
   * Get latest price for an asset
   */
  private async getLatestPrice(assetId: string): Promise<number> {
    const latestPrice = await this.assetPriceRepository.findOne({
      where: { assetId },
      order: { date: 'DESC' },
    });
    return latestPrice ? Number(latestPrice.close) : 0;
  }

  /**
   * Get latest fundamental data for an asset
   */
  private async getLatestFundamental(assetId: string): Promise<FundamentalData | null> {
    return this.fundamentalRepository.findOne({
      where: { assetId },
      order: { referenceDate: 'DESC' },
    });
  }

  /**
   * Get IV Rank from option metadata with type safety
   */
  private getIvRankFromOption(option: OptionPrice | null): number | undefined {
    if (!option) return undefined;
    const metadata = option.metadata as OptionMetadataExtended | null;
    return metadata?.ivRank;
  }

  // ===========================================
  // WHEEL STRATEGY CRUD
  // ===========================================

  async createStrategy(userId: string, dto: CreateWheelStrategyDto): Promise<WheelStrategy> {
    this.logger.log(`Creating WHEEL strategy for user ${userId}, asset ${dto.assetId}`);

    // Verify asset exists and has options
    const asset = await this.assetRepository.findOne({
      where: { id: dto.assetId },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${dto.assetId} not found`);
    }

    if (!asset.hasOptions) {
      throw new BadRequestException(`Asset ${asset.ticker} does not have options available`);
    }

    // Create strategy with default config merged with provided config
    const config = { ...DEFAULT_CONFIG, ...dto.config };

    const strategy = this.strategyRepository.create({
      userId,
      assetId: dto.assetId,
      name: dto.name || `WHEEL ${asset.ticker}`,
      description: dto.description,
      notional: dto.notional,
      availableCapital: dto.notional,
      allocatedCapital: 0,
      marketTrend: dto.marketTrend || MarketTrend.NEUTRAL,
      phase: WheelPhase.SELLING_PUTS,
      status: WheelStrategyStatus.ACTIVE,
      config,
    });

    const saved = await this.strategyRepository.save(strategy);
    this.logger.log(`Created WHEEL strategy ${saved.id} for ${asset.ticker}`);

    return saved;
  }

  async findUserStrategies(userId: string): Promise<WheelStrategy[]> {
    return this.strategyRepository.find({
      where: { userId },
      relations: ['asset', 'trades'],
      order: { createdAt: 'DESC' },
    });
  }

  async findStrategy(id: string, userId: string): Promise<WheelStrategy> {
    const strategy = await this.strategyRepository.findOne({
      where: { id, userId },
      relations: ['asset', 'trades'],
    });

    if (!strategy) {
      throw new NotFoundException(`Strategy ${id} not found`);
    }

    return strategy;
  }

  async updateStrategy(
    id: string,
    userId: string,
    dto: UpdateWheelStrategyDto,
  ): Promise<WheelStrategy> {
    const strategy = await this.findStrategy(id, userId);

    // Merge config if provided
    if (dto.config) {
      dto.config = { ...strategy.config, ...dto.config };
    }

    Object.assign(strategy, dto);
    return this.strategyRepository.save(strategy);
  }

  async deleteStrategy(id: string, userId: string): Promise<void> {
    const strategy = await this.findStrategy(id, userId);

    // Check if there are open trades
    const openTrades = await this.tradeRepository.count({
      where: { strategyId: id, status: WheelTradeStatus.OPEN },
    });

    if (openTrades > 0) {
      throw new BadRequestException(`Cannot delete strategy with ${openTrades} open trades`);
    }

    await this.strategyRepository.remove(strategy);
    this.logger.log(`Deleted WHEEL strategy ${id}`);
  }

  // ===========================================
  // WHEEL CANDIDATES
  // ===========================================

  async findWheelCandidates(
    query: WheelCandidateQueryDto,
  ): Promise<WheelCandidatesListResponseDto> {
    this.logger.log('Finding WHEEL candidates with filters:', query);

    const {
      minROE = DEFAULT_CONFIG.minROE,
      minDividendYield = DEFAULT_CONFIG.minDividendYield,
      maxDividaEbitda = DEFAULT_CONFIG.maxDividaEbitda,
      minMargemLiquida = DEFAULT_CONFIG.minMargemLiquida,
      minIVRank = DEFAULT_CONFIG.minIVRank,
      minOpenInterest = DEFAULT_CONFIG.minOpenInterest,
      hasOptions = true,
      page = 1,
      limit = 20,
    } = query;

    // Build query with fundamental filters
    const qb = this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.fundamentalData', 'fd')
      .where('asset.isActive = :isActive', { isActive: true });

    if (hasOptions) {
      qb.andWhere('asset.hasOptions = :hasOptions', { hasOptions: true });
    }

    // Get all candidates first
    const [assets, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // FASE 111: Batch load all related data to eliminate N+1 queries
    // Previously: 61 queries (1 + 20*3) for 20 assets
    // Now: 4 queries total (1 asset query + 3 batch queries)
    const assetIds = assets.map((a) => a.id);

    // Batch Query 1: Get latest prices for all assets at once
    // Using raw query with DISTINCT ON for PostgreSQL efficiency
    const latestPrices =
      assetIds.length > 0
        ? await this.assetPriceRepository
            .createQueryBuilder('price')
            .where('price.assetId IN (:...assetIds)', { assetIds })
            .andWhere(
              `price.date = (
                SELECT MAX(p2.date)
                FROM asset_prices p2
                WHERE p2.asset_id = price.asset_id
              )`,
            )
            .getMany()
        : [];

    // Batch Query 2: Get latest fundamental data for all assets at once
    const latestFundamentals =
      assetIds.length > 0
        ? await this.fundamentalRepository
            .createQueryBuilder('fd')
            .where('fd.assetId IN (:...assetIds)', { assetIds })
            .andWhere(
              `fd.referenceDate = (
                SELECT MAX(fd2.reference_date)
                FROM fundamental_data fd2
                WHERE fd2.asset_id = fd.asset_id
              )`,
            )
            .getMany()
        : [];

    // Batch Query 3: Get latest options for all assets at once
    const latestOptions =
      assetIds.length > 0
        ? await this.optionRepository
            .createQueryBuilder('opt')
            .where('opt.underlyingAssetId IN (:...assetIds)', { assetIds })
            .andWhere(
              `opt.updated_at = (
                SELECT MAX(o2.updated_at)
                FROM option_prices o2
                WHERE o2.underlying_asset_id = opt.underlying_asset_id
              )`,
            )
            .getMany()
        : [];

    // Create Maps for O(1) lookup instead of O(n) search
    const priceMap = new Map(latestPrices.map((p) => [p.assetId, p]));
    const fdMap = new Map(latestFundamentals.map((f) => [f.assetId, f]));
    const optMap = new Map(latestOptions.map((o) => [o.underlyingAssetId, o]));

    this.logger.log(
      `FASE 111 Batch loaded: ${latestPrices.length} prices, ${latestFundamentals.length} fundamentals, ${latestOptions.length} options`,
    );

    // Process each asset using Maps (no additional DB queries)
    const candidates: WheelCandidateResponseDto[] = [];

    for (const asset of assets) {
      // O(1) lookups from Maps instead of DB queries
      const fd = fdMap.get(asset.id) || null;
      const priceData = priceMap.get(asset.id);
      const currentPrice = priceData ? Number(priceData.close) : 0;
      const latestOption = optMap.get(asset.id) || null;

      // Calculate scores (local computation, no DB)
      const fundamentalScore = this.calculateFundamentalScore(fd, {
        minROE,
        minDividendYield,
        maxDividaEbitda,
        minMargemLiquida,
      });

      const liquidityScore = this.calculateLiquidityScore(latestOption, minOpenInterest);
      const volatilityScore = this.calculateVolatilityScore(latestOption, minIVRank);

      const wheelScore = Math.round(
        fundamentalScore * 0.4 + liquidityScore * 0.3 + volatilityScore * 0.3,
      );

      candidates.push({
        id: asset.id,
        ticker: asset.ticker,
        name: asset.name,
        currentPrice,
        roe: fd?.roe ? Number(fd.roe) : undefined,
        dividendYield: fd?.dividendYield ? Number(fd.dividendYield) : undefined,
        dividaEbitda: fd?.dividaLiquidaEbitda ? Number(fd.dividaLiquidaEbitda) : undefined,
        margemLiquida: fd?.margemLiquida ? Number(fd.margemLiquida) : undefined,
        pl: fd?.pl ? Number(fd.pl) : undefined,
        ivRank: this.getIvRankFromOption(latestOption),
        hasOptions: asset.hasOptions,
        wheelScore,
        scoreBreakdown: {
          fundamentalScore,
          liquidityScore,
          volatilityScore,
        },
      });
    }

    // Sort by wheel score descending
    candidates.sort((a, b) => b.wheelScore - a.wheelScore);

    return {
      data: candidates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===========================================
  // OPTION RECOMMENDATIONS
  // ===========================================

  async findBestPutToSell(
    assetId: string,
    notional: number,
    config?: Partial<typeof DEFAULT_CONFIG>,
  ): Promise<OptionRecommendationDto[]> {
    this.logger.log(`Finding best PUT to sell for asset ${assetId}, notional ${notional}`);

    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    // Get asset
    const asset = await this.assetRepository.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} not found`);
    }

    // Get PUT options for this asset
    const targetExpiration = new Date();
    targetExpiration.setDate(targetExpiration.getDate() + mergedConfig.expirationDays);

    const puts = await this.optionRepository.find({
      where: {
        underlyingAssetId: assetId,
        type: OptionType.PUT,
        expirationDate: LessThanOrEqual(targetExpiration),
      },
      order: { delta: 'ASC' }, // Lower delta = more OTM
    });

    // Filter by target delta (around 15 delta)
    const recommendations: OptionRecommendationDto[] = [];

    for (const put of puts) {
      // Skip if delta is too far from target
      const delta = Math.abs(Number(put.delta) || 0);
      if (delta > mergedConfig.targetDelta * 2) continue;

      // Skip if low liquidity
      if ((put.openInterest || 0) < mergedConfig.minOpenInterest) continue;
      if ((put.volume || 0) < mergedConfig.minVolume) continue;

      const daysToExp = Math.ceil(
        (new Date(put.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      const premium = Number(put.lastPrice) || 0;
      const strike = Number(put.strike);
      const currentPrice = Number(put.underlyingPrice) || (await this.getLatestPrice(assetId));

      // Calculate returns
      const premiumReturn = (premium / strike) * 100;
      const annualizedReturn = (premiumReturn / daysToExp) * 365;

      // Distance from current price
      const distancePercent = ((currentPrice - strike) / currentPrice) * 100;

      // Determine moneyness
      let moneyness = 'OTM';
      if (strike > currentPrice) moneyness = 'ITM';
      else if (Math.abs(strike - currentPrice) / currentPrice < 0.02) moneyness = 'ATM';

      // Score calculation
      const deltaScore = 100 - Math.abs(delta - mergedConfig.targetDelta) * 500;
      const returnScore = Math.min(annualizedReturn * 2, 100);
      const liquidityScore = Math.min((put.openInterest || 0) / 10, 100);
      const score = Math.round(deltaScore * 0.4 + returnScore * 0.4 + liquidityScore * 0.2);

      recommendations.push({
        symbol: put.ticker,
        type: 'PUT',
        strike,
        expiration: put.expirationDate,
        daysToExpiration: daysToExp,
        premium,
        bid: Number(put.bid) || 0,
        ask: Number(put.ask) || 0,
        delta: Number(put.delta) || 0,
        gamma: Number(put.gamma),
        theta: Number(put.theta),
        vega: Number(put.vega),
        iv: Number(put.impliedVolatility) || 0,
        ivRank: this.getIvRankFromOption(put),
        volume: Number(put.volume) || 0,
        openInterest: Number(put.openInterest) || 0,
        premiumReturnPercent: premiumReturn,
        annualizedReturn,
        moneyness,
        distancePercent,
        score,
      });
    }

    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, 10); // Top 10 recommendations
  }

  async findBestCoveredCall(
    assetId: string,
    sharesHeld: number,
    averagePrice: number,
    inProfit: boolean,
    config?: Partial<typeof DEFAULT_CONFIG>,
  ): Promise<OptionRecommendationDto[]> {
    this.logger.log(`Finding best covered CALL for asset ${assetId}, shares ${sharesHeld}`);

    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    // Get asset
    const asset = await this.assetRepository.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} not found`);
    }

    const currentPrice = await this.getLatestPrice(assetId);

    // Get CALL options for this asset
    const targetExpiration = new Date();
    targetExpiration.setDate(targetExpiration.getDate() + mergedConfig.expirationDays);

    const calls = await this.optionRepository.find({
      where: {
        underlyingAssetId: assetId,
        type: OptionType.CALL,
        expirationDate: LessThanOrEqual(targetExpiration),
      },
      order: { strike: 'ASC' },
    });

    const recommendations: OptionRecommendationDto[] = [];

    for (const call of calls) {
      const strike = Number(call.strike);

      // Apply WHEEL rules for CALL selection
      if (!inProfit) {
        // In loss: CALL above average price
        if (strike < averagePrice) continue;
      } else {
        // In profit: CALL at or below current price (ATM or slightly ITM)
        if (strike > currentPrice * 1.05) continue;
      }

      // Skip if low liquidity
      if ((call.openInterest || 0) < mergedConfig.minOpenInterest) continue;
      if ((call.volume || 0) < mergedConfig.minVolume) continue;

      const daysToExp = Math.ceil(
        (new Date(call.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      const premium = Number(call.lastPrice) || 0;

      // Calculate returns
      const premiumReturn = (premium / currentPrice) * 100;
      const annualizedReturn = (premiumReturn / daysToExp) * 365;

      // Distance from current price
      const distancePercent = ((strike - currentPrice) / currentPrice) * 100;

      // Determine moneyness
      let moneyness = 'OTM';
      if (strike < currentPrice) moneyness = 'ITM';
      else if (Math.abs(strike - currentPrice) / currentPrice < 0.02) moneyness = 'ATM';

      // Score calculation
      const delta = Math.abs(Number(call.delta) || 0);
      const deltaScore = 100 - Math.abs(delta - mergedConfig.targetDelta) * 500;
      const returnScore = Math.min(annualizedReturn * 2, 100);
      const liquidityScore = Math.min((call.openInterest || 0) / 10, 100);
      const score = Math.round(deltaScore * 0.4 + returnScore * 0.4 + liquidityScore * 0.2);

      recommendations.push({
        symbol: call.ticker,
        type: 'CALL',
        strike,
        expiration: call.expirationDate,
        daysToExpiration: daysToExp,
        premium,
        bid: Number(call.bid) || 0,
        ask: Number(call.ask) || 0,
        delta: Number(call.delta) || 0,
        gamma: Number(call.gamma),
        theta: Number(call.theta),
        vega: Number(call.vega),
        iv: Number(call.impliedVolatility) || 0,
        ivRank: this.getIvRankFromOption(call),
        volume: Number(call.volume) || 0,
        openInterest: Number(call.openInterest) || 0,
        premiumReturnPercent: premiumReturn,
        annualizedReturn,
        moneyness,
        distancePercent,
        score,
      });
    }

    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);

    return recommendations.slice(0, 10);
  }

  // ===========================================
  // WEEKLY PUT SCHEDULE
  // ===========================================

  async calculateWeeklyPutSchedule(
    assetId: string,
    totalNotional: number,
    config?: Partial<typeof DEFAULT_CONFIG>,
  ): Promise<WeeklyScheduleDto[]> {
    this.logger.log(`Calculating weekly PUT schedule for asset ${assetId}`);

    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const weeklyAllocation = totalNotional * (mergedConfig.maxWeeklyAllocation / 100);
    const schedule: WeeklyScheduleDto[] = [];

    // Get asset for current price
    const asset = await this.assetRepository.findOne({ where: { id: assetId } });
    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} not found`);
    }

    const currentPrice = (await this.getLatestPrice(assetId)) || 100;

    for (let week = 1; week <= 4; week++) {
      // Calculate target expiration for each week (7 days apart)
      const targetExpiration = new Date();
      targetExpiration.setDate(targetExpiration.getDate() + week * 7 + 14); // 2+ weeks out

      // Calculate suggested contracts (assuming 100 shares per contract)
      const contractValue = currentPrice * 100;
      const suggestedContracts = Math.floor(weeklyAllocation / contractValue);

      // Get recommendations for this week
      const weeklyConfig = { ...mergedConfig, expirationDays: week * 7 + 14 };
      const recommendations = await this.findBestPutToSell(assetId, weeklyAllocation, weeklyConfig);

      schedule.push({
        week,
        capitalToAllocate: weeklyAllocation,
        suggestedContracts: Math.max(suggestedContracts, 1),
        targetExpiration,
        daysToExpiration: week * 7 + 14,
        recommendations: recommendations.slice(0, 3), // Top 3 per week
      });
    }

    return schedule;
  }

  // ===========================================
  // WHEEL TRADES
  // ===========================================

  async createTrade(userId: string, dto: CreateWheelTradeDto): Promise<WheelTrade> {
    this.logger.log(`Creating WHEEL trade for strategy ${dto.strategyId}`);

    // Verify strategy belongs to user
    const strategy = await this.findStrategy(dto.strategyId, userId);

    // Calculate premium and update strategy
    const totalPremium = dto.entryPrice * dto.contracts * 100; // 100 shares per contract

    const trade = this.tradeRepository.create({
      ...dto,
      sharesPerContract: 100,
      premiumReceived: dto.tradeType.includes('SELL') ? totalPremium : 0,
      premiumPaid: dto.tradeType.includes('BUY') ? totalPremium : 0,
      openedAt: new Date(),
      daysToExpiration: Math.ceil(
        (new Date(dto.expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      ),
    });

    const savedTrade = await this.tradeRepository.save(trade);

    // Update strategy totals
    if (dto.tradeType.includes('SELL')) {
      strategy.totalPremiumReceived = Number(strategy.totalPremiumReceived) + totalPremium;
      strategy.allocatedCapital =
        Number(strategy.allocatedCapital) + dto.strike * dto.contracts * 100;
      strategy.availableCapital = Number(strategy.notional) - Number(strategy.allocatedCapital);
      strategy.totalTrades += 1;
    }

    await this.strategyRepository.save(strategy);

    this.logger.log(`Created trade ${savedTrade.id}`);
    return savedTrade;
  }

  async closeTrade(tradeId: string, userId: string, dto: CloseWheelTradeDto): Promise<WheelTrade> {
    // Find trade and verify ownership
    const trade = await this.tradeRepository.findOne({
      where: { id: tradeId },
      relations: ['strategy'],
    });

    if (!trade) {
      throw new NotFoundException(`Trade ${tradeId} not found`);
    }

    if (trade.strategy.userId !== userId) {
      throw new NotFoundException(`Trade ${tradeId} not found`);
    }

    if (trade.status !== WheelTradeStatus.OPEN) {
      throw new BadRequestException(`Trade ${tradeId} is already ${trade.status}`);
    }

    // Update trade
    trade.exitPrice = dto.exitPrice;
    trade.underlyingPriceAtExit = dto.underlyingPriceAtExit;
    trade.status = dto.status;
    trade.commission = dto.commission || 0;
    trade.b3Fees = dto.b3Fees || 0;
    trade.closedAt = new Date();

    if (dto.notes) {
      trade.notes = trade.notes ? `${trade.notes}\n${dto.notes}` : dto.notes;
    }

    // Calculate P&L
    if (trade.tradeType.includes('SELL')) {
      const exitCost = dto.exitPrice * trade.contracts * trade.sharesPerContract;
      trade.premiumPaid = exitCost;
      trade.realizedPnL =
        Number(trade.premiumReceived) - exitCost - (dto.commission || 0) - (dto.b3Fees || 0);
    }

    // Calculate annualized return
    const daysHeld = Math.ceil(
      (trade.closedAt.getTime() - trade.openedAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysHeld > 0 && trade.strike > 0) {
      const returnPercent =
        (trade.realizedPnL / (Number(trade.strike) * trade.contracts * trade.sharesPerContract)) *
        100;
      trade.annualizedReturn = (returnPercent / daysHeld) * 365;
    }

    const savedTrade = await this.tradeRepository.save(trade);

    // Update strategy
    const strategy = trade.strategy;
    strategy.realizedPnL = Number(strategy.realizedPnL) + trade.realizedPnL;

    if (trade.realizedPnL > 0) {
      strategy.winningTrades += 1;
    }

    // Handle exercise
    if (dto.status === WheelTradeStatus.EXERCISED) {
      strategy.exercises += 1;

      if (trade.tradeType === WheelTradeType.SELL_PUT) {
        // PUT exercised - we buy shares
        const sharesToBuy = trade.contracts * trade.sharesPerContract;
        const costBasis = Number(trade.strike) * sharesToBuy;

        strategy.sharesHeld = (strategy.sharesHeld || 0) + sharesToBuy;
        strategy.sharesTotalCost = Number(strategy.sharesTotalCost || 0) + costBasis;
        strategy.averagePrice = strategy.sharesTotalCost / strategy.sharesHeld;
        strategy.phase = WheelPhase.HOLDING_SHARES;
      } else if (trade.tradeType === WheelTradeType.SELL_CALL) {
        // CALL exercised - we sell shares
        const sharesToSell = trade.contracts * trade.sharesPerContract;
        const proceeds = Number(trade.strike) * sharesToSell;
        const costBasis = (strategy.averagePrice || 0) * sharesToSell;

        strategy.sharesHeld = Math.max(0, (strategy.sharesHeld || 0) - sharesToSell);
        strategy.realizedPnL = Number(strategy.realizedPnL) + (proceeds - costBasis);

        if (strategy.sharesHeld === 0) {
          strategy.phase = WheelPhase.SELLING_PUTS;
          strategy.averagePrice = null;
          strategy.sharesTotalCost = 0;
        }
      }
    }

    // Recalculate allocated capital
    const openTrades = await this.tradeRepository.find({
      where: { strategyId: strategy.id, status: WheelTradeStatus.OPEN },
    });

    strategy.allocatedCapital = openTrades.reduce((sum, t) => {
      return sum + Number(t.strike) * t.contracts * t.sharesPerContract;
    }, 0);

    strategy.availableCapital = Number(strategy.notional) - strategy.allocatedCapital;

    await this.strategyRepository.save(strategy);

    this.logger.log(`Closed trade ${tradeId} with P&L ${trade.realizedPnL}`);
    return savedTrade;
  }

  async getStrategyTrades(strategyId: string, userId: string): Promise<WheelTrade[]> {
    // Verify ownership
    await this.findStrategy(strategyId, userId);

    return this.tradeRepository.find({
      where: { strategyId },
      order: { openedAt: 'DESC' },
    });
  }

  // ===========================================
  // ANALYTICS
  // ===========================================

  async calculateStrategyPnL(
    strategyId: string,
    userId: string,
  ): Promise<{
    realizedPnL: number;
    unrealizedPnL: number;
    totalPremiumReceived: number;
    totalPremiumPaid: number;
    cashYield: number;
    dividendsReceived: number;
    totalReturn: number;
    annualizedReturn: number;
    winRate: number;
    exerciseRate: number;
  }> {
    const strategy = await this.findStrategy(strategyId, userId);

    const winRate =
      strategy.totalTrades > 0 ? (strategy.winningTrades / strategy.totalTrades) * 100 : 0;

    const exerciseRate =
      strategy.totalTrades > 0 ? (strategy.exercises / strategy.totalTrades) * 100 : 0;

    const totalReturn =
      Number(strategy.realizedPnL) +
      Number(strategy.unrealizedPnL) +
      Number(strategy.cashYield) +
      Number(strategy.dividendsReceived);

    // Calculate days since strategy started
    const daysSinceStart = Math.ceil(
      (Date.now() - new Date(strategy.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    const annualizedReturn =
      daysSinceStart > 0 && strategy.notional > 0
        ? (((totalReturn / Number(strategy.notional)) * 365) / daysSinceStart) * 100
        : 0;

    return {
      realizedPnL: Number(strategy.realizedPnL),
      unrealizedPnL: Number(strategy.unrealizedPnL),
      totalPremiumReceived: Number(strategy.totalPremiumReceived),
      totalPremiumPaid: Number(strategy.totalPremiumPaid),
      cashYield: Number(strategy.cashYield),
      dividendsReceived: Number(strategy.dividendsReceived),
      totalReturn,
      annualizedReturn,
      winRate,
      exerciseRate,
    };
  }

  // ===========================================
  // CASH YIELD (TESOURO SELIC)
  // ===========================================

  /**
   * Calculate expected cash yield from Tesouro Selic for unallocated capital
   * Uses CDI/Selic rate to project returns on cash not deployed in options
   *
   * Formula: Daily Rate = (1 + Annual Rate/100)^(1/252) - 1
   * Expected Yield = Principal * ((1 + Daily Rate)^days - 1)
   *
   * @param principal - Amount of cash not allocated to options
   * @param days - Number of days to project (default: 30)
   * @returns CashYieldDto with yield projections
   */
  async calculateCashYield(principal: number, days: number = 30): Promise<CashYieldDto> {
    try {
      // Get current Selic rate from EconomicIndicatorsService
      const selicData = await this.economicIndicatorsService.getLatestByType('SELIC');
      const selicRate = selicData.currentValue; // % a.a.

      // Brazilian business days per year (standard B3)
      const businessDaysPerYear = 252;

      // Calculate daily rate from annual rate
      // Daily Rate = (1 + Annual Rate)^(1/252) - 1
      const dailyRate = Math.pow(1 + selicRate / 100, 1 / businessDaysPerYear) - 1;

      // Calculate expected yield over the period
      // Yield = Principal * ((1 + Daily Rate)^days - 1)
      const expectedYield = principal * (Math.pow(1 + dailyRate, days) - 1);

      // Calculate effective annualized rate for the period
      // Effective Rate = (Yield / Principal) * (252 / days) * 100
      const effectiveRate = (expectedYield / principal) * (businessDaysPerYear / days) * 100;

      // Final amount
      const finalAmount = principal + expectedYield;

      this.logger.log(
        `Cash yield calculated: Principal=${principal.toFixed(2)}, Days=${days}, ` +
          `Selic=${selicRate}%, DailyRate=${(dailyRate * 100).toFixed(6)}%, ` +
          `ExpectedYield=${expectedYield.toFixed(2)}, FinalAmount=${finalAmount.toFixed(2)}`,
      );

      return {
        principal,
        days,
        selicRate,
        expectedYield: Number(expectedYield.toFixed(2)),
        effectiveRate: Number(effectiveRate.toFixed(4)),
        dailyRate: Number((dailyRate * 100).toFixed(6)),
        finalAmount: Number(finalAmount.toFixed(2)),
      };
    } catch (error) {
      this.logger.warn(`Failed to get Selic rate, using default 12.25%: ${error.message}`);

      // Fallback to default Selic rate if service fails
      const defaultSelicRate = 12.25; // December 2024 approximate rate
      const businessDaysPerYear = 252;
      const dailyRate = Math.pow(1 + defaultSelicRate / 100, 1 / businessDaysPerYear) - 1;
      const expectedYield = principal * (Math.pow(1 + dailyRate, days) - 1);
      const effectiveRate = (expectedYield / principal) * (businessDaysPerYear / days) * 100;
      const finalAmount = principal + expectedYield;

      return {
        principal,
        days,
        selicRate: defaultSelicRate,
        expectedYield: Number(expectedYield.toFixed(2)),
        effectiveRate: Number(effectiveRate.toFixed(4)),
        dailyRate: Number((dailyRate * 100).toFixed(6)),
        finalAmount: Number(finalAmount.toFixed(2)),
      };
    }
  }

  /**
   * Calculate cash yield for a specific strategy
   * Uses the strategy's available capital (unallocated cash)
   *
   * @param strategyId - Strategy ID
   * @param userId - User ID for ownership validation
   * @param days - Number of days to project (default: 30)
   * @returns CashYieldDto with yield projections
   */
  async calculateStrategyCashYield(
    strategyId: string,
    userId: string,
    days: number = 30,
  ): Promise<CashYieldDto> {
    const strategy = await this.findStrategy(strategyId, userId);
    const availableCapital = Number(strategy.availableCapital);

    return this.calculateCashYield(availableCapital, days);
  }

  // ===========================================
  // PRIVATE HELPERS
  // ===========================================

  private calculateFundamentalScore(
    fd: FundamentalData | null,
    criteria: {
      minROE: number;
      minDividendYield: number;
      maxDividaEbitda: number;
      minMargemLiquida: number;
    },
  ): number {
    if (!fd) return 0;

    let score = 0;
    let factors = 0;

    // ROE score
    if (fd.roe !== null && fd.roe !== undefined) {
      const roe = Number(fd.roe);
      if (roe >= criteria.minROE) score += 25;
      else if (roe >= criteria.minROE * 0.7) score += 15;
      factors++;
    }

    // Dividend Yield score
    if (fd.dividendYield !== null && fd.dividendYield !== undefined) {
      const dy = Number(fd.dividendYield);
      if (dy >= criteria.minDividendYield) score += 25;
      else if (dy >= criteria.minDividendYield * 0.7) score += 15;
      factors++;
    }

    // Debt/EBITDA score
    if (fd.dividaLiquidaEbitda !== null && fd.dividaLiquidaEbitda !== undefined) {
      const debt = Number(fd.dividaLiquidaEbitda);
      if (debt <= criteria.maxDividaEbitda) score += 25;
      else if (debt <= criteria.maxDividaEbitda * 1.5) score += 15;
      factors++;
    }

    // Net Margin score
    if (fd.margemLiquida !== null && fd.margemLiquida !== undefined) {
      const margin = Number(fd.margemLiquida);
      if (margin >= criteria.minMargemLiquida) score += 25;
      else if (margin >= criteria.minMargemLiquida * 0.7) score += 15;
      factors++;
    }

    // Normalize to 100
    return factors > 0 ? Math.round((score / factors) * 4) : 0;
  }

  private calculateLiquidityScore(option: OptionPrice | null, minOpenInterest: number): number {
    if (!option) return 0;

    const oi = Number(option.openInterest) || 0;
    const volume = Number(option.volume) || 0;

    // OI score (0-50)
    let oiScore = 0;
    if (oi >= minOpenInterest * 10) oiScore = 50;
    else if (oi >= minOpenInterest * 5) oiScore = 40;
    else if (oi >= minOpenInterest * 2) oiScore = 30;
    else if (oi >= minOpenInterest) oiScore = 20;

    // Volume score (0-50)
    let volumeScore = 0;
    if (volume >= 500) volumeScore = 50;
    else if (volume >= 200) volumeScore = 40;
    else if (volume >= 100) volumeScore = 30;
    else if (volume >= 50) volumeScore = 20;

    return oiScore + volumeScore;
  }

  private calculateVolatilityScore(option: OptionPrice | null, minIVRank: number): number {
    if (!option) return 0;

    const ivRank = this.getIvRankFromOption(option) || 0;

    // Higher IV Rank is better for selling options
    if (ivRank >= 80) return 100;
    if (ivRank >= 60) return 80;
    if (ivRank >= minIVRank) return 60;
    if (ivRank >= minIVRank * 0.7) return 40;
    return 20;
  }
}
