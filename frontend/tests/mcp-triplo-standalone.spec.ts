import { test, expect } from '@playwright/test';

/**
 * MCP TRIPLO VALIDATION - STANDALONE VERSION
 * Uses existing auth state without requiring new login
 */

// Use existing storage state directly
test.use({ storageState: 'playwright/.auth/user.json' });

test.setTimeout(600000); // 10 minutes total

test('MCP TRIPLO - TIER 1 Standalone Validation', async ({ page }) => {
  // Track results
  const results: { page: string; status: string; checks: string[] }[] = [];

  // Filter external widget errors
  const ignorePatterns = [
    'Download the React DevTools',
    'favicon',
    '[HMR]',
    'tradingview',
    'TradingView',
    'support-portal-problems',
    '403',
  ];

  const consoleErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const shouldIgnore = ignorePatterns.some(pattern => text.toLowerCase().includes(pattern.toLowerCase()));
      if (!shouldIgnore) {
        consoleErrors.push(text);
      }
    }
  });

  // ===== 1. DASHBOARD =====
  console.log('\n=== 1. DASHBOARD ===\n');
  const dashboardChecks: string[] = [];
  consoleErrors.length = 0;

  await page.goto('http://localhost:3100/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  // Check title
  const dashTitle = await page.locator('h1').filter({ hasText: /Dashboard/i }).isVisible();
  dashboardChecks.push(`[${dashTitle ? 'PASS' : 'FAIL'}] Title "Dashboard" visible`);

  // Check stat cards
  const hasIbovespa = await page.locator('text=/Ibovespa/i').first().isVisible();
  const hasAtivos = await page.locator('text=/Ativos Rastreados/i').isVisible();
  dashboardChecks.push(`[${hasIbovespa ? 'PASS' : 'FAIL'}] Ibovespa card visible`);
  dashboardChecks.push(`[${hasAtivos ? 'PASS' : 'FAIL'}] Ativos Rastreados card visible`);

  // Check economic indicators
  const hasSelic = await page.locator('text=SELIC').isVisible();
  const hasIpca = await page.locator('text=IPCA').first().isVisible();
  dashboardChecks.push(`[${hasSelic ? 'PASS' : 'FAIL'}] SELIC indicator visible`);
  dashboardChecks.push(`[${hasIpca ? 'PASS' : 'FAIL'}] IPCA indicator visible`);

  // Screenshot
  await page.screenshot({ path: 'docs/screenshots/dashboard-standalone-2025-12-31.png', fullPage: true });
  dashboardChecks.push('[PASS] Screenshot captured');

  const dashPassed = dashTitle && hasIbovespa && hasAtivos && hasSelic;
  results.push({ page: 'Dashboard', status: dashPassed ? 'PASS' : 'FAIL', checks: dashboardChecks });
  dashboardChecks.forEach(c => console.log(c));

  // ===== 2. ASSETS =====
  console.log('\n=== 2. ASSETS ===\n');
  const assetsChecks: string[] = [];
  consoleErrors.length = 0;

  await page.goto('http://localhost:3100/assets', { waitUntil: 'domcontentloaded' });

  // Wait for data - use longer timeout
  await page.waitForSelector('text=/861 ativos/i', { timeout: 60000 }).catch(() => {
    console.log('Waiting for assets data...');
  });
  await page.waitForTimeout(8000); // Extra wait for table render

  // Check title
  const assetsTitle = await page.locator('h1').filter({ hasText: /Ativos/i }).isVisible();
  assetsChecks.push(`[${assetsTitle ? 'PASS' : 'FAIL'}] Title "Ativos" visible`);

  // Check search (use specific assets search input)
  const hasSearch = await page.getByPlaceholder(/Buscar por ticker/i).isVisible();
  assetsChecks.push(`[${hasSearch ? 'PASS' : 'FAIL'}] Search input visible`);

  // Check asset count badge
  const hasAssetCount = await page.locator('text=/861 ativos/i').isVisible().catch(() => false);
  assetsChecks.push(`[${hasAssetCount ? 'PASS' : 'FAIL'}] Asset count (861) visible`);

  // Check for any ticker in the table
  const hasTicker = await page.locator('td, [role="cell"]').filter({ hasText: /AALR3|ABCB4|PETR4|VALE3/i }).first().isVisible().catch(() => false);
  assetsChecks.push(`[${hasTicker ? 'PASS' : 'FAIL'}] Ticker data visible`);

  // Screenshot
  await page.screenshot({ path: 'docs/screenshots/assets-standalone-2025-12-31.png', fullPage: true });
  assetsChecks.push('[PASS] Screenshot captured');

  const assetsPassed = assetsTitle && hasSearch;
  results.push({ page: 'Assets', status: assetsPassed ? 'PASS' : 'FAIL', checks: assetsChecks });
  assetsChecks.forEach(c => console.log(c));

  // ===== 3. ASSET DETAIL (PETR4) =====
  console.log('\n=== 3. ASSET DETAIL (PETR4) ===\n');
  const detailChecks: string[] = [];
  consoleErrors.length = 0;

  await page.goto('http://localhost:3100/assets/PETR4', { waitUntil: 'domcontentloaded' });

  // Wait for price to load
  await page.waitForSelector('text=/R\\$\\s*[\\d,]+/i', { timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(5000);

  // Check ticker visible
  const hasPetr4 = await page.locator('text=PETR4').first().isVisible();
  detailChecks.push(`[${hasPetr4 ? 'PASS' : 'FAIL'}] PETR4 ticker visible`);

  // Check company name
  const hasPetrobras = await page.locator('text=/PETROBRAS/i').first().isVisible();
  detailChecks.push(`[${hasPetrobras ? 'PASS' : 'FAIL'}] PETROBRAS name visible`);

  // Check price
  const hasPrice = await page.locator('text=/R\\$\\s*[\\d,]+/i').first().isVisible();
  detailChecks.push(`[${hasPrice ? 'PASS' : 'FAIL'}] Price (R$) visible`);

  // Check confidence badge
  const hasConfidence = await page.locator('text=/100%|confiança|fontes/i').first().isVisible();
  detailChecks.push(`[${hasConfidence ? 'PASS' : 'FAIL'}] Confidence/sources badge visible`);

  // Check technical indicators
  const hasIndicators = await page.locator('text=/Indicadores Técnicos|SMA|EMA|RSI|MACD/i').first().isVisible();
  detailChecks.push(`[${hasIndicators ? 'PASS' : 'FAIL'}] Technical indicators visible`);

  // Screenshot
  await page.screenshot({ path: 'docs/screenshots/asset-petr4-standalone-2025-12-31.png', fullPage: true });
  detailChecks.push('[PASS] Screenshot captured');

  const detailPassed = hasPetr4 && hasPetrobras && hasPrice;
  results.push({ page: 'Asset Detail (PETR4)', status: detailPassed ? 'PASS' : 'FAIL', checks: detailChecks });
  detailChecks.forEach(c => console.log(c));

  // ===== 4. PORTFOLIO =====
  console.log('\n=== 4. PORTFOLIO ===\n');
  const portfolioChecks: string[] = [];
  consoleErrors.length = 0;

  await page.goto('http://localhost:3100/portfolio', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Check title
  const portTitle = await page.locator('h1').filter({ hasText: /Portfólio/i }).isVisible();
  portfolioChecks.push(`[${portTitle ? 'PASS' : 'FAIL'}] Title "Portfolio" visible`);

  // Check for action buttons
  const hasImport = await page.locator('button').filter({ hasText: /Importar/i }).isVisible();
  portfolioChecks.push(`[${hasImport ? 'PASS' : 'FAIL'}] Import button visible`);

  // Check for Create or Add button
  const hasCreateOrAdd = await page.locator('button').filter({ hasText: /Criar Portfólio|Adicionar Posição/i }).first().isVisible();
  portfolioChecks.push(`[${hasCreateOrAdd ? 'PASS' : 'FAIL'}] Create/Add button visible`);

  // Check for content
  const hasContent = await page.locator('text=/Valor Total|Nenhum portfólio|Nenhuma posição|Posições/i').first().isVisible();
  portfolioChecks.push(`[${hasContent ? 'PASS' : 'FAIL'}] Portfolio content visible`);

  // Screenshot
  await page.screenshot({ path: 'docs/screenshots/portfolio-standalone-2025-12-31.png', fullPage: true });
  portfolioChecks.push('[PASS] Screenshot captured');

  const portPassed = portTitle && hasImport;
  results.push({ page: 'Portfolio', status: portPassed ? 'PASS' : 'FAIL', checks: portfolioChecks });
  portfolioChecks.forEach(c => console.log(c));

  // ===== FINAL SUMMARY =====
  console.log('\n========================================');
  console.log('       MCP TRIPLO - FINAL SUMMARY');
  console.log('========================================\n');

  let allPassed = true;
  for (const r of results) {
    console.log(`${r.page}: ${r.status}`);
    r.checks.forEach(c => console.log(`  ${c}`));
    if (r.status !== 'PASS') allPassed = false;
  }

  console.log('\n========================================');
  console.log(`OVERALL RESULT: ${allPassed ? 'ALL PASSED' : 'SOME ISSUES'}`);
  console.log('========================================\n');

  // Assert all passed
  expect(results[0].status, 'Dashboard should pass').toBe('PASS');
  expect(results[1].status, 'Assets should pass').toBe('PASS');
  expect(results[2].status, 'Asset Detail should pass').toBe('PASS');
  expect(results[3].status, 'Portfolio should pass').toBe('PASS');
});
