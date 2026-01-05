/**
 * k6 Smoke Test - Performance Testing
 *
 * Lightweight test for CI/CD pipelines to catch performance regressions early.
 * Runs with minimal load to verify basic performance SLOs.
 *
 * Grafana k6 is 100% FREE (AGPL 3.0 License)
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @see k6 Docs: https://grafana.com/docs/k6/latest/
 * @license FREE (AGPL 3.0)
 *
 * Usage:
 * k6 run k6/smoke-test.js
 * k6 run k6/smoke-test.js --out json=results.json
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Test configuration
 */
export const options = {
  // Smoke test: Light load for quick CI verification
  stages: [
    { duration: '30s', target: 5 },   // Ramp up to 5 users
    { duration: '1m', target: 5 },    // Hold at 5 users
    { duration: '10s', target: 0 },   // Ramp down
  ],

  // Performance thresholds (SLOs)
  thresholds: {
    // General thresholds
    http_req_duration: ['p(95)<500'],     // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],       // Error rate < 1%

    // Endpoint-specific thresholds (CRITICAL for financial system)
    'http_req_duration{name:assets_list}': ['p(95)<300'],        // Assets list
    'http_req_duration{name:asset_detail}': ['p(95)<400'],       // Asset detail
    'http_req_duration{name:asset_fundamentals}': ['p(95)<500'], // Fundamentals
    'http_req_duration{name:portfolios}': ['p(95)<400'],         // Portfolios
    'http_req_duration{name:cross_validation}': ['p(95)<1000'],  // Cross-validation (heavy)
    'http_req_duration{name:options}': ['p(95)<600'],            // Options chain
    'http_req_duration{name:health}': ['p(95)<100'],             // Health check

    // Custom metrics
    'api_success_rate': ['rate>0.99'],   // 99% success rate
    'financial_data_valid': ['rate>0.95'], // 95% data validity
  },
};

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3101';
const API_PREFIX = '/api/v1';

// Test data
const TEST_TICKERS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3'];
const TEST_PORTFOLIO_ID = 1;

// =============================================================================
// CUSTOM METRICS
// =============================================================================

// Success rate for API calls
const apiSuccessRate = new Rate('api_success_rate');
// Financial data validity
const financialDataValid = new Rate('financial_data_valid');
// Response time trends
const assetListTrend = new Trend('asset_list_duration');
const fundamentalsTrend = new Trend('fundamentals_duration');
// Error counter
const errorCount = new Counter('errors');

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Make authenticated request
 */
function authRequest(method, url, body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${__ENV.AUTH_TOKEN || 'test-token'}`,
  };

  const params = { headers };

  if (method === 'GET') {
    return http.get(url, params);
  } else if (method === 'POST') {
    return http.post(url, JSON.stringify(body), params);
  }
}

/**
 * Validate financial data response
 */
function validateFinancialData(response) {
  try {
    const data = JSON.parse(response.body);

    // Check for required financial fields
    const hasRequiredFields =
      data.pl !== undefined ||
      data.pvp !== undefined ||
      data.dividendYield !== undefined;

    // Check for cross-validation data
    const hasCrossValidation =
      data.crossValidation !== undefined &&
      data.crossValidation.confidence !== undefined;

    return hasRequiredFields || hasCrossValidation;
  } catch {
    return false;
  }
}

// =============================================================================
// TEST SCENARIOS
// =============================================================================

export default function () {
  // -------------------------------------------------------------------------
  // 1. HEALTH CHECK
  // -------------------------------------------------------------------------
  group('Health Check', () => {
    const healthRes = http.get(`${BASE_URL}/health`, {
      tags: { name: 'health' },
    });

    const healthCheck = check(healthRes, {
      'health status 200': (r) => r.status === 200,
      'health response fast': (r) => r.timings.duration < 100,
    });

    apiSuccessRate.add(healthCheck);
    if (!healthCheck) errorCount.add(1);
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 2. ASSETS LIST
  // -------------------------------------------------------------------------
  group('Assets List', () => {
    const assetsRes = http.get(`${BASE_URL}${API_PREFIX}/assets?page=1&limit=10`, {
      tags: { name: 'assets_list' },
    });

    assetListTrend.add(assetsRes.timings.duration);

    const assetsCheck = check(assetsRes, {
      'assets status 200': (r) => r.status === 200,
      'assets has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && Array.isArray(body.data);
        } catch {
          return false;
        }
      },
      'assets response time OK': (r) => r.timings.duration < 300,
    });

    apiSuccessRate.add(assetsCheck);
    if (!assetsCheck) errorCount.add(1);
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 3. ASSET DETAIL
  // -------------------------------------------------------------------------
  group('Asset Detail', () => {
    const ticker = TEST_TICKERS[Math.floor(Math.random() * TEST_TICKERS.length)];

    const detailRes = http.get(`${BASE_URL}${API_PREFIX}/assets/${ticker}`, {
      tags: { name: 'asset_detail' },
    });

    const detailCheck = check(detailRes, {
      'asset detail status 200': (r) => r.status === 200,
      'asset has ticker': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.ticker === ticker;
        } catch {
          return false;
        }
      },
      'asset detail response time OK': (r) => r.timings.duration < 400,
    });

    apiSuccessRate.add(detailCheck);
    if (!detailCheck) errorCount.add(1);
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 4. ASSET FUNDAMENTALS (CRITICAL - Financial Data)
  // -------------------------------------------------------------------------
  group('Asset Fundamentals', () => {
    const ticker = TEST_TICKERS[Math.floor(Math.random() * TEST_TICKERS.length)];

    const fundamentalsRes = http.get(
      `${BASE_URL}${API_PREFIX}/assets/${ticker}/fundamentals`,
      { tags: { name: 'asset_fundamentals' } }
    );

    fundamentalsTrend.add(fundamentalsRes.timings.duration);

    const fundamentalsCheck = check(fundamentalsRes, {
      'fundamentals status 200': (r) => r.status === 200,
      'fundamentals has data': (r) => validateFinancialData(r),
      'fundamentals response time OK': (r) => r.timings.duration < 500,
    });

    // Track financial data validity separately
    financialDataValid.add(validateFinancialData(fundamentalsRes));

    apiSuccessRate.add(fundamentalsCheck);
    if (!fundamentalsCheck) errorCount.add(1);
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 5. ASSET PRICES
  // -------------------------------------------------------------------------
  group('Asset Prices', () => {
    const ticker = TEST_TICKERS[0];

    const pricesRes = http.get(
      `${BASE_URL}${API_PREFIX}/assets/${ticker}/prices?days=30`,
      { tags: { name: 'asset_prices' } }
    );

    const pricesCheck = check(pricesRes, {
      'prices status 200': (r) => r.status === 200,
      'prices has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.prices && Array.isArray(body.prices);
        } catch {
          return false;
        }
      },
    });

    apiSuccessRate.add(pricesCheck);
    if (!pricesCheck) errorCount.add(1);
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 6. PORTFOLIOS (Authenticated)
  // -------------------------------------------------------------------------
  group('Portfolios', () => {
    const portfoliosRes = authRequest('GET', `${BASE_URL}${API_PREFIX}/portfolios`);

    const portfoliosCheck = check(portfoliosRes, {
      'portfolios status 200 or 401': (r) => r.status === 200 || r.status === 401,
      'portfolios response time OK': (r) => r.timings.duration < 400,
    });

    apiSuccessRate.add(portfoliosRes.status === 200);
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 7. CROSS-VALIDATION (CRITICAL - Heavy Operation)
  // -------------------------------------------------------------------------
  group('Cross-Validation', () => {
    const ticker = TEST_TICKERS[0];

    const crossValidRes = http.get(
      `${BASE_URL}${API_PREFIX}/cross-validation/${ticker}`,
      { tags: { name: 'cross_validation' } }
    );

    const crossValidCheck = check(crossValidRes, {
      'cross-validation status 200': (r) => r.status === 200,
      'cross-validation has fields': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.fields && Array.isArray(body.fields);
        } catch {
          return false;
        }
      },
      'cross-validation response time OK': (r) => r.timings.duration < 1000,
    });

    apiSuccessRate.add(crossValidCheck);
    if (!crossValidCheck) errorCount.add(1);
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 8. OPTIONS CHAIN (WHEEL Strategy)
  // -------------------------------------------------------------------------
  group('Options Chain', () => {
    const optionsRes = http.get(
      `${BASE_URL}${API_PREFIX}/options/PETR4`,
      { tags: { name: 'options' } }
    );

    const optionsCheck = check(optionsRes, {
      'options status 200 or 404': (r) => r.status === 200 || r.status === 404,
      'options response time OK': (r) => r.timings.duration < 600,
    });

    apiSuccessRate.add(optionsRes.status === 200);
  });

  sleep(1);
}

// =============================================================================
// LIFECYCLE HOOKS
// =============================================================================

/**
 * Setup - runs once at the beginning
 */
export function setup() {
  console.log(`Starting smoke test against ${BASE_URL}`);

  // Verify server is up
  const healthRes = http.get(`${BASE_URL}/health`);
  if (healthRes.status !== 200) {
    throw new Error(`Server health check failed: ${healthRes.status}`);
  }

  return {
    startTime: new Date().toISOString(),
  };
}

/**
 * Teardown - runs once at the end
 */
export function teardown(data) {
  console.log(`Smoke test completed. Started at: ${data.startTime}`);
}

// =============================================================================
// CUSTOM SUMMARY
// =============================================================================

/**
 * Handle summary output
 */
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    duration: data.state.testRunDurationMs,
    vus: data.metrics.vus ? data.metrics.vus.values.max : 0,
    requests: data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
    failed: data.metrics.http_req_failed ? data.metrics.http_req_failed.values.rate : 0,
    p95: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'] : 0,
    thresholds: {
      passed: Object.values(data.root_group.checks || {}).filter(c => c.passes > 0).length,
      failed: Object.values(data.root_group.checks || {}).filter(c => c.fails > 0).length,
    },
  };

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'reports/performance/smoke-test-summary.json': JSON.stringify(summary, null, 2),
  };
}

// Import text summary helper
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
