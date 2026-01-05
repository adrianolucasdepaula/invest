# Environment Validation Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Validação e gerenciamento de variáveis de ambiente para NestJS + Next.js

---

## Overview

Validação de environment variables previne erros em runtime e garante configuração correta em todos os ambientes (dev, staging, production).

**Stack de Validação:**
- Backend: `@nestjs/config` + `class-validator` + `Joi`
- Frontend: Zod + Next.js env validation

---

## Backend Environment Validation (NestJS)

### Setup @nestjs/config

**Instalar dependências:**

```bash
npm install @nestjs/config class-validator class-transformer joi
```

**Registrar módulo:**

```typescript
// backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Torna disponível em todos os módulos
      envFilePath: ['.env.local', '.env'], // Ordem de precedência
      cache: true, // Cache para performance
      expandVariables: true, // Suporte a ${VAR} expansion
      validate: validateEnvironment, // Função de validação customizada
    }),
    // ... outros módulos
  ],
})
export class AppModule {}
```

### Validation with class-validator

**Criar DTO de configuração:**

```typescript
// backend/src/config/env.validation.ts
import { IsString, IsInt, Min, Max, IsEnum, IsUrl, ValidateIf } from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsInt()
  @Min(1000)
  @Max(65535)
  @Type(() => Number)
  PORT: number = 3101;

  @IsString()
  DATABASE_HOST: string;

  @IsInt()
  @Type(() => Number)
  DATABASE_PORT: number = 5432;

  @IsString()
  DATABASE_USERNAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsUrl({ require_tld: false })
  REDIS_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsInt()
  @Min(300) // Mínimo 5 minutos
  @Max(86400) // Máximo 24 horas
  @Type(() => Number)
  JWT_EXPIRATION: number = 3600;

  // Validação condicional: obrigatório apenas em production
  @ValidateIf((o) => o.NODE_ENV === Environment.Production)
  @IsUrl()
  FRONTEND_URL: string;

  @ValidateIf((o) => o.NODE_ENV === Environment.Production)
  @IsString()
  SENTRY_DSN?: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
```

**Usar no ConfigModule:**

```typescript
// backend/src/app.module.ts
import { validateEnvironment } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: validateEnvironment, // ← Aplicar validação
    }),
  ],
})
export class AppModule {}
```

### Validation with Joi

**Alternativa mais simples para validação:**

```typescript
// backend/src/config/env.schema.ts
import * as Joi from 'joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3101),

  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().default(5432),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),

  REDIS_URL: Joi.string().uri().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.number().min(300).max(86400).default(3600),

  // Opcional em dev, obrigatório em production
  FRONTEND_URL: Joi.string().uri().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  SENTRY_DSN: Joi.string().uri().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
```

**Usar no ConfigModule:**

```typescript
import { envSchema } from './config/env.schema';

ConfigModule.forRoot({
  validationSchema: envSchema, // ← Joi validation
  validationOptions: {
    allowUnknown: true, // Permitir variáveis extras
    abortEarly: false, // Retornar TODOS os erros (não só o primeiro)
  },
})
```

### Typed Configuration Service

**Criar serviço tipado:**

```typescript
// backend/src/config/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';

@Injectable()
export class AppConfigService {
  constructor(private configService: NestConfigService<EnvironmentVariables>) {}

  get port(): number {
    return this.configService.get('PORT', { infer: true });
  }

  get database() {
    return {
      host: this.configService.get('DATABASE_HOST', { infer: true }),
      port: this.configService.get('DATABASE_PORT', { infer: true }),
      username: this.configService.get('DATABASE_USERNAME', { infer: true }),
      password: this.configService.get('DATABASE_PASSWORD', { infer: true }),
      database: this.configService.get('DATABASE_NAME', { infer: true }),
    };
  }

  get jwt() {
    return {
      secret: this.configService.get('JWT_SECRET', { infer: true }),
      expiresIn: this.configService.get('JWT_EXPIRATION', { infer: true }),
    };
  }

  get isProduction(): boolean {
    return this.configService.get('NODE_ENV') === 'production';
  }

  get isDevelopment(): boolean {
    return this.configService.get('NODE_ENV') === 'development';
  }
}
```

**Uso:**

```typescript
@Injectable()
export class DatabaseService {
  constructor(private appConfig: AppConfigService) {}

  async connect() {
    const dbConfig = this.appConfig.database;
    // TypeScript sabe que dbConfig.host é string
    await this.connection.connect(dbConfig);
  }
}
```

---

## Frontend Environment Validation (Next.js)

### Next.js Environment Variables

**Tipos de variáveis:**

| Prefixo | Disponível em | Exemplo |
|---------|--------------|---------|
| **Nenhum** | Server-side apenas | `DATABASE_URL` |
| **NEXT_PUBLIC_** | Client + Server | `NEXT_PUBLIC_API_URL` |

**IMPORTANTE:** ⚠️ NUNCA expor secrets com `NEXT_PUBLIC_`

### Validation with Zod

**Instalar:**

```bash
cd frontend && npm install zod
```

**Criar schema:**

```typescript
// frontend/src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server-side only
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),

  // Client-side (NEXT_PUBLIC_)
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3101/api/v1'),
  NEXT_PUBLIC_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

// Parse e validar
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

// Export tipado
export const env = parsedEnv.data;
```

**Uso:**

```typescript
// ✅ CORRETO: Tipagem automática
import { env } from '@/lib/env';

const apiUrl = env.NEXT_PUBLIC_API_URL; // string
const analyticsEnabled = env.NEXT_PUBLIC_ENABLE_ANALYTICS; // boolean
```

### Runtime Validation

**Validar no servidor (middleware):**

```typescript
// frontend/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

export function middleware(request: NextRequest) {
  // env já foi validado no import
  // Se houver erro, aplicação não inicia

  return NextResponse.next();
}
```

---

## .env.example Template

**Criar template para desenvolvedores:**

```bash
# .env.example (raiz do projeto)

#######################
# Application
#######################
NODE_ENV=development
PORT=3101

#######################
# Database (PostgreSQL)
#######################
DATABASE_HOST=localhost
DATABASE_PORT=5532
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=invest_db

#######################
# Redis (Cache + Queue)
#######################
REDIS_URL=redis://localhost:6479

#######################
# Authentication
#######################
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRATION=3600

#######################
# Frontend (Next.js)
#######################
NEXT_PUBLIC_API_URL=http://localhost:3101/api/v1
NEXT_PUBLIC_ENABLE_ANALYTICS=false

#######################
# External APIs
#######################
BRAPI_TOKEN=your-brapi-token-here

#######################
# Monitoring (Production only)
#######################
# SENTRY_DSN=https://xxx@sentry.io/xxx
# DATADOG_API_KEY=xxx
```

**Instruções para desenvolvedores:**

```bash
# 1. Copiar .env.example para .env
cp .env.example .env

# 2. Preencher valores específicos do seu ambiente
nano .env

# 3. NUNCA commitar .env (já está no .gitignore)
```

---

## Secrets Management

### Development (Local)

**Usar .env.local (não commitado):**

```bash
# .env.local (NÃO COMMITADO)
JWT_SECRET=dev-secret-only-for-local
DATABASE_PASSWORD=local-postgres-password
BRAPI_TOKEN=dev-token-123
```

**Ordem de precedência Next.js:**

```
.env.local > .env.development > .env
```

### Production

**NUNCA hardcoded em .env commitado:**

**Opções seguras:**

| Método | Ferramenta | Recomendado para |
|--------|-----------|------------------|
| Environment Variables | Render, Vercel, Heroku | Produção cloud |
| Secrets Manager | AWS Secrets Manager | AWS |
| Vault | HashiCorp Vault | Empresarial |
| CI/CD Variables | GitHub Actions, GitLab CI | Deploy automático |

**Exemplo: GitHub Actions**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        env:
          DATABASE_PASSWORD: ${{ secrets.DATABASE_PASSWORD }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
        run: npm run deploy
```

### Rotation de Secrets

**Best Practice:** Rotacionar secrets periodicamente

```typescript
// backend/src/scripts/rotate-jwt-secret.ts
import { ConfigService } from '@nestjs/config';

async function rotateJWTSecret() {
  const newSecret = generateSecureRandomString(64);

  // 1. Adicionar novo secret
  await secretsManager.create('JWT_SECRET_NEW', newSecret);

  // 2. Validar que ambos funcionam (período de transição)
  await validateBothSecrets();

  // 3. Após 24h, remover antigo
  setTimeout(() => {
    secretsManager.delete('JWT_SECRET_OLD');
  }, 24 * 60 * 60 * 1000);
}
```

---

## Validation on Application Start

### NestJS - Fail Fast

```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create(AppModule);

    // ConfigModule já validou environment no import
    logger.log('✅ Environment variables validated');

    await app.listen(3101);
    logger.log('🚀 Application running on port 3101');
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1); // Fail fast
  }
}
bootstrap();
```

**Output esperado:**

```bash
# ✅ Sucesso
[Bootstrap] ✅ Environment variables validated
[Bootstrap] 🚀 Application running on port 3101

# ❌ Erro
[Bootstrap] ❌ Failed to start application:
  Error: Environment validation failed
    - DATABASE_PASSWORD is required
    - JWT_SECRET must be at least 32 characters
```

---

## Type Safety with process.env

### Declare Global Types

```typescript
// backend/src/types/env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      DATABASE_HOST: string;
      DATABASE_PORT: string;
      DATABASE_USERNAME: string;
      DATABASE_PASSWORD: string;
      DATABASE_NAME: string;
      REDIS_URL: string;
      JWT_SECRET: string;
      JWT_EXPIRATION: string;
      FRONTEND_URL?: string;
      SENTRY_DSN?: string;
    }
  }
}

export {};
```

**Agora TypeScript autocompleta:**

```typescript
// ✅ Autocomplete funciona
const port = process.env.PORT; // TypeScript sabe que é string
const nodeEnv = process.env.NODE_ENV; // 'development' | 'production' | 'test'

// ❌ Erro de compilação
const invalid = process.env.INVALID_VAR; // TypeScript reclama
```

---

## Testing with Different Environments

### Unit Tests (.env.test)

```bash
# .env.test
NODE_ENV=test
DATABASE_HOST=localhost
DATABASE_PORT=5433  # Porta diferente para teste
DATABASE_NAME=invest_db_test
REDIS_URL=redis://localhost:6380
JWT_SECRET=test-secret-do-not-use-in-production
```

**Carregar em tests:**

```typescript
// backend/test/setup.ts
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar .env.test
config({ path: resolve(__dirname, '../.env.test') });
```

### Integration Tests (Docker Compose)

```yaml
# docker-compose.test.yml
services:
  postgres-test:
    image: postgres:16
    environment:
      POSTGRES_DB: invest_db_test
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: test-password
    ports:
      - "5433:5432"

  backend-test:
    build: ./backend
    environment:
      NODE_ENV: test
      DATABASE_HOST: postgres-test
      DATABASE_PORT: 5432
      DATABASE_NAME: invest_db_test
    depends_on:
      - postgres-test
```

---

## Monitoring Environment Health

### Health Check Endpoint

```typescript
// backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private config: ConfigService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      environment: this.config.get('NODE_ENV'),
      timestamp: new Date().toISOString(),
      // ⚠️ NÃO expor secrets
      config: {
        database: {
          host: this.config.get('DATABASE_HOST'),
          port: this.config.get('DATABASE_PORT'),
          // ❌ NÃO incluir password
        },
        redis: {
          connected: this.isRedisConnected(),
        },
      },
    };
  }
}
```

### Startup Checklist Log

```typescript
// backend/src/main.ts
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);

  logger.log('=== Environment Configuration ===');
  logger.log(`NODE_ENV: ${config.get('NODE_ENV')}`);
  logger.log(`PORT: ${config.get('PORT')}`);
  logger.log(`DATABASE_HOST: ${config.get('DATABASE_HOST')}`);
  logger.log(`REDIS_URL: ${config.get('REDIS_URL')?.replace(/\/\/.*@/, '//***@')}`); // Mascarar credenciais
  logger.log('================================');

  await app.listen(3101);
}
```

---

## Best Practices

### ✅ DO

1. **Sempre validar environment variables no startup**
2. **Usar .env.example como documentação**
3. **Fail fast se variáveis obrigatórias faltarem**
4. **Tipagem forte com TypeScript**
5. **Diferentes .env para dev/test/prod**
6. **Rotacionar secrets periodicamente**
7. **Mascarar secrets em logs**
8. **Usar secrets managers em produção**

### ❌ DON'T

1. **Commitar .env com secrets reais**
2. **Hardcoded secrets no código**
3. **Expor secrets com NEXT_PUBLIC_**
4. **Usar mesmas credenciais em dev e prod**
5. **Ignorar erros de validação**
6. **Armazenar JWT em localStorage (XSS vulnerability)**
7. **Permitir aplicação iniciar com config inválida**

---

## Security Checklist

| Item | Implementado? |
|------|---------------|
| `.env` adicionado ao `.gitignore` | ✅ |
| `.env.example` commitado (sem secrets) | ✅ |
| Validation schema (Joi ou class-validator) | ✅ |
| Secrets em environment variables (não hardcoded) | ✅ |
| Diferentes secrets para dev/prod | ✅ |
| JWT_SECRET com mínimo 32 chars | ✅ |
| DATABASE_PASSWORD rotacionado regularmente | ⚠️ Manual |
| Secrets manager em produção | ⚠️ Configurar |
| Health check NÃO expõe secrets | ✅ |
| CI/CD usa GitHub Secrets | ✅ |

---

## Troubleshooting

### Erro: "Environment validation failed"

**Causa:** Variável obrigatória faltando

**Solução:**

```bash
# 1. Verificar .env.example
cat .env.example

# 2. Comparar com .env
cat .env

# 3. Adicionar variável faltante
echo "DATABASE_PASSWORD=postgres" >> .env

# 4. Reiniciar aplicação
npm run start:dev
```

### Erro: "process.env.VAR is undefined"

**Causa:** Variável não carregada ou typo

**Solução:**

```typescript
// ❌ ERRADO: Acesso direto
const db = process.env.DATABASE_HOST; // pode ser undefined

// ✅ CORRETO: Usar ConfigService
constructor(private config: ConfigService) {}

const db = this.config.get('DATABASE_HOST', { infer: true }); // Tipado + validado
```

---

## Fontes

- [NestJS Configuration - Official Docs](https://docs.nestjs.com/techniques/configuration)
- [Environment Variables Validation in NestJS - DEV](https://dev.to/amirfakour/robust-environment-variable-validation-in-nestjs-applications-4om9)
- [NestJS Config Best Practices - Medium](https://mdjamilkashemporosh.medium.com/nestjs-environment-variables-best-practices-for-validating-and-structuring-configs-a24a8e8d93c1)
- [Next.js Environment Variables - Official Docs](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [Zod Documentation](https://zod.dev/)
