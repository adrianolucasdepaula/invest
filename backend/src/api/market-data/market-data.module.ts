import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { PythonServiceClient } from './clients/python-service.client';
import { AssetsModule } from '../assets/assets.module';
import { AssetPrice } from '../../database/entities';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30s timeout
      maxRedirects: 0,
    }),
    TypeOrmModule.forFeature([AssetPrice]),
    ConfigModule,
    AssetsModule, // Para reutilizar AssetsService
  ],
  controllers: [MarketDataController],
  providers: [MarketDataService, PythonServiceClient],
  exports: [MarketDataService],
})
export class MarketDataModule {}
