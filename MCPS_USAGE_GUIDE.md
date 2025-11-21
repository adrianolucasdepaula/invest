# Guia de Uso de MCPs - B3 AI Analysis Platform

**Data:** 2025-11-14
**Projeto:** invest-claude-web
**MCPs Instalados:** 8
**Status:** 100% Connected ✅

---

## 📑 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Sequential Thinking MCP](#1-sequential-thinking-mcp)
3. [Filesystem MCP](#2-filesystem-mcp)
4. [Shell MCP](#3-shell-mcp)
5. [A11y MCP](#4-a11y-mcp)
6. [Context7 MCP](#5-context7-mcp)
7. [Playwright MCP](#6-playwright-mcp)
8. [Chrome DevTools MCP](#7-chrome-devtools-mcp)
9. [Selenium MCP](#8-selenium-mcp)
10. [PostgreSQL MCP](#9-postgresql-mcp)
11. [GitHub MCP](#10-github-mcp)
12. [Docker MCP](#11-docker-mcp)
13. [Memory MCP](#12-memory-mcp)
14. [Casos de Uso no Projeto](#casos-de-uso-no-projeto)
15. [Workflows Recomendados](#workflows-recomendados)

---

## 🎯 VISÃO GERAL

### MCPs Ativos

| MCP | Categoria | Status | Propósito Principal |
|-----|-----------|--------|---------------------|
| Sequential Thinking | Raciocínio | ✅ Connected | Análise profunda e pensamento estruturado |
| Filesystem | I/O | ✅ Connected | Leitura/escrita segura de arquivos |
| Shell | Shell | ✅ Connected | Execução de comandos PowerShell/CMD |
| A11y | Acessibilidade | ✅ Connected | Auditoria WCAG automatizada |
| Context7 | Documentação | ✅ Connected | Docs atualizadas de frameworks |
| Playwright | Automação Web | ✅ Connected | Testes E2E e automação browser |
| Chrome DevTools | Debugging | ✅ Connected | Inspeção e debugging web |
| Selenium | Automação Web | ✅ Connected | Automação web alternativa |
| PostgreSQL | Database | ✅ Connected | Acesso direto ao banco de dados |
| GitHub | DevOps | ✅ Connected | Gestão de PRs, Issues e Repositório |
| Docker | DevOps | ✅ Connected | Gerenciamento de containers |
| Memory | Knowledge | ✅ Connected | Grafo de conhecimento persistente |

### Configuração

### Configuração

⚠️ **IMPORTANTE:** O projeto agora utiliza uma configuração centralizada em `mcp_config.json`.

**Localização:**
- Global: `C:\Users\adria\.gemini\antigravity\mcp_config.json`
- Projeto: `.agent/mcp_config.json`

**Configuração Atual (`mcp_config.json`):**

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://invest_user:invest_password@localhost:5532/invest_db"
      ]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\adria\\Dropbox\\PC (2)\\Downloads\\Python - Projetos\\invest-claude-web"
      ]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "docker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-docker"]
    },
    "github": {
      "command": "npx",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "..."
      }
    }
  }
}
```

---

## 1. SEQUENTIAL THINKING MCP

### 📊 Informações Técnicas

- **Pacote:** `@modelcontextprotocol/server-sequential-thinking`
- **Repositório:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking)
- **Licença:** MIT
- **Propósito:** Raciocínio estruturado e análise profunda

### 🛠️ Tool Disponível

**`sequential_thinking`**

Permite resolução de problemas através de um processo de pensamento estruturado e reflexivo.

**Parâmetros:**

```typescript
{
  thought: string;              // Passo atual de pensamento
  nextThoughtNeeded: boolean;   // Se outra etapa é necessária
  thoughtNumber: number;        // Número do pensamento atual (1, 2, 3...)
  totalThoughts: number;        // Total estimado de pensamentos
  isRevision?: boolean;         // Se revisa pensamentos anteriores
  revisesThought?: number;      // Qual pensamento é reconsiderado
  branchFromThought?: number;   // Ponto de ramificação
  branchId?: string;            // Identificador da ramificação
  needsMoreThoughts?: boolean;  // Se mais pensamentos são necessários
}
```

### 💡 Casos de Uso no Projeto

**1. Planejamento de Refatorações Complexas**
```
Usar sequential_thinking para:
- Analisar impacto de mudanças em múltiplos arquivos
- Planejar ordem de implementação
- Identificar dependências e riscos
```

**2. Debugging de Problemas Complexos**
```
Usar sequential_thinking para:
- Quebrar problema em etapas de investigação
- Testar hipóteses de forma estruturada
- Revisar e refinar conclusões
```

**3. Análise de Arquitetura**
```
Usar sequential_thinking para:
- Avaliar decisões técnicas
- Comparar alternativas
- Documentar raciocínio de design
```

### ✅ Exemplo Real

```typescript
// Etapa 1
{
  thought: "Analisando impacto da mudança de BRAPI para adicionar campo marketCap",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
}

// Etapa 2
{
  thought: "Identificados 3 arquivos afetados: brapi.scraper.ts, asset-prices.entity.ts, assets.service.ts",
  thoughtNumber: 2,
  totalThoughts: 5,
  nextThoughtNeeded: true
}

// Etapa 3 (Revisão)
{
  thought: "Corrijo: Na verdade são 4 arquivos - esqueci do DTO AssetPriceDto",
  thoughtNumber: 3,
  totalThoughts: 6, // Ajustado
  isRevision: true,
  revisesThought: 2,
  nextThoughtNeeded: true
}
```

---

## 2. FILESYSTEM MCP

### 📊 Informações Técnicas

- **Pacote:** `@modelcontextprotocol/server-filesystem`
- **Repositório:** [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem)
- **Licença:** MIT
- **Propósito:** Operações seguras de I/O em arquivos do projeto
- **Whitelist:** `C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web`

### 🛠️ Tools Disponíveis (12 tools)

| Tool | Função | Parâmetros Principais |
|------|--------|----------------------|
| `read_text_file` | Lê arquivo como texto | path, head?, tail? |
| `read_media_file` | Lê imagens/áudio (base64) | path |
| `read_multiple_files` | Lê vários arquivos | paths[] |
| `write_file` | Cria ou sobrescreve | path, content |
| `edit_file` | Edição seletiva | path, edits[], dryRun? |
| `create_directory` | Cria diretórios | path |
| `list_directory` | Lista conteúdo | path |
| `list_directory_with_sizes` | Lista com tamanhos | path |
| `move_file` | Move ou renomeia | source, destination |
| `search_files` | Busca recursiva | path, pattern, excludePatterns? |
| `directory_tree` | Estrutura JSON | path |
| `get_file_info` | Metadados completos | path |

### 💡 Casos de Uso no Projeto

**1. Análise de Estrutura de Arquivos**
```typescript
// Obter árvore de diretórios do backend
directory_tree({
  path: "C:\\...\\invest-claude-web\\backend\\src"
})
```

**2. Busca de Padrões no Código**
```typescript
// Buscar todos os DTOs
search_files({
  path: "C:\\...\\invest-claude-web",
  pattern: "*.dto.ts"
})
```

**3. Edição Seletiva com Dry-Run**
```typescript
// Pré-visualizar mudanças antes de aplicar
edit_file({
  path: "backend/src/api/assets/assets.service.ts",
  edits: [
    {
      oldText: "findOne(ticker)",
      newText: "findOneByTicker(ticker)"
    }
  ],
  dryRun: true
})
```

**4. Leitura de Múltiplos Arquivos**
```typescript
// Ler todos os scrapers fundamentalistas
read_multiple_files({
  paths: [
    "backend/src/scrapers/fundamental/fundamentus.scraper.ts",
    "backend/src/scrapers/fundamental/brapi.scraper.ts",
    "backend/src/scrapers/fundamental/statusinvest.scraper.ts"
  ]
})
```

### ⚠️ Limitações

- **Acesso restrito** apenas ao diretório configurado (workspace)
- **Requer MCP Roots** ou argumentos de linha de comando
- **Sem operações atômicas** em múltiplos arquivos

---

## 3. SHELL MCP

### 📊 Informações Técnicas

- **Pacote:** `shell-mcp-server` (ou `@mako10k/mcp-shell-server`)
- **Licença:** MIT
- **Propósito:** Execução segura de comandos PowerShell/CMD com restrições
- **Segurança:** Configurável (restrictive, enhanced, custom)

### 🛠️ Tools Disponíveis

**`shell_execute`**

Executa comandos de shell com múltiplos modos de execução.

**Parâmetros:**

```typescript
{
  command: string;           // Comando a executar
  mode?: "foreground" | "adaptive" | "background";
  workingDirectory?: string;
  env?: Record<string, string>;
}
```

**`security_set_restrictions`** (se disponível)

Configura restrições de segurança dinamicamente.

```typescript
{
  allowedCommands?: string[];
  blockedCommands?: string[];
  allowedDirectories?: string[];
  maxExecutionTime?: number;
  maxMemory?: number;
}
```

### 💡 Casos de Uso no Projeto

**1. Build e Validação**
```bash
# Validar TypeScript backend
shell_execute({
  command: "cd backend && npx tsc --noEmit",
  mode: "foreground"
})

# Build de produção
shell_execute({
  command: "cd frontend && npm run build",
  mode: "foreground"
})
```

**2. Gerenciamento de Docker**
```bash
# Ver status dos containers
shell_execute({
  command: "docker-compose ps",
  mode: "foreground"
})

# Restart de serviços
shell_execute({
  command: "docker-compose restart backend frontend",
  mode: "adaptive"
})
```

**3. Verificação de Dependências**
```bash
# Verificar versões npm
shell_execute({
  command: "npm list --depth=0",
  workingDirectory: "C:\\...\\invest-claude-web\\backend"
})
```

**4. Análise de Git**
```bash
# Ver commits recentes
shell_execute({
  command: "git log --oneline -10"
})

# Status do repositório
shell_execute({
  command: "git status --short"
})
```

### ⚠️ Limitações

- **Sujeito a configurações de segurança** do servidor MCP
- **Pode ter timeout** em comandos longos
- **Não recomendado** para operações interativas

---

## 4. A11Y MCP

### 📊 Informações Técnicas

- **Pacote:** `a11y-mcp`
- **Repositório:** [priyankark/a11y-mcp](https://github.com/priyankark/a11y-mcp)
- **Licença:** MPL-2.0
- **Propósito:** Auditoria WCAG automatizada via axe-core
- **Engine:** axe-core (Deque Systems)

### 🛠️ Tools Disponíveis

**`audit_webpage`**

Realiza auditoria detalhada de acessibilidade em qualquer página web.

**Parâmetros:**

```typescript
{
  url: string;               // URL da página a auditar (obrigatório)
  includeHtml?: boolean;     // Incluir código HTML nas violações
  tags?: string[];           // Tags de conformidade (ex: ["wcag21aa"])
}
```

**`get_summary`**

Fornece resumo dos problemas de acessibilidade.

**Parâmetros:**

```typescript
{
  url: string;  // URL da página a verificar
}
```

### 📋 Tags de Conformidade Suportadas

| Tag | Descrição |
|-----|-----------|
| `wcag2a` | WCAG 2.0 Nível A |
| `wcag2aa` | WCAG 2.0 Nível AA |
| `wcag21a` | WCAG 2.1 Nível A |
| `wcag21aa` | WCAG 2.1 Nível AA |
| `best-practice` | Práticas recomendadas |

### 💡 Casos de Uso no Projeto

**1. Auditoria de Páginas Frontend**
```typescript
// Auditar dashboard (WCAG 2.1 AA)
audit_webpage({
  url: "http://localhost:3100/dashboard",
  tags: ["wcag21aa"],
  includeHtml: true
})
```

**2. Validação de Todas as Páginas**
```typescript
// Lista de páginas a auditar
const pages = [
  "/dashboard",
  "/assets",
  "/analysis",
  "/portfolio",
  "/reports",
  "/data-sources",
  "/settings"
];

// Auditar cada página
for (const page of pages) {
  audit_webpage({
    url: `http://localhost:3100${page}`,
    tags: ["wcag21aa"]
  });
}
```

**3. Resumo Rápido de Problemas**
```typescript
// Obter resumo sem detalhes
get_summary({
  url: "http://localhost:3100/assets"
})
```

**4. Auditoria de Produção**
```typescript
// Auditar site em produção
audit_webpage({
  url: "https://invest.exemplo.com",
  tags: ["wcag21aa", "best-practice"]
})
```

### ✅ Exemplo de Output

```json
{
  "violations": [
    {
      "id": "color-contrast",
      "impact": "serious",
      "description": "Elements must have sufficient color contrast",
      "nodes": [
        {
          "html": "<button class=\"btn-primary\">Solicitar Análise</button>",
          "target": [".btn-primary"],
          "failureSummary": "Fix any of the following:\n  Element has insufficient color contrast of 3.2:1"
        }
      ]
    }
  ],
  "passes": [...],
  "incomplete": [...]
}
```

### ⚠️ Limitações

- **Requer página acessível** via HTTP/HTTPS
- **Não audita** fluxos complexos de usuário
- **Baseado em análise estática** (não detecta problemas dinâmicos)

---

## 5. CONTEXT7 MCP

### 📊 Informações Técnicas

- **Pacote:** `@upstash/context7-mcp@latest`
- **Repositório:** [upstash/context7](https://github.com/upstash/context7)
- **Licença:** Apache-2.0
- **Propósito:** Documentação atualizada de frameworks via Upstash
- **Infraestrutura:** Upstash (serverless Redis)

### 🛠️ Funcionalidade

Context7 puxa documentação de frameworks direto da infraestrutura Upstash e expõe via MCP.

**Frameworks Suportados:**
- React, Next.js, Vue, Angular
- TypeScript, JavaScript
- NestJS, Express, Fastify
- TailwindCSS, Shadcn/ui
- PostgreSQL, TypeORM
- E muitos outros...

### 💡 Casos de Uso no Projeto

**1. Consultar Docs de Frameworks**
```
Solicitar:
"Mostrar exemplos de React Query com TypeScript"
"Como implementar middleware no NestJS?"
"Sintaxe de migrations no TypeORM"
```

**2. Troubleshooting de Erros**
```
Solicitar:
"Next.js 14 App Router - como corrigir erro de hydration?"
"TypeORM - erro 'Cannot find module' ao importar entity"
```

**3. Referência de API**
```
Solicitar:
"API de Shadcn/ui Dialog component"
"Métodos disponíveis no BullMQ Queue"
```

### ⚠️ Limitações

- **Depende de conexão** com Upstash
- **Docs podem estar defasadas** (apesar de atualizadas frequentemente)
- **Não substitui documentação oficial** para edge cases

---

## 6. PLAYWRIGHT MCP

### 📊 Informações Técnicas

- **Pacote:** `@playwright/mcp@latest`
- **Repositório:** [@playwright/mcp](https://www.npmjs.com/package/@playwright/mcp)
- **Licença:** Apache-2.0
- **Propósito:** Automação de browser para testes E2E

### 💡 Casos de Uso no Projeto

**1. Testes E2E do Frontend**
```
- Validar fluxo de login
- Testar CRUD de portfólio
- Verificar análises em massa
```

**2. Screenshots para Documentação**
```
- Capturar telas de todas as páginas
- Gerar evidências de validação
```

**3. Testes de Integração**
```
- Validar WebSocket real-time
- Testar OAuth Google flow
```

---

## 7. CHROME DEVTOOLS MCP

### 📊 Informações Técnicas

- **Pacote:** `chrome-devtools-mcp@latest`
- **Licença:** Apache-2.0
- **Propósito:** Inspeção e debugging de aplicações web via Chrome DevTools Protocol

### 💡 Casos de Uso no Projeto

**1. Debugging de Frontend**
```
- Inspecionar console errors
- Validar network requests
- Verificar performance
```

**2. Análise de Recursos**
```
- Ver bundle size
- Analisar cache de recursos
- Verificar cookies e storage
```

**3. Testes de Responsividade**
```
- Simular diferentes resoluções
- Validar media queries
```

---

## 9. SELENIUM MCP

### 📊 Informações Técnicas

- **Pacote:** `@angiejones/mcp-selenium`
- **Licença:** MIT
- **Propósito:** Automação web alternativa ao Playwright

### 💡 Casos de Uso no Projeto

**1. Testes de Compatibilidade**
```
- Validar em diferentes browsers
- Testes cross-browser
```

**2. Scraping de Dados (Desenvolvimento)**
```
- Testar scrapers em desenvolvimento
- Validar autenticação OAuth
```

---

## 10. POSTGRESQL MCP

### 📊 Informações Técnicas
- **Pacote:** `@modelcontextprotocol/server-postgres`
- **Propósito:** Acesso direto ao banco de dados PostgreSQL
- **Conexão:** `postgresql://invest_user:invest_password@localhost:5532/invest_db`

### 🛠️ Ferramentas Principais
- `query`: Executar queries SQL (SELECT apenas recomendado para leitura)
- `get_schema`: Inspecionar estrutura do banco

---

## 11. GITHUB MCP

### 📊 Informações Técnicas
- **Pacote:** `@modelcontextprotocol/server-github`
- **Propósito:** Integração completa com GitHub (PRs, Issues, Commits)
- **Autenticação:** Via PAT em `mcp_config.json`

### 🛠️ Ferramentas Principais
- `create_pull_request`: Criar PRs
- `list_issues`: Listar issues
- `push_files`: Commit e push de arquivos
- `search_repositories`: Buscar repositórios

---

## 12. DOCKER MCP

### 📊 Informações Técnicas
- **Pacote:** `@modelcontextprotocol/server-docker`
- **Propósito:** Gerenciamento de containers Docker
- **Socket:** `/var/run/docker.sock` (ou pipe no Windows)

### 🛠️ Ferramentas Principais
- `list_containers`: Ver containers ativos
- `logs`: Ver logs de containers
- `compose_up`: Subir stack
- `compose_down`: Derrubar stack

---

## 13. MEMORY MCP

### 📊 Informações Técnicas
- **Pacote:** `@modelcontextprotocol/server-memory`
- **Propósito:** Grafo de conhecimento persistente para o agente

### 🛠️ Ferramentas Principais
- `create_entity`: Criar entidade no grafo
- `create_relation`: Criar relacionamento
- `read_graph`: Ler o grafo de conhecimento

---

## 14. CASOS DE USO NO PROJETO

### Workflow 1: Refatoração de Sistema Reports

```
1. Sequential Thinking MCP
   - Analisar impacto da refatoração
   - Planejar ordem de implementação
   - Documentar decisões

2. Filesystem MCP
   - Ler arquivos relevantes (page.tsx, hooks, API)
   - Buscar padrões similares no codebase
   - Editar arquivos com dry-run

3. Shell MCP
   - Validar TypeScript (npx tsc --noEmit)
   - Build de produção (npm run build)

4. Playwright MCP
   - Testar fluxo de análise em massa
   - Validar navegação entre páginas
   - Screenshots de evidência
```

### Workflow 2: Correção de Bug Análise Duplicada

```
1. Sequential Thinking MCP
   - Identificar causa raiz (falta isSubmitting)
   - Planejar correção (4 etapas)
   - Revisar solução

2. Filesystem MCP
   - Ler componente afetado
   - Editar com prevenção de cliques múltiplos
   - Validar imports necessários

3. Shell MCP
   - Validar TypeScript
   - Build frontend

4. Chrome DevTools MCP
   - Testar em navegador
   - Validar 0 console errors
```

### Workflow 3: Validação de Acessibilidade WCAG

```
1. Shell MCP
   - Iniciar frontend (docker-compose up -d frontend)

2. A11y MCP
   - Auditar todas as 7 páginas principais
   - Gerar relatório de problemas

3. Filesystem MCP
   - Ler componentes com violações
   - Editar para corrigir contraste, aria-labels

4. Playwright MCP
   - Validar correções com testes de navegação por teclado
```

### Workflow 4: Atualização de Dependências

```
1. Context7 MCP
   - Consultar docs de migração (ex: Next.js 14 → 15)

2. Filesystem MCP
   - Ler package.json
   - Buscar uso de APIs deprecadas

3. Shell MCP
   - npm outdated
   - npm update <package>
   - npm run build

4. Playwright MCP
   - Rodar testes E2E
   - Validar regressões
```

---

## 15. WORKFLOWS RECOMENDADOS

### 1. Pre-Commit Validation

```bash
# Usando Shell MCP + Filesystem MCP

1. Shell: git diff --name-only
2. Filesystem: read_multiple_files (arquivos modificados)
3. Shell: npx tsc --noEmit (backend + frontend)
4. Shell: npm run build
5. A11y: audit_webpage (se mudou frontend)
6. Shell: git add . && git commit -m "..."
```

### 2. Feature Implementation

```bash
# Usando Sequential Thinking + Filesystem + Shell

1. Sequential Thinking: Planejar implementação (5-10 etapas)
2. Filesystem: Ler arquivos relacionados
3. Filesystem: Editar arquivos (dry-run primeiro)
4. Shell: Validar TypeScript
5. Shell: Build
6. Filesystem: Criar arquivo de documentação (VALIDACAO_FASE_X.md)
7. Shell: Git commit
```

### 3. Bug Investigation

```bash
# Usando Chrome DevTools + Sequential Thinking + Filesystem

1. Chrome DevTools: Inspecionar console errors
2. Sequential Thinking: Analisar causa raiz
3. Filesystem: Ler código afetado
4. Filesystem: Editar com correção
5. Chrome DevTools: Validar correção
6. Shell: Commit
```

### 4. Production Deployment Validation

```bash
# Usando Shell + A11y + Playwright

1. Shell: docker-compose build
2. Shell: docker-compose up -d
3. Shell: docker-compose ps (aguardar healthy)
4. A11y: Auditar todas as páginas (localhost:3100)
5. Playwright: Rodar testes E2E completos
6. Shell: docker-compose logs (verificar erros)
7. Shell: git tag v1.x.x && git push --tags
```

---

## 📋 CHECKLIST DE USO

### Antes de Usar MCPs

- [ ] Verificar se MCPs estão conectados: `claude mcp list`
- [ ] Confirmar escopo de acesso (Filesystem: apenas workspace)
- [ ] Verificar se serviços necessários estão rodando (frontend, backend)

### Durante o Uso

- [ ] Documentar decisões tomadas com Sequential Thinking
- [ ] Usar dry-run quando disponível (Filesystem edit)
- [ ] Validar outputs de cada ferramenta
- [ ] Combinar MCPs para workflows completos

### Após o Uso

- [ ] Atualizar CLAUDE.md com decisões técnicas
- [ ] Criar commits detalhados
- [ ] Documentar novos workflows descobertos

---

## 📚 REFERÊNCIAS

### Documentação Oficial

- Sequential Thinking: https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking
- Filesystem: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
- A11y: https://github.com/priyankark/a11y-mcp
- Context7: https://github.com/upstash/context7
- Shell: https://www.npmjs.com/package/@mako10k/mcp-shell-server

### Comandos Úteis

```bash
# Listar MCPs instalados
claude mcp list

# Adicionar novo MCP
claude mcp add --transport stdio <name> -- <command>

# Remover MCP
claude mcp remove <name>

# Verificar arquivo de configuração
cat C:\Users\adria\.claude.json
```

---

**Última Atualização:** 2025-11-14
**Responsável:** Claude Code (Sonnet 4.5)
**Status:** ✅ COMPLETO - 8 MCPs Documentados
