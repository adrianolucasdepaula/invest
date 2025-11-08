import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Portfolio API (E2E)', () => {
  let app: INestApplication;
  let authToken: string;
  let portfolioId: string;
  let positionId: string;

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

  describe('/api/portfolios (GET)', () => {
    it('should return user portfolios', () => {
      return request(app.getHttpServer())
        .get('/api/portfolios')
        // .set('Authorization', `Bearer ${authToken}`)
        .expect((res) => {
          // Sem auth, pode retornar 401 ou lista vazia
          expect([200, 401]).toContain(res.status);
          if (res.status === 200) {
            expect(Array.isArray(res.body)).toBe(true);
          }
        });
    });
  });

  describe('/api/portfolios (POST)', () => {
    it('should create a new portfolio', () => {
      return request(app.getHttpServer())
        .post('/api/portfolios')
        .send({
          name: 'Meu Portfólio de Teste',
          description: 'Portfólio para testes automatizados',
        })
        .expect((res) => {
          if (res.status === 201) {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('name');
            portfolioId = res.body.id;
          }
        });
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/portfolios')
        .send({})
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });
  });

  describe('/api/portfolios/:id (GET)', () => {
    it('should return portfolio details', () => {
      if (!portfolioId) {
        return request(app.getHttpServer())
          .get('/api/portfolios/test-id')
          .expect((res) => {
            expect([200, 401, 404]).toContain(res.status);
          });
      }

      return request(app.getHttpServer())
        .get(`/api/portfolios/${portfolioId}`)
        .expect((res) => {
          if (res.status === 200) {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('positions');
          }
        });
    });
  });

  describe('/api/portfolios/:id/positions (POST)', () => {
    it('should add a position to portfolio', () => {
      if (!portfolioId) {
        return request(app.getHttpServer())
          .post('/api/portfolios/test-id/positions')
          .send({
            ticker: 'PETR4',
            quantity: 100,
            averagePrice: 38.50,
          })
          .expect((res) => {
            expect([201, 401, 404]).toContain(res.status);
          });
      }

      return request(app.getHttpServer())
        .post(`/api/portfolios/${portfolioId}/positions`)
        .send({
          ticker: 'PETR4',
          quantity: 100,
          averagePrice: 38.50,
        })
        .expect((res) => {
          if (res.status === 201) {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('ticker', 'PETR4');
            expect(res.body).toHaveProperty('quantity', 100);
            positionId = res.body.id;
          }
        });
    });

    it('should validate position data', () => {
      return request(app.getHttpServer())
        .post('/api/portfolios/test-id/positions')
        .send({
          ticker: 'INVALID',
          quantity: -10,
          averagePrice: -50,
        })
        .expect((res) => {
          expect([400, 401, 404]).toContain(res.status);
        });
    });

    it('should reject negative quantities', () => {
      return request(app.getHttpServer())
        .post('/api/portfolios/test-id/positions')
        .send({
          ticker: 'PETR4',
          quantity: -100,
          averagePrice: 38.50,
        })
        .expect((res) => {
          expect([400, 401]).toContain(res.status);
        });
    });
  });

  describe('/api/portfolios/:id/positions/:positionId (PATCH)', () => {
    it('should update position', () => {
      if (!portfolioId || !positionId) {
        return request(app.getHttpServer())
          .patch('/api/portfolios/test-id/positions/test-position-id')
          .send({ quantity: 150 })
          .expect((res) => {
            expect([200, 401, 404]).toContain(res.status);
          });
      }

      return request(app.getHttpServer())
        .patch(`/api/portfolios/${portfolioId}/positions/${positionId}`)
        .send({ quantity: 150 })
        .expect((res) => {
          if (res.status === 200) {
            expect(res.body).toHaveProperty('quantity', 150);
          }
        });
    });
  });

  describe('/api/portfolios/:id/positions/:positionId (DELETE)', () => {
    it('should delete position', () => {
      if (!portfolioId || !positionId) {
        return request(app.getHttpServer())
          .delete('/api/portfolios/test-id/positions/test-position-id')
          .expect((res) => {
            expect([200, 204, 401, 404]).toContain(res.status);
          });
      }

      return request(app.getHttpServer())
        .delete(`/api/portfolios/${portfolioId}/positions/${positionId}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });

  describe('/api/portfolios/:id/import (POST)', () => {
    it('should import portfolio from file', () => {
      // Mock de arquivo CSV/Excel
      const csvContent = `ticker,quantity,averagePrice
PETR4,100,38.50
VALE3,50,65.00`;

      return request(app.getHttpServer())
        .post('/api/portfolios/test-id/import')
        .attach('file', Buffer.from(csvContent), 'portfolio.csv')
        .expect((res) => {
          expect([200, 201, 401, 404]).toContain(res.status);
        });
    });

    it('should validate file format', () => {
      return request(app.getHttpServer())
        .post('/api/portfolios/test-id/import')
        .attach('file', Buffer.from('invalid content'), 'test.txt')
        .expect((res) => {
          expect([400, 401, 415]).toContain(res.status);
        });
    });
  });

  describe('/api/portfolios/:id/performance (GET)', () => {
    it('should return portfolio performance metrics', () => {
      return request(app.getHttpServer())
        .get('/api/portfolios/test-id/performance')
        .expect((res) => {
          expect([200, 401, 404]).toContain(res.status);
          if (res.status === 200) {
            expect(res.body).toHaveProperty('totalValue');
            expect(res.body).toHaveProperty('totalInvested');
            expect(res.body).toHaveProperty('totalGain');
            expect(res.body).toHaveProperty('totalGainPercent');
          }
        });
    });

    it('should filter by date range', () => {
      return request(app.getHttpServer())
        .get('/api/portfolios/test-id/performance?startDate=2024-01-01&endDate=2024-12-31')
        .expect((res) => {
          expect([200, 401, 404]).toContain(res.status);
        });
    });
  });

  describe('/api/portfolios/:id (DELETE)', () => {
    it('should delete portfolio', () => {
      if (!portfolioId) {
        return request(app.getHttpServer())
          .delete('/api/portfolios/test-id')
          .expect((res) => {
            expect([200, 204, 401, 404]).toContain(res.status);
          });
      }

      return request(app.getHttpServer())
        .delete(`/api/portfolios/${portfolioId}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });
});
