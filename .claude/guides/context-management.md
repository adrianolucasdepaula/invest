# Context Management Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Gerenciamento de contexto com Claude Sonnet 4.5 (1M tokens)

---

## Overview

Este guia documenta como gerenciar o context window de 1M tokens do Claude Sonnet 4.5, incluindo limites oficiais, configurações otimizadas, e estratégias para prevenir "Prompt is too long".

---

## Limites Oficiais do Claude Sonnet 4.5

### Fontes Oficiais

- [Models Overview](https://platform.claude.com/docs/en/about-claude/models/all-models)
- [Context Windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [1M Context Announcement](https://claude.com/blog/1m-context)

### Comparativo de Modelos

| Modelo | Context Window | Max Output | Preço Input | Preço Output |
|--------|----------------|------------|-------------|--------------|
| **Claude Sonnet 4.5** | **1M tokens (beta)** | **64K tokens** | $3/MTok ($6 >200K) | $15/MTok ($22.50 >200K) |
| Claude Opus 4.5 | 200K tokens | 64K tokens | $5/MTok | $25/MTok |
| Claude Haiku 4.5 | 200K tokens | 64K tokens | $1/MTok | $5/MTok |

---

## Especificações Sonnet 4.5 (Dezembro 2025)

| Parâmetro | Valor | Observação |
|-----------|-------|------------|
| **Context Window (padrão)** | 200K tokens | ~150K palavras |
| **Context Window (beta)** | **1M tokens** | ~750K palavras, requer beta header |
| **Max Output Tokens** | 64K tokens | Igual ao Opus 4.5 |
| **Extended Thinking** | Sim | Tokens removidos automaticamente |
| **Context Awareness** | Sim | Rastreia tokens restantes nativamente |
| **API ID** | `claude-sonnet-4-5-20250929` | Versão mais recente |
| **Conhecimento confiável** | Jan 2025 | Dados de treinamento até Jul 2025 |

---

## Como Habilitar 1M Context Window

### Requisitos

- Organização em **Tier 4** ou com rate limits customizados
- Header beta obrigatório: `context-1m-2025-08-07`

### Python SDK

```python
response = client.beta.messages.create(
    model="claude-sonnet-4-5",
    betas=["context-1m-2025-08-07"]  # Header obrigatório para 1M
)
```

### TypeScript SDK

```typescript
const response = await anthropic.messages.create({
  model: "claude-sonnet-4-5",
  max_tokens: 64000,
  messages: [{ role: "user", content: "..." }],
  // @ts-ignore - beta header
  betas: ["context-1m-2025-08-07"]
});
```

---

## Configuração Otimizada (Sonnet 4.5 - 1M Contexto)

### Variáveis de Ambiente

| Variável | Valor | Observação |
|----------|-------|------------|
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | 64000 | Máximo oficial |
| `MAX_THINKING_TOKENS` | 100000 | Extended thinking |
| `MAX_MCP_OUTPUT_TOKENS` | 200000 | Output de MCPs |
| `MAX_TOOL_OUTPUT_TOKENS` | 200000 | Output de ferramentas |
| `BASH_DEFAULT_TIMEOUT_MS` | 600000 | 10 minutos - builds longos |
| `BASH_MAX_TIMEOUT_MS` | 1800000 | 30 minutos - operações muito longas |
| `MCP_TIMEOUT` | 120000 | 2 minutos - conexão inicial com MCPs |
| `MCP_TOOL_TIMEOUT` | 300000 | 5 minutos - operações de MCPs complexas |

### Notas Importantes

- Valores alinhados com limites oficiais da Anthropic (Dezembro 2025)
- Context window de 1M permite sessões muito mais longas sem `/compact`
- Extended thinking tokens são removidos automaticamente do contexto

---

## Leitura de Arquivos Grandes

### Limites do Read Tool

**IMPORTANTE:** O Read tool do Claude Code tem limite **HARDCODED de 25.000 tokens** que NÃO pode ser alterado por variáveis de ambiente.

### Limites por Tipo de Ferramenta

| Ferramenta | Limite | Configurável? |
|------------|--------|---------------|
| Read tool (built-in) | 25.000 tokens | ❌ NÃO (hardcoded) |
| MCP tools (mcp__*) | 25.000 tokens | ✅ SIM (MAX_MCP_OUTPUT_TOKENS) |

### Variáveis Configuradas (afetam apenas MCPs)

- `MAX_MCP_OUTPUT_TOKENS=25000` - Output de ferramentas MCP (padrão oficial)

### Arquivos de Configuração

- `~/.claude/settings.json` (global)
- `.claude/settings.json` (projeto)
- `.claude/settings.local.json` (local)

---

## Solução para Arquivos >25K tokens - Leitura em Chunks

### Estratégia de Chunks

```typescript
// Arquivo grande (ex: 71K tokens, ~6200 linhas)
// Dividir em chunks de ~1500 linhas

Read(file_path="arquivo.md", offset=1, limit=1500)      // Chunk 1
Read(file_path="arquivo.md", offset=1501, limit=1500)   // Chunk 2
Read(file_path="arquivo.md", offset=3001, limit=1500)   // Chunk 3
Read(file_path="arquivo.md", offset=4501, limit=1500)   // Chunk 4
// ... continua até cobrir todo o arquivo
```

### Cálculo de Chunks

- ~11.5 tokens por linha (média para markdown/código)
- 25.000 tokens / 11.5 = ~2.170 linhas máximo por chunk
- **Recomendado:** **1.500 linhas** por chunk (margem de segurança)

### Exemplo Prático

```typescript
// Arquivo com 6.200 linhas
const chunks = [
  { offset: 1, limit: 1500 },      // Linhas 1-1500
  { offset: 1501, limit: 1500 },   // Linhas 1501-3000
  { offset: 3001, limit: 1500 },   // Linhas 3001-4500
  { offset: 4501, limit: 1500 },   // Linhas 4501-6000
  { offset: 6001, limit: 200 }     // Linhas 6001-6200
];

for (const chunk of chunks) {
  const content = await Read({
    file_path: "large-file.md",
    offset: chunk.offset,
    limit: chunk.limit
  });
  // Processar chunk...
}
```

### Referências

- [GitHub Issue #4002](https://github.com/anthropics/claude-code/issues/4002) - Discussão do limite
- [GitHub Issue #7679](https://github.com/anthropics/claude-code/issues/7679) - Feature request para aumentar (pendente)

---

## Compact Instructions

### Quando Compactar

Quando for necessário compactar contexto, use `/compact` com estas instruções:

```bash
/compact Keep: recent code changes, error traces, architecture decisions, current task status.
Discard: verbose explanations, old debug output, completed task details, intermediate steps.
```

### Frequência Recomendada

| Context Window | Compactar a Cada |
|----------------|------------------|
| 200K tokens | 30-40 interações |
| 1M tokens | 150-200 interações |

### Alternativa ao Compact

```bash
/clear  # Limpar contexto completamente (iniciar tarefa nova)
```

---

## Extended Thinking Guidelines (Sonnet 4.5)

### Capacidades Nativas

**Sonnet 4.5 preserva thinking blocks automaticamente entre turnos.**

**Context Awareness nativo rastreia tokens restantes durante a conversação.**

### Níveis de Esforço

#### High Effort

**Use para:**

- Planejamento arquitetural
- Bugs complexos multi-arquivo
- Security reviews
- Análise de dados financeiros

**Exemplo:**

```typescript
// Claude automatically uses high effort for complex architectural decisions
// No explicit parameter needed
```

#### Medium Effort

**Use para:**

- Implementação de features
- Debugging padrão
- Code review

#### Low Effort

**Use para:**

- Refactoring simples
- Perguntas rápidas
- Verificação de sintaxe

---

## Prevenção de "Prompt is too long"

### Estratégias Obrigatórias

1. **Compactar proativamente** a cada ~30-40 interações (200K) ou ~150-200 (1M)
2. **Usar `/clear`** ao iniciar tarefa completamente nova
3. **Monitorar com `/cost`** o uso de tokens
4. **Dividir tarefas complexas** em sessões separadas
5. **Evitar carregar arquivos grandes** desnecessariamente

### Workflow Recomendado

```text
Início da Sessão
    ↓
Tarefa 1 (40 interações)
    ↓
/cost (verificar tokens)
    ↓
    Context > 70%?
    ├─ SIM → /compact
    └─ NÃO → Continuar
    ↓
Tarefa 2 (40 interações)
    ↓
/cost (verificar tokens)
    ↓
    Context > 85%?
    ├─ SIM → /compact (obrigatório)
    └─ NÃO → Continuar
```

---

## Proteção para MCPs Playwright/Chrome DevTools

### Hooks de Proteção Ativos

| Hook | Script | Função |
|------|--------|--------|
| `context-monitor.js` | UserPromptSubmit | Monitora contexto, bloqueia em 85% |
| `pre-playwright-guard.js` | PreToolUse (MCPs) | Bloqueia snapshots quando contexto > 70% |

### Thresholds de Bloqueio

| Contexto | Ação |
|----------|------|
| < 50% | Permitir tudo |
| 50-70% | Warning, mas permite |
| 70-85% | BLOQUEIA snapshots (permite clicks, navegação) |
| > 85% | BLOQUEIA TUDO, forçar /compact |

---

## Consumo de Tokens por Operação MCP

### Comparativo 200K vs 1M Context

| Operação | Tokens | % Contexto (200K) | % Contexto (1M) |
|----------|--------|-------------------|-----------------|
| `browser_snapshot` (página complexa) | 25-50k | 12-25% | **2.5-5%** ⭐ |
| `take_snapshot` (Chrome DevTools) | 18-30k | 9-15% | **1.8-3%** ⭐ |
| `browser_take_screenshot` (PNG) | ~1k | <1% | **<0.1%** ⭐ |
| `browser_click/navigate` | ~100 | <0.1% | **<0.01%** ⭐ |

### Thresholds Absolutos (1M Context)

| Threshold | % | Tokens Absolutos |
|-----------|---|------------------|
| Warning | 50% | **500K tokens** |
| Compact | 70% | **700K tokens** |
| Block | 85% | **850K tokens** |

### Best Practices (Sonnet 4.5 - 1M)

1. **Snapshots mais livres** - Com 1M, snapshots consomem apenas ~3% cada
2. **Menos `/compact`** - Thresholds absolutos muito maiores
3. **Sessões longas** - Até 75K linhas de código em uma sessão
4. **Context Awareness** - Modelo rastreia tokens automaticamente

---

## Pacotes MCP Oficiais (Nomes Corretos)

### Pacotes Validados (2025-12-17)

**IMPORTANTE:** Use os nomes corretos dos pacotes MCP.

| MCP Server | Pacote npm Correto | Status |
|------------|-------------------|--------|
| **Playwright** | `@playwright/mcp@latest` | ✅ Oficial |
| **Chrome DevTools** | `chrome-devtools-mcp@latest` | ✅ Oficial |
| **React Context** | `react-context-mcp@latest` | ✅ Comunidade |
| **A11y (Accessibility)** | `a11y-mcp-server` | ✅ Comunidade |
| **Sequential Thinking** | `@modelcontextprotocol/server-sequential-thinking` | ✅ Oficial |
| **Context7 (Docs)** | `@upstash/context7-mcp` | ✅ Comunidade (Upstash) |

### Pacotes INCORRETOS (NÃO EXISTEM no npm)

- ❌ `@anthropic/mcp-server-a11y` → Use `a11y-mcp-server`
- ❌ `@anthropic/mcp-sequential-thinking` → Use `@modelcontextprotocol/server-sequential-thinking`
- ❌ `@anthropic/context7-mcp` → Use `@upstash/context7-mcp`

### Instalação Correta

```bash
# Playwright MCP (oficial)
npx @playwright/mcp@latest

# Chrome DevTools MCP (oficial)
npx chrome-devtools-mcp@latest

# A11y MCP (comunidade)
npx a11y-mcp-server

# Sequential Thinking MCP (oficial)
npx @modelcontextprotocol/server-sequential-thinking

# Context7 MCP (Upstash)
npx @upstash/context7-mcp
```

### Fontes

- [A11y MCP Server - LobeHub](https://lobehub.com/mcp/temanuel1-a11y-mcp-server)
- [Sequential Thinking MCP - PulseMCP](https://www.pulsemcp.com/servers/anthropic-sequential-thinking)
- [Context7 MCP - npm](https://www.npmjs.com/package/@upstash/context7-mcp)
- [Model Context Protocol Servers - GitHub](https://github.com/modelcontextprotocol/servers)

---

## Comandos Úteis

### Comandos de Contexto

```bash
/compact   # Compactar contexto (usar com instruções específicas)
/clear     # Limpar contexto completamente
/cost      # Ver uso de tokens da sessão
/config    # Ver configurações atuais
/mcp       # Ver MCPs ativos
```

### Workflow de Monitoramento

```bash
# 1. Verificar uso atual
/cost

# 2. Se > 70%, compactar
/compact Keep: recent code changes, error traces, decisions. Discard: old output.

# 3. Se > 85%, limpar
/clear

# 4. Verificar configurações
/config
```

---

## Troubleshooting

### Erro: "Prompt is too long"

**Causa:** Contexto excedeu limite (200K padrão ou 1M beta)

**Solução:**

1. Verificar uso: `/cost`
2. Compactar: `/compact Keep: ... Discard: ...`
3. Se persistir: `/clear` e reiniciar tarefa

### Erro: "Read tool exceeded token limit"

**Causa:** Arquivo > 25K tokens (~2.170 linhas)

**Solução:**

```typescript
// Dividir em chunks de 1.500 linhas
Read(file_path="file.md", offset=1, limit=1500)
Read(file_path="file.md", offset=1501, limit=1500)
// ... continuar
```

### Erro: "MCP snapshot blocked by context guard"

**Causa:** Contexto > 70%, hook bloqueou snapshot

**Solução:**

1. `/cost` - verificar uso
2. `/compact` - liberar espaço
3. Tentar snapshot novamente

---

## Métricas de Sucesso

| Métrica | Target | Como Medir |
|---------|--------|------------|
| Sessions sem "prompt too long" | > 95% | Tracking manual |
| Uso de `/compact` | < 1x por 100 interações (1M) | `/cost` histórico |
| Snapshots bloqueados | < 5% | Logs de hooks |
| Context awareness | 100% | Nativo no Sonnet 4.5 |

---

## Fontes

### Documentação Oficial Anthropic

- [Models Overview](https://platform.claude.com/docs/en/about-claude/models/all-models)
- [Context Windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- [1M Context Beta](https://claude.com/blog/1m-context)
- [API Reference](https://docs.anthropic.com/en/api/messages)

### Claude Code Specific

- [GitHub Issue #4002](https://github.com/anthropics/claude-code/issues/4002) - Read tool limit discussion
- [GitHub Issue #7679](https://github.com/anthropics/claude-code/issues/7679) - Feature request for higher limits

### MCP Packages

- [Model Context Protocol](https://github.com/modelcontextprotocol/servers)
- [Playwright MCP](https://www.npmjs.com/package/@playwright/mcp)
- [Chrome DevTools MCP](https://www.npmjs.com/package/chrome-devtools-mcp)
- [Context7 MCP](https://www.npmjs.com/package/@upstash/context7-mcp)
