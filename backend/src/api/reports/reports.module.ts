import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset, Analysis, AssetPrice } from '@database/entities';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AIReportService } from './ai-report.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, Analysis, AssetPrice]), AnalysisModule],
  controllers: [ReportsController],
  providers: [ReportsService, AIReportService, PdfGeneratorService],
  exports: [ReportsService, AIReportService, PdfGeneratorService],
})
export class ReportsModule {}
