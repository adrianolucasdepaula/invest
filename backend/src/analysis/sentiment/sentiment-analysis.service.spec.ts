import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SentimentAnalysisService, SentimentResult } from './sentiment-analysis.service';

describe('SentimentAnalysisService', () => {
  let service: SentimentAnalysisService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SentimentAnalysisService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SentimentAnalysisService>(SentimentAnalysisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('analyzeText', () => {
    describe('Positive sentiment', () => {
      it('should detect very positive sentiment', async () => {
        const text = 'A empresa teve lucro recorde com forte crescimento e alta valorização das ações';
        const result = await service.analyzeText(text);

        expect(result.score).toBeGreaterThan(0);
        expect(['positive', 'very_positive']).toContain(result.label);
        expect(result.keywords.length).toBeGreaterThan(0);
      });

      it('should detect positive keywords', async () => {
        const text = 'O lucro e o crescimento da empresa superou as expectativas';
        const result = await service.analyzeText(text);

        expect(result.keywords).toContain('lucro');
        expect(result.keywords).toContain('crescimento');
      });

      it('should return high confidence for multiple keywords', async () => {
        const text = 'Lucro, crescimento, alta, ganho, positivo, otimista, valorização, recuperação, expansão, aumento';
        const result = await service.analyzeText(text);

        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      });
    });

    describe('Negative sentiment', () => {
      it('should detect very negative sentiment', async () => {
        const text = 'A empresa teve prejuízo com queda forte e perdas significativas';
        const result = await service.analyzeText(text);

        expect(result.score).toBeLessThan(0);
        expect(['negative', 'very_negative']).toContain(result.label);
      });

      it('should detect negative keywords', async () => {
        const text = 'A queda das ações gerou prejuízo e crise na empresa';
        const result = await service.analyzeText(text);

        expect(result.keywords).toContain('queda');
        expect(result.keywords).toContain('prejuízo');
      });

      it('should return high confidence for multiple negative keywords', async () => {
        const text = 'Prejuízo, queda, perda, negativo, pessimista, desvalorização, crise, redução, diminuição, fraco';
        const result = await service.analyzeText(text);

        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      });
    });

    describe('Neutral sentiment', () => {
      it('should detect neutral sentiment for balanced text', async () => {
        const text = 'A empresa teve lucro no primeiro trimestre mas prejuízo no segundo';
        const result = await service.analyzeText(text);

        expect(result.score).toBeGreaterThan(-0.5);
        expect(result.score).toBeLessThan(0.5);
      });

      it('should detect neutral for text without sentiment words', async () => {
        const text = 'A empresa publicou seu relatório trimestral hoje';
        const result = await service.analyzeText(text);

        expect(result.label).toBe('neutral');
        expect(result.score).toBe(0);
      });

      it('should have low confidence for neutral text without keywords', async () => {
        const text = 'O comunicado foi publicado';
        const result = await service.analyzeText(text);

        expect(result.confidence).toBeLessThanOrEqual(0.3);
      });
    });

    describe('Score calculation', () => {
      it('should calculate score between -1 and 1', async () => {
        const texts = [
          'Lucro extraordinário e crescimento recorde',
          'Prejuízo enorme e crise total',
          'Relatório publicado',
        ];

        for (const text of texts) {
          const result = await service.analyzeText(text);
          expect(result.score).toBeGreaterThanOrEqual(-1);
          expect(result.score).toBeLessThanOrEqual(1);
        }
      });

      it('should have positive score greater than 0.5 for very_positive label', async () => {
        const text = 'Lucro recorde com forte crescimento e alta valorização excelente';
        const result = await service.analyzeText(text);

        if (result.label === 'very_positive') {
          expect(result.score).toBeGreaterThanOrEqual(0.5);
        }
      });

      it('should have negative score less than -0.5 for very_negative label', async () => {
        const text = 'Prejuízo enorme com queda forte e crise total';
        const result = await service.analyzeText(text);

        if (result.label === 'very_negative') {
          expect(result.score).toBeLessThanOrEqual(-0.5);
        }
      });
    });

    describe('Error handling', () => {
      it('should return neutral on error', async () => {
        // This shouldn't actually throw, but the service handles errors gracefully
        const result = await service.analyzeText('');
        expect(result.label).toBe('neutral');
      });
    });
  });

  describe('analyzeNews', () => {
    it('should analyze multiple articles', async () => {
      const articles = [
        { title: 'Empresa tem lucro recorde', snippet: 'Crescimento forte' },
        { title: 'Ações em alta', summary: 'Valorização continua' },
        { title: 'Resultados positivos', snippet: 'Melhora nos indicadores' },
      ];

      const result = await service.analyzeNews('PETR4', articles);

      expect(result.ticker).toBe('PETR4');
      expect(result.articlesAnalyzed).toBe(3);
      expect(result.overallSentiment).toBeDefined();
      expect(result.positiveCount).toBeGreaterThan(0);
    });

    it('should count positive and negative articles', async () => {
      const articles = [
        { title: 'Lucro forte', snippet: 'Crescimento' },
        { title: 'Prejuízo enorme', snippet: 'Queda' },
        { title: 'Neutro', snippet: 'Relatório' },
      ];

      const result = await service.analyzeNews('VALE3', articles);

      expect(result.positiveCount).toBeGreaterThanOrEqual(0);
      expect(result.negativeCount).toBeGreaterThanOrEqual(0);
      expect(result.neutralCount).toBeGreaterThanOrEqual(0);
      expect(result.positiveCount + result.negativeCount + result.neutralCount).toBe(3);
    });

    it('should detect improving trend', async () => {
      // 10+ articles needed for trend detection
      const articles = [
        // Recent (first 5) - positive
        { title: 'Lucro recorde', snippet: 'Crescimento forte' },
        { title: 'Alta nas ações', snippet: 'Valorização' },
        { title: 'Ganhos expressivos', snippet: 'Melhora' },
        { title: 'Bom resultado', snippet: 'Positivo' },
        { title: 'Forte desempenho', snippet: 'Excelente' },
        // Older (next 5) - negative
        { title: 'Prejuízo registrado', snippet: 'Queda' },
        { title: 'Perda significativa', snippet: 'Negativo' },
        { title: 'Crise detectada', snippet: 'Fraco' },
        { title: 'Resultado ruim', snippet: 'Problema' },
        { title: 'Dificuldade', snippet: 'Risco' },
      ];

      const result = await service.analyzeNews('ITUB4', articles);

      expect(result.sentimentTrend).toBe('improving');
    });

    it('should detect declining trend', async () => {
      const articles = [
        // Recent (first 5) - negative
        { title: 'Prejuízo registrado', snippet: 'Queda forte' },
        { title: 'Perda significativa', snippet: 'Negativo' },
        { title: 'Crise na empresa', snippet: 'Fraco' },
        { title: 'Resultado ruim', snippet: 'Problema' },
        { title: 'Dificuldade financeira', snippet: 'Risco' },
        // Older (next 5) - positive
        { title: 'Lucro recorde', snippet: 'Crescimento forte' },
        { title: 'Alta nas ações', snippet: 'Valorização' },
        { title: 'Ganhos expressivos', snippet: 'Melhora' },
        { title: 'Bom resultado', snippet: 'Positivo' },
        { title: 'Forte desempenho', snippet: 'Excelente' },
      ];

      const result = await service.analyzeNews('OIBR3', articles);

      expect(result.sentimentTrend).toBe('declining');
    });

    it('should detect stable trend with similar sentiments', async () => {
      const articles = Array(10)
        .fill(null)
        .map(() => ({ title: 'Relatório publicado', snippet: 'Comunicado' }));

      const result = await service.analyzeNews('BBDC4', articles);

      expect(result.sentimentTrend).toBe('stable');
    });

    it('should aggregate keywords correctly', async () => {
      const articles = [
        { title: 'Lucro', snippet: 'crescimento' },
        { title: 'Lucro', snippet: 'alta' },
        { title: 'Crescimento', snippet: 'valorização' },
      ];

      const result = await service.analyzeNews('PETR4', articles);

      expect(result.overallSentiment.keywords.length).toBeGreaterThan(0);
    });

    it('should extract top positive and negative keywords', async () => {
      const articles = [
        { title: 'Lucro forte crescimento', snippet: 'alta valorização' },
        { title: 'Prejuízo queda', snippet: 'perda negativo' },
      ];

      const result = await service.analyzeNews('VALE3', articles);

      expect(result.topPositiveKeywords).toBeDefined();
      expect(result.topNegativeKeywords).toBeDefined();
    });

    it('should calculate overall sentiment correctly', async () => {
      const positiveArticles = Array(8)
        .fill(null)
        .map(() => ({ title: 'Lucro forte crescimento', snippet: 'alta' }));

      const result = await service.analyzeNews('PETR4', positiveArticles);

      expect(result.overallSentiment.score).toBeGreaterThan(0);
      expect(['positive', 'very_positive']).toContain(result.overallSentiment.label);
    });
  });

  describe('getSentimentDescription', () => {
    it('should return correct description for very_positive', () => {
      const description = service.getSentimentDescription('very_positive');
      expect(description).toContain('Muito Positivo');
      expect(description).toContain('favoráveis');
    });

    it('should return correct description for positive', () => {
      const description = service.getSentimentDescription('positive');
      expect(description).toContain('Positivo');
    });

    it('should return correct description for neutral', () => {
      const description = service.getSentimentDescription('neutral');
      expect(description).toContain('Neutro');
    });

    it('should return correct description for negative', () => {
      const description = service.getSentimentDescription('negative');
      expect(description).toContain('Negativo');
    });

    it('should return correct description for very_negative', () => {
      const description = service.getSentimentDescription('very_negative');
      expect(description).toContain('Muito Negativo');
      expect(description).toContain('desfavoráveis');
    });
  });
});
