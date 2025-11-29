import { test, expect } from '@playwright/test';

test('Debug assets page', async ({ page }) => {
  // Capture console messages
  const consoleMessages: string[] = [];
  const networkRequests: { url: string; status: number; body?: string }[] = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('assets')) {
      let body = '';
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          body = await response.text();
          if (body.length > 500) {
            body = body.substring(0, 500) + '... [truncated]';
          }
        }
      } catch (e) {
        body = '[could not read body]';
      }
      networkRequests.push({
        url,
        status: response.status(),
        body
      });
    }
  });

  // Navigate to assets page
  await page.goto('/assets', { waitUntil: 'networkidle', timeout: 60000 });

  // Wait a bit for React to render
  await page.waitForTimeout(3000);

  // Take screenshot
  await page.screenshot({
    path: 'test-results/screenshots/debug-assets.png',
    fullPage: true
  });

  // Check page content
  const pageContent = await page.content();
  const hasTable = pageContent.includes('table') || pageContent.includes('Table');
  const hasAssetTicker = pageContent.includes('PETR') || pageContent.includes('VALE') || pageContent.includes('ITUB');
  const hasError = pageContent.includes('Erro') || pageContent.includes('error');
  const hasLoading = pageContent.includes('Skeleton') || pageContent.includes('loading');
  const hasEmptyMessage = pageContent.includes('Nenhum ativo');

  console.log('\n========================================');
  console.log('DEBUG: Assets Page Analysis');
  console.log('========================================');
  console.log(`Has table: ${hasTable}`);
  console.log(`Has asset ticker: ${hasAssetTicker}`);
  console.log(`Has error message: ${hasError}`);
  console.log(`Has loading state: ${hasLoading}`);
  console.log(`Has empty message: ${hasEmptyMessage}`);
  console.log('\n--- Network Requests ---');
  networkRequests.forEach(req => {
    console.log(`[${req.status}] ${req.url}`);
    if (req.body) {
      console.log(`  Body: ${req.body}`);
    }
  });
  console.log('\n--- Console Messages ---');
  consoleMessages.forEach(msg => console.log(msg));
  console.log('========================================\n');

  // Get visible text
  const visibleText = await page.locator('body').textContent();
  console.log('\n--- Visible Text (first 1000 chars) ---');
  console.log(visibleText?.substring(0, 1000));
});
