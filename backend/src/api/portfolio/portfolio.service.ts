import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Portfolio, PortfolioPosition, Asset, AssetType } from '@database/entities';
import { B3Parser } from './parsers/b3-parser';
import { KinvoParser } from './parsers/kinvo-parser';
import { PortfolioParser } from './parsers/portfolio-parser.interface';

@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);
  private readonly parsers: PortfolioParser[];

  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(PortfolioPosition)
    private positionRepository: Repository<PortfolioPosition>,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    private dataSource: DataSource,
    private b3Parser: B3Parser,
    private kinvoParser: KinvoParser,
  ) {
    this.parsers = [this.b3Parser, this.kinvoParser];
  }

  async findUserPortfolios(userId: string) {
    return this.portfolioRepository.find({
      where: { userId },
      relations: ['positions', 'positions.asset'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Portfolio | null> {
    return this.portfolioRepository.findOne({
      where: { id, userId },
      relations: ['positions', 'positions.asset'],
    });
  }

  async create(userId: string, data: any): Promise<Portfolio> {
    const portfolio = this.portfolioRepository.create({
      userId,
      ...data,
    });
    const saved = await this.portfolioRepository.save(portfolio);
    // TypeORM save can return either single entity or array depending on input
    // We know it's a single entity, so cast appropriately
    return (Array.isArray(saved) ? saved[0] : saved) as Portfolio;
  }

  async update(id: string, userId: string, data: any): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id, userId },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    Object.assign(portfolio, data);
    return this.portfolioRepository.save(portfolio);
  }

  async remove(id: string, userId: string): Promise<void> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id, userId },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    await this.portfolioRepository.remove(portfolio);
  }

  async addPosition(portfolioId: string, userId: string, data: any): Promise<PortfolioPosition> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Find or create asset
    let asset = await this.assetRepository.findOne({
      where: { ticker: data.ticker },
    });

    if (!asset) {
      asset = this.assetRepository.create({
        ticker: data.ticker,
        name: data.ticker,
        type: this.getAssetType(data.ticker),
        isActive: true,
      });
      asset = await this.assetRepository.save(asset);
    }

    const position = this.positionRepository.create({
      portfolioId,
      assetId: asset.id,
      quantity: data.quantity,
      averagePrice: data.averagePrice,
      totalInvested: data.quantity * data.averagePrice,
    });

    return this.positionRepository.save(position);
  }

  async updatePosition(
    portfolioId: string,
    positionId: string,
    userId: string,
    data: any,
  ): Promise<PortfolioPosition> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const position = await this.positionRepository.findOne({
      where: { id: positionId, portfolioId },
    });

    if (!position) {
      throw new Error('Position not found');
    }

    Object.assign(position, data);
    if (data.quantity && data.averagePrice) {
      position.totalInvested = data.quantity * data.averagePrice;
    }

    return this.positionRepository.save(position);
  }

  async removePosition(portfolioId: string, positionId: string, userId: string): Promise<void> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const position = await this.positionRepository.findOne({
      where: { id: positionId, portfolioId },
    });

    if (!position) {
      throw new Error('Position not found');
    }

    await this.positionRepository.remove(position);
  }

  async importFromFile(userId: string, fileBuffer: Buffer, filename: string) {
    this.logger.log(`Importing portfolio for user ${userId} from ${filename}`);

    try {
      // Find appropriate parser
      const parser = this.parsers.find((p) => p.canParse(filename, fileBuffer));

      if (!parser) {
        throw new Error(`No parser found for file: ${filename}`);
      }

      this.logger.log(`Using parser: ${parser.source}`);

      // Parse file
      const parsedPortfolio = await parser.parse(fileBuffer, filename);

      // Use transaction for atomic operations and performance
      const result = await this.dataSource.transaction(async (manager) => {
        // Create portfolio
        const portfolio = await manager.save(Portfolio, {
          userId,
          name: `Importado de ${parsedPortfolio.source} - ${new Date().toLocaleDateString('pt-BR')}`,
          description: `Portfolio importado de ${parsedPortfolio.source}`,
          totalInvested: parsedPortfolio.totalInvested,
        });

        // Get all unique tickers from positions
        const tickers = [...new Set(parsedPortfolio.positions.map((p) => p.ticker))];

        // Batch fetch all existing assets (1 query instead of N)
        const existingAssets = await manager.find(Asset, {
          where: tickers.map((ticker) => ({ ticker })),
        });

        const existingAssetMap = new Map(existingAssets.map((a) => [a.ticker, a]));

        // Identify missing assets
        const missingTickers = tickers.filter((ticker) => !existingAssetMap.has(ticker));

        // Batch create missing assets (1 query instead of N)
        if (missingTickers.length > 0) {
          const newAssets = await manager.save(
            Asset,
            missingTickers.map((ticker) => ({
              ticker,
              name: ticker,
              type: this.getAssetType(ticker),
              isActive: true,
            })),
          );

          // Add new assets to map
          newAssets.forEach((asset) => existingAssetMap.set(asset.ticker, asset));
        }

        // Batch create all positions (1 query instead of N)
        const positions = parsedPortfolio.positions.map((position) => {
          const asset = existingAssetMap.get(position.ticker);
          return {
            portfolioId: portfolio.id,
            assetId: asset!.id,
            quantity: position.quantity,
            averagePrice: position.averagePrice,
            totalInvested: position.totalInvested,
            currentPrice: position.currentPrice,
            notes: position.notes ? { imported: position.notes } : null,
          };
        });

        await manager.save(PortfolioPosition, positions);

        return {
          success: true,
          portfolio,
          positionsCount: parsedPortfolio.positions.length,
          source: parsedPortfolio.source,
          metadata: parsedPortfolio.metadata,
        };
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to import portfolio: ${error.message}`);
      throw error;
    }
  }

  private getAssetType(ticker: string): AssetType {
    if (ticker.endsWith('11') || ticker.endsWith('B')) return AssetType.FII;
    if (ticker.match(/^[A-Z]{4}[0-9]{2}$/)) return AssetType.BDR;
    if (ticker.match(/^[A-Z]{4}[A-Z][0-9]{2}$/)) return AssetType.OPTION;
    return AssetType.STOCK;
  }
}
