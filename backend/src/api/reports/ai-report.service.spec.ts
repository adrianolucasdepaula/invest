import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AIReportService, ReportData, AIReport } from './ai-report.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AIReportService', () => {
  let service: AIReportService;
  let mockConfigService: jest.Mocked<ConfigService>;

  const mockReportData: ReportData = {
    ticker: 'PETR4',
    fundamentalData: {
      priceToEarnings: 5.5,
      dividendYield: 15.0,
      roe: 25.0,
      debtToEquity: 0.8,
    },
    technicalData: {
      rsi: 45,
      macd: { value: 0.5, signal: 0.3 },
      trend: 'BULLISH',
    },
    optionsData: {
      calls: 1500,
      puts: 1200,
    },
  };

  const mockAIResponse = {
    summary: 'PETR4 apresenta valuation atrativo com P/L baixo.',
    fundamentalAnalysis: 'Análise fundamentalista detalhada...',
    technicalAnalysis: 'Análise técnica mostra tendência de alta.',
    riskAnalysis: 'Riscos moderados relacionados ao setor.',
    recommendation: {
      action: 'COMPRA',
      confidence: 75,
      reasoning: 'Valuation atrativo e bom momento técnico.',
    },
    targetPrices: {
      conservative: 35.0,
      moderate: 40.0,
      optimistic: 48.0,
    },
    keyPoints: [
      'P/L abaixo da média do setor',
      'Dividend yield atrativo',
      'Tendência técnica positiva',
    ],
    warnings: ['Exposição ao preço do petróleo', 'Risco político'],
    opportunities: ['Aumento da demanda por combustíveis', 'Desvalorização do real'],
    fullReport: '# Relatório Completo\n\nConteúdo detalhado...',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'OPENAI_API_KEY') return 'test-api-key';
        if (key === 'AI_DEFAULT_PROVIDER') return defaultValue || 'openai';
        return defaultValue;
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIReportService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AIReportService>(AIReportService);
  });

  describe('generateReport', () => {
    it('should generate a complete AI report', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
        },
      });

      const report = await service.generateReport(mockReportData);

      expect(report.ticker).toBe('PETR4');
      expect(report.summary).toBe(mockAIResponse.summary);
      expect(report.recommendation.action).toBe('BUY');
      expect(report.recommendation.confidence).toBe(75);
      expect(report.targetPrices.conservative).toBe(35.0);
      expect(report.keyPoints).toHaveLength(3);
      expect(report.warnings).toHaveLength(2);
      expect(report.opportunities).toHaveLength(2);
    });

    it('should include options data in prompt when available', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
        },
      });

      await service.generateReport(mockReportData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('DADOS DE OPÇÕES'),
            }),
          ]),
        }),
        expect.any(Object),
      );
    });

    it('should handle report without options data', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
        },
      });

      const dataWithoutOptions: ReportData = {
        ticker: 'VALE3',
        fundamentalData: { priceToEarnings: 8.0 },
        technicalData: { rsi: 55 },
      };

      const report = await service.generateReport(dataWithoutOptions);

      expect(report.ticker).toBe('VALE3');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.not.stringContaining('DADOS DE OPÇÕES'),
            }),
          ]),
        }),
        expect.any(Object),
      );
    });

    it('should throw error on API failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API unavailable'));

      await expect(service.generateReport(mockReportData)).rejects.toThrow(
        'Failed to call OpenAI API: API unavailable',
      );
    });

    it('should throw error for unsupported AI provider', async () => {
      mockConfigService.get.mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'OPENAI_API_KEY') return 'test-api-key';
        if (key === 'AI_DEFAULT_PROVIDER') return 'unsupported-provider';
        return defaultValue;
      });

      const newModule: TestingModule = await Test.createTestingModule({
        providers: [
          AIReportService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      const newService = newModule.get<AIReportService>(AIReportService);

      await expect(newService.generateReport(mockReportData)).rejects.toThrow(
        'AI provider unsupported-provider not implemented',
      );
    });
  });

  describe('parseAIResponse', () => {
    it('should map COMPRA FORTE to STRONG_BUY', async () => {
      const responseWithStrongBuy = {
        ...mockAIResponse,
        recommendation: { action: 'COMPRA FORTE', confidence: 90, reasoning: 'Excelente' },
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(responseWithStrongBuy) } }],
        },
      });

      const report = await service.generateReport(mockReportData);

      expect(report.recommendation.action).toBe('STRONG_BUY');
    });

    it('should map MANTER to HOLD', async () => {
      const responseWithHold = {
        ...mockAIResponse,
        recommendation: { action: 'MANTER', confidence: 50, reasoning: 'Neutro' },
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(responseWithHold) } }],
        },
      });

      const report = await service.generateReport(mockReportData);

      expect(report.recommendation.action).toBe('HOLD');
    });

    it('should map VENDA to SELL', async () => {
      const responseWithSell = {
        ...mockAIResponse,
        recommendation: { action: 'VENDA', confidence: 70, reasoning: 'Overvalued' },
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(responseWithSell) } }],
        },
      });

      const report = await service.generateReport(mockReportData);

      expect(report.recommendation.action).toBe('SELL');
    });

    it('should map VENDA FORTE to STRONG_SELL', async () => {
      const responseWithStrongSell = {
        ...mockAIResponse,
        recommendation: { action: 'VENDA FORTE', confidence: 85, reasoning: 'Muito caro' },
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(responseWithStrongSell) } }],
        },
      });

      const report = await service.generateReport(mockReportData);

      expect(report.recommendation.action).toBe('STRONG_SELL');
    });

    it('should handle already English action names', async () => {
      const responseWithEnglishAction = {
        ...mockAIResponse,
        recommendation: { action: 'BUY', confidence: 75, reasoning: 'Good value' },
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(responseWithEnglishAction) } }],
        },
      });

      const report = await service.generateReport(mockReportData);

      expect(report.recommendation.action).toBe('BUY');
    });

    it('should default to HOLD for unknown action', async () => {
      const responseWithUnknownAction = {
        ...mockAIResponse,
        recommendation: { action: 'UNKNOWN', confidence: 50, reasoning: 'Unknown' },
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(responseWithUnknownAction) } }],
        },
      });

      const report = await service.generateReport(mockReportData);

      expect(report.recommendation.action).toBe('HOLD');
    });

    it('should throw error on invalid JSON response', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: 'not valid json' } }],
        },
      });

      await expect(service.generateReport(mockReportData)).rejects.toThrow(
        'Failed to parse AI response',
      );
    });

    it('should handle missing recommendation', async () => {
      const responseWithoutRecommendation = {
        summary: 'Test summary',
        fundamentalAnalysis: 'Test analysis',
        technicalAnalysis: 'Test technical',
        riskAnalysis: 'Test risk',
        targetPrices: { conservative: 30, moderate: 35, optimistic: 40 },
        keyPoints: ['Point 1'],
        warnings: ['Warning 1'],
        opportunities: ['Opportunity 1'],
        fullReport: 'Full report',
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(responseWithoutRecommendation) } }],
        },
      });

      const report = await service.generateReport(mockReportData);

      expect(report.recommendation.action).toBe('HOLD');
      expect(report.recommendation.confidence).toBe(50);
      expect(report.recommendation.reasoning).toBe('');
    });

    it('should handle missing target prices', async () => {
      const responseWithoutPrices = {
        ...mockAIResponse,
        targetPrices: undefined,
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(responseWithoutPrices) } }],
        },
      });

      const report = await service.generateReport(mockReportData);

      expect(report.targetPrices.conservative).toBe(0);
      expect(report.targetPrices.moderate).toBe(0);
      expect(report.targetPrices.optimistic).toBe(0);
    });

    it('should handle missing arrays', async () => {
      const responseWithoutArrays = {
        ...mockAIResponse,
        keyPoints: undefined,
        warnings: undefined,
        opportunities: undefined,
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(responseWithoutArrays) } }],
        },
      });

      const report = await service.generateReport(mockReportData);

      expect(report.keyPoints).toEqual([]);
      expect(report.warnings).toEqual([]);
      expect(report.opportunities).toEqual([]);
    });
  });

  describe('generateSummary', () => {
    it('should generate a summary', async () => {
      const summaryText = 'PETR4 apresenta um valuation atrativo...';
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: summaryText } }],
        },
      });

      const summary = await service.generateSummary(mockReportData);

      expect(summary).toBe(summaryText);
    });

    it('should throw error on API failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('API timeout'));

      await expect(service.generateSummary(mockReportData)).rejects.toThrow(
        'Failed to call OpenAI API: API timeout',
      );
    });
  });

  describe('API configuration', () => {
    it('should call OpenAI with correct headers', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
        },
      });

      await service.generateReport(mockReportData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.any(Object),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          },
        },
      );
    });

    it('should use gpt-4-turbo-preview model', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
        },
      });

      await service.generateReport(mockReportData);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          model: 'gpt-4-turbo-preview',
          temperature: 0.7,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        }),
        expect.any(Object),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty fundamental data', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
        },
      });

      const emptyData: ReportData = {
        ticker: 'ITUB4',
        fundamentalData: {},
        technicalData: {},
      };

      const report = await service.generateReport(emptyData);

      expect(report.ticker).toBe('ITUB4');
    });

    it('should include generatedAt timestamp', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
        },
      });

      const beforeCall = new Date();
      const report = await service.generateReport(mockReportData);
      const afterCall = new Date();

      expect(report.generatedAt.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(report.generatedAt.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });
});
