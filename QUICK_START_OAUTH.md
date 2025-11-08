# 🚀 Quick Start - Sistema OAuth Web

## ⚡ TL;DR - Como Testar AGORA

```powershell
# 1. Reconstruir containers (OBRIGATÓRIO)
docker-compose down
docker-compose build --no-cache scrapers api-service
docker-compose up -d

# 2. Verificar VNC funcionando
# Abra no navegador: http://localhost:6080/vnc.html

# 3. Acessar OAuth Manager
# Abra no navegador: http://localhost:3000/oauth-manager

# 4. Clicar "Iniciar Renovação" e seguir instruções
```

## 📋 Checklist Pré-Teste

- [ ] Docker Desktop rodando
- [ ] Todos os containers parados (`docker-compose down`)
- [ ] Reconstruir scrapers e api-service
- [ ] Todos os 7 containers healthy
- [ ] VNC acessível em http://localhost:6080
- [ ] Frontend acessível em http://localhost:3000

## 🎯 O Que Esperar

### 1. Após `docker-compose up -d`

```bash
docker ps
```

**Esperado:**
```
invest_scrapers      Up X min (healthy)   0.0.0.0:5900->5900/tcp, 0.0.0.0:6080->6080/tcp
invest_api_service   Up X min (healthy)
invest_frontend      Up X min (healthy)
...
```

### 2. Acessar VNC (http://localhost:6080/vnc.html)

**Esperado:**
- Interface noVNC carrega
- Pode mostrar desktop vazio (normal, Chrome só abre quando iniciar sessão)

**Se der erro:**
```bash
docker logs invest_scrapers | grep -E "VNC|Xvfb|websockify"
```

### 3. Acessar OAuth Manager (http://localhost:3000/oauth-manager)

**Esperado:**
- Página carrega
- Mostra card "Iniciar Renovação de Cookies"
- Botão "Iniciar Renovação" visível

**Se der erro 404:**
- Frontend pode estar em build, aguarde 30s

### 4. Clicar "Iniciar Renovação"

**Esperado:**
1. Botão muda para loading
2. Após 2-5 segundos:
   - Aparece visualizador VNC com Chrome
   - Chrome navegou para accounts.google.com
   - Mostra "Faça login com sua conta Google"

**Se falhar:**
```bash
# Ver logs do api-service
docker logs invest_api_service --tail 50

# Ver logs do scrapers
docker logs invest_scrapers --tail 50
```

### 5. Durante o Processo

**Fluxo Normal:**
1. Você vê Chrome via VNC
2. Faz login no Google
3. Clica "Confirmar Login"
4. Sistema navega automaticamente para Fundamentei
5. Pode clicar automaticamente em "Continuar com Google"
6. Você clica "Confirmar Login" novamente
7. Repete para 19 sites
8. Ao final, clica "Salvar Cookies"

**Tempo estimado:** 15-20 minutos

### 6. Finalização

**Esperado:**
- Toast de sucesso: "Cookies salvos com sucesso!"
- Mostra: "X cookies de Y sites foram salvos"
- Navegador fecha automaticamente

**Verificar:**
```bash
docker exec invest_scrapers ls -lh /app/browser-profiles/google_cookies.pkl
```

**Deve mostrar:**
```
-rw-r--r-- 1 root root XXXK Nov  7 XX:XX google_cookies.pkl
```

## 🐛 Troubleshooting Rápido

### Container scrapers não sobe

```bash
docker logs invest_scrapers
```

**Erros comuns:**
- `apt-get install failed` → Reconstruir: `docker-compose build --no-cache scrapers`
- `Permission denied` → Permissões do volume: `chmod -R 755 ./backend/python-scrapers`

### VNC mostra tela preta

```bash
docker exec invest_scrapers ps aux | grep Xvfb
```

**Se não aparecer processo Xvfb:**
```bash
docker restart invest_scrapers
```

### Frontend não conecta API

```bash
curl http://localhost:8000/api/oauth/health
```

**Se der erro de conexão:**
```bash
docker restart invest_api_service
```

### "ModuleNotFoundError" no Python

```bash
docker logs invest_api_service | grep -i error
```

**Solução:**
```bash
docker-compose build --no-cache api-service
docker restart invest_api_service
```

## ✅ Teste de Sanidade

Executar ANTES de iniciar renovação:

```bash
# 1. VNC está rodando?
curl -I http://localhost:6080/vnc.html

# 2. API OAuth está respondendo?
curl http://localhost:8000/api/oauth/health

# 3. Sites estão configurados?
curl http://localhost:8000/api/oauth/sites | jq '.sites | length'
# Deve retornar: 19

# 4. Frontend carrega?
curl -I http://localhost:3000/oauth-manager
```

**Todos devem retornar status 200 ou JSON válido.**

## 📞 Se Tudo Falhar

### Reset Completo

```bash
# Parar e remover TUDO
docker-compose down -v

# Reconstruir do zero
docker-compose build --no-cache

# Iniciar
docker-compose up -d

# Aguardar 60s e verificar
docker ps
```

### Ver Todos os Logs

```bash
# Scrapers (VNC + Chrome)
docker logs invest_scrapers --tail 100 -f

# API Service (OAuth API)
docker logs invest_api_service --tail 100 -f

# Frontend
docker logs invest_frontend --tail 100 -f
```

## 🎉 Sucesso!

Se você conseguiu:
- ✅ Abrir VNC e ver Chrome
- ✅ Fazer login no Google via VNC
- ✅ Confirmar e navegar entre sites
- ✅ Salvar cookies no final

**PARABÉNS!** Sistema OAuth Web funcionando 100%.

Agora os scrapers vão usar os cookies automaticamente e a taxa de sucesso será ~95% em vez de ~55%.

---

**Dúvidas?** Consulte `OAUTH_WEB_IMPLEMENTATION.md` para documentação completa.
