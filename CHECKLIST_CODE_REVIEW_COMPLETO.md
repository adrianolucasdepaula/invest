# ✅ CHECKLIST CODE REVIEW ULTRA-ROBUSTO

**Projeto:** B3 AI Analysis Platform
**Data:** 2025-11-22
**Fase Atual:** FASE 40 (Concluída) → Transição para FASE 41
**Metodologia:** Ultra-Thinking + TodoWrite + Validação Tripla MCP

---

## 🎯 OBJETIVO

**Garantir 100% de qualidade, zero gaps, zero bugs, zero warnings antes de prosseguir para a próxima fase.**

**Princípios:**
- ✅ Não mentir sobre status de validações
- ✅ Não ter pressa (qualidade > velocidade)
- ✅ Sempre garantir para não quebrar nada
- ✅ Verificar dependências e integrações ANTES de qualquer mudança
- ✅ Git sempre atualizado
- ✅ Branch sempre atualizada e mergeada
- ✅ Respeitar arquitetura definida na documentação
- ✅ Documentação sempre atualizada
- ✅ Usar dados reais (não mocks)
- ✅ Corrigir problemas crônicos em definitivo (não workarounds)
- ✅ Dados financeiros: **0 tolerância** para imprecisão, inconsistência, manipulação

---

## 📋 CHECKLIST PRÉ-IMPLEMENTAÇÃO

### 1. Análise de Arquivos Reais (NÃO confiar apenas em docs)

- [ ] **Ler TODOS os arquivos relacionados** (não apenas documentação)
  ```powershell
  # Exemplo: Analisar implementação real de sync
  Read-File backend/src/api/market-data/market-data.service.ts
  Read-File backend/python-service/app/services/cotahist_service.py
  Read-File frontend/src/app/data-management/page.tsx
  ```

- [ ] **Comparar documentação vs código real**
  - Documentação pode estar desatualizada ⚠️
  - Código é a verdade absoluta
  - Se divergir: atualizar documentação

- [ ] **Identificar dependências e integrações**
  ```powershell
  # Backend
  Grep "import.*from" backend/src/api/market-data/market-data.service.ts

  # Frontend
  Grep "import.*from" frontend/src/app/data-management/page.tsx
  ```

### 2. Verificação de Arquitetura

- [ ] **Consultar ARCHITECTURE.md** para validar se mudança respeita arquitetura
- [ ] **Verificar se funcionalidade já existe** (não duplicar código)
- [ ] **Analisar padrões existentes** (manter consistência)
- [ ] **Validar se mudança quebra integração** (frontend ↔ backend ↔ Python Service)

### 3. Melhores Práticas do Mercado (2025)

- [ ] **Pesquisar best practices atuais** (WebSearch MCP):
  ```
  "best practices [tecnologia] 2025"
  "production ready checklist [tecnologia]"
  "[problema] solution 2025 stack overflow"
  ```

- [ ] **Consultar documentação oficial** (Context7 MCP):
  ```typescript
  mcp__context7__resolve-library-id({ libraryName: "nestjs" })
  mcp__context7__get-library-docs({
    context7CompatibleLibraryID: "/nestjs/docs",
    topic: "best practices production"
  })
  ```

- [ ] **Analisar repositórios populares** (GitHub):
  - Stars > 10k (muito popular) ou > 1k (nicho específico)
  - Commits recentes (< 1 semana)
  - Issues respondidas (< 7 dias)
  - TypeScript support nativo

### 4. Planejamento com Ultra-Thinking

- [ ] **Criar TodoWrite com etapas atômicas** (não genéricas)
- [ ] **Documentar decisões técnicas**
- [ ] **Identificar riscos e mitigações**
- [ ] **Estimar impacto** (frontend + backend + database + integrações)

---

## 📋 CHECKLIST PÓS-IMPLEMENTAÇÃO

### 1. Validação de Código

#### Backend (NestJS + Python)

- [ ] **TypeScript: 0 erros**
  ```powershell
  cd backend && npx tsc --noEmit
  ```

- [ ] **Python lint: 0 erros**
  ```powershell
  docker exec invest_python_service pylint app/
  ```

- [ ] **Build: Success**
  ```powershell
  cd backend && npm run build
  ```

- [ ] **Docker /dist cache: Verificado**
  ```powershell
  # Rebuild DENTRO do Docker (workflow correto - FASE 40)
  docker exec invest_backend rm -rf /app/dist
  docker exec invest_backend npm run build
  docker restart invest_backend
  sleep 20
  ```

#### Frontend (Next.js)

- [ ] **TypeScript: 0 erros**
  ```powershell
  cd frontend && npx tsc --noEmit
  ```

- [ ] **ESLint: 0 warnings**
  ```powershell
  cd frontend && npm run lint
  ```

- [ ] **Build: Success**
  ```powershell
  cd frontend && npm run build
  # Verificar: "Compiled successfully" + 17+ páginas
  ```

### 2. Validação Tripla MCP (OBRIGATÓRIO)

**⚠️ CRÍTICO:** Executar **EM PARALELO** (1 janela por MCP para evitar conflito)

#### MCP 1: Playwright (UI + Interação + Screenshots)

- [ ] **Reiniciar serviços antes de testar**
  ```powershell
  docker restart invest_frontend invest_backend
  sleep 20
  ```

- [ ] **Navegação + Snapshot**
  ```typescript
  browser_navigate({ url: "http://localhost:3100/data-management" })
  browser_snapshot() // Verificar UI renderizada
  ```

- [ ] **Interações**
  ```typescript
  browser_click({ element: "Sync Button", ref: "..." })
  browser_wait_for({ text: "Sync completed" })
  ```

- [ ] **Screenshot de evidência**
  ```typescript
  browser_take_screenshot({
    filename: "FASE_41_VALIDACAO_PLAYWRIGHT.png",
    fullPage: true
  })
  ```

#### MCP 2: Chrome DevTools (Console + Network + Payload)

- [ ] **Console: 0 erros**
  ```typescript
  list_console_messages({ types: ["error"] })
  // ✅ 0 erros | ⚠️ Warnings benignos OK
  ```

- [ ] **Network: Todos requests 200 OK**
  ```typescript
  list_network_requests({ resourceTypes: ["xhr", "fetch"] })
  // Validar: status 200 ou 304 para todos
  ```

- [ ] **Payload validation**
  ```typescript
  get_network_request({ reqid: X })
  // Verificar: Dados COTAHIST B3 sem manipulação
  ```

- [ ] **Screenshot final**
  ```typescript
  take_screenshot({
    filePath: "FASE_41_VALIDACAO_CHROME_DEVTOOLS.png"
  })
  ```

#### MCP 3: Sequential Thinking (Análise Profunda)

- [ ] **Análise de lógica**
  ```typescript
  mcp__sequential-thinking__sequentialthinking({
    thought: "Analisar se validação de tipo está correta...",
    thoughtNumber: 1,
    totalThoughts: 5,
    nextThoughtNeeded: true
  })
  ```

- [ ] **Verificação de edge cases**
- [ ] **Validação de precisão de dados**
- [ ] **Análise de problemas potenciais**

### 3. Verificação de Dependências

- [ ] **Breaking changes?**
  ```powershell
  # Buscar importações afetadas
  Grep "import.*MarketDataService" backend/src/**/*.ts
  ```

- [ ] **Integrações funcionais?**
  - Frontend ↔ Backend (APIs)
  - Backend ↔ Python Service
  - Backend ↔ PostgreSQL
  - Backend ↔ Redis (cache + queue)
  - Frontend ↔ WebSocket (real-time)

- [ ] **Backward compatibility?**
  - Endpoints antigos ainda funcionam?
  - DTOs não quebrados?
  - Entidades database compatíveis?

### 4. Validação de Dados (Sistema Financeiro - 0 Tolerância)

- [ ] **Dados reais (não mocks)**
  - COTAHIST B3: Fonte oficial
  - BRAPI: Cross-validation
  - Economic Indicators: Banco Central Brasil

- [ ] **Sem manipulação/arredondamento**
  ```typescript
  // ❌ ERRADO
  const value = Math.round(data.close * 100) / 100

  // ✅ CORRETO
  const value = data.close // Precisão original mantida
  ```

- [ ] **Precisão mantida end-to-end**
  - Python Service → Backend → Frontend
  - Validar que valores NÃO mudam

- [ ] **Cross-validation com fontes múltiplas**
  - COTAHIST vs BRAPI (divergência < 1%)
  - Economic indicators vs IBGE (diferença < 2%)

### 5. Testes End-to-End

- [ ] **Cenários críticos funcionais**
  - Sync de ativos (10/10 ativos)
  - Performance < meta (ex: < 180s para 2020-2025)
  - Error handling (timeout, network fail, data invalid)

- [ ] **Dados validados manualmente**
  - Comparar 5+ registros com fonte oficial
  - Verificar OHLC accuracy
  - Validar timestamps corretos

- [ ] **Regressão: 0 features quebradas**
  - Testar features antigas após mudança
  - Validar integrações existentes
  - Verificar páginas principais (dashboard, assets, etc)

---

## 📋 CHECKLIST DOCUMENTAÇÃO

### 1. Arquivos Obrigatórios

- [ ] **ROADMAP.md** - Atualizado com fase atual
  - Problema identificado
  - Solução implementada
  - Resultados quantificados
  - Arquivos modificados
  - Validações realizadas

- [ ] **ARCHITECTURE.md** - Se mudança arquitetural
  - Diagrama atualizado
  - Novos componentes documentados
  - Integrações atualizadas

- [ ] **CLAUDE.md** - Se metodologia nova aplicada
  - Exemplo prático da fase
  - Lições aprendidas
  - Checklist específico

- [ ] **README.md** - Se feature user-facing
  - Atualizar screenshots
  - Documentar novas funcionalidades
  - Atualizar guia de instalação (se aplicável)

- [ ] **CONTRIBUTING.md** - Se nova convenção
  - Atualizar decisões técnicas
  - Documentar padrões novos

### 2. Documentação Específica da Fase

- [ ] **Criar arquivo dedicado** se mudança > 100 linhas
  - Formato: `FASE_XX_NOME_DESCRITIVO.md`
  - Conteúdo: Problema, solução, arquivos, validação, impacto

- [ ] **Screenshots de evidência**
  - Nomenclatura: `FASE_XX_EVIDENCIA_TIPO.png`
  - Locais: 3 MCPs + testes manuais

### 3. Atualização de Índices

- [ ] **index.md** - Se aplicável
- [ ] **requirements.txt** - Se novas dependências Python
- [ ] **package.json** - Se novas dependências Node

---

## 📋 CHECKLIST GIT

### 1. Pré-Commit

- [ ] **Remover código debug/temporário**
  ```typescript
  // ❌ Remover antes de commit
  console.log('DEBUG:', data)
  // TODO: temporário
  ```

- [ ] **Validar arquivos intencionais apenas**
  ```powershell
  git status
  # Verificar que apenas arquivos relacionados à fase estão staged
  ```

- [ ] **Build local: Success**
  ```powershell
  npm run build # Backend e Frontend
  ```

### 2. Commit Message (Conventional Commits)

**Formato obrigatório:**
```
<tipo>(<escopo>): <descrição curta>

**Problema Identificado:**
- Listar problemas (bullet points)

**Solução Implementada:**
- Listar soluções (bullet points)

**Arquivos Modificados:**
- arquivo.ts (+X/-Y linhas)

**Resultados:**
- Métricas quantificadas
- Taxa de sucesso

**Validação:**
- ✅ TypeScript: 0 erros
- ✅ Build: Success
- ✅ Testes: X/Y passing
- ✅ MCP Triplo: 3/3 validados

**Documentação:**
- ROADMAP.md (atualizado)
- ARQUIVO_NOVO.md (criado)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 3. Pós-Commit

- [ ] **Push para branch**
  ```powershell
  git push origin feature/dashboard-financial-complete
  ```

- [ ] **Verificar branch remota atualizada**
  ```powershell
  git log --oneline origin/feature/dashboard-financial-complete -5
  ```

- [ ] **Preparar merge para main** (quando fase estiver 100%)
  - Criar PR com descrição detalhada
  - Incluir screenshots de validação
  - Referenciar issues fechadas

---

## 📋 CHECKLIST SISTEMA COMPLETO

### 1. Serviços Healthy

- [ ] **Frontend: Rodando**
  ```powershell
  docker ps | grep invest_frontend
  # Status: Up X minutes (healthy)
  ```

- [ ] **Backend: Rodando**
  ```powershell
  docker ps | grep invest_backend
  # Status: Up X minutes (healthy)
  ```

- [ ] **PostgreSQL: Healthy**
  ```powershell
  docker exec invest_postgres pg_isready -U invest_user
  # Result: accepting connections
  ```

- [ ] **Redis: Healthy**
  ```powershell
  docker exec invest_redis redis-cli ping
  # Response: PONG
  ```

- [ ] **Python Service: Healthy**
  ```powershell
  curl http://localhost:8001/health
  # Status: 200 OK
  ```

### 2. System Manager Script Atualizado

- [ ] **system-manager.ps1 completo**
  - Todos os serviços incluídos
  - Health checks funcionais
  - Logs acessíveis
  - Rebuild automatizado

- [ ] **Funções novas necessárias?**
  - Adicionar se workflow novo criado
  - Exemplo: Rebuild-DockerDist (FASE 40)

### 3. Ambiente Preparado para Subir em Outro Servidor

- [ ] **docker-compose.yml atualizado**
- [ ] **.env.example atualizado** (sem secrets)
- [ ] **INSTALL.md completo** (todas portas, serviços, variáveis)
- [ ] **Migrations sincronizadas**
  ```powershell
  cd backend && npm run migration:run
  ```

---

## 📋 CHECKLIST PROBLEMAS CRÔNICOS

### 1. Verificar Histórico de Problemas Recorrentes

- [ ] **Docker /dist cache** (FASE 40)
  - Rebuild DENTRO do container
  - Não usar build local

- [ ] **TypeScript strict mode**
  - 0 erros obrigatório
  - Não usar `any` desnecessário

- [ ] **Performance regressions**
  - Medir antes/depois
  - Não degradar performance existente

### 2. Corrigir em Definitivo (Não Workaround)

- [ ] **Identificar causa raiz**
  - Usar Sequential Thinking MCP
  - Análise profunda (não superficial)

- [ ] **Implementar solução definitiva**
  - Corrigir problema original
  - Não mascarar com workaround

- [ ] **Documentar em arquivo dedicado**
  - `BUG_CRITICO_*.md`
  - Workflow correto para evitar recorrência

---

## 📋 CHECKLIST MELHORES PRÁTICAS

### 1. Código Limpo

- [ ] **KISS (Keep It Simple, Stupid)**
  - Código legível > "inteligente"
  - Menos código = menos bugs

- [ ] **DRY (Don't Repeat Yourself)**
  - Extrair código duplicado para funções
  - Mas não over-engineering (< 3 usos = OK duplicar)

- [ ] **Type Safety**
  - TypeScript strict mode
  - Validação de tipos em runtime (Pydantic, class-validator)

### 2. Performance

- [ ] **Não degradar performance existente**
  - Medir antes/depois
  - Benchmarks quando aplicável

- [ ] **Otimizações validadas**
  - Testes provam que é mais rápido
  - Não assumir que é melhor

### 3. Segurança

- [ ] **Não expor secrets**
  - .env não commitado
  - .env.example sem valores reais

- [ ] **Validação de inputs**
  - Backend valida TODOS os inputs
  - Não confiar em validação frontend apenas

- [ ] **SQL injection prevention**
  - Usar TypeORM (não raw queries)
  - Parametrização quando raw necessário

---

## 🎯 CRITÉRIOS DE ACEITAÇÃO PARA PRÓXIMA FASE

**Checklist deve estar 100% completo antes de prosseguir:**

- [ ] ✅ Code review: 100% completo
- [ ] ✅ Validação tripla MCP: 3/3 passing
- [ ] ✅ TypeScript: 0 erros (backend + frontend)
- [ ] ✅ Build: Success (backend + frontend)
- [ ] ✅ Testes E2E: X/X passing (100%)
- [ ] ✅ Dados: 100% precisão (sem manipulação)
- [ ] ✅ Dependências: 0 breaking changes
- [ ] ✅ Documentação: 100% atualizada
- [ ] ✅ Git: Branch sincronizada
- [ ] ✅ Problemas crônicos: Corrigidos em definitivo
- [ ] ✅ Regressão: 0 features quebradas
- [ ] ✅ Sistema: 100% healthy (todos serviços)

**❌ SE QUALQUER ITEM FALHAR:** Não prosseguir para próxima fase até corrigir.

---

## 📊 MÉTRICAS DE QUALIDADE (Zero Tolerance)

```
TypeScript Errors:    0/0 ✅
ESLint Warnings:      0/0 ✅
Build Errors:         0/0 ✅
Console Errors:       0/0 ✅ (páginas principais)
Lint Problems:        0/0 ✅ (critical)
Breaking Changes:     0/0 ✅ (sem aprovação)
Testes Failing:       0/X ✅ (100% passing)
Documentação:         100% ✅ (completa + atualizada)
Co-autoria Commits:   100% ✅ (todos commits)
Dados Precisão:       100% ✅ (sem manipulação)
MCP Validação:        3/3 ✅ (tripla)
```

---

**✅ Este checklist é OBRIGATÓRIO para TODAS as fases futuras.**

**🔗 Referências:**
- `CLAUDE.md` - Metodologia Claude Code completa
- `CONTRIBUTING.md` - Convenções de código
- `TROUBLESHOOTING.md` - Problemas comuns
- `BUG_CRITICO_DOCKER_DIST_CACHE.md` - Workflow Docker correto
- `BUG_CRITICO_PERFORMANCE_COTAHIST.md` - Performance reference
