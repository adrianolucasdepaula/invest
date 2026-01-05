# Development Principles

**Project:** B3 AI Analysis Platform
**Last Updated:** 2025-12-21
**Purpose:** Princípios fundamentais de desenvolvimento do projeto

---

## Overview

Estes princípios guiam TODAS as decisões de desenvolvimento no projeto.

**Princípio Central:** Quality > Velocity ("Não Ter Pressa")

---

## 1. Quality > Velocity ("Não Ter Pressa")

### Princípio Fundamental

Priorizar correção definitiva sobre fix rápido.

### Regras

- ✅ Tempo adequado para análise profunda (Ultra-Thinking)
- ✅ Não pular etapas de validação
- ✅ Code review obrigatório antes de próxima fase
- ❌ Pressão por deadlines NÃO justifica baixa qualidade
- ❌ NUNCA fazer workarounds temporários que se tornam permanentes

### Justificativa

Correções apressadas criam débito técnico que se acumula. O custo de refatorar depois é exponencialmente maior.

**Exemplo:**

```typescript
// ❌ ERRADO: Fix rápido (workaround)
try {
  await service.process(data);
} catch {
  // Ignorar erro e continuar
}

// ✅ CORRETO: Análise profunda + correção definitiva
try {
  await service.process(data);
} catch (error) {
  // 1. Logar com contexto completo
  this.logger.error('Processing failed', { data, error: error.stack });

  // 2. Identificar root cause
  if (error.code === 'ECONNREFUSED') {
    throw new ServiceUnavailableException('Database connection failed');
  }

  // 3. Tratamento apropriado
  throw error;
}
```

**Referência:** `VALIDACAO_REGRAS_DOCUMENTACAO_2025-11-27.md` - Regra 1.6

---

## 2. KISS Principle (Keep It Simple, Stupid)

### Objetivo

Evitar complexidade desnecessária.

### Regras

- ✅ Usar melhores práticas comprovadas e modernas
- ✅ Soluções simples e diretas quando possível
- ✅ Código legível > Código "inteligente"
- ❌ Over-engineering
- ❌ Abstrações prematuras

### Aplicação Prática

**"Moderno e funcional" ≠ "Complexo"**

Simplicidade é sofisticação.

**Exemplo:**

```typescript
// ❌ ERRADO: Over-engineering (abstração prematura)
class AbstractStrategyFactory<T> {
  createStrategy(type: string): Strategy<T> {
    return this.strategyRegistry.get(type) || this.defaultStrategy;
  }
}

// ✅ CORRETO: Direto e simples
function getAnalysisService(type: 'fundamental' | 'technical') {
  return type === 'fundamental'
    ? new FundamentalService()
    : new TechnicalService();
}
```

**Quando complexidade é justificada:**

- Múltiplas implementações futuras conhecidas (não especuladas)
- Requisito explícito de extensibilidade
- Padrão estabelecido no framework (ex: NestJS Providers)

**Quando evitar:**

- "Pode ser útil no futuro"
- "É mais profissional assim"
- "Vi em um blog"

---

## 3. Root Cause Analysis Obrigatório

### Para TODOS os bugs e problemas

**Workflow obrigatório:**

```
Bug/Problema Detectado
        ↓
Reproduzir o erro
        ↓
Identificar sintoma vs causa raiz
        ↓
Corrigir causa raiz (não sintoma)
        ↓
Documentar em KNOWN-ISSUES.md
        ↓
Implementar prevenção
        ↓
Validar correção
```

### Regras

- ✅ Identificar causa raiz (não apenas sintoma)
- ✅ Corrigir problema original (não workaround)
- ✅ Documentar em `KNOWN-ISSUES.md` ou `.gemini/context/known-issues.md`
- ✅ Implementar prevenção (não apenas correção)
- ❌ NUNCA simplificar para "terminar rápido"

### Exemplo Real

**Sintoma:** Container Docker reiniciando constantemente

**❌ Correção Superficial:**
```yaml
# Aumentar restart policy
restart: always
```

**✅ Root Cause Analysis:**

1. **Investigar logs:** `docker logs invest_scrapers`
2. **Descobrir:** Exit Code 137 (OOM kill)
3. **Root Cause:** Múltiplos `await` operations em loop (memory leak)
4. **Correção Definitiva:** Mudar para BeautifulSoup single fetch pattern
5. **Prevenção:** Adicionar memory profiling em CI/CD
6. **Documentação:** Criar `ERROR_137_ANALYSIS.md`

**Resultado:** Problema resolvido permanentemente + lição documentada

**Referência:** `.gemini/context/known-issues.md` - 9 issues com root cause completo

---

## 4. Anti-Workaround Policy

### Regra Explícita

Workarounds temporários eventualmente se tornam permanentes. **Proibido.**

### Anti-Patterns Proibidos

- ❌ Workarounds temporários que se tornam permanentes
- ❌ "Resolver depois" sem issue/TODO rastreável
- ❌ Comentários tipo `// FIXME`, `// HACK` sem plano de correção
- ✅ Se problema é crítico → corrigir agora
- ✅ Se não é crítico → criar issue rastreável com prioridade

### Fluxo de Decisão

```
Problema Encontrado
        ↓
    É bloqueante?
    ┌────┴────┐
    │   SIM   │   NÃO
    ↓         ↓
Corrigir    Criar issue
AGORA       rastreável
(Root       + Continuar
Cause)
```

### Exemplo

**❌ ERRADO:**

```typescript
// FIXME: Isso quebra em production mas funciona em dev
// TODO: Corrigir depois
const timeout = process.env.NODE_ENV === 'production' ? 30000 : 5000;
```

**✅ CORRETO (Bloqueante):**

```typescript
// Root cause: Production tem latência maior devido a rede AWS
// Solução: Configurar timeout via environment variable + validação
const timeout = this.config.get('API_TIMEOUT', { infer: true }); // Validado no startup
```

**✅ CORRETO (Não-bloqueante):**

```typescript
// Issue #123: Otimizar query N+1 quando temos >1000 assets
// Prioridade: MÉDIA (funciona mas pode ser melhorado)
// Timeline: Fase 25 (após migration para TypeORM 0.4)
const assets = await this.repository.find({ relations: ['prices'] });
```

**Issue #123 em KNOWN-ISSUES.md:**

```markdown
## Issue #123: Query N+1 em Assets

**Status:** Conhecido, não-bloqueante
**Prioridade:** MÉDIA
**Timeline:** Fase 25

### Descrição
Assets endpoint faz N+1 queries quando inclui preços.

### Root Cause
TypeORM 0.3 não suporta join eager automático.

### Workaround Atual
Aceitar N+1 temporariamente (performance ainda aceitável <1000 assets).

### Solução Definitiva
Migrar para TypeORM 0.4 com query builder otimizado.
```

---

## 5. Observabilidade e Rastreabilidade (OBRIGATÓRIO)

### Princípio Fundamental

**Sempre habilitar e manter habilitados** logs, traces e ferramentas de debug/auditoria para rastreabilidade completa dos fluxos.

### O que SEMPRE manter habilitado

- ✅ **Logs estruturados** (NestJS Logger em controllers/services, Loguru em Python)
- ✅ **Traces de execução** (request/response, tempo de resposta, correlation IDs)
- ✅ **Ferramentas de debug e auditoria avançadas** (audit trails, update logs)
- ✅ **Métricas de performance** (response time, success/failure rates)

### Rastreabilidade por Categoria

| Categoria | Exemplos | Nível de Log |
|-----------|----------|--------------|
| Fluxos completos | Scraping → Processing → Storage | `log` |
| Gaps e bugs | Erros não capturados, comportamentos inesperados | `error` |
| Alarmes e warnings | Degradação de performance, thresholds atingidos | `warn` |
| Exceções e falhas | Erros de conexão, timeouts, falhas de validação | `error` |
| Divergências | Cross-validation discrepancies, dados inconsistentes | `warn` |
| Não-bloqueantes | Oportunidades de melhoria, debt técnico | `debug` |
| Itens incompletos | Features parcialmente implementadas | `warn` |

### Padrões Obrigatórios

#### NestJS (Backend)

```typescript
// ✅ CORRETO: Logger estruturado
@Injectable()
export class MyService {
  private readonly logger = new Logger(MyService.name);

  async process(data: any) {
    this.logger.log(`Processing started: ${JSON.stringify({ id: data.id })}`);
    try {
      // ... logic
      this.logger.log(`Processing completed: ${data.id}`);
    } catch (error) {
      this.logger.error(`Processing failed: ${data.id}`, error.stack);
      throw error;
    }
  }
}
```

#### Python (Scrapers)

```python
# ✅ CORRETO: Loguru estruturado
from loguru import logger

class MyScraper:
    def scrape(self, ticker: str):
        logger.info(f"Scraping started: {ticker}")
        try:
            # ... logic
            logger.info(f"Scraping completed: {ticker} in {elapsed}ms")
        except Exception as e:
            logger.error(f"Scraping failed: {ticker} - {str(e)}")
            raise
```

### Anti-Patterns (NUNCA fazer)

- ❌ `console.log()` em código NestJS (usar `this.logger.log()`)
- ❌ `print()` em código Python de produção (usar `logger.info()`)
- ❌ Suprimir erros com try-catch vazio
- ❌ Logs sem contexto (ex: `logger.log("error")` sem detalhes)
- ❌ Desabilitar logs em produção para "performance"

### Verificação Obrigatória

```bash
# Verificar anti-patterns no backend
grep -r "console.log" backend/src --include="*.ts" | wc -l  # Deve ser 0

# Verificar anti-patterns nos scrapers
grep -r "^print(" backend/python-scrapers --include="*.py" | wc -l  # Deve ser 0
```

### Benefícios

1. **Debug mais rápido** - Logs estruturados facilitam identificação de problemas
2. **Rastreabilidade completa** - Todo fluxo documentado automaticamente
3. **Auditoria** - Compliance com requisitos de rastreabilidade
4. **Performance monitoring** - Identificar gargalos proativamente
5. **Root cause analysis** - Dados suficientes para análise profunda

**Referência:** Análise de Observabilidade (2025-12-06) - Score atual: 49% → Meta: 90%

---

## Aplicação Prática

### Checklist Antes de Implementar

| Princípio | Pergunta | Resposta Esperada |
|-----------|----------|-------------------|
| Quality > Velocity | Tenho tempo para fazer direito? | Se não, rediscutir prazo |
| KISS | Estou adicionando complexidade necessária? | Apenas se justificada |
| Root Cause | Identifiquei a causa raiz? | SIM |
| Anti-Workaround | Este é um workaround ou correção definitiva? | Correção definitiva |
| Observability | Adicionei logs estruturados? | SIM |

### Enforcement

**Code Review Bloqueante:**

Se qualquer princípio for violado, code review DEVE rejeitar o PR com justificativa específica.

**Exemplo de Rejeição:**

```markdown
## Code Review: REJEITADO

**Violação:** Anti-Workaround Policy

**Problema:** Linha 45 - try-catch vazio suprimindo erro sem investigação.

**Ação Requerida:**
1. Identificar root cause do erro
2. Corrigir problema original
3. Adicionar log estruturado
4. Documentar em KNOWN-ISSUES.md se não for bloqueante

**Não aceito até correção.**
```

---

## Fontes

- `VALIDACAO_REGRAS_DOCUMENTACAO_2025-11-27.md` - Regra 1.6
- `.gemini/context/known-issues.md` - Exemplos de root cause analysis
- Análise de Observabilidade (2025-12-06)
- CHECKLIST_TODO_MASTER.md - Anti-Patterns section
