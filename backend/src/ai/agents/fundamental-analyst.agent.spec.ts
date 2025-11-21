import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FundamentalAnalystAgent } from './fundamental-analyst.agent';
import { AnalysisContext, Signal } from '../interfaces/analysis.types';

describe('FundamentalAnalystAgent', () => {
  let agent: FundamentalAnalystAgent;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      if (key === 'AI_MODEL') return 'gpt-4';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FundamentalAnalystAgent,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    agent = module.get<FundamentalAnalystAgent>(FundamentalAnalystAgent);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Metadata', () => {
    it('should have correct agent metadata', () => {
      expect(agent.name).toBe('Analista Fundamentalista');
      expect(agent.specialty).toBe('Valuation, balanços patrimoniais, indicadores financeiros');
      expect(agent.version).toBe('1.0.0');
    });
  });

  describe('canAnalyze', () => {
    const createStockData = (partial: Partial<any> = {}): any => ({
      ticker: 'PETR4',
      name: 'Petrobras PN',
      price: 35.5,
      change: 0.5,
      changePercent: 1.4,
      volume: 1000000,
      marketCap: 200000000000,
      ...partial,
    });

    it('should return true when has PE ratio', () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ pe: 8.5 }),
      };

      expect(agent.canAnalyze(context)).toBe(true);
    });

    it('should return true when has ROE', () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ roe: 18.5 }),
      };

      expect(agent.canAnalyze(context)).toBe(true);
    });

    it('should return true when has Dividend Yield', () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ dividendYield: 7.2 }),
      };

      expect(agent.canAnalyze(context)).toBe(true);
    });

    it('should return true when has Debt to Equity', () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ debtToEquity: 0.8 }),
      };

      expect(agent.canAnalyze(context)).toBe(true);
    });

    it('should return false when has no fundamental indicators', () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData(), // Only basic data, no fundamentals
      };

      expect(agent.canAnalyze(context)).toBe(false);
    });

    it('should return false when stockData is null', () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: null as any,
      };

      expect(agent.canAnalyze(context)).toBe(false);
    });
  });

  describe('analyze', () => {
    const createStockData = (partial: Partial<any> = {}): any => ({
      ticker: 'PETR4',
      name: 'Petrobras PN',
      price: 35.5,
      change: 0.5,
      changePercent: 1.4,
      volume: 1000000,
      marketCap: 200000000000,
      sector: 'Petróleo e Gás',
      ...partial,
    });

    beforeEach(() => {
      // Mock GPT-4 call
      jest.spyOn(agent as any, 'callGPT4').mockResolvedValue(`
Análise Fundamentalista - PETR4

**Valuation:**
Com P/L de 8.5, a ação está abaixo da média do setor (12-15), indicando potencial subavaliação.

**Rentabilidade:**
ROE de 18.5% é excelente, demonstrando alta eficiência na geração de lucro.

**Endividamento:**
Dívida/Patrimônio de 0.8 está controlado, indicando saúde financeira.

**Dividendos:**
Dividend Yield de 7.2% é muito atrativo para investidores de renda.

**Recomendação:** COMPRA
**Preço-alvo:** R$ 42,00
      `);
    });

    it('should generate complete analysis with all indicators', async () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({
          pe: 8.5,
          roe: 18.5,
          dividendYield: 7.2,
          debtToEquity: 0.8,
          priceToBook: 1.2,
          eps: 4.18,
        }),
      };

      const result = await agent.analyze(context);

      expect(result).toBeDefined();
      expect(result.analysis).toContain('PETR4');
      expect(result.analysis).toContain('COMPRA');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.recommendation).toBe('BUY');
      expect(result.signals).toBeDefined();
      expect(Array.isArray(result.signals)).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.agent).toBe('Analista Fundamentalista');
      expect(result.metadata!.indicators).toContain('P/L');
      expect(result.metadata!.indicators).toContain('ROE');
      expect(result.timestamp).toBeDefined();
    });

    it('should have high confidence with many indicators', async () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({
          pe: 8.5,
          roe: 18.5,
          dividendYield: 7.2,
          debtToEquity: 0.8,
          priceToBook: 1.2,
          eps: 4.18,
        }),
      };

      const result = await agent.analyze(context);

      // With 6 indicators, confidence should be high (>= 0.85)
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });

    it('should have lower confidence with few indicators', async () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({
          pe: 8.5,
        }),
      };

      const result = await agent.analyze(context);

      // With only 1 indicator, confidence should be lower
      expect(result.confidence).toBeLessThan(0.85);
    });
  });

  describe('Signal Extraction', () => {
    const createStockData = (partial: Partial<any> = {}): any => ({
      ticker: 'PETR4',
      name: 'Petrobras PN',
      price: 35.5,
      change: 0.5,
      changePercent: 1.4,
      volume: 1000000,
      marketCap: 200000000000,
      ...partial,
    });

    it('should generate BUY signal for low P/E', async () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ pe: 7.5 }), // Below 10
      };

      const result = await agent.analyze(context);
      const buySignals = result.signals!.filter((s) => s.type === 'BUY');

      expect(buySignals.length).toBeGreaterThan(0);
      expect(buySignals.some((s) => s.reason.includes('P/L baixo'))).toBe(true);
    });

    it('should generate SELL signal for high P/E', async () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ pe: 35.0 }), // Above 30
      };

      const result = await agent.analyze(context);
      const sellSignals = result.signals!.filter((s) => s.type === 'SELL');

      expect(sellSignals.length).toBeGreaterThan(0);
      expect(sellSignals.some((s) => s.reason.includes('P/L alto'))).toBe(true);
    });

    it('should generate BUY signal for excellent ROE', async () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ roe: 20.0 }), // Above 15
      };

      const result = await agent.analyze(context);
      const buySignals = result.signals!.filter((s) => s.type === 'BUY');

      expect(buySignals.some((s) => s.reason.includes('ROE excelente'))).toBe(true);
    });

    it('should generate WARNING signal for low ROE', async () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ roe: 3.0 }), // Below 5
      };

      const result = await agent.analyze(context);
      const warningSignals = result.signals!.filter((s) => s.type === 'WARNING');

      expect(warningSignals.some((s) => s.reason.includes('ROE baixo'))).toBe(true);
    });

    it('should generate BUY signal for attractive dividend yield', async () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ dividendYield: 8.5 }), // Above 6
      };

      const result = await agent.analyze(context);
      const buySignals = result.signals!.filter((s) => s.type === 'BUY');

      expect(buySignals.some((s) => s.reason.includes('Dividend Yield'))).toBe(true);
    });

    it('should generate WARNING for high debt', async () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ debtToEquity: 2.5 }), // Above 2
      };

      const result = await agent.analyze(context);
      const warningSignals = result.signals!.filter((s) => s.type === 'WARNING');

      expect(warningSignals.some((s) => s.reason.includes('Endividamento alto'))).toBe(true);
    });

    it('should generate BUY signal for low debt', async () => {
      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ debtToEquity: 0.3 }), // Below 0.5
      };

      const result = await agent.analyze(context);
      const buySignals = result.signals!.filter((s) => s.type === 'BUY');

      expect(buySignals.some((s) => s.reason.includes('Endividamento baixo'))).toBe(true);
    });
  });

  describe('Recommendation Extraction', () => {
    const createStockData = (partial: Partial<any> = {}): any => ({
      ticker: 'PETR4',
      name: 'Petrobras PN',
      price: 35.5,
      change: 0.5,
      changePercent: 1.4,
      volume: 1000000,
      marketCap: 200000000000,
      ...partial,
    });

    it('should extract BUY recommendation', async () => {
      jest.spyOn(agent as any, 'callGPT4').mockResolvedValue('Recomendação: COMPRA');

      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ pe: 8.5 }),
      };

      const result = await agent.analyze(context);
      expect(result.recommendation).toBe('BUY');
    });

    it('should extract HOLD recommendation', async () => {
      jest.spyOn(agent as any, 'callGPT4').mockResolvedValue('Recomendação: MANTER');

      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ pe: 15.0 }),
      };

      const result = await agent.analyze(context);
      expect(result.recommendation).toBe('HOLD');
    });

    it('should extract SELL recommendation', async () => {
      jest.spyOn(agent as any, 'callGPT4').mockResolvedValue('Recomendação: VENDA');

      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ pe: 35.0 }),
      };

      const result = await agent.analyze(context);
      expect(result.recommendation).toBe('SELL');
    });
  });

  describe('Error Handling', () => {
    const createStockData = (partial: Partial<any> = {}): any => ({
      ticker: 'PETR4',
      name: 'Petrobras PN',
      price: 35.5,
      change: 0.5,
      changePercent: 1.4,
      volume: 1000000,
      marketCap: 200000000000,
      ...partial,
    });

    it('should handle GPT-4 API errors gracefully', async () => {
      jest.spyOn(agent as any, 'callGPT4').mockRejectedValue(new Error('API Error'));

      const context: AnalysisContext = {
        ticker: 'PETR4',
        stockData: createStockData({ pe: 8.5 }),
      };

      await expect(agent.analyze(context)).rejects.toThrow('API Error');
    });
  });
});
