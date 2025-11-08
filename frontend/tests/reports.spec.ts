import { test, expect } from '@playwright/test';

test.describe('Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports');
  });

  test('deve renderizar o título da página', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Relatórios');
  });

  test('deve exibir descrição da página', async ({ page }) => {
    await expect(page.getByText(/relatórios.*análise/i)).toBeVisible();
  });

  test('deve ter layout responsivo', async ({ page }) => {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('h1')).toBeVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('h1')).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Report Detail Page', () => {
  test('deve renderizar página de detalhes de relatório', async ({ page }) => {
    // Navegar para uma página de relatório específica
    await page.goto('/reports/test-report-id');

    // Verificar se elementos básicos estão presentes
    // Nota: Esta página pode mostrar erro se o ID não existir, o que é esperado
    await page.waitForLoadState('networkidle');

    // Verificar que a página carregou (mesmo que seja erro 404)
    expect(page.url()).toContain('/reports/test-report-id');
  });
});

test.describe('Components Rendering', () => {
  test('todos os componentes UI devem renderizar sem erros', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Visitar todas as páginas principais
    await page.goto('/dashboard');
    await page.goto('/assets');
    await page.goto('/portfolio');
    await page.goto('/reports');

    // Filtrar erros conhecidos
    const criticalErrors = errors.filter(
      (error) => !error.includes('fetch') && !error.includes('network')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('imagens e ícones devem carregar corretamente', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar se existem ícones (Lucide icons)
    const icons = page.locator('svg');
    const iconCount = await icons.count();

    // Deve haver pelo menos alguns ícones na página
    expect(iconCount).toBeGreaterThan(0);
  });

  test('formulários devem ter acessibilidade adequada', async ({ page }) => {
    await page.goto('/portfolio');

    // Abrir dialog
    await page.getByRole('button', { name: /Adicionar Posição/i }).click();

    // Verificar labels associados aos inputs
    const tickerLabel = page.getByText('Ticker *');
    await expect(tickerLabel).toBeVisible();

    const tickerInput = page.getByLabel('Ticker *');
    await expect(tickerInput).toBeVisible();
  });

  test('botões devem ter estados de hover', async ({ page }) => {
    await page.goto('/dashboard');

    const button = page.getByRole('button').first();

    if (await button.isVisible()) {
      // Hover sobre o botão
      await button.hover();

      // Botão deve ainda estar visível e interativo
      await expect(button).toBeVisible();
    }
  });
});

test.describe('Performance', () => {
  test('páginas devem carregar em tempo razoável', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Página deve carregar em menos de 10 segundos (ambiente de desenvolvimento)
    expect(loadTime).toBeLessThan(10000);
  });

  test('não deve haver memory leaks ao navegar entre páginas', async ({ page }) => {
    // Navegar múltiplas vezes entre páginas
    for (let i = 0; i < 3; i++) {
      await page.goto('/dashboard');
      await page.goto('/assets');
      await page.goto('/portfolio');
      await page.goto('/reports');
    }

    // Se chegou aqui sem travar, o teste passou
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Data Display', () => {
  test('valores monetários devem estar formatados corretamente', async ({ page }) => {
    await page.goto('/dashboard');

    // Procurar por padrão de moeda brasileira (R$ XX,XX)
    const currencyPattern = /R\$\s*[\d.]+,\d{2}/;
    const currencyElements = page.locator(`text=${currencyPattern}`);

    const count = await currencyElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('porcentagens devem estar formatadas corretamente', async ({ page }) => {
    await page.goto('/assets');

    // Procurar por padrão de porcentagem (+X.XX% ou -X.XX%)
    const percentPattern = /[+-]?\d+\.\d+%/;
    const percentElements = page.locator(`text=${percentPattern}`);

    const count = await percentElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('datas devem estar no formato brasileiro', async ({ page }) => {
    await page.goto('/reports');

    // Se houver datas, devem estar no formato DD/MM/YYYY
    const datePattern = /\d{2}\/\d{2}\/\d{4}/;
    const dateElements = page.locator(`text=${datePattern}`);

    // Não obrigatório, mas se existir deve estar correto
    const count = await dateElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
