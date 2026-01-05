# Zero Tolerance Policy

**Project:** B3 AI Analysis Platform
**Last Updated:** 2026-01-04
**Purpose:** Política de qualidade rigorosa - 0 erros obrigatório + delegação obrigatória de agents

---

## Overview

**Zero Tolerance** significa que NENHUM erro TypeScript, build ou console é aceitável em QUALQUER commit.

**Princípio:** Prevenir problemas > Corrigir problemas

---

## 0 Erros Obrigatório

### Validações Obrigatórias

| Validação | Comando | Resultado Esperado |
|-----------|---------|-------------------|
| TypeScript Backend | `cd backend && npx tsc --noEmit` | 0 errors |
| TypeScript Frontend | `cd frontend && npx tsc --noEmit` | 0 errors |
| Build Backend | `cd backend && npm run build` | Success |
| Build Frontend | `cd frontend && npm run build` | Success |
| Lint Frontend | `cd frontend && npm run lint` | 0 critical warnings |
| Console (Browser) | Chrome DevTools | 0 errors |

### Antes de CADA Commit

**OBRIGATÓRIO executar:**

```bash
# Backend
cd backend
npx tsc --noEmit  # Deve retornar 0 erros
npm run build     # Deve completar sem erros

# Frontend
cd frontend
npx tsc --noEmit  # Deve retornar 0 erros
npm run build     # Deve completar sem erros
npm run lint      # 0 critical warnings
```

**Atalho recomendado:**

```bash
# Criar script de validação
# scripts/validate-all.sh
#!/bin/bash
set -e  # Parar no primeiro erro

echo "🔍 Validando Backend..."
cd backend
npx tsc --noEmit
npm run build

echo "🔍 Validando Frontend..."
cd ../frontend
npx tsc --noEmit
npm run build
npm run lint

echo "✅ Zero Tolerance validado com sucesso!"
```

### Uso do Skill /validate-all

O projeto possui skill dedicado para validação completa:

```bash
/validate-all
```

**O que faz:**
1. Valida TypeScript (backend + frontend)
2. Executa builds
3. Roda linter
4. Reporta resultado consolidado

---

## Agent Delegation Enforcement ⭐ **NOVO**

**Zero Tolerance agora inclui:** Delegação obrigatória para agents especializados

### Regra de Delegação

**SEMPRE delegar para agent especializado quando:**

| Tipo de Mudança | Agent Obrigatório | Validação Enforced |
|-----------------|-------------------|--------------------|
| Backend API (controller, service, DTO) | `backend-api-expert` | ✅ TypeScript, Build, Tests |
| Frontend UI (component, page, hook) | `frontend-components-expert` | ✅ TypeScript, Build, Lint, A11y |
| Database (migration, entity, index) | `database-migration-expert` | ✅ Migration valid, Rollback works |
| Charts (candlestick, indicators) | `chart-analysis-expert` | ✅ Rendering, Console, Performance |
| Scrapers (Python, Playwright) | `scraper-development-expert` | ✅ Exit code 0, Data validated |
| TypeScript errors (> 5 errors) | `typescript-validation-expert` | ✅ 0 errors, No `any` types |
| BullMQ jobs (queue, processor) | `queue-management-expert` | ✅ Retry logic, Rate limiting |
| E2E tests / MCP Triplo | `e2e-testing-expert` | ✅ Playwright, DevTools, A11y |
| Documentation (ROADMAP, phase docs) | `documentation-expert` | ✅ Sync CLAUDE.md ↔ GEMINI.md |
| Phase completion / 100% validation | `pm-expert` | ✅ Ecosystem audit, Gaps report |

### Por Que Delegação é Obrigatória

**Delegação = Zero Tolerance Automatizado**

Quando você delega para um agent especializado:
- ✅ Agent **garante** 0 erros TypeScript antes de retornar
- ✅ Agent **executa** builds e valida sucesso
- ✅ Agent **testa** console errors (via MCPs)
- ✅ Agent **aplica** best practices automaticamente
- ✅ Agent **documenta** mudanças no mesmo commit

**Anti-pattern:**
```markdown
❌ "Vou fazer rápido aqui mesmo e validar depois"
   → Resultado: Commit com erros, retrabalho, Zero Tolerance violado
```

**Correto:**
```markdown
✅ "Vou delegar ao backend-api-expert para garantir qualidade"
   → Resultado: Agent valida tudo, retorna código 100% correto
```

### Como Funciona na Prática

#### Exemplo 1: Criar Endpoint (Backend)

**SEM delegação:**
```
1. Implementar controller manualmente
2. Esquecer validação de DTO
3. Commit com erro TypeScript
4. Build quebrado
5. Reverter commit
6. Corrigir erro
7. Commit novamente
⏱️ Tempo: 45 min + frustração
```

**COM delegação (backend-api-expert):**
```
1. Delegar: "Use backend-api-expert to create GET /dividends endpoint"
2. Agent cria controller + service + DTO + tests
3. Agent valida: 0 TS errors, build success, tests pass
4. Agent retorna código validado
5. Commit direto
⏱️ Tempo: 8 min + garantia de qualidade
```

#### Exemplo 2: Validar Fase Completa

**SEM delegação:**
```
1. Testar manualmente algumas páginas
2. Assumir que "está tudo ok"
3. Marcar fase como completa
4. Descobrir bug 2 dias depois
5. Reabrir fase
⏱️ Tempo: 2h + dívida técnica
```

**COM delegação (pm-expert):**
```
1. Delegar: "Use pm-expert to validate 100% of ecosystem"
2. Agent valida TODAS as 19 páginas
3. Agent valida TODOS os 16 controllers
4. Agent valida infrastructure (21 containers)
5. Agent gera relatório com gaps encontrados
6. Agent cria screenshots de evidência
⏱️ Tempo: 12 min + relatório completo
```

### Enforcement na Prática

**Pergunta obrigatória antes de implementar:**
> "Esta tarefa requer agent especializado?"

**Se SIM → DELEGAR antes de implementar**

**Validação em code review:**
- [ ] Agent correto foi usado?
- [ ] Agent validou Zero Tolerance?
- [ ] Output do agent foi validado?

**Referências:**
- `.claude/AGENT_QUICK_REFERENCE.md` - Quick lookup de agents
- `.claude/guides/specialized-agents.md` - Detalhes dos 10 agents

---

## Git Workflow

### Regras Obrigatórias

- ✅ Git sempre atualizado (working tree clean antes de nova fase)
- ✅ Branch sempre atualizada e mergeada com main
- ✅ Commits frequentes com mensagens descritivas (Conventional Commits)
- ✅ Documentação atualizada no mesmo commit (não separado)
- ❌ NUNCA commitar código que não compila
- ❌ NUNCA commitar com erros TypeScript

### Commit Message Format (Conventional Commits)

**Formato obrigatório:**

```
<type>(<scope>): <subject>

<body>

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types permitidos:**

| Type | Uso |
|------|-----|
| `feat` | Nova feature |
| `fix` | Bug fix |
| `docs` | Mudanças em documentação |
| `style` | Formatação (não afeta código) |
| `refactor` | Refatoração (sem mudar comportamento) |
| `perf` | Melhoria de performance |
| `test` | Adicionar/corrigir testes |
| `chore` | Manutenção (build, deps, etc) |

**Exemplo:**

```bash
git commit -m "feat(assets): add dividend filter to assets table

Implementado filtro de dividendos na tabela de assets com:
- Dropdown de seleção de período (1M, 3M, 6M, 1Y)
- Cálculo de dividend yield
- Ordenação por yield

✅ Zero Tolerance validado
✅ Documentação atualizada

🤖 Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Referência:** `CONTRIBUTING.md` - Git workflow completo

---

## Git Hooks (Husky)

### Setup Automático

O projeto utiliza **Husky v9** para automatizar validações de qualidade.

**Instalado em:** `.husky/` (raiz do projeto)

### Hooks Configurados

| Hook | Validação | Bloqueia se |
|------|-----------|-------------|
| `pre-commit` | TypeScript (backend + frontend) | Erros TS encontrados |
| `commit-msg` | Conventional Commits format | Formato inválido |
| `pre-push` | Build (backend + frontend) | Build falhar |

### Arquivos de Hook

**pre-commit:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validar TypeScript
echo "🔍 Validando TypeScript..."
cd backend && npx tsc --noEmit || exit 1
cd ../frontend && npx tsc --noEmit || exit 1

echo "✅ TypeScript OK"
```

**commit-msg:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validar Conventional Commits format
npx --no -- commitlint --edit $1
```

**Configuração commitlint:**

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore'],
    ],
    'subject-case': [0], // Permitir qualquer case
  },
};
```

**pre-push:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Validar build
echo "🔍 Validando builds..."
cd backend && npm run build || exit 1
cd ../frontend && npm run build || exit 1

echo "✅ Build OK"
```

### Bypass de Emergência

**APENAS para emergências críticas:**

```bash
# Pular pre-commit e commit-msg
git commit --no-verify -m "hotfix: critical production issue"

# Pular pre-push
git push --no-verify
```

**IMPORTANTE:**

- ⚠️ Bypass deve ser usado APENAS em emergências
- ⚠️ Código com bypass DEVE ser corrigido no próximo commit
- ⚠️ Nunca usar bypass por preguiça ou pressa

**Justificativas válidas para bypass:**

- ✅ Hotfix crítico em produção down
- ✅ Rollback de emergência
- ❌ "Não quero esperar o build"
- ❌ "Vou corrigir depois"
- ❌ "É só um erro pequeno"

---

## Enforcement via CI/CD

### GitHub Actions

**Validação automática em TODOS os PRs:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Backend Dependencies
        run: cd backend && npm ci

      - name: Install Frontend Dependencies
        run: cd frontend && npm ci

      - name: Validate TypeScript (Backend)
        run: cd backend && npx tsc --noEmit

      - name: Validate TypeScript (Frontend)
        run: cd frontend && npx tsc --noEmit

      - name: Build Backend
        run: cd backend && npm run build

      - name: Build Frontend
        run: cd frontend && npm run build

      - name: Lint Frontend
        run: cd frontend && npm run lint
```

**Resultado:**

- ✅ PR só pode ser merged se CI passar
- ❌ Qualquer erro bloqueia merge

---

## Exceções e Casos Especiais

### TypeScript `any` Type

**Regra:** Minimizar uso de `any`.

**Quando permitido:**

- Migração de código legado (marcar com `// TODO: type this`)
- Tipos de bibliotecas sem declarações
- Complexidade de tipo > benefício (muito raro)

**Exemplo:**

```typescript
// ❌ EVITAR
function process(data: any) {
  return data.value;
}

// ✅ CORRETO
function process(data: { value: string }) {
  return data.value;
}

// ⚠️ ACEITÁVEL (temporário)
function processLegacy(data: any /* TODO: type this after migration */) {
  return data.value;
}
```

### ESLint Warnings

**Regra:** 0 **critical** warnings.

**Warnings não-críticos:** Aceitável se justificado.

**Exemplo:**

```typescript
// ⚠️ Warning: React Hook useEffect has a missing dependency
useEffect(() => {
  fetchData();
}, []); // eslint-disable-line react-hooks/exhaustive-deps

// Justificativa: fetchData é stable function, não precisa na dependency array
```

### Console Errors (Browser)

**Regra:** 0 errors no console.

**Exceções:**

- Warnings de bibliotecas externas (documentar no KNOWN-ISSUES.md)
- Erros de CORS em dev (usar proxy em produção)

**Validação:**

```bash
# Usar Chrome DevTools MCP
mcp__chrome-devtools__navigate_page("http://localhost:3100")
mcp__chrome-devtools__list_console_messages()
# Deve retornar apenas warnings conhecidos
```

---

## Ferramentas de Suporte

### VS Code Extensions

**Recomendadas:**

- **ESLint** - Mostrar erros de lint inline
- **TypeScript Error Translator** - Erros TS mais legíveis
- **Error Lens** - Mostrar erros inline no código
- **Pretty TypeScript Errors** - Erros TS formatados

### Pre-Commit Hooks Locais

**Instalar Husky:**

```bash
# Raiz do projeto
npm install --save-dev husky
npx husky install
```

**Ativar hooks:**

```bash
# Ativar automaticamente após npm install
npm set-script prepare "husky install"
```

### Skill Validate All

```bash
/validate-all
```

Executa TODAS as validações de Zero Tolerance automaticamente.

---

## Métricas e Monitoramento

### Métricas de Qualidade

| Métrica | Target | Atual |
|---------|--------|-------|
| TypeScript Errors | 0 | 0 |
| Build Success Rate | 100% | 100% |
| ESLint Critical Warnings | 0 | 0 |
| Console Errors (Browser) | 0 | 0 |
| Commits com Bypass | < 1% | - |

### Monitorar Compliance

**Dashboard sugerido (GitHub Insights):**

- Total de commits
- Commits com `--no-verify`
- Build failures em CI
- PR merge rate

---

## Troubleshooting

### "TypeScript errors mas build funciona"

**Causa:** Configuração `tsconfig.json` diferente entre editor e CLI

**Solução:**

```bash
# Usar SEMPRE a mesma config
npx tsc --noEmit --project tsconfig.json
```

### "Husky hooks não executam"

**Causa:** Hooks não instalados

**Solução:**

```bash
npx husky install
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push
```

### "Build passa localmente, falha no CI"

**Causa:** Dependências diferentes

**Solução:**

```bash
# Usar npm ci (não npm install) para reproduzir CI
rm -rf node_modules package-lock.json
npm ci
npm run build
```

---

## Benefícios da Zero Tolerance

### Benefícios Imediatos

- ✅ Previne bugs antes de chegar em produção
- ✅ Code review mais rápido (sem discutir erros óbvios)
- ✅ Deploys mais seguros
- ✅ Onboarding mais claro (regras explícitas)

### Benefícios a Longo Prazo

- ✅ Menos débito técnico
- ✅ Refatoração mais segura (TypeScript detecta breakages)
- ✅ Velocidade aumenta (menos tempo debugando)
- ✅ Confiança na codebase

---

## Fontes

- `CONTRIBUTING.md` - Git workflow completo
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Commitlint](https://commitlint.js.org/)
