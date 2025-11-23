# 🚀 B3 AI Analysis Platform - Guia Rápido de Desenvolvimento

## ⚡ INÍCIO RÁPIDO (1 comando!)

```bash
./start-dev.sh
```

Esse comando inicia TUDO automaticamente:
- ✅ PostgreSQL
- ✅ Redis
- ✅ Backend NestJS (porta 3101)
- ✅ Frontend Next.js (porta 3000)

## 🤖 AI AGENT WORKFLOWS (NOVO)

O projeto agora suporta workflows automatizados via Antigravity Agent:

- **`/scaffold-resource`**: Cria novos recursos NestJS (Controller, Service, DTOs).
- **`/code-review`**: Análise de código e sugestões de melhoria.
- **`/test-frontend`**: Executa testes E2E no frontend.
- **`/db-migration`**: Executa migrações do banco de dados.
- **`/reset-db`**: Reseta o banco de dados (Drop + Sync + Seed).

Para usar, basta digitar o comando no chat com o agente.

## 🛑 PARAR O AMBIENTE

```bash
./stop-dev.sh
```

## 📋 REQUISITOS

- ✅ Node.js 20+ (instalado)
- ✅ PostgreSQL 16 (instalado)
- ✅ Redis 7+ (instalado)
- ✅ npm (instalado)

## 🌐 ACESSOS

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface principal |
| **Backend API** | http://localhost:3101 | API REST |
| **API Docs** | http://localhost:3101/api/docs | Documentação Swagger |
| **Health Check** | http://localhost:3101/api/v1/health | Status do backend |
| **Dashboard** | http://localhost:3000/dashboard | Dashboard principal |

## 📝 LOGS

```bash
# Backend
tail -f /tmp/backend.log

# Frontend
tail -f /tmp/frontend.log
```

## 🔧 CONFIGURAÇÃO

### Backend (.env)
```bash
cd backend
cat .env.example > .env
# Editar se necessário
```

### Frontend (.env.local)
```bash
cd frontend
cat .env.example > .env.local
# Editar se necessário
```

## 📊 STATUS DO SISTEMA

✅ **COMPLETO (95%):**
- Backend NestJS rodando
- Frontend Next.js rodando
- PostgreSQL configurado
- Redis configurado
- Migrations executadas
- 12 tabelas criadas
- 0 erros TypeScript
- 1 vulnerabilidade (xlsx - sem fix disponível)

⚠️ **LIMITAÇÕES CONHECIDAS:**
- Chrome/Chromium não disponível (scrapers requerem Chrome)
- Alguns endpoints retornam 500 (banco vazio - normal)

## 🧪 TESTES

```bash
# Backend - Testes unitários
cd backend
npm run test

# Backend - Testes E2E
npm run test:e2e

# Backend - Coverage
npm run test:cov

# Frontend - Testes Playwright
cd frontend
npm run test
```

## 📚 DOCUMENTAÇÃO COMPLETA

- [DESENVOLVIMENTO_LOCAL.md](./DESENVOLVIMENTO_LOCAL.md) - Guia completo de configuração
- [ATUALIZACAO_DEPENDENCIAS.md](./ATUALIZACAO_DEPENDENCIAS.md) - Histórico de atualizações

## 🐛 TROUBLESHOOTING

### Backend não conecta

```bash
# Verificar se PostgreSQL e Redis estão rodando
pg_isready
redis-cli ping

# Reiniciar serviços
service postgresql restart
redis-server --daemonize yes --port 6379
```

### Frontend não carrega

```bash
# Verificar logs
tail -f /tmp/frontend.log

# Reinstalar dependências
cd frontend
rm -rf node_modules .next
npm install
```

### Portas em uso

```bash
# Ver o que está usando as portas
lsof -i :3000  # Frontend
lsof -i :3101  # Backend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

## 💡 DICAS

1. **Sempre use os scripts automatizados** (`start-dev.sh` e `stop-dev.sh`)
2. **Verifique os logs** se algo não funcionar
3. **PostgreSQL e Redis devem estar rodando** antes do backend
4. **Hot reload está habilitado** - mudanças no código recarregam automaticamente

## 📞 SUPORTE

- Issues: [GitHub Issues](https://github.com/seu-repo/issues)
- Docs: http://localhost:3101/api/docs (com sistema rodando)

---

**Última atualização:** 2025-11-08
**Versão:** 1.0.0
**Status:** ✅ Pronto para desenvolvimento
