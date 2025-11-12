import { Injectable, Logger } from '@nestjs/common';
import { AIReportService, ReportData } from './ai-report.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset, Analysis, AssetPrice } from '@database/entities';
import { AssetWithAnalysisStatusDto } from './dto/asset-with-analysis-status.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private aiReportService: AIReportService,
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(AssetPrice)
    private assetPriceRepository: Repository<AssetPrice>,
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

  /**
   * Retorna lista de todos os ativos com status de análise
   *
   * Para cada ativo, busca a análise mais recente (type=complete) e
   * calcula flags temporais (recent, outdated, canRequest)
   */
  async getAssetsWithAnalysisStatus(): Promise<AssetWithAnalysisStatusDto[]> {
    this.logger.log('Fetching all assets with analysis status');

    try {
      // 1. Buscar todos os ativos ativos
      const assets = await this.assetRepository.find({
        where: { isActive: true },
        order: { ticker: 'ASC' },
      });

      this.logger.log(`Found ${assets.length} active assets`);

      // 2. Para cada ativo, buscar análise mais recente e preço atual
      const assetsWithStatus = await Promise.all(
        assets.map(async (asset) => {
          // Buscar análise mais recente (type=complete)
          const lastAnalysis = await this.analysisRepository.findOne({
            where: {
              assetId: asset.id,
              type: 'complete' as any,
            },
            order: { createdAt: 'DESC' },
          });

          // Buscar preço mais recente
          const latestPrice = await this.assetPriceRepository.findOne({
            where: { assetId: asset.id },
            order: { date: 'DESC' },
          });

          // Calcular flags temporais
          const now = new Date();
          let daysSinceLastAnalysis: number | undefined;
          let isAnalysisRecent = false;
          let isAnalysisOutdated = false;
          let canRequestAnalysis = true;

          if (lastAnalysis) {
            const analysisDate = new Date(lastAnalysis.createdAt);
            const diffMs = now.getTime() - analysisDate.getTime();
            daysSinceLastAnalysis = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            isAnalysisRecent = daysSinceLastAnalysis < 7;
            isAnalysisOutdated = daysSinceLastAnalysis > 30;
            canRequestAnalysis = daysSinceLastAnalysis > 7; // Pode solicitar se >7 dias
          }

          // Montar DTO
          const dto: AssetWithAnalysisStatusDto = {
            // Dados do ativo
            id: asset.id,
            ticker: asset.ticker,
            name: asset.name,
            type: asset.type,
            sector: asset.sector || 'N/A',
            currentPrice: latestPrice?.close,
            changePercent: latestPrice?.changePercent,

            // Status da análise
            hasAnalysis: !!lastAnalysis,
            lastAnalysisDate: lastAnalysis?.createdAt,
            lastAnalysisType: lastAnalysis?.type,
            lastAnalysisStatus: lastAnalysis?.status,
            lastAnalysisRecommendation: lastAnalysis?.recommendation,
            lastAnalysisConfidence: lastAnalysis?.confidenceScore,
            lastAnalysisSummary: lastAnalysis?.summary,

            // Flags computadas
            isAnalysisRecent,
            isAnalysisOutdated,
            canRequestAnalysis,
            daysSinceLastAnalysis,
          };

          return dto;
        }),
      );

      this.logger.log(`Returning ${assetsWithStatus.length} assets with analysis status`);
      return assetsWithStatus;
    } catch (error) {
      this.logger.error(`Failed to fetch assets with analysis status: ${error.message}`);
      throw error;
    }
  }
}
