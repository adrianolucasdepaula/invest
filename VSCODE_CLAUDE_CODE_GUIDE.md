# 🚀 Guia Completo: Abrir Projeto no VS Code com Claude Code

**Data:** 2025-11-06
**Status:** ✅ Sistema pronto para uso
**Pré-requisitos:** VS Code instalado + Extensão Claude Code

---

## 📋 Índice

1. [⚡ Método Rápido: Teleport (Recomendado)](#método-rápido-teleport-recomendado)
2. [Pré-requisitos](#pré-requisitos)
3. [Instalação da Extensão Claude Code](#instalação-da-extensão-claude-code)
4. [Configuração Inicial](#configuração-inicial)
5. [Abrindo o Projeto](#abrindo-o-projeto)
6. [Verificações Pós-Abertura](#verificações-pós-abertura)
7. [Comandos Úteis](#comandos-úteis)
8. [Troubleshooting](#troubleshooting)

---

## ⚡ 1. Método Rápido: Teleport (Recomendado)

### 🎯 Migrar Sessão do Claude Web para VS Code

Se você está **atualmente no Claude Web** (claude.ai), a forma **mais fácil e rápida** é usar o comando `--teleport`:

```bash
claude --teleport session_011CUqhhHmDLCpG3Za3ppFeU
```

### Como Funciona

1. **No Claude Web**, você verá a opção de abrir no VS Code
2. **Copie o comando** fornecido (inclui o ID da sua sessão)
3. **Abra um terminal** no seu computador
4. **Cole e execute** o comando
5. **VS Code abrirá automaticamente** com:
   - ✅ Projeto correto aberto
   - ✅ Sessão sincronizada
   - ✅ Contexto completo preservado
   - ✅ Histórico de conversas mantido

### Vantagens do Teleport

- 🚀 **Migração instantânea** - Em segundos você está no VS Code
- 💾 **Contexto preservado** - Todo o histórico da conversa continua
- 🔄 **Sincronização automática** - Branch e arquivos corretos
- ⚙️ **Configuração automática** - Menos passos manuais

### Pré-requisitos para Teleport

```bash
# 1. Instale o Claude CLI (se ainda não tiver)
npm install -g @anthropic/claude-cli

# 2. Faça login
claude login

# 3. Verifique a instalação
claude --version

# 4. Execute o teleport
claude --teleport session_011CUqhhHmDLCpG3Za3ppFeU
```

### ⚠️ Nota Importante

Após usar o teleport, **pule para a seção [Verificações Pós-Abertura](#verificações-pós-abertura)** para validar que tudo está funcionando corretamente.

Se preferir fazer a configuração **manual completa**, continue lendo as próximas seções.

---

## 2. Pré-requisitos

### ✅ Checklist Antes de Começar

- [ ] **VS Code instalado** (versão 1.80+)
  ```bash
  code --version
  ```

- [ ] **Node.js 18+** instalado
  ```bash
  node --version  # Deve mostrar v18.x ou superior
  npm --version   # Deve mostrar 9.x ou superior
  ```

- [ ] **Git configurado**
  ```bash
  git --version
  git config --global user.name "Seu Nome"
  git config --global user.email "seu@email.com"
  ```

- [ ] **Projeto clonado**
  ```bash
  git clone <repo-url>
  cd invest
  ```

- [ ] **Dependências instaladas**
  ```bash
  # Backend
  cd backend
  npm install

  # Frontend
  cd ../frontend
  npm install
  ```

---

## 2. Instalação da Extensão Claude Code

### Opção A: Instalar via VS Code Marketplace

1. **Abra o VS Code**
   ```bash
   code .
   ```

2. **Abra o painel de extensões**
   - Pressione `Ctrl+Shift+X` (Windows/Linux)
   - Ou `Cmd+Shift+X` (Mac)
   - Ou clique no ícone de extensões na barra lateral

3. **Busque "Claude Code"**
   - Digite "Claude Code" na barra de busca
   - Procure pela extensão oficial da Anthropic
   - Clique em **Install**

4. **Aguarde a instalação**
   - A extensão será baixada e instalada automaticamente
   - Um ícone do Claude aparecerá na barra lateral

### Opção B: Instalar via CLI

```bash
code --install-extension anthropic.claude-code
```

### ✅ Verificar Instalação

```bash
code --list-extensions | grep claude
```

Você deve ver: `anthropic.claude-code`

---

## 3. Configuração Inicial

### 3.1. Configurar API Key da Anthropic

#### Método 1: Via Interface do VS Code

1. **Abra a extensão Claude Code**
   - Clique no ícone do Claude na barra lateral
   - Ou pressione `Ctrl+Shift+P` e digite "Claude Code: Open"

2. **Configure a API Key**
   - A extensão pedirá sua API key
   - Cole sua API key da Anthropic
   - Clique em "Save"

#### Método 2: Via Settings (Preferido)

1. **Abra Settings**
   - `Ctrl+,` (Windows/Linux)
   - `Cmd+,` (Mac)

2. **Busque "Claude"**
   - Digite "claude" na barra de busca

3. **Configure**
   ```json
   {
     "claude.apiKey": "sk-ant-...",
     "claude.model": "claude-sonnet-4.5",
     "claude.maxTokens": 200000
   }
   ```

#### Método 3: Via Environment Variable (Mais Seguro)

```bash
# Linux/Mac
export ANTHROPIC_API_KEY="sk-ant-..."

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="sk-ant-..."

# Adicione ao seu ~/.bashrc ou ~/.zshrc para permanente
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.bashrc
```

### 3.2. Configurar OpenAI API Key (para os agentes de IA)

**Edite o arquivo `.env` do backend:**

```bash
# No diretório invest/backend/.env
OPENAI_API_KEY=sk-...  # Sua API key da OpenAI
```

### 3.3. Configurações Recomendadas do Projeto

**Crie ou edite `.vscode/settings.json`:**

```json
{
  // TypeScript
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  // Formatação
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",

  // ESLint
  "eslint.enable": true,
  "eslint.validate": [
    "javascript",
    "typescript"
  ],

  // Files
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  },

  // Claude Code
  "claude.autoSuggest": true,
  "claude.contextFiles": [
    "VALIDATION_REPORT.md",
    "REQUIREMENTS_VALIDATION_FINAL.md",
    "backend/src/ai/README.md"
  ]
}
```

---

## 4. Abrindo o Projeto

### 4.1. Via Terminal

```bash
# Navegue até o diretório do projeto
cd /caminho/para/invest

# Abra no VS Code
code .
```

### 4.2. Via VS Code

1. **File → Open Folder**
2. **Navegue até a pasta `invest`**
3. **Clique em "Select Folder"**

### 4.3. Via Claude Code CLI

Se você instalou o Claude CLI:

```bash
# Clone ou navegue até o projeto
cd invest

# Abra com Claude CLI
claude code .
```

---

## 5. Verificações Pós-Abertura

### 5.1. Checklist de Verificação

Execute os seguintes comandos no **Terminal Integrado do VS Code** (`Ctrl+`):

#### ✅ Verificar Estrutura do Projeto

```bash
# Deve mostrar: backend/, frontend/, docs/, etc.
ls -la

# Verificar se node_modules existem
ls backend/node_modules
ls frontend/node_modules
```

#### ✅ Verificar Compilação TypeScript

```bash
# Backend
cd backend
npm run build

# Frontend (opcional)
cd ../frontend
npm run build
```

**Resultado esperado:** Zero erros de compilação

#### ✅ Verificar Configurações

```bash
# Verificar .env
cat backend/.env | grep OPENAI_API_KEY

# Verificar TypeScript
cd backend
npx tsc --version
```

#### ✅ Executar Script de Validação

```bash
# Na raiz do projeto
./validate-vscode-cli.sh
```

**Resultado esperado:**
```
✓ SISTEMA PRONTO PARA CLAUDE CLI NO VS CODE
📈 Taxa de Sucesso: 98%
```

### 5.2. Verificar Extensões Instaladas

**No VS Code, verifique se você tem:**

- ✅ Claude Code (Anthropic)
- ✅ ESLint
- ✅ Prettier
- ✅ TypeScript and JavaScript Language Features
- 🔹 Docker (opcional)
- 🔹 GitLens (opcional)

**Para instalar as recomendadas:**

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-azuretools.vscode-docker
code --install-extension eamodio.gitlens
```

---

## 6. Comandos Úteis

### 6.1. Claude Code

**Atalhos de Teclado:**

| Ação | Windows/Linux | Mac |
|------|---------------|-----|
| Abrir Claude | `Ctrl+Shift+C` | `Cmd+Shift+C` |
| Nova Conversa | `Ctrl+Alt+N` | `Cmd+Option+N` |
| Executar Comando | `Ctrl+Enter` | `Cmd+Enter` |

**Comandos via Command Palette (`Ctrl+Shift+P`):**

```
> Claude Code: Open Chat
> Claude Code: New Conversation
> Claude Code: Clear History
> Claude Code: Settings
```

### 6.2. Desenvolvimento

**Backend (NestJS):**

```bash
cd backend

# Desenvolvimento com hot-reload
npm run start:dev

# Build para produção
npm run build

# Executar testes
npm run test

# Linting
npm run lint

# Format
npm run format
```

**Frontend (Next.js):**

```bash
cd frontend

# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Linting
npm run lint
```

### 6.3. Git

```bash
# Verificar status
git status

# Ver branch atual
git branch --show-current

# Ver commits recentes
git log --oneline -10

# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Commit
git add .
git commit -m "feat: adicionar nova funcionalidade"

# Push
git push -u origin feature/nova-funcionalidade
```

### 6.4. Docker (Opcional)

```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Parar serviços
docker-compose down

# Rebuild
docker-compose up -d --build
```

---

## 7. Troubleshooting

### 🔧 Problema 1: Claude Code não aparece

**Sintoma:** Extensão instalada mas ícone não aparece na barra lateral

**Solução:**
```bash
# 1. Recarregue a janela do VS Code
# Ctrl+Shift+P → "Reload Window"

# 2. Verifique a instalação
code --list-extensions | grep claude

# 3. Reinstale a extensão
code --uninstall-extension anthropic.claude-code
code --install-extension anthropic.claude-code

# 4. Reinicie o VS Code completamente
```

### 🔧 Problema 2: Erros de compilação TypeScript

**Sintoma:** VS Code mostra erros vermelhos em arquivos .ts

**Solução:**
```bash
# 1. Reinstale dependências
cd backend
rm -rf node_modules package-lock.json
npm install

# 2. Reconstrua TypeScript
npm run build

# 3. No VS Code, recarregue a janela
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### 🔧 Problema 3: API Key não funciona

**Sintoma:** Claude Code diz "Invalid API Key"

**Solução:**
1. **Verifique a API key:**
   - Vá para https://console.anthropic.com/
   - Copie uma nova API key
   - Cole novamente nas configurações

2. **Configure via environment variable:**
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   code .
   ```

3. **Verifique o arquivo de settings:**
   ```bash
   # Linux/Mac
   cat ~/.config/Code/User/settings.json | grep claude

   # Windows
   type %APPDATA%\Code\User\settings.json | findstr claude
   ```

### 🔧 Problema 4: node_modules faltando

**Sintoma:** Erros "Cannot find module"

**Solução:**
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install

# Verificar
ls backend/node_modules
ls frontend/node_modules
```

### 🔧 Problema 5: Porta já em uso

**Sintoma:** "Error: listen EADDRINUSE: address already in use :::3101"

**Solução:**
```bash
# Encontrar processo usando a porta
lsof -i :3101  # Linux/Mac
netstat -ano | findstr :3101  # Windows

# Matar o processo
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows

# Ou mudar a porta no .env
# backend/.env
PORT=3102
```

### 🔧 Problema 6: Git não reconhece mudanças

**Sintoma:** Git status vazio mesmo com arquivos modificados

**Solução:**
```bash
# 1. Verificar .gitignore
cat .gitignore

# 2. Forçar atualização do index
git add -A
git status

# 3. Verificar se está no repositório correto
git remote -v
```

### 🔧 Problema 7: Dependência openai não encontrada

**Sintoma:** "Cannot find module 'openai'"

**Solução:**
```bash
cd backend
npm install openai
npm run build
```

### 🔧 Problema 8: Erro de memória (heap out of memory)

**Sintoma:** "JavaScript heap out of memory"

**Solução:**
```bash
# Aumentar memória do Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Ou no package.json:
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' nest build"
}
```

### 🔧 Problema 9: Comando teleport não funciona

**Sintoma:** `claude: command not found` ou `teleport failed`

**Solução:**
```bash
# 1. Verificar se Claude CLI está instalado
claude --version

# Se não estiver instalado:
npm install -g @anthropic/claude-cli

# 2. Verificar se está logado
claude login

# 3. Verificar se a sessão é válida
# O ID da sessão deve corresponder à sua sessão no Claude Web
# Formato correto: session_011CUqhhHmDLCpG3Za3ppFeU

# 4. Tentar novamente com o comando completo
claude --teleport session_011CUqhhHmDLCpG3Za3ppFeU

# 5. Se ainda falhar, tente o método manual
# Veja seção: "2. Instalação da Extensão Claude Code"
```

**Problemas comuns:**
- ❌ **Sessão expirada:** Copie o comando novamente do Claude Web
- ❌ **CLI desatualizado:** Execute `npm update -g @anthropic/claude-cli`
- ❌ **Não logado:** Execute `claude login` primeiro
- ❌ **Projeto não existe localmente:** Clone o projeto antes

---

## 8. Workflow Recomendado

### 8.1. Primeira Vez (Com Teleport - Recomendado ⚡)

```bash
# Método mais rápido se você já está no Claude Web:

# 1. No Claude Web, copie o comando teleport fornecido
# Exemplo: claude --teleport session_011CUqhhHmDLCpG3Za3ppFeU

# 2. Instale o Claude CLI (se necessário)
npm install -g @anthropic/claude-cli

# 3. Faça login
claude login

# 4. Execute o teleport (cole o comando copiado)
claude --teleport session_011CUqhhHmDLCpG3Za3ppFeU

# 5. VS Code abrirá automaticamente! ✨
# Pule para: ./validate-vscode-cli.sh
```

### 8.2. Primeira Vez (Método Manual)

```bash
# 1. Clonar repositório
git clone <repo-url>
cd invest

# 2. Instalar dependências
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Configurar .env
cp backend/.env.example backend/.env
# Editar backend/.env e adicionar OPENAI_API_KEY

# 4. Validar sistema
./validate-vscode-cli.sh

# 5. Abrir no VS Code
code .

# 6. No VS Code, verificar extensão Claude Code
# Ctrl+Shift+X → Buscar "Claude Code" → Install

# 7. Configurar API key no VS Code
# Ctrl+Shift+P → "Claude Code: Settings"

# 8. Pronto! 🎉
```

### 8.3. Desenvolvimento Diário

```bash
# 1. Atualizar repositório
git pull origin main

# 2. Instalar novas dependências (se houver)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Iniciar desenvolvimento
cd backend
npm run start:dev

# Em outro terminal
cd frontend
npm run dev

# 4. Abrir no VS Code
code .

# 5. Usar Claude Code para desenvolvimento
# Ctrl+Shift+C para abrir o chat
```

---

## 9. Recursos Adicionais

### 📚 Documentação do Projeto

- `README.md` - Documentação principal
- `VALIDATION_REPORT.md` - Relatório de arquitetura
- `REQUIREMENTS_VALIDATION_FINAL.md` - Validação de requisitos
- `backend/src/ai/README.md` - Documentação do módulo AI
- `VSCODE_CLAUDE_CODE_GUIDE.md` - Este guia

### 🔗 Links Úteis

- **Claude Code:** https://docs.anthropic.com/claude/docs/claude-code
- **NestJS:** https://docs.nestjs.com/
- **Next.js:** https://nextjs.org/docs
- **TypeORM:** https://typeorm.io/
- **OpenAI API:** https://platform.openai.com/docs

### 📞 Suporte

Se encontrar problemas:
1. Consulte a seção [Troubleshooting](#troubleshooting)
2. Leia `VALIDATION_REPORT.md` para entender a arquitetura
3. Verifique os logs: `docker-compose logs` ou `npm run start:dev`
4. Revise `REQUIREMENTS_VALIDATION_FINAL.md` para confirmação de implementação

---

## ✅ Checklist Final

Antes de começar a desenvolver, certifique-se:

- [ ] VS Code aberto na pasta `invest`
- [ ] Extensão Claude Code instalada e configurada
- [ ] API Keys configuradas (Anthropic + OpenAI)
- [ ] Dependências instaladas (backend + frontend)
- [ ] TypeScript compilando sem erros
- [ ] Script de validação passando (98%+)
- [ ] Terminal integrado funcionando
- [ ] Git configurado
- [ ] Documentação lida

---

## 🎉 Pronto!

Seu ambiente está 100% configurado e pronto para desenvolvimento com Claude Code no VS Code!

**Próximos passos:**
1. Explorar o código com ajuda do Claude
2. Implementar novas features
3. Executar testes
4. Deploy em produção

**Comando para iniciar uma conversa com Claude:**
```
Ctrl+Shift+C (ou Cmd+Shift+C no Mac)
```

---

*Guia criado em: 2025-11-06*
*Última atualização: 2025-11-06*
*Status do projeto: ✅ 100% validado e pronto*
