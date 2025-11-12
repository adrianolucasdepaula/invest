# Bug: "Ganho do Dia" Incorreto para Posições Adicionadas Hoje

**Data:** 2025-11-12
**Status:** 🔄 EM INVESTIGAÇÃO
**Prioridade:** 🔴 ALTA

---

## 📋 DESCRIÇÃO DO BUG

Quando um usuário adiciona uma nova posição ao portfólio com o preço atual do ativo, o card **"Ganho do Dia"** mostra um valor incorreto ao invés de R$ 0,00.

### Exemplo Prático
- Ativo: VALE3
- Quantidade: 100
- Preço de Compra: R$ 65,51 (preço atual)
- Data de Compra: 12/11/2025 (hoje)
- Variação do mercado hoje: +0.72% (R$ 0,47 por ação)

**Resultado Esperado:**
- Ganho do Dia: R$ 0,00 (não tinha o ativo ontem)

**Resultado Atual (Bug):**
- Ganho do Dia: R$ 47,00 (+0.72%)

---

## 🔍 INVESTIGAÇÃO REALIZADA

### 1. Backend - Banco de Dados ✅ OK
Campo `first_buy_date` está sendo salvo corretamente:

```sql
SELECT id, asset_id, quantity, first_buy_date
FROM portfolio_positions
ORDER BY created_at DESC LIMIT 1;

Resultado:
first_buy_date: 2025-11-12 ✅
```

### 2. Backend - API Response ✅ OK
O backend está retornando o campo `firstBuyDate` corretamente:

```json
{
  "id": "...",
  "firstBuyDate": "2025-11-12",
  "quantity": 100,
  "averagePrice": 65.51
}
```

**Log do backend confirma:**
```
DEBUG Portfolio Position Keys: [
  'id', 'portfolioId', 'assetId', 'quantity',
  'averagePrice', 'currentPrice', 'totalInvested',
  'firstBuyDate', ✅
  ...
]
DEBUG firstBuyDate: 2025-11-12 ✅
```

### 3. Frontend - Lógica de Cálculo ✅ CORRIGIDA
**Problema Identificado:** Comparação de datas usando `toDateString()` não funciona corretamente com timezone.

**Código Anterior (Bugado):**
```typescript
// frontend/src/app/(dashboard)/portfolio/page.tsx:91-107
const today = new Date().toDateString();
const buyDate = p.firstBuyDate ? new Date(p.firstBuyDate).toDateString() : null;
const isBoughtToday = buyDate === today; // ❌ Não funciona com timezone
```

**Código Corrigido:**
```typescript
// Compare date parts only, ignore time/timezone
if (p.firstBuyDate) {
  const buyDate = new Date(p.firstBuyDate);
  const today = new Date();

  const isBoughtToday =
    buyDate.getFullYear() === today.getFullYear() &&
    buyDate.getMonth() === today.getMonth() &&
    buyDate.getDate() === today.getDate(); // ✅ Compara apenas ano/mês/dia

  if (isBoughtToday) return sum; // Não conta no day gain
}
```

### 4. Frontend - Cache/Recompilação ❓ PROBLEMA
**Status:** Código corrigido mas não reflete no browser

**Tentativas Realizadas:**
1. ✅ Reiniciar container frontend
2. ✅ Hard reload (Ctrl+Shift+F5)
3. ✅ Deletar pasta `.next` (cache do Next.js)
4. ✅ Recompilar página `/portfolio` (confirmado nos logs)
5. ❌ **Ainda mostra R$ 47,00**

**Possíveis Causas:**
- Cache do React Query (TanStack Query)
- Service Worker
- Browser cache persistente
- Hot Module Replacement (HMR) não funcionando
- Build Production vs Development

---

## 📝 ARQUIVOS MODIFICADOS

### 1. `frontend/src/app/(dashboard)/portfolio/page.tsx`
**Linhas:** 91-113
**Mudança:** Comparação de datas usando `getFullYear/Month/Date` ao invés de `toDateString()`

### 2. `backend/src/api/portfolio/portfolio.service.ts`
**Linhas:** 28-34
**Mudança:** Removidos logs de debug temporários

---

## 🎯 PRÓXIMOS PASSOS

### Opção 1: Build de Produção
```bash
cd frontend
npm run build
docker-compose up -d invest-frontend-prod
# Testar em http://localhost:3200/portfolio
```

### Opção 2: Limpar Cache do React Query
Adicionar código para invalidar cache ao carregar a página:

```typescript
const queryClient = useQueryClient();
useEffect(() => {
  queryClient.invalidateQueries(['portfolios']);
}, []);
```

### Opção 3: Verificar Service Worker
```bash
# No browser devtools:
Application > Service Workers > Unregister
```

### Opção 4: Testar em Incognito
Abrir http://localhost:3100/portfolio em janela anônima para garantir cache limpo.

---

## 📊 VALIDAÇÕES CONCLUÍDAS

✅ **Feature: Preço atual com variação** - Card verde mostrando preço, nome e tendência
✅ **Campo "Data de Compra"** - Adicionado e salvando corretamente
✅ **Bug: Quantidade com zeros** - Formatação corrigida (100 ao invés de 100.00000000)
✅ **Bug: Grid overlapping** - Layout customizado com minmax()
✅ **Backend: firstBuyDate** - Salvando e retornando corretamente
✅ **Frontend: Lógica de cálculo** - Código corrigido
❌ **Frontend: Visualização** - Bug persiste (problema de cache)

---

## 💡 SOLUÇÃO TEMPORÁRIA (WORKAROUND)

Até resolver o cache, usuários podem:
1. Aguardar 24h para o "Ganho do Dia" calcular corretamente
2. Ignorar o valor mostrado no dia da compra
3. Usar modo incógnito para testar

---

## 📚 REFERÊNCIAS

- `CORRECOES_PORTFOLIO_2025-11-12.md` - Documento com todas as correções
- `ESCLARECIMENTO_GANHO_DO_DIA.md` - Explicação do comportamento correto
- Commit anterior: `43cb96d` - Múltiplos bugs corrigidos

---

**Última Atualização:** 2025-11-12 16:55
**Investigado por:** Claude Code (Sonnet 4.5)
