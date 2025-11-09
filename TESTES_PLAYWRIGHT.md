# Testes Automatizados de Autenticação - Playwright

Este guia explica como executar os testes automatizados do frontend usando Playwright.

## 📦 Arquivos Criados

- `playwright.config.js` - Configuração do Playwright
- `tests/frontend-auth.spec.js` - Suite de testes de autenticação
- `test-frontend-auth.js` - Script standalone (alternativo)

## 🚀 Como Executar os Testes

### Pré-requisitos

1. **Sistema deve estar rodando:**
   ```powershell
   .\system-manager.ps1 status
   ```
   Se não estiver rodando:
   ```powershell
   .\system-manager.ps1 start
   ```

2. **Aguarde até que backend e frontend estejam saudáveis**

### Executar Testes

No diretório raiz do projeto (`/home/user/invest`), execute:

```bash
npx playwright test --reporter=list
```

Ou para ver os testes em modo debug:

```bash
npx playwright test --debug
```

Ou para executar com interface gráfica (headed mode):

```bash
npx playwright test --headed
```

## 📋 Testes Incluídos

A suite de testes verifica:

### 1. ✅ Carregar página de login
- Verifica se a página `/login` carrega corretamente
- Verifica presença de:
  - Campo de email
  - Campo de senha
  - Botão de submit
  - Botão "Entrar com Google"
  - Link "Cadastre-se"

### 2. ✅ Navegar para registro
- Clica no link "Cadastre-se"
- Verifica redirecionamento para `/register`

### 3. ✅ Registrar novo usuário
- Preenche formulário de registro com dados de teste
- Submete o formulário
- Verifica redirecionamento para `/login` após sucesso

### 4. ✅ Fazer login com credenciais
- Preenche email e senha
- Submete o formulário
- Verifica criação do cookie `access_token`

### 5. ✅ Manter autenticação ao navegar
- Faz login
- Navega para `/dashboard`
- Verifica se continua autenticado (não redireciona para login)

### 6. ✅ Proteger rotas não autenticadas
- Limpa cookies
- Tenta acessar `/dashboard` sem autenticação
- Verifica redirecionamento para `/login`

### 7. ✅ Login com usuário existente
- Testa login com `adriano.lucas.paula@gmail.com`
- Verifica criação do token

## 📊 Interpretando Resultados

### Sucesso
```
Running 7 tests using 1 worker

  ✓  Frontend Authentication › deve carregar a página de login (500ms)
  ✓  Frontend Authentication › deve navegar para página de registro (300ms)
  ✓  Frontend Authentication › deve registrar novo usuário (1.2s)
  ✓  Frontend Authentication › deve fazer login com credenciais (800ms)
  ✓  Frontend Authentication › deve manter autenticação ao navegar (600ms)
  ✓  Frontend Authentication › deve proteger rotas não autenticadas (400ms)
  ✓  Frontend Authentication › deve fazer login com usuário existente (700ms)

  7 passed (5s)
```

### Falha
Se algum teste falhar, você verá:
```
  ✘  Frontend Authentication › deve fazer login com credenciais (800ms)

    Error: expect(received).toBeDefined()

    Expected: anything defined
    Received: undefined

      78 |       console.log(`   URL atual: ${page.url()}`);
      79 |     }
    > 80 |     expect(accessToken).toBeDefined();
```

Isso indica que algo não funcionou conforme esperado.

## 🐛 Debug e Troubleshooting

### Ver screenshot de falhas

Se um teste falhar, Playwright automaticamente tira um screenshot. Os arquivos estarão em:
```
test-results/
```

### Executar um teste específico

```bash
npx playwright test -g "deve fazer login"
```

### Ver trace de execução

```bash
npx playwright test --trace on
```

Depois:
```bash
npx playwright show-trace trace.zip
```

### Ver console do navegador

Os logs do `console.log()` aparecerão na saída dos testes. Mensagens adicionais são impressas pelos próprios testes para ajudar a entender o fluxo.

## 🔧 Configuração Avançada

### Alterar timeout

Em `playwright.config.js`:
```javascript
timeout: 60000, // 60 segundos
```

### Executar em modo não-headless (ver navegador)

```bash
npx playwright test --headed --workers=1
```

### Executar apenas um arquivo de teste

```bash
npx playwright test tests/frontend-auth.spec.js
```

## 📝 Notas Importantes

1. **Dados de Teste:**
   - Cada execução cria um novo usuário com timestamp único
   - Email: `teste{timestamp}@exemplo.com`
   - Senha: `senha12345`

2. **Usuário Existente:**
   - Um teste usa o usuário real: `adriano.lucas.paula@gmail.com`
   - Certifique-se de que esse usuário existe no banco

3. **Cookies:**
   - Os testes verificam se o cookie `access_token` é criado
   - Expiração esperada: 7 dias

4. **URLs:**
   - Frontend: `http://localhost:3100`
   - Backend API: `http://localhost:3101/api/v1`

## ✨ Próximos Passos

Após executar os testes:

1. **Se todos passarem:**
   - ✅ Autenticação está funcionando corretamente
   - ✅ Frontend e backend integrados
   - ✅ Pode fazer commit dos testes

2. **Se alguns falharem:**
   - 📋 Verifique os logs de erro
   - 🖼️ Analise os screenshots
   - 🔍 Execute com `--debug` para investigar
   - 📝 Verifique logs do backend: `docker-compose logs backend`

## 🎯 Comandos Rápidos

```powershell
# Iniciar sistema
.\system-manager.ps1 start

# Executar testes
npx playwright test

# Debug um teste específico
npx playwright test -g "login" --debug

# Ver relatório HTML
npx playwright test --reporter=html
npx playwright show-report

# Parar sistema
.\system-manager.ps1 stop
```

---

**Nota:** Estes testes foram criados para validar todas as correções aplicadas no frontend e garantir que a autenticação está funcionando end-to-end.
