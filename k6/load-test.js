/**
 * k6 Load Test - Performance Testing
 *
 * Comprehensive load test for production-like scenarios.
 * Tests system behavior under sustained load and stress conditions.
 *
 * Grafana k6 is 100% FREE (AGPL 3.0 License)
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @see k6 Docs: https://grafana.com/docs/k6/latest/
 * @license FREE (AGPL 3.0)
 *
 * Usage:
 * k6 run k6/load-test.js
 * k6 run k6/load-test.js --env SCENARIO=stress
 * k6 run k6/load-test.js --out json=results.json
 */

import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { SharedArray } from 'k6/data';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Load test scenarios
const SCENARIOS = {
  // Standard load test: gradual ramp to sustained load
  load: {
    stages: [
      { duration: '2m', target: 20 },   // Ramp up to 20 users
      { duration: '5m', target: 20 },   // Hold at 20 users
      { duration: '2m', target: 50 },   // Ramp up to 50 users
      { duration: '5m', target: 50 },   // Hold at 50 users
      { duration: '2m', target: 0 },    // Ramp down
    ],
  },
  // Stress test: push system to limits
  stress: {
    stages: [
      { duration: '2m', target: 30 },   // Ramp up
      { duration: '3m', target: 30 },   // Hold
      { duration: '2m', target: 60 },   // Push higher
      { duration: '3m', target: 60 },   // Hold
      { duration: '2m', target: 100 },  // Maximum load
      { duration: '5m', target: 100 },  // Sustain maximum
      { duration: '3m', target: 0 },    // Ramp down
    ],
  },
  // Spike test: sudden traffic spike
  spike: {
    stages: [
      { duration: '1m', target: 10 },   // Baseline
      { duration: '30s', target: 100 }, // Spike!
      { duration: '2m', target: 100 },  // Hold spike
      { duration: '30s', target: 10 },  // Return to baseline
      { duration: '2m', target: 10 },   // Recovery check
      { duration: '30s', target: 0 },   // Ramp down
    ],
  },
  // Soak test: extended duration
  soak: {
    stages: [
      { duration: '5m', target: 30 },   // Ramp up
      { duration: '30m', target: 30 },  // Extended duration
      { duration: '5m', target: 0 },    // Ramp down
    ],
  },
};

// Select scenario based on environment variable
const scenarioName = __ENV.SCENARIO || 'load';
const selectedScenario = SCENARIOS[scenarioName] || SCENARIOS.load;

/**
 * Test configuration
 */
export const options = {
  stages: selectedScenario.stages,

  // Performance thresholds (SLOs for Financial System)
  thresholds: {
    // General thresholds
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],  // 95% < 2s, 99% < 5s
    http_req_failed: ['rate<0.05'],                   // Error rate < 5%

    // Endpoint-specific thresholds (CRITICAL for financial system)
    'http_req_duration{name:assets_list}': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{name:asset_detail}': ['p(95)<600', 'p(99)<1200'],
    'http_req_duration{name:asset_fundamentals}': ['p(95)<800', 'p(99)<1500'],
    'http_req_duration{name:asset_prices}': ['p(95)<1000', 'p(99)<2000'],
    'http_req_duration{name:portfolios}': ['p(95)<600', 'p(99)<1200'],
    'http_req_duration{name:cross_validation}': ['p(95)<2000', 'p(99)<4000'],
    'http_req_duration{name:options}': ['p(95)<1000', 'p(99)<2000'],
    'http_req_duration{name:health}': ['p(95)<200', 'p(99)<500'],

    // Custom metrics
    'api_success_rate': ['rate>0.95'],       // 95% success rate
    'financial_data_valid': ['rate>0.90'],   // 90% data validity under load
    'database_response': ['p(95)<500'],      // DB-heavy endpoints
    'cache_hit_rate': ['rate>0.70'],         // Cache should help under load
  },
};

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3101';
const API_PREFIX = '/api/v1';

// Test data with variety
const TEST_TICKERS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'RENT3', 'SUZB3', 'GGBR4', 'JBSS3'];
const TEST_ASSET_TYPES = ['ACAO', 'FII', 'BDR', 'ETF'];

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
const crossValidationTrend = new Trend('cross_validation_duration');
const databaseResponseTrend = new Trend('database_response');
// Cache metrics
const cacheHitRate = new Rate('cache_hit_rate');
// Error counter
const errorCount = new Counter('errors');
// Active users gauge
const activeUsers = new Gauge('active_users');

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
  } else if (method === 'PUT') {
    return http.put(url, JSON.stringify(body), params);
  } else if (method === 'DELETE') {
    return http.del(url, params);
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

    // Check data integrity
    const hasValidNumbers =
      (data.pl === null || typeof data.pl === 'number') &&
      (data.pvp === null || typeof data.pvp === 'number');

    return (hasRequiredFields || hasCrossValidation) && hasValidNumbers;
  } catch {
    return false;
  }
}

/**
 * Check if response indicates cache hit
 */
function isCacheHit(response) {
  const cacheHeader = response.headers['X-Cache'] || response.headers['x-cache'];
  return cacheHeader === 'HIT' || response.timings.duration < 50;
}

/**
 * Random selection from array
 */
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Random integer between min and max
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =============================================================================
// TEST SCENARIOS
// =============================================================================

export default function () {
  activeUsers.add(__VU);

  // -------------------------------------------------------------------------
  // 1. HEALTH CHECK (lightweight, always first)
  // -------------------------------------------------------------------------
  group('Health Check', () => {
    const healthRes = http.get(`${BASE_URL}/health`, {
      tags: { name: 'health' },
    });

    const healthCheck = check(healthRes, {
      'health status 200': (r) => r.status === 200,
      'health response fast': (r) => r.timings.duration < 200,
    });

    apiSuccessRate.add(healthCheck);
    if (!healthCheck) errorCount.add(1);
  });

  sleep(0.3);

  // -------------------------------------------------------------------------
  // 2. ASSETS LIST (high frequency endpoint)
  // -------------------------------------------------------------------------
  group('Assets List', () => {
    const page = randomInt(1, 5);
    const limit = randomInt(10, 50);

    const assetsRes = http.get(
      `${BASE_URL}${API_PREFIX}/assets?page=${page}&limit=${limit}`,
      { tags: { name: 'assets_list' } }
    );

    assetListTrend.add(assetsRes.timings.duration);
    cacheHitRate.add(isCacheHit(assetsRes));

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
      'assets has pagination': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.meta && body.meta.total !== undefined;
        } catch {
          return false;
        }
      },
    });

    apiSuccessRate.add(assetsCheck);
    if (!assetsCheck) errorCount.add(1);
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 3. ASSET DETAIL (medium frequency)
  // -------------------------------------------------------------------------
  group('Asset Detail', () => {
    const ticker = randomItem(TEST_TICKERS);

    const detailRes = http.get(`${BASE_URL}${API_PREFIX}/assets/${ticker}`, {
      tags: { name: 'asset_detail' },
    });

    databaseResponseTrend.add(detailRes.timings.duration);

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
      'asset has required fields': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.name && body.type;
        } catch {
          return false;
        }
      },
    });

    apiSuccessRate.add(detailCheck);
    if (!detailCheck) errorCount.add(1);
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 4. ASSET FUNDAMENTALS (CRITICAL - Financial Data)
  // -------------------------------------------------------------------------
  group('Asset Fundamentals', () => {
    const ticker = randomItem(TEST_TICKERS);

    const fundamentalsRes = http.get(
      `${BASE_URL}${API_PREFIX}/assets/${ticker}/fundamentals`,
      { tags: { name: 'asset_fundamentals' } }
    );

    fundamentalsTrend.add(fundamentalsRes.timings.duration);

    const fundamentalsCheck = check(fundamentalsRes, {
      'fundamentals status 200': (r) => r.status === 200,
      'fundamentals has data': (r) => validateFinancialData(r),
    });

    // Track financial data validity separately
    financialDataValid.add(validateFinancialData(fundamentalsRes));

    apiSuccessRate.add(fundamentalsCheck);
    if (!fundamentalsCheck) errorCount.add(1);
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 5. ASSET PRICES (Historical data - can be heavy)
  // -------------------------------------------------------------------------
  group('Asset Prices', () => {
    const ticker = randomItem(TEST_TICKERS);
    const days = randomItem([7, 30, 90, 365]);

    const pricesRes = http.get(
      `${BASE_URL}${API_PREFIX}/assets/${ticker}/prices?days=${days}`,
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
  // 6. PORTFOLIOS (Authenticated - User specific)
  // -------------------------------------------------------------------------
  group('Portfolios', () => {
    const portfoliosRes = authRequest('GET', `${BASE_URL}${API_PREFIX}/portfolios`);

    const portfoliosCheck = check(portfoliosRes, {
      'portfolios status 200 or 401': (r) => r.status === 200 || r.status === 401,
    });

    if (portfoliosRes.status === 200) {
      apiSuccessRate.add(true);
    }
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 7. CROSS-VALIDATION (CRITICAL - Heavy Operation)
  // -------------------------------------------------------------------------
  group('Cross-Validation', () => {
    const ticker = randomItem(TEST_TICKERS);

    const crossValidRes = http.get(
      `${BASE_URL}${API_PREFIX}/cross-validation/${ticker}`,
      { tags: { name: 'cross_validation' } }
    );

    crossValidationTrend.add(crossValidRes.timings.duration);

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
      'cross-validation has confidence': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.summary && body.summary.averageConfidence !== undefined;
        } catch {
          return false;
        }
      },
    });

    apiSuccessRate.add(crossValidCheck);
    if (!crossValidCheck) errorCount.add(1);
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 8. OPTIONS CHAIN (WHEEL Strategy)
  // -------------------------------------------------------------------------
  group('Options Chain', () => {
    const ticker = randomItem(['PETR4', 'VALE3', 'ITUB4', 'BBDC4']);

    const optionsRes = http.get(
      `${BASE_URL}${API_PREFIX}/options/${ticker}`,
      { tags: { name: 'options' } }
    );

    const optionsCheck = check(optionsRes, {
      'options status 200 or 404': (r) => r.status === 200 || r.status === 404,
    });

    if (optionsRes.status === 200) {
      const greeksCheck = check(optionsRes, {
        'options has greeks': (r) => {
          try {
            const body = JSON.parse(r.body);
            if (body.options && body.options.length > 0) {
              const opt = body.options[0];
              return opt.delta !== undefined && opt.theta !== undefined;
            }
            return true;
          } catch {
            return false;
          }
        },
      });
      apiSuccessRate.add(greeksCheck);
    }
  });

  sleep(0.5);

  // -------------------------------------------------------------------------
  // 9. SEARCH (Dynamic, can trigger DB scans)
  // -------------------------------------------------------------------------
  group('Search', () => {
    const searchTerm = randomItem(['PETR', 'VALE', 'BANCO', 'PETRO', 'ITAU']);

    const searchRes = http.get(
      `${BASE_URL}${API_PREFIX}/assets/search?q=${searchTerm}`,
      { tags: { name: 'search' } }
    );

    const searchCheck = check(searchRes, {
      'search status 200': (r) => r.status === 200 || r.status === 404,
    });

    apiSuccessRate.add(searchCheck);
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
  console.log(`Starting load test (${scenarioName} scenario) against ${BASE_URL}`);
  console.log(`Stages: ${JSON.stringify(selectedScenario.stages)}`);

  // Verify server is up
  const healthRes = http.get(`${BASE_URL}/health`);
  if (healthRes.status !== 200) {
    fail(`Server health check failed: ${healthRes.status}`);
  }

  return {
    startTime: new Date().toISOString(),
    scenario: scenarioName,
  };
}

/**
 * Teardown - runs once at the end
 */
export function teardown(data) {
  console.log(`Load test (${data.scenario}) completed. Started at: ${data.startTime}`);
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
    scenario: scenarioName,
    duration: data.state.testRunDurationMs,
    vus: {
      max: data.metrics.vus ? data.metrics.vus.values.max : 0,
      min: data.metrics.vus ? data.metrics.vus.values.min : 0,
    },
    requests: {
      total: data.metrics.http_reqs ? data.metrics.http_reqs.values.count : 0,
      rate: data.metrics.http_reqs ? data.metrics.http_reqs.values.rate : 0,
    },
    errors: {
      rate: data.metrics.http_req_failed ? data.metrics.http_req_failed.values.rate : 0,
      count: data.metrics.errors ? data.metrics.errors.values.count : 0,
    },
    latency: {
      p50: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(50)'] : 0,
      p95: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(95)'] : 0,
      p99: data.metrics.http_req_duration ? data.metrics.http_req_duration.values['p(99)'] : 0,
      avg: data.metrics.http_req_duration ? data.metrics.http_req_duration.values.avg : 0,
      max: data.metrics.http_req_duration ? data.metrics.http_req_duration.values.max : 0,
    },
    thresholds: {
      passed: Object.entries(data.root_group.checks || {}).filter(([_, c]) => c.passes > 0).length,
      failed: Object.entries(data.root_group.checks || {}).filter(([_, c]) => c.fails > 0).length,
    },
    financialMetrics: {
      dataValidityRate: data.metrics.financial_data_valid ? data.metrics.financial_data_valid.values.rate : 0,
      crossValidationP95: data.metrics.cross_validation_duration ?
        data.metrics.cross_validation_duration.values['p(95)'] : 0,
    },
  };

  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    [`reports/performance/load-test-${scenarioName}-summary.json`]: JSON.stringify(summary, null, 2),
  };
}

// Import text summary helper
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.2/index.js';
