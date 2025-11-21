# CHECKLIST ULTRA-ROBUSTO - FASE 37 (Revisão) + FASE 36.3 (Implementação)

**Data Criação:** 2025-11-21
**Responsável:** Claude Code (Sonnet 4.5)
**Branch:** `feature/dashboard-financial-complete`
**Metodologia:** Ultra-Thinking + TodoWrite + Validação Tripla MCP

---

## 📋 ÍNDICE

1. [Princípios Fundamentais](#princípios-fundamentais)
2. [FASE 37 - Revisão Completa](#fase-37---revisão-completa)
3. [FASE 36.3 - Implementação](#fase-363---implementação)
4. [Validação Tripla MCP (Obrigatória)](#validação-tripla-mcp)
5. [Critérios de Aceitação](#critérios-de-aceitação)
6. [Problemas Crônicos Identificados](#problemas-crônicos-identificados)

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS (NÃO NEGOCIÁVEL)

### 1. Git e Versionamento

- [ ] **Git Status Limpo**: `git status` mostra apenas arquivos intencionais
- [ ] **Branch Atualizada**: Todos commits pushed para origin
- [ ] **Nenhum Arquivo Deletado Acidentalmente**: Verificar `git diff --stat`
- [ ] **Commits Atômicos**: Cada commit representa 1 mudança lógica
- [ ] **Mensagens Conventional Commits**: `feat:`, `fix:`, `docs:`, etc
- [ ] **Co-autoria Claude**: `Co-Authored-By: Claude <noreply@anthropic.com>`

### 2. Qualidade de Código (Zero Tolerance)

- [ ] **TypeScript Backend: 0 erros**: `cd backend && npx tsc --noEmit`
- [ ] **TypeScript Frontend: 0 erros**: `cd frontend && npx tsc --noEmit`
- [ ] **ESLint: 0 warnings**: `cd frontend && npm run lint`
- [ ] **Build Backend: Success**: `cd backend && npm run build`
- [ ] **Build Frontend: Success**: `cd frontend && npm run build`
- [ ] **Console Errors: 0** (páginas principais testadas com MCPs)

### 3. Documentação Sempre Atualizada

- [ ] **ROADMAP.md**: Seção da fase atualizada com status 100%
- [ ] **CLAUDE.md**: Metodologia ou exemplo adicionado (se aplicável)
- [ ] **README.md**: Features documentadas (se visível para usuário)
- [ ] **ARCHITECTURE.md**: Arquitetura atualizada (se mudanças estruturais)
- [ ] **Arquivo Dedicado**: Criado se mudança > 100 linhas

### 4. Validação de Dados (Sistemas Financeiros)

- [ ] **Dados Reais**: Sempre usar dados dos scrapers, NUNCA mocks
- [ ] **Precisão Mantida**: NUNCA arredondar, manipular ou alterar valores
- [ ] **COTAHIST B3**: Dados sem manipulação (validar com screenshots)
- [ ] **Cross-Validation**: Comparar múltiplas fontes quando possível

### 5. Validação Tripla MCP (OBRIGATÓRIA)

- [ ] **Playwright MCP**: UI + interação + screenshots
- [ ] **Chrome DevTools MCP**: Console + network + payload validation
- [ ] **Sequential Thinking MCP**: Análise profunda de lógica
- [ ] **React Developer Tools**: Validação de componentes e estado

### 6. Gerenciamento de Ambiente

- [ ] **system-manager.ps1 Existe**: Script não foi deletado
- [ ] **Serviços Healthy**: `.\system-manager.ps1 status` todos UP
- [ ] **Restart Antes de Testar**: Reiniciar backend/frontend após mudanças
- [ ] **Docker Containers UP**: `docker ps` mostra todos containers running

### 7. Dependências e Integrações

- [ ] **Analisar Impacto**: Identificar TODOS arquivos afetados
- [ ] **Grep por Imports**: `grep -r "NomeArquivo"` para encontrar dependências
- [ ] **Testes de Integração**: Validar que nada quebrou
- [ ] **Breaking Changes: 0**: Sem mudanças quebram código existente

### 8. Problemas Crônicos (Correção Definitiva)

- [ ] **Identificar Root Cause**: Não fazer workarounds temporários
- [ ] **Corrigir Definitivamente**: Solução permanente, não paliativa
- [ ] **Documentar em Arquivo**: `BUG_*.md` ou seção em `FASE_*.md`
- [ ] **Validar Fix**: Testar todos cenários que causavam o problema

### 9. Arquitetura e Melhores Práticas

- [ ] **Pesquisar Melhores Práticas**: WebSearch + Context7 MCP
- [ ] **Seguir Arquitetura Existente**: Respeitar padrões do projeto
- [ ] **KISS (Keep It Simple)**: Evitar over-engineering
- [ ] **DRY (Don't Repeat Yourself)**: Reutilizar código existente
- [ ] **Type Safety**: TypeScript strict mode sempre

### 10. Atualização de Dependências

- [ ] **Context7 MCP**: Verificar versões atualizadas de bibliotecas
- [ ] **Changelog Analysis**: Ler breaking changes antes de atualizar
- [ ] **Testes Após Atualização**: Validar que nada quebrou
- [ ] **Rollback Plan**: Git tag antes de major version updates

---

## 🔍 FASE 37 - REVISÃO COMPLETA (PRÉ-REQUISITO PARA FASE 36.3)

### Objetivo da Revisão

**Garantir que FASE 37 está 100% completa, sem erros, falhas, warnings, bugs, divergências, inconsistências, problemas não-bloqueantes, oportunidades de melhoria, ou itens incompletos.**

---

### 1. Análise de Arquivos Reais vs Documentação

#### 1.1 Arquivos Modificados Não Commitados

**Status:** ❌ GIT SUJO (12 arquivos modificados, 1 deletado)

**Arquivos Identificados:**
```
modified:   backend/api-service/.env.template
modified:   backend/python-service/app/models.py
modified:   backend/src/api/market-data/market-data.service.ts  (WebSocket events FASE 37)
modified:   backend/src/app.module.ts
modified:   backend/src/database/entities/index.ts
modified:   docker-compose.yml
modified:   frontend/src/lib/api/data-sync.ts
modified:   frontend/src/lib/hooks/useDataSync.ts
modified:   frontend/src/lib/types/data-sync.ts
modified:   frontend/test-results.json
modified:   frontend/test-results/.last-run.json
deleted:    system-manager.ps1  (RESTAURADO ✅)
```

**Checklist:**
- [x] **system-manager.ps1 Restaurado**: `git restore` executado
- [ ] **Analisar Cada Mudança**: Entender se é intencional ou precisa reverter
- [ ] **Commitar Mudanças Intencionais**: WebSocket events, etc
- [ ] **Reverter Mudanças Acidentais**: test-results.json se não intencional
- [ ] **Git Status Limpo**: Antes de prosseguir para FASE 36.3

---

#### 1.2 Arquivos Untracked (Novos Não Commitados)

```
PLANO_FASE_36_3_TRADINGVIEW_PAGE.md
backend/scripts/measure-sync.ts
backend/scripts/sync-all-assets-full-history.js
backend/scripts/sync-all-assets-full-history.sh
backend/scripts/validate-api-precision.ts
backend/scripts/validate-precision.ts
backend/src/api/economic-indicators/
backend/src/common/utils/
backend/src/database/entities/economic-indicator.entity.ts
backend/src/database/migrations/1763570147816-UpdateAssetPricePrecision.ts
backend/src/database/migrations/1763728696267-CreateEconomicIndicators.ts
backend/src/integrations/
frontend/parse-results.js
frontend/playwright/
frontend/src/components/data-sync/IndividualSyncModal.tsx
frontend/tests/login-debug.spec.ts
```

**Checklist:**
- [ ] **Analisar Cada Arquivo**: Determinar se devem ser commitados ou deletados
- [ ] **PLANO_FASE_36_3**: Commitar após revisão
- [ ] **Scripts Backend**: Analisar se são necessários (measure-sync, validate-*)
- [ ] **Economic Indicators**: Analisar se devem ser incluídos ou removidos
- [ ] **Frontend Tests**: Commitar ou mover para .gitignore
- [ ] **IndividualSyncModal.tsx**: Validar se está completo

---

### 2. Validação TypeScript (Zero Tolerance)

**Checklist:**
- [ ] **Backend**: `cd backend && npx tsc --noEmit` → 0 erros
- [ ] **Frontend**: `cd frontend && npx tsc --noEmit` → 0 erros
- [ ] **Capturar Output**: Screenshot de evidência
- [ ] **Corrigir Erros Antes de Prosseguir**: BLOQUEANTE

---

### 3. Validação Build (Zero Tolerance)

**Checklist:**
- [ ] **Backend Build**: `cd backend && npm run build` → Success
- [ ] **Frontend Build**: `cd frontend && npm run build` → 18 páginas compiladas
- [ ] **Verificar Warnings**: ESLint warnings devem ser 0
- [ ] **Capturar Output**: Screenshot de evidência

---

### 4. Reiniciar Serviços (Obrigatório Antes de Testes)

**Checklist:**
- [ ] **Status Atual**: `.\system-manager.ps1 status`
- [ ] **Down All**: `.\system-manager.ps1 down`
- [ ] **Up All**: `.\system-manager.ps1 up`
- [ ] **Aguardar Health**: ~30 segundos para todos serviços UP
- [ ] **Verificar Logs**: `docker-compose logs -f --tail=50` sem erros críticos

---

### 5. Validação MCP #1 - Playwright (UI + Interação)

**Test Cases:**

#### TC1: Modal "Sincronizar em Massa" - Botões de Período
```typescript
// Cenário: Validar fix do bug crítico (type="button")
1. Abrir http://localhost:3100/data-management
2. Clicar "Sincronizar em Massa"
3. Snapshot inicial do modal
4. Clicar "Histórico Completo"
5. Verificar: Modal permanece aberto ✅
6. Verificar: Datas atualizadas (02/01/1986 até 21/11/2025) ✅
7. Clicar "Últimos 5 Anos"
8. Verificar: Modal permanece aberto ✅
9. Verificar: Datas atualizadas (21/11/2020 até 21/11/2025) ✅
10. Clicar "Selecionar Todos"
11. Verificar: Modal permanece aberto ✅
12. Screenshot de evidência
```

**Checklist:**
- [ ] **TC1 Executado**: 100% passing
- [ ] **Screenshot Capturado**: `FASE_37_REVISAO_PLAYWRIGHT_MODAL_OPEN.png`
- [ ] **Sem Erros Console**: Verificar console messages
- [ ] **Performance**: Modal abre em < 500ms

---

#### TC2: Página Data Management - Tabela de Ativos
```typescript
// Cenário: Validar dados reais B3 sem manipulação
1. Abrir http://localhost:3100/data-management
2. Snapshot da tabela
3. Verificar: 55 ativos carregados ✅
4. Verificar: Badge "Período dos Dados" visível ✅
5. Clicar em 1 ativo (ex: ABEV3)
6. Verificar: Dados de sync (recordsLoaded, oldestDate, newestDate)
7. Validar: Números SEM arredondamento (ex: 1317 registros, não 1.3k)
8. Screenshot de evidência
```

**Checklist:**
- [ ] **TC2 Executado**: 100% passing
- [ ] **Screenshot Capturado**: `FASE_37_REVISAO_PLAYWRIGHT_TABLE_DATA.png`
- [ ] **Precisão Dados**: Validar valores COTAHIST B3 intactos
- [ ] **Badge Visível**: "📅 Período dos Dados: DD/MM/YYYY até DD/MM/YYYY"

---

### 6. Validação MCP #2 - Chrome DevTools (Console + Network + Payload)

**Checklist:**

#### Console Messages
- [ ] **List All Messages**: `list_console_messages({ types: ["error", "warn"] })`
- [ ] **0 Errors**: Console deve ter 0 erros
- [ ] **Warnings Esperados OK**: WebSocket retry antes de conectar (benigno)
- [ ] **Screenshot**: `FASE_37_REVISAO_DEVTOOLS_CONSOLE.png`

#### Network Requests
- [ ] **List All Requests**: `list_network_requests({ resourceTypes: ["xhr", "fetch"] })`
- [ ] **Todos 200 OK ou 304**: Nenhum 400, 500 errors
- [ ] **GET /api/v1/market-data/sync-status**: 200 OK
- [ ] **WebSocket Connection**: Connected ✅

#### Payload Validation (Dados Reais)
- [ ] **Get Specific Request**: `get_network_request({ reqid: X })`
- [ ] **Response JSON**: Validar estrutura `{ ticker, recordsLoaded, oldestDate, newestDate, status, lastSyncDuration }`
- [ ] **Dados COTAHIST B3**: Valores intactos sem manipulação
- [ ] **Exemplo Validado**: ABEV3 com 1317 registros (precisão mantida)
- [ ] **Screenshot**: `FASE_37_REVISAO_DEVTOOLS_PAYLOAD.png`

---

### 7. Validação MCP #3 - Sequential Thinking (Análise Profunda)

**Pontos de Análise:**

#### Lógica de Negócio
- [ ] **Período Dinâmico**: `getCurrentDate()` retorna data atual sempre
- [ ] **Validação Datas**: Data inicial < Data final
- [ ] **Range Mínimo/Máximo**: 02/01/1986 (MIN_DATE) até hoje (currentDate)
- [ ] **Type Safety**: CandleTimeframe enum correto

#### Correção de Bug
- [ ] **type="button" Aplicado**: 5 botões (linha 217, 270)
- [ ] **Sem Submit Events**: Modal não fecha mais ao clicar período
- [ ] **Estado Preservado**: selectedTickers mantido ao trocar período

#### Performance
- [ ] **useMemo Configs**: widgetConfig memoizado corretamente
- [ ] **Re-renders Minimizados**: React.memo nos componentes
- [ ] **Lazy Loading**: Tabs carregam apenas quando ativas (se aplicável)

#### Acessibilidade
- [ ] **ARIA Labels**: Todos inputs têm labels
- [ ] **Keyboard Navigation**: Tab/Enter funcionam
- [ ] **Screen Reader**: Leitura correta dos elementos

**Checklist:**
- [ ] **Sequential Thinking Executado**: 8+ thoughts processados
- [ ] **Score Final**: 95+ / 100
- [ ] **Problemas Identificados**: Lista de issues (se houver)
- [ ] **Recomendação**: PRONTO ou BLOQUEADO

---

### 8. Verificar Dependências e Integrações

**Arquivos Afetados pela FASE 37:**

#### Backend
- [ ] **market-data.service.ts**: WebSocket events adicionados
- [ ] **sync.gateway.ts**: Gateway WebSocket criado
- [ ] **app.module.ts**: SyncGateway registered
- [ ] **Migrations**: Nenhuma migration nova necessária

#### Frontend
- [ ] **SyncConfigModal.tsx**: type="button" fix (linha 217, 270)
- [ ] **BulkSyncButton.tsx**: Conversão data → ano
- [ ] **SyncStatusTable.tsx**: Badge de período
- [ ] **data-sync.ts (types)**: Interfaces atualizadas
- [ ] **useDataSync.ts**: Hook WebSocket

**Checklist:**
- [ ] **Grep Imports**: `grep -r "SyncConfigModal"` → Nenhum import quebrado
- [ ] **Grep Imports**: `grep -r "BulkSyncButton"` → Nenhum import quebrado
- [ ] **Testes de Integração**: Sincronização em massa funciona end-to-end
- [ ] **WebSocket Conectado**: Eventos recebidos no frontend

---

### 9. Identificar Problemas Crônicos (Correção Definitiva)

**Problemas Já Corrigidos:**
1. ✅ **Modal Fecha ao Clicar Período** → Fix: `type="button"`
2. ✅ **Datas Hardcoded 2024** → Fix: `getCurrentDate()`, `getFiveYearsAgo()`
3. ✅ **Validação Hardcoded** → Fix: Validação dinâmica com `formatDate()`

**Novos Problemas Identificados Durante Revisão:**
- [ ] **Git Sujo**: 12 arquivos modificados não commitados
- [ ] **system-manager.ps1 Deletado**: Restaurado mas precisa commit
- [ ] **WebSocket Events Não Commitados**: market-data.service.ts modificado
- [ ] **Arquivos Untracked**: 15+ arquivos novos não commitados

**Checklist:**
- [ ] **Problema #1 (Git Sujo)**: Commitar mudanças intencionais
- [ ] **Problema #2 (Arquivos Untracked)**: Analisar e commitar/deletar
- [ ] **Problema #3 (WebSocket)**: Commitar WebSocket events implementados
- [ ] **Validar Correções**: Testar que tudo ainda funciona

---

### 10. Atualizar Documentação (TODAS)

**Arquivos a Atualizar:**

#### ROADMAP.md
- [ ] **FASE 37 Completa**: Status 100%, validação tripla MCP ✅
- [ ] **Problemas Identificados**: Git sujo, arquivos untracked
- [ ] **Commits Realizados**: Lista de commits novos
- [ ] **Próxima Fase**: FASE 36.3 planejada

#### CLAUDE.md
- [ ] **Exemplo FASE 37**: Já documentado (validação tripla MCP)
- [ ] **Lições Aprendidas**: Adicionar se novos aprendizados
- [ ] **Checklist Ultra-Robusto**: Referência a este arquivo

#### README.md (se aplicável)
- [ ] **Features Visíveis**: Sincronização em massa com datas completas
- [ ] **Screenshots**: Adicionar se relevante para usuário final

#### ARCHITECTURE.md (se aplicável)
- [ ] **WebSocket Integration**: Documentar se mudanças estruturais
- [ ] **Sync Flow Diagram**: Atualizar se necessário

**Checklist:**
- [ ] **ROADMAP.md Atualizado**: Commit message referenciado
- [ ] **CLAUDE.md Atualizado**: Exemplo ou metodologia adicionada
- [ ] **README.md Atualizado**: Se features visíveis para usuário
- [ ] **Novos Documentos**: `FASE_37_*.md` já criados anteriormente

---

### 11. Screenshots de Evidência (3 MCPs)

**Obrigatório:**
- [ ] **Playwright Screenshot**: Modal aberto com botões funcionando
- [ ] **Chrome DevTools Screenshot**: Console + Network + Payload
- [ ] **Sequential Thinking Screenshot**: Output de análise

**Pasta de Destino:**
- `.playwright-mcp/` ou raiz do projeto

**Nomenclatura:**
```
FASE_37_REVISAO_PLAYWRIGHT_MODAL_OPEN.png
FASE_37_REVISAO_PLAYWRIGHT_TABLE_DATA.png
FASE_37_REVISAO_DEVTOOLS_CONSOLE.png
FASE_37_REVISAO_DEVTOOLS_PAYLOAD.png
FASE_37_REVISAO_SEQUENTIAL_THINKING.png
```

---

### 12. Git: Commit + Push + Atualizar PR

**Checklist:**

#### Preparar Commit
- [ ] **git add**: Adicionar arquivos modificados intencionais
- [ ] **git status**: Verificar apenas arquivos esperados staged
- [ ] **git diff --cached**: Revisar mudanças antes de commit

#### Criar Commit (Conventional Commits)
```bash
git commit -m "$(cat <<'EOF'
fix(frontend): FASE 37 - Revisão completa + correção git sujo

**Mudanças:**
- Restaurar system-manager.ps1 (deletado acidentalmente)
- Commitar WebSocket events em market-data.service.ts
- Commitar mudanças frontend (SyncConfigModal, BulkSyncButton, etc)
- Remover arquivos temporários (test-results.json)

**Validação Tripla MCP:**
- ✅ Playwright: Modal permanece aberto (4/4 test cases passing)
- ✅ Chrome DevTools: Console 0 errors, payload COTAHIST B3 intacto
- ✅ Sequential Thinking: Score 95/100

**Arquivos Modificados:**
- backend/src/api/market-data/market-data.service.ts (+32 linhas)
- frontend/src/components/data-sync/SyncConfigModal.tsx (type="button" fix)
- system-manager.ps1 (restaurado)

**Arquivos Commitados:**
- PLANO_FASE_36_3_TRADINGVIEW_PAGE.md
- CHECKLIST_ULTRA_ROBUSTO_FASE_37_E_36_3.md
- [outros arquivos conforme análise]

**Status:**
✅ TypeScript: 0 erros (backend + frontend)
✅ Build: Success (18 páginas)
✅ Git: Limpo (apenas arquivos intencionais)
✅ Documentação: Atualizada (ROADMAP, CLAUDE.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

#### Push e Atualizar PR
- [ ] **git push origin feature/dashboard-financial-complete**
- [ ] **Verificar GitHub**: Commits apareceram no PR #4
- [ ] **Atualizar Descrição PR**: Adicionar FASE 37 revisão se necessário

---

## 🚀 FASE 36.3 - IMPLEMENTAÇÃO (APÓS REVISÃO 100% FASE 37)

### Pré-Requisitos OBRIGATÓRIOS

**BLOQUEANTE:** Não prosseguir para FASE 36.3 se QUALQUER item abaixo falhar.

- [ ] **FASE 37 100% Completa**: Todos checklists acima ✅
- [ ] **Git Limpo**: `git status` sem arquivos pendentes
- [ ] **TypeScript 0 Erros**: Backend + Frontend
- [ ] **Build Success**: Backend + Frontend
- [ ] **Serviços Healthy**: All containers UP
- [ ] **Documentação Atualizada**: ROADMAP, CLAUDE.md, etc
- [ ] **Branch Pushed**: Última versão no GitHub

---

### 1. Criar Checklist Detalhado FASE 36.3

**Arquivo:** `FASE_36_3_CHECKLIST_DETALHADO.md`

**Conteúdo Mínimo:**
- [ ] **Planejamento Validado**: `PLANO_FASE_36_3` revisado com arquivos reais
- [ ] **Arquitetura Definida**: Multi-chart tabs vs grid 2x2 (decisão confirmada)
- [ ] **Riscos Mapeados**: Performance, rate limiting, temas, TypeScript
- [ ] **Mitigações Planejadas**: Lazy loading, debounce, useMemo, etc

---

### 2. Validar Arquivos Reais vs Planejamento

**Checklist:**

#### TradingView Components Existentes
- [ ] **TickerTape.tsx**: Ler arquivo real (162 linhas)
- [ ] **AdvancedChart.tsx**: Ler arquivo real (278 linhas)
- [ ] **constants.ts**: Verificar se B3_SYMBOLS já existe
- [ ] **types.ts**: Verificar tipos disponíveis (SymbolSelectorProps)
- [ ] **hooks/useTradingViewWidget.ts**: Validar lazy loading support
- [ ] **hooks/useTradingViewTheme.ts**: Validar dark/light sync

#### Verificar Sidebar
- [ ] **sidebar.tsx**: Ler navigation array atual
- [ ] **Ícones Disponíveis**: Verificar import `TrendingUp` de lucide-react

#### Verificar Assets API
- [ ] **GET /api/v1/assets**: Lista de 55 ativos B3 disponível
- [ ] **Formato Response**: `{ ticker, name, ... }`
- [ ] **Mapear para B3_SYMBOLS**: Criar script se necessário

---

### 3. Atualizar PLANO_FASE_36_3 com Análise Real

**Checklist:**
- [ ] **Seção "Arquivos Reais"**: Adicionar análise de arquivos lidos
- [ ] **Decisões Técnicas**: Confirmar tabs vs grid com base em performance
- [ ] **Dependências Validadas**: Listar todas dependências encontradas
- [ ] **Riscos Atualizados**: Adicionar riscos novos identificados

---

### 4. Implementar SymbolSelector Component

**Arquivo:** `frontend/src/components/tradingview/SymbolSelector.tsx`

**Checklist:**
- [ ] **Interface Props**: SymbolSelectorProps definida
- [ ] **State Management**: useState para searchQuery
- [ ] **Filter Logic**: useMemo para filteredSymbols
- [ ] **Shadcn/ui Select**: Componente oficial usado
- [ ] **Search Input**: Input com ícone Search
- [ ] **TypeScript Strict**: 0 erros
- [ ] **Acessibilidade**: Labels + ARIA attributes
- [ ] **Export Default**: Componente exportado

---

### 5. Atualizar constants.ts com B3_SYMBOLS

**Arquivo:** `frontend/src/components/tradingview/constants.ts`

**Checklist:**
- [ ] **Array B3_SYMBOLS**: ~50 símbolos (IBOV + Blue Chips + Mid Caps)
- [ ] **Formato Correto**: `{ ticker, proName: "BMFBOVESPA:TICKER", description }`
- [ ] **Source Backend**: GET /api/v1/assets para popular lista
- [ ] **Readonly Array**: `as const` para type safety
- [ ] **Export Type**: `export type B3Symbol = typeof B3_SYMBOLS[number]`

---

### 6. Criar Página /tradingview

**Arquivo:** `frontend/src/app/(dashboard)/tradingview/page.tsx`

**Checklist:**

#### Header Section
- [ ] **Título**: "Análise TradingView" com ícone TrendingUp
- [ ] **Descrição**: Ferramentas profissionais B3
- [ ] **Documentation Accordion**: Shadcn/ui Accordion component
- [ ] **Guia de Uso**: 4-5 parágrafos inline

#### State Management
- [ ] **useState symbols**: `[string, string, string, string]` (4 símbolos)
- [ ] **useState activeTab**: String ("chart-1", "chart-2", etc)
- [ ] **Helper updateSymbol**: Função para atualizar símbolo específico

#### TickerTape Section
- [ ] **Import Component**: `import { TickerTape } from '@/components/tradingview/widgets/TickerTape'`
- [ ] **Sticky Position**: `className="sticky top-0 z-10"`
- [ ] **Render Correto**: Widget carrega IBOV + 10 Blue Chips

#### Multi-Chart Tabs
- [ ] **Shadcn/ui Tabs**: `<Tabs>` component usado
- [ ] **TabsList**: 4 triggers ("Gráfico 1" até "Gráfico 4")
- [ ] **TabsContent**: 4 contents com SymbolSelector + AdvancedChart
- [ ] **Lazy Loading**: Apenas tab ativa renderiza widget
- [ ] **Estado Independente**: Cada chart mantém símbolo próprio

#### Footer Disclaimer
- [ ] **Disclaimer Text**: Dados TradingView, sem recomendação investimento
- [ ] **Styling**: `bg-muted/50 rounded-lg text-xs`

---

### 7. Adicionar Rota no Sidebar

**Arquivo:** `frontend/src/components/layout/sidebar.tsx`

**Checklist:**
- [ ] **Import Ícone**: `import { TrendingUp } from 'lucide-react'`
- [ ] **Adicionar Rota**: `{ name: 'TradingView', href: '/tradingview', icon: TrendingUp }`
- [ ] **Posição Correta**: Entre "Gerenciamento de Dados" e "OAuth Manager"
- [ ] **Active State**: Validar que rota destaca quando ativa

---

### 8. Validação TypeScript + Build

**Checklist:**
- [ ] **Backend TypeScript**: `cd backend && npx tsc --noEmit` → 0 erros
- [ ] **Frontend TypeScript**: `cd frontend && npx tsc --noEmit` → 0 erros
- [ ] **Backend Build**: `cd backend && npm run build` → Success
- [ ] **Frontend Build**: `cd frontend && npm run build` → 19 páginas (+1 /tradingview)
- [ ] **ESLint**: `cd frontend && npm run lint` → 0 warnings
- [ ] **Screenshot**: Capturar output de build

---

### 9. Reiniciar Serviços e Validar Health

**Checklist:**
- [ ] **Down All**: `.\system-manager.ps1 down`
- [ ] **Up All**: `.\system-manager.ps1 up`
- [ ] **Aguardar 30s**: Containers inicializando
- [ ] **Status All**: `.\system-manager.ps1 status` → Todos UP
- [ ] **Frontend Health**: `curl http://localhost:3100` → 200 OK
- [ ] **Backend Health**: `curl http://localhost:3101/health` → 200 OK
- [ ] **Logs Clean**: `docker-compose logs -f --tail=20` sem erros críticos

---

### 10. Validação MCP Tripla (Playwright + DevTools + Sequential)

#### MCP #1 - Playwright

**Test Cases:**

```typescript
// TC1: Navegação e UI Inicial
1. Abrir http://localhost:3100/tradingview
2. Snapshot da página completa
3. Verificar: TickerTape visível (sticky top) ✅
4. Verificar: Tabs "Gráfico 1-4" renderizados ✅
5. Verificar: Documentation Accordion presente ✅
6. Screenshot: FASE_36_3_PLAYWRIGHT_UI_INICIAL.png

// TC2: SymbolSelector Funcional
1. Clicar dropdown "Gráfico 1 - Selecionar Ativo"
2. Verificar: 50+ símbolos carregados ✅
3. Digitar "PETR" no search
4. Verificar: Lista filtrada para PETR4, PETR3 ✅
5. Clicar "PETR4"
6. Verificar: AdvancedChart atualiza para PETR4 ✅
7. Screenshot: FASE_36_3_PLAYWRIGHT_SYMBOL_SELECTOR.png

// TC3: Multi-Chart Tabs
1. Clicar Tab "Gráfico 2"
2. Verificar: Widget carrega (lazy loading) ✅
3. Selecionar "VALE3"
4. Verificar: Widget atualiza ✅
5. Clicar Tab "Gráfico 1" novamente
6. Verificar: Símbolo anterior mantido (estado persistente) ✅
7. Screenshot: FASE_36_3_PLAYWRIGHT_TABS_NAVIGATION.png

// TC4: Dark/Light Mode Toggle
1. Clicar toggle dark mode (se disponível)
2. Verificar: TradingView widgets atualizam tema ✅
3. Aguardar 1-2s para re-render
4. Screenshot: FASE_36_3_PLAYWRIGHT_DARK_MODE.png
```

**Checklist:**
- [ ] **TC1-4 Executados**: 100% passing
- [ ] **Screenshots Capturados**: 4 evidências
- [ ] **Console 0 Errors**: Verificar console messages
- [ ] **Performance**: Tabs trocam em < 500ms

---

#### MCP #2 - Chrome DevTools

**Checklist:**

##### Console Messages
- [ ] **List All**: `list_console_messages({ types: ["error", "warn"] })`
- [ ] **0 Errors**: Nenhum erro crítico
- [ ] **Warnings TradingView OK**: Avisos conhecidos do widget
- [ ] **Screenshot**: `FASE_36_3_DEVTOOLS_CONSOLE.png`

##### Network Requests
- [ ] **List All**: `list_network_requests({ resourceTypes: ["script", "xhr"] })`
- [ ] **TradingView Script**: 200 OK (s3.tradingview.com/*)
- [ ] **GET /api/v1/assets**: 200 OK (se buscar símbolos do backend)
- [ ] **Widget Data**: 200 OK (TradingView data requests)

##### Performance Panel
- [ ] **Take Snapshot**: Durante troca de tabs
- [ ] **FPS > 30**: Animações suaves
- [ ] **Memory < 500MB**: Após carregar 4 charts (via tabs)
- [ ] **No Memory Leaks**: Memory não cresce indefinidamente

##### Payload Validation
- [ ] **Get Assets Request**: `get_network_request({ reqid: X })`
- [ ] **Response JSON**: Lista de 55 ativos B3
- [ ] **Screenshot**: `FASE_36_3_DEVTOOLS_PAYLOAD.png`

---

#### MCP #3 - Sequential Thinking

**Pontos de Análise:**

```typescript
// Thought 1: Arquitetura da Página
- Layout: Header + TickerTape + Tabs + Footer
- Estado: 4 símbolos independentes (array)
- Lazy loading: Apenas tab ativa renderiza widget

// Thought 2: Performance
- Tabs vs Grid: Tabs escolhidos (1 widget ativo = melhor performance)
- useMemo: Configs memoizados
- React.memo: Componentes memoizados

// Thought 3: UX
- SymbolSelector: Search + dropdown intuitivo
- Documentation: Accordion inline com guia
- Disclaimer: Footer com aviso legal

// Thought 4: Riscos Mitigados
- Rate limiting: Debounce no onChange (500ms)
- Temas: useTradingViewTheme hook sincroniza
- TypeScript: Strict mode 0 erros

// Thought 5: Integração
- Sidebar: Rota adicionada com ícone TrendingUp
- TradingView: Widgets já validados (FASE 36.2.2)
- Backend: Assets API fornece símbolos

// Thought 6: Acessibilidade
- ARIA labels: Todos inputs
- Keyboard navigation: Tab/Enter funcionam
- Screen reader: Leitura correta

// Thought 7: Dados Reais
- Símbolos: GET /api/v1/assets (55 ativos B3)
- Widgets: TradingView fornece dados em tempo real
- Sem mocks: Tudo vem de fontes reais

// Thought 8: Conclusão
- Score: 95/100
- Recomendação: PRONTO PARA MERGE
```

**Checklist:**
- [ ] **8+ Thoughts**: Análise profunda completa
- [ ] **Score ≥ 95**: Alta qualidade de código
- [ ] **Problemas Identificados**: Lista de issues (se houver)
- [ ] **Screenshot**: `FASE_36_3_SEQUENTIAL_THINKING.png`

---

### 11. Screenshots de Evidência (3 MCPs)

**Checklist:**
- [ ] **Playwright (4)**: UI inicial, symbol selector, tabs, dark mode
- [ ] **DevTools (2)**: Console, payload
- [ ] **Sequential Thinking (1)**: Output de análise
- [ ] **Total: 7 screenshots**

---

### 12. Criar VALIDACAO_FASE_36_3.md

**Arquivo:** `VALIDACAO_FASE_36_3.md`

**Conteúdo Mínimo:**
- [ ] **Resumo Executivo**: Objetivo, status, score final
- [ ] **Test Cases**: 4 TCs Playwright documentados
- [ ] **Validação Tripla**: Resultados de 3 MCPs
- [ ] **Screenshots**: Referências aos 7 arquivos
- [ ] **Problemas Encontrados**: Lista com correções aplicadas
- [ ] **Scorecard Final**: Tabela com métricas (100/100)
- [ ] **Recomendação**: PRONTO PARA MERGE ou BLOQUEADO

---

### 13. Atualizar TODAS Documentações

**Checklist:**

#### ROADMAP.md
- [ ] **Seção FASE 36.3**: Criar entrada completa
- [ ] **Status**: ✅ 100% COMPLETO
- [ ] **Commits**: Listar commits realizados
- [ ] **Arquivos**: Tabela de arquivos modificados
- [ ] **Validação**: Referência a VALIDACAO_FASE_36_3.md

#### CLAUDE.md
- [ ] **Exemplo FASE 36.3**: Adicionar se metodologia nova aplicada
- [ ] **Lições Aprendidas**: Se houver aprendizados novos

#### README.md
- [ ] **Feature TradingView**: Adicionar na lista de features
- [ ] **Screenshot**: Opcional (página /tradingview)

#### ARCHITECTURE.md
- [ ] **TradingView Integration**: Documentar se mudanças estruturais

---

### 14. Git: Commit + Push + Atualizar PR

**Checklist:**

#### Preparar Commit
- [ ] **git add**: Todos arquivos novos/modificados
- [ ] **git status**: Verificar lista de arquivos
- [ ] **git diff --cached**: Revisar mudanças

#### Criar Commit
```bash
git commit -m "$(cat <<'EOF'
feat(frontend): FASE 36.3 - TradingView Page Completa

**Implementação:**
- ✅ Página /tradingview com multi-chart tabs (4 gráficos)
- ✅ SymbolSelector component (50+ símbolos B3)
- ✅ Rota no sidebar (ícone TrendingUp)
- ✅ Documentation inline (accordion com guia de uso)
- ✅ Lazy loading (apenas tab ativa renderiza)

**Arquivos Criados:**
- frontend/src/app/(dashboard)/tradingview/page.tsx (~300 linhas)
- frontend/src/components/tradingview/SymbolSelector.tsx (~150 linhas)

**Arquivos Modificados:**
- frontend/src/components/tradingview/constants.ts (+50 linhas B3_SYMBOLS)
- frontend/src/components/layout/sidebar.tsx (+1 linha rota)

**Validação Tripla MCP:**
- ✅ Playwright: 4/4 test cases passing (UI + symbol selector + tabs + dark mode)
- ✅ Chrome DevTools: Console 0 errors, performance FPS > 30, memory < 500MB
- ✅ Sequential Thinking: Score 95/100, arquitetura validada

**Documentação:**
- PLANO_FASE_36_3_TRADINGVIEW_PAGE.md (600 linhas)
- VALIDACAO_FASE_36_3.md (400 linhas)
- CHECKLIST_ULTRA_ROBUSTO_FASE_37_E_36_3.md (este arquivo)
- ROADMAP.md atualizado (seção FASE 36.3)

**Status:**
✅ TypeScript: 0 erros (backend + frontend)
✅ Build: Success (19 páginas - +1 /tradingview)
✅ Performance: FPS > 30, memory < 500MB
✅ Acessibilidade: WAVE 0 errors
✅ Dados Reais: 55 ativos B3 (sem mocks)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

#### Push e Atualizar PR
- [ ] **git push origin feature/dashboard-financial-complete**
- [ ] **Verificar GitHub**: Commits no PR #4
- [ ] **Atualizar Descrição PR**: Adicionar FASE 36.3

---

## ✅ CRITÉRIOS DE ACEITAÇÃO FINAIS

### FASE 37 (Revisão)

- [ ] **Git Limpo**: 0 arquivos modified/untracked não intencionais
- [ ] **TypeScript: 0 erros**
- [ ] **Build: Success**
- [ ] **MCP Triplo: 100%**
- [ ] **Documentação Atualizada**
- [ ] **Commits Pushed**

### FASE 36.3 (Implementação)

- [ ] **Página /tradingview Funcional**
- [ ] **4 Charts em Tabs**
- [ ] **SymbolSelector Funcional**
- [ ] **Rota no Sidebar**
- [ ] **TypeScript: 0 erros**
- [ ] **Build: 19 páginas**
- [ ] **Performance: FPS > 30, Memory < 500MB**
- [ ] **MCP Triplo: 95+/100**
- [ ] **Screenshots: 7 evidências**
- [ ] **Documentação: 3 arquivos**

---

## 🐛 PROBLEMAS CRÔNICOS IDENTIFICADOS

### 1. Git Sujo (CRÍTICO - FASE 37)

**Problema:**
- 12 arquivos modified não commitados
- 15+ arquivos untracked
- system-manager.ps1 deletado acidentalmente

**Correção Definitiva:**
- ✅ Restaurar system-manager.ps1
- [ ] Analisar cada arquivo modified
- [ ] Commitar mudanças intencionais (WebSocket events)
- [ ] Reverter ou deletar mudanças acidentais
- [ ] Criar .gitignore entries se necessário

**Validação:**
- [ ] `git status` mostra apenas arquivos intencionais
- [ ] `git diff --stat` vazio após commit

---

### 2. Arquivos de Test Results Commitados

**Problema:**
- `frontend/test-results.json` (4353 linhas modificadas)
- `frontend/test-results/.last-run.json` (47 linhas modificadas)

**Análise:**
- São arquivos gerados por testes Playwright
- Não devem ser commitados (dados temporários)

**Correção Definitiva:**
- [ ] Adicionar ao .gitignore:
```
frontend/test-results.json
frontend/test-results/.last-run.json
frontend/test-results/
```
- [ ] Reverter mudanças: `git restore frontend/test-results*`

---

### 3. Arquivos Untracked (Backend Scripts)

**Problema:**
```
backend/scripts/measure-sync.ts
backend/scripts/sync-all-assets-full-history.js
backend/scripts/validate-api-precision.ts
backend/scripts/validate-precision.ts
```

**Análise:**
- Scripts criados durante desenvolvimento
- Podem ser úteis para manutenção futura

**Decisão:**
- [ ] **Se úteis**: Commitar com documentação inline
- [ ] **Se temporários**: Deletar ou mover para pasta `temp/`

---

### 4. Economic Indicators (Não Documentado)

**Problema:**
```
backend/src/api/economic-indicators/
backend/src/database/entities/economic-indicator.entity.ts
backend/src/database/migrations/1763728696267-CreateEconomicIndicators.ts
```

**Análise:**
- Parece ser feature nova não documentada
- Não mencionada em ROADMAP ou FASE atual

**Decisão:**
- [ ] **Se FASE futura**: Mover para branch separada
- [ ] **Se incompleto**: Deletar e re-implementar com planejamento
- [ ] **Se completo**: Documentar em ROADMAP (FASE nova)

---

## 🎯 RESUMO EXECUTIVO

**FASE 37 Status:**
- ⚠️ **GIT SUJO** - BLOQUEANTE para FASE 36.3
- ✅ **TypeScript**: Assumido 0 erros (validar)
- ✅ **Build**: Assumido Success (validar)
- ⏳ **MCP Triplo**: PENDENTE (executar após git limpo)

**FASE 36.3 Status:**
- ⏳ **AGUARDANDO**: FASE 37 100% completa
- 📋 **PLANEJADO**: PLANO_FASE_36_3 criado (600 linhas)
- 📋 **CHECKLIST**: Este arquivo (100+ itens)

**Próximos Passos:**
1. ✅ Restaurar system-manager.ps1 (COMPLETO)
2. ⏳ Limpar git (analisar 12 modified + 15 untracked)
3. ⏳ Commitar mudanças intencionais
4. ⏳ Validar TypeScript + Build
5. ⏳ MCP Triplo FASE 37
6. ⏳ Implementar FASE 36.3

**Estimativa de Tempo:**
- FASE 37 Revisão: 2-3 horas
- FASE 36.3 Implementação: 6.5 horas
- **Total:** ~9 horas

---

**Checklist criado por:** Claude Code (Sonnet 4.5)
**Metodologia:** Ultra-Thinking + TodoWrite + Validação Tripla MCP
**Data:** 2025-11-21

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
