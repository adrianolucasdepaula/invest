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
    return this.assetRepository.find({ where, order: { ticker: 'ASC' } });
  }

  async findByTicker(ticker: string) {
    const asset = await this.assetRepository.findOne({
      where: { ticker: ticker.toUpperCase() },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    return asset;
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
