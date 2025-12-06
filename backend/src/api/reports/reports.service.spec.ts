import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { AIReportService } from './ai-report.service';
import { Asset, AssetType } from '../../database/entities/asset.entity';
import { Analysis, AnalysisType, AnalysisStatus, Recommendation } from '../../database/entities/analysis.entity';
import { AssetPrice, PriceSource } from '../../database/entities/asset-price.entity';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockAsset: Partial<Asset> = {
    id: 'asset-1',
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: AssetType.STOCK,
    sector: 'Energy',
    isActive: true,
  };

  const mockAnalysis: Partial<Analysis> = {
    id: 'analysis-1',
    assetId: 'asset-1',
    type: AnalysisType.COMPLETE,
    status: AnalysisStatus.COMPLETED,
    recommendation: Recommendation.BUY,
    confidenceScore: 85,
    summary: 'Strong buy recommendation',
    createdAt: new Date(),
  };

  const mockPrice: Partial<AssetPrice> = {
    id: 'price-1',
    assetId: 'asset-1',
    date: new Date(),
    close: 38.5,
    changePercent: 2.5,
    source: PriceSource.BRAPI,
  };

  const mockAIReportService = {
    generateReport: jest.fn(),
    generateSummary: jest.fn(),
  };

  const mockAssetRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockAnalysisRepository = {
    findOne: jest.fn(),
  };

  const mockAssetPriceRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: AIReportService, useValue: mockAIReportService },
        { provide: getRepositoryToken(Asset), useValue: mockAssetRepository },
        { provide: getRepositoryToken(Analysis), useValue: mockAnalysisRepository },
        { provide: getRepositoryToken(AssetPrice), useValue: mockAssetPriceRepository },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  describe('generateCompleteReport', () => {
    it('should generate a complete report for valid ticker', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockAIReportService.generateReport.mockResolvedValue({
        content: 'AI-generated report',
        sections: [],
      });

      const result = await service.generateCompleteReport('PETR4');

      expect(result.success).toBe(true);
      expect(result.ticker).toBe('PETR4');
      expect(result.report).toBeDefined();
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should convert ticker to uppercase', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockAIReportService.generateReport.mockResolvedValue({});

      const result = await service.generateCompleteReport('petr4');

      expect(result.ticker).toBe('PETR4');
      expect(mockAssetRepository.findOne).toHaveBeenCalledWith({
        where: { ticker: 'PETR4' },
      });
    });

    it('should throw error when asset not found', async () => {
      mockAssetRepository.findOne.mockResolvedValue(null);

      await expect(service.generateCompleteReport('INVALID')).rejects.toThrow(
        'Asset INVALID not found',
      );
    });

    it('should propagate AI report service errors', async () => {
      mockAssetRepository.findOne.mockResolvedValue(mockAsset);
      mockAIReportService.generateReport.mockRejectedValue(new Error('AI service error'));

      await expect(service.generateCompleteReport('PETR4')).rejects.toThrow('AI service error');
    });
  });

  describe('generateSummary', () => {
    it('should generate summary for ticker', async () => {
      mockAIReportService.generateSummary.mockResolvedValue('Brief summary of the asset');

      const result = await service.generateSummary('VALE3');

      expect(result.success).toBe(true);
      expect(result.ticker).toBe('VALE3');
      expect(result.summary).toBe('Brief summary of the asset');
      expect(result.generatedAt).toBeInstanceOf(Date);
    });

    it('should convert ticker to uppercase', async () => {
      mockAIReportService.generateSummary.mockResolvedValue('Summary');

      const result = await service.generateSummary('vale3');

      expect(result.ticker).toBe('VALE3');
    });

    it('should propagate AI service errors', async () => {
      mockAIReportService.generateSummary.mockRejectedValue(new Error('Summary generation failed'));

      await expect(service.generateSummary('PETR4')).rejects.toThrow('Summary generation failed');
    });
  });

  describe('getAssetsWithAnalysisStatus', () => {
    it('should return all active assets with analysis status', async () => {
      mockAssetRepository.find.mockResolvedValue([mockAsset]);
      mockAnalysisRepository.findOne.mockResolvedValue(mockAnalysis);
      mockAssetPriceRepository.findOne.mockResolvedValue(mockPrice);

      const result = await service.getAssetsWithAnalysisStatus();

      expect(result).toHaveLength(1);
      expect(result[0].ticker).toBe('PETR4');
      expect(result[0].hasAnalysis).toBe(true);
      expect(result[0].lastAnalysisId).toBe('analysis-1');
    });

    it('should return assets without analysis', async () => {
      mockAssetRepository.find.mockResolvedValue([mockAsset]);
      mockAnalysisRepository.findOne.mockResolvedValue(null);
      mockAssetPriceRepository.findOne.mockResolvedValue(mockPrice);

      const result = await service.getAssetsWithAnalysisStatus();

      expect(result[0].hasAnalysis).toBe(false);
      expect(result[0].lastAnalysisId).toBeUndefined();
      expect(result[0].canRequestAnalysis).toBe(true);
    });

    it('should return assets without price data', async () => {
      mockAssetRepository.find.mockResolvedValue([mockAsset]);
      mockAnalysisRepository.findOne.mockResolvedValue(mockAnalysis);
      mockAssetPriceRepository.findOne.mockResolvedValue(null);

      const result = await service.getAssetsWithAnalysisStatus();

      expect(result[0].currentPrice).toBeUndefined();
      expect(result[0].changePercent).toBeUndefined();
    });

    it('should calculate isAnalysisRecent correctly for recent analysis', async () => {
      const recentAnalysis = {
        ...mockAnalysis,
        createdAt: new Date(), // Today
      };
      mockAssetRepository.find.mockResolvedValue([mockAsset]);
      mockAnalysisRepository.findOne.mockResolvedValue(recentAnalysis);
      mockAssetPriceRepository.findOne.mockResolvedValue(mockPrice);

      const result = await service.getAssetsWithAnalysisStatus();

      expect(result[0].isAnalysisRecent).toBe(true);
      expect(result[0].isAnalysisOutdated).toBe(false);
    });

    it('should calculate isAnalysisOutdated correctly for old analysis', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 45); // 45 days ago
      const oldAnalysis = {
        ...mockAnalysis,
        createdAt: oldDate,
      };
      mockAssetRepository.find.mockResolvedValue([mockAsset]);
      mockAnalysisRepository.findOne.mockResolvedValue(oldAnalysis);
      mockAssetPriceRepository.findOne.mockResolvedValue(mockPrice);

      const result = await service.getAssetsWithAnalysisStatus();

      expect(result[0].isAnalysisRecent).toBe(false);
      expect(result[0].isAnalysisOutdated).toBe(true);
      expect(result[0].daysSinceLastAnalysis).toBeGreaterThanOrEqual(45);
    });

    it('should handle empty assets list', async () => {
      mockAssetRepository.find.mockResolvedValue([]);

      const result = await service.getAssetsWithAnalysisStatus();

      expect(result).toHaveLength(0);
    });

    it('should handle multiple assets', async () => {
      const assets = [
        mockAsset,
        { ...mockAsset, id: 'asset-2', ticker: 'VALE3', name: 'Vale ON' },
        { ...mockAsset, id: 'asset-3', ticker: 'ITUB4', name: 'Itau PN' },
      ];
      mockAssetRepository.find.mockResolvedValue(assets);
      mockAnalysisRepository.findOne.mockResolvedValue(mockAnalysis);
      mockAssetPriceRepository.findOne.mockResolvedValue(mockPrice);

      const result = await service.getAssetsWithAnalysisStatus();

      expect(result).toHaveLength(3);
    });

    it('should propagate database errors', async () => {
      mockAssetRepository.find.mockRejectedValue(new Error('Database error'));

      await expect(service.getAssetsWithAnalysisStatus()).rejects.toThrow('Database error');
    });
  });
});
