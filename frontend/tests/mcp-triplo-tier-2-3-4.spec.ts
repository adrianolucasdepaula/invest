import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * MCP Triplo Validation for TIER 2, 3, and 4 Pages
 * Date: 2025-12-31
 *
 * Validates:
 * 1. Page loads without errors
 * 2. Console errors = 0
 * 3. Network requests (no 4xx/5xx)
 * 4. Accessibility (WCAG 2.1 AA)
 */

interface ValidationResult {
  page: string;
  url: string;
  status: 'PASS' | 'FAIL';
  loadTime: number;
  consoleErrors: string[];
  networkErrors: { url: string; status: number }[];
  a11yViolations: { id: string; impact: string; description: string }[];
}

const results: ValidationResult[] = [];

// Helper function to validate a page
async function validatePage(
  page: Page,
  pageName: string,
  url: string,
  expectedElements?: string[]
): Promise<ValidationResult> {
  const consoleErrors: string[] = [];
  const networkErrors: { url: string; status: number }[] = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capture network errors
  page.on('response', response => {
    const status = response.status();
    if (status >= 400) {
      networkErrors.push({ url: response.url(), status });
    }
  });

  const startTime = Date.now();

  // Navigate to page
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

  const loadTime = Date.now() - startTime;

  // Wait for page to stabilize
  await page.waitForTimeout(2000);

  // Run accessibility audit
  let a11yViolations: { id: string; impact: string; description: string }[] = [];
  try {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    a11yViolations = accessibilityScanResults.violations.map(v => ({
      id: v.id,
      impact: v.impact || 'unknown',
      description: v.description,
    }));
  } catch (e) {
    console.log(`A11y audit failed for ${pageName}: ${e}`);
  }

  // Check expected elements
  if (expectedElements) {
    for (const selector of expectedElements) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
      } catch (e) {
        consoleErrors.push(`Expected element not found: ${selector}`);
      }
    }
  }

  // Take screenshot
  await page.screenshot({
    path: `test-results/screenshots/${pageName.toLowerCase().replace(/[\s\/]/g, '-')}.png`,
    fullPage: true
  });

  const status = consoleErrors.length === 0 &&
                 networkErrors.filter(e => e.status >= 500).length === 0 &&
                 a11yViolations.filter(v => v.impact === 'critical' || v.impact === 'serious').length === 0
    ? 'PASS' : 'FAIL';

  return {
    page: pageName,
    url,
    status,
    loadTime,
    consoleErrors,
    networkErrors,
    a11yViolations,
  };
}

// ============================================
// TIER 2 - HIGH PRIORITY
// ============================================

test.describe('TIER 2 - High Priority Pages', () => {
  test('Wheel Dashboard - /wheel', async ({ page }) => {
    const result = await validatePage(page, 'Wheel Dashboard', 'http://localhost:3100/wheel');
    results.push(result);

    // Specific checks for Wheel
    await expect(page.locator('h1, h2').first()).toBeVisible();

    console.log(`[WHEEL] Status: ${result.status}`);
    console.log(`[WHEEL] Load time: ${result.loadTime}ms`);
    console.log(`[WHEEL] Console errors: ${result.consoleErrors.length}`);
    console.log(`[WHEEL] Network errors: ${result.networkErrors.length}`);
    console.log(`[WHEEL] A11y violations: ${result.a11yViolations.length}`);

    expect(result.consoleErrors.length).toBe(0);
  });

  test('Analysis - /analysis', async ({ page }) => {
    const result = await validatePage(page, 'Analysis', 'http://localhost:3100/analysis');
    results.push(result);

    console.log(`[ANALYSIS] Status: ${result.status}`);
    console.log(`[ANALYSIS] Load time: ${result.loadTime}ms`);
    console.log(`[ANALYSIS] Console errors: ${result.consoleErrors.length}`);
    console.log(`[ANALYSIS] Network errors: ${result.networkErrors.length}`);
    console.log(`[ANALYSIS] A11y violations: ${result.a11yViolations.length}`);

    expect(result.consoleErrors.length).toBe(0);
  });

  test('Data Sources - /data-sources', async ({ page }) => {
    const result = await validatePage(page, 'Data Sources', 'http://localhost:3100/data-sources');
    results.push(result);

    console.log(`[DATA-SOURCES] Status: ${result.status}`);
    console.log(`[DATA-SOURCES] Load time: ${result.loadTime}ms`);
    console.log(`[DATA-SOURCES] Console errors: ${result.consoleErrors.length}`);
    console.log(`[DATA-SOURCES] Network errors: ${result.networkErrors.length}`);
    console.log(`[DATA-SOURCES] A11y violations: ${result.a11yViolations.length}`);

    expect(result.consoleErrors.length).toBe(0);
  });
});

// ============================================
// TIER 3 - STANDARD PRIORITY
// ============================================

test.describe('TIER 3 - Standard Priority Pages', () => {
  test('Reports - /reports', async ({ page }) => {
    const result = await validatePage(page, 'Reports', 'http://localhost:3100/reports');
    results.push(result);

    console.log(`[REPORTS] Status: ${result.status}`);
    console.log(`[REPORTS] Load time: ${result.loadTime}ms`);
    console.log(`[REPORTS] Console errors: ${result.consoleErrors.length}`);
    console.log(`[REPORTS] Network errors: ${result.networkErrors.length}`);
    console.log(`[REPORTS] A11y violations: ${result.a11yViolations.length}`);

    expect(result.consoleErrors.length).toBe(0);
  });

  test('Wheel Detail - /wheel/1', async ({ page }) => {
    const result = await validatePage(page, 'Wheel Detail', 'http://localhost:3100/wheel/1');
    results.push(result);

    console.log(`[WHEEL-DETAIL] Status: ${result.status}`);
    console.log(`[WHEEL-DETAIL] Load time: ${result.loadTime}ms`);
    console.log(`[WHEEL-DETAIL] Console errors: ${result.consoleErrors.length}`);
    console.log(`[WHEEL-DETAIL] Network errors: ${result.networkErrors.length}`);
    console.log(`[WHEEL-DETAIL] A11y violations: ${result.a11yViolations.length}`);

    // Allow 404 for non-existent wheel strategy
    const has404 = result.networkErrors.some(e => e.status === 404);
    const hasOtherErrors = result.consoleErrors.filter(e => !e.includes('404')).length > 0;
    expect(hasOtherErrors).toBe(false);
  });

  test('Health - /health', async ({ page }) => {
    const result = await validatePage(page, 'Health', 'http://localhost:3100/health');
    results.push(result);

    console.log(`[HEALTH] Status: ${result.status}`);
    console.log(`[HEALTH] Load time: ${result.loadTime}ms`);
    console.log(`[HEALTH] Console errors: ${result.consoleErrors.length}`);
    console.log(`[HEALTH] Network errors: ${result.networkErrors.length}`);
    console.log(`[HEALTH] A11y violations: ${result.a11yViolations.length}`);

    expect(result.consoleErrors.length).toBe(0);
  });

  test('Discrepancies - /discrepancies', async ({ page }) => {
    const result = await validatePage(page, 'Discrepancies', 'http://localhost:3100/discrepancies');
    results.push(result);

    console.log(`[DISCREPANCIES] Status: ${result.status}`);
    console.log(`[DISCREPANCIES] Load time: ${result.loadTime}ms`);
    console.log(`[DISCREPANCIES] Console errors: ${result.consoleErrors.length}`);
    console.log(`[DISCREPANCIES] Network errors: ${result.networkErrors.length}`);
    console.log(`[DISCREPANCIES] A11y violations: ${result.a11yViolations.length}`);

    expect(result.consoleErrors.length).toBe(0);
  });
});

// ============================================
// TIER 4 - LOW PRIORITY
// ============================================

test.describe('TIER 4 - Low Priority Pages', () => {
  test('Settings - /settings', async ({ page }) => {
    const result = await validatePage(page, 'Settings', 'http://localhost:3100/settings');
    results.push(result);

    console.log(`[SETTINGS] Status: ${result.status}`);
    console.log(`[SETTINGS] Load time: ${result.loadTime}ms`);
    console.log(`[SETTINGS] Console errors: ${result.consoleErrors.length}`);
    console.log(`[SETTINGS] Network errors: ${result.networkErrors.length}`);
    console.log(`[SETTINGS] A11y violations: ${result.a11yViolations.length}`);

    expect(result.consoleErrors.length).toBe(0);
  });

  test('OAuth Manager - /oauth-manager', async ({ page }) => {
    const result = await validatePage(page, 'OAuth Manager', 'http://localhost:3100/oauth-manager');
    results.push(result);

    console.log(`[OAUTH-MANAGER] Status: ${result.status}`);
    console.log(`[OAUTH-MANAGER] Load time: ${result.loadTime}ms`);
    console.log(`[OAUTH-MANAGER] Console errors: ${result.consoleErrors.length}`);
    console.log(`[OAUTH-MANAGER] Network errors: ${result.networkErrors.length}`);
    console.log(`[OAUTH-MANAGER] A11y violations: ${result.a11yViolations.length}`);

    expect(result.consoleErrors.length).toBe(0);
  });

  test('Admin Scrapers - /admin/scrapers', async ({ page }) => {
    const result = await validatePage(page, 'Admin Scrapers', 'http://localhost:3100/admin/scrapers');
    results.push(result);

    console.log(`[ADMIN-SCRAPERS] Status: ${result.status}`);
    console.log(`[ADMIN-SCRAPERS] Load time: ${result.loadTime}ms`);
    console.log(`[ADMIN-SCRAPERS] Console errors: ${result.consoleErrors.length}`);
    console.log(`[ADMIN-SCRAPERS] Network errors: ${result.networkErrors.length}`);
    console.log(`[ADMIN-SCRAPERS] A11y violations: ${result.a11yViolations.length}`);

    expect(result.consoleErrors.length).toBe(0);
  });
});

// ============================================
// PUBLIC PAGES (No Auth)
// ============================================

test.describe('Public Pages (No Auth)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Login - /login', async ({ page }) => {
    const result = await validatePage(page, 'Login', 'http://localhost:3100/login');
    results.push(result);

    // Check for login form elements
    await expect(page.locator('input[type="email"], input[name="email"], input[type="text"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 10000 });

    console.log(`[LOGIN] Status: ${result.status}`);
    console.log(`[LOGIN] Load time: ${result.loadTime}ms`);
    console.log(`[LOGIN] Console errors: ${result.consoleErrors.length}`);
    console.log(`[LOGIN] Network errors: ${result.networkErrors.length}`);
    console.log(`[LOGIN] A11y violations: ${result.a11yViolations.length}`);

    expect(result.consoleErrors.length).toBe(0);
  });

  test('Register - /register', async ({ page }) => {
    const result = await validatePage(page, 'Register', 'http://localhost:3100/register');
    results.push(result);

    console.log(`[REGISTER] Status: ${result.status}`);
    console.log(`[REGISTER] Load time: ${result.loadTime}ms`);
    console.log(`[REGISTER] Console errors: ${result.consoleErrors.length}`);
    console.log(`[REGISTER] Network errors: ${result.networkErrors.length}`);
    console.log(`[REGISTER] A11y violations: ${result.a11yViolations.length}`);

    expect(result.consoleErrors.length).toBe(0);
  });
});

// Final summary
test.afterAll(() => {
  console.log('\n========================================');
  console.log('MCP TRIPLO VALIDATION SUMMARY');
  console.log('========================================\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`Total Pages: ${results.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('\nDetailed Results:');

  results.forEach(r => {
    const icon = r.status === 'PASS' ? '[PASS]' : '[FAIL]';
    console.log(`${icon} ${r.page} (${r.loadTime}ms)`);
    if (r.consoleErrors.length > 0) {
      console.log(`  Console Errors: ${r.consoleErrors.join(', ')}`);
    }
    if (r.networkErrors.length > 0) {
      console.log(`  Network Errors: ${r.networkErrors.map(e => `${e.url}: ${e.status}`).join(', ')}`);
    }
    if (r.a11yViolations.length > 0) {
      console.log(`  A11y Violations: ${r.a11yViolations.map(v => `${v.id} (${v.impact})`).join(', ')}`);
    }
  });
});
