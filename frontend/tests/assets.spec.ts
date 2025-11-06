import { test, expect } from '@playwright/test';

test.describe('Assets Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assets');
  });

  test('deve renderizar o título e descrição da página', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Ativos');
    await expect(page.getByText('Explore e analise os principais ativos da B3')).toBeVisible();
  });

  test('deve exibir campo de busca', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por ticker ou nome...');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEditable();
  });

  test('deve exibir botão de filtros', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Filtros/i })).toBeVisible();
  });

  test('deve exibir lista completa de ativos', async ({ page }) => {
    // Verificar se todos os 10 ativos mockados estão visíveis
    await expect(page.getByText('PETR4')).toBeVisible();
    await expect(page.getByText('VALE3')).toBeVisible();
    await expect(page.getByText('ITUB4')).toBeVisible();
    await expect(page.getByText('BBDC4')).toBeVisible();
    await expect(page.getByText('BBAS3')).toBeVisible();
    await expect(page.getByText('ABEV3')).toBeVisible();
    await expect(page.getByText('WEGE3')).toBeVisible();
    await expect(page.getByText('RENT3')).toBeVisible();
    await expect(page.getByText('MGLU3')).toBeVisible();
    await expect(page.getByText('SUZB3')).toBeVisible();
  });

  test('deve filtrar ativos por ticker', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por ticker ou nome...');

    // Buscar por PETR4
    await searchInput.fill('PETR4');
    await expect(page.getByText('PETR4')).toBeVisible();
    await expect(page.getByText('Petrobras PN')).toBeVisible();

    // Outros ativos não devem estar visíveis
    await expect(page.getByText('VALE3')).not.toBeVisible();
  });

  test('deve filtrar ativos por nome', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por ticker ou nome...');

    // Buscar por "Petrobras"
    await searchInput.fill('Petrobras');
    await expect(page.getByText('PETR4')).toBeVisible();
    await expect(page.getByText('Petrobras PN')).toBeVisible();
  });

  test('deve fazer busca case-insensitive', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por ticker ou nome...');

    // Buscar com lowercase
    await searchInput.fill('petr4');
    await expect(page.getByText('PETR4')).toBeVisible();

    // Limpar e buscar com uppercase
    await searchInput.clear();
    await searchInput.fill('PETR4');
    await expect(page.getByText('PETR4')).toBeVisible();
  });

  test('deve exibir informações completas dos ativos', async ({ page }) => {
    // Verificar se preços estão formatados corretamente
    const priceElements = page.locator('text=/R\\$\\s*[\\d,]+/');
    await expect(priceElements.first()).toBeVisible();

    // Verificar se porcentagens estão visíveis
    const percentElements = page.locator('text=/%/');
    await expect(percentElements.first()).toBeVisible();
  });

  test('deve navegar para detalhes do ativo ao clicar', async ({ page }) => {
    // Clicar em um ativo
    await page.getByText('PETR4').first().click();

    // Verificar se navegou para página de detalhes
    await page.waitForURL(/\/assets\/PETR4/);
    await expect(page.url()).toContain('/assets/PETR4');
  });

  test('deve ter layout responsivo', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByPlaceholder('Buscar por ticker ou nome...')).toBeVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByPlaceholder('Buscar por ticker ou nome...')).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByPlaceholder('Buscar por ticker ou nome...')).toBeVisible();
  });

  test('deve mostrar volume e market cap quando disponíveis', async ({ page }) => {
    // Verificar se existem elementos com formatação de números grandes
    await expect(page.locator('text=/[0-9]+[KMB]/').first()).toBeVisible();
  });
});
