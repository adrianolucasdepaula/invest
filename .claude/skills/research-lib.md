---
description: Pesquisa documentação de bibliotecas via Context7 MCP antes de implementar features
---

# Skill: research-lib

**Descrição:** Usa Context7 MCP para pesquisar documentação atualizada de bibliotecas/frameworks ANTES de implementar funcionalidades

**Frequência de Uso:** 🔥 2-4x por semana (qualquer feature com biblioteca nova ou desconhecida)

**Tempo Economizado:** ~4-8h → ~10 min (**95% redução**)

---

## Objetivo

Executar **Context7 Documentation Research Workflow** ANTES de implementar features com bibliotecas desconhecidas ou pouco familiares, prevenindo:
- ❌ Trial-and-error com APIs desconhecidas (4-8h perdidas)
- ❌ Usar padrões deprecated ou incorretos
- ❌ Duplicar funcionalidade que biblioteca já oferece
- ❌ Ignorar breaking changes em versões novas

**ROI:** 10-20h economizadas por mês (veja análise em `magical-hugging-seahorse.md`)

---

## Context7 Workflow (2 Passos)

### Passo 1: Resolver Library ID

Antes de consultar docs, você precisa do ID exato do Context7:

```javascript
mcp__context7__resolve-library-id({
  libraryName: "NOME_DA_BIBLIOTECA",
  query: "Pergunta técnica completa do usuário"
})
```

**Exemplos:**
- `libraryName: "recharts"` → Retorna `/recharts/recharts`
- `libraryName: "next.js"` → Retorna `/vercel/next.js` ou `/vercel/next.js/v14.3.0`
- `libraryName: "typeorm"` → Retorna `/typeorm/typeorm`

**Output esperado:**
```
Selected Library ID: /org/project/version
Benchmark Score: 95 (higher = better docs)
Reputation: High
Code Snippets: 1,234
```

### Passo 2: Query Documentation

Com o Library ID, faça queries específicas:

```javascript
mcp__context7__query-docs({
  libraryId: "/org/project",  // do Passo 1
  query: "Pergunta específica sobre funcionalidade X"
})
```

**Exemplos de Queries Boas:**
- ❌ BAD: "authentication"
- ✅ GOOD: "How to implement JWT authentication with refresh tokens in NestJS"

- ❌ BAD: "charts"
- ✅ GOOD: "Recharts candlestick chart with custom tooltip showing OHLC data"

- ❌ BAD: "hooks"
- ✅ GOOD: "React Query useQuery hook for pagination with infinite scroll"

---

## Quando Usar (Triggers)

Execute `/research-lib` **ANTES** de implementar quando:

- ✅ **Nova biblioteca** sendo integrada ao projeto
- ✅ **Biblioteca desconhecida** (primeira vez usando)
- ✅ **Atualização major** (v1 → v2, breaking changes prováveis)
- ✅ **Bug complexo** em biblioteca de terceiros (>1h debug sem solução)
- ✅ **Performance issue** com biblioteca (quer saber se há API melhor)
- ✅ **Feature complexa** (ex: autenticação, charts, WebSocket, cron jobs)

**Regra de Ouro:**
> Se você está pensando "vou tentar isso e ver se funciona", **PARE** e use `/research-lib` primeiro.

---

## Workflow Completo (3-Step)

### 1. Identificar Biblioteca

Baseado na tarefa do usuário, identifique qual biblioteca precisa consultar:

**Exemplo - Tarefa:** "Adicionar gráfico de candlestick para preços de ações"
**Biblioteca:** `recharts` (já usada no projeto) ou `lightweight-charts` (alternativa)

### 2. Resolver Library ID

```javascript
mcp__context7__resolve-library-id({
  libraryName: "recharts",
  query: "Como criar gráfico de candlestick com dados OHLC em React"
})
```

**Output:**
```
✅ Selected: /recharts/recharts
Benchmark: 92
Snippets: 856
```

### 3. Query Specific Feature

```javascript
mcp__context7__query-docs({
  libraryId: "/recharts/recharts",
  query: "Recharts candlestick chart with OHLC data and custom tooltip"
})
```

**Output:** Code examples, API reference, best practices

### 4. Implementar com Confiança

Agora você tem:
- ✅ API correta
- ✅ Padrão atualizado (2025)
- ✅ Code snippets funcionais
- ✅ Breaking changes conhecidos

**Implemente SEM trial-and-error.**

---

## Real Case Study (Economia de Tempo)

### ❌ SEM Context7 (FASE 133 - Bug Docker Cache)

**Timeline:**
1. 12h de trial-and-error
2. 28 tentativas falhadas
3. 0 resultados
4. Precisou MCP Quadruplo com WebSearch manual (8h adicionais)

**Total:** 20 horas

### ✅ COM Context7 (Se usado ANTES)

**Timeline:**
1. 5 min: Resolve library ID para `vercel/next.js`
2. 5 min: Query sobre "Next.js Turbopack cache invalidation Docker"
3. 2 min: Encontra breaking change documentado
4. 10 min: Implementa solução

**Total:** 22 minutos

**Economia:** 19h 38min (~98% redução)

---

## Anti-Patterns (NUNCA FAZER)

| Anti-Pattern | Consequência | Correto |
|--------------|--------------|---------|
| ❌ Implementar direto sem pesquisar | 4-8h trial-and-error | ✅ `/research-lib` primeiro |
| ❌ Usar Stack Overflow como primeira fonte | Soluções desatualizadas (2019) | ✅ Context7 (docs 2025) |
| ❌ Consultar DEPOIS de bug aparecer | Retrabalho (código errado) | ✅ Consultar ANTES |
| ❌ Query genérica ("auth") | Resultados irrelevantes | ✅ Query específica |
| ❌ Pular resolve-library-id | Library ID errado | ✅ Sempre resolver ID primeiro |
| ❌ Chamar 4+ vezes (limite 3) | Context over-use | ✅ Máximo 3 calls |

---

## Integration com Check-Context

O skill `/check-context` agora inclui validação de Context7:

**Nova Etapa 8: Context7 Research (se aplicável)**

```markdown
### 8. Context7 Documentation Research

**Se tarefa envolve:**
- Nova biblioteca/framework
- Feature complexa com biblioteca desconhecida
- Bug em biblioteca de terceiros (>1h debug)

**Executar:**
1. Identificar biblioteca: ___________
2. Resolve library ID: mcp__context7__resolve-library-id
3. Query específica: mcp__context7__query-docs

**Resultado Esperado:**
✅ Library ID: /org/project
✅ Docs consultadas: X code snippets encontrados
✅ Padrão identificado: [descrever padrão]
```

---

## Limitações do Context7 MCP

⚠️ **IMPORTANTE:** Máximo **3 calls** por conversa (sistema, não limitação nossa)

**Estratégia:**
1. **Call 1:** resolve-library-id (biblioteca principal)
2. **Call 2:** query-docs (feature específica)
3. **Call 3:** query-docs (edge case ou alternativa) - RESERVE para casos complexos

**Se ultrapassar 3 calls:** Use WebSearch como fallback

---

## Bibliotecas Prioritárias (B3 Platform Context)

| Biblioteca | Library ID | Quando Usar |
|------------|------------|-------------|
| recharts | `/recharts/recharts` | Gráficos financeiros |
| lightweight-charts | `/tradingview/lightweight-charts` | Candlestick avançado |
| next.js | `/vercel/next.js` | Routing, App Router, caching |
| typeorm | `/typeorm/typeorm` | Migrations, queries complexas |
| bull/bullmq | `/taskforcesh/bullmq` | Queue jobs, retry logic |
| playwright | `/microsoft/playwright` | E2E testing, scraping |
| nestjs | `/nestjs/nest` | Guards, pipes, interceptors |
| react-query | `/tanstack/query` | Data fetching, caching |

**Referência Completa:** `magical-hugging-seahorse.md` - Seção "Context7 Workflow"

---

## Template de Saída

Após executar Context7 research, crie um resumo estruturado:

```markdown
## Context7 Research Summary

**Biblioteca:** [nome]
**Library ID:** /org/project/version
**Query:** [query completa]

### Findings

1. **API Recomendada:**
   - [código exemplo]

2. **Breaking Changes (se houver):**
   - v1 → v2: [mudança]

3. **Best Practices 2025:**
   - [prática 1]
   - [prática 2]

4. **Padrão a Seguir:**
   ```typescript
   // Código exemplo do Context7
   ```

### Implementação

- [ ] API identificada
- [ ] Padrão validado
- [ ] Breaking changes checados
- [ ] Code snippets salvos

**Pronto para implementar:** ✅
```

---

## Invocação

**Via Slash Command:**
```
/research-lib
```

**Manualmente (se skill não configurada):**
```markdown
Execute skill research-lib
```

**Integrado com /check-context:**
Executado automaticamente se keywords detectadas: "nova biblioteca", "primeira vez", "não sei como"

---

## Métricas de Sucesso

Track impact em `.claude/analytics/context7-usage.json`:

```json
{
  "month": "2025-01",
  "research_calls": 12,
  "time_saved_hours": 18,
  "trial_errors_avoided": 34,
  "libraries_researched": ["recharts", "bullmq", "typeorm"]
}
```

**Target:** 15+ research calls/mês → 20h economizadas

---

## References

- **Context7 Official Docs:** https://context7.com/docs
- **MCP Integration:** `.mcp.json` - Linha 44 (`context7` server)
- **ROI Analysis:** `magical-hugging-seahorse.md` - Seção "Context7 Proactive Research"
- **Integration:** `.claude/skills/context-check.md` - Nova Etapa 8

---

**Versão:** 1.0.0
**Criado:** 2026-01-04
**Mantenedor:** Claude Code (Sonnet 4.5)
**Baseado em:** Ecosystem Analysis (magical-hugging-seahorse.md) + Context7 MCP Best Practices
