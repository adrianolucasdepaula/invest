import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, AssetType, AssetPrice } from '@database/entities';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(AssetPrice)
    private assetPriceRepository: Repository<AssetPrice>,
  ) {}

  async findAll(type?: string) {
    const where = type ? { type: type as AssetType } : {};
    const assets = await this.assetRepository.find({ where, order: { ticker: 'ASC' } });

    // Enrich assets with latest price data
    const enrichedAssets = await Promise.all(
      assets.map(async (asset) => {
        const latestPrice = await this.assetPriceRepository.findOne({
          where: { assetId: asset.id },
          order: { date: 'DESC' },
        });

        if (!latestPrice) {
          return {
            ...asset,
            price: null,
            change: null,
            changePercent: null,
            volume: null,
            marketCap: null,
          };
        }

        // Get previous day's price for change calculation
        const recentPrices = await this.assetPriceRepository.find({
          where: { assetId: asset.id },
          order: { date: 'DESC' },
          take: 2,
        });
        const previousPrice = recentPrices.length > 1 ? recentPrices[1] : null;

        const price = Number(latestPrice.close);
        const previousClose = previousPrice ? Number(previousPrice.close) : price;
        const change = price - previousClose;
        const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

        return {
          ...asset,
          price,
          change,
          changePercent,
          volume: Number(latestPrice.volume),
          marketCap: latestPrice.marketCap ? Number(latestPrice.marketCap) : null,
        };
      }),
    );

    return enrichedAssets;
  }

  async findByTicker(ticker: string) {
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    // Enrich with latest price data
    const latestPrice = await this.assetPriceRepository.findOne({
      where: { assetId: asset.id },
      order: { date: 'DESC' },
    });

    if (!latestPrice) {
      return {
        ...asset,
        price: null,
        change: null,
        changePercent: null,
        volume: null,
        marketCap: null,
      };
    }

    // Get previous day's price for change calculation
    const recentPrices = await this.assetPriceRepository.find({
      where: { assetId: asset.id },
      order: { date: 'DESC' },
      take: 2,
    });
    const previousPrice = recentPrices.length > 1 ? recentPrices[1] : null;

    const price = Number(latestPrice.close);
    const previousClose = previousPrice ? Number(previousPrice.close) : price;
    const change = price - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    return {
      ...asset,
      price,
      change,
      changePercent,
      volume: Number(latestPrice.volume),
      marketCap: latestPrice.marketCap ? Number(latestPrice.marketCap) : null,
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
