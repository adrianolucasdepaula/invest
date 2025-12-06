import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeWithAI', () => {
    it('should return placeholder message', async () => {
      const result = await service.analyzeWithAI({ data: 'test' }, 'analyze this');

      expect(result).toEqual({
        message: 'AI analysis not implemented yet',
      });
    });

    it('should accept any data type', async () => {
      const result1 = await service.analyzeWithAI(null, 'prompt');
      const result2 = await service.analyzeWithAI({ complex: { nested: 'data' } }, 'prompt');
      const result3 = await service.analyzeWithAI([1, 2, 3], 'prompt');

      expect(result1.message).toBeDefined();
      expect(result2.message).toBeDefined();
      expect(result3.message).toBeDefined();
    });

    it('should accept any prompt', async () => {
      const result = await service.analyzeWithAI({}, '');
      expect(result).toBeDefined();
    });
  });

  describe('generateRecommendation', () => {
    it('should return hold recommendation with 0.5 confidence', async () => {
      const result = await service.generateRecommendation('PETR4', { fundamentalData: {} });

      expect(result).toEqual({
        recommendation: 'hold',
        confidence: 0.5,
      });
    });

    it('should accept any ticker', async () => {
      const result1 = await service.generateRecommendation('VALE3', {});
      const result2 = await service.generateRecommendation('ITUB4', {});

      expect(result1.recommendation).toBe('hold');
      expect(result2.recommendation).toBe('hold');
    });

    it('should accept null analysis data', async () => {
      const result = await service.generateRecommendation('TEST', null);

      expect(result.confidence).toBe(0.5);
    });

    it('should return confidence as a number', async () => {
      const result = await service.generateRecommendation('BBDC4', {});

      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
