# Error Handling Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Padrões de tratamento de erros para NestJS + Next.js

---

## Overview

Estratégia de error handling estruturado em **3 camadas**:

1. **Backend (NestJS)** - Exception Filters + Custom Exceptions
2. **Frontend (Next.js)** - Error Boundaries + Error Handlers
3. **Integration** - Tratamento consistente entre backend e frontend

---

## Backend Error Handling (NestJS)

### Arquitetura de Exceções

```
GlobalExceptionFilter (catch-all)
    ↓
DomainSpecificExceptions
    ├── FinancialDataException
    ├── ScraperException
    ├── AnalysisException
    └── PortfolioException
        ↓
HttpExceptions (NestJS built-in)
    ├── BadRequestException
    ├── NotFoundException
    ├── UnauthorizedException
    └── InternalServerErrorException
```

### Custom Exception Classes

**Localização:** `backend/src/common/exceptions/`

```typescript
// backend/src/common/exceptions/base.exception.ts
export abstract class BaseException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus,
    public readonly errorCode: string,
    public readonly details?: any,
  ) {
    super(
      {
        statusCode: status,
        message,
        errorCode,
        details,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}
```

```typescript
// backend/src/common/exceptions/financial-data.exception.ts
export class FinancialDataException extends BaseException {
  constructor(message: string, details?: any) {
    super(
      message,
      HttpStatus.UNPROCESSABLE_ENTITY,
      'FINANCIAL_DATA_ERROR',
      details,
    );
  }
}

// Uso
throw new FinancialDataException('Precisão Decimal violada', {
  ticker: 'PETR4',
  invalidValue: 123.45, // Float
  expectedType: 'Decimal',
});
```

```typescript
// backend/src/common/exceptions/scraper.exception.ts
export class ScraperException extends BaseException {
  constructor(message: string, details?: any) {
    super(
      message,
      HttpStatus.BAD_GATEWAY,
      'SCRAPER_ERROR',
      details,
    );
  }
}

// Uso
throw new ScraperException('Timeout ao buscar dados', {
  source: 'Fundamentus',
  ticker: 'PETR4',
  timeout: 30000,
});
```

### Error Codes Standardization

**Arquivo:** `backend/src/common/constants/error-codes.ts`

```typescript
export const ErrorCodes = {
  // Financial Data (FIN)
  FIN_INVALID_DECIMAL: 'FIN_001',
  FIN_CROSS_VALIDATION_FAILED: 'FIN_002',
  FIN_TIMEZONE_MISMATCH: 'FIN_003',

  // Scraper (SCR)
  SCR_TIMEOUT: 'SCR_001',
  SCR_INVALID_HTML: 'SCR_002',
  SCR_RATE_LIMIT: 'SCR_003',

  // Analysis (ANL)
  ANL_INSUFFICIENT_DATA: 'ANL_001',
  ANL_INVALID_PARAMETERS: 'ANL_002',

  // Portfolio (PTF)
  PTF_INSUFFICIENT_BALANCE: 'PTF_001',
  PTF_DUPLICATE_POSITION: 'PTF_002',

  // Authentication (AUTH)
  AUTH_INVALID_TOKEN: 'AUTH_001',
  AUTH_EXPIRED_TOKEN: 'AUTH_002',

  // Validation (VAL)
  VAL_REQUIRED_FIELD: 'VAL_001',
  VAL_INVALID_FORMAT: 'VAL_002',
} as const;
```

### Global Exception Filter

**Localização:** `backend/src/common/filters/global-exception.filter.ts`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log estruturado
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
    );

    // Resposta padronizada
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message,
      ...(typeof message === 'object' && message !== null ? message : {}),
    });
  }
}
```

**Registrar no `main.ts`:**

```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aplicar filtro global
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(3101);
}
bootstrap();
```

### Validation Errors (class-validator)

**Padrão de validação com DTOs:**

```typescript
// backend/src/api/analysis/dto/create-analysis.dto.ts
import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class CreateAnalysisDto {
  @IsString()
  ticker: string;

  @IsEnum(['fundamental', 'technical', 'both'])
  analysisType: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;
}
```

**Habilitar ValidationPipe global:**

```typescript
// backend/src/main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove campos não definidos no DTO
      forbidNonWhitelisted: true, // Retorna erro se houver campos extras
      transform: true, // Transforma tipos automaticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(3101);
}
```

**Resposta de erro de validação:**

```json
{
  "statusCode": 400,
  "message": [
    "ticker should not be empty",
    "analysisType must be one of the following values: fundamental, technical, both",
    "priority must not be less than 1"
  ],
  "error": "Bad Request"
}
```

### Custom Validators

```typescript
// backend/src/common/validators/is-valid-ticker.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidTicker', async: false })
export class IsValidTickerConstraint implements ValidatorConstraintInterface {
  validate(ticker: string) {
    // Validar formato de ticker B3
    const regex = /^[A-Z]{4}(3|4|5|6|11)$/;
    return regex.test(ticker);
  }

  defaultMessage() {
    return 'Ticker inválido para B3 (ex: PETR4, VALE3)';
  }
}

export function IsValidTicker(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidTickerConstraint,
    });
  };
}

// Uso no DTO
export class CreateAnalysisDto {
  @IsValidTicker()
  ticker: string;
}
```

---

## Frontend Error Handling (Next.js 14)

### Error Boundaries (App Router)

**Localização:** `app/error.tsx` (global) ou `app/(dashboard)/assets/error.tsx` (scoped)

```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log para serviço de monitoramento (ex: Sentry)
    console.error('Error caught by boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">
          Algo deu errado!
        </h2>
        <p className="text-muted-foreground mb-6">
          {error.message || 'Erro inesperado'}
        </p>
        <Button onClick={() => reset()}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}
```

### API Error Handling

**Centralizar em `lib/api.ts`:**

```typescript
// frontend/src/lib/api.ts
import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3101/api/v1',
  timeout: 30000,
});

// Interceptor de erro
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const errorResponse = error.response?.data;

    // Erro estruturado do backend
    if (errorResponse) {
      throw new ApiError(
        errorResponse.message || 'Erro ao processar requisição',
        errorResponse.statusCode || 500,
        errorResponse.errorCode,
        errorResponse.details,
      );
    }

    // Erro de rede
    if (error.code === 'ECONNABORTED') {
      throw new ApiError('Tempo de resposta excedido', 408);
    }

    if (error.code === 'ERR_NETWORK') {
      throw new ApiError('Erro de conexão com o servidor', 503);
    }

    throw new ApiError('Erro desconhecido', 500);
  },
);

// Custom Error Class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorCode?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorResponse {
  statusCode: number;
  message: string;
  errorCode?: string;
  details?: any;
}
```

### React Query Error Handling

```typescript
// frontend/src/lib/hooks/use-assets.ts
import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { toast } from 'sonner';

export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await api.get('/assets');
      return response.data;
    },
    onError: (error: ApiError) => {
      // Toast de erro
      toast.error('Erro ao carregar assets', {
        description: error.message,
      });

      // Log estruturado
      console.error('useAssets error:', {
        message: error.message,
        statusCode: error.statusCode,
        errorCode: error.errorCode,
        details: error.details,
      });
    },
  });
}
```

### Form Validation Errors

```typescript
// frontend/src/app/(dashboard)/analysis/new/_client.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const analysisSchema = z.object({
  ticker: z.string()
    .regex(/^[A-Z]{4}(3|4|5|6|11)$/, 'Ticker inválido (ex: PETR4)'),
  analysisType: z.enum(['fundamental', 'technical', 'both']),
});

export default function NewAnalysisPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(analysisSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('ticker')} />
      {errors.ticker && (
        <span className="text-sm text-destructive">
          {errors.ticker.message}
        </span>
      )}
    </form>
  );
}
```

---

## Error Logging

### Backend (NestJS Logger)

**NUNCA usar `console.log` - SEMPRE usar Logger:**

```typescript
// ✅ CORRETO
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AssetsService {
  private readonly logger = new Logger(AssetsService.name);

  async findAll() {
    try {
      const assets = await this.repository.find();
      this.logger.log(`Found ${assets.length} assets`);
      return assets;
    } catch (error) {
      this.logger.error('Failed to fetch assets', error.stack);
      throw new InternalServerErrorException('Error fetching assets');
    }
  }
}
```

```typescript
// ❌ ERRADO
console.log('Found assets'); // Não estruturado
console.error('Error'); // Sem contexto
```

### Frontend (Structured Logging)

```typescript
// frontend/src/lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[INFO] ${message}`, meta);
    }
    // Enviar para serviço de log (ex: Datadog)
  },

  error: (message: string, error?: Error, meta?: any) => {
    console.error(`[ERROR] ${message}`, { error, meta });
    // Enviar para Sentry
  },

  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${message}`, meta);
  },
};
```

---

## Best Practices

### ✅ DO

1. **Sempre usar custom exceptions no backend**
2. **Fornecer error codes únicos**
3. **Logar erros com contexto (user ID, request ID, etc)**
4. **Validar input em TODOS os endpoints (DTOs)**
5. **Usar Error Boundaries no frontend**
6. **Exibir mensagens user-friendly (não stack traces)**

### ❌ DON'T

1. **Expor detalhes internos (database queries, stack traces em produção)**
2. **Usar `console.log` para errors (usar Logger)**
3. **Suprimir erros com try-catch vazio**
4. **Retornar 500 para erros de validação (usar 400)**
5. **Hardcoded error messages (usar i18n se multilingual)**

---

## Integration Example

### Backend Controller

```typescript
@Controller('assets')
export class AssetsController {
  private readonly logger = new Logger(AssetsController.name);

  @Get(':ticker')
  async findByTicker(@Param('ticker') ticker: string) {
    this.logger.log(`Fetching asset: ${ticker}`);

    const asset = await this.assetsService.findByTicker(ticker);

    if (!asset) {
      throw new NotFoundException(`Asset ${ticker} not found`);
    }

    return asset;
  }
}
```

### Frontend Consumption

```typescript
export function useAsset(ticker: string) {
  return useQuery({
    queryKey: ['assets', ticker],
    queryFn: async () => {
      try {
        const response = await api.get(`/assets/${ticker}`);
        return response.data;
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 404) {
          toast.error('Asset não encontrado', {
            description: `O ticker ${ticker} não existe na base de dados.`,
          });
        }
        throw error;
      }
    },
  });
}
```

---

## Fontes

- [Error Handling in NestJS - DEV Community](https://dev.to/geampiere/error-handling-in-nestjs-best-practices-and-examples-5e76)
- [NestJS Error Handling - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/error-handling-nestjs/)
- [NestJS Exception Filters - Official Docs](https://docs.nestjs.com/exception-filters)
- [Next.js Error Handling - Official Docs](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Query Error Handling](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
