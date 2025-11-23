import { test, expect } from '@playwright/test';

/**
 * Teste visual com pausas para demonstrar o Playwright funcionando
 */
test.describe('Playwright - Demonstração Visual', () => {
  test('demonstração completa com janela visível', async ({ page }) => {
    console.log('\n🌐 Abrindo o navegador...');

    // Navegar para o Google
    console.log('📍 Navegando para o Google...');
    await page.goto('https://www.google.com');
    await page.waitForTimeout(2000); // Pausa de 2 segundos

    // Verificar título
    await expect(page).toHaveTitle(/Google/);
    console.log('✅ Título validado: Google');
    await page.waitForTimeout(1000);

    // Procurar pela caixa de busca
    console.log('🔍 Procurando caixa de busca...');
    const searchBox = page.locator('textarea[name="q"]').first();
    await expect(searchBox).toBeVisible();
    await page.waitForTimeout(1000);

    // Digitar na caixa de busca
    console.log('⌨️  Digitando "Playwright testing"...');
    await searchBox.fill('Playwright testing');
    await page.waitForTimeout(2000);

    // Tirar screenshot
    console.log('📸 Tirando screenshot...');
    await page.screenshot({
      path: 'test-results/google-demo-screenshot.png',
      fullPage: true
    });
    await page.waitForTimeout(1000);

    // Pressionar Enter
    console.log('🔄 Enviando busca...');
    await searchBox.press('Enter');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Pausa de 3 segundos para ver resultados

    console.log('✅ Demonstração completa!');
    console.log('🎯 O navegador vai fechar em 2 segundos...');
    await page.waitForTimeout(2000);
  });

  test('navegar entre múltiplas páginas', async ({ page }) => {
    console.log('\n🌐 Teste de navegação múltipla...');

    // Página 1: Playwright
    console.log('📍 1. Acessando Playwright.dev...');
    await page.goto('https://playwright.dev');
    await page.waitForTimeout(3000);

    // Página 2: GitHub
    console.log('📍 2. Acessando GitHub...');
    await page.goto('https://github.com');
    await page.waitForTimeout(3000);

    // Página 3: Stack Overflow
    console.log('📍 3. Acessando Stack Overflow...');
    await page.goto('https://stackoverflow.com');
    await page.waitForTimeout(3000);

    console.log('✅ Navegação completa! Fechando em 2s...');
    await page.waitForTimeout(2000);
  });
});
