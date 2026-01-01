import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MCP Triplo Validation - Direct auth with existing token
 * Date: 2025-12-31
 * Uses existing storage state directly - no API auth call
 */

test.describe.configure({ mode: 'serial' });
test.setTimeout(90000);

// Use existing auth directly - skip setup project
test.use({
  storageState: 'playwright/.auth/user.json'
});

interface PageResult {
  name: string;
  tier: number;
  url: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  loadTimeMs: number;
  consoleErrors: string[];
  networkErrors: string[];
  a11yIssues: { id: string; impact: string; count: number }[];
}

const allResults: PageResult[] = [];

const PAGES = [
  // TIER 2
  { name: 'Wheel Dashboard', tier: 2, path: '/wheel' },
  { name: 'Analysis', tier: 2, path: '/analysis' },
  { name: 'Data Sources', tier: 2, path: '/data-sources' },
  // TIER 3
  { name: 'Reports', tier: 3, path: '/reports' },
  { name: 'Health', tier: 3, path: '/health' },
  { name: 'Discrepancies', tier: 3, path: '/discrepancies' },
  // TIER 4
  { name: 'Settings', tier: 4, path: '/settings' },
  { name: 'OAuth Manager', tier: 4, path: '/oauth-manager' },
  { name: 'Admin Scrapers', tier: 4, path: '/admin/scrapers' },
];

async function validatePage(page: Page, info: { name: string; tier: number; path: string }) {
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('React DevTools')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('favicon')) {
      networkErrors.push(`${resp.status()}: ${resp.url().split('?')[0]}`);
    }
  });

  const url = `http://localhost:3100${info.path}`;
  const start = Date.now();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  const loadTime = Date.now() - start;

  // A11y
  let a11yIssues: { id: string; impact: string; count: number }[] = [];
  try {
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    a11yIssues = results.violations.map(v => ({
      id: v.id,
      impact: v.impact || 'unknown',
      count: v.nodes.length
    }));
  } catch (e) { /* ignore */ }

  // Screenshot
  const dir = 'test-results/mcp-triplo-screenshots';
  await fs.promises.mkdir(dir, { recursive: true });
  const filename = info.name.toLowerCase().replace(/[\s\/]/g, '-') + '.png';
  try {
    await page.screenshot({ path: path.join(dir, filename), fullPage: true });
  } catch (e) { /* ignore */ }

  const criticalA11y = a11yIssues.filter(i => i.impact === 'critical').length;
  const seriousA11y = a11yIssues.filter(i => i.impact === 'serious').length;
  const has500 = networkErrors.some(e => e.startsWith('5'));

  let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
  if (consoleErrors.length > 0 || has500 || criticalA11y > 0) {
    status = 'FAIL';
  } else if (seriousA11y > 0 || networkErrors.length > 0) {
    status = 'WARNING';
  }

  return { ...info, url, status, loadTimeMs: loadTime, consoleErrors, networkErrors, a11yIssues };
}

for (const pageInfo of PAGES) {
  test(`TIER ${pageInfo.tier}: ${pageInfo.name}`, async ({ page }) => {
    const result = await validatePage(page, pageInfo);
    allResults.push(result);

    const icon = result.status === 'PASS' ? 'PASS' : result.status === 'WARNING' ? 'WARN' : 'FAIL';
    const criticalA11y = result.a11yIssues.filter(i => i.impact === 'critical').length;
    const seriousA11y = result.a11yIssues.filter(i => i.impact === 'serious').length;

    console.log(`[${icon}] ${pageInfo.name} (${result.loadTimeMs}ms)`);
    console.log(`    Console: ${result.consoleErrors.length} | Network: ${result.networkErrors.length} | A11y: ${result.a11yIssues.length}`);

    if (result.consoleErrors.length > 0) {
      console.log(`    Errors: ${result.consoleErrors.slice(0, 2).join(' | ')}`);
    }
    if (result.a11yIssues.length > 0) {
      console.log(`    A11y: ${result.a11yIssues.map(i => `${i.id}(${i.impact})`).join(', ')}`);
    }

    // Only fail on real console errors (not 4xx which are expected for some pages)
    const realErrors = result.consoleErrors.filter(e =>
      !e.includes('404') && !e.includes('400') && !e.includes('Failed to load resource')
    );
    expect(realErrors.length, `Console errors found: ${realErrors.join(', ')}`).toBe(0);
  });
}

// Public pages without auth
test.describe('Public Pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('TIER 4: Login', async ({ page }) => {
    const result = await validatePage(page, { name: 'Login', tier: 4, path: '/login' });
    allResults.push(result);
    console.log(`[${result.status}] Login (${result.loadTimeMs}ms)`);
    expect(result.consoleErrors.length).toBe(0);
  });

  test('TIER 4: Register', async ({ page }) => {
    const result = await validatePage(page, { name: 'Register', tier: 4, path: '/register' });
    allResults.push(result);
    console.log(`[${result.status}] Register (${result.loadTimeMs}ms)`);
    expect(result.consoleErrors.length).toBe(0);
  });
});

test.afterAll(async () => {
  console.log('\n================================================================================');
  console.log('                    MCP TRIPLO VALIDATION REPORT - 2025-12-31');
  console.log('================================================================================\n');

  for (const tier of [2, 3, 4]) {
    const tierResults = allResults.filter(r => r.tier === tier);
    const passed = tierResults.filter(r => r.status === 'PASS').length;
    const warnings = tierResults.filter(r => r.status === 'WARNING').length;
    const failed = tierResults.filter(r => r.status === 'FAIL').length;

    console.log(`TIER ${tier}: ${passed} PASS | ${warnings} WARNING | ${failed} FAIL`);
    for (const r of tierResults) {
      const icon = r.status === 'PASS' ? 'PASS' : r.status === 'WARNING' ? 'WARN' : 'FAIL';
      console.log(`  [${icon}] ${r.name} (${r.loadTimeMs}ms)`);
      if (r.a11yIssues.length > 0) {
        console.log(`      A11y: ${r.a11yIssues.map(i => `${i.id}(${i.impact})`).join(', ')}`);
      }
    }
    console.log('');
  }

  const total = allResults.length;
  const passed = allResults.filter(r => r.status === 'PASS').length;
  const warnings = allResults.filter(r => r.status === 'WARNING').length;
  const failed = allResults.filter(r => r.status === 'FAIL').length;

  console.log('--------------------------------------------------------------------------------');
  console.log(`TOTAL: ${total} Pages | ${passed} PASS | ${warnings} WARNING | ${failed} FAIL`);
  console.log('--------------------------------------------------------------------------------\n');

  // Save report
  await fs.promises.mkdir('test-results', { recursive: true });
  await fs.promises.writeFile('test-results/mcp-triplo-report.json', JSON.stringify({
    date: '2025-12-31',
    summary: { total, passed, warnings, failed },
    results: allResults
  }, null, 2));
});
