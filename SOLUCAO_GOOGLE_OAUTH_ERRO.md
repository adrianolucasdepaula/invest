# SOLUÇÃO IMEDIATA - Erro 400: redirect_uri_mismatch

## 🎯 O Problema

Você está vendo este erro:
```
Erro 400: redirect_uri_mismatch
Acesso bloqueado: a solicitação do app B3 AI Analysis Platform é inválida
```

**Causa:** A URL que você configurou no Google Cloud Console NÃO é exatamente igual à URL que o backend está enviando.

---

## ✅ Solução em 5 Passos

### PASSO 1: Acesse o Google Cloud Console

1. Abra: **https://console.cloud.google.com/apis/credentials**
2. Faça login com sua conta Google
3. Selecione seu projeto (ou crie um novo)

### PASSO 2: Localize suas Credenciais OAuth

Na página "Credenciais", você verá uma lista. Procure por:
- **ID do cliente OAuth 2.0**
- Nome algo como "Cliente Web" ou o nome que você deu

**Clique** no nome para editar.

### PASSO 3: Adicione a URL de Redirecionamento EXATA

Na seção **"URIs de redirecionamento autorizados"**:

1. Clique em **"+ ADICIONAR URI"**

2. Cole **EXATAMENTE** esta URL (copie e cole):
   ```
   http://localhost:3101/api/v1/auth/google/callback
   ```

3. **IMPORTANTE - Verifique:**
   - ❌ NÃO pode ter espaços antes ou depois
   - ❌ NÃO pode ter barra `/` no final
   - ❌ NÃO pode ser `https://` (tem que ser `http://`)
   - ❌ NÃO pode faltar o `/api/v1/`
   - ✅ TEM que ser exatamente: `http://localhost:3101/api/v1/auth/google/callback`

4. Clique em **"SALVAR"** no final da página

### PASSO 4: Adicione as Origens JavaScript (se ainda não tiver)

Na mesma página, na seção **"Origens JavaScript autorizadas"**:

1. Clique em **"+ ADICIONAR URI"**
2. Adicione: `http://localhost:3100`
3. Clique em **"+ ADICIONAR URI"** novamente
4. Adicione: `http://localhost:3101`
5. Clique em **"SALVAR"**

### PASSO 5: Aguarde e Teste

1. **Aguarde 1-2 minutos** (as mudanças levam um tempo para propagar)

2. Teste novamente:
   ```powershell
   Start-Process "http://localhost:3100/login"
   ```

3. Clique em **"Entrar com Google"**

4. Deve funcionar agora! ✅

---

## 🔍 Verificação Rápida

Antes de testar, verifique se sua configuração está assim:

### No Google Cloud Console:

**URIs de redirecionamento autorizados:**
```
http://localhost:3101/api/v1/auth/google/callback
```

**Origens JavaScript autorizadas:**
```
http://localhost:3100
http://localhost:3101
```

### No arquivo backend/.env:

```powershell
# Verificar configuração
Get-Content backend\.env | Select-String "GOOGLE"
```

Deve mostrar:
```
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-secret-aqui
GOOGLE_CALLBACK_URL=http://localhost:3101/api/v1/auth/google/callback
```

---

## ⚠️ Erros Comuns

### Erro 1: URL com barra no final
❌ **ERRADO:** `http://localhost:3101/api/v1/auth/google/callback/`
✅ **CERTO:** `http://localhost:3101/api/v1/auth/google/callback`

### Erro 2: URL sem /api/v1/
❌ **ERRADO:** `http://localhost:3101/auth/google/callback`
✅ **CERTO:** `http://localhost:3101/api/v1/auth/google/callback`

### Erro 3: HTTPS em vez de HTTP
❌ **ERRADO:** `https://localhost:3101/api/v1/auth/google/callback`
✅ **CERTO:** `http://localhost:3101/api/v1/auth/google/callback`

### Erro 4: Porta errada
❌ **ERRADO:** `http://localhost:3000/api/v1/auth/google/callback`
✅ **CERTO:** `http://localhost:3101/api/v1/auth/google/callback`

---

## 📸 Como Deve Parecer no Google Console

Quando você editar as credenciais OAuth, deve ver algo assim:

```
Nome: Cliente Web (ou seu nome)

Origens JavaScript autorizadas:
  http://localhost:3100
  http://localhost:3101

URIs de redirecionamento autorizados:
  http://localhost:3101/api/v1/auth/google/callback

[Botão SALVAR]
```

---

## 🐛 Ainda com Erro?

Se depois de seguir TODOS os passos ainda der erro:

### Teste 1: Verificar a URL exata que o backend está usando

```powershell
# Ver logs do backend quando você clica em "Entrar com Google"
docker-compose logs backend -f --tail=50
```

Quando você clicar em "Entrar com Google", procure por uma linha que mostre a URL de callback. Deve ser exatamente:
```
http://localhost:3101/api/v1/auth/google/callback
```

### Teste 2: Verificar se Client ID está correto

```powershell
# Execute o script de verificação
.\verificar-google-oauth.ps1
```

Deve mostrar que `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão configurados.

### Teste 3: Limpar cache do navegador

Às vezes o Google armazena cache:
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Todo o período"
3. Marque "Cookies" e "Dados armazenados em cache"
4. Clique em "Limpar dados"
5. Tente novamente

---

## 📋 Checklist Final

Marque tudo antes de testar:

- [ ] Acessei https://console.cloud.google.com/apis/credentials
- [ ] Encontrei minhas credenciais OAuth 2.0
- [ ] Adicionei EXATAMENTE: `http://localhost:3101/api/v1/auth/google/callback`
- [ ] Não tem barra `/` no final
- [ ] É `http://` (não `https://`)
- [ ] Tem `/api/v1/` no caminho
- [ ] Cliquei em SALVAR
- [ ] Aguardei 1-2 minutos
- [ ] Reiniciei o navegador (opcional mas recomendado)
- [ ] Testei: `Start-Process "http://localhost:3100/login"`
- [ ] Cliquei em "Entrar com Google"

---

## ✨ Quando Funcionar

Você saberá que funcionou quando:

1. Clicar em "Entrar com Google"
2. Ser redirecionado para tela de login do Google
3. Fazer login com sua conta
4. **VER A TELA DE CONSENTIMENTO** (primeira vez):
   - "B3 AI Analysis Platform quer acessar sua Conta do Google"
   - Mostra permissões (email, perfil básico)
   - Botão "Continuar" ou "Permitir"
5. Ser redirecionado de volta para `http://localhost:3100/dashboard`
6. Ver seu nome no header e estar logado! 🎉

---

**Se AINDA não funcionar depois disso tudo**, me envie:
1. Screenshot da página de configuração OAuth no Google Console (parte das URIs)
2. Saída do comando: `.\verificar-google-oauth.ps1`
3. O erro EXATO que aparece

Vamos resolver! 💪
