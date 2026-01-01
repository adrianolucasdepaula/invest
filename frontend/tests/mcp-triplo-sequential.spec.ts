import { test, expect, Page } from '@playwright/test';

/**
 * MCP TRIPLO VALIDATION - SEQUENTIAL EXECUTION
 * Single test that validates all 4 TIER 1 pages sequentially
 * to avoid timeout issues with parallel execution
 */

test.setTimeout(600000); // 10 minutes total

interface PageValidation {
  page: string;
  url: string;
  loadTimeMs: number;
  status: 'PASS' | 'FAIL';
  consoleErrors: string[];
  networkErrors: { url: string; status: number }[];
  checks: { name: string; passed: boolean; detail?: string }[];
}

test('MCP TRIPLO - Complete TIER 1 Validation', async ({ page }) => {
  const results: PageValidation[] = [];

  // === HELPER FUNCTIONS ===
  const consoleErrors: string[] = [];
  const networkErrors: { url: string; status: number }[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter out known non-critical errors
      if (!text.includes('Download the React DevTools') &&
          !text.includes('favicon') &&
          !text.includes('[HMR]') &&
          !text.includes('tradingview') &&
          !text.includes('TradingView') &&
          !text.includes('support-portal-problems')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    // Filter out known external widget errors
    if (status >= 400 &&
        !url.includes('tradingview') &&
        !url.includes('TradingView')) {
      networkErrors.push({ url, status });
    }
  });

  function resetErrors() {
    consoleErrors.length = 0;
    networkErrors.length = 0;
  }

  async function navigateTo(url: string): Promise<number> {
    resetErrors();
    const start = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000); // Let React render
    return Date.now() - start;
  }

  // === 1. DASHBOARD ===
  console.log('\n========== 1. DASHBOARD ==========\n');
  let dashboardResult: PageValidation = {
    page: 'Dashboard',
    url: '/dashboard',
    loadTimeMs: 0,
    status: 'PASS',
    consoleErrors: [],
    networkErrors: [],
    checks: []
  };

  try {
    dashboardResult.loadTimeMs = await navigateTo('http://localhost:3100/dashboard');
    console.log(`Load time: ${dashboardResult.loadTimeMs}ms`);

    // Check 1: Title
    const hasTitle = await page.locator('h1').filter({ hasText: /Dashboard/i }).isVisible().catch(() => false);
    dashboardResult.checks.push({ name: 'Title visible', passed: hasTitle });
    console.log(`Title visible: ${hasTitle}`);

    // Check 2: Stat cards
    const statCardCount = await page.locator('text=/Ibovespa|Ativos Rastreados|Maiores Altas|Variação/i').count();
    dashboardResult.checks.push({ name: 'Stat cards present', passed: statCardCount >= 2, detail: `${statCardCount} found` });
    console.log(`Stat cards: ${statCardCount}`);

    // Check 3: Chart section
    const hasChart = await page.locator('text=/Ibovespa.*Últimos|Gráfico/i').first().isVisible().catch(() => false);
    dashboardResult.checks.push({ name: 'Chart section visible', passed: hasChart });
    console.log(`Chart section: ${hasChart}`);

    // Check 4: Ticker data
    const hasTickers = await page.locator('text=/PETR4|VALE3|ITUB4/i').first().isVisible().catch(() => false);
    dashboardResult.checks.push({ name: 'Ticker data present', passed: hasTickers });
    console.log(`Ticker data: ${hasTickers}`);

    // Screenshot
    await page.screenshot({ path: 'docs/screenshots/dashboard-mcp-triplo-2025-12-31.png', fullPage: true });
    console.log('Screenshot saved');

    dashboardResult.consoleErrors = [...consoleErrors];
    dashboardResult.networkErrors = [...networkErrors];
    dashboardResult.status = dashboardResult.checks.every(c => c.passed) && consoleErrors.length === 0 ? 'PASS' : 'FAIL';

  } catch (e) {
    dashboardResult.status = 'FAIL';
    dashboardResult.checks.push({ name: 'Page load', passed: false, detail: String(e) });
  }

  results.push(dashboardResult);
  console.log(`Dashboard result: ${dashboardResult.status}`);
  console.log(`Console errors: ${dashboardResult.consoleErrors.length}`);
  console.log(`Network errors: ${dashboardResult.networkErrors.length}`);

  // === 2. ASSETS ===
  console.log('\n========== 2. ASSETS ==========\n');
  let assetsResult: PageValidation = {
    page: 'Assets',
    url: '/assets',
    loadTimeMs: 0,
    status: 'PASS',
    consoleErrors: [],
    networkErrors: [],
    checks: []
  };

  try {
    assetsResult.loadTimeMs = await navigateTo('http://localhost:3100/assets');
    await page.waitForTimeout(5000); // Extra wait for 861 assets
    console.log(`Load time: ${assetsResult.loadTimeMs}ms`);

    // Check 1: Title
    const hasTitle = await page.locator('h1').filter({ hasText: /Ativos/i }).isVisible().catch(() => false);
    assetsResult.checks.push({ name: 'Title visible', passed: hasTitle });
    console.log(`Title visible: ${hasTitle}`);

    // Check 2: Search input
    const hasSearch = await page.getByPlaceholder(/Buscar/i).first().isVisible().catch(() => false);
    assetsResult.checks.push({ name: 'Search input visible', passed: hasSearch });
    console.log(`Search input: ${hasSearch}`);

    // Check 3: Sort options
    const hasSortOptions = await page.locator('text=/Ticker|Ordenar|A-Z/i').first().isVisible().catch(() => false);
    assetsResult.checks.push({ name: 'Sort options visible', passed: hasSortOptions });
    console.log(`Sort options: ${hasSortOptions}`);

    // Check 4: Asset data
    const hasPETR4 = await page.locator('text=PETR4').first().isVisible().catch(() => false);
    assetsResult.checks.push({ name: 'PETR4 visible', passed: hasPETR4 });
    console.log(`PETR4 visible: ${hasPETR4}`);

    // Screenshot
    await page.screenshot({ path: 'docs/screenshots/assets-mcp-triplo-2025-12-31.png', fullPage: true });
    console.log('Screenshot saved');

    assetsResult.consoleErrors = [...consoleErrors];
    assetsResult.networkErrors = [...networkErrors];
    assetsResult.status = assetsResult.checks.every(c => c.passed) && consoleErrors.length === 0 ? 'PASS' : 'FAIL';

  } catch (e) {
    assetsResult.status = 'FAIL';
    assetsResult.checks.push({ name: 'Page load', passed: false, detail: String(e) });
  }

  results.push(assetsResult);
  console.log(`Assets result: ${assetsResult.status}`);
  console.log(`Console errors: ${assetsResult.consoleErrors.length}`);
  console.log(`Network errors: ${assetsResult.networkErrors.length}`);

  // === 3. ASSET DETAIL (PETR4) ===
  console.log('\n========== 3. ASSET DETAIL (PETR4) ==========\n');
  let assetDetailResult: PageValidation = {
    page: 'Asset Detail (PETR4)',
    url: '/assets/PETR4',
    loadTimeMs: 0,
    status: 'PASS',
    consoleErrors: [],
    networkErrors: [],
    checks: []
  };

  try {
    assetDetailResult.loadTimeMs = await navigateTo('http://localhost:3100/assets/PETR4');
    await page.waitForTimeout(5000); // Wait for chart to render
    console.log(`Load time: ${assetDetailResult.loadTimeMs}ms`);

    // Check 1: Ticker name visible
    const hasTicker = await page.locator('text=PETR4').first().isVisible().catch(() => false);
    assetDetailResult.checks.push({ name: 'PETR4 ticker visible', passed: hasTicker });
    console.log(`PETR4 visible: ${hasTicker}`);

    // Check 2: Price visible
    const hasPrice = await page.locator('text=/R\\$\\s*[\\d,]+/i').first().isVisible().catch(() => false);
    assetDetailResult.checks.push({ name: 'Price visible', passed: hasPrice });
    console.log(`Price visible: ${hasPrice}`);

    // Check 3: Chart/canvas present
    const hasChart = await page.locator('canvas').first().isVisible().catch(() => false);
    assetDetailResult.checks.push({ name: 'Chart canvas visible', passed: hasChart });
    console.log(`Chart canvas: ${hasChart}`);

    // Check 4: Technical indicators checkboxes present (not tabs)
    const indicatorCount = await page.locator('text=/SMA20|SMA50|RSI|MACD|BOLLINGER/i').count();
    assetDetailResult.checks.push({ name: 'Technical indicators present', passed: indicatorCount > 0, detail: `${indicatorCount} indicators` });
    console.log(`Technical indicators: ${indicatorCount}`);

    // Screenshot
    await page.screenshot({ path: 'docs/screenshots/asset-petr4-mcp-triplo-2025-12-31.png', fullPage: true });
    console.log('Screenshot saved');

    assetDetailResult.consoleErrors = [...consoleErrors];
    assetDetailResult.networkErrors = [...networkErrors];
    assetDetailResult.status = assetDetailResult.checks.every(c => c.passed) && consoleErrors.length === 0 ? 'PASS' : 'FAIL';

  } catch (e) {
    assetDetailResult.status = 'FAIL';
    assetDetailResult.checks.push({ name: 'Page load', passed: false, detail: String(e) });
  }

  results.push(assetDetailResult);
  console.log(`Asset Detail result: ${assetDetailResult.status}`);
  console.log(`Console errors: ${assetDetailResult.consoleErrors.length}`);
  console.log(`Network errors: ${assetDetailResult.networkErrors.length}`);

  // === 4. PORTFOLIO ===
  console.log('\n========== 4. PORTFOLIO ==========\n');
  let portfolioResult: PageValidation = {
    page: 'Portfolio',
    url: '/portfolio',
    loadTimeMs: 0,
    status: 'PASS',
    consoleErrors: [],
    networkErrors: [],
    checks: []
  };

  try {
    portfolioResult.loadTimeMs = await navigateTo('http://localhost:3100/portfolio');
    console.log(`Load time: ${portfolioResult.loadTimeMs}ms`);

    // Check 1: Title
    const hasTitle = await page.locator('h1').filter({ hasText: /Portfólio|Carteira/i }).isVisible().catch(() => false);
    portfolioResult.checks.push({ name: 'Title visible', passed: hasTitle });
    console.log(`Title visible: ${hasTitle}`);

    // Check 2: Create Portfolio button (shown in empty state)
    const hasCreateButton = await page.getByRole('button', { name: /Criar Portfólio/i }).isVisible().catch(() => false);
    portfolioResult.checks.push({ name: 'Create Portfolio button visible', passed: hasCreateButton });
    console.log(`Create Portfolio button: ${hasCreateButton}`);

    // Check 3: Import button
    const hasImportButton = await page.getByRole('button', { name: /Importar/i }).isVisible().catch(() => false);
    portfolioResult.checks.push({ name: 'Import button visible', passed: hasImportButton });
    console.log(`Import button: ${hasImportButton}`);

    // Check 4: Dialog opens correctly when clicking Create Portfolio
    if (hasCreateButton) {
      await page.getByRole('button', { name: /Criar Portfólio/i }).click();
      await page.waitForTimeout(500);
      const dialogVisible = await page.getByRole('dialog').isVisible().catch(() => false);
      portfolioResult.checks.push({ name: 'Create Portfolio dialog opens', passed: dialogVisible });
      console.log(`Dialog opens: ${dialogVisible}`);

      // Check form fields (Name field for new portfolio)
      const hasNameField = await page.getByLabel(/Nome/i).isVisible().catch(() => false);
      portfolioResult.checks.push({ name: 'Name field visible', passed: hasNameField });

      // Close dialog
      await page.keyboard.press('Escape');
    }

    // Screenshot
    await page.screenshot({ path: 'docs/screenshots/portfolio-mcp-triplo-2025-12-31.png', fullPage: true });
    console.log('Screenshot saved');

    portfolioResult.consoleErrors = [...consoleErrors];
    portfolioResult.networkErrors = [...networkErrors];
    portfolioResult.status = portfolioResult.checks.every(c => c.passed) && consoleErrors.length === 0 ? 'PASS' : 'FAIL';

  } catch (e) {
    portfolioResult.status = 'FAIL';
    portfolioResult.checks.push({ name: 'Page load', passed: false, detail: String(e) });
  }

  results.push(portfolioResult);
  console.log(`Portfolio result: ${portfolioResult.status}`);
  console.log(`Console errors: ${portfolioResult.consoleErrors.length}`);
  console.log(`Network errors: ${portfolioResult.networkErrors.length}`);

  // === FINAL REPORT ===
  console.log('\n\n========================================');
  console.log('       MCP TRIPLO - FINAL REPORT');
  console.log('========================================\n');

  for (const result of results) {
    console.log(`\n${result.page} (${result.url})`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Load Time: ${result.loadTimeMs}ms`);
    console.log(`  Console Errors: ${result.consoleErrors.length}`);
    if (result.consoleErrors.length > 0) {
      result.consoleErrors.forEach(e => console.log(`    - ${e}`));
    }
    console.log(`  Network Errors: ${result.networkErrors.length}`);
    if (result.networkErrors.length > 0) {
      result.networkErrors.forEach(e => console.log(`    - ${e.url}: ${e.status}`));
    }
    console.log(`  Checks:`);
    result.checks.forEach(c => console.log(`    [${c.passed ? 'PASS' : 'FAIL'}] ${c.name}${c.detail ? ` (${c.detail})` : ''}`));
  }

  const allPassed = results.every(r => r.status === 'PASS');
  console.log('\n========================================');
  console.log(`       OVERALL: ${allPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
  console.log('========================================\n');

  // Assert all tests passed
  for (const result of results) {
    expect(result.consoleErrors.length, `${result.page} should have 0 console errors`).toBe(0);
    expect(result.networkErrors.filter(e => e.status >= 500).length, `${result.page} should have 0 server errors`).toBe(0);
    for (const check of result.checks) {
      expect(check.passed, `${result.page}: ${check.name}`).toBeTruthy();
    }
  }
});
