import { test, expect } from '@playwright/test';

test.describe('Technical Analysis Page', () => {
  test.setTimeout(120000); // Aumentar timeout para 2 minutos

  test.beforeEach(async ({ page }) => {
    // Login já é tratado pelo auth.setup.ts e storageState global
    await page.goto('/assets/VALE3/technical');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to technical analysis page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('VALE3');
    await expect(page.locator('text=Análise Técnica Avançada')).toBeVisible();
  });

  test('should display multi-pane chart', async ({ page }) => {
    // Check candlestick pane
    await expect(page.locator('canvas').first()).toBeVisible();

    // Check RSI pane (if enabled)
    const rsiCheckbox = page.locator('input[id="rsi"]');
    if (await rsiCheckbox.isChecked()) {
      await expect(page.locator('canvas').nth(1)).toBeVisible();
    }
  });

  test('should toggle indicators', async ({ page }) => {
    // Toggle SMA 200
    const sma200Checkbox = page.locator('input[id="sma200"]');
    const initialState = await sma200Checkbox.isChecked();
    await sma200Checkbox.click();

    // Verify state changed
    const newState = await sma200Checkbox.isChecked();
    expect(newState).toBe(!initialState);
  });

  test('should change timeframe', async ({ page }) => {
    // Click 1MO timeframe
    await page.click('button:has-text("1MO")');
    await expect(page.locator('button:has-text("1MO")')).toHaveClass(/default/);
  });

  test('should display price and change', async ({ page }) => {
    // Check price is displayed (flexible regex)
    await expect(page.locator('text=/R\\$\\s*[\\d.,]+/')).toBeVisible();

    // Check price change is displayed (flexible regex)
    await expect(page.locator('text=/[+-]?\\d+[,.]\\d+%/')).toBeVisible();
  });
});
