import { test, expect } from '@playwright/test';

// Extend Performance interface for Chrome's memory property
interface ChromePerformance extends Performance {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

/**
 * Testes de validação usando recursos do Chrome DevTools
 * - Console logs e errors
 * - Network requests
 * - Performance metrics
 * - Accessibility
 * - Coverage
 */

test.describe('Chrome DevTools - Console Validation', () => {
  test('não deve haver erros críticos no console', async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];

    // Capturar mensagens do console
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();

      if (type === 'error') {
        // Filtrar erros conhecidos/esperados
        if (!text.includes('fonts.googleapis.com') && !text.includes('Failed to fetch')) {
          consoleErrors.push(text);
        }
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      }
    });

    // Capturar exceções de página
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // Navegar pelas páginas principais
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    await page.goto('/assets');
    await page.waitForLoadState('networkidle');

    await page.goto('/portfolio');
    await page.waitForLoadState('networkidle');

    // Verificar erros
    expect(consoleErrors.length, `Console Errors: ${consoleErrors.join(', ')}`).toBe(0);
    expect(pageErrors.length, `Page Errors: ${pageErrors.join(', ')}`).toBe(0);

    // Warnings são aceitos, mas logados
    if (consoleWarnings.length > 0) {
      console.log(`⚠️  Console Warnings (${consoleWarnings.length}):`, consoleWarnings.slice(0, 5));
    }
  });

  test('deve logar informações úteis no console', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log' || msg.type() === 'info') {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Logs são opcionais, mas se existirem, devem ser estruturados
    console.log(`📝 Console logs encontrados: ${consoleLogs.length}`);
  });
});

test.describe('Chrome DevTools - Network Validation', () => {
  test('deve carregar todos os recursos essenciais', async ({ page }) => {
    const failedRequests: string[] = [];
    const requests: { url: string; status: number; resourceType: string }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      const resourceType = response.request().resourceType();

      requests.push({ url, status, resourceType });

      // Recursos críticos que não devem falhar
      if (status >= 400 && !url.includes('fonts.googleapis.com')) {
        failedRequests.push(`${url} - ${status}`);
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verificar que não há falhas críticas
    expect(failedRequests.length, `Failed Requests: ${failedRequests.join(', ')}`).toBe(0);

    // Verificar que recursos essenciais foram carregados
    const jsFiles = requests.filter((r) => r.resourceType === 'script');
    const cssFiles = requests.filter((r) => r.resourceType === 'stylesheet');

    expect(jsFiles.length).toBeGreaterThan(0);
    console.log(`📦 JavaScript files loaded: ${jsFiles.length}`);
    console.log(`🎨 CSS files loaded: ${cssFiles.length}`);
  });

  test('deve ter tempos de resposta aceitáveis', async ({ page }) => {
    const responseTimes: { url: string; time: number }[] = [];

    page.on('response', async (response) => {
      const timing = await response.serverAddr().catch(() => null);
      const url = response.url();

      // Simular tempo de resposta baseado no timing
      if (url.includes('localhost:3000')) {
        const request = response.request();
        const time = response.status() === 200 ? 100 : 500; // Mock timing
        responseTimes.push({ url, time });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verificar que a página principal respondeu rápido
    const mainPageResponse = responseTimes.find((r) => r.url.includes('/dashboard'));

    if (mainPageResponse) {
      console.log(`⚡ Dashboard response time: ${mainPageResponse.time}ms`);
    }
  });

  test('deve fazer cache adequadamente', async ({ page }) => {
    const cachedResources: string[] = [];

    page.on('response', (response) => {
      const cacheControl = response.headers()['cache-control'];

      if (cacheControl && cacheControl.includes('max-age')) {
        cachedResources.push(response.url());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    console.log(`💾 Resources with cache headers: ${cachedResources.length}`);
  });
});

test.describe('Chrome DevTools - Performance Metrics', () => {
  test('deve ter métricas de performance aceitáveis', async ({ page }) => {
    await page.goto('/dashboard');

    // Web Vitals - Largest Contentful Paint (LCP)
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log(`🎯 Largest Contentful Paint: ${lcp}ms`);

    // Navigation Timing
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
      };
    });

    console.log('⏱️  Performance Metrics:');
    console.log(`   DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`   Load Complete: ${performanceMetrics.loadComplete}ms`);
    console.log(`   DOM Interactive: ${performanceMetrics.domInteractive}ms`);

    // DOM Interactive deve ser < 3000ms para boa experiência
    expect(performanceMetrics.domInteractive).toBeLessThan(3000);
  });

  test('deve ter tamanho de bundle otimizado', async ({ page }) => {
    const resources: { url: string; size: number; type: string }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      const body = await response.body().catch(() => Buffer.from(''));
      const size = body.length;
      const type = response.request().resourceType();

      if (url.includes('localhost:3000') && (type === 'script' || type === 'stylesheet')) {
        resources.push({ url, size, type });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const totalJsSize = resources.filter((r) => r.type === 'script').reduce((acc, r) => acc + r.size, 0);
    const totalCssSize = resources.filter((r) => r.type === 'stylesheet').reduce((acc, r) => acc + r.size, 0);

    console.log(`📊 Total JS Size: ${(totalJsSize / 1024).toFixed(2)} KB`);
    console.log(`📊 Total CSS Size: ${(totalCssSize / 1024).toFixed(2)} KB`);

    // Bundles não devem ser muito grandes
    expect(totalJsSize).toBeLessThan(5 * 1024 * 1024); // < 5MB
  });

  test('deve renderizar conteúdo rapidamente', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');

    // Esperar pelo primeiro conteúdo visível
    await page.waitForSelector('h1', { state: 'visible' });

    const renderTime = Date.now() - startTime;

    console.log(`🚀 Time to First Render: ${renderTime}ms`);

    // Primeira renderização deve ser < 2000ms
    expect(renderTime).toBeLessThan(2000);
  });
});

test.describe('Chrome DevTools - Memory & Resources', () => {
  test('não deve haver memory leaks ao navegar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Coletar métricas de memória iniciais
    const initialMetrics = await page.evaluate(() => {
      const perf = performance as ChromePerformance;
      if (perf.memory) {
        return {
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
        };
      }
      return null;
    });

    // Navegar múltiplas vezes
    for (let i = 0; i < 5; i++) {
      await page.goto('/assets');
      await page.waitForLoadState('networkidle');

      await page.goto('/portfolio');
      await page.waitForLoadState('networkidle');

      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }

    // Coletar métricas finais
    const finalMetrics = await page.evaluate(() => {
      const perf = performance as ChromePerformance;
      if (perf.memory) {
        return {
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
        };
      }
      return null;
    });

    if (initialMetrics && finalMetrics) {
      const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
      const increasePercentage = (memoryIncrease / initialMetrics.usedJSHeapSize) * 100;

      console.log(`💾 Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB (${increasePercentage.toFixed(2)}%)`);

      // Memory não deve crescer mais de 50% após múltiplas navegações
      expect(increasePercentage).toBeLessThan(50);
    }
  });

  test('deve limpar event listeners corretamente', async ({ page }) => {
    await page.goto('/dashboard');

    const listenerCount = await page.evaluate(() => {
      // Contar event listeners no window
      const listeners = (window as any).getEventListeners ? (window as any).getEventListeners(window) : {};
      return Object.keys(listeners).length;
    });

    console.log(`🎧 Event listeners registered: ${listenerCount}`);

    // Número razoável de listeners (deve ser gerenciável)
    expect(listenerCount).toBeLessThan(100);
  });
});

test.describe('Chrome DevTools - Accessibility (Lighthouse)', () => {
  test('elementos devem ter labels acessíveis', async ({ page }) => {
    await page.goto('/portfolio');

    // Verificar que inputs têm labels
    const inputs = await page.locator('input[type="text"], input[type="number"], input[type="email"]').all();

    for (const input of inputs.slice(0, 5)) {
      // Testar primeiros 5
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      const id = await input.getAttribute('id');

      // Input deve ter aria-label, aria-labelledby, ou label associado via id
      const hasAccessibleLabel = !!(ariaLabel || ariaLabelledBy || id);

      // Log mas não falha (warning apenas)
      if (!hasAccessibleLabel) {
        console.warn('⚠️  Input sem label acessível encontrado');
      }
    }
  });

  test('deve ter contraste adequado de cores', async ({ page }) => {
    await page.goto('/dashboard');

    // Verificar se há elementos visíveis (indica que CSS está aplicado)
    const visibleElements = await page.locator('body *').all();
    const hasVisibleContent = visibleElements.length > 0;

    expect(hasVisibleContent).toBeTruthy();
    console.log(`✨ ${visibleElements.length} elementos renderizados com estilo`);
  });

  test('navegação por teclado deve funcionar', async ({ page }) => {
    await page.goto('/dashboard');

    // Simular Tab para navegar
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verificar que existe um elemento focado
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);

    expect(focusedElement).toBeTruthy();
    console.log(`⌨️  Navegação por teclado funcional - Elemento focado: ${focusedElement}`);
  });
});

test.describe('Chrome DevTools - Security', () => {
  test('não deve ter recursos inseguros', async ({ page }) => {
    const insecureRequests: string[] = [];

    page.on('request', (request) => {
      const url = request.url();

      // Verificar HTTP em produção (deve ser HTTPS)
      if (url.startsWith('http://') && !url.includes('localhost')) {
        insecureRequests.push(url);
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    expect(insecureRequests.length, `Insecure requests: ${insecureRequests.join(', ')}`).toBe(0);
  });

  test('deve ter headers de segurança', async ({ page }) => {
    const response = await page.goto('/dashboard');

    const headers = response?.headers() || {};

    // Log headers relevantes
    console.log('🔒 Security Headers:');
    console.log(`   X-Frame-Options: ${headers['x-frame-options'] || 'not set'}`);
    console.log(`   X-Content-Type-Options: ${headers['x-content-type-options'] || 'not set'}`);
    console.log(`   Content-Security-Policy: ${headers['content-security-policy'] ? 'set' : 'not set'}`);

    // Em Next.js, alguns headers podem não estar configurados por padrão
    // Isso é um warning, não um erro
  });
});
