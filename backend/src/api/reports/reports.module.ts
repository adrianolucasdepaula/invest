import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from '@database/entities';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AIReportService } from './ai-report.service';

@Module({
  imports: [TypeOrmModule.forFeature([Asset])],
  controllers: [ReportsController],
  providers: [ReportsService, AIReportService],
  exports: [ReportsService, AIReportService],
})
export class ReportsModule {}
