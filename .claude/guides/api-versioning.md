# API Versioning Guide

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Estratégia de versionamento de API para NestJS backend

---

## Overview

Versionamento de API permite evoluir o backend mantendo compatibilidade com clientes antigos.

**Estratégia do Projeto:** URL-based versioning (`/api/v1`, `/api/v2`)

---

## Why Version APIs?

### Problemas sem Versionamento

- ❌ Breaking changes quebram aplicações de clientes
- ❌ Impossível deprecar features antigas
- ❌ Rollback complicado em caso de problemas
- ❌ Impossível A/B testing de novas features

### Benefícios do Versionamento

- ✅ Compatibilidade retroativa garantida
- ✅ Evolução gradual da API
- ✅ Migração controlada de clientes
- ✅ Rollback seguro quando necessário
- ✅ Múltiplas versões em produção simultânea

---

## Versioning Strategy: URL-based

### Por que URL-based?

**Vantagens:**

- Simples e explícito
- Fácil testar com ferramentas (Postman, cURL)
- Cache-friendly (diferentes URLs = diferentes caches)
- Não requer headers customizados

**Alternativas Rejeitadas:**

| Estratégia | Por que NÃO usar |
|------------|------------------|
| Header-based (`Accept: application/vnd.api.v1+json`) | Complexo para testar, não cache-friendly |
| Query param (`/api/assets?version=1`) | Não é RESTful, confunde com filtros |
| Custom header (`X-API-Version: 1`) | Não é padrão, dificulta debugging |

---

## NestJS Versioning Implementation

### Setup Global Versioning

**Arquivo:** `backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar versionamento global
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // Versão default
    prefix: 'api/v', // Prefixo: /api/v1, /api/v2
  });

  await app.listen(3101);
}
bootstrap();
```

### Controller Versioning

**Opção 1: Versão por Controller**

```typescript
import { Controller, Get, Version } from '@nestjs/common';

@Controller('assets')
export class AssetsController {
  // GET /api/v1/assets
  @Get()
  @Version('1')
  findAllV1() {
    return this.assetsService.findAll();
  }

  // GET /api/v2/assets (nova versão com filtros)
  @Get()
  @Version('2')
  findAllV2(@Query() filters: AssetFiltersDto) {
    return this.assetsService.findAllWithFilters(filters);
  }
}
```

**Opção 2: Controller Separado por Versão**

```typescript
// backend/src/api/assets/v1/assets.controller.ts
@Controller({
  path: 'assets',
  version: '1',
})
export class AssetsControllerV1 {
  @Get()
  findAll() {
    return this.assetsService.findAll();
  }
}

// backend/src/api/assets/v2/assets.controller.ts
@Controller({
  path: 'assets',
  version: '2',
})
export class AssetsControllerV2 {
  @Get()
  findAll(@Query() filters: AssetFiltersDto) {
    return this.assetsService.findAllWithFilters(filters);
  }
}
```

**Quando usar cada abordagem:**

| Cenário | Abordagem Recomendada |
|---------|----------------------|
| Poucas mudanças (1-2 endpoints) | Opção 1: Versão por endpoint |
| Mudanças grandes (>50% endpoints) | Opção 2: Controller separado |
| Breaking changes no DTO | Opção 2: Controller + DTO separados |

### Múltiplas Versões Simultâneas

```typescript
@Controller('analysis')
export class AnalysisController {
  // Suporta v1 e v2
  @Get(':id')
  @Version(['1', '2'])
  findOne(@Param('id') id: string) {
    return this.analysisService.findOne(id);
  }

  // Apenas v3
  @Get(':id')
  @Version('3')
  async findOneV3(@Param('id') id: string) {
    const analysis = await this.analysisService.findOne(id);
    return this.enrichWithAI(analysis); // Nova feature apenas v3
  }
}
```

---

## Semantic Versioning

### Version Number Format: MAJOR.MINOR.PATCH

```
/api/v1.2.3
     │ │ │
     │ │ └── PATCH: Bug fixes (retrocompatíveis)
     │ └──── MINOR: Novas features (retrocompatíveis)
     └────── MAJOR: Breaking changes (NÃO retrocompatíveis)
```

**Exemplos:**

| Mudança | Versão Anterior | Nova Versão | Tipo |
|---------|-----------------|-------------|------|
| Adicionar campo opcional `description` | 1.2.3 | 1.3.0 | MINOR |
| Corrigir cálculo de P/L | 1.2.3 | 1.2.4 | PATCH |
| Renomear campo `ticker` → `symbol` | 1.2.3 | 2.0.0 | MAJOR |
| Adicionar filtro opcional | 1.2.3 | 1.3.0 | MINOR |
| Remover endpoint `/legacy` | 1.2.3 | 2.0.0 | MAJOR |

### O que é Breaking Change?

**Breaking Changes (requerem MAJOR bump):**

- ❌ Renomear campo no response
- ❌ Remover campo do response
- ❌ Mudar tipo de campo (string → number)
- ❌ Tornar campo opcional obrigatório
- ❌ Mudar formato (ISO date → Unix timestamp)
- ❌ Remover endpoint
- ❌ Mudar status code (200 → 201)

**Non-Breaking Changes (MINOR ou PATCH):**

- ✅ Adicionar campo novo (opcional)
- ✅ Adicionar endpoint novo
- ✅ Tornar campo obrigatório opcional
- ✅ Corrigir bug
- ✅ Adicionar valores em enum
- ✅ Melhorar performance

---

## Deprecation Policy

### Timeline de Deprecação

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ v2.0.0      │ v2.1.0      │ v2.2.0      │ v3.0.0      │
│ Released    │ Deprecate   │ Warn        │ Remove      │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Feature OK  │ @deprecated │ Warning log │ Removed     │
└─────────────┴─────────────┴─────────────┴─────────────┘
       ▲            ▲            ▲            ▲
     Hoje      +1 release   +2 releases  +3 releases
                (3 meses)    (6 meses)    (9 meses)
```

**Regra:** Mínimo **6 meses** entre deprecação e remoção (2 minor releases)

### Comunicar Deprecação

**1. Response Header:**

```typescript
@Get()
@Version('1')
@Header('Deprecation', 'true')
@Header('Sunset', '2025-12-31') // RFC 8594
@Header('Link', '</api/v2/assets>; rel="successor-version"')
findAllV1() {
  return this.assetsService.findAll();
}
```

**2. Logging de Uso:**

```typescript
@Get()
@Version('1')
findAllV1() {
  this.logger.warn('DEPRECATED: /api/v1/assets called. Migrate to v2 by 2025-12-31');
  return this.assetsService.findAll();
}
```

**3. Documentação (OpenAPI/Swagger):**

```typescript
@ApiOperation({
  summary: 'List all assets',
  deprecated: true,
  description: '⚠️ DEPRECATED: Use /api/v2/assets. Will be removed on 2025-12-31',
})
@Get()
@Version('1')
findAllV1() {
  return this.assetsService.findAll();
}
```

**4. Changelog Entry:**

```markdown
## [2.1.0] - 2025-06-01

### Deprecated
- `GET /api/v1/assets` - Use `/api/v2/assets` instead. V1 will be removed in v3.0.0 (Dec 2025)

### Migration Guide
**Before (v1):**
```json
GET /api/v1/assets
{ "assets": [...] }
```

**After (v2):**
```json
GET /api/v2/assets?filters[sector]=energy
{ "data": [...], "meta": { "total": 861 } }
```
```

---

## Migration Guides

### Template de Migration Guide

**Arquivo:** `docs/migrations/v1-to-v2.md`

```markdown
# Migration Guide: v1 → v2

**Release Date:** 2025-06-01
**Breaking Changes:** Yes
**Deprecation Timeline:** v1 deprecated in 2.1.0, removed in 3.0.0

---

## Breaking Changes

### 1. Assets Endpoint - Response Structure

**Before (v1):**
```json
GET /api/v1/assets
{
  "assets": [
    { "ticker": "PETR4", "price": 38.50 }
  ]
}
```

**After (v2):**
```json
GET /api/v2/assets
{
  "data": [
    { "ticker": "PETR4", "currentPrice": 38.50 }
  ],
  "meta": {
    "total": 861,
    "page": 1,
    "perPage": 50
  }
}
```

**Code Changes:**
```typescript
// ❌ ANTES (v1)
const { assets } = await api.get('/api/v1/assets');

// ✅ DEPOIS (v2)
const { data: assets, meta } = await api.get('/api/v2/assets');
```

### 2. Date Format - ISO 8601

**Before (v1):**
```json
{ "createdAt": "2025-06-01 10:30:00" }
```

**After (v2):**
```json
{ "createdAt": "2025-06-01T10:30:00-03:00" }
```

---

## Migration Steps

1. Update API client to use `/api/v2`
2. Update response parsing (`.assets` → `.data`)
3. Test in staging environment
4. Deploy to production
5. Monitor error logs for 7 days

---

## Support

- Slack: #api-v2-migration
- Email: dev@company.com
- Office Hours: Fridays 10-12am BRT
```

---

## Backwards Compatibility

### Adapter Pattern

**Quando:** v2 muda estrutura, mas lógica de negócio é a mesma

```typescript
// backend/src/api/assets/v1/assets.controller.ts
@Controller({ path: 'assets', version: '1' })
export class AssetsControllerV1 {
  constructor(
    private assetsService: AssetsService,
    private v1Adapter: AssetsV1Adapter, // Adapter
  ) {}

  @Get()
  async findAll() {
    const result = await this.assetsService.findAllWithFilters({});
    // Adaptar resposta v2 → v1
    return this.v1Adapter.toV1Response(result);
  }
}

// backend/src/api/assets/v1/assets-v1.adapter.ts
@Injectable()
export class AssetsV1Adapter {
  toV1Response(v2Response: AssetsV2Response): AssetsV1Response {
    return {
      assets: v2Response.data.map((asset) => ({
        ticker: asset.ticker,
        price: asset.currentPrice, // Renomear campo
        // Omitir campos novos (sector, etc)
      })),
      // Omitir meta
    };
  }
}
```

### Feature Flags

**Quando:** Release gradual de feature nova

```typescript
@Get()
@Version('2')
async findAll(@Query() filters: AssetFiltersDto) {
  const useNewAlgorithm = await this.featureFlags.isEnabled('new-sorting-algo');

  if (useNewAlgorithm) {
    return this.assetsService.findAllWithNewSort(filters);
  }

  return this.assetsService.findAllWithFilters(filters);
}
```

---

## Testing Versioned APIs

### E2E Tests per Version

```typescript
// test/e2e/assets-v1.e2e-spec.ts
describe('Assets API v1', () => {
  it('/api/v1/assets (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/assets')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('assets');
        expect(Array.isArray(res.body.assets)).toBe(true);
      });
  });
});

// test/e2e/assets-v2.e2e-spec.ts
describe('Assets API v2', () => {
  it('/api/v2/assets (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v2/assets')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('meta');
        expect(res.body.meta).toHaveProperty('total');
      });
  });
});
```

### Contract Testing

**Validar que v1 continua funcionando após mudanças em v2:**

```typescript
describe('API Contract - v1 backwards compatibility', () => {
  it('v1 response deve manter estrutura original', () => {
    const v1Schema = {
      type: 'object',
      properties: {
        assets: { type: 'array' },
      },
      required: ['assets'],
    };

    return request(app.getHttpServer())
      .get('/api/v1/assets')
      .expect(200)
      .expect((res) => {
        const validate = ajv.compile(v1Schema);
        expect(validate(res.body)).toBe(true);
      });
  });
});
```

---

## OpenAPI/Swagger Documentation

### Configurar Múltiplas Versões

```typescript
// backend/src/main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger para v1
  const configV1 = new DocumentBuilder()
    .setTitle('B3 AI Analysis API')
    .setDescription('⚠️ DEPRECATED: Use v2')
    .setVersion('1.0')
    .build();
  const documentV1 = SwaggerModule.createDocument(app, configV1, {
    include: [AssetsModuleV1],
  });
  SwaggerModule.setup('api/v1/docs', app, documentV1);

  // Swagger para v2
  const configV2 = new DocumentBuilder()
    .setTitle('B3 AI Analysis API')
    .setDescription('Latest version - Recommended')
    .setVersion('2.0')
    .build();
  const documentV2 = SwaggerModule.createDocument(app, configV2, {
    include: [AssetsModuleV2],
  });
  SwaggerModule.setup('api/v2/docs', app, documentV2);

  await app.listen(3101);
}
```

**URLs:**
- v1 docs: http://localhost:3101/api/v1/docs
- v2 docs: http://localhost:3101/api/v2/docs

---

## Monitoring Versioned APIs

### Track Version Usage

```typescript
@Injectable()
export class VersionMetricsInterceptor implements NestInterceptor {
  constructor(private metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const version = this.extractVersion(request.url);

    this.metricsService.increment(`api.version.${version}.requests`);

    return next.handle();
  }

  private extractVersion(url: string): string {
    const match = url.match(/\/api\/v(\d+)\//);
    return match ? match[1] : 'unknown';
  }
}
```

### Alertas de Versão Antiga

```typescript
@Injectable()
export class DeprecationWarningInterceptor implements NestInterceptor {
  private readonly logger = new Logger(DeprecationWarningInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    if (request.url.includes('/api/v1/')) {
      this.logger.warn(`DEPRECATED API called: ${request.url} from ${request.ip}`);

      // Alertar se uso de v1 > 10% do total
      const v1Percentage = this.metricsService.get('api.v1.percentage');
      if (v1Percentage > 10) {
        this.alertsService.send('High v1 usage detected', { percentage: v1Percentage });
      }
    }

    return next.handle();
  }
}
```

---

## Best Practices

### ✅ DO

1. **Sempre versionar breaking changes**
2. **Manter v1 por mínimo 6 meses após lançar v2**
3. **Documentar TODAS as breaking changes**
4. **Criar migration guides detalhados**
5. **Testar ambas versões em E2E**
6. **Monitorar uso de versões antigas**
7. **Avisar clientes com antecedência (3+ meses)**
8. **Usar semantic versioning (MAJOR.MINOR.PATCH)**

### ❌ DON'T

1. **Fazer breaking changes sem bump de versão**
2. **Remover v1 sem aviso prévio**
3. **Duplicar toda lógica de negócio (usar Adapters)**
4. **Versionar TUDO (só o necessário)**
5. **Manter versões antigas por tempo indefinido**
6. **Ignorar feedback de clientes sobre migração**

---

## Quando NÃO Versionar

**Mudanças que NÃO requerem nova versão:**

- Adicionar campo opcional
- Corrigir bug
- Melhorar performance (sem mudar contrato)
- Adicionar novo endpoint
- Atualizar documentação

**Exemplo:**

```typescript
// ✅ CORRETO: Adicionar campo opcional sem nova versão
export class AssetDto {
  ticker: string;
  currentPrice: Decimal;
  sector?: string; // NOVO, mas opcional → MINOR bump (1.2.0 → 1.3.0)
}
```

---

## Roadmap de Versões (Exemplo)

| Versão | Release | Deprecated | Removed | Status |
|--------|---------|------------|---------|--------|
| v1.0 | 2024-01-01 | 2025-06-01 | 2026-01-01 | 🟡 Deprecated |
| v2.0 | 2025-06-01 | - | - | ✅ Current |
| v3.0 | 2026-01-01 | - | - | 📋 Planned |

---

## Fontes

- [API Versioning Best Practices - Devzery](https://www.devzery.com/post/versioning-rest-api-strategies-best-practices-2025)
- [REST API Versioning - DEV Community](https://dev.to/jobayer6735/rest-api-versioning-best-practices-complete-guide-with-examples-4h3)
- [NestJS Versioning - Official Docs](https://docs.nestjs.com/techniques/versioning)
- [Semantic Versioning 2.0.0](https://semver.org/)
- [RFC 8594 - Sunset HTTP Header](https://datatracker.ietf.org/doc/html/rfc8594)
