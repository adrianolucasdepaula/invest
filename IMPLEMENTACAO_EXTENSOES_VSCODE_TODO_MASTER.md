# 📋 TODO MASTER: Implementação Extensões VSCode 2025

**Data Criação:** 2025-11-20
**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Metodologia:** Ultra-Thinking + TodoWrite + Validação Tripla MCP
**Status:** 🔴 AGUARDANDO APROVAÇÃO USUÁRIO

---

## 🎯 VISÃO GERAL

### Objetivo
Instalar e configurar 21 extensões VSCode aprovadas para otimizar desenvolvimento, garantindo 0 erros, 0 quebras, validação tripla MCP e Git sempre atualizado.

### Regras Obrigatórias (NÃO NEGOCIÁVEL)
✅ 0 erros/warnings/bugs/divergências
✅ Validação tripla MCP (Playwright + Chrome DevTools + Sequential Thinking)
✅ Git sempre atualizado (commits granulares, branch atualizada)
✅ Revisar fase anterior 100% antes de avançar
✅ Verificar dependências e integrações antes de mudanças
✅ Reiniciar serviços antes de testes
✅ Corrigir problemas crônicos em definitivo (não workarounds)
✅ Sistema financeiro = 0 manipulação de dados (usar dados reais)
✅ Screenshots com MCPs em paralelo (janelas separadas)
✅ Documentação sempre atualizada
✅ Não quebrar nada

### Cronograma Estimado
- **PRÉ-IMPLEMENTAÇÃO:** 30 minutos
- **FASE 1 (Críticas):** 45 minutos (8 extensões + validações)
- **FASE 2 (Importantes):** 30 minutos (8 extensões + validações)
- **FASE 3 (Desejáveis):** 20 minutos (5 extensões + validações)
- **FASE 4 (Limpeza):** 25 minutos (remover 37 redundantes)
- **PÓS-IMPLEMENTAÇÃO:** 40 minutos (documentação, Git, validação final)
- **TOTAL:** ~3h 10min (com todas validações)

---

## 📊 MÉTRICAS DE SUCESSO

| Métrica | Antes | Objetivo | Validação |
|---------|-------|----------|-----------|
| **Extensões totais** | 107 | 93 | VSCode Extensions panel |
| **Extensões úteis** | 15 (14%) | 36 (39%) | Manual review |
| **TypeScript errors** | Variável | 0 | `tsc --noEmit` |
| **Build errors** | 0 | 0 | `npm run build` |
| **Console errors (frontend)** | Variável | 0 | Chrome DevTools MCP |
| **TailwindCSS autocomplete** | ❌ | ✅ | Testar `className="bg-` |
| **NestJS snippets** | ❌ | ✅ | Testar `nest-controller` |
| **Jest inline testing** | ❌ | ✅ | Testar run test inline |
| **Consumo RAM VSCode** | ~800MB | ~500MB | Task Manager |
| **Startup time VSCode** | ~5s | ~3s | Cronômetro |
| **Produtividade** | Baseline | +60-80% | Subjetivo (time feedback) |

---

## 📋 CHECKLIST ULTRA-ROBUSTO (78 ITENS)

---

### ⚙️ PRÉ-IMPLEMENTAÇÃO (14 itens)

#### Backup e Segurança (4 itens)
- [ ] **PRE-01:** Backup `.vscode/settings.json` (se existir)
  - Comando: `cp .vscode/settings.json .vscode/settings.json.backup-$(date +%Y%m%d)`
  - Critério: Arquivo backup criado

- [ ] **PRE-02:** Backup lista extensões atuais
  - Comando: `code --list-extensions > .vscode/extensions-backup-$(date +%Y%m%d).txt`
  - Critério: Arquivo txt com 107 extensões

- [ ] **PRE-03:** Backup PostgreSQL (se dados críticos)
  - Comando: `docker exec invest-postgres pg_dump -U invest_admin invest_data > backup-pre-vscode-$(date +%Y%m%d).sql`
  - Critério: Arquivo SQL criado (> 1MB)

- [ ] **PRE-04:** Screenshot VSCode atual (extensões panel)
  - Ferramenta: Windows Snipping Tool
  - Salvar como: `PRE-VSCODE-EXTENSIONS-BEFORE.png`

#### Git e Branch (3 itens)
- [ ] **PRE-05:** Verificar branch main atualizada
  - Comando: `git pull origin main`
  - Critério: "Already up to date" ou merge sem conflitos

- [ ] **PRE-06:** Commit arquivos pendentes (se seguros)
  - Arquivos: 3 docs VSCode Extensions, scripts, migrations
  - Comando: `git add . && git commit -m "docs: Add VSCode Extensions analysis and planning"`
  - Critério: Working tree clean

- [ ] **PRE-07:** Push para remoto (backup cloud)
  - Comando: `git push origin main`
  - Critério: Branch main sincronizada com origin

#### Validação Sistema Atual (4 itens)
- [ ] **PRE-08:** Verificar backend rodando
  - Comando: `curl -s http://localhost:3101/health | jq`
  - Critério: `{"status": "ok"}` response

- [ ] **PRE-09:** Verificar frontend rodando
  - Comando: `curl -s http://localhost:3100 | head -n 5`
  - Critério: HTML com `<title>` presente

- [ ] **PRE-10:** Verificar PostgreSQL conectado
  - Comando: `docker exec invest-postgres psql -U invest_admin -d invest_data -c "SELECT COUNT(*) FROM assets;"`
  - Critério: Número > 0 (ativos cadastrados)

- [ ] **PRE-11:** Verificar dados reais recentes (scrapers)
  - Comando: `docker exec invest-postgres psql -U invest_admin -d invest_data -c "SELECT MAX(date) FROM asset_prices;"`
  - Critério: Data máxima nos últimos 7 dias

#### Dependências e Configuração (3 itens)
- [ ] **PRE-12:** Instalar prettier-plugin-tailwindcss (frontend)
  - Comando: `cd frontend && npm install -D prettier-plugin-tailwindcss && cd ..`
  - Critério: Package.json contém `"prettier-plugin-tailwindcss": "^0.5.9"`

- [ ] **PRE-13:** Criar frontend/.prettierrc
  - Conteúdo: Ver seção "Configuração" abaixo
  - Critério: Arquivo existe e válido (JSON)

- [ ] **PRE-14:** Criar .vscode/settings.json base
  - Conteúdo: Ver seção "Configuração" abaixo
  - Critério: Arquivo existe e válido (JSON), Jest autoRun: "off"

---

### 🔥 FASE 1: EXTENSÕES CRÍTICAS (18 itens - 8 extensões)

#### 1. Tailwind CSS IntelliSense (3 itens)
- [ ] **F1-01:** Instalar extensão
  - Comando: `code --install-extension bradlc.vscode-tailwindcss`
  - Critério: Extensão aparece em Extensions panel

- [ ] **F1-02:** Reiniciar VSCode
  - Critério: VSCode reiniciado, 0 erros console

- [ ] **F1-03:** Validar autocomplete Tailwind
  - Teste: Abrir `frontend/src/app/page.tsx`, digitar `className="bg-`
  - Critério: Autocomplete mostra opções (bg-white, bg-black, bg-blue-500, etc)
  - Screenshot: `F1-TAILWIND-AUTOCOMPLETE.png`

#### 2. Pretty TypeScript Errors (3 itens)
- [ ] **F1-04:** Instalar extensão
  - Comando: `code --install-extension yoavbls.pretty-ts-errors`
  - Critério: Extensão instalada

- [ ] **F1-05:** Reiniciar VSCode
  - Critério: 0 erros console

- [ ] **F1-06:** Validar erro formatado
  - Teste: Criar erro TS proposital: `const x: number = "string";`
  - Critério: Erro formatado colorido (não padrão feio)
  - Screenshot: `F1-PRETTY-TS-ERRORS.png`

#### 3. NestJS Snippets (3 itens)
- [ ] **F1-07:** Instalar extensão
  - Comando: `code --install-extension imgildev.vscode-nestjs-snippets-extension`
  - Critério: Extensão instalada

- [ ] **F1-08:** Reiniciar VSCode
  - Critério: 0 erros console

- [ ] **F1-09:** Validar snippet
  - Teste: Novo arquivo `backend/src/test.controller.ts`, digitar `nest-controller`
  - Critério: Snippet gera código completo controller
  - Screenshot: `F1-NESTJS-SNIPPET.png`

#### 4. ES7+ React Snippets (3 itens)
- [ ] **F1-10:** Instalar extensão
  - Comando: `code --install-extension dsznajder.es7-react-js-snippets`
  - Critério: Extensão instalada

- [ ] **F1-11:** Reiniciar VSCode
  - Critério: 0 erros console

- [ ] **F1-12:** Validar snippet
  - Teste: Novo arquivo `frontend/src/components/Test.tsx`, digitar `rafce`
  - Critério: Snippet gera React component completo
  - Screenshot: `F1-REACT-SNIPPET.png`

#### 5. NestJS File Generator (2 itens)
- [ ] **F1-13:** Instalar extensão
  - Comando: `code --install-extension imgildev.vscode-nestjs-generator`
  - Critério: Extensão instalada

- [ ] **F1-14:** Validar menu context
  - Teste: Right-click `backend/src/` → Verificar menu "NestJS Generate..."
  - Critério: Menu presente
  - Screenshot: `F1-NESTJS-GENERATOR-MENU.png`

#### 6. Thunder Client (2 itens)
- [ ] **F1-15:** Instalar extensão
  - Comando: `code --install-extension rangav.vscode-thunder-client`
  - Critério: Extensão instalada, sidebar icon Thunder

- [ ] **F1-16:** Testar request simples
  - Teste: Thunder Client → New Request → GET http://localhost:3101/health
  - Critério: Response 200 OK com `{"status": "ok"}`
  - Screenshot: `F1-THUNDER-CLIENT-TEST.png`

#### 7. Auto Rename Tag (1 item)
- [ ] **F1-17:** Instalar extensão
  - Comando: `code --install-extension formulahendry.auto-rename-tag`
  - Critério: Extensão instalada

#### 8. Jest (backend apenas) (1 item + validação)
- [ ] **F1-18:** Instalar extensão
  - Comando: `code --install-extension Orta.vscode-jest`
  - Critério: Extensão instalada, **VERIFICAR settings.json tem `jest.autoRun: "off"`**
  - ⚠️ **CRÍTICO:** Monitorar Task Manager (RAM/CPU) nos próximos 2 minutos

---

### ⚡ VALIDAÇÃO FASE 1 (12 itens)

#### TypeScript e Build (3 itens)
- [ ] **V1-01:** Validar TypeScript backend 0 erros
  - Comando: `cd backend && npx tsc --noEmit && cd ..`
  - Critério: "Found 0 errors"

- [ ] **V1-02:** Validar TypeScript frontend 0 erros
  - Comando: `cd frontend && npx tsc --noEmit && cd ..`
  - Critério: "Found 0 errors"

- [ ] **V1-03:** Build backend sucesso
  - Comando: `cd backend && npm run build && cd ..`
  - Critério: "Compiled successfully"

#### Reiniciar Serviços (3 itens)
- [ ] **V1-04:** Reiniciar backend
  - Comando: `docker-compose restart api-service` ou `system-manager.ps1 restart-backend`
  - Critério: Backend reiniciado, health OK após 30s

- [ ] **V1-05:** Reiniciar frontend (se rodando)
  - Comando: Ctrl+C terminal frontend, depois `npm run dev`
  - Critério: Frontend compilado, http://localhost:3100 acessível

- [ ] **V1-06:** Aguardar warm-up (30s)
  - Critério: 30 segundos passados

#### Validação Tripla MCP (6 itens)
- [ ] **V1-07:** Playwright MCP - Navegação frontend
  - MCP: `mcp__playwright__browser_navigate` → http://localhost:3100
  - Critério: Página carrega sem erros

- [ ] **V1-08:** Playwright MCP - Snapshot página principal
  - MCP: `mcp__playwright__browser_snapshot`
  - Critério: Snapshot retorna estrutura HTML
  - Salvar: `V1-PLAYWRIGHT-SNAPSHOT.txt`

- [ ] **V1-09:** Chrome DevTools MCP - Console errors
  - MCP: `mcp__chrome-devtools__list_console_messages` (types: error)
  - Critério: 0 errors (warnings OK)

- [ ] **V1-10:** Chrome DevTools MCP - Network requests
  - MCP: `mcp__chrome-devtools__list_network_requests`
  - Critério: Todos requests 200 OK (exceto assets faltando, se houver)

- [ ] **V1-11:** Chrome DevTools MCP - Screenshot
  - MCP: `mcp__chrome-devtools__take_screenshot` → `V1-CHROME-SCREENSHOT.png`
  - Critério: Screenshot mostra frontend funcionando

- [ ] **V1-12:** Sequential Thinking MCP - Análise resultados
  - MCP: `mcp__sequential-thinking__sequentialthinking`
  - Critério: Análise confirma 0 problemas críticos, sistema estável

---

### ⚠️ FASE 2: EXTENSÕES IMPORTANTES (12 itens - 8 extensões)

#### 9. Console Ninja (2 itens)
- [ ] **F2-01:** Instalar extensão
  - Comando: `code --install-extension wallabyjs.console-ninja`
  - Critério: Extensão instalada, Community Edition

- [ ] **F2-02:** Configurar Community Edition
  - Settings: `"console-ninja.featureSet": "Community"`
  - Critério: Configuração salva

#### 10. QuickType (Paste JSON) (1 item)
- [ ] **F2-03:** Instalar extensão
  - Comando: `code --install-extension quicktype.quicktype`
  - Critério: Extensão instalada

#### 11. Dotenv Official (1 item)
- [ ] **F2-04:** Instalar extensão
  - Comando: `code --install-extension dotenv.dotenv-vscode`
  - Critério: Extensão instalada, syntax highlighting em .env files

#### 12. React Refactor (1 item)
- [ ] **F2-05:** Instalar extensão
  - Comando: `code --install-extension planbcoding.vscode-react-refactor`
  - Critério: Extensão instalada

#### 13. Auto Close Tag (1 item)
- [ ] **F2-06:** Instalar extensão
  - Comando: `code --install-extension formulahendry.auto-close-tag`
  - Critério: Extensão instalada

#### 14. Path Intellisense (1 item)
- [ ] **F2-07:** Instalar extensão
  - Comando: `code --install-extension christian-kohler.path-intellisense`
  - Critério: Extensão instalada

#### 15. Total TypeScript (1 item)
- [ ] **F2-08:** Instalar extensão
  - Comando: `code --install-extension mattpocock.ts-error-translator`
  - Critério: Extensão instalada

#### 16. Import Cost (2 itens)
- [ ] **F2-09:** Instalar extensão
  - Comando: `code --install-extension wix.vscode-import-cost`
  - Critério: Extensão instalada

- [ ] **F2-10:** Validar tamanho import
  - Teste: Abrir `frontend/src/`, import `date-fns` → Ver tamanho inline
  - Critério: Tamanho aparece ao lado do import
  - Screenshot: `F2-IMPORT-COST.png`

#### Validação Fase 2 (2 itens)
- [ ] **F2-11:** TypeScript 0 erros (frontend + backend)
  - Comando: `cd backend && npx tsc --noEmit && cd ../frontend && npx tsc --noEmit && cd ..`
  - Critério: 0 erros ambos

- [ ] **F2-12:** VSCode performance OK
  - Validação: Task Manager, RAM < 700MB, CPU < 10% idle
  - Critério: Performance aceitável

---

### ⚡ FASE 3: EXTENSÕES DESEJÁVEIS (8 itens - 5 extensões)

#### 17. Better Comments (1 item)
- [ ] **F3-01:** Instalar extensão
  - Comando: `code --install-extension aaron-bond.better-comments`
  - Critério: Extensão instalada

#### 18. Tailwind Documentation (1 item)
- [ ] **F3-02:** Instalar extensão
  - Comando: `code --install-extension austenc.tailwind-docs`
  - Critério: Extensão instalada

#### 19. Stylelint (1 item)
- [ ] **F3-03:** Instalar extensão
  - Comando: `code --install-extension stylelint.vscode-stylelint`
  - Critério: Extensão instalada

#### 20. KICS (IaC Security) (2 itens)
- [ ] **F3-04:** Instalar extensão
  - Comando: `code --install-extension checkmarx.kics`
  - Critério: Extensão instalada

- [ ] **F3-05:** Scan docker-compose.yml
  - Teste: Right-click `docker-compose.yml` → KICS scan
  - Critério: Scan completa, report gerado

#### 21. Python Environment Manager (1 item)
- [ ] **F3-06:** Instalar extensão
  - Comando: `code --install-extension donjayamanne.python-environment-manager`
  - Critério: Extensão instalada

#### Validação Fase 3 (2 itens)
- [ ] **F3-07:** TypeScript 0 erros
  - Comando: `cd backend && npx tsc --noEmit && cd ../frontend && npx tsc --noEmit && cd ..`
  - Critério: 0 erros

- [ ] **F3-08:** Screenshot VSCode Extensions panel
  - Salvar: `F3-EXTENSIONS-PANEL-AFTER.png`
  - Critério: 93 extensões instaladas (107 - 37 + 21 = 91... aguardar Fase 4)

---

### 🧹 FASE 4: LIMPEZA REDUNDANTES (10 itens)

#### Remover Azure Tools (18 extensões)
- [ ] **F4-01:** Desinstalar extensões Azure
  - Comando: Ver script completo em `VSCODE_EXTENSIONS_RECOMMENDATIONS_2025.md` Fase 4
  - Critério: 18 extensões removidas

#### Remover MQL/Trading (8 extensões)
- [ ] **F4-02:** Desinstalar extensões MQL
  - Comando: Ver script Fase 4
  - Critério: 8 extensões removidas

#### Remover Frontend não usado (3 extensões)
- [ ] **F4-03:** Desinstalar Angular, Vue, React Native
  - Comando: Ver script Fase 4
  - Critério: 3 extensões removidas

#### Remover C/C++ (4 extensões)
- [ ] **F4-04:** Desinstalar extensões C/C++
  - Comando: Ver script Fase 4
  - Critério: 4 extensões removidas

#### Remover AI alternatives (4 extensões)
- [ ] **F4-05:** Desinstalar AI duplicados
  - Comando: Ver script Fase 4
  - Critério: 4 extensões removidas (manter Claude Code + Copilot)

#### Validação Limpeza (5 itens)
- [ ] **F4-06:** Reiniciar VSCode
  - Critério: VSCode reiniciado

- [ ] **F4-07:** Verificar total extensões
  - Critério: ~93 extensões (107 - 37 + 21 = 91-93 range OK)

- [ ] **F4-08:** Medir consumo RAM VSCode
  - Ferramenta: Task Manager (Windows) ou Activity Monitor (Mac)
  - Critério: < 600MB RAM (target ~500MB)

- [ ] **F4-09:** Medir startup time VSCode
  - Método: Fechar VSCode, cronometrar `code .` até render completo
  - Critério: < 4s (target ~3s)

- [ ] **F4-10:** Screenshot Extensions panel final
  - Salvar: `F4-EXTENSIONS-FINAL.png`
  - Critério: Screenshot mostra 91-93 extensões

---

### ✅ PÓS-IMPLEMENTAÇÃO (16 itens)

#### Validação Final Sistema (5 itens)
- [ ] **POST-01:** TypeScript 0 erros (backend + frontend)
  - Comando: `cd backend && npx tsc --noEmit && cd ../frontend && npx tsc --noEmit && cd ..`
  - Critério: 0 erros ambos

- [ ] **POST-02:** Build backend sucesso
  - Comando: `cd backend && npm run build && cd ..`
  - Critério: "Compiled successfully"

- [ ] **POST-03:** Build frontend sucesso
  - Comando: `cd frontend && npm run build && cd ..`
  - Critério: "17 páginas compiladas" (ou número atual)

- [ ] **POST-04:** Backend rodando OK
  - Comando: `curl http://localhost:3101/health`
  - Critério: `{"status": "ok"}`

- [ ] **POST-05:** Frontend rodando OK
  - Comando: `curl http://localhost:3100`
  - Critério: HTML retornado

#### Validação Tripla MCP Final (5 itens)
- [ ] **POST-06:** Playwright MCP - Navegação completa
  - MCP: Navegar frontend, testar 3 páginas principais
  - Critério: 0 erros navegação

- [ ] **POST-07:** Playwright MCP - Screenshot fullPage
  - MCP: `mcp__playwright__browser_take_screenshot` (fullPage: true)
  - Salvar: `POST-PLAYWRIGHT-FULL.png`

- [ ] **POST-08:** Chrome DevTools MCP - Console 0 erros
  - MCP: `mcp__chrome-devtools__list_console_messages` (types: error)
  - Critério: 0 errors (warnings esperados OK)

- [ ] **POST-09:** Chrome DevTools MCP - Screenshot final
  - MCP: `mcp__chrome-devtools__take_screenshot`
  - Salvar: `POST-CHROME-FINAL.png`

- [ ] **POST-10:** Sequential Thinking MCP - Análise completa
  - MCP: Analisar todos resultados, confirmar sucesso
  - Critério: Confirmação 0 problemas, métricas atingidas

#### Documentação (4 itens)
- [ ] **POST-11:** Atualizar CLAUDE.md
  - Seção: Adicionar "Extensões VSCode Otimizadas" com referência
  - Critério: Seção criada, link para VSCODE_SETUP.md

- [ ] **POST-12:** Atualizar ARCHITECTURE.md
  - Seção: Developer Experience → Adicionar ferramentas VSCode
  - Critério: Seção atualizada

- [ ] **POST-13:** Atualizar ROADMAP.md
  - Adicionar: FASE X - Otimização Ambiente Desenvolvimento (100% completo)
  - Critério: Entrada criada com data, validações, resultado

- [ ] **POST-14:** Criar VSCODE_SETUP.md
  - Conteúdo: Guia completo instalação para novos devs
  - Critério: Documento criado, 21 extensões listadas, configurações incluídas

#### Git Final (2 itens)
- [ ] **POST-15:** Commit todas mudanças
  - Comando: `git add . && git commit -m "feat(dx): Optimize VSCode extensions (21 approved, 37 removed, +60% productivity)"`
  - Corpo: Incluir validações realizadas, métricas atingidas
  - Critério: Commit criado com Co-Authored-By: Claude

- [ ] **POST-16:** Push para remoto
  - Comando: `git push origin main`
  - Critério: Branch sincronizada, disponível Claude Code Web

---

## 🔧 CONFIGURAÇÕES COMPLETAS

### frontend/.prettierrc
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

### .vscode/settings.json
```json
{
  "// ============================================": "",
  "// CONFIGURAÇÃO ULTRA-ROBUSTA (2025-11-20)": "",
  "// CRIADO POR: IMPLEMENTACAO_EXTENSOES_VSCODE_TODO_MASTER.md": "",
  "// ============================================": "",

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
  "tailwindCSS.lint.cssConflict": "warning",
  "tailwindCSS.lint.invalidApply": "error",
  "editor.quickSuggestions": {
    "strings": true
  },

  "// ===== PRETTIER (formatação Tailwind via plugin) =====": "",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  "// ===== JEST (BACKEND APENAS) =====": "",
  "jest.autoRun": "off",
  "jest.rootPath": "backend",
  "jest.jestCommandLine": "npm run test --prefix backend",
  "jest.showCoverageOnLoad": false,
  "jest.testExplorer": {
    "enabled": true
  },
  "// ⚠️ CRÍTICO: autoRun OFF para evitar travar VSCode": "",

  "// ===== CONSOLE NINJA (Community Edition) =====": "",
  "console-ninja.featureSet": "Community",
  "console-ninja.toolsToEnableSupportAutomaticallyFor": {
    "live-server-extension": true,
    "live-preview-extension": true
  },

  "// ===== ESLINT =====": "",
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.format.enable": true,

  "// ===== IMPORT COST =====": "",
  "importCost.bundleSizeDecoration": "both",
  "importCost.showCalculatingDecoration": true,
  "importCost.typescriptExtensions": ["\\.tsx?$"],

  "// ===== BETTER COMMENTS =====": "",
  "better-comments.tags": [
    {
      "tag": "!",
      "color": "#FF2D00",
      "strikethrough": false,
      "backgroundColor": "transparent",
      "bold": false,
      "italic": false
    },
    {
      "tag": "?",
      "color": "#3498DB",
      "strikethrough": false,
      "backgroundColor": "transparent",
      "bold": false,
      "italic": false
    },
    {
      "tag": "todo",
      "color": "#FF8C00",
      "strikethrough": false,
      "backgroundColor": "transparent",
      "bold": false,
      "italic": false
    }
  ],

  "// ===== AUTO RENAME TAG =====": "",
  "auto-rename-tag.activationOnLanguage": [
    "html",
    "xml",
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],

  "// ===== EXISTING CONFIG (manter) =====": "",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/scrapers/venv/bin/python",
  "dbclient.defaultDatabase": "postgres://invest_admin:@localhost:5532/invest_data",
  "redis-client.defaultConnection": "redis://localhost:6479"
}
```

---

## 🚨 ALERTAS CRÍTICOS

### ⚠️ NUNCA FAZER
1. ❌ Instalar Headwind extension (conflita com Prettier)
2. ❌ Instalar Test Explorer UI (redundante com Jest)
3. ❌ Habilitar Jest auto-run antes de testar
4. ❌ Instalar extensões sem validar fase anterior
5. ❌ Commitar com erros TypeScript
6. ❌ Pular validação tripla MCP
7. ❌ Assumir documentação está atualizada (validar arquivos reais)
8. ❌ Criar workaround ao invés de corrigir problema

### ✅ SEMPRE FAZER
1. ✅ Backup antes de qualquer mudança
2. ✅ Git atualizado (pull, commit, push)
3. ✅ TypeScript 0 erros após cada fase
4. ✅ Reiniciar serviços antes de testar
5. ✅ Screenshots evidência (MCPs em janelas separadas)
6. ✅ Validação tripla MCP completa
7. ✅ Documentação atualizada
8. ✅ Monitorar performance VSCode (RAM/CPU)

---

## 📈 TRACKING DE PROGRESSO

### Status por Fase
- [ ] **PRÉ-IMPLEMENTAÇÃO:** 0/14 (0%)
- [ ] **FASE 1 (Críticas):** 0/18 (0%)
- [ ] **VALIDAÇÃO FASE 1:** 0/12 (0%)
- [ ] **FASE 2 (Importantes):** 0/12 (0%)
- [ ] **FASE 3 (Desejáveis):** 0/8 (0%)
- [ ] **FASE 4 (Limpeza):** 0/10 (0%)
- [ ] **PÓS-IMPLEMENTAÇÃO:** 0/16 (0%)

### Total Geral
**0/90 itens completos (0%)**
*(Nota: 78 checklist + 12 validação = 90 total)*

---

## 🎯 PRÓXIMOS PASSOS

### Aguardando Aprovação Usuário

**Perguntas antes de iniciar:**

1. **Git Status OK?**
   - 2 commits ahead (precisa push?)
   - Arquivos modificados/untracked OK para commit?

2. **Sistema rodando OK?**
   - Backend health check passa?
   - Frontend renderiza?
   - Dados reais disponíveis (scrapers rodaram)?

3. **Tempo disponível?**
   - Estimativa: 3h 10min completo
   - Ou fazer por partes? (PRÉ + FASE 1 hoje = 1h 15min)

4. **Preferência validação?**
   - Screenshots obrigatórios ou opcional?
   - MCPs em paralelo (3 janelas) ou sequencial?

5. **Confirmar regras?**
   - 0 erros/warnings tolerância zero?
   - Corrigir problemas crônicos definitivo (não workarounds)?
   - Documentação completa obrigatória?

**Após aprovação, iniciar:**
✅ PRÉ-IMPLEMENTAÇÃO (14 itens)
✅ FASE 1 (18 itens + 12 validação)

---

**Documento TODO Master completo! Aguardando aprovação para iniciar implementação.** 🚀

**Fim do TODO MASTER**
