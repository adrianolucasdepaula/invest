import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetType, AssetPrice, FundamentalData } from '@database/entities';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(AssetPrice)
    private assetPriceRepository: Repository<AssetPrice>,
    @InjectRepository(FundamentalData)
    private fundamentalDataRepository: Repository<FundamentalData>,
  ) {}

  async findAll(type?: string) {
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
        )`
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
        )`
      )
      .orderBy('asset.ticker', 'ASC');

    if (type) {
      qb.where('asset.type = :type', { type });
    }

    const assets = await qb.getRawAndEntities();

    // Process results to calculate enriched data
    const enrichedAssets = assets.entities.map((asset, index) => {
      const rawData = assets.raw[index];

      const latestClose = rawData?.price1_close;
      const previousClose = rawData?.price2_close;

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
      const prevPrice = previousClose ? Number(previousClose) : price;
      const change = price - prevPrice;
      const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;

      return {
        ...asset,
        price,
        change,
        changePercent,
        volume: rawData?.price1_volume ? Number(rawData.price1_volume) : null,
        marketCap: rawData?.price1_market_cap ? Number(rawData.price1_market_cap) : null,
      };
    });

    return enrichedAssets;
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
        )`
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
        )`
      )
      .where('UPPER(asset.ticker) = :ticker', { ticker: ticker.toUpperCase() })
      .getRawAndEntities();

    if (!result.entities.length) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    const asset = result.entities[0];
    const rawData = result.raw[0];

    const latestClose = rawData?.price1_close;
    const previousClose = rawData?.price2_close;

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
    const prevPrice = previousClose ? Number(previousClose) : price;
    const change = price - prevPrice;
    const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;

    return {
      ...asset,
      price,
      change,
      changePercent,
      volume: rawData?.price1_volume ? Number(rawData.price1_volume) : null,
      marketCap: rawData?.price1_market_cap ? Number(rawData.price1_market_cap) : null,
    };
  }

  async getPriceHistory(ticker: string, startDate?: string, endDate?: string) {
    const asset = await this.findByTicker(ticker);

    const query = this.assetPriceRepository
      .createQueryBuilder('price')
      .where('price.assetId = :assetId', { assetId: asset.id })
      .orderBy('price.date', 'DESC');

    if (startDate) {
      query.andWhere('price.date >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('price.date <= :endDate', { endDate });
    }

    return query.getMany();
  }

  async getFundamentals(ticker: string, limit: number = 1) {
    const asset = await this.findByTicker(ticker);

    const fundamentals = await this.fundamentalDataRepository
      .createQueryBuilder('fundamental')
      .where('fundamental.assetId = :assetId', { assetId: asset.id })
      .orderBy('fundamental.referenceDate', 'DESC')
      .limit(limit)
      .getMany();

    if (fundamentals.length === 0) {
      // Return empty fundamental structure if no data exists
      return null;
    }

    // Return latest fundamental data (or array if limit > 1)
    return limit === 1 ? fundamentals[0] : fundamentals;
  }

  async syncAsset(ticker: string) {
    // TODO: Implement asset sync logic using scrapers
    return {
      message: `Asset ${ticker} sync started`,
      ticker,
      status: 'pending',
    };
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
}
