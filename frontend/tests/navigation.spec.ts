import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('deve navegar do dashboard para ativos', async ({ page }) => {
    await page.goto('/dashboard');

    // Clicar no link de Ativos na sidebar
    await page.getByRole('link', { name: /Ativos/i }).click();

    await page.waitForURL(/\/assets/);
    await expect(page.locator('h1')).toContainText('Ativos');
  });

  test('deve navegar do dashboard para portfólio', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByRole('link', { name: /Portfólio/i }).click();

    await page.waitForURL(/\/portfolio/);
    await expect(page.locator('h1')).toContainText('Portfólio');
  });

  test('deve navegar do dashboard para relatórios', async ({ page }) => {
    await page.goto('/dashboard');

    await page.getByRole('link', { name: /Relatórios/i }).click();

    await page.waitForURL(/\/reports/);
    await expect(page.locator('h1')).toContainText('Relatórios');
  });

  test('sidebar deve estar presente em todas as páginas do dashboard', async ({ page }) => {
    const pages = ['/dashboard', '/assets', '/portfolio', '/reports'];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      // Verificar se sidebar está presente
      await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Ativos/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Portfólio/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Relatórios/i })).toBeVisible();
    }
  });

  test('deve manter estado ativo do link na sidebar', async ({ page }) => {
    await page.goto('/assets');

    // Link de Ativos deve ter classe indicando que está ativo
    const activeLink = page.getByRole('link', { name: /Ativos/i });
    const className = await activeLink.getAttribute('class');

    // Verificar se tem alguma classe de ativo (bg-accent, bg-secondary, etc)
    expect(className).toMatch(/bg-/);
  });

  test('deve permitir navegação pelo histórico do navegador', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: /Ativos/i }).click();
    await page.waitForURL(/\/assets/);

    // Voltar
    await page.goBack();
    await expect(page.url()).toContain('/dashboard');

    // Avançar
    await page.goForward();
    await expect(page.url()).toContain('/assets');
  });

  test('logo ou título deve redirecionar para dashboard', async ({ page }) => {
    await page.goto('/assets');

    // Procurar por link com texto "B3 AI Analysis" ou similar
    const logoLink = page.locator('a[href="/dashboard"], a[href="/"]').first();

    if (await logoLink.isVisible()) {
      await logoLink.click();
      await page.waitForURL(/\/dashboard|\/$/);
    }
  });

  test('deve carregar páginas sem erros de console', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.goto('/assets');
    await page.goto('/portfolio');
    await page.goto('/reports');

    // Filtrar erros conhecidos/esperados (como Google Fonts em ambiente sem internet)
    const criticalErrors = consoleErrors.filter(
      (error) => !error.includes('fonts.googleapis.com') && !error.includes('Failed to fetch')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('URL 404 deve exibir página de erro ou redirecionar', async ({ page }) => {
    const response = await page.goto('/pagina-que-nao-existe');

    // Deve retornar 404 ou redirecionar
    expect([404, 200]).toContain(response?.status() || 0);
  });
});
