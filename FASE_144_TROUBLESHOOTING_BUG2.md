# TROUBLESHOOTING - BUG-2: Scientific Notation (FASE 144)

**Data:** 2025-12-28
**Severidade:** ALTA
**Status:** 🔴 **ROOT CAUSE IDENTIFICADO** - Fix pendente

---

## Sintoma

Valores financeiros salvos com scientific notation absurda:

```json
// PETR4 no banco (ERRADO):
"receita_liquida": null  (era 4.914460000001279e+23, foi rejeitado por sanitize)
"ebit": 1.97
"lucro_liquido": null    (era 7.752200000032705e+21, foi rejeitado por sanitize)

// Valores corretos (BCB, StatusInvest):
"receita_liquida": 127906000000   // 127.9 bilhões ✅
"ebit": 50983000000                // 51 bilhões ✅
"lucro_liquido": 32705000000       // 32.7 bilhões ✅
```

---

## Root Cause Identificado

**Conversão INCORRETA entre Python API → NestJS Backend:**

1. **Python API (CORRETO):**
   ```python
   # api-service logs (20:15:07):
   'receita_liquida': 127906000000.0   # 127.9 bi ✅
   'lucro_liquido': 32705000000.0       # 32.7 bi ✅
   'ebit': 50983000000.0                # 51 bi ✅
   ```

2. **NestJS Backend recebe (ERRADO):**
   ```json
   // backend logs (20:15:19):
   "receitaLiquida": 4.914460000001279e+23   # 494 sextilhões ❌
   "lucroLiquido": 7.752200000032705e+21     # 7.7 zetabytes ❌
   "ebit": 1.97                               # ❌ (deveria ser 51 bi)
   ```

**Conclusão:**
- Fundamentus scraper (Python) está CORRETO
- HTTP response do Python API está CORRETO
- **Cliente HTTP NestJS ou middleware está TRANSFORMANDO valores**

---

## Hipóteses

### 1. Conversão JSON Incorreta (Mais Provável)
- Axios/HTTP client pode estar aplicando transformação automática
- Scientific notation pode ser gerada por parseFloat() ou Number() incorreto
- Multiplicação acidental por 10^N

### 2. Middleware ou Interceptor
- Global transformation pipe
- Class-validator transformation
- DTO transform incorreto

### 3. Mapping de Campos
- CamelCase conversion (receita_liquida → receitaLiquida) pode estar aplicando transformação
- Field renaming com side effects

---

## Investigação Realizada

**Arquivos Verificados:**
1. ✅ `fundamentus_scraper.py` - Parsing CORRETO (127.9bi, 32.7bi)
2. ✅ `cache.service.ts` - wrap() fix não afeta valores
3. ✅ `assets-update.service.ts` - sanitize() fix REJEITA valores absurdos (correto)
4. ⏸️ `scrapers.service.ts` - HTTP client que chama Python API (PENDENTE)

**Próximos Passos:**
1. Ler `scrapers.service.ts` linha por linha
2. Verificar transformações em `fetchFundamentalData()`
3. Procurar multiplicações acidentais (× 1000, × 1000000, etc)
4. Verificar DTOs e transformations

---

## Evidências (Logs)

### Python API - Valores CORRETOS (20:15:07)
```python
DEBUG | scrapers.fundamentus_scraper:_extract_data:338 - Extracted Fundamentus data for PETR4: {
  'receita_liquida': 127906000000.0,
  'ebit': 50983000000.0,
  'lucro_liquido': 32705000000.0,
  ...
}
```

### NestJS Backend - Valores ERRADOS (20:15:19)
```json
{
  "source": "fundamentus",
  "data": {
    "receitaLiquida": 4.914460000001279e+23,
    "ebit": 1.97,
    "lucroLiquido": 7.752200000032705e+21,
    ...
  }
}
```

### Sanitize REJEITOU (Correto)
```
[ERROR] [AssetsUpdateService] [SANITIZE] Value 4.914460000001279e+23 exceeds max (1000000000000000), REJECTING (invalid data)
[ERROR] [AssetsUpdateService] [SANITIZE] Value 7.752200000032705e+21 exceeds max (1000000000000000), REJECTING (invalid data)
```

---

## Impact

**Afetados:**
- 275+ rows tinham valores clampados (UPDATE limpou para NULL)
- PETR4, VALE3, e outros ativos com Fundamentus como fonte
- Campos: receita_liquida, ebit, lucro_liquido

**Mitigação Atual:**
- `sanitize()` agora REJEITA valores absurdos (retorna NULL)
- Cross-validation usa outras fontes (BCB, StatusInvest) ✅
- Dados fundamentalistas ainda utilizáveis (P/L, ROE, etc corretos)

**Workaround:**
- Usar apenas BCB/StatusInvest para receita/lucro/ebit
- Desabilitar Fundamentus temporariamente?

---

## Solução Requerida (DEFINITIVA)

1. ✅ Identificar transformação incorreta em `scrapers.service.ts` - NÃO ERA O PROBLEMA
2. ❌ Root Cause REAL: Cheerio selector em `fundamentus.scraper.ts`
3. **PROBLEMA CONFIRMADO (2025-12-28 20:14):**
   - `$('td:contains("EBIT")')` casa com "P/EBIT" E "EBIT"
   - Receita Líquida: HTML retorna valores concatenados "491.446.000.000127.906.000.000"
   - EBIT: Retorna 1.97 (P/EBIT ratio) em vez de 51bi (EBIT absoluto)

**Próximos Passos:**
1. Reescrever getValue() para usar seletores exatos ou navegação DOM
2. Verificar TODOS os campos (33 total) para seletores incorretos
3. Re-testar PETR4 com scraper corrigido
4. Validar cross-validation 100% consenso

---

**Ref:** PM Expert Report - FASE 144 Validation
**Bloqueante:** GO/NO-GO para FASE 145
**Status:** BUG-4 AMPLIADO - Scraper TypeScript precisa reescrita completa
