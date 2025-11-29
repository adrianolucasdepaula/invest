import { test, expect, Page } from '@playwright/test';

/**
 * VALIDACAO DE PAGINAS - 2025-11-29
 * Testa todas as paginas e captura screenshots
 */

// Armazenar erros de console para relatorio
const consoleErrors: { page: string; errors: string[] }[] = [];

// Helper para capturar console errors
async function setupConsoleCapture(page: Page, pageName: string) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    errors.push(`[PAGE ERROR] ${error.message}`);
  });
  return errors;
}

// ============================================================================
// PAGINAS PUBLICAS
// ============================================================================

test.describe('Paginas Publicas', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Homepage (/)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'homepage');

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/01-homepage.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'homepage', errors });
    expect(page.url()).toBeTruthy();
  });

  test('Login Page (/login)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'login');

    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/02-login.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'login', errors });
    expect(page.url()).toContain('login');
  });

  test('Register Page (/register)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'register');

    await page.goto('/register', { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/03-register.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'register', errors });
    expect(page.url()).toContain('register');
  });
});

// ============================================================================
// PAGINAS DO DASHBOARD
// ============================================================================

test.describe('Dashboard Pages', () => {

  test('Dashboard (/dashboard)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'dashboard');

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/04-dashboard.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'dashboard', errors });
  });

  test('Assets List (/assets)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'assets');

    await page.goto('/assets', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/05-assets.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'assets', errors });
  });

  test('Asset Detail (/assets/PETR4)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'asset-detail');

    await page.goto('/assets/PETR4', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/06-asset-petr4.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'asset-detail', errors });
  });

  test('Analysis (/analysis)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'analysis');

    await page.goto('/analysis', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/07-analysis.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'analysis', errors });
  });

  test('Portfolio (/portfolio)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'portfolio');

    await page.goto('/portfolio', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/08-portfolio.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'portfolio', errors });
  });

  test('Reports (/reports)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'reports');

    await page.goto('/reports', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/09-reports.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'reports', errors });
  });

  test('Data Sources (/data-sources)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'data-sources');

    await page.goto('/data-sources', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/10-data-sources.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'data-sources', errors });
  });

  test('Data Management (/data-management)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'data-management');

    await page.goto('/data-management', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/11-data-management.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'data-management', errors });
  });

  test('OAuth Manager (/oauth-manager)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'oauth-manager');

    await page.goto('/oauth-manager', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/12-oauth-manager.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'oauth-manager', errors });
  });

  test('Settings (/settings)', async ({ page }) => {
    const errors = await setupConsoleCapture(page, 'settings');

    await page.goto('/settings', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Screenshot
    await page.screenshot({
      path: 'test-results/screenshots/13-settings.png',
      fullPage: true
    });

    consoleErrors.push({ page: 'settings', errors });
  });
});

// ============================================================================
// RELATORIO FINAL
// ============================================================================

test.describe('Relatorio', () => {
  test('Gerar relatorio de erros', async ({ page }) => {
    const report = {
      timestamp: new Date().toISOString(),
      totalPages: consoleErrors.length,
      consoleErrors: consoleErrors,
      summary: {
        pagesWithConsoleErrors: consoleErrors.filter(p => p.errors.length > 0).length,
        totalConsoleErrors: consoleErrors.reduce((sum, p) => sum + p.errors.length, 0),
      }
    };

    console.log('\n========================================');
    console.log('RELATORIO DE VALIDACAO');
    console.log('========================================');
    console.log(`Total de paginas testadas: ${report.totalPages}`);
    console.log(`Paginas com erros de console: ${report.summary.pagesWithConsoleErrors}`);
    console.log(`Total de erros de console: ${report.summary.totalConsoleErrors}`);
    console.log('========================================\n');

    for (const p of consoleErrors) {
      if (p.errors.length > 0) {
        console.log(`\n[${p.page}] Console Errors:`);
        p.errors.forEach(e => console.log(`  - ${e}`));
      }
    }

    // Screenshot final
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.screenshot({
      path: 'test-results/screenshots/14-final.png',
      fullPage: true
    });
  });
});
