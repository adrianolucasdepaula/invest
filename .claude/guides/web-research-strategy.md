# Web Research Strategy Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Estratégia de pesquisa web proativa com WebSearch

---

## Overview

Este guia documenta quando e como Claude DEVE usar WebSearch de forma proativa para garantir informação atualizada e correta, especialmente para decisões arquiteturais, best practices, e troubleshooting.

### Princípio Fundamental

**Pesquisar ANTES de responder quando há incerteza ou necessidade de informação atual (2024-2025)**

---

## Quando Claude DEVE Pesquisar Automaticamente

### Triggers Obrigatórios

| Situação | Trigger | Queries Paralelas | Prioridade |
|----------|---------|-------------------|------------|
| **Decisão arquitetural** | "qual usar", "melhor opção", "escolher entre" | 4 queries | 🔴 ALTA |
| **Erro desconhecido** | "não sei", "nunca vi", stack trace novo | 2-3 queries | 🔴 ALTA |
| **Best practices** | "como fazer corretamente", "padrão recomendado" | 3 queries | 🟠 MÉDIA |
| **Comparar alternativas** | "A vs B", "qual escolher", "diferença entre" | 4 queries | 🟠 MÉDIA |
| **Troubleshooting complexo** | "não funciona", "root cause", ">2h debugando" | 3 queries | 🔴 ALTA |
| **Melhoria/evolução** | "otimizar", "modernizar", "melhorar performance" | 3 queries | 🟡 BAIXA |

### Exemplos de Triggers

#### Trigger 1: Decisão Arquitetural

```text
User: "Qual biblioteca usar para gráficos de candlestick?"

Claude: [DEVE pesquisar ANTES de responder]
1. WebSearch: "javascript candlestick chart library best practices 2025"
2. WebSearch: "lightweight-charts vs recharts vs chart.js comparison"
3. WebSearch: "candlestick chart react official documentation"
4. WebSearch: "financial charts library performance benchmark 2025"

[Após pesquisa, responder com fontes citadas]
```

#### Trigger 2: Erro Desconhecido

```text
User: "Estou recebendo Exit Code 137 no container Docker"

Claude: [DEVE pesquisar ANTES de responder]
1. WebSearch: "docker exit code 137 meaning solution"
2. WebSearch: "docker oom kill exit 137 site:stackoverflow.com"
3. WebSearch: "playwright memory leak docker container 2025"

[Após pesquisa, responder com root cause analysis]
```

#### Trigger 3: Best Practices

```text
User: "Como estruturar testes E2E com Playwright?"

Claude: [DEVE pesquisar ANTES de responder]
1. WebSearch: "playwright e2e testing best practices 2025"
2. WebSearch: "playwright official documentation testing patterns"
3. WebSearch: "playwright page object model vs app actions"

[Após pesquisa, responder com padrão recomendado]
```

---

## Template de Queries (4 Paralelas)

### Estrutura Padrão

```typescript
// Pattern para queries paralelas
const queries = [
  `"${tecnologia} best practices 2025"`,
  `"${tecnologia} official documentation"`,
  `"${problema} solution site:stackoverflow.com OR github.com"`,
  `"${alternativa1} vs ${alternativa2} comparison 2025"`
];

// Executar em paralelo
await Promise.all(queries.map(query => WebSearch(query)));
```

### Exemplo Real: Decisão de Library

```text
Pergunta: "Qual biblioteca usar para state management em Next.js 14?"

Queries paralelas:
1. "next.js 14 state management best practices 2025"
2. "zustand vs jotai vs redux comparison 2025"
3. "next.js official documentation state management"
4. "react server components state management site:github.com"
```

### Exemplo Real: Troubleshooting

```text
Problema: "TypeORM migration falha com 'relation does not exist'"

Queries paralelas:
1. "typeorm migration relation does not exist solution"
2. "typeorm migration order foreign key site:stackoverflow.com"
3. "typeorm postgres migration best practices 2025"
```

---

## Fontes Confiáveis (Whitelist)

### Hierarquia de Confiança

| Prioridade | Tipo | Domínios | Quando Usar |
|------------|------|----------|-------------|
| **1 - ALTA** | Docs oficiais | *.dev, docs.*, *.io/docs, github.com/*/docs | SEMPRE preferir |
| **2 - MÉDIA** | Q&A | stackoverflow.com, github.com/issues | Para troubleshooting |
| **3 - BAIXA** | Blogs (tech) | dev.to, medium.com (tech), hashnode.dev | Para insights e patterns |
| **4 - REFERÊNCIA** | Benchmarks | benchmarksgame, techempower | Para comparações de performance |

### Domínios por Tipo

#### Documentação Oficial

```text
✅ PREFERIR:
- *.dev (playwright.dev, nextjs.dev)
- docs.* (docs.anthropic.com, docs.nestjs.com)
- *.io/docs (typeorm.io/docs)
- github.com/[org]/[repo]/docs
- developer.mozilla.org (MDN)

❌ EVITAR:
- W3Schools (desatualizado)
- GeeksforGeeks (simplificado demais)
- Tutorialspoint (incompleto)
```

#### Q&A e Discussões

```text
✅ PREFERIR:
- stackoverflow.com (tags: typescript, nestjs, react)
- github.com/[org]/[repo]/issues (issues oficiais)
- github.com/[org]/[repo]/discussions

❌ EVITAR:
- Quora (qualidade variável)
- Reddit (opinião pessoal)
- Fóruns antigos (<2023)
```

#### Blogs Técnicos

```text
✅ PREFERIR:
- dev.to (artigos técnicos)
- medium.com (apenas tech publications)
- hashnode.dev
- freecodecamp.org
- blog.logrocket.com

❌ EVITAR:
- Blogs pessoais desconhecidos
- Artigos sem data
- Conteúdo pago/marketing
```

---

## Cross-Validation Obrigatório

### Regra dos 3 Fontes

**Antes de qualquer decisão ou afirmação:**

1. Pesquisar **mínimo 3 fontes**
2. Verificar se fontes **concordam** (threshold 80%)
3. Priorizar **docs oficiais** > **blogs 2024-2025** > **StackOverflow**
4. **Citar fontes** usadas na resposta

### Processo de Validação

```text
┌─────────────────────────────────────┐
│ 1. Executar 3-4 queries paralelas   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Analisar resultados               │
│    - Documentação oficial?           │
│    - Data recente (2024-2025)?      │
│    - Autor confiável?                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Verificar concordância            │
│    - 3+ fontes dizem a mesma coisa? │
│    - Contradições significativas?    │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────┐
        │ Concordam?    │
        └──┬───────┬───┘
           │       │
        SIM│       │NÃO
           │       │
           ▼       ▼
    ┌──────────┐ ┌──────────────────┐
    │ Responder│ │ Pesquisar mais ou │
    │ + Citar  │ │ Pedir clarificação│
    └──────────┘ └──────────────────┘
```

### Exemplo de Cross-Validation

```markdown
## Exemplo: "Qual usar: Zustand ou Jotai?"

### Pesquisa (4 fontes)
1. [Zustand Docs](https://zustand.dev) - Simples, 3KB, hooks
2. [Jotai Docs](https://jotai.org) - Atomic, 2KB, suspense
3. [Comparison Article](https://dev.to/comparison-2025) - Zustand para simples, Jotai para complexo
4. [GitHub Discussion](https://github.com/pmndrs/zustand/discussions) - Comunidade prefere Zustand

### Validação
- ✅ 3/4 fontes concordam: Zustand é mais popular e simples
- ✅ Docs oficiais concordam com características
- ✅ Conteúdo de 2025 (recente)
- ⚠️ Jotai melhor para casos avançados (atomic state)

### Decisão
**Recomendação:** Zustand para nosso caso (simplicidade, hooks)

**Fontes:**
- [Zustand Official Docs](https://zustand.dev)
- [Jotai Official Docs](https://jotai.org)
- [State Management Comparison 2025](https://dev.to/...)
```

---

## Filtro de Data (Recência)

### Regras de Recência

| Tipo de Informação | Recência Aceitável | Exceções |
|--------------------|-------------------|----------|
| **Framework/Library** | 2024-2025 | Conceitos fundamentais (ex: React hooks) |
| **Best Practices** | 2024-2025 | Patterns atemporais (SOLID, DRY) |
| **Troubleshooting** | 2023-2025 | Se problema persiste em versões antigas |
| **Benchmarks** | 2024-2025 | Nenhuma |
| **Security** | 2024-2025 | Nenhuma (sempre mais recente) |

### Como Filtrar por Data

```text
# ✅ CORRETO: Incluir ano na query
"next.js 14 app router best practices 2025"
"playwright testing patterns 2024 2025"

# ❌ ERRADO: Sem especificar ano
"next.js best practices"
"playwright testing"
```

### Descarte Automático

**Descartar informação se:**

- ❌ Anterior a 2023 (exceto conceitos fundamentais)
- ❌ Referencia versão antiga (ex: "React 16 hooks")
- ❌ Usa syntax deprecated (ex: class components em React)
- ❌ Não menciona versão atual (ex: fala de Next.js sem mencionar 14)

---

## Anti-Patterns (NUNCA Fazer)

### Anti-Pattern 1: Responder Sem Pesquisar

```text
❌ ERRADO:
User: "Qual biblioteca melhor para charts?"
Claude: "Eu recomendo Chart.js" [sem pesquisar]

✅ CORRETO:
User: "Qual biblioteca melhor para charts?"
Claude: [Executa 4 queries paralelas primeiro]
Claude: "Baseado em pesquisa de 4 fontes atualizadas (2025)..."
```

### Anti-Pattern 2: Usar Informação Desatualizada

```text
❌ ERRADO:
Claude: "Use Redux para state management" [conhecimento de 2022]

✅ CORRETO:
Claude: [Pesquisa "react state management 2025"]
Claude: "Em 2025, alternativas como Zustand e Jotai são mais populares..."
```

### Anti-Pattern 3: Única Fonte

```text
❌ ERRADO:
Claude: "Segundo StackOverflow..." [apenas 1 fonte]

✅ CORRETO:
Claude: "Segundo 3 fontes (docs oficiais, dev.to, GitHub)..."
```

### Anti-Pattern 4: Não Citar Fontes

```text
❌ ERRADO:
Claude: "Best practice é usar X"

✅ CORRETO:
Claude: "Best practice é usar X

Fontes:
- [Official Docs](url)
- [Best Practices Article 2025](url)"
```

### Anti-Pattern 5: Copiar Código Sem Entender

```text
❌ ERRADO:
[Copia código de StackOverflow sem entender]

✅ CORRETO:
[Lê código, entende contexto, adapta para projeto]
```

---

## Template de Resposta com Fontes

### Estrutura Padrão

```markdown
[Resposta técnica detalhada]

---

## Fontes Consultadas

### Documentação Oficial
- [Nome da Tecnologia Docs](URL) - Descrição breve

### Artigos Técnicos
- [Título do Artigo](URL) - Autor, Data

### Discussões
- [GitHub Issue #123](URL) - Contexto

### Benchmarks
- [Performance Comparison](URL) - Metodologia
```

### Exemplo Completo

```markdown
## Como Implementar Retry Logic em BullMQ?

### Recomendação

Use a opção `attempts` no job options com `backoff` exponencial:

```typescript
await queue.add('my-job', data, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000 // 2s, depois 4s, depois 8s
  }
});
```

### Benefícios

1. **Resiliência** - Tolera falhas transitórias
2. **Backoff** - Reduz carga durante problemas
3. **Configurável** - Adapta por job

### Quando Usar

- ✅ APIs externas (network issues)
- ✅ Database transient errors
- ❌ Validation errors (não vai passar em retry)

---

## Fontes Consultadas

### Documentação Oficial
- [BullMQ - Retrying Failing Jobs](https://docs.bullmq.io/guide/retrying-failing-jobs) - Retry patterns oficiais

### Artigos Técnicos
- [BullMQ Best Practices 2025](https://dev.to/bullmq-best-practices-2025) - Patterns de retry em produção
- [Exponential Backoff Explained](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) - AWS Architecture Blog

### Discussões
- [GitHub Issue #456](https://github.com/taskforcesh/bullmq/issues/456) - Retry strategies discussion
```

---

## Workflow de Pesquisa

### Fluxo Completo

```text
┌─────────────────────────────────────────┐
│  User pergunta com trigger obrigatório  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Claude identifica trigger (ex: "qual usar") │
└──────────────┬───────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Formular 3-4 queries paralelas        │
│ - Best practices 2025                 │
│ - Official docs                       │
│ - StackOverflow/GitHub                │
│ - Comparison                          │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Executar WebSearch em paralelo        │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Analisar resultados                    │
│ - Verificar data (2024-2025)          │
│ - Priorizar docs oficiais             │
│ - Cross-validate (3+ fontes)          │
└──────────────┬─────────────────────────┘
               │
               ▼
┌────────────────────────────────────────┐
│ Responder com:                         │
│ - Informação validada                  │
│ - Fontes citadas                       │
│ - Data das fontes                      │
└────────────────────────────────────────┘
```

---

## Métricas de Qualidade

### Targets

| Métrica | Target | Como Medir |
|---------|--------|------------|
| **Fontes por resposta** | ≥ 3 | Contar links citados |
| **Recência** | 100% de 2024-2025 | Verificar datas |
| **Docs oficiais** | ≥ 50% | Contar docs vs blogs |
| **Cross-validation** | 80% concordância | Verificar consistência |

### Audit de Qualidade

```bash
# Exemplo de checklist pós-resposta
- [ ] 3+ fontes consultadas?
- [ ] Docs oficiais incluídos?
- [ ] Todas fontes de 2024-2025?
- [ ] Fontes citadas no final?
- [ ] Cross-validation aplicada?
- [ ] Contradições resolvidas?
```

---

## Troubleshooting

### Erro: "Fontes contradizem umas às outras"

**Causa:** Diferentes versões, contextos, ou opiniões

**Solução:**

1. Identificar docs oficiais (maior peso)
2. Verificar versões mencionadas
3. Se persistir contradição → pedir clarificação ao user

### Erro: "Não encontrei informação recente (2024-2025)"

**Causa:** Tecnologia muito nova ou muito nichada

**Solução:**

1. Relaxar para 2023
2. Buscar GitHub issues/discussions
3. Avisar user sobre recência

### Erro: "Todas fontes são blogs, sem docs oficiais"

**Causa:** Tecnologia sem docs oficiais ou muito nova

**Solução:**

1. Buscar GitHub README
2. Buscar maintainer blogs
3. Avisar user sobre limitação

---

## Fontes

- **Checklist Ecossistema:** `CHECKLIST_ECOSSISTEMA_COMPLETO.md` - Seção 22
- **WebSearch Best Practices:** [Anthropic Docs](https://docs.anthropic.com/web-search)
- **Research Methodology:** `.gemini/context/research-methodology.md`
