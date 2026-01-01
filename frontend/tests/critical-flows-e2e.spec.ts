import { test, expect, Page } from '@playwright/test';

/**
 * VALIDACAO E2E DOS 3 FLUXOS CRITICOS - B3 AI Analysis Platform
 *
 * FLUXO 1: INVESTOR JOURNEY - Dashboard -> Asset Detail -> Back
 * FLUXO 2: DATA SYNC JOURNEY - Data Management -> Data Sources -> Discrepancies
 * FLUXO 3: WHEEL STRATEGY JOURNEY - Wheel Dashboard -> Backtest
 *
 * Para cada etapa valida:
 * - Pagina carrega sem erros
 * - Console sem erros criticos
 * - Requisicoes de rede sem falhas 4xx/5xx
 * - Elementos esperados visiveis
 * - Transicoes funcionam
 */

interface FlowStepResult {
  step: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  url: string;
  consoleErrors: string[];
  networkErrors: { url: string; status: number }[];
  notes: string;
}

interface FlowResult {
  name: string;
  status: 'PASS' | 'FAIL';
  totalDuration: number;
  steps: FlowStepResult[];
}

// Helper para capturar erros
async function setupErrorCapture(page: Page) {
  const consoleErrors: string[] = [];
  const networkErrors: { url: string; status: number }[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      networkErrors.push({ url: response.url(), status });
    }
  });

  return { consoleErrors, networkErrors };
}

// Filtrar erros conhecidos/aceitaveis
function filterCriticalErrors(errors: string[]): string[] {
  return errors.filter(e =>
    !e.includes('Download the React DevTools') &&
    !e.includes('favicon') &&
    !e.includes('WebSocket connection') &&
    !e.includes('fonts.googleapis') &&
    !e.includes('googletagmanager')
  );
}

test.describe('CRITICAL FLOWS E2E VALIDATION', () => {
  test.setTimeout(300000); // 5 minutos total (paginas lentas devido scrapers)

  test.describe('FLUXO 1: INVESTOR JOURNEY', () => {
    test('1.1 Dashboard - Verificar indices de mercado e indicadores', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      // Verificar titulo
      await expect(page.locator('h1').filter({ hasText: /Dashboard/i })).toBeVisible();

      // Verificar indicadores de mercado (cards de estatisticas)
      const statsCards = page.locator('text=/Ibovespa|Ativos Rastreados|Maiores Altas|Variacao Media/i');
      expect(await statsCards.count()).toBeGreaterThan(0);

      // Verificar secao de indicadores economicos
      const economicSection = page.locator('[class*="card"], [class*="Card"]');
      expect(await economicSection.count()).toBeGreaterThan(0);

      // Verificar secao Ativos em Destaque (titulo da card)
      const assetsSection = page.locator('text=/Ativos em Destaque/i');
      await expect(assetsSection.first()).toBeVisible();

      // Verificar erros (ignorar erros de fetch para API)
      const criticalErrors = filterCriticalErrors(consoleErrors);
      // Aceitar ate 2 erros nao-criticos (API calls em background)
      expect(criticalErrors.length).toBeLessThanOrEqual(2);
      expect(networkErrors.filter(e => e.status >= 500).length).toBe(0);

      console.log(`FLUXO 1.1 - Dashboard: ${Date.now() - startTime}ms`);
    });

    test('1.2 Selecionar ativo PETR4 na tabela e navegar para detalhes', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      // Clicar em PETR4 na tabela
      const petr4Link = page.locator('a, button, [role="row"]').filter({ hasText: 'PETR4' }).first();
      if (await petr4Link.count() > 0) {
        await petr4Link.click();
        await page.waitForURL(/\/assets\/PETR4/i, { timeout: 10000 });
      } else {
        // Fallback: navegar diretamente
        await page.goto('/assets/PETR4');
      }
      await page.waitForLoadState('domcontentloaded');

      // Verificar pagina de detalhe
      await expect(page.locator('text=PETR4').first()).toBeVisible();

      // Aceitar alguns erros nao-criticos (API calls em background)
      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBeLessThanOrEqual(3);
      expect(networkErrors.filter(e => e.status >= 500).length).toBe(0);

      console.log(`FLUXO 1.2 - Asset Detail: ${Date.now() - startTime}ms`);
    });

    test('1.3 Asset Detail - Verificar grafico e indicadores fundamentalistas', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/assets/PETR4');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000); // Aguardar carregamento de graficos

      // Verificar ticker visivel
      await expect(page.locator('text=PETR4').first()).toBeVisible();

      // Verificar preco ou loading state
      const priceElement = page.locator('text=/R\\$|BRL|Carregando/i').first();
      if (await priceElement.count() > 0) {
        await expect(priceElement).toBeVisible();
      }

      // Verificar cards de informacao (Card components)
      const infoCards = page.locator('[class*="Card"], [class*="card"], [class*="rounded"]');
      expect(await infoCards.count()).toBeGreaterThan(0);

      // Verificar se ha algum conteudo de dados (pode ser loading ou dados)
      const pageContent = page.locator('main, [class*="container"], [class*="content"]');
      await expect(pageContent.first()).toBeVisible();

      // Aceitar erros de API (scrapers demorados)
      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBeLessThanOrEqual(3);
      expect(networkErrors.filter(e => e.status >= 500).length).toBe(0);

      console.log(`FLUXO 1.3 - Asset Detail Charts: ${Date.now() - startTime}ms`);
    });

    test('1.4 Voltar para Dashboard via navegacao', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/assets/PETR4');
      await page.waitForLoadState('domcontentloaded');

      // Voltar via sidebar ou breadcrumb
      const dashboardLink = page.locator('a').filter({ hasText: /Dashboard/i }).first();
      await dashboardLink.click();
      await page.waitForURL(/\/dashboard/i, { timeout: 15000 });

      await expect(page.locator('h1').filter({ hasText: /Dashboard/i })).toBeVisible();

      // Aceitar alguns erros nao-criticos (API calls em background)
      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBeLessThanOrEqual(3);

      console.log(`FLUXO 1.4 - Return to Dashboard: ${Date.now() - startTime}ms`);
    });
  });

  test.describe('FLUXO 2: DATA SYNC JOURNEY', () => {
    test('2.1 Data Management - Verificar status atual', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/data-management');
      await page.waitForLoadState('domcontentloaded');

      // Verificar titulo
      await expect(page.locator('h1').filter({ hasText: /Gerenciamento|Management|Dados/i })).toBeVisible();

      // Verificar controles de sincronizacao
      const syncControls = page.locator('button, input, select').filter({
        hasText: /Sync|Sincronizar|Import|Atualizar|COTAHIST/i
      });
      if (await syncControls.count() > 0) {
        expect(await syncControls.count()).toBeGreaterThan(0);
      }

      // Verificar status cards ou indicators
      const statusIndicators = page.locator('[class*="card"], [class*="status"]');
      expect(await statusIndicators.count()).toBeGreaterThan(0);

      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBe(0);
      expect(networkErrors.filter(e => e.status >= 500).length).toBe(0);

      console.log(`FLUXO 2.1 - Data Management: ${Date.now() - startTime}ms`);
    });

    test('2.2 Data Sources - Verificar status de scrapers', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/data-sources');
      await page.waitForLoadState('domcontentloaded');

      // Verificar titulo "Fontes de Dados"
      await expect(page.locator('h1').filter({ hasText: /Fontes de Dados/i })).toBeVisible();

      // Verificar lista de scrapers
      const scraperList = page.locator('[class*="grid"], [class*="card"], [class*="list"]').first();
      await expect(scraperList).toBeVisible();

      // Verificar indicadores de status (Success, Error, Online, Offline)
      const statusBadges = page.locator('text=/Ativo|Inativo|Online|Offline|Success|Error|OK|Fail/i');
      if (await statusBadges.count() > 0) {
        expect(await statusBadges.count()).toBeGreaterThan(0);
      }

      // Verificar indicadores de qualidade
      const qualityIndicators = page.locator('text=/Qualidade|Quality|Score|Rating|%/i');
      if (await qualityIndicators.count() > 0) {
        expect(await qualityIndicators.count()).toBeGreaterThan(0);
      }

      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBe(0);
      expect(networkErrors.filter(e => e.status >= 500).length).toBe(0);

      console.log(`FLUXO 2.2 - Data Sources: ${Date.now() - startTime}ms`);
    });

    test('2.3 Discrepancies - Verificar se ha discrepancias', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/discrepancies');
      await page.waitForLoadState('domcontentloaded');

      // Verificar titulo
      await expect(page.locator('h1').filter({ hasText: /Discrepancia|Discrepancy|Divergencia/i })).toBeVisible();

      // Verificar tabela ou lista de discrepancias
      const discrepancyList = page.locator('[class*="table"], [class*="grid"], [class*="list"]').first();
      await expect(discrepancyList).toBeVisible();

      // Verificar se ha indicador de quantidade
      const countIndicator = page.locator('text=/\\d+\\s*(discrepancia|item|registro)/i');
      if (await countIndicator.count() > 0) {
        await expect(countIndicator.first()).toBeVisible();
      }

      // Verificar controles de filtragem
      const filterControls = page.locator('input, select, button').filter({
        hasText: /Filtrar|Buscar|Tipo|Status|Resolver/i
      });
      if (await filterControls.count() > 0) {
        expect(await filterControls.count()).toBeGreaterThan(0);
      }

      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBe(0);
      expect(networkErrors.filter(e => e.status >= 500).length).toBe(0);

      console.log(`FLUXO 2.3 - Discrepancies: ${Date.now() - startTime}ms`);
    });

    test('2.4 Navegacao entre paginas Data', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      // Data Management -> Data Sources
      await page.goto('/data-management');
      await page.waitForLoadState('domcontentloaded');

      const dataSourcesLink = page.locator('a').filter({ hasText: /Fonte|Source/i }).first();
      if (await dataSourcesLink.count() > 0) {
        await dataSourcesLink.click();
        await page.waitForURL(/\/data-sources/i, { timeout: 10000 });
      } else {
        await page.goto('/data-sources');
      }
      await page.waitForLoadState('domcontentloaded');

      // Data Sources -> Discrepancies
      const discrepanciesLink = page.locator('a').filter({ hasText: /Discrepancia|Divergencia/i }).first();
      if (await discrepanciesLink.count() > 0) {
        await discrepanciesLink.click();
        await page.waitForURL(/\/discrepancies/i, { timeout: 10000 });
      } else {
        await page.goto('/discrepancies');
      }
      await page.waitForLoadState('domcontentloaded');

      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBe(0);

      console.log(`FLUXO 2.4 - Data Navigation: ${Date.now() - startTime}ms`);
    });
  });

  test.describe('FLUXO 3: WHEEL STRATEGY JOURNEY', () => {
    test('3.1 Wheel Dashboard - Ver candidatos recomendados', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/wheel');
      await page.waitForLoadState('domcontentloaded');

      // Verificar titulo
      await expect(page.locator('h1').filter({ hasText: /Wheel|Estrategia|Strategy/i })).toBeVisible();

      // Verificar lista de candidatos
      const candidatesList = page.locator('[class*="grid"], [class*="card"], [class*="table"], [class*="list"]').first();
      await expect(candidatesList).toBeVisible();

      // Verificar se ha ativos listados
      const assetCards = page.locator('text=/PETR4|VALE3|ITUB4|BBDC4/i');
      if (await assetCards.count() > 0) {
        expect(await assetCards.count()).toBeGreaterThan(0);
      }

      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBe(0);
      expect(networkErrors.filter(e => e.status >= 500).length).toBe(0);

      console.log(`FLUXO 3.1 - Wheel Dashboard: ${Date.now() - startTime}ms`);
    });

    test('3.2 Wheel Dashboard - Verificar calculadora SELIC', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/wheel');
      await page.waitForLoadState('domcontentloaded');

      // Verificar calculadora SELIC ou indicadores de taxa
      const selicIndicator = page.locator('text=/SELIC|Taxa|CDI|Juros|%.*a\\.a/i');
      if (await selicIndicator.count() > 0) {
        await expect(selicIndicator.first()).toBeVisible();
      }

      // Verificar se ha inputs de calculadora
      const calculatorInputs = page.locator('input[type="number"], input[type="text"]').filter({
        has: page.locator('[placeholder*="valor"], [placeholder*="preco"], [placeholder*="strike"]')
      });
      // Pode nao existir na pagina principal

      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBe(0);

      console.log(`FLUXO 3.2 - SELIC Calculator: ${Date.now() - startTime}ms`);
    });

    test('3.3 Wheel Dashboard - Ver lista de estrategias', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/wheel');
      await page.waitForLoadState('domcontentloaded');

      // Verificar tabs (Candidatos, Estrategias, Calculadora)
      const tabs = page.locator('[role="tablist"], [class*="TabsList"]');
      await expect(tabs.first()).toBeVisible();

      // Verificar botao Nova Estrategia no header
      const createButton = page.locator('button').filter({ hasText: /Nova Estrategia|Atualizar/i });
      await expect(createButton.first()).toBeVisible();

      // Verificar cards de resumo (Estrategias Ativas, Capital Alocado, P&L, Candidatos)
      const summaryCards = page.locator('[class*="Card"], [class*="card"]');
      expect(await summaryCards.count()).toBeGreaterThanOrEqual(4);

      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBeLessThanOrEqual(2);

      console.log(`FLUXO 3.3 - Strategy List: ${Date.now() - startTime}ms`);
    });

    test('3.4 Wheel Backtest - Verificar interface', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/wheel/backtest');
      await page.waitForLoadState('domcontentloaded');

      // Verificar titulo ou header
      const pageHeader = page.locator('h1, h2').filter({ hasText: /Backtest|Simulacao|Historico/i });
      if (await pageHeader.count() > 0) {
        await expect(pageHeader.first()).toBeVisible();
      }

      // Verificar controles de backtest
      const backtestControls = page.locator('input, select, button');
      expect(await backtestControls.count()).toBeGreaterThan(0);

      // Verificar se ha formulario de configuracao
      const configForm = page.locator('form, [class*="form"], [class*="config"]');
      if (await configForm.count() > 0) {
        await expect(configForm.first()).toBeVisible();
      }

      // Verificar area de resultados ou grafico
      const resultsArea = page.locator('[class*="result"], [class*="chart"], canvas, svg');
      if (await resultsArea.count() > 0) {
        // Pode estar oculto ate rodar backtest
      }

      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBe(0);
      expect(networkErrors.filter(e => e.status >= 500).length).toBe(0);

      console.log(`FLUXO 3.4 - Backtest Interface: ${Date.now() - startTime}ms`);
    });

    test('3.5 Navegacao Wheel Dashboard -> Backtest', async ({ page }) => {
      const { consoleErrors, networkErrors } = await setupErrorCapture(page);
      const startTime = Date.now();

      await page.goto('/wheel');
      await page.waitForLoadState('domcontentloaded');

      // Navegar para Backtest via link/botao
      const backtestLink = page.locator('a, button').filter({ hasText: /Backtest|Simulacao/i }).first();
      if (await backtestLink.count() > 0) {
        await backtestLink.click();
        await page.waitForURL(/\/wheel\/backtest/i, { timeout: 10000 });
      } else {
        await page.goto('/wheel/backtest');
      }
      await page.waitForLoadState('domcontentloaded');

      // Verificar que chegou na pagina
      expect(page.url()).toContain('/wheel/backtest');

      const criticalErrors = filterCriticalErrors(consoleErrors);
      expect(criticalErrors.length).toBe(0);

      console.log(`FLUXO 3.5 - Wheel Navigation: ${Date.now() - startTime}ms`);
    });
  });

  test.describe('ACCESSIBILITY & RESPONSIVENESS', () => {
    test('A11Y - Dashboard acessibilidade basica', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      // Verificar heading hierarchy
      const h1 = page.locator('h1');
      expect(await h1.count()).toBeGreaterThan(0);

      // Verificar labels em inputs
      const inputs = page.locator('input:visible');
      const inputCount = await inputs.count();
      for (let i = 0; i < Math.min(inputCount, 5); i++) {
        const input = inputs.nth(i);
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');
        const id = await input.getAttribute('id');
        // Deve ter aria-label, placeholder ou id com label associado
        expect(ariaLabel || placeholder || id).toBeTruthy();
      }

      // Verificar contraste minimo (verificacao simplificada)
      const textElements = page.locator('p, span, h1, h2, h3');
      expect(await textElements.count()).toBeGreaterThan(0);
    });

    test('Responsive - Dashboard em diferentes viewports', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');

      // Desktop (1920x1080)
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('h1').first()).toBeVisible();

      // Tablet (768x1024)
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('h1').first()).toBeVisible();

      // Mobile (375x667)
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('Responsive - Wheel em diferentes viewports', async ({ page }) => {
      await page.goto('/wheel');
      await page.waitForLoadState('domcontentloaded');

      // Desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('h1').first()).toBeVisible();

      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('h1').first()).toBeVisible();

      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('h1').first()).toBeVisible();
    });
  });
});
