# Dívida Técnica - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)  
**Última Atualização:** 2025-11-24  
**Versão:** 1.0.0

---

## 📋 FORMATO

Cada item de tech debt deve incluir:

- **ID:** Identificador único
- **Prioridade:** 🔥 CRÍTICO, ⚠️ ALTO, ⚡ MÉDIO, 📝 BAIXO
- **Descrição:** O que precisa ser corrigido
- **Por Que Existe:** Motivo da dívida técnica
- **Impacto:** Consequências de não corrigir
- **Esforço Estimado:** Tempo para resolver
- **Arquivos Afetados:** Onde está o problema
- **Como Resolver:** Passos para corrigir
- **Status:** PENDENTE, EM_ANDAMENTO, RESOLVIDO, CANCELADO

---

## 🔥 TECH DEBT CRÍTICO

### TD-001: Git Hooks Não Configurados

**Prioridade:** 🔥 CRÍTICO  
**Status:** PENDENTE

**Descrição:**  
Não existem Git hooks (pre-commit, pre-push, commit-msg) para validar código antes de commit.

**Por Que Existe:**  
Implementação rápida de features sem configurar infra de qualidade.

**Impacto:**

- ❌ Código com erros TypeScript pode ser commitado
- ❌ Build quebrado pode ir para repositório
- ❌ Conventional commits não validados
- ❌ Secrets podem ser commitados por engano

**Esforço Estimado:** 2 horas

**Arquivos Afetados:**

- `.githooks/` (não existe)
- `.git/config` (core.hooksPath não configurado)

**Como Resolver:**

1. Criar `.githooks/pre-commit`:
   - Validar TypeScript (`tsc --noEmit`)
   - Validar Lint (`npm run lint`)
   - Verificar segredos (`.env` não commitado)
2. Criar `.githooks/pre-push`:
   - Validar Build (`npm run build`)
   - Validar Testes (`npm run test`)
3. Criar `.githooks/commit-msg`:
   - Validar Conventional Commits format
4. Configurar: `git config core.hooksPath .githooks`
5. Tornar executável: `chmod +x .githooks/*`

**Referência:** `MELHORIAS_CONTEXTO_AI_ULTRA_ROBUSTO.md` seção 8

---

### TD-002: RAG Local Não Implementado

**Prioridade:** ⚠️ ALTO  
**Status:** PENDENTE

**Descrição:**  
AI não tem sistema de RAG (Retrieval Augmented Generation) para buscar contexto relevante automaticamente.

**Por Que Existe:**  
Implementação complexa, requer embeddings + vector database.

**Impacto:**

- ⚠️ AI precisa ler múltiplos arquivos manualmente
- ⚠️ Contexto limitado (depende de memória curta)
- ⚠️ Não escala para codebase grande

**Esforço Estimado:** 4-6 horas

**Arquivos Afetados:**

- `backend/src/ai/knowledge-base/` (não existe)
- `.gemini/memory/knowledge-base.json` (não existe)

**Como Resolver:**

1. Implementar `KnowledgeBaseService`:
   - Indexar codebase (backend + frontend + docs)
   - Gerar embeddings (OpenAI text-embedding-3-small)
   - Armazenar em JSON (ou vector DB depois)
2. Criar endpoint `/ai/context/search`:
   - Input: query string
   - Output: top-5 code chunks relevantes
3. Cronjob para re-indexar (diário ou on-demand)

**Referência:** `MELHORIAS_CONTEXTO_AI_ULTRA_ROBUSTO.md` Sprint 2

---

## ⚠️ TECH DEBT ALTO

### TD-003: Testes Unitários Incompletos

**Prioridade:** ⚠️ ALTO  
**Status:** PENDENTE

**Descrição:**  
Code coverage < 50%. Muitos services sem testes unitários.

**Por Que Existe:**  
Foco em features rápidas, testes foram adiados.

**Impacto:**

- ⚠️ Bugs não detectados em compile time
- ⚠️ Refactoring arriscado (sem rede de segurança)
- ⚠️ CI/CD não validado adequadamente

**Esforço Estimado:** 10-15 horas (incremental)

**Arquivos Afetados:**

- `backend/src/**/*.spec.ts` (muitos faltando)
- `frontend/src/**/*.test.tsx` (componentes sem testes)

**Como Resolver:**

1. Priorizar services críticos:
   - `AssetsService` ✅ (já tem testes)
   - `ScrapersService` ⚠️ (parcial)
   - `PortfolioService` ❌ (sem testes)
   - `AnalysesService` ❌ (sem testes)
2. Implementar testes gradualmente (1 service por session)
3. Configurar threshold mínimo (`jest.config.js`):
   ```json
   {
     "coverageThreshold": {
       "global": {
         "statements": 80,
         "branches": 75,
         "functions": 80,
         "lines": 80
       }
     }
   }
   ```

**Referência:** `VALIDACAO_FASE_*.md` (múltiplas fases documentam falta de testes)

---

### TD-004: Workaround em system-manager.ps1 (Port Check)

**Prioridade:** ⚠️ ALTO  
**Status:** PENDENTE

**Descrição:**  
Script `system-manager.ps1` não verifica se portas estão em uso antes de iniciar serviços.

**Por Que Existe:**  
Implementação rápida do script, validação completa adiada.

**Impacto:**

- ⚠️ Serviços podem falhar ao iniciar (porta já em uso)
- ⚠️ Mensagens de erro confusas para usuário
- ⚠️ Precisa matar processos manualmente

**Esforço Estimado:** 1 hora

**Arquivos Afetados:**

- `system-manager.ps1` (função `Start-Services`)

**Como Resolver:**

```powershell
function Test-PortInUse {
    param([int]$Port)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $connection -ne $null
}

function Start-Services {
    $ports = @(3000, 3001, 5532, 6380)
    foreach ($port in $ports) {
        if (Test-PortInUse $port) {
            Write-Host "❌ Port $port already in use!" -ForegroundColor Red
            $process = Get-Process -Id (Get-NetTCPConnection -LocalPort $port).OwningProcess
            Write-Host "   Process: $($process.Name) (PID: $($process.Id))"
            Write-Host "   Kill it? (y/n): " -NoNewline
            # ... continuar implementação
            exit 1
        }
    }
    # Iniciar serviços...
}
```

**Referência:** GAP_ANALYSIS seção "System Manager"

---

## ⚡ TECH DEBT MÉDIO

### TD-005: Documentação CLAUDE.md/GEMINI.md Sem Sync Automático

**Prioridade:** ⚡ MÉDIO  
**Status:** PENDENTE

**Descrição:**  
Arquivos `CLAUDE.md` e `GEMINI.md` devem ter conteúdo idêntico, mas não há validação automática.

**Por Que Existe:**  
Sincronização manual, sem GitHub Action configurado.

**Impacto:**

- ⚡ Arquivos podem divergir (confusão para AI)
- ⚡ Desenvolvedor precisa lembrar de copiar mudanças
- ⚡ Commits podem ter apenas 1 arquivo atualizado

**Esforço Estimado:** 30 minutos

**Arquivos Afetados:**

- `CLAUDE.md`
- `GEMINI.md`
- `.github/workflows/sync-docs.yml` (não existe)

**Como Resolver:**

1. Criar `.github/workflows/sync-docs.yml`:

```yaml
name: Sync Claude.md and Gemini.md

on:
  push:
    paths:
      - "CLAUDE.md"
      - "GEMINI.md"

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Sync files
        run: |
          if ! diff -q CLAUDE.md GEMINI.md; then
            echo "⚠️ Files divergent! Syncing..."
            cp CLAUDE.md GEMINI.md
            git config user.name "GitHub Actions"
            git config user.email "actions@github.com"
            git add GEMINI.md
            git commit -m "chore(docs): sync GEMINI.md with CLAUDE.md [skip ci]"
            git push
          fi
```

**Referência:** `MELHORIAS_CONTEXTO_AI_ULTRA_ROBUSTO.md` seção 9

---

### TD-006: Frontend sem Testes E2E Completos

**Prioridade:** ⚡ MÉDIO  
**Status:** PENDENTE (PARCIAL)

**Descrição:**  
Apenas alguns fluxos críticos têm testes Playwright. Muitas páginas sem cobertura E2E.

**Por Que Existe:**  
Testes E2E demorados para escrever/manter.

**Impacto:**

- ⚡ Regressões não detectadas automaticamente
- ⚡ Features novas podem quebrar páginas existentes
- ⚡ CI/CD não valida fluxo completo

**Esforço Estimado:** 8-10 horas (incremental)

**Arquivos Afetados:**

- `tests/e2e/*.spec.ts` (alguns já existem)

**Como Resolver:**

1. Priorizar fluxos críticos:
   - ✅ Login/Logout (já existe)
   - ✅ Dashboard (já existe)
   - ⚠️ Portfolio (parcial)
   - ❌ Assets CRUD (faltando)
   - ❌ Reports geração (faltando)
2. Implementar 1-2 testes por sessão
3. Rodar em CI/CD (GitHub Actions)

**Referência:** Múltiplos `VALIDACAO_FASE_*.md`

---

## 📝 TECH DEBT BAIXO

### TD-007: Logs sem Estrutura (JSON Logs)

**Prioridade:** 📝 BAIXO  
**Status:** PENDENTE

**Descrição:**  
Logs em texto simples, dificulta parsing/agregação em ferramentas (Datadog, ElasticSearch).

**Por Que Existe:**  
Logger padrão NestJS usado, sem configuração custom.

**Impacto:**

- 📝 Logs difíceis de filtrar/buscar
- 📝 Dificulta debugging em produção
- 📝 Não integra bem com APM tools

**Esforço Estimado:** 2 horas

**Arquivos Afetados:**

- `backend/src/main.ts` (logger config)
- `backend/src/**/*.service.ts` (uso de logger)

**Como Resolver:**

1. Instalar: `npm install winston`
2. Configurar Winston com JSON format:

```typescript
import { WinstonModule } from "nest-winston";
import * as winston from "winston";

const app = await NestFactory.create(AppModule, {
  logger: WinstonModule.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: "logs/app.log" }),
    ],
  }),
});
```

**Referência:** NestJS Logging docs

---

## ✅ TECH DEBT RESOLVIDO

### TD-000: Documentação Desorganizada

**Prioridade:** 🔥 CRÍTICO (era)  
**Status:** ✅ RESOLVIDO (2025-11-24)

**Descrição:**  
200+ arquivos `.md` sem organização clara, difícil encontrar informação.

**Por Que Existia:**  
Documentação criada ad-hoc durante desenvolvimento.

**Como Foi Resolvido:**

1. Criado `INDEX.md` com mapa completo
2. Criado `.gemini/` folder com estrutura hierárquica
3. Schemas JSON estruturados
4. Memory system com decisões/tech-debt/patterns

**Arquivos Criados:**

- `INDEX.md`
- `.gemini/GEMINI.md`
- `.gemini/context/*.md`
- `.gemini/schemas/*.json`
- `.gemini/memory/*.md`

**Resolvido Por:** Claude Code (Sonnet 4.5)  
**Data:** 2025-11-24

---

## TEMPLATE (Copiar Para Novos Itens)

```markdown
### TD-XXX: [Título do Tech Debt]

**Prioridade:** 🔥/⚠️/⚡/📝  
**Status:** PENDENTE/EM_ANDAMENTO/RESOLVIDO/CANCELADO

**Descrição:**  
[O que precisa ser corrigido]

**Por Que Existe:**  
[Motivo da dívida técnica]

**Impacto:**

- [Consequências de não corrigir]

**Esforço Estimado:** [Tempo para resolver]

**Arquivos Afetados:**

- [Lista de arquivos]

**Como Resolver:**
[Passos detalhados para corrigir]

**Referência:** [Docs, issues, etc]
```

---

**Mantenedor:** Claude Code (Sonnet 4.5) + Google Gemini AI  
**Revisão:** Mensal (ou quando debt acumular muito)  
**Priorização:** Crítico > Alto > Médio > Baixo
