import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './api/auth/auth.module';
import { AssetsModule } from './api/assets/assets.module';
import { AnalysisModule } from './api/analysis/analysis.module';
import { PortfolioModule } from './api/portfolio/portfolio.module';
import { ReportsModule } from './api/reports/reports.module';
import { ScrapersModule } from './scrapers/scrapers.module';
import { DataSourcesModule } from './api/data-sources/data-sources.module';
import { QueueModule } from './queue/queue.module';
import { AiModule } from './ai/ai.module';
import { ValidatorsModule } from './validators/validators.module';
import { WebSocketModule } from './websocket/websocket.module';
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
        ],
        synchronize: configService.get('DB_SYNCHRONIZE', false),
        logging: configService.get('DB_LOGGING', false),
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

    // Application Modules
    CommonModule,
    DatabaseModule,
    AuthModule,
    AssetsModule,
    AnalysisModule,
    PortfolioModule,
    ReportsModule,
    ScrapersModule,
    DataSourcesModule,
    QueueModule,
    AiModule,
    ValidatorsModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
