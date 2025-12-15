import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Portfolio, PortfolioPosition, Asset, AssetType } from '@database/entities';
import { B3Parser } from './parsers/b3-parser';
import { KinvoParser } from './parsers/kinvo-parser';
import { PortfolioParser } from './parsers/portfolio-parser.interface';
import {
  CreatePortfolioDto,
  UpdatePortfolioDto,
  CreatePositionDto,
  UpdatePositionDto,
  ImportPortfolioDto,
  PortfolioResponseDto,
  PositionResponseDto,
} from './dto';

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

  async findUserPortfolios(userId: string): Promise<PortfolioResponseDto[]> {
    const portfolios = await this.portfolioRepository.find({
      where: { userId },
      relations: ['positions', 'positions.asset'],
      order: { createdAt: 'DESC' },
    });
    return portfolios.map((p) => this.toPortfolioResponseDto(p));
  }

  async findOne(id: string, userId: string): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id, userId },
      relations: ['positions', 'positions.asset'],
    });
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }
    return this.toPortfolioResponseDto(portfolio);
  }

  async create(userId: string, data: CreatePortfolioDto): Promise<PortfolioResponseDto> {
    const portfolio = this.portfolioRepository.create({
      userId,
      name: data.name,
      description: data.description,
      settings: data.settings,
      totalInvested: 0,
      currentValue: 0,
    });
    const saved = await this.portfolioRepository.save(portfolio);
    const savedPortfolio = Array.isArray(saved) ? saved[0] : saved;
    return this.toPortfolioResponseDto(savedPortfolio);
  }

  async update(id: string, userId: string, data: UpdatePortfolioDto): Promise<PortfolioResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id, userId },
      relations: ['positions', 'positions.asset'],
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    if (data.name !== undefined) portfolio.name = data.name;
    if (data.description !== undefined) portfolio.description = data.description;
    if (data.isActive !== undefined) portfolio.isActive = data.isActive;
    if (data.settings !== undefined) portfolio.settings = data.settings;

    const saved = await this.portfolioRepository.save(portfolio);
    return this.toPortfolioResponseDto(saved);
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

  async addPosition(portfolioId: string, userId: string, data: CreatePositionDto): Promise<PositionResponseDto> {
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

    const position = new PortfolioPosition();
    position.portfolioId = portfolioId;
    position.assetId = asset.id;
    position.quantity = data.quantity;
    position.averagePrice = data.averagePrice;
    position.totalInvested = data.quantity * data.averagePrice;
    position.firstBuyDate = data.purchaseDate ? new Date(data.purchaseDate) : new Date();
    if (data.notes) {
      position.notes = data.notes;
    }

    const savedPosition = await this.positionRepository.save(position);
    const savedId = Array.isArray(savedPosition) ? savedPosition[0].id : savedPosition.id;

    // Reload with asset relation for response
    const positionWithAsset = await this.positionRepository.findOne({
      where: { id: savedId },
      relations: ['asset'],
    });

    return this.toPositionResponseDto(positionWithAsset!);
  }

  async updatePosition(
    portfolioId: string,
    positionId: string,
    userId: string,
    data: UpdatePositionDto,
  ): Promise<PositionResponseDto> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const position = await this.positionRepository.findOne({
      where: { id: positionId, portfolioId },
      relations: ['asset'],
    });

    if (!position) {
      throw new Error('Position not found');
    }

    if (data.quantity !== undefined) position.quantity = data.quantity;
    if (data.averagePrice !== undefined) position.averagePrice = data.averagePrice;
    if (data.currentPrice !== undefined) position.currentPrice = data.currentPrice;
    if (data.notes !== undefined) position.notes = data.notes;

    // Recalculate totalInvested if quantity or averagePrice changed
    if (data.quantity !== undefined || data.averagePrice !== undefined) {
      position.totalInvested = position.quantity * position.averagePrice;
    }

    const saved = await this.positionRepository.save(position);
    return this.toPositionResponseDto(saved);
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

  async importFromFile(userId: string, fileBuffer: Buffer, filename: string): Promise<PortfolioResponseDto> {
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

        return portfolio;
      });

      // Reload portfolio with positions for response
      const portfolioWithPositions = await this.portfolioRepository.findOne({
        where: { id: result.id },
        relations: ['positions', 'positions.asset'],
      });

      return this.toPortfolioResponseDto(portfolioWithPositions!);
    } catch (error) {
      this.logger.error(`Failed to import portfolio: ${error.message}`);
      throw error;
    }
  }

  async importPositions(userId: string, data: ImportPortfolioDto): Promise<PortfolioResponseDto> {
    this.logger.log(`Importing ${data.positions?.length || 0} positions for user ${userId}`);

    // Create portfolio
    const portfolioName = data.name || `Importação ${data.source || 'Manual'} - ${new Date().toLocaleDateString('pt-BR')}`;
    const portfolio = await this.create(userId, {
      name: portfolioName,
      description: `Portfolio importado de ${data.source || 'importação manual'}`,
    });

    // Add positions
    if (data.positions && data.positions.length > 0) {
      for (const pos of data.positions) {
        await this.addPosition(portfolio.id, userId, {
          ticker: pos.ticker,
          quantity: pos.quantity,
          averagePrice: pos.averagePrice,
          notes: pos.notes ? { imported: pos.notes } : undefined,
        });
      }

      // Reload portfolio with updated totals
      return this.findOne(portfolio.id, userId);
    }

    return portfolio;
  }

  private getAssetType(ticker: string): AssetType {
    if (ticker.endsWith('11') || ticker.endsWith('B')) return AssetType.FII;
    if (ticker.match(/^[A-Z]{4}[0-9]{2}$/)) return AssetType.BDR;
    if (ticker.match(/^[A-Z]{4}[A-Z][0-9]{2}$/)) return AssetType.OPTION;
    return AssetType.STOCK;
  }

  private toPortfolioResponseDto(portfolio: Portfolio): PortfolioResponseDto {
    const positions = portfolio.positions || [];
    const totalInvested = positions.reduce((sum, p) => sum + (p.totalInvested || 0), 0);
    const currentValue = positions.reduce((sum, p) => {
      const value = p.currentPrice ? p.currentPrice * p.quantity : p.totalInvested;
      return sum + value;
    }, 0);
    const profit = currentValue - totalInvested;
    const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

    return {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      isActive: portfolio.isActive,
      totalInvested: portfolio.totalInvested || totalInvested,
      currentValue: portfolio.currentValue || currentValue,
      profit: profit,
      profitPercentage: profitPercentage,
      settings: portfolio.settings,
      positions: positions.map((p) => this.toPositionResponseDto(p)),
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    };
  }

  private toPositionResponseDto(position: PortfolioPosition): PositionResponseDto {
    const totalInvested = position.totalInvested || position.quantity * position.averagePrice;
    const currentValue = position.currentPrice ? position.currentPrice * position.quantity : totalInvested;
    const profit = currentValue - totalInvested;
    const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

    return {
      id: position.id,
      portfolioId: position.portfolioId,
      assetId: position.assetId,
      asset: position.asset
        ? {
            id: position.asset.id,
            ticker: position.asset.ticker,
            name: position.asset.name,
            type: position.asset.type,
          }
        : undefined,
      quantity: position.quantity,
      averagePrice: position.averagePrice,
      currentPrice: position.currentPrice,
      totalInvested: totalInvested,
      currentValue: currentValue,
      profit: profit,
      profitPercentage: profitPercentage,
      firstBuyDate: position.firstBuyDate,
      lastUpdateDate: position.updatedAt,
      notes: position.notes,
      createdAt: position.createdAt,
      updatedAt: position.updatedAt,
    };
  }
}
