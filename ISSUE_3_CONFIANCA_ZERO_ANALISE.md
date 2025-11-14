# ISSUE #3: Confiança 0.00 nas Análises - INVESTIGAÇÃO COMPLETA

**Data:** 2025-11-14
**Fase:** FASE 15 - Network Requests Validation
**Prioridade:** 🟡 MÉDIA (Qualidade de Dados)
**Status:** ✅ INVESTIGADA - CAUSA IDENTIFICADA

---

## 📋 RESUMO EXECUTIVO

**Problema:** Análises retornam `confidenceScore = "0.00"` apesar de terem 4 fontes de dados.

**Causa Raiz:** Dados dos scrapers contêm valores absurdos (notação científica com expoentes gigantes), causando desvios > 100% entre fontes, o que zera o score de confiança.

**Status do Código:** ✅ **CORRETO** - Algoritmo funcionando conforme esperado
**Status dos Dados:** ❌ **RUINS** - Scrapers retornando valores multiplicados incorretamente

---

## 🔍 DIAGNÓSTICO

### Dados do Banco (PostgreSQL)

```sql
SELECT a.id, ast.ticker, a.type, a.status, a.confidence_score, a.sources_count
FROM analyses a
JOIN assets ast ON a.asset_id = ast.id
LIMIT 5;
```

**Resultado:**
| ID | Ticker | Type | Status | Confidence | Sources |
|----|--------|------|--------|-----------|---------|
| ce628b2e... | VALE3 | complete | completed | **0.00** | **4** |
| c1f7acc3... | CPLE6 | complete | completed | **0.00** | **3** |
| 10cab82e... | AXIA3 | complete | completed | **0.00** | **3** |
| 765f11ac... | VALE3 | technical | completed | **1.00** | **1** |
| 467c3d48... | PETR4 | complete | completed | **0.00** | **4** |

**Observação:** Análises `technical` (fonte única) têm confidence 1.00 ✅
**Problema:** Análises `complete` (múltiplas fontes) têm confidence 0.00 ❌

---

## 🧪 ANÁLISE DO CÓDIGO

### Algoritmo de Cálculo de Confiança

**Arquivo:** `backend/src/scrapers/scrapers.service.ts:259-271`

```typescript
private calculateConfidence(results: ScraperResult[], discrepancies: any[]): number {
  // Base confidence on number of sources
  let confidence = Math.min(results.length / this.minSources, 1.0);

  // Reduce confidence based on discrepancies
  if (discrepancies.length > 0) {
    const avgDeviation =
      discrepancies.reduce((sum, d) => sum + d.maxDeviation, 0) / discrepancies.length;
    confidence *= Math.max(0, 1 - avgDeviation / 100);  // ⚠️ AQUI ZERA
  }

  return confidence;
}
```

**Lógica:**
1. **Base confidence:** `Math.min(4 / 3, 1.0) = 1.0` ✅ (4 fontes / 3 mínimo)
2. **Penalização por discrepâncias:**
   - Se `avgDeviation < 100%`: confidence reduzido proporcionalmente
   - Se `avgDeviation >= 100%`: **confidence = 0.0** ❌

**Exemplo:**
- 4 fontes: Base confidence = 1.0
- Discrepância média: 150%
- Fator de penalização: `Math.max(0, 1 - 150/100) = 0.0`
- **Confidence final: 1.0 × 0.0 = 0.0** ❌

---

## 🐛 DADOS PROBLEMÁTICOS IDENTIFICADOS

### Exemplo: PETR4 Analysis (from network request)

```json
{
  "analysis": {
    "pl": 5.38,
    "pvp": 0.99,
    "lucroLiquido": 7.752200000032705e+21,  // ❌ 7 QUINTILHÕES!
    "receitaLiquida": 4.914460000001279e+23, // ❌ 491 SEXTILHÕES!
    "dividaBruta": 376083000000,             // ✅ 376 bilhões (razoável)
    "patrimonioLiquido": 422934000000        // ✅ 422 bilhões (razoável)
  }
}
```

### Análise dos Valores

| Campo | Valor Recebido | Ordem de Grandeza | Status |
|-------|---------------|-------------------|--------|
| `pl` | 5.38 | Unidades | ✅ Normal |
| `pvp` | 0.99 | Unidades | ✅ Normal |
| `dividaBruta` | 376.083 bilhões | 10^11 | ✅ Normal |
| `patrimonioLiquido` | 422.934 bilhões | 10^11 | ✅ Normal |
| `lucroLiquido` | **7.752 × 10^21** | **10^21** | ❌ **ABSURDO** |
| `receitaLiquida` | **4.914 × 10^23** | **10^23** | ❌ **ABSURDO** |

**Conclusão:** Campos `lucroLiquido` e `receitaLiquida` estão **multiplicados por ~10^10** (10 bilhões de vezes).

---

## 📊 CÁLCULO DE DISCREPÂNCIA (Exemplo Hipotético)

Supondo que as 4 fontes retornem:

| Fonte | lucroLiquido |
|-------|--------------|
| Fundamentus | 77.522 bilhões (correto) |
| BRAPI | 7.752 × 10^21 (errado) |
| StatusInvest | 75.000 bilhões (correto) |
| Investidor10 | 80.000 bilhões (correto) |

**Média:** `(77.522 + 7.752e+21 + 75 + 80) / 4 ≈ 1.938e+21`
**Desvio Máximo:** `|77.522 - 1.938e+21| / 1.938e+21 ≈ 1.0` (**100%**)

**Discrepância:** 100% → Confidence = 0.0 ❌

---

## ✅ CONCLUSÕES

### Código (backend/src/scrapers/scrapers.service.ts)
- ✅ Algoritmo de cálculo: **CORRETO**
- ✅ Lógica de validação: **CORRETO**
- ✅ Threshold (5%): **ADEQUADO**
- ✅ Penalização por discrepâncias: **FUNCIONANDO**

### Dados (scrapers)
- ❌ Valores absurdos em campos numéricos
- ❌ Multiplicação incorreta (fator ~10^10)
- ❌ Falta de validação/sanitização dos dados
- ❌ Conversão de unidades inconsistente (milhares vs milhões vs bilhões)

---

## 🔧 RECOMENDAÇÕES

### Curto Prazo (Mitigação)
1. **Adicionar validação de ranges** nos scrapers:
   ```typescript
   if (lucroLiquido > 1e15) {  // > 1 quadrilhão
     this.logger.warn(`Suspicious value: lucroLiquido = ${lucroLiquido}`);
     // Dividir por 10^10 ou descartar
   }
   ```

2. **Normalizar unidades:**
   - Padronizar todos os valores monetários em **reais (R$)**
   - Documentar se são: milhares, milhões, bilhões

3. **Logs detalhados:**
   - Logar valores brutos de cada scraper
   - Comparar antes e depois do merge

### Médio Prazo (Correção Definitiva)
1. **Refatorar scrapers:**
   - Revisar parsing de HTML/JSON
   - Validar conversões numéricas
   - Unit tests com dados reais

2. **Implementar validação por fonte:**
   - Ranges esperados por campo
   - Rejeitar valores absurdos

3. **Dashboard de qualidade:**
   - Monitorar discrepâncias por campo
   - Alertas automáticos para valores suspeitos

---

## 🎯 IMPACTO

**Funcionalidade:**
- ✅ Sistema continua funcionando
- ⚠️ Confiança zerada impede validação adequada
- ⚠️ Decisões de investimento podem ser comprometidas

**Criticidade:** 🟡 **MÉDIA**
- Não quebra o sistema
- Afeta qualidade das análises
- Requer correção dos scrapers (tarefa maior)

---

## 📝 PRÓXIMOS PASSOS

1. ✅ Documentar Issue #3 ← **COMPLETO**
2. 🔜 Criar task separada para correção de scrapers
3. 🔜 Continuar com FASE 16 (não é bloqueante)
4. 🔜 Planejar refatoração de scrapers (FASE futura)

---

**Gerado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-14 01:30 UTC
**Arquivo:** `ISSUE_3_CONFIANCA_ZERO_ANALISE.md`
