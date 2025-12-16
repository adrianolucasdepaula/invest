import { test, expect } from '@playwright/test';

/**
 * FASE 131: Bundler Configuration Validation Tests
 *
 * These tests validate that the frontend is using the correct bundler (Turbopack)
 * and detect common bundler-related errors that previously took days to debug.
 *
 * Run with: npx playwright test bundler-validation.spec.ts
 */

test.describe('Bundler Configuration Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for initial page load
    test.setTimeout(60000);
  });

  test('should load dashboard without webpack/bundler errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
      if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Capture page errors (uncaught exceptions)
    page.on('pageerror', error => {
      consoleErrors.push(error.message);
    });

    // Navigate to dashboard
    await page.goto('http://localhost:3100/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait a bit for any async errors to appear
    await page.waitForTimeout(2000);

    // Filter for bundler-specific errors
    const bundlerErrors = consoleErrors.filter(err =>
      err.includes('options.factory') ||
      err.includes('webpack') ||
      err.includes('Cannot read properties of undefined') ||
      err.includes('module resolution') ||
      err.includes('turbopack') ||
      err.includes('RSC') ||
      err.includes('chunk')
    );

    // Log all errors for debugging
    if (bundlerErrors.length > 0) {
      console.log('🚨 Bundler errors detected:');
      bundlerErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
      console.log('\n💡 Solution: Run /validate-dev-config or check TROUBLESHOOTING.md REGRA #1');
    }

    expect(bundlerErrors, 'Bundler errors should not be present').toHaveLength(0);
  });

  test('should not have RSC stream errors', async ({ page }) => {
    const failedRequests: { url: string; status: number; statusText: string }[] = [];

    // Monitor network requests
    page.on('response', response => {
      const url = response.url();
      const status = response.status();

      // Check RSC-related requests
      if (url.includes('_rsc') || url.includes('__rsc')) {
        if (status >= 400) {
          failedRequests.push({
            url,
            status,
            statusText: response.statusText()
          });
        }
      }
    });

    await page.goto('http://localhost:3100/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for any additional RSC requests
    await page.waitForTimeout(2000);

    // Log failed requests for debugging
    if (failedRequests.length > 0) {
      console.log('🚨 Failed RSC requests:');
      failedRequests.forEach(req => {
        console.log(`  ${req.status} ${req.statusText}: ${req.url}`);
      });
    }

    expect(failedRequests, 'RSC requests should not fail').toHaveLength(0);
  });

  test('should complete Fast Refresh without full reload', async ({ page }) => {
    // This test verifies that Hot Module Replacement is working correctly
    // If bundler is misconfigured, Fast Refresh will do full page reloads

    let fullReloadDetected = false;
    let navigationCount = 0;

    // Track navigations (full reloads)
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) {
        navigationCount++;
        if (navigationCount > 1) {
          fullReloadDetected = true;
        }
      }
    });

    // Initial navigation
    await page.goto('http://localhost:3100/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Reset counter after initial load
    navigationCount = 0;
    fullReloadDetected = false;

    // Wait for any spontaneous reloads (indicates bundler issues)
    await page.waitForTimeout(5000);

    if (fullReloadDetected) {
      console.log('🚨 Unexpected full page reload detected!');
      console.log('   This may indicate bundler misconfiguration.');
      console.log('   Run /validate-dev-config to diagnose.');
    }

    // Note: We can't trigger a file change in this test, but we can detect
    // if the page is unstable and doing unexpected reloads
    expect(fullReloadDetected, 'Page should not do unexpected full reloads').toBe(false);
  });

  test('should render main layout without hydration errors', async ({ page }) => {
    const hydrationErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (
        text.includes('Hydration') ||
        text.includes('hydration') ||
        text.includes('server-rendered') ||
        text.includes('did not match')
      ) {
        hydrationErrors.push(text);
      }
    });

    await page.goto('http://localhost:3100/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for hydration to complete
    await page.waitForTimeout(3000);

    // Log hydration errors for debugging
    if (hydrationErrors.length > 0) {
      console.log('🚨 Hydration errors detected:');
      hydrationErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err.substring(0, 200)}...`));
    }

    expect(hydrationErrors, 'Hydration errors should not be present').toHaveLength(0);
  });

  test('should load all critical dashboard components', async ({ page }) => {
    await page.goto('http://localhost:3100/dashboard', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for components to render
    await page.waitForTimeout(2000);

    // Check for critical elements that should be present
    const criticalSelectors = [
      'h1:has-text("Dashboard")',                    // Page title
      '[class*="card"]',                             // Stat cards
      'nav',                                         // Navigation/Sidebar
    ];

    for (const selector of criticalSelectors) {
      const element = page.locator(selector).first();
      await expect(element, `Element ${selector} should be visible`).toBeVisible({ timeout: 10000 });
    }
  });
});

/**
 * Test for other pages to ensure bundler works across routes
 */
test.describe('Multi-Page Bundler Validation', () => {
  const pages = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/assets', name: 'Assets' },
    { path: '/portfolio', name: 'Portfolio' },
  ];

  for (const pageInfo of pages) {
    test(`should load ${pageInfo.name} page without bundler errors`, async ({ page }) => {
      const errors: string[] = [];

      page.on('pageerror', error => {
        errors.push(error.message);
      });

      page.on('console', msg => {
        if (msg.type() === 'error' && msg.text().includes('chunk')) {
          errors.push(msg.text());
        }
      });

      await page.goto(`http://localhost:3100${pageInfo.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for any async errors
      await page.waitForTimeout(2000);

      const bundlerErrors = errors.filter(err =>
        err.includes('webpack') ||
        err.includes('chunk') ||
        err.includes('module')
      );

      expect(bundlerErrors, `${pageInfo.name} should load without bundler errors`).toHaveLength(0);
    });
  }
});
