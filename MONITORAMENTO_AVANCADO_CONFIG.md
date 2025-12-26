# Configuração de Monitoramento Avançado

## Fix Aplicado (FASE 139.4)

**Arquivo:** docker-compose.yml linha 340
**Mudança:** memory: 4G → 8G (invest_api_service)

**Resultado:**
- Memory: 99.9% → 14.28%
- Espaço livre: 6.86GB
- **Python API deve voltar a funcionar**

---

## Monitoramento Configurado

### 1. Métricas de Recursos (Contínuo)

```bash
# A cada 5min
docker stats invest_api_service --no-stream
```

**Thresholds:**
- Memory > 80%: ALERTA
- Memory > 95%: CRÍTICO
- CPU > 200%: ALERTA
- Zombies > 5: ALERTA

### 2. Python API Health (Contínuo)

```bash
# A cada 5min
curl -s --max-time 5 http://localhost:8000/health
```

**Detecção:**
- Timeout > 5s: Python API travando
- Erro 500: Crash interno
- Sem resposta: Container morto

### 3. Coleta Progress (SQL)

```sql
-- A cada 10min
SELECT
  COUNT(*) as total,
  COUNT(DISTINCT asset_id) as unicos,
  COUNT(*) - COUNT(DISTINCT asset_id) as duplicatas,
  ROUND(AVG((metadata->>'sourcesCount')::int), 1) as avg_fontes,
  COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(metadata->'discrepancies', '[]'::jsonb)) > 0) as com_disc,
  ROUND(COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(metadata->'discrepancies', '[]'::jsonb)) > 0) * 100.0 / NULLIF(COUNT(*), 0), 1) as pct_disc
FROM fundamental_data
WHERE created_at > NOW() - INTERVAL '1 hour';
```

### 4. BullMQ Queue (Contínuo)

```bash
# A cada 5min
docker exec invest_redis redis-cli ZCARD "bull:asset-updates:completed"
docker exec invest_redis redis-cli ZCARD "bull:asset-updates:failed"
docker exec invest_redis redis-cli LLEN "bull:asset-updates:waiting"
docker exec invest_redis redis-cli LLEN "bull:asset-updates:active"
```

### 5. Scraper Errors (SQL)

```sql
-- A cada 15min
SELECT
  scraper_id,
  error_type,
  COUNT(*) as count
FROM scraper_errors
WHERE created_at > NOW() - INTERVAL '15 minutes'
GROUP BY scraper_id, error_type
ORDER BY count DESC
LIMIT 10;
```

---

## Queries de Troubleshooting

### Identificar Duplicatas

```sql
SELECT
  a.ticker,
  COUNT(*) as vezes_coletado,
  ARRAY_AGG(fd.created_at ORDER BY fd.created_at) as timestamps
FROM fundamental_data fd
JOIN assets a ON a.id = fd.asset_id
GROUP BY a.ticker
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;
```

### Ver Valores Absurdos

```sql
SELECT
  a.ticker,
  fd.receita_liquida,
  fd.lucro_liquido,
  (fd.metadata->'rawSourcesData'->0->'source') as source
FROM fundamental_data fd
JOIN assets a ON a.id = fd.asset_id
WHERE fd.receita_liquida > 100000000000000  -- > 100 trilhões
   OR fd.lucro_liquido > 100000000000000
   OR ABS(fd.roe) > 200;
```

### Discrepâncias por Campo

```sql
SELECT
  (elem->>'field') as campo,
  COUNT(*) as ocorrencias,
  ROUND(AVG((elem->>'maxDeviation')::numeric), 1) as desvio_medio
FROM fundamental_data fd,
  LATERAL jsonb_array_elements(COALESCE(fd.metadata->'discrepancies', '[]'::jsonb)) AS elem
GROUP BY campo
ORDER BY ocorrencias DESC
LIMIT 15;
```

---

## Logs Backend (Tail Contínuo)

```bash
# Terminal dedicado
docker logs invest_backend -f | grep -E "FALLBACK|SCRAPE|ERROR|WARN"

# Salvar em arquivo
docker logs invest_backend -f | grep -E "FALLBACK|SCRAPE|ERROR" > coleta_completa_logs.txt &
```

---

## Alertas Automáticos

### Grafana (http://localhost:3000)

**Dashboards:**
1. System Resources
2. BullMQ Queues
3. Scraper Performance
4. Python API Health

**Alerts configurados:**
- Memory > 80%
- CPU > 200% por >5min
- Python API down
- Queue stuck (waiting sem mudar por 10min)

---

## Procedimento Correto para Restart

**Lição aprendida:** Não limpar banco enquanto jobs ativos!

```bash
# 1. Pausar fila
docker exec invest_redis redis-cli SET "bull:asset-updates:paused" "1"

# 2. Aguardar jobs ativos terminarem (pode levar 15min!)
watch -n 30 'docker exec invest_redis redis-cli LLEN "bull:asset-updates:active"'

# 3. Confirmar 0 jobs ativos
docker exec invest_redis redis-cli LLEN "bull:asset-updates:active"
# Deve retornar: 0

# 4. SÓ ENTÃO limpar banco
docker exec invest_postgres psql -U invest_user -d invest_db -c "DELETE FROM fundamental_data; DELETE FROM scraper_errors;"

# 5. Limpar fila
docker exec invest_redis redis-cli KEYS "bull:asset-updates:*" | xargs -I {} docker exec invest_redis redis-cli DEL {}

# 6. Despausar
docker exec invest_redis redis-cli DEL "bull:asset-updates:paused"

# 7. Reiniciar backend (limpar estado memória)
docker restart invest_backend

# 8. Aguardar 30s

# 9. Confirmar tudo zerado
curl http://localhost:3101/api/v1/assets/bulk-update-status
# Deve retornar: waiting=0, active=0, completed=0

# 10. Verificar banco vazio
docker exec invest_postgres psql -U invest_user -d invest_db -c "SELECT COUNT(*) FROM fundamental_data;"
# Deve retornar: 0

# 11. SÓ AGORA iniciar nova coleta
```

---

**Aplicado:** FASE 139.4 - Memory 4GB → 8GB
**Status:** Aguardando Python API estabilizar
**Próximo:** Configurar monitoramento completo e aguardar coleta
