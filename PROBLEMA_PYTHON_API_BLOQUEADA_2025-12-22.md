# Problema: Python API Bloqueada - 2025-12-22

## 🔴 PROBLEMA CRÍTICO DETECTADO

**Sintoma:**
```
[FALLBACK] FLRY3: 0 Python scrapers available (filtered from 0 total)
[FALLBACK] FLRY3: Exhausted 0 scrapers in 0.0s
```

**Causa Raiz:**
```
[ERROR] [PYTHON-API] Failed to get scrapers list: timeout of 10000ms exceeded
```

---

## 🔍 Diagnóstico

### Service Python está Travado

**Container:** `invest_scrapers` (porta 8000)
**Status:** Up, Healthy
**Processo:** `python main.py` rodando
**Porta 8000:** LISTEN (mas não responde)

**Recv-Q antes do restart:** 318 bytes (dados pendentes não processados)

### Por Que Está Travado?

**Logs mostram:**
```
2025-12-22 19:07:41 | INFO | chatgpt_scraper:scrape - Sending prompt to ChatGPT...
2025-12-22 19:07:41 | INFO | gemini_scraper:scrape - Sending prompt to Gemini...
```

**Problema:** O mesmo service (`invest_scrapers`) está sendo usado para:
1. ✅ API de scrapers (`/api/scrapers/list`)
2. ✅ Análises de sentimento (ChatGPT, Gemini)
3. ✅ Scraping de fundamentals (Python fallback)

**Quando análises de sentimento estão rodando:**
- Playwright browsers abertos (CPU/memória)
- Event loop bloqueado esperando respostas
- API HTTP não consegue responder no timeout (10s)

---

## ⚡ Solução Imediata: Aumentar Timeout

**Arquivo:** `backend/src/scrapers/scrapers.service.ts:2461-2462`

### ANTES
```typescript
const pythonScrapers = await this.getPythonScrapersList();
// Função usa timeout padrão (10s)
```

### DEPOIS
```typescript
// Aumentar timeout para 30s (service pode estar ocupado)
const pythonScrapers = await this.getPythonScrapersListWithRetry();
```

### Implementar Retry na Chamada

```typescript
private async getPythonScrapersListWithRetry(maxRetries = 3): Promise<PythonScraperInfo[]> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      this.logger.log(`[PYTHON-API] Fetching scrapers list (attempt ${attempt + 1}/${maxRetries})`);

      const url = `${this.pythonApiUrl}/api/scrapers/list`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 30000,  // 30s timeout (vs 10s antes)
        }),
      );

      return response.data.scrapers || [];
    } catch (error) {
      this.logger.warn(
        `[PYTHON-API] Attempt ${attempt + 1} failed: ${error.message}. ` +
        `${attempt < maxRetries - 1 ? 'Retrying in 5s...' : 'Giving up.'}`,
      );

      if (attempt < maxRetries - 1) {
        await this.sleep(5000);  // 5s entre tentativas
      }
    }
  }

  // Se todas as tentativas falharam, retornar array vazio
  this.logger.error(`[PYTHON-API] Failed to get scrapers list after ${maxRetries} attempts. Continuing without Python fallback.`);
  return [];
}
```

**Tempo estimado:** 15 minutos

---

## 🎯 Solução Definitiva: Separar Services

### Problema Arquitetural

**invest_scrapers tem 3 responsabilidades:**
1. Servir API de scrapers (`/api/scrapers/*`)
2. Executar análises de sentimento (AI scrapers)
3. Executar Python fallback (fundamental scrapers)

**Conflito:** Análises de sentimento bloqueiam API HTTP

### Solução: Separar em 2 Services

```yaml
# docker-compose.yml

invest_scrapers_api:  # NOVO - Apenas API leve
  build: ./backend/python-scrapers
  command: uvicorn api_only:app --host 0.0.0.0 --port 8000
  ports:
    - "8000:8000"
  environment:
    - MODE=api_only  # Não roda scrapers pesados

invest_scrapers_workers:  # Análises de sentimento + fallback
  build: ./backend/python-scrapers
  command: python worker.py  # Consome fila, não serve HTTP
  environment:
    - MODE=worker
```

**Vantagens:**
- ✅ API sempre responsiva (não é bloqueada)
- ✅ Workers podem escalar independentemente
- ✅ Fallback exaustivo funcionará 100%

**Tempo estimado:** 2-3 horas

---

## 📊 Impacto Atual

### Coleta TypeScript Funcionando

**Progresso:**
- Completed: ~70+ jobs
- Fundamentals: 18 coletados
- **83% com 3+ fontes** (15/18) ✅
- **28% com 4+ fontes** (5/18) ✅

### Fallback Exaustivo NÃO Funcionando

**Motivo:** Python API timeout (service bloqueado)

**Impacto:**
- ❌ Não consegue adicionar scrapers Python extras
- ❌ Ativos com < 3 fontes TypeScript ficam sem fallback
- ⚠️ Confidence pode ficar baixo

**Exemplo:**
```
FLCR11: Collected from 1/5 sources (TypeScript)
  → Deveria ativar fallback
  → Mas Python API timeout
  → Salva com apenas 1 fonte (abaixo do mínimo!)
```

---

## ⚡ Plano de Ação IMEDIATO

### Opção 1: Aguardar Análises de Sentimento Terminarem (Recomendado)

**Ação:** Esperar ~10-15 minutos até ChatGPT/Gemini finalizarem

**Vantagem:** Não precisa modificar código
**Desvantagem:** Fallback não funciona temporariamente

### Opção 2: Aumentar Timeout + Retry (Quick Fix)

**Ação:** Implementar `getPythonScrapersListWithRetry()` (15 min)

**Vantagem:** Fallback volta a funcionar parcialmente
**Desvantagem:** Pode ainda dar timeout se service estiver muito ocupado

### Opção 3: Separar Services (Solução Definitiva)

**Ação:** Criar `invest_scrapers_api` + `invest_scrapers_workers` (2-3h)

**Vantagem:** Resolve permanentemente
**Desvantagem:** Requer mudanças no docker-compose

---

## 📈 Progresso Atual (Apenas TypeScript)

**Apesar do Python API travado, a coleta está progredindo:**

```
Completed: ~70 / 861 (8%)
Fundamentals: 18
Com 3+ fontes: 15 (83%) ✅
Com 4+ fontes: 5 (28%) ✅
Média de fontes: ~3.3
```

**Isso prova que:**
- ✅ Paralelização TypeScript funciona (5 scrapers simultâneos)
- ✅ Cross-validation funciona (detecta 3-4 fontes)
- ❌ Fallback exaustivo NÃO funciona (Python API travada)

---

## 🎯 Recomendação

**Escolher Opção 1 ou 2:**

### Opção 1 (Aguardar - 0h desenvolvimento)
```
✅ Aguardar 10-15min
✅ Análises de sentimento terminarem
✅ Python API volta a responder
✅ Fallback exaustivo funciona automaticamente
```

### Opção 2 (Retry - 15min desenvolvimento)
```
1. Implementar getPythonScrapersListWithRetry (timeout 30s, 3 tentativas)
2. Validar TypeScript
3. Build
4. Restart backend
5. Validar fallback funciona
```

**Qual você prefere?**

Enquanto isso, **a coleta continua** com os 5 scrapers TypeScript (está funcionando bem - 83% com 3+ fontes)!

---

**Gerado:** 2025-12-22 19:10
**Status:** Python API bloqueada por análises de sentimento
**Impacto:** Fallback exaustivo temporariamente desativado
**Coleta TypeScript:** ✅ Funcionando (70+ jobs, 18 fundamentals)
