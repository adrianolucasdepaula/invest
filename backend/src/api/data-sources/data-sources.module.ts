import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from '@database/entities';
import { DataSourcesController } from './data-sources.controller';
import { DataSourcesService } from './data-sources.service';

@Module({
  imports: [TypeOrmModule.forFeature([DataSource])],
  controllers: [DataSourcesController],
  providers: [DataSourcesService],
  exports: [DataSourcesService],
})
export class DataSourcesModule {}
