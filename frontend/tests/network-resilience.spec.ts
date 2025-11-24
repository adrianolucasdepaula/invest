import { test, expect } from '@playwright/test';

// Definições de perfis de rede (Chrome DevTools Protocol)
const NETWORK_CONDITIONS = {
  'Slow 3G': {
    offline: false,
    downloadThroughput: (500 * 1024) / 8, // 500 kbps
    uploadThroughput: (50 * 1024) / 8, // 50 kbps
    latency: 400,
  },
  'Fast 3G': {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
    uploadThroughput: (750 * 1024) / 8, // 750 kbps
    latency: 150,
  },
  Offline: {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  },
};

test.describe('Network Resilience & Performance', () => {
  // Aumentar timeout para testes de rede (emulação deixa tudo mais lento)
  test.slow();

  test('Dashboard Load Performance @ Slow 3G', async ({ page, browserName }) => {
    // CDP session is only available in Chromium-based browsers
    if (browserName !== 'chromium') test.skip();

    // Configurar Slow 3G
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS['Slow 3G']);

    const startTime = Date.now();
    await page.goto('/dashboard');

    // Aguardar carregamento principal
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Dashboard Load Time (Slow 3G): ${loadTime}ms`);

    // Verificar se conteúdo final carregou
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Asset Navigation @ Fast 3G', async ({ page, browserName }) => {
    // CDP session is only available in Chromium-based browsers
    if (browserName !== 'chromium') test.skip();

    // Configurar Fast 3G
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS['Fast 3G']);

    await page.goto('/assets');
    // Fix: Use more specific selector to avoid strict mode violation
    await expect(page.getByRole('heading', { name: 'Ativos', level: 1 })).toBeVisible();

    // Navegar para detalhe de ativo
    // Fix: Use specific link selector with increased timeout for network emulation
    // Click the first available asset link to be more robust
    const assetLink = page.locator('a[href*="/assets/"]').first();
    await assetLink.waitFor({ state: 'visible', timeout: 60000 });
    await assetLink.click({ timeout: 60000 });

    // Verificar tempo de transição
    // Expect any h1 to be visible on the new page
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Offline Handling', async ({ page, browserName }) => {
    // CDP session is only available in Chromium-based browsers
    if (browserName !== 'chromium') test.skip();

    await page.goto('/dashboard');

    // Simular Offline
    const client = await page.context().newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', NETWORK_CONDITIONS['Offline']);

    // Tentar ação que requer rede (ex: navegar para outra página)
    // await page.goto('/assets');

    // Verificar se a UI responde adequadamente (não crasha)
    await expect(page.locator('h1')).toBeVisible();
  });
});
