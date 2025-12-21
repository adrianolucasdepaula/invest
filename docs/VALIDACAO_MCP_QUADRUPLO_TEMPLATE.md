# VALIDAÇÃO MCP QUADRUPLO - FASE XXX: [Nome da Fase]

**Data:** YYYY-MM-DD
**Executor:** Claude Code (Sonnet 4.5)
**Duração Total:** XX minutos

---

## 📋 CONTEXTO DA FASE

### Objetivo

[Descrever brevemente o objetivo da fase - 1-2 parágrafos]

### Arquivos Modificados/Criados

| Arquivo | Tipo | Impacto |
|---------|------|---------|
| `caminho/arquivo1.ts` | Modificado | [Descrição da mudança] |
| `caminho/arquivo2.tsx` | Criado | [Descrição do novo componente] |
| `caminho/arquivo3.md` | Atualizado | [Descrição da documentação] |

### Complexidade

- [ ] **Feature Complexa:** Nova biblioteca, integração, arquitetura
- [ ] **Bug Desconhecido:** >2 horas de debugging sem solução
- [ ] **Nova Biblioteca:** Primeira integração no projeto
- [ ] **Outro:** [Especificar]

**Justificativa para MCP Quadruplo:** [Explicar por que Documentation Research foi necessário]

---

## 1️⃣ PLAYWRIGHT - Navegação e Snapshot

### 1.1 Navegação

**URL Testada:** `http://localhost:3100/[PAGINA]`

```javascript
mcp__playwright__browser_navigate({ url: "http://localhost:3100/[PAGINA]" })
```

**Resultado:**
- ✅ Página carregou com sucesso
- ⏱️ Tempo de carregamento: XXXms

### 1.2 Accessibility Tree Snapshot

```javascript
mcp__playwright__browser_snapshot({})
```

**Resultado:**
- ✅ Snapshot capturado
- 📊 Total de elementos: XXX nodes
- 🔍 Elementos principais identificados:
  - [Elemento 1]: `tipo "texto" [ref=XXX]`
  - [Elemento 2]: `tipo "texto" [ref=XXX]`
  - [Elemento 3]: `tipo "texto" [ref=XXX]`

### 1.3 Screenshot de Evidência

```javascript
mcp__playwright__browser_take_screenshot({
  filename: "docs/screenshots/FASE_XXX-MCP_QUADRUPLO-YYYY-MM-DD.png",
  fullPage: true
})
```

**Resultado:**
- ✅ Screenshot salvo
- 📁 Localização: `docs/screenshots/FASE_XXX-MCP_QUADRUPLO-YYYY-MM-DD.png`

### ✅ Status Playwright: APROVADO

---

## 2️⃣ CHROME DEVTOOLS - Console e Network

### 2.1 Page Snapshot

```javascript
mcp__chrome-devtools__take_snapshot({})
```

**Resultado:**
- ✅ Snapshot capturado

### 2.2 Console Messages

```javascript
mcp__chrome-devtools__list_console_messages({ types: ["error", "warn"] })
```

**Resultado:**

| Tipo | Quantidade | Status |
|------|------------|--------|
| **Errors** | X | ✅ 0 errors |
| **Warnings** | X | ⚠️ X warnings (não-críticos) |

**Detalhes de Warnings (se houver):**
- Warning 1: [Descrição] - [Justificativa por que é não-crítico]
- Warning 2: [Descrição] - [Justificativa por que é não-crítico]

### 2.3 Network Requests

```javascript
mcp__chrome-devtools__list_network_requests({})
```

**Resultado:**

| Métrica | Valor | Status |
|---------|-------|--------|
| **Total Requests** | XX | - |
| **Successful (2xx)** | XX | ✅ |
| **Failed (4xx/5xx)** | X | ✅ 0 failures |

**Requests Principais:**
- `GET /api/v1/[endpoint]` → 200 OK (XXXms)
- `GET /api/v1/[endpoint]` → 200 OK (XXXms)

### ✅ Status Chrome DevTools: APROVADO

---

## 3️⃣ ACCESSIBILITY - Audit WCAG

### 3.1 Audit Completo

```javascript
mcp__a11y__audit_webpage({ url: "http://localhost:3100/[PAGINA]" })
```

### 3.2 Summary

```javascript
mcp__a11y__get_summary({ url: "http://localhost:3100/[PAGINA]" })
```

**Resultado:**

| Categoria | Quantidade | Status |
|-----------|------------|--------|
| **Critical Violations** | X | ✅ 0 violations |
| **Serious** | X | ⚠️ [Se >0, listar abaixo] |
| **Moderate** | X | ℹ️ [Se >0, considerar correção] |
| **Minor** | X | - |

**Violations Críticas (se houver):**
- [Listar cada violation com descrição e solução aplicada]

**Compliance:**
- ✅ WCAG 2.1 AA: Compliant
- ✅ Elementos interativos acessíveis via teclado
- ✅ Contraste de cores adequado

### ✅ Status Accessibility: APROVADO

---

## 4️⃣ DOCUMENTATION RESEARCH ⭐ (Etapa Adicional)

### 4.1 GitHub Issues Research

**Query Executada:**
```
"[biblioteca] [tecnologia] [problema] site:github.com/issues 2024 OR 2025"
```

**Exemplo:**
```
"Radix UI React 19 hydration site:github.com/issues 2024 OR 2025"
```

**Issues Encontrados:**

| Issue # | Repositório | Título | Status | Relevância |
|---------|-------------|--------|--------|------------|
| #XXXX | [org/repo] | [Título] | Open/Closed | ⭐⭐⭐⭐⭐ |
| #XXXX | [org/repo] | [Título] | Open/Closed | ⭐⭐⭐⭐ |

**Soluções/Workarounds Identificados:**
- **Issue #XXXX:** [Descrever solução encontrada]
- **Issue #XXXX:** [Descrever workaround aplicado]

**Ação Tomada:** [Descrever como a issue influenciou a implementação]

### 4.2 Documentação Oficial

**Query Executada:**
```
"[tecnologia] official documentation [feature] 2025"
```

**Exemplo:**
```
"Next.js turbopack cache official documentation 2025"
```

**Fontes Consultadas:**

| Fonte | URL | Informação Relevante |
|-------|-----|----------------------|
| [Tech Oficial] | https://... | [Feature X está documentado como...] |
| [Tech Oficial] | https://... | [Flag Y deve ser configurado como...] |

**Validação:**
- ✅ Feature documentada oficialmente
- ✅ Não deprecated
- ✅ Exemplos de uso disponíveis

**Ação Tomada:** [Descrever como a documentação validou a abordagem]

### 4.3 KNOWN-ISSUES.md (Projeto Interno)

**Grep Executado:**
```bash
Grep: "keyword1|keyword2|keyword3" em KNOWN-ISSUES.md
```

**Exemplo:**
```bash
Grep: "hydration|useId|Radix" em KNOWN-ISSUES.md
```

**Precedentes Encontrados:**

| Issue Interno | Linha | Descrição | Root Cause |
|---------------|-------|-----------|------------|
| #HYDRATION_XXX | XXX | [Descrição] | [Root cause] |

**Solução Anterior:**
- [Descrever solução que foi aplicada anteriormente no projeto]

**Ação Tomada:** [Descrever se reutilizou solução ou adaptou]

### 4.4 Git History Analysis

**Comando Executado:**
```bash
git log --grep="keyword1|keyword2" --all --oneline -20
```

**Exemplo:**
```bash
git log --grep="hydration|dynamic import" --all --oneline -20
```

**Commits Relacionados:**

| Commit Hash | Data | Mensagem | Relevância |
|-------------|------|----------|------------|
| abc1234 | YYYY-MM-DD | [Mensagem] | ⭐⭐⭐⭐⭐ |
| def5678 | YYYY-MM-DD | [Mensagem] | ⭐⭐⭐⭐ |

**Padrão Identificado:**
- [Descrever padrão de solução encontrado em commits anteriores]

**Ação Tomada:** [Descrever como seguiu ou adaptou o padrão existente]

### 4.5 WebSearch Paralelo (Best Practices)

**Queries Executadas (4 em paralelo):**

1. **Best Practices:**
   ```
   "[tecnologia] best practices 2025"
   ```
   **Fontes:** [Lista de 3+ fontes]
   **Consenso:** [O que as fontes concordam]

2. **Official Documentation:**
   ```
   "[tecnologia] official documentation"
   ```
   **Fonte:** [URL da documentação oficial]
   **Validação:** [Feature confirmada/negada]

3. **Community Solutions:**
   ```
   "[problema] solution site:stackoverflow.com OR github.com"
   ```
   **Top 3 Soluções:**
   - Solução 1: [Descrição] - [Upvotes/Stars]
   - Solução 2: [Descrição] - [Upvotes/Stars]
   - Solução 3: [Descrição] - [Upvotes/Stars]

4. **Comparison:**
   ```
   "[alternativa1] vs [alternativa2] comparison 2025"
   ```
   **Resultado:** [Qual alternativa foi escolhida e por quê]

**Cross-Validation:**
- ✅ Mínimo 3 fontes concordando: [SIM/NÃO]
- ✅ Docs oficiais consultados: [SIM/NÃO]
- ✅ Solução validada por comunidade: [SIM/NÃO]

**Decisão Final Baseada em Research:**
[Descrever a decisão técnica tomada com base na pesquisa de documentação]

### ✅ Status Documentation Research: APROVADO

---

## 📊 MÉTRICAS FINAIS

### Zero Tolerance Validation

| Critério | Comando | Resultado | Status |
|----------|---------|-----------|--------|
| **TypeScript (Backend)** | `cd backend && npx tsc --noEmit` | 0 errors | ✅ |
| **TypeScript (Frontend)** | `cd frontend && npx tsc --noEmit` | 0 errors | ✅ |
| **Build (Backend)** | `cd backend && npm run build` | Success | ✅ |
| **Build (Frontend)** | `cd frontend && npm run build` | Success | ✅ |
| **Lint (Frontend)** | `cd frontend && npm run lint` | 0 critical warnings | ✅ |

### MCP Quadruplo Summary

| Etapa | Status | Tempo | Observações |
|-------|--------|-------|-------------|
| 1. Playwright | ✅ APROVADO | Xmin | [Observações] |
| 2. Chrome DevTools | ✅ APROVADO | Xmin | [Observações] |
| 3. Accessibility | ✅ APROVADO | Xmin | [Observações] |
| 4. Documentation Research | ✅ APROVADO | Xmin | [Observações] |

### ROI da Documentation Research

| Métrica | Valor |
|---------|-------|
| **Tempo gasto em research** | XX minutos |
| **Issues/Problemas evitados** | X |
| **Tempo economizado (estimado)** | X horas |
| **ROI** | XXX% |

**Cálculo:**
- Se não houvesse research → Estimativa de XX horas de debugging
- Com research preventivo → XX minutos + implementação correta na primeira vez
- **Economia:** XX horas (~XX%)

---

## 🎯 DECISÕES TÉCNICAS TOMADAS

### Decisão 1: [Título]

**Problema:**
[Descrever o problema que levou à decisão]

**Alternativas Consideradas:**
1. [Alternativa 1] - [Prós/Contras]
2. [Alternativa 2] - [Prós/Contras]
3. [Alternativa 3] - [Prós/Contras]

**Decisão Final:**
[Alternativa escolhida]

**Justificativa (baseada em documentation research):**
- GitHub Issues: [Evidência 1]
- Docs Oficiais: [Evidência 2]
- Git History: [Evidência 3]
- Community: [Evidência 4]

---

## 📸 SCREENSHOTS DE EVIDÊNCIA

### Screenshot 1: [Título]
- **Arquivo:** `docs/screenshots/FASE_XXX-evidencia1.png`
- **Descrição:** [O que mostra]

### Screenshot 2: [Título]
- **Arquivo:** `docs/screenshots/FASE_XXX-evidencia2.png`
- **Descrição:** [O que mostra]

---

## ✅ CHECKLIST FINAL

- [ ] **MCP Triplo (Etapas 1-3):**
  - [ ] Playwright: Navegação + Snapshot + Screenshot
  - [ ] Chrome DevTools: Console 0 errors + Network 0 failures
  - [ ] Accessibility: 0 critical violations WCAG 2.1 AA

- [ ] **Documentation Research (Etapa 4):**
  - [ ] GitHub Issues: Mínimo 2 issues relevantes
  - [ ] Docs Oficiais: Feature validada e não deprecated
  - [ ] KNOWN-ISSUES.md: Precedentes checados
  - [ ] Git History: Padrões identificados
  - [ ] WebSearch: Mínimo 3 fontes validando

- [ ] **Zero Tolerance:**
  - [ ] TypeScript: 0 errors (backend + frontend)
  - [ ] Build: Success (backend + frontend)
  - [ ] Lint: 0 critical warnings

- [ ] **Documentação:**
  - [ ] ROADMAP.md atualizado
  - [ ] CHANGELOG.md atualizado (se aplicável)
  - [ ] INDEX.md atualizado (se novos docs)
  - [ ] KNOWN-ISSUES.md atualizado (se novo issue documentado)

---

## 🟢 RESULTADO FINAL

**Status:** ✅ **VALIDAÇÃO MCP QUADRUPLO COMPLETA**

**Resumo:**
- ✅ MCP Triplo: Aprovado (0 erros)
- ✅ Documentation Research: Aprovado (solução validada)
- ✅ Zero Tolerance: Aprovado (0 erros TS, build success)
- ✅ Implementação: Correta na primeira vez

**Próximos Passos:**
- [Listar próximos passos, se houver]

---

**Gerado com:** Claude Code (Sonnet 4.5) + MCP Quadruplo Methodology
**Referência:** `docs/MCP_QUADRUPLO_METODOLOGIA.md`
