# 🔍 INVESTIGAÇÃO PROBLEMA 2 - Apenas 2/4 Scrapers Funcionando

**Data:** 2025-11-12
**Status:** 🟡 EM INVESTIGAÇÃO
**Severidade:** 🔴 CRÍTICO

---

## 📊 Resultado da Análise WEGE3 (Nova Teste - 2025-11-13 01:12:10)

### Scrapers Executados:

| # | Scraper | Status | Tempo | Erro |
|---|---------|--------|-------|------|
| 1 | **Fundamentus** | ✅ SUCESSO | 9.6s | - |
| 2 | **Investidor10** | ✅ SUCESSO | 14.9s | - |
| 3 | **BRAPI** | ❌ FALHOU | 1s | `Request failed with status code 403` |
| 4 | **StatusInvest** | ❌ FALHOU | 30s | `Navigation timeout of 30000 ms exceeded` |

### Resumo:
- ✅ **2/4 scrapers funcionando** (50%)
- ❌ **2/4 scrapers falhando** (50%)
- ⚠️ **WARNING**: "Only 2 sources available for WEGE3, minimum required: 3"
- 📉 **Confiança baixa**: 0.33 (33%) devido a poucas fontes

---

## 🔴 PROBLEMA 1: BRAPI - Status Code 403

### Descrição
```
[ERROR] [BrapiScraper] Failed to scrape WEGE3 from BRAPI: Request failed with status code 403
```

### Possíveis Causas:

1. **Rate Limiting**
   - BRAPI tem limite de requisições (gratuito: 10 req/min)
   - Sistema pode estar excedendo limite em testes repetidos
   - Solução: Implementar cache ou usar API key premium

2. **IP Bloqueado**
   - BRAPI pode estar bloqueando requests do servidor
   - Verificar headers necessários (User-Agent, etc)
   - Solução: Adicionar headers apropriados

3. **Mudança na API**
   - Endpoint pode ter mudado
   - Autenticação pode ser necessária agora
   - Solução: Verificar documentação da BRAPI

### Investigação Necessária:
```bash
# Testar endpoint manualmente
curl -v https://brapi.dev/api/quote/WEGE3

# Verificar código do scraper
backend/src/scrapers/fundamental/brapi.scraper.ts
```

---

## 🔴 PROBLEMA 2: StatusInvest - Navigation Timeout

### Descrição
```
[ERROR] [StatusInvestScraper] Failed to scrape WEGE3 from statusinvest: Navigation timeout of 30000 ms exceeded
```

### Possíveis Causas:

1. **Autenticação Falhando**
   - StatusInvest requer login (Google OAuth)
   - Credenciais podem estar inválidas/expiradas
   - Playwright pode não estar conseguindo fazer login
   - Solução: Verificar credenciais e fluxo de autenticação

2. **Seletores Desatualizados**
   - Site pode ter mudado estrutura HTML
   - Seletores CSS/XPath obsoletos
   - Solução: Atualizar seletores

3. **Anti-Bot Detectando Playwright**
   - StatusInvest pode ter proteção anti-scraping
   - Cloudflare ou similar bloqueando navegação
   - Solução: Configurar headers, user-agent, stealth mode

4. **Timeout Muito Curto**
   - 30 segundos pode não ser suficiente
   - Site pode estar lento
   - Solução: Aumentar timeout ou adicionar retry

### Investigação Necessária:
```bash
# Verificar código do scraper
backend/src/scrapers/fundamental/statusinvest.scraper.ts

# Testar manualmente no browser
# URL: https://statusinvest.com.br/acoes/wege3
```

---

## 📈 Impacto no Sistema

### Cross-Validation Comprometido

**Arquitetura esperada:**
```
4 fontes → Merge → Cross-validation → Confiança alta (>80%)
```

**Realidade atual:**
```
2 fontes → Merge → Cross-validation parcial → Confiança baixa (33%)
```

### Recomendações Afetadas

Com apenas 2 fontes, o sistema:
- ❌ Não pode validar dados com 3+ fontes (mínimo recomendado)
- ❌ Gera recomendações de baixa confiança (33%)
- ❌ Pode ter dados incorretos sem detecção
- ❌ Viola princípio arquitetural: "Cross-validation de múltiplas fontes (mínimo 3)"

### Dados Coletados (2/4 fontes)

**Fundamentus + Investidor10:**
```json
{
  "pl": 29.8,
  "pvp": 8.62,
  "roe": 28.9,
  "cotacao": 46.03,
  "dividendYield": 1.8,
  "_metadata": {
    "sources": ["fundamentus", "investidor10"],  // Apenas 2!
    "sourcesCount": 2
  }
}
```

**Faltando (BRAPI + StatusInvest):**
- Validação cruzada de indicadores
- Dados complementares
- Maior confiança estatística

---

## 🎯 Próximos Passos (Ordem de Prioridade)

### 1. 🔴 URGENTE: Corrigir BRAPI (403)
- [ ] Testar endpoint BRAPI manualmente
- [ ] Verificar documentação da API
- [ ] Implementar headers corretos
- [ ] Adicionar API key se necessário
- [ ] Implementar rate limiting/cache

### 2. 🔴 URGENTE: Corrigir StatusInvest (Timeout)
- [ ] Verificar credenciais Google OAuth
- [ ] Testar fluxo de login manualmente
- [ ] Atualizar seletores se necessário
- [ ] Aumentar timeout para 60s
- [ ] Implementar retry logic
- [ ] Adicionar stealth mode no Playwright

### 3. 🟡 MÉDIO: Melhorar Resiliência
- [ ] Implementar fallback quando <3 fontes
- [ ] Adicionar logs detalhados de cada scraper
- [ ] Implementar circuit breaker
- [ ] Adicionar alertas quando scraper falha
- [ ] Criar dashboard de saúde dos scrapers

### 4. 🟢 BAIXO: Adicionar Fontes Backup
- [ ] Implementar scrapers adicionais (Fundamentei, Investsite)
- [ ] Garantir mínimo de 4-5 fontes funcionais
- [ ] Diversificar fontes de dados

---

## 📝 Logs Completos (Referência)

```log
[2025-11-13 01:12:10] [AnalysisService] Generating complete analysis for WEGE3
[2025-11-13 01:12:10] [ScrapersService] Scraping fundamental data for WEGE3 from multiple sources
[2025-11-13 01:12:10] [FundamentusScraper] Scraping WEGE3 from fundamentus
[2025-11-13 01:12:10] [BrapiScraper] Scraping WEGE3 from BRAPI
[2025-11-13 01:12:11] [StatusInvestScraper] Scraping WEGE3 from statusinvest
[2025-11-13 01:12:11] [Investidor10Scraper] Scraping WEGE3 from investidor10
[2025-11-13 01:12:11] [ERROR] [BrapiScraper] Failed to scrape WEGE3 from BRAPI: Request failed with status code 403
[2025-11-13 01:12:20] [FundamentusScraper] Successfully scraped WEGE3 from fundamentus in 9575ms
[2025-11-13 01:12:25] [Investidor10Scraper] Successfully scraped WEGE3 from investidor10 in 14926ms
[2025-11-13 01:12:45] [ERROR] [StatusInvestScraper] Failed to scrape WEGE3 from statusinvest: Navigation timeout of 30000 ms exceeded
[2025-11-13 01:12:45] [WARN] [ScrapersService] Only 2 sources available for WEGE3, minimum required: 3
[2025-11-13 01:12:45] [AnalysisService] Complete analysis finished for WEGE3: sell
```

---

## ✅ Validações Positivas

Apesar dos problemas, o sistema:
- ✅ Executa todos os 4 scrapers em paralelo (Promise.allSettled)
- ✅ Não trava quando scrapers falham
- ✅ Loga erros adequadamente
- ✅ Gera análise mesmo com fontes parciais (graceful degradation)
- ✅ Calcula confiança baseado em fontes disponíveis
- ✅ Emite warning quando <3 fontes

---

## 🔧 Arquivos Envolvidos

1. **Orchestrator:**
   - `backend/src/scrapers/scrapers.service.ts:38-62`

2. **Scrapers:**
   - `backend/src/scrapers/fundamental/fundamentus.scraper.ts` ✅
   - `backend/src/scrapers/fundamental/brapi.scraper.ts` ❌
   - `backend/src/scrapers/fundamental/statusinvest.scraper.ts` ❌
   - `backend/src/scrapers/fundamental/investidor10.scraper.ts` ✅

3. **Analysis Service:**
   - `backend/src/api/analysis/analysis.service.ts:20-62`

---

**Conclusão:** Sistema funciona com 2 fontes mas está abaixo do mínimo recomendado (3). Necessário corrigir BRAPI e StatusInvest URGENTEMENTE para atingir cross-validation completa.
