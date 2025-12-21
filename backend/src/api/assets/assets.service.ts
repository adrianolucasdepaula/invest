import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, In } from 'typeorm';
import { Asset, AssetPrice, FundamentalData, PriceSource, TickerChange, AssetIndexMembership } from '@database/entities';
import { ScrapersService } from '../../scrapers/scrapers.service';
import { BrapiScraper } from '../../scrapers/fundamental/brapi.scraper';
import { OpcoesScraper } from '../../scrapers/options/opcoes.scraper';
import { HistoricalPricesQueryDto, PriceRange } from './dto/historical-prices-query.dto';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  /**
   * Sanitize numeric value to prevent PostgreSQL overflow
   * @param value - Value to sanitize
   * @param maxValue - Maximum allowed value for the field
   * @param decimalPlaces - Number of decimal places to round to
   *
   * IMPORTANT: JavaScript can only safely represent integers up to Number.MAX_SAFE_INTEGER (9007199254740991)
   * Values like 9999999999999999.99 get rounded to 10000000000000000 causing overflow!
   * We use conservative max values that JS can represent precisely.
   */
  private sanitizeNumericValue(
    value: any,
    maxValue: number = 999999999999.99, // Safe default for most fields
    decimalPlaces: number = 2,
  ): number | null {
    if (value === null || value === undefined) return null;

    const num = Number(value);

    // Handle invalid numbers
    if (isNaN(num) || !isFinite(num)) {
      this.logger.warn(`[SANITIZE] Invalid numeric value: ${value}`);
      return null;
    }

    // Clamp to valid range
    if (num > maxValue) {
      this.logger.warn(`[SANITIZE] Value ${num} exceeds max ${maxValue}, clamping`);
      return maxValue;
    }
    if (num < -maxValue) {
      this.logger.warn(`[SANITIZE] Value ${num} below min ${-maxValue}, clamping`);
      return -maxValue;
    }

    // Round to specified decimal places
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.round(num * multiplier) / multiplier;
  }

  /**
   * Sanitize price data before saving to database
   * Handles different field precisions with JS-safe max values:
   * - open/high/low/close/adjustedClose: numeric(18,4) - using 9999999999999.9999 (13 digits + 4 decimal = 17 total)
   * - marketCap/change: numeric(18,2) - using 999999999999999.99 (15 digits + 2 decimal = 17 total)
   * - changePercent: numeric(10,4) - using 999999.9999 (6 digits + 4 decimal = 10 total)
   *
   * All max values are safely representable in JavaScript (< Number.MAX_SAFE_INTEGER)
   */
  private sanitizePriceData(data: any): any {
    return {
      ...data,
      // numeric(18,4): max 13 digits before decimal + 4 after = 17 total (JS-safe)
      open: this.sanitizeNumericValue(data.open, 9999999999999.9999, 4),
      high: this.sanitizeNumericValue(data.high, 9999999999999.9999, 4),
      low: this.sanitizeNumericValue(data.low, 9999999999999.9999, 4),
      close: this.sanitizeNumericValue(data.close, 9999999999999.9999, 4),
      adjustedClose: this.sanitizeNumericValue(data.adjustedClose, 9999999999999.9999, 4),
      // numeric(18,2): max 15 digits before decimal + 2 after = 17 total (JS-safe)
      marketCap: this.sanitizeNumericValue(data.marketCap, 999999999999999.99, 2),
      change: this.sanitizeNumericValue(data.change, 999999999999999.99, 2),
      // numeric(10,4): max 6 digits before decimal + 4 after = 10 total (JS-safe)
      changePercent: this.sanitizeNumericValue(data.changePercent, 999999.9999, 4),
    };
  }

  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(AssetPrice)
    private assetPriceRepository: Repository<AssetPrice>,
    @InjectRepository(FundamentalData)
    private fundamentalDataRepository: Repository<FundamentalData>,
    @InjectRepository(TickerChange)
    private tickerChangeRepository: Repository<TickerChange>,
    @InjectRepository(AssetIndexMembership)
    private indexMembershipRepository: Repository<AssetIndexMembership>,
    private scrapersService: ScrapersService,
    private brapiScraper: BrapiScraper,
    private opcoesScraper: OpcoesScraper,
  ) {}

  async findAll(type?: string) {
    // OPTIMIZED: Use raw SQL with LATERAL JOIN instead of correlated subqueries
    // This reduces query complexity from O(n*m) to O(n) where n=assets, m=prices
    // Uses idx_asset_prices_asset_date_desc index for optimal performance

    let whereClause = '';
    const params: any[] = [];

    if (type) {
      const normalizedType = type.toLowerCase();
      const validTypes = ['stock', 'fii', 'etf', 'bdr', 'option', 'future', 'crypto', 'fixed_income'];
      if (!validTypes.includes(normalizedType)) {
        this.logger.warn(`Invalid asset type requested: ${type}. Valid types: ${validTypes.join(', ')}`);
        return [];
      }
      whereClause = 'WHERE asset.type = $1';
      params.push(normalizedType);
    }

    // Use LATERAL JOIN for efficient latest price lookup (PostgreSQL optimization)
    const query = `
      SELECT
        asset.*,
        price1.close as price1_close,
        price1.change as price1_change,
        price1.change_percent as price1_change_percent,
        price1.volume as price1_volume,
        price1.market_cap as price1_market_cap,
        price1.date as price1_date,
        price1.collected_at as price1_collected_at
      FROM assets asset
      LEFT JOIN LATERAL (
        SELECT close, change, change_percent, volume, market_cap, date, collected_at
        FROM asset_prices
        WHERE asset_id = asset.id
        ORDER BY date DESC
        LIMIT 1
      ) price1 ON true
      ${whereClause}
      ORDER BY asset.ticker ASC
    `;

    const rawResults = await this.assetRepository.query(query, params);

    // Get current index memberships for all assets
    const today = new Date();
    const assetIds = rawResults.map((row: any) => row.id);

    let currentMemberships: AssetIndexMembership[] = [];
    if (assetIds.length > 0) {
      currentMemberships = await this.indexMembershipRepository.find({
        where: [
          {
            assetId: In(assetIds),
            validFrom: LessThanOrEqual(today),
            validTo: IsNull(),
          },
          {
            assetId: In(assetIds),
            validFrom: LessThanOrEqual(today),
            validTo: MoreThanOrEqual(today),
          },
        ],
      });
    }

    // Build map of assetId -> memberships for quick lookup
    const membershipsByAsset = new Map<string, AssetIndexMembership[]>();
    for (const membership of currentMemberships) {
      if (!membershipsByAsset.has(membership.assetId)) {
        membershipsByAsset.set(membership.assetId, []);
      }
      membershipsByAsset.get(membership.assetId)!.push(membership);
    }

    // Map raw results to enriched assets
    const enrichedAssets = rawResults.map((row: any) => {
      const asset = {
        id: row.id,
        ticker: row.ticker,
        name: row.name,
        type: row.type,
        sector: row.sector,
        subsector: row.subsector,
        segment: row.segment,
        cnpj: row.cnpj,
        website: row.website,
        description: row.description,
        logoUrl: row.logo_url,
        isActive: row.is_active,
        listingDate: row.listing_date,
        metadata: row.metadata,
        lastUpdated: row.last_updated,
        lastUpdateStatus: row.last_update_status,
        lastUpdateError: row.last_update_error,
        updateRetryCount: row.update_retry_count,
        autoUpdateEnabled: row.auto_update_enabled,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        hasOptions: row.has_options,
        optionsLiquidityMetadata: row.options_liquidity_metadata,
      };

      const latestClose = row.price1_close;

      // Get index memberships for this asset
      const memberships = membershipsByAsset.get(row.id) || [];
      const currentIndexes = memberships.map((m) => m.indexName);
      const idivMembership = memberships.find((m) => m.indexName === 'IDIV');
      const idivParticipation = idivMembership
        ? Number(idivMembership.participationPercent)
        : null;

      if (!latestClose) {
        return {
          ...asset,
          price: null,
          change: null,
          changePercent: null,
          volume: null,
          marketCap: null,
          currentIndexes,
          idivParticipation,
        };
      }

      return {
        ...asset,
        price: Number(latestClose),
        change: row.price1_change ? Number(row.price1_change) : null,
        changePercent: row.price1_change_percent ? Number(row.price1_change_percent) : null,
        volume: row.price1_volume ? Number(row.price1_volume) : null,
        marketCap: row.price1_market_cap ? Number(row.price1_market_cap) : null,
        currentPrice: {
          date: row.price1_date,
          close: Number(latestClose),
          collectedAt: row.price1_collected_at,
        },
        currentIndexes,
        idivParticipation,
      };
    });

    return enrichedAssets;
  }

  // Keep original method for backward compatibility if needed
  async findAllLegacy(type?: string) {
    // Build optimized query with LEFT JOIN to get latest 2 prices per asset
    const qb = this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect(
        'asset_prices',
        'price1',
        `price1.asset_id = asset.id AND price1.date = (
          SELECT MAX(p.date)
          FROM asset_prices p
          WHERE p.asset_id = asset.id
        )`,
      )
      .leftJoinAndSelect(
        'asset_prices',
        'price2',
        `price2.asset_id = asset.id AND price2.date = (
          SELECT MAX(p.date)
          FROM asset_prices p
          WHERE p.asset_id = asset.id
            AND p.date < (
              SELECT MAX(p2.date)
              FROM asset_prices p2
              WHERE p2.asset_id = asset.id
            )
        )`,
      )
      .addSelect('price1.change', 'price1_change')
      .addSelect('price1.change_percent', 'price1_change_percent')
      .orderBy('asset.ticker', 'ASC');

    if (type) {
      // Normalize type to lowercase to match PostgreSQL enum values
      const normalizedType = type.toLowerCase();
      const validTypes = ['stock', 'fii', 'etf', 'bdr', 'option', 'future', 'crypto', 'fixed_income'];
      if (!validTypes.includes(normalizedType)) {
        this.logger.warn(`Invalid asset type requested: ${type}. Valid types: ${validTypes.join(', ')}`);
        // Return empty array for invalid type instead of database error
        return [];
      }
      qb.where('asset.type = :type', { type: normalizedType });
    }

    const assets = await qb.getRawAndEntities();

    // Process results to get enriched data from database
    const enrichedAssets = assets.entities.map((asset, index) => {
      const rawData = assets.raw[index];

      const latestClose = rawData?.price1_close;

      if (!latestClose) {
        return {
          ...asset,
          price: null,
          change: null,
          changePercent: null,
          volume: null,
          marketCap: null,
        };
      }

      const price = Number(latestClose);
      // Use change and changePercent from database (collected from BRAPI)
      const change = rawData?.price1_change ? Number(rawData.price1_change) : null;
      const changePercent = rawData?.price1_change_percent
        ? Number(rawData.price1_change_percent)
        : null;

      return {
        ...asset,
        price,
        change,
        changePercent,
        volume: rawData?.price1_volume ? Number(rawData.price1_volume) : null,
        marketCap: rawData?.price1_market_cap ? Number(rawData.price1_market_cap) : null,
        currentPrice: {
          date: rawData?.price1_date,
          close: price,
          collectedAt: rawData?.price1_collected_at,
        },
      };
    });

    return enrichedAssets;
  }

  /**
   * Get all assets ordered for bulk update prioritization:
   * 1. Assets with options (hasOptions = true) first
   * 2. Within each group, never updated assets first (lastUpdated IS NULL)
   * 3. Then ordered from oldest to newest (lastUpdated ASC)
   *
   * This ensures options-enabled assets are updated first for trading relevance,
   * and stale/never-updated data gets refreshed before recently updated assets.
   */
  async findAllForBulkUpdate(): Promise<{ ticker: string; hasOptions: boolean; lastUpdated: Date | null }[]> {
    this.logger.log('Fetching assets ordered for bulk update (options first, then by lastUpdated)');

    const assets = await this.assetRepository
      .createQueryBuilder('asset')
      .select(['asset.ticker', 'asset.hasOptions', 'asset.lastUpdated'])
      .orderBy('asset.hasOptions', 'DESC') // true first (options-enabled)
      .addOrderBy('CASE WHEN asset.lastUpdated IS NULL THEN 0 ELSE 1 END', 'ASC') // NULL (never updated) first
      .addOrderBy('asset.lastUpdated', 'ASC') // oldest to newest
      .getMany();

    this.logger.log(`Found ${assets.length} assets for bulk update. ` +
      `Options-enabled: ${assets.filter(a => a.hasOptions).length}, ` +
      `Never updated: ${assets.filter(a => !a.lastUpdated).length}`);

    return assets.map(a => ({
      ticker: a.ticker,
      hasOptions: a.hasOptions,
      lastUpdated: a.lastUpdated,
    }));
  }

  async findByTicker(ticker: string) {
    // Optimized query with LEFT JOIN to get latest 2 prices
    const result = await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect(
        'asset_prices',
        'price1',
        `price1.asset_id = asset.id AND price1.date = (
          SELECT MAX(p.date)
          FROM asset_prices p
          WHERE p.asset_id = asset.id
        )`,
      )
      .leftJoinAndSelect(
        'asset_prices',
        'price2',
        `price2.asset_id = asset.id AND price2.date = (
          SELECT MAX(p.date)
          FROM asset_prices p
          WHERE p.asset_id = asset.id
            AND p.date < (
              SELECT MAX(p2.date)
              FROM asset_prices p2
              WHERE p2.asset_id = asset.id
            )
        )`,
      )
      .where('UPPER(asset.ticker) = :ticker', { ticker: ticker.toUpperCase() })
      .getRawAndEntities();

    if (!result.entities.length) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    const asset = result.entities[0];
    const rawData = result.raw[0];

    const latestClose = rawData?.price1_close;
    const _previousClose = rawData?.price2_close;

    if (!latestClose) {
      return {
        ...asset,
        price: null,
        change: null,
        changePercent: null,
        volume: null,
        marketCap: null,
      };
    }

    const price = Number(latestClose);
    // Use change and changePercent from database (collected from BRAPI)
    const change = rawData?.price1_change ? Number(rawData.price1_change) : null;
    const changePercent = rawData?.price1_change_percent
      ? Number(rawData.price1_change_percent)
      : null;

    return {
      ...asset,
      price,
      change,
      changePercent,
      volume: rawData?.price1_volume ? Number(rawData.price1_volume) : null,
      marketCap: rawData?.price1_market_cap ? Number(rawData.price1_market_cap) : null,
    };
  }

  async getPriceHistory(ticker: string, query: HistoricalPricesQueryDto) {
    const asset = await this.findByTicker(ticker);

    // 1. Determine date range
    let { startDate, endDate, range } = query;

    // If range provided, convert to startDate/endDate
    if (range && !startDate) {
      startDate = this.rangeToStartDate(range);
      endDate = endDate || new Date().toISOString().split('T')[0];
    }

    // Default to 1 year if no params provided
    if (!startDate && !endDate && !range) {
      range = PriceRange.ONE_YEAR;
      startDate = this.rangeToStartDate(range);
      endDate = new Date().toISOString().split('T')[0];
    }

    // 2. Query database for existing prices
    const queryBuilder = this.assetPriceRepository
      .createQueryBuilder('price')
      .where('price.assetId = :assetId', { assetId: asset.id })
      .orderBy('price.date', 'ASC'); // ASC for chronological order

    if (startDate) {
      queryBuilder.andWhere('price.date >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('price.date <= :endDate', { endDate });
    }

    const prices = await queryBuilder.getMany();

    // 3. Check if we need to fetch fresh data from BRAPI
    const shouldFetch = this.shouldRefetchData(prices, range || '1y');

    if (shouldFetch) {
      this.logger.log(`Fetching fresh data from BRAPI for ${ticker} (range: ${range || 'custom'})`);
      await this.syncAsset(ticker, range || '1y');

      // Re-query database after sync and normalize types
      const refreshedPrices = await queryBuilder.getMany();
      return this.normalizePriceTypes(refreshedPrices);
    }

    this.logger.log(`Returning ${prices.length} cached prices for ${ticker}`);
    // FASE 48: Ensure all numeric fields are numbers, not strings (BRAPI type fix)
    return this.normalizePriceTypes(prices);
  }

  /**
   * FASE 48: Normalize price types to ensure all numeric fields are numbers
   * Fixes issue where PostgreSQL/BRAPI returns numeric values as strings
   * @private
   */
  private normalizePriceTypes(prices: AssetPrice[]): AssetPrice[] {
    return prices.map((price) => ({
      ...price,
      open: typeof price.open === 'string' ? parseFloat(price.open) : price.open,
      high: typeof price.high === 'string' ? parseFloat(price.high) : price.high,
      low: typeof price.low === 'string' ? parseFloat(price.low) : price.low,
      close: typeof price.close === 'string' ? parseFloat(price.close) : price.close,
      volume: typeof price.volume === 'string' ? parseInt(price.volume, 10) : price.volume,
      adjustedClose:
        typeof price.adjustedClose === 'string'
          ? parseFloat(price.adjustedClose)
          : price.adjustedClose,
      change: typeof price.change === 'string' ? parseFloat(price.change) : price.change,
      changePercent:
        typeof price.changePercent === 'string'
          ? parseFloat(price.changePercent)
          : price.changePercent,
      marketCap:
        typeof price.marketCap === 'string' ? parseFloat(price.marketCap) : price.marketCap,
    }));
  }

  /**
   * Convert BRAPI range to start date
   */
  private rangeToStartDate(range: string): string {
    const now = new Date();
    const daysMap: Record<string, number> = {
      '1d': 1,
      '5d': 5,
      '1mo': 30,
      '3mo': 90,
      '6mo': 180,
      '1y': 365,
      '2y': 730,
      '5y': 1825,
      '10y': 3650,
      ytd: this.getYTDDays(),
      max: 7300, // ~20 years
    };

    const days = daysMap[range] || 365;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return startDate.toISOString().split('T')[0];
  }

  /**
   * Calculate days since start of year (for YTD range)
   */
  private getYTDDays(): number {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  }

  /**
   * Determine if we should refetch data from BRAPI
   * Based on data freshness and completeness
   */
  private shouldRefetchData(prices: AssetPrice[], range: string): boolean {
    // If no data exists, definitely fetch
    if (!prices || prices.length === 0) {
      return true;
    }

    // Check data freshness - if latest data is > 24h old, fetch
    const latestPrice = prices[prices.length - 1]; // Last element (most recent date due to ASC order)
    const latestDate = new Date(latestPrice.date);
    const now = new Date();
    const hoursSinceLatest = (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLatest > 24) {
      this.logger.log(`Data is stale (${hoursSinceLatest.toFixed(1)}h old), refetching...`);
      return true;
    }

    // Check data completeness - if we have significantly less data than expected, fetch
    const expectedDays = this.getExpectedDays(range);
    const actualDays = prices.length;

    if (actualDays < expectedDays * 0.5) {
      this.logger.log(`Data incomplete (${actualDays}/${expectedDays} expected), refetching...`);
      return true;
    }

    // Data is fresh and complete, use cache
    return false;
  }

  /**
   * Get expected number of trading days for a given range
   */
  private getExpectedDays(range: string): number {
    const daysMap: Record<string, number> = {
      '1d': 1,
      '5d': 5,
      '1mo': 20, // ~20 trading days
      '3mo': 60,
      '6mo': 120,
      '1y': 250, // ~250 trading days
      '2y': 500,
      '5y': 1250,
      '10y': 2500,
      ytd: Math.floor(this.getYTDDays() * 0.7), // ~70% are trading days
      max: 5000,
    };

    return daysMap[range] || 250;
  }

  async syncAsset(ticker: string, range: string = '1y', skipLiquiditySync: boolean = false) {
    this.logger.log(`Starting sync for ${ticker} (range: ${range})`);

    // Check if ticker has changed (e.g. ELET3 -> AXIA3)
    const tickerChange = await this.tickerChangeRepository.findOne({
      where: { oldTicker: ticker.toUpperCase() },
    });

    if (tickerChange) {
      this.logger.warn(
        `Ticker ${ticker} has changed to ${tickerChange.newTicker}. Redirecting sync...`,
      );
      return this.syncAsset(tickerChange.newTicker, range);
    }

    try {
      // 1. Find asset in database
      const asset = await this.assetRepository.findOne({
        where: { ticker: ticker.toUpperCase() },
      });

      if (!asset) {
        throw new NotFoundException(`Asset ${ticker} not found`);
      }

      // 2. Fetch data from BRAPI scraper (includes price + historical data)
      const result = await this.brapiScraper.scrape(ticker, range); // Get data for specified range

      if (!result.success || !result.data) {
        this.logger.warn(`Failed to fetch data for ${ticker}: ${result.error || 'unknown error'}`);
        return {
          message: `Failed to fetch data for ${ticker}`,
          ticker,
          status: 'failed',
          error: result.error,
        };
      }

      // 3. Extract price data from BRAPI
      const brapiData = result.data;
      this.logger.log(
        `BrapiData for ${ticker}: price=${brapiData.price}, volume=${brapiData.volume}, change=${brapiData.change}, changePercent=${brapiData.changePercent}`,
      );

      // 4. Save current day price
      if (brapiData.price && brapiData.volume !== null && brapiData.volume !== undefined) {
        this.logger.log(
          `Preparing to save price for ${ticker}. Change: ${brapiData.change}, ChangePercent: ${brapiData.changePercent}`,
        );

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if price already exists for today
        const existingPrice = await this.assetPriceRepository.findOne({
          where: {
            assetId: asset.id,
            date: today,
          },
        });

        const collectedAt = new Date(); // Timestamp da coleta

        this.logger.log(`Price exists for ${ticker}? ${!!existingPrice}`);

        if (!existingPrice) {
          // Sanitize price data to prevent numeric overflow (especially changePercent which is numeric(10,4))
          const sanitizedData = this.sanitizePriceData({
            open: brapiData.open || brapiData.price,
            high: brapiData.high || brapiData.price,
            low: brapiData.low || brapiData.price,
            close: brapiData.price,
            adjustedClose: brapiData.price,
            marketCap: brapiData.marketCap,
            change: brapiData.change,
            changePercent: brapiData.changePercent,
          });

          const priceData = this.assetPriceRepository.create({
            asset,
            assetId: asset.id,
            date: today,
            ...sanitizedData,
            volume: brapiData.volume,
            source: PriceSource.BRAPI,
            collectedAt, // Registra quando foi coletado da API
          });

          await this.assetPriceRepository.save(priceData);
          this.logger.log(
            `✓ Saved price for ${ticker}: R$ ${brapiData.price.toFixed(2)} (collected at ${collectedAt.toISOString()})`,
          );
        } else {
          // Sanitize price data to prevent numeric overflow
          const sanitizedData = this.sanitizePriceData({
            open: brapiData.open || brapiData.price,
            high: brapiData.high || brapiData.price,
            low: brapiData.low || brapiData.price,
            close: brapiData.price,
            adjustedClose: brapiData.price,
            marketCap: brapiData.marketCap,
            change: brapiData.change,
            changePercent: brapiData.changePercent,
          });

          // Update existing price with sanitized data
          existingPrice.open = sanitizedData.open;
          existingPrice.high = sanitizedData.high;
          existingPrice.low = sanitizedData.low;
          existingPrice.close = sanitizedData.close;
          existingPrice.volume = brapiData.volume;
          existingPrice.adjustedClose = sanitizedData.adjustedClose;
          existingPrice.marketCap = sanitizedData.marketCap;
          existingPrice.change = sanitizedData.change;
          existingPrice.changePercent = sanitizedData.changePercent;
          existingPrice.collectedAt = collectedAt;

          await this.assetPriceRepository.save(existingPrice);
          this.logger.log(
            `✓ Updated price for ${ticker}: R$ ${brapiData.price.toFixed(2)} (collected at ${collectedAt.toISOString()})`,
          );
        }
      }

      // 5. Save historical prices if available
      if (brapiData.historicalPrices && brapiData.historicalPrices.length > 0) {
        let savedCount = 0;
        const collectedAt = new Date(); // Mesmo timestamp para todos os históricos

        for (const histPrice of brapiData.historicalPrices) {
          // Save all historical data from range
          const priceDate = new Date(histPrice.date);
          priceDate.setHours(0, 0, 0, 0);

          const existing = await this.assetPriceRepository.findOne({
            where: {
              assetId: asset.id,
              date: priceDate,
            },
          });

          if (!existing) {
            // Sanitize historical price data to prevent numeric overflow
            const sanitizedHistData = this.sanitizePriceData({
              open: histPrice.open,
              high: histPrice.high,
              low: histPrice.low,
              close: histPrice.close,
              adjustedClose: histPrice.adjustedClose,
              marketCap: null,
              change: null,
              changePercent: null,
            });

            const historicalData = this.assetPriceRepository.create({
              asset,
              assetId: asset.id,
              date: priceDate,
              ...sanitizedHistData,
              volume: histPrice.volume,
              source: PriceSource.BRAPI,
              collectedAt, // Registra quando foi coletado
            });

            await this.assetPriceRepository.save(historicalData);
            savedCount++;
          }
        }

        if (savedCount > 0) {
          this.logger.log(`✓ Saved ${savedCount} historical prices for ${ticker}`);
        }
      }

      if (!skipLiquiditySync) {
        // Sync options liquidity for this asset specifically
        // Note: Ideally we should check just this asset, but our scraper fetches all.
        // For single asset sync, we might want to skip this or just run it if it's cheap.
        // Since scrapeLiquidity fetches all, it's better to run it only if explicitly requested or periodically.
        // However, to ensure data consistency, we'll run it here but catch errors to not block the main sync.
        try {
          await this.syncOptionsLiquidity();
        } catch (e) {
          this.logger.warn(
            `Failed to sync options liquidity during single asset sync: ${e.message}`,
          );
        }
      }

      return {
        message: `Asset ${ticker} synced successfully`,
        ticker,
        status: 'success',
        currentPrice: brapiData.price,
        change: brapiData.change,
        changePercent: brapiData.changePercent,
        source: 'brapi',
      };
    } catch (error) {
      this.logger.error(`Failed to sync ${ticker}: ${error.message}`);

      if (error instanceof NotFoundException) {
        throw error;
      }

      return {
        message: `Failed to sync ${ticker}`,
        ticker,
        status: 'error',
        error: error.message,
      };
    }
  }

  async syncAllAssets(range: string = '1y') {
    this.logger.log(`Starting sync for all assets (range: ${range})`);

    // Sync options liquidity first (once for all assets)
    try {
      await this.syncOptionsLiquidity();
    } catch (e) {
      this.logger.error(`Failed to sync options liquidity during bulk sync: ${e.message}`);
      // Continue with asset sync even if liquidity sync fails
    }

    try {
      // Get all assets from database
      const assets = await this.assetRepository.find();
      this.logger.log(`Found ${assets.length} assets to sync`);

      // Filter out assets with old tickers (they will be synced via new ticker)
      const tickerChanges = await this.tickerChangeRepository.find();
      const oldTickers = new Set(tickerChanges.map((tc) => tc.oldTicker.toUpperCase()));

      const assetsToSync = assets.filter((asset) => !oldTickers.has(asset.ticker.toUpperCase()));

      if (assetsToSync.length < assets.length) {
        this.logger.log(
          `Filtered out ${assets.length - assetsToSync.length} assets with old tickers`,
        );
      }

      const results = {
        total: assetsToSync.length,
        success: 0,
        failed: 0,
        range,
        startedAt: new Date(),
        completedAt: null as Date | null,
        assets: [] as any[],
      };

      // Sync each asset (in parallel with limit)
      const batchSize = 5; // Process 5 assets at a time to avoid overload
      for (let i = 0; i < assetsToSync.length; i += batchSize) {
        const batch = assetsToSync.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (asset) => {
            try {
              this.logger.log(`Syncing ${asset.ticker} (range: ${range})...`);
              await this.syncAsset(asset.ticker, range, true); // Skip liquidity sync for individual assets
              results.success++;
              results.assets.push({
                ticker: asset.ticker,
                status: 'success',
              });
            } catch (error) {
              this.logger.error(`Failed to sync ${asset.ticker}: ${error.message}`);
              results.failed++;
              results.assets.push({
                ticker: asset.ticker,
                status: 'failed',
                error: error.message,
              });
            }
          }),
        );
      }

      results.completedAt = new Date();
      this.logger.log(`Sync completed: ${results.success} success, ${results.failed} failed`);

      return results;
    } catch (error) {
      this.logger.error(`Error syncing all assets: ${error.message}`, error.stack);
      throw error;
    }
  }

  async create(assetData: Partial<Asset>) {
    const asset = this.assetRepository.create(assetData);
    return this.assetRepository.save(asset);
  }

  async update(ticker: string, assetData: Partial<Asset>) {
    const asset = await this.findByTicker(ticker);
    Object.assign(asset, assetData);
    return this.assetRepository.save(asset);
  }

  /**
   * Populate fundamental data for an asset using scrapers
   * This method scrapes data from multiple sources, validates it, and saves to database
   */
  async populateFundamentalData(
    ticker: string,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    this.logger.log(`Starting fundamental data population for ${ticker}`);

    try {
      // 1. Buscar asset no banco de dados
      const asset = await this.assetRepository.findOne({
        where: { ticker: ticker.toUpperCase() },
      });

      if (!asset) {
        throw new NotFoundException(`Asset ${ticker} not found in database`);
      }

      this.logger.log(`Asset found: ${asset.name} (${asset.ticker})`);

      // 2. Executar scrapers de múltiplas fontes
      this.logger.log(`Executing scrapers for ${ticker} from multiple sources...`);
      const scrapedResult = await this.scrapersService.scrapeFundamentalData(ticker);

      this.logger.log(
        `Scraping completed: ${scrapedResult.sourcesCount} sources, confidence: ${scrapedResult.confidence}`,
      );

      // 3. Validar resultado (mínimo 3 fontes, confidence >= 0.7)
      if (!scrapedResult.isValid) {
        this.logger.warn(
          `Insufficient data quality for ${ticker}: ` +
            `${scrapedResult.sourcesCount} sources (min 3 required), ` +
            `confidence: ${scrapedResult.confidence} (min 0.7 required)`,
        );
        return {
          success: false,
          message: `Insufficient data quality: ${scrapedResult.sourcesCount} sources, confidence ${scrapedResult.confidence.toFixed(2)}`,
          data: {
            sources: scrapedResult.sources,
            sourcesCount: scrapedResult.sourcesCount,
            confidence: scrapedResult.confidence,
            discrepancies: scrapedResult.discrepancies,
          },
        };
      }

      // 4. Mapear dados scraped para estrutura da entidade FundamentalData
      const mappedData = this.mapScraperDataToEntity(scrapedResult.data);
      this.logger.log(`Data mapped successfully with ${Object.keys(mappedData).length} fields`);

      // 5. Salvar dados fundamentalistas no banco
      const fundamentalData = this.fundamentalDataRepository.create({
        asset,
        assetId: asset.id,
        referenceDate: new Date(),
        ...mappedData,
      });

      const saved = await this.fundamentalDataRepository.save(fundamentalData);
      this.logger.log(`Fundamental data saved successfully with ID: ${saved.id}`);

      return {
        success: true,
        message: `Data populated successfully from ${scrapedResult.sourcesCount} sources with ${scrapedResult.confidence.toFixed(2)} confidence`,
        data: {
          ticker,
          assetName: asset.name,
          sources: scrapedResult.sources,
          sourcesCount: scrapedResult.sourcesCount,
          confidence: scrapedResult.confidence,
          dataId: saved.id,
          referenceDate: saved.referenceDate,
          indicators: {
            valuation: {
              pl: mappedData.pl,
              pvp: mappedData.pvp,
              psr: mappedData.psr,
              evEbitda: mappedData.evEbitda,
            },
            profitability: {
              roe: mappedData.roe,
              roa: mappedData.roa,
              roic: mappedData.roic,
              margemLiquida: mappedData.margemLiquida,
            },
            dividends: {
              dividendYield: mappedData.dividendYield,
              payout: mappedData.payout,
            },
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error populating data for ${ticker}: ${error.message}`, error.stack);

      if (error instanceof NotFoundException) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: false,
        message: `Unexpected error: ${error.message}`,
      };
    }
  }

  /**
   * Map scraper data to FundamentalData entity fields
   * Handles field name variations and provides fallbacks
   */
  private mapScraperDataToEntity(scrapedData: any): Partial<FundamentalData> {
    return {
      // Valuation Indicators
      pl: scrapedData.pl || scrapedData.pe || null,
      pvp: scrapedData.pvp || scrapedData.pb || null,
      psr: scrapedData.psr || null,
      pAtivos: scrapedData.pAtivos || scrapedData.pAssets || null,
      pCapitalGiro: scrapedData.pCapitalGiro || scrapedData.pWorkingCapital || null,
      pEbit: scrapedData.pEbit || scrapedData.priceToEbit || null,
      evEbit: scrapedData.evEbit || scrapedData.enterpriseValueToEbit || null,
      evEbitda: scrapedData.evEbitda || scrapedData.enterpriseValueToEbitda || null,
      pegRatio: scrapedData.pegRatio || scrapedData.peg || null,

      // Debt Indicators
      dividaLiquidaPatrimonio:
        scrapedData.dividaLiquidaPatrimonio || scrapedData.netDebtToEquity || null,
      dividaLiquidaEbitda: scrapedData.dividaLiquidaEbitda || scrapedData.netDebtToEbitda || null,
      dividaLiquidaEbit: scrapedData.dividaLiquidaEbit || scrapedData.netDebtToEbit || null,
      patrimonioLiquidoAtivos:
        scrapedData.patrimonioLiquidoAtivos || scrapedData.equityToAssets || null,
      passivosAtivos: scrapedData.passivosAtivos || scrapedData.liabilitiesToAssets || null,

      // Efficiency Indicators
      margemBruta: scrapedData.margemBruta || scrapedData.grossMargin || null,
      margemEbit: scrapedData.margemEbit || scrapedData.ebitMargin || null,
      margemEbitda: scrapedData.margemEbitda || scrapedData.ebitdaMargin || null,
      margemLiquida: scrapedData.margemLiquida || scrapedData.netMargin || null,
      roe: scrapedData.roe || scrapedData.returnOnEquity || null,
      roa: scrapedData.roa || scrapedData.returnOnAssets || null,
      roic: scrapedData.roic || scrapedData.returnOnInvestedCapital || null,
      giroAtivos: scrapedData.giroAtivos || scrapedData.assetTurnover || null,

      // Growth Indicators
      cagrReceitas5anos: scrapedData.cagrReceitas5anos || scrapedData.revenueCagr5y || null,
      cagrLucros5anos: scrapedData.cagrLucros5anos || scrapedData.earningsCagr5y || null,

      // Dividend Indicators
      dividendYield: scrapedData.dividendYield || scrapedData.dy || null,
      payout: scrapedData.payout || scrapedData.payoutRatio || null,

      // Financial Statement Data (in millions)
      receitaLiquida:
        scrapedData.receitaLiquida || scrapedData.revenue || scrapedData.netRevenue || null,
      ebit: scrapedData.ebit || null,
      ebitda: scrapedData.ebitda || null,
      lucroLiquido:
        scrapedData.lucroLiquido || scrapedData.netIncome || scrapedData.netProfit || null,
      patrimonioLiquido:
        scrapedData.patrimonioLiquido ||
        scrapedData.equity ||
        scrapedData.shareholderEquity ||
        null,
      ativoTotal: scrapedData.ativoTotal || scrapedData.totalAssets || null,
      dividaBruta:
        scrapedData.dividaBruta || scrapedData.grossDebt || scrapedData.totalDebt || null,
      dividaLiquida: scrapedData.dividaLiquida || scrapedData.netDebt || null,
      disponibilidades:
        scrapedData.disponibilidades || scrapedData.cash || scrapedData.cashAndEquivalents || null,

      // Per Share Data
      lpa: scrapedData.lpa || scrapedData.earningsPerShare || null,
      vpa: scrapedData.vpa || scrapedData.bookValuePerShare || null,

      // Liquidity
      liquidezCorrente:
        scrapedData.liquidezCorrente ||
        scrapedData.liquidez_corrente ||
        scrapedData.currentRatio ||
        null,

      // Store original data and metadata
      metadata: {
        originalData: scrapedData,
        sources: scrapedData.sources || [],
        scrapedAt: new Date().toISOString(),
        confidence: scrapedData.confidence || null,
        discrepancies: scrapedData.discrepancies || [],
      },
    };
  }

  /**
   * Sync options liquidity data for all assets
   * Uses scrapeLiquidityWithDetails() to get detailed data including:
   * - Period of analysis
   * - Total trades
   * - Financial volume
   * - Quantity traded
   */
  async syncOptionsLiquidity() {
    this.logger.log('Syncing options liquidity for all assets (with detailed data)');
    const startTime = Date.now();
    try {
      // Use the new method that returns detailed data
      const liquidityData = await this.opcoesScraper.scrapeLiquidityWithDetails();

      const assets = await this.assetRepository.find();
      let updatedCount = 0;
      let optionsAddedCount = 0;
      let optionsRemovedCount = 0;
      const assetsWithOptions: string[] = [];

      for (const asset of assets) {
        const upperTicker = asset.ticker.toUpperCase();
        const optionsData = liquidityData.get(upperTicker);
        const hadOptions = asset.hasOptions;
        const nowHasOptions = !!optionsData;

        // Update hasOptions flag
        if (hadOptions !== nowHasOptions) {
          asset.hasOptions = nowHasOptions;
          updatedCount++;

          if (nowHasOptions) {
            optionsAddedCount++;
          } else {
            optionsRemovedCount++;
          }
        }

        // Update optionsLiquidityMetadata with detailed data
        if (nowHasOptions && optionsData) {
          asset.optionsLiquidityMetadata = {
            periodo: optionsData.periodo,
            totalNegocios: optionsData.totalNegocios,
            volumeFinanceiro: optionsData.volumeFinanceiro,
            quantidadeNegociada: optionsData.quantidadeNegociada,
            mediaNegocios: optionsData.mediaNegocios,
            mediaVolume: optionsData.mediaVolume,
            lastUpdated: optionsData.lastUpdated.toISOString(),
          };
          assetsWithOptions.push(asset.ticker);
        } else if (!nowHasOptions && asset.optionsLiquidityMetadata) {
          // Clear metadata if asset no longer has options
          asset.optionsLiquidityMetadata = null;
        }
      }

      // Save all updated assets
      if (updatedCount > 0 || assetsWithOptions.length > 0) {
        await this.assetRepository.save(assets);
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Options liquidity sync completed: ${assetsWithOptions.length} assets with options, ` +
          `${optionsAddedCount} added, ${optionsRemovedCount} removed (${duration}ms)`,
      );

      return {
        totalUpdated: updatedCount,
        optionsAdded: optionsAddedCount,
        optionsRemoved: optionsRemovedCount,
        assetsWithOptions,
        totalWithOptions: assetsWithOptions.length,
        duration,
      };
    } catch (error) {
      this.logger.error(`Failed to sync options liquidity: ${error.message}`);
      throw error;
    }
  }

  /**
   * FASE 3 - Obter detalhes de fontes de dados para um ativo
   *
   * Retorna informações detalhadas sobre:
   * - Quais fontes foram consultadas
   * - Valor de cada fonte para cada campo
   * - Consenso entre fontes
   * - Discrepâncias detectadas
   */
  async getDataSources(ticker: string): Promise<{
    ticker: string;
    assetName: string;
    lastUpdate: string | null;
    overallConfidence: number;
    sourcesUsed: string[];
    totalSourcesQueried: number;
    totalSourcesSuccessful: number;
    totalFieldsTracked: number;
    fieldsWithDiscrepancy: number;
    fieldsWithHighConsensus: number;
    fields: Record<string, any>;
  }> {
    this.logger.log(`Getting data sources for ${ticker}`);

    // 1. Buscar asset
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    // 2. Buscar dados fundamentalistas mais recentes com fieldSources
    const fundamentalData = await this.fundamentalDataRepository.findOne({
      where: { assetId: asset.id },
      order: { updatedAt: 'DESC' },
    });

    if (!fundamentalData || !fundamentalData.fieldSources) {
      return {
        ticker: asset.ticker,
        assetName: asset.name,
        lastUpdate: fundamentalData?.updatedAt?.toISOString() || null,
        overallConfidence: 0,
        sourcesUsed: [],
        totalSourcesQueried: 0,
        totalSourcesSuccessful: 0,
        totalFieldsTracked: 0,
        fieldsWithDiscrepancy: 0,
        fieldsWithHighConsensus: 0,
        fields: {},
      };
    }

    // 3. Processar fieldSources para estatísticas
    const fieldSources = fundamentalData.fieldSources;
    const fields = Object.keys(fieldSources);

    // Coletar fontes únicas
    const allSources = new Set<string>();
    let fieldsWithDiscrepancy = 0;
    let fieldsWithHighConsensus = 0;
    let totalConsensus = 0;

    for (const field of fields) {
      const info = fieldSources[field];
      if (!info) continue;

      // Coletar fontes
      info.values?.forEach((v: any) => {
        if (v.source) allSources.add(v.source);
      });

      // Contar discrepâncias
      if (info.hasDiscrepancy) {
        fieldsWithDiscrepancy++;
      }

      // Contar alto consenso (>= 67%)
      if (info.consensus >= 67) {
        fieldsWithHighConsensus++;
      }

      totalConsensus += info.consensus || 0;
    }

    // Calcular confiança geral (média do consenso)
    const overallConfidence = fields.length > 0 ? totalConsensus / fields.length / 100 : 0;

    // Contar fontes com sucesso (que retornaram pelo menos um valor)
    const sourcesWithData = new Set<string>();
    for (const field of fields) {
      const info = fieldSources[field];
      info?.values?.forEach((v: any) => {
        if (v.value !== null && v.source) {
          sourcesWithData.add(v.source);
        }
      });
    }

    return {
      ticker: asset.ticker,
      assetName: asset.name,
      lastUpdate: fundamentalData.updatedAt?.toISOString() || null,
      overallConfidence: Math.round(overallConfidence * 100) / 100,
      sourcesUsed: Array.from(sourcesWithData),
      totalSourcesQueried: allSources.size,
      totalSourcesSuccessful: sourcesWithData.size,
      totalFieldsTracked: fields.length,
      fieldsWithDiscrepancy,
      fieldsWithHighConsensus,
      fields: fieldSources,
    };
  }
}
