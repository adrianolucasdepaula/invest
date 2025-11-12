# ✅ SOLUÇÃO: Bug "Ganho do Dia" para Posições Compradas Hoje

**Data:** 2025-11-12
**Status:** 🟢 **RESOLVIDO**
**Tipo:** Bug de Timezone em Comparação de Datas
**Prioridade:** Alta

---

## 📋 RESUMO DO BUG

**Problema:** O card "Ganho do Dia" mostrava R$ 47,00 para uma posição VALE3 comprada hoje, quando deveria mostrar R$ 0,00 (não tinha o ativo ontem).

**Causa Raiz:** Comparação de datas com problemas de timezone. O backend retorna `firstBuyDate` como string "2025-11-12", que ao ser convertida com `new Date("2025-11-12")` cria uma data UTC (00:00 UTC), mas a comparação era feita com `new Date()` (hora local UTC-3 no Brasil), causando falha na detecção de "comprado hoje".

---

## 🔧 SOLUÇÃO IMPLEMENTADA

### 1. Correção no Frontend (portfolio/page.tsx)

**Antes (Incorreto):**
```typescript
const buyDate = new Date(p.firstBuyDate); // Cria 2025-11-12T00:00:00.000Z (UTC)
const today = new Date(); // Cria 2025-11-12T17:20:42.777Z (UTC, 14:20 Brasil)

const isBoughtToday =
  buyDate.getFullYear() === today.getFullYear() &&
  buyDate.getMonth() === today.getMonth() &&
  buyDate.getDate() === today.getDate();
// ❌ Falha: getDate() retorna dias diferentes devido ao timezone
```

**Depois (Correto):**
```typescript
// Parse manual da string YYYY-MM-DD para evitar problemas de timezone
const [year, month, day] = p.firstBuyDate.split('-').map(Number);
const buyDate = new Date(year, month - 1, day); // Cria data local

const today = new Date();
const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

const isBoughtToday =
  buyDate.getFullYear() === todayDate.getFullYear() &&
  buyDate.getMonth() === todayDate.getMonth() &&
  buyDate.getDate() === todayDate.getDate();
// ✅ Correto: Ambas as datas são locais, comparação funciona
```

**Arquivo:** `frontend/src/app/(dashboard)/portfolio/page.tsx` (linhas 105-120)

### 2. Migração de Dados no Banco

Posições antigas criadas antes da implementação do campo `firstBuyDate` tinham valor NULL, o que causava cálculo incorreto.

**SQL Executado:**
```sql
UPDATE portfolio_positions
SET first_buy_date = created_at::date
WHERE first_buy_date IS NULL;
```

**Resultado:** 2 registros atualizados

### 3. Melhoria no Cache do React Query

Para garantir que dados frescos sejam sempre buscados do backend:

**Arquivo:** `frontend/src/lib/hooks/use-portfolio.ts`
```typescript
export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: () => api.getPortfolios(),
    staleTime: 0, // ✅ Always fetch fresh data
  });
}
```

### 4. Invalidação de Cache no Carregamento

**Arquivo:** `frontend/src/app/(dashboard)/portfolio/page.tsx`
```typescript
useEffect(() => {
  queryClient.invalidateQueries({ queryKey: ['portfolios'] });
  queryClient.invalidateQueries({ queryKey: ['assets'] });
}, [queryClient]);
```

---

## ✅ VALIDAÇÃO

### Teste Realizado
1. **Posição:** VALE3 - 100 ações
2. **Data de Compra:** 2025-11-12 (hoje)
3. **firstBuyDate no DB:** 2025-11-12 ✅
4. **Preço Médio:** R$ 65,51
5. **Preço Atual:** R$ 65,51
6. **Variação do Ativo:** +0.72% (R$ 0,47 por ação)

### Resultado Antes da Correção
- **Ganho do Dia:** R$ 47,00 (+0.72%) ❌ INCORRETO

### Resultado Após a Correção
- **Ganho do Dia:** R$ 0,00 ✅ **CORRETO**

**Screenshot:** `.playwright-mcp/portfolio-ganho-dia-corrigido.png`

---

## 📊 CARDS VALIDADOS

| Card | Valor Esperado | Valor Exibido | Status |
|------|---------------|---------------|--------|
| **Valor Total** | R$ 6.551,00 | R$ 6.551,00 | ✅ Correto |
| **Valor Investido** | R$ 6.551,00 | R$ 6.551,00 | ✅ Correto |
| **Ganho Total** | R$ 0,00 (+0.00%) | R$ 0,00 (+0.00%) | ✅ Correto |
| **Ganho do Dia** | R$ 0,00 | R$ 0,00 | ✅ **CORRIGIDO** |

---

## 🎯 LIÇÕES APRENDIDAS

### 1. Timezone em Datas
- **Problema:** `new Date("2025-11-12")` cria UTC, mas `new Date()` cria local
- **Solução:** Sempre parse strings de data manualmente para criar datas locais consistentes
- **Alternativa:** Usar biblioteca como `date-fns` ou `dayjs` com timezone support

### 2. Cache do React Query
- **Problema:** Cache agressivo pode impedir visualização de correções
- **Solução:** `staleTime: 0` + `invalidateQueries` no mount
- **Alternativa:** Usar `refetchOnMount: 'always'` ou desabilitar cache em dev

### 3. Migrações de Dados
- **Problema:** Campos novos com valor NULL podem causar bugs sutis
- **Solução:** Sempre preencher valores NULL com dados razoáveis (ex: created_at)
- **Alternativa:** Usar `DEFAULT` no banco ou `NOT NULL` com valor padrão

### 4. Hot Module Replacement (HMR)
- **Problema:** Mudanças no código nem sempre refletem imediatamente
- **Solução:** Deletar `.next` folder + restart container para garantir recompilação completa
- **Alternativa:** Usar `next dev --turbo` (mais rápido) ou desabilitar cache em dev

---

## 📝 ARQUIVOS MODIFICADOS

| Arquivo | Linhas | Mudança |
|---------|--------|---------|
| `frontend/src/app/(dashboard)/portfolio/page.tsx` | 3, 35-44, 105-123 | Import useEffect + useQueryClient, cache invalidation, parse manual de data |
| `frontend/src/lib/hooks/use-portfolio.ts` | 8 | Adicionar `staleTime: 0` |
| `backend/database` (SQL) | - | UPDATE para preencher firstBuyDate NULL |

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Bug corrigido e validado
2. ⏳ Documentar em CLAUDE.md (FASE 22.5 → 100% completo)
3. ⏳ Atualizar VALIDACAO_FRONTEND_COMPLETA.md
4. ⏳ Commit com mensagem detalhada
5. ⏳ Push para origin/main

---

## 🔗 REFERÊNCIAS

- **Issue Original:** `BUG_GANHO_DO_DIA_EM_INVESTIGACAO.md`
- **Correções Portfolio:** `CORRECOES_PORTFOLIO_2025-11-12.md`
- **Documentação Projeto:** `CLAUDE.md` (FASE 22.5)
- **Screenshots:**
  - Antes: (ver arquivo de investigação)
  - Depois: `portfolio-ganho-dia-corrigido.png`

---

**Resolução:** ✅ Bug 100% resolvido e validado
**Desenvolvido por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-12
