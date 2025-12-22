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
  Dividend,
  StockLendingRate,
  BacktestResult,
  OptionPrice,
  WheelStrategy,
  WheelTrade,
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
      Dividend,
      StockLendingRate,
      BacktestResult,
      OptionPrice,
      WheelStrategy,
      WheelTrade,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
