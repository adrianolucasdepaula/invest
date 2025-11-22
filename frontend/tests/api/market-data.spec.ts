import { test, expect } from '@playwright/test';

/**
 * API Tests: Market Data Endpoints
 * Testa endpoints críticos do backend sem UI
 */

const API_BASE = 'http://localhost:3101/api/v1';

test.describe('Market Data API', () => {
  test.describe.configure({ mode: 'parallel' }); // ✅ Parallel execution

  test('GET /market-data/assets - should return valid assets list', async ({ request }) => {
    const response = await request.get(`${API_BASE}/market-data/assets`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    // Schema validation - primeiro ativo
    const firstAsset = data[0];
    expect(firstAsset).toHaveProperty('ticker');
    expect(firstAsset).toHaveProperty('name');
    expect(firstAsset).toHaveProperty('sector');
    expect(firstAsset.ticker).toMatch(/^[A-Z]{4}[0-9]{1,2}$/); // Ex: PETR4, VALE3

    console.log(`✅ API returned ${data.length} assets`);
  });

  test('GET /market-data/:ticker/prices - should return OHLC data for PETR4', async ({ request }) => {
    const response = await request.get(`${API_BASE}/market-data/PETR4/prices?timeframe=1D&range=1mo`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    // OHLC Schema validation
    const firstCandle = data[0];
    expect(firstCandle).toMatchObject({
      date: expect.any(String),
      open: expect.any(Number),
      high: expect.any(Number),
      low: expect.any(Number),
      close: expect.any(Number),
      volume: expect.any(Number),
    });

    // OHLC Logic validation
    expect(firstCandle.high).toBeGreaterThanOrEqual(firstCandle.open);
    expect(firstCandle.high).toBeGreaterThanOrEqual(firstCandle.close);
    expect(firstCandle.low).toBeLessThanOrEqual(firstCandle.open);
    expect(firstCandle.low).toBeLessThanOrEqual(firstCandle.close);
    expect(firstCandle.volume).toBeGreaterThan(0);

    console.log(`✅ OHLC data validated: ${data.length} candles`);
  });

  test('GET /market-data/:ticker/prices - should respect timeframe parameter', async ({ request }) => {
    // Test 1D timeframe
    const response1D = await request.get(`${API_BASE}/market-data/ABEV3/prices?timeframe=1D&range=1mo`);
    const data1D = await response1D.json();

    // Test 1W timeframe (should return fewer candles)
    const response1W = await request.get(`${API_BASE}/market-data/ABEV3/prices?timeframe=1W&range=1mo`);
    const data1W = await response1W.json();

    // Weekly should have ~4 candles for 1 month (1mo = ~21 daily candles)
    expect(data1W.length).toBeLessThan(data1D.length);
    expect(data1W.length).toBeGreaterThan(0);

    console.log(`✅ Timeframe validation: 1D=${data1D.length} candles, 1W=${data1W.length} candles`);
  });

  test('GET /market-data/:ticker/prices - should return 400 for invalid ticker', async ({ request }) => {
    const response = await request.get(`${API_BASE}/market-data/INVALID999/prices?timeframe=1D&range=1mo`);

    // Should return 4xx error (404 or 400)
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    console.log(`✅ Invalid ticker handled correctly: ${response.status()}`);
  });

  test('GET /market-data/sync-status - should return sync status for all assets', async ({ request }) => {
    const response = await request.get(`${API_BASE}/market-data/sync-status`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();

    if (data.length > 0) {
      const firstStatus = data[0];
      expect(firstStatus).toHaveProperty('ticker');
      expect(firstStatus).toHaveProperty('recordsLoaded');
      expect(firstStatus).toHaveProperty('status');
      expect(['SYNCED', 'SYNCING', 'FAILED', 'PENDING']).toContain(firstStatus.status);

      // Data precision: lastSyncDuration should not be negative (BUG conhecido)
      if (firstStatus.lastSyncDuration !== null && firstStatus.lastSyncDuration !== undefined) {
        expect(firstStatus.lastSyncDuration).toBeGreaterThanOrEqual(0);
      }
    }

    console.log(`✅ Sync status validated: ${data.length} assets`);
  });
});

test.describe('Market Data API - Performance', () => {
  test('endpoints should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();

    await request.get(`${API_BASE}/market-data/assets`);

    const duration = Date.now() - startTime;

    // Critical endpoint should be fast
    expect(duration).toBeLessThan(2000);

    console.log(`✅ Response time: ${duration}ms`);
  });
});
