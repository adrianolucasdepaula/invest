# 🖥️ GUIA DE DESENVOLVIMENTO LOCAL (SEM DOCKER)

## 📋 RESUMO EXECUTIVO

Este guia documenta a configuração completa do ambiente de desenvolvimento local **sem Docker**, usando PostgreSQL e Redis instalados diretamente no sistema.

**Status atual:**
- ✅ PostgreSQL 16 configurado e rodando
- ✅ Redis 7.0.15 configurado e rodando
- ✅ Banco de dados `invest_db` criado
- ✅ Migrations executadas com sucesso
- ✅ Backend NestJS funcionando na porta 3101
- ✅ 0 erros TypeScript
- ✅ 1 vulnerabilidade restante (xlsx - sem fix disponível)

---

## 🔧 SERVIÇOS CONFIGURADOS

### 1. PostgreSQL 16
- **Porta:** 5432
- **Banco:** invest_db
- **Usuário:** invest_user
- **Senha:** invest_password
- **SSL:** Desabilitado (desenvolvimento local)
- **Extensões instaladas:**
  - uuid-ossp (geração de UUIDs)
  - pg_trgm (busca por similaridade)

### 2. Redis 7.0.15
- **Porta:** 6379
- **Modo:** Standalone (sem autenticação)
- **Persistência:** Sim (AOF habilitado)

### 3. Backend NestJS
- **Porta:** 3101
- **Ambiente:** development
- **Hot Reload:** Habilitado
- **Health Check:** http://localhost:3101/api/v1/health

---

## ⚙️ CONFIGURAÇÃO REALIZADA

### 1. PostgreSQL

```bash
# Iniciar serviço
service postgresql start

# Verificar status
pg_isready

# Conectar ao banco
PGPASSWORD='invest_password' psql -U invest_user -h localhost -d invest_db
```

**Configurações modificadas:**
- `/etc/postgresql/16/main/postgresql.conf`:
  - `ssl = off` (desabilitado para desenvolvimento)

- `/etc/postgresql/16/main/pg_hba.conf`:
  - Conexões locais configuradas com `trust` para desenvolvimento

### 2. Redis

```bash
# Iniciar serviço
redis-server --daemonize yes --port 6379

# Verificar status
redis-cli ping
# Resposta esperada: PONG

# Monitor comandos
redis-cli monitor
```

### 3. Backend

**Arquivo criado:** `backend/.env`
```env
# Environment
NODE_ENV=development

# Server
APP_PORT=3101
PORT=3101

# Database PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=invest_user
DB_PASSWORD=invest_password
DB_DATABASE=invest_db
DB_SYNCHRONIZE=false
DB_LOGGING=true

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=change_this_in_production_min_32_chars_super_secret_key_2024
JWT_EXPIRATION=7d

# Scrapers
SCRAPER_HEADLESS=true
SCRAPER_CONCURRENT_JOBS=3
SCRAPER_RETRY_ATTEMPTS=3

# Cache
CACHE_TTL=300
```

**Migrations executadas:**
- InitialSchema1700000000000 ✅
  - Tabelas criadas: users, assets, asset_prices, fundamental_data, dividends, portfolios, portfolio_positions, transactions, watchlists, analyses, data_sources
  - Nota: Linha de TimescaleDB comentada para compatibilidade com PostgreSQL vanilla

---

## 🚀 COMANDOS PARA INICIAR O AMBIENTE

### Opção A: Script Completo (Copiar e Colar)

```bash
# Ir para o diretório do projeto
cd /home/user/invest

# Iniciar PostgreSQL
service postgresql start

# Iniciar Redis
redis-server --daemonize yes --port 6379

# Verificar serviços
pg_isready && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL FALHOU"
redis-cli ping && echo "✅ Redis OK" || echo "❌ Redis FALHOU"

# Iniciar backend
cd backend
npm run start:dev
```

### Opção B: Passo a Passo

**1. Iniciar serviços de infraestrutura:**
```bash
service postgresql start
redis-server --daemonize yes --port 6379
```

**2. Verificar que está tudo rodando:**
```bash
# PostgreSQL
pg_isready
# Esperado: /var/run/postgresql:5432 - accepting connections

# Redis
redis-cli ping
# Esperado: PONG
```

**3. Iniciar backend:**
```bash
cd /home/user/invest/backend
npm run start:dev
```

**4. Aguardar inicialização (~20 segundos) e testar:**
```bash
curl http://localhost:3101/api/v1/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T13:38:46.017Z",
  "uptime": 23.976522194,
  "environment": "development",
  "version": "1.0.0"
}
```

---

## 🔍 VERIFICAÇÃO E TROUBLESHOOTING

### Verificar Processos Rodando

```bash
# PostgreSQL
ps aux | grep postgres | grep -v grep

# Redis
ps aux | grep redis-server | grep -v grep

# Backend
ps aux | grep "nest start" | grep -v grep
```

### Verificar Portas em Uso

```bash
netstat -tuln | grep -E ":(5432|6379|3101)"
# OU
ss -tuln | grep -E ":(5432|6379|3101)"
```

### Logs do Backend

```bash
# Ver logs em tempo real
tail -f /tmp/backend.log

# Ver últimas 50 linhas
tail -50 /tmp/backend.log
```

### Problemas Comuns

**1. PostgreSQL não inicia:**
```bash
# Verificar logs
tail -100 /var/log/postgresql/postgresql-16-main.log

# Reconfigurar permissões
chmod 640 /etc/ssl/private/ssl-cert-snakeoil.key
chgrp postgres /etc/ssl/private/ssl-cert-snakeoil.key
```

**2. Redis não aceita conexões:**
```bash
# Matar processo antigo
pkill redis-server

# Iniciar novamente
redis-server --daemonize yes --port 6379
```

**3. Backend não conecta ao banco:**
```bash
# Testar conexão manual
PGPASSWORD='invest_password' psql -U invest_user -h localhost -d invest_db -c "SELECT 1"

# Verificar .env
cat backend/.env | grep DB_
```

---

## 📊 ESTRUTURA DO BANCO DE DADOS

### Tabelas Criadas

| Tabela | Descrição | Registros |
|--------|-----------|-----------|
| users | Usuários do sistema | 0 |
| assets | Ativos financeiros (ações, FIIs, ETFs) | 0 |
| asset_prices | Histórico de preços (série temporal) | 0 |
| fundamental_data | Dados fundamentalistas | 0 |
| dividends | Histórico de dividendos | 0 |
| portfolios | Carteiras de investimento | 0 |
| portfolio_positions | Posições nas carteiras | 0 |
| transactions | Transações (compra/venda) | 0 |
| watchlists | Listas de acompanhamento | 0 |
| analyses | Análises de IA | 0 |
| data_sources | Fontes de dados (scrapers) | 0 |
| migrations | Controle de migrations | 1 |

### Consultas Úteis

```sql
-- Verificar tabelas criadas
\dt

-- Verificar schema completo
\d+ users

-- Listar extensões instaladas
\dx

-- Verificar migrations executadas
SELECT * FROM migrations ORDER BY id DESC;
```

---

## 🔄 PRÓXIMOS PASSOS

### Desenvolvimento

1. **Frontend (Next.js):**
   ```bash
   cd /home/user/invest/frontend
   npm run dev
   # Porta padrão: 3000
   ```

2. **Python Scrapers:**
   ```bash
   cd /home/user/invest/backend/python-scrapers
   python3 validate_setup.py
   python3 test_public_scrapers.py --ticker VALE3
   ```

### Testes

```bash
# Backend - Testes Unitários
cd backend
npm run test

# Backend - Testes E2E
npm run test:e2e

# Backend - Coverage
npm run test:cov
```

### Produção

Para produção, recomenda-se:
1. Usar Docker Compose (conforme `docker-compose.yml`)
2. Habilitar SSL no PostgreSQL
3. Configurar senha no Redis
4. Usar variáveis de ambiente seguras
5. Habilitar TimescaleDB para otimização de séries temporais

---

## 📝 MODIFICAÇÕES REALIZADAS

### Arquivos Criados

- `backend/.env` - Configuração de ambiente
- `backend/DESENVOLVIMENTO_LOCAL.md` - Este arquivo

### Arquivos Modificados

- `backend/src/database/migrations/1700000000000-InitialSchema.ts`
  - Comentada linha 88-90: `create_hypertable` (TimescaleDB)
  - Motivo: Compatibilidade com PostgreSQL vanilla

- `backend/src/common/common.module.ts`
  - Migrado de `cache-manager-redis-yet` para `@tirke/node-cache-manager-ioredis`
  - Motivo: Deprecação do pacote antigo

- `/etc/postgresql/16/main/postgresql.conf`
  - `ssl = off` (desenvolvimento local)

- `/etc/postgresql/16/main/pg_hba.conf`
  - Configurado `trust` para conexões locais (desenvolvimento)

---

## 🌟 STATUS ATUAL DO PROJETO

### ✅ Completo

- [x] Dependências atualizadas (Fase 1 e 2)
- [x] Frontend TypeScript 0 erros
- [x] Backend TypeScript 0 erros
- [x] PostgreSQL configurado
- [x] Redis configurado
- [x] Banco de dados criado
- [x] Migrations executadas
- [x] Backend rodando e funcional
- [x] Health check operacional

### ⏳ Pendente

- [ ] Instalar Chrome/Chromium (para scrapers)
- [ ] Configurar OAuth cookies (13 scrapers OAuth)
- [ ] Frontend rodando
- [ ] Testes E2E passando
- [ ] Scrapers testados

### 🎯 Métricas

- **Build:** 0 erros TypeScript
- **Vulnerabilidades:** 1 (apenas xlsx - sem fix disponível)
- **Warnings npm:** 0 críticos
- **Tabelas no banco:** 12 (+ migrations)
- **APIs mapeadas:** 23 endpoints
- **Scrapers disponíveis:** 27 (9 públicos + 13 OAuth + 5 outros)

---

**Data de criação:** 2025-11-08
**Ambiente:** Development (Local sem Docker)
**Última atualização:** 2025-11-08 13:38 UTC
