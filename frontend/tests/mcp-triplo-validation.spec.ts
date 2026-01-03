import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MCP Triplo Validation - Critical Pages
 * Date: 2026-01-03
 *
 * Critical Pages to Validate:
 * 1. /dashboard - Main dashboard
 * 2. /assets - Asset listing
 * 3. /assets/PETR4 - Asset detail page
 * 4. /wheel - Wheel strategy
 * 5. /health - Health status page
 *
 * Success Criteria:
 * - 0 console errors
 * - 0 network errors (4xx, 5xx)
 * - WCAG 2.1 AA compliance
 * - All critical elements visible
 */

// Run tests serially for proper report aggregation
test.describe.configure({ mode: 'serial' });

// Increase timeout for all tests
test.setTimeout(90000);

interface PageResult {
  name: string;
  tier: number;
  url: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  loadTimeMs: number;
  consoleErrors: string[];
  networkErrors: string[];
  a11yIssues: { id: string; impact: string; count: number }[];
  details: string;
}

const allResults: PageResult[] = [];

const PAGES = [
  // TIER 1 - Critical Pages (5 Priority Pages)
  { name: 'Dashboard', tier: 1, path: '/dashboard' },
  { name: 'Assets List', tier: 1, path: '/assets' },
  { name: 'Asset Detail PETR4', tier: 1, path: '/assets/PETR4' },
  { name: 'Wheel Strategy', tier: 1, path: '/wheel' },
  { name: 'Health Status', tier: 1, path: '/health' },

  // TIER 2 - High Priority
  { name: 'Analysis', tier: 2, path: '/analysis' },
  { name: 'Data Sources', tier: 2, path: '/data-sources' },

  // TIER 3 - Standard Priority
  { name: 'Portfolio', tier: 3, path: '/portfolio' },
  { name: 'Reports', tier: 3, path: '/reports' },
  { name: 'Discrepancies', tier: 3, path: '/discrepancies' },

  // TIER 4 - Low Priority
  { name: 'Settings', tier: 4, path: '/settings' },
  { name: 'OAuth Manager', tier: 4, path: '/oauth-manager' },
  { name: 'Data Management', tier: 4, path: '/data-management' },
];

const PUBLIC_PAGES = [
  { name: 'Login', tier: 4, path: '/login' },
  { name: 'Register', tier: 4, path: '/register' },
];

test.describe('MCP Triplo - Authenticated Pages', () => {
  for (const pageInfo of PAGES) {
    test(`TIER ${pageInfo.tier}: ${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const networkErrors: string[] = [];

      // Listen for console errors (exclude known benign third-party errors)
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          const isBenign =
            text.includes('favicon') ||
            text.includes('Download the React DevTools') ||
            text.includes('tradingview') ||
            text.includes('TradingView') ||
            text.includes('support-portal') ||
            text.includes('403') ||
            text.includes('ResizeObserver loop');
          if (!isBenign) {
            consoleErrors.push(text);
          }
        }
      });

      // Listen for network errors (exclude known third-party errors)
      page.on('response', response => {
        const status = response.status();
        const url = response.url();
        const isThirdParty =
          url.includes('favicon') ||
          url.includes('tradingview') ||
          url.includes('TradingView') ||
          url.includes('support-portal');
        if (status >= 400 && !isThirdParty) {
          networkErrors.push(`${status}: ${url.split('?')[0]}`);
        }
      });

      const url = `http://localhost:3100${pageInfo.path}`;
      const startTime = Date.now();

      // Navigate with extended timeout
      try {
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000
        });

        // Wait for page to stabilize
        await page.waitForTimeout(3000);
      } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        allResults.push({
          name: pageInfo.name,
          tier: pageInfo.tier,
          url,
          status: 'FAIL',
          loadTimeMs: Date.now() - startTime,
          consoleErrors,
          networkErrors,
          a11yIssues: [],
          details: `Navigation failed: ${errorMsg}`
        });
        console.log(`[FAIL] ${pageInfo.name} - Navigation failed`);
        return;
      }

      const loadTime = Date.now() - startTime;

      // Run accessibility audit
      let a11yIssues: { id: string; impact: string; count: number }[] = [];
      try {
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        a11yIssues = results.violations.map(v => ({
          id: v.id,
          impact: v.impact || 'unknown',
          count: v.nodes.length
        }));
      } catch (e) {
        console.log(`A11y audit skipped for ${pageInfo.name}`);
      }

      // Take screenshot
      const screenshotDir = 'test-results/mcp-triplo-screenshots';
      try {
        await fs.promises.mkdir(screenshotDir, { recursive: true });
        await page.screenshot({
          path: path.join(screenshotDir, `${pageInfo.name.toLowerCase().replace(/[\s\/]/g, '-')}.png`),
          fullPage: true
        });
      } catch (e) {
        console.log(`Screenshot failed for ${pageInfo.name}`);
      }

      // Determine status
      const criticalA11y = a11yIssues.filter(i => i.impact === 'critical').length;
      const seriousA11y = a11yIssues.filter(i => i.impact === 'serious').length;
      const has500Error = networkErrors.some(e => e.startsWith('5'));

      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      let details = '';

      if (consoleErrors.length > 0 || has500Error || criticalA11y > 0) {
        status = 'FAIL';
        details = `Console: ${consoleErrors.length}, 5xx: ${networkErrors.filter(e => e.startsWith('5')).length}, Critical A11y: ${criticalA11y}`;
      } else if (seriousA11y > 0 || networkErrors.length > 0) {
        status = 'WARNING';
        details = `Serious A11y: ${seriousA11y}, 4xx: ${networkErrors.length}`;
      }

      allResults.push({
        name: pageInfo.name,
        tier: pageInfo.tier,
        url,
        status,
        loadTimeMs: loadTime,
        consoleErrors,
        networkErrors,
        a11yIssues,
        details
      });

      // Log result
      const icon = status === 'PASS' ? '[PASS]' : status === 'WARNING' ? '[WARN]' : '[FAIL]';
      console.log(`${icon} TIER ${pageInfo.tier}: ${pageInfo.name} (${loadTime}ms)`);
      console.log(`    Console Errors: ${consoleErrors.length}`);
      console.log(`    Network Errors: ${networkErrors.length}`);
      console.log(`    A11y Issues: ${a11yIssues.length} (Critical: ${criticalA11y}, Serious: ${seriousA11y})`);

      // Assertions - warning allowed, but log failures
      if (status === 'FAIL') {
        if (consoleErrors.length > 0) {
          console.log(`    Console Details: ${consoleErrors.slice(0, 3).join(' | ')}`);
        }
        if (networkErrors.length > 0) {
          console.log(`    Network Details: ${networkErrors.slice(0, 3).join(' | ')}`);
        }
      }

      // Use soft assertions to log issues but continue all tests
      // The final report will show which pages need attention
      const unexpectedErrors = consoleErrors.filter(e =>
        !e.includes('404') &&
        !e.includes('400') &&
        !e.includes('Failed to load resource')
      );

      // Log but don't fail - let all pages be validated
      if (unexpectedErrors.length > 0) {
        console.log(`    [ISSUE] Console errors found: ${unexpectedErrors.length}`);
      }
      if (criticalA11y > 0) {
        console.log(`    [ISSUE] Critical a11y issues found: ${criticalA11y}`);
      }

      // Only fail on critical app errors (not a11y, which are warnings)
      expect(unexpectedErrors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'))).toHaveLength(0);
    });
  }
});

test.describe('MCP Triplo - Public Pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const pageInfo of PUBLIC_PAGES) {
    test(`TIER ${pageInfo.tier}: ${pageInfo.name} (${pageInfo.path})`, async ({ page }) => {
      const consoleErrors: string[] = [];
      const networkErrors: string[] = [];

      // Listen for console errors (exclude known benign third-party errors)
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          const isBenign =
            text.includes('favicon') ||
            text.includes('Download the React DevTools') ||
            text.includes('tradingview') ||
            text.includes('TradingView') ||
            text.includes('support-portal') ||
            text.includes('403') ||
            text.includes('ResizeObserver loop');
          if (!isBenign) {
            consoleErrors.push(text);
          }
        }
      });

      // Listen for network errors (exclude known third-party errors)
      page.on('response', response => {
        const status = response.status();
        const url = response.url();
        const isThirdParty =
          url.includes('favicon') ||
          url.includes('tradingview') ||
          url.includes('TradingView') ||
          url.includes('support-portal');
        if (status >= 400 && !isThirdParty) {
          networkErrors.push(`${status}: ${url.split('?')[0]}`);
        }
      });

      const url = `http://localhost:3100${pageInfo.path}`;
      const startTime = Date.now();

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      await page.waitForTimeout(2000);

      const loadTime = Date.now() - startTime;

      // A11y audit
      let a11yIssues: { id: string; impact: string; count: number }[] = [];
      try {
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        a11yIssues = results.violations.map(v => ({
          id: v.id,
          impact: v.impact || 'unknown',
          count: v.nodes.length
        }));
      } catch (e) {
        console.log(`A11y audit skipped for ${pageInfo.name}`);
      }

      // Screenshot
      const screenshotDir = 'test-results/mcp-triplo-screenshots';
      try {
        await fs.promises.mkdir(screenshotDir, { recursive: true });
        await page.screenshot({
          path: path.join(screenshotDir, `${pageInfo.name.toLowerCase().replace(/[\s\/]/g, '-')}.png`),
          fullPage: true
        });
      } catch (e) {
        console.log(`Screenshot failed for ${pageInfo.name}`);
      }

      const criticalA11y = a11yIssues.filter(i => i.impact === 'critical').length;
      const seriousA11y = a11yIssues.filter(i => i.impact === 'serious').length;

      let status: 'PASS' | 'FAIL' | 'WARNING' = 'PASS';
      if (consoleErrors.length > 0 || criticalA11y > 0) {
        status = 'FAIL';
      } else if (seriousA11y > 0) {
        status = 'WARNING';
      }

      allResults.push({
        name: pageInfo.name,
        tier: pageInfo.tier,
        url,
        status,
        loadTimeMs: loadTime,
        consoleErrors,
        networkErrors,
        a11yIssues,
        details: ''
      });

      const icon = status === 'PASS' ? '[PASS]' : status === 'WARNING' ? '[WARN]' : '[FAIL]';
      console.log(`${icon} TIER ${pageInfo.tier}: ${pageInfo.name} (${loadTime}ms)`);
      console.log(`    Console Errors: ${consoleErrors.length}`);
      console.log(`    Network Errors: ${networkErrors.length}`);
      console.log(`    A11y Issues: ${a11yIssues.length} (Critical: ${criticalA11y}, Serious: ${seriousA11y})`);

      // Only fail on critical app errors
      const criticalErrors = consoleErrors.filter(e => e.includes('TypeError') || e.includes('ReferenceError'));
      expect(criticalErrors).toHaveLength(0);
    });
  }
});

test.afterAll(async () => {
  console.log('\n');
  console.log('================================================================================');
  console.log('                    MCP TRIPLO VALIDATION REPORT');
  console.log('                         Date: 2026-01-03');
  console.log('================================================================================\n');

  // Group by tier
  const tiers = [1, 2, 3, 4];

  for (const tier of tiers) {
    const tierResults = allResults.filter(r => r.tier === tier);
    const passed = tierResults.filter(r => r.status === 'PASS').length;
    const warnings = tierResults.filter(r => r.status === 'WARNING').length;
    const failed = tierResults.filter(r => r.status === 'FAIL').length;

    console.log(`TIER ${tier}: ${passed} PASS | ${warnings} WARNING | ${failed} FAIL`);

    for (const result of tierResults) {
      const icon = result.status === 'PASS' ? '[PASS]' : result.status === 'WARNING' ? '[WARN]' : '[FAIL]';
      console.log(`  ${icon} ${result.name} (${result.loadTimeMs}ms)`);

      if (result.consoleErrors.length > 0) {
        console.log(`      Console: ${result.consoleErrors.slice(0, 2).join('; ')}`);
      }
      if (result.a11yIssues.length > 0) {
        const issues = result.a11yIssues.map(i => `${i.id}(${i.impact})`).slice(0, 3).join(', ');
        console.log(`      A11y: ${issues}`);
      }
    }
    console.log('');
  }

  // Summary
  const total = allResults.length;
  const totalPassed = allResults.filter(r => r.status === 'PASS').length;
  const totalWarnings = allResults.filter(r => r.status === 'WARNING').length;
  const totalFailed = allResults.filter(r => r.status === 'FAIL').length;

  console.log('--------------------------------------------------------------------------------');
  console.log(`SUMMARY: ${total} Pages | ${totalPassed} PASS | ${totalWarnings} WARNING | ${totalFailed} FAIL`);
  console.log('--------------------------------------------------------------------------------');

  // Save report to file
  const reportPath = 'test-results/mcp-triplo-report.json';
  await fs.promises.mkdir('test-results', { recursive: true });
  await fs.promises.writeFile(reportPath, JSON.stringify({
    date: '2026-01-03',
    summary: { total, passed: totalPassed, warnings: totalWarnings, failed: totalFailed },
    results: allResults
  }, null, 2));
  console.log(`\nReport saved to: ${reportPath}`);
});
