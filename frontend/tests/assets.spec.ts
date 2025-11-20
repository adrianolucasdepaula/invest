import { test, expect } from '@playwright/test';

test.describe('Assets Page', () => {
  test.setTimeout(120000); // Aumentar timeout para 2 minutos

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('requestfailed', request => console.log('FAILED REQUEST:', request.url(), request.failure()?.errorText));
    await page.goto('/assets');
    await page.waitForLoadState('networkidle'); // Esperar carregamento de dados
    console.log('Current URL:', page.url());
  });

  test('deve renderizar o título e descrição da página', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Ativos');
    await expect(page.getByText('Explore e analise os principais ativos da B3')).toBeVisible();
  });

  test('deve exibir campo de busca', async ({ page }) => {
    // Placeholder correto conforme page.tsx
    const searchInput = page.getByPlaceholder('Buscar por ticker, nome ou setor...');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEditable();
  });

  test('deve exibir opções de ordenação e visualização', async ({ page }) => {
    // Verificar Selects de Ordenação e Visualização (Valores padrão)
    await expect(page.getByText('Ticker (A-Z)')).toBeVisible();
    await expect(page.getByText('Todos', { exact: true })).toBeVisible();
  });

  test('deve exibir lista de ativos', async ({ page }) => {
    // Verificar se a tabela ou lista está visível
    // Assumindo que AssetTable renderiza uma tabela ou grid
    // Vamos verificar se existe pelo menos um ativo renderizado (ex: PETR4 ou VALE3)
    // Usar .first() para evitar erros de strict mode se houver duplicatas
    const assetRow = page.locator('text=PETR4').first();
    await expect(assetRow).toBeVisible();
  });

  test('deve filtrar ativos por ticker', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por ticker, nome ou setor...');

    // Buscar por PETR4
    await searchInput.fill('PETR4');
    await expect(page.getByText('PETR4').first()).toBeVisible();

    // Verificar se VALE3 (que não é PETR4) não está visível
    // Nota: Isso pode ser flaky se VALE3 não estiver na tela por outros motivos, mas é um teste padrão
    await expect(page.getByText('VALE3')).not.toBeVisible();
  });

  test('deve exibir informações completas dos ativos', async ({ page }) => {
    // Verificar se preços estão formatados corretamente (R$)
    const priceElements = page.locator('text=/R\\$\\s*[\\d,]+/');
    await expect(priceElements.first()).toBeVisible();

    // Verificar se porcentagens estão visíveis (%)
    const percentElements = page.locator('text=/%/');
    await expect(percentElements.first()).toBeVisible();
  });

  test('deve navegar para detalhes do ativo ao clicar', async ({ page }) => {
    // Clicar em um ativo (PETR4)
    await page.getByText('PETR4').first().click();

    // Verificar se navegou para página de detalhes
    await page.waitForURL(/\/assets\/PETR4/);
    await expect(page.url()).toContain('/assets/PETR4');
  });

  test('deve ter layout responsivo', async ({ page }) => {
    const placeholder = 'Buscar por ticker, nome ou setor...';

    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByPlaceholder(placeholder)).toBeVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByPlaceholder(placeholder)).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByPlaceholder(placeholder)).toBeVisible();
  });
});
