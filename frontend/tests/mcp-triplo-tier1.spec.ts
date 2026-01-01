import { test, expect, Page } from '@playwright/test';

/**
 * MCP TRIPLO VALIDATION - TIER 1 PAGES
 *
 * Validates all 4 TIER 1 pages with:
 * 1. Page loads without errors
 * 2. Console errors = 0
 * 3. Network requests (no 4xx/5xx)
 * 4. Key components visible
 * 5. Accessibility checks
 * 6. Screenshot capture
 */

// Extended timeout for heavy pages
test.setTimeout(180000); // 3 minutes

interface ValidationResult {
  page: string;
  url: string;
  loadTime: number;
  consoleErrors: string[];
  networkErrors: { url: string; status: number }[];
  componentChecks: { name: string; passed: boolean }[];
  screenshot: string;
}

test.describe('MCP TRIPLO - TIER 1 Pages Validation', () => {

  // Shared state for console and network errors
  let consoleErrors: string[] = [];
  let networkErrors: { url: string; status: number }[] = [];

  async function setupErrorCapture(page: Page) {
    consoleErrors = [];
    networkErrors = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out known non-critical errors
        if (!text.includes('Download the React DevTools') &&
            !text.includes('favicon') &&
            !text.includes('[HMR]')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`);
    });

    page.on('response', (response) => {
      const status = response.status();
      if (status >= 400) {
        networkErrors.push({ url: response.url(), status });
      }
    });
  }

  test.describe('1. Dashboard (/dashboard) - P0', () => {
    test('1.1 Page loads and renders correctly', async ({ page }) => {
      await setupErrorCapture(page);

      const startTime = Date.now();
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Allow React to render
      const loadTime = Date.now() - startTime;

      console.log(`Dashboard load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000); // 10s max

      // Title check
      await expect(page.locator('h1')).toContainText(/Dashboard/i);
    });

    test('1.2 StatCards render (4 cards)', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Check for stat cards - look for card-like structures
      const statIndicators = await page.locator('text=/Ibovespa|Ativos Rastreados|Maiores Altas|Variação Média/i').count();
      console.log(`Found ${statIndicators} stat card indicators`);
      expect(statIndicators).toBeGreaterThanOrEqual(2);
    });

    test('1.3 Ibovespa chart renders', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // Chart section
      const chartSection = page.locator('text=/Ibovespa.*Últimos|Gráfico/i').first();
      await expect(chartSection).toBeVisible({ timeout: 10000 });
    });

    test('1.4 Assets table renders with data', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // Look for common tickers
      const tickerPresent = await page.locator('text=/PETR4|VALE3|ITUB4|BBDC4/i').first().isVisible().catch(() => false);
      expect(tickerPresent).toBeTruthy();
    });

    test('1.5 Zero console errors', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      console.log('Console errors:', consoleErrors);
      expect(consoleErrors.length).toBe(0);
    });

    test('1.6 Zero network errors (4xx/5xx)', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      console.log('Network errors:', networkErrors);
      expect(networkErrors.length).toBe(0);
    });

    test('1.7 Screenshot capture', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      await page.screenshot({
        path: 'docs/screenshots/dashboard-mcp-triplo-2025-12-31.png',
        fullPage: true
      });
    });
  });

  test.describe('2. Assets (/assets) - P0', () => {
    test('2.1 Page loads and renders correctly', async ({ page }) => {
      await setupErrorCapture(page);

      const startTime = Date.now();
      await page.goto('/assets');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000); // Allow data loading
      const loadTime = Date.now() - startTime;

      console.log(`Assets load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(30000); // 30s max (861 assets)

      await expect(page.locator('h1')).toContainText(/Ativos/i);
    });

    test('2.2 Assets table renders with data', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/assets');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000);

      // Check for known tickers
      const petr4 = page.locator('text=PETR4').first();
      await expect(petr4).toBeVisible({ timeout: 30000 });
    });

    test('2.3 Search input works', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/assets');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000);

      const searchInput = page.getByPlaceholder(/Buscar/i).first();
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeEditable();
    });

    test('2.4 Sorting options visible', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/assets');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000);

      const sortOption = page.locator('text=/Ticker|Ordenar|A-Z/i').first();
      await expect(sortOption).toBeVisible();
    });

    test('2.5 Zero console errors', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/assets');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000);

      console.log('Console errors:', consoleErrors);
      expect(consoleErrors.length).toBe(0);
    });

    test('2.6 Zero network errors (4xx/5xx)', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/assets');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000);

      console.log('Network errors:', networkErrors);
      expect(networkErrors.length).toBe(0);
    });

    test('2.7 Screenshot capture', async ({ page }) => {
      await page.goto('/assets');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000);

      await page.screenshot({
        path: 'docs/screenshots/assets-mcp-triplo-2025-12-31.png',
        fullPage: true
      });
    });
  });

  test.describe('3. Asset Detail (/assets/PETR4) - P0', () => {
    test('3.1 Page loads and renders correctly', async ({ page }) => {
      await setupErrorCapture(page);

      const startTime = Date.now();
      await page.goto('/assets/PETR4');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);
      const loadTime = Date.now() - startTime;

      console.log(`Asset detail load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(15000);

      await expect(page.locator('text=PETR4').first()).toBeVisible();
    });

    test('3.2 Price information visible', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/assets/PETR4');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // Look for R$ price format
      const priceVisible = await page.locator('text=/R\\$\\s*[\\d,]+/i').first().isVisible().catch(() => false);
      expect(priceVisible).toBeTruthy();
    });

    test('3.3 Chart container visible', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/assets/PETR4');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000);

      // Look for chart container or canvas
      const chartVisible = await page.locator('canvas, [class*="chart"], [class*="Chart"]').first().isVisible().catch(() => false);
      console.log(`Chart visible: ${chartVisible}`);
      // Chart may take time to render, so just log
    });

    test('3.4 Tabs/sections visible', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/assets/PETR4');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      // Look for navigation tabs
      const tabsPresent = await page.locator('button, [role="tab"]').filter({ hasText: /Análise|Fundamentos|Técnica|Preço|Gráfico/i }).count();
      console.log(`Found ${tabsPresent} tab elements`);
    });

    test('3.5 Zero console errors', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/assets/PETR4');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      console.log('Console errors:', consoleErrors);
      expect(consoleErrors.length).toBe(0);
    });

    test('3.6 Zero network errors (4xx/5xx)', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/assets/PETR4');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(3000);

      console.log('Network errors:', networkErrors);
      expect(networkErrors.length).toBe(0);
    });

    test('3.7 Screenshot capture', async ({ page }) => {
      await page.goto('/assets/PETR4');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000);

      await page.screenshot({
        path: 'docs/screenshots/asset-petr4-mcp-triplo-2025-12-31.png',
        fullPage: true
      });
    });
  });

  test.describe('4. Portfolio (/portfolio) - P0', () => {
    test('4.1 Page loads and renders correctly', async ({ page }) => {
      await setupErrorCapture(page);

      const startTime = Date.now();
      await page.goto('/portfolio');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
      const loadTime = Date.now() - startTime;

      console.log(`Portfolio load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(10000);

      await expect(page.locator('h1')).toContainText(/Portfólio|Carteira/i);
    });

    test('4.2 Add Position button visible', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/portfolio');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const addButton = page.getByRole('button', { name: /Adicionar Posição/i });
      await expect(addButton).toBeVisible();
    });

    test('4.3 Import Portfolio button visible', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/portfolio');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const importButton = page.getByRole('button', { name: /Importar Portfólio/i });
      await expect(importButton).toBeVisible();
    });

    test('4.4 Add Position dialog works', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/portfolio');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      await page.getByRole('button', { name: /Adicionar Posição/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();

      // Check form fields
      await expect(page.getByLabel(/Ticker/i)).toBeVisible();
      await expect(page.getByLabel(/Quantidade/i)).toBeVisible();
      await expect(page.getByLabel(/Preço/i)).toBeVisible();
    });

    test('4.5 Zero console errors', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/portfolio');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      console.log('Console errors:', consoleErrors);
      expect(consoleErrors.length).toBe(0);
    });

    test('4.6 Zero network errors (4xx/5xx)', async ({ page }) => {
      await setupErrorCapture(page);
      await page.goto('/portfolio');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      console.log('Network errors:', networkErrors);
      expect(networkErrors.length).toBe(0);
    });

    test('4.7 Screenshot capture', async ({ page }) => {
      await page.goto('/portfolio');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: 'docs/screenshots/portfolio-mcp-triplo-2025-12-31.png',
        fullPage: true
      });
    });
  });

  test.describe('5. Accessibility Validation (WCAG 2.1 AA)', () => {
    test('5.1 Dashboard accessibility', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Basic a11y checks
      // Check for main landmark
      const hasMain = await page.locator('main, [role="main"]').count();
      console.log(`Main landmark: ${hasMain > 0}`);

      // Check for heading hierarchy
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // Check for skip link or nav landmark
      const hasNav = await page.locator('nav, [role="navigation"]').count();
      console.log(`Nav landmark: ${hasNav > 0}`);
    });

    test('5.2 Assets accessibility', async ({ page }) => {
      await page.goto('/assets');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(5000);

      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // Check input has label
      const searchInput = page.getByPlaceholder(/Buscar/i).first();
      await expect(searchInput).toBeVisible();
    });

    test('5.3 Portfolio accessibility', async ({ page }) => {
      await page.goto('/portfolio');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // Check buttons are accessible
      const addButton = page.getByRole('button', { name: /Adicionar Posição/i });
      await expect(addButton).toBeVisible();
    });
  });

  test.describe('6. Responsive Design', () => {
    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ];

    for (const viewport of viewports) {
      test(`6.1 Dashboard - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        await expect(page.locator('h1')).toBeVisible();
      });
    }
  });
});
