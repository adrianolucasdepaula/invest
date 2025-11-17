import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { PythonServiceClient } from './clients/python-service.client';
import { AssetsModule } from '../assets/assets.module';
import { Asset, AssetPrice } from '../../database/entities';

@Module({
  imports: [
    HttpModule.register({
      timeout: 300000, // 5min timeout (COTAHIST pode demorar 2-3min)
      maxRedirects: 0,
    }),
    TypeOrmModule.forFeature([Asset, AssetPrice]),
    ConfigModule,
    AssetsModule, // Para reutilizar AssetsService
  ],
  controllers: [MarketDataController],
  providers: [MarketDataService, PythonServiceClient],
  exports: [MarketDataService],
})
export class MarketDataModule {}
