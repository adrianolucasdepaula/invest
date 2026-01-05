# Security Practices Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Práticas de segurança baseadas em OWASP Top 10 (2025) para NestJS + Next.js

---

## Overview

Este guia cobre as **10 vulnerabilidades mais críticas** segundo OWASP 2025:

1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable and Outdated Components
7. Identification and Authentication Failures
8. Software and Data Integrity Failures
9. Security Logging and Monitoring Failures
10. Server-Side Request Forgery (SSRF)

---

## 1. Input Validation

### Backend (NestJS)

**SEMPRE validar TODOS os inputs:**

```typescript
// backend/src/api/assets/dto/create-asset.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{4}(3|4|5|6|11)$/, {
    message: 'Ticker deve seguir formato B3 (ex: PETR4)',
  })
  ticker: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.trim()) // Sanitize
  companyName: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  currentPrice: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().slice(0, 500)) // Limite de tamanho
  description?: string;
}
```

**Habilitar transformação automática:**

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true, // Remove campos não permitidos
    forbidNonWhitelisted: true, // Rejeita se houver campos extras
    transform: true, // Aplica transformações
  }),
);
```

### Frontend (Next.js)

**Usar Zod para validação:**

```typescript
// frontend/src/lib/schemas/asset.schema.ts
import { z } from 'zod';

export const assetSchema = z.object({
  ticker: z.string()
    .regex(/^[A-Z]{4}(3|4|5|6|11)$/, 'Ticker inválido')
    .trim()
    .toUpperCase(),

  companyName: z.string()
    .trim()
    .min(1, 'Nome obrigatório')
    .max(100, 'Máximo 100 caracteres'),

  currentPrice: z.number()
    .positive('Preço deve ser positivo')
    .max(999999.99, 'Preço máximo: R$ 999.999,99'),
});

// Uso em formulário
const { register, handleSubmit } = useForm({
  resolver: zodResolver(assetSchema),
});
```

---

## 2. SQL Injection Prevention

### TypeORM Parameterized Queries

```typescript
// ✅ CORRETO: Parameterized query
const assets = await this.assetRepository
  .createQueryBuilder('asset')
  .where('asset.ticker = :ticker', { ticker }) // Parametrizado
  .getMany();
```

```typescript
// ❌ ERRADO: String concatenation
const assets = await this.assetRepository
  .createQueryBuilder('asset')
  .where(`asset.ticker = '${ticker}'`) // VULNERÁVEL!
  .getMany();
```

### Raw Queries (quando necessário)

```typescript
// ✅ CORRETO: Com parâmetros
const result = await this.dataSource.query(
  'SELECT * FROM assets WHERE ticker = $1 AND price > $2',
  [ticker, minPrice],
);
```

```typescript
// ❌ ERRADO: Interpolação
const result = await this.dataSource.query(
  `SELECT * FROM assets WHERE ticker = '${ticker}'`, // VULNERÁVEL!
);
```

---

## 3. XSS (Cross-Site Scripting) Prevention

### Next.js Auto-Escaping

```tsx
// ✅ CORRETO: Next.js escapa automaticamente
export function AssetCard({ asset }: { asset: Asset }) {
  return (
    <div>
      <h2>{asset.companyName}</h2> {/* Escapado */}
      <p>{asset.description}</p> {/* Escapado */}
    </div>
  );
}
```

```tsx
// ❌ ERRADO: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} /> // VULNERÁVEL!
```

### Sanitização quando HTML é necessário

```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizedHTML = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
  ALLOWED_ATTR: [],
});

<div dangerouslySetInnerHTML={{ __html: sanitizedHTML }} />
```

### Content Security Policy (CSP)

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Restringir em produção
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' http://localhost:3101",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 4. CSRF (Cross-Site Request Forgery) Protection

### Backend (NestJS)

```bash
npm install csurf cookie-parser
```

```typescript
// main.ts
import * as csurf from 'csurf';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.use(csurf({ cookie: true }));

  await app.listen(3101);
}
```

**Endpoint para obter token:**

```typescript
@Controller('csrf')
export class CsrfController {
  @Get('token')
  getCsrfToken(@Req() req: Request) {
    return { csrfToken: req.csrfToken() };
  }
}
```

### Frontend (Next.js)

**Pacote recomendado:** `@edge-csrf/nextjs`

```bash
npm install @edge-csrf/nextjs
```

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createCsrfProtect } from '@edge-csrf/nextjs';

const csrfProtect = createCsrfProtect({
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    name: '__Host-csrf',
  },
});

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Proteger rotas de mutação
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const csrfError = await csrfProtect(request, response);

    if (csrfError) {
      return new NextResponse('CSRF validation failed', { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

**Uso em formulários:**

```tsx
'use client';

import { useState, useEffect } from 'react';

export function AssetForm() {
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    fetch('/api/csrf-token')
      .then((res) => res.json())
      .then((data) => setCsrfToken(data.csrfToken));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await fetch('/api/assets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify(formData),
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**SameSite Cookie:**

```typescript
// Set cookie com SameSite
res.cookie('sessionId', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict', // Previne CSRF
  maxAge: 3600000,
});
```

---

## 5. Authentication & Authorization

### JWT Security

```typescript
// backend/src/auth/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.access_token, // HTTP-only cookie
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      algorithms: ['HS256'], // Especificar algoritmo
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, username: payload.username };
  }
}
```

**❌ NUNCA armazenar JWT em localStorage:**

```typescript
// ❌ ERRADO: Vulnerável a XSS
localStorage.setItem('token', jwt);
```

**✅ SEMPRE usar HTTP-only cookies:**

```typescript
// ✅ CORRETO: HTTP-only cookie
@Post('login')
async login(@Body() loginDto: LoginDto, @Res() res: Response) {
  const { accessToken } = await this.authService.login(loginDto);

  res.cookie('access_token', accessToken, {
    httpOnly: true, // Não acessível via JavaScript
    secure: true, // HTTPS only
    sameSite: 'strict',
    maxAge: 3600000, // 1 hora
  });

  return res.json({ message: 'Login successful' });
}
```

### Guards

```typescript
// backend/src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

**Uso:**

```typescript
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles('admin') // Apenas admins
  getAllUsers() {
    return this.usersService.findAll();
  }
}
```

---

## 6. Secrets Management

### Environment Variables

**NUNCA hardcodar secrets:**

```typescript
// ❌ ERRADO
const JWT_SECRET = 'mysecretkey123'; // VULNERÁVEL!
```

```typescript
// ✅ CORRETO
const JWT_SECRET = process.env.JWT_SECRET;
```

### Validation de Env Vars

```typescript
// backend/src/config/env.validation.ts
import { plainToClass } from 'class-transformer';
import { IsString, IsNumber, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  JWT_SECRET: string;

  @IsString()
  DATABASE_URL: string;

  @IsNumber()
  PORT: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
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

**Uso no AppModule:**

```typescript
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
  ],
})
export class AppModule {}
```

### .env.example

**SEMPRE manter `.env.example` atualizado:**

```bash
# .env.example
JWT_SECRET=your_secret_here_min_32_chars
DATABASE_URL=postgresql://user:password@localhost:5432/db_name
REDIS_URL=redis://localhost:6379
PORT=3101
NODE_ENV=development
```

---

## 7. Rate Limiting

### Backend (NestJS)

```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests
      },
    ]),
  ],
})
export class AppModule {}
```

**Aplicar em controllers:**

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests/min
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
```

---

## 8. Helmet (Security Headers)

```bash
npm install helmet
```

```typescript
// main.ts
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  await app.listen(3101);
}
```

---

## 9. Dependency Scanning

### Automated Scanning

```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix

# Forçar correções (breaking changes)
npm audit fix --force
```

### Snyk Integration

```bash
npm install -g snyk
snyk auth
snyk test # Scan de vulnerabilidades
snyk monitor # Monitoramento contínuo
```

### GitHub Actions

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          path: '.'
          format: 'HTML'
```

---

## 10. OWASP ZAP Testing

### Docker Setup

```bash
docker pull owasp/zap2docker-stable

# Scan de baseline
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3100
```

### CI Integration

```yaml
# .github/workflows/owasp-zap.yml
name: OWASP ZAP Scan

on: [push]

jobs:
  zap_scan:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3100'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
```

---

## Security Checklist

### ✅ DEVE TER

- [ ] Input validation em TODOS os endpoints
- [ ] Parameterized queries (TypeORM)
- [ ] CSP headers configurados
- [ ] CSRF protection habilitado
- [ ] JWT em HTTP-only cookies (NUNCA localStorage)
- [ ] Secrets em environment variables (NUNCA hardcoded)
- [ ] Rate limiting em endpoints críticos
- [ ] Helmet configurado
- [ ] `npm audit` sem vulnerabilidades críticas
- [ ] HTTPS em produção

### ❌ NUNCA FAZER

- [ ] Usar `eval()` ou `Function()` com input do usuário
- [ ] String concatenation em queries SQL
- [ ] Armazenar senhas em plaintext
- [ ] Expor stack traces em produção
- [ ] Confiar em validação apenas no frontend
- [ ] Usar algoritmos de hash fracos (MD5, SHA1)
- [ ] Desabilitar CORS completamente (`origin: '*'`)
- [ ] Commitar .env no git
- [ ] Usar dependências desatualizadas

---

## Fontes

- [Next.js Security Guide 2025](https://www.turbostarter.dev/blog/complete-nextjs-security-guide-2025-authentication-api-protection-and-best-practices)
- [NestJS Security Best Practices](https://dev.to/drbenzene/best-security-implementation-practices-in-nestjs-a-comprehensive-guide-2p88)
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [NestJS Security Docs](https://docs.nestjs.com/security/helmet)
