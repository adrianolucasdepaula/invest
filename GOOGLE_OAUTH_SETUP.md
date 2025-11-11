# Configuração do Google OAuth - Solução do Erro

## Problema Identificado

Erro ao fazer login com Google:
```
A solicitação é inválida e não pôde ser processada pelo servidor.
Não tente novamente. Isso é tudo o que sabemos.
```

## Causa Raiz - CORRIGIDA ✅

**PROBLEMA REAL:** As credenciais do Google OAuth no arquivo `.env` da raiz do projeto estavam com valores placeholder (`your-google-client-id`), enquanto as credenciais corretas estavam apenas no arquivo `backend/.env`.

O docker-compose.yml referencia o arquivo `.env` da raiz, não o `backend/.env`, causando o erro "A solicitação é inválida".

**SOLUÇÃO:** Atualizar o arquivo `.env` da raiz com as credenciais corretas do Google OAuth.

## Credenciais Atuais

- **Client ID**: `86345771891-iiuc37b2iiiaphpjoa3uoc6dsrbdebgg.apps.googleusercontent.com`
- **Client Secret**: `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`
- **Redirect URI Backend**: `http://localhost:3101/api/v1/auth/google/callback`

## Solução: Configurar Redirect URI no Google Cloud Console

### Passo 1: Acessar Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Login com a conta que criou o projeto OAuth

### Passo 2: Navegar para Credenciais

1. No menu lateral, vá em: **APIs & Services** → **Credentials**
2. Ou acesse diretamente: https://console.cloud.google.com/apis/credentials

### Passo 3: Editar OAuth 2.0 Client ID

1. Encontre o Client ID: `86345771891-iiuc37b2iiiaphpjoa3uoc6dsrbdebgg`
2. Clique no ícone de **editar** (lápis)

### Passo 4: Adicionar URIs Autorizados

Na seção **"Authorized redirect URIs"**, adicione:

```
http://localhost:3101/api/v1/auth/google/callback
```

**IMPORTANTE**: O URI deve ser **EXATAMENTE** como está configurado no backend, incluindo:
- Protocolo: `http://` (sem SSL em desenvolvimento)
- Host: `localhost`
- Porta: `3101`
- Path completo: `/api/v1/auth/google/callback`

### Passo 5: Salvar e Aguardar

1. Clique em **Save** no final da página
2. Aguarde alguns segundos para as mudanças propagarem
3. Teste novamente o login com Google

## URIs que Devem Estar Configurados

Para desenvolvimento local:
```
http://localhost:3101/api/v1/auth/google/callback
```

Para produção (quando deploy for feito):
```
https://seu-dominio.com/api/v1/auth/google/callback
```

## Verificação Após Configuração

Após adicionar o Redirect URI, teste o fluxo:

1. Acesse: http://localhost:3100/login
2. Clique em "Entrar com Google"
3. Você será redirecionado para Google
4. Após autorizar, deve voltar para o dashboard

## Logs do Backend

O backend está configurado corretamente. Verificação:

✅ Rota GET `/api/v1/auth/google` - Iniciador do OAuth
✅ Rota GET `/api/v1/auth/google/callback` - Callback configurado
✅ Variáveis de ambiente carregadas
✅ GoogleAuthGuard configurado

## Fluxo Completo do OAuth

1. **Usuário clica "Login com Google"**
   - Frontend redireciona para: `http://localhost:3101/api/v1/auth/google`

2. **Backend inicia OAuth flow**
   - NestJS + Passport redireciona para Google OAuth
   - Google verifica se o `redirect_uri` está autorizado

3. **Usuário autoriza no Google**
   - Google redireciona para: `http://localhost:3101/api/v1/auth/google/callback`

4. **Backend processa callback**
   - Recebe código do Google
   - Troca código por token
   - Cria/atualiza usuário no banco
   - Gera JWT token
   - Redireciona para frontend com token

5. **Frontend salva token**
   - Salva em cookie: `access_token`
   - Redireciona para dashboard

## Erro Comum: redirect_uri_mismatch

Se você ver este erro:
```
Error 400: redirect_uri_mismatch
```

Significa que o URI no código não corresponde ao URI autorizado. Verifique:

1. URI no `.env` backend: `GOOGLE_CALLBACK_URL`
2. URI no Google Cloud Console: deve ser idêntico
3. Não pode haver espaços, barras extras, ou diferenças de protocolo

## Alternativa: Criar Novo Cliente OAuth

Se você não tem acesso ao Google Cloud Console onde essas credenciais foram criadas, você pode criar um novo:

1. Acesse https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** → **Credentials**
4. Clique em **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Escolha **Web application**
6. Adicione os Redirect URIs:
   ```
   http://localhost:3101/api/v1/auth/google/callback
   ```
7. Copie o **Client ID** e **Client Secret**
8. Atualize o arquivo `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=seu-novo-client-id
   GOOGLE_CLIENT_SECRET=seu-novo-client-secret
   ```
9. Reinicie o backend: `docker-compose restart backend`

## Status Atual

- ✅ **Backend**: Configurado corretamente
- ✅ **Frontend**: Página de callback implementada
- ✅ **Cookie Auth**: Funcionando (testado com email/senha)
- ❌ **Google OAuth**: Bloqueado - precisa configurar Redirect URI no Google Cloud Console

## Próximos Passos

1. Configure o Redirect URI no Google Cloud Console
2. Teste o login com Google
3. Verifique se o cookie `access_token` é salvo
4. Confirme que consegue criar análises após login

## Suporte

Se o problema persistir após configurar o Redirect URI, verifique:

1. Logs do backend: `docker logs invest_backend`
2. Console do browser (F12) para erros JavaScript
3. Network tab para ver requisições HTTP e respostas
