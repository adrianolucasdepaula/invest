# ✅ CHECKLIST E TODO - PRÓXIMA FASE

**Data:** 2025-11-14 02:00 UTC
**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Metodologia:** Rigorosa conforme instruções do usuário
**Próxima Prioridade:** REFATORAÇÃO SISTEMA REPORTS

---

## 📋 ANÁLISE DOS PLANEJAMENTOS

### Documentos de Referência
1. ✅ `REFATORACAO_SISTEMA_REPORTS.md` - Planejamento de 6 FASES
2. ✅ `VALIDACAO_FRONTEND_COMPLETA.md` - Roadmap geral (FASES 12-21)

### Priorização Identificada

**Baseado nos planejamentos:**
- 🔴 **ALTA PRIORIDADE:** REFATORACAO_SISTEMA_REPORTS (5-7 dias estimados)
- 🟡 **MÉDIA PRIORIDADE:** FASE 16 Console Messages (do roadmap geral)

**Decisão:**
Seguir planejamento específico (REFATORACAO_SISTEMA_REPORTS.md) conforme instruções do usuário: *"continuar para as proximas fase/etapa conforme a recomendação e tambem o planejamento que foi criado"*

---

## 🎯 PRÓXIMA FASE: REFATORAÇÃO REPORTS - FASE 1

**Nome:** Limpeza de Dados (Backend)
**Prioridade:** 🔴 CRÍTICO
**Estimativa:** 2-3 horas
**Dependências:** FASE 15 completa ✅

### Objetivo
Remover análises antigas/sujas do banco de dados para ter dados limpos antes da refatoração.

### Critérios de Limpeza
1. Remover análises de ativos inativos (`asset.isActive = false`)
2. Remover análises falhadas antigas (> 7 dias)
3. Remover análises pendentes travadas (> 1 hora)
4. (Opcional) Remover análises muito antigas (> 90 dias)

---

## 📝 CHECKLIST COMPLETA - FASE 1

### PRÉ-REQUISITOS (VALIDAÇÃO 100%)
- [x] **FASE 15 completa:** 130/130 itens validados
- [x] **Issue #1 resolvida:** Password hash corrigido
- [x] **Issue #3 investigada:** Documentada (não bloqueante)
- [x] **Git limpo:** Working tree clean, 16 commits ahead
- [x] **TypeScript:** 0 erros (backend + frontend)
- [x] **Build:** Success (frontend + backend)
- [x] **Documentação atualizada:** CLAUDE.md, issues docs

### FASE 1.1 - CRIAÇÃO DO SCRIPT DE LIMPEZA (1h)
- [ ] **1.1.1** Criar arquivo `backend/src/database/scripts/cleanup-analyses.ts`
- [ ] **1.1.2** Implementar conexão com banco de dados (TypeORM DataSource)
- [ ] **1.1.3** Implementar contagem de análises ANTES da limpeza
- [ ] **1.1.4** Implementar query: Análises de ativos inativos
- [ ] **1.1.5** Implementar query: Análises falhadas antigas (> 7 dias)
- [ ] **1.1.6** Implementar query: Análises pendentes travadas (> 1 hora)
- [ ] **1.1.7** (Opcional) Implementar query: Análises muito antigas (> 90 dias)
- [ ] **1.1.8** Implementar estatísticas DEPOIS da limpeza
- [ ] **1.1.9** Implementar resumo por status
- [ ] **1.1.10** Adicionar logs detalhados de progresso
- [ ] **1.1.11** Adicionar tratamento de erros completo

**Arquivo de Referência:** REFATORACAO_SISTEMA_REPORTS.md:586-714
**Validação:** Script deve ser executável via `ts-node`

---

### FASE 1.2 - CONFIGURAÇÃO NPM SCRIPT (15min)
- [ ] **1.2.1** Adicionar comando ao `backend/package.json`:
  ```json
  "cleanup:analyses": "ts-node src/database/scripts/cleanup-analyses.ts"
  ```
- [ ] **1.2.2** (Opcional) Adicionar dry-run para teste sem executar
- [ ] **1.2.3** Validar comando: `npm run cleanup:analyses --help`

**Validação:** Comando deve aparecer em `npm run`

---

### FASE 1.3 - EXECUÇÃO DA LIMPEZA (30min)
- [ ] **1.3.1** Fazer backup do banco de dados (segurança)
  ```bash
  docker exec invest_postgres pg_dump -U invest_user invest_db > backup_before_cleanup.sql
  ```
- [ ] **1.3.2** Executar script: `npm run cleanup:analyses`
- [ ] **1.3.3** Capturar saída completa (logs)
- [ ] **1.3.4** Verificar estatísticas retornadas:
  - Total ANTES
  - Total DEPOIS
  - Total REMOVIDO
  - Distribuição por status

**Validação:** Script deve executar sem erros e mostrar estatísticas

---

### FASE 1.4 - VALIDAÇÃO DOS RESULTADOS (30min)
- [ ] **1.4.1** Executar query de validação:
  ```sql
  SELECT
    status,
    type,
    COUNT(*) as total,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
  FROM analyses
  GROUP BY status, type
  ORDER BY status, type;
  ```
- [ ] **1.4.2** Verificar ativos sem análise:
  ```sql
  SELECT
    a.ticker,
    a.name,
    a.type,
    a.sector
  FROM assets a
  LEFT JOIN analyses an ON a.id = an.asset_id AND an.type = 'complete'
  WHERE a.is_active = true
  AND an.id IS NULL
  ORDER BY a.ticker;
  ```
- [ ] **1.4.3** Validar que não existem:
  - ❌ Análises de ativos inativos
  - ❌ Análises falhadas antigas (> 7 dias)
  - ❌ Análises pendentes travadas (> 1 hora)
- [ ] **1.4.4** Documentar resultados em `VALIDACAO_FASE_1_LIMPEZA.md`

**Validação:** Queries devem retornar ZERO registros inválidos

---

### FASE 1.5 - TESTES E DOCUMENTAÇÃO (30min)
- [ ] **1.5.1** Testar script em modo dry-run (se implementado)
- [ ] **1.5.2** Testar script em ambiente de desenvolvimento
- [ ] **1.5.3** Validar que frontend continua funcionando:
  - [ ] Carregar `/reports` (deve mostrar menos itens)
  - [ ] Carregar `/analysis` (deve mostrar apenas válidas)
- [ ] **1.5.4** Criar documentação: `VALIDACAO_FASE_1_LIMPEZA.md`
  - Estatísticas antes/depois
  - Queries executadas
  - Resultados obtidos
  - Screenshots (opcional)
- [ ] **1.5.5** Atualizar CLAUDE.md com FASE 1 completa

**Validação:** Frontend funcional + documentação completa

---

### FASE 1.6 - GIT COMMIT E FINALIZAÇÃO (15min)
- [ ] **1.6.1** Verificar TypeScript: `npm run type-check` (0 erros)
- [ ] **1.6.2** Verificar Build: `npm run build` (success)
- [ ] **1.6.3** Git add: `git add -A`
- [ ] **1.6.4** Git commit com mensagem detalhada:
  ```
  feat: FASE 1 - Limpeza de dados do sistema Reports

  REFATORAÇÃO REPORTS - FASE 1: Limpeza de Dados (Backend)

  SCRIPT CRIADO:
  - backend/src/database/scripts/cleanup-analyses.ts
  - Comando NPM: cleanup:analyses

  DADOS REMOVIDOS:
  - X análises de ativos inativos
  - Y análises falhadas antigas (> 7 dias)
  - Z análises pendentes travadas (> 1 hora)
  - Total removido: N registros

  VALIDAÇÃO:
  ✅ TypeScript: 0 erros
  ✅ Build: Success
  ✅ Frontend: Funcional
  ✅ Queries: 0 registros inválidos

  DOCUMENTAÇÃO:
  - VALIDACAO_FASE_1_LIMPEZA.md criado
  - CLAUDE.md atualizado

  Próxima fase: FASE 2 - Novo endpoint backend

  Co-Authored-By: Claude <noreply@anthropic.com>
  ```
- [ ] **1.6.5** Verificar git status: `git status` (clean)
- [ ] **1.6.6** Verificar branch: `git log --oneline -5`

**Validação:** Git clean, commit realizado

---

## 🔍 VALIDAÇÃO TRIPLA (OBRIGATÓRIA)

### MCP 1: Chrome DevTools
- [ ] **V1.1** Abrir `/reports` e verificar Network tab
- [ ] **V1.2** Verificar Console (0 erros)
- [ ] **V1.3** Verificar Response body: menos análises retornadas
- [ ] **V1.4** Screenshot: `validacao-fase-1-chrome-devtools.png`

### MCP 2: Playwright
- [ ] **V2.1** Navegar para `/reports` via Playwright
- [ ] **V2.2** Capturar network requests
- [ ] **V2.3** Verificar console messages
- [ ] **V2.4** Screenshot: `validacao-fase-1-playwright.png`

### MCP 3: Selenium (Se disponível)
- [ ] **V3.1** Navegar para `/reports` via Selenium
- [ ] **V3.2** Validar página carrega corretamente
- [ ] **V3.3** Screenshot: `validacao-fase-1-selenium.png`

**Validação:** 3 MCPs devem mostrar sistema funcional

---

## ⚠️ CRITÉRIOS DE BLOQUEIO

**NÃO prosseguir para FASE 2 se:**
- ❌ TypeScript tem erros
- ❌ Build falha
- ❌ Frontend quebrou
- ❌ Queries de validação retornam registros inválidos
- ❌ Git não está limpo
- ❌ Documentação incompleta
- ❌ Validação tripla não passou

**Princípio:** *"não se deve continuar para a proxima fase/etapa enquanto a fase anterior nao estiver sido entre 100% sem erros, falhas, warnings, bugs, divergencias, inconsistencias"*

---

## 📊 ESTIMATIVAS DE TEMPO

| Fase | Tarefa | Tempo Estimado | Tempo Real |
|------|--------|---------------|-----------|
| 1.1 | Criar script | 1h | - |
| 1.2 | Config NPM | 15min | - |
| 1.3 | Executar limpeza | 30min | - |
| 1.4 | Validar resultados | 30min | - |
| 1.5 | Testes e docs | 30min | - |
| 1.6 | Git commit | 15min | - |
| **TOTAL** | **FASE 1** | **3h** | **-** |

---

## 🎯 PRÓXIMAS FASES (APÓS FASE 1)

### FASE 2: Novo Endpoint Backend (3-4h)
- Criar DTO: `AssetWithAnalysisStatusDto`
- Criar método no service: `getAssetsWithAnalysisStatus()`
- Criar rota no controller: `GET /reports/assets-status`
- Testes e validação tripla

### FASE 3: Refatorar Frontend /reports (4-5h)
- Redesenhar página `/reports`
- Lista de TODOS os ativos (55+)
- Botão "Analisar Todos os Ativos"
- Botão "Analisar" individual
- Status de análise por ativo

### FASE 4: Conectar Report Detail Page (2-3h)
- Remover mock data
- Usar dados reais do backend
- Hook `useReport(id)`
- 4 tabs funcionando

### FASE 5: Download de Relatórios (3-4h)
- Gerar PDF (Puppeteer + template HTML)
- Gerar JSON
- Endpoint de download funcional

### FASE 6: Testes E2E e Validação (2-3h)
- Testes completos
- Validação tripla (3 MCPs)
- Screenshots
- Documentação final

**TOTAL ESTIMADO REFATORAÇÃO:** 19-26 horas (2-3 dias)

---

## 📚 REFERÊNCIAS

### Documentos de Planejamento
- `REFATORACAO_SISTEMA_REPORTS.md` - Planejamento completo (6 fases)
- `VALIDACAO_FRONTEND_COMPLETA.md` - Roadmap geral
- `ANALISE_BLOQUEANTES_FASE_15.md` - Análise de bloqueantes

### Documentação FASE 15
- `VALIDACAO_FASE_15_COMPLETA.md` - 130 itens validados
- `ISSUE_3_CONFIANCA_ZERO_ANALISE.md` - Investigação de dados

### Arquitetura
- `CLAUDE.md` - Documentação principal do projeto
- `README.md` - Documentação pública

---

## ✅ APROVAÇÃO PARA INÍCIO

**Checklist pré-início:**
- [x] FASE 15 100% completa
- [x] Issues críticas resolvidas (Issue #1)
- [x] Git limpo e atualizado
- [x] Planejamento lido e compreendido
- [x] Checklist e TODO criados
- [x] Critérios de validação definidos
- [x] Metodologia rigorosa estabelecida

**Status:** ✅ **PRONTO PARA INICIAR FASE 1**

---

**Aguardando confirmação do usuário para iniciar execução da FASE 1.**

---

**Gerado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-14 02:00 UTC
