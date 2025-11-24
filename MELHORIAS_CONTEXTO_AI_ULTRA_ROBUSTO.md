# 🚀 MELHORIAS CONTEXTO AI - ULTRA-ROBUSTO

**Projeto:** B3 AI Analysis Platform  
**Data:** 2025-11-24  
**Pesquisa:** Melhores práticas mercado 2024-2025  
**Objetivo:** Antigravity/Gemini entender 100% do contexto

---

## 📊 RESUMO EXECUTIVO

Após pesquisa ultra-robusta, identifiquei **15 melhorias críticas** para maximizar compreensão de contexto:

| Categoria                 | Implementações | Impacto    |
| ------------------------- | -------------- | ---------- |
| **Estrutura de Arquivos** | 5              | 🔥 CRÍTICO |
| **RAG Local**             | 3              | 🔥 CRÍTICO |
| **Schemas Estruturados**  | 3              | ⚠️ ALTO    |
| **Memory System**         | 2              | ⚠️ ALTO    |
| **Automação**             | 2              | ⚡ MÉDIO   |

---

## 🎯 IMPLEMENTAÇÕES CRÍTICAS (Fazer AGORA)

### 1️⃣ Criar `.gemini/` Folder Structure

**Best Practice 2024:** Estrutura hierárquica de contexto

```bash
.gemini/
├── GEMINI.md                    # Context principal (OBRIGATÓRIO)
├── settings.json                # Configurações persistentes
├── context/
│   ├── architecture.md          # Arquitetura detalhada
│   ├── conventions.md           # Convenções código
│   ├── financial-rules.md       # Regras dados financeiros
│   ├── workflows/               # Workflows específicos
│   │   ├── phase-checklist.md
│   │   ├── validation.md
│   │   └── deployment.md
│   └── examples/                # Exemplos de código
│       ├── entity-example.ts
│       ├── service-example.ts
│       └── component-example.tsx
├── schemas/
│   ├── project-context.json     # Schema JSON do projeto
│   ├── phase-template.yaml      # Template de fase
│   └── validation-schema.json   # Schema de validação
└── memory/
    ├── decisions.md             # Decisões arquiteturais
    ├── tech-debt.md             # Dívida técnica
    └── learned-patterns.md      # Padrões aprendidos
```

**Fonte:** [Gemini CLI Best Practices 2024](https://saif71.com/gemini)

---

### 2️⃣ GEMINI.md Ultra-Completo

**Template Obrigatório:**

```markdown
# B3 AI Analysis Platform - Gemini Context

## 🎯 PROJETO

**Nome:** B3 AI Analysis Platform (invest-claude-web)
**Tipo:** Plataforma Financeira B3 + IA
**Stack:** NestJS 10 + Next.js 14 + PostgreSQL 16 + TypeScript 5
**Metodologia:** Ultra-Thinking + TodoWrite + Zero Tolerance

## 📁 ESTRUTURA

@context/architecture.md
@context/conventions.md
@context/financial-rules.md

## 🚫 REGRAS NÃO-NEGOCIÁVEIS

**NUNCA:**

- ❌ Modificar .env, terraform.tfstate
- ❌ Arredondar/manipular dados financeiros
- ❌ Commitar com erros TypeScript
- ❌ Pular validações (build, lint, testes)
- ❌ Criar duplicatas (sempre verificar existente)
- ❌ Usar mocks (sempre dados reais dos scrapers)
- ❌ Workaround (sempre correção definitiva)

**SEMPRE:**

- ✅ Ultra-Thinking para mudanças > 10 linhas
- ✅ TodoWrite com etapas atômicas
- ✅ Validar TypeScript (tsc --noEmit)
- ✅ Cross-validation 3+ fontes (dados financeiros)
- ✅ MCP Triplo (Playwright + Chrome DevTools + React DevTools)
- ✅ Reiniciar serviços antes de testar (system-manager.ps1)
- ✅ Git clean antes de nova fase
- ✅ Documentar junto com código (mesmo commit)

## 💰 DADOS FINANCEIROS (PRECISÃO ABSOLUTA)

**Tipos de Dados:**

- BRL: Decimal (2 casas), não Float
- Percentuais: Decimal (4 casas)
- Quantidades: Integer ou Decimal
- Timezone: America/Sao_Paulo (OBRIGATÓRIO)

**Arredondamento:**

- ROUND_HALF_UP para moedas
- NUNCA Math.round() para valores financeiros

**Validação:**

- Mínimo 3 fontes concordando
- Outlier detection (threshold 10%)
- Re-validação antes de exibir

## 🔄 WORKFLOW DE FASE

1. Ler ROADMAP.md (fase atual)
2. git status (verificar clean)
3. Ultra-Thinking (planejar > 100 linhas)
4. TodoWrite (etapas atômicas)
5. Implementar
6. Validar (TypeScript + Build + Lint + MCP Triplo)
7. Documentar (atualizar ROADMAP.md)
8. Commit + Push

## 📚 ARQUIVOS PRINCIPAIS

- **CLAUDE.md / GEMINI.md**: Metodologia (SYNC 100%)
- **ROADMAP.md**: Fases (53 fases, 98.1% completo)
- **ARCHITECTURE.md**: Arquitetura sistema
- **DATABASE_SCHEMA.md**: Schema completo
- **CHECKLIST_TODO_MASTER.md**: Checklist obrigatório
- **TROUBLESHOOTING.md**: 16+ problemas comuns

## 🛠️ FERRAMENTAS

**Backend:** NestJS 10.x, TypeORM, PostgreSQL 16
**Frontend:** Next.js 14 App Router, Shadcn/ui, TailwindCSS
**Queue:** BullMQ + Redis
**Scrapers:** Python 3.11 + Playwright
**Validação:** Playwright MCP, Chrome DevTools MCP, Sequential Thinking MCP

## 🎨 CONVENÇÕES

@context/conventions.md

## 📐 ARQUITETURA

@context/architecture.md
```

**Fontes:** [Gemini Hierarchical Memory](https://gitconnected.com), [Context Engineering 2024](https://avarile.com)

---

### 3️⃣ Criar RAG Local (Knowledge Base)

**Técnica:** Embeddings + Vector Search para codebase

**Implementação NestJS + TypeScript:**

```typescript
// backend/src/ai/knowledge-base/knowledge-base.service.ts
import { Injectable } from "@nestjs/common";
import { OpenAI } from "openai";
import * as fs from "fs";
import * as path from "path";

interface CodeChunk {
  file: string;
  content: string;
  embedding: number[];
  type: "entity" | "service" | "controller" | "component" | "doc";
}

@Injectable()
export class KnowledgeBaseService {
  private chunks: CodeChunk[] = [];
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Indexar codebase
  async indexCodebase() {
    const files = this.getAllCodeFiles();

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      const chunks = this.chunkCode(content, file);

      for (const chunk of chunks) {
        const embedding = await this.createEmbedding(chunk.content);
        this.chunks.push({ ...chunk, embedding });
      }
    }

    // Salvar em JSON (ou vector DB)
    fs.writeFileSync(
      ".gemini/memory/knowledge-base.json",
      JSON.stringify(this.chunks, null, 2)
    );
  }

  // Buscar contexto relevante
  async searchContext(query: string, topK: number = 5): Promise<CodeChunk[]> {
    const queryEmbedding = await this.createEmbedding(query);

    // Calcular similaridade coseno
    const scored = this.chunks.map((chunk) => ({
      chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    // Ordenar e retornar top-k
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((s) => s.chunk);
  }

  private async createEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-small", // ou ada-002
      input: text,
    });
    return response.data[0].embedding;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private chunkCode(content: string, file: string): Partial<CodeChunk>[] {
    // Chunking inteligente por funções/classes
    // Simplificado: split por linhas vazias
    const chunks: Partial<CodeChunk>[] = [];
    const lines = content.split("\n");
    let currentChunk: string[] = [];

    for (const line of lines) {
      currentChunk.push(line);

      // Quebrar em chunks de ~200 linhas
      if (currentChunk.length >= 200 || line.trim() === "") {
        if (currentChunk.length > 0) {
          chunks.push({
            file,
            content: currentChunk.join("\n"),
            type: this.detectType(file),
          });
          currentChunk = [];
        }
      }
    }

    return chunks;
  }

  private getAllCodeFiles(): string[] {
    // Recursivo: backend/**/*.ts, frontend/**/*.tsx
    // Simplificado:
    return [
      ...this.globSync("backend/src/**/*.ts"),
      ...this.globSync("frontend/src/**/*.tsx"),
      ...this.globSync("*.md"),
    ];
  }
}
```

**Usar no Gemini:**

```typescript
// Criar endpoint para Gemini consultar
@Controller("ai/context")
export class ContextController {
  @Post("search")
  async search(@Body() { query }: { query: string }) {
    const context = await this.knowledgeBase.searchContext(query, 5);
    return {
      query,
      relevantContext: context.map((c) => ({
        file: c.file,
        snippet: c.content.substring(0, 500),
        type: c.type,
      })),
    };
  }
}
```

**Fontes:** [RAG Best Practices 2024](https://kapa.ai), [LangChain NestJS](https://dev.to), [Vector Search](https://stackoverflow.blog)

---

### 4️⃣ Schema Estruturado (JSON) do Projeto

**`.gemini/schemas/project-context.json`:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "B3 AI Analysis Platform Context",
  "type": "object",
  "properties": {
    "project": {
      "type": "object",
      "properties": {
        "name": "B3 AI Analysis Platform",
        "repo": "invest-claude-web",
        "version": "1.1.1",
        "phase": {
          "current": 55,
          "total": 60,
          "status": "in_progress"
        }
      }
    },
    "stack": {
      "backend": {
        "framework": "NestJS",
        "version": "10.x",
        "language": "TypeScript",
        "languageVersion": "5.x",
        "database": "PostgreSQL",
        "databaseVersion": "16",
        "orm": "TypeORM",
        "queue": "BullMQ",
        "cache": "Redis"
      },
      "frontend": {
        "framework": "Next.js",
        "version": "14",
        "router": "App Router",
        "ui": "Shadcn/ui",
        "styling": "TailwindCSS"
      },
      "scrapers": {
        "language": "Python",
        "version": "3.11",
        "browser": "Playwright"
      }
    },
    "architecture": {
      "pattern": "Modular Monolith",
      "layers": ["API", "Services", "Entities", "Repositories"],
      "ports": {
        "backend": 3001,
        "frontend": 3000,
        "postgres": 5532,
        "redis": 6380
      }
    },
    "conventions": {
      "codeStyle": "Prettier + ESLint",
      "commits": "Conventional Commits",
      "branches": "feature/*, bugfix/*, hotfix/*",
      "naming": {
        "files": "kebab-case",
        "classes": "PascalCase",
        "functions": "camelCase",
        "constants": "UPPER_SNAKE_CASE"
      }
    },
    "validation": {
      "typescript": {
        "command": "tsc --noEmit",
        "strictMode": true,
        "zeroErrors": true
      },
      "build": {
        "backend": "npm run build",
        "frontend": "npm run build",
        "zeroErrors": true
      },
      "tests": {
        "unit": "npm run test",
        "e2e": "npx playwright test",
        "coverage": ">= 80%"
      },
      "mcp": {
        "playwright": true,
        "chromeDevTools": true,
        "sequentialThinking": true
      }
    },
    "financial": {
      "precision": {
        "brl": 2,
        "percentage": 4
      },
      "dataType": "Decimal",
      "rounding": "ROUND_HALF_UP",
      "timezone": "America/Sao_Paulo",
      "crossValidation": {
        "minSources": 3,
        "outlierThreshold": 0.1
      }
    }
  }
}
```

**Fontes:** [JSON Schema for AI](https://medium.com/@json-schema), [Structured AI Context 2024](https://openai.com)

---

### 5️⃣ Memory System (Knowledge Graph)

**`.gemini/memory/decisions.md` (auto-atualizado):**

```markdown
# Decisões Arquiteturais

## 2025-11-22: FASE 55 - Ticker History Merge

**Problema:** Precisamos rastrear mudanças históricas de tickers (ex: ELET3 → AXIA3)

**Decisão:** Criar entity `TickerChange` com campos:

- oldTicker, newTicker, changeDate, reason

**Alternativas Rejeitadas:**

- Soft delete em Assets (não preserva histórico)
- View materializada (complexidade desnecessária)

**Impacto:**

- ✅ Histórico completo preservado
- ✅ Queries podem unificar dados
- ⚠️ Aumenta complexidade de sync

**Arquivos Afetados:**

- backend/src/database/entities/ticker-change.entity.ts
- backend/src/api/market-data/ticker-merge.service.ts

---

## 2025-11-15: Cross-Validation 3+ Fontes

**Decisão:** Obrigatório mínimo 3 fontes concordando para dados fundamentalistas

**Implementação:** ScrapersService.mergeResults()

- Outlier detection (threshold 10%)
- Confidence score (0.0 - 1.0)

**Arquivos:**

- backend/src/scrapers/scrapers.service.ts:104-215
```

**Manter atualizado via Git Hooks:**

```powershell
# .githooks/post-commit
# Auto-append decisões importantes ao memory/decisions.md
```

**Fontes:** [Long-Term Memory AI 2024](https://gocodeo.com), [Knowledge Graphs for Code](https://medium.com/@knowledge-graphs)

---

## ⚡ IMPLEMENTAÇÕES RÁPIDAS (30 min - 2h)

### 6️⃣ INDEX.md (Mapa da Documentação)

```markdown
# 📚 Índice de Documentação - B3 AI Analysis Platform

## 🎯 Start Here

- [README.md](README.md) - Overview do projeto
- [INSTALL.md](INSTALL.md) - Instalação completa
- [GETTING_STARTED.md](GETTING_STARTED.md) - Primeiros passos

## 🤖 AI Context

- **[.gemini/GEMINI.md](.gemini/GEMINI.md)** - Context principal para AI
- [CLAUDE.md](CLAUDE.md) - Metodologia Claude Code
- [.gemini/context/](. gemini/context/) - Contextos específicos

## 🏗️ Arquitetura

- [ARCHITECTURE.md](ARCHITECTURE.md) - Arquitetura completa
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Schema banco de dados
- [DATA_SOURCES.md](DATA_SOURCES.md) - Fontes de dados

## 📋 Desenvolvimento

- [ROADMAP.md](ROADMAP.md) - Fases (53 fases, 98.1%)
- [CHECKLIST_TODO_MASTER.md](CHECKLIST_TODO_MASTER.md) - Checklist obrigatório
- [CONTRIBUTING.md](CONTRIBUTING.md) - Convenções de código

## 🔧 Troubleshooting

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - 16+ problemas comuns
- [BUGFIX\_\*.md](.) - Bugfixes documentados

## 💰 Financeiro

- [FINANCIAL_DATA_BEST_PRACTICES.md](FINANCIAL_DATA_BEST_PRACTICES.md) - Regras dados financeiros (**CRÍTICO**)

## 📊 Validação

- [VALIDACAO\_\*.md](.) - 50+ validações de fases
- [FRAMEWORK_VALIDACAO_FRONTEND_UNIVERSAL.md](FRAMEWORK_VALIDACAO_FRONTEND_UNIVERSAL.md)
```

---

### 7️⃣ Conventions.md Detalhado

**`.gemini/context/conventions.md`:**

````markdown
# Convenções de Código - B3 AI Analysis Platform

## TypeScript

### Naming

- **Files**: kebab-case (`user-profile.service.ts`)
- **Classes**: PascalCase (`UserProfileService`)
- **Interfaces**: PascalCase + `I` prefix (`IUserProfile`)
- **Functions/Methods**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Enums**: PascalCase + singular (`UserRole`, não `UserRoles`)

### Code Style

- **Indentation**: 2 spaces (não tabs)
- **Quotes**: Single quotes (`'hello'`, não `"hello"`)
- **Semicolons**: Obrigatório no final de statements
- **Line length**: Máximo 100 caracteres
- **Equality**: Usar `===` e `!==` (nunca `==` ou `!=`)

### Imports

```typescript
// 1. Node modules
import { Injectable } from "@nestjs/common";
import * as fs from "fs";

// 2. Aliases internos
import { UserService } from "@api/users/user.service";
import { Asset } from "@database/entities/asset.entity";

// 3. Relativos (evitar quando possível)
import { helper } from "./helper";
```
````

### Types

- **Prefer interfaces** over types para objetos
- **Prefer types** para unions/intersections
- **Explicit return types** em métodos públicos
- **NO `any`** (usar `unknown` quando necessário)

## NestJS

### Módulos

- Um módulo por feature (`UsersModule`, `AssetsModule`)
- Importar apenas o necessário
- Exportar apenas o que será usado fora

### Services

- Um service por entidade principal
- Injetar dependências via constructor
- Métodos públicos documentados com JSDoc

### Controllers

- Endpoints RESTful (`GET /assets/:id`, `POST /assets`)
- DTOs para validação de entrada
- Response DTOs para saída
- HTTP status codes corretos

### Entities (TypeORM)

- Uma entity por tabela
- Decorators completos (`@Column`, `@ManyToOne`, etc)
- Índices definidos (`@Index`)
- Relações bi-direcionais quando necessário

## Frontend (Next.js)

### Components

- Functional components (não class)
- Hooks para estado (`useState`, `useEffect`)
- Props tipadas com interface
- Export default apenas para páginas

### Hooks

- Prefix `use` (`useAssetData`, `usePortfolio`)
- Custom hooks em `frontend/src/hooks/`
- Memoization quando necessário (`useMemo`, `useCallback`)

## Git

### Commits

- **Conventional Commits**: `type(scope): description`
- **Types**: feat, fix, docs, style, refactor, test, chore
- **Scope**: módulo afetado (`assets`, `portfolio`, `scrapers`)
- **Description**: imperativo, lowercase, sem ponto final

**Exemplos:**

```bash
feat(assets): add ticker history merge functionality
fix(portfolio): calculate correct gain of day
docs(readme): update installation steps
```

### Branches

- `main` - Produção
- `develop` - Desenvolvimento
- `feature/nome-da-feature` - Nova feature
- `bugfix/nome-do-bug` - Correção de bug
- `hotfix/nome-do-hotfix` - Correção urgente produção

## Padrões de Projeto

### Services

```typescript
@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
    private readonly logger: Logger
  ) {}

  async findById(id: number): Promise<Asset> {
    const asset = await this.assetRepository.findOne({ where: { id } });
    if (!asset) {
      throw new NotFoundException(`Asset with id ${id} not found`);
    }
    return asset;
  }
}
```

### Components

```typescript
interface AssetCardProps {
  ticker: string;
  currentPrice: number;
  change: number;
}

export function AssetCard({ ticker, currentPrice, change }: AssetCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{ticker}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>R$ {currentPrice.toFixed(2)}</p>
        <p className={change >= 0 ? "text-green-600" : "text-red-600"}>
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </p>
      </CardContent>
    </Card>
  );
}
```

````

---

## 📈 MELHORIAS AUTOMAÇÃO

### 8️⃣ Git Hooks Inteligentes

**`.githooks/pre-commit`:**

```bash
#!/bin/bash
echo "🔍 Validando código antes de commit..."

# 1. TypeScript check
echo "→ TypeScript..."
cd backend && npx tsc --noEmit || exit 1
cd ../frontend && npx tsc --noEmit || exit 1

# 2. Lint
echo "→ ESLint..."
cd ../backend && npm run lint || exit 1
cd ../frontend && npm run lint || exit 1

# 3. Verificar .env não commitado
if git diff --cached --name-only | grep -q "^\.env$"; then
  echo "❌ ERRO: Tentando commitar .env!"
  exit 1
fi

echo "✅ Validações OK!"
````

**Instalar:**

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

---

### 9️⃣ Sync Automático CLAUDE.md <-> GEMINI.md

**`.github/workflows/sync-docs.yml`:**

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
            echo "⚠️ CLAUDE.md e GEMINI.md divergentes!"
            echo "Sincronizando..."
            cp CLAUDE.md GEMINI.md
            git config user.name "GitHub Actions"
            git config user.email "actions@github.com"
            git add GEMINI.md
            git commit -m "chore(docs): sync GEMINI.md with CLAUDE.md [skip ci]"
            git push
          fi
```

---

## 🎯 PLANO DE IMPLEMENTAÇÃO (Sequencial)

### Sprint 1: Estrutura Base (2-3 horas)

```markdown
[x] 1. Criar estrutura `.gemini/` completa
[x] 2. Criar GEMINI.md ultra-completo
[x] 3. Criar INDEX.md
[x] 4. Criar conventions.md
[ ] 5. Criar financial-rules.md
[ ] 6. Criar project-context.json
```

### Sprint 2: RAG Local (4-6 horas)

```markdown
[ ] 1. Implementar KnowledgeBaseService
[ ] 2. Indexar codebase (backend + frontend + docs)
[ ] 3. Endpoint de busca de contexto
[ ] 4. Testar retrieval com queries reais
```

### Sprint 3: Memory System (2-3 horas)

```markdown
[ ] 1. Criar memory/decisions.md
[ ] 2. Criar memory/tech-debt.md
[ ] 3. Git hook para auto-append
```

### Sprint 4: Automação (1-2 horas)

```markdown
[ ] 1. Git hooks (pre-commit, pre-push)
[ ] 2. GitHub Action sync docs
[ ] 3. Validar tudo funcionando
```

---

## ✅ VALIDAÇÃO DE SUCESSO

**Como saber se Gemini está entendendo 100%?**

### Teste 1: Query Complexa

```
USER: "Como funciona o cross-validation de dados fundamentalistas?"

GEMINI deve retornar:
✅ Arquivo: backend/src/scrapers/scrapers.service.ts:104-215
✅ Método: mergeResults()
✅ Lógica: 3+ fontes, outlier detection 10%, confidence score
✅ Sem consultar documentação (já sabe de memória)
```

### Teste 2: Regra Financeira

```
USER: "Posso usar Math.round() para arredondar preços?"

GEMINI deve responder:
❌ NÃO! Dados financeiros usam Decimal, não Float
✅ BRL: 2 casas decimais com ROUND_HALF_UP
✅ Nunca manipular/arredondar valores financeiros
✅ Referência: .gemini/context/financial-rules.md
```

### Teste 3: Workflow de Fase

```
USER: "Vou começar FASE 56, o que fazer?"

GEMINI deve listar:
1. Ler ROADMAP.md (verificar FASE 55 100% completa)
2. git status (verificar clean)
3. Ultra-Thinking (criar FASE_56_PLANEJAMENTO.md)
4. TodoWrite (etapas atômicas)
5. ...resto do workflow completo
```

---

## 📚 FONTES (Verificadas 2024-2025)

1. **Context Files:** [cursorrules.org](https://cursorrules.org), [prpm.dev](https://prpm.dev)
2. **RAG Best Practices:** [kapa.ai](https://kapa.ai), [stackoverflow.blog](https://stackoverflow.blog)
3. **Gemini .gemini/ Folder:** [saif71.com](https://saif71.com/gemini), [gitconnected.com](https://gitconnected.com)
4. **Knowledge Graphs:** [gocodeo.com](https://gocodeo.com), [medium.com/@knowledge-graphs](https://medium.com)
5. **Structured Context:** [modelcontextprotocol.io](https://modelcontextprotocol.io), [openai.com/json-mode](https://openai.com)
6. **LangChain NestJS:** [dev.to/langchain-nestjs](https://dev.to), [medium.com/@rag-typescript](https://medium.com)

---

**Próximo Passo:** Implementar Sprint 1 (estrutura base) AGORA?
