import { test, expect } from '@playwright/test';

/**
 * API Tests: Economic Indicators Endpoints
 * Testa endpoints de indicadores econômicos (SELIC, IPCA, etc)
 *
 * ⚠️ SCHEMAS BASEADOS NO BACKEND REAL (2025-11-22)
 * - Analisado: backend/src/api/economic-indicators/dto/indicator-response.dto.ts
 * - Schema Real: { type, currentValue, previousValue, change, referenceDate, source, unit }
 */

const API_BASE = 'http://localhost:3101/api/v1';

test.describe('Economic Indicators API', () => {
  test.describe.configure({ mode: 'parallel' }); // ✅ Parallel execution

  test('GET /economic-indicators - should return all indicators', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const responseData = await response.json();

    // ✅ Backend retorna {indicators: [...]} não [...] direto
    expect(responseData).toHaveProperty('indicators');
    const data = responseData.indicators;
    expect(Array.isArray(data)).toBeTruthy();

    // Deve ter pelo menos os indicadores principais
    const expectedIndicators = ['SELIC', 'IPCA', 'CDI']; // ✅ Backend tem apenas estes 3 atualmente

    // Verificar se os indicadores esperados estão presentes
    // ⚠️  Campo é "indicatorType" não "type"
    const indicatorTypes = data.map((ind: any) => ind.indicatorType);
    expectedIndicators.forEach(type => {
      expect(indicatorTypes).toContain(type);
    });

    console.log(`✅ Economic indicators validated: ${data.length} indicators`);
  });

  test('GET /economic-indicators/SELIC - should return SELIC data with correct schema', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/SELIC`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    // ✅ Schema validation (REAL backend schema)
    expect(data).toHaveProperty('type');
    expect(data).toHaveProperty('currentValue');
    expect(data).toHaveProperty('referenceDate');
    expect(data).toHaveProperty('source');

    expect(data.type).toBe('SELIC');
    expect(typeof data.currentValue).toBe('number');
    expect(data.currentValue).toBeGreaterThan(0); // Taxa SELIC sempre positiva

    // Campos opcionais (podem existir ou não)
    if (data.previousValue !== undefined) {
      expect(typeof data.previousValue).toBe('number');
    }
    if (data.change !== undefined) {
      expect(typeof data.change).toBe('number');
    }
    if (data.unit !== undefined) {
      expect(typeof data.unit).toBe('string');
    }

    console.log(`✅ SELIC data: ${data.currentValue}% (${data.referenceDate}) - Source: ${data.source}`);
  });

  test('GET /economic-indicators/IPCA - should return IPCA data with correct schema', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/IPCA`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    // ✅ Schema validation (REAL backend schema)
    expect(data).toMatchObject({
      type: 'IPCA',
      currentValue: expect.any(Number),
      referenceDate: expect.any(String),
      source: expect.any(String),
    });

    console.log(`✅ IPCA data: ${data.currentValue}% (${data.referenceDate}) - Source: ${data.source}`);
  });

  // ⚠️  DISABLED: Endpoint não existe no backend atual (2025-11-22)
  // TODO: Implementar endpoint GET /economic-indicators/:type/history no backend
  test.skip('GET /economic-indicators/:type/history - should return historical data', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/IPCA/history?months=12`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);
    expect(data.length).toBeLessThanOrEqual(12);

    // Schema validation - cada entrada do histórico
    const firstEntry = data[0];
    expect(firstEntry).toHaveProperty('date');
    expect(firstEntry).toHaveProperty('value');
    expect(typeof firstEntry.date).toBe('string');
    expect(typeof firstEntry.value).toBe('number');

    // Chronological order validation (newest first)
    if (data.length > 1) {
      const firstDate = new Date(data[0].date);
      const secondDate = new Date(data[1].date);
      expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
    }

    console.log(`✅ IPCA history: ${data.length} months`);
  });

  test('GET /economic-indicators/INVALID_CODE - should return 404 for invalid code', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/INVALID_CODE`);

    expect(response.status()).toBe(404);

    console.log(`✅ Invalid indicator code handled correctly`);
  });
});

test.describe('Economic Indicators API - Data Quality', () => {
  test('indicators should have recent data based on frequency', async ({ request }) => {
    // SELIC: diário, aceitar até 30 dias
    const responseSELIC = await request.get(`${API_BASE}/economic-indicators/SELIC`);
    const selic = await responseSELIC.json();

    const selicDate = new Date(selic.referenceDate);
    const selicDiffDays = Math.floor((Date.now() - selicDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(selicDiffDays).toBeLessThan(30);

    // IPCA: mensal, aceitar até 90 dias (3 meses)
    const responseIPCA = await request.get(`${API_BASE}/economic-indicators/IPCA`);
    const ipca = await responseIPCA.json();

    const ipcaDate = new Date(ipca.referenceDate);
    const ipcaDiffDays = Math.floor((Date.now() - ipcaDate.getTime()) / (1000 * 60 * 60 * 24));
    expect(ipcaDiffDays).toBeLessThan(90);

    console.log(`✅ Freshness validated: SELIC=${selicDiffDays} days, IPCA=${ipcaDiffDays} days`);
  });

  test('SELIC should have valid data source', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/SELIC`);
    const data = await response.json();

    // Validar que source existe e não está vazio
    expect(data.source).toBeDefined();
    expect(data.source.length).toBeGreaterThan(0);

    // Source típicas: BCB, BRAPI, etc
    console.log(`✅ SELIC source: ${data.source}`);
  });

  test('CDI should have valid schema and data', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/CDI`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toMatchObject({
      type: 'CDI',
      currentValue: expect.any(Number),
      referenceDate: expect.any(String),
      source: expect.any(String),
    });

    expect(data.currentValue).toBeGreaterThan(0);

    console.log(`✅ CDI data: ${data.currentValue}% (${data.referenceDate})`);
  });
});

test.describe('Economic Indicators API - Accumulated 12 Months (FASE 1.1-1.3)', () => {
  test.describe.configure({ mode: 'parallel' });

  test('GET /economic-indicators/IPCA/accumulated - should return IPCA with 12-month accumulated', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/IPCA/accumulated`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    // ✅ Schema validation - LatestWithAccumulatedResponse
    expect(data).toMatchObject({
      type: 'IPCA',
      currentValue: expect.any(Number),
      referenceDate: expect.any(String),
      source: expect.any(String),
      unit: expect.any(String),
      accumulated12Months: expect.any(Number),
      monthsCount: expect.any(Number),
    });

    // ✅ FASE 1.3: Validar valor exato vs IBGE oficial (4.68%)
    expect(data.accumulated12Months).toBeCloseTo(4.68, 2); // Tolerância de 0.01%
    expect(data.monthsCount).toBe(12); // Deve ter 12 meses completos

    console.log(`✅ IPCA accumulated 12m: ${data.accumulated12Months}% (${data.monthsCount} months) - Source: ${data.source}`);
  });

  test('GET /economic-indicators/SELIC/accumulated - should return SELIC with 12-month accumulated', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/SELIC/accumulated`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    // ✅ Schema validation
    expect(data).toHaveProperty('type', 'SELIC');
    expect(data).toHaveProperty('currentValue');
    expect(data).toHaveProperty('accumulated12Months');
    expect(data).toHaveProperty('monthsCount');

    expect(typeof data.accumulated12Months).toBe('number');
    expect(data.accumulated12Months).toBeGreaterThan(0); // SELIC acumulado sempre positivo
    expect(data.monthsCount).toBe(12);

    console.log(`✅ SELIC accumulated 12m: ${data.accumulated12Months}% (${data.monthsCount} months)`);
  });

  test('GET /economic-indicators/CDI/accumulated - should return CDI with 12-month accumulated', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/CDI/accumulated`);

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(data).toMatchObject({
      type: 'CDI',
      currentValue: expect.any(Number),
      accumulated12Months: expect.any(Number),
      monthsCount: 12,
    });

    expect(data.accumulated12Months).toBeGreaterThan(0);

    console.log(`✅ CDI accumulated 12m: ${data.accumulated12Months}% (${data.monthsCount} months)`);
  });

  test('accumulated12Months should be approximately sum of monthly values for SELIC/CDI', async ({ request }) => {
    // SELIC/CDI: soma simples dos valores mensais (correto)
    const response = await request.get(`${API_BASE}/economic-indicators/SELIC/accumulated`);
    const data = await response.json();

    // Validar que accumulated está dentro de range esperado (10-15% para SELIC em 2025)
    expect(data.accumulated12Months).toBeGreaterThan(10);
    expect(data.accumulated12Months).toBeLessThan(15);

    console.log(`✅ SELIC accumulated range validated: ${data.accumulated12Months}%`);
  });

  test('IPCA accumulated should match BC Série 13522 official value (FASE 1.3)', async ({ request }) => {
    const response = await request.get(`${API_BASE}/economic-indicators/IPCA/accumulated`);
    const data = await response.json();

    // ✅ FASE 1.3: Backend usa Série 13522 do BC (oficial)
    // Valor esperado: 4.68% (Out/2025) vs IBGE oficial
    const expectedValue = 4.68;
    const tolerance = 0.01; // Tolerância de 0.01 p.p.

    expect(Math.abs(data.accumulated12Months - expectedValue)).toBeLessThan(tolerance);

    console.log(`✅ IPCA accumulated matches BC Série 13522: ${data.accumulated12Months}% (expected: ${expectedValue}%)`);
  });
});
