# 🚀 INSTALLATION GUIDE - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-11-14
**Versão:** 1.0.0
**Mantenedor:** Claude Code (Sonnet 4.5)

---

## 📑 ÍNDICE

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação Rápida](#instalação-rápida)
3. [Instalação Detalhada](#instalação-detalhada)
4. [Portas e Serviços](#portas-e-serviços)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Verificação da Instalação](#verificação-da-instalação)
7. [Próximos Passos](#próximos-passos)

---

## 🔧 PRÉ-REQUISITOS

### Software Obrigatório

| Software           | Versão Mínima | Download                                            |
| ------------------ | ------------- | --------------------------------------------------- |
| **Docker**         | 24.x          | https://docs.docker.com/get-docker/                 |
| **Docker Compose** | 2.x           | Incluído no Docker Desktop                          |
| **Git**            | 2.x           | https://git-scm.com/downloads                       |
| **Node.js**        | 20.x          | https://nodejs.org/ (opcional - para dev local)     |
| **Python**         | 3.11.x        | https://www.python.org/ (opcional - para dev local) |

### Recursos de Sistema

| Recurso   | Mínimo                                | Recomendado           |
| --------- | ------------------------------------- | --------------------- |
| **CPU**   | 2 cores                               | 4+ cores              |
| **RAM**   | 4 GB                                  | 8+ GB                 |
| **Disco** | 10 GB                                 | 20+ GB                |
| **SO**    | Windows 10, macOS 10.15, Ubuntu 20.04 | Versões mais recentes |

### Verificar Instalação

```bash
# Verificar versões
docker --version        # Docker version 24.x ou superior
docker-compose --version # Docker Compose version v2.x ou superior
git --version           # git version 2.x ou superior
node --version          # v20.x ou superior (opcional)
python --version        # Python 3.11.x ou superior (opcional)
```

---

## ⚡ INSTALAÇÃO RÁPIDA

Para usuários que desejam iniciar rapidamente:

```bash
# 1. Clone o repositório
git clone https://github.com/adrianolucasdepaula/invest.git
cd invest-claude-web

# 2. Copie arquivos de exemplo de variáveis de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 3. Suba todos os containers
docker-compose up -d

# 4. Execute migrations do banco de dados
docker exec invest_backend npm run migration:run

# 5. Acesse a aplicação
# Frontend: http://localhost:3100
# Backend API: http://localhost:3101/api/v1
```

**Tempo estimado:** 10-15 minutos (dependendo da velocidade de download das imagens Docker)

---

## 📚 INSTALAÇÃO DETALHADA

### Passo 1: Clone o Repositório

```bash
# HTTPS
git clone https://github.com/adrianolucasdepaula/invest.git

# SSH (se configurado)
git clone git@github.com:adrianolucasdepaula/invest.git

# Navegue para o diretório
cd invest-claude-web
```

**Estrutura esperada:**

```
invest-claude-web/
├── backend/
├── frontend/
├── api-service/
├── docker-compose.yml
└── ...
```

---

### Passo 2: Configure Variáveis de Ambiente

#### Backend (NestJS)

```bash
# Copie o arquivo de exemplo
cp backend/.env.example backend/.env

# Edite o arquivo (se necessário)
nano backend/.env  # ou vim, code, etc.
```

**Conteúdo padrão de `backend/.env`:**

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=invest_user
DB_PASSWORD=invest_password
DB_DATABASE=invest_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-change-in-production

# API
API_PORT=3101
API_PREFIX=/api/v1

# BRAPI Token (opcional - para scraper BRAPI)
BRAPI_TOKEN=your-brapi-token-here
```

#### Frontend (Next.js)

```bash
# Copie o arquivo de exemplo
cp frontend/.env.local.example frontend/.env.local

# Edite o arquivo (se necessário)
nano frontend/.env.local
```

**Conteúdo padrão de `frontend/.env.local`:**

```bash
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3101
NEXT_PUBLIC_WS_URL=http://localhost:3101

# OAuth (se configurado)
NEXTAUTH_URL=http://localhost:3100
NEXTAUTH_SECRET=your-nextauth-secret-change-in-production
```

---

### Passo 3: Construa e Suba os Containers

#### Opção 1: Build e Up (primeira vez)

```bash
# Build das imagens e up dos containers
docker-compose up -d --build

# Verificar logs em tempo real
docker-compose logs -f
```

#### Opção 2: Up simples (se já buildou antes)

```bash
# Apenas suba os containers
docker-compose up -d

# Verificar status
docker-compose ps
```

**Resultado esperado:**

```
NAME                STATUS              PORTS
invest_backend      Up X seconds        0.0.0.0:3101->3101/tcp
invest_frontend     Up X seconds        0.0.0.0:3100->3000/tcp
invest_postgres     Up X seconds        0.0.0.0:5532->5432/tcp
invest_redis        Up X seconds        0.0.0.0:6479->6379/tcp
invest_api_service  Up X seconds        0.0.0.0:8000->8000/tcp
invest_pgadmin      Up X seconds        0.0.0.0:5150->80/tcp
invest_orchestrator Up X seconds        VNC: 5900, noVNC: 6080
```

---

### Passo 4: Execute Migrations do Banco de Dados

```bash
# Aguarde ~30 segundos para o backend inicializar
sleep 30

# Execute migrations
docker exec invest_backend npm run migration:run

# Verificar migrations aplicadas (opcional)
docker exec -it invest_postgres psql -U invest_user -d invest_db -c "SELECT * FROM migrations ORDER BY timestamp DESC;"
```

**Resultado esperado:**

```
Migration 1762906000000-CreateScraperMetrics has been executed successfully.
Migration 1762905000000-CreateUpdateLogs has been executed successfully.
Migration 1762904000000-InitialSchema has been executed successfully.
```

---

### Passo 5: (Opcional) Seed de Dados Iniciais

```bash
# Popular banco com dados de exemplo
docker exec invest_backend npm run seed:run

# Verificar dados inseridos
docker exec -it invest_postgres psql -U invest_user -d invest_db -c "SELECT COUNT(*) FROM assets;"
```

---

## 🔌 PORTAS E SERVIÇOS

### Tabela de Portas

| Serviço                          | Porta Host | Porta Container | URL de Acesso                |
| -------------------------------- | ---------- | --------------- | ---------------------------- |
| **Frontend Next.js**             | 3100       | 3000            | http://localhost:3100        |
| **Backend NestJS**               | 3101       | 3101            | http://localhost:3101/api/v1 |
| **API Service (Python/FastAPI)** | 8000       | 8000            | http://localhost:8000        |
| **PostgreSQL**                   | 5532       | 5432            | localhost:5532               |
| **Redis**                        | 6479       | 6379            | localhost:6479               |
| **PgAdmin**                      | 5150       | 80              | http://localhost:5150        |
| **Redis Commander**              | 8181       | 8081            | http://localhost:8181        |
| **VNC Direct**                   | 5900       | 5900            | vnc://localhost:5900         |
| **noVNC Web**                    | 6080       | 6080            | http://localhost:6080        |

### Descrição dos Serviços

#### Frontend Next.js (`:3100`)

**Descrição:** Interface web principal da aplicação.

**Acesso:** http://localhost:3100

**Funcionalidades:**

- Dashboard de investimentos
- Análise de ativos (fundamentalista, técnica, completa)
- Gestão de portfólio
- Relatórios e gráficos
- OAuth Manager (renovação de sessões)
- Data Sources (monitoramento de scrapers)

---

#### Backend NestJS (`:3101`)

**Descrição:** API REST principal do sistema.

**Acesso:** http://localhost:3101/api/v1

**Endpoints principais:**

- `GET /health` - Health check
- `GET /assets` - Listar ativos
- `POST /analysis/fundamental/:ticker` - Solicitar análise fundamentalista
- `GET /portfolio` - Obter portfólio
- `GET /reports/assets-status` - Status de análises

**Swagger Docs:** http://localhost:3101/api/docs (se configurado)

---

#### API Service Python/FastAPI (`:8000`)

**Descrição:** Serviço de scrapers e OAuth Manager.

**Acesso:** http://localhost:8000

**Endpoints:**

- `GET /health` - Health check
- `POST /oauth/renew` - Renovar sessões OAuth
- `GET /oauth/status` - Status das sessões

---

#### PostgreSQL (`:5532`)

**Descrição:** Banco de dados relacional principal.

**Acesso:** localhost:5532

**Credenciais padrão:**

- User: `invest_user`
- Password: `invest_password`
- Database: `invest_db`

**Conexão via CLI:**

```bash
docker exec -it invest_postgres psql -U invest_user -d invest_db
```

**Conexão via cliente externo:**

```
Host: localhost
Port: 5532
Database: invest_db
Username: invest_user
Password: invest_password
```

---

#### Redis (`:6479`)

**Descrição:** Cache e fila de tarefas (BullMQ).

**Acesso:** localhost:6479

**Conexão via CLI:**

```bash
docker exec -it invest_redis redis-cli
```

**Comandos úteis:**

```bash
# Listar todas as chaves
KEYS *

# Ver tamanho de uma fila
LLEN bull:analysis:wait

# Ver jobs ativos
LRANGE bull:analysis:active 0 -1
```

---

#### PgAdmin (`:5150`)

**Descrição:** Interface web para administração do PostgreSQL.

**Acesso:** http://localhost:5150

**Credenciais padrão:**

- Email: `admin@invest.com`
- Password: `admin`

**Adicionar servidor (primeira vez):**

1. Clique em "Add New Server"
2. Name: `Invest DB`
3. Connection:
   - Host: `postgres`
   - Port: `5432`
   - Database: `invest_db`
   - Username: `invest_user`
   - Password: `invest_password`
4. Save

---

#### Redis Commander (`:8181`)

**Descrição:** Interface web para visualização do Redis.

**Acesso:** http://localhost:8181

**Funcionalidades:**

- Visualizar todas as chaves
- Inspecionar valores
- Deletar chaves
- Monitorar filas BullMQ

---

#### VNC/noVNC (`:5900` / `:6080`)

**Descrição:** Acesso remoto ao container de scrapers (para debugging OAuth).

**Acesso VNC Direct:** vnc://localhost:5900 (cliente VNC necessário)

**Acesso noVNC Web:** http://localhost:6080

**Uso:**

- Renovação de sessões OAuth (Google login)
- Debugging de scrapers visuais
- Verificação de problemas de rendering

---

## 🔐 VARIÁVEIS DE AMBIENTE

### Backend (`backend/.env`)

| Variável      | Descrição             | Valor Padrão      | Obrigatório   |
| ------------- | --------------------- | ----------------- | ------------- |
| `DB_HOST`     | Host do PostgreSQL    | `postgres`        | ✅            |
| `DB_PORT`     | Porta do PostgreSQL   | `5432`            | ✅            |
| `DB_USERNAME` | Usuário do PostgreSQL | `invest_user`     | ✅            |
| `DB_PASSWORD` | Senha do PostgreSQL   | `invest_password` | ✅            |
| `DB_DATABASE` | Nome do banco         | `invest_db`       | ✅            |
| `REDIS_HOST`  | Host do Redis         | `redis`           | ✅            |
| `REDIS_PORT`  | Porta do Redis        | `6379`            | ✅            |
| `JWT_SECRET`  | Chave secreta JWT     | -                 | ✅            |
| `API_PORT`    | Porta da API          | `3101`            | ✅            |
| `API_PREFIX`  | Prefixo da API        | `/api/v1`         | ✅            |
| `BRAPI_TOKEN` | Token da BRAPI        | -                 | ⚠️ Opcional\* |

_\*Opcional mas recomendado para scraper BRAPI funcionar (obter em https://brapi.dev)_

### Frontend (`frontend/.env.local`)

| Variável              | Descrição          | Valor Padrão            | Obrigatório      |
| --------------------- | ------------------ | ----------------------- | ---------------- |
| `NEXT_PUBLIC_API_URL` | URL da API backend | `http://localhost:3101` | ✅               |
| `NEXT_PUBLIC_WS_URL`  | URL do WebSocket   | `http://localhost:3101` | ✅               |
| `NEXTAUTH_URL`        | URL do NextAuth    | `http://localhost:3100` | ⚠️ Se usar OAuth |
| `NEXTAUTH_SECRET`     | Secret do NextAuth | -                       | ⚠️ Se usar OAuth |

---

## ✅ VERIFICAÇÃO DA INSTALAÇÃO

### 1. Verificar Containers Rodando

```bash
docker-compose ps
```

**Resultado esperado:** Todos os containers com status `Up`.

---

### 2. Verificar Health Checks

```bash
# Backend
curl http://localhost:3101/health
# Esperado: {"status":"ok"}

# API Service (Python)
curl http://localhost:8000/health
# Esperado: {"status":"healthy"}
```

---

### 3. Verificar Banco de Dados

```bash
# Conectar ao PostgreSQL
docker exec -it invest_postgres psql -U invest_user -d invest_db

# Verificar tabelas
\dt

# Esperado: Lista de tabelas (assets, asset_prices, analyses, portfolios, etc)
```

---

### 4. Verificar Frontend

Abra o navegador em http://localhost:3100

**Resultado esperado:**

- Página de login carrega sem erros
- Console do browser (F12) sem erros críticos
- Consegue fazer login (se tiver usuário seed)

---

### 5. Verificar Logs

```bash
# Logs de todos os containers
docker-compose logs --tail 50

# Logs específicos
docker-compose logs backend --tail 50
docker-compose logs frontend --tail 50

# Resultado esperado: Sem erros críticos, apenas logs normais
```

---

## 🎯 PRÓXIMOS PASSOS

### 1. Criar Usuário Admin

**✅ AUTOMÁTICO:** O seed já cria um usuário admin por padrão.

```bash
# Rodar seed (cria usuário admin + data sources)
docker exec invest_backend npm run seed
```

**📧 Credenciais Padrão:**

- Email: `admin@invest.com`
- Senha: `Admin@123`

**📚 Documentação Completa:** Ver `TESTING.md` para instruções detalhadas de teste e troubleshooting.

**Verificar se foi criado:**

```bash
docker exec invest_postgres psql -U invest_user -d invest_db \
  -c "SELECT email, first_name, last_name, is_active FROM users WHERE email = 'admin@invest.com';"
```

---

### 2. Popular Banco com Ativos

```bash
# Sincronizar ativos da BRAPI (requer BRAPI_TOKEN configurado)
curl -X POST http://localhost:3101/api/v1/assets/sync
```

---

### 3. Configurar Scrapers OAuth

Acesse http://localhost:3100/oauth-manager e siga instruções para renovar sessões OAuth dos scrapers autenticados (Status Invest, Investidor10, Fundamentei).

---

### 4. Explorar a Aplicação

- **Dashboard:** http://localhost:3100/dashboard
- **Análise de Ativos:** http://localhost:3100/analysis
- **Portfólio:** http://localhost:3100/portfolio
- **Relatórios:** http://localhost:3100/reports
- **Data Sources:** http://localhost:3100/data-sources

---

## 🔧 COMANDOS ÚTEIS

### Docker Compose

```bash
# Iniciar containers
docker-compose up -d

# Parar containers
docker-compose stop

# Parar e remover containers
docker-compose down

# Rebuild containers
docker-compose up -d --build

# Ver logs em tempo real
docker-compose logs -f

# Reiniciar um serviço específico
docker-compose restart backend
```

### Migrations

```bash
# Executar migrations
docker exec invest_backend npm run migration:run

# Reverter última migration
docker exec invest_backend npm run migration:revert

# Gerar nova migration
docker exec invest_backend npm run migration:create -- src/database/migrations/NomeDaMigration
```

### Logs

```bash
# Logs de todos os serviços
docker-compose logs --tail 100

# Logs de um serviço específico
docker-compose logs backend --tail 50 -f

# Logs do PostgreSQL
docker logs invest_postgres --tail 50
```

### Acesso aos Containers

```bash
# Backend (NestJS)
docker exec -it invest_backend sh

# Frontend (Next.js)
docker exec -it invest_frontend sh

# PostgreSQL
docker exec -it invest_postgres psql -U invest_user -d invest_db

# Redis
docker exec -it invest_redis redis-cli
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- **`ARCHITECTURE.md`** - Arquitetura do sistema
- **`DATABASE_SCHEMA.md`** - Schema do banco de dados
- **`TROUBLESHOOTING.md`** - Resolução de problemas
- **`CONTRIBUTING.md`** - Como contribuir
- **`README.md`** - Documentação geral

---

## 🆘 PROBLEMAS COMUNS

### Porta já em uso

**Erro:**

```
Error: bind: address already in use
```

**Solução:**

```bash
# Windows
netstat -ano | findstr :3101
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3101
kill -9 <PID>
```

---

### Container não inicia

**Solução:**

```bash
# Ver logs do container
docker logs invest_backend

# Recriar container
docker-compose down
docker-compose up -d --build
```

---

### Migrations falham

**Solução:**

```bash
# Reverter última migration
docker exec invest_backend npm run migration:revert

# Reexecutar
docker exec invest_backend npm run migration:run
```

---

Para mais problemas, consulte **`TROUBLESHOOTING.md`**.

---

**Última atualização:** 2025-11-14
**Mantido por:** Claude Code (Sonnet 4.5)

---

## 🛠️ GERENCIAMENTO DO SISTEMA

O projeto inclui o script `system-manager.ps1` v2.0 para gerenciamento completo dos 11 serviços.

### Serviços Gerenciados

| Tipo | Serviços | Comando |
|------|----------|---------|
| Core (8) | postgres, redis, python-service, backend, frontend, scrapers, api-service, orchestrator | `start` |
| Dev (2) | pgadmin, redis-commander | `start-dev` |
| Production (1) | nginx | `start-prod` |

### Comandos de Inicialização

| Comando                               | Descrição                                    |
| ------------------------------------- | -------------------------------------------- |
| `.\system-manager.ps1 start`          | Inicia core services (8 serviços)            |
| `.\system-manager.ps1 start-dev`      | Inicia core + pgadmin + redis-commander      |
| `.\system-manager.ps1 start-prod`     | Inicia core + nginx (reverse proxy)          |
| `.\system-manager.ps1 stop`           | Para todos os serviços                       |
| `.\system-manager.ps1 restart`        | Reinicia o sistema completo                  |
| `.\system-manager.ps1 start -Verbose` | Inicia com logs em tempo real                |

### Comandos de Status e Diagnóstico

| Comando                               | Descrição                                    |
| ------------------------------------- | -------------------------------------------- |
| `.\system-manager.ps1 status`         | Status detalhado de todos os 11 serviços     |
| `.\system-manager.ps1 health`         | Health check completo (HTTP + Docker)        |
| `.\system-manager.ps1 logs [service]` | Mostra logs (ex: `logs backend`)             |
| `.\system-manager.ps1 volumes`        | Lista volumes Docker do projeto              |
| `.\system-manager.ps1 network`        | Mostra rede Docker e containers conectados   |

### Comandos de Gerenciamento

| Comando                                       | Descrição                                   |
| --------------------------------------------- | ------------------------------------------- |
| `.\system-manager.ps1 restart-service <nome>` | Reinicia serviço específico                 |
| `.\system-manager.ps1 backup`                 | Cria backup completo do banco em `backups/` |
| `.\system-manager.ps1 restore`                | Restaura um backup existente                |
| `.\system-manager.ps1 clean-cache`            | Limpa cache do frontend (seguro)            |
| `.\system-manager.ps1 rebuild-frontend`       | Força rebuild do frontend                   |
| `.\system-manager.ps1 check-types`            | Verifica erros de TypeScript                |
| `.\system-manager.ps1 prune`                  | Limpeza profunda do Docker                  |
