-- ============================================================================
-- QUERIES DE ANÁLISE PROFUNDA - Rastreamento Completo de Problemas
-- ============================================================================
-- Uso: docker exec invest_postgres psql -U invest_user -d invest_db -f queries_analise_profunda.sql

-- ============================================================================
-- 1. OVERVIEW GERAL DA COLETA
-- ============================================================================
SELECT
  '=== OVERVIEW COLETA ===' as secao,
  COUNT(*) as total_fundamentals,
  COUNT(DISTINCT asset_id) as assets_unicos,
  COUNT(*) - COUNT(DISTINCT asset_id) as duplicatas,
  ROUND(AVG((metadata->>'sourcesCount')::int), 1) as media_fontes,
  MIN(created_at) as primeira_coleta,
  MAX(created_at) as ultima_coleta,
  AGE(MAX(created_at), MIN(created_at)) as duracao_coleta
FROM fundamental_data;

-- ============================================================================
-- 2. TAXA DE DISCREPÂNCIAS (CRÍTICO)
-- ============================================================================
SELECT
  '=== DISCREPÂNCIAS ===' as secao,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(metadata->'discrepancies', '[]'::jsonb)) > 0) as com_discrepancias,
  ROUND(COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(metadata->'discrepancies', '[]'::jsonb)) > 0) * 100.0 / NULLIF(COUNT(*), 0), 1) as pct_discrepancias,
  COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(metadata->'discrepancies', '[]'::jsonb)) >= 10) as com_10plus_disc,
  COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(metadata->'discrepancies', '[]'::jsonb)) >= 15) as com_15plus_disc
FROM fundamental_data;

-- ============================================================================
-- 3. DISCREPÂNCIAS POR CAMPO (Identificar bugs parsing)
-- ============================================================================
SELECT
  '=== DISCREPÂNCIAS POR CAMPO ===' as secao,
  (elem->>'field') as campo,
  COUNT(*) as ocorrencias,
  ROUND(AVG((elem->>'maxDeviation')::numeric), 1) as desvio_medio,
  MAX((elem->>'maxDeviation')::numeric) as desvio_maximo
FROM fundamental_data fd,
  LATERAL jsonb_array_elements(COALESCE(fd.metadata->'discrepancies', '[]'::jsonb)) AS elem
GROUP BY campo
ORDER BY ocorrencias DESC
LIMIT 20;

-- ============================================================================
-- 4. VALORES ABSURDOS (Bugs parsing severos)
-- ============================================================================
SELECT
  '=== VALORES ABSURDOS ===' as secao,
  a.ticker,
  fd.receita_liquida,
  fd.lucro_liquido,
  fd.roe,
  fd.pl,
  (fd.metadata->'rawSourcesData'->0->'source') as fonte
FROM fundamental_data fd
JOIN assets a ON a.id = fd.asset_id
WHERE fd.receita_liquida > 100000000000000  -- > 100 trilhões
   OR fd.lucro_liquido > 100000000000000
   OR ABS(fd.roe) > 200
   OR ABS(fd.pl) > 1000
ORDER BY fd.receita_liquida DESC NULLS LAST
LIMIT 10;

-- ============================================================================
-- 5. DUPLICATAS (Assets coletados múltiplas vezes)
-- ============================================================================
SELECT
  '=== DUPLICATAS ===' as secao,
  a.ticker,
  COUNT(*) as vezes_coletado,
  ARRAY_AGG(fd.created_at ORDER BY fd.created_at) as timestamps,
  AGE(MAX(fd.created_at), MIN(fd.created_at)) as intervalo
FROM fundamental_data fd
JOIN assets a ON a.id = fd.asset_id
GROUP BY a.ticker
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ============================================================================
-- 6. ERROS DE SCRAPER (Últimas 24h)
-- ============================================================================
SELECT
  '=== ERROS SCRAPER ===' as secao,
  scraper_id,
  error_type,
  COUNT(*) as ocorrencias,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as pct_do_total,
  COUNT(DISTINCT ticker) as tickers_afetados,
  MAX(created_at) as ultimo_erro
FROM scraper_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY scraper_id, error_type
ORDER BY ocorrencias DESC
LIMIT 15;

-- ============================================================================
-- 7. TICKERS PROBLEMÁTICOS (Mais erros)
-- ============================================================================
SELECT
  '=== TICKERS PROBLEMÁTICOS ===' as secao,
  ticker,
  COUNT(*) as total_erros,
  COUNT(DISTINCT scraper_id) as scrapers_falharam,
  ARRAY_AGG(DISTINCT scraper_id ORDER BY scraper_id) as lista_scrapers,
  ARRAY_AGG(DISTINCT error_type ORDER BY error_type) as tipos_erro
FROM scraper_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY ticker
HAVING COUNT(*) >= 3
ORDER BY total_erros DESC
LIMIT 10;

-- ============================================================================
-- 8. DISTRIBUIÇÃO DE FONTES (Cobertura)
-- ============================================================================
SELECT
  '=== DISTRIBUIÇÃO FONTES ===' as secao,
  (metadata->>'sourcesCount')::int as num_fontes,
  COUNT(*) as quantidade_assets,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentual
FROM fundamental_data
WHERE metadata->>'sourcesCount' IS NOT NULL
GROUP BY num_fontes
ORDER BY num_fontes DESC;

-- ============================================================================
-- 9. CONFIDENCE DISTRIBUTION (Qualidade)
-- ============================================================================
SELECT
  '=== CONFIDENCE ===' as secao,
  CASE
    WHEN (metadata->>'confidence')::numeric >= 0.70 THEN '70%+ (EXCELENTE)'
    WHEN (metadata->>'confidence')::numeric >= 0.60 THEN '60-70% (BOM)'
    WHEN (metadata->>'confidence')::numeric >= 0.50 THEN '50-60% (OK)'
    WHEN (metadata->>'confidence')::numeric >= 0.40 THEN '40-50% (RUIM)'
    ELSE '<40% (CRÍTICO)'
  END as faixa_confidence,
  COUNT(*) as quantidade,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentual
FROM fundamental_data
WHERE metadata->>'confidence' IS NOT NULL
GROUP BY faixa_confidence
ORDER BY
  CASE faixa_confidence
    WHEN '70%+ (EXCELENTE)' THEN 1
    WHEN '60-70% (BOM)' THEN 2
    WHEN '50-60% (OK)' THEN 3
    WHEN '40-50% (RUIM)' THEN 4
    ELSE 5
  END;

-- ============================================================================
-- 10. ASSETS SEM DADOS (Falhas de coleta)
-- ============================================================================
SELECT
  '=== ASSETS SEM DADOS ===' as secao,
  a.ticker,
  a.name,
  a.last_update_status,
  a.last_update_error
FROM assets a
LEFT JOIN fundamental_data fd ON fd.asset_id = a.id
WHERE fd.id IS NULL
  AND a.is_active = true
ORDER BY a.ticker
LIMIT 20;

-- ============================================================================
-- 11. PERFORMANCE POR SCRAPER (Timeouts)
-- ============================================================================
WITH erro_stats AS (
  SELECT
    scraper_id,
    COUNT(*) FILTER (WHERE error_type = 'timeout') as timeouts,
    COUNT(*) as total_erros
  FROM scraper_errors
  WHERE created_at > NOW() - INTERVAL '24 hours'
  GROUP BY scraper_id
)
SELECT
  '=== PERFORMANCE SCRAPER ===' as secao,
  scraper_id,
  timeouts,
  total_erros,
  ROUND(timeouts * 100.0 / NULLIF(total_erros, 0), 1) as pct_timeout
FROM erro_stats
ORDER BY timeouts DESC
LIMIT 10;

-- ============================================================================
-- 12. CAMPOS COM MAIOR DESVIO MÉDIO (Bugs parsing)
-- ============================================================================
SELECT
  '=== CAMPOS COM MAIOR DESVIO ===' as secao,
  (elem->>'field') as campo,
  COUNT(*) as ocorrencias,
  ROUND(AVG((elem->>'maxDeviation')::numeric), 1) as desvio_medio,
  ROUND(MIN((elem->>'maxDeviation')::numeric), 1) as desvio_minimo,
  ROUND(MAX((elem->>'maxDeviation')::numeric), 1) as desvio_maximo
FROM fundamental_data fd,
  LATERAL jsonb_array_elements(COALESCE(fd.metadata->'discrepancies', '[]'::jsonb)) AS elem
GROUP BY campo
ORDER BY desvio_medio DESC
LIMIT 15;

-- ============================================================================
-- FIM
-- ============================================================================
SELECT '=== ANÁLISE COMPLETA ===' as secao, NOW() as executado_em;
