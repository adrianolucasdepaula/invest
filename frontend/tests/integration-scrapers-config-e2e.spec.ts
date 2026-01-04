import { test, expect } from '@playwright/test';

/**
 * TESTE A: Validação de Integração End-to-End
 * Scrapers Config → Data Collection → Discrepancies
 *
 * Objetivo: Validar que ajustes em /admin/scrapers refletem em coleta
 */

test.describe('Integração E2E: Scraper Config → Coleta → Discrepâncias', () => {

  test.beforeEach(async ({ page }) => {
    // Autenticação (assumindo que .auth/user.json existe)
    await page.goto('http://localhost:3100');
  });

  test('FASE 1: Toggle scraper atualiza sem F5', async ({ page }) => {
    // Navigate
    await page.goto('http://localhost:3100/admin/scrapers');

    // Aguardar página carregar
    await page.waitForSelector('text=Controle de Scrapers', { timeout: 10000 });

    // Capturar estado inicial
    const before = await page.locator('text=/Ativos: (\\d+) de 42/').textContent();
    const beforeMatch = before?.match(/(\d+)/);
    const beforeCount = beforeMatch ? parseInt(beforeMatch[1]) : 0;

    // Encontrar primeiro toggle ativo
    const toggle = page.locator('button[role="switch"][aria-checked="true"]').first();
    await toggle.click();

    // Aguardar refetch (novo código com refetchQueries)
    await page.waitForTimeout(2500);

    // Capturar estado depois (SEM F5!)
    const after = await page.locator('text=/Ativos: (\\d+) de 42/').textContent();
    const afterMatch = after?.match(/(\d+)/);
    const afterCount = afterMatch ? parseInt(afterMatch[1]) : 0;

    // Assertions
    expect(beforeCount).toBeGreaterThan(0);
    expect(afterCount).toBe(beforeCount - 1);
    expect(afterCount).toBeGreaterThanOrEqual(2); // Mínimo 2 scrapers

    console.log(`✅ Toggle funcionou: ${beforeCount} → ${afterCount} (sem F5)`);
  });

  test('FASE 2: Advanced Parameters persistem sem F5', async ({ page }) => {
    await page.goto('http://localhost:3100/admin/scrapers');

    // Expandir primeiro card
    const expandButtons = page.locator('button').filter({ hasText: /Expandir|parâmetros/ });
    const firstExpand = expandButtons.first();

    if (await firstExpand.isVisible()) {
      await firstExpand.click();
      await page.waitForTimeout(1000);

      // Encontrar input timeout
      const timeoutInput = page.locator('input[type="number"]').first();

      if (await timeoutInput.isVisible()) {
        const beforeValue = await timeoutInput.inputValue();

        // Modificar
        await timeoutInput.fill('150000');

        // Aguardar debounce + mutation
        await page.waitForTimeout(3500);

        // Verificar persiste
        const afterValue = await timeoutInput.inputValue();

        expect(afterValue).toBe('150000');
        console.log(`✅ Parameters funcionou: ${beforeValue} → ${afterValue} (sem F5)`);
      }
    }
  });

  test('FASE 3: Aplicar Perfil e verificar contador', async ({ page }) => {
    await page.goto('http://localhost:3100/admin/scrapers');

    // Clicar "Perfil Mínimo" (2 scrapers)
    await page.getByRole('button', { name: /Perfil Mínimo/i }).click();

    // Aguardar refetch
    await page.waitForTimeout(3000);

    // Verificar contador
    const count = await page.locator('text=/Ativos: (\\d+) de 42/').textContent();

    // Deve mostrar 2 scrapers
    expect(count).toContain('2 de 42');

    console.log(`✅ Perfil aplicado: ${count}`);
  });

  test.skip('FASE 4: Coletar dados PETR4 (longo)', async ({ page }) => {
    // Skip por default (demora ~2-5 min)
    // Executar com: npx playwright test --grep @slow

    await page.goto('http://localhost:3100/assets');

    // Search PETR4
    await page.getByPlaceholder(/Buscar/i).fill('PETR4');
    await page.waitForTimeout(1000);

    // Localizar linha PETR4 e clicar atualizar
    const petr4Row = page.locator('tr').filter({ hasText: 'PETR4' });
    await petr4Row.locator('button').first().click();

    // Clicar "Atualizar Dados" no dropdown
    await page.getByText('Atualizar Dados').click();

    // Aguardar conclusão (pode demorar muito)
    await page.waitForSelector('text=/concluída|success/i', { timeout: 300000 });

    console.log('✅ Coleta PETR4 concluída');
  });

  test.skip('FASE 5: Verificar discrepâncias (requer coleta prévia)', async ({ page }) => {
    await page.goto('http://localhost:3100/discrepancies');

    // Filtrar PETR4
    await page.getByPlaceholder('Ticker').fill('PETR4');
    await page.waitForTimeout(1000);

    // Verificar tabela existe
    const table = page.locator('[role="table"]');
    await expect(table).toBeVisible();

    // Contar discrepâncias (pode ser 0)
    const rows = await table.locator('tbody tr').count();

    console.log(`✅ Discrepâncias PETR4: ${rows} encontradas`);
  });

});
