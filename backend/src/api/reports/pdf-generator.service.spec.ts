import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PdfGeneratorService } from './pdf-generator.service';
import { Analysis, Asset, AssetPrice, AssetType, AnalysisType, AnalysisStatus, Recommendation } from '@database/entities';

// Mock playwright with jest.mock using factory
jest.mock('playwright', () => {
  const mockPage = {
    setContent: jest.fn().mockResolvedValue(undefined),
    pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
  };
  const mockBrowser = {
    newPage: jest.fn().mockResolvedValue(mockPage),
    close: jest.fn().mockResolvedValue(undefined),
  };
  return {
    chromium: {
      launch: jest.fn().mockResolvedValue(mockBrowser),
    },
  };
});

// Mock only specific fs methods while preserving the rest
jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs');
  return {
    ...originalFs,
    existsSync: jest.fn().mockReturnValue(true),
    readFileSync: jest.fn().mockReturnValue('<html><body>{{analysis.summary}}</body></html>'),
  };
});

describe('PdfGeneratorService', () => {
  let service: PdfGeneratorService;
  let analysisRepository: jest.Mocked<Repository<Analysis>>;
  let assetRepository: jest.Mocked<Repository<Asset>>;
  let assetPriceRepository: jest.Mocked<Repository<AssetPrice>>;

  const mockAsset: Partial<Asset> = {
    id: 'asset-123',
    ticker: 'PETR4',
    name: 'Petrobras PN',
    type: AssetType.STOCK,
    sector: 'Petróleo',
    subsector: 'Exploração',
  };

  const mockAnalysis: Partial<Analysis> = {
    id: 'analysis-123',
    assetId: 'asset-123',
    asset: mockAsset as Asset,
    type: AnalysisType.FUNDAMENTAL,
    status: AnalysisStatus.COMPLETED,
    recommendation: Recommendation.BUY,
    confidenceScore: 0.85,
    summary: 'Análise completa do ativo PETR4',
    analysis: { fundamentalData: {} },
    dataSources: ['fundamentus', 'brapi'],
    sourcesCount: 2,
    targetPrices: { conservative: 30, moderate: 35, optimistic: 40 },
    risks: ['Risco político', 'Preço do petróleo'],
    createdAt: new Date('2025-12-06T10:00:00Z'),
    completedAt: new Date('2025-12-06T10:05:00Z'),
  };

  const mockAssetPrice: Partial<AssetPrice> = {
    id: 'price-123',
    assetId: 'asset-123',
    date: new Date('2025-12-05'),
    close: 38.50,
    change: 0.75,
    changePercent: 1.98,
    volume: 50000000,
    marketCap: 450000000000,
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    const mockAnalysisRepository = {
      findOne: jest.fn().mockResolvedValue(mockAnalysis),
    };

    const mockAssetRepository = {
      findOne: jest.fn().mockResolvedValue(mockAsset),
    };

    const mockAssetPriceRepository = {
      findOne: jest.fn().mockResolvedValue(mockAssetPrice),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfGeneratorService,
        {
          provide: getRepositoryToken(Analysis),
          useValue: mockAnalysisRepository,
        },
        {
          provide: getRepositoryToken(Asset),
          useValue: mockAssetRepository,
        },
        {
          provide: getRepositoryToken(AssetPrice),
          useValue: mockAssetPriceRepository,
        },
      ],
    }).compile();

    service = module.get<PdfGeneratorService>(PdfGeneratorService);
    analysisRepository = module.get(getRepositoryToken(Analysis));
    assetRepository = module.get(getRepositoryToken(Asset));
    assetPriceRepository = module.get(getRepositoryToken(AssetPrice));
  });

  describe('generatePdf', () => {
    it('should generate PDF buffer', async () => {
      const result = await service.generatePdf('analysis-123');

      expect(result).toBeInstanceOf(Buffer);
      expect(analysisRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'analysis-123' },
        relations: ['asset'],
      });
    });

    it('should throw error when analysis not found', async () => {
      analysisRepository.findOne.mockResolvedValue(null);

      await expect(service.generatePdf('nonexistent')).rejects.toThrow(
        'Analysis nonexistent not found',
      );
    });

    it('should throw error when asset not found', async () => {
      analysisRepository.findOne.mockResolvedValue({
        ...mockAnalysis,
        asset: null,
      } as Analysis);
      assetRepository.findOne.mockResolvedValue(null);

      await expect(service.generatePdf('analysis-123')).rejects.toThrow(
        'Asset not found for analysis analysis-123',
      );
    });
  });

  describe('generateJson', () => {
    it('should generate JSON with correct structure', async () => {
      const result = await service.generateJson('analysis-123');

      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('asset');
      expect(result).toHaveProperty('analysis');
      expect(result).toHaveProperty('currentPrice');
      expect(result).toHaveProperty('risks');
    });

    it('should include metadata with version', async () => {
      const result = (await service.generateJson('analysis-123')) as any;

      expect(result.metadata).toEqual({
        analysisId: 'analysis-123',
        generatedAt: expect.any(String),
        version: '1.0',
      });
    });

    it('should include asset information', async () => {
      const result = (await service.generateJson('analysis-123')) as any;

      expect(result.asset).toEqual({
        ticker: 'PETR4',
        name: 'Petrobras PN',
        type: AssetType.STOCK,
        sector: 'Petróleo',
        subsector: 'Exploração',
      });
    });

    it('should include analysis data', async () => {
      const result = (await service.generateJson('analysis-123')) as any;

      expect(result.analysis.type).toBe(AnalysisType.FUNDAMENTAL);
      expect(result.analysis.status).toBe(AnalysisStatus.COMPLETED);
      expect(result.analysis.recommendation).toBe(Recommendation.BUY);
      expect(result.analysis.confidenceScore).toBe(0.85);
      expect(result.analysis.sourcesCount).toBe(2);
    });

    it('should include current price when available', async () => {
      const result = (await service.generateJson('analysis-123')) as any;

      expect(result.currentPrice).toEqual({
        price: 38.50,
        date: mockAssetPrice.date,
        change: 0.75,
        changePercent: 1.98,
        volume: 50000000,
        marketCap: 450000000000,
      });
    });

    it('should handle null current price', async () => {
      assetPriceRepository.findOne.mockResolvedValue(null);

      const result = (await service.generateJson('analysis-123')) as any;

      expect(result.currentPrice).toBeNull();
    });

    it('should throw error when analysis not found', async () => {
      analysisRepository.findOne.mockResolvedValue(null);

      await expect(service.generateJson('nonexistent')).rejects.toThrow(
        'Analysis nonexistent not found',
      );
    });

    it('should include risks array', async () => {
      const result = (await service.generateJson('analysis-123')) as any;

      expect(result.risks).toEqual(['Risco político', 'Preço do petróleo']);
    });

    it('should handle null market cap', async () => {
      assetPriceRepository.findOne.mockResolvedValue({
        ...mockAssetPrice,
        marketCap: null,
      } as AssetPrice);

      const result = (await service.generateJson('analysis-123')) as any;

      expect(result.currentPrice.marketCap).toBeNull();
    });
  });

  describe('getFileName', () => {
    it('should generate correct PDF filename', () => {
      const fileName = service.getFileName('PETR4', 'pdf');

      expect(fileName).toMatch(/^relatorio-petr4-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should generate correct JSON filename', () => {
      const fileName = service.getFileName('VALE3', 'json');

      expect(fileName).toMatch(/^relatorio-vale3-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('should convert ticker to lowercase', () => {
      const fileName = service.getFileName('ITUB4', 'pdf');

      expect(fileName).toContain('itub4');
    });

    it('should include current date', () => {
      const today = new Date().toISOString().split('T')[0];
      const fileName = service.getFileName('BBDC4', 'pdf');

      expect(fileName).toContain(today);
    });
  });

  describe('prepareReportData', () => {
    it('should handle strong_buy recommendation', async () => {
      analysisRepository.findOne.mockResolvedValue({
        ...mockAnalysis,
        recommendation: Recommendation.STRONG_BUY,
      } as Analysis);

      const result = await service.generateJson('analysis-123');
      expect(result).toBeDefined();
    });

    it('should handle hold recommendation', async () => {
      analysisRepository.findOne.mockResolvedValue({
        ...mockAnalysis,
        recommendation: Recommendation.HOLD,
      } as Analysis);

      const result = await service.generateJson('analysis-123');
      expect(result).toBeDefined();
    });

    it('should handle sell recommendation', async () => {
      analysisRepository.findOne.mockResolvedValue({
        ...mockAnalysis,
        recommendation: Recommendation.SELL,
      } as Analysis);

      const result = await service.generateJson('analysis-123');
      expect(result).toBeDefined();
    });

    it('should handle strong_sell recommendation', async () => {
      analysisRepository.findOne.mockResolvedValue({
        ...mockAnalysis,
        recommendation: Recommendation.STRONG_SELL,
      } as Analysis);

      const result = await service.generateJson('analysis-123');
      expect(result).toBeDefined();
    });

    it('should fetch asset when not in analysis relation', async () => {
      analysisRepository.findOne.mockResolvedValue({
        ...mockAnalysis,
        asset: null,
      } as Analysis);
      assetRepository.findOne.mockResolvedValue(mockAsset as Asset);

      const result = await service.generatePdf('analysis-123');
      expect(result).toBeInstanceOf(Buffer);
      expect(assetRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'asset-123' },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle analysis without createdAt', async () => {
      analysisRepository.findOne.mockResolvedValue({
        ...mockAnalysis,
        createdAt: null,
      } as Analysis);

      const result = await service.generatePdf('analysis-123');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle analysis without target prices', async () => {
      analysisRepository.findOne.mockResolvedValue({
        ...mockAnalysis,
        targetPrices: null,
      } as Analysis);

      const result = (await service.generateJson('analysis-123')) as any;
      expect(result.analysis.targetPrices).toBeNull();
    });

    it('should handle analysis without confidence score', async () => {
      analysisRepository.findOne.mockResolvedValue({
        ...mockAnalysis,
        confidenceScore: null,
      } as Analysis);

      const result = await service.generatePdf('analysis-123');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle negative change percent', async () => {
      assetPriceRepository.findOne.mockResolvedValue({
        ...mockAssetPrice,
        changePercent: -2.5,
      } as AssetPrice);

      const result = await service.generatePdf('analysis-123');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle zero change percent', async () => {
      assetPriceRepository.findOne.mockResolvedValue({
        ...mockAssetPrice,
        changePercent: 0,
      } as AssetPrice);

      const result = await service.generatePdf('analysis-123');
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
