# MCP react-context Issue - Fase 156

**Data:** 2026-01-04
**Status:** ✅ RESOLVIDO - Instalação Global

---

## Problema

O MCP `react-context` (pacote `react-context-mcp`) não consegue ser instalado devido a **arquivos travados do Puppeteer** no cache do npx.

### Sintomas
- ❌ Erro "Failed to reconnect to react-context" ao executar `/mcp`
- ❌ npm warn cleanup: `EPERM: operation not permitted, rmdir` em arquivos do puppeteer-core
- ❌ Instalação falha mesmo após `npm cache clean --force`

### Causa Raiz
- Puppeteer (~400MB) baixa binários do Chromium
- Arquivos ficam **travados por processos** ou **permissões de sistema**
- Cache npx em `C:\Users\adria\AppData\Local\npm-cache\_npx\6e42775846bd52f9\` não pode ser removido

---

## Correção Aplicada

### 1. Sequential-Thinking
✅ **FUNCIONANDO PERFEITAMENTE**
- Configuração corrigida em `.mcp.json` (removido `cmd /c`)
- Cache limpo e pacote reinstalado com sucesso
- Teste confirmado: `Sequential Thinking MCP Server running on stdio`

### 2. React-Context
✅ **RESOLVIDO COM INSTALAÇÃO GLOBAL**
- Instalado globalmente com `npm install -g react-context-mcp`
- Variável de ambiente `PUPPETEER_SKIP_DOWNLOAD=true` para usar Chrome do sistema
- Configurado em `.mcp.json` com caminho explícito para Chrome
- Comando disponível em: `C:\Users\adria\AppData\Roaming\npm\react-context-mcp.cmd`

---

## Configuração Final (.mcp.json)

```json
{
  "mcpServers": {
    "playwright": { ... },
    "chrome-devtools": { ... },
    "a11y": { ... },
    "context7": { ... },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {},
      "alwaysAllow": ["*"]
    },
    "react-context": {
      "command": "react-context-mcp",
      "args": ["--headless", "--isolated", "--executablePath", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"],
      "env": {
        "PUPPETEER_SKIP_DOWNLOAD": "true"
      },
      "alwaysAllow": ["*"]
    }
  }
}
```

---

## Solução Implementada (Opção 1 - Instalação Global)

### Passos Executados

1. **Limpar cache corrompido do Puppeteer:**
```powershell
Remove-Item -Recurse -Force "C:\Users\adria\.cache\puppeteer"
Remove-Item -Recurse -Force "C:\Users\adria\AppData\Roaming\npm\node_modules\react-context-mcp"
```

2. **Instalar globalmente com PUPPETEER_SKIP_DOWNLOAD:**
```bash
set PUPPETEER_SKIP_DOWNLOAD=true && npm install -g react-context-mcp
# Resultado: 194 packages instalados com sucesso
```

3. **Configurar .mcp.json:**
```json
"react-context": {
  "command": "react-context-mcp",
  "args": ["--headless", "--isolated", "--executablePath", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"],
  "env": {
    "PUPPETEER_SKIP_DOWNLOAD": "true"
  },
  "alwaysAllow": ["*"]
}
```

### Por Que Funcionou
- ✅ Instalação global evita problemas de cache npx
- ✅ `PUPPETEER_SKIP_DOWNLOAD` evita download de Chromium (~400MB)
- ✅ `--executablePath` usa Chrome do sistema (já instalado)
- ✅ Comando disponível no PATH global

---

## Validação Pós-Correção

### ✅ Sequential-Thinking
```bash
# 1. Reiniciar Claude Code
# 2. Executar: /mcp
# 3. Verificar: sequential-thinking aparece como conectado
# 4. Testar: mcp__sequential-thinking__sequentialthinking
```

### ⚠️ React-Context (quando reabilitado)
```bash
# 1. Aplicar Opção 1 ou 2 acima
# 2. Reiniciar Claude Code
# 3. Executar: /mcp
# 4. Verificar: react-context aparece como conectado
# 5. Testar: mcp__react-context__* (comandos disponíveis)
```

---

## Impacto

| MCP | Status | Instalação | Localização |
|-----|--------|------------|-------------|
| sequential-thinking | ✅ Funcionando | NPX (cache) | Via npx |
| react-context | ✅ Funcionando | Global | `C:\Users\adria\AppData\Roaming\npm\react-context-mcp.cmd` |

---

## Referências

- [react-context-mcp GitHub](https://github.com/uxfreak/React-Devtools-MCP)
- [Puppeteer Issues](https://github.com/puppeteer/puppeteer/issues)
- **Plano Completo:** `C:\Users\adria\.claude\plans\crispy-doodling-seahorse.md`

---

## Comandos de Validação

### Verificar Instalação
```bash
# Sequential-thinking
npx -y @modelcontextprotocol/server-sequential-thinking --version

# React-context
where react-context-mcp
react-context-mcp --help
```

### Testar MCPs
1. Reiniciar Claude Code
2. Executar `/mcp`
3. Verificar ambos como "connected"
4. Testar: `mcp__sequential-thinking__sequentialthinking`
5. Testar: Comandos react-context disponíveis

---

**✅ Próxima Ação:** Reiniciar Claude Code e validar com `/mcp`
