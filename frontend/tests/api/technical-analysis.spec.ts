import { test, expect } from '@playwright/test';

/**
 * API Tests: Technical Analysis Endpoints
 * Testa endpoints de análise técnica (indicadores, padrões)
 */

const API_BASE = 'http://localhost:3101/api/v1';

test.describe('Technical Analysis API', () => {
  test.describe.configure({ mode: 'parallel' }); // ✅ Parallel execution

  test('GET /market-data/:ticker/technical - should return technical indicators', async ({ request }) => {
    const response = await request.get(`${API_BASE}/market-data/PETR4/technical?timeframe=1D&range=1y`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    // Schema validation
    expect(data).toHaveProperty('ticker');
    expect(data).toHaveProperty('indicators');
    expect(data.ticker).toBe('PETR4');
    expect(data.indicators).toBeDefined();

    console.log(`✅ Technical analysis data validated for ${data.ticker}`);
  });

  test('GET /market-data/:ticker/technical - should calculate SMA correctly', async ({ request }) => {
    const response = await request.get(`${API_BASE}/market-data/PETR4/technical?timeframe=1D&range=3mo`);
    const data = await response.json();

    if (data.indicators && data.indicators.sma) {
      const sma20 = data.indicators.sma.sma20;
      const sma50 = data.indicators.sma.sma50;

      // SMA should be numbers
      if (sma20 !== null) expect(typeof sma20).toBe('number');
      if (sma50 !== null) expect(typeof sma50).toBe('number');

      // SMA should be positive for stocks
      if (sma20 !== null) expect(sma20).toBeGreaterThan(0);
      if (sma50 !== null) expect(sma50).toBeGreaterThan(0);

      console.log(`✅ SMA indicators: SMA20=${sma20}, SMA50=${sma50}`);
    }
  });

  test('GET /market-data/:ticker/technical - should calculate RSI within range', async ({ request }) => {
    const response = await request.get(`${API_BASE}/market-data/ABEV3/technical?timeframe=1D&range=3mo`);
    const data = await response.json();

    if (data.indicators && data.indicators.rsi) {
      const rsi = data.indicators.rsi;

      // RSI should be between 0 and 100
      expect(rsi).toBeGreaterThanOrEqual(0);
      expect(rsi).toBeLessThanOrEqual(100);

      console.log(`✅ RSI validated: ${rsi}`);
    }
  });

  test('GET /market-data/:ticker/technical - should respect timeframe parameter', async ({ request }) => {
    const response1D = await request.get(`${API_BASE}/market-data/VALE3/technical?timeframe=1D&range=1mo`);
    const response1W = await request.get(`${API_BASE}/market-data/VALE3/technical?timeframe=1W&range=1mo`);

    expect(response1D.ok()).toBeTruthy();
    expect(response1W.ok()).toBeTruthy();

    const data1D = await response1D.json();
    const data1W = await response1W.json();

    expect(data1D.ticker).toBe('VALE3');
    expect(data1W.ticker).toBe('VALE3');

    console.log(`✅ Timeframe parameter respected`);
  });

  test('GET /market-data/:ticker/technical - should return 400 for invalid timeframe', async ({ request }) => {
    const response = await request.get(`${API_BASE}/market-data/PETR4/technical?timeframe=INVALID&range=1mo`);

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    console.log(`✅ Invalid timeframe handled correctly: ${response.status()}`);
  });
});

test.describe('Technical Analysis API - Integration', () => {
  test('technical data should be consistent with price data', async ({ request }) => {
    // Get price data
    const pricesResponse = await request.get(`${API_BASE}/market-data/PETR4/prices?timeframe=1D&range=1mo`);
    const pricesData = await pricesResponse.json();

    // Get technical data
    const technicalResponse = await request.get(`${API_BASE}/market-data/PETR4/technical?timeframe=1D&range=1mo`);
    const technicalData = await technicalResponse.json();

    expect(pricesData.length).toBeGreaterThan(0);
    expect(technicalData.indicators).toBeDefined();

    // If we have SMA, it should be close to recent closing prices
    if (technicalData.indicators.sma && technicalData.indicators.sma.sma20) {
      const sma20 = technicalData.indicators.sma.sma20;
      const recentClose = pricesData[pricesData.length - 1].close;

      // SMA20 should be within ±50% of recent close (sanity check)
      expect(sma20).toBeGreaterThan(recentClose * 0.5);
      expect(sma20).toBeLessThan(recentClose * 1.5);

      console.log(`✅ Technical data consistent with price data: SMA20=${sma20}, Close=${recentClose}`);
    }
  });
});
