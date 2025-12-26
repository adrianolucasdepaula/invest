-- Query executada a cada 5min para tracking
SELECT 
  NOW() as timestamp,
  COUNT(*) as total_fundamentals,
  COUNT(DISTINCT asset_id) as assets_unicos,
  COUNT(*) - COUNT(DISTINCT asset_id) as duplicatas,
  ROUND(AVG((metadata->>'sourcesCount')::int), 1) as media_fontes,
  COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(metadata->'discrepancies', '[]'::jsonb)) > 0) as com_discrepancias,
  ROUND(COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(metadata->'discrepancies', '[]'::jsonb)) > 0) * 100.0 / NULLIF(COUNT(*), 0), 1) as pct_discrepancias
FROM fundamental_data;
