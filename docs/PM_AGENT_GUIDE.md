# PM Expert Agent - Guia de Uso Completo

**Versão:** 1.0.0
**Data:** 2025-12-11
**Mantido por:** Claude Code (Opus 4.5)

---

## Visão Geral

O **PM Expert** é um sub-agent ultra-robusto que combina **4 roles em 1**:

| Role | Responsabilidades |
|------|-------------------|
| **Product Manager** | Pesquisa de mercado, análise competitiva, 30+ fontes de dados |
| **QA Lead** | Validação 100% do ecossistema, testes E2E, acessibilidade |
| **DevOps** | Monitoramento de infraestrutura, logs, troubleshooting |
| **Tech Lead** | Qualidade de código, dependências, arquitetura |

---

## Quando Usar o PM Expert

### Cenários Recomendados

| Cenário | Prioridade | Exemplo |
|---------|------------|---------|
| Validação completa do ecossistema | **ALTA** | "Validar 100% do sistema e reportar gaps" |
| Pesquisa de mercado | **ALTA** | "Pesquisar concorrentes e criar plano de melhoria" |
| Testes E2E massivos | **ALTA** | "Testar todas as 12 páginas com MCP Triplo" |
| Análise de concorrentes | **MÉDIA** | "Analisar features do StatusInvest" |
| Troubleshooting complexo | **MÉDIA** | "Investigar por que scraper X está falhando" |
| Auditoria de dependências | **MÉDIA** | "Verificar pacotes desatualizados e vulnerabilidades" |
| Auditoria de arquitetura | **BAIXA** | "Revisar estrutura de código do backend" |

### Quando NÃO Usar o PM Expert

- **Tarefas simples de código** → Use `backend-api-expert` ou `frontend-components-expert`
- **Correção de erros TypeScript** → Use `typescript-validation-expert`
- **Criar scrapers** → Use `scraper-development-expert`
- **Trabalhar com gráficos** → Use `chart-analysis-expert`
- **Criar jobs de queue** → Use `queue-management-expert`

---

## Como Invocar

### Invocação Explícita

```bash
# Validação completa
Use the pm-expert to validate 100% of the ecosystem and report all gaps

# Pesquisa de mercado
Use the pm-expert to research competitors (Fundamentei, StatusInvest, TradingView) and create improvement plan

# Testes E2E
Use the pm-expert to run E2E tests on all frontend pages using MCP Triplo

# Auditoria de dependências
Use the pm-expert to audit all npm and pip dependencies for updates and vulnerabilities

# Troubleshooting
Use the pm-expert to investigate why the backend is returning 500 errors on /api/v1/assets
```

### Invocação Automática

Claude Code detecta automaticamente quando usar o PM Expert baseado em palavras-chave:

- "validar 100%", "ecossistema completo", "auditoria completa"
- "pesquisa de mercado", "análise de concorrentes"
- "testes massivos", "E2E completo"
- "troubleshooting", "investigar gaps"

---

## Ferramentas Disponíveis

O PM Expert tem acesso completo às seguintes ferramentas:

### Operações de Arquivo

| Ferramenta | Uso |
|------------|-----|
| `Read` | Ler arquivos (código, docs, configs) |
| `Edit` | Editar arquivos existentes |
| `Write` | Criar novos arquivos |
| `Glob` | Buscar arquivos por padrão |
| `Grep` | Buscar conteúdo em arquivos |
| `Bash` | Executar comandos shell |

### Pesquisa Web

| Ferramenta | Uso |
|------------|-----|
| `WebFetch` | Buscar conteúdo de URLs específicas |
| `WebSearch` | Pesquisar na web |

### Sub-Agentes

| Ferramenta | Uso |
|------------|-----|
| `Task` | Lançar sub-agentes em paralelo |

### MCPs (Model Context Protocol)

| MCP | Ferramentas | Uso |
|-----|-------------|-----|
| **Playwright** | `browser_navigate`, `browser_snapshot`, `browser_take_screenshot`, `browser_click`, `browser_fill_form` | Testes E2E |
| **Chrome DevTools** | `take_snapshot`, `list_console_messages`, `list_network_requests`, `take_screenshot` | Debug de browser |
| **A11y** | `audit_webpage`, `get_summary` | Testes de acessibilidade |
| **Sequential Thinking** | `sequentialthinking` | Análise profunda |
| **React Context** | `get_component_map`, `take_snapshot` | Debug de componentes |

---

## Workflow de Validação

### Fase 1: Leitura de Documentação (OBRIGATÓRIO)

```bash
# Sempre começar lendo a documentação crítica
Read CLAUDE.md
Read ARCHITECTURE.md
Read DATABASE_SCHEMA.md
Read KNOWN-ISSUES.md
Read .gemini/context/financial-rules.md
```

### Fase 2: Verificação de Build

```bash
# Frontend - DEVE ter 0 erros
cd frontend && npx tsc --noEmit
npm run build
npm run lint

# Backend - DEVE ter 0 erros
cd backend && npx tsc --noEmit
npm run build
```

### Fase 3: Testes Frontend (MCP Triplo)

Para cada página, usar os 3 MCPs:

```javascript
// 1. Playwright - Navegação e Snapshot
mcp__playwright__browser_navigate({ url: "http://localhost:3100/dashboard" })
mcp__playwright__browser_snapshot({})
mcp__playwright__browser_take_screenshot({ filename: "dashboard.png", fullPage: true })

// 2. Chrome DevTools - Console e Network
mcp__chrome-devtools__take_snapshot({})
mcp__chrome-devtools__list_console_messages({ types: ["error", "warn"] })
mcp__chrome-devtools__list_network_requests({ resourceTypes: ["xhr", "fetch"] })

// 3. A11y - Acessibilidade
mcp__a11y__audit_webpage({ url: "http://localhost:3100/dashboard", tags: ["wcag2aa"] })
```

### Fase 4: Testes Backend

```bash
# Health check
curl http://localhost:3101/api/v1/health

# Endpoints autenticados
curl -H "Authorization: Bearer $TOKEN" http://localhost:3101/api/v1/assets
curl -H "Authorization: Bearer $TOKEN" http://localhost:3101/api/v1/portfolio
```

### Fase 5: Verificação de Infraestrutura

```powershell
# Usar system-manager.ps1
.\system-manager.ps1 health
.\system-manager.ps1 status

# Verificar logs
docker logs invest_backend --tail 100
docker logs invest_scrapers --tail 100
```

### Fase 6: Documentação de Findings

1. Criar relatório de validação
2. Atualizar `KNOWN-ISSUES.md` se necessário
3. Criar tasks para correção de gaps
4. Salvar screenshots como evidência

---

## Cobertura do Ecossistema

### Frontend (Next.js 14)

**Estatísticas:**
- 144 arquivos TypeScript/TSX
- 81+ componentes TSX
- 12 páginas autenticadas + 3 públicas
- 18 arquivos de teste Playwright

**Páginas a Validar:**

| Página | Rota | Prioridade |
|--------|------|------------|
| Dashboard | `/dashboard` | CRÍTICA |
| Assets | `/assets` | CRÍTICA |
| Asset Detail | `/assets/[ticker]` | CRÍTICA |
| Analysis | `/analysis` | ALTA |
| Portfolio | `/portfolio` | ALTA |
| Reports | `/reports` | MÉDIA |
| Data Sources | `/data-sources` | MÉDIA |
| Data Management | `/data-management` | MÉDIA |
| Discrepancies | `/discrepancies` | MÉDIA |
| OAuth Manager | `/oauth-manager` | BAIXA |
| Settings | `/settings` | BAIXA |
| Login | `/login` | CRÍTICA |
| Register | `/register` | MÉDIA |

### Backend (NestJS 10)

**Estatísticas:**
- 10 controllers
- 49+ services
- 23 entities TypeORM
- 6+ migrations

**Controllers:**

| Controller | Endpoints | Prioridade |
|------------|-----------|------------|
| AssetsController | 15 | CRÍTICA |
| AssetsUpdateController | 8 | ALTA |
| AnalysisController | 8 | ALTA |
| MarketDataController | 9 | ALTA |
| PortfolioController | 9 | ALTA |
| AuthController | 5 | CRÍTICA |
| ReportsController | 5 | MÉDIA |
| NewsController | 17 | MÉDIA |
| EconomicIndicatorsController | 4 | MÉDIA |
| DataSourcesController | 2 | BAIXA |

### Infraestrutura (Docker)

**Containers:** 13 serviços

| Serviço | Porta | Prioridade |
|---------|-------|------------|
| postgres | 5532 | CRÍTICA |
| redis | 6479 | CRÍTICA |
| backend | 3101 | CRÍTICA |
| frontend | 3100 | CRÍTICA |
| scrapers | 8000/8080 | ALTA |
| api-service | 8000 | ALTA |
| python-service | 8001 | ALTA |
| orchestrator | - | MÉDIA |
| pgadmin | 5150 | BAIXA |
| redis-commander | 8181 | BAIXA |
| nginx | 80/443 | BAIXA |

---

## Fontes de Dados (30+)

### Análise Fundamental

| Fonte | Tipo | Auth |
|-------|------|------|
| Fundamentei | Web | Google OAuth |
| Investidor10 | Web | Google OAuth |
| StatusInvest | Web | Google OAuth |
| Investsite | Web | Público |
| Fundamentus | Web | Público |
| TradingView | Web | Público |
| Google Finance | Web | Público |
| Griffin | Web | Público |

### Dados de Mercado

| Fonte | Tipo | Auth |
|-------|------|------|
| BRAPI | API | Token |
| Yahoo Finance | API | Público |
| Investing.com | Web | Público |
| ADVFN | Web | Público |
| B3 | Web | Público |

### Notícias

| Fonte | Tipo | Auth |
|-------|------|------|
| Bloomberg | Web | Público |
| Google News | Web | Público |
| Valor Econômico | Web | Público |
| Exame | Web | Público |
| InfoMoney | Web | Público |
| Estadão | Web | Público |

### Análise AI

| Fonte | Tipo | Uso |
|-------|------|-----|
| ChatGPT | Browser | Segunda opinião |
| Gemini | Browser | Segunda opinião |
| Claude | Browser | Segunda opinião |
| DeepSeek | Browser | Segunda opinião |
| Grok | Browser | Segunda opinião |
| Perplexity | Browser | Pesquisa |

### Dados Econômicos

| Fonte | Tipo | Auth |
|-------|------|------|
| BCB (Banco Central) | API | Público |
| ANBIMA | Web | Público |
| FRED | API | Público |
| IPEA | API | Público |

### Opções

| Fonte | Tipo | Auth |
|-------|------|------|
| Opcoes.net.br | Web | User/Pass |

---

## Testes Paralelos

O PM Expert pode lançar múltiplos sub-agentes em paralelo:

```javascript
// Lançar 6 agentes em paralelo para máxima cobertura
Task({ subagent_type: "e2e-testing-expert", prompt: "Test all frontend pages using MCP Triplo" })
Task({ subagent_type: "backend-api-expert", prompt: "Test all API endpoints" })
Task({ subagent_type: "Explore", prompt: "Validate infrastructure health" })
Task({ subagent_type: "typescript-validation-expert", prompt: "Ensure 0 TypeScript errors" })
Task({ subagent_type: "scraper-development-expert", prompt: "Test all Python scrapers" })
Task({ subagent_type: "Explore", prompt: "Check npm/pip dependencies for updates" })
```

---

## Quality Standards

### Zero Tolerance

| Métrica | Threshold | Consequência |
|---------|-----------|--------------|
| TypeScript errors | 0 | Build bloqueado |
| Build failures | 0 | Deploy bloqueado |
| Console errors | 0 critical | Investigação obrigatória |
| Failing requests | 0 (non-auth) | Bug reportado |

### Cross-Validation

- Mínimo 3 fontes por data point
- Threshold de discrepância: 10%
- Score de confiança calculado

### Evidências

- Screenshots para issues de UI
- Logs para issues de backend
- Métricas para issues de performance

---

## Troubleshooting

### Container não inicia

```bash
# Verificar status
docker ps -a

# Ver logs
docker logs invest_backend --tail 100

# Reiniciar
docker-compose restart backend
```

### Build falha

```bash
# Limpar caches
rm -rf node_modules/.cache
rm -rf .next

# Reinstalar
npm ci

# Rebuild
npm run build
```

### Erros TypeScript

```bash
# Verificar erros
npx tsc --noEmit

# Ver detalhes
npx tsc --noEmit 2>&1 | head -50
```

### Database issues

```bash
# Verificar conexão
docker exec invest_postgres pg_isready

# Rodar migrations
cd backend && npm run migration:run
```

---

## Documentação Relacionada

| Arquivo | Propósito |
|---------|-----------|
| `.claude/agents/pm-expert.md` | Definição do agente |
| `docs/VALIDATION_CHECKLIST.md` | Checklist de validação |
| `CLAUDE.md` | Regras do projeto |
| `ARCHITECTURE.md` | Arquitetura do sistema |
| `KNOWN-ISSUES.md` | Problemas conhecidos |

---

## Anti-Patterns

| Anti-Pattern | Por que é Ruim | O que Fazer |
|--------------|----------------|-------------|
| Pular leitura de docs | Pode ignorar regras críticas | Sempre ler CLAUDE.md primeiro |
| Testar sem build | Testa código quebrado | Build primeiro |
| Ignorar console errors | Esconde bugs reais | Investigar todos os erros |
| Aceitar dados sem validar | Dados incorretos | Cross-validate com 3+ fontes |
| Criar código duplicado | Inconsistência | Grep antes de criar |
| Quebrar ambiente | Downtime | Testar em isolamento |
| Mentir sobre resultados | Falsa confiança | Sempre verificar |

---

## Histórico de Versões

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0.0 | 2025-12-11 | Versão inicial |

---

**Última atualização:** 2025-12-11
**Mantido por:** Claude Code (Opus 4.5)
