# Guia Anti-Truncamento: MCPs Playwright e Chrome DevTools

**Data:** 2025-11-25
**Problema:** Output dos MCPs excede 25000 tokens (padrão) e é truncado
**Solução Definitiva:** MAX_MCP_OUTPUT_TOKENS=200000 (máximo da janela de contexto)
**Otimização:** Usar paginação e filtering para performance

---

## 🎯 CONFIGURAÇÃO OBRIGATÓRIA

### ✅ PASSO 1: Configurar MAX_MCP_OUTPUT_TOKENS=200000

**Arquivo `.env` (raiz do projeto):**
```bash
# =============================================================================
# MCP CONFIGURATION (Model Context Protocol)
# =============================================================================
MAX_MCP_OUTPUT_TOKENS=200000  # MÁXIMO - usa janela de contexto completa (200k tokens)
```

**Por que 200000?**
- Limite padrão: 25000 tokens ⚠️ (TRUNCA em páginas complexas)
- Limite máximo: 200000 tokens ✅ (janela de contexto completa do Claude Code)
- Este projeto usa 200k para validação tripla MCP SEM truncamento

**Como aplicar:**
1. Editar `.env` na raiz do projeto
2. Adicionar `MAX_MCP_OUTPUT_TOKENS=200000`
3. Reiniciar Claude Code (recarregar janela VS Code: `Ctrl+Shift+P` → "Reload Window")

---

## 🚀 BOAS PRÁTICAS (OTIMIZAÇÃO)

**Com MAX_MCP_OUTPUT_TOKENS=200000 configurado, você pode:**
- ✅ Usar `browser_snapshot()` sem medo (não trunca mais)
- ✅ Usar `list_console_messages()` sem filtros (retorna tudo)
- ✅ Usar `list_network_requests()` sem filtros (retorna tudo)

**Mas ainda é recomendado usar paginação/filtering para:**
- ⚡ Performance (menos tokens = respostas mais rápidas)
- 📊 Clareza (focar apenas no que é relevante)
- 💾 Economia de contexto (deixar espaço para outras operações)

---

### ❌ EVITAR (Causa Lentidão, Mas NÃO Trunca Mais)

```typescript
// ❌ ERRADO: Snapshot de página inteira (pode ter > 25k tokens)
await mcp__playwright__browser_snapshot();

// ❌ ERRADO: Listar TODOS os console messages sem filtro
await mcp__chrome-devtools__list_console_messages({});

// ❌ ERRADO: Listar TODAS as network requests sem paginação
await mcp__chrome-devtools__list_network_requests({});
```

### ✅ SEMPRE FAZER (Evita Truncamento)

```typescript
// ✅ CORRETO: Screenshot de página inteira (visual, não texto)
await mcp__playwright__browser_take_screenshot({
  filename: "VALIDACAO_PAGINA_COMPLETA.png",
  fullPage: true
});

// ✅ CORRETO: Console messages COM FILTRO (apenas erros)
await mcp__chrome-devtools__list_console_messages({
  types: ["error"],        // Apenas erros (não warn/log/info)
  pageSize: 20,            // Máximo 20 mensagens
  pageIdx: 0               // Primeira página
});

// ✅ CORRETO: Network requests COM FILTRO (apenas XHR/Fetch)
await mcp__chrome-devtools__list_network_requests({
  resourceTypes: ["xhr", "fetch"],  // Apenas requisições API
  pageSize: 10,                     // Máximo 10 requisições
  pageIdx: 0                        // Primeira página
});
```

---

## 📚 BOAS PRÁTICAS POR MCP

### 1. Playwright MCP

#### A) Browser Snapshot (EVITAR - preferir screenshot)

**Problema:** Retorna texto completo da página (> 25k tokens em páginas complexas)

**Solução 1: Usar screenshot ao invés de snapshot**
```typescript
// ✅ PREFERIDO: Screenshot visual (não trunca)
await mcp__playwright__browser_take_screenshot({
  filename: "VALIDACAO_UI.png",
  fullPage: true,
  type: "png"
});
```

**Solução 2: Snapshot apenas quando necessário (validação de texto)**
```typescript
// ✅ ACEITÁVEL: Snapshot para validar texto específico
// Use depois de screenshot para economia de tokens
await mcp__playwright__browser_snapshot();
// → Verificar manualmente se não truncou
// → Se truncar, validar apenas por screenshot
```

#### B) Console Messages

**Problema:** Pode ter centenas de logs/warns em desenvolvimento

**Solução: Filtrar apenas erros**
```typescript
// ✅ CORRETO: Apenas erros (crítico)
await mcp__playwright__browser_console_messages({
  onlyErrors: true  // Filtra apenas console.error
});
```

#### C) Element-Specific Screenshot

**Uso:** Quando precisa validar componente específico
```typescript
// ✅ CORRETO: Screenshot de elemento específico
await mcp__playwright__browser_take_screenshot({
  filename: "VALIDACAO_TABELA_ATIVOS.png",
  element: "tabela de ativos",
  ref: "e123"  // Ref do snapshot anterior
});
```

---

### 2. Chrome DevTools MCP

#### A) Snapshot (USAR COM CAUTELA)

**Problema:** `verbose: true` pode gerar > 25k tokens

**Solução: Usar verbose: false (padrão)**
```typescript
// ✅ CORRETO: Snapshot resumido (não verbose)
await mcp__chrome-devtools__take_snapshot({
  verbose: false  // Apenas informações essenciais
});

// ✅ MELHOR AINDA: Screenshot ao invés de snapshot
await mcp__chrome-devtools__take_screenshot({
  filePath: "VALIDACAO_CHROME.png",
  fullPage: true
});
```

#### B) Console Messages (COM PAGINAÇÃO)

**Problema:** Aplicações grandes têm 100+ console messages

**Solução: Paginar e filtrar por tipo**
```typescript
// ✅ CORRETO: Primeira página, apenas erros
await mcp__chrome-devtools__list_console_messages({
  types: ["error"],     // Apenas erros críticos
  pageSize: 20,         // Máximo 20 mensagens
  pageIdx: 0,           // Primeira página (0-based)
  includePreservedMessages: false  // Apenas sessão atual
});

// Se precisar de warnings também:
await mcp__chrome-devtools__list_console_messages({
  types: ["error", "warn"],  // Erros + Warnings
  pageSize: 30,
  pageIdx: 0
});

// Se precisar de mais páginas (caso pageSize não seja suficiente):
await mcp__chrome-devtools__list_console_messages({
  types: ["error"],
  pageSize: 20,
  pageIdx: 1  // Segunda página
});
```

**Tipos disponíveis:**
- `"error"` - console.error (SEMPRE incluir)
- `"warn"` - console.warn (incluir se relevante)
- `"log"`, `"info"`, `"debug"` - Evitar (muito verboso)

#### C) Network Requests (COM PAGINAÇÃO E FILTRO)

**Problema:** Aplicações SPA têm 50+ network requests (scripts, images, fonts, etc)

**Solução: Filtrar apenas XHR/Fetch (requisições API)**
```typescript
// ✅ CORRETO: Apenas requisições API (XHR + Fetch)
await mcp__chrome-devtools__list_network_requests({
  resourceTypes: ["xhr", "fetch"],  // Apenas API calls
  pageSize: 10,                     // Máximo 10 requisições
  pageIdx: 0,                       // Primeira página
  includePreservedRequests: false   // Apenas sessão atual
});

// Se precisar de outras resources (scripts, stylesheets):
await mcp__chrome-devtools__list_network_requests({
  resourceTypes: ["xhr", "fetch", "script"],
  pageSize: 15,
  pageIdx: 0
});
```

**Resource Types disponíveis:**
- `"xhr"`, `"fetch"` - **SEMPRE incluir** (requisições API)
- `"document"` - Navegação de página (útil)
- `"script"`, `"stylesheet"` - Apenas se relevante
- `"image"`, `"font"`, `"media"` - **EVITAR** (muito verboso)

#### D) Get Specific Network Request (DEPOIS de list)

**Uso:** Detalhar payload de requisição específica
```typescript
// 1. Listar requisições (filtrado)
await mcp__chrome-devtools__list_network_requests({
  resourceTypes: ["xhr", "fetch"],
  pageSize: 10,
  pageIdx: 0
});
// → Retorna: [{ reqid: 12, url: "/api/v1/assets", ... }, ...]

// 2. Detalhar requisição específica
await mcp__chrome-devtools__get_network_request({
  reqid: 12  // ID da lista anterior
});
// → Retorna: headers, payload, response, timing, etc
```

#### E) Get Specific Console Message (DEPOIS de list)

**Uso:** Detalhar stack trace de erro específico
```typescript
// 1. Listar erros
await mcp__chrome-devtools__list_console_messages({
  types: ["error"],
  pageSize: 10,
  pageIdx: 0
});
// → Retorna: [{ msgid: 5, text: "TypeError: ...", ... }, ...]

// 2. Detalhar erro específico (stack trace completo)
await mcp__chrome-devtools__get_console_message({
  msgid: 5  // ID da lista anterior
});
// → Retorna: stack trace, source location, timestamp, etc
```

---

## 🎯 WORKFLOW VALIDAÇÃO TRIPLA MCP (SEM TRUNCAMENTO)

### Etapa 1: Playwright MCP (UI + Interação)

```typescript
// 1. Navegação
await mcp__playwright__browser_navigate({
  url: "http://localhost:3100/dashboard"
});

// 2. Screenshot COMPLETO (não snapshot!)
await mcp__playwright__browser_take_screenshot({
  filename: "VALIDACAO_DASHBOARD_FULL.png",
  fullPage: true,
  type: "png"
});

// 3. Interação (clique em botão)
// OBS: Precisa de snapshot MÍNIMO para pegar "ref" do elemento
await mcp__playwright__browser_snapshot();  // ⚠️ Pode truncar, mas necessário
// → Se truncar: usar screenshot + inspect manual

await mcp__playwright__browser_click({
  element: "Sincronizar em Massa",
  ref: "e47"  // Pegar do snapshot
});

// 4. Screenshot PÓS-INTERAÇÃO
await mcp__playwright__browser_take_screenshot({
  filename: "VALIDACAO_DASHBOARD_APOS_CLIQUE.png",
  fullPage: true
});

// 5. Console (apenas erros!)
await mcp__playwright__browser_console_messages({
  onlyErrors: true
});
```

**Resultado esperado:**
- ✅ 2 screenshots capturados (evidência visual)
- ✅ Console errors: 0 (ou lista específica)
- ⚠️ Snapshot pode truncar (OK, temos screenshots)

---

### Etapa 2: Chrome DevTools MCP (Console + Network + Payload)

```typescript
// 1. Screenshot inicial
await mcp__chrome-devtools__take_screenshot({
  filePath: "VALIDACAO_CHROME_INICIAL.png",
  fullPage: true
});

// 2. Console messages (FILTRADO - apenas errors)
await mcp__chrome-devtools__list_console_messages({
  types: ["error"],       // Apenas erros
  pageSize: 20,
  pageIdx: 0
});
// → Se encontrar erros, detalhar com get_console_message

// 3. Network requests (FILTRADO - apenas API)
await mcp__chrome-devtools__list_network_requests({
  resourceTypes: ["xhr", "fetch"],  // Apenas API
  pageSize: 10,
  pageIdx: 0
});
// → Retorna: [{ reqid: 12, url: "/api/v1/assets", status: 200 }, ...]

// 4. Payload de requisição específica
await mcp__chrome-devtools__get_network_request({
  reqid: 12  // Pegar da lista anterior
});
// → Validar: response payload, headers, timing

// 5. Screenshot final
await mcp__chrome-devtools__take_screenshot({
  filePath: "VALIDACAO_CHROME_FINAL.png"
});
```

**Resultado esperado:**
- ✅ 2 screenshots capturados
- ✅ Console errors: lista filtrada (< 20 itens)
- ✅ Network requests: lista filtrada (< 10 itens)
- ✅ Payload detalhado: 1 request específica

---

### Etapa 3: Sequential Thinking MCP (Análise Profunda)

**Uso:** Análise de causa raiz, decisões técnicas

```typescript
await mcp__sequential-thinking__sequentialthinking({
  thought: "Analisando problema de truncamento nos MCPs...",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true,
  isRevision: false
});
// ... continuar thoughts até conclusão
```

**Resultado esperado:**
- ✅ Análise completa em 5-10 thoughts
- ✅ Conclusão definitiva (não workaround)

---

## 📊 CHECKLIST ANTI-TRUNCAMENTO

Antes de cada validação MCP, verificar:

**Playwright:**
- [ ] **NUNCA** usar `browser_snapshot()` sem necessidade (preferir screenshot)
- [ ] **SEMPRE** usar `browser_take_screenshot({ fullPage: true })` para UI completa
- [ ] **SEMPRE** usar `browser_console_messages({ onlyErrors: true })`
- [ ] **EVITAR** snapshot de páginas complexas (> 100 elementos)

**Chrome DevTools:**
- [ ] **SEMPRE** usar `take_snapshot({ verbose: false })` (padrão)
- [ ] **SEMPRE** usar `list_console_messages` com `types` + `pageSize`
- [ ] **SEMPRE** usar `list_network_requests` com `resourceTypes` + `pageSize`
- [ ] **SEMPRE** paginação: `pageSize: 10-20` (não omitir!)
- [ ] **EVITAR** incluir preserved messages/requests (sessão anterior)

**Geral:**
- [ ] **PREFERIR** screenshots (visual) ao invés de snapshots (texto)
- [ ] **FILTRAR** console messages (apenas errors, no máximo errors+warns)
- [ ] **FILTRAR** network requests (apenas xhr+fetch, no máximo +document)
- [ ] **PAGINAR** listas grandes (pageSize: 10-20 por página)
- [ ] **DETALHAR** apenas itens específicos (get_network_request, get_console_message)

---

## ⚠️ O QUE FAZER SE TRUNCAR

**Cenário:** Output truncado mesmo seguindo boas práticas

**Diagnóstico:**
```
[OUTPUT TRUNCATED - exceeded 25000 token limit]
The tool output was truncated...
```

**Solução:**

1. **Verificar se usou paginação:**
   - Se não usou `pageSize`: adicionar `pageSize: 10`
   - Se já usou `pageSize: 20`: reduzir para `pageSize: 10`

2. **Verificar se usou filtros:**
   - Console: adicionar `types: ["error"]`
   - Network: adicionar `resourceTypes: ["xhr", "fetch"]`

3. **Usar screenshot ao invés de snapshot:**
   - Substituir `browser_snapshot()` por `browser_take_screenshot()`
   - Substituir `take_snapshot()` por `take_screenshot()`

4. **Navegar por páginas (se necessário):**
   ```typescript
   // Página 1
   await list_console_messages({ types: ["error"], pageSize: 10, pageIdx: 0 });

   // Página 2 (se necessário)
   await list_console_messages({ types: ["error"], pageSize: 10, pageIdx: 1 });
   ```

5. **Detalhar apenas itens críticos:**
   - Usar `get_network_request({ reqid })` apenas para 1-2 requests críticas
   - Usar `get_console_message({ msgid })` apenas para erros específicos

---

## 🚀 EXEMPLO PRÁTICO: VALIDAÇÃO DASHBOARD (SEM TRUNCAMENTO)

### ❌ ANTES (Truncava)

```typescript
// 1. Snapshot completo (> 25k tokens!)
await mcp__playwright__browser_snapshot();  // ❌ TRUNCADO

// 2. Todos console messages (100+ items)
await mcp__chrome-devtools__list_console_messages({});  // ❌ TRUNCADO

// 3. Todas network requests (50+ items)
await mcp__chrome-devtools__list_network_requests({});  // ❌ TRUNCADO
```

### ✅ DEPOIS (Não Trunca)

```typescript
// 1. Screenshot visual (não trunca)
await mcp__playwright__browser_take_screenshot({
  filename: "VALIDACAO_DASHBOARD.png",
  fullPage: true
});

// 2. Apenas erros (< 10 items)
await mcp__chrome-devtools__list_console_messages({
  types: ["error"],
  pageSize: 20,
  pageIdx: 0
});

// 3. Apenas API requests (< 10 items)
await mcp__chrome-devtools__list_network_requests({
  resourceTypes: ["xhr", "fetch"],
  pageSize: 10,
  pageIdx: 0
});

// 4. Payload de 1 request específica
await mcp__chrome-devtools__get_network_request({
  reqid: 12  // GET /api/v1/market-data/sync-status
});
```

**Resultado:**
- ✅ 0 truncamentos
- ✅ Dados completos e relevantes
- ✅ Token usage: ~5k tokens (vs 25k+ antes)

---

## 📚 REFERÊNCIAS

**Documentação MCPs:**
- Playwright MCP: Parâmetros `onlyErrors`, `element`, `fullPage`
- Chrome DevTools MCP: Parâmetros `types`, `resourceTypes`, `pageSize`, `pageIdx`, `verbose`

**Limites:**
- Token limit: 25000 tokens por tool output
- Recomendado: < 10000 tokens por call (margem de segurança)

**Prioridades:**
1. **Screenshots** > Snapshots (visual > texto)
2. **Filtros** > Dados completos (errors > all messages)
3. **Paginação** > Lista completa (pageSize: 10-20)
4. **Detalhamento** > Overview (get_specific após list)

---

**Este guia garante 0 truncamentos nos MCPs Playwright e Chrome DevTools, permitindo validação tripla MCP completa conforme metodologia do CLAUDE.md.**
