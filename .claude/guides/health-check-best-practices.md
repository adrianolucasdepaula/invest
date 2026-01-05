# Health Check Best Practices

**Criado:** 2025-12-21
**Última Atualização:** 2025-12-21
**Contexto:** FASE 135 (Orchestrator Removal) + FASE 137 (API Service Health Check Fix)

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Lições Aprendidas](#lições-aprendidas)
3. [Padrões Recomendados](#padrões-recomendados)
4. [Implementação](#implementação)
5. [Exemplos](#exemplos)
6. [Anti-Patterns](#anti-patterns)

---

## Visão Geral

Health checks são **críticos para container orchestration** (Docker, Kubernetes), mas podem causar **false positives** e **false negatives** se mal implementados.

### Problemas Comuns

| Problema | Impacto | Exemplo Real |
|----------|---------|--------------|
| **False Positive** | Container marcado "healthy" mas não funciona | Orchestrator FASE 135: testava só Redis, não services internos |
| **False Negative** | Container funcional marcado "unhealthy" | API Service FASE 137: timeout em I/O sob carga |
| **Heavy I/O** | Health check travado durante operações lentas | Database/Redis ping timeout |
| **Timeout Inadequado** | Health check falha antes de completar | Docker timeout 10s, operação leva 15s |

---

## Lições Aprendidas

### FASE 135: Orchestrator False Positive

**Problema:**
```python
async def health_check(self):
    return {
        "status": "healthy",  # ← Sempre "healthy"!
        "redis": await redis.ping()
    }
```

**Root Cause:**
- Health check testava apenas **Redis ping** (dependência externa)
- Não testava se **services internos** estavam funcionando
- Todos os 4 services internos em ERROR, mas health = "healthy"

**Lição:** Health checks devem testar **funcionalidade real**, não apenas dependências.

---

### FASE 137: API Service Timeout

**Problema:**
```python
@app.get("/health")
async def health_check():
    db.execute_query("SELECT 1")  # ← Pode travar!
    redis_client.client.ping()     # ← Pode travar!
    # ... mais I/O pesado
```

**Root Cause:**
- Health check fazia I/O pesado (PostgreSQL, Redis, import scrapers)
- Docker timeout: 10s
- Quando dependências estavam sob carga → timeout → unhealthy
- Container funcional marcado como unhealthy (false negative)

**Lição:** Health checks de **liveness probe** devem ser **lightweight** (sem I/O).

---

## Padrões Recomendados

### 1. Liveness vs Readiness Probes

Kubernetes/Docker diferenciam dois tipos de health checks:

| Tipo | Propósito | O que testar |
|------|-----------|--------------|
| **Liveness** | "O processo está vivo?" | Apenas disponibilidade da API (sem I/O) |
| **Readiness** | "O container está pronto para receber tráfego?" | Dependências (DB, Redis, external services) |

**Best Practice:**
- Liveness: `/health` - lightweight, retorna imediatamente
- Readiness: `/health/detailed` - comprehensive, testa tudo

---

### 2. Lightweight Health Check

**DO: Testar apenas disponibilidade do processo**

```python
@app.get("/health")
async def health_check():
    """
    Lightweight health check for container orchestration.

    IMPORTANT: No I/O operations - responds immediately.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "my-service",
        "version": "1.0.0"
    }
```

**Características:**
- ✅ Sem I/O (database, redis, filesystem)
- ✅ Retorna em <100ms
- ✅ Apenas indica: "processo está rodando"

---

### 3. Detailed Health Check

**DO: Testar dependências de forma robusta**

```python
@app.get("/health/detailed")
async def health_check_detailed():
    """
    Comprehensive health check with dependency validation.

    WARNING: Performs I/O operations, may be slow under load.
    DO NOT use for Docker/K8s liveness probe.
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {}
    }

    issues = []

    # Test Database (com timeout)
    try:
        with timeout_context(seconds=2):  # ← Timeout explícito
            db.execute_query("SELECT 1")
            health_status["components"]["database"] = {
                "status": "healthy",
                "message": "PostgreSQL connection active"
            }
    except TimeoutError:
        health_status["components"]["database"] = {
            "status": "unhealthy",
            "message": "Database query timeout (>2s)"
        }
        issues.append("database")
    except Exception as e:
        health_status["components"]["database"] = {
            "status": "unhealthy",
            "message": f"Database error: {str(e)}"
        }
        issues.append("database")

    # Set overall status
    if len(issues) > 0:
        health_status["status"] = "degraded" if len(issues) < 3 else "unhealthy"
        health_status["issues"] = issues

    return health_status
```

**Características:**
- ✅ Testa funcionalidade real (não apenas ping)
- ✅ Timeout explícito em cada operação de I/O
- ✅ Retorna status granular (healthy, degraded, unhealthy)
- ✅ Lista issues específicos para debugging

---

### 4. Docker Compose Configuration

**DO: Usar health check lightweight com timeouts adequados**

```yaml
api-service:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s        # Frequência de teste
    timeout: 10s         # Timeout do comando curl
    retries: 3           # Tentativas antes de marcar unhealthy
    start_period: 40s    # Grace period durante startup
```

**Parâmetros:**
- `interval`: Frequência de execução (recomendado: 30s)
- `timeout`: Máximo para comando completar (recomendado: 10s)
- `retries`: Falhas consecutivas antes de unhealthy (recomendado: 3)
- `start_period`: Grace period após container start (depende do app)

---

## Implementação

### Checklist de Implementação

- [ ] Criar endpoint `/health` (lightweight, sem I/O)
- [ ] Criar endpoint `/health/detailed` (comprehensive, com I/O)
- [ ] Adicionar timeout explícito em operações de I/O
- [ ] Configurar Docker health check para `/health`
- [ ] Documentar diferença entre liveness e readiness
- [ ] Testar sob carga (simular dependências lentas)
- [ ] Validar que container fica healthy após startup

---

### Template FastAPI

```python
# Lightweight health check (Docker/K8s liveness probe)
@app.get("/health")
async def health_check():
    """
    Lightweight health check - responds immediately.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "my-service",
        "version": "1.0.0"
    }

# Detailed health check (monitoring/debugging)
@app.get("/health/detailed")
async def health_check_detailed():
    """
    Comprehensive health check - tests all dependencies.
    """
    # Implementation above
    pass
```

---

### Template NestJS

```typescript
// Lightweight health check
@Get('health')
healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'my-service',
    version: '1.0.0',
  };
}

// Detailed health check
@Get('health/detailed')
async healthCheckDetailed() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    components: {} as Record<string, any>,
  };

  const issues: string[] = [];

  // Test Database
  try {
    await this.dataSource.query('SELECT 1');
    health.components.database = {
      status: 'healthy',
      message: 'PostgreSQL connection active',
    };
  } catch (error) {
    health.components.database = {
      status: 'unhealthy',
      message: `Database error: ${error.message}`,
    };
    issues.push('database');
  }

  // Set overall status
  if (issues.length > 0) {
    health.status = issues.length >= 3 ? 'unhealthy' : 'degraded';
    health['issues'] = issues;
  }

  return health;
}
```

---

## Exemplos

### Exemplo 1: Health Check com Timeout Context

```python
import asyncio
from contextlib import asynccontextmanager

@asynccontextmanager
async def timeout_context(seconds: int):
    """Context manager para timeout de operações async."""
    try:
        async with asyncio.timeout(seconds):
            yield
    except asyncio.TimeoutError:
        raise TimeoutError(f"Operation exceeded timeout of {seconds}s")

@app.get("/health/detailed")
async def health_check_detailed():
    health_status = {"status": "healthy", "components": {}}

    # Database com timeout
    try:
        async with timeout_context(seconds=2):
            await db.execute_query("SELECT 1")
            health_status["components"]["database"] = {"status": "healthy"}
    except TimeoutError:
        health_status["components"]["database"] = {
            "status": "unhealthy",
            "message": "Query timeout (>2s)"
        }

    return health_status
```

---

### Exemplo 2: Health Check com Status Granular

```python
from enum import Enum

class HealthStatus(str, Enum):
    HEALTHY = "healthy"      # Tudo OK
    DEGRADED = "degraded"    # Alguns componentes com problema
    UNHEALTHY = "unhealthy"  # Muitos componentes falhando

@app.get("/health/detailed")
async def health_check_detailed():
    components = {
        "api": "healthy",
        "database": "healthy",
        "redis": "unhealthy",  # ← Redis falhando
        "scrapers": "healthy"
    }

    unhealthy_count = sum(1 for status in components.values() if status == "unhealthy")

    if unhealthy_count == 0:
        overall_status = HealthStatus.HEALTHY
    elif unhealthy_count < 2:
        overall_status = HealthStatus.DEGRADED
    else:
        overall_status = HealthStatus.UNHEALTHY

    return {
        "status": overall_status,
        "components": components
    }
```

---

## Anti-Patterns

### ❌ ERRADO: Heavy I/O no Health Check Principal

```python
# ❌ NÃO FAZER
@app.get("/health")
async def health_check():
    db.execute_query("SELECT 1")           # ← Pode travar!
    redis.ping()                            # ← Pode travar!
    scraper_count = len(load_scrapers())   # ← Lento!
    return {"status": "healthy"}
```

**Por que é ruim:**
- Docker timeout 10s pode não ser suficiente
- Dependências sob carga causam timeout
- Container funcional marcado unhealthy

---

### ❌ ERRADO: Testar Apenas Dependências

```python
# ❌ NÃO FAZER
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "redis": redis.ping()  # ← Testa Redis, não o service!
    }
```

**Por que é ruim:**
- Redis OK ≠ Service funcional
- Pode ter bugs críticos no service
- False positive (FASE 135)

---

### ❌ ERRADO: Timeout Inadequado

```yaml
# ❌ NÃO FAZER
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health/detailed"]
  timeout: 5s  # ← Muito curto para endpoint pesado!
```

**Por que é ruim:**
- Endpoint `/health/detailed` faz I/O pesado
- Timeout 5s insuficiente
- False negatives frequentes

---

### ✅ CORRETO: Dois Endpoints Separados

```python
# ✅ FAZER
@app.get("/health")  # ← Docker usa este
async def health_check():
    return {"status": "healthy"}  # Sem I/O

@app.get("/health/detailed")  # ← Monitoring usa este
async def health_check_detailed():
    # ... testa tudo com timeout
    pass
```

```yaml
# Docker usa lightweight
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  timeout: 10s
```

---

## Resumo

| Aspecto | Liveness (/health) | Readiness (/health/detailed) |
|---------|-------------------|------------------------------|
| **Propósito** | "Processo vivo?" | "Pronto para tráfego?" |
| **I/O** | ❌ Nenhum | ✅ Com timeout |
| **Resposta** | <100ms | <5s |
| **Usado por** | Docker, K8s | Monitoring, debugging |
| **False negatives** | Raros | Possíveis sob carga |

---

**Referências:**
- FASE 135: Orchestrator Removal (False positive health check)
- FASE 137: API Service Health Check Fix (Timeout issues)
- [Kubernetes Health Checks](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Docker Healthcheck](https://docs.docker.com/engine/reference/builder/#healthcheck)
