# Getting Started - B3 AI Analysis Platform

Este guia irá ajudá-lo a configurar e executar a plataforma localmente.

## Pré-requisitos

- Node.js 20+
- Python 3.11+ (para scrapers)
- Docker & Docker Compose
- Git

## Instalação Rápida com Docker

A maneira mais rápida de começar é usando Docker Compose:

```bash
# 1. Clone o repositório
git clone <repository-url>
cd invest

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 3. Inicie todos os serviços
docker-compose up -d

# 4. Aguarde os serviços iniciarem (pode levar alguns minutos)
docker-compose logs -f
```

Acesse:
- Frontend: http://localhost:3100
- Backend API: http://localhost:3101
- API Docs: http://localhost:3101/api/docs
- PgAdmin: http://localhost:5150 (opcional, use profile dev)
- Redis Commander: http://localhost:8181 (opcional, use profile dev)

## Instalação Manual (Desenvolvimento)

### 1. Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp ../.env.example .env
# Edite o .env conforme necessário

# Executar migrations
npm run migration:run

# Executar seeds (popular banco de dados)
npm run seed

# Iniciar em modo desenvolvimento
npm run start:dev
```

O backend estará rodando em http://localhost:3101

### 2. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev
```

O frontend estará rodando em http://localhost:3100

### 3. Banco de Dados (PostgreSQL + TimescaleDB)

Se você não estiver usando Docker, precisará instalar PostgreSQL com TimescaleDB:

```bash
# Instalar PostgreSQL 15+
# Instalar TimescaleDB extension

# Criar banco de dados
createdb invest_db

# Executar script de inicialização
psql -U postgres -d invest_db -f database/init.sql
```

### 4. Redis

```bash
# Instalar Redis
# ou usar Docker:
docker run -d -p 6379:6379 redis:7-alpine
```

## Configuração de Variáveis de Ambiente

### Backend (.env)

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=invest_user
DB_PASSWORD=invest_password
DB_DATABASE=invest_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# Google OAuth (opcional - desabilitado automaticamente se não configurado)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3101/api/v1/auth/google/callback

# BRAPI
BRAPI_API_KEY=mVcy3EFZaBdza27tPQjdC1

# Scraping Credentials
OPCOES_USERNAME=your-username
OPCOES_PASSWORD=your-password

# Google Credentials para scrapers (opcional)
GOOGLE_EMAIL=your-email@gmail.com
GOOGLE_PASSWORD=your-password
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3101
NEXT_PUBLIC_WS_URL=http://localhost:3102
```

## Populando o Banco de Dados

Após configurar o backend, você pode popular o banco com dados iniciais:

```bash
cd backend
npm run seed
```

Isso irá:
- Criar as fontes de dados configuradas
- Adicionar alguns ativos de exemplo
- Criar dados de teste

## Testando a API

### Usando a documentação Swagger

Acesse http://localhost:3101/api/docs para ver a documentação interativa da API.

### Usando curl

```bash
# Health check
curl http://localhost:3101/api/v1/health

# Listar ativos
curl http://localhost:3101/api/v1/assets

# Buscar ativo específico
curl http://localhost:3101/api/v1/assets/PETR4

# Listar fontes de dados
curl http://localhost:3101/api/v1/data-sources
```

## Estrutura do Projeto

```
invest/
├── backend/              # Backend NestJS
│   ├── src/
│   │   ├── api/         # Controllers
│   │   ├── services/    # Business logic
│   │   ├── scrapers/    # Data scrapers
│   │   ├── database/    # Database models
│   │   └── ...
│   └── package.json
├── frontend/            # Frontend Next.js
│   ├── src/
│   │   ├── app/        # Next.js App Router
│   │   ├── components/ # React components
│   │   └── services/   # API clients
│   └── package.json
├── database/           # Database scripts
├── docker/             # Docker configs
└── docker-compose.yml
```

## Próximos Passos

1. **Configurar scrapers**: Edite as credenciais dos scrapers no .env
2. **Testar coleta de dados**: Use a API para testar os scrapers
3. **Explorar o dashboard**: Acesse o frontend e navegue pelas funcionalidades
4. **Adicionar ativos**: Use a API para adicionar novos ativos ao sistema

## Problemas Comuns

### Porta já em uso

Se as portas 3100, 3101 ou 5532 já estiverem em uso, você pode alterá-las no docker-compose.yml.

### Erro de conexão com banco de dados

Verifique se o PostgreSQL está rodando e se as credenciais no .env estão corretas.

### Erro ao instalar dependências

Certifique-se de estar usando Node.js 20+ e npm atualizado:

```bash
node --version  # deve ser 20+
npm --version   # deve ser 10+
```

### Scrapers não funcionam

Os scrapers podem falhar por vários motivos:
- Credenciais incorretas
- Site mudou estrutura
- Rate limiting
- Necessidade de login manual primeiro

Verifique os logs para mais detalhes:
```bash
docker-compose logs backend
```

## Desenvolvimento

### Executar testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Gerar migration

```bash
cd backend
npm run migration:generate -- src/database/migrations/YourMigrationName
```

### Build para produção

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Suporte

Para problemas ou dúvidas, abra uma issue no GitHub ou consulte a documentação completa em `/docs`.
