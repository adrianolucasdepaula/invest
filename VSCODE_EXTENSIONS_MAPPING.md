# VSCode Extensions Mapping

**Data:** 2025-11-20
**Total de Extensões:** 107
**Ambiente:** Windows (WSL + Remote Development)

---

## 📊 Resumo Executivo

| Categoria | Quantidade | % do Total |
|-----------|------------|------------|
| AI/Copilot Tools | 10 | 9.3% |
| Git/Version Control | 3 | 2.8% |
| Database Tools | 4 | 3.7% |
| Cloud/Azure | 18 | 16.8% |
| MQL/Trading | 8 | 7.5% |
| Python/Data Science | 10 | 9.3% |
| Frontend Development | 6 | 5.6% |
| Docker/Containers | 3 | 2.8% |
| Markdown/Documentation | 4 | 3.7% |
| Code Quality/Linting | 5 | 4.7% |
| Remote Development | 10 | 9.3% |
| Utilities | 26 | 24.3% |

---

## 🤖 AI/Copilot Tools (10 extensões)

### 1. **Anthropic Claude Code** ⭐ PRINCIPAL
- **ID:** `anthropic.claude-code@2.0.47`
- **Uso:** AI coding assistant oficial da Anthropic (Claude Sonnet 4.5)
- **Relevância:** CRÍTICA - Ferramenta principal de desenvolvimento com IA
- **Features:** Code generation, debugging, refactoring, documentation
- **Configuração:** Ver `.claude/` folder para agents e prompts

### 2. **GitHub Copilot**
- **ID:** `github.copilot@1.388.0`
- **Uso:** Code completion e suggestions inline
- **Relevância:** Alta - Complementa Claude Code
- **Features:** Autocomplete, code snippets, context-aware suggestions

### 3. **GitHub Copilot Chat**
- **ID:** `github.copilot-chat@0.33.2`
- **Uso:** Chat interface para GitHub Copilot
- **Relevância:** Média - Alternativa ao Claude Code

### 4. **Continue.dev**
- **ID:** `continue.continue@1.3.24`
- **Uso:** Local AI code assistant (Ollama integration)
- **Relevância:** Média - Para uso offline com LLMs locais

### 5. **Ollama Chat**
- **ID:** `ashishalex.ollama-chat@0.0.23`
- **Uso:** Chat interface para Ollama (LLMs locais)
- **Relevância:** Baixa - Backup para desenvolvimento offline

### 6. **Google Gemini CLI**
- **ID:** `google.gemini-cli-vscode-ide-companion@0.7.0`
- **Uso:** Gemini AI integration
- **Relevância:** Baixa - Experimental

### 7. **Google Gemini Code Assist**
- **ID:** `google.geminicodeassist@2.58.1`
- **Uso:** Google's AI code assistant
- **Relevância:** Baixa - Alternativa ao Copilot

### 8. **CodeGPT**
- **ID:** `danielsanmedium.dscodegpt@3.14.190`
- **Uso:** GPT-based code assistant
- **Relevância:** Baixa - Redundante com Claude Code

### 9. **Perplexity Extension**
- **ID:** `ghutu.perplexity-ext@2.0.1`
- **Uso:** Perplexity AI search integration
- **Relevância:** Baixa - Para pesquisa rápida

### 10. **Prompt Optimizer**
- **ID:** `datapipe-labs.prompt-optimizer@1.0.2`
- **Uso:** Otimização de prompts para LLMs
- **Relevância:** Média - Útil para melhorar prompts Claude

---

## 🔧 Git/Version Control (3 extensões)

### 1. **GitLens** ⭐
- **ID:** `eamodio.gitlens@17.7.1`
- **Uso:** Git supercharged (blame, history, diff, etc)
- **Relevância:** CRÍTICA - Visualização avançada de Git
- **Features:**
  - Git blame inline
  - Commit history
  - File history
  - Diff comparison
  - Branch management

### 2. **Git History**
- **ID:** `donjayamanne.githistory@0.6.20`
- **Uso:** Visualização de histórico Git
- **Relevância:** Média - Complementa GitLens

### 3. **GitHub Pull Requests**
- **ID:** `github.vscode-pull-request-github@0.122.1`
- **Uso:** Gerenciar PRs direto no VSCode
- **Relevância:** Alta - Workflow GitHub integrado

---

## 🗄️ Database Tools (4 extensões)

### 1. **Database Client JDBC** ⭐
- **ID:** `cweijan.dbclient-jdbc@1.4.6`
- **Uso:** Cliente universal de banco de dados (PostgreSQL, MySQL, etc)
- **Relevância:** CRÍTICA - Gestão do PostgreSQL do projeto
- **Features:**
  - Query editor
  - Schema explorer
  - Export/Import data
  - SQL formatting

### 2. **Redis Client**
- **ID:** `cweijan.vscode-redis-client@8.4.2`
- **Uso:** Gerenciar Redis (BullMQ queues)
- **Relevância:** CRÍTICA - Monitorar filas BullMQ
- **Portas:** localhost:6479 (ver INSTALL.md)

### 3. **MongoDB**
- **ID:** `mongodb.mongodb-vscode@1.14.2`
- **Uso:** Cliente MongoDB
- **Relevância:** Baixa - Projeto usa PostgreSQL (possível uso futuro)

### 4. **SQLite Explorer**
- **ID:** `alexcvzz.vscode-sqlite@0.14.1`
- **Uso:** Visualizar arquivos .sqlite
- **Relevância:** Baixa - Para análise de DBs locais

---

## ☁️ Cloud/Azure (18 extensões)

### Resumo
Conjunto extensivo de ferramentas Azure (projeto pode ter histórico Azure):

1. **Azure Dev** (`ms-azuretools.azure-dev@0.10.0`)
2. **Azure GitHub Copilot** (`ms-azuretools.vscode-azure-github-copilot@1.0.137`)
3. **Azure MCP Server** (`ms-azuretools.vscode-azure-mcp-server@1.0.0`)
4. **Azure App Service** (`ms-azuretools.vscode-azureappservice@0.26.4`)
5. **Azure Container Apps** (`ms-azuretools.vscode-azurecontainerapps@0.10.0`)
6. **Azure Functions** (`ms-azuretools.vscode-azurefunctions@1.20.1`)
7. **Azure Resource Groups** (`ms-azuretools.vscode-azureresourcegroups@0.11.7`)
8. **Azure Static Web Apps** (`ms-azuretools.vscode-azurestaticwebapps@0.13.2`)
9. **Azure Storage** (`ms-azuretools.vscode-azurestorage@0.17.1`)
10. **Azure Cosmos DB** (`ms-azuretools.vscode-cosmosdb@0.30.1`)
11. **Google Cloud Code** (`googlecloudtools.cloudcode@2.37.0`)
12. **Windows AI Studio** (`ms-windows-ai-studio.windows-ai-studio@0.26.2`)
13. **Azure AI Foundry** (`teamsdevapp.vscode-ai-foundry@0.12.2`)
14. **Containers** (`ms-azuretools.vscode-containers@2.3.0`)
15. **Kubernetes** (`ms-kubernetes-tools.vscode-kubernetes-tools@1.3.26`)
16. **Terraform** (`hashicorp.terraform@2.37.5`)
17. **Ansible** (`redhat.ansible@25.9.0`)
18. **Node Azure Pack** (`ms-vscode.vscode-node-azure-pack@1.8.0`)

**Relevância:** Baixa para o projeto atual (deploy local Docker Compose)
**Ação Recomendada:** Considerar desabilitar extensões Azure não utilizadas (performance)

---

## 📈 MQL/Trading (8 extensões)

### Contexto
Extensões específicas para MetaTrader 4/5 (MQL4/MQL5):

1. **MQL Lang** (`jf17.mql-lang@0.0.76`) - Syntax highlighting
2. **Compile MQL4** (`keisukeiwabuchi.compilemql4@0.0.1`) - Compiler integration
3. **MQ4 Language** (`nervtech.mq4@1.0.4`) - MQL4 support
4. **MQL Over C++** (`nicholishen.mql-over-cpp@0.0.3`) - Transpiler
5. **MQL Snippets** (`nicholishen.mql-snippets@0.1.2`) - Code snippets
6. **MQL5 Template Wizard** (`sensecoder.mql5filestemplatewizard@1.0.2`)
7. **ProfitRobots MQ4 Snippets** (`sibvic.profitrobots-mq4-snippets@1.8.0`)
8. **ProfitRobots MQ5 Snippets** (`sibvic.profitrobots-mq5-snippets@1.5.0`)

**Relevância:** Média - Projeto foca em B3 (não Forex/MT4/MT5)
**Ação Recomendada:** Manter desabilitado (a menos que planeje integração MetaTrader)

---

## 🐍 Python/Data Science (10 extensões)

### 1. **Python** ⭐
- **ID:** `ms-python.python@2025.18.0`
- **Uso:** Python language support
- **Relevância:** CRÍTICA - Scrapers em Python (backend/scrapers/)
- **Features:** IntelliSense, debugging, linting, formatting

### 2. **Pylance**
- **ID:** `ms-python.vscode-pylance@2025.9.1`
- **Uso:** Python language server (fast IntelliSense)
- **Relevância:** CRÍTICA - Type checking, autocomplete

### 3. **Python Debugger**
- **ID:** `ms-python.debugpy@2025.16.0`
- **Uso:** Python debugging
- **Relevância:** Alta - Debug de scrapers Playwright

### 4. **Python Environments**
- **ID:** `ms-python.vscode-python-envs@1.12.0`
- **Uso:** Gerenciar ambientes Python (venv, conda)
- **Relevância:** Alta - Gerenciar deps dos scrapers

### 5. **Jupyter** ⭐
- **ID:** `ms-toolsai.jupyter@2025.9.1`
- **Uso:** Jupyter notebooks no VSCode
- **Relevância:** Alta - Análise de dados e backtesting
- **Features:** Run cells, interactive plots, export

### 6. **Jupyter Keymap**
- **ID:** `ms-toolsai.jupyter-keymap@1.1.2`
- **Uso:** Atalhos Jupyter tradicionais

### 7. **Jupyter Renderers**
- **ID:** `ms-toolsai.jupyter-renderers@1.3.0`
- **Uso:** Renderizar outputs complexos (plots, DataFrames)

### 8. **Jupyter Cell Tags**
- **ID:** `ms-toolsai.vscode-jupyter-cell-tags@0.1.9`
- **Uso:** Organizar cells com tags

### 9. **Jupyter Slideshow**
- **ID:** `ms-toolsai.vscode-jupyter-slideshow@0.1.6`
- **Uso:** Criar apresentações de notebooks

### 10. **Data Wrangler**
- **ID:** `ms-toolsai.datawrangler@1.22.0`
- **Uso:** Limpeza e transformação de dados
- **Relevância:** Média - Útil para análise de dados B3

---

## ⚛️ Frontend Development (6 extensões)

### 1. **Angular Language Service** ⭐
- **ID:** `angular.ng-template@21.0.0`
- **Uso:** Angular template support
- **Relevância:** Baixa - Projeto usa Next.js (não Angular)
- **Ação:** Desabilitar

### 2. **React Native Tools**
- **ID:** `msjsdiag.vscode-react-native@1.13.0`
- **Uso:** React Native development
- **Relevância:** Baixa - Projeto é web (não mobile)

### 3. **Vetur**
- **ID:** `octref.vetur@0.37.3`
- **Uso:** Vue.js support
- **Relevância:** Baixa - Projeto usa Next.js (não Vue)

### 4. **Edge DevTools**
- **ID:** `ms-edgedevtools.vscode-edge-devtools@2.1.10`
- **Uso:** Microsoft Edge DevTools no VSCode
- **Relevância:** Baixa - Chrome DevTools MCP já disponível

### 5. **Firefox Debug**
- **ID:** `firefox-devtools.vscode-firefox-debug@2.15.0`
- **Uso:** Debug no Firefox
- **Relevância:** Baixa - Projeto testa principalmente no Chrome

### 6. **npm IntelliSense**
- **ID:** `christian-kohler.npm-intellisense@1.4.5`
- **Uso:** Autocomplete de imports npm
- **Relevância:** Alta - Melhora DX no frontend/backend

---

## 🐳 Docker/Containers (3 extensões)

### 1. **Docker** ⭐
- **ID:** `ms-azuretools.vscode-docker@2.0.0`
- **Uso:** Gerenciar containers Docker
- **Relevância:** CRÍTICA - Projeto usa Docker Compose
- **Features:**
  - docker-compose.yml IntelliSense
  - Logs de containers
  - Attach to shell
  - Build/Stop/Restart containers

### 2. **Containers (Dev Containers)**
- **ID:** `ms-azuretools.vscode-containers@2.3.0`
- **Uso:** Desenvolver dentro de containers
- **Relevância:** Baixa - Projeto não usa Dev Containers

### 3. **Remote - Containers**
- **ID:** `ms-vscode-remote.remote-containers@0.431.1`
- **Uso:** Abrir workspace em container
- **Relevância:** Baixa - Projeto roda localmente

---

## 📝 Markdown/Documentation (4 extensões)

### 1. **Markdown All in One** ⭐
- **ID:** `yzhang.markdown-all-in-one@3.6.3`
- **Uso:** Suite completa para Markdown
- **Relevância:** Alta - Documentação extensiva do projeto
- **Features:**
  - Table of Contents auto
  - Formatting
  - Shortcuts
  - Preview

### 2. **Markdown Mermaid**
- **ID:** `bierner.markdown-mermaid@1.29.0`
- **Uso:** Diagramas Mermaid em Markdown
- **Relevância:** Média - Para diagramas de arquitetura

### 3. **Markdown Lint**
- **ID:** `davidanson.vscode-markdownlint@0.60.0`
- **Uso:** Linting de Markdown
- **Relevância:** Alta - Manter .md files consistentes

### 4. **Word Count**
- **ID:** `ms-vscode.wordcount@0.1.0`
- **Uso:** Contador de palavras
- **Relevância:** Baixa - Útil para documentação longa

---

## ✅ Code Quality/Linting (5 extensões)

### 1. **ESLint** ⭐
- **ID:** `dbaeumer.vscode-eslint@3.0.16`
- **Uso:** Linting JavaScript/TypeScript
- **Relevância:** CRÍTICA - Garantir code quality (0 warnings obrigatório)
- **Configuração:** `.eslintrc.js` (frontend/backend)

### 2. **Error Lens**
- **ID:** `usernamehw.errorlens@3.26.0`
- **Uso:** Mostrar erros inline (mais visível)
- **Relevância:** Alta - Melhor visualização de erros

### 3. **SonarLint**
- **ID:** `sonarsource.sonarlint-vscode@4.35.1`
- **Uso:** Análise de código estática (bugs, code smells)
- **Relevância:** Alta - Detectar vulnerabilidades

### 4. **Snyk Vulnerability Scanner**
- **ID:** `snyk-security.snyk-vulnerability-scanner@2.26.0`
- **Uso:** Scan de dependências vulneráveis
- **Relevância:** Alta - Segurança (especialmente scrapers)

### 5. **DevSkim**
- **ID:** `ms-cst-e.vscode-devskim@1.0.68`
- **Uso:** Security linter (OWASP patterns)
- **Relevância:** Média - Segurança adicional

---

## 🔌 Remote Development (10 extensões)

### 1. **Remote - WSL** ⭐
- **ID:** `ms-vscode-remote.remote-wsl@0.104.3`
- **Uso:** Desenvolver em Windows Subsystem for Linux
- **Relevância:** Alta - Windows development com Linux tooling
- **Features:** Access Linux filesystem, run Linux commands

### 2. **Remote - SSH**
- **ID:** `ms-vscode-remote.remote-ssh@0.120.0`
- **Uso:** Conectar a servidores SSH
- **Relevância:** Média - Para deploy remoto

### 3. **Remote - SSH Edit**
- **ID:** `ms-vscode-remote.remote-ssh-edit@0.87.0`
- **Uso:** Editar configurações SSH
- **Relevância:** Baixa - Complemento do Remote SSH

### 4. **Remote - WSL Recommender**
- **ID:** `ms-vscode-remote.remote-wsl-recommender@0.0.20`
- **Uso:** Sugerir uso de WSL
- **Relevância:** Baixa - Utilitário

### 5. **Remote Explorer**
- **ID:** `ms-vscode.remote-explorer@0.5.0`
- **Uso:** Explorar ambientes remotos
- **Relevância:** Baixa - UI para Remote extensions

### 6. **Remote Server**
- **ID:** `ms-vscode.remote-server@1.5.3`
- **Uso:** VSCode Server (remote development)
- **Relevância:** Baixa - Para desenvolvimento remoto

### 7-10. **Remote Extension Pack** (meta-extension)
- **ID:** `ms-vscode-remote.vscode-remote-extensionpack@0.26.0`
- Agrupa: WSL, SSH, Containers, Remote Server

---

## 🛠️ Utilities (26 extensões)

### Produtividade

1. **Bookmarks** ⭐
   - **ID:** `alefragnani.bookmarks@13.5.0`
   - **Uso:** Marcar linhas importantes no código
   - **Relevância:** Alta - Navegar em codebase grande

2. **Project Manager** ⭐
   - **ID:** `alefragnani.project-manager@12.8.0`
   - **Uso:** Gerenciar múltiplos projetos
   - **Relevância:** Alta - Alternar entre frontend/backend rapidamente

3. **Todo Tree** ⭐
   - **ID:** `gruntfuggly.todo-tree@0.0.226`
   - **Uso:** Visualizar TODOs, FIXMEs, etc
   - **Relevância:** Alta - Rastrear tarefas pendentes
   - **Buscar:** TODO, FIXME, HACK, NOTE

4. **Code Tour**
   - **ID:** `vsls-contrib.codetour@0.0.61`
   - **Uso:** Criar tours guiados do código
   - **Relevância:** Média - Onboarding

5. **Local History** ⭐
   - **ID:** `xyz.local-history@1.8.1`
   - **Uso:** Histórico local de arquivos (backup automático)
   - **Relevância:** Alta - Recuperar código perdido

### Visualização

6. **Indent Rainbow**
   - **ID:** `oderwat.indent-rainbow@8.3.1`
   - **Uso:** Colorir indentação
   - **Relevância:** Média - Legibilidade

7. **Trailing Spaces**
   - **ID:** `shardulm94.trailing-spaces@0.4.1`
   - **Uso:** Destacar espaços em branco no final
   - **Relevância:** Alta - Limpeza de código

8. **Output Colorizer**
   - **ID:** `ibm.output-colorizer@0.1.2`
   - **Uso:** Colorir output de terminal
   - **Relevância:** Média - Logs mais legíveis

9. **C/C++ Themes**
   - **ID:** `ms-vscode.cpptools-themes@2.0.0`
   - **Uso:** Temas para C/C++
   - **Relevância:** Baixa - Projeto não usa C/C++

### Editores Especiais

10. **Hex Editor**
    - **ID:** `ms-vscode.hexeditor@1.11.1`
    - **Uso:** Editar binários
    - **Relevância:** Baixa - Para debugging avançado

11. **Excel Viewer** ⭐
    - **ID:** `grapecity.gc-excelviewer@4.2.64`
    - **Uso:** Visualizar .xlsx, .csv
    - **Relevância:** Alta - Análise de dados B3 (COTAHIST)

12. **Edit CSV**
    - **ID:** `janisdd.vscode-edit-csv@0.11.7`
    - **Uso:** Editar CSVs com tabela
    - **Relevância:** Alta - Dados financeiros em CSV

13. **Rainbow CSV** ⭐
    - **ID:** `mechatroner.rainbow-csv@3.23.0`
    - **Uso:** Colorir colunas CSV
    - **Relevância:** Alta - Legibilidade de CSVs B3

14. **JSON to CSV**
    - **ID:** `khaeransori.json2csv@1.0.0`
    - **Uso:** Converter JSON → CSV
    - **Relevância:** Média - Export de dados

15. **Data Preview**
    - **ID:** `randomfractalsinc.vscode-data-preview@2.3.0`
    - **Uso:** Preview de dados (CSV, JSON, etc)
    - **Relevância:** Alta - Análise rápida

### Ferramentas de Desenvolvimento

16. **Code Runner**
    - **ID:** `formulahendry.code-runner@0.12.2`
    - **Uso:** Executar código rapidamente
    - **Relevância:** Média - Testes rápidos

17. **REST Client** ⭐
    - **ID:** `humao.rest-client@0.25.1`
    - **Uso:** Testar APIs HTTP (alternativa ao Postman)
    - **Relevância:** CRÍTICA - Testar backend APIs
    - **Uso no projeto:** Testar endpoints `/api/v1/...`

18. **Live Server**
    - **ID:** `ritwickdey.liveserver@5.7.9`
    - **Uso:** Dev server com hot reload (HTML puro)
    - **Relevância:** Baixa - Next.js já tem hot reload

19. **SQLTools**
    - **ID:** `mtxr.sqltools@0.28.5`
    - **Uso:** SQL client universal
    - **Relevância:** Média - Alternativa ao Database Client JDBC

20. **Partial Diff**
    - **ID:** `ryu1kn.partial-diff@1.4.3`
    - **Uso:** Comparar trechos de código
    - **Relevância:** Alta - Comparar versões

### Spelling & YAML

21. **Code Spell Checker** ⭐
    - **ID:** `streetsidesoftware.code-spell-checker@4.3.2`
    - **Uso:** Corretor ortográfico
    - **Relevância:** Alta - Documentação + comments em inglês

22. **YAML**
    - **ID:** `redhat.vscode-yaml@1.19.1`
    - **Uso:** YAML language support
    - **Relevância:** Alta - docker-compose.yml, CI/CD

### C/C++ (Legado)

23. **C/C++ Extension Pack**
    - **ID:** `ms-vscode.cpptools-extension-pack@1.3.1`
    - **Uso:** C/C++ development
    - **Relevância:** Baixa - Projeto não usa C/C++

24. **CMake Tools**
    - **ID:** `ms-vscode.cmake-tools@1.21.36`
    - **Uso:** CMake integration
    - **Relevância:** Baixa - Projeto não usa CMake

25. **Makefile Tools**
    - **ID:** `ms-vscode.makefile-tools@0.12.17`
    - **Uso:** Makefile support
    - **Relevância:** Baixa - Projeto usa npm scripts

### Outros

26. **PowerShell**
    - **ID:** `ms-vscode.powershell@2025.4.0`
    - **Uso:** PowerShell language support
    - **Relevância:** Média - Scripts Windows

27. **Notepad++ Keybindings**
    - **ID:** `ms-vscode.notepadplusplus-keybindings@1.0.7`
    - **Uso:** Atalhos do Notepad++
    - **Relevância:** Baixa - Preferência pessoal

28. **Playwright** ⭐
    - **ID:** `ms-playwright.playwright@1.1.17`
    - **Uso:** Playwright testing integration
    - **Relevância:** CRÍTICA - E2E tests + Scrapers
    - **Uso no projeto:** frontend/tests/, backend/scrapers/

29. **.NET Runtime**
    - **ID:** `ms-dotnettools.vscode-dotnet-runtime@2.3.7`
    - **Uso:** .NET runtime para extensões
    - **Relevância:** Baixa - Dependência de outras extensões

30. **Files to LLM Prompt**
    - **ID:** `dhrxvextensions.files-to-llm-prompt@1.2.0`
    - **Uso:** Converter arquivos em prompts LLM
    - **Relevância:** Média - Útil para Claude Code

31. **Message Query Language (MQL)**
    - **ID:** `sublimesecurity.message-query-language@0.1.2`
    - **Uso:** Query language para logs/mensagens
    - **Relevância:** Baixa - Não relacionado ao projeto

---

## 📊 Análise de Extensões

### Extensões Críticas (13)

**Manter SEMPRE habilitadas:**

1. ✅ Anthropic Claude Code - AI principal
2. ✅ GitLens - Git avançado
3. ✅ Database Client JDBC - PostgreSQL
4. ✅ Redis Client - BullMQ
5. ✅ Docker - Containers
6. ✅ Python + Pylance - Scrapers
7. ✅ Jupyter - Data analysis
8. ✅ ESLint - Code quality
9. ✅ Markdown All in One - Docs
10. ✅ REST Client - API testing
11. ✅ Playwright - E2E tests
12. ✅ Bookmarks - Code navigation
13. ✅ Rainbow CSV - Dados B3

### Extensões Redundantes/Desnecessárias (25+)

**Considerar DESABILITAR para melhorar performance:**

#### AI Tools (4)
- ❌ Ollama Chat (offline)
- ❌ Google Gemini CLI
- ❌ Google Gemini Code Assist
- ❌ CodeGPT

**Motivo:** Claude Code já é suficiente. Copilot como backup.

#### Azure/Cloud (18)
- ❌ Todas as extensões Azure (exceto se usar Azure)
- ❌ Windows AI Studio
- ❌ Google Cloud Code

**Motivo:** Projeto usa Docker local (não cloud).

#### MQL/Trading (8)
- ❌ Todas as extensões MQL4/MQL5

**Motivo:** Projeto foca em B3 (não MetaTrader).

#### Frontend (3)
- ❌ Angular Language Service
- ❌ React Native Tools
- ❌ Vetur (Vue.js)

**Motivo:** Projeto usa Next.js apenas.

#### C/C++ (4)
- ❌ C/C++ Extension Pack
- ❌ CMake Tools
- ❌ Makefile Tools
- ❌ C/C++ Themes

**Motivo:** Projeto não usa C/C++.

#### Remote Dev (parcial)
- ❌ Remote - Containers (se não usar Dev Containers)
- ❌ Remote - SSH (se não usar deploy remoto)

**Motivo:** Projeto roda localmente. Manter apenas WSL se no Windows.

---

## 🚀 Recomendações de Otimização

### 1. Performance VSCode

**Problema:** 107 extensões = alto consumo de RAM/CPU

**Solução:**
```json
// settings.json - Usar Profiles ou Workspace extensions
{
  "extensions.ignoreRecommendations": true,
  "extensions.autoUpdate": false, // Update manual (controle)
}
```

**Criar Profiles:**
- **Profile "Full AI":** Claude Code + Copilot + Continue
- **Profile "Backend":** NestJS/TypeScript/Database/Docker
- **Profile "Frontend":** Next.js/React/ESLint
- **Profile "Scrapers":** Python/Playwright/Data Science

### 2. Extensões Faltando (Recomendadas)

**Para o projeto B3 AI Analysis:**

1. **Prisma** (se migrar de TypeORM):
   - ID: `Prisma.prisma`
   - Type-safe database client

2. **Better Comments**:
   - ID: `aaron-bond.better-comments`
   - Highlight TODOs, FIXMEs (complementa Todo Tree)

3. **Import Cost**:
   - ID: `wix.vscode-import-cost`
   - Ver tamanho de imports (frontend bundle size)

4. **Thunder Client** (alternativa REST Client):
   - ID: `rangav.vscode-thunder-client`
   - Postman-like interface

5. **Turbo Console Log**:
   - ID: `ChakrounAnas.turbo-console-log`
   - Insert/Remove console.log rapidamente

### 3. Extensões para Remover

**Desinstalar (não usar):**
```bash
# Angular (projeto não usa)
code --uninstall-extension angular.ng-template

# Vue (projeto não usa)
code --uninstall-extension octref.vetur

# React Native (projeto não usa)
code --uninstall-extension msjsdiag.vscode-react-native

# MQL (projeto não usa MetaTrader)
code --uninstall-extension jf17.mql-lang
code --uninstall-extension nervtech.mq4
# ... (demais MQL extensions)

# C/C++ (projeto não usa)
code --uninstall-extension ms-vscode.cpptools-extension-pack
code --uninstall-extension ms-vscode.cmake-tools
code --uninstall-extension ms-vscode.makefile-tools

# AI redundantes
code --uninstall-extension danielsanmedium.dscodegpt
code --uninstall-extension ashishalex.ollama-chat
code --uninstall-extension google.gemini-cli-vscode-ide-companion
code --uninstall-extension google.geminicodeassist
```

---

## 🔧 Configuração Otimizada (settings.json)

**Adicionar ao `.vscode/settings.json` do workspace:**

```json
{
  "// ====== EXTENSÕES CRÍTICAS (sempre ativas) ======": "",
  "claude-code.enable": true,
  "github.copilot.enable": {
    "*": true,
    "markdown": true,
    "typescript": true,
    "python": true
  },
  "gitlens.hovers.currentLine.enabled": true,
  "gitlens.codeLens.enabled": true,

  "// ====== PYTHON/SCRAPERS ======": "",
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/scrapers/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.formatting.provider": "black",

  "// ====== TYPESCRIPT ======": "",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "eslint.validate": ["javascript", "typescript", "typescriptreact"],

  "// ====== DATABASE ======": "",
  "dbclient.defaultDatabase": "postgres://invest_admin:@localhost:5532/invest_data",
  "redis-client.defaultConnection": "redis://localhost:6479",

  "// ====== FILES/EDITOR ======": "",
  "files.associations": {
    "*.env.template": "dotenv",
    "docker-compose*.yml": "dockercompose",
    "*.md": "markdown"
  },
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/.pytest_cache": true,
    "**/__pycache__": true
  },

  "// ====== PERFORMANCE ======": "",
  "extensions.autoUpdate": false,
  "extensions.autoCheckUpdates": false,
  "search.followSymlinks": false,
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true,
    "**/playwright-report": true
  },

  "// ====== MARKDOWN ======": "",
  "markdownlint.config": {
    "MD013": false,
    "MD033": false,
    "MD041": false
  },

  "// ====== TODO TREE ======": "",
  "todo-tree.general.tags": [
    "TODO",
    "FIXME",
    "HACK",
    "NOTE",
    "BUG",
    "CLAUDE"
  ],
  "todo-tree.highlights.defaultHighlight": {
    "type": "text-and-comment"
  },

  "// ====== CSV ======": "",
  "csv-preview.separator": ",",
  "rainbow_csv.enable_tooltip": true,

  "// ====== PLAYWRIGHT ======": "",
  "playwright.reuseBrowser": true,
  "playwright.showTrace": false
}
```

---

## 📈 Métricas de Uso (Estimativa)

### Extensões por Frequência de Uso

**Diário (10):**
- Claude Code, GitLens, ESLint, Database Client, Docker, REST Client, Python, Markdown, Bookmarks, Error Lens

**Semanal (8):**
- Jupyter, Redis Client, Playwright, Rainbow CSV, Excel Viewer, Todo Tree, Remote WSL, Copilot

**Mensal (5):**
- SonarLint, Snyk, Data Preview, Local History, Partial Diff

**Raramente (84):**
- Azure tools, MQL, Angular, Vue, C/C++, AI alternatives, etc

---

## ✅ Checklist de Ação

### Imediato

- [ ] **Desabilitar extensões Azure** (18) - Não utiliza cloud
- [ ] **Desabilitar extensões MQL** (8) - Projeto não usa MetaTrader
- [ ] **Desabilitar Angular/Vue/React Native** (3) - Projeto usa Next.js
- [ ] **Desinstalar C/C++ tools** (4) - Projeto não usa C/C++
- [ ] **Desabilitar AI alternatives** (4) - Claude Code suficiente

**Total a desabilitar:** ~37 extensões (34.6% do total)

### Curto Prazo

- [ ] **Criar Profiles VSCode:**
  - Backend (NestJS/TypeScript/DB)
  - Frontend (Next.js/React)
  - Scrapers (Python/Playwright)
  - Data Analysis (Jupyter/CSV)

- [ ] **Configurar settings.json** (usar template acima)

- [ ] **Instalar extensões recomendadas:**
  - Better Comments
  - Import Cost
  - Thunder Client (opcional)

### Longo Prazo

- [ ] **Avaliar uso de MongoDB** (extensão instalada, mas projeto usa PostgreSQL)
- [ ] **Avaliar uso de Terraform/Ansible** (se planejar infraestrutura como código)
- [ ] **Documentar extensões customizadas** (se criar)

---

## 📚 Referências

**Documentação Oficial:**
- VSCode Extensions: https://code.visualstudio.com/docs/editor/extension-marketplace
- VSCode Profiles: https://code.visualstudio.com/docs/editor/profiles
- Performance: https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_performance

**Projeto:**
- INSTALL.md - Configuração de serviços e portas
- ARCHITECTURE.md - Stack tecnológica
- CLAUDE.md - Metodologia Claude Code

---

**Fim do mapeamento de extensões VSCode**
