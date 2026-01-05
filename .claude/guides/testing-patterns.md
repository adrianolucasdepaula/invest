# Testing Patterns Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Guia completo de padrões de testes para Next.js 14 App Router + NestJS

---

## Overview

Este projeto segue uma **estratégia de testes em 3 camadas**:

1. **Unit Tests** - Funções isoladas, utils, hooks
2. **Integration Tests** - Componentes React + Server Actions
3. **End-to-End Tests** - Fluxos completos de usuário

**Meta de Cobertura:**
- Backend: ≥ 80%
- Frontend: ≥ 70%
- Critical Paths: 100%

---

## Backend Testing (NestJS)

### Unit Tests com Jest

**Setup:** `backend/test/`

```typescript
// Exemplo: Service unit test
import { Test, TestingModule } from '@nestjs/testing';
import { AssetsService } from './assets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Asset } from '../database/entities/asset.entity';

describe('AssetsService', () => {
  let service: AssetsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        {
          provide: getRepositoryToken(Asset),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AssetsService>(AssetsService);
  });

  it('deve retornar lista de assets', async () => {
    const mockAssets = [{ id: 1, ticker: 'PETR4' }];
    mockRepository.find.mockResolvedValue(mockAssets);

    const result = await service.findAll();
    expect(result).toEqual(mockAssets);
  });
});
```

### E2E Tests com Jest + Supertest

**Setup:** `backend/test/e2e/`

```typescript
// Exemplo: E2E test para controller
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AssetsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v1/assets (GET) deve retornar lista', () => {
    return request(app.getHttpServer())
      .get('/api/v1/assets')
      .expect(200)
      .expect('Content-Type', /json/)
      .then((response) => {
        expect(Array.isArray(response.body)).toBe(true);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### Comandos

```bash
# Unit tests
cd backend && npm run test

# E2E tests
cd backend && npm run test:e2e

# Coverage
cd backend && npm run test:cov

# Watch mode
cd backend && npm run test:watch
```

---

## Frontend Testing (Next.js 14 App Router)

### Unit Tests com Vitest + React Testing Library

**Setup:** `frontend/vitest.config.ts`

```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// frontend/vitest.setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### Testing React Components

**Localização:** `frontend/src/components/**/__tests__/`

```typescript
// Exemplo: Teste de componente
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AssetCard } from '../asset-card';

describe('AssetCard', () => {
  const mockAsset = {
    id: 1,
    ticker: 'PETR4',
    companyName: 'Petrobras',
    currentPrice: new Decimal('38.50'),
  };

  it('deve renderizar ticker e preço', () => {
    render(<AssetCard asset={mockAsset} />);

    expect(screen.getByText('PETR4')).toBeInTheDocument();
    expect(screen.getByText('R$ 38,50')).toBeInTheDocument();
  });

  it('deve chamar onClick quando clicado', () => {
    const handleClick = vi.fn();
    render(<AssetCard asset={mockAsset} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith(mockAsset);
  });
});
```

### Testing Custom Hooks

```typescript
// Exemplo: Teste de hook
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAssets } from '../use-assets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('useAssets', () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('deve buscar assets com sucesso', async () => {
    const { result } = renderHook(() => useAssets(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});
```

### Testing App Router Pages

**IMPORTANTE:** Next.js 14 App Router possui diferenças:

```typescript
// ✅ CORRETO: Testar page component (Client Component)
import { render, screen } from '@testing-library/react';
import AssetsPage from '@/app/(dashboard)/assets/_client';

describe('AssetsPage', () => {
  it('deve renderizar tabela de assets', () => {
    render(<AssetsPage />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
```

```typescript
// ❌ INCORRETO: Testar Server Component diretamente
// Server Components devem ser testados via E2E (Playwright)
```

### Mocking Patterns

**Mock useRouter (App Router):**

```typescript
import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    };
  },
  usePathname() {
    return '/assets';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));
```

**Mock API calls com MSW:**

```typescript
// frontend/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/assets', () => {
    return HttpResponse.json([
      { id: 1, ticker: 'PETR4' },
      { id: 2, ticker: 'VALE3' },
    ]);
  }),
];
```

```typescript
// frontend/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Comandos

```bash
# Unit tests
cd frontend && npm run test

# Coverage
cd frontend && npm run test:coverage

# Watch mode
cd frontend && npm run test:watch
```

---

## E2E Testing (Playwright)

### Setup

**Localização:** `frontend/e2e/`

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Testing User Flows

```typescript
// e2e/assets-page.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Assets Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/assets');
  });

  test('deve exibir lista de assets', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('tbody tr')).toHaveCount(861);
  });

  test('deve filtrar assets por ticker', async ({ page }) => {
    await page.fill('input[placeholder="Filtrar por ticker..."]', 'PETR4');
    await page.waitForTimeout(500); // Debounce

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('PETR4');
  });

  test('deve navegar para detalhes do asset', async ({ page }) => {
    await page.click('text=PETR4');
    await expect(page).toHaveURL('/assets/PETR4');
    await expect(page.locator('h1')).toContainText('PETR4');
  });
});
```

### Testing Server Actions

```typescript
// e2e/analysis.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Analysis Flow', () => {
  test('deve criar nova análise', async ({ page }) => {
    await page.goto('/analysis/new');

    // Preencher formulário
    await page.fill('input[name="ticker"]', 'PETR4');
    await page.selectOption('select[name="analysisType"]', 'fundamental');

    // Submit (Server Action)
    await page.click('button[type="submit"]');

    // Aguardar redirecionamento
    await page.waitForURL(/\/analysis\/\d+/);

    // Verificar resultado
    await expect(page.locator('.analysis-result')).toBeVisible();
  });
});
```

### Testing Responsive Design

```typescript
// e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 13']);

test.describe('Mobile Views', () => {
  test('deve exibir menu mobile', async ({ page }) => {
    await page.goto('/');

    // Menu hambúrguer visível
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Desktop menu oculto
    await expect(page.locator('[data-testid="desktop-menu"]')).not.toBeVisible();
  });
});
```

### Comandos

```bash
# Executar todos os testes
cd frontend && npx playwright test

# Executar em modo UI
cd frontend && npx playwright test --ui

# Executar apenas um arquivo
cd frontend && npx playwright test e2e/assets-page.spec.ts

# Debug
cd frontend && npx playwright test --debug
```

---

## Integration Testing (Next.js + NestJS)

### Testing API Integration

```typescript
// e2e/api-integration.spec.ts
import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('frontend deve consumir API backend corretamente', async ({ page }) => {
    // Interceptar chamada de API
    const apiPromise = page.waitForRequest(
      (request) => request.url().includes('/api/v1/assets')
    );

    await page.goto('/assets');

    const apiRequest = await apiPromise;
    expect(apiRequest.method()).toBe('GET');

    // Verificar resposta
    const response = await apiRequest.response();
    expect(response?.status()).toBe(200);

    const data = await response?.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

---

## Coverage Requirements

### Backend

| Tipo | Cobertura Mínima |
|------|------------------|
| Controllers | 90% |
| Services | 85% |
| Guards/Interceptors | 80% |
| Utils | 95% |
| **Overall** | **≥ 80%** |

### Frontend

| Tipo | Cobertura Mínima |
|------|------------------|
| Components | 75% |
| Hooks | 80% |
| Utils | 90% |
| Pages (Client) | 60% |
| **Overall** | **≥ 70%** |

---

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm run test:cov
      - uses: codecov/codecov-action@v3

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      with:
          node-version: '18'
      - run: cd frontend && npm ci
      - run: cd frontend && npx playwright install --with-deps
      - run: cd frontend && npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## Best Practices

### ✅ DO

1. **Testar comportamento, não implementação**
2. **Usar data-testid para elementos dinâmicos**
3. **Mockar dependências externas (APIs, DB)**
4. **Testar edge cases e error handling**
5. **Manter testes rápidos (< 5s por suite)**
6. **Usar setup/teardown adequados**

### ❌ DON'T

1. **Testar detalhes de implementação (state interno)**
2. **Duplicar testes (unit + integration do mesmo comportamento)**
3. **Hardcoded waits (`setTimeout`)**
4. **Testes dependentes entre si**
5. **Snapshots excessivos (difícil manutenção)**

---

## MCP Validation Hierarchy (FASE 158+)

### Estratégia de Validação Multi-Camada

A validação do frontend segue uma hierarquia clara de ferramentas, onde cada camada tem um propósito específico:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HIERARQUIA DE VALIDAÇÃO MCP                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🥇 PRIMÁRIO: Playwright Native                                             │
│  ├── Sempre executar PRIMEIRO                                               │
│  ├── Fonte principal de verdade para E2E                                    │
│  ├── Comandos: npx playwright test, npm run test:e2e                        │
│  └── Uso: Validação completa, CI/CD gates, regression testing               │
│                                                                             │
│  🥈 SECUNDÁRIO: Playwright MCP                                              │
│  ├── Cross-validação dos resultados do primário                             │
│  ├── Verificar se primário não identificou algum problema                   │
│  ├── Ferramentas: mcp__playwright__browser_*                                │
│  └── Uso: Exploração interativa, debugging, validação visual                │
│                                                                             │
│  🔧 FALLBACK/ESPECIALIZADO:                                                 │
│                                                                             │
│  ├── VS Code Extension (Playwright)                                         │
│  │   └── Recursos que primary/secondary não entregam                        │
│  │   └── Fallback quando MCPs falham                                        │
│  │   └── UI visual para debugging complexo                                  │
│  │                                                                          │
│  ├── Chrome DevTools MCP                                                    │
│  │   └── Ferramentas: mcp__chrome-devtools__*                               │
│  │   └── Inspeção de network, console, performance                          │
│  │   └── Screenshots, snapshots detalhados                                  │
│  │   └── Fallback para Playwright MCP                                       │
│  │                                                                          │
│  ├── a11y MCP                                                               │
│  │   └── Ferramentas: mcp__a11y__*                                          │
│  │   └── Validação WCAG 2.1 AA especializada                                │
│  │   └── Color contrast, ARIA attributes                                    │
│  │                                                                          │
│  └── React Context MCP                                                      │
│      └── Ferramentas: mcp__react-context__*                                 │
│      └── Inspeção de componentes React                                      │
│      └── Estado, props, hierarquia de componentes                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Workflow de Validação Recomendado

```bash
# 1. PRIMÁRIO - Playwright Native (SEMPRE EXECUTAR)
cd frontend
npx playwright test                          # Suite completa
npx playwright test tests/e2e/dashboard.spec.ts  # Específico
npx playwright test --ui                     # Modo visual

# 2. SECUNDÁRIO - Playwright MCP (Cross-validação)
# Usar via Claude Code para validar mesmas páginas
# mcp__playwright__browser_navigate + browser_snapshot

# 3. ESPECIALIZADO - Conforme necessidade
# Chrome DevTools: Network, Console, Performance
# a11y: Acessibilidade WCAG
# React Context: Estado de componentes
```

### Quando Usar Cada Ferramenta

| Cenário | Ferramenta | Motivo |
|---------|------------|--------|
| CI/CD Pipeline | Playwright Native | Automação, gates, reports |
| Debugging interativo | Playwright MCP | Snapshot instantâneo |
| Network issues | Chrome DevTools MCP | Request/response inspection |
| Accessibility audit | a11y MCP | WCAG compliance |
| Component state debug | React Context MCP | React internals |
| Visual regression | Playwright Native | Screenshot comparison |
| Flaky test investigation | Playwright MCP + DevTools | Multi-perspective |

### Regras de Fallback

1. **Se Playwright Native falhar** → Verificar com Playwright MCP
2. **Se Playwright MCP falhar** → Usar Chrome DevTools MCP ou VS Code Extension
3. **Se ambos falharem** → Investigar conflito de browser, usar `/mcp-browser-reset`
4. **Para features específicas** → Usar ferramenta especializada diretamente

---

## Fontes

- [Next.js 14 App Router Testing - Shinagawa Labs](https://shinagawa-web.com/en/blogs/nextjs-app-router-testing-setup)
- [Playwright Testing in Next.js - Perficient](https://blogs.perficient.com/2025/06/09/beginners-guide-to-playwright-testing-in-next-js/)
- [NestJS Testing - Official Docs](https://docs.nestjs.com/fundamentals/testing)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
