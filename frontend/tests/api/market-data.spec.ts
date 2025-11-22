import { test, expect } from '@playwright/test';

/**
 * API Tests: Market Data Endpoints
 * Testa endpoints críticos do backend sem UI
 *
 * ⚠️ SCHEMAS BASEADOS NO BACKEND REAL (2025-11-22)
 * - Analisado: backend/src/database/entities/asset.entity.ts
 * - Analisado: backend/src/api/market-data/dto/sync-status-response.dto.ts
 * - Analisado: backend/src/api/market-data/interfaces/price-data.interface.ts
 */

const API_BASE = 'http://localhost:3101/api/v1';

test.describe('Market Data API', () => {
  test.describe.configure({ mode: 'parallel' }); // ✅ Parallel execution

  test('GET /assets - should return valid assets list with correct schema', async ({ request }) => {
    const response = await request.get(`${API_BASE}/assets`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    // ✅ Schema validation (REAL backend schema - Asset entity)
    const firstAsset = data[0];
    expect(firstAsset).toHaveProperty('ticker');
    expect(firstAsset).toHaveProperty('name');
    expect(firstAsset).toHaveProperty('type');
    expect(firstAsset).toHaveProperty('sector');

    // Type validation (REAL values: 'stock', 'fii', 'etf', 'bdr', NOT uppercase)
    expect(firstAsset.type).toMatch(/^(stock|fii|etf|bdr|option|future|crypto|fixed_income)$/);

    // Ticker validation (formato B3: ABCD4, ABCD3, etc)
    expect(firstAsset.ticker).toMatch(/^[A-Z]{4}[0-9]{1,2}$/);

    console.log(`✅ API returned ${data.length} assets (Schema: ticker, name, type, sector)`);
  });

  test('GET /market-data/:ticker/prices - should return OHLC data with correct schema', async ({ request }) => {
    const response = await request.get(`${API_BASE}/market-data/PETR4/prices?timeframe=1D&range=1mo`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    // ✅ OHLC Schema validation (REAL backend schema - PriceDataPoint)
    const firstCandle = data[0];
    expect(firstCandle).toMatchObject({
      date: expect.any(String),
      open: expect.any(Number),
      high: expect.any(Number),
      low: expect.any(Number),
      close: expect.any(Number),
      volume: expect.any(Number),
    });

    // Date format validation (ISO 8601: YYYY-MM-DD)
    expect(firstCandle.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const candleDate = new Date(firstCandle.date);
    expect(candleDate.toString()).not.toBe('Invalid Date');
    expect(candleDate.getTime()).toBeGreaterThan(new Date('2020-01-01').getTime());
    expect(candleDate.getTime()).toBeLessThanOrEqual(Date.now());

    // Decimal precision validation (preços: max 2 casas, volume: inteiro)
    const checkDecimalPlaces = (value: number, maxPlaces: number) => {
      const str = value.toString();
      const decimalPart = str.split('.')[1] || '';
      return decimalPart.length <= maxPlaces;
    };

    expect(checkDecimalPlaces(firstCandle.open, 2)).toBeTruthy();
    expect(checkDecimalPlaces(firstCandle.high, 2)).toBeTruthy();
    expect(checkDecimalPlaces(firstCandle.low, 2)).toBeTruthy();
    expect(checkDecimalPlaces(firstCandle.close, 2)).toBeTruthy();

    // Volume: deve ser inteiro (0 casas decimais)
    expect(Number.isInteger(firstCandle.volume)).toBeTruthy();
    expect(firstCandle.volume % 1).toBe(0);

    // OHLC Logic validation
    expect(firstCandle.high).toBeGreaterThanOrEqual(firstCandle.open);
    expect(firstCandle.high).toBeGreaterThanOrEqual(firstCandle.close);
    expect(firstCandle.low).toBeLessThanOrEqual(firstCandle.open);
    expect(firstCandle.low).toBeLessThanOrEqual(firstCandle.close);
    expect(firstCandle.volume).toBeGreaterThan(0);

    console.log(`✅ OHLC data validated: ${data.length} candles (Date format: ISO 8601)`);
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

  test('GET /market-data/:ticker/prices - should return correct candle count for ranges', async ({ request }) => {
    // 1mo = ~21 dias úteis (permitir variação ±5 para feriados)
    const response1mo = await request.get(`${API_BASE}/market-data/PETR4/prices?timeframe=1D&range=1mo`);
    const data1mo = await response1mo.json();
    expect(data1mo.length).toBeGreaterThanOrEqual(16); // 21 - 5
    expect(data1mo.length).toBeLessThanOrEqual(26);    // 21 + 5

    // 3mo = ~63 dias úteis
    const response3mo = await request.get(`${API_BASE}/market-data/PETR4/prices?timeframe=1D&range=3mo`);
    const data3mo = await response3mo.json();
    expect(data3mo.length).toBeGreaterThanOrEqual(58); // 63 - 5
    expect(data3mo.length).toBeLessThanOrEqual(68);    // 63 + 5

    // 1y = ~252 dias úteis (permitir variação ±10)
    const response1y = await request.get(`${API_BASE}/market-data/PETR4/prices?timeframe=1D&range=1y`);
    const data1y = await response1y.json();
    expect(data1y.length).toBeGreaterThanOrEqual(242); // 252 - 10
    expect(data1y.length).toBeLessThanOrEqual(262);    // 252 + 10

    console.log(`✅ Data ranges validated: 1mo=${data1mo.length}, 3mo=${data3mo.length}, 1y=${data1y.length}`);
  });

  test('GET /market-data/:ticker/prices - should return error for invalid ticker', async ({ request }) => {
    const response = await request.get(`${API_BASE}/market-data/INVALID999/prices?timeframe=1D&range=1mo`);

    // ⚠️ Backend currently returns 500 (Internal Server Error) for invalid tickers
    // TODO: Backend should return 404 (Not Found) or 400 (Bad Request) instead
    expect(response.status()).toBeGreaterThanOrEqual(400);

    console.log(`✅ Invalid ticker handled: ${response.status()}`);
  });

  test('GET /market-data/sync-status - should return sync status with correct schema', async ({ request }) => {
    const response = await request.get(`${API_BASE}/market-data/sync-status`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    // ✅ Schema validation (REAL backend schema - SyncStatusResponseDto)
    expect(data).toHaveProperty('assets');
    expect(data).toHaveProperty('summary');
    expect(Array.isArray(data.assets)).toBeTruthy();

    // Validar summary
    expect(data.summary).toMatchObject({
      total: expect.any(Number),
      synced: expect.any(Number),
      pending: expect.any(Number),
      failed: expect.any(Number),
    });

    if (data.assets.length > 0) {
      const firstStatus = data.assets[0];

      // ✅ Schema validation (REAL backend schema - AssetSyncStatusDto)
      expect(firstStatus).toHaveProperty('ticker');
      expect(firstStatus).toHaveProperty('name');
      expect(firstStatus).toHaveProperty('recordsLoaded');
      expect(firstStatus).toHaveProperty('oldestDate');
      expect(firstStatus).toHaveProperty('newestDate');
      expect(firstStatus).toHaveProperty('status');
      expect(firstStatus).toHaveProperty('lastSyncAt');
      expect(firstStatus).toHaveProperty('lastSyncDuration');

      // Status validation (REAL enum values)
      expect(['SYNCED', 'PENDING', 'PARTIAL', 'FAILED']).toContain(firstStatus.status);

      // Data quality: lastSyncDuration should not be negative
      if (firstStatus.lastSyncDuration !== null && firstStatus.lastSyncDuration !== undefined) {
        expect(firstStatus.lastSyncDuration).toBeGreaterThanOrEqual(0);
      }
    }

    console.log(`✅ Sync status validated: ${data.assets.length} assets, Summary: ${JSON.stringify(data.summary)}`);
  });
});

test.describe('Market Data API - Performance', () => {
  test('endpoints should respond within 2 seconds', async ({ request }) => {
    const startTime = Date.now();

    await request.get(`${API_BASE}/assets`);

    const duration = Date.now() - startTime;

    // Critical endpoint should be fast
    expect(duration).toBeLessThan(2000);

    console.log(`✅ Response time: ${duration}ms`);
  });
});
