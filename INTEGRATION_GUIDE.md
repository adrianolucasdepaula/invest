# 🔗 Guia de Integração Frontend-Backend

Este guia detalha como integrar e executar a plataforma B3 AI Analysis completa, com frontend (Next.js) e backend (NestJS) funcionando juntos.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Arquitetura da Integração](#arquitetura-da-integração)
3. [Configuração Inicial](#configuração-inicial)
4. [Executando os Serviços](#executando-os-serviços)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Endpoints da API](#endpoints-da-api)
7. [WebSocket (Tempo Real)](#websocket-tempo-real)
8. [Autenticação](#autenticação)
9. [Tratamento de Erros](#tratamento-de-erros)
10. [Deploy](#deploy)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Pré-requisitos

### Software Necessário

| Software | Versão | Uso |
|----------|--------|-----|
| **Node.js** | >= 18.x | Runtime |
| **npm** | >= 9.x | Gerenciador de pacotes |
| **PostgreSQL** | >= 15 | Banco de dados |
| **Redis** | >= 7 | Cache e Queue |
| **Docker** | >= 24.x | Containers (opcional) |

### Portas Utilizadas

```
Frontend:  3000 (Next.js)
Backend:   3001 (NestJS API)
PostgreSQL: 5432
Redis:     6379
```

---

## 🏗️ Arquitetura da Integração

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVEGADOR                            │
│                     localhost:3000                          │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTP/REST + WebSocket
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • React Components                                  │   │
│  │  • TailwindCSS + Shadcn/UI                          │   │
│  │  • API Client (axios)                                │   │
│  │  • WebSocket Client (socket.io-client)              │   │
│  │  • React Query (state management)                   │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────────┘
                   │ Requisições HTTP/WS
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                   BACKEND (NestJS 10)                       │
│                     localhost:3001                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  REST API                                            │   │
│  │  ├─ Assets API     (/api/assets)                    │   │
│  │  ├─ Portfolio API  (/api/portfolios)                │   │
│  │  ├─ Analysis API   (/api/analysis)                  │   │
│  │  └─ Auth API       (/api/auth)                      │   │
│  │                                                       │   │
│  │  WebSocket Gateway (/socket.io)                     │   │
│  │  ├─ Price updates                                    │   │
│  │  ├─ Indicator updates                                │   │
│  │  └─ Alerts                                           │   │
│  │                                                       │   │
│  │  Background Services                                 │   │
│  │  ├─ Scrapers (7 fontes)                             │   │
│  │  ├─ Analysis Engine                                  │   │
│  │  ├─ AI Service (GPT-4)                              │   │
│  │  └─ Bull Queue                                       │   │
│  └─────────────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────────────┘
                   │
      ┌────────────┴────────────┐
      │                          │
┌─────▼──────┐          ┌───────▼───────┐
│ PostgreSQL │          │     Redis     │
│   :5432    │          │     :6379     │
└────────────┘          └───────────────┘
```

---

## ⚙️ Configuração Inicial

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/invest.git
cd invest
```

### 2. Configure o Backend

```bash
cd backend

# Instalar dependências
npm install

# Copiar .env de exemplo
cp .env.example .env

# Editar .env com suas configurações
nano .env
```

**Configurações mínimas do .env (backend):**

```env
# Servidor
PORT=3001
NODE_ENV=development

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=b3_invest

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=seu_secret_super_seguro_aqui_min_32_chars

# OpenAI (para análises com IA)
OPENAI_API_KEY=sk-seu-api-key-aqui

# Scrapers
SCRAPER_HEADLESS=true
```

### 3. Configure o Frontend

```bash
cd ../frontend

# Instalar dependências
npm install

# Copiar .env de exemplo
cp .env.example .env.local

# Editar .env.local
nano .env.local
```

**Configurações do .env.local (frontend):**

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# WebSocket
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Ambiente
NEXT_PUBLIC_ENV=development
```

### 4. Preparar o Banco de Dados

```bash
# Criar banco PostgreSQL
createdb b3_invest

# Ou via psql:
psql -U postgres
CREATE DATABASE b3_invest;
\q

# Rodar migrações (no diretório backend)
cd backend
npm run migration:run

# Popular dados iniciais (opcional)
npm run seed
```

---

## 🚀 Executando os Serviços

### Opção 1: Desenvolvimento Local (Recomendado)

**Terminal 1 - Backend:**

```bash
cd backend
npm run start:dev

# Servidor rodará em: http://localhost:3001
# Swagger docs: http://localhost:3001/api/docs
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev

# Aplicação rodará em: http://localhost:3000
```

**Terminal 3 - Redis (se não estiver no Docker):**

```bash
redis-server
```

### Opção 2: Docker Compose

```bash
# No diretório raiz
docker-compose up

# Ou em background
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Verificar se Tudo Está Funcionando

```bash
# Backend health check
curl http://localhost:3001/health

# Frontend
curl http://localhost:3000

# API de teste
curl http://localhost:3001/api/assets
```

---

## 🔄 Fluxo de Dados

### 1. Requisição Típica (Listar Ativos)

```
┌──────────┐     GET /assets      ┌─────────┐
│ Frontend │ ─────────────────────> │ Backend │
│          │                        │         │
│          │ <───────────────────── │         │
│          │    200 + JSON data     └─────────┘
└──────────┘
```

**Código Frontend:**

```typescript
// frontend/src/app/(dashboard)/assets/page.tsx
import { api } from '@/lib/api';

export default function AssetsPage() {
  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.getAssets(),
  });

  return <AssetTable assets={assets} />;
}
```

**Código Backend:**

```typescript
// backend/src/api/assets/assets.controller.ts
@Get()
async listAssets(@Query() query: ListAssetsDto) {
  return this.assetsService.findAll(query);
}
```

### 2. Requisição com Autenticação

```
┌──────────┐  POST /auth/login  ┌─────────┐
│          │ ───────────────────> │         │
│ Frontend │                      │ Backend │
│          │ <─────────────────── │         │
│          │  { access_token }    └─────────┘
│          │
│          │  GET /api/portfolios
│          │  Authorization: Bearer token
│          │ ───────────────────> │         │
│          │                      │         │
│          │ <─────────────────── │         │
│          │    Portfolio data     │         │
└──────────┘                      └─────────┘
```

**Código Frontend:**

```typescript
// Login
const response = await api.login(email, password);
// Token é salvo automaticamente no localStorage

// Requisições subsequentes incluem token automaticamente
const portfolios = await api.getPortfolios();
```

**Código Backend:**

```typescript
// Endpoint protegido
@Get('/portfolios')
@UseGuards(JwtAuthGuard)
async getPortfolios(@Request() req) {
  return this.portfolioService.findByUser(req.user.id);
}
```

### 3. WebSocket (Tempo Real)

```
┌──────────┐   ws://localhost:3001   ┌─────────┐
│ Frontend │ <─────────────────────> │ Backend │
│          │   Conexão permanente    │         │
│          │                          │         │
│  socket  │ ◄─── price-update ────  │ Gateway │
│  .on()   │ ◄─── indicator-update  │         │
│          │ ◄─── alert-triggered ── │         │
└──────────┘                          └─────────┘
```

**Código Frontend:**

```typescript
// frontend/src/hooks/useWebSocket.ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('price-update', (data) => {
  console.log('Novo preço:', data);
  // { ticker: 'PETR4', price: 38.45, change: 2.34 }
});

// Inscrever em ticker específico
socket.emit('subscribe', { ticker: 'PETR4' });
```

**Código Backend:**

```typescript
// backend/src/websocket/price.gateway.ts
@WebSocketGateway()
export class PriceGateway {
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, payload: { ticker: string }) {
    client.join(`ticker:${payload.ticker}`);
  }

  // Emitir atualização
  broadcastPriceUpdate(ticker: string, data: any) {
    this.server.to(`ticker:${ticker}`).emit('price-update', data);
  }
}
```

---

## 📡 Endpoints da API

### Assets

```typescript
// Listar ativos
GET /api/assets?search=PETR&limit=10

// Detalhes do ativo
GET /api/assets/PETR4

// Histórico de preços
GET /api/assets/PETR4/history?startDate=2024-01-01&endDate=2024-12-31

// Indicadores técnicos
GET /api/assets/PETR4/indicators

// Comparar ativos
POST /api/assets/compare
Body: { "tickers": ["PETR4", "VALE3", "ITUB4"] }
```

### Portfolio

```typescript
// Listar portfólios
GET /api/portfolios

// Criar portfólio
POST /api/portfolios
Body: { "name": "Meu Portfólio", "description": "..." }

// Adicionar posição
POST /api/portfolios/:id/positions
Body: {
  "ticker": "PETR4",
  "quantity": 100,
  "averagePrice": 38.50
}

// Importar de arquivo
POST /api/portfolios/:id/import
FormData: file (CSV/Excel)

// Performance
GET /api/portfolios/:id/performance?startDate=2024-01-01
```

### Analysis

```typescript
// Gerar análise com IA
POST /api/analysis/generate
Body: { "ticker": "PETR4" }

// Listar relatórios
GET /api/analysis/reports?ticker=PETR4&limit=10

// Detalhes do relatório
GET /api/analysis/reports/:id

// Análise fundamentalista
GET /api/analysis/fundamental/PETR4

// Análise técnica
GET /api/analysis/technical/PETR4

// Criar alerta
POST /api/analysis/alerts
Body: {
  "ticker": "PETR4",
  "type": "PRICE",
  "condition": "ABOVE",
  "value": 40.0
}
```

---

## 🔐 Autenticação

### Fluxo Completo

```typescript
// 1. Login
const { access_token, user } = await api.login(email, password);
// Token é salvo automaticamente no localStorage

// 2. Requisições autenticadas
// O interceptor do axios adiciona automaticamente:
// Authorization: Bearer {token}

// 3. Refresh (se token expirar)
// O interceptor detecta 401 e redireciona para /login

// 4. Logout
await api.logout();
// Remove token do localStorage
```

### Google OAuth

```typescript
// Frontend
const handleGoogleLogin = () => {
  // Redirecionar para backend
  window.location.href = 'http://localhost:3001/api/auth/google';
};

// Backend retorna para:
// http://localhost:3000/auth/callback?token=...

// Frontend captura token e salva
const token = new URLSearchParams(window.location.search).get('token');
localStorage.setItem('access_token', token);
```

---

## ⚠️ Tratamento de Erros

### Frontend

```typescript
// API client com try-catch
try {
  const data = await api.getAssets();
  setAssets(data);
} catch (error) {
  if (error.response?.status === 404) {
    toast.error('Ativos não encontrados');
  } else if (error.response?.status === 500) {
    toast.error('Erro no servidor');
  } else {
    toast.error('Erro desconhecido');
  }
}
```

### Backend

```typescript
// Exception filter global
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.message
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

## 🚢 Deploy

### Produção

**Backend:**

```bash
cd backend
npm run build
NODE_ENV=production npm run start:prod
```

**Frontend:**

```bash
cd frontend
npm run build
npm start
```

**Variáveis de Ambiente (Produção):**

```env
# Backend
NEXT_PUBLIC_API_URL=https://api.investplatform.com/api
NEXT_PUBLIC_WS_URL=https://api.investplatform.com

# Frontend
API_URL=https://api.investplatform.com
```

### Docker

```bash
# Build images
docker-compose build

# Deploy
docker-compose up -d

# Escalar serviços
docker-compose up --scale backend=3
```

---

## 🔧 Troubleshooting

### Backend não conecta ao PostgreSQL

```bash
# Verificar se PostgreSQL está rodando
pg_isready -h localhost -p 5432

# Verificar credenciais no .env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=b3_invest

# Testar conexão manual
psql -h localhost -U postgres -d b3_invest
```

### Frontend não conecta ao Backend

```bash
# Verificar se backend está rodando
curl http://localhost:3001/health

# Verificar CORS no backend
# backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:3000'],
  credentials: true,
});

# Verificar .env.local do frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### WebSocket não conecta

```bash
# Verificar URL do WebSocket
NEXT_PUBLIC_WS_URL=http://localhost:3001

# Testar conexão
wscat -c ws://localhost:3001/socket.io

# Verificar firewall
sudo ufw allow 3001
```

### Redis não conecta

```bash
# Verificar se Redis está rodando
redis-cli ping
# Deve retornar: PONG

# Iniciar Redis
redis-server

# Ou com Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Erro "Cannot find module"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install

# Verificar versão do Node
node -v  # Deve ser >= 18.x
```

### Build do Frontend falha

```bash
# Limpar cache do Next.js
rm -rf .next

# Rebuild
npm run build

# Verificar TypeScript
npx tsc --noEmit
```

---

## ✅ Checklist de Integração

- [ ] PostgreSQL rodando
- [ ] Redis rodando
- [ ] Backend `.env` configurado
- [ ] Frontend `.env.local` configurado
- [ ] Migrações do banco executadas
- [ ] Backend iniciado (porta 3001)
- [ ] Frontend iniciado (porta 3000)
- [ ] Health check do backend: `curl localhost:3001/health`
- [ ] Frontend acessível: `http://localhost:3000`
- [ ] Swagger docs acessível: `http://localhost:3001/api/docs`
- [ ] WebSocket conectando (verificar no DevTools > Network > WS)

---

## 📚 Documentação Adicional

- **Backend README**: `backend/README.md`
- **Frontend Design System**: `frontend/DESIGN_SYSTEM.md`
- **Testes**: `backend/test-all.sh` e `frontend/validate-frontend.sh`
- **API Swagger**: `http://localhost:3001/api/docs`

---

## 🤝 Suporte

Problemas? Abra uma issue:
https://github.com/seu-usuario/invest/issues

---

*Última atualização: 2025-11-06*
