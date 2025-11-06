import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio, PortfolioPosition } from '@database/entities';

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(PortfolioPosition)
    private positionRepository: Repository<PortfolioPosition>,
  ) {}

  async findUserPortfolios(userId: string) {
    return this.portfolioRepository.find({
      where: { userId },
      relations: ['positions', 'positions.asset'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(userId: string, data: any) {
    const portfolio = this.portfolioRepository.create({
      userId,
      ...data,
    });
    return this.portfolioRepository.save(portfolio);
  }

  async importFromFile(userId: string, data: any) {
    // TODO: Implement portfolio import from various sources
    return { message: 'Portfolio import not implemented yet' };
  }
}
