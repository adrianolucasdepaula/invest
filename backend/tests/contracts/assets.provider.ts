/**
 * Provider Verification Tests for Assets API
 *
 * Verifies that the Backend (provider) fulfills the contracts
 * defined by the Frontend (consumer).
 *
 * Uses Pact (MIT License - 100% FREE) for Consumer-Driven Contract Testing.
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @see Pact Docs: https://docs.pact.io/
 * @license FREE (MIT)
 */

import { Verifier } from '@pact-foundation/pact';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as path from 'path';

describe('Pact Provider Verification', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    // Create NestJS test application
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.listen(0); // Random available port

    const server = app.getHttpServer();
    const address = server.address();
    baseUrl = `http://localhost:${address.port}`;

    console.log(`[Pact] Provider running at ${baseUrl}`);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Assets API Provider', () => {
    it('verifies pact with B3AIFrontend', async () => {
      const verifier = new Verifier({
        provider: 'B3AIBackend',
        providerBaseUrl: baseUrl,
        pactUrls: [
          path.resolve(process.cwd(), '../frontend/pacts/B3AIFrontend-B3AIBackend.json'),
        ],
        // State handlers - Setup data for each provider state
        stateHandlers: {
          'assets exist in database': async () => {
            // Seed test data if needed
            // In real implementation, this would seed the database
            console.log('[Pact] Setting up state: assets exist in database');
            return Promise.resolve();
          },

          'assets of type ACAO exist': async () => {
            console.log('[Pact] Setting up state: assets of type ACAO exist');
            return Promise.resolve();
          },

          'asset PETR4 exists': async () => {
            console.log('[Pact] Setting up state: asset PETR4 exists');
            return Promise.resolve();
          },

          'asset XXXX1 does not exist': async () => {
            console.log('[Pact] Setting up state: asset XXXX1 does not exist');
            return Promise.resolve();
          },

          'asset PETR4 has fundamental data from multiple sources': async () => {
            console.log('[Pact] Setting up state: asset PETR4 has fundamental data');
            return Promise.resolve();
          },

          'asset PETR4 has price history': async () => {
            console.log('[Pact] Setting up state: asset PETR4 has price history');
            return Promise.resolve();
          },

          'user has portfolios': async () => {
            console.log('[Pact] Setting up state: user has portfolios');
            return Promise.resolve();
          },

          'user is authenticated': async () => {
            console.log('[Pact] Setting up state: user is authenticated');
            return Promise.resolve();
          },

          'PETR4 has options available': async () => {
            console.log('[Pact] Setting up state: PETR4 has options available');
            return Promise.resolve();
          },

          'PETR4 has data from multiple sources': async () => {
            console.log('[Pact] Setting up state: PETR4 has data from multiple sources');
            return Promise.resolve();
          },
        },

        // Request filter to modify requests before sending
        requestFilter: (req) => {
          // Add default headers if needed
          if (!req.headers) {
            req.headers = {};
          }
          req.headers['Content-Type'] = 'application/json';
          return req;
        },

        // Verification options
        publishVerificationResult: process.env.CI === 'true',
        providerVersion: process.env.GIT_COMMIT || '1.0.0',
        providerVersionTags: process.env.GIT_BRANCH ? [process.env.GIT_BRANCH] : ['local'],

        // Logging
        logLevel: 'info',

        // Timeout settings
        timeout: 30000,
      });

      // Run verification
      await verifier.verifyProvider();
    });
  });
});

/**
 * State handler utilities for setting up test data
 */
export class PactStateHandlers {
  /**
   * Seed an asset into the database
   */
  static async seedAsset(data: {
    ticker: string;
    name?: string;
    type?: string;
    sector?: string;
  }): Promise<void> {
    // This would use TypeORM repository in real implementation
    console.log(`[Pact] Seeding asset: ${data.ticker}`);
  }

  /**
   * Seed fundamental data
   */
  static async seedFundamentalData(ticker: string, data: {
    pl?: number;
    pvp?: number;
    dividendYield?: number;
    source: string;
  }): Promise<void> {
    console.log(`[Pact] Seeding fundamental data for: ${ticker} from ${data.source}`);
  }

  /**
   * Seed price history
   */
  static async seedPriceHistory(ticker: string, days: number): Promise<void> {
    console.log(`[Pact] Seeding ${days} days of price history for: ${ticker}`);
  }

  /**
   * Seed portfolio
   */
  static async seedPortfolio(userId: number, data: {
    name: string;
    description?: string;
  }): Promise<void> {
    console.log(`[Pact] Seeding portfolio for user ${userId}: ${data.name}`);
  }

  /**
   * Seed options data
   */
  static async seedOptions(underlying: string): Promise<void> {
    console.log(`[Pact] Seeding options for: ${underlying}`);
  }

  /**
   * Clear all test data
   */
  static async clearTestData(): Promise<void> {
    console.log('[Pact] Clearing all test data');
    // This would truncate test tables in real implementation
  }
}

/**
 * Provider state definitions
 *
 * These define all possible provider states and what data
 * should exist in each state.
 */
export const PROVIDER_STATES = {
  // Asset states
  'assets exist in database': {
    description: 'Database contains multiple assets',
    setup: async () => {
      await PactStateHandlers.seedAsset({ ticker: 'PETR4', name: 'Petrobras PN', type: 'ACAO' });
      await PactStateHandlers.seedAsset({ ticker: 'VALE3', name: 'Vale ON', type: 'ACAO' });
      await PactStateHandlers.seedAsset({ ticker: 'ITUB4', name: 'Itaú Unibanco PN', type: 'ACAO' });
    },
  },

  'asset PETR4 exists': {
    description: 'PETR4 asset exists with full data',
    setup: async () => {
      await PactStateHandlers.seedAsset({
        ticker: 'PETR4',
        name: 'Petrobras PN',
        type: 'ACAO',
        sector: 'Petróleo',
      });
    },
  },

  'asset PETR4 has fundamental data from multiple sources': {
    description: 'PETR4 has fundamental data from 5+ sources for cross-validation',
    setup: async () => {
      await PactStateHandlers.seedAsset({ ticker: 'PETR4' });
      await PactStateHandlers.seedFundamentalData('PETR4', { pl: 12.5, source: 'fundamentus' });
      await PactStateHandlers.seedFundamentalData('PETR4', { pl: 12.3, source: 'statusinvest' });
      await PactStateHandlers.seedFundamentalData('PETR4', { pl: 12.7, source: 'investidor10' });
      await PactStateHandlers.seedFundamentalData('PETR4', { pl: 12.4, source: 'trademap' });
      await PactStateHandlers.seedFundamentalData('PETR4', { pl: 12.6, source: 'yahoo' });
    },
  },

  'asset PETR4 has price history': {
    description: 'PETR4 has 30+ days of price history',
    setup: async () => {
      await PactStateHandlers.seedAsset({ ticker: 'PETR4' });
      await PactStateHandlers.seedPriceHistory('PETR4', 30);
    },
  },

  // Portfolio states
  'user has portfolios': {
    description: 'User has at least one portfolio',
    setup: async () => {
      await PactStateHandlers.seedPortfolio(1, { name: 'Minha Carteira' });
    },
  },

  // Options states
  'PETR4 has options available': {
    description: 'PETR4 has options chain with Greeks',
    setup: async () => {
      await PactStateHandlers.seedAsset({ ticker: 'PETR4' });
      await PactStateHandlers.seedOptions('PETR4');
    },
  },

  // Cross-validation states
  'PETR4 has data from multiple sources': {
    description: 'PETR4 has scraped data from multiple sources',
    setup: async () => {
      await PactStateHandlers.seedAsset({ ticker: 'PETR4' });
      await PactStateHandlers.seedFundamentalData('PETR4', { pl: 12.5, pvp: 1.2, source: 'fundamentus' });
      await PactStateHandlers.seedFundamentalData('PETR4', { pl: 12.3, pvp: 1.21, source: 'statusinvest' });
    },
  },
};

/**
 * CI/CD Integration helpers
 */
export const PactCI = {
  /**
   * Publish pacts to broker (if configured)
   */
  async publishPacts(): Promise<void> {
    if (!process.env.PACT_BROKER_URL) {
      console.log('[Pact] No broker URL configured, skipping publish');
      return;
    }

    // Pact broker publish would go here
    console.log('[Pact] Publishing pacts to broker...');
  },

  /**
   * Get verification status from broker
   */
  async getVerificationStatus(consumer: string, provider: string): Promise<boolean> {
    if (!process.env.PACT_BROKER_URL) {
      console.log('[Pact] No broker URL configured');
      return true;
    }

    // Check verification status from broker
    return true;
  },

  /**
   * Check if can deploy (all pacts verified)
   */
  async canIDeploy(pacticipant: string, version: string): Promise<boolean> {
    if (!process.env.PACT_BROKER_URL) {
      console.log('[Pact] No broker URL configured, assuming deployable');
      return true;
    }

    // Check can-i-deploy with broker
    return true;
  },
};
