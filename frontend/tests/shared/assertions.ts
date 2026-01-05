/**
 * Shared Assertions for Multi-Layer Testing Pipeline
 *
 * Common assertion utilities used across all testing layers to ensure
 * consistent validation logic and bug detection.
 */

import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import { expectedErrors, timingConstants } from './test-scenarios';

/**
 * Assert scraper toggle state
 */
export async function assertScraperState(
  page: Page,
  scraperId: string,
  expectedEnabled: boolean
): Promise<void> {
  const switchElement = page.getByRole('switch', { name: new RegExp(scraperId, 'i') });
  await expect(switchElement).toBeVisible();

  if (expectedEnabled) {
    await expect(switchElement).toBeChecked();
  } else {
    await expect(switchElement).not.toBeChecked();
  }
}

/**
 * Assert parameter value persistence
 */
export async function assertParameterValue(
  page: Page,
  parameterId: string,
  expectedValue: string | number
): Promise<void> {
  const input = page.locator(`[data-testid="${parameterId}"]`);
  await expect(input).toBeVisible();
  await expect(input).toHaveValue(String(expectedValue));
}

/**
 * Assert business validation error
 */
export async function assertBusinessError(
  page: Page,
  expectedMessage: string
): Promise<void> {
  const errorToast = page.locator('[role="alert"]', { hasText: expectedMessage });
  await expect(errorToast).toBeVisible({ timeout: 5000 });
}

/**
 * Assert minimum scrapers error (BUG-02 detection)
 */
export async function assertMinScrapersError(page: Page): Promise<void> {
  await assertBusinessError(page, expectedErrors.MIN_SCRAPERS);
}

/**
 * Assert no console errors (except expected business validation)
 */
export async function assertNoUnexpectedConsoleErrors(
  consoleMessages: Array<{ type: string; text: string }>
): Promise<void> {
  const unexpectedErrors = consoleMessages.filter(msg => {
    if (msg.type !== 'error') return false;

    // Filter out expected errors
    const isExpectedBusinessError = msg.text.includes('400 Bad Request');
    const isExpectedTradingViewError = msg.text.includes('TradingView');
    const isExpectedExtensionError = msg.text.includes('chrome-extension');

    return !isExpectedBusinessError && !isExpectedTradingViewError && !isExpectedExtensionError;
  });

  if (unexpectedErrors.length > 0) {
    console.error('Unexpected console errors:', unexpectedErrors);
  }

  expect(unexpectedErrors).toHaveLength(0);
}

/**
 * Assert network request succeeded
 */
export async function assertNetworkRequestSuccess(
  request: { status: number; url: string; method: string }
): Promise<void> {
  // Allow 200 (success), 201 (created), 400 (expected business validation)
  const allowedStatuses = [200, 201, 400];
  const isSuccess = allowedStatuses.includes(request.status);

  if (!isSuccess) {
    console.error(`Unexpected network error: ${request.method} ${request.url} - Status: ${request.status}`);
  }

  expect(isSuccess).toBe(true);
}

/**
 * Assert debounce protection (BUG-B1 detection)
 *
 * Tests that rapid clicks (<100ms apart) are properly debounced.
 * Only Playwright MCP with <1ms timing can reliably detect race conditions.
 */
export async function assertDebounceProtection(
  page: Page,
  scraperId: string,
  clickInterval: number = timingConstants.HUMAN_CLICK_INTERVAL
): Promise<{ initialCount: number; finalCount: number; debounced: boolean }> {
  // Get initial active scraper count
  const initialCountText = await page.locator('[data-testid="active-scrapers-count"]').textContent();
  const initialCount = parseInt(initialCountText || '0', 10);

  // Perform rapid double-click
  const switchElement = page.getByRole('switch', { name: new RegExp(scraperId, 'i') });

  await switchElement.click();
  await page.waitForTimeout(clickInterval); // Wait specified interval
  await switchElement.click();

  // Wait for any mutations to complete
  await page.waitForTimeout(timingConstants.REACT_QUERY_REFETCH);

  // Get final count
  const finalCountText = await page.locator('[data-testid="active-scrapers-count"]').textContent();
  const finalCount = parseInt(finalCountText || '0', 10);

  // If debounce works: count should change by ±1 (one toggle)
  // If race condition: count might change by 0 or ±2 (both toggles processed)
  const debounced = Math.abs(finalCount - initialCount) === 1;

  return { initialCount, finalCount, debounced };
}

/**
 * Assert profile idempotency (SC-03.1)
 */
export async function assertProfileIdempotency(
  page: Page,
  profileName: string
): Promise<void> {
  // Apply profile first time
  const profileButton = page.getByRole('button', { name: new RegExp(profileName, 'i') });
  await profileButton.click();
  await page.waitForTimeout(1000);

  // Get state after first application
  const firstState = await captureScraperState(page);

  // Apply same profile second time
  await profileButton.click();
  await page.waitForTimeout(1000);

  // Get state after second application
  const secondState = await captureScraperState(page);

  // States should be identical (idempotent)
  expect(firstState).toEqual(secondState);
}

/**
 * Capture current scraper configuration state
 */
export async function captureScraperState(page: Page): Promise<Record<string, unknown>> {
  const state: Record<string, unknown> = {};

  // Capture all switch states
  const switches = await page.getByRole('switch').all();
  for (const switchElement of switches) {
    const label = await switchElement.getAttribute('aria-label');
    const checked = await switchElement.isChecked();
    if (label) {
      state[label] = checked;
    }
  }

  // Capture parameter values
  const inputs = await page.locator('input[data-testid]').all();
  for (const input of inputs) {
    const testId = await input.getAttribute('data-testid');
    const value = await input.inputValue();
    if (testId) {
      state[testId] = value;
    }
  }

  return state;
}

/**
 * Assert keyboard navigation works
 */
export async function assertKeyboardNavigation(
  page: Page,
  scraperId: string
): Promise<void> {
  // Focus the switch using Tab
  const switchElement = page.getByRole('switch', { name: new RegExp(scraperId, 'i') });
  await switchElement.focus();

  // Verify focus visible
  await expect(switchElement).toBeFocused();

  // Toggle using Space key
  const initialState = await switchElement.isChecked();
  await page.keyboard.press('Space');

  // Wait for state change
  await page.waitForTimeout(1000);

  // Verify state changed
  const finalState = await switchElement.isChecked();
  expect(finalState).not.toBe(initialState);
}

/**
 * Assert focus visibility (BUG-C1 detection)
 */
export async function assertFocusVisibility(
  locator: Locator
): Promise<void> {
  await locator.focus();
  await expect(locator).toBeFocused();

  // Check if focus ring is visible (computed styles)
  const outlineWidth = await locator.evaluate((el) =>
    window.getComputedStyle(el).outlineWidth
  );

  const outlineStyle = await locator.evaluate((el) =>
    window.getComputedStyle(el).outlineStyle
  );

  // Focus should have visible outline
  const hasFocusRing = outlineWidth !== '0px' && outlineStyle !== 'none';
  expect(hasFocusRing).toBe(true);
}

/**
 * Assert WCAG color contrast (minimum 4.5:1 for normal text)
 */
export function assertColorContrast(
  foreground: string,
  background: string,
  minimumRatio: number = 4.5
): void {
  const ratio = calculateContrastRatio(foreground, background);
  expect(ratio).toBeGreaterThanOrEqual(minimumRatio);
}

/**
 * Calculate WCAG contrast ratio
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
function calculateContrastRatio(foreground: string, background: string): number {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
function getRelativeLuminance(color: string): number {
  // Parse RGB values from hex
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // Apply gamma correction
  const gammaCorrect = (value: number): number => {
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };

  const R = gammaCorrect(r);
  const G = gammaCorrect(g);
  const B = gammaCorrect(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Wait for counter change (with timeout)
 */
export async function waitForCounterChange(
  page: Page,
  testId: string,
  expectedChange: number,
  timeout: number = 5000
): Promise<void> {
  const initialText = await page.locator(`[data-testid="${testId}"]`).textContent();
  const initialCount = parseInt(initialText || '0', 10);
  const expectedCount = initialCount + expectedChange;

  await expect(async () => {
    const currentText = await page.locator(`[data-testid="${testId}"]`).textContent();
    const currentCount = parseInt(currentText || '0', 10);
    expect(currentCount).toBe(expectedCount);
  }).toPass({ timeout });
}

/**
 * Assert mutation completed successfully
 */
export async function assertMutationSuccess(
  page: Page,
  mutationName: string
): Promise<void> {
  // Wait for React Query mutation to complete
  await page.waitForTimeout(timingConstants.MUTATION_LATENCY);

  // Check for success toast
  const successToast = page.locator('[role="alert"]', { hasText: /success|completed|updated/i });
  await expect(successToast).toBeVisible({ timeout: 5000 });
}

/**
 * Assert loading state appears and disappears
 */
export async function assertLoadingState(
  page: Page,
  action: () => Promise<void>
): Promise<void> {
  // Check loading appears
  const loadingPromise = page.waitForSelector('[data-testid="loading-spinner"]', {
    state: 'visible',
    timeout: 1000,
  });

  // Perform action
  await action();

  // Wait for loading to appear
  await loadingPromise;

  // Wait for loading to disappear
  await page.waitForSelector('[data-testid="loading-spinner"]', {
    state: 'hidden',
    timeout: 5000,
  });
}
