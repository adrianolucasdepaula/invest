import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import {
  AIOrchestatorService,
  ConsensusService,
  NewsCollectorsService,
  EconomicCalendarService,
} from './services';
import {
  News,
  NewsAnalysis,
  SentimentConsensus,
  EconomicEvent,
  Asset,
} from '../../database/entities';

/**
 * NewsModule - FASE 75
 *
 * Módulo para gerenciamento de notícias e análise de sentimento.
 *
 * Features:
 * - Coleta de notícias de 7 fontes
 * - Análise de sentimento com 6 providers de IA
 * - Cross-validation com algoritmo de consenso
 * - Dashboard de sentimento do mercado
 *
 * @see PLANO_FASE_75_AI_SENTIMENT_MULTI_PROVIDER.md
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      News,
      NewsAnalysis,
      SentimentConsensus,
      EconomicEvent,
      Asset,
    ]),
  ],
  controllers: [NewsController],
  providers: [
    NewsService,
    AIOrchestatorService,
    ConsensusService,
    NewsCollectorsService,
    EconomicCalendarService,
  ],
  exports: [
    NewsService,
    AIOrchestatorService,
    ConsensusService,
    NewsCollectorsService,
    EconomicCalendarService,
  ],
})
export class NewsModule {}
