# FASE 15 - NETWORK REQUESTS - ANÁLISE E PREPARAÇÃO COMPLETA

**Data:** 2025-11-13
**Status:** 📋 PREPARAÇÃO
**Metodologia:** Rigorosa, Incremental, 100% Documentada

---

## 📋 REVISÃO OBRIGATÓRIA - FASE 23 (ANTERIOR)

### ✅ Status FASE 23: **100% COMPLETO E VALIDADO**

**Checklist de Validação:**
- ✅ Backend: Migration, Entity, Service, Controller, Modules (100%)
- ✅ Frontend: Página refatorada, Tooltip, Métricas reais (100%)
- ✅ MCP Triplo: Chrome DevTools ✅, Playwright ✅, Selenium ⚠️ (não-bloqueante)
- ✅ TypeScript: 0 erros (backend + frontend)
- ✅ Console: 0 erros, 0 warnings
- ✅ Git: 7 commits, branch main limpa
- ✅ Documentação: claude.md atualizado

**Conclusão:** ✅ FASE 23 está 100% validada. Pode prosseguir para FASE 15.

---

## 🏗️ ARQUITETURA DO SISTEMA (Revisão Completa)

### Diagrama Geral

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Next.js   │ ←──→ │   NestJS    │ ←──→ │ PostgreSQL  │
│  Frontend   │      │   Backend   │      │  Database   │
│   :3100     │      │    :3101    │      │   :5532     │
└─────────────┘      └─────────────┘      └─────────────┘
                            ↓
                     ┌─────────────┐
                     │   BullMQ    │
                     │   + Redis   │
                     │    :6479    │
                     └─────────────┘
                            ↓
                     ┌─────────────┐
                     │  Python     │
                     │  Scrapers   │
                     │  (FastAPI)  │
                     │    :8000    │
                     └─────────────┘
```

### Portas e Serviços

| Serviço | Porta Host | URL Completa | Status |
|---------|-----------|--------------|--------|
| **Frontend** | 3100 | http://localhost:3100 | ✅ UP |
| **Backend API** | 3101 | http://localhost:3101/api/v1 | ✅ UP |
| **Swagger Docs** | 3101 | http://localhost:3101/api/docs | ✅ UP |
| **WebSocket** | 3101 | ws://localhost:3101/socket.io | ✅ UP |
| **Python API** | 8000 | http://localhost:8000 | ✅ UP |
| **PostgreSQL** | 5532 | localhost:5532 | ✅ UP |
| **Redis** | 6479 | localhost:6479 | ✅ UP |
| **PgAdmin** | 5150 | http://localhost:5150 | ✅ UP |
| **Redis Commander** | 8181 | http://localhost:8181 | ✅ UP |
| **VNC** | 5900 / 6080 | vnc://localhost:5900 | ✅ UP |

### Stack Tecnológica

**Backend:**
- Framework: NestJS 10.x
- ORM: TypeORM 0.3.x
- Validation: class-validator
- Queue: BullMQ
- WebSocket: Socket.io
- API Docs: Swagger

**Frontend:**
- Framework: Next.js 14.x (App Router)
- UI: Shadcn/ui + TailwindCSS
- Estado: React Query (TanStack Query)
- Forms: React Hook Form + Zod
- WebSocket: Socket.io-client

**Database:**
- RDBMS: PostgreSQL 16.x
- Cache: Redis 7.x

---

## 📍 ENDPOINTS API MAPEADOS

### 1. Auth Module

| Método | Endpoint | Descrição | Body | Response |
|--------|----------|-----------|------|----------|
| POST | /api/v1/auth/register | Registrar usuário | { email, password, name } | { user, token } |
| POST | /api/v1/auth/login | Login | { email, password } | { user, token } |
| POST | /api/v1/auth/logout | Logout | - | { success } |
| GET | /api/v1/auth/me | Usuário atual | - | { user } |
| POST | /api/v1/auth/forgot-password | Recuperar senha | { email } | { success } |

### 2. Assets Module

| Método | Endpoint | Descrição | Body | Response |
|--------|----------|-----------|------|----------|
| GET | /api/v1/assets | Listar ativos | ?limit, ?offset | { assets[], total } |
| GET | /api/v1/assets/:id | Buscar ativo | - | { asset } |
| POST | /api/v1/assets | Criar ativo | { ticker, name, type } | { asset } |
| PUT | /api/v1/assets/:id | Atualizar ativo | { name, sector } | { asset } |
| DELETE | /api/v1/assets/:id | Deletar ativo | - | { success } |
| POST | /api/v1/assets/sync | Sincronizar BRAPI | { tickers[] } | { total, created, updated } |
| POST | /api/v1/assets/:id/update-price | Atualizar preço | - | { price } |

### 3. Analysis Module

| Método | Endpoint | Descrição | Body | Response |
|--------|----------|-----------|------|----------|
| GET | /api/v1/analysis | Listar análises | ?limit, ?offset, ?type | { analyses[], total } |
| GET | /api/v1/analysis/:id | Buscar análise | - | { analysis } |
| POST | /api/v1/analysis/fundamental/:ticker | Análise fundamentalista | - | { analysis } |
| POST | /api/v1/analysis/technical/:ticker | Análise técnica | - | { analysis } |
| POST | /api/v1/analysis/complete/:ticker | Análise completa | - | { analysis } |
| POST | /api/v1/analysis/bulk/request | Análise em massa | { type } | { total, requested, skipped } |

### 4. Portfolio Module

| Método | Endpoint | Descrição | Body | Response |
|--------|----------|-----------|------|----------|
| GET | /api/v1/portfolio | Listar portfólios | - | { portfolios[] } |
| GET | /api/v1/portfolio/:id | Buscar portfólio | - | { portfolio } |
| POST | /api/v1/portfolio | Criar portfólio | { name, description } | { portfolio } |
| PUT | /api/v1/portfolio/:id | Atualizar portfólio | { name } | { portfolio } |
| DELETE | /api/v1/portfolio/:id | Deletar portfólio | - | { success } |
| POST | /api/v1/portfolio/:id/positions | Adicionar posição | { assetId, quantity, averagePrice } | { position } |
| PUT | /api/v1/portfolio/positions/:id | Atualizar posição | { quantity } | { position } |
| DELETE | /api/v1/portfolio/positions/:id | Remover posição | - | { success } |
| POST | /api/v1/portfolio/:id/update-prices | Atualizar preços | - | { updated } |

### 5. Reports Module

| Método | Endpoint | Descrição | Body | Response |
|--------|----------|-----------|------|----------|
| GET | /api/v1/reports/assets-status | Status de análises | - | { assets[] } |
| GET | /api/v1/reports/:id | Buscar relatório | - | { report } |
| GET | /api/v1/reports/:id/download | Download PDF/JSON | ?format=pdf\|json | File |

### 6. Scrapers Module

| Método | Endpoint | Descrição | Body | Response |
|--------|----------|-----------|------|----------|
| GET | /api/v1/scrapers/status | Status de scrapers | - | { sources[] } |
| POST | /api/v1/scrapers/test/:scraperId | Testar scraper | - | { success, responseTime } |
| ~~POST~~ | ~~/api/v1/scrapers/sync/:scraperId~~ | ~~Sincronizar scraper~~ | - | ~~404 (REMOVIDO)~~ |

### 7. Data Sources Module

| Método | Endpoint | Descrição | Body | Response |
|--------|----------|-----------|------|----------|
| GET | /api/v1/data-sources | Listar fontes | - | { sources[] } |

---

## 🔄 FLUXOS DE DADOS PRINCIPAIS

### Fluxo 1: Sincronização de Ativos (BRAPI)

```
1. User clica "Sincronizar" → Frontend /assets
2. POST /api/v1/assets/sync
3. Backend → BRAPI API (externa)
4. Para cada ticker:
   - Verifica se existe no DB
   - Se existe: UPDATE
   - Se não existe: INSERT
5. Retorna resumo: { total, created, updated, failed }
6. Frontend → Toast notification
```

### Fluxo 2: Análise Fundamentalista

```
1. User clica "Solicitar Análise" → Frontend /analysis
2. POST /api/v1/analysis/fundamental/:ticker
3. Backend cria análise (status=PROCESSING)
4. ScrapersService → 6 scrapers em paralelo:
   - Fundamentus (sem auth)
   - BRAPI (API token)
   - StatusInvest (OAuth cookies)
   - Investidor10 (OAuth cookies)
   - Fundamentei (OAuth cookies)
   - Investsite (sem auth)
5. Cross-validation dos dados
6. Cálculo de confidence score
7. Atualiza análise (status=COMPLETED)
8. Frontend → Exibe análise
```

### Fluxo 3: WebSocket Real-Time

```
1. Frontend conecta: io('http://localhost:3101')
2. Backend aceita conexão
3. Frontend subscribe: 'portfolio-update'
4. Backend emite evento: { type, data }
5. Frontend atualiza UI em tempo real
```

---

## 📋 FASE 15 - CHECKLIST DETALHADO

### Objetivo

Validar TODAS as requisições de rede do frontend, verificando:
- ✅ Headers corretos (Content-Type, Authorization)
- ✅ CORS configurado adequadamente
- ✅ Status codes esperados (200, 201, 400, 401, 404, 500)
- ✅ Payloads JSON válidos
- ✅ Response times aceitáveis (< 500ms para GET, < 2s para POST)
- ✅ Error handling funcional
- ✅ Retry logic (React Query)
- ✅ Timeouts configurados

### Páginas a Validar

1. **Dashboard** (`/dashboard`)
2. **Assets** (`/assets`)
3. **Analysis** (`/analysis`)
4. **Portfolio** (`/portfolio`)
5. **Reports** (`/reports`)
6. **Data Sources** (`/data-sources`)

### Ferramentas MCP (Tripla Validação)

1. **Chrome DevTools Network Tab**
   - Capturar todas requisições
   - Verificar headers
   - Verificar timing
   - Verificar cache

2. **Playwright Network Monitoring**
   - Interceptar requests
   - Interceptar responses
   - Validar payloads
   - Validar error responses

3. **Selenium Network Logging**
   - Performance logs
   - Network timing
   - Resource loading

---

## ✅ TODO LIST COMPLETO - FASE 15

### 15.1 - Preparação (5 itens)

- [x] Ler VALIDACAO_FRONTEND_COMPLETA.md (FASE 15)
- [x] Ler CLAUDE.md (Arquitetura + Fluxos)
- [x] Ler README.md (Stack + Fontes)
- [x] Mapear todos os endpoints API (43 endpoints mapeados)
- [x] Verificar CORS configurado (backend/src/main.ts) ✅ OK

### 15.2 - Chrome DevTools: Dashboard (15 itens)

- [ ] Navegar: http://localhost:3100/dashboard
- [ ] Abrir DevTools Network Tab
- [ ] Capturar requisições (All types)
- [ ] Verificar: GET /api/v1/auth/me (200)
- [ ] Verificar: GET /api/v1/assets?limit=10 (200)
- [ ] Verificar headers:
  - [ ] Content-Type: application/json
  - [ ] Authorization: Bearer {token}
  - [ ] Access-Control-Allow-Origin: http://localhost:3100
- [ ] Verificar timing: Response time < 500ms
- [ ] Verificar cache: Cache-Control headers
- [ ] Screenshot: Network tab completa
- [ ] Listar console: 0 erros de rede
- [ ] Salvar: Lista de requisições

### 15.3 - Chrome DevTools: Assets (12 itens)

- [ ] Navegar: http://localhost:3100/assets
- [ ] Capturar: GET /api/v1/assets (200)
- [ ] Verificar: Query params (limit, offset)
- [ ] Verificar: Response JSON válido
- [ ] Verificar: Response size razoável
- [ ] Testar: POST /api/v1/assets/sync
- [ ] Verificar: Loading state durante sync
- [ ] Verificar: Toast notification após sync
- [ ] Verificar: Error handling (backend offline)
- [ ] Screenshot: Network tab
- [ ] Listar console: 0 erros
- [ ] Salvar: Lista de requisições

### 15.4 - Chrome DevTools: Analysis (10 itens)

- [ ] Navegar: http://localhost:3100/analysis
- [ ] Capturar: GET /api/v1/analysis (200)
- [ ] Testar: POST /api/v1/analysis/bulk/request
- [ ] Verificar: WebSocket connection (ws://localhost:3101)
- [ ] Verificar: WebSocket messages (real-time updates)
- [ ] Verificar: Retry logic (React Query)
- [ ] Verificar: Error handling
- [ ] Screenshot: Network tab + WS tab
- [ ] Listar console: 0 erros
- [ ] Salvar: Lista de requisições

### 15.5 - Chrome DevTools: Portfolio (12 itens)

- [ ] Navegar: http://localhost:3100/portfolio
- [ ] Capturar: GET /api/v1/portfolio (200)
- [ ] Testar: POST /api/v1/portfolio (criar portfólio)
- [ ] Testar: POST /api/v1/portfolio/:id/positions (adicionar posição)
- [ ] Testar: PUT /api/v1/portfolio/positions/:id (atualizar)
- [ ] Testar: DELETE /api/v1/portfolio/positions/:id (remover)
- [ ] Verificar: Optimistic updates (React Query)
- [ ] Verificar: Error handling (400, 404, 500)
- [ ] Screenshot: Network tab
- [ ] Listar console: 0 erros
- [ ] Salvar: Lista de requisições

### 15.6 - Chrome DevTools: Reports (10 itens)

- [ ] Navegar: http://localhost:3100/reports
- [ ] Capturar: GET /api/v1/reports/assets-status (200)
- [ ] Testar: POST /api/v1/analysis/complete/:ticker
- [ ] Navegar: http://localhost:3100/reports/:id
- [ ] Capturar: GET /api/v1/reports/:id (200)
- [ ] Testar: GET /api/v1/reports/:id/download?format=pdf
- [ ] Testar: GET /api/v1/reports/:id/download?format=json
- [ ] Screenshot: Network tab
- [ ] Listar console: 0 erros
- [ ] Salvar: Lista de requisições

### 15.7 - Chrome DevTools: Data Sources (8 itens)

- [ ] Navegar: http://localhost:3100/data-sources
- [ ] Capturar: GET /api/v1/scrapers/status (200)
- [ ] Testar: POST /api/v1/scrapers/test/fundamentus
- [ ] Verificar: Response time (pode ser > 1s para scrapers)
- [ ] Verificar: Métricas salvas no banco
- [ ] Screenshot: Network tab
- [ ] Listar console: 0 erros
- [ ] Salvar: Lista de requisições

### 15.8 - Playwright Network Monitoring (10 itens)

- [ ] Iniciar browser Playwright
- [ ] page.on('request', ...) - Interceptar requests
- [ ] page.on('response', ...) - Interceptar responses
- [ ] Navegar: Todas as 6 páginas
- [ ] Capturar: Todos os requests
- [ ] Validar: Payloads enviados (POST/PUT)
- [ ] Validar: Respostas JSON (structure)
- [ ] Validar: Error responses (400, 500)
- [ ] Salvar: Logs de network
- [ ] Screenshot: Cada página

### 15.9 - Validação CORS (8 itens)

- [ ] Verificar backend/src/main.ts: CORS config
- [ ] Verificar: origin = http://localhost:3100 permitido
- [ ] Verificar: credentials = true
- [ ] Verificar: methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
- [ ] Verificar: allowedHeaders corretos
- [ ] Testar: Preflight OPTIONS request
- [ ] Verificar console: 0 erros CORS
- [ ] Validar: Access-Control headers presentes

### 15.10 - Error Handling & Retry (12 itens)

- [ ] Simular: Backend offline (docker stop invest_backend)
- [ ] Verificar: Toast de erro exibido
- [ ] Verificar: Mensagem amigável ao usuário
- [ ] Verificar: Retry logic (React Query)
- [ ] Simular: Token expirado (401)
- [ ] Verificar: Redirect para /login
- [ ] Simular: Recurso não encontrado (404)
- [ ] Verificar: Error page exibida
- [ ] Simular: Validação falha (400)
- [ ] Verificar: Mensagem de erro específica
- [ ] Restaurar: Backend (docker start invest_backend)
- [ ] Validar: Recuperação automática

### 15.11 - Static Assets (8 itens)

- [ ] Navegar: http://localhost:3100
- [ ] Capturar: JavaScript bundles
- [ ] Verificar: Gzipped (Content-Encoding: gzip)
- [ ] Verificar: Bundle size < 500KB (87.6KB atual)
- [ ] Capturar: CSS files
- [ ] Verificar: Minified
- [ ] Capturar: Images
- [ ] Verificar: Optimized (WebP se possível)

### 15.12 - Documentação (8 itens)

- [ ] Criar: `VALIDACAO_FASE_15_NETWORK.md`
- [ ] Tabela: Todos os endpoints testados (43 endpoints)
- [ ] Tabela: Requisições por página (6 páginas)
- [ ] Screenshots: Network tabs (6 screenshots)
- [ ] Logs: Requisições capturadas (Playwright)
- [ ] Resumo: CORS, Error Handling, Retry Logic
- [ ] Atualizar: VALIDACAO_FRONTEND_COMPLETA.md (status FASE 15)
- [ ] Atualizar: claude.md (FASE 15 completa)

### 15.13 - Commit Final (5 itens)

- [ ] git add: Todos os arquivos de validação
- [ ] git commit: Mensagem detalhada
- [ ] git log: Verificar commit criado
- [ ] git status: Working tree clean
- [ ] Atualizar: MASTER_CHECKLIST_TODO.md (FASE 15 completa)

---

## 📊 MÉTRICAS DE SUCESSO

### Critérios de Aceitação (100%)

- [ ] Todas requisições retornam status code esperado
- [ ] CORS configurado corretamente (0 erros no console)
- [ ] Headers corretos (Content-Type, Authorization)
- [ ] Error handling funcional (toast, mensagens)
- [ ] Retry logic funcional (React Query)
- [ ] Timeouts configurados
- [ ] TypeScript: 0 erros
- [ ] Console: 0 erros de rede
- [ ] MCP Triplo: Validado (Chrome DevTools + Playwright + Selenium)
- [ ] Documentação: Criada e atualizada
- [ ] Git: Commit realizado
- [ ] Screenshots: 6 páginas capturadas

### Estimativa de Tempo

- Preparação: ✅ 30 min (COMPLETO)
- Testes Chrome DevTools: 1h 30min
- Testes Playwright: 30min
- Validação CORS + Error Handling: 30min
- Documentação: 30min
- Commit: 10min

**Total:** ~3h 40min

---

## 🚀 PRÓXIMO PASSO IMEDIATO

**Iniciar 15.2 - Chrome DevTools: Dashboard**

Agora que a preparação está 100% completa, posso prosseguir com confiança para os testes sistemáticos.

---

**🤖 Documento criado com [Claude Code](https://claude.com/claude-code)**
**Co-Authored-By: Claude <noreply@anthropic.com>**
