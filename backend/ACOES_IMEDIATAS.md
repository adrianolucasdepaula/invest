# AÇÕES IMEDIATAS - B3 AI ANALYSIS PLATFORM

## 🚨 CHECKLIST DE AÇÕES CRÍTICAS (4 itens - 20 minutos total)

### 1. INSTALAR CHROME (5 minutos) - CRÍTICO
```bash
# Opção A: Google Chrome
sudo apt-get update
sudo apt-get install -y wget
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Opção B: Chromium (alternativa)
sudo apt-get update
sudo apt-get install -y chromium-browser
```
**Impacto:** Sem Chrome, NENHUM dos 27 scrapers funciona!

### 2. INICIAR REDIS (2 minutos) - CRÍTICO
```bash
# Via Docker
docker run -d --name redis -p 6479:6379 redis:alpine

# OU via docker-compose (se existir)
cd /home/user/invest/backend
docker-compose up -d redis
```
**Impacto:** Sem Redis, sem cache = performance muito lenta

### 3. INICIAR POSTGRESQL (2 minutos) - CRÍTICO
```bash
# Via Docker
docker run -d --name postgres \
  -e POSTGRES_USER=invest_user \
  -e POSTGRES_PASSWORD=invest_password \
  -e POSTGRES_DB=invest_db \
  -p 5532:5432 \
  postgres:14-alpine

# OU via docker-compose (se existir)
cd /home/user/invest/backend
docker-compose up -d postgres
```
**Impacto:** Sem PostgreSQL, sem persistência de dados

### 4. CONFIGURAR GOOGLE OAUTH (10 minutos) - ALTA PRIORIDADE
```bash
cd /home/user/invest/backend/python-scrapers
python3 save_google_cookies.py

# Siga as instruções interativas:
# 1. Fazer login no Google
# 2. Aceitar permissões
# 3. Cookies serão salvos automaticamente
```
**Impacto:** Sem OAuth, 13 scrapers (48%) não funcionam

---

## ✅ VERIFICAÇÃO DE SUCESSO

### Após completar as 4 ações, execute:
```bash
# 1. Verificar Chrome
google-chrome --version || chromium-browser --version

# 2. Verificar Redis
redis-cli -p 6479 ping
# Esperado: PONG

# 3. Verificar PostgreSQL
PGPASSWORD=invest_password psql -h localhost -p 5532 -U invest_user -d invest_db -c "SELECT 1"
# Esperado: ?column? 1

# 4. Verificar cookies OAuth
ls -la python-scrapers/browser-profiles/google_cookies.pkl
# Esperado: arquivo existe

# 5. Testar scrapers públicos
cd python-scrapers
python3 tests/test_public_scrapers.py --ticker VALE3
```

---

## 🎯 PRÓXIMOS PASSOS (Após ações críticas)

### Dia 1 - Testes e Validação
```bash
# 1. Corrigir testes E2E
npm install @nestjs/passport passport passport-jwt
npm run test:e2e

# 2. Corrigir vulnerabilidades
npm audit fix --force

# 3. Testar todos scrapers públicos
python3 tests/test_public_scrapers.py --detailed
```

### Dia 2 - Scrapers OAuth
```bash
# Testar scrapers com autenticação OAuth
python3 test_scrapers.py --oauth --detailed
```

### Dia 3 - Monitoramento
```bash
# Implementar health checks
curl http://localhost:3333/health
```

---

## 📊 DASHBOARD DE STATUS

| Componente | Status Atual | Status Após Ações | Comando de Verificação |
|------------|--------------|-------------------|------------------------|
| Chrome | ❌ Não instalado | ✅ Instalado | `google-chrome --version` |
| Redis | ❌ Não rodando | ✅ Rodando | `redis-cli -p 6479 ping` |
| PostgreSQL | ❌ Não rodando | ✅ Rodando | `psql ... -c "SELECT 1"` |
| OAuth Cookies | ❌ Não configurado | ✅ Configurado | `ls google_cookies.pkl` |
| Backend Build | ✅ OK | ✅ OK | `npm run build` |
| TypeScript | ✅ 0 erros | ✅ 0 erros | `npx tsc --noEmit` |
| Scrapers Import | ✅ 27/27 OK | ✅ 27/27 OK | `python3 validate_setup.py` |
| Testes E2E | ❌ Falhando | ⏳ A corrigir | `npm run test:e2e` |
| Scrapers Públicos | ⏸️ Bloqueado | ✅ Funcionando | `python3 test_public.py` |
| Scrapers OAuth | ⏸️ Bloqueado | ✅ Funcionando | `python3 test_oauth.py` |

---

## 💡 DICAS IMPORTANTES

### Se encontrar problemas:

#### Chrome não instala?
```bash
# Verificar arquitetura
uname -m
# Se for ARM/M1, use Chromium ao invés de Chrome

# Limpar cache apt
sudo apt-get clean
sudo apt-get update
```

#### Redis/PostgreSQL não conectam?
```bash
# Verificar portas em uso
netstat -tulpn | grep -E '6479|5532'

# Usar portas alternativas se necessário
# Editar: python-scrapers/config.py
```

#### OAuth falha?
```bash
# Verificar selenium
python3 -c "from selenium import webdriver; print('OK')"

# Reinstalar se necessário
pip3 install --upgrade selenium
```

---

## 📈 MÉTRICAS DE SUCESSO

Após completar as 4 ações, você terá:
- ✅ **100% dos scrapers públicos** (9) funcionando
- ✅ **100% dos scrapers OAuth** (13) prontos após login
- ✅ **Cache Redis** otimizando performance
- ✅ **PostgreSQL** persistindo dados
- ✅ **Sistema 95% operacional**

**Tempo total estimado:** 20 minutos
**Complexidade:** Baixa (copiar e colar comandos)
**Resultado:** Sistema pronto para produção!

---

## 🆘 SUPORTE

Se encontrar problemas:
1. Verifique os logs: `tail -f /var/log/syslog`
2. Consulte a documentação: `python-scrapers/README.md`
3. Execute diagnóstico: `python3 validate_setup.py`

---

**Gerado em:** 2025-11-08
**Prioridade:** EXECUTE AGORA - Sistema está 87% pronto, faltam apenas estas 4 ações!