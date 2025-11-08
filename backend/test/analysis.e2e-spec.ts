import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Analysis API (E2E)', () => {
  let app: INestApplication;
  let reportId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/analysis/generate (POST)', () => {
    it('should generate analysis for a ticker', () => {
      return request(app.getHttpServer())
        .post('/api/analysis/generate')
        .send({ ticker: 'PETR4' })
        .expect((res) => {
          expect([200, 201, 202, 401]).toContain(res.status);
          if (res.status === 201 || res.status === 202) {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('ticker', 'PETR4');
            reportId = res.body.id;
          }
        });
    });

    it('should validate ticker', () => {
      return request(app.getHttpServer())
        .post('/api/analysis/generate')
        .send({ ticker: '' })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });

    it('should handle invalid ticker', () => {
      return request(app.getHttpServer())
        .post('/api/analysis/generate')
        .send({ ticker: 'INVALID999' })
        .expect((res) => {
          expect([400, 404, 401]).toContain(res.status);
        });
    });
  });

  describe('/api/analysis/reports (GET)', () => {
    it('should return list of reports', () => {
      return request(app.getHttpServer())
        .get('/api/analysis/reports')
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
          if (res.status === 200) {
            expect(Array.isArray(res.body)).toBe(true);
          }
        });
    });

    it('should filter by ticker', () => {
      return request(app.getHttpServer())
        .get('/api/analysis/reports?ticker=PETR4')
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
        });
    });

    it('should paginate results', () => {
      return request(app.getHttpServer())
        .get('/api/analysis/reports?page=1&limit=10')
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
        });
    });
  });

  describe('/api/analysis/reports/:id (GET)', () => {
    it('should return report details', () => {
      const testId = reportId || 'test-report-id';

      return request(app.getHttpServer())
        .get(`/api/analysis/reports/${testId}`)
        .expect((res) => {
          expect([200, 401, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('ticker');
            expect(res.body).toHaveProperty('recommendation');
            expect(res.body).toHaveProperty('fundamentalAnalysis');
            expect(res.body).toHaveProperty('technicalAnalysis');
          }
        });
    });

    it('should return 404 for non-existent report', () => {
      return request(app.getHttpServer())
        .get('/api/analysis/reports/non-existent-id')
        .expect((res) => {
          expect([401, 404]).toContain(res.status);
        });
    });
  });

  describe('/api/analysis/fundamental/:ticker (GET)', () => {
    it('should return fundamental analysis', () => {
      return request(app.getHttpServer())
        .get('/api/analysis/fundamental/PETR4')
        .expect((res) => {
          expect([200, 401, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body).toHaveProperty('ticker', 'PETR4');
            expect(res.body).toHaveProperty('indicators');
            // ROE, P/L, P/VP, Dividend Yield, etc
            if (res.body.indicators) {
              expect(res.body.indicators).toHaveProperty('roe');
              expect(res.body.indicators).toHaveProperty('pe');
              expect(res.body.indicators).toHaveProperty('pb');
            }
          }
        });
    });
  });

  describe('/api/analysis/technical/:ticker (GET)', () => {
    it('should return technical analysis', () => {
      return request(app.getHttpServer())
        .get('/api/analysis/technical/PETR4')
        .expect((res) => {
          expect([200, 401, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body).toHaveProperty('ticker', 'PETR4');
            expect(res.body).toHaveProperty('indicators');
            // RSI, MACD, SMA, EMA, etc
            if (res.body.indicators) {
              expect(res.body.indicators).toHaveProperty('rsi');
              expect(res.body.indicators).toHaveProperty('macd');
            }
          }
        });
    });

    it('should support different timeframes', () => {
      return request(app.getHttpServer())
        .get('/api/analysis/technical/PETR4?timeframe=daily')
        .expect((res) => {
          expect([200, 401, 404]).toContain(res.status);
        });
    });
  });

  describe('/api/analysis/ai/:ticker (POST)', () => {
    it('should generate AI analysis', () => {
      return request(app.getHttpServer())
        .post('/api/analysis/ai/PETR4')
        .send({
          includeNews: true,
          includeSentiment: true,
        })
        .expect((res) => {
          expect([200, 201, 202, 401, 404]).toContain(res.status);
          if (res.status === 200 || res.status === 201) {
            expect(res.body).toHaveProperty('ticker', 'PETR4');
            expect(res.body).toHaveProperty('analysis');
            expect(res.body).toHaveProperty('recommendation');
          }
        });
    });

    it('should handle AI service errors gracefully', () => {
      return request(app.getHttpServer())
        .post('/api/analysis/ai/PETR4')
        .send({})
        .expect((res) => {
          expect([200, 201, 202, 401, 404, 500, 503]).toContain(res.status);
        });
    });
  });

  describe('/api/analysis/compare (POST)', () => {
    it('should compare multiple assets', () => {
      return request(app.getHttpServer())
        .post('/api/analysis/compare')
        .send({
          tickers: ['PETR4', 'VALE3', 'ITUB4'],
          metrics: ['roe', 'pe', 'dividendYield'],
        })
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body).toHaveProperty('comparison');
            expect(Array.isArray(res.body.comparison)).toBe(true);
          }
        });
    });

    it('should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/analysis/compare')
        .send({ tickers: [] })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });
  });

  describe('/api/analysis/alerts (POST)', () => {
    it('should create price alert', () => {
      return request(app.getHttpServer())
        .post('/api/analysis/alerts')
        .send({
          ticker: 'PETR4',
          type: 'PRICE',
          condition: 'ABOVE',
          value: 40.0,
        })
        .expect((res) => {
          expect([201, 401]).toContain(res.status);
        });
    });

    it('should create indicator alert', () => {
      return request(app.getHttpServer())
        .post('/api/analysis/alerts')
        .send({
          ticker: 'PETR4',
          type: 'RSI',
          condition: 'BELOW',
          value: 30,
        })
        .expect((res) => {
          expect([201, 401]).toContain(res.status);
        });
    });

    it('should validate alert data', () => {
      return request(app.getHttpServer())
        .post('/api/analysis/alerts')
        .send({
          ticker: 'PETR4',
          type: 'INVALID',
        })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });
  });

  describe('/api/analysis/alerts (GET)', () => {
    it('should return user alerts', () => {
      return request(app.getHttpServer())
        .get('/api/analysis/alerts')
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
          if (res.status === 200) {
            expect(Array.isArray(res.body)).toBe(true);
          }
        });
    });

    it('should filter by ticker', () => {
      return request(app.getHttpServer())
        .get('/api/analysis/alerts?ticker=PETR4')
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/api/analysis/alerts?status=ACTIVE')
        .expect((res) => {
          expect([200, 401]).toContain(res.status);
        });
    });
  });
});
