# 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS - VALIDAÇÃO FASE 4

**Data:** 2025-11-12
**Fase:** FASE 4 - Connect Report Detail Page
**Validador:** Claude Code (Sonnet 4.5)
**Método:** Ultra-robust validation com Chrome DevTools MCP

---

## ❌ PROBLEMA 1: BACKEND NÃO RETORNA `currentPrice` NO ENDPOINT

### Descrição
O endpoint `GET /api/v1/reports/:id` retorna apenas os dados da tabela `analyses`, que **NÃO inclui o preço atual do ativo**.

### Evidência

**Frontend esperando campo `currentPrice`:**
```typescript
// frontend/src/app/(dashboard)/reports/[id]/page.tsx:129
<p className="text-2xl font-bold mt-1">
  R$ {analysis?.currentPrice?.toFixed(2) || 'N/A'}
</p>
```

**Resultado visual:** "R$ N/A"

**Banco de dados tem preço:**
```sql
SELECT ticker, date, close FROM asset_prices
WHERE ticker = 'WEGE3'
ORDER BY date DESC LIMIT 1;

-- Resultado:
-- WEGE3 | 2025-11-12 | 44.95 ✅
```

**Backend retorna apenas:**
```json
{
  "id": "3f22e48a-909e-49a8-9c09-6236b0ce2b05",
  "assetId": "b0680477-65d9-493c-87a9-7392ecc6a53f",
  "type": "complete",
  "status": "completed",
  "recommendation": "sell",
  "confidenceScore": 0.33,
  "analysis": {
    "pl": 29.8,
    "pvp": 8.62,
    "cotacao": 46.03  // ← Preço do scraper (antigo), não atual!
  },
  "asset": {
    "ticker": "WEGE3",
    "name": "WEG ON"
  }
  // ❌ NÃO TEM currentPrice!
}
```

### Impacto
- **Severidade:** 🔴 CRÍTICO
- **Usuário vê:** "Preço Atual: R$ N/A"
- **Dados reais existem** mas não são exibidos
- **Viola diretriz:** "Utilizar sempre dados reais coletados dos scrapers, não utilizar mocks"

### Causa Raiz
```typescript
// backend/src/api/reports/reports.controller.ts:49-53
@Get(':id')
async getReport(@Param('id') id: string) {
  return this.analysisService.findById(id);  // ← Retorna apenas tabela analyses
}

// backend/src/api/analysis/analysis.service.ts:442-447
async findById(id: string) {
  return this.analysisRepository.findOne({
    where: { id },
    relations: ['asset'],  // ← NÃO busca preço atual!
  });
}
```

### Solução Proposta
Modificar `analysis.service.ts:findById()` para:
1. Buscar análise (como já faz)
2. Buscar preço mais recente do `asset_prices` (mesmo padrão usado em `reports.service.ts:124-127`)
3. Adicionar campo `currentPrice` ao response

```typescript
async findById(id: string) {
  const analysis = await this.analysisRepository.findOne({
    where: { id },
    relations: ['asset'],
  });

  if (!analysis) {
    throw new NotFoundException('Analysis not found');
  }

  // Buscar preço mais recente
  const latestPrice = await this.assetPriceRepository.findOne({
    where: { assetId: analysis.assetId },
    order: { date: 'DESC' },
  });

  return {
    ...analysis,
    currentPrice: latestPrice?.close,
    changePercent: latestPrice?.changePercent,
  };
}
```

---

## ❌ PROBLEMA 2: APENAS 1 SCRAPER FUNCIONOU (CROSS-VALIDATION FALHOU)

### Descrição
Análise de WEGE3 coletou dados de **apenas 1 fonte (Fundamentus)** ao invés de 4 fontes como esperado.

### Evidência

**Banco de dados:**
```sql
SELECT data_sources, sources_count, confidence_score
FROM analyses
WHERE id = '3f22e48a-909e-49a8-9c09-6236b0ce2b05';

-- Resultado:
-- data_sources: ["fundamentus"]  ❌ Deveria ser 4 fontes!
-- sources_count: 1                ❌ Deveria ser 4!
-- confidence_score: 0.33          ⚠️ Muito baixo (33%)
```

**JSON da análise:**
```json
{
  "pl": 29.8,
  "psr": 4.67,
  "pvp": 8.62,
  "roe": 28.9,
  "ticker": "WEGE3",
  "cotacao": 46.03,
  "_metadata": {
    "sources": ["fundamentus"],      // ← APENAS 1 FONTE!
    "timestamp": "2025-11-12T03:15:22.591Z",
    "sourcesCount": 1
  }
}
```

### Impacto
- **Severidade:** 🔴 CRÍTICO
- **Cross-validation não funcionou**
- **Confiança muito baixa** (33% vs esperado >80%)
- **Dados incompletos** (faltam 3 fontes)
- **Viola princípio arquitetural:** "Cross-validation de múltiplas fontes (mínimo 3)"

### Fontes Esperadas
1. ✅ Fundamentus (funcionou)
2. ❌ BRAPI (falhou)
3. ❌ StatusInvest (falhou)
4. ❌ Investidor10 (falhou)

### Investigação Necessária
1. Verificar logs do backend durante a análise
2. Testar cada scraper individualmente com WEGE3
3. Verificar se scrapers autenticados (StatusInvest, Investidor10) têm credenciais válidas
4. Verificar se BRAPI está acessível

### Próximos Passos
1. Rodar teste individual de cada scraper:
   ```bash
   curl http://localhost:3101/api/v1/analysis/WEGE3/complete
   # Verificar logs do container
   docker logs invest_backend --tail 200
   ```

2. Identificar qual scraper falhou e por quê

---

## ❌ PROBLEMA 3: CAMPO `completed_at` ESTÁ NULL

### Descrição
Análise completada mas campo `completed_at` é `NULL`.

### Evidência
```sql
SELECT id, status, completed_at, created_at
FROM analyses
WHERE id = '3f22e48a-909e-49a8-9c09-6236b0ce2b05';

-- Resultado:
-- status: 'completed'
-- completed_at: NULL             ❌ Deveria ter timestamp!
-- created_at: 2025-11-12 03:14:46.240083
```

### Impacto
- **Severidade:** 🟡 MÉDIO
- **Não afeta funcionalidade** mas indica bug no código
- **Viola consistência** de dados

### Causa Provável
Backend não está atualizando `completed_at` ao finalizar análise.

### Solução
Verificar `analysis.service.ts` onde análise é finalizada e garantir:
```typescript
await this.analysisRepository.update(analysisId, {
  status: 'completed',
  completedAt: new Date(),  // ← Adicionar este campo
  analysis: mergedData,
  // ...
});
```

---

## 📊 RESUMO DOS PROBLEMAS

| # | Problema | Severidade | Status | Dados Reais? |
|---|----------|------------|--------|--------------|
| 1 | Backend não retorna `currentPrice` | 🔴 CRÍTICO | Pendente | Sim (existe no DB) |
| 2 | Apenas 1 scraper funcionou | 🔴 CRÍTICO | Investigar | Parcial (1/4 fontes) |
| 3 | `completed_at` NULL | 🟡 MÉDIO | Pendente | N/A |

---

## ✅ VALIDAÇÕES APROVADAS

- ✅ TypeScript: 0 erros
- ✅ Backend build: Success
- ✅ Frontend carrega página de detalhes
- ✅ Console: 0 erros críticos (apenas favicon 404)
- ✅ Network: Todas requisições principais com 200 OK
- ✅ Dados do Fundamentus são **REAIS** (não mockados)
- ✅ Recomendação exibida corretamente ("Venda")
- ✅ Confiança exibida corretamente ("33%")
- ✅ Data de geração exibida corretamente ("12/11/2025")

---

## 🎯 AÇÕES NECESSÁRIAS (Ordem de Prioridade)

1. **🔴 URGENTE:** Corrigir backend para retornar `currentPrice`
2. **🔴 URGENTE:** Investigar por que 3 scrapers falharam
3. **🟡 MÉDIO:** Corrigir campo `completed_at`
4. **🟢 BAIXO:** Completar validação com Playwright MCP após correções
5. **🟢 BAIXO:** Atualizar documentação

---

**Conclusão:** FASE 4 **NÃO PODE** ser marcada como 100% completa enquanto estes problemas críticos não forem resolvidos. Violaria a diretriz do usuário: "não se deve continuar para a proxima fase/etapa enquanto a fase anterior nao estiver sido entre 100% sem erros, falhas, warnings, bugs, divergencias ou inconsistencias".
