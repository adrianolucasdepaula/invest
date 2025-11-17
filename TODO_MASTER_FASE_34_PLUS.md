# 📋 TODO MASTER - FASES 34+ (Pós-COTAHIST Integration)

**Projeto:** B3 AI Analysis Platform
**Data Criação:** 2025-11-17
**Base:** FASE 33 - 100% COMPLETA ✅
**Status:** PLANEJAMENTO PRÓXIMAS FASES

---

## 🎯 RESUMO EXECUTIVO

**FASE 33 - STATUS FINAL:** ✅ **100% APROVADA**

- TypeScript: 0 erros ✅
- Build: Success ✅
- Performance: LCP 747ms, CLS 0.00 ✅
- MCPs Tripla validação: ✅ Sequential + Playwright + Chrome
- Best Practices 2025: ✅ Alinhado com mercado
- Data Integrity: ✅ FINRA compliance
- Git: ✅ 3 commits pusheados para origin/main

**Commits FASE 33:**
- `42d3ff3` - feat: Implementar integração completa COTAHIST B3
- `e25ae6a` - docs: Atualizar ROADMAP.md
- `595ffa4` - docs: Checklist validação tripla MCPs

---

## 📚 DESCOBERTAS DA VALIDAÇÃO (Inputs para FASE 34+)

### 🔍 Sequential Thinking MCP - Edge Cases Identificados

1. **Ticker Inexistente**
   - Problema: Endpoint aceita tickers inválidos sem erro explícito
   - Impacto: Usuário pode tentar sync com ticker que não existe
   - Solução FASE 34: Validar ticker na lista de ativos conhecidos antes de chamar Python Service

2. **Overlap COTAHIST + brapi**
   - Problema: Se executar sync em datas passadas, pode haver conflito de fontes
   - Impacto: Qual fonte prevalece? UPSERT garante última execução
   - Solução FASE 34: Documentar idempotência e criar log de audit trail

3. **Performance Timeout**
   - Problema: Múltiplos anos (2020-2024) pode levar 160s (5 anos × 32s)
   - Impacto: Ainda dentro do timeout 300s, mas próximo
   - Solução FASE 34: Cache Redis para ZIPs B3 já baixados

### 📊 WebSearch - Best Practices 2025

**Batch UPSERT PostgreSQL:**
- ✅ INSERT ... ON CONFLICT (best method)
- ⚠️ Batch size 1000 → Recomendação: 2000
- ⚠️ Fillfactor default → Recomendação: 70 para HOT updates
- ⚠️ Autocommit ON → Recomendação: Transaction única

**Financial Data Integrity:**
- ✅ Direct exchange feeds (COTAHIST = B3 oficial)
- ✅ Data precision (sem arredondamento)
- ⚠️ Automated validation → Recomendação: Validar antes UPSERT
- ⚠️ Audit trail → Recomendação: Compliance logs

### 🎨 Chrome DevTools Performance

**Métricas Atuais:**
- LCP: 747 ms ✅ (good)
- CLS: 0.00 ✅ (perfect)
- TTFB: 427 ms ⚠️ (pode melhorar)

**Insights:**
- RenderBlocking: 326 ms (pode otimizar defer/inline CSS)
- NetworkDependencyTree: Reduzir chains
- DOMSize: Verificar tamanho DOM

---

## 🚀 FASE 34: Cron Job + Cache Redis (PRIORIDADE ALTA)

**Objetivo:** Automatizar sync diário e cachear downloads B3

### 34.1: Cache Redis para Downloads COTAHIST
- [ ] **34.1.1**: Criar RedisModule em NestJS
- [ ] **34.1.2**: Implementar cache layer em PythonServiceClient
- [ ] **34.1.3**: TTL: 24 horas (arquivos B3 atualizados D+1)
- [ ] **34.1.4**: Key pattern: `cotahist:zip:{year}`
- [ ] **34.1.5**: Evitar re-download de anos históricos
- [ ] **34.1.6**: Testar: Primeiro download cacheia, segundo usa cache
- [ ] **34.1.7**: Monitorar: Cache hit rate > 80%

**Impacto Esperado:**
- Reduzir tempo de sync de ~32s para ~6s (apenas parsing, sem download)
- Economia de bandwidth B3
- Melhor experiência do usuário

### 34.2: Cron Job Sync Automático Diário
- [ ] **34.2.1**: Criar CronModule em NestJS
- [ ] **34.2.2**: Schedule: `0 2 * * *` (02:00 AM diário)
- [ ] **34.2.3**: Sync automático: Top 50 ativos (IBOV components)
- [ ] **34.2.4**: Notificação: Webhook/email se falhar
- [ ] **34.2.5**: Logs estruturados: Winston + contexto
- [ ] **34.2.6**: Retry logic: Exponential backoff (3 tentativas)
- [ ] **34.2.7**: Circuit breaker: Pausar após 5 falhas consecutivas

**Impacto Esperado:**
- Dados sempre atualizados (D+1)
- Reduzir carga manual de sync
- Melhor confiabilidade

### 34.3: Melhorias Performance Batch UPSERT
- [ ] **34.3.1**: Ajustar batch size: 1000 → 2000
- [ ] **34.3.2**: Configurar fillfactor: 70 (HOT updates)
- [ ] **34.3.3**: Transaction única (turn off autocommit)
- [ ] **34.3.4**: Benchmark: Comparar before/after
- [ ] **34.3.5**: Monitorar: Dead tuples, VACUUM stats

**Impacto Esperado:**
- Reduzir tempo UPSERT: ~10s → ~5s para 1000 records
- Menos dead tuples (menos VACUUM overhead)

### 34.4: Validação Ticker Antes de Sync
- [ ] **34.4.1**: Criar lista de tickers conhecidos (assets table)
- [ ] **34.4.2**: Validar ticker em SyncCotahistDto
- [ ] **34.4.3**: Retornar erro 400 se ticker desconhecido
- [ ] **34.4.4**: Sugerir tickers similares (fuzzy search)
- [ ] **34.4.5**: Testar: Ticker inválido retorna 400

**Impacto Esperado:**
- Melhor UX (erro explícito)
- Evitar chamadas desnecessárias ao Python Service

### 34.5: Audit Trail e Compliance Logs
- [ ] **34.5.1**: Criar tabela: sync_history (id, ticker, source, timestamp, records_count)
- [ ] **34.5.2**: Logar cada sync: COTAHIST vs brapi
- [ ] **34.5.3**: Rastreabilidade: Saber origem de cada dado
- [ ] **34.5.4**: Compliance: FINRA Rule 6140 (promptness, accuracy)
- [ ] **34.5.5**: Relatório: Dashboard de sync history

**Impacto Esperado:**
- Rastreabilidade completa
- Auditoria facilitada
- Compliance regulatório

---

## 🚀 FASE 35: Interface Frontend para Sync Manual (PRIORIDADE MÉDIA)

**Objetivo:** Permitir que usuário faça sync manual de qualquer ativo via UI

### 35.1: Página de Sync COTAHIST
- [ ] **35.1.1**: Criar página: `/data-sources/cotahist-sync`
- [ ] **35.1.2**: Form: Ticker, Ano Inicial, Ano Final
- [ ] **35.1.3**: Botão: "Sincronizar COTAHIST"
- [ ] **35.1.4**: Progress bar: Real-time usando WebSocket
- [ ] **35.1.5**: Toast notifications: Sucesso/erro
- [ ] **35.1.6**: Histórico: Últimos 10 syncs

### 35.2: Dashboard de Status Sync
- [ ] **35.2.1**: Card: Últimos syncs (ticker, data, status)
- [ ] **35.2.2**: Gráfico: Syncs por dia (últimos 30 dias)
- [ ] **35.2.3**: Badge: Cache hit rate
- [ ] **35.2.4**: Tabela: Ativos com dados desatualizados (> 7 dias)

---

## 🚀 FASE 36: Intraday Data (1h, 4h intervals) (PRIORIDADE BAIXA)

**Objetivo:** Implementar suporte a dados intraday (descoberto durante FASE 32)

### 36.1: Database Migration - Timeframe Support
- [ ] **36.1.1**: Adicionar coluna: `timeframe` ENUM ('1d', '1h', '4h', '1wk', '1mo')
- [ ] **36.1.2**: Mudar `date` → `timestamp` (precisão minuto)
- [ ] **36.1.3**: Atualizar constraint UNIQUE: (asset_id, timestamp, timeframe)
- [ ] **36.1.4**: Migration reversível

### 36.2: Backend Intraday Support
- [ ] **36.2.1**: Atualizar DTO: Adicionar `timeframe` opcional
- [ ] **36.2.2**: Python Service: Endpoint `/intraday/fetch`
- [ ] **36.2.3**: brapi: Usar intervals (1h, 4h confirmado funcional)
- [ ] **36.2.4**: UPSERT: Considerar timeframe

### 36.3: Frontend Chart Timeframe Selector
- [ ] **36.3.1**: Botões: 1D, 1H, 4H, 1W, 1M
- [ ] **36.3.2**: React Query: Cache por timeframe
- [ ] **36.3.3**: lightweight-charts: Renderizar candlesticks intraday
- [ ] **36.3.4**: Performance: Lazy load para timeframes não-default

---

## 🚀 FASE 37: Monitoramento Prometheus + Grafana (PRIORIDADE MÉDIA)

**Objetivo:** Observabilidade completa do sistema

### 37.1: Prometheus Metrics
- [ ] **37.1.1**: Instalar: `@willsoto/nestjs-prometheus`
- [ ] **37.1.2**: Métricas: sync_duration_seconds, sync_records_total
- [ ] **37.1.3**: Métricas: cache_hit_rate, cache_misses_total
- [ ] **37.1.4**: Métricas: http_request_duration_seconds
- [ ] **37.1.5**: Endpoint: `/metrics` (Prometheus scraping)

### 37.2: Grafana Dashboards
- [ ] **37.2.1**: Dashboard: COTAHIST Sync Performance
- [ ] **37.2.2**: Dashboard: Cache Efficiency
- [ ] **37.2.3**: Dashboard: API Performance (p95, p99 latencies)
- [ ] **37.2.4**: Alertas: Sync failure rate > 5%
- [ ] **37.2.5**: Alertas: Cache hit rate < 60%

---

## 🚀 FASE 38: Retry Logic + Circuit Breaker (PRIORIDADE ALTA)

**Objetivo:** Resiliência contra falhas de rede B3

### 38.1: Retry Logic Exponential Backoff
- [ ] **38.1.1**: Instalar: `@nestjs/axios` + `axios-retry`
- [ ] **38.1.2**: Config: 3 tentativas, delay 1s, 2s, 4s
- [ ] **38.1.3**: Retry apenas em erros HTTP 5xx e timeout
- [ ] **38.1.4**: Log cada retry attempt
- [ ] **38.1.5**: Testar: Simular falha B3

### 38.2: Circuit Breaker Pattern
- [ ] **38.2.1**: Instalar: `@nestjs/circuitbreaker`
- [ ] **38.2.2**: Threshold: 5 falhas consecutivas = circuit OPEN
- [ ] **38.2.3**: Timeout: 30s antes de tentar fechar
- [ ] **38.2.4**: Half-open: 1 tentativa para validar
- [ ] **38.2.5**: Notificação: Webhook se circuit OPEN

---

## 🚀 FASE 39: Otimizações Frontend Performance (PRIORIDADE MÉDIA)

**Objetivo:** Melhorar LCP e TTFB identificados por Chrome DevTools

### 39.1: Reduzir Render Blocking (326 ms)
- [ ] **39.1.1**: Defer CSS não-crítico
- [ ] **39.1.2**: Inline critical CSS
- [ ] **39.1.3**: Preload fonts principais
- [ ] **39.1.4**: Code splitting: Dynamic imports

### 39.2: Melhorar TTFB (427 ms)
- [ ] **39.2.1**: Habilitar HTTP/2 server push
- [ ] **39.2.2**: CDN: Cloudflare para assets estáticos
- [ ] **39.2.3**: Compressão: Brotli (em vez de gzip)
- [ ] **39.2.4**: Keep-alive connections

### 39.3: Reduzir Network Dependency Chains
- [ ] **39.3.1**: Bundle crítico: Combinar JS/CSS
- [ ] **39.3.2**: Lazy load: Componentes não-críticos
- [ ] **39.3.3**: Image optimization: WebP, lazy loading

---

## 🚀 FASE 40: Testes Automatizados (PRIORIDADE ALTA)

**Objetivo:** Garantir qualidade com testes automatizados

### 40.1: Testes Unitários Backend
- [ ] **40.1.1**: MarketDataService: syncCotahist() - 5 test cases
- [ ] **40.1.2**: PythonServiceClient: fetchCotahist() - 3 test cases
- [ ] **40.1.3**: SyncCotahistDto: Validação - 4 test cases
- [ ] **40.1.4**: Coverage: > 80%

### 40.2: Testes E2E
- [ ] **40.2.1**: Playwright: Sync manual via UI
- [ ] **40.2.2**: Playwright: Verificar dados após sync
- [ ] **40.2.3**: Playwright: Testar erro ticker inválido
- [ ] **40.2.4**: CI/CD: GitHub Actions

### 40.3: Testes de Performance
- [ ] **40.3.1**: k6: Load test endpoint sync-cotahist
- [ ] **40.3.2**: Artillery: 100 req/s por 1 min
- [ ] **40.3.3**: Benchmark: UPSERT 2000 records < 5s
- [ ] **40.3.4**: Relatório: p95, p99 latencies

---

## 📊 PRIORIZAÇÃO FASES (Matriz Impacto × Esforço)

| Fase | Impacto | Esforço | Prioridade | Prazo Estimado |
|------|---------|---------|------------|----------------|
| **FASE 34** | 🔥 Alto | 🛠️ Médio | ⭐⭐⭐ ALTA | 3-5 dias |
| **FASE 35** | 📊 Médio | 🛠️ Baixo | ⭐⭐ MÉDIA | 2-3 dias |
| **FASE 36** | 📈 Baixo | 🛠️ Alto | ⭐ BAIXA | 5-7 dias |
| **FASE 37** | 📊 Médio | 🛠️ Médio | ⭐⭐ MÉDIA | 3-4 dias |
| **FASE 38** | 🔥 Alto | 🛠️ Baixo | ⭐⭐⭐ ALTA | 1-2 dias |
| **FASE 39** | 📈 Baixo | 🛠️ Alto | ⭐ BAIXA | 4-5 dias |
| **FASE 40** | 🔥 Alto | 🛠️ Alto | ⭐⭐⭐ ALTA | 5-7 dias |

**Sequência Recomendada:**
1. FASE 38 (Retry + Circuit Breaker) - 1-2 dias ⚡
2. FASE 34 (Cron + Cache) - 3-5 dias 🚀
3. FASE 40 (Testes Automatizados) - 5-7 dias 🧪
4. FASE 37 (Monitoring) - 3-4 dias 📊
5. FASE 35 (Frontend Sync UI) - 2-3 dias 🎨
6. FASE 36 (Intraday) - 5-7 dias 📈
7. FASE 39 (Performance) - 4-5 dias ⚡

---

## ✅ CHECKLIST PRÉ-FASE 34

Antes de iniciar FASE 34, garantir que:

- [ ] **FASE 33 - 100% Aprovada** ✅
- [ ] **Git atualizado**: origin/main com 3 commits ✅
- [ ] **Documentação completa**: ROADMAP.md, CHECKLIST ✅
- [ ] **Ambiente limpo**: 0 erros TypeScript, 0 warnings ✅
- [ ] **Database estável**: Constraint UNIQUE OK, 0 duplicatas ✅
- [ ] **Performance baseline**: LCP 747ms documentado ✅
- [ ] **Best practices validadas**: WebSearch 2025 ✅
- [ ] **MCPs validados**: Sequential + Playwright + Chrome ✅

**Status:** ✅ **PRONTO PARA FASE 34**

---

## 📝 NOTAS IMPORTANTES

1. **Sempre consultar CHECKLIST_TODO_MASTER.md** antes de cada fase
2. **Validação tripla MCPs obrigatória** em todas as fases críticas
3. **WebSearch best practices** antes de decisões arquiteturais
4. **Context7** para bibliotecas novas (verificar breaking changes)
5. **0 tolerance**: TypeScript 0 erros, Build 0 erros
6. **Data Integrity**: Valores financeiros nunca arredondados
7. **Git limpo**: Commits semânticos, co-autoria Claude
8. **Screenshots evidências**: MCPs Playwright/Chrome DevTools

---

**Criado por:** Claude Code (Sonnet 4.5)
**Data:** 2025-11-17
**Versão:** 1.0.0

