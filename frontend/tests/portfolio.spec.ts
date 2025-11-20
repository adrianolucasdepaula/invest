import { test, expect } from '@playwright/test';

test.describe('Portfolio Page', () => {
  test.setTimeout(120000); // Aumentar timeout para 2 minutos

  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle'); // Esperar carregamento de dados
  });

  test('deve renderizar o título da página', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Portfólio');
  });

  test('deve exibir botões de ação do portfólio', async ({ page }) => {
    // Verificar botão de importar portfólio
    await expect(page.getByRole('button', { name: /Importar Portfólio/i })).toBeVisible();

    // Verificar botão de adicionar posição
    await expect(page.getByRole('button', { name: /Adicionar Posição/i })).toBeVisible();
  });

  test('deve abrir dialog de adicionar posição', async ({ page }) => {
    // Clicar no botão
    await page.getByRole('button', { name: /Adicionar Posição/i }).click();

    // Verificar se dialog abriu
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Adicionar um novo ativo ao seu portfólio')).toBeVisible();
  });

  test('dialog adicionar posição deve ter campos obrigatórios', async ({ page }) => {
    await page.getByRole('button', { name: /Adicionar Posição/i }).click();

    // Verificar campos
    await expect(page.getByLabel('Ticker *')).toBeVisible();
    await expect(page.getByLabel('Quantidade *')).toBeVisible();
    await expect(page.getByLabel('Preço Médio *')).toBeVisible();
  });

  test('deve validar campos obrigatórios no formulário de adicionar posição', async ({ page }) => {
    await page.getByRole('button', { name: /Adicionar Posição/i }).click();

    // Tentar submeter sem preencher
    const submitButton = page.getByRole('button', { name: /^Adicionar$/i });
    await submitButton.click();

    // Campos devem estar com validação HTML5
    const tickerInput = page.getByLabel('Ticker *');
    const isInvalid = await tickerInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('deve preencher e mostrar resumo no dialog de adicionar posição', async ({ page }) => {
    await page.getByRole('button', { name: /Adicionar Posição/i }).click();

    // Preencher campos
    await page.getByLabel('Ticker *').fill('PETR4');
    await page.getByLabel('Quantidade *').fill('100');
    await page.getByLabel('Preço Médio *').fill('38.50');

    // Verificar se resumo aparece
    await expect(page.getByText('Resumo:')).toBeVisible();
    await expect(page.getByText('PETR4')).toBeVisible();
    await expect(page.getByText('100')).toBeVisible();
    await expect(page.getByText('Valor Investido:')).toBeVisible();
  });

  test('deve calcular valor investido corretamente no resumo', async ({ page }) => {
    await page.getByRole('button', { name: /Adicionar Posição/i }).click();

    await page.getByLabel('Ticker *').fill('TEST1');
    await page.getByLabel('Quantidade *').fill('100');
    await page.getByLabel('Preço Médio *').fill('10.00');

    // Valor investido deve ser 1000.00 (100 * 10)
    await expect(page.getByText(/R\$\s*1\.000,00/)).toBeVisible();
  });

  test('deve abrir dialog de importar portfólio', async ({ page }) => {
    await page.getByRole('button', { name: /Importar Portfólio/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Importe seu portfólio de outras plataformas')).toBeVisible();
  });

  test('dialog importar deve ter seletor de fonte', async ({ page }) => {
    await page.getByRole('button', { name: /Importar Portfólio/i }).click();

    // Verificar label de fonte
    await expect(page.getByText('Fonte *')).toBeVisible();

    // Verificar se select está presente (pode estar como combobox no Radix UI)
    const sourceSelect = page.locator('[role="combobox"]').first();
    await expect(sourceSelect).toBeVisible();
  });

  test('deve ter opções de fonte de importação', async ({ page }) => {
    await page.getByRole('button', { name: /Importar Portfólio/i }).click();

    // Clicar no select para abrir opções
    const sourceSelect = page.locator('[role="combobox"]').first();
    await sourceSelect.click();

    // Verificar opções (ajustar conforme implementação do Select)
    await expect(page.getByText('B3 (CEI)')).toBeVisible();
  });

  test('deve ter campo de upload de arquivo no dialog de importar', async ({ page }) => {
    await page.getByRole('button', { name: /Importar Portfólio/i }).click();

    // Verificar se há input de arquivo
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('deve fechar dialog ao clicar em cancelar', async ({ page }) => {
    await page.getByRole('button', { name: /Adicionar Posição/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await page.getByRole('button', { name: /Cancelar/i }).click();

    await expect(dialog).not.toBeVisible();
  });

  test('ticker deve ser convertido para maiúsculas automaticamente', async ({ page }) => {
    await page.getByRole('button', { name: /Adicionar Posição/i }).click();

    const tickerInput = page.getByLabel('Ticker *');
    await tickerInput.fill('petr4');

    // Input deve ter transformado para uppercase
    await expect(tickerInput).toHaveValue('PETR4');
  });

  test('campos numéricos devem aceitar apenas números', async ({ page }) => {
    await page.getByRole('button', { name: /Adicionar Posição/i }).click();

    const quantityInput = page.getByLabel('Quantidade *');
    await expect(quantityInput).toHaveAttribute('type', 'number');

    const priceInput = page.getByLabel('Preço Médio *');
    await expect(priceInput).toHaveAttribute('type', 'number');
  });
});
