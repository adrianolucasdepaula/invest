# 🛠️ VSCode Setup Guide - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-11-20
**Versão:** 1.0.0
**Mantenedor:** Claude Code (Sonnet 4.5)

---

## 📚 ÍNDICE

1. [Extensões Instaladas](#extensões-instaladas)
2. [Configurações](#configurações)
3. [Setup Rápido](#setup-rápido)
4. [Troubleshooting](#troubleshooting)

---

## 🔌 EXTENSÕES INSTALADAS

### ✅ Críticas (FASE 1 - Instaladas)

| Extensão | ID | Versão | Descrição |
|----------|-------|--------|-----------|
| **Tailwind CSS IntelliSense** | `bradlc.vscode-tailwindcss` | v0.14.29 | Autocomplete para classes Tailwind + CVA/cn() |
| **Pretty TypeScript Errors** | `yoavbls.pretty-ts-errors` | v0.6.1 | Erros TypeScript formatados e legíveis |
| **NestJS Snippets** | `imgildev.vscode-nestjs-snippets-extension` | v1.5.0 | Snippets para NestJS (nest-controller, etc) |
| **ES7+ React Snippets** | `dsznajder.es7-react-js-snippets` | v4.4.3 | Snippets React/Next.js (rfc, rafce, etc) |
| **NestJS File Generator** | `imgildev.vscode-nestjs-generator` | v2.12.1 | Gerador arquivos NestJS (via Command Palette) |
| **Thunder Client** | `rangav.vscode-thunder-client` | v2.38.5 | Cliente HTTP integrado (ícone lateral) |
| **Auto Rename Tag** | `formulahendry.auto-rename-tag` | v0.1.10 | Renomeia tags HTML/JSX/TSX automaticamente |
| **Jest** | `Orta.vscode-jest` | v6.4.4 | Testes unitários backend (autoRun: OFF) |

**Total instaladas:** 8 extensões críticas ✅

### ✅ Importantes (FASE 2 - Instaladas)

| Extensão | ID | Versão | Descrição |
|----------|-------|--------|--------------|
| **Console Ninja** | `wallabyjs.console-ninja` | v1.0.493 | Logs inline no editor (Community Edition) |
| **QuickType** | `quicktype.quicktype` | v23.0.170 | Gera TypeScript types de JSON/API |
| **DotENV Official** | `dotenv.dotenv-vscode` | v0.28.1 | Syntax highlighting .env files |
| **React Refactor** | `planbcoding.vscode-react-refactor` | v1.1.3 | Refactoring automático (extract component) |
| **Auto Close Tag** | `formulahendry.auto-close-tag` | v0.5.15 | Fecha tags HTML/JSX automaticamente |
| **Path Intellisense** | `christian-kohler.path-intellisense` | v2.10.0 | Autocomplete para file paths |
| **Total TypeScript** | `mattpocock.ts-error-translator` | v0.10.1 | Traduz erros TypeScript (inglês simples) |
| **Import Cost** | `wix.vscode-import-cost` | v3.3.0 | Mostra tamanho inline de imports |

**Total instaladas:** 8 extensões importantes ✅

### ⚡ Desejáveis (FASE 3 - Instaladas)

| Extensão | ID | Versão | Descrição |
|----------|-------|--------|--------------|
| **Better Comments** | `aaron-bond.better-comments` | v3.0.2 | Destaque colorido para comentários (TODO, FIXME) |
| **Tailwind Documentation** | `austenc.tailwind-docs` | v2.1.0 | Documentação inline para classes Tailwind |
| **Stylelint** | `stylelint.vscode-stylelint` | v1.5.3 | Linting para CSS/SCSS (TailwindCSS support) |
| **Python Environment Manager** | `donjayamanne.python-environment-manager` | v1.2.7 | Gerenciamento de ambientes Python (scrapers) |

**Total instaladas:** 4 extensões desejáveis ✅ (1 skip: KICS - ID incorreto)

### 🧹 Removidas (FASE 4 - Cleanup Redundant)

**Total removidas:** 23 extensões

**Azure Tools (13):** azure-dev, azure-github-copilot, azure-mcp-server, azureappservice, azurecontainerapps, azurefunctions, azureresourcegroups, azurestaticwebapps, azurestorage, containers, cosmosdb, docker, node-azure-pack, ai-foundry

**MQL/Trading (5):** mql-lang, compilemql4, mql-over-cpp, mql-snippets, mql5filestemplatewizard

**Frontend Não Usado (2):** ng-template (Angular), vscode-react-native

**C/C++ (3):** cmake-tools, cpptools, cpptools-extension-pack

**Resultado:** 104 extensões finais (107 iniciais + 20 adicionadas - 23 removidas)

---

## ⚙️ CONFIGURAÇÕES

### `.vscode/settings.json` (Já criado)

```json
{
  "// ===== TAILWIND CSS INTELLISENSE =====": "",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  },
  "tailwindCSS.validate": true,

  "// ===== PRETTIER (formatação Tailwind via plugin) =====": "",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,

  "// ===== JEST (BACKEND APENAS) =====": "",
  "jest.autoRun": "off",
  "jest.rootPath": "backend",
  "jest.jestCommandLine": "npm run test --prefix backend",
  "// ⚠️ CRÍTICO: autoRun OFF para evitar travar VSCode": "",

  "// ===== CONSOLE NINJA (Community Edition) =====": "",
  "console-ninja.featureSet": "Community",

  "// ===== TYPESCRIPT =====": "",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  "// ===== PYTHON (Scrapers) =====": "",
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/scrapers/venv/bin/python"
}
```

### `frontend/.prettierrc` (Já criado)

```json
{
  "plugins": ["prettier-plugin-tailwindcss"],
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid"
}
```

**Vantagens:**
- ✅ Classes Tailwind ordenadas automaticamente (ordem oficial)
- ✅ Elimina necessidade de Headwind extension (conflito evitado)
- ✅ Formatação consistente em todo o projeto

---

## 🚀 SETUP RÁPIDO

### 1. Instalar Extensões (via terminal)

#### FASE 1: Críticas (8 extensões)

```bash
# Navegue para a raiz do projeto
cd C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web

# Instale todas as 8 extensões críticas
code --install-extension bradlc.vscode-tailwindcss
code --install-extension yoavbls.pretty-ts-errors
code --install-extension imgildev.vscode-nestjs-snippets-extension
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension imgildev.vscode-nestjs-generator
code --install-extension rangav.vscode-thunder-client
code --install-extension formulahendry.auto-rename-tag
code --install-extension Orta.vscode-jest
```

#### FASE 2: Importantes (8 extensões)

```bash
# Instale as 8 extensões importantes
code --install-extension wallabyjs.console-ninja
code --install-extension quicktype.quicktype
code --install-extension dotenv.dotenv-vscode
code --install-extension planbcoding.vscode-react-refactor
code --install-extension formulahendry.auto-close-tag
code --install-extension christian-kohler.path-intellisense
code --install-extension mattpocock.ts-error-translator
code --install-extension wix.vscode-import-cost
```

#### FASE 3: Desejáveis (4 extensões)

```bash
# Instale as 4 extensões desejáveis
code --install-extension aaron-bond.better-comments
code --install-extension austenc.tailwind-docs
code --install-extension stylelint.vscode-stylelint
code --install-extension donjayamanne.python-environment-manager
```

**Ou via Command Palette:**
1. Abra Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Digite `Extensions: Install Extension`
3. Busque e instale cada extensão da lista

### 2. Verificar Configurações

As configurações em `.vscode/settings.json` e `frontend/.prettierrc` já estão criadas. Apenas verifique se existem:

```bash
# Verificar se arquivos existem
ls .vscode/settings.json      # Deve existir
ls frontend/.prettierrc       # Deve existir
```

### 3. Instalar Dependências Prettier

```bash
# Instalar plugin Tailwind para Prettier (se não instalado)
cd frontend
npm install --save-dev prettier prettier-plugin-tailwindcss
```

### 4. Reiniciar VSCode

```bash
# Feche e reabra VSCode para aplicar todas as configurações
```

---

## ✅ VALIDAÇÃO

### Testar Tailwind IntelliSense

1. Abra `frontend/src/app/page.tsx`
2. Digite `className="bg-`
3. **Esperado:** Autocomplete com opções (`bg-white`, `bg-primary`, etc)

### Testar NestJS Snippets

1. Abra qualquer arquivo backend `.ts`
2. Digite `nest-controller`
3. **Esperado:** Snippet de controller NestJS aparece

### Testar React Snippets

1. Abra qualquer arquivo frontend `.tsx`
2. Digite `rfc` (React Functional Component)
3. **Esperado:** Template de componente funcional aparece

### Testar Thunder Client

1. Clique no ícone "Thunder" na barra lateral (⚡)
2. Crie novo request: `GET http://localhost:3101/api/v1/health`
3. **Esperado:** Response `{"status":"ok",...}`

### Testar Jest (Backend)

1. Abra `backend/` no terminal integrado
2. Execute `npm run test`
3. **Esperado:** Testes executam (Jest extension mostra resultados)
4. ⚠️ **IMPORTANTE:** `jest.autoRun` está OFF para evitar freeze

### Testar Auto Rename Tag

1. Abra arquivo `.tsx`
2. Renomeie uma tag (`<div>` → `<section>`)
3. **Esperado:** Tag de fechamento renomeia automaticamente

---

## 🐛 TROUBLESHOOTING

### Problema: Tailwind IntelliSense não funciona

**Causa:** Configuração `tailwindCSS.experimental.classRegex` não aplicada

**Solução:**
```bash
# 1. Verificar se .vscode/settings.json existe
cat .vscode/settings.json | grep "tailwindCSS"

# 2. Reiniciar VSCode
# 3. Recarregar janela: Ctrl+Shift+P → "Reload Window"
```

### Problema: Jest travando VSCode

**Causa:** `jest.autoRun` está ligado (default)

**Solução:**
```json
// Em .vscode/settings.json, garantir:
{
  "jest.autoRun": "off"
}
```

**Executar testes manualmente:**
```bash
cd backend
npm run test
```

### Problema: Prettier não formatando classes Tailwind

**Causa:** Plugin `prettier-plugin-tailwindcss` não instalado

**Solução:**
```bash
cd frontend
npm install --save-dev prettier-plugin-tailwindcss

# Verificar frontend/.prettierrc
cat frontend/.prettierrc
```

### Problema: Console Ninja pedindo upgrade PRO

**Causa:** Extension configurada para PRO (paga)

**Solução:**
```json
// Em .vscode/settings.json:
{
  "console-ninja.featureSet": "Community"  // ✅ Versão gratuita
}
```

### Problema: TypeScript errors não formatados

**Causa:** Extension Pretty TypeScript Errors não ativada

**Solução:**
1. Verificar se instalada: `code --list-extensions | grep pretty-ts-errors`
2. Reiniciar VSCode
3. Abrir arquivo com erro TypeScript para testar

---

## 📊 EXTENSÕES FUTURAS (FASE 3-4)

### FASE 3: Desejáveis (5 extensões - A instalar)
- Todo Tree
- REST Client
- Playwright Test for VSCode
- Database Client JDBC
- Docker

### FASE 4: Remoção (37 extensões redundantes)
- Azure Tools (18 extensões)
- MQL/Trading (8 extensões)
- Angular/Vue (3 extensões)
- C++ (4 extensões)
- AI alternatives (4 extensões)

**Documentação completa:** `IMPLEMENTACAO_EXTENSOES_VSCODE_TODO_MASTER.md`

---

## 📚 REFERÊNCIAS

**Documentos do Projeto:**
- `VSCODE_EXTENSIONS_MAPPING.md` - Mapeamento completo (107 extensões)
- `VSCODE_EXTENSIONS_RECOMMENDATIONS_2025.md` - 40 extensões pesquisadas
- `VSCODE_EXTENSIONS_ULTRA_ROBUST_REVIEW.md` - Revisão crítica (21 aprovadas)
- `IMPLEMENTACAO_EXTENSOES_VSCODE_TODO_MASTER.md` - Planejamento (90 checkpoints)
- `ROADMAP.md` - FASE 1 VSCode Extensions (linha 2672+)

**Links Úteis:**
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [NestJS Snippets](https://marketplace.visualstudio.com/items?itemName=imgildev.vscode-nestjs-snippets-extension)
- [Thunder Client](https://marketplace.visualstudio.com/items?itemName=rangav.vscode-thunder-client)
- [Prettier Plugin Tailwind](https://github.com/tailwindlabs/prettier-plugin-tailwindcss)

---

## 🤝 CONTRIBUINDO

Ao adicionar novas extensões:

1. **Pesquisar melhores práticas** (WebSearch 2025)
2. **Validar marketplace** (stars > 1k, última atualização < 6 meses)
3. **Testar em ambiente real** (não só documentação)
4. **Atualizar este guia** (adicionar na seção correspondente)
5. **Atualizar ROADMAP.md** (nova FASE se > 5 extensões)

**Critérios de Aprovação:**
- ✅ TypeScript support nativo
- ✅ Comunidade ativa (commits recentes)
- ✅ Documentação completa
- ✅ Compatível com stack (Next.js 14, NestJS 10, TypeScript 5)
- ✅ Performance aceitável (não trava VSCode)

---

**Última atualização:** 2025-11-20
**Versão:** 4.0.0 (FASE 1-4 completas - Instalação + Cleanup)
**Status:** ✅ **104 extensões otimizadas (8 críticas + 8 importantes + 4 desejáveis + 84 outras)**
**Limpeza:** ✅ **23 extensões redundantes removidas (Azure 13, MQL 5, Frontend 2, C++ 3)**
