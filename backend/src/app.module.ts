import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './api/auth/auth.module';
import { AssetsModule } from './api/assets/assets.module';
import { MarketDataModule } from './api/market-data/market-data.module';
import { AnalysisModule } from './api/analysis/analysis.module';
import { PortfolioModule } from './api/portfolio/portfolio.module';
import { ReportsModule } from './api/reports/reports.module';
import { ScrapersModule } from './scrapers/scrapers.module';
import { DataSourcesModule } from './api/data-sources/data-sources.module';
import { QueueModule } from './queue/queue.module';
import { AiModule } from './ai/ai.module';
import { ValidatorsModule } from './validators/validators.module';
import { WebSocketModule } from './websocket/websocket.module';
import { RedisModule } from './modules/redis/redis.module';
import { CronModule } from './modules/cron/cron.module';
import { EconomicIndicatorsModule } from './api/economic-indicators/economic-indicators.module'; // FASE 2
import { NewsModule } from './api/news/news.module'; // FASE 75
import { TelemetryModule } from './telemetry'; // FASE 76.3
import { MetricsModule } from './metrics'; // FASE 78 - Prometheus metrics endpoint
import { SearchModule } from './modules/search'; // FASE 75.1 - Meilisearch
import { StorageModule } from './modules/storage'; // FASE 75.2 - MinIO
import { AlertsModule } from './modules/alerts'; // FASE 75.3 - Sistema de Alertas
import { OptionsModule } from './modules/options'; // FASE 75.4 - Options Chain
import { WheelModule } from './api/wheel/wheel.module'; // FASE 101 - WHEEL Strategy
import {
  User,
  Asset,
  AssetPrice,
  FundamentalData,
  Portfolio,
  PortfolioPosition,
  DataSource,
  ScrapedData,
  Analysis,
  UpdateLog,
  ScraperMetric,
  SyncHistory, // FASE 34.6
  EconomicIndicator, // FASE 2
  TickerChange, // FASE 55
  IntradayPrice, // FASE 67 - TimescaleDB hypertable
  // FASE 75 - AI Sentiment Multi-Provider
  News,
  NewsAnalysis,
  SentimentConsensus,
  EconomicEvent,
  // FASE 75.3 - Sistema de Alertas
  Alert,
  // FASE 75.4 - Options Chain
  OptionPrice,
  // FASE 90 - Discrepancy Resolution
  DiscrepancyResolution,
  // FASE 93 - Cross-Validation Config
  CrossValidationConfig,
  // FASE 101 - WHEEL Strategy
  WheelStrategy,
  WheelTrade,
} from './database/entities';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [
          User,
          Asset,
          AssetPrice,
          FundamentalData,
          Portfolio,
          PortfolioPosition,
          DataSource,
          ScrapedData,
          Analysis,
          UpdateLog,
          ScraperMetric,
          SyncHistory, // FASE 34.6
          EconomicIndicator, // FASE 2
          TickerChange, // FASE 55
          IntradayPrice, // FASE 67 - TimescaleDB hypertable
          // FASE 75 - AI Sentiment Multi-Provider
          News,
          NewsAnalysis,
          SentimentConsensus,
          EconomicEvent,
          // FASE 75.3 - Sistema de Alertas
          Alert,
          // FASE 75.4 - Options Chain
          OptionPrice,
          // FASE 90 - Discrepancy Resolution
          DiscrepancyResolution,
          // FASE 93 - Cross-Validation Config
          CrossValidationConfig,
          // FASE 101 - WHEEL Strategy
          WheelStrategy,
          WheelTrade,
        ],
        synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
        logging: configService.get('DB_LOGGING', 'false') === 'true',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    // Bull Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),

    // Schedule
    ScheduleModule.forRoot(),

    // Redis Cache (FASE 34.2)
    RedisModule,

    // Cron Jobs (FASE 34.3)
    CronModule,

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get('RATE_LIMIT_TTL', 60000),
            limit: configService.get('RATE_LIMIT_MAX_REQUESTS', 100),
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // Observabilidade (FASE 76.3)
    TelemetryModule,

    // Prometheus Metrics (FASE 78)
    MetricsModule,

    // Application Modules
    CommonModule,
    DatabaseModule,
    AuthModule,
    AssetsModule,
    MarketDataModule,
    AnalysisModule,
    PortfolioModule,
    ReportsModule,
    ScrapersModule,
    DataSourcesModule,
    QueueModule,
    AiModule,
    ValidatorsModule,
    WebSocketModule,
    EconomicIndicatorsModule, // FASE 2
    NewsModule, // FASE 75 - AI Sentiment Multi-Provider
    SearchModule, // FASE 75.1 - Meilisearch
    StorageModule, // FASE 75.2 - MinIO
    AlertsModule, // FASE 75.3 - Sistema de Alertas
    OptionsModule, // FASE 75.4 - Options Chain
    WheelModule, // FASE 101 - WHEEL Strategy
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // FASE 76: Observabilidade - Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    // FASE 76: Observabilidade - Logging Interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
