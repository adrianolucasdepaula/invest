import { test, expect } from '@playwright/test';

test.describe('Technical Analysis Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3100/login');
    await page.fill('input[type="email"]', 'admin@invest.com');
    await page.fill('input[type="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should navigate to technical analysis page', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/VALE3/technical');
    await expect(page.locator('h1')).toContainText('VALE3');
    await expect(page.locator('text=Análise Técnica Avançada')).toBeVisible();
  });

  test('should display multi-pane chart', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/VALE3/technical');
    await page.waitForTimeout(3000); // Wait for charts to load

    // Check candlestick pane
    await expect(page.locator('canvas').first()).toBeVisible();

    // Check RSI pane (if enabled)
    const rsiCheckbox = page.locator('input[id="rsi"]');
    if (await rsiCheckbox.isChecked()) {
      await expect(page.locator('canvas').nth(1)).toBeVisible();
    }
  });

  test('should toggle indicators', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/VALE3/technical');

    // Toggle SMA 200
    const sma200Checkbox = page.locator('input[id="sma200"]');
    const initialState = await sma200Checkbox.isChecked();
    await sma200Checkbox.click();

    // Verify state changed
    const newState = await sma200Checkbox.isChecked();
    expect(newState).toBe(!initialState);
  });

  test('should change timeframe', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/VALE3/technical');

    // Click 1MO timeframe
    await page.click('button:has-text("1MO")');
    await expect(page.locator('button:has-text("1MO")')).toHaveClass(/default/);
  });

  test('should display price and change', async ({ page }) => {
    await page.goto('http://localhost:3100/assets/VALE3/technical');

    // Check price is displayed
    await expect(page.locator('text=/R\\$ \\d+\\.\\d{2}/')).toBeVisible();

    // Check price change is displayed
    await expect(page.locator('text=/[+-]?\\d+\\.\\d{2}%/')).toBeVisible();
  });
});
