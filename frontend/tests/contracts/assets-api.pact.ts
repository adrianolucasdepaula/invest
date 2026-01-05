/**
 * Consumer Contract Tests for Assets API
 *
 * Defines the contract between Frontend (consumer) and Backend (provider)
 * for the Assets API endpoints.
 *
 * Uses Pact (MIT License - 100% FREE) for Consumer-Driven Contract Testing.
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @see Pact Docs: https://docs.pact.io/
 * @license FREE (MIT)
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';

const { like, eachLike, decimal, integer, string, timestamp, boolean } = MatchersV3;

// Pact provider configuration
const provider = new PactV3({
  consumer: 'B3AIFrontend',
  provider: 'B3AIBackend',
  dir: path.resolve(process.cwd(), 'pacts'),
  logLevel: 'info',
});

describe('Assets API Contract', () => {
  describe('GET /api/v1/assets', () => {
    it('returns a list of assets', async () => {
      // Arrange: Define the expected interaction
      await provider
        .given('assets exist in database')
        .uponReceiving('a request for all assets')
        .withRequest({
          method: 'GET',
          path: '/api/v1/assets',
          query: { page: '1', limit: '10' },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: eachLike({
              id: integer(1),
              ticker: string('PETR4'),
              name: string('Petrobras PN'),
              type: string('ACAO'),
              sector: string('Petróleo'),
              isActive: boolean(true),
              createdAt: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2024-01-15T10:30:00.000Z'),
              updatedAt: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2024-01-15T10:30:00.000Z'),
            }),
            meta: {
              total: integer(100),
              page: integer(1),
              limit: integer(10),
              totalPages: integer(10),
            },
          },
        });

      // Act & Assert: Execute with Pact mock server
      await provider.executeTest(async (mockServer) => {
        const response = await fetch(
          `${mockServer.url}/api/v1/assets?page=1&limit=10`
        );

        expect(response.status).toBe(200);

        const body = await response.json();
        expect(body.data).toBeDefined();
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.meta).toBeDefined();
      });
    });

    it('returns assets filtered by type', async () => {
      await provider
        .given('assets of type ACAO exist')
        .uponReceiving('a request for assets filtered by type')
        .withRequest({
          method: 'GET',
          path: '/api/v1/assets',
          query: { type: 'ACAO' },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            data: eachLike({
              id: integer(1),
              ticker: string('PETR4'),
              type: string('ACAO'),
            }),
            meta: like({
              total: integer(50),
            }),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await fetch(
          `${mockServer.url}/api/v1/assets?type=ACAO`
        );

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.data.every((a: any) => a.type === 'ACAO')).toBe(true);
      });
    });
  });

  describe('GET /api/v1/assets/:ticker', () => {
    it('returns asset details by ticker', async () => {
      await provider
        .given('asset PETR4 exists')
        .uponReceiving('a request for asset PETR4')
        .withRequest({
          method: 'GET',
          path: '/api/v1/assets/PETR4',
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: integer(1),
            ticker: string('PETR4'),
            name: string('Petrobras PN'),
            type: string('ACAO'),
            sector: string('Petróleo'),
            subsector: string('Exploração e Produção'),
            isActive: boolean(true),
            createdAt: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2024-01-15T10:30:00.000Z'),
            updatedAt: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2024-01-15T10:30:00.000Z'),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await fetch(`${mockServer.url}/api/v1/assets/PETR4`);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.ticker).toBe('PETR4');
      });
    });

    it('returns 404 for non-existent asset', async () => {
      await provider
        .given('asset XXXX1 does not exist')
        .uponReceiving('a request for non-existent asset')
        .withRequest({
          method: 'GET',
          path: '/api/v1/assets/XXXX1',
        })
        .willRespondWith({
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            statusCode: integer(404),
            message: string('Asset not found: XXXX1'),
            error: string('Not Found'),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await fetch(`${mockServer.url}/api/v1/assets/XXXX1`);
        expect(response.status).toBe(404);
      });
    });
  });

  describe('GET /api/v1/assets/:ticker/fundamentals', () => {
    it('returns fundamental data with cross-validation', async () => {
      await provider
        .given('asset PETR4 has fundamental data from multiple sources')
        .uponReceiving('a request for fundamental data')
        .withRequest({
          method: 'GET',
          path: '/api/v1/assets/PETR4/fundamentals',
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            ticker: string('PETR4'),
            // Financial metrics (Decimal.js serialized as string)
            pl: decimal(12.5),
            pvp: decimal(1.2),
            dividendYield: decimal(0.085),
            roe: decimal(0.25),
            roic: decimal(0.18),
            margemLiquida: decimal(0.15),
            evEbitda: decimal(4.5),
            dividaLiquidaEbitda: decimal(1.2),
            // Cross-validation metadata
            crossValidation: {
              confidence: decimal(0.95),
              sourcesCount: integer(5),
              hasDiscrepancy: boolean(false),
              consensusSource: string('fundamentus'),
              sources: eachLike({
                name: string('fundamentus'),
                value: decimal(12.5),
                deviation: decimal(0.02),
                timestamp: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2024-01-15T10:30:00.000Z'),
              }),
            },
            lastUpdated: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2024-01-15T10:30:00.000Z'),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await fetch(
          `${mockServer.url}/api/v1/assets/PETR4/fundamentals`
        );

        expect(response.status).toBe(200);
        const body = await response.json();

        // Verify financial data structure
        expect(body.ticker).toBe('PETR4');
        expect(body.pl).toBeDefined();
        expect(body.crossValidation).toBeDefined();
        expect(body.crossValidation.confidence).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /api/v1/assets/:ticker/prices', () => {
    it('returns historical prices', async () => {
      await provider
        .given('asset PETR4 has price history')
        .uponReceiving('a request for price history')
        .withRequest({
          method: 'GET',
          path: '/api/v1/assets/PETR4/prices',
          query: { days: '30' },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            ticker: string('PETR4'),
            prices: eachLike({
              date: timestamp("yyyy-MM-dd", '2024-01-15'),
              open: decimal(35.50),
              high: decimal(36.20),
              low: decimal(35.10),
              close: decimal(35.80),
              volume: integer(50000000),
              adjustedClose: decimal(35.80),
            }),
            period: {
              start: timestamp("yyyy-MM-dd", '2024-01-01'),
              end: timestamp("yyyy-MM-dd", '2024-01-31'),
              days: integer(30),
            },
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await fetch(
          `${mockServer.url}/api/v1/assets/PETR4/prices?days=30`
        );

        expect(response.status).toBe(200);
        const body = await response.json();

        expect(body.prices).toBeDefined();
        expect(Array.isArray(body.prices)).toBe(true);
      });
    });
  });
});

describe('Portfolio API Contract', () => {
  describe('GET /api/v1/portfolios', () => {
    it('returns user portfolios', async () => {
      await provider
        .given('user has portfolios')
        .uponReceiving('a request for user portfolios')
        .withRequest({
          method: 'GET',
          path: '/api/v1/portfolios',
          headers: {
            Authorization: 'Bearer valid-jwt-token',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: eachLike({
            id: integer(1),
            name: string('Minha Carteira'),
            description: string('Carteira principal'),
            totalValue: decimal(100000.00),
            totalCost: decimal(90000.00),
            profitLoss: decimal(10000.00),
            profitLossPercentage: decimal(0.1111),
            positionsCount: integer(5),
            createdAt: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2024-01-15T10:30:00.000Z'),
            updatedAt: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2024-01-15T10:30:00.000Z'),
          }),
        });

      await provider.executeTest(async (mockServer) => {
        const response = await fetch(`${mockServer.url}/api/v1/portfolios`, {
          headers: {
            Authorization: 'Bearer valid-jwt-token',
          },
        });

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
      });
    });
  });

  describe('POST /api/v1/portfolios', () => {
    it('creates a new portfolio', async () => {
      await provider
        .given('user is authenticated')
        .uponReceiving('a request to create a portfolio')
        .withRequest({
          method: 'POST',
          path: '/api/v1/portfolios',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
          },
          body: {
            name: 'Nova Carteira',
            description: 'Descrição da carteira',
          },
        })
        .willRespondWith({
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            id: integer(1),
            name: string('Nova Carteira'),
            description: string('Descrição da carteira'),
            totalValue: decimal(0),
            createdAt: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2024-01-15T10:30:00.000Z'),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await fetch(`${mockServer.url}/api/v1/portfolios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer valid-jwt-token',
          },
          body: JSON.stringify({
            name: 'Nova Carteira',
            description: 'Descrição da carteira',
          }),
        });

        expect(response.status).toBe(201);
        const body = await response.json();
        expect(body.name).toBe('Nova Carteira');
      });
    });
  });
});

describe('Options API Contract (WHEEL Strategy)', () => {
  describe('GET /api/v1/options/:underlying', () => {
    it('returns options chain with Greeks', async () => {
      await provider
        .given('PETR4 has options available')
        .uponReceiving('a request for options chain')
        .withRequest({
          method: 'GET',
          path: '/api/v1/options/PETR4',
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            underlying: string('PETR4'),
            underlyingPrice: decimal(35.80),
            options: eachLike({
              ticker: string('PETRA123'),
              type: string('CALL'),
              strike: decimal(36.00),
              expiration: timestamp("yyyy-MM-dd", '2024-02-15'),
              daysToExpiry: integer(30),
              // Greeks (CRITICAL for WHEEL)
              delta: decimal(0.45),
              gamma: decimal(0.05),
              theta: decimal(-0.02),
              vega: decimal(0.15),
              // Volatility
              iv: decimal(0.35),
              ivRank: decimal(55),
              ivPercentile: decimal(60),
              // Liquidity
              volume: integer(1000),
              openInterest: integer(5000),
              bid: decimal(1.50),
              ask: decimal(1.55),
            }),
            expirations: eachLike(timestamp("yyyy-MM-dd", '2024-02-15')),
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await fetch(`${mockServer.url}/api/v1/options/PETR4`);

        expect(response.status).toBe(200);
        const body = await response.json();

        // Verify options structure
        expect(body.underlying).toBe('PETR4');
        expect(body.options).toBeDefined();
        expect(Array.isArray(body.options)).toBe(true);

        if (body.options.length > 0) {
          const option = body.options[0];
          // WHEEL strategy validations
          expect(option.delta).toBeDefined();
          expect(option.theta).toBeDefined();
          expect(option.ivRank).toBeDefined();
        }
      });
    });
  });
});

describe('Cross-Validation API Contract', () => {
  describe('GET /api/v1/cross-validation/:ticker', () => {
    it('returns cross-validation results', async () => {
      await provider
        .given('PETR4 has data from multiple sources')
        .uponReceiving('a request for cross-validation')
        .withRequest({
          method: 'GET',
          path: '/api/v1/cross-validation/PETR4',
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            ticker: string('PETR4'),
            validatedAt: timestamp("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", '2024-01-15T10:30:00.000Z'),
            fields: eachLike({
              fieldName: string('pl'),
              consensusValue: decimal(12.5),
              confidence: decimal(0.95),
              hasDiscrepancy: boolean(false),
              sources: eachLike({
                name: string('fundamentus'),
                value: decimal(12.5),
                deviation: decimal(0.02),
                priority: integer(1),
              }),
            }),
            summary: {
              totalFields: integer(10),
              fieldsWithDiscrepancy: integer(1),
              averageConfidence: decimal(0.92),
              sourcesUsed: eachLike(string('fundamentus')),
            },
          },
        });

      await provider.executeTest(async (mockServer) => {
        const response = await fetch(
          `${mockServer.url}/api/v1/cross-validation/PETR4`
        );

        expect(response.status).toBe(200);
        const body = await response.json();

        expect(body.ticker).toBe('PETR4');
        expect(body.fields).toBeDefined();
        expect(body.summary).toBeDefined();
      });
    });
  });
});
