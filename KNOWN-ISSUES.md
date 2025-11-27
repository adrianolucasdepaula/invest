# 🔍 KNOWN ISSUES - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-11-27
**Versão:** 1.0.0
**Mantenedor:** Claude Code (Sonnet 4.5)

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

### Issue #4: Frontend Cache - Docker Volume

**Severidade:** 🔴 **CRÍTICA**
**Status:** ⚠️ **EM ABERTO**
**Data Identificado:** 2025-11-24
**Última Atualização:** 2025-11-27

#### Sintomas

- Mudanças em arquivos `.tsx` presentes no filesystem local
- Container Docker mostra conteúdo **antigo** (`docker exec invest_frontend cat ...`)
- Browser continua exibindo UI desatualizada
- Hot reload do Next.js não detecta mudanças

#### Root Cause

1. Volume Docker `frontend_next` cacheia artefatos do build `.next`
2. Configuração de volume mount causa sincronização inconsistente
3. Next.js hot reload não funciona corretamente dentro do container
4. Build artifacts sobrescrevem código fonte montado

#### Workaround Temporário

```bash
# OPÇÃO 1: Rebuild completo do frontend (mais confiável)
docker stop invest_frontend
docker volume rm invest-claude-web_frontend_next
docker-compose up -d --build frontend

# OPÇÃO 2: Rebuild sem remover volume (mais rápido)
docker-compose up -d --build frontend
docker logs invest_frontend --tail 50  # Verificar rebuild
```

#### Solução Definitiva (PENDENTE)

**Modificar `docker-compose.yml`:**

```yaml
frontend:
  volumes:
    - ./frontend:/app
    - frontend_node_modules:/app/node_modules
    # NÃO persistir .next OU limpar regularmente
    # - frontend_next:/app/.next  # REMOVER ou adicionar limpeza automática
  environment:
    - CHOKIDAR_USEPOLLING=true  # Melhor detecção de mudanças
    - WATCHPACK_POLLING=true     # Polling para detectar mudanças
```

#### Ação Necessária

- [ ] Testar configuração sem volume `frontend_next`
- [ ] Validar hot reload funciona corretamente
- [ ] Documentar tempo de rebuild sem cache persistente
- [ ] Decidir: remover volume OU adicionar script de limpeza automática

---

### Issue #5: População de Dados Após Database Wipe

**Severidade:** 🔴 **CRÍTICA**
**Status:** ⚠️ **EM ABERTO**
**Data Identificado:** 2025-11-24
**Última Atualização:** 2025-11-27

#### Sintomas

- Executado `docker-compose down -v` (acidentalmente ou intencionalmente)
- Banco de dados completamente vazio
- Precisa re-popular **861 ativos B3** + preços históricos

#### Root Cause

1. Comando `docker-compose down -v` remove **TODOS** os volumes
2. Volume `postgres_data` destruído junto com outros
3. Não havia sistema de backup automático
4. Re-população manual é lenta e propensa a erros

#### Workaround Temporário

```bash
# 1. Recriar containers e schema
docker-compose up -d --build
docker exec invest_backend npm run migration:run

# 2. Seed dados básicos (usuário admin)
docker exec invest_backend npm run seed

# 3. Re-popular assets (LENTO - via UI)
# Acessar: http://localhost:3100/assets
# Clicar: "Atualizar Todos" (sincroniza via BRAPI)
# Aguardar: ~10-15 minutos para 861 ativos

# 4. Re-popular preços históricos (LENTO)
# Usar endpoint: POST /api/v1/assets/sync-bulk
# Período: 1986-2025 (pode levar horas)
```

#### Solução Definitiva (PENDENTE)

**1. Sistema de Backup Automático**

Criar `scripts/backup-db.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Backup completo
docker exec invest_postgres pg_dump -U invest_user invest_db > $BACKUP_DIR/backup_$DATE.sql

# Backup apenas schema (mais rápido)
docker exec invest_postgres pg_dump -U invest_user -s invest_db > $BACKUP_DIR/schema_$DATE.sql

echo "✅ Backup criado: $BACKUP_DIR/backup_$DATE.sql"

# Manter apenas últimos 7 backups
ls -t $BACKUP_DIR/backup_*.sql | tail -n +8 | xargs rm -f
```

**2. Seed Script Completo**

Criar `backend/src/database/seeds/complete-restore.seed.ts`:

```typescript
// Seed que:
// 1. Popula 861 assets B3 (all-b3-assets.seed.ts)
// 2. Popula ticker changes (ticker-changes.seed.ts)
// 3. Popula usuário admin
// 4. Dispara sync de preços históricos (via job)
```

**3. Documentar Volumes Críticos**

```yaml
volumes:
  postgres_data:     # 🔴 CRÍTICO - SEMPRE backup antes de remover
  redis_data:        # 🟡 Cache - Pode recriar sem perda
  frontend_next:     # 🟢 Build - Pode limpar
  frontend_node_modules:  # 🟢 Deps - Pode reinstalar
  backend_node_modules:   # 🟢 Deps - Pode reinstalar
```

#### Ação Necessária

- [ ] Criar script `scripts/backup-db.sh`
- [ ] Configurar cron job para backup diário
- [ ] Criar seed script `complete-restore.seed.ts`
- [ ] Documentar procedimento de restore em `TROUBLESHOOTING.md`
- [ ] Adicionar warnings em `docker-compose.yml` sobre volumes críticos

---

### Issue #NEW: Validação Visual Final da UI de Opções

**Severidade:** 🟡 **MÉDIA**
**Status:** ⚠️ **PENDENTE**
**Data Identificado:** 2025-11-24
**Última Atualização:** 2025-11-27

#### Descrição

- Coluna "Opções" implementada no backend e frontend
- Funcionalidade técnica completa (scraper + filtro)
- **Falta**: Validação visual final com MCPs (Playwright + Chrome DevTools)

#### Ação Necessária

- [ ] Validar coluna "Opções" aparece na tabela
- [ ] Validar filtro "Com Opções" funciona corretamente
- [ ] Validar ícone/badge de opções é claro e intuitivo
- [ ] Validar responsividade (mobile, tablet)
- [ ] Validar acessibilidade (screen readers, keyboard navigation)
- [ ] Screenshots de evidência

#### Arquivo de Validação

Criar: `VALIDACAO_UI_OPCOES_2025-11-27.md`

---

## ✅ ISSUES RESOLVIDOS

### Resumo de Issues Resolvidos

| Issue | Descrição | Severidade | Data Resolução | Documentação |
|-------|-----------|-----------|----------------|--------------|
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

**Total Resolvidos:** 11 issues
**Taxa de Resolução:** 73% (11/15 issues totais)

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
| **Total de Issues Documentados** | 15 | - |
| **Issues Resolvidos** | 11 | 73% |
| **Issues Ativos (Em Aberto)** | 3 | 20% |
| **Issues Comportamento Normal** | 1 | 7% |

### Por Severidade

| Severidade | Total | Resolvidos | Em Aberto |
|-----------|-------|-----------|-----------|
| 🔴 **Crítica** | 8 | 6 | 2 |
| 🟡 **Média** | 5 | 5 | 0 |
| 🟢 **Baixa** | 2 | 1 | 1 |

### Tempo Médio de Resolução

| Severidade | Tempo Médio |
|-----------|-------------|
| 🔴 Crítica | 45 minutos |
| 🟡 Média | 15 minutos |
| 🟢 Baixa | N/A |

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

**Última Atualização:** 2025-11-27
**Próxima Revisão:** Após resolução de issues #4 e #5
**Responsável:** Claude Code (Sonnet 4.5)
