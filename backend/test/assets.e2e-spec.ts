import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Assets API (E2E)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    // TODO: Login para obter token (quando auth estiver implementado)
    // const loginResponse = await request(app.getHttpServer())
    //   .post('/auth/login')
    //   .send({ email: 'test@example.com', password: 'password' });
    // authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/assets (GET)', () => {
    it('should return list of assets', () => {
      return request(app.getHttpServer())
        .get('/api/assets')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('ticker');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('currentPrice');
          }
        });
    });

    it('should filter assets by search query', () => {
      return request(app.getHttpServer())
        .get('/api/assets?search=PETR4')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0].ticker).toContain('PETR');
          }
        });
    });

    it('should filter assets by sector', () => {
      return request(app.getHttpServer())
        .get('/api/assets?sector=Petróleo e Gás')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should paginate results', () => {
      return request(app.getHttpServer())
        .get('/api/assets?page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('limit');
          expect(res.body.meta).toHaveProperty('total');
        });
    });
  });

  describe('/api/assets/:ticker (GET)', () => {
    it('should return asset details', () => {
      return request(app.getHttpServer())
        .get('/api/assets/PETR4')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('ticker', 'PETR4');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('currentPrice');
          expect(res.body).toHaveProperty('sector');
        });
    });

    it('should return 404 for non-existent asset', () => {
      return request(app.getHttpServer())
        .get('/api/assets/INVALID999')
        .expect(404);
    });

    it('should validate ticker format', () => {
      return request(app.getHttpServer())
        .get('/api/assets/invalid')
        .expect((res) => {
          expect([400, 404]).toContain(res.status);
        });
    });
  });

  describe('/api/assets/:ticker/history (GET)', () => {
    it('should return price history', () => {
      return request(app.getHttpServer())
        .get('/api/assets/PETR4/history')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('date');
            expect(res.body[0]).toHaveProperty('open');
            expect(res.body[0]).toHaveProperty('high');
            expect(res.body[0]).toHaveProperty('low');
            expect(res.body[0]).toHaveProperty('close');
            expect(res.body[0]).toHaveProperty('volume');
          }
        });
    });

    it('should filter by date range', () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      return request(app.getHttpServer())
        .get(`/api/assets/PETR4/history?startDate=${startDate}&endDate=${endDate}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should limit results', () => {
      return request(app.getHttpServer())
        .get('/api/assets/PETR4/history?limit=30')
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeLessThanOrEqual(30);
        });
    });
  });

  describe('/api/assets/:ticker/indicators (GET)', () => {
    it('should return technical indicators', () => {
      return request(app.getHttpServer())
        .get('/api/assets/PETR4/indicators')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('rsi');
          expect(res.body).toHaveProperty('macd');
          expect(res.body).toHaveProperty('sma');
          expect(res.body).toHaveProperty('ema');
        });
    });
  });

  describe('/api/assets/compare (POST)', () => {
    it('should compare multiple assets', () => {
      return request(app.getHttpServer())
        .post('/api/assets/compare')
        .send({ tickers: ['PETR4', 'VALE3', 'ITUB4'] })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(3);
        });
    });

    it('should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/assets/compare')
        .send({ tickers: [] })
        .expect(400);
    });

    it('should limit number of tickers', () => {
      const tickers = Array(20).fill('PETR4');

      return request(app.getHttpServer())
        .post('/api/assets/compare')
        .send({ tickers })
        .expect((res) => {
          expect([400, 200]).toContain(res.status);
        });
    });
  });
});
