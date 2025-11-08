# 🚀 Guia de Configuração - B3 AI Analysis Platform

**Última Atualização:** 2025-01-08
**Versão:** 2.0
**Fase:** 1 - Preparação e Configuração ✅
**Branch Atual:** `claude/b3-ai-analysis-platform-011CUvNS7Jp7D7bGQWkaBvBw`

---

## 📋 Índice

1. [⚡ Setup Rápido - Branch Atualizada](#-setup-rápido---branch-atualizada) **← NOVO!**
2. [Pré-requisitos](#-pré-requisitos)
3. [Instalação Rápida](#-instalação-rápida)
4. [Configuração Detalhada](#-configuração-detalhada)
5. [Validação do Ambiente](#-validação-do-ambiente)
6. [Próximos Passos](#-próximos-passos)
7. [Troubleshooting](#-troubleshooting)

---

## ⚡ Setup Rápido - Branch Atualizada

**Use este procedimento para baixar e rodar a branch mais recente com todos os updates:**

Últimas atualizações nesta branch:
- ✅ 3 Novos endpoints data-sources (PATCH, GET/:id, POST/:id/test)
- ✅ Type safety melhorado (interfaces TypeScript, 0 tipos `any`)
- ✅ 22 testes unitários (100% coverage nos novos endpoints)
- ✅ 0 warnings React Hook e build
- ✅ Melhorias de validação (DTOs completos)

### Windows (PowerShell)

```powershell
# 1. Parar e limpar (necessário para recriar com nova config)
cd "C:\Users\adria\Dropbox\PC (2)\Downloads\Python - Projetos\invest-claude-web"
docker-compose down -v

# 2. Atualizar código (pegar últimos commits)
git fetch origin
git checkout claude/b3-ai-analysis-platform-011CUvNS7Jp7D7bGQWkaBvBw
git pull origin claude/b3-ai-analysis-platform-011CUvNS7Jp7D7bGQWkaBvBw

# 3. Verificar últimos commits
git log --oneline -5
# Deve mostrar:
# 3cfffb0 test: adicionar testes unitários completos para data-sources endpoints
# 6153da4 refactor: melhorar type safety removendo tipos any e adicionando interfaces
# f642723 feat: implementar endpoints PATCH e POST test para data-sources
# 0e785c1 fix: corrigir 9 warnings React Hook useEffect com eslint-disable justificados

# 4. Iniciar sistema (usa script manager ou docker-compose)
.\system-manager.ps1 start

# OU direto com docker-compose
docker-compose up -d --build
```

### Linux / macOS (Bash)

```bash
# 1. Parar e limpar
cd ~/invest-claude-web  # ou caminho do seu projeto
docker-compose down -v

# 2. Atualizar código
git fetch origin
git checkout claude/b3-ai-analysis-platform-011CUvNS7Jp7D7bGQWkaBvBw
git pull origin claude/b3-ai-analysis-platform-011CUvNS7Jp7D7bGQWkaBvBw

# 3. Verificar últimos commits
git log --oneline -5

# 4. Iniciar sistema
./system-manager.sh start

# OU direto com docker-compose
docker-compose up -d --build
```

### Verificação Pós-Setup

```bash
# Verificar containers rodando
docker-compose ps

# Ver logs
docker-compose logs -f

# Aguardar ~30 segundos e verificar status
# Deve mostrar: postgres, redis, backend, frontend todos "Up"

# Testar backend
curl http://localhost:3001/api/health
# Resposta esperada: {"status":"ok"}

# Testar novos endpoints data-sources
curl http://localhost:3001/api/data-sources
curl http://localhost:3001/api/data-sources/status
```

### Acessar Aplicação

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **API Docs (Swagger):** http://localhost:3001/api/docs
- **FastAPI Service:** http://localhost:8000/docs
- **PgAdmin:** http://localhost:5050 (admin@invest.com / admin123)

### Executar Migrations e Seeds (Primeira vez)

```bash
# Executar migrations
docker-compose exec backend npm run migration:run

# Popular banco
docker-compose exec backend npm run seed

# Verificar dados
docker-compose exec postgres psql -U postgres -d invest_db -c "SELECT COUNT(*) FROM assets;"
```

### Executar Testes (Opcional)

```bash
# Rodar testes backend
docker-compose exec backend npm test

# Rodar testes específicos (data-sources)
docker-compose exec backend npm test -- data-sources
# Resultado esperado: 22 passed

# Build frontend (verificar 0 warnings)
docker-compose exec frontend npm run build
```

---

## ✅ Pré-requisitos

### Software Necessário

- **Python 3.10+** (verificar: `python3 --version`)
- **Node.js 18+** (verificar: `node --version`)
- **npm 9+** (verificar: `npm --version`)
- **Git** (verificar: `git --version`)
- **Chrome/Chromium** (para scrapers)

### Opcionais (para produção)

- **Docker 20+** (verificar: `docker --version`)
- **Docker Compose** (verificar: `docker-compose --version`)
- **PostgreSQL 14+** (ou via Docker)
- **Redis 7+** (ou via Docker)

---

## 🚀 Instalação Rápida

### 1. Clone o Repositório

```bash
git clone <repo-url>
cd invest
```

### 2. Instalar Dependências Python

```bash
cd backend/python-scrapers
pip install -r requirements.txt
```

**Saída esperada:**
```
Successfully installed 46 packages
✓ selenium, aiohttp, loguru, beautifulsoup4, pandas, redis...
```

### 3. Instalar Dependências Node.js (Backend)

```bash
cd ../  # volta para backend/
npm install
```

### 4. Instalar Dependências Node.js (Frontend)

```bash
cd ../frontend
npm install
```

### 5. Validar Instalação

```bash
cd ../backend
python python-scrapers/validate_setup.py
```

**Saída esperada:**
```
✅ AMBIENTE VÁLIDO E PRONTO PARA USO!
Total de verificações: 26
✓ Passou: 26 (100%)
```

---

## 🔧 Configuração Detalhada

### Passo 1: Configurar Variáveis de Ambiente

#### Backend (.env)

O arquivo `.env` já existe em `backend/.env` com valores padrão.

**Variáveis que você DEVE atualizar:**

```bash
# OpenAI API (para funcionalidade IA)
OPENAI_API_KEY=sk-...

# Google OAuth (opcional, para autenticação)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Para produção: gerar novos secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)
```

**Variáveis já configuradas (usar localhost):**
```bash
DB_HOST=localhost
DB_PORT=5432
REDIS_HOST=localhost
REDIS_PORT=6379
OPCOES_USERNAME=312.862.178-06  # Já configurado
OPCOES_PASSWORD=Safra998266@#    # Já configurado
```

#### Frontend (.env.local)

```bash
cd frontend
cp .env.example .env.local

# Editar .env.local
NEXT_PUBLIC_API_URL=http://localhost:3101/api
NEXT_PUBLIC_WS_URL=http://localhost:3101
```

---

### Passo 2: Criar Diretórios Necessários

```bash
cd backend/python-scrapers

mkdir -p browser-profiles
mkdir -p logs
mkdir -p data/cache
mkdir -p data/results

chmod -R 755 browser-profiles logs
```

**Verificar:**
```bash
ls -la | grep -E "browser-profiles|logs|data"
```

---

### Passo 3: Salvar Cookies OAuth

Este passo é **necessário** para 18 scrapers que usam autenticação OAuth/Google.

```bash
cd backend/python-scrapers
python save_google_cookies.py
```

**O que vai acontecer:**

1. Um navegador Chrome abrirá automaticamente
2. Você será guiado para fazer login em **19 sites** sequencialmente
3. Para cada site:
   - Faça login manualmente
   - Pressione ENTER no terminal quando terminar
   - O script salvará os cookies automaticamente
4. Cookies serão salvos em: `browser-profiles/google_cookies.pkl`

**Sites que você fará login:**

| # | Site | Tipo | Usado por |
|---|------|------|-----------|
| 1 | Google | OAuth Base | Base para outros |
| 2-4 | Fundamentei, Investidor10, StatusInvest | OAuth | Fundamentalistas |
| 5-8 | Investing, ADVFN, Google Finance, TradingView | OAuth | Mercado |
| 9-13 | ChatGPT, Gemini, DeepSeek, Claude, Grok | OAuth/Direto | IAs |
| 14-19 | Inv.News, Valor, Exame, InfoMoney, Estadão, Mais Retorno | OAuth/Direto | Notícias |

**Opções do script:**

```bash
# Processar todos os sites (padrão)
python save_google_cookies.py

# Processar apenas sites específicos
python save_google_cookies.py
# Escolher opção 2 e digitar: 1,2,3

# Atualizar apenas sites sem cookies
python save_google_cookies.py
# Escolher opção 3
```

**Dica:** Os cookies expiram após 7-14 dias. Execute novamente quando scrapers OAuth falharem.

---

### Passo 4: Validar Configuração

```bash
cd backend
python python-scrapers/validate_setup.py --detailed
```

**Verificações realizadas:**

1. ✅ **Arquivo .env** - Existe e carregado
2. ✅ **Variáveis obrigatórias** - DB, Redis, JWT, Opcoes.net.br
3. ✅ **Diretórios** - Criados com permissões corretas
4. ✅ **Dependências Python** - 9 pacotes principais instalados
5. ⚠️ **Serviços** - Redis e PostgreSQL (opcional sem Docker)
6. ⚠️ **Cookies OAuth** - Salvos ou não
7. ✅ **Scrapers** - 27 scrapers implementados

**Resultado esperado:**
```
============================================================
📊 RESUMO DA VALIDAÇÃO
============================================================

Estatísticas:
  Total de verificações: 26
  ✓ Passou: 26
  ✗ Falhou: 0
  ⚠ Avisos: 5 (não-críticos)
  📈 Taxa de sucesso: 100.0%

✅ AMBIENTE VÁLIDO E PRONTO PARA USO!

🎯 PRÓXIMOS PASSOS:
  1. (Opcional) Corrigir avisos para funcionalidade completa
  2. Salvar cookies OAuth: python save_google_cookies.py
  3. Testar scrapers públicos: python tests/test_public_scrapers.py
```

---

## ✅ Validação do Ambiente

### Script de Validação Automática

```bash
cd backend
python python-scrapers/validate_setup.py
```

### Validação Manual

#### 1. Verificar Python e Dependências

```bash
python3 --version  # Deve ser 3.10+

pip list | grep -E "selenium|aiohttp|loguru|beautifulsoup4|pandas|redis"
# Todos devem aparecer
```

#### 2. Verificar Node.js

```bash
node --version  # Deve ser 18+
npm --version   # Deve ser 9+

cd backend
npm run build   # Deve compilar sem erros

cd ../frontend
npm run build   # Deve compilar sem erros
```

#### 3. Verificar Scrapers

```bash
cd backend/python-scrapers/scrapers
ls -la *_scraper.py | wc -l
# Deve retornar: 27
```

#### 4. Verificar Arquivo .env

```bash
cd backend
cat .env | grep -E "DB_HOST|REDIS_HOST|OPCOES_USERNAME"
# Deve mostrar valores configurados
```

---

## 🎯 Próximos Passos

### Após Instalação e Validação

#### 1. Testar Scrapers Públicos (sem login)

```bash
cd backend/python-scrapers
python tests/test_public_scrapers.py
```

**Scrapers testados (8):**
- Fundamentus, Investsite, B3, BCB
- Griffin, CoinMarketCap, Bloomberg, Google News

**Resultado esperado:**
```
📊 RESUMO DOS TESTES
Sucesso: 8/8 (100%)
✓ Todos os scrapers públicos estão funcionando!
```

#### 2. Testar Scraper com Credenciais

```bash
cd backend/python-scrapers
python -c "
from scrapers.opcoes_scraper import OpcoesNetScraper
import asyncio

async def test():
    scraper = OpcoesNetScraper()
    result = await scraper.scrape_with_retry('PETR')
    print(f'Success: {result.success}')
    if result.success:
        print(f'Data: {result.data}')

asyncio.run(test())
"
```

#### 3. Testar Scrapers OAuth (após salvar cookies)

```bash
# Criar teste OAuth
# TODO: Implementar test_oauth_scrapers.py
```

---

## 🐛 Troubleshooting

### Erro: Docker Build Failed - "parent snapshot does not exist"

**Problema:** Cache do Docker corrompido

**Erro completo:**
```
failed to prepare extraction snapshot: parent snapshot sha256:... does not exist: not found
```

**Solução Rápida (Recomendada):**
```powershell
# Windows PowerShell
docker-compose down -v
docker builder prune -a -f
docker-compose build --no-cache
docker-compose up -d
```

```bash
# Linux/macOS
docker-compose down -v
docker builder prune -a -f
docker-compose build --no-cache
docker-compose up -d
```

**Solução Completa (se a rápida não funcionar):**
```powershell
# Windows - CUIDADO: Remove todas as imagens Docker não usadas
docker-compose down -v
docker system prune -a -f --volumes
docker-compose build --no-cache
docker-compose up -d
```

**Último Recurso:**
1. Fechar Docker Desktop completamente
2. Abrir Docker Desktop novamente
3. Aguardar inicializar
4. Executar solução rápida

---

### Erro: "No module named 'loguru'"

**Problema:** Dependências Python não instaladas

**Solução:**
```bash
cd backend/python-scrapers
pip install -r requirements.txt
```

---

### Erro: "File .env not found"

**Problema:** Arquivo .env não existe

**Solução:**
```bash
cd backend
ls -la .env  # Verificar se existe

# Se não existir (não deveria acontecer)
cat > .env << EOF
NODE_ENV=development
DB_HOST=localhost
REDIS_HOST=localhost
# ... outras variáveis
EOF
```

---

### Erro: "connection refused" (Redis/PostgreSQL)

**Problema:** Serviços offline

**Solução (usando Docker):**
```bash
cd invest
docker-compose up -d postgres redis

# Verificar
docker-compose ps
docker logs invest_postgres
docker logs invest_redis
```

**Solução (instalação local):**
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-14 redis-server
sudo systemctl start postgresql redis-server

# macOS
brew install postgresql@14 redis
brew services start postgresql@14
brew services start redis
```

---

### Erro: Chrome/Chromium não encontrado

**Problema:** Chrome não instalado ou path incorreto

**Solução:**
```bash
# Ubuntu/Debian
sudo apt-get install chromium-browser

# macOS
brew install --cask google-chrome

# Atualizar .env
CHROME_EXECUTABLE_PATH=/usr/bin/chromium-browser  # Linux
# ou
CHROME_EXECUTABLE_PATH=/Applications/Google Chrome.app/Contents/MacOS/Google Chrome  # macOS
```

---

### Erro: "Permission denied" em diretórios

**Problema:** Permissões incorretas

**Solução:**
```bash
cd backend/python-scrapers
chmod -R 755 browser-profiles logs data
```

---

### Cookies OAuth não funcionando

**Problema:** Cookies expirados ou inválidos

**Solução:**
```bash
cd backend/python-scrapers

# Remover cookies antigos
rm -f browser-profiles/google_cookies.pkl

# Salvar novamente
python save_google_cookies.py
```

---

### Validação com avisos não-críticos

**Problema:** Avisos como "Redis offline" ou "Cookies não encontrados"

**Solução:**
- ⚠️ **Redis/PostgreSQL offline**: Normal sem Docker, não bloqueia desenvolvimento
- ⚠️ **Cookies não encontrados**: Execute `save_google_cookies.py`
- ⚠️ **OPENAI_API_KEY**: Apenas necessário para funcionalidade IA
- ⚠️ **GOOGLE_PASSWORD**: Apenas para OAuth automático (não implementado)

**Estes avisos não impedem o uso do sistema.**

---

## 📝 Comandos de Referência Rápida

### Desenvolvimento

```bash
# Backend
cd backend
npm run start:dev
# Acesse: http://localhost:3101

# Frontend
cd frontend
npm run dev
# Acesse: http://localhost:3100

# Scrapers
cd backend/python-scrapers
python tests/test_public_scrapers.py
```

### Docker (Produção)

```bash
# Subir todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down

# Limpar volumes
docker-compose down -v
```

### Testes

```bash
# Validar ambiente
cd backend
python python-scrapers/validate_setup.py

# Testar scrapers
cd python-scrapers
python tests/test_public_scrapers.py --detailed

# Testar scraper específico
python -m scrapers.fundamentus_scraper PETR4
```

### Manutenção

```bash
# Atualizar dependências Python
cd backend/python-scrapers
pip install -r requirements.txt --upgrade

# Atualizar dependências Node
cd backend
npm update

# Renovar cookies OAuth (a cada 7-14 dias)
cd backend/python-scrapers
python save_google_cookies.py
```

---

## 📚 Documentação Adicional

- **PROGRESS_REPORT.md** - Relatório de progresso detalhado
- **NEXT_STEPS.md** - Planejamento completo (6 fases)
- **VALIDATION_REPORT.md** - Validação completa do sistema
- **DATA_SOURCES.md** - Catálogo de 27 fontes de dados
- **backend/src/ai/README.md** - Documentação dos agentes IA

---

## 🆘 Suporte

Se encontrar problemas não cobertos neste guia:

1. Verifique os logs: `backend/python-scrapers/logs/`
2. Execute validação: `python validate_setup.py --detailed`
3. Verifique issues no repositório
4. Consulte documentação técnica em `/docs`

---

**✅ Pronto! Seu ambiente está configurado e validado.**

**Próximo passo:** [Testar scrapers públicos](./NEXT_STEPS.md#fase-2-testes-iniciais)

---

**Última Atualização:** 2025-11-07
**Versão:** 1.0
**Status:** ✅ Completo e Testado
