import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from '@database/entities';
import { DataSourcesController } from './data-sources.controller';
import { DataSourcesService } from './data-sources.service';
import { ScrapersModule } from '../../scrapers/scrapers.module';
import { QueueModule } from '../../queue/queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataSource]),
    ScrapersModule, // For CircuitBreakerService
    QueueModule, // For DeadLetterService
  ],
  controllers: [DataSourcesController],
  providers: [DataSourcesService],
  exports: [DataSourcesService],
})
export class DataSourcesModule {}
