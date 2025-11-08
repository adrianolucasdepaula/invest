# Recomendações Técnicas - Ações Concretas
## B3 AI Analysis Platform

---

## 1. REMOVER CREDENCIAIS DO GIT (CRÍTICO - HOJE)

### Opção 1: Using git-filter-repo (Recomendado)

```bash
# Install git-filter-repo
pip install git-filter-repo

# Remove file from all history
git filter-repo --invert-paths --path backend/.env

# Force push
git push origin --force-with-lease
```

### Opção 2: Using git filter-branch

```bash
# Remove from all history
git filter-branch --tree-filter 'rm -f backend/.env' -- --all

# Force push
git push origin --force-with-lease
```

### Pós-remoção:
```bash
# Verify removal
git log --all --full-history --name-status -- backend/.env
# Should return empty

# Verify .gitignore has .env
grep "^\.env$" .gitignore
# Should show: .env
```

---

## 2. GERAR NOVO JWT_SECRET (CRÍTICO - HOJE)

### Backend .env
```bash
# Gerar novo secret
openssl rand -base64 32

# Exemplo output:
# tK8mP9xQ2wL7nR3vJ5bG4sH6jF1aD8eK2pL9oM3cX5vB7nT6rQ

# Atualizar backend/.env
JWT_SECRET=tK8mP9xQ2wL7nR3vJ5bG4sH6jF1aD8eK2pL9oM3cX5vB7nT6rQ
JWT_REFRESH_SECRET=<outro secret aleatório, 32+ chars>
```

### Validação
```bash
# Verificar tamanho
echo -n "tK8mP9xQ2wL7nR3vJ5bG4sH6jF1aD8eK2pL9oM3cX5vB7nT6rQ" | wc -c
# Should output: 52 (>= 32)
```

---

## 3. ATUALIZAR XLSX (CRÍTICO - Esta Semana)

### Atualizar Dependência
```bash
cd /home/user/invest/backend

# Update XLSX
npm update xlsx --save

# Verify version
npm list xlsx
# Should show: xlsx@0.20.x or higher
```

### Testar Atualização
```bash
# Run existing tests
npm run test

# If tests fail, may need code changes:
# - Check for deprecated API usage
# - Test Excel file parsing manually
# - Run type checks: npm run lint
```

### Se Problemas Persistirem
```bash
# Consider alternative: exceljs
npm install exceljs --save
npm uninstall xlsx --save

# Update imports
# OLD: const XLSX = require('xlsx');
# NEW: const ExcelJS = require('exceljs');
```

---

## 4. ADICIONAR .prettierrc ao FRONTEND (ALTO - Esta Semana)

### Criar arquivo `/frontend/.prettierrc`
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "semi": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### Adicionar Prettier ao Frontend
```bash
cd /home/user/invest/frontend

# Install prettier
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier

# Update .eslintrc.json
```

### Atualizar `/frontend/.eslintrc.json`
```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error"
  }
}
```

### Formatar Código
```bash
# Format all files
npx prettier --write src/

# Verify
npm run lint
```

---

## 5. PIN DOCKER IMAGES (ALTO - Esta Semana)

### Atualizar `/docker-compose.yml`

**ANTES:**
```yaml
services:
  postgres:
    image: timescale/timescaledb:latest-pg15
  
  redis:
    image: redis:7-alpine
  
  nginx:
    image: nginx:alpine
```

**DEPOIS:**
```yaml
services:
  postgres:
    # Versão específica do TimescaleDB com PostgreSQL 15
    image: timescale/timescaledb:2.14.2-pg15.4
    # ou verificar latest estável: docker pull timescale/timescaledb:latest-pg15
  
  redis:
    # Redis 7 alpine específico
    image: redis:7.2-alpine3.20
  
  nginx:
    # Nginx estável com Alpine específico
    image: nginx:1.27.3-alpine3.20
  
  pgadmin:
    # PgAdmin versão específica
    image: dpage/pgadmin4:8.12
  
  redis-commander:
    # Redis Commander versão específica
    image: rediscommander/redis-commander:1.2.1
  
  # Python services
  api-service:
    build:
      context: ./backend/api-service
      dockerfile: Dockerfile
    # Adicionar args no Dockerfile para pinnar Python
```

### Atualizar Python Dockerfiles

**`/backend/api-service/Dockerfile`:**
```dockerfile
# Pin Python version
FROM python:3.11.10-slim

# ... rest of Dockerfile
```

**`/backend/python-scrapers/Dockerfile`:**
```dockerfile
# Pin Python version
FROM python:3.11.10-slim

# ... rest of Dockerfile
```

### Verificar Versões Disponíveis
```bash
# Para postgres
docker pull timescale/timescaledb:latest-pg15

# Para nginx
docker pull nginx:latest

# Verificar tags
curl -s https://registry.hub.docker.com/v2/library/nginx/tags/list | jq '.results[].name' | head -20
```

---

## 6. UNIFICAR TYPESCRIPT CONFIGURATION (ALTO - Sprint Atual)

### Opção A: Backend → Strict Mode (Recomendado)

**Atualizar `/backend/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "strict": true,                        // Enable all strict checks
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    
    // Keep NestJS specific
    "target": "ES2021",
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@api/*": ["src/api/*"],
      "@services/*": ["src/services/*"],
      "@scrapers/*": ["src/scrapers/*"],
      "@validators/*": ["src/validators/*"],
      "@ai/*": ["src/ai/*"],
      "@analysis/*": ["src/analysis/*"],
      "@database/*": ["src/database/*"],
      "@queue/*": ["src/queue/*"],
      "@config/*": ["src/config/*"],
      "@common/*": ["src/common/*"]
    },
    "incremental": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
```

### Passos para Ativar Strict:
```bash
cd /home/user/invest/backend

# 1. Update tsconfig
# (use JSON acima)

# 2. Type-check
npm run lint

# 3. Fix errors found
# This may require:
# - Adding type annotations
# - Fixing null checks
# - Removing implicit any

# 4. Test
npm run test
npm run test:e2e

# 5. Build
npm run build
```

### ESLint Backend - Remover Disabler Rules

**Atualizar `/backend/.eslintrc.js`:**
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    // Keep only necessary overrides
    '@typescript-eslint/interface-name-prefix': 'off',
    // Remove these rules (let strict mode catch them):
    // '@typescript-eslint/explicit-function-return-type': 'off',
    // '@typescript-eslint/explicit-module-boundary-types': 'off',
    // '@typescript-eslint/no-explicit-any': 'off',
  },
};
```

---

## 7. CONFIGURAR PLAYWRIGHT (ALTO - Sprint Atual)

### Criar `/frontend/playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Criar Exemplo de Teste: `/frontend/tests/example.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Replace with actual title
  await expect(page).toHaveTitle(/B3 AI Analysis Platform/);
});

test('health check', async ({ page }) => {
  const response = await page.request.get('http://localhost:3101/api/v1/health');
  expect(response.ok()).toBeTruthy();
});
```

### Atualizar `/frontend/package.json`
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### Executar Testes
```bash
cd /home/user/invest/frontend

# Run tests
npm run test:e2e

# Run in UI mode (recomendado para debug)
npm run test:e2e:ui
```

---

## 8. CRIAR docker-compose.prod.yml (MÉDIO - 2 Sprints)

### Arquivo: `/docker-compose.prod.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: timescale/timescaledb:2.14.2-pg15.4
    container_name: invest_postgres_prod
    environment:
      POSTGRES_USER: ${DB_USERNAME}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_DATABASE}
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
      - postgres_backups_prod:/backups
    networks:
      - invest_network_prod
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USERNAME}"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G
        reservations:
          cpus: '2.0'
          memory: 4G

  redis:
    image: redis:7.2-alpine3.20
    container_name: invest_redis_prod
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data_prod:/data
    networks:
      - invest_network_prod
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  backend:
    image: invest-backend:prod
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: invest_backend_prod
    environment:
      NODE_ENV: production
      # ... production vars
    ports:
      - "3101:3101"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - invest_network_prod
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3101/api/v1/health"]
      interval: 60s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G
        reservations:
          cpus: '2.0'
          memory: 2G

  frontend:
    image: invest-frontend:prod
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    container_name: invest_frontend_prod
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - invest_network_prod
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 60s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G

  nginx:
    image: nginx:1.27.3-alpine3.20
    container_name: invest_nginx_prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
    depends_on:
      - backend
      - frontend
    networks:
      - invest_network_prod
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 60s
      timeout: 10s
      retries: 3

networks:
  invest_network_prod:
    driver: bridge

volumes:
  postgres_data_prod:
  postgres_backups_prod:
  redis_data_prod:
```

### Usar em Produção
```bash
# Build and start production stack
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Stop
docker-compose -f docker-compose.prod.yml down
```

---

## 9. SETUP CONFIG VALIDATION (MÉDIO - 2 Sprints)

### Backend: `/src/config/env.validation.ts`

**Usando Zod (Recomendado):**
```bash
npm install zod --save
```

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_PORT: z.coerce.number().default(3101),
  APP_URL: z.string().url(),

  // Database
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().default(5432),
  DB_USERNAME: z.string(),
  DB_PASSWORD: z.string().min(8, 'Database password must be at least 8 characters'),
  DB_DATABASE: z.string(),

  // Redis
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRATION: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRATION: z.string().default('30d'),

  // AI
  OPENAI_API_KEY: z.string().optional(),
  AI_ENABLED: z.enum(['true', 'false']).transform(v => v === 'true').default('true'),

  // Validation
  MIN_DATA_SOURCES: z.coerce.number().default(3),
  DATA_VALIDATION_THRESHOLD: z.coerce.number().default(0.05),
});

export type Environment = z.infer<typeof envSchema>;

export function validateEnv(env: NodeJS.ProcessEnv): Environment {
  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formatted = error.errors
        .map(err => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${formatted}`);
    }
    throw error;
  }
}
```

### Usar em `main.ts`
```typescript
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  // Validate environment
  const env = validateEnv(process.env);
  
  // Use env in app
  const app = await NestFactory.create(AppModule);
  app.listen(env.APP_PORT);
}
```

---

## 10. PRODUCTION NGINX CONFIG (MÉDIO - 2 Sprints)

### Criar `/docker/nginx/conf.d/production.conf`

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name _;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Compression
    gzip on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/x-javascript application/xml+rss 
               application/javascript application/json;
    gzip_min_length 1024;

    # API Backend
    location /api {
        proxy_pass http://backend:3101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://backend:3101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

## Cronograma Recomendado

| Semana | Ação | Esforço | Responsável |
|--------|------|---------|-------------|
| Esta | Remover .env, gerar JWT, atualizar XLSX | 2-4h | DevOps/Backend |
| Esta | .prettierrc frontend, pin images | 3-4h | Frontend/DevOps |
| Sprint 1 | TypeScript strict, Playwright setup | 16h | Whole team |
| Sprint 1 | ESLint unification | 8h | Team lead |
| Sprint 2-3 | NestJS v10→v11 | 24h | Backend team |
| Sprint 2-3 | React/Next.js upgrade | 32h | Frontend team |
| Sprint 3 | Production configs | 16h | DevOps |

---

## Validação Checklist

- [ ] `npm audit` no backend retorna 0 vulnerabilidades
- [ ] `npm audit` no frontend retorna 0 vulnerabilidades
- [ ] Nenhum arquivo `.env` em version control (verificar histórico)
- [ ] `npm run lint` passa sem errors em ambos
- [ ] `npm run build` funciona em ambos
- [ ] `npm test` passa (ou cria baseline se não houver)
- [ ] Docker images têm versões específicas
- [ ] Health checks passam: `docker-compose up`
- [ ] .prettierrc presente em ambos
- [ ] TypeScript strict mode alinhado
- [ ] Playwright tests podem rodar

---

**Documento criado:** 2025-11-08

