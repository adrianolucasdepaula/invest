# 🔧 Correção: Container Backend Unhealthy

**Problema:** Container `invest_backend` falha ao iniciar (status: Error/Unhealthy)

**Causa:** Dependências do Node.js não instaladas no backend

---

## 🚀 Solução Rápida

### **Opção 1: Rebuild Docker (Recomendado)**

```bash
# 1. Parar todos os containers
docker-compose down

# 2. Remover volumes (opcional, mas recomendado)
docker-compose down -v

# 3. Rebuild das imagens
docker-compose build --no-cache backend

# 4. Iniciar novamente
docker-compose up -d
```

### **Opção 2: Instalar Dependências Manualmente**

```bash
# 1. Parar containers
docker-compose down

# 2. Instalar dependências localmente
cd backend
npm install

# 3. Voltar para raiz
cd ..

# 4. Iniciar Docker
docker-compose up -d
```

### **Opção 3: Usar System Manager (Windows PowerShell)**

```powershell
# O script detecta automaticamente e instala dependências

# 1. Parar serviços
.\system-manager.ps1 stop

# 2. Reiniciar (vai detectar e instalar dependências)
.\system-manager.ps1 start
# Responda 'y' quando perguntar sobre instalar dependências
```

### **Opção 4: Usar System Manager (Linux/Mac)**

```bash
# 1. Parar serviços
./system-manager.sh stop

# 2. Reiniciar (vai detectar e instalar dependências)
./system-manager.sh start
# Responda 'y' quando perguntar sobre instalar dependências
```

---

## ✅ Verificar se Funcionou

### **1. Verificar status dos containers:**
```bash
docker-compose ps
```

**Saída esperada:**
```
NAME                    STATUS
invest_backend          Up (healthy)
invest_frontend         Up (healthy)
invest_postgres         Up (healthy)
invest_redis            Up (healthy)
```

### **2. Verificar logs do backend:**
```bash
docker-compose logs backend --tail 50
```

**Saída esperada (sem erros):**
```
[Nest] 1  - INFO [NestFactory] Starting Nest application...
[Nest] 1  - INFO [InstanceLoader] AppModule dependencies initialized
[Nest] 1  - INFO [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] 1  - INFO [InstanceLoader] AuthModule dependencies initialized
[Nest] 1  - INFO [RoutesResolver] AuthController {/api/auth}
[Nest] 1  - INFO [NestApplication] Nest application successfully started
```

### **3. Testar endpoint:**
```bash
curl http://localhost:3101/api/health
```

**Saída esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T..."
}
```

---

## 🐛 Troubleshooting

### **Erro: "Cannot find module 'passport-google-oauth20'"**

**Solução:**
```bash
cd backend
npm install passport-google-oauth20 @types/passport-google-oauth20
cd ..
docker-compose restart backend
```

### **Erro: "node_modules not found"**

**Solução:**
```bash
cd backend
npm install
cd ..
docker-compose down
docker-compose up -d
```

### **Erro: "Port 3101 already in use"**

**Solução:**
```bash
# Verificar processo usando porta 3101
lsof -i :3101  # Linux/Mac
netstat -ano | findstr :3101  # Windows

# Matar processo ou mudar porta no docker-compose.yml
```

### **Erro: "Database connection failed"**

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Restart do banco
docker-compose restart postgres

# Aguardar 10 segundos e restart do backend
sleep 10
docker-compose restart backend
```

### **Erro: "Cannot find module '@database/entities'"**

**Solução:**
```bash
cd backend
npm run build
cd ..
docker-compose restart backend
```

---

## 📋 Checklist de Validação

Após aplicar a solução, verifique:

- [ ] `docker-compose ps` mostra todos containers como `Up (healthy)`
- [ ] `docker-compose logs backend` não mostra erros
- [ ] `curl http://localhost:3101/api/health` retorna 200 OK
- [ ] Frontend consegue acessar backend
- [ ] Endpoint `/api/auth/google` não retorna erro 500

---

## 🔍 Logs Detalhados

Para diagnóstico avançado:

```bash
# Logs em tempo real
docker-compose logs -f backend

# Logs com timestamps
docker-compose logs --timestamps backend

# Logs de todos os serviços
docker-compose logs -f

# Entrar no container (se estiver rodando)
docker-compose exec backend sh
cd /app
ls -la node_modules | head
```

---

## 💡 Prevenção Futura

Para evitar este problema:

1. **Sempre rodar `npm install` após `git pull`** se houver mudanças no `package.json`

2. **Usar script system-manager** que detecta automaticamente

3. **Rebuild periódico:**
   ```bash
   docker-compose build --no-cache
   ```

4. **Verificar Dockerfile** se problema persistir:
   ```dockerfile
   # Deve conter:
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   ```

---

**✅ Problema resolvido!** Após seguir os passos acima, o backend deve iniciar corretamente.
