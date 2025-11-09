# Guia de Troubleshooting - Frontend

Este guia te ajuda a identificar e reportar erros específicos do frontend.

## ✅ Correções Aplicadas

### 1. Logout Implementado
- ✅ Botão "Sair" adicionado no Header (canto superior direito)
- ✅ Função de logout limpa cookie e redireciona para login

### 2. Perfil do Usuário
- ✅ Nome real do usuário mostrado no Header
- ✅ Avatar com iniciais na Sidebar
- ✅ Email e nome completo na Sidebar
- ✅ Dados buscados via API (`/api/v1/auth/me`)

---

## 🔍 Como Identificar Erros

### Passo 1: Atualizar Código e Reiniciar

```powershell
# Atualizar código
git fetch origin
git pull origin claude/continue-development-011CUw8hP5PSczzaKeJyY6KF

# Reiniciar frontend
docker-compose restart frontend

# Aguardar alguns segundos
Start-Sleep -Seconds 5

# Abrir dashboard
Start-Process "http://localhost:3100/login"
```

### Passo 2: Abrir DevTools

1. Pressione `F12` no navegador
2. Vá para a aba **Console**
3. Faça login e navegue para o dashboard

### Passo 3: Verificar Erros no Console

Procure por mensagens de erro em **vermelho**. Exemplos:

```
❌ Erro comum 1:
Error: Cannot find module '@/components/...'
  at webpack-internal...

❌ Erro comum 2:
TypeError: Cannot read property 'map' of undefined
  at DashboardPage...

❌ Erro comum 3:
Failed to fetch
  GET http://localhost:3101/api/v1/... 404 Not Found
```

### Passo 4: Verificar Aba Network

1. Vá para a aba **Network** no DevTools
2. Filtre por **Fetch/XHR**
3. Recarregue a página
4. Procure por requisições em **vermelho** (status 4xx ou 5xx)

---

## 📋 Checklist de Verificação

### ✅ Autenticação
- [ ] Login funciona e redireciona para `/dashboard`
- [ ] Cookie `access_token` é criado (ver em Application > Cookies)
- [ ] Nome do usuário aparece no Header (canto superior direito)
- [ ] Botão "Sair" está visível no Header

### ✅ Dashboard
- [ ] Página `/dashboard` carrega sem erros
- [ ] Sidebar aparece à esquerda com menu de navegação
- [ ] Header aparece no topo com busca e botão de logout
- [ ] Dados do usuário aparecem na parte inferior da Sidebar

### ✅ Componentes Visuais
- [ ] Cards de estatísticas aparecem (Ibovespa, Ativos, etc)
- [ ] Não há mensagens de erro no console
- [ ] Skeleton/loading aparece ao carregar dados

---

## 🐛 Erros Conhecidos e Soluções

### Erro 1: "Cannot read property 'firstName' of undefined"

**Causa:** API não retornou dados do usuário

**Solução:**
```powershell
# Verificar se backend está respondendo
Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/me" `
  -Headers @{Authorization = "Bearer SEU_TOKEN_AQUI"}

# Se retornar erro, verificar logs do backend
docker-compose logs backend --tail=50
```

### Erro 2: "404 Not Found" em chamadas API

**Causa:** Endpoints do backend podem não existir ou estarem com URL errada

**Solução:**
```powershell
# Verificar endpoints disponíveis no backend
docker-compose logs backend | Select-String "Mapped"
```

### Erro 3: "Module not found: Can't resolve '@/components/...'"

**Causa:** Componente não existe ou caminho está errado

**Para reportar este erro**, me envie:
1. Caminho completo do erro (ex: `@/components/charts/market-chart`)
2. Screenshot do erro no console

### Erro 4: Página em branco ou travada

**Diagnóstico:**
```powershell
# Ver logs do frontend
docker-compose logs frontend --tail=100

# Procurar por erros de compilação
docker-compose logs frontend | Select-String "ERROR"
```

---

## 📝 Como Reportar Erros para Mim

Para que eu possa te ajudar melhor, me envie:

### 1. Mensagens do Console
```
Copie e cole as mensagens de erro do console (F12 > Console)
```

### 2. Erros de Network
```
Liste as requisições que falharam (F12 > Network > vermelho)
Ex: GET http://localhost:3101/api/v1/assets 404
```

### 3. Logs do Frontend
```powershell
# Execute este comando e me envie a saída
docker-compose logs frontend --tail=50 | Select-String "ERROR\|error\|fail"
```

### 4. Screenshot (Opcional)
Tire um print da tela mostrando:
- O erro no console
- A página visível
- As requisições com falha

---

## 🔧 Comandos Úteis de Debugging

### Ver todos os logs do frontend em tempo real
```powershell
docker-compose logs -f frontend
```

### Ver erros específicos
```powershell
docker-compose logs frontend | Select-String "ERROR\|Failed\|Error"
```

### Rebuild frontend (se necessário)
```powershell
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Verificar se todos os serviços estão ok
```powershell
.\system-manager.ps1 status
```

### Testar API manualmente
```powershell
# Fazer login
$login = Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"email":"adriano.lucas.paula@gmail.com","password":"senha12345"}'

$token = $login.token

# Testar perfil
Invoke-RestMethod -Uri "http://localhost:3101/api/v1/auth/me" `
  -Headers @{Authorization = "Bearer $token"}

# Testar ativos
Invoke-RestMethod -Uri "http://localhost:3101/api/v1/assets" `
  -Headers @{Authorization = "Bearer $token"}
```

---

## ✨ Mudanças Mais Recentes

### Commit: `b3c6719` - Logout e Perfil
- ✅ Botão de logout no Header
- ✅ Dados reais do usuário
- ✅ Avatar com iniciais
- ✅ Loading states

### Commit: `0d71e28` - Redirecionamento
- ✅ Login redireciona para dashboard
- ✅ Cookie com path correto

### Commit: `3e25e76` - Documentação
- ✅ Guia de atualização da branch

---

## 🎯 Próximos Passos

1. **Atualizar e reiniciar:**
   ```powershell
   git pull origin claude/continue-development-011CUw8hP5PSczzaKeJyY6KF
   docker-compose restart frontend
   ```

2. **Fazer login e testar:**
   ```powershell
   Start-Process "http://localhost:3100/login"
   ```

3. **Verificar console (F12)** para erros

4. **Me reportar erros específicos** usando o formato acima

---

**Nota:** Com as informações específicas dos erros, posso corrigir os problemas exatos que você está enfrentando!
