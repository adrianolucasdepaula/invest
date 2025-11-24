# B3 AI Analysis Platform - Gemini Context

**Projeto:** B3 AI Analysis Platform (invest-claude-web)  
**Última Atualização:** 2025-11-24  
**Versão:** 1.2.0  
**Mantenedor:** Claude Code (Sonnet 4.5) + Google Gemini AI

---

## 🎯 VISÃO GERAL DO PROJETO

**Nome:** B3 AI Analysis Platform  
**Repositório:** invest-claude-web  
**Tipo:** Plataforma Financeira B3 + IA  
**Objetivo:** Análise fundamentalista, técnica, macroeconômica e gestão de portfólio

**Stack Principal:**

- Backend: NestJS 10.x + TypeScript 5.x + PostgreSQL 16 + TypeORM
- Frontend: Next.js 14 App Router + Shadcn/ui + TailwindCSS
- Queue: BullMQ + Redis
- Scrapers: Python 3.11 + Playwright

**Metodologia:** Ultra-Thinking + TodoWrite + Zero Tolerance

**Progresso:** 53 fases concluídas (98.1%), FASE 55 em andamento

---

## 📁 ESTRUTURA DE CONTEXTO

Este arquivo é o ponto de entrada principal. Para detalhes específicos, consulte:

- **Arquitetura:** @context/architecture.md
- **Convenções:** @context/conventions.md
- **Regras Financeiras:** @context/financial-rules.md
- **Workflows:** @context/workflows/\*.md
- **Exemplos:** @context/examples/\*.ts

---

## 🚫 REGRAS NÃO-NEGOCIÁVEIS (CRÍTICO)

### ❌ NUNCA FAZER

1. **Arquivos Sensíveis:**

   - ❌ Modificar `.env`, `.env.example`, `terraform.tfstate`
   - ❌ Commitar secrets, API keys, passwords

2. **Dados Financeiros:**

   - ❌ Arredondar/manipular valores financeiros
   - ❌ Usar `Math.round()` para moedas
   - ❌ Usar `Float` para valores monetários
   - ❌ Alterar precision de dados coletados

3. **Código:**

   - ❌ Commitar com erros TypeScript
   - ❌ Commitar com build quebrado
   - ❌ Pular validações (build, lint, testes)
   - ❌ Criar duplicatas sem verificar existente
   - ❌ Usar `any` type (usar `unknown`)

4. **Dados:**

   - ❌ Usar mocks em produção/staging
   - ❌ Dados fictícios em scrapers
   - ❌ Pular cross-validation

5. **Desenvolvimento:**
   - ❌ Workaround temporário (sempre correção definitiva)
   - ❌ Avançar fase com anterior incompleta
   - ❌ Múltiplos `in_progress` no TodoWrite

### ✅ SEMPRE FAZER

1. **Planejamento:**

   - ✅ Ultra-Thinking para mudanças > 10 linhas
   - ✅ Ler ROADMAP.md antes de começar
   - ✅ Verificar `git status` (clean)
   - ✅ Buscar código existente antes de criar

2. **Implementação:**

   - ✅ TodoWrite com etapas atômicas
   - ✅ Apenas 1 tarefa `in_progress`
   - ✅ Marcar `completed` imediatamente após concluir

3. **Validação:**

   - ✅ TypeScript: `tsc --noEmit` (0 erros)
   - ✅ Build: `npm run build` (0 erros)
   - ✅ Lint: `npm run lint` (0 warnings)
   - ✅ MCP Triplo (Playwright + Chrome DevTools + React DevTools)

4. **Dados Financeiros:**

   - ✅ Cross-validation 3+ fontes
   - ✅ Outlier detection (threshold 10%)
   - ✅ Re-validação antes de exibir
   - ✅ Usar Decimal (não Float)

5. **Git:**

   - ✅ Conventional Commits
   - ✅ Working tree clean antes de nova fase
   - ✅ Documentar junto com código (mesmo commit)
   - ✅ Push após validação completa

6. **Sistema:**
   - ✅ Reiniciar serviços antes de testar (`system-manager.ps1`)
   - ✅ Verificar dependências antes de mudanças
   - ✅ Atualizar documentação sempre

---

## 💰 DADOS FINANCEIROS (PRECISÃO ABSOLUTA)

**CRÍTICO:** Dados financeiros NÃO podem ter imprecisão, arredondamento incorreto ou inconsistências.

### Tipos de Dados

```typescript
// ✅ CORRETO
import { Decimal } from "decimal.js";

price: Decimal = new Decimal("123.45");
percentage: Decimal = new Decimal("5.6789");

// ❌ ERRADO
price: number = 123.45; // Float tem imprecisão
percentage: number = 5.6789; // Pode perder precisão
```

### Precisão

- **BRL (Reais):** 2 casas decimais (`123.45`)
- **Percentuais:** 4 casas decimais (`5.6789%`)
- **Quantidades:** Integer ou Decimal conforme necessário

### Arredondamento

- **Método:** ROUND_HALF_UP para BRL
- **Biblioteca:** `decimal.js` ou similar
- **NUNCA:** `Math.round()`, `toFixed()` sem Decimal

### Timezone

- **Obrigatório:** `America/Sao_Paulo` (Horário de Brasília)
- **Biblioteca:** `date-fns-tz` ou `luxon`
- **NUNCA:** UTC sem conversão para timezone B3

### Cross-Validation

```typescript
// Mínimo 3 fontes concordando
const sources = [
  { source: "Fundamentei", value: 8.5 },
  { source: "Status Invest", value: 8.3 },
  { source: "Investing.com", value: 8.6 },
  { source: "Yahoo Finance", value: 8.4 },
];

// Outlier detection (threshold 10%)
const mean = calculateMean(sources);
const validSources = sources.filter(
  (s) => Math.abs((s.value - mean) / mean) <= 0.1
);

// Confidence score
const confidence = validSources.length / sources.length;
// 4/4 = 1.0 (100%), 3/4 = 0.75 (75%), etc

// OBRIGATÓRIO: Mínimo 3 fontes (confidence >= 0.75)
if (validSources.length < 3) {
  throw new Error("Insufficient data sources");
}
```

**Ver detalhes completos:** @context/financial-rules.md

---

## 🔄 WORKFLOW DE FASE

**Sequência Obrigatória:**

```
1. Ler ROADMAP.md
   ↓
2. git status (verificar clean)
   ↓
3. Ultra-Thinking (se > 100 linhas)
   ↓
4. Criar FASE_XX_PLANEJAMENTO.md
   ↓
5. TodoWrite (etapas atômicas)
   ↓
6. Implementar (1 etapa por vez)
   ↓
7. Validar CADA etapa
   - TypeScript (tsc --noEmit)
   - Build (npm run build)
   - Lint (npm run lint)
   ↓
8. MCP Triplo (Playwright + Chrome + React DevTools)
   ↓
9. Documentar (atualizar ROADMAP.md + docs)
   ↓
10. Commit + Push
   ↓
11. Marcar fase como 100% completa
```

**Code Review Obrigatório:**

- Antes de próxima fase
- Usando melhores práticas (CHECKLIST_CODE_REVIEW_COMPLETO.md)
- Zero gaps, bugs, erros, warnings

---

## 📚 ARQUIVOS PRINCIPAIS DE REFERÊNCIA

### Metodologia

- **CLAUDE.md / GEMINI.md** - Metodologia (devem ter conteúdo 100% idêntico)
- **CHECKLIST_TODO_MASTER.md** - Checklist obrigatório antes de cada fase

### Arquitetura

- **ARCHITECTURE.md** - Arquitetura completa do sistema
- **DATABASE_SCHEMA.md** - Schema completo do banco de dados
- **DATA_SOURCES.md** - Fontes de dados e scrapers

### Desenvolvimento

- **ROADMAP.md** - 53 fases (98.1% completo), fase atual: 55
- **CONTRIBUTING.md** - Convenções de código e Git workflow
- **TROUBLESHOOTING.md** - 16+ problemas comuns com soluções

### Instalação

- **INSTALL.md** - Instalação completa (Docker, portas, env vars)
- **README.md** - Overview público do projeto

### Validação

- **VALIDACAO\_\*.md** - 50+ validações documentadas
- **FRAMEWORK_VALIDACAO_FRONTEND_UNIVERSAL.md** - Framework de validação

---

## 🛠️ STACK TECNOLÓGICA

### Backend (NestJS)

```typescript
// Estrutura modular
src/
├── api/                  # Controllers + Services + DTOs
│   ├── assets/
│   ├── portfolio/
│   └── market-data/
├── database/
│   ├── entities/         # TypeORM entities
│   └── migrations/       # Database migrations
├── scrapers/             # Integrações com scrapers Python
└── queue/                # BullMQ jobs

// Principais bibliotecas
@nestjs/core: ^10.0.0
@nestjs/typeorm: ^10.0.0
typeorm: ^0.3.0
pg: ^8.11.0  // PostgreSQL
bull: ^4.11.0  // Queue
class-validator: ^0.14.0
class-transformer: ^0.5.1
```

### Frontend (Next.js)

```typescript
// Estrutura App Router
app/
├── (dashboard)/          # Rotas autenticadas
│   ├── assets/
│   ├── portfolio/
│   └── reports/
├── api/                  # API routes (proxy)
└── layout.tsx

// Principais bibliotecas
next: ^14.0.0
react: ^18.0.0
@radix-ui/react-*: latest  // Shadcn/ui base
tailwindcss: ^3.4.0
@tanstack/react-query: ^5.0.0  // Data fetching
recharts: ^2.10.0  // Charts
```

### Scrapers (Python)

```python
# Backend Python services
backend/
├── python-scrapers/     # 6 scrapers fundamentalistas
└── python-service/      # Análise técnica

# Bibliotecas principais
playwright==1.40.0
beautifulsoup4==4.12.0
pandas==2.1.0
ta-lib==0.4.28  # Análise técnica
```

### Database (PostgreSQL)

```sql
-- Porta: 5532 (não padrão 5432)
-- Database: invest_db
-- User: invest_user

-- Principais tabelas
assets              -- Ativos B3
asset_prices        -- Histórico preços
ticker_changes      -- Mudanças ticker (FASE 55)
portfolios          -- Portfólios usuários
transactions        -- Transações
analyses            -- Análises geradas
```

---

## 🎨 CONVENÇÕES DE CÓDIGO

**Ver detalhes completos:** @context/conventions.md

**Resumo:**

- **Naming:** kebab-case (files), PascalCase (classes), camelCase (functions)
- **Indentation:** 2 spaces (não tabs)
- **Quotes:** Single (`'hello'`)
- **Semicolons:** Obrigatórios
- **Equality:** `===` e `!==` (nunca `==`)
- **NO `any`:** Usar `unknown` quando necessário

---

## 📐 ARQUITETURA

**Ver detalhes completos:** @context/architecture.md

**Padrão:** Modular Monolith

**Camadas:**

1. API (Controllers + DTOs)
2. Services (Business Logic)
3. Entities (TypeORM)
4. Repositories (Data Access)

**Portas:**

- Backend: 3001
- Frontend: 3000
- PostgreSQL: 5532
- Redis: 6380

**Comunicação:**

- Frontend → Backend: REST API (`http://localhost:3001/api/v1`)
- Backend → Scrapers: HTTP + Message Queue (BullMQ)
- Backend → Database: TypeORM
- Real-time: WebSocket (Socket.io)

---

## 🧪 VALIDAÇÃO (Zero Tolerance)

### TypeScript

```bash
# Backend
cd backend && npx tsc --noEmit

# Frontend
cd frontend && npx tsc --noEmit

# RESULTADO ESPERADO: 0 errors
```

### Build

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build

# RESULTADO ESPERADO: 0 errors
```

### Lint

```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint

# RESULTADO ESPERADO: 0 warnings
```

### MCP Triplo (OBRIGATÓRIO)

1. **Playwright MCP:** Testes E2E automatizados
2. **Chrome DevTools MCP:** Inspeção manual + screenshots
3. **React Developer Tools:** Validação de componentes/hooks

**Executar em janelas separadas** (paralelo, sem conflitos)

---

## 🔍 TROUBLESHOOTING

**16+ problemas comuns documentados:** Ver `TROUBLESHOOTING.md`

**Checklist rápido:**

```bash
# 1. Verificar logs
docker logs -f invest_backend
docker logs -f invest_frontend

# 2. Verificar status containers
docker ps -a

# 3. Verificar portas
netstat -ano | findstr "3000 3001 5532 6380"

# 4. Verificar variáveis ambiente
docker exec invest_backend env | grep DATABASE

# 5. Reiniciar serviços
.\system-manager.ps1 restart

# 6. Clean install (último recurso)
docker-compose down -v
docker-compose up -d --build
```

---

## 📊 GESTÃO DE MEMÓRIA (Long-Term Context)

**Decisões Arquiteturais:** @memory/decisions.md  
**Dívida Técnica:** @memory/tech-debt.md  
**Padrões Aprendidos:** @memory/learned-patterns.md

**Atualização:** Automática via Git hooks + manual quando necessário

---

## 🎯 FASE ATUAL: 55 - Ticker History Merge

**Objetivo:** Rastrear mudanças históricas de tickers (ex: ELET3 → AXIA3)

**Status:** Em andamento

**Arquivos Modificados:**

- `backend/src/database/entities/ticker-change.entity.ts` (novo)
- `backend/src/api/market-data/ticker-merge.service.ts` (novo)
- `backend/src/api/market-data/market-data.controller.ts`
- `backend/src/database/entities/index.ts`

**Ver planejamento:** `ROADMAP.md` linha 2973

---

## 📖 COMO USAR ESTE CONTEXTO

**Para Gemini AI:**

1. **Sempre ler este arquivo primeiro** ao iniciar sessão
2. **Consultar arquivos referenciados** (@context/_, @memory/_)
3. **Verificar estado atual** (ROADMAP.md, git status)
4. **Seguir regras não-negociáveis** (crítico!)
5. **Documentar decisões** em @memory/decisions.md

**Comandos úteis:**

```bash
# Recarregar contexto (Gemini CLI)
/memory refresh

# Ver contexto completo carregado
/memory show

# Buscar contexto relevante (quando implementado RAG)
POST /ai/context/search { "query": "cross-validation" }
```

---

## 🔗 LINKS ÚTEIS

- **Repositório:** (privado)
- **Documentação Completa:** Ver `INDEX.md`
- **Melhores Práticas AI Context 2024:** `MELHORIAS_CONTEXTO_AI_ULTRA_ROBUSTO.md`

---

**Última Sincronização:** 2025-11-24 10:58  
**Próxima Revisão:** A cada fase concluída  
**Mantenedor:** Claude Code (Sonnet 4.5) + Google Gemini AI

**📌 LEMBRETE:** Este arquivo deve ter conteúdo 100% idêntico ao `../CLAUDE.md` (exceto este header)
