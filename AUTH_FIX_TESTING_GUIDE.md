# 🔧 Guia de Teste - Correções de Autenticação

**Branch:** `claude/continue-development-011CUw8hP5PSczzaKeJyY6KF`
**Commit:** `78ba094` - fix: corrigir mapeamento de colunas User e registro GoogleStrategy

---

## 🐛 Problemas Corrigidos

### 1. **Mapeamento Incorreto de Colunas** (User Entity)
**Problema:** TypeORM não encontrava colunas no banco de dados
**Causa:** Entity usava camelCase mas migration criou snake_case

**Correções aplicadas:**
```typescript
// ANTES (❌ Incorreto)
@Column({ name: 'googleId', nullable: true })  // Procurava coluna "googleId"
googleId: string;

@Column({ name: 'isActive', default: true })  // Procurava coluna "isActive"
isActive: boolean;

// DEPOIS (✅ Correto)
@Column({ name: 'google_id', nullable: true })  // Encontra coluna "google_id"
googleId: string;

@Column({ name: 'is_active', default: true })  // Encontra coluna "is_active"
isActive: boolean;
```

### 2. **GoogleStrategy Registrada Condicionalmente** (Auth Module)
**Problema:** Passport esperava estratégia 'google' mas recebia null
**Causa:** Factory retornava null quando credenciais não configuradas

**Correção aplicada:**
```typescript
// ANTES (❌ Incorreto)
providers: [
  {
    provide: GoogleStrategy,
    useFactory: (configService) => {
      if (clientId && clientSecret) {
        return new GoogleStrategy(configService);
      }
      return null; // ❌ Passport falha ao receber null
    }
  }
]

// DEPOIS (✅ Correto)
providers: [
  GoogleStrategy, // ✅ Sempre registrada
]
```

---

## 🧪 Como Testar as Correções

### **Pré-requisitos:**

1. **Atualizar código:**
   ```bash
   git pull origin claude/continue-development-011CUw8hP5PSczzaKeJyY6KF
   ```

2. **Banco de dados rodando:**
   - PostgreSQL deve estar ativo
   - Migration InitialSchema deve ter sido executada

3. **Backend e Frontend rodando:**
   ```bash
   # Backend
   cd backend
   npm run start:dev

   # Frontend (outro terminal)
   cd frontend
   npm run dev
   ```

---

## ✅ Teste 1: Criar Usuário com Email/Senha

### **Endpoint:** `POST /api/auth/register`

#### **Usando cURL:**
```bash
curl -X POST http://localhost:3101/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "senha12345",
    "firstName": "João",
    "lastName": "Silva"
  }'
```

#### **Resposta Esperada (✅ Sucesso):**
```json
{
  "user": {
    "id": "uuid-aqui",
    "email": "test@example.com",
    "firstName": "João",
    "lastName": "Silva",
    "isActive": true,
    "isEmailVerified": false,
    "createdAt": "2025-11-08T...",
    "updatedAt": "2025-11-08T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **Pelo Frontend:**
1. Acesse: http://localhost:3100/login
2. Clique em **"Cadastre-se"** (se houver) ou use Postman
3. Preencha os campos
4. Clique em **"Registrar"**
5. Deve redirecionar para dashboard

---

## ✅ Teste 2: Login com Email/Senha

### **Endpoint:** `POST /api/auth/login`

#### **Usando cURL:**
```bash
curl -X POST http://localhost:3101/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "senha12345"
  }'
```

#### **Resposta Esperada (✅ Sucesso):**
```json
{
  "user": {
    "id": "uuid-aqui",
    "email": "test@example.com",
    "firstName": "João",
    "lastName": "Silva",
    "lastLogin": "2025-11-08T..."
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### **Pelo Frontend:**
1. Acesse: http://localhost:3100/login
2. Digite email e senha
3. Clique em **"Entrar"**
4. Deve redirecionar para dashboard

---

## ✅ Teste 3: Google OAuth Login

### **Endpoint:** `GET /api/auth/google`

#### **Pelo Frontend (Recomendado):**
1. Acesse: http://localhost:3100/login
2. Clique em **"Entrar com Google"**
3. Será redirecionado para Google OAuth
4. Faça login com sua conta Google
5. Autorize a aplicação
6. Deve redirecionar para: `http://localhost:3100/auth/google/callback?token=...`
7. Token deve ser salvo em cookie
8. Deve redirecionar para dashboard

#### **Verificar Cookie:**
1. Abra DevTools (F12)
2. Application → Cookies → http://localhost:3100
3. Deve existir: `access_token` com valor JWT

#### **Verificar Usuário no Banco:**
```sql
-- Conectar ao PostgreSQL
psql -U invest_user -d invest_db

-- Buscar usuário criado via Google
SELECT id, email, first_name, last_name, google_id, is_email_verified, created_at
FROM users
WHERE google_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado Esperado:**
```
 id                                   | email              | first_name | google_id    | is_email_verified
--------------------------------------+--------------------+------------+--------------+------------------
 123e4567-e89b-12d3-a456-426614174000 | seu@gmail.com      | Seu Nome   | 1234567890   | true
```

---

## ❌ Erros Comuns e Soluções

### **Erro 1: "column 'googleId' does not exist"**
**Causa:** User entity não atualizada
**Solução:**
```bash
git pull origin claude/continue-development-011CUw8hP5PSczzaKeJyY6KF
cd backend && npm run start:dev
```

### **Erro 2: "Unknown authentication strategy 'google'"**
**Causa:** GoogleStrategy não registrada
**Solução:** Auth module já corrigido no commit 78ba094

### **Erro 3: "redirect_uri_mismatch"**
**Causa:** URL de callback incorreta no Google Cloud Console
**Solução:** Adicionar `http://localhost:3101/api/auth/google/callback`

### **Erro 4: "User already exists"**
**Causa:** Email já cadastrado
**Solução:** Usar email diferente ou limpar banco:
```sql
-- ⚠️ CUIDADO: Isso apaga TODOS os usuários
DELETE FROM users WHERE email = 'test@example.com';
```

### **Erro 5: Migration não executada**
**Causa:** Tabela users não existe
**Solução:**
```bash
cd backend
npm run migration:run
```

---

## 🔍 Logs para Debug

### **Ver logs do backend:**
```bash
cd backend
npm run start:dev
```

### **Ver logs do PostgreSQL:**
```bash
docker logs invest_postgres
```

### **Verificar se tabela users existe:**
```sql
psql -U invest_user -d invest_db

\dt users
\d users
```

---

## ✅ Checklist de Validação

Após testar, marque:

- [ ] Registro com email/senha funciona
- [ ] Login com email/senha funciona
- [ ] Botão "Entrar com Google" redireciona
- [ ] Google OAuth retorna token
- [ ] Token é salvo em cookie
- [ ] Redirecionamento para dashboard funciona
- [ ] Usuário aparece no banco com `google_id` preenchido
- [ ] Não há erros no console do backend
- [ ] Não há erros no console do browser

---

## 📝 Feedback

Se encontrar problemas:
1. Copie a mensagem de erro completa
2. Compartilhe logs do backend
3. Compartilhe resposta do endpoint (se aplicável)
4. Informe qual teste falhou

---

**✅ Correções aplicadas e prontas para teste!**
