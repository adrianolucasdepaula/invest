# 🔧 PLANEJAMENTO CORREÇÃO CRÍTICA - Página Análises

**Data:** 2025-11-15
**Prioridade:** 🔴 CRÍTICA
**Estimativa:** 4-6 horas
**Status:** 📝 PLANEJAMENTO

---

## 📋 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. ❌ Análise Completa NÃO combina Fundamentalista + Técnica
**Arquivo:** `backend/src/api/analysis/analysis.service.ts:323`

**Problema:**
```typescript
async generateCompleteAnalysis(ticker: string, userId?: string) {
  // ...
  // ❌ SÓ FAZ ANÁLISE FUNDAMENTALISTA
  const fundamentalResult = await this.scrapersService.scrapeFundamentalData(ticker);

  // ❌ NUNCA CHAMA generateTechnicalAnalysis()
  // ❌ NUNCA COMBINA OS DOIS TIPOS
}
```

**Impacto:** Análise "Completa" é FALSA - apenas fundamentalista
**Evidência:** Screenshot mostra análise PETR4 "Completa" com dados apenas fundamentalistas

---

### 2. ❌ Cálculo de Confiança Retorna 0 (ZERO)
**Arquivo:** `backend/src/scrapers/scrapers.service.ts:259`

**Problema:**
```typescript
private calculateConfidence(results: ScraperResult[], discrepancies: any[]): number {
  // Base confidence on number of sources
  let confidence = Math.min(results.length / this.minSources, 1.0);

  // ❌ PROBLEMA: Reduz drasticamente se houver discrepâncias
  if (discrepancies.length > 0) {
    const avgDeviation =
      discrepancies.reduce((sum, d) => sum + d.maxDeviation, 0) / discrepancies.length;
    confidence *= Math.max(0, 1 - avgDeviation / 100);
  }

  return confidence; // ❌ RETORNA 0 quando há muitas discrepâncias
}
```

**Impacto:** Confiança = 0 mesmo com 5 fontes válidas
**Evidência:** Screenshot mostra "Confiança: 0" com "Fontes: 5"

---

### 3. ❌ Cálculo de Confiança NÃO Explicado ao Usuário
**Arquivo:** `frontend/src/app/(dashboard)/analysis/page.tsx:531`

**Problema:**
```typescript
{analysis.confidenceScore && (
  <div>
    <p className="text-sm text-muted-foreground">Confiança</p>
    <p className={cn('text-2xl font-bold', getScoreColor(analysis.confidenceScore * 100))}>
      {(analysis.confidenceScore * 100).toFixed(0)} {/* ❌ SÓ MOSTRA O NÚMERO */}
    </p>
  </div>
)}
```

**Impacto:** Usuário não entende COMO é calculado
**Esperado:** Tooltip explicando: "Baseado em X fontes com Y% de concordância"

---

### 4. ⚠️ Fontes Implementadas vs Planejadas
**Arquivo:** `backend/src/scrapers/scrapers.service.ts:45`

**Situação Atual:**
```typescript
const results = await Promise.allSettled([
  this.fundamentusScraper.scrape(ticker),    // ✅ Implementado
  this.brapiScraper.scrape(ticker),          // ✅ Implementado
  this.statusInvestScraper.scrape(ticker),   // ✅ Implementado
  this.investidor10Scraper.scrape(ticker),   // ✅ Implementado
  this.fundamenteiScraper.scrape(ticker),    // ✅ Implementado
  this.investsiteScraper.scrape(ticker),     // ✅ Implementado
]);
```

**Fontes Planejadas (ROADMAP) mas NÃO implementadas:**
- ❌ TradingView (análise técnica avançada)
- ❌ Opcoes.net.br (opções)
- ❌ 6 fontes de notícias
- ❌ 4 fontes de relatórios
- ❌ Griffin (insiders)

**Impacto:** Tooltip diz "4 fontes" mas são 6 implementadas

---

### 5. ❌ Análise de IA (AI) NÃO Implementada
**Evidência:** Código não possui método `generateAIAnalysis()`
**Impacto:** Usuário espera análise com IA mas não existe

---

## 🎯 SOLUÇÃO PROPOSTA

### FASE 28.1: Corrigir Análise Completa (CRÍTICO)

#### Backend: analysis.service.ts

**Método:** `generateCompleteAnalysis()` (linha 323)

**Mudança:**
```typescript
async generateCompleteAnalysis(ticker: string, userId?: string) {
  // ... (código de criação de análise)

  try {
    const startTime = Date.now();

    // ✅ 1. ANÁLISE FUNDAMENTALISTA (scraping multi-fonte)
    const fundamentalResult = await this.scrapersService.scrapeFundamentalData(ticker);

    // ✅ 2. ANÁLISE TÉCNICA (indicadores)
    const prices = await this.assetPriceRepository.find({
      where: { assetId: asset.id },
      order: { date: 'DESC' },
      take: 200,
    });

    let technicalAnalysis = null;
    if (prices.length >= 20) {
      prices.reverse();
      const indicators = this.calculateTechnicalIndicators(prices);
      const technicalRecommendation = this.generateRecommendation(indicators);
      const technicalConfidence = this.calculateConfidence(indicators);

      technicalAnalysis = {
        recommendation: technicalRecommendation,
        confidence: technicalConfidence,
        indicators,
        summary: this.generateSummary(indicators, technicalRecommendation),
        signals: this.identifySignals(indicators),
        trends: this.identifyTrends(indicators),
      };
    }

    // ✅ 3. COMBINAR RESULTADOS
    const combinedAnalysis = {
      fundamental: fundamentalResult.data,
      technical: technicalAnalysis,
      combined: {
        // Média ponderada das recomendações
        recommendation: this.combineRecommendations(
          fundamentalResult.data,
          technicalAnalysis?.recommendation
        ),
        // Confiança combinada
        confidence: this.combinedConfidence(
          fundamentalResult.confidence,
          technicalAnalysis?.confidence || 0
        ),
      },
    };

    // ✅ 4. ATUALIZAR ANÁLISE
    analysis.status = AnalysisStatus.COMPLETED;
    analysis.analysis = combinedAnalysis;
    analysis.recommendation = combinedAnalysis.combined.recommendation;
    analysis.confidenceScore = combinedAnalysis.combined.confidence;
    analysis.dataSources = [
      ...fundamentalResult.sources,
      ...(technicalAnalysis ? ['database'] : []),
    ];
    analysis.sourcesCount = analysis.dataSources.length;
    analysis.processingTime = Date.now() - startTime;
    analysis.completedAt = new Date();

    await this.analysisRepository.save(analysis);

    this.logger.log(`Complete analysis finished for ${ticker}: ${analysis.recommendation}`);
    return analysis;
  } catch (error) {
    // ... (código de erro)
  }
}

// ✅ NOVOS MÉTODOS AUXILIARES

private combineRecommendations(
  fundamental: any,
  technical?: Recommendation
): Recommendation {
  // Lógica de combinação (peso 60% fundamentalista, 40% técnica)
  // Implementar baseado em múltiplos fundamentalistas e recomendação técnica
}

private combinedConfidence(
  fundamentalConf: number,
  technicalConf: number
): number {
  // Média ponderada (60% fundamental, 40% técnica)
  return (fundamentalConf * 0.6) + (technicalConf * 0.4);
}
```

---

### FASE 28.2: Corrigir Cálculo de Confiança (CRÍTICO)

#### Backend: scrapers.service.ts

**Método:** `calculateConfidence()` (linha 259)

**Problema Atual:**
- Confiança = 0 quando `avgDeviation > 100%`
- Muito sensível a discrepâncias
- Não considera que discrepâncias são NORMAIS entre fontes diferentes

**Mudança:**
```typescript
private calculateConfidence(results: ScraperResult[], discrepancies: any[]): number {
  if (results.length === 0) return 0;

  // ✅ 1. BASE: Número de fontes (máximo = 1.0 com 6+ fontes)
  const sourcesScore = Math.min(results.length / 6, 1.0);

  // ✅ 2. PENALIZAÇÃO POR DISCREPÂNCIAS (mais tolerante)
  let discrepancyPenalty = 0;
  if (discrepancies.length > 0) {
    // Considerar apenas discrepâncias > 20% (valores menores são normais)
    const significantDiscrepancies = discrepancies.filter(d => d.maxDeviation > 20);

    if (significantDiscrepancies.length > 0) {
      const avgDeviation = significantDiscrepancies.reduce((sum, d) => sum + d.maxDeviation, 0) / significantDiscrepancies.length;
      // Penalização máxima de 30% (não zerar confiança)
      discrepancyPenalty = Math.min(avgDeviation / 200, 0.3);
    }
  }

  // ✅ 3. CONFIANÇA FINAL (nunca menor que 40% se há >= 3 fontes)
  const confidence = sourcesScore * (1 - discrepancyPenalty);
  const minConfidence = results.length >= this.minSources ? 0.4 : 0;

  return Math.max(confidence, minConfidence);
}
```

**Impacto:**
- Confiança **NUNCA** será 0 se há 3+ fontes
- Mínimo de 40% com 3 fontes
- Máximo de 100% com 6 fontes e sem discrepâncias significativas

---

### FASE 28.3: Explicar Cálculo de Confiança ao Usuário

#### Frontend: page.tsx (linha 531)

**Mudança:**
```typescript
{analysis.confidenceScore && (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-help">
          <p className="text-sm text-muted-foreground">Confiança</p>
          <p className={cn('text-2xl font-bold', getScoreColor(analysis.confidenceScore * 100))}>
            {(analysis.confidenceScore * 100).toFixed(0)}%
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <p className="font-semibold mb-2">Como é calculado?</p>
        <div className="text-xs space-y-1">
          <p>✓ <strong>Fontes:</strong> {analysis.sourcesCount} fontes consultadas</p>
          <p>✓ <strong>Cross-Validation:</strong> Dados comparados entre fontes</p>
          <p>✓ <strong>Concordância:</strong> {(analysis.confidenceScore * 100).toFixed(0)}% de concordância entre fontes</p>
          {analysis.dataSources && (
            <p className="mt-2 pt-2 border-t border-border">
              <strong>Fontes:</strong> {analysis.dataSources.join(', ')}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
)}
```

---

### FASE 28.4: Atualizar Tooltip "Solicitar Análises em Massa"

#### Frontend: page.tsx (linha 376)

**Problema:** Diz "4 fontes" mas são 6 implementadas

**Mudança:**
```typescript
<TooltipContent side="bottom" className="max-w-xs">
  <p className="font-semibold mb-1">Análise em Massa com Multi-Fonte</p>
  <p className="text-xs text-muted-foreground mb-2">
    Coleta dados de <strong>6 fontes</strong> (Fundamentus, BRAPI, StatusInvest,
    Investidor10, Fundamentei, InvestSite) e realiza validação cruzada para
    garantir máxima precisão nas análises.
  </p>
  <div className="text-xs space-y-1 mt-2">
    <p>✓ Cross-validation automática</p>
    <p>✓ Detecção de discrepâncias</p>
    <p>✓ Score de confiança baseado em concordância</p>
  </div>
</TooltipContent>
```

---

### FASE 28.5: Implementar Análise de IA (OPCIONAL - Fase Futura)

**Status:** ⏳ Planejado para FASE 29
**Escopo:**
- Integração com ChatGPT/Claude/Gemini
- Análise de sentimento de notícias
- Predições baseadas em ML
- Recomendações personalizadas

**Bloqueador:** Requer integração com APIs de IA (custos)

---

## 📊 CHECKLIST DE IMPLEMENTAÇÃO

### Backend (analysis.service.ts)
- [ ] **1.1** Refatorar `generateCompleteAnalysis()`
  - [ ] Adicionar coleta de preços
  - [ ] Calcular indicadores técnicos
  - [ ] Criar método `combineRecommendations()`
  - [ ] Criar método `combinedConfidence()`
  - [ ] Combinar análises fundamentalista + técnica
  - [ ] Atualizar `dataSources` (incluir 'database')
  - [ ] Adicionar logs detalhados
- [ ] **1.2** Adicionar tipos TypeScript
  - [ ] Interface `CombinedAnalysisResult`
  - [ ] Interface `TechnicalAnalysisResult`
- [ ] **1.3** Adicionar testes unitários
  - [ ] Testar `combineRecommendations()`
  - [ ] Testar `combinedConfidence()`
  - [ ] Testar análise completa PETR4

### Backend (scrapers.service.ts)
- [ ] **2.1** Refatorar `calculateConfidence()`
  - [ ] Ajustar cálculo base (fontes / 6)
  - [ ] Filtrar discrepâncias significativas (> 20%)
  - [ ] Garantir mínimo 40% com 3+ fontes
  - [ ] Adicionar logs de debug
- [ ] **2.2** Adicionar testes unitários
  - [ ] Cenário: 3 fontes, 0 discrepâncias → 50%
  - [ ] Cenário: 6 fontes, 0 discrepâncias → 100%
  - [ ] Cenário: 5 fontes, 1 discrepância 10% → ~70%
  - [ ] Cenário: 5 fontes, 1 discrepância 50% → ~50%

### Frontend (page.tsx)
- [ ] **3.1** Adicionar Tooltip em Confiança
  - [ ] Importar TooltipProvider
  - [ ] Criar tooltip com explicação
  - [ ] Mostrar número de fontes
  - [ ] Mostrar lista de fontes
  - [ ] Mostrar percentual de concordância
- [ ] **3.2** Atualizar Tooltip "Solicitar Análises"
  - [ ] Corrigir "4 fontes" → "6 fontes"
  - [ ] Listar fontes implementadas
  - [ ] Explicar cross-validation
- [ ] **3.3** Adicionar seção "Análise Técnica" em Detalhes
  - [ ] Card separado para indicadores técnicos
  - [ ] Card separado para análise fundamentalista
  - [ ] Card "Análise Combinada" com recomendação final

### Validação (MCP Triplo)
- [ ] **4.1** Playwright
  - [ ] Solicitar análise completa PETR4
  - [ ] Aguardar conclusão (2-3 min)
  - [ ] Verificar confiança > 0%
  - [ ] Verificar fontes = 6+ (5 scraper + 1 database)
  - [ ] Abrir detalhes e verificar análise técnica
  - [ ] Screenshot validação
- [ ] **4.2** Chrome DevTools
  - [ ] Console: 0 erros
  - [ ] Network: Verificar request POST /analysis/PETR4/complete
  - [ ] Network: Verificar response com análise combinada
  - [ ] Performance: < 3s para carregar análises
- [ ] **4.3** Sequential Thinking
  - [ ] Fluxo completo: Solicitar → Aguardar → Ver Detalhes
  - [ ] Validar lógica de cálculo de confiança
  - [ ] Validar combinação de recomendações

### Documentação
- [ ] **5.1** Criar `CORRECAO_ANALISES_2025-11-15.md`
  - [ ] Problemas identificados (5 itens)
  - [ ] Soluções implementadas
  - [ ] Código antes/depois
  - [ ] Screenshots validação
  - [ ] Testes realizados
- [ ] **5.2** Atualizar ROADMAP.md
  - [ ] Adicionar FASE 28: Correção Análises
  - [ ] Atualizar status FASE 29 (Análise IA)
- [ ] **5.3** Atualizar CLAUDE.md
  - [ ] Adicionar referência a FASE 28

### Git
- [ ] **6.1** Commit backend (analysis.service.ts + scrapers.service.ts)
- [ ] **6.2** Commit frontend (page.tsx)
- [ ] **6.3** Commit documentação
- [ ] **6.4** Push para origin/main

---

## 🎯 PRIORIZAÇÃO

### 🔴 CRÍTICO (Implementar AGORA)
1. ✅ Correção cálculo de confiança (FASE 28.2)
2. ✅ Explicar confiança ao usuário (FASE 28.3)
3. ✅ Corrigir análise completa (FASE 28.1)

### 🟡 IMPORTANTE (Implementar em seguida)
4. ✅ Atualizar tooltip multi-fonte (FASE 28.4)
5. ✅ Adicionar seção técnica em detalhes (FASE 28.3)

### 🟢 DESEJÁVEL (Fase futura)
6. ⏳ Implementar análise de IA (FASE 29)
7. ⏳ Adicionar mais scrapers (TradingView, Opcoes.net.br)

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: Breaking Changes em Análises Existentes
**Probabilidade:** ALTA
**Impacto:** MÉDIO
**Mitigação:**
- Manter backward compatibility no schema `analysis.analysis`
- Adicionar campo `version` para identificar formato
- Migração gradual de análises antigas

### Risco 2: Performance com Análise Completa
**Probabilidade:** MÉDIA
**Impacto:** MÉDIO
**Mitigação:**
- Análise já é assíncrona (status: PROCESSING)
- Cache de análises recentes (< 24h)
- Timeout de 3 minutos para scraping

### Risco 3: Scrapers Falhando
**Probabilidade:** ALTA (scrapers instáveis)
**Impacto:** ALTO (confiança = 0)
**Mitigação:**
- Já implementado: `Promise.allSettled()` (não falha se 1 scraper falhar)
- Mínimo de 3 fontes para análise válida
- Logs detalhados para debug

---

## 📈 MÉTRICAS DE SUCESSO

### Antes da Correção
```
Análise Completa PETR4:
- Tipo: "Completa" (mentira - só fundamentalista)
- Confiança: 0% (BUG)
- Fontes: 5 (correto)
- Recomendação: Venda (baseado só em fundamentalista)
```

### Depois da Correção (Esperado)
```
Análise Completa PETR4:
- Tipo: "Completa" (fundamentalista + técnica ✅)
- Confiança: 60-80% (baseado em 6 fontes ✅)
- Fontes: 6 (5 scrapers + 1 database ✅)
- Recomendação: Combinada (60% fundamentalista + 40% técnica ✅)
- Detalhes: Seções separadas para fundamental e técnica ✅
- Tooltip: Explicação clara do cálculo ✅
```

---

## 🔄 DEPENDÊNCIAS

### Arquivos a Modificar
1. `backend/src/api/analysis/analysis.service.ts` (300+ linhas)
2. `backend/src/scrapers/scrapers.service.ts` (20 linhas)
3. `frontend/src/app/(dashboard)/analysis/page.tsx` (50 linhas)

### Não Modificar (Já Funcionando)
- ✅ Scrapers individuais (6 implementados)
- ✅ Cross-validation básica
- ✅ Análise técnica isolada
- ✅ Análise fundamentalista isolada

---

## 📅 CRONOGRAMA ESTIMADO

| Fase | Tarefa | Tempo Estimado |
|------|--------|---------------|
| **28.1** | Refatorar `generateCompleteAnalysis()` | 2h |
| **28.2** | Corrigir `calculateConfidence()` | 1h |
| **28.3** | Adicionar tooltips frontend | 1h |
| **28.4** | Validação MCP Triplo | 1h |
| **28.5** | Documentação completa | 1h |
| **TOTAL** | | **6 horas** |

---

## ✅ APROVAÇÃO NECESSÁRIA

**Aguardando aprovação do usuário para:**
- [ ] Implementar análise combinada (fundamentalista + técnica)
- [ ] Corrigir cálculo de confiança (tolerância maior a discrepâncias)
- [ ] Adicionar tooltips explicativos

**Iniciar implementação após confirmação explícita.**

---

**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-15
**Status:** ⏳ AGUARDANDO APROVAÇÃO

---
