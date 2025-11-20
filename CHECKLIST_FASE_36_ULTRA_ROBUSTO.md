# CHECKLIST ULTRA-ROBUSTO - FASE 36 TRADINGVIEW WIDGETS

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Data Criação:** 2025-11-20
**Responsável:** Claude Code (Sonnet 4.5)
**Versão:** 1.0.0
**Baseado em:** FASE 35 Methodology (CLAUDE.md)

---

## 📋 ÍNDICE

1. [Como Usar Este Checklist](#como-usar-este-checklist)
2. [Checklist Pré-Implementação](#checklist-pré-implementação)
3. [Checklist Implementação](#checklist-implementação)
4. [Checklist Validação Backend](#checklist-validação-backend)
5. [Checklist Validação Frontend (Playwright MCP)](#checklist-validação-frontend-playwright-mcp)
6. [Checklist Validação Frontend (Chrome DevTools MCP)](#checklist-validação-frontend-chrome-devtools-mcp)
7. [Checklist Problemas Crônicos](#checklist-problemas-crônicos)
8. [Checklist Documentação](#checklist-documentação)
9. [Checklist Git](#checklist-git)
10. [Checklist Planejamento Próxima Fase](#checklist-planejamento-próxima-fase)

---

## Como Usar Este Checklist

### Princípios

✅ **Zero-Tolerance Policy:**
- TypeScript: 0 erros (backend + frontend)
- ESLint: 0 warnings
- Build: 100% success
- Console: 0 erros
- Dados: 0 manipulação (sistema financeiro - precisão total)

✅ **Metodologia Obrigatória:**
1. **Ultra-Thinking** - Análise profunda antes de implementar
2. **TodoWrite** - Organização em etapas atômicas
3. **Implementação** - Com validação contínua
4. **Documentação** - Registro completo

✅ **Validação Tripla MCP (OBRIGATÓRIA):**
1. **Playwright MCP** - UI + Interações
2. **Chrome DevTools MCP** - Console + Network + Payload
3. **Sequential Thinking MCP** - Análise lógica (quando necessário)

✅ **Regras de Ouro:**
- ❌ **NÃO mentir** (sempre reportar problemas reais)
- ❌ **NÃO ter pressa** (qualidade > velocidade)
- ❌ **NÃO quebrar nada** (testar antes de commitar)
- ✅ **Revisar 100% fase anterior** antes de avançar
- ✅ **Git sempre atualizado** (branch mergeada)
- ✅ **Documentação atualizada** (CLAUDE.md, ROADMAP.md)
- ✅ **Usar system-manager.ps1** para ambiente
- ✅ **Dados reais** (scrapers), nunca mocks
- ✅ **Corrigir definitivamente** (não workarounds)
- ✅ **Verificar dependências** antes de mudanças
- ✅ **Screenshots validação** (MCPs janelas separadas)
- ✅ **React Developer Tools** para debug UI

### Quando Usar

**Use este checklist ANTES de:**
- Implementar nova fase (FASE 2, 3, 4, etc.)
- Fazer commit (validação completa)
- Avançar para próxima etapa
- Modificar arquivos críticos
- Atualizar dependências
- Fazer merge/push

**NÃO avance sem:**
- [ ] 100% checklist pré-implementação completo
- [ ] 100% checklist implementação completo
- [ ] 100% checklist validação backend completo
- [ ] 100% checklist validação frontend (ambos MCPs) completo
- [ ] 100% checklist documentação completo
- [ ] 100% checklist git completo

---

## Checklist Pré-Implementação

Use este checklist **ANTES** de iniciar qualquer fase/etapa.

### 1. TodoWrite

- [ ] **TodoWrite criado** com etapas atômicas (≥ 3 etapas por tarefa)
- [ ] **Ordem sequencial** definida (dependências identificadas)
- [ ] **Apenas 1 in_progress** por vez (foco total)
- [ ] **activeForm presente** em todos os itens

### 2. Arquivos Relevantes

- [ ] **Lidos TODOS os arquivos** relacionados (DTOs, Services, Components, Hooks)
- [ ] **Dependências identificadas** (imports, exports)
- [ ] **Padrões de código analisados** (convenções existentes)
- [ ] **Integrações mapeadas** (backend ↔ frontend ↔ database)

### 3. Decisões Técnicas

- [ ] **Abordagem definida** (enums, agregação, validação)
- [ ] **Type Safety garantido** (interfaces TypeScript)
- [ ] **Performance considerada** (lazy loading, memoization)
- [ ] **Documentadas decisões** (comentários ou doc dedicado)

### 4. Impacto Analisado

- [ ] **Backend afetado?** (rotas, services, DTOs, migrations)
- [ ] **Frontend afetado?** (components, hooks, pages)
- [ ] **Database afetado?** (schema changes, migrations)
- [ ] **Configuração afetada?** (env vars, next.config.js)

### 5. Ambiente Validado

- [ ] **Docker containers rodando** (8/8 healthy):
  - [ ] backend (port 3101)
  - [ ] frontend (port 3100)
  - [ ] postgres (port 5532)
  - [ ] redis (port 6479)
  - [ ] api-service
  - [ ] python-service (port 8001)
  - [ ] orchestrator
  - [ ] scrapers (VNC 5900/6080)

- [ ] **Services acessíveis:**
  - [ ] http://localhost:3101/api/v1/health (backend healthy)
  - [ ] http://localhost:3100 (frontend loading)
  - [ ] http://localhost:8001/docs (python-service Swagger)

- [ ] **Reiniciar se necessário:**
  ```bash
  # Se backend mudou:
  docker-compose restart backend

  # Se frontend mudou:
  docker-compose restart frontend
  ```

---

## Checklist Implementação

Use este checklist **DURANTE** a implementação.

### 1. Código Implementado

- [ ] **Código escrito** seguindo decisões técnicas
- [ ] **Imports organizados** (React, third-party, local)
- [ ] **Props tipadas** (TypeScript interfaces)
- [ ] **Error handling** presente (try/catch onde necessário)
- [ ] **Loading states** implementados (UI feedback)

### 2. TypeScript

- [ ] **Backend: 0 erros** - `cd backend && npx tsc --noEmit`
- [ ] **Frontend: 0 erros** - `cd frontend && npm run type-check`
- [ ] **Todos tipos exportados** corretamente
- [ ] **Generics usados** corretamente (se aplicável)

### 3. ESLint

- [ ] **Frontend: 0 warnings** - `cd frontend && npm run lint`
- [ ] **Regras seguidas** (no-anonymous-default-export, exhaustive-deps, etc.)
- [ ] **Comentários justificados** (se desabilitar regra)

### 4. Build

- [ ] **Backend: Success** - `cd backend && npm run build`
- [ ] **Frontend: Success** - `cd frontend && npm run build`
- [ ] **Número de páginas mantido** (17 páginas ou mais se novas)
- [ ] **Bundle size aceitável** (< 200kb First Load JS por rota)

### 5. TodoWrite Atualizado

- [ ] **Etapa atual marcada completed** imediatamente após conclusão
- [ ] **Próxima etapa marcada in_progress** (apenas 1)
- [ ] **Sem etapas esquecidas** (todas no status correto)

---

## Checklist Validação Backend

Use este checklist para validar **BACKEND** com **dados reais**.

### 1. Dados Reais (NÃO Mocks)

- [ ] **≥ 3 cenários testados** manualmente (não mocks)
- [ ] **Dados COTAHIST B3** sem manipulação confirmados
- [ ] **Precisão mantida** (decimal places corretos, valores exatos)
- [ ] **Sem arredondamento** (valores financeiros intactos)

### 2. Performance

- [ ] **Endpoints críticos < 100ms** (market-data/prices)
- [ ] **Queries otimizadas** (sem N+1, indexes usados)
- [ ] **Payload razoável** (< 1MB por request)

### 3. Validação OHLC (se aplicável)

- [ ] **Open = first(period)** - Correto
- [ ] **High = MAX(period)** - Correto
- [ ] **Low = MIN(period)** - Correto
- [ ] **Close = last(period)** - Correto
- [ ] **Volume = SUM(period)** - Correto

### 4. Logs

- [ ] **Sem erros no console** backend
- [ ] **Logs informativos** (não excessivos)
- [ ] **Problemas críticos logados** (warn/error levels)

---

## Checklist Validação Frontend (Playwright MCP)

Use este checklist para validar **FRONTEND** com **Playwright MCP**.

### 1. Navegação

- [ ] **Navegado para URL** - `mcp__playwright__browser_navigate`
  ```typescript
  await mcp__playwright__browser_navigate({
    url: "http://localhost:3100/assets/ABEV3"
  });
  ```

### 2. UI Snapshot

- [ ] **Snapshot capturado** - `mcp__playwright__browser_snapshot`
  ```typescript
  await mcp__playwright__browser_snapshot();
  ```
- [ ] **Componente renderizado** corretamente (verificar output)
- [ ] **Texto esperado presente** (verificar labels, buttons)
- [ ] **Layout correto** (verificar estrutura HTML)

### 3. Interações

- [ ] **Clicks funcionando** - `mcp__playwright__browser_click`
  ```typescript
  await mcp__playwright__browser_click({
    element: "Button 1W",
    ref: "..."
  });
  ```
- [ ] **Forms funcionando** - `mcp__playwright__browser_fill_form` (se aplicável)
- [ ] **Keyboard navigation** funcionando (se aplicável)

### 4. Console

- [ ] **Console: 0 erros** - `mcp__playwright__browser_console_messages`
  ```typescript
  await mcp__playwright__browser_console_messages({ types: ["error"] });
  ```
- [ ] **Warnings esperados OK** (ignorar apenas se justificados)

### 5. Screenshot

- [ ] **Screenshot capturado** - `mcp__playwright__browser_take_screenshot`
  ```typescript
  await mcp__playwright__browser_take_screenshot({
    filename: "FASE_X_VALIDACAO_PLAYWRIGHT.png",
    fullPage: true
  });
  ```
- [ ] **Screenshot salvo** em pasta organizada
- [ ] **Nome descritivo** (FASE_X_COMPONENT_Y.png)

---

## Checklist Validação Frontend (Chrome DevTools MCP)

Use este checklist para validar **FRONTEND** com **Chrome DevTools MCP**.

### 1. Página Aberta

- [ ] **Navegado para URL** - `mcp__chrome-devtools__navigate_page`
  ```typescript
  await mcp__chrome-devtools__navigate_page({
    url: "http://localhost:3100/assets/ABEV3",
    type: "url"
  });
  ```

### 2. Snapshot Detalhado

- [ ] **Snapshot capturado** - `mcp__chrome-devtools__take_snapshot`
  ```typescript
  await mcp__chrome-devtools__take_snapshot();
  ```
- [ ] **Elementos com uid** identificados
- [ ] **Estrutura a11y correta** (acessibilidade)

### 3. Console Messages

- [ ] **Console listado** - `mcp__chrome-devtools__list_console_messages`
  ```typescript
  await mcp__chrome-devtools__list_console_messages({
    types: ["error"]
  });
  ```
- [ ] **0 erros confirmados** (ou justificados)
- [ ] **Warnings analisados** (corrigir se possível)

### 4. Network Requests

- [ ] **Requests listados** - `mcp__chrome-devtools__list_network_requests`
  ```typescript
  await mcp__chrome-devtools__list_network_requests({
    resourceTypes: ["xhr", "fetch"]
  });
  ```
- [ ] **Todos 200 OK** (ou esperados 404/403 justificados)
- [ ] **Sem requests desnecessários** (otimização)

### 5. Payload Validation

- [ ] **Request analisado** - `mcp__chrome-devtools__get_network_request`
  ```typescript
  await mcp__chrome-devtools__get_network_request({ reqid: 15 });
  ```
- [ ] **Dados COTAHIST B3 sem manipulação** confirmado:
  ```json
  {
    "date": "2020-10-19",
    "open": 12.33,  // ✅ Valor exato COTAHIST
    "high": 12.45,
    "low": 12.30,
    "close": 12.40,
    "volume": 24428400,  // ✅ Valor exato
    "adjustedClose": 12.40
  }
  ```
- [ ] **Sem arredondamento** (precisão mantida)
- [ ] **Types corretos** (number, string, boolean)

### 6. Screenshot Final

- [ ] **Screenshot capturado** - `mcp__chrome-devtools__take_screenshot`
  ```typescript
  await mcp__chrome-devtools__take_screenshot({
    filePath: "FASE_X_VALIDACAO_CHROME_DEVTOOLS.png"
  });
  ```
- [ ] **Screenshot salvo** em pasta organizada
- [ ] **Nome descritivo** (FASE_X_COMPONENT_Y_DEVTOOLS.png)

---

## Checklist Problemas Crônicos

Use este checklist para **CORRIGIR DEFINITIVAMENTE** problemas crônicos (não workarounds).

### 1. Problema Identificado

- [ ] **Problema documentado** (descrição clara)
- [ ] **Causa raiz identificada** (não sintoma)
- [ ] **Impacto analisado** (crítico/alto/médio/baixo)
- [ ] **Frequência documentada** (sempre/frequente/raro)

### 2. Solução Definitiva

- [ ] **Solução definitiva implementada** (não workaround temporário)
- [ ] **Arquivos modificados documentados** (+X/-Y linhas)
- [ ] **Regressão testada** (todos cenários anteriores validados)
- [ ] **Justificativa técnica documentada** (por que essa solução)

### 3. Exemplo (FASE 35 - Enum Incompatível)

**❌ Problema Identificado:**
```typescript
// get-technical-data.dto.ts (ANTES)
enum Timeframe {
  ONE_DAY = '1D',
  ONE_MONTH = '1MO',  // ❌ Incompatível com novos valores
  THREE_MONTHS = '3MO',
}
```

**✅ Solução Definitiva:**
```typescript
// get-technical-data.dto.ts (DEPOIS)
import { CandleTimeframe, ViewingRange } from './get-prices.dto';

export class GetTechnicalDataDto {
  @IsEnum(CandleTimeframe)
  timeframe?: CandleTimeframe = CandleTimeframe.ONE_DAY;  // ✅ 1D/1W/1M

  @IsEnum(ViewingRange)
  range?: ViewingRange = ViewingRange.ONE_YEAR;  // ✅ 1mo/3mo/1y/2y/5y/max
}
```

**Arquivos Modificados:**
- `get-technical-data.dto.ts` (+8/-15 linhas)
- `market-data.controller.ts` (+2/-2 linhas)
- `market-data.service.ts` (+3/-2 linhas)

**Resultado:**
- ✅ HTTP 400 eliminado permanentemente
- ✅ 1W/1M buttons funcionando corretamente
- ✅ 0 regressões (validado com todos cenários)

### 4. Validação Pós-Correção

- [ ] **Problema não ocorre mais** (testado ≥ 3 cenários)
- [ ] **Sem novos problemas introduzidos** (regressão testada)
- [ ] **Documentado em ROADMAP.md** (ou arquivo específico)

---

## Checklist Documentação

Use este checklist para manter **DOCUMENTAÇÃO ATUALIZADA**.

### 1. ROADMAP.md

- [ ] **Entrada completa criada** (FASE X - Nome)
- [ ] **Data incluída** (2025-XX-XX)
- [ ] **Objetivo descrito** (o que foi feito)
- [ ] **Arquivos modificados listados** (+X/-Y linhas)
- [ ] **Validações realizadas listadas** (TypeScript, Build, MCPs)
- [ ] **Problemas corrigidos listados** (se aplicável)
- [ ] **Screenshots referenciados** (se aplicável)

### 2. CLAUDE.md

- [ ] **Metodologia nova aplicada?** Se SIM:
  - [ ] Documentar exemplo completo (como FASE 35)
  - [ ] Incluir código real (antes/depois)
  - [ ] Incluir métricas (tempo, linhas, arquivos)
  - [ ] Incluir lições aprendidas

- [ ] **Metodologia existente suficiente?** Se SIM:
  - [ ] Nenhuma atualização necessária

### 3. README.md (módulo específico)

- [ ] **Se novo módulo:** Criar README.md completo
  - [ ] Overview e features
  - [ ] Installation
  - [ ] Quick start (≥ 3 exemplos)
  - [ ] API reference
  - [ ] Troubleshooting
  - [ ] Examples

- [ ] **Se módulo existente:** Atualizar se necessário
  - [ ] Novos componentes/hooks listados
  - [ ] Exemplos atualizados
  - [ ] API changes documentadas

### 4. Screenshots

- [ ] **Screenshots organizados** em pastas estruturadas:
  ```
  docs/
    screenshots/
      FASE_36/
        FASE_1/
          01_types_created.png
          02_hooks_created.png
        FASE_2/
          01_tickertape_widget.png
          02_marketoverview_widget.png
  ```

- [ ] **Nomes descritivos** (FASE_X_COMPONENT_Y_ESTADO.png)
- [ ] **Referenciados em docs** (ROADMAP.md, README.md)

---

## Checklist Git

Use este checklist para **COMMITAR** corretamente.

### 1. Git Status

- [ ] **Verificar arquivos modificados** - `git status`
- [ ] **Apenas arquivos intencionais** (não incluir .env, logs, cache)
- [ ] **Arquivos intencionais identificados** (listar mentalmente)

### 2. Git Add

- [ ] **Add arquivos relevantes** - `git add <files>`
  ```bash
  # Exemplo FASE 1
  git add frontend/package.json
  git add frontend/package-lock.json
  git add frontend/src/components/tradingview/
  git add FASE_36_TRADINGVIEW_WIDGETS_PLANEJAMENTO_COMPLETO.md
  git add CHECKLIST_FASE_36_ULTRA_ROBUSTO.md
  ```

### 3. Validação Pré-Commit

**OBRIGATÓRIO antes de commitar:**

- [ ] **Backend TypeScript: 0 erros** - `cd backend && npx tsc --noEmit`
- [ ] **Frontend TypeScript: 0 erros** - `cd frontend && npm run type-check`
- [ ] **Frontend ESLint: 0 warnings** - `cd frontend && npm run lint`
- [ ] **Backend Build: Success** - `cd backend && npm run build`
- [ ] **Frontend Build: Success** - `cd frontend && npm run build`

### 4. Commit Message (Conventional Commits)

**Estrutura:**
```
<tipo>: <descrição curta (max 72 chars)>

<corpo detalhado:
- Problema identificado (se fix)
- Solução implementada
- Arquivos modificados (+X/-Y linhas)
- Validações realizadas (checklist)>

**Arquivos Modificados:**
- arquivo1.ts (+X linhas)
- arquivo2.tsx (+Y/-Z linhas)

**Validação:**
- ✅ TypeScript: 0 erros (backend + frontend)
- ✅ ESLint: 0 warnings
- ✅ Build: Success (17 páginas)
- ✅ Playwright MCP: UI OK, console 0 erros
- ✅ Chrome DevTools MCP: Network 200 OK, payload COTAHIST validado

**Documentação:**
- ROADMAP.md atualizado (FASE X entrada completa)
- README.md atualizado (se novo módulo)
- Screenshots organizados (3 evidências)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `refactor`: Refatoração (sem mudança comportamento)
- `test`: Testes
- `chore`: Manutenção/config
- `perf`: Performance

**Exemplo Real (FASE 1):**
```bash
git commit -m "$(cat <<'EOF'
feat(frontend): Adicionar infraestrutura base TradingView Widgets - FASE 1

Implementa fundação completa para integração de 22 widgets TradingView gratuitos com B3:
- Types completos (49 tipos TypeScript)
- Constants B3 (40 símbolos, 15 estudos)
- 4 hooks reutilizáveis (Widget, Theme, LazyLoad, Navigation)
- 3 utils (SymbolFormatter, ConfigBuilder, PerformanceMonitor)
- README.md profissional (15k+ linhas)

**Arquivos Criados (10):**
- frontend/src/components/tradingview/types.ts (+843 linhas)
- frontend/src/components/tradingview/constants.ts (+700 linhas)
- frontend/src/components/tradingview/README.md (+15000 linhas)
- frontend/src/components/tradingview/hooks/useTradingViewWidget.ts (+308 linhas)
- frontend/src/components/tradingview/hooks/useTradingViewTheme.ts (+133 linhas)
- frontend/src/components/tradingview/hooks/useWidgetLazyLoad.ts (+175 linhas)
- frontend/src/components/tradingview/hooks/useSymbolNavigation.ts (+190 linhas)
- frontend/src/components/tradingview/utils/symbolFormatter.ts (+280 linhas)
- frontend/src/components/tradingview/utils/widgetConfigBuilder.ts (+300 linhas)
- frontend/src/components/tradingview/utils/performanceMonitor.ts (+340 linhas)

**Correções Aplicadas:**
- Fix TypeScript re-export conflicts (types.ts)
- Fix ESLint anonymous default exports (3 utils)

**Validação:**
- ✅ TypeScript: 0 erros (backend + frontend)
- ✅ ESLint: 0 warnings (3 corrigidos)
- ✅ Build: Success (17 páginas compiladas)
- ✅ Total linhas: ~18.000 (código + documentação)

**Documentação:**
- README.md criado (tradingview/) - 15k+ linhas
- CHECKLIST_FASE_36_ULTRA_ROBUSTO.md criado

**Próxima Fase:**
- FASE 2: Implementar 5 widgets P1 (TickerTape, MarketOverview, Screener, TechnicalAnalysis, EconomicCalendar)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

### 5. Git Commit

- [ ] **Commitar** - `git commit` (com mensagem acima)
- [ ] **Verificar commit** - `git log -1 --stat` (conferir arquivos)

### 6. Git Push

- [ ] **Push para origin** - `git push origin main`
- [ ] **Verificar push** - `git log origin/main -1` (conferir remoto)
- [ ] **Branch atualizada** (local e remoto sincronizados)

---

## Checklist Planejamento Próxima Fase

Use este checklist para **PLANEJAR** próxima fase corretamente.

### 1. Análise Arquivos Reais

- [ ] **Ler arquivos relacionados** (não apenas documentação)
- [ ] **Documentação pode estar desatualizada** (verificar código real)
- [ ] **Padrões de código identificados** (convenções existentes)
- [ ] **Dependências mapeadas** (imports, exports)

### 2. Pesquisa Melhores Práticas

- [ ] **WebSearch realizado** (práticas atualizadas 2025):
  ```typescript
  mcp__websearch({
    query: "best practices [tecnologia] 2025"
  });

  mcp__websearch({
    query: "[tecnologia] production ready checklist"
  });
  ```

- [ ] **Context7 MCP consultado** (documentação oficial):
  ```typescript
  // 1. Resolver library ID
  mcp__context7__resolve-library-id({
    libraryName: "next-themes"
  });

  // 2. Obter docs atualizados
  mcp__context7__get-library-docs({
    context7CompatibleLibraryID: "/pacocoursey/next-themes",
    topic: "dark mode integration best practices"
  });
  ```

- [ ] **Critérios validados**:
  - [ ] Publicado últimos 2 anos (2023+)
  - [ ] Fonte confiável (documentação oficial, Medium, dev.to)
  - [ ] Exemplos funcionais
  - [ ] Comentários/upvotes positivos (se Stack Overflow)

### 3. Checklist Específico

- [ ] **Checklist criado** para próxima fase (baseado neste template)
- [ ] **Adaptado ao contexto** (backend, frontend, widgets, etc.)
- [ ] **Dependências identificadas** (o que precisa estar pronto antes)
- [ ] **Riscos mapeados** (possíveis problemas antecipados)

### 4. TodoWrite Detalhado

- [ ] **TodoWrite criado** com etapas atômicas (granular)
- [ ] **Ordem sequencial** (dependências respeitadas)
- [ ] **Critérios aprovação** definidos por etapa
- [ ] **Apenas 1 in_progress** por vez (lembrar regra)

---

## 🎯 Resumo Executivo

**Use este checklist SEMPRE:**
- ✅ Antes de implementar (Pré-Implementação)
- ✅ Durante implementação (Implementação)
- ✅ Após implementação (Validação Backend + Frontend MCPs)
- ✅ Antes de commitar (Git)
- ✅ Antes de avançar fase (Planejamento)

**Nunca avance sem:**
- [ ] 100% checklist atual completo
- [ ] 0 erros TypeScript (backend + frontend)
- [ ] 0 warnings ESLint
- [ ] Build Success (backend + frontend)
- [ ] Validação Tripla MCP (Playwright + Chrome DevTools)
- [ ] Documentação atualizada (ROADMAP.md mínimo)
- [ ] Git commit com mensagem detalhada
- [ ] Git push para origin/main

**Lembre-se:**
- ❌ NÃO mentir sobre problemas
- ❌ NÃO ter pressa (qualidade > velocidade)
- ❌ NÃO quebrar código existente
- ❌ NÃO usar mocks (dados reais COTAHIST B3)
- ❌ NÃO manipular dados financeiros (precisão total)
- ✅ Corrigir problemas definitivamente
- ✅ Validar com dados reais (scrapers)
- ✅ Screenshots em janelas separadas (MCPs)
- ✅ React Developer Tools para debug

---

**Baseado em:** FASE 35 Candle Timeframes (CLAUDE.md)
**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-20
**Versão:** 1.0.0
