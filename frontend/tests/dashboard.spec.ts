import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('deve renderizar o título e descrição da página', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.getByText('Visão geral do mercado e do seu portfólio')).toBeVisible();
  });

  test('deve exibir os 4 cards de estatísticas', async ({ page }) => {
    // Verificar cards de estatísticas
    await expect(page.getByText('Ibovespa')).toBeVisible();
    await expect(page.getByText('Valor do Portfólio')).toBeVisible();
    await expect(page.getByText('Ganho do Dia')).toBeVisible();
    await expect(page.getByText('Ganho Total')).toBeVisible();
  });

  test('deve exibir valores formatados nos cards', async ({ page }) => {
    // Verificar formatação de valores monetários (R$)
    const cards = page.locator('[class*="rounded"]').filter({ hasText: 'R$' });
    await expect(cards.first()).toBeVisible();
  });

  test('deve exibir o gráfico do Ibovespa', async ({ page }) => {
    await expect(page.getByText('Ibovespa - Últimos 30 dias')).toBeVisible();
    await expect(page.getByText('Acompanhe a evolução do principal índice da B3')).toBeVisible();
  });

  test('deve exibir seção de maiores altas', async ({ page }) => {
    await expect(page.getByText('Maiores Altas')).toBeVisible();
    await expect(page.getByText('Ativos com melhor performance hoje')).toBeVisible();

    // Verificar se há pelo menos um ativo listado
    await expect(page.getByText('PETR4')).toBeVisible();
  });

  test('deve exibir tabela de ativos em destaque', async ({ page }) => {
    await expect(page.getByText('Ativos em Destaque')).toBeVisible();
    await expect(page.getByText('Principais ativos do mercado brasileiro')).toBeVisible();

    // Verificar se a tabela tem dados
    await expect(page.getByText('VALE3')).toBeVisible();
    await expect(page.getByText('ITUB4')).toBeVisible();
  });

  test('deve exibir valores de variação com cores corretas', async ({ page }) => {
    // Valores positivos devem ter classe de cor verde e valores negativos vermelha
    const positiveChange = page.locator('.text-success, .text-green-600').first();
    await expect(positiveChange).toBeVisible();
  });

  test('deve ter layout responsivo', async ({ page }) => {
    // Teste desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();

    // Teste mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
  });
});
