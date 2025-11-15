# Testing Guide - B3 AI Analysis Platform

**Última Atualização:** 2025-11-15
**Versão:** 1.0.0

---

## 📋 ÍNDICE

1. [Credenciais de Teste](#credenciais-de-teste)
2. [Dados de Teste](#dados-de-teste)
3. [Ambientes de Teste](#ambientes-de-teste)
4. [Testes Manuais](#testes-manuais)
5. [Testes Automatizados](#testes-automatizados)

---

## 🔐 CREDENCIAIS DE TESTE

### Usuário Admin Padrão

**IMPORTANTE:** Este usuário é criado automaticamente ao executar `npm run seed`.

```
📧 Email: admin@invest.com
🔑 Senha: Admin@123
✅ Status: Ativo
✅ Email Verificado: Sim
🎨 Tema: Dark
🌐 Idioma: pt-BR
```

### Criação Manual

Se o seed não foi executado, você pode criar o usuário admin manualmente:

```bash
# Via npm (recomendado)
docker exec invest_backend npm run seed

# Via SQL direto (não recomendado)
docker exec invest_postgres psql -U invest_user -d invest_db -c "
  INSERT INTO users (
    id,
    email,
    password,
    first_name,
    last_name,
    is_active,
    is_email_verified,
    preferences,
    created_at,
    updated_at
  ) VALUES (
    uuid_generate_v4(),
    'admin@invest.com',
    '\$2b\$10\$YourBcryptHashHere',
    'Admin',
    'System',
    true,
    true,
    '{\"language\":\"pt-BR\",\"theme\":\"dark\"}',
    NOW(),
    NOW()
  );
"
```

**Nota:** Para gerar hash bcrypt:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('Admin@123', 10);
console.log(hash);
```

---

## 📊 DADOS DE TESTE

### Ativos Disponíveis

O seed cria automaticamente os seguintes ativos:

**Top 20 B3 (IBOV - 2024):**
- `PETR4` - Petrobras PN
- `VALE3` - Vale ON
- `ITUB4` - Itaú Unibanco PN
- `BBDC4` - Bradesco PN
- `BBAS3` - Banco do Brasil ON
- `ABEV3` - Ambev ON
- `WEGE3` - WEG ON
- `B3SA3` - B3 ON
- `RENT3` - Localiza ON
- `PETR3` - Petrobras ON
- `MGLU3` - Magazine Luiza ON
- `SUZB3` - Suzano ON
- `JBSS3` - JBS ON
- `LREN3` - Lojas Renner ON
- `RADL3` - Raia Drogasil ON
- `VIVT3` - Telefônica Brasil ON
- `GGBR4` - Gerdau PN
- `RAIL3` - Rumo ON
- `KLBN11` - Klabin Units
- `EMBR3` - Embraer ON

### Portfolio de Teste

Você pode criar um portfolio de teste com:

1. Acesse: http://localhost:3100/portfolios
2. Clique em "Criar Portfolio"
3. Use dados mock:
   - Nome: "Portfolio Teste"
   - Descrição: "Portfolio para testes"
   - Adicione ativos: PETR4 (100 ações), VALE3 (200 ações), ITUB4 (300 ações)

---

## 🌐 AMBIENTES DE TESTE

### Desenvolvimento Local

```bash
Frontend: http://localhost:3100
Backend API: http://localhost:3101/api/v1
Python Service: http://localhost:8001
PostgreSQL: localhost:5532
Redis: localhost:6479
PgAdmin: http://localhost:5150
VNC Viewer (Scrapers): http://localhost:6080
```

### Docker Compose

```bash
# Iniciar ambiente de teste
docker-compose up -d

# Verificar se todos os serviços estão healthy
docker-compose ps

# Rodar seed
docker exec invest_backend npm run seed

# Parar ambiente
docker-compose down
```

---

## 🧪 TESTES MANUAIS

### 1. Teste de Login

**Pré-requisitos:**
- Backend rodando (http://localhost:3101)
- Frontend rodando (http://localhost:3100)
- Usuário admin seedado

**Passos:**
1. Acesse http://localhost:3100/login
2. Digite:
   - Email: `admin@invest.com`
   - Senha: `Admin@123`
3. Clique em "Entrar"
4. Deve redirecionar para http://localhost:3100/dashboard

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Token JWT armazenado em cookie
- ✅ Dashboard carregado sem erros
- ✅ 0 erros no console do navegador

---

### 2. Teste de Análise de Ativos

**Passos:**
1. Faça login como admin
2. Acesse http://localhost:3100/analysis
3. Digite ticker: `VALE3`
4. Selecione tipo: "Análise Completa"
5. Clique em "Analisar"

**Resultado Esperado:**
- ✅ Análise iniciada (~30-60s)
- ✅ Confiança ≥ 40% (nunca 0%)
- ✅ Recomendação: BUY/HOLD/SELL
- ✅ Tooltip de confiança funcionando
- ✅ Detalhes JSON combinado (fundamental + técnica)
- ✅ 6 fontes utilizadas

---

### 3. Teste de Gráfico Candlestick

**Passos:**
1. Faça login como admin
2. Acesse http://localhost:3100/assets/PETR4
3. Aguarde carregar dados históricos

**Resultado Esperado:**
- ✅ Gráfico candlestick renderizado
- ✅ Volume em barras no rodapé
- ✅ Seletor de período (1mo, 3mo, 6mo, 1y, 2y, 5y, max)
- ✅ Dark mode aplicado
- ✅ Tooltip ao passar mouse
- ✅ 0 erros no console

---

### 4. Teste de Python Service

**Passos:**
1. Via curl:
```bash
curl http://localhost:8001/health
```

2. Verificar response:
```json
{
  "status": "healthy",
  "service": "python-technical-analysis",
  "version": "1.0.0",
  "dependencies": {
    "pandas_ta_classic": "available"
  }
}
```

**Resultado Esperado:**
- ✅ HTTP 200
- ✅ `pandas_ta_classic: available`
- ✅ Timestamp atual

---

## 🤖 TESTES AUTOMATIZADOS

### Testes E2E (Playwright)

```bash
# Instalar Playwright (se ainda não instalou)
npx playwright install

# Rodar testes E2E
npm run test:e2e

# Rodar teste específico
npx playwright test tests/analysis.spec.ts

# Modo UI (interativo)
npx playwright test --ui
```

**Testes Disponíveis:**
- `login.spec.ts` - Teste de autenticação
- `analysis.spec.ts` - Teste de análise completa
- `assets.spec.ts` - Teste de detalhes de ativos
- `portfolios.spec.ts` - Teste de gerenciamento de portfolios

---

### Testes Unitários (Backend)

```bash
cd backend

# Rodar todos os testes
npm run test

# Rodar com coverage
npm run test:cov

# Rodar teste específico
npm run test -- scrapers.service.spec.ts
```

---

### Testes de Integração (Backend + Postgres)

```bash
cd backend

# Rodar testes E2E do backend
npm run test:e2e
```

---

## 📸 VALIDAÇÃO VISUAL

### Checklist de Validação Manual

Após cada mudança crítica, capture screenshots:

```bash
# Usando Playwright MCP
npx playwright test --headed --screenshot=on

# Screenshots salvos em: .playwright-mcp/
```

**Páginas para validar:**
- [ ] `/login` - Login page
- [ ] `/dashboard` - Dashboard principal
- [ ] `/analysis` - Página de análises
- [ ] `/assets/PETR4` - Detalhes de ativo
- [ ] `/portfolios` - Gerenciamento de portfolios
- [ ] `/oauth-manager` - OAuth manager

**Estados para validar:**
- [ ] Loading state
- [ ] Success state
- [ ] Error state
- [ ] Empty state
- [ ] Dark mode
- [ ] Responsividade (mobile/tablet/desktop)

---

## 🐛 TROUBLESHOOTING

### Usuário Admin Não Aparece

```bash
# Verificar se usuário existe
docker exec invest_postgres psql -U invest_user -d invest_db \
  -c "SELECT * FROM users WHERE email = 'admin@invest.com';"

# Se não existir, rodar seed
docker exec invest_backend npm run seed

# Se já existir mas senha incorreta, resetar senha
docker exec invest_postgres psql -U invest_user -d invest_db \
  -c "UPDATE users SET password = '\$2b\$10\$YourNewBcryptHash' WHERE email = 'admin@invest.com';"
```

### Login Falha Sempre

1. Verificar logs do backend:
```bash
docker-compose logs -f backend | grep -i "auth\|login\|error"
```

2. Verificar se JWT_SECRET está configurado:
```bash
docker exec invest_backend printenv | grep JWT_SECRET
```

3. Verificar console do navegador (F12)

### Análise Retorna 0% Confiança

Este problema foi corrigido na FASE 28. Se ainda ocorrer:

1. Verificar logs do backend:
```bash
docker-compose logs -f backend | grep -i "confidence\|scraper"
```

2. Verificar se Python Service está healthy:
```bash
curl http://localhost:8001/health
```

3. Verificar fontes de dados ativas:
```bash
docker exec invest_postgres psql -U invest_user -d invest_db \
  -c "SELECT name, status FROM data_sources WHERE status = 'active';"
```

---

## 📚 REFERÊNCIAS

- **INSTALL.md** - Instalação completa do projeto
- **ARCHITECTURE.md** - Arquitetura e stack tecnológica
- **TROUBLESHOOTING.md** - 16+ problemas comuns
- **ROADMAP.md** - Histórico de desenvolvimento
- **CLAUDE.md** - Metodologia Claude Code

---

## 🔄 ATUALIZAÇÃO

**Data da Última Revisão:** 2025-11-15

**Mudanças Recentes:**
- ✅ Adicionado usuário admin padrão (admin@invest.com / Admin@123)
- ✅ Seed automatizado no `npm run seed`
- ✅ Instruções de validação visual
- ✅ Troubleshooting de problemas comuns

---

**Mantido por:** Claude Code (Sonnet 4.5)
**Versão:** 1.0.0
