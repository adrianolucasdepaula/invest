import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Analysis, AnalysisType, AnalysisStatus } from '@database/entities';
import { ScrapersService } from '@scrapers/scrapers.service';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    private scrapersService: ScrapersService,
  ) {}

  async generateFundamentalAnalysis(ticker: string) {
    this.logger.log(`Generating fundamental analysis for ${ticker}`);

    // Create analysis record
    const analysis = this.analysisRepository.create({
      assetId: null, // TODO: Get asset ID
      type: AnalysisType.FUNDAMENTAL,
      status: AnalysisStatus.PROCESSING,
    });
    await this.analysisRepository.save(analysis);

    try {
      // Scrape fundamental data from multiple sources
      const result = await this.scrapersService.scrapeFundamentalData(ticker);

      // Update analysis with results
      analysis.status = AnalysisStatus.COMPLETED;
      analysis.analysis = result.data;
      analysis.dataSources = result.sources;
      analysis.sourcesCount = result.sourcesCount;
      analysis.confidenceScore = result.confidence;
      analysis.completedAt = new Date();

      await this.analysisRepository.save(analysis);

      return analysis;
    } catch (error) {
      this.logger.error(`Failed to generate fundamental analysis: ${error.message}`);
      analysis.status = AnalysisStatus.FAILED;
      analysis.errorMessage = error.message;
      await this.analysisRepository.save(analysis);
      throw error;
    }
  }

  async generateTechnicalAnalysis(ticker: string) {
    // TODO: Implement technical analysis
    return { message: 'Technical analysis generation not implemented yet' };
  }

  async generateCompleteAnalysis(ticker: string) {
    // TODO: Implement complete analysis with AI
    return { message: 'Complete analysis generation not implemented yet' };
  }

  async findByTicker(ticker: string, type?: string) {
    const where: any = { asset: { ticker: ticker.toUpperCase() } };
    if (type) {
      where.type = type;
    }

    return this.analysisRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string) {
    return this.analysisRepository.findOne({
      where: { id },
      relations: ['asset'],
    });
  }
}
