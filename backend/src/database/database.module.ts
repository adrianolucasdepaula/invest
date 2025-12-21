import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  User,
  Asset,
  AssetPrice,
  AssetIndexMembership,
  FundamentalData,
  Portfolio,
  PortfolioPosition,
  DataSource,
  ScrapedData,
  Analysis,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Asset,
      AssetPrice,
      AssetIndexMembership,
      FundamentalData,
      Portfolio,
      PortfolioPosition,
      DataSource,
      ScrapedData,
      Analysis,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
