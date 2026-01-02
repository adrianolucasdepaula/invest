import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockLendingRate } from '@database/entities/stock-lending.entity';
import { Asset, AssetPrice } from '@database/entities';
import { StockLendingController } from './stock-lending.controller';
import { StockLendingService } from './stock-lending.service';

/**
 * Stock Lending Module
 *
 * Gerencia taxas de aluguel de ações (BTC - Banco de Títulos B3).
 * Usado na estratégia WHEEL para:
 * - Taxas atuais e históricas
 * - Estimativa de renda de aluguel
 * - Cálculo de renda durante período de holding
 *
 * @created 2025-12-21
 * @phase FASE 101 - Wheel Turbinada
 */
@Module({
  imports: [TypeOrmModule.forFeature([StockLendingRate, Asset, AssetPrice])],
  controllers: [StockLendingController],
  providers: [StockLendingService],
  exports: [StockLendingService],
})
export class StockLendingModule {}
