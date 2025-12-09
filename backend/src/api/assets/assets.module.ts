import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Asset,
  AssetPrice,
  FundamentalData,
  UpdateLog,
  Portfolio,
  PortfolioPosition,
  TickerChange,
} from '@database/entities';
import { AssetsController } from './assets.controller';
import { AssetsUpdateController } from './assets-update.controller';
import { AssetsService } from './assets.service';
import { AssetsUpdateService } from './assets-update.service';
import { ScrapersModule } from '../../scrapers/scrapers.module';
import { WebSocketModule } from '../../websocket/websocket.module';
import { QueueModule } from '../../queue/queue.module';
import { NewsModule } from '../news/news.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asset,
      AssetPrice,
      FundamentalData,
      UpdateLog,
      Portfolio,
      PortfolioPosition,
      TickerChange,
    ]),
    ScrapersModule,
    WebSocketModule,
    forwardRef(() => QueueModule),
    NewsModule,
  ],
  controllers: [AssetsController, AssetsUpdateController],
  providers: [AssetsService, AssetsUpdateService],
  exports: [AssetsService, AssetsUpdateService],
})
export class AssetsModule {}
