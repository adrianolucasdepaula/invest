/**
 * Shared Helper Functions for Multi-Layer Testing Pipeline
 *
 * Common utilities for test setup, teardown, and data manipulation
 * used across all testing layers.
 */

import type { Page, Browser, BrowserContext } from '@playwright/test';
import { chromium } from '@playwright/test';
import { defaultTestContext, testScraperIds } from './test-scenarios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Setup authenticated browser context
 */
export async function setupAuthenticatedContext(browser: Browser): Promise<BrowserContext> {
  const { storageStatePath } = defaultTestContext;

  if (!storageStatePath || !fs.existsSync(storageStatePath)) {
    throw new Error(
      `Storage state file not found: ${storageStatePath}. Run auth.setup.ts first.`
    );
  }

  const context = await browser.newContext({
    storageState: storageStatePath,
  });

  return context;
}

/**
 * Navigate to scrapers admin page
 */
export async function navigateToScrapersPage(page: Page): Promise<void> {
  const { baseURL } = defaultTestContext;
  await page.goto(`${baseURL}/admin/scrapers`);

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Verify we're on the correct page
  await page.waitForSelector('[data-testid="scrapers-page"]', { timeout: 10000 });
}

/**
 * Get active scrapers count from page
 */
export async function getActiveScrapersCount(page: Page): Promise<number> {
  const countElement = page.locator('[data-testid="active-scrapers-count"]');
  await countElement.waitFor({ state: 'visible', timeout: 5000 });

  const text = await countElement.textContent();
  return parseInt(text || '0', 10);
}

/**
 * Toggle scraper by ID
 */
export async function toggleScraper(
  page: Page,
  scraperId: string,
  waitForMutation: boolean = true
): Promise<void> {
  const switchElement = page.getByRole('switch', { name: new RegExp(scraperId, 'i') });
  await switchElement.click();

  if (waitForMutation) {
    // Wait for React Query mutation to complete
    await page.waitForTimeout(500);
  }
}

/**
 * Get scraper enabled state
 */
export async function isScraperEnabled(page: Page, scraperId: string): Promise<boolean> {
  const switchElement = page.getByRole('switch', { name: new RegExp(scraperId, 'i') });
  return await switchElement.isChecked();
}

/**
 * Set advanced parameter value
 */
export async function setParameter(
  page: Page,
  parameterId: string,
  value: string | number
): Promise<void> {
  const input = page.locator(`[data-testid="${parameterId}"]`);
  await input.fill(String(value));
  await input.blur(); // Trigger validation
  await page.waitForTimeout(300);
}

/**
 * Apply parameter profile
 */
export async function applyProfile(page: Page, profileName: string): Promise<void> {
  const profileButton = page.getByRole('button', { name: new RegExp(profileName, 'i') });
  await profileButton.click();
  await page.waitForTimeout(1000);
}

/**
 * Reset scrapers to default state
 *
 * Ensures minimum 2 scrapers are active for testing.
 */
export async function resetScrapersToDefault(page: Page): Promise<void> {
  await navigateToScrapersPage(page);

  // Get current state
  const allScrapers = Object.values(testScraperIds);
  const enabledStates = await Promise.all(
    allScrapers.map(id => isScraperEnabled(page, id))
  );

  const activeCount = enabledStates.filter(Boolean).length;

  // Ensure at least 2 scrapers active
  if (activeCount < 2) {
    // Enable first 2 scrapers if less than 2 active
    for (let i = 0; i < 2; i++) {
      if (!enabledStates[i]) {
        await toggleScraper(page, allScrapers[i]);
      }
    }
  }

  // Disable extras if more than 3 active (keep exactly 3 for testing)
  if (activeCount > 3) {
    for (let i = 3; i < allScrapers.length; i++) {
      if (enabledStates[i]) {
        await toggleScraper(page, allScrapers[i]);
      }
    }
  }

  await page.waitForTimeout(1000);
}

/**
 * Collect console messages
 */
export async function collectConsoleMessages(page: Page): Promise<Array<{ type: string; text: string }>> {
  const messages: Array<{ type: string; text: string }> = [];

  page.on('console', msg => {
    messages.push({
      type: msg.type(),
      text: msg.text(),
    });
  });

  return messages;
}

/**
 * Collect network requests
 */
export async function collectNetworkRequests(
  page: Page
): Promise<Array<{ url: string; method: string; status: number }>> {
  const requests: Array<{ url: string; method: string; status: number }> = [];

  page.on('response', async response => {
    requests.push({
      url: response.url(),
      method: response.request().method(),
      status: response.status(),
    });
  });

  return requests;
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page,
  name: string,
  layer: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${layer}-${name}-${timestamp}.png`;
  const filepath = path.join('frontend/reports/screenshots', filename);

  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

/**
 * Save trace with timestamp
 */
export async function saveTrace(
  page: Page,
  name: string,
  layer: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${layer}-${name}-${timestamp}.zip`;
  const filepath = path.join('frontend/reports/traces', filename);

  // Ensure directory exists
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Note: Trace must be started before test and stopped here
  // This is a placeholder - actual implementation depends on test framework setup
  // await context.tracing.stop({ path: filepath });

  return filepath;
}

/**
 * Extract HTML from Playwright snapshot
 *
 * Used for a11y MCP workaround (OAuth blocker)
 */
export function extractHTMLFromSnapshot(snapshot: string): string {
  // Parse snapshot text format and extract HTML elements
  // This is a simplified implementation - actual parsing may be more complex

  const lines = snapshot.split('\n');
  let html = '<html><body>';

  for (const line of lines) {
    // Extract element tags, attributes, and text content
    const elementMatch = line.match(/(\w+)\s+(.+)/);
    if (elementMatch) {
      const [, tag, content] = elementMatch;
      html += `<${tag}>${content}</${tag}>`;
    }
  }

  html += '</body></html>';
  return html;
}

/**
 * Wait for React Query refetch to complete
 */
export async function waitForReactQueryRefetch(page: Page): Promise<void> {
  // Wait for React Query's typical refetch delay
  await page.waitForTimeout(2000);

  // Also wait for any loading spinners to disappear
  const loadingSpinner = page.locator('[data-testid="loading-spinner"]');
  const isVisible = await loadingSpinner.isVisible().catch(() => false);

  if (isVisible) {
    await loadingSpinner.waitFor({ state: 'hidden', timeout: 5000 });
  }
}

/**
 * Perform rapid clicks (for debounce testing)
 */
export async function rapidClickElement(
  page: Page,
  selector: string,
  clickCount: number,
  intervalMs: number
): Promise<void> {
  const element = page.locator(selector);

  for (let i = 0; i < clickCount; i++) {
    await element.click();
    if (i < clickCount - 1) {
      await page.waitForTimeout(intervalMs);
    }
  }
}

/**
 * Setup test data (if needed)
 */
export async function setupTestData(): Promise<void> {
  // Placeholder for any test data setup
  // e.g., seed database, create test users, etc.
  // Currently not needed as we use existing production data
}

/**
 * Cleanup test data
 */
export async function cleanupTestData(): Promise<void> {
  // Placeholder for test data cleanup
  // Currently not needed as tests don't create persistent data
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Generate test report summary
 */
export interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  executionTime: number;
}

export function generateTestSummary(
  results: Array<{ status: string; executionTime: number }>
): TestSummary {
  const totalTests = results.length;
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const skipped = results.filter(r => r.status === 'SKIPPED').length;
  const passRate = totalTests > 0 ? passed / totalTests : 0;
  const executionTime = results.reduce((sum, r) => sum + r.executionTime, 0);

  return {
    totalTests,
    passed,
    failed,
    skipped,
    passRate,
    executionTime,
  };
}

/**
 * Load JSON file safely
 */
export function loadJSON<T>(filepath: string): T | null {
  try {
    if (!fs.existsSync(filepath)) {
      return null;
    }
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Failed to load JSON from ${filepath}:`, error);
    return null;
  }
}

/**
 * Save JSON file safely
 */
export function saveJSON<T>(filepath: string, data: T): void {
  try {
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filepath, content, 'utf-8');
  } catch (error) {
    console.error(`Failed to save JSON to ${filepath}:`, error);
    throw error;
  }
}

/**
 * Get timestamp for filenames
 */
export function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
