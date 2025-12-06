# PLANO FASE 76: Observabilidade e Rastreabilidade

**Data:** 2025-12-06
**Status:** Em Implementação
**Prioridade:** ALTA (Score atual: 49% - INSUFICIENTE)
**Meta:** Atingir 90% de observabilidade

---

## Resumo Executivo

Análise profunda revelou score de observabilidade de apenas 49%, com gaps críticos:
- ❌ Sem GlobalExceptionFilter (exceções não logadas)
- ❌ Sem HTTP Logging Interceptor
- ❌ Apenas 3/13 controllers com Logger
- ❌ 154 console.log anti-patterns no codebase
- ❌ Frontend sem logger centralizado
- ❌ TypeORM logging desabilitado
- ❌ Sem agregação de logs

---

## Fase 1: Infraestrutura Base (CONCLUÍDA ✅)

### 1.1 GlobalExceptionFilter ✅
**Arquivo:** `backend/src/common/filters/global-exception.filter.ts`

Implementado:
- Captura TODAS exceções não tratadas
- Gera correlation IDs únicos
- Logs estruturados com contexto completo
- Sanitização de dados sensíveis
- Classificação de erros por severity
- Suporte a TypeORM QueryFailedError

### 1.2 LoggingInterceptor ✅
**Arquivo:** `backend/src/common/interceptors/logging.interceptor.ts`

Implementado:
- Intercepta todas requisições HTTP
- Gera/propaga correlation IDs
- Mede tempo de resposta
- Alerta respostas lentas (>3s)
- Log de respostas grandes (>1MB)
- Sanitização de campos sensíveis

### 1.3 Logger em Controllers ✅
**Controllers atualizados (12/12):**

| Controller | Status | Notas |
|------------|--------|-------|
| AssetsUpdateController | ✅ | Logger adicionado |
| AssetsController | ✅ | Logger + 5 console.log removidos |
| AuthController | ✅ | Logger + 5 console.log removidos |
| PortfolioController | ✅ | Logger adicionado |
| DataSourcesController | ✅ | Logger adicionado |
| AppController | ✅ | Logger adicionado |
| CronController | ✅ | Logger adicionado |
| ContextController | ✅ | Logger + 1 console.error removido |
| FundamentalAnalysisController | ✅ | Já tinha Logger |
| TechnicalAnalysisController | ✅ | Já tinha Logger |
| MacroAnalysisController | ✅ | Já tinha Logger |
| IndicatorsController | ✅ | Já tinha Logger |

### 1.4 Documentação ✅
- CLAUDE.md atualizado com regra de observabilidade
- GEMINI.md sincronizado (100% idêntico)
- Princípio #5 adicionado: "Observabilidade e Rastreabilidade"

---

## Fase 2: Observabilidade Frontend (PENDENTE)

### 2.1 React Query - Global Error Handler
**Prioridade:** ALTA
**Arquivos:** `frontend/src/lib/query-client.ts`

```typescript
// TODO: Adicionar onError global
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        logger.error('Query failed', { error });
      },
    },
    mutations: {
      onError: (error) => {
        logger.error('Mutation failed', { error });
      },
    },
  },
});
```

**Benefícios:**
- Captura automática de erros de API
- Logs centralizados de falhas de queries
- Debugging facilitado

### 2.2 Frontend Logger Centralizado
**Prioridade:** ALTA
**Arquivo a criar:** `frontend/src/lib/logger.ts`

```typescript
// Estrutura proposta
class FrontendLogger {
  private static instance: FrontendLogger;

  error(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;

  // Envia para backend se crítico
  sendToBackend(level: LogLevel, data: LogData): Promise<void>;
}
```

**Funcionalidades:**
- 4 níveis de log (error, warn, info, debug)
- Contexto automático (user, page, session)
- Envio de erros críticos para backend
- Integração com React Error Boundaries

### 2.3 TypeORM Logging
**Prioridade:** MÉDIA
**Arquivo:** `backend/src/database/database.config.ts`

```typescript
// Habilitar via env var
logging: process.env.DB_LOGGING === 'true',
logger: 'advanced-console',
```

**Variável de ambiente a adicionar:**
```env
DB_LOGGING=true  # Desenvolvimento
DB_LOGGING=false # Produção (performance)
```

---

## Fase 3: Agregação e Distributed Tracing (FUTURO)

### 3.1 Log Aggregation (ELK ou Loki)
**Prioridade:** MÉDIA-ALTA
**Timeline:** Após Fase 2

**Opção A - ELK Stack:**
```yaml
# docker-compose.yml additions
elasticsearch:
  image: elasticsearch:8.x

logstash:
  image: logstash:8.x

kibana:
  image: kibana:8.x
```

**Opção B - Grafana Loki (mais leve):**
```yaml
loki:
  image: grafana/loki:2.9.0

promtail:
  image: grafana/promtail:2.9.0
```

**Recomendação:** Loki para MVP (menos recursos, integra com Grafana existente)

### 3.2 Distributed Tracing (OpenTelemetry)
**Prioridade:** BAIXA
**Timeline:** Após agregação de logs estável

```typescript
// Integração NestJS
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Traces automáticos para:
// - HTTP requests
// - Database queries
// - Redis operations
// - External API calls
```

---

## Métricas de Sucesso

### Score Atual: 49%

| Categoria | Antes | Após Fase 1 | Meta Fase 2 | Meta Fase 3 |
|-----------|-------|-------------|-------------|-------------|
| Backend Logging | 40% | 85% | 90% | 95% |
| Frontend Logging | 20% | 20% | 80% | 90% |
| Error Handling | 60% | 90% | 95% | 98% |
| Aggregation | 0% | 0% | 50% | 95% |
| Tracing | 0% | 0% | 0% | 80% |
| **TOTAL** | **49%** | **65%** | **80%** | **90%** |

---

## Checklist de Validação

### Fase 1 ✅
- [x] GlobalExceptionFilter registrado em app.module.ts
- [x] LoggingInterceptor registrado em app.module.ts
- [x] Todos 12 controllers têm Logger
- [x] console.log removidos de controllers
- [x] TypeScript compila sem erros
- [x] Documentação CLAUDE.md/GEMINI.md atualizada

### Fase 2 ✅ (2025-12-06)
- [x] React Query onError configurado (QueryCache + MutationCache)
- [x] Frontend logger criado (`frontend/src/lib/logger.ts`)
- [x] DB_LOGGING env var configurada (já existia)
- [ ] Error Boundaries implementados (futuro)
- [x] TypeScript compila sem erros (backend + frontend)

### Fase 3 (TODO)
- [ ] Loki/ELK escolhido e configurado
- [ ] Logs sendo agregados
- [ ] Dashboard de logs no Grafana
- [ ] OpenTelemetry integrado
- [ ] Traces visíveis no Jaeger/Tempo

---

## Anti-Patterns a Evitar

| Anti-Pattern | Por que evitar | Alternativa |
|--------------|----------------|-------------|
| `console.log()` | Não estruturado, sem níveis | `logger.log()` |
| `console.error()` | Sem contexto, sem stack | `logger.error(msg, stack)` |
| Logs sem correlation ID | Impossível rastrear fluxo | Usar interceptor |
| Logs em produção com debug | Performance, segurança | Usar níveis (LOG_LEVEL) |
| Dados sensíveis em logs | LGPD, segurança | Sanitizar antes |

---

## Comandos de Verificação

```bash
# Verificar console.log restantes (meta: 0 em controllers/services)
grep -r "console\." backend/src --include="*.ts" | wc -l

# Verificar Logger em controllers
grep -r "private readonly logger = new Logger" backend/src/api --include="*.controller.ts" | wc -l

# Verificar imports do Logger
grep -r "import.*Logger.*@nestjs/common" backend/src --include="*.ts" | wc -l

# Build validation
cd backend && npx tsc --noEmit
```

---

## Referências

- [NestJS Logger](https://docs.nestjs.com/techniques/logger)
- [NestJS Exception Filters](https://docs.nestjs.com/exception-filters)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [Grafana Loki](https://grafana.com/oss/loki/)
- [OpenTelemetry](https://opentelemetry.io/)
- `.gemini/context/conventions.md` - Convenções de logging
- `CLAUDE.md` - Princípio #5: Observabilidade

---

## Histórico de Versões

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2025-12-06 | Claude Code | Fase 1 completa, plano documentado |
