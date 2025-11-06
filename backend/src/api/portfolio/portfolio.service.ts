import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

      // Create portfolio
      const portfolio = await this.create(userId, {
        name: `Importado de ${parsedPortfolio.source} - ${new Date().toLocaleDateString('pt-BR')}`,
        description: `Portfolio importado de ${parsedPortfolio.source}`,
        totalInvested: parsedPortfolio.totalInvested,
      });

      // Create positions
      for (const position of parsedPortfolio.positions) {
        // Find or create asset
        let asset = await this.assetRepository.findOne({
          where: { ticker: position.ticker },
        });

        if (!asset) {
          // Create asset if it doesn't exist
          asset = await this.assetRepository.save({
            ticker: position.ticker,
            name: position.ticker,
            type: this.getAssetType(position.ticker),
            isActive: true,
          });
        }

        // Create position
        await this.positionRepository.save({
          portfolioId: portfolio.id,
          assetId: asset.id,
          quantity: position.quantity,
          averagePrice: position.averagePrice,
          totalInvested: position.totalInvested,
          currentPrice: position.currentPrice,
          notes: position.notes ? { imported: position.notes } : null,
        });
      }

      return {
        success: true,
        portfolio,
        positionsCount: parsedPortfolio.positions.length,
        source: parsedPortfolio.source,
        metadata: parsedPortfolio.metadata,
      };
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
