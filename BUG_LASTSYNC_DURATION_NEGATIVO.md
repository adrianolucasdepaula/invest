# 🚨 BUG CRÍTICO: lastSyncDuration Negativo

**Data de Identificação:** 2025-11-21
**Identificado por:** Claude Code (Sonnet 4.5) - Validação Ultra-Robusta MCP Triplo
**Severidade:** ⚠️ MÉDIA (não impacta funcionalidade, mas indica cálculo incorreto)
**Status:** 🔴 ABERTO - Necessita correção definitiva

---

## 📋 DESCRIÇÃO DO PROBLEMA

Durante validação tripla MCP (Playwright + Chrome DevTools + Sequential Thinking) da implementação do sidebar com página Data Management, foi identificado que o endpoint `/api/v1/market-data/sync-status` retorna valores **NEGATIVOS** no campo `lastSyncDuration` para alguns ativos.

### Exemplo Real Identificado

**Ativo:** ASAI3 (Sendas Distribuidora S.A.)
**Response do endpoint:**
```json
{
  "ticker": "ASAI3",
  "name": "Sendas Distribuidora S.A.",
  "recordsLoaded": 72,
  "oldestDate": "2025-08-18",
  "newestDate": "2025-11-21",
  "status": "PARTIAL",
  "lastSyncAt": "2025-11-20T11:58:18.509Z",
  "lastSyncDuration": -3020.38  // ❌ NEGATIVO!
}
```

---

## 🔍 ANÁLISE DO PROBLEMA

### Comportamento Esperado
- `lastSyncDuration` deve representar o tempo (em segundos) que levou a última sincronização
- Valores devem ser sempre **positivos** ou `null` (se nunca sincronizado)
- Exemplo correto: `763.30s`, `764.81s`, etc

### Comportamento Observado
- Alguns ativos apresentam duração **negativa** (ex: `-3020.38s`)
- Isso não faz sentido físico (tempo não pode ser negativo)

### Possíveis Causas

1. **Problema de timezone/clock**
   - `endTime` calculado antes de `startTime` devido a timezone incorreto
   - Sistema usando timestamps inconsistentes (UTC vs local)

2. **Erro no cálculo de duração**
   ```typescript
   // ❌ POSSÍVEL CÓDIGO PROBLEMÁTICO
   const duration = startTime - endTime; // Invertido!

   // ✅ CORRETO
   const duration = endTime - startTime;
   ```

3. **Race condition**
   - Jobs assíncronos atualizando timestamps fora de ordem
   - `lastSyncAt` sendo atualizado antes do job completar

---

## 📍 LOCALIZAÇÃO PROVÁVEL DO BUG

### Backend - Service de Sincronização

**Arquivos a investigar:**
1. `backend/src/market-data/services/assets-update.service.ts` (574 linhas)
2. `backend/src/market-data/services/market-data.service.ts`
3. `backend/src/jobs/processors/sync-processor.ts` (175 linhas)

**Procurar por:**
```typescript
// Cálculo de duração
lastSyncDuration = ...
duration = ...
syncTime = ...
```

---

## 🧪 COMO REPRODUZIR

1. **Endpoint:** `GET http://localhost:3101/api/v1/market-data/sync-status`
2. **Autenticação:** Bearer token válido
3. **Buscar no response:** Ativos com `lastSyncDuration < 0`

**Comando curl:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3101/api/v1/market-data/sync-status | \
  jq '.assets[] | select(.lastSyncDuration < 0)'
```

---

## ✅ CRITÉRIOS DE CORREÇÃO

### Implementação Correta
- [ ] `lastSyncDuration` nunca pode ser negativo
- [ ] Usar timestamps UTC consistentes
- [ ] Cálculo: `duration = Date.now() - startTime` ou `endTime - startTime`
- [ ] Validação: `if (duration < 0) throw Error("Invalid duration")`

### Testes de Validação
- [ ] Unit test: Calcular duração com timestamps válidos
- [ ] Unit test: Rejeitar durações negativas
- [ ] Integration test: Sincronizar ativo e verificar `duration > 0`
- [ ] E2E test: Validar response do endpoint não contém negativos

### Documentação
- [ ] Atualizar schema `UpdateLog` com validação de duração
- [ ] Documentar formato de timestamps (UTC ISO 8601)
- [ ] Adicionar comentários no código sobre cálculo de duração

---

## 🎯 IMPACTO

### Funcionalidade
- ✅ **Não impacta:** Sistema continua funcional
- ✅ **Não impacta:** Dados históricos permanecem corretos
- ⚠️ **Impacta:** UI mostra duração incorreta para usuários
- ⚠️ **Impacta:** Métricas de performance ficam inválidas

### Dados Financeiros
- ✅ **Dados B3 não afetados:** `recordsLoaded`, `oldestDate`, `newestDate` corretos
- ✅ **Precisão mantida:** Valores COTAHIST sem manipulação

---

## 📝 PRÓXIMOS PASSOS

### Correção Definitiva (NÃO workaround)

1. **Investigar código**
   - Ler `assets-update.service.ts` completo
   - Identificar onde `lastSyncDuration` é calculado
   - Analisar lógica de timestamps

2. **Implementar fix**
   - Corrigir cálculo de duração
   - Adicionar validação `duration >= 0`
   - Usar timestamps UTC consistentes

3. **Testar**
   - Unit tests para cálculo
   - Integration test de sincronização completa
   - Validar endpoint não retorna negativos

4. **Documentar**
   - Atualizar DATABASE_SCHEMA.md
   - Comentar código com lógica de timestamps
   - Criar migration se necessário (constraint CHECK duration >= 0)

---

## 📊 EVIDÊNCIAS

### Screenshots
- `VALIDACAO_SIDEBAR_DATA_MANAGEMENT_PLAYWRIGHT.png` - UI mostrando sincronizações
- `VALIDACAO_SIDEBAR_DATA_MANAGEMENT_CHROME_DEVTOOLS.png` - DevTools confirmando bug

### Logs de Validação
- **Playwright MCP:** ✅ Página renderizada, dados carregados
- **Chrome DevTools MCP:** ✅ API 200 OK, ❌ duração negativa no payload
- **Sequential Thinking MCP:** ✅ Bug identificado, análise profunda completa

### Commit de Identificação
- **Commit:** `6948a86` (sidebar implementado)
- **Branch:** `main`
- **Data:** 2025-11-21

---

## 🏷️ TAGS

`bug` `data-quality` `backend` `sync` `critical-review` `needs-fix`

---

**Referência:** Validação Ultra-Robusta FASE 36.2.4 - Metodologia Claude Code com MCP Triplo
