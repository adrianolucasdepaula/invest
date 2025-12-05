import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { PythonServiceClient } from './clients/python-service.client';
import { SyncGateway } from './sync.gateway'; // FASE 35
import { AssetsModule } from '../assets/assets.module';
import { ScrapersModule } from '../../scrapers/scrapers.module'; // FASE 69: Intraday sync
import { Asset, AssetPrice, SyncHistory, TickerChange, IntradayPrice } from '../../database/entities';
import { TickerMergeService } from './ticker-merge.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 300000, // 5min timeout (COTAHIST pode demorar 2-3min)
      maxRedirects: 0,
    }),
    TypeOrmModule.forFeature([Asset, AssetPrice, SyncHistory, TickerChange, IntradayPrice]), // FASE 34.6: Add SyncHistory, FASE 55: Add TickerChange, FASE 67: Add IntradayPrice
    ConfigModule,
    AssetsModule, // Para reutilizar AssetsService
    ScrapersModule, // FASE 69: Import BrapiScraper for intraday sync
  ],
  controllers: [MarketDataController],
  providers: [MarketDataService, PythonServiceClient, SyncGateway, TickerMergeService], // FASE 35: Add SyncGateway, FASE 55: Add TickerMergeService
  exports: [MarketDataService, SyncGateway, TickerMergeService], // FASE 35: Export SyncGateway, FASE 55: Export TickerMergeService
})
export class MarketDataModule {}
