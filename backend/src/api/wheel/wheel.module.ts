import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  WheelStrategy,
  WheelTrade,
  Asset,
  FundamentalData,
  OptionPrice,
  AssetPrice,
} from '@database/entities';
import { WheelService } from './wheel.service';
import { WheelController } from './wheel.controller';
import { EconomicIndicatorsModule } from '../economic-indicators/economic-indicators.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WheelStrategy,
      WheelTrade,
      Asset,
      FundamentalData,
      OptionPrice,
      AssetPrice,
    ]),
    // FASE 4: Import EconomicIndicatorsModule for Selic rate access
    EconomicIndicatorsModule,
  ],
  controllers: [WheelController],
  providers: [WheelService],
  exports: [WheelService],
})
export class WheelModule {}
