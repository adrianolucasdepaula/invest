# 📖 Referência Rápida - B3 AI Analysis Platform

**Última atualização:** 2025-11-07
**Versão:** 2.0
**Status:** ✅ Sistema em Produção

---

## 🚀 Início Rápido

### Windows (PowerShell)
```powershell
# Iniciar sistema
.\system-manager.ps1 start

# Parar sistema
.\system-manager.ps1 stop

# Ver status
.\system-manager.ps1 status

# Ver logs
.\system-manager.ps1 logs backend
```

### Linux/Mac (Bash)
```bash
# Iniciar sistema
./system-manager.sh start

# Parar sistema
./system-manager.sh stop

# Ver status
./system-manager.sh status

# Ver logs
./system-manager.sh logs backend
```

---

## 🌐 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3100 | Interface principal |
| **Backend API** | http://localhost:3101 | API REST |
| **API Docs** | http://localhost:3101/api/docs | Documentação Swagger |
| **Health Check** | http://localhost:3101/api/v1/health | Status do sistema |
| **PgAdmin** | http://localhost:5150 | Admin PostgreSQL (dev) |
| **Redis Commander** | http://localhost:8181 | Admin Redis (dev) |

---

## 🐳 Comandos Docker

### Gerenciamento Básico
```bash
# Ver containers em execução
docker ps

# Ver todos os containers (incluindo parados)
docker ps -a

# Ver logs de um serviço
docker logs invest_backend -f

# Executar comando em container
docker exec -it invest_backend sh

# Verificar health status
docker inspect --format='{{.State.Health.Status}}' invest_backend
```

### Limpeza
```bash
# Parar e remover containers + volumes
docker-compose down -v

# Remover imagens (depois do down)
docker rmi invest_backend invest_frontend invest_scrapers

# Limpar sistema completo (libera espaço)
docker system prune -a --volumes
```

---

## 📂 Estrutura de Diretórios

```
invest/
├── backend/                    # Backend NestJS
│   ├── src/api/               # Controllers e rotas
│   ├── python-scrapers/       # Scrapers Python
│   └── Dockerfile
├── frontend/                   # Frontend Next.js
│   ├── src/app/               # App Router
│   └── Dockerfile
├── database/                   # Scripts SQL
│   ├── init.sql               # Inicialização
│   └── postgresql.conf        # Configurações
├── logs/                       # Logs da aplicação
├── uploads/                    # Arquivos enviados
├── reports/                    # Relatórios gerados
├── docker-compose.yml          # Orquestração
└── system-manager.ps1          # Script de gerenciamento
```

---

## ⚙️ Configuração (.env)

### Variáveis Essenciais
```env
# Banco de Dados
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=invest_user
DB_PASSWORD=invest_password
DB_DATABASE=invest_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRATION=7d

# Portas
APP_PORT=3101
PORT=3101
WEBSOCKET_PORT=3102
```

### Variáveis Opcionais
```env
# Google OAuth (opcional - sistema funciona sem)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# APIs Externas
BRAPI_API_KEY=mVcy3EFZaBdza27tPQjdC1
```

---

## 🔍 Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
docker logs invest_backend --tail 100

# Verificar health check
docker inspect invest_backend | grep -A 10 Health

# Reconstruir imagem
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Porta em uso
```bash
# Windows
netstat -ano | findstr :3101
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3101
kill -9 <PID>
```

### Backend com erro "nest: not found"
```bash
# Verificar se entrypoint instalou dependências
docker logs invest_backend | grep "Installing dependencies"

# Se não, reconstruir
docker-compose down -v
docker-compose build --no-cache backend
docker-compose up -d
```

### Google OAuth falhando
✅ **Comportamento esperado!** O sistema desabilita automaticamente Google OAuth se as credenciais não estiverem configuradas. Você verá:
```
⚠️  Google OAuth disabled - GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not configured
```

### Database não inicializa
```bash
# Verificar se init.sql existe
ls database/init.sql

# Verificar logs do PostgreSQL
docker logs invest_postgres

# Recriar volume (PERDE DADOS!)
docker-compose down -v
docker-compose up -d postgres
```

---

## 🧪 Testes

### Backend
```bash
cd backend
npm test                    # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Com coverage
```

### Frontend
```bash
cd frontend
npm test                    # Unit tests
npx playwright test        # E2E tests
npx playwright show-report # Ver relatório
```

---

## 📊 Monitoramento

### Ver uso de recursos
```bash
docker stats --no-stream
```

### Ver logs em tempo real
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend

# Últimas 100 linhas
docker-compose logs --tail=100 backend
```

### Verificar saúde do sistema
```bash
# Health check da API
curl http://localhost:3101/api/v1/health

# Status de todos os containers
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🔧 Comandos Úteis

### Atualizar sistema
```bash
# Pull do Git
git pull origin claude/b3-ai-analysis-platform-011CUqhhHmDLCpG3Za3ppFeU

# Reinstalar dependências se houve mudanças
cd backend && npm ci
cd ../frontend && npm ci

# Rebuild e restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Backup do banco
```bash
# Exportar dados
docker exec invest_postgres pg_dump -U invest_user invest_db > backup.sql

# Restaurar dados
docker exec -i invest_postgres psql -U invest_user invest_db < backup.sql
```

### Resetar sistema completamente
```bash
# CUIDADO! Perde TODOS os dados
docker-compose down -v
docker rmi invest_backend invest_frontend invest_scrapers
docker volume prune -f
docker-compose up -d
```

---

## 📚 Documentação Completa

| Documento | Descrição |
|-----------|-----------|
| **README.md** | Visão geral do projeto |
| **CLEAN_INSTALL.md** | Guia de instalação do zero (Windows) |
| **GETTING_STARTED.md** | Guia de início rápido |
| **DOCKER_DEPLOYMENT.md** | Deployment com Docker (produção) |
| **SYSTEM_REVIEW.md** | Revisão técnica do sistema |
| **CRITICAL_FIXES_IMPLEMENTED.md** | Correções críticas aplicadas |
| **INTEGRATION_GUIDE.md** | Guia de integração |
| **VSCODE_CLAUDE_CODE_GUIDE.md** | Guia VS Code + Claude |

---

## 🆘 Suporte

### Checklist de Debug
- [ ] Docker Desktop está rodando?
- [ ] Todos os containers estão "Up"? (`docker ps`)
- [ ] Há erros nos logs? (`docker-compose logs`)
- [ ] Portas estão livres? (3100, 3101, 5532, 6479)
- [ ] .env está configurado?
- [ ] Arquivos essenciais existem? (init.sql, postgresql.conf)

### Contatos
- **Issues:** GitHub Issues
- **Documentação:** Ver `/docs` e arquivos .md na raiz

---

## ⚡ Comandos do System Manager

### PowerShell (system-manager.ps1)
```powershell
.\system-manager.ps1 start          # Inicia sistema
.\system-manager.ps1 stop           # Para sistema
.\system-manager.ps1 restart        # Reinicia sistema
.\system-manager.ps1 status         # Status dos containers
.\system-manager.ps1 health         # Verifica saúde
.\system-manager.ps1 logs backend   # Ver logs
.\system-manager.ps1 build          # Build imagens
.\system-manager.ps1 clean          # Limpa sistema
.\system-manager.ps1 help           # Ajuda
```

### Recursos Automáticos
- ✅ Detecta atualizações do Git
- ✅ Instala dependências automaticamente
- ✅ Valida arquivos essenciais
- ✅ Aguarda health checks reais
- ✅ Detecta e oferece limpeza de problemas
- ✅ Mostra status em tempo real

---

## 🎯 Workflow de Desenvolvimento

### Dia a Dia
```bash
# Manhã - Iniciar sistema
./system-manager.ps1 start

# Durante o dia - desenvolvimento com hot reload
# Edite arquivos em ./backend ou ./frontend
# Mudanças refletem automaticamente

# Ver logs durante desenvolvimento
./system-manager.ps1 logs backend

# Noite - Parar sistema
./system-manager.ps1 stop
```

### Após mudanças em package.json
```bash
# Backend
cd backend && npm ci
docker-compose restart backend

# Frontend
cd frontend && npm ci
docker-compose restart frontend
```

### Após mudanças em Dockerfile
```bash
# Rebuild completo
docker-compose build --no-cache
docker-compose up -d
```

---

## 📝 Notas Importantes

### Hot Reload
✅ Código fonte é montado via volume:
- `./backend:/app` - Backend com hot reload
- `./frontend:/app` - Frontend com hot reload
- `node_modules` isolados via named volumes

### Node Modules
✅ Dependências instaladas dentro do container via entrypoint script:
- Garante compatibilidade Linux/Windows
- Instalação automática na primeira execução
- Atualização automática se package.json mudar

### Google OAuth
✅ Opcional - sistema funciona sem configurar:
- Se não configurado: desabilitado automaticamente
- Nenhum erro ou crash
- Log informativo: `⚠️ Google OAuth disabled`

### TimescaleDB
✅ Configurado automaticamente:
- Extension instalada via init.sql
- Configurações via postgresql.conf
- Otimizado para séries temporais

---

**Versão do Documento:** 2.0
**Última revisão:** 2025-11-07
**Compatível com:** Docker Desktop 20.10+, Node.js 20+, Windows 10/11, Linux, macOS
