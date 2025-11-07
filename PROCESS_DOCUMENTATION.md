# 📋 Documentação de Processos - B3 AI Analysis Platform

**Última atualização:** 2025-11-07
**Versão do Sistema:** 2.0
**Status:** ✅ Produção

---

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Scripts de Gerenciamento](#scripts-de-gerenciamento)
3. [Processos Automáticos](#processos-automáticos)
4. [Fluxo de Desenvolvimento](#fluxo-de-desenvolvimento)
5. [Processo de Deploy](#processo-de-deploy)
6. [Manutenção e Monitoramento](#manutenção-e-monitoramento)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### Estado Atual do Sistema

| Aspecto | Status | Descrição |
|---------|--------|-----------|
| **Confiabilidade** | 95% ✅ | Sistema robusto com health checks reais |
| **Feedback** | 90% ✅ | Mensagens claras e em tempo real |
| **Tratamento de Erros** | 85% ✅ | Validações e falhas graceful |
| **Monitoramento** | 95% ✅ | Health checks em todos os serviços |
| **Documentação** | 100% ✅ | Completa e atualizada |

### Serviços Operacionais

| Serviço | Container | Porta | Health Check |
|---------|-----------|-------|--------------|
| PostgreSQL | invest_postgres | 5532 | ✅ pg_isready |
| Redis | invest_redis | 6479 | ✅ redis-cli ping |
| Backend | invest_backend | 3101, 3102 | ✅ HTTP /api/v1/health |
| Frontend | invest_frontend | 3100 | ✅ HTTP / |
| Scrapers | invest_scrapers | - | ✅ Redis connection |

---

## 🛠️ Scripts de Gerenciamento

### system-manager.ps1 (Windows PowerShell)

#### Funcionalidades Implementadas

```powershell
# Comandos Principais
.\system-manager.ps1 start          # Inicia o sistema completo
.\system-manager.ps1 stop           # Para todos os serviços
.\system-manager.ps1 restart        # Reinicia o sistema
.\system-manager.ps1 status         # Mostra status dos containers
.\system-manager.ps1 health         # Verifica health checks
.\system-manager.ps1 logs <service> # Mostra logs de um serviço
.\system-manager.ps1 build          # Rebuild das imagens Docker
.\system-manager.ps1 clean          # Limpa containers e volumes
.\system-manager.ps1 help           # Mostra ajuda
```

#### Funções Críticas Implementadas

**1. Wait-ForHealthy** (Linha 321)
```powershell
function Wait-ForHealthy {
    param([int]$MaxWaitSeconds = 120)

    # Verifica health check REAL de cada serviço
    # Mostra status em tempo real
    # Timeout configurável
    # Retorna $true/$false
}
```

**Características:**
- ✅ Verifica health status real via Docker
- ✅ Mostra progresso em tempo real
- ✅ Timeout configurável (padrão: 120s)
- ✅ Retorna status booleano

**2. Test-EssentialFiles** (Linha 393)
```powershell
function Test-EssentialFiles {
    # Valida 7 arquivos essenciais
    # Cria database/init.sql se não existir
    # Cria diretórios necessários (logs, uploads, reports)
    # Retorna $true/$false
}
```

**Arquivos Validados:**
1. `docker-compose.yml`
2. `backend/package.json`
3. `frontend/package.json`
4. `backend/Dockerfile`
5. `frontend/Dockerfile`
6. `backend/python-scrapers/Dockerfile`
7. `backend/python-scrapers/requirements.txt`

**Diretórios Criados Automaticamente:**
- `logs/`
- `uploads/`
- `reports/`
- `browser-profiles/`
- `database/` (se não existir)

**3. Test-Prerequisites** (Verifica pré-requisitos)
```powershell
function Test-Prerequisites {
    # Verifica Docker instalado
    # Verifica Docker Compose instalado
    # Verifica Docker daemon rodando
    # Verifica Node.js instalado
    # Verifica npm instalado
}
```

**4. Test-Updates** (Verifica atualizações)
```powershell
function Test-Updates {
    # Faz git fetch
    # Compara local vs remoto
    # Mostra commits disponíveis
    # Oferece fazer pull
}
```

### system-manager.sh (Linux/Mac Bash)

#### Funcionalidades Equivalentes

Todas as funcionalidades do PowerShell foram portadas para Bash:
- ✅ `wait_for_healthy` (linha 252)
- ✅ `test_essential_files` (linha 321)
- ✅ `test_prerequisites`
- ✅ `check_updates`

---

## ⚙️ Processos Automáticos

### 1. Inicialização do Sistema (start)

**Fluxo Completo:**

```
1. Verificar Pré-requisitos
   ├── Docker instalado?
   ├── Docker daemon rodando?
   ├── Node.js instalado?
   └── npm instalado?

2. Verificar Atualizações Git
   ├── Fazer git fetch
   ├── Comparar local vs remoto
   └── Oferecer pull se houver atualizações

3. Verificar Arquivos Essenciais
   ├── Validar 7 arquivos críticos
   ├── Criar database/init.sql se necessário
   └── Criar diretórios (logs, uploads, etc.)

4. Detectar Problemas em Containers
   ├── Verificar containers com status "unhealthy"
   ├── Verificar containers com status "Exited"
   └── Oferecer limpeza automática (docker-compose down -v)

5. Verificar Dependências (node_modules)
   ├── Backend: verificar se node_modules existe
   ├── Frontend: verificar se node_modules existe
   └── Oferecer instalação se necessário

6. Verificar Imagens Docker
   ├── Verificar se invest_backend existe
   ├── Verificar se invest_frontend existe
   ├── Verificar se invest_scrapers existe
   └── Oferecer build se necessário

7. Iniciar Containers
   └── docker-compose up -d

8. Aguardar Health Checks (até 120s)
   ├── Status em tempo real:
   │   ✓ postgres | ✓ redis | ⏳ backend (iniciando) | ⏳ frontend | ⏳ scrapers
   └── Só mostra "sucesso" quando TODOS estiverem healthy

9. Mostrar URLs de Acesso
   ├── Frontend: http://localhost:3100
   ├── Backend: http://localhost:3101
   └── API Docs: http://localhost:3101/api/docs
```

**Tempo Estimado:**
- Primeira vez (com build): 8-12 minutos
- Subsequentes: 30-60 segundos

### 2. Parada do Sistema (stop)

**Fluxo:**
```
1. docker-compose down
2. Aguardar containers pararem completamente (até 30s)
3. Confirmar parada
```

**Tempo Estimado:** 5-10 segundos

### 3. Limpeza do Sistema (clean)

**Fluxo Interativo:**
```
1. Mostrar aviso (dados serão perdidos)
2. Pedir confirmação
3. docker-compose down -v (remove volumes)
4. Oferecer remover imagens também
5. Se aceito: docker rmi invest_backend invest_frontend invest_scrapers
```

**⚠️ ATENÇÃO:** Perde TODOS os dados do banco!

---

## 🔄 Fluxo de Desenvolvimento

### Desenvolvimento Diário

```bash
# 1. Manhã - Iniciar sistema
.\system-manager.ps1 start

# 2. Desenvolvimento
# - Edite arquivos em ./backend ou ./frontend
# - Hot reload automático (mudanças refletem imediatamente)
# - Logs em tempo real: .\system-manager.ps1 logs backend

# 3. Teste de mudanças
# - Frontend: http://localhost:3100
# - Backend: http://localhost:3101/api/docs
# - Health: http://localhost:3101/api/v1/health

# 4. Noite - Parar sistema
.\system-manager.ps1 stop
```

### Após Mudanças em package.json

```bash
# Opção 1: Reinstalar dentro do container (rápido)
docker exec invest_backend npm ci
docker-compose restart backend

# Opção 2: Rebuild completo (garante limpeza)
.\system-manager.ps1 build
.\system-manager.ps1 restart
```

### Após Mudanças em Dockerfile

```bash
# Rebuild obrigatório
docker-compose build --no-cache <service>
docker-compose up -d <service>

# Ou via script
.\system-manager.ps1 build
.\system-manager.ps1 restart
```

### Após git pull

```bash
# 1. Pull do código
git pull origin <branch>

# 2. Script detecta automaticamente
.\system-manager.ps1 start
# Oferece: instalar dependências? (y/n)
# Oferece: rebuild imagens? (y/n)
```

---

## 🚀 Processo de Deploy

### Deploy para Produção (Docker)

**Pré-requisitos:**
- Servidor com Docker instalado
- Acesso SSH ao servidor
- Variáveis de ambiente configuradas

**Processo:**

```bash
# 1. No servidor, clonar repositório
git clone <repo> /opt/invest
cd /opt/invest

# 2. Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Editar com valores de produção

# 3. Build das imagens (perfil production)
docker-compose build

# 4. Iniciar serviços
docker-compose --profile production up -d

# 5. Verificar health
docker ps
docker-compose logs -f

# 6. Testar
curl http://localhost:3101/api/v1/health
```

### Atualização em Produção

```bash
# 1. Backup do banco (IMPORTANTE!)
docker exec invest_postgres pg_dump -U invest_user invest_db > backup_$(date +%Y%m%d).sql

# 2. Pull do código
git pull

# 3. Rebuild (se necessário)
docker-compose build

# 4. Restart com downtime mínimo
docker-compose up -d

# 5. Verificar saúde
docker-compose ps
docker-compose logs -f backend
```

### Rollback

```bash
# 1. Voltar para commit anterior
git checkout <commit-anterior>

# 2. Rebuild
docker-compose build

# 3. Restart
docker-compose up -d

# 4. Restaurar banco se necessário
docker exec -i invest_postgres psql -U invest_user invest_db < backup.sql
```

---

## 📊 Manutenção e Monitoramento

### Health Checks Automáticos

**Configuração (docker-compose.yml):**

```yaml
postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U invest_user"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 10s

backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3101/api/v1/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
```

**Verificação Manual:**
```bash
# Ver health de todos
docker ps

# Ver health de um específico
docker inspect --format='{{.State.Health.Status}}' invest_backend

# Logs de health check
docker inspect invest_backend | grep -A 20 Health
```

### Monitoramento de Recursos

```bash
# Ver uso de CPU/RAM/Rede em tempo real
docker stats

# Ver uso de um serviço específico
docker stats invest_backend

# Ver uso de disco (volumes)
docker system df
```

### Logs

```bash
# Logs em tempo real (todos)
docker-compose logs -f

# Logs de um serviço (últimas 100 linhas)
docker-compose logs --tail=100 backend

# Logs com timestamp
docker-compose logs -f --timestamps backend

# Buscar erros
docker-compose logs backend | grep -i error
```

### Backup Automático (Recomendado)

**Script de Backup (backup.sh):**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/backups/invest

# Criar diretório
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec invest_postgres pg_dump -U invest_user invest_db > $BACKUP_DIR/db_$DATE.sql

# Backup Redis
docker exec invest_redis redis-cli SAVE
docker cp invest_redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

# Comprimir
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/db_$DATE.sql $BACKUP_DIR/redis_$DATE.rdb

# Limpar arquivos antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completo: $BACKUP_DIR/backup_$DATE.tar.gz"
```

**Agendar com Cron:**
```bash
# Backup diário às 2h da manhã
0 2 * * * /opt/invest/backup.sh >> /var/log/invest-backup.log 2>&1
```

---

## 🔧 Troubleshooting

### Processo de Debug

**1. Identificar o Problema**
```bash
# Ver status de todos os containers
docker ps -a

# Ver logs com erros
docker-compose logs --tail=50 | grep -i error
```

**2. Verificar Health Checks**
```bash
# Health de cada serviço
docker inspect --format='{{.State.Health.Status}}' invest_postgres
docker inspect --format='{{.State.Health.Status}}' invest_redis
docker inspect --format='{{.State.Health.Status}}' invest_backend
docker inspect --format='{{.State.Health.Status}}' invest_frontend
docker inspect --format='{{.State.Health.Status}}' invest_scrapers
```

**3. Logs Detalhados**
```bash
# Ver últimos 200 logs do serviço com problema
docker logs invest_backend --tail=200

# Follow em tempo real
docker logs invest_backend -f
```

**4. Testar Conexões**
```bash
# Testar backend
curl -v http://localhost:3101/api/v1/health

# Testar PostgreSQL
docker exec invest_postgres pg_isready -U invest_user

# Testar Redis
docker exec invest_redis redis-cli ping
```

**5. Entrar no Container**
```bash
# Backend
docker exec -it invest_backend sh

# PostgreSQL
docker exec -it invest_postgres psql -U invest_user invest_db

# Redis
docker exec -it invest_redis redis-cli
```

### Problemas Comuns e Soluções

| Problema | Diagnóstico | Solução |
|----------|-------------|---------|
| Container não inicia | `docker logs <container>` | Verificar dependências, rebuild imagem |
| Unhealthy status | `docker inspect <container>` | Ver logs, verificar health check URL |
| Porta em uso | `netstat -ano \| findstr :3101` | Matar processo ou mudar porta |
| nest: not found | Ver entrypoint logs | Rebuild sem cache |
| Banco não conecta | `pg_isready` | Verificar credenciais .env |

---

## ✅ Checklist de Manutenção

### Diário
- [ ] Verificar health de todos os serviços
- [ ] Verificar logs por erros
- [ ] Monitorar uso de recursos

### Semanal
- [ ] Backup do banco de dados
- [ ] Limpar logs antigos
- [ ] Verificar atualizações disponíveis
- [ ] Testar restore de backup

### Mensal
- [ ] Revisar e otimizar consultas lentas
- [ ] Limpar dados antigos
- [ ] Atualizar dependências
- [ ] Revisar configurações de segurança

### Trimestral
- [ ] Auditoria de segurança
- [ ] Revisar documentação
- [ ] Teste de disaster recovery
- [ ] Otimização de performance

---

**Versão do Documento:** 1.0
**Última atualização:** 2025-11-07
**Próxima revisão:** 2025-12-07
**Responsável:** Equipe de Desenvolvimento
