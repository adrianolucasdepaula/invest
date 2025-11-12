import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset, Analysis, AssetPrice } from '@database/entities';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AIReportService } from './ai-report.service';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, Analysis, AssetPrice]),
    AnalysisModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, AIReportService],
  exports: [ReportsService, AIReportService],
})
export class ReportsModule {}
