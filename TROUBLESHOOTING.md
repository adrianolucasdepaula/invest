# 🔧 TROUBLESHOOTING - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-11-15
**Versão:** 1.0.0
**Mantenedor:** Claude Code (Sonnet 4.5)

---

## 📑 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Problemas de Backend](#problemas-de-backend)
3. [Problemas de Frontend](#problemas-de-frontend)
4. [Problemas de Scrapers](#problemas-de-scrapers)
5. [Problemas de Database](#problemas-de-database)
6. [Problemas de Docker](#problemas-de-docker)
7. [Problemas de WebSocket](#problemas-de-websocket)
8. [Recursos Adicionais](#recursos-adicionais)

---

## 🎯 VISÃO GERAL

Este documento contém soluções para os problemas mais comuns encontrados durante o desenvolvimento e operação da plataforma B3 AI Analysis.

### Como Usar Este Guia

1. **Identifique o sintoma** do problema que você está enfrentando
2. **Localize a seção** correspondente neste documento
3. **Siga os passos** da solução proposta
4. **Verifique** se o problema foi resolvido
5. Se o problema persistir, consulte a seção [Recursos Adicionais](#recursos-adicionais)

---

## 🔴 PROBLEMAS DE BACKEND

### Problema 1: Backend não compila

**Sintomas:**

```
Error: Cannot find module '@api/assets/assets.service'
```

**Causa Raiz:**

- Configuração incorreta de path aliases no `tsconfig.json`
- TypeScript server do VSCode desatualizado

**Solução:**

**1. Verificar tsconfig.json:**

```json
{
  "compilerOptions": {
    "paths": {
      "@api/*": ["src/api/*"],
      "@database/*": ["src/database/*"],
      "@scrapers/*": ["src/scrapers/*"]
    }
  }
}
```

**2. Reiniciar TypeScript server no VSCode:**

- Pressione `Ctrl+Shift+P` (Windows/Linux) ou `Cmd+Shift+P` (Mac)
- Digite: `TypeScript: Restart TS Server`
- Confirme

**3. Validar compilação:**

```bash
cd backend
npx tsc --noEmit
```

**Resultado Esperado:** `0 errors`

---

### Problema 2: Erro de CORS ao chamar API

**Sintomas:**

```
Access to XMLHttpRequest at 'http://localhost:3101/api/v1/assets' from origin 'http://localhost:3100' has been blocked by CORS policy
```

**Causa Raiz:**

- Configuração CORS não permite origem do frontend
- Backend não está aceitando credenciais

**Solução:**

**1. Verificar configuração CORS em `backend/src/main.ts`:**

```typescript
app.enableCors({
  origin: "http://localhost:3100", // URL do frontend
  credentials: true, // Permite cookies/headers
});
```

**2. Verificar variável de ambiente do frontend:**

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3101
```

**3. Reiniciar ambos os serviços:**

```bash
docker-compose restart backend frontend
```

---

### Problema 3: TypeORM connection error

**Sintomas:**

```
Error: ECONNREFUSED 127.0.0.1:5432
Connection terminated unexpectedly
```

**Causa Raiz:**

- PostgreSQL não está rodando
- Credenciais incorretas
- Porta incorreta

**Solução:**

**1. Verificar se PostgreSQL está rodando:**

```bash
docker ps | grep postgres
```

**2. Verificar configuração de conexão em `backend/.env`:**

```bash
DB_HOST=postgres       # Nome do serviço no docker-compose
DB_PORT=5432           # Porta interna do container
DB_USERNAME=invest_user
DB_PASSWORD=invest_password
DB_DATABASE=invest_db
```

**3. Testar conexão manualmente:**

```bash
docker exec -it invest_postgres psql -U invest_user -d invest_db
```

**4. Reiniciar container PostgreSQL:**

```bash
docker-compose restart postgres
```

---

### Problema 3.1: Timeout Crônico em Assets/SELIC (DEFINITIVO) ✅ RESOLVIDO

**Data da Solução:** 2025-11-25
**Commit:** `be76c07` (Assets) / `0bb3e8c` (SELIC)

**Sintomas:**

- `GET /assets` demorando > 30s ou timeout (504 Gateway Timeout)
- `GET /economic-indicators/SELIC` falhando com timeout
- Dashboard lento ou travando

**Causa Raiz:**

- **Assets:** Query `findAll` carregando histórico de preços completo (milhares de linhas) para cada ativo (N+1 query gigante).
- **SELIC:** Tentativa de buscar dados desde 1996 a cada request, sem cache ou com cache ineficiente.

**Solução Definitiva:**

1. **Assets (Otimização de Query):**

   - Removido `relations: ['priceHistory']` do `findAll`
   - Criado endpoint específico para histórico: `GET /assets/:ticker/price-history`
   - `findAll` agora retorna apenas dados cadastrais + último preço (`currentPrice`)
   - **Resultado:** Tempo de resposta 30s+ → < 200ms 🚀

2. **SELIC (Retry Logic + Otimização):**
   - Implementado `RetryService` com backoff exponencial
   - Reduzido range de busca padrão (apenas dados recentes se histórico já existe)
   - Melhorado tratamento de erro da API do Banco Central

**Arquivos Modificados:**

- `backend/src/api/assets/assets.service.ts`
- `backend/src/api/economic-indicators/economic-indicators.service.ts`

---

## 🔵 PROBLEMAS DE FRONTEND

### Problema 4: Frontend não conecta ao backend

**Sintomas:**

```

Error: Network Error - ERR_CONNECTION_REFUSED

```

**Causa Raiz:**

- Backend não está rodando
- URL da API incorreta
- Porta incorreta

**Solução:**

**1. Verificar se backend está rodando:**

```bash
docker ps | grep invest_backend
```

**2. Verificar variável de ambiente:**

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3101
```

**3. Testar endpoint manualmente:**

```bash
curl http://localhost:3101/health
# Resultado esperado: {"status":"ok"}
```

**4. Verificar logs do backend:**

```bash
docker logs invest_backend --tail 50
```

---

### Problema 5: Build do Next.js falha

**Sintomas:**

```
Type error: Property 'x' does not exist on type 'Y'
```

**Causa Raiz:**

- Erro de tipagem TypeScript
- Import incorreto
- Componente com props inválidas

**Solução:**

**1. Validar TypeScript:**

```bash
cd frontend
npx tsc --noEmit
```

**2. Limpar cache do Next.js:**

```bash
rm -rf .next
npm run build
```

**3. Verificar imports:**

- Imports absolutos devem usar `@/` (configurado em `tsconfig.json`)

```typescript
// ✅ Correto
import { api } from "@/lib/api";

// ❌ Incorreto
import { api } from "../../../lib/api";
```

---

### Problema 6: Página retorna 404

**Sintomas:**

- Página não encontrada (404)
- Rota funciona em dev mas não em produção

**Causa Raiz:**

- Arquivo não está no local correto
- Nome do arquivo/pasta incorreto
- Dynamic route mal configurada

**Solução:**

**1. Verificar estrutura de pastas do App Router:**

```
app/
├── (dashboard)/          # Route group (não afeta URL)
│   ├── assets/
│   │   └── page.tsx     # → /assets
│   └── portfolio/
│       └── page.tsx     # → /portfolio
└── login/
    └── page.tsx         # → /login
```

**2. Verificar nome dos arquivos:**

- `page.tsx` → Página renderizável
- `layout.tsx` → Layout da rota
- `loading.tsx` → Estado de loading
- `error.tsx` → Estado de erro

**3. Rebuild e reiniciar:**

```bash
npm run build
docker-compose restart frontend
```

---

## 🟢 PROBLEMAS DE SCRAPERS

### Problema 7: Scraper retorna dados vazios

**Sintomas:**

````
ScraperResult { data: {}, confidence: 0.0 }
### Problema 11: Dados inconsistentes

**Sintomas:**

- Análises com `confidence_score = 0`
- Preços com `change_percent = NULL`
- Relacionamentos quebrados

**Causa Raiz:**

- Scrapers retornando dados ruins
- Bug na lógica de cross-validation
- Falha na atualização de preços

**Solução:**

**1. Executar script de limpeza:**

```bash
cd backend
npm run script:cleanup-analyses
````

**2. Validar integridade de dados:**

```sql
-- Verificar análises sem confiança
SELECT COUNT(*) FROM analyses WHERE confidence_score = 0;

-- Verificar preços sem variação
SELECT COUNT(*) FROM asset_prices WHERE change_percent IS NULL;

-- Verificar relacionamentos quebrados
SELECT a.* FROM analyses a
LEFT JOIN assets ast ON a.asset_id = ast.id
WHERE ast.id IS NULL;
```

**3. Criar backup antes de correções:**

```bash
docker exec invest_postgres pg_dump -U invest_user invest_db > backup.sql
```

---

### Problema 12: Performance lenta de queries

**Sintomas:**

- Queries demoram > 5 segundos
- Dashboard carrega lentamente
- Timeout em listagens

**Causa Raiz:**

- Falta de indexes
- Queries N+1
- Dados históricos sem limit

**Solução:**

**1. Verificar indexes existentes:**

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

**2. Criar indexes faltantes:**

```sql
-- Exemplo: Index para query frequente
CREATE INDEX idx_asset_prices_date ON asset_prices(date);
CREATE INDEX idx_asset_prices_asset_date ON asset_prices(asset_id, date);
```

**3. Analisar query plan:**

```sql
EXPLAIN ANALYZE
SELECT * FROM asset_prices
WHERE asset_id = 'uuid-do-ativo'
ORDER BY date DESC
LIMIT 1;
```

**4. Otimizar queries N+1:**

```typescript
// ❌ N+1 Query
const analyses = await analysisRepo.find();
for (const analysis of analyses) {
  analysis.asset = await assetRepo.findOne(analysis.assetId);
}

// ✅ Eager Loading
const analyses = await analysisRepo.find({
  relations: ["asset"],
});
```

---

## 🟣 PROBLEMAS DE DOCKER

### Problema 13: Container não inicia

**Sintomas:**

```
Error: Container invest_postgres exited with code 1
Error: Container invest_backend restarting
```

**Causa Raiz:**

- Porta já em uso
- Volume corrompido
- Erro de configuração
- Memória insuficiente

**Solução:**

**1. Verificar logs do container:**

```bash
docker logs invest_postgres
docker logs invest_backend --tail 50
```

**2. Verificar portas em uso:**

```bash
# Windows
netstat -ano | findstr :3101
netstat -ano | findstr :5532

# Linux/Mac
lsof -i :3101
lsof -i :5532
```

**3. Verificar volume:**

```bash
docker volume inspect invest_postgres_data
```

**4. Recriar container (⚠️ DADOS PERDIDOS):**

```bash
docker-compose down
docker volume rm invest_postgres_data
docker-compose up -d
```

**5. Verificar recursos do Docker:**

- Docker Desktop → Settings → Resources
- Memória mínima: 4GB
- CPU mínima: 2 cores

---

### Problema 14: Docker build falha

**Sintomas:**

```
ERROR [internal] load metadata for docker.io/library/node:20
failed to solve: node:20: failed to resolve source metadata
```

**Causa Raiz:**

- Sem conexão com internet
- Registry do Docker inacessível
- Cache corrompido

**Solução:**

**1. Verificar conexão:**

```bash
ping docker.io
```

**2. Limpar cache do Docker:**

```bash
docker system prune -a
```

**3. Rebuild sem cache:**

```bash
docker-compose build --no-cache
```

**4. Especificar registry mirror (se necessário):**

```json
// daemon.json (Docker Desktop → Settings → Docker Engine)
{
  "registry-mirrors": ["https://mirror.gcr.io"]
}
```

---

## 🔶 PROBLEMAS DE WEBSOCKET

### Problema 15: WebSocket não conecta

**Sintomas:**

```
WebSocket connection failed
WebSocket is closed before the connection is established
```

**Causa Raiz:**

- URL incorreta
- Backend não tem Gateway configurado
- CORS bloqueando conexão

**Solução:**

**1. Verificar URL do WebSocket:**

```typescript
// frontend/lib/api.ts ou similar
const socket = io("http://localhost:3101", {
  transports: ["websocket", "polling"],
});
```

**2. Verificar variável de ambiente:**

```bash
# frontend/.env.local
NEXT_PUBLIC_WS_URL=http://localhost:3101
```

**3. Verificar Gateway no backend:**

```typescript
// backend/src/websocket/websocket.gateway.ts
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3100',
    credentials: true,
  },
})
```

**4. Testar conexão manualmente:**

```javascript
// Console do browser (F12)
const socket = io("http://localhost:3101");
socket.on("connect", () => console.log("Connected!"));
socket.on("error", (err) => console.error("Error:", err));
```

---

### Problema 16: WebSocket desconecta frequentemente

**Sintomas:**

- Conexão estabelecida mas cai após alguns segundos
- Reconnect loops

**Causa Raiz:**

- Timeout muito curto
- Backend reiniciando
- Problema de rede

**Solução:**

**1. Aumentar timeout:**

```typescript
const socket = io("http://localhost:3101", {
  reconnectionDelay: 1000,
  reconnection: true,
  reconnectionAttempts: 10,
  timeout: 10000,
});
```

**2. Implementar ping/pong:**

```typescript
// Backend Gateway
@WebSocketGateway()
export class WebSocketGateway {
  @SubscribeMessage("ping")
  handlePing(): string {
    return "pong";
  }
}

// Frontend
setInterval(() => {
  socket.emit("ping");
}, 30000); // Ping a cada 30s
```

**3. Verificar estabilidade do backend:**

```bash
docker stats invest_backend
# CPU deve estar < 80%
# Memória deve estar < 80%
```

---

### Problema 17: OAuth Manager - DNS resolution quebrada (api-service) ✅ RESOLVIDO

**Sintomas:**

```
Frontend: Network Error
Console: Failed to load resource: net::ERR_EMPTY_RESPONSE
api-service logs: could not translate host name "postgres" to address: Temporary failure in name resolution
```

**Causa Raiz:**

- **`docker-compose.yml` (linha 260):** `network_mode: "service:scrapers"`
- Compartilhamento de stack de rede quebra resolução DNS do Docker
- api-service não consegue resolver hostnames "postgres" e "redis"

**Diagnóstico:**

```bash
# Scrapers consegue resolver:
$ docker exec invest_scrapers sh -c "getent hosts postgres"
172.25.0.2      postgres

# api-service NÃO consegue:
$ docker exec invest_api_service sh -c "getent hosts postgres"
Exit code 2  # Falha na resolução
```

**Solução Definitiva:**

Usar IPs diretos ao invés de hostnames:

```yaml
# docker-compose.yml
api-service:
  environment:
    # Database - Using IP because network_mode breaks DNS resolution
    # NOTE: IPs are from invest_network, may change if network is recreated
    - DB_HOST=172.25.0.2 # ANTES: postgres
    - DB_PORT=5432
    - DB_USERNAME=invest_user
    - DB_PASSWORD=invest_password
    - DB_DATABASE=invest_db

    # Redis - Using IP because network_mode breaks DNS resolution
    - REDIS_HOST=172.25.0.3 # ANTES: redis
    - REDIS_PORT=6379
```

**Obter IPs da rede:**

```bash
docker network inspect invest-claude-web_invest_network --format='{{range .Containers}}{{.Name}}: {{.IPv4Address}} {{end}}'

# Resultado:
# invest_postgres: 172.25.0.2/16
# invest_redis: 172.25.0.3/16
# invest_backend: 172.25.0.4/16
# invest_scrapers: 172.25.0.5/16
```

**Validação:**

```bash
docker-compose restart api-service
docker-compose logs api-service | grep -E "Database|Redis"
# ✅ Connected to database: 172.25.0.2:5432/invest_db
# ✅ Connected to Redis: 172.25.0.3:6379
```

**Comportamento Esperado Após Fix:**

- ✅ api-service conecta ao PostgreSQL via IP
- ✅ api-service conecta ao Redis via IP
- ✅ Health check HTTP 200 OK
- ✅ 27 scrapers registered

**Notas Importantes:**

- **IPs são fixos dentro da rede Docker** (mesmo após restart dos containers)
- **IPs só mudam se a rede for recriada** (`docker-compose down -v`)
- Se IPs mudarem, atualizar `docker-compose.yml` e reiniciar api-service

---

### Problema 18: OAuth Manager - Timeout frontend (60s HTTP request) ✅ RESOLVIDO

**Sintomas:**

```
Frontend Alert: "timeout of 60000ms exceeded"
Backend logs: [NAVIGATE] ✓ Navegação concluída em 67.74s
```

**Causa Raiz:**

- **Backend timeout**: 120s (Selenium - fix aplicado no commit 8115ce1)
- **Frontend timeout**: 60s (axios HTTP request)
- **ADVFN carregamento**: 67.74s
- **Resultado**: Backend sucesso, mas frontend dá timeout aos 60s

**Timeline do Problema:**

1. Backend inicia navegação ADVFN
2. Backend carrega página em 64.67s
3. Backend aguarda 3s → Total: 67.74s
4. Frontend timeout axios aos 60s → **ERRO**
5. Backend retorna resposta **depois** do timeout frontend

**Solução Definitiva:**

Aumentar timeout axios para 150s:

```typescript
// frontend/src/lib/api.ts (linha 295)
private getOAuthClient() {
  return axios.create({
    baseURL: OAUTH_BASE_URL,
    timeout: 150000, // ANTES: 60000 (60s)
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
```

**Justificativa 150s:**

- Backend timeout Selenium: 120s
- ADVFN tempo real: ~67s
- Margem de segurança: +30s
- **Total**: 150s

**Validação:**

```bash
cd frontend && npx tsc --noEmit
# ✅ 0 erros

docker-compose restart frontend
# ✅ Container healthy
```

**Comportamento Esperado Após Fix:**

- ✅ Frontend aguarda até 150s
- ✅ ADVFN (67s) carrega sem timeout
- ✅ Sites lentos (até 120s) funcionam
- ✅ Sem erro "timeout of 60000ms exceeded"

**Tabela Comparativa:**
| Métrica | ANTES | DEPOIS |
|---------|-------|--------|
| Backend timeout | 120s | 120s (sem mudança) |
| Frontend timeout | 60s | 150s |
| ADVFN carregamento | 67s (timeout frontend) | 67s (sucesso) |

---

## 📚 RECURSOS ADICIONAIS

### Documentação do Projeto

- **`ARCHITECTURE.md`** - Arquitetura completa do sistema
- **`DATABASE_SCHEMA.md`** - Schema do banco de dados
- **`ROADMAP.md`** - Histórico de desenvolvimento
- **`claude.md`** - Instruções para Claude Code
- **`README.md`** - Documentação pública

### Documentação Externa

- **NestJS:** https://docs.nestjs.com
- **Next.js:** https://nextjs.org/docs
- **TypeORM:** https://typeorm.io
- **BullMQ:** https://docs.bullmq.io
- **Shadcn/ui:** https://ui.shadcn.com
- **Docker:** https://docs.docker.com
- **PostgreSQL:** https://www.postgresql.org/docs

### Ferramentas de Debug

**Backend:**

```bash
# Logs em tempo real
docker logs -f invest_backend

# Executar comando dentro do container
docker exec -it invest_backend sh

# Verificar variáveis de ambiente
docker exec invest_backend env
```

**Frontend:**

```bash
# Logs em tempo real
docker logs -f invest_frontend

# Build local (fora do Docker)
cd frontend
npm run dev
```

**Database:**

```bash
# Acessar psql
docker exec -it invest_postgres psql -U invest_user -d invest_db

# Backup
docker exec invest_postgres pg_dump -U invest_user invest_db > backup.sql

# Restore
cat backup.sql | docker exec -i invest_postgres psql -U invest_user -d invest_db
```

### Checklist de Diagnóstico Geral

Quando enfrentar um problema desconhecido, siga este checklist:

- [ ] **1. Verificar logs:** `docker logs <container_name>`
- [ ] **2. Verificar status:** `docker ps -a`
- [ ] **3. Verificar rede:** `docker network inspect invest_network`
- [ ] **4. Verificar volumes:** `docker volume ls`
- [ ] **5. Verificar variáveis de ambiente:** `.env` files
- [ ] **6. Verificar portas:** `netstat -ano` (Windows) ou `lsof -i` (Unix)
- [ ] **7. Verificar TypeScript:** `npx tsc --noEmit`
- [ ] **8. Verificar build:** `npm run build`
- [ ] **9. Limpar cache:** `rm -rf node_modules .next dist` e reinstalar
- [ ] **10. Reiniciar serviços:** `docker-compose restart`

### Suporte

Se nenhuma das soluções acima resolver o problema:

1. **Verificar issues abertas:** https://github.com/adrianolucasdepaula/invest/issues
2. **Criar nova issue** com:
   - Descrição detalhada do problema
   - Logs completos (backend + frontend)
   - Passos para reproduzir
   - Ambiente (SO, Docker version, Node version)
3. **Consultar documentação complementar** nos arquivos `.md` do projeto

---

**Última atualização:** 2025-11-14
**Mantido por:** Claude Code (Sonnet 4.5)
