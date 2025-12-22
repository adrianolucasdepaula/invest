import { Module } from '@nestjs/common';
import { WheelService } from './wheel.service';
import { WheelController } from './wheel.controller';
import { BacktestService } from './backtest.service';
import { BacktestController } from './backtest.controller';
import { EconomicIndicatorsModule } from '../economic-indicators/economic-indicators.module';
import { DatabaseModule } from '@database/database.module';

/**
 * WheelModule - Estratégia Wheel Turbinada
 *
 * FASE 101: Wheel Turbinada Implementation
 * - Backtesting Engine (FASE 101.4)
 * - Dividends Integration (FASE 101.2)
 * - Stock Lending Integration (FASE 101.3)
 *
 * **Entity Registration Pattern:** GLOBAL
 * - Todas as entities registradas em DatabaseModule
 * - WheelModule importa DatabaseModule (evita duplicação)
 *
 * @see backend/src/database/database.module.ts
 */
@Module({
  imports: [
    // Import DatabaseModule para acesso a TODAS as entities globais
    // (User, Asset, AssetPrice, FundamentalData, Dividend, StockLendingRate,
    //  BacktestResult, OptionPrice, WheelStrategy, WheelTrade, etc.)
    DatabaseModule,
    // FASE 4: Import EconomicIndicatorsModule for Selic rate access
    EconomicIndicatorsModule,
  ],
  controllers: [WheelController, BacktestController],
  providers: [WheelService, BacktestService],
  exports: [WheelService, BacktestService],
})
export class WheelModule {}
