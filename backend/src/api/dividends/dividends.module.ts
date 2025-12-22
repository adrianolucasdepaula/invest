import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dividend } from '@database/entities/dividend.entity';
import { Asset, AssetPrice } from '@database/entities';
import { DividendsController } from './dividends.controller';
import { DividendsService } from './dividends.service';

/**
 * Dividends Module
 *
 * Gerencia proventos (dividendos, JCP, bonificações) de ativos B3.
 * Usado na estratégia WHEEL para:
 * - Histórico de dividendos
 * - Cálculo de dividend yield
 * - Projeção de dividendos futuros
 *
 * @created 2025-12-21
 * @phase FASE 101 - Wheel Turbinada
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dividend,
      Asset,
      AssetPrice,
    ]),
  ],
  controllers: [DividendsController],
  providers: [DividendsService],
  exports: [DividendsService],
})
export class DividendsModule {}
