# FASE 145: Data Cleanup & Lifecycle Configuration

Este documento descreve as variáveis de ambiente necessárias para o sistema de limpeza automática e políticas de ciclo de vida implementadas na Fase 145.

## Variáveis de Ambiente

### Cleanup Geral

```bash
# Habilitar/desabilitar sistema de cleanup
CLEANUP_ENABLED=true

# Modo dry-run (true = apenas simula, não deleta)
# IMPORTANTE: Use true por 1 semana em produção antes de desabilitar
CLEANUP_DRY_RUN=false
```

### ScrapedData Cleanup

```bash
# Retenção de dados scrapeados (em dias)
# Recomendado: 30 dias (permite reprocessamento se necessário)
CLEANUP_SCRAPED_DATA_RETENTION_DAYS=30
```

### Analysis Cleanup

```bash
# Retenção de análises antigas (em dias)
# 0 = desabilitado (mantém apenas failed >7d e stuck >1h)
# >0 = remove análises com mais de N dias
# Recomendado: 90 dias (balanço entre histórico e espaço)
CLEANUP_ANALYSES_RETENTION_DAYS=90
```

### MinIO Lifecycle Policies

```bash
# Habilitar lifecycle policies do MinIO
MINIO_LIFECYCLE_ENABLED=true

# Retenção por bucket (em dias)
MINIO_LIFECYCLE_SCRAPED_HTML_DAYS=30   # HTML scrapeado (debug)
MINIO_LIFECYCLE_REPORTS_DAYS=90        # Relatórios gerados
MINIO_LIFECYCLE_EXPORTS_DAYS=14        # Exports de usuário
```

## Agendamento dos Jobs

Todos os jobs de cleanup seguem o timezone `America/Sao_Paulo`:

### DataCleanupService
- **Job:** `cleanup-scraped-data`
- **Cron:** `0 3 * * *` (Diário às 3:00 AM)
- **Ação:**
  1. Busca ScrapedData com `scrapedAt < 30 dias`
  2. Archive para MinIO (formato JSONL)
  3. Delete do PostgreSQL (transaction-safe)
  4. Emit Prometheus metrics

### ScheduledJobsService
- **Job:** `cleanup-stale-analyses`
- **Cron:** `0 2 * * 0` (Domingos às 2:00 AM)
- **Ação:**
  1. Remove análises de ativos inativos
  2. Remove análises failed >7 dias
  3. Remove análises pending travadas >1 hora
  4. (Opcional) Remove análises >90 dias se `CLEANUP_ANALYSES_RETENTION_DAYS` > 0

### MinIO Lifecycle (Automático)
- **Ação:** Delete automático via política nativa do MinIO
- **Execução:** Contínua (gerenciada pelo MinIO)

## Métricas Prometheus

Os jobs de cleanup emitem as seguintes métricas:

### invest_cleanup_records_deleted_total
- **Tipo:** Counter
- **Labels:** `entity` (scraped_data, analysis, etc.)
- **Descrição:** Total de records deletados por entidade

### invest_cleanup_job_duration_seconds
- **Tipo:** Histogram
- **Labels:** `entity`
- **Buckets:** `[1, 5, 10, 30, 60, 120, 300, 600]`
- **Descrição:** Duração do job de cleanup em segundos

### invest_cleanup_job_result_total
- **Tipo:** Counter
- **Labels:** `entity`, `result` (success, failure, partial_failure)
- **Descrição:** Resultado dos jobs de cleanup

## Estratégia de Rollout

### Semana 1: Dry-Run Mode (OBRIGATÓRIO)

```bash
CLEANUP_ENABLED=true
CLEANUP_DRY_RUN=true
```

**Checklist de Validação:**
- [ ] Prometheus metrics aparecem corretamente
- [ ] Logs mostram records que seriam deletados
- [ ] Nenhum erro em logs (foreign key violations, etc.)
- [ ] Performance aceitável (<5 min por job)
- [ ] Grafana dashboard mostra estatísticas corretas

**Validação de Dry-Run:**
```bash
# Ver logs do cleanup job
docker logs invest_backend --tail 200 | grep cleanup

# Verificar métricas no Prometheus
# http://localhost:9090/graph?g0.expr=invest_cleanup_records_deleted_total

# Monitorar duração dos jobs
# http://localhost:9090/graph?g0.expr=invest_cleanup_job_duration_seconds
```

### Semana 2+: Produção

Após 1 semana de dry-run sem erros:

```bash
CLEANUP_ENABLED=true
CLEANUP_DRY_RUN=false  # ⚠️ CUIDADO: Agora irá deletar dados reais
```

**Monitoramento Crítico (primeiros 7 dias):**
- [ ] Nenhum erro de foreign key violation
- [ ] Nenhuma reclamação de usuários sobre dados faltando
- [ ] Métricas de storage decrescendo conforme esperado
- [ ] Performance do banco de dados estável ou melhorando

## Exemplo de .env Completo

```bash
# ========================================
# FASE 145: Data Cleanup & Lifecycle
# ========================================

# Cleanup Geral
CLEANUP_ENABLED=true
CLEANUP_DRY_RUN=false  # true por 1 semana primeiro!

# ScrapedData
CLEANUP_SCRAPED_DATA_RETENTION_DAYS=30

# Analysis
CLEANUP_ANALYSES_RETENTION_DAYS=90

# MinIO Lifecycle
MINIO_LIFECYCLE_ENABLED=true
MINIO_LIFECYCLE_SCRAPED_HTML_DAYS=30
MINIO_LIFECYCLE_REPORTS_DAYS=90
MINIO_LIFECYCLE_EXPORTS_DAYS=14
```

## Troubleshooting

### Job não está executando

```bash
# Verificar se o cron está registrado
docker exec invest_backend npm run nest:jobs

# Verificar logs do NestJS Scheduler
docker logs invest_backend --tail 500 | grep -i "cleanup\|cron"
```

### Erro de Foreign Key Violation

Se houver erro de foreign key, verificar:
1. Cascade delete configurado nas entities?
2. Ordem de deleção está correta?
3. Usar transaction para garantir atomicidade

### MinIO Lifecycle não está deletando

```bash
# Verificar se policy foi aplicada
docker exec invest_minio mc ilm ls myminio/scraped-html

# Ver regras configuradas
docker exec invest_minio mc ilm export myminio/scraped-html
```

### Performance Lenta

Se cleanup demora >5 minutos:
1. Verificar índices nas colunas de data (`scrapedAt`, `createdAt`)
2. Aumentar batch size (atualmente 1000)
3. Executar `VACUUM ANALYZE` após cleanup

## Referências

- **Plan File:** `C:\Users\adria\.claude\plans\starry-baking-nygaard.md`
- **DataCleanupService:** `backend/src/queue/jobs/data-cleanup.service.ts`
- **ScheduledJobsService:** `backend/src/queue/jobs/scheduled-jobs.service.ts`
- **StorageService:** `backend/src/modules/storage/storage.service.ts`
- **MetricsService:** `backend/src/metrics/metrics.service.ts`

## Próximas Fases

### Fase 2 (ALTO): Semanas 2-3 ✅ IMPLEMENTADO (2025-12-29)
- ✅ ScraperMetric cleanup (30 dias, Weekly Sunday 3:30 AM, no archival)
- ✅ News/NewsAnalysis cleanup (180 dias, Monthly 1st 4:00 AM, archive + CASCADE)
- ✅ UpdateLog archival (365 dias, Quarterly 1st 5:00 AM, regulatory compliance)
- ✅ SyncHistory archival (1095 dias, Yearly Jan 1st 6:00 AM, long-term compliance)
- ✅ 4 new REST endpoints for manual triggering
- ✅ 4 new environment variables (CLEANUP_*_RETENTION_DAYS)
- ✅ JSONL archival format for News, UpdateLog, SyncHistory
- ✅ All Prometheus metrics configured

### Fase 3 (MÉDIO): Semanas 4-6
- EconomicEvent cleanup (2 anos)
- OptionPrice expired archival (365 dias)
- MinIO lifecycle para backups

### Fase 4: Database Compression
- ScrapedData → TimescaleDB Hypertable
- News → TimescaleDB Hypertable
- Analysis → Archive pattern (similar a AssetPricesArchive)

### Fase 5: Backup Automation
- Full backup (Domingo 1 AM)
- Incremental backup (Diário 1 AM)
- Schema-only backup (Diário 12:30 AM)

### Fase 6: Monitoring & Alerting
- Alerting rules (CleanupJobFailed, PostgresDiskUsageHigh, BackupFailed)
- Grafana dashboard "Data Lifecycle Management"
- Panels: Cleanup Jobs Overview, Disk Space Monitoring, Backup Status

---

**Última Atualização:** 2025-12-29
**Versão:** 1.1
**Status:** Fase 1 (CRÍTICO) + Fase 2 (ALTO) - Implementados ✅
