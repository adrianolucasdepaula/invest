import { test, expect } from '@playwright/test';

/**
 * Teste simples para validar que o Playwright está funcionando
 * Acessa uma página pública na internet
 */
test.describe('Playwright - Teste de Validação Simples', () => {
  test('deve acessar o site do Playwright e validar título', async ({ page }) => {
    // Navegar para o site do Playwright
    await page.goto('https://playwright.dev');

    // Verificar que o título contém "Playwright"
    await expect(page).toHaveTitle(/Playwright/);

    console.log('✅ Playwright está funcionando corretamente!');
  });

  test('deve conseguir interagir com elementos na página', async ({ page }) => {
    // Navegar para o site do Playwright
    await page.goto('https://playwright.dev');

    // Verificar que consegue encontrar o link "Get Started"
    const getStartedLink = page.getByRole('link', { name: /get started/i }).first();
    await expect(getStartedLink).toBeVisible();

    console.log('✅ Consegue encontrar e validar elementos na página!');
  });

  test('deve tirar screenshot da página', async ({ page }) => {
    // Navegar para o site do Playwright
    await page.goto('https://playwright.dev');

    // Tirar screenshot
    await page.screenshot({
      path: 'test-results/playwright-validation-screenshot.png',
      fullPage: true
    });

    console.log('✅ Screenshot capturado com sucesso!');
  });
});
