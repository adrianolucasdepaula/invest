# FASE 55: Merge de Tickers Históricos (IMPLEMENTATION PLAN)

**Objetivo:** Permitir a visualização unificada de dados históricos para tickers que mudaram (ex: ELET3 → AXIA3), unindo o histórico do ticker antigo com o novo.

## 1. Status Atual

- **Backend:**
  - ✅ `TickerChange` entity criada.
  - ✅ `TickerMergeService` implementado.
  - ✅ `MarketDataController` endpoint `GET /market-data/:ticker/prices` suporta `?unified=true`.
- **Frontend:**
  - ❌ `api.ts` precisa de atualização para suportar `unified` param.
  - ❌ UI (`/assets/[ticker]`) precisa do toggle "Histórico Unificado".

## 2. Mudanças Propostas

### Frontend

#### 1. Atualizar API Client (`frontend/src/lib/api.ts`)

- Adicionar/Atualizar método `getPrices` para aceitar parâmetro `unified: boolean`.

```typescript
async getPrices(ticker: string, params?: { range?: string; timeframe?: string; unified?: boolean }) {
  return this.client.get(`/market-data/${ticker}/prices`, { params });
}
```

#### 2. Atualizar Página de Ativos (`frontend/src/app/(dashboard)/assets/[ticker]/page.tsx`)

- Adicionar state `isUnified` (default false).
- Adicionar Toggle Switch na UI (próximo ao gráfico).
- Adicionar Alert/Warning quando visualizando dados unificados.
- Atualizar chamada `getPrices` para passar `unified: isUnified`.

```tsx
// Exemplo de UI
<div className="flex items-center space-x-2">
  <Switch checked={isUnified} onCheckedChange={setIsUnified} />
  <Label>Histórico Unificado (ex: ELET3 + AXIA3)</Label>
</div>
```

## 3. Plano de Verificação

### Automatizada

- **Backend:** Executar testes existentes (se houver) ou criar teste unitário para `TickerMergeService`.
- **Frontend:** Verificar build (`npm run build`).

### Manual (MCP Triplo)

1. **Playwright:** Navegar para `/assets/AXIA3` (ou ticker simulado).
2. **Chrome DevTools:**
   - Verificar request `GET /market-data/AXIA3/prices?unified=true`.
   - Verificar se resposta contém dados históricos antigos.
3. **Visual:**
   - Verificar se gráfico mostra histórico estendido quando toggle ativado.
   - Verificar se warning aparece.

## 4. Arquivos Afetados

- `frontend/src/lib/api.ts`
- `frontend/src/app/(dashboard)/assets/[ticker]/page.tsx`
