import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio, PortfolioPosition, Asset } from '@database/entities';
import { PortfolioController } from './portfolio.controller';
import { PortfolioService } from './portfolio.service';
import { B3Parser } from './parsers/b3-parser';
import { KinvoParser } from './parsers/kinvo-parser';

@Module({
  imports: [TypeOrmModule.forFeature([Portfolio, PortfolioPosition, Asset])],
  controllers: [PortfolioController],
  providers: [PortfolioService, B3Parser, KinvoParser],
  exports: [PortfolioService],
})
export class PortfolioModule {}
