import { test, expect } from '@playwright/test';

/**
 * API Tests: Economic Indicators Endpoints
 * Testa endpoints de indicadores econômicos (SELIC, IPCA, etc)
 */

const API_BASE = 'http://localhost:3101/api/v1';

test.describe('Economic Indicators API', () => {
  test.describe.configure({ mode: 'parallel' }); // ✅ Parallel execution

  test('GET /economic-indicators - should return all indicators', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();

    // Deve ter pelo menos os indicadores principais
    const expectedIndicators = ['SELIC', 'IPCA', 'CDI', 'IGPM'];
    const indicatorCodes = data.map((ind: any) => ind.code);

    expectedIndicators.forEach(code => {
      expect(indicatorCodes).toContain(code);
    });

    console.log(`✅ Economic indicators validated: ${data.length} indicators`);
  });

  test('GET /economic-indicators/:code - should return SELIC data', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/SELIC`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    // Schema validation
    expect(data).toHaveProperty('code');
    expect(data).toHaveProperty('name');
    expect(data).toHaveProperty('value');
    expect(data).toHaveProperty('date');
    expect(data.code).toBe('SELIC');
    expect(data.value).toBeGreaterThan(0); // Taxa SELIC sempre positiva

    console.log(`✅ SELIC data: ${data.value}% (${data.date})`);
  });

  test('GET /economic-indicators/:code/history - should return historical data', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/IPCA/history?months=12`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data.length).toBeLessThanOrEqual(12);

    // Schema validation
    const firstEntry = data[0];
    expect(firstEntry).toMatchObject({
      date: expect.any(String),
      value: expect.any(Number),
    });

    // Chronological order validation (newest first)
    if (data.length > 1) {
      const firstDate = new Date(data[0].date);
      const secondDate = new Date(data[1].date);
      expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
    }

    console.log(`✅ IPCA history: ${data.length} months`);
  });

  test('GET /economic-indicators/:code - should return 404 for invalid code', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/INVALID_CODE`);

    expect(response.status()).toBe(404);

    console.log(`✅ Invalid indicator code handled correctly`);
  });
});

test.describe('Economic Indicators API - Data Quality', () => {
  test('indicators should have recent data (< 60 days old)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/SELIC`);
    const data = await response.json();

    const indicatorDate = new Date(data.date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - indicatorDate.getTime()) / (1000 * 60 * 60 * 24));

    // Data should be recent (< 60 days)
    expect(diffDays).toBeLessThan(60);

    console.log(`✅ Data freshness: ${diffDays} days old`);
  });
});
