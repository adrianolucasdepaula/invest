import { Injectable, Logger } from '@nestjs/common';
import { AIReportService, ReportData } from './ai-report.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from '@database/entities';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private aiReportService: AIReportService,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
  ) {}

  async generateCompleteReport(ticker: string) {
    this.logger.log(`Generating complete report for ${ticker}`);

    try {
      // Get asset
      const asset = await this.assetRepository.findOne({
        where: { ticker: ticker.toUpperCase() },
      });

      if (!asset) {
        throw new Error(`Asset ${ticker} not found`);
      }

      // Gather all data
      // TODO: Get real data from database
      const reportData: ReportData = {
        ticker: ticker.toUpperCase(),
        fundamentalData: {
          // Placeholder - should come from database
          pl: 15.5,
          pvp: 2.3,
          roe: 18.5,
          dividendYield: 4.5,
        },
        technicalData: {
          // Placeholder - should come from technical analysis
          trend: 'UPTREND',
          rsi: 65,
          recommendation: 'BUY',
        },
      };

      // Generate AI report
      const aiReport = await this.aiReportService.generateReport(reportData);

      return {
        success: true,
        ticker: ticker.toUpperCase(),
        report: aiReport,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate report for ${ticker}: ${error.message}`);
      throw error;
    }
  }

  async generateSummary(ticker: string) {
    this.logger.log(`Generating summary for ${ticker}`);

    try {
      const reportData: ReportData = {
        ticker: ticker.toUpperCase(),
        fundamentalData: {},
        technicalData: {},
      };

      const summary = await this.aiReportService.generateSummary(reportData);

      return {
        success: true,
        ticker: ticker.toUpperCase(),
        summary,
        generatedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to generate summary for ${ticker}: ${error.message}`);
      throw error;
    }
  }
}
