# Configuração do Google OAuth - Guia Completo

Este guia mostra como configurar o Google OAuth para permitir login com Google na plataforma.

## ❌ Erro Atual

```
Erro 400: redirect_uri_mismatch

Não é possível fazer login porque B3 AI Analysis Platform enviou uma
solicitação inválida.
```

**Causa:** A URL de callback configurada no Google Cloud Console não corresponde à URL que o backend está enviando.

---

## ✅ Solução Completa

### Passo 1: Acessar Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Faça login com sua conta Google
3. Crie um novo projeto ou selecione um existente

### Passo 2: Criar Credenciais OAuth 2.0

1. No menu lateral, vá em **APIs e Serviços** > **Credenciais**
2. Clique em **+ Criar Credenciais** > **ID do cliente OAuth**
3. Se solicitado, configure a **Tela de consentimento OAuth**:
   - Tipo: **Externo** (para testes) ou **Interno** (se tiver Google Workspace)
   - Nome do aplicativo: **B3 AI Analysis Platform**
   - Email de suporte: seu email
   - Domínio autorizado: deixe em branco por enquanto
   - Email de contato do desenvolvedor: seu email
   - Clique em **Salvar e continuar**
   - Em **Escopos**, adicione:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Clique em **Salvar e continuar**
   - Em **Usuários de teste**, adicione seu email (se tipo Externo)
   - Clique em **Salvar e continuar**

### Passo 3: Configurar ID do Cliente OAuth

Após configurar a tela de consentimento:

1. Volte para **Credenciais** > **+ Criar Credenciais** > **ID do cliente OAuth**
2. Tipo de aplicativo: **Aplicativo da Web**
3. Nome: **B3 AI Analysis Platform - Web**
4. **Origens JavaScript autorizadas:**
   ```
   http://localhost:3100
   http://localhost:3101
   ```

5. **URIs de redirecionamento autorizados** (IMPORTANTE!):
   ```
   http://localhost:3101/api/v1/auth/google/callback
   ```

   ⚠️ **ATENÇÃO:** Esta URL deve ser EXATAMENTE:
   - `http://localhost:3101/api/v1/auth/google/callback`
   - Sem barra `/` no final
   - Com `/api/v1/` no caminho

6. Clique em **Criar**

### Passo 4: Copiar Credenciais

Você receberá duas informações importantes:

```
ID do cliente: 123456789-abc123.apps.googleusercontent.com
Chave secreta do cliente: GOCSPX-abc123def456
```

**Copie ambos!**

### Passo 5: Configurar Backend

1. Abra o arquivo `backend/.env`:
   ```powershell
   notepad backend\.env
   ```

2. Adicione as credenciais:
   ```env
   GOOGLE_CLIENT_ID=123456789-abc123.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
   GOOGLE_CALLBACK_URL=http://localhost:3101/api/v1/auth/google/callback
   ```

   **Substitua** pelos valores que você copiou no passo anterior.

3. Salve o arquivo

### Passo 6: Reiniciar Backend

```powershell
# Reiniciar apenas o backend
docker-compose restart backend

# Verificar se reiniciou corretamente
docker-compose logs backend --tail=20
```

Você deve ver algo como:
```
[Nest] INFO [NestApplication] Nest application successfully started
```

### Passo 7: Testar Login com Google

1. Abra o navegador:
   ```powershell
   Start-Process "http://localhost:3100/login"
   ```

2. Clique em **"Entrar com Google"**

3. Você será redirecionado para a tela de consentimento do Google

4. **Se aparecer aviso "Este app não foi verificado":**
   - Clique em **Configurações avançadas**
   - Clique em **Acessar B3 AI Analysis Platform (não seguro)**
   - Isso é normal para apps em desenvolvimento

5. Autorize o acesso

6. Você será redirecionado de volta para `http://localhost:3100/dashboard`

---

## 🔍 Verificações

### Verificar se credenciais foram configuradas:

```powershell
# Ver configuração do Google OAuth (sem mostrar secrets)
Get-Content backend\.env | Select-String "GOOGLE"
```

**Saída esperada:**
```
GOOGLE_CLIENT_ID=123456789-abc...
GOOGLE_CLIENT_SECRET=GOCSPX-abc...
GOOGLE_CALLBACK_URL=http://localhost:3101/api/v1/auth/google/callback
```

Se `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estiverem vazios, você precisa preenchê-los.

### Testar endpoint do backend:

```powershell
# Acessar URL de inicialização OAuth (deve redirecionar para Google)
Start-Process "http://localhost:3101/api/v1/auth/google"
```

Deve abrir a tela de login do Google.

---

## ❗ Problemas Comuns

### Erro 1: `redirect_uri_mismatch`

**Causa:** URL de callback no Google Console diferente da configurada no backend.

**Solução:**
1. Verifique que no Google Console a URL é: `http://localhost:3101/api/v1/auth/google/callback`
2. Verifique que no `backend/.env` a URL é a mesma
3. **Não pode ter** barra `/` no final
4. **Não pode** faltar `/api/v1/`

### Erro 2: "Este app não foi verificado"

**Causa:** App em desenvolvimento/teste não foi publicado.

**Solução:**
- Clique em **Configurações avançadas** > **Acessar B3 AI Analysis Platform**
- Ou publique o app (se for para produção)

### Erro 3: "Access blocked: This app's request is invalid"

**Causa:** Tela de consentimento não foi configurada ou está incompleta.

**Solução:**
- Volte ao Google Console
- Configure a tela de consentimento OAuth
- Adicione os escopos necessários (email e profile)

### Erro 4: Credenciais vazias no `.env`

```powershell
# Verificar se está vazio
Get-Content backend\.env | Select-String "GOOGLE_CLIENT_ID"
```

Se mostrar `GOOGLE_CLIENT_ID=` (vazio), você precisa:
1. Criar credenciais no Google Console (passos acima)
2. Copiar Client ID e Secret
3. Adicionar no `backend/.env`
4. Reiniciar backend

---

## 📋 Checklist Rápido

- [ ] Projeto criado no Google Cloud Console
- [ ] Tela de consentimento OAuth configurada
- [ ] Credenciais OAuth criadas (Aplicativo da Web)
- [ ] **URI de redirecionamento:** `http://localhost:3101/api/v1/auth/google/callback`
- [ ] Client ID copiado para `backend/.env`
- [ ] Client Secret copiado para `backend/.env`
- [ ] Backend reiniciado (`docker-compose restart backend`)
- [ ] Teste: Clicar em "Entrar com Google" no frontend

---

## 🎯 URLs Importantes

### Frontend
- Login page: http://localhost:3100/login
- Botão "Entrar com Google" leva para: `http://localhost:3101/api/v1/auth/google`

### Backend
- Iniciar OAuth: http://localhost:3101/api/v1/auth/google
- Callback OAuth: http://localhost:3101/api/v1/auth/google/callback

### Google Cloud Console
- Console: https://console.cloud.google.com/
- Credenciais: https://console.cloud.google.com/apis/credentials

---

## 🔐 Segurança

**IMPORTANTE:**

1. **Nunca commite** o arquivo `backend/.env` no Git
   - Ele já está no `.gitignore`
   - Contém credenciais sensíveis

2. **Para produção:**
   - Use domínio real (não `localhost`)
   - Configure HTTPS (não HTTP)
   - Exemplo: `https://seudominio.com/api/v1/auth/google/callback`
   - Atualize URLs no Google Console
   - Publique o app OAuth

3. **Rotação de credenciais:**
   - Periodicamente, gere novas credenciais
   - Atualize no `.env`
   - Revogue as antigas

---

## 📞 Ainda com Problemas?

Se após seguir todos os passos ainda houver erro, me envie:

1. **Erro exato** que aparece
2. **Screenshot** da configuração do Google Console (parte de URIs de redirecionamento)
3. **Conteúdo** das variáveis Google no `.env` (sem mostrar os valores completos):
   ```powershell
   Get-Content backend\.env | Select-String "GOOGLE" | ForEach-Object {
       $parts = $_ -split '='
       "$($parts[0])=$(if($parts[1].Length -gt 10){$parts[1].Substring(0,10)+'...'}else{$parts[1]})"
   }
   ```

---

**Última atualização:** 2025-11-09
**Versão do backend:** API v1
