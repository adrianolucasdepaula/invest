import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Validação Visual - Screenshots para comparação com Figma
 * Captura screenshots de todas as páginas em diferentes resoluções
 */

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

const PAGES = [
  { url: '/dashboard', name: 'dashboard' },
  { url: '/assets', name: 'assets' },
  { url: '/portfolio', name: 'portfolio' },
  { url: '/reports', name: 'reports' },
  { url: '/assets/PETR4', name: 'asset-detail' },
  { url: '/reports/test-id', name: 'report-detail' },
  { url: '/login', name: 'login' },
];

test.describe('Visual Validation - Screenshots', () => {
  test.beforeAll(async () => {
    // Criar diretório para screenshots
    const screenshotDir = path.join(__dirname, '../screenshots');

    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const pageDef of PAGES) {
        test(`capturar ${pageDef.name}`, async ({ page }) => {
          await page.goto(pageDef.url);
          await page.waitForLoadState('networkidle');

          // Esperar um pouco para garantir que tudo renderizou
          await page.waitForTimeout(1000);

          // Capturar screenshot
          const screenshotPath = path.join(
            __dirname,
            '../screenshots',
            `${pageDef.name}-${viewport.name}.png`
          );

          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
          });

          console.log(`📸 Screenshot salvo: ${pageDef.name}-${viewport.name}.png`);

          // Verificar que o arquivo foi criado
          expect(fs.existsSync(screenshotPath)).toBeTruthy();
        });
      }
    });
  }
});

test.describe('Visual Validation - Component States', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test('capturar estados de dialog - adicionar posição', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Estado fechado
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/portfolio-dialog-closed.png'),
    });

    // Abrir dialog
    await page.getByRole('button', { name: /Adicionar Posição/i }).click();
    await page.waitForTimeout(500); // Esperar animação

    // Estado aberto
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/portfolio-dialog-open.png'),
    });

    console.log('📸 Screenshots de dialog capturados');
  });

  test('capturar estados de hover', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Estado normal
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/dashboard-normal.png'),
    });

    // Hover em card
    const card = page.locator('[class*="rounded"]').first();
    await card.hover();
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(__dirname, '../screenshots/dashboard-card-hover.png'),
    });

    console.log('📸 Screenshots de hover capturados');
  });

  test('capturar navegação sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard ativo
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/sidebar-dashboard-active.png'),
      clip: { x: 0, y: 0, width: 300, height: 800 },
    });

    // Navegar para assets
    await page.getByRole('link', { name: /Ativos/i }).click();
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(__dirname, '../screenshots/sidebar-assets-active.png'),
      clip: { x: 0, y: 0, width: 300, height: 800 },
    });

    console.log('📸 Screenshots de sidebar capturados');
  });
});

test.describe('Visual Validation - Data Rendering', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('capturar tabela de ativos com dados', async ({ page }) => {
    await page.goto('/assets');
    await page.waitForLoadState('networkidle');

    // Tabela completa
    const table = page.locator('table').first();

    if (await table.isVisible()) {
      await table.screenshot({
        path: path.join(__dirname, '../screenshots/assets-table.png'),
      });
      console.log('📸 Screenshot de tabela de ativos capturado');
    }
  });

  test('capturar cards de estatísticas', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Capturar cada card individualmente
    const cards = await page.locator('[class*="rounded"]').all();

    for (let i = 0; i < Math.min(cards.length, 4); i++) {
      await cards[i].screenshot({
        path: path.join(__dirname, '../screenshots/stat-card-${i + 1}.png'),
      });
    }

    console.log('📸 Screenshots de cards de estatísticas capturados');
  });

  test('capturar gráfico do mercado', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Procurar por gráfico
    const chartContainer = page.locator('[class*="recharts"]').first();

    if (await chartContainer.isVisible()) {
      await chartContainer.screenshot({
        path: path.join(__dirname, '../screenshots/market-chart.png'),
      });
      console.log('📸 Screenshot de gráfico capturado');
    }
  });
});

test.describe('Visual Validation - Error States', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('capturar página 404', async ({ page }) => {
    await page.goto('/pagina-que-nao-existe');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(__dirname, '../screenshots/404-page.png'),
      fullPage: true,
    });

    console.log('📸 Screenshot de página 404 capturado');
  });
});

test.describe('Visual Validation - Forms', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('capturar formulário de adicionar posição', async ({ page }) => {
    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Abrir dialog
    await page.getByRole('button', { name: /Adicionar Posição/i }).click();
    await page.waitForTimeout(500);

    // Estado vazio
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/form-add-position-empty.png'),
    });

    // Preencher campos
    await page.getByLabel('Ticker *').fill('PETR4');
    await page.getByLabel('Quantidade *').fill('100');
    await page.getByLabel('Preço Médio *').fill('38.50');

    await page.waitForTimeout(300);

    // Estado preenchido
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/form-add-position-filled.png'),
    });

    console.log('📸 Screenshots de formulário capturados');
  });

  test('capturar busca de ativos', async ({ page }) => {
    await page.goto('/assets');
    await page.waitForLoadState('networkidle');

    // Estado inicial
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/assets-search-empty.png'),
    });

    // Buscar
    const searchInput = page.getByPlaceholder('Buscar por ticker ou nome...');
    await searchInput.fill('PETR');
    await page.waitForTimeout(300);

    // Estado filtrado
    await page.screenshot({
      path: path.join(__dirname, '../screenshots/assets-search-filtered.png'),
    });

    console.log('📸 Screenshots de busca capturados');
  });
});

test.describe('Visual Validation - Responsive Design', () => {
  test('validar responsividade - mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(__dirname, '../screenshots/mobile-dashboard.png'),
      fullPage: true,
    });

    console.log('📸 Screenshot mobile capturado');
  });

  test('validar responsividade - tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: path.join(__dirname, '../screenshots/tablet-dashboard.png'),
      fullPage: true,
    });

    console.log('📸 Screenshot tablet capturado');
  });
});
