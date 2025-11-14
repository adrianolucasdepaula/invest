# 🔧 TROUBLESHOOTING - B3 AI Analysis Platform

**Projeto:** B3 AI Analysis Platform (invest-claude-web)
**Última Atualização:** 2025-11-14
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
  origin: 'http://localhost:3100',  // URL do frontend
  credentials: true,                 // Permite cookies/headers
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
import { api } from '@/lib/api';

// ❌ Incorreto
import { api } from '../../../lib/api';
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
```
ScraperResult { data: {}, confidence: 0.0 }
```

**Causa Raiz:**
- Site mudou estrutura HTML
- Seletores CSS/XPath desatualizados
- Timeout muito curto
- OAuth expirado (para scrapers autenticados)

**Solução:**

**1. Verificar se site mudou estrutura:**
- Acessar site manualmente
- Inspecionar elementos (F12)
- Comparar seletores com código do scraper

**2. Rodar scraper manualmente para debug:**
```bash
# Via API (preferido)
curl -X POST http://localhost:3101/api/v1/scrapers/test/fundamentus \
  -H "Content-Type: application/json" \
  -d '{"ticker": "PETR4"}'

# Via npm (se disponível)
cd backend
npm run test:scraper -- PETR4
```

**3. Verificar logs do scraper:**
```bash
docker logs invest_backend | grep -i "scraper"
docker logs invest_backend | grep -i "PETR4"
```

**4. Atualizar seletores CSS/XPath:**
```typescript
// Exemplo: fundamentus.scraper.ts
const price = await this.page.$eval('.price-value', el => el.textContent);
// Se falhar, inspecionar elemento no site e atualizar seletor
```

**5. Aumentar timeout (se necessário):**
```typescript
// Em scraper específico
await this.page.goto(url, {
  waitUntil: 'networkidle2',
  timeout: 60000  // 60 segundos
});
```

---

### Problema 8: OAuth scraper não autentica

**Sintomas:**
```
Error: Not authenticated - Please complete OAuth login
```

**Causa Raiz:**
- Sessão OAuth expirada
- Cookies não salvos
- OAuth Manager não executado

**Solução:**

**1. Verificar se OAuth Manager está rodando:**
```bash
curl http://localhost:8000/health
```

**2. Renovar sessões OAuth:**
- Acessar: http://localhost:3100/oauth-manager
- Clicar em "Iniciar Renovação de Sessões OAuth"
- Seguir instruções no VNC viewer (http://localhost:6080)

**3. Verificar cookies salvos:**
```bash
# Windows
dir "data\cookies\"

# Linux/Mac
ls -la data/cookies/
```

**4. Logs do OAuth Manager:**
```bash
docker logs invest_api_service | grep -i oauth
```

---

### Problema 9: Scraper com taxa de sucesso baixa

**Sintomas:**
- Taxa de sucesso < 70%
- Métricas mostram muitas falhas

**Causa Raiz:**
- Site instável
- Validação muito restritiva
- Problemas de rede
- Outliers no cálculo de métricas

**Solução:**

**1. Analisar métricas no banco:**
```sql
SELECT
  scraper_id,
  success,
  response_time,
  error_message,
  created_at
FROM scraper_metrics
WHERE scraper_id = 'fundamentus'
ORDER BY created_at DESC
LIMIT 20;
```

**2. Relaxar validação (se apropriado):**
```typescript
// ANTES - Validação restritiva
validate(data): boolean {
  return data.ticker !== '' && data.price > 0;
}

// DEPOIS - Validação relaxada (aceita dados parciais)
validate(data): boolean {
  const filledFields = [
    data.price > 0,
    data.pl !== 0,
    data.pvp !== 0,
    // ... outros campos
  ].filter(Boolean).length;

  return data.ticker !== '' && filledFields >= 3;
}
```

**3. Filtrar outliers nas métricas:**
- Ver `FASE_26_MANUTENCAO_SCRAPERS.md` para exemplo completo
- Implementado em `scraper-metrics.service.ts`

---

## 🟡 PROBLEMAS DE DATABASE

### Problema 10: Migration falha

**Sintomas:**
```
QueryFailedError: column "change" already exists
QueryFailedError: relation "users" already exists
```

**Causa Raiz:**
- Migration já foi executada
- Alteração manual no banco
- Conflito de migrations

**Solução:**

**1. Verificar migrations executadas:**
```sql
SELECT * FROM migrations ORDER BY timestamp DESC;
```

**2. Reverter última migration:**
```bash
cd backend
npm run migration:revert
```

**3. Corrigir migration e re-executar:**
```bash
# Editar arquivo de migration
npm run migration:run
```

**4. Em caso de erro persistente, recriar banco (⚠️ DADOS PERDIDOS):**
```bash
docker-compose down
docker volume rm invest_postgres_data
docker-compose up -d postgres
npm run migration:run
```

---

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
```

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
  relations: ['asset']
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
const socket = io('http://localhost:3101', {
  transports: ['websocket', 'polling']
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
const socket = io('http://localhost:3101');
socket.on('connect', () => console.log('Connected!'));
socket.on('error', (err) => console.error('Error:', err));
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
const socket = io('http://localhost:3101', {
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
  @SubscribeMessage('ping')
  handlePing(): string {
    return 'pong';
  }
}

// Frontend
setInterval(() => {
  socket.emit('ping');
}, 30000); // Ping a cada 30s
```

**3. Verificar estabilidade do backend:**
```bash
docker stats invest_backend
# CPU deve estar < 80%
# Memória deve estar < 80%
```

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
