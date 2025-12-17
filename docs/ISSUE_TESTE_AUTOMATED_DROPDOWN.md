# Issue: Teste Automatizado do Dropdown de Atualização

**Data:** 2025-12-17
**Contexto:** Tentativa de executar testes automatizados do plano `agile-greeting-harp.md` (Grupo 1.1)
**Componente:** [AssetUpdateDropdown.tsx](frontend/src/components/dashboard/AssetUpdateDropdown.tsx)

---

## Problema 1: Radix UI Dropdown Não Responde a Eventos JavaScript Sintéticos

### Descrição

O `DropdownMenu` do Radix UI não abre quando clicado via JavaScript:
- `button.click()` → Não abre
- `dispatchEvent(new MouseEvent('click'))` → Não abre
- `pointerdown`/`mousedown` events → Não abre

### Root Cause

Radix UI implementa proteções contra eventos sintéticos para garantir acessibilidade. O dropdown só abre com:
- **Interação real do usuário** (mouse físico)
- **Teclado** (Enter/Space em elemento focado)
- **Touch events** reais

### Evidência

```javascript
// Tentativa via Chrome DevTools
const updateButton = document.querySelector('[data-test-id="update-button"]');
updateButton.click(); // ❌ Não funciona

const dropdownOpen = document.querySelector('[role="menu"]');
console.log(dropdownOpen); // null
```

### Referências

- [Radix UI Issue #1160](https://github.com/radix-ui/primitives/issues/1160) - Synthetic events não abrem dropdown
- [Testing Library Issue #459](https://github.com/testing-library/react-testing-library/issues/459) - Como testar Radix UI

---

## Problema 2: Token JWT Expirado

### Descrição

O token JWT armazenado no `localStorage` está expirado:

```json
{
  "exp": 1764348063  // Expirou em 28/01/2025
}
```

### Impacto

- Todas as requisições autenticadas retornam **401 Unauthorized**
- Não é possível testar via API direta sem novo login

### Tentativa de Workaround

```bash
# Tentativa via curl com token expirado
curl -X POST http://localhost:3101/api/v1/assets/updates/bulk-all \
  -H "Authorization: Bearer <token>" \
  -d '{"hasOptionsOnly": false}'
# ❌ 401 Unauthorized
```

---

## Soluções Propostas

### Solução 1: Teste Manual (Imediato)

**Instruções para o usuário:**

1. Acesse http://localhost:3100/assets
2. Clique no botão **"Atualizar"** (canto superior direito)
3. Selecione **"Todos os Ativos"** no dropdown
4. Observe:
   - Toast de confirmação aparece
   - Card de status no topo com progresso
   - Logs na parte inferior
5. Aguarde alguns processamentos
6. Teste botão **"Cancelar"**
7. Teste botão **"Pausar"** / **"Retomar"**

### Solução 2: Playwright Real (Recomendado para CI/CD)

Criar testes E2E com Playwright instalado localmente:

```typescript
// tests/e2e/assets-bulk-update.spec.ts
import { test, expect } from '@playwright/test';

test('Grupo 1.1 - Atualizar Todos os Ativos', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3100/login');
  await page.getByLabel('Email').fill('testador@test.com');
  await page.getByLabel('Senha').fill('senha123');
  await page.getByRole('button', { name: 'Entrar' }).click();

  // Navegar para /assets
  await page.goto('http://localhost:3100/assets');

  // Clicar no botão Atualizar (CLIQUE REAL!)
  await page.getByRole('button', { name: 'Atualizar' }).click();

  // Aguardar dropdown abrir
  await expect(page.getByRole('menu')).toBeVisible();

  // Clicar em "Todos os Ativos"
  await page.getByRole('menuitem', { name: /Todos os Ativos/ }).click();

  // Verificar toast
  await expect(page.getByText('Atualização iniciada')).toBeVisible();

  // Verificar card de status aparece
  await expect(page.getByText('Atualização em andamento')).toBeVisible();

  // Aguardar alguns processamentos
  await page.waitForTimeout(10000);

  // Verificar logs
  const logsPanel = page.locator('[data-testid="logs-panel"]');
  await expect(logsPanel).toBeVisible();

  // Cancelar
  await page.getByRole('button', { name: 'Cancelar' }).click();

  // Verificar toast de cancelamento
  await expect(page.getByText('Atualização cancelada')).toBeVisible();
});
```

**Executar:**

```bash
cd frontend
npx playwright test tests/e2e/assets-bulk-update.spec.ts --headed
```

### Solução 3: Endpoint de Teste (Dev Only)

Criar endpoint sem autenticação para testes:

```typescript
// backend/src/api/assets/assets-update.controller.ts

@Post('updates/bulk-all/test')
@Public() // Decorator para skip JWT guard
async bulkUpdateAllTest(
  @Body() body: { hasOptionsOnly?: boolean }
): Promise<any> {
  if (process.env.NODE_ENV !== 'development') {
    throw new ForbiddenException('Test endpoint only available in development');
  }

  return this.assetsUpdateService.bulkUpdateAllAssets({
    hasOptionsOnly: body.hasOptionsOnly || false,
    userId: 'test-user',
  });
}
```

**Uso:**

```bash
curl -X POST http://localhost:3101/api/v1/assets/updates/bulk-all/test \
  -H "Content-Type: application/json" \
  -d '{"hasOptionsOnly": false}'
```

### Solução 4: React Testing Library + Mock

Para testes unitários do componente:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssetUpdateDropdown } from './AssetUpdateDropdown';

test('deve abrir dropdown e chamar onUpdateAll', async () => {
  const user = userEvent.setup();
  const mockUpdateAll = jest.fn();

  render(
    <AssetUpdateDropdown
      totalAssets={861}
      assetsWithOptionsCount={56}
      isUpdating={false}
      onUpdateAll={mockUpdateAll}
      onUpdateWithOptions={jest.fn()}
      onOpenManualSelect={jest.fn()}
    />
  );

  // Clicar no botão (userEvent simula interação real)
  await user.click(screen.getByRole('button', { name: /Atualizar/ }));

  // Verificar dropdown abriu
  await waitFor(() => {
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  // Clicar em "Todos os Ativos"
  await user.click(screen.getByRole('menuitem', { name: /Todos os Ativos/ }));

  // Verificar função foi chamada
  expect(mockUpdateAll).toHaveBeenCalledTimes(1);
});
```

---

## Recomendação

**Para execução imediata:**
- ✅ **Solução 1** (Teste Manual) - Usuário clica manualmente enquanto observamos logs

**Para automação futura:**
- ✅ **Solução 2** (Playwright Real) - Adicionar ao `frontend/tests/e2e/`
- ✅ **Solução 4** (Unit Tests) - Adicionar ao `frontend/src/components/dashboard/__tests__/`

**Evitar:**
- ❌ Tentar automatizar via Chrome DevTools MCP (não funciona com Radix UI)
- ❌ Criar endpoint sem autenticação em produção

---

## Próximos Passos

1. **Imediato**: Pedir ao usuário para executar teste manual seguindo Solução 1
2. **Curto prazo**: Implementar Solução 2 (Playwright E2E)
3. **Médio prazo**: Implementar Solução 4 (Unit Tests)
4. **Documentar**: Adicionar ao KNOWN-ISSUES.md

---

## Aprendizados

- ✅ Radix UI + Chrome DevTools MCP = Incompatível
- ✅ Token JWT expira após 7 dias (configurado no backend)
- ✅ Playwright real > Chrome DevTools MCP para testes de UI interativa
- ✅ `userEvent` do Testing Library simula interações reais melhor que `fireEvent`

---

**Status:** Documentado
**Blocker para automação via MCP:** SIM
**Workaround disponível:** SIM (Teste Manual ou Playwright Real)

---

## Problema 3: Negative Progress Counter (REGRESSÃO Issue #BULK_UPDATE_NEGATIVE_PROGRESS)

**Data Identificado:** 2025-12-17 11:34
**Severidade:** 🔴 **CRÍTICA**
**Status:** ⚠️ **EM INVESTIGAÇÃO**

### Sintomas

Console mostra valores negativos durante polling:

```javascript
[LOG] [ASSET BULK WS] Updating progress: totalPending=861, isSmallUpdate=false,
      estimatedTotal=1, currentProcessed=-860
```

### Comportamento Esperado vs Real

| Campo | Esperado | Real | Status |
|-------|----------|------|--------|
| `estimatedTotal` | 861 | 1 | ❌ INCORRETO |
| `currentProcessed` | >= 0 | -860 | ❌ NEGATIVO |
| `progress` | 0-100% | -86000% | ❌ INCORRETO |
| UI Counter | "0/861" | "-860/1" | ❌ INCORRETO |

### Root Cause

**Race Condition** entre:
1. Atualização individual de AZEV4 em andamento (`prev.total = 1`)
2. Nova batch de 861 ativos iniciada pelo usuário

**Problema:** Polling usa `prev.total = 1` (stale) ao invés de resetar para `totalPending = 861`.

### Evidência de Código Stale

**Log ATUAL (browser):**
```javascript
Updating progress: totalPending=861, isSmallUpdate=false, estimatedTotal=1, currentProcessed=-860
```

**Log ESPERADO (código linha 326):**
```javascript
Updating progress: totalPending=861, isSmallUpdate=false, isNewLargerBatch=${valor}, estimatedTotal=861, currentProcessed=0
```

**Diferença:** Falta campo `isNewLargerBatch` → Confirma código desatualizado no browser!

### Fix Implementado (FASE 132)

**Arquivo:** [useAssetBulkUpdate.ts:306-323](frontend/src/lib/hooks/useAssetBulkUpdate.ts#L306-L323)

```typescript
// ✅ FIX FASE 132+: Detect new larger batch to prevent negative progress
const isNewLargerBatch = prev.total > 0 && totalPending > prev.total * 2;

const estimatedTotal = isSmallUpdate
  ? totalPending
  : isNewLargerBatch
    ? Math.max(totalPending, totalAssetsRef.current || totalPending)
    : (prev.total > 0 ? prev.total : Math.max(totalPending, totalAssetsRef.current || totalPending));

const currentProcessed = Math.max(0, estimatedTotal - totalPending);
```

### Causa Provável

**Docker .next cache stale** - Frontend executando código compilado antigo apesar de código-fonte estar correto.

### Ações Executadas

```bash
docker exec invest_frontend rm -rf .next  # Falhou (dir não vazia)
docker-compose restart frontend           # ✅ Reiniciado
# Frontend recompilou: Next.js 16.0.10, Turbopack, 39.5s
```

### Próximos Passos

1. ✅ Hard refresh no browser (Ctrl+Shift+F5)
2. ⏳ Repetir teste "Atualizar Todos"
3. ⏳ Verificar se log agora inclui `isNewLargerBatch`
4. ⏳ Confirmar `estimatedTotal = 861` e `currentProcessed >= 0`
5. ⏳ Capturar screenshot da UI para evidência visual

### Impacto

| Categoria | Impacto |
|-----------|---------|
| **Funcionalidade** | 🔴 CRÍTICO - Jobs processam mas UI mostra valores incorretos |
| **UX** | 🔴 CRÍTICO - Usuário vê contador negativo (-860/1, -86000%) |
| **Data Integrity** | ✅ OK - Backend processa corretamente |

### Referências

- **Issue Original:** [KNOWN-ISSUES.md - #BULK_UPDATE_NEGATIVE_PROGRESS](../KNOWN-ISSUES.md#issue-bulk_update_negative_progress-contador-negativo-no-status-card) (RESOLVIDO 2025-12-16)
- **Plano de Testes:** C:\Users\adria\.claude\plans\agile-greeting-harp.md (Grupo 1.1)
- **Docker Cache Issue:** [KNOWN-ISSUES.md - #DOCKER_DIST_CACHE](../KNOWN-ISSUES.md#issue-docker_dist_cache-hasoptionsonly-undefined-due-to-stale-dist-cache)

---

**Última Atualização:** 2025-12-17 11:38
