import { test, expect } from '@playwright/test';

test('minimal test', async ({ page }) => {
  await page.goto('http://localhost:3100');
  expect(true).toBe(true);
});
