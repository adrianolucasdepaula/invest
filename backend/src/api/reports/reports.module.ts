import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from '@database/entities';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { AIReportService } from './ai-report.service';
import { ReportTemplateService } from './services/report-template.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { AnalysisModule } from '../analysis/analysis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Asset]), AnalysisModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    AIReportService,
    ReportTemplateService,
    PdfGeneratorService,
  ],
  exports: [ReportsService, AIReportService],
})
export class ReportsModule {}
