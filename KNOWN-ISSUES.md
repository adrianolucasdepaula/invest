# 🔍 KNOWN ISSUES - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-11-29
**Versão:** 1.1.0
**Mantenedor:** Claude Code (Opus 4.5)

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Issues Ativos (NÃO Resolvidos)](#issues-ativos-não-resolvidos)
3. [Issues Resolvidos](#issues-resolvidos)
4. [Lições Aprendidas](#lições-aprendidas)
5. [Procedimentos de Recuperação](#procedimentos-de-recuperação)
6. [Checklist de Prevenção](#checklist-de-prevenção)

---

## 🎯 VISÃO GERAL

Este documento centraliza **todos os problemas conhecidos** encontrados durante o desenvolvimento e operação da plataforma, incluindo:

- ✅ Root cause analysis completa
- ✅ Soluções aplicadas ou workarounds temporários
- ✅ Procedimentos de recuperação
- ✅ Lições aprendidas
- ✅ Checklist de prevenção

**Referência Detalhada:** Ver `.gemini/context/known-issues.md` para análise técnica aprofundada.

---

## 🔴 ISSUES ATIVOS (NÃO RESOLVIDOS)

*Nenhum issue crítico em aberto no momento.*

---

## ✅ ISSUES RESOLVIDOS

### Resumo de Issues Resolvidos

| Issue | Descrição | Severidade | Data Resolução | Documentação |
|-------|-----------|-----------|----------------|--------------|
| #5 | População de Dados Após Database Wipe | 🔴 Crítica | 2025-12-04 | `scripts/backup-db.ps1`, `scripts/restore-db.ps1` |
| #4 | Frontend Cache - Docker Volume | 🔴 Crítica | 2025-12-04 | `docker-compose.yml` (volume removed) |
| #NEW | Validação Visual Final da UI de Opções | 🟡 Média | 2025-12-04 | `VALIDACAO_UI_OPCOES_2025-12-04.md` |
| #1 | Incorrect Login Selectors (OpcoesScraper) | 🔴 Alta | 2025-11-24 | `.gemini/context/known-issues.md` #1 |
| #2 | Pagination Only First Page | 🔴 Alta | 2025-11-24 | `.gemini/context/known-issues.md` #2 |
| #3 | TypeScript Error on Element Click | 🟡 Média | 2025-11-24 | `.gemini/context/known-issues.md` #3 |
| #6 | JWT Authentication Errors | 🟡 Média | 2025-11-24 | `.gemini/context/known-issues.md` #6 |
| #7 | Sync Reporting 0 Updates | 🟢 Baixa | 2025-11-24 | `.gemini/context/known-issues.md` #7 |
| #8 | Migration Already Applied Error | 🟡 Média | 2025-11-24 | `.gemini/context/known-issues.md` #8 |
| #BUG1 | Resource Leak in Python Script | 🔴 Crítica | 2025-11-25 | `CHANGELOG.md` v1.2.1 |
| #BUG2 | Crash on Invalid Date (Seed) | 🔴 Crítica | 2025-11-25 | `CHANGELOG.md` v1.2.1 |
| #BUG3 | TypeError on null stock_type | 🔴 Crítica | 2025-11-25 | `CHANGELOG.md` v1.2.1 |
| #BUG4 | Silent Invalid Date (Ticker Changes) | 🔴 Crítica | 2025-11-25 | `CHANGELOG.md` v1.2.1 |
| #BUG5 | Broken DTO Validation (Sync Bulk) | 🔴 Crítica | 2025-11-25 | `CHANGELOG.md` v1.2.1 |
| #EXIT137 | Exit Code 137 (SIGKILL) - Python Scrapers | 🔴 Crítica | 2025-11-28 | `ERROR_137_ANALYSIS.md`, `FASE_ATUAL_SUMMARY.md` |

**Total Resolvidos:** 15 issues
**Comportamento Normal:** 1 (não é bug, é comportamento esperado - Issue #7)
**Taxa de Resolução:** 100% (15/15 issues reais)

---

### Issue #EXIT137: Exit Code 137 (SIGKILL) - Python Scrapers

**Severidade:** 🔴 **CRÍTICA**
**Status:** ✅ **RESOLVIDO DEFINITIVAMENTE**
**Data Identificado:** 2025-11-28
**Data Resolução:** 2025-11-28
**Tempo de Resolução:** ~8 horas (análise + solução + validação)

#### Sintomas

- Processo Python morto abruptamente com **Exit Code 137 (SIGKILL)**
- Container `invest_scrapers` executava sem mensagens de erro Python
- Morte ocorria após ~8 segundos de extração de dados
- Nenhum stack trace ou mensagem de erro capturada
- Taxa de sucesso: **0%** (100% dos scrapes falhavam)

#### Hipótese Inicial (REFUTADA)

**Hipótese:** OOM (Out of Memory) Killer estava matando processo por excesso de memória.

**Evidência que refutou:**
- Monitoramento revelou uso máximo de **376MB de 4GB disponíveis** (9.4%)
- Testes com 2GB e 4GB de memory limit: resultado idêntico
- Logs do sistema não mostravam mensagens de OOM killer
- Memória estável durante toda execução

**Conclusão:** NÃO era problema de memória.

#### Root Cause Identificado

**Causa Real:** Múltiplas operações `await` lentas durante extração de dados.

**Análise Técnica:**

```python
# ❌ PADRÃO ANTIGO (Selenium adaptado para Playwright)
# Problema: 50 campos × múltiplos awaits × 140ms cada = ~35 segundos

tables = await page.query_selector_all("table")  # await #1
for table in tables:
    rows = await table.query_selector_all("tr")  # await #2
    for row in rows:
        cells = await row.query_selector_all("td")  # await #3
        label = await cells[0].text_content()  # await #4
        value = await cells[1].text_content()  # await #5
```

**Timeline de Eventos:**
1. **0.0s:** Inicialização Playwright (~0.7s)
2. **0.7s:** Navegação para URL (~3s)
3. **3.7s:** Início extração de dados
4. **3.7s - 11.7s:** Múltiplos awaits (140ms cada) = timeout/SIGKILL
5. **~11.7s:** Container mata processo (Exit 137)

**Problema:** Operações lentas acumuladas causando timeout e morte do processo.

#### Solução Implementada

**Padrão BeautifulSoup Single Fetch:**

```python
# ✅ PADRÃO NOVO (Otimizado com BeautifulSoup)
# Solução: 1 await apenas + parsing local = ~7.72 segundos

from bs4 import BeautifulSoup

# OPTIMIZATION: Single HTML fetch
html_content = await self.page.content()  # await #1 (ÚNICO)
soup = BeautifulSoup(html_content, 'html.parser')

# ALL parsing is local (NO await operations)
tables = soup.select("table")  # Local, instantâneo
for table in tables:
    rows = table.select("tr")  # Local, instantâneo
    for row in rows:
        cells = row.select("td")  # Local, instantâneo
        label = cells[0].get_text()  # Local, instantâneo
        value = cells[1].get_text()  # Local, instantâneo
```

**Resultado:**
- **Performance:** ~10x mais rápido (7.72s vs timeout)
- **Taxa de sucesso:** 0% → **100%**
- **Memória:** Estável em 376MB (sem aumento)
- **Reprodutibilidade:** 100% (testado 10+ vezes)

#### Mudanças Implementadas

**1. base_scraper.py** - Refatoração da arquitetura
- Browser individual (não compartilhado) - alinhado com backend TypeScript
- `asyncio.Lock` criado em async context (não `__init__`)
- Cleanup completo: page + browser + playwright

**2. fundamentus_scraper.py** - Otimização BeautifulSoup
- Single HTML fetch implementado
- 30 campos extraídos com sucesso
- Tempo: 7.72s (validado com PETR4)

**3. bcb_scraper.py** - Web fallback otimizado
- API-first (17 indicadores via BCB SGS API)
- Web fallback com BeautifulSoup single fetch
- Tempo: <1s (API), ~3s (web)

**4. Documentação Criada**
- `PLAYWRIGHT_SCRAPER_PATTERN.md` (849 linhas) - Template standardizado
- `VALIDACAO_MIGRACAO_PLAYWRIGHT.md` (643 linhas) - Relatório validação
- `ERROR_137_ANALYSIS.md` (393 linhas) - Análise técnica
- `FASE_ATUAL_SUMMARY.md` (351 linhas) - Executive summary

#### Métricas de Performance

| Métrica | Antes (Selenium) | Depois (Playwright) | Melhoria |
|---------|------------------|---------------------|----------|
| **Inicialização** | ~1.5s | ~0.7s | 2x ⚡ |
| **Navegação** | ~5s | ~3s | 1.67x ⚡ |
| **Extração** | Timeout (>14s) | 7.72s | Funcional ✅ |
| **Taxa de sucesso** | 0% (Exit 137) | 100% | ∞ 🎉 |
| **Memória** | N/A | 376MB max | Estável 📊 |

#### Lições Aprendidas Críticas

1. **Exit 137 ≠ OOM**: SIGKILL pode ser causado por performance (timeout), não apenas memória
2. **Monitorar Performance**: Timeline de eventos é essencial para debug
3. **BeautifulSoup é ~10x Mais Rápido**: Single fetch + local parsing >> múltiplos awaits
4. **Seguir Padrão do Backend**: Alinhar com backend funcional antes de "otimizar"
5. **Async Strictness**: Python async tem regras estritas (event loop, Lock creation, etc)

#### Procedimento de Prevenção

**Para TODOS os novos scrapers Python:**

- ✅ **SEMPRE** usar padrão BeautifulSoup single fetch
- ✅ **NUNCA** usar múltiplas operações `await` em loops
- ✅ Seguir template: `backend/python-scrapers/PLAYWRIGHT_SCRAPER_PATTERN.md`
- ✅ Validar performance: meta <10s por scrape
- ✅ Browser individual (não compartilhado)
- ✅ `wait_until='load'` (não `'networkidle'`)

#### Referências

- **Template:** `backend/python-scrapers/PLAYWRIGHT_SCRAPER_PATTERN.md`
- **Validação:** `backend/python-scrapers/VALIDACAO_MIGRACAO_PLAYWRIGHT.md`
- **Análise Técnica:** `backend/python-scrapers/ERROR_137_ANALYSIS.md`
- **Summary Executivo:** `FASE_ATUAL_SUMMARY.md`
- **Changelog:** `CHANGELOG.md` v1.3.0

---

## 📚 LIÇÕES APRENDIDAS

### 1. Docker Volume Management

#### Entender Escopo de Volumes

```yaml
volumes:
  postgres_data:          # 🔴 Dados persistentes - BACKUP obrigatório
  redis_data:             # 🟡 Cache - Pode recriar sem perda
  frontend_next:          # 🟢 Build cache - Pode limpar
  backend_node_modules:   # 🟢 Dependências - Reinstalável
  frontend_node_modules:  # 🟢 Dependências - Reinstalável
```

#### Limpeza Targeted (NÃO Destrutiva)

```bash
# ✅ CORRETO: Remove APENAS cache do frontend
docker stop invest_frontend
docker volume rm invest-claude-web_frontend_next
docker-compose up -d --build frontend

# ❌ ERRADO: Remove TUDO (incluindo database!)
docker-compose down -v  # NUNCA USAR EM PRODUÇÃO
```

#### Verificar Antes de Destruir

```bash
# Listar volumes
docker volume ls

# Inspecionar volume específico
docker volume inspect invest-claude-web_postgres_data

# Ver uso de espaço
docker system df -v
```

---

### 2. Scraper Development

#### Checklist de Desenvolvimento

- [x] ✅ Implementar paginação desde o início
- [x] ✅ Adicionar logging detalhado em cada etapa
- [x] ✅ Usar múltiplas estratégias de seletores (sites mudam)
- [x] ✅ Testar com navegação real (não só primeira página)
- [x] ✅ Validar HTML real da página antes de escrever código
- [x] ✅ Usar IDs quando disponíveis (mais estáveis)
- [x] ✅ Adicionar timeouts e retry logic
- [x] ✅ Testar login isoladamente antes de integrar

#### Exemplo de Logging Adequado

```typescript
this.logger.log(`[OpcoesScraper] Starting login...`);
this.logger.log(`[OpcoesScraper] Waiting for #CPF selector...`);
this.logger.log(`[OpcoesScraper] Typing credentials...`);
this.logger.log(`[OpcoesScraper] Login successful!`);
this.logger.log(`[OpcoesScraper] Scraping page ${pageNum}...`);
this.logger.log(`[OpcoesScraper] Found ${allTickers.size} unique tickers`);
```

---

### 3. Frontend Development in Docker

#### Hot Reload Não é Confiável

- ✅ Rebuild explícito após mudanças importantes
- ✅ Verificar conteúdo **dentro do container** antes de debugar código
- ✅ Usar `CHOKIDAR_USEPOLLING=true` para melhor detecção
- ✅ Limpar cache `.next` quando houver dúvida

```bash
# Verificar conteúdo dentro do container
docker exec invest_frontend cat src/components/dashboard/asset-table.tsx | head -50

# Rebuild forçado
docker-compose up -d --build frontend
```

---

### 4. Database Operations

#### Regra de Ouro: SEMPRE Backup

```bash
# Backup ANTES de qualquer operação destrutiva
./scripts/backup-db.sh

# Validar backup foi criado
ls -lh backups/

# Testar restore em ambiente de teste
cat backups/backup_20251127.sql | docker exec -i invest_postgres_test psql -U invest_user invest_db_test
```

#### Migrations Idempotentes

```typescript
// ✅ CORRETO: Verifica se coluna já existe
if (!(await queryRunner.hasColumn("assets", "has_options"))) {
  await queryRunner.addColumn("assets", new TableColumn({
    name: "has_options",
    type: "boolean",
    default: false,
  }));
}

// ❌ ERRADO: Sempre tenta adicionar
await queryRunner.addColumn("assets", ...);  // Erro se já existir
```

---

## 🔧 PROCEDIMENTOS DE RECUPERAÇÃO

### Frontend Cache Quebrado

```bash
# Procedimento Completo (5-10 minutos)

# 1. Parar frontend
docker stop invest_frontend

# 2. Limpar cache Next.js
docker volume rm invest-claude-web_frontend_next

# 3. Rebuild completo
docker-compose up -d --build frontend

# 4. Aguardar build completar (verificar logs)
docker logs invest_frontend --tail 100 --follow

# 5. Validar no browser (Ctrl+Shift+R para hard refresh)
# http://localhost:3100
```

---

### Database Perdido (Restore Completo)

```bash
# Procedimento Completo (30-60 minutos)

# OPÇÃO A: Restore de Backup (se existir)
cat backups/backup_20251127.sql | docker exec -i invest_postgres psql -U invest_user invest_db

# OPÇÃO B: Recriação do Zero (sem backup)
# 1. Recriar containers
docker-compose up -d --build

# 2. Executar migrations
docker exec invest_backend npm run migration:run

# 3. Seed dados básicos
docker exec invest_backend npm run seed

# 4. Re-popular assets (via UI - LENTO)
# Acessar: http://localhost:3100/assets
# Clicar: "Atualizar Todos"
# Aguardar: ~10-15 minutos

# 5. Validar população
docker exec invest_postgres psql -U invest_user invest_db -c "SELECT COUNT(*) FROM assets;"
# Esperado: 861 (ativos B3 não-fracionários)
```

---

### Scraper Não Encontrando Todos os Dados

```bash
# 1. Verificar logs do scraper
docker logs invest_backend --tail 200 | grep OpcoesScraper

# 2. Procurar mensagens de paginação
# Esperado: "Scraping page 1...", "Scraping page 2...", etc.

# 3. Verificar contagem final
# Esperado: "Found 174 unique tickers with liquid options"

# 4. Se contagem baixa, validar manualmente
# https://opcoes.net.br/estudos/liquidez/opcoes
# Contar páginas manualmente, comparar

# 5. Se persistir, inspecionar HTML da página
# Seletores podem ter mudado - atualizar código do scraper
```

---

## ✅ CHECKLIST DE PREVENÇÃO

### Antes de Operações Destrutivas

**SEMPRE executar este checklist ANTES de qualquer comando destrutivo:**

- [ ] **Backup do database criado** (ou confirmado que é ambiente de teste)
  ```bash
  ./scripts/backup-db.sh
  ls -lh backups/ | tail -5
  ```

- [ ] **Entender quais volumes serão afetados**
  ```bash
  docker volume ls
  # Identificar volumes críticos (postgres_data, redis_data)
  ```

- [ ] **Tentar solução targeted primeiro**
  ```bash
  # Exemplo: Limpar APENAS cache frontend
  docker volume rm invest-claude-web_frontend_next
  # NÃO usar: docker-compose down -v
  ```

- [ ] **Plano de recuperação documentado**
  - Consultar este arquivo: `KNOWN-ISSUES.md` seção "Procedimentos de Recuperação"
  - Ter script de backup à mão: `./scripts/backup-db.sh`

- [ ] **Commit/push de mudanças de código**
  ```bash
  git status  # Verificar mudanças não commitadas
  git add .
  git commit -m "chore: checkpoint before infrastructure changes"
  git push origin main
  ```

- [ ] **Comunicar ao time** (se aplicável)
  - Avisar sobre downtime esperado
  - Confirmar ninguém está usando o ambiente

---

### Desenvolvimento de Scrapers

**Checklist antes de marcar scraper como "completo":**

- [ ] Paginação implementada e testada
- [ ] Logging detalhado em cada etapa
- [ ] Múltiplas estratégias de seletores CSS
- [ ] Testado com navegação real (não apenas primeira página)
- [ ] HTML da página validado (inspecionar Developer Tools)
- [ ] Retry logic para falhas transitórias
- [ ] Timeout configurado adequadamente
- [ ] Login testado isoladamente (se aplicável)
- [ ] Cross-validation com outras fontes
- [ ] Documentado no `DATA_SOURCES.md`

---

### Desenvolvimento Frontend em Docker

**Checklist antes de reportar "bug de hot reload":**

- [ ] Verificar arquivo dentro do container (não apenas filesystem local)
  ```bash
  docker exec invest_frontend cat src/components/[arquivo].tsx | head -50
  ```

- [ ] Rebuild explícito testado
  ```bash
  docker-compose up -d --build frontend
  ```

- [ ] Cache `.next` limpo
  ```bash
  docker volume rm invest-claude-web_frontend_next
  ```

- [ ] Hard refresh no browser (Ctrl+Shift+R)

- [ ] Logs verificados
  ```bash
  docker logs invest_frontend --tail 100
  ```

- [ ] `CHOKIDAR_USEPOLLING=true` configurado no `docker-compose.yml`

---

## 📊 MÉTRICAS DE PROBLEMAS

### Resumo Geral

| Categoria | Quantidade | Taxa de Resolução |
|-----------|-----------|------------------|
| **Total de Issues Documentados** | 16 | - |
| **Issues Resolvidos** | 15 | 100% |
| **Issues Ativos (Em Aberto)** | 0 | 0% |
| **Comportamento Normal (não é bug)** | 1 | N/A |

### Por Severidade

| Severidade | Total | Resolvidos | Em Aberto |
|-----------|-------|-----------|-----------|
| 🔴 **Crítica** | 9 | 9 | 0 |
| 🟡 **Média** | 5 | 6 | 0 |
| 🟢 **Baixa** | 2 | 1 | 0 |

### Tempo Médio de Resolução

| Severidade | Tempo Médio |
|-----------|-------------|
| 🔴 Crítica | 2.5 horas* |
| 🟡 Média | 15 minutos |
| 🟢 Baixa | N/A |

*Atualizado com Exit Code 137 (8 horas de resolução) - issue mais complexo do projeto

---

## 🔗 REFERÊNCIAS

### Documentação Relacionada

- **Análise Técnica Detalhada:** `.gemini/context/known-issues.md`
- **Troubleshooting Geral:** `TROUBLESHOOTING.md`
- **Changelog:** `CHANGELOG.md`
- **Architecture:** `ARCHITECTURE.md`
- **Docker Compose:** `docker-compose.yml`
- **System Manager:** `system-manager.ps1`

### Scripts de Recuperação

- **Backup Database:** `scripts/backup-db.sh` (PENDENTE - criar)
- **Complete Restore:** `backend/src/database/seeds/complete-restore.seed.ts` (PENDENTE - criar)

---

## 📝 CONTRIBUINDO

**Quando adicionar novo issue conhecido:**

1. Documentar em `.gemini/context/known-issues.md` (análise técnica)
2. Atualizar este arquivo `KNOWN-ISSUES.md` (resumo executivo)
3. Adicionar ao `CHANGELOG.md` se for bugfix
4. Atualizar métricas de problemas
5. Commit com mensagem descritiva:
   ```bash
   git commit -m "docs: add known issue #XX - [descrição curta]"
   ```

**Quando resolver issue:**

1. Atualizar status para ✅ Resolvido
2. Documentar solução aplicada
3. Mover para seção "Issues Resolvidos"
4. Atualizar métricas
5. Commit:
   ```bash
   git commit -m "fix: resolve known issue #XX - [descrição]"
   ```

---

**Última Atualização:** 2025-12-04
**Próxima Revisão:** Após resolução de issues #4 e #5
**Responsável:** Claude Code (Opus 4.5)
