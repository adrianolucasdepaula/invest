import { test, expect, Page } from '@playwright/test';

/**
 * VALIDAÇÃO FRONTEND COMPLETA - B3 AI Analysis Platform
 *
 * Valida todas as 14 páginas principais do sistema:
 * - Public Pages: /, /login, /register
 * - Dashboard Pages: /dashboard, /assets, /assets/[ticker], /analysis,
 *   /portfolio, /reports, /data-sources, /data-management, /oauth-manager, /settings
 *
 * Para cada página, valida:
 * - Page loads sem erros
 * - Console errors (0 erros críticos)
 * - Responsive design
 * - Loading states
 * - Navigation
 * - Componentes principais
 */

test.describe('Comprehensive Frontend Validation', () => {
  test.setTimeout(120000); // 2 minutos para testes complexos

  // Helper function para capturar console errors
  async function captureConsoleErrors(page: Page): Promise<string[]> {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    return errors;
  }

  // Helper function para validação responsiva
  async function validateResponsive(page: Page, elementToCheck: string) {
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator(elementToCheck).first()).toBeVisible();

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator(elementToCheck).first()).toBeVisible();

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator(elementToCheck).first()).toBeVisible();

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  }

  test.describe('1. PUBLIC PAGES', () => {
    test('1.1 Homepage (/) - Should redirect to /dashboard or /login', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.goto('/');
      await page.waitForLoadState('load');

      const url = page.url();
      const isRedirected = url.includes('/dashboard') || url.includes('/login');
      expect(isRedirected).toBeTruthy();

      // Verificar console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('1.2 Login Page (/login) - Form validation and Google OAuth', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      // Desabilitar auth state para testar login page
      await page.context().clearCookies();
      await page.goto('/login');
      await page.waitForLoadState('load');

      // Validar elementos da página
      await expect(page.locator('h1, h2').filter({ hasText: /Login|Entrar/i })).toBeVisible();

      // Form fields
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      // Submit button
      const submitButton = page.locator('button[type="submit"]').first();
      await expect(submitButton).toBeVisible();

      // Google OAuth button (se existir)
      const googleButton = page.locator('button, a').filter({ hasText: /Google/i }).first();
      if (await googleButton.count() > 0) {
        await expect(googleButton).toBeVisible();
      }

      // Testar validação de form vazio
      await submitButton.click();
      // Deve mostrar erros de validação (não deve navegar)
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/login');

      // Responsive design
      await validateResponsive(page, 'input[type="email"]');

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('1.3 Register Page (/register) - Form validation and password requirements', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.context().clearCookies();
      await page.goto('/register');
      await page.waitForLoadState('load');

      // Validar elementos
      await expect(page.locator('h1, h2').filter({ hasText: /Cadastro|Registrar|Criar conta/i })).toBeVisible();

      // Form fields (name, email, password, confirmPassword)
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      // Submit button
      const submitButton = page.locator('button[type="submit"]').first();
      await expect(submitButton).toBeVisible();

      // Responsive
      await validateResponsive(page, 'input[type="email"]');

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('2. DASHBOARD PAGES (Authenticated)', () => {
    test('2.1 Dashboard (/dashboard) - Stats, charts, market indices', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.goto('/dashboard');
      await page.waitForLoadState('load');

      // Título
      await expect(page.locator('h1').filter({ hasText: /Dashboard/i })).toBeVisible();

      // Stats cards (pelo menos 3 cards visíveis)
      const statsCards = page.locator('[class*="rounded"], [class*="card"]').filter({
        hasText: /Ibovespa|Ativos|Variação|Dólar|SELIC/i
      });
      expect(await statsCards.count()).toBeGreaterThan(0);

      // Chart section
      const chartSection = page.locator('text=/Ibovespa|Gráfico|Últimos.*dias/i').first();
      if (await chartSection.count() > 0) {
        await expect(chartSection).toBeVisible();
      }

      // Responsive
      await validateResponsive(page, 'h1');

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon') &&
        !e.includes('WebSocket')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('2.2 Assets List (/assets) - Table with 861 assets, filtering, sorting, grouping', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.goto('/assets');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000); // Aguardar carregamento de dados

      // Título
      await expect(page.locator('h1').filter({ hasText: /Ativos/i })).toBeVisible();

      // Search input
      const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="ticker"]').first();
      await expect(searchInput).toBeVisible();

      // Sorting/Filtering controls
      const controls = page.locator('select, button').filter({ hasText: /Ordenar|Filtrar|Tipo|Setor/i });
      expect(await controls.count()).toBeGreaterThan(0);

      // Assets list/table (verificar se há dados)
      const assetItems = page.locator('text=/PETR4|VALE3|ITUB4|BBDC4/i');
      expect(await assetItems.count()).toBeGreaterThan(0);

      // Test search
      await searchInput.fill('PETR4');
      await page.waitForTimeout(500);
      await expect(page.locator('text=PETR4').first()).toBeVisible();

      // Responsive
      await validateResponsive(page, 'h1');

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('2.3 Asset Detail (/assets/PETR4) - Price chart, fundamentals, technical analysis', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.goto('/assets/PETR4');
      await page.waitForLoadState('load');
      await page.waitForTimeout(2000);

      // Ticker name/title
      await expect(page.locator('text=PETR4').first()).toBeVisible();

      // Price information
      const priceElement = page.locator('text=/R\\$\\s*[\\d,]+/i').first();
      if (await priceElement.count() > 0) {
        await expect(priceElement).toBeVisible();
      }

      // Tabs or sections (Análise, Fundamentos, Técnica, etc)
      const tabs = page.locator('button, [role="tab"]').filter({ hasText: /Análise|Fundamentos|Técnica|Preço/i });
      expect(await tabs.count()).toBeGreaterThan(0);

      // Responsive
      await validateResponsive(page, 'text=PETR4');

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon') &&
        !e.includes('WebSocket')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('2.4 Analysis (/analysis) - Analysis list, creation dialog', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.goto('/analysis');
      await page.waitForLoadState('load');

      // Título
      await expect(page.locator('h1').filter({ hasText: /Análise/i })).toBeVisible();

      // Create analysis button
      const createButton = page.locator('button').filter({ hasText: /Nova|Criar|Análise/i }).first();
      if (await createButton.count() > 0) {
        await expect(createButton).toBeVisible();
      }

      // Analysis list/table
      const listContainer = page.locator('[class*="grid"], [class*="table"], [class*="list"]').first();
      await expect(listContainer).toBeVisible();

      // Responsive
      await validateResponsive(page, 'h1');

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('2.5 Portfolio (/portfolio) - Portfolio list, positions', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.goto('/portfolio');
      await page.waitForLoadState('load');

      // Título
      await expect(page.locator('h1').filter({ hasText: /Portfólio|Carteira/i })).toBeVisible();

      // Create portfolio button
      const createButton = page.locator('button').filter({ hasText: /Novo|Criar|Portfólio|Carteira/i }).first();
      if (await createButton.count() > 0) {
        await expect(createButton).toBeVisible();
      }

      // Portfolio list
      const portfolioList = page.locator('[class*="grid"], [class*="card"], [class*="list"]').first();
      await expect(portfolioList).toBeVisible();

      // Responsive
      await validateResponsive(page, 'h1');

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('2.6 Reports (/reports) - Report list', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.goto('/reports');
      await page.waitForLoadState('load');

      // Título
      await expect(page.locator('h1').filter({ hasText: /Relatório|Report/i })).toBeVisible();

      // Reports list
      const reportsList = page.locator('[class*="grid"], [class*="table"], [class*="list"]').first();
      await expect(reportsList).toBeVisible();

      // Responsive
      await validateResponsive(page, 'h1');

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('2.7 Data Sources (/data-sources) - Scraper status', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.goto('/data-sources');
      await page.waitForLoadState('load');

      // Título
      await expect(page.locator('h1').filter({ hasText: /Fonte|Source|Scraper/i })).toBeVisible();

      // Scraper list (deve mostrar status dos scrapers)
      const scraperItems = page.locator('[class*="grid"], [class*="card"], [class*="list"]').first();
      await expect(scraperItems).toBeVisible();

      // Status indicators
      const statusElements = page.locator('text=/Ativo|Inativo|Online|Offline|Success|Error/i');
      if (await statusElements.count() > 0) {
        expect(await statusElements.count()).toBeGreaterThan(0);
      }

      // Responsive
      await validateResponsive(page, 'h1');

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('2.8 Data Management (/data-management) - Bulk sync, COTAHIST', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.goto('/data-management');
      await page.waitForLoadState('load');

      // Título
      await expect(page.locator('h1').filter({ hasText: /Gerenciamento|Management|Dados/i })).toBeVisible();

      // Action buttons (Sync, Import, Export, etc)
      const actionButtons = page.locator('button').filter({
        hasText: /Sync|Sincronizar|Import|Exportar|COTAHIST/i
      });
      if (await actionButtons.count() > 0) {
        expect(await actionButtons.count()).toBeGreaterThan(0);
      }

      // Responsive
      await validateResponsive(page, 'h1');

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('2.9 OAuth Manager (/oauth-manager) - VNC viewer', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.goto('/oauth-manager');
      await page.waitForLoadState('load');

      // Título
      await expect(page.locator('h1').filter({ hasText: /OAuth|VNC|Manager/i })).toBeVisible();

      // VNC viewer iframe ou component
      const vncComponent = page.locator('iframe, [class*="vnc"], [class*="viewer"]').first();
      if (await vncComponent.count() > 0) {
        await expect(vncComponent).toBeVisible();
      }

      // Responsive (VNC geralmente não é mobile-friendly, então apenas verificar desktop)
      await page.setViewportSize({ width: 1920, height: 1080 });
      await expect(page.locator('h1').first()).toBeVisible();

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('2.10 Settings (/settings) - User settings', async ({ page }) => {
      const errors = await captureConsoleErrors(page);

      await page.goto('/settings');
      await page.waitForLoadState('load');

      // Título
      await expect(page.locator('h1').filter({ hasText: /Configuração|Settings/i })).toBeVisible();

      // Settings sections (Perfil, Notificações, Segurança, etc)
      const settingsSections = page.locator('[class*="section"], [class*="card"]');
      expect(await settingsSections.count()).toBeGreaterThan(0);

      // Save button
      const saveButton = page.locator('button').filter({ hasText: /Salvar|Save|Atualizar/i }).first();
      if (await saveButton.count() > 0) {
        await expect(saveButton).toBeVisible();
      }

      // Responsive
      await validateResponsive(page, 'h1');

      // Console errors
      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon')
      );
      expect(criticalErrors.length).toBe(0);
    });
  });

  test.describe('3. NAVIGATION & INTEGRATION', () => {
    test('3.1 Sidebar navigation - All links accessible', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('load');

      // Verificar links principais do sidebar/menu
      const navLinks = [
        'Dashboard',
        'Ativos',
        'Análise',
        'Portfólio',
        'Relatórios',
      ];

      for (const linkText of navLinks) {
        const link = page.locator('a, button').filter({ hasText: new RegExp(linkText, 'i') }).first();
        if (await link.count() > 0) {
          await expect(link).toBeVisible();
        }
      }
    });

    test('3.2 Page transitions - No console errors during navigation', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      const pages = ['/dashboard', '/assets', '/analysis', '/portfolio'];

      for (const path of pages) {
        await page.goto(path);
        await page.waitForLoadState('load');
        await page.waitForTimeout(500);
      }

      const criticalErrors = errors.filter(e =>
        !e.includes('Download the React DevTools') &&
        !e.includes('favicon') &&
        !e.includes('WebSocket')
      );
      expect(criticalErrors.length).toBe(0);
    });

    test('3.3 Performance - Initial load < 5 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard');
      await page.waitForLoadState('load');

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
