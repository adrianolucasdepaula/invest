/**
 * Visual Regression Tests using Playwright Built-in Screenshots
 *
 * Uses Playwright's native toHaveScreenshot() - 100% FREE
 * No external services required (Percy, Chromatic, etc.)
 *
 * Baselines are stored in Git and compared automatically.
 *
 * @see FASE 158 - Universal Validation Flow v3.0
 * @see Playwright Visual Testing: https://playwright.dev/docs/test-snapshots
 * @license FREE (Apache 2.0)
 */

import { test, expect, Page } from '@playwright/test';

/**
 * Dynamic regions to mask (content that changes between runs)
 * These regions will be ignored during visual comparison.
 */
const DYNAMIC_REGIONS = {
  // Price tickers (real-time data)
  priceTickers: '[data-testid="price-ticker"]',
  // Charts (dynamic rendering)
  charts: '[data-testid="chart-canvas"], .recharts-wrapper, canvas',
  // Timestamps
  timestamps: '[data-testid="timestamp"], time, .timestamp',
  // Loading spinners
  loading: '[data-testid="loading"], .loading, .spinner',
  // User avatars (may vary)
  avatars: '[data-testid="avatar"], .avatar',
  // Notifications badges (count varies)
  badges: '[data-testid="badge"], .badge',
};

/**
 * Viewport configurations for responsive testing
 */
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  laptop: { width: 1366, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
};

/**
 * Helper to get mask locators for dynamic regions
 */
function getDynamicMasks(page: Page) {
  return Object.values(DYNAMIC_REGIONS).map(selector => page.locator(selector));
}

/**
 * Helper to wait for page to be visually stable
 */
async function waitForVisualStability(page: Page) {
  // Wait for network idle
  await page.waitForLoadState('networkidle');

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  // Wait for animations to complete
  await page.waitForTimeout(500);

  // Hide loading states
  await page.evaluate(() => {
    document.querySelectorAll('.loading, .spinner, [data-testid="loading"]').forEach(el => {
      (el as HTMLElement).style.visibility = 'hidden';
    });
  });
}

/**
 * Screenshot configuration
 */
const SCREENSHOT_CONFIG = {
  // Maximum allowed pixel difference ratio (1% = 0.01)
  maxDiffPixelRatio: 0.01,
  // Threshold for individual pixel comparison
  threshold: 0.2,
  // Animation settings
  animations: 'disabled' as const,
};

// =============================================================================
// DASHBOARD PAGE TESTS
// =============================================================================

test.describe('Dashboard Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForVisualStability(page);
  });

  test('dashboard - desktop view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('dashboard-desktop.png', {
      ...SCREENSHOT_CONFIG,
      mask: getDynamicMasks(page),
    });
  });

  test('dashboard - tablet view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      ...SCREENSHOT_CONFIG,
      mask: getDynamicMasks(page),
    });
  });

  test('dashboard - mobile view', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile);
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      ...SCREENSHOT_CONFIG,
      mask: getDynamicMasks(page),
    });
  });

  test('dashboard - dark mode', async ({ page }) => {
    // Toggle dark mode if available
    const darkModeToggle = page.locator('[data-testid="theme-toggle"]');
    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click();
      await waitForVisualStability(page);
    }

    await expect(page).toHaveScreenshot('dashboard-dark-mode.png', {
      ...SCREENSHOT_CONFIG,
      mask: getDynamicMasks(page),
    });
  });
});

// =============================================================================
// ASSETS PAGE TESTS
// =============================================================================

test.describe('Assets Visual Regression', () => {
  test('assets list - desktop view', async ({ page }) => {
    await page.goto('/assets');
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('assets-list-desktop.png', {
      ...SCREENSHOT_CONFIG,
      mask: getDynamicMasks(page),
    });
  });

  test('assets list - with search filter', async ({ page }) => {
    await page.goto('/assets');
    await waitForVisualStability(page);

    // Apply search filter
    const searchInput = page.locator('[data-testid="search-input"], input[type="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('PETR');
      await waitForVisualStability(page);
    }

    await expect(page).toHaveScreenshot('assets-list-filtered.png', {
      ...SCREENSHOT_CONFIG,
      mask: getDynamicMasks(page),
    });
  });

  test('asset detail - PETR4', async ({ page }) => {
    await page.goto('/assets/PETR4');
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('asset-detail-petr4.png', {
      ...SCREENSHOT_CONFIG,
      mask: getDynamicMasks(page),
    });
  });

  test('asset detail - fundamentals tab', async ({ page }) => {
    await page.goto('/assets/PETR4');
    await waitForVisualStability(page);

    // Click fundamentals tab
    const fundamentalsTab = page.locator('[data-testid="tab-fundamentals"], [role="tab"]:has-text("Fundamentos")');
    if (await fundamentalsTab.isVisible()) {
      await fundamentalsTab.click();
      await waitForVisualStability(page);
    }

    await expect(page).toHaveScreenshot('asset-fundamentals-tab.png', {
      ...SCREENSHOT_CONFIG,
      mask: getDynamicMasks(page),
    });
  });
});

// =============================================================================
// PORTFOLIO PAGE TESTS
// =============================================================================

test.describe('Portfolio Visual Regression', () => {
  test('portfolio list', async ({ page }) => {
    await page.goto('/portfolio');
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('portfolio-list.png', {
      ...SCREENSHOT_CONFIG,
      mask: getDynamicMasks(page),
    });
  });

  test('portfolio detail', async ({ page }) => {
    await page.goto('/portfolio/1');
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('portfolio-detail.png', {
      ...SCREENSHOT_CONFIG,
      mask: getDynamicMasks(page),
    });
  });
});

// =============================================================================
// NAVIGATION COMPONENTS
// =============================================================================

test.describe('Navigation Visual Regression', () => {
  test('sidebar - expanded', async ({ page }) => {
    await page.goto('/');
    await waitForVisualStability(page);

    const sidebar = page.locator('[data-testid="sidebar"], nav.sidebar, aside');
    await expect(sidebar).toHaveScreenshot('sidebar-expanded.png', {
      ...SCREENSHOT_CONFIG,
    });
  });

  test('sidebar - collapsed', async ({ page }) => {
    await page.goto('/');
    await waitForVisualStability(page);

    // Toggle sidebar collapse
    const collapseButton = page.locator('[data-testid="sidebar-toggle"]');
    if (await collapseButton.isVisible()) {
      await collapseButton.click();
      await waitForVisualStability(page);
    }

    const sidebar = page.locator('[data-testid="sidebar"], nav.sidebar, aside');
    await expect(sidebar).toHaveScreenshot('sidebar-collapsed.png', {
      ...SCREENSHOT_CONFIG,
    });
  });

  test('header', async ({ page }) => {
    await page.goto('/');
    await waitForVisualStability(page);

    const header = page.locator('[data-testid="header"], header');
    await expect(header).toHaveScreenshot('header.png', {
      ...SCREENSHOT_CONFIG,
      mask: [page.locator('[data-testid="timestamp"]')],
    });
  });
});

// =============================================================================
// FORM COMPONENTS
// =============================================================================

test.describe('Form Components Visual Regression', () => {
  test('login form', async ({ page }) => {
    await page.goto('/login');
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('login-form.png', {
      ...SCREENSHOT_CONFIG,
    });
  });

  test('login form - with validation errors', async ({ page }) => {
    await page.goto('/login');
    await waitForVisualStability(page);

    // Submit empty form to trigger validation
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await waitForVisualStability(page);
    }

    await expect(page).toHaveScreenshot('login-form-errors.png', {
      ...SCREENSHOT_CONFIG,
    });
  });
});

// =============================================================================
// DATA VISUALIZATION COMPONENTS
// =============================================================================

test.describe('Data Visualization Visual Regression', () => {
  test('data table', async ({ page }) => {
    await page.goto('/assets');
    await waitForVisualStability(page);

    const table = page.locator('[data-testid="data-table"], table');
    if (await table.isVisible()) {
      await expect(table).toHaveScreenshot('data-table.png', {
        ...SCREENSHOT_CONFIG,
        mask: getDynamicMasks(page),
      });
    }
  });

  test('cards grid', async ({ page }) => {
    await page.goto('/');
    await waitForVisualStability(page);

    const cardsGrid = page.locator('[data-testid="cards-grid"], .cards-grid');
    if (await cardsGrid.isVisible()) {
      await expect(cardsGrid).toHaveScreenshot('cards-grid.png', {
        ...SCREENSHOT_CONFIG,
        mask: getDynamicMasks(page),
      });
    }
  });
});

// =============================================================================
// MODAL AND DIALOG COMPONENTS
// =============================================================================

test.describe('Modal Visual Regression', () => {
  test('confirmation dialog', async ({ page }) => {
    await page.goto('/settings');
    await waitForVisualStability(page);

    // Trigger a confirmation dialog (e.g., delete action)
    const deleteButton = page.locator('[data-testid="delete-btn"]');
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      await waitForVisualStability(page);

      const dialog = page.locator('[role="dialog"], [data-testid="modal"]');
      if (await dialog.isVisible()) {
        await expect(dialog).toHaveScreenshot('confirmation-dialog.png', {
          ...SCREENSHOT_CONFIG,
        });
      }
    }
  });
});

// =============================================================================
// ERROR STATES
// =============================================================================

test.describe('Error States Visual Regression', () => {
  test('404 page', async ({ page }) => {
    await page.goto('/non-existent-page-xyz');
    await waitForVisualStability(page);

    await expect(page).toHaveScreenshot('error-404.png', {
      ...SCREENSHOT_CONFIG,
    });
  });

  test('empty state', async ({ page }) => {
    // Navigate to a page with no data
    await page.goto('/portfolio?filter=empty');
    await waitForVisualStability(page);

    const emptyState = page.locator('[data-testid="empty-state"]');
    if (await emptyState.isVisible()) {
      await expect(emptyState).toHaveScreenshot('empty-state.png', {
        ...SCREENSHOT_CONFIG,
      });
    }
  });
});

// =============================================================================
// FULL PAGE SCREENSHOTS (for comprehensive coverage)
// =============================================================================

test.describe('Full Page Visual Regression', () => {
  const pages = [
    { name: 'dashboard', url: '/' },
    { name: 'assets', url: '/assets' },
    { name: 'portfolio', url: '/portfolio' },
    { name: 'analysis', url: '/analysis' },
    { name: 'reports', url: '/reports' },
    { name: 'settings', url: '/settings' },
  ];

  for (const pageInfo of pages) {
    test(`full page - ${pageInfo.name}`, async ({ page }) => {
      await page.goto(pageInfo.url);
      await waitForVisualStability(page);

      await expect(page).toHaveScreenshot(`full-page-${pageInfo.name}.png`, {
        ...SCREENSHOT_CONFIG,
        fullPage: true,
        mask: getDynamicMasks(page),
      });
    });
  }
});
