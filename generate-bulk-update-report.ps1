# Generate Bulk Update Report
# Gera relatório detalhado da atualização em massa

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportFile = "BULK_UPDATE_REPORT_$timestamp.md"

Write-Host "Gerando relatório..." -ForegroundColor Cyan

$report = @"
# Relatório de Atualização em Massa - $timestamp

## Resumo Executivo

"@

# 1. Estatísticas do Banco de Dados
$dbStats = docker exec invest_postgres psql -U invest_user -d invest_db -t -c "
SELECT 
    COUNT(*) as total_updates,
    COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 hour' THEN 1 END) as last_hour,
    COUNT(CASE WHEN updated_at > NOW() - INTERVAL '30 minutes' THEN 1 END) as last_30min,
    COUNT(CASE WHEN updated_at > NOW() - INTERVAL '10 minutes' THEN 1 END) as last_10min
FROM fundamental_data
WHERE updated_at > NOW() - INTERVAL '2 hours';
" 2>&1

$report += @"

### Banco de Dados
$dbStats

"@

# 2. Análise de Desvios
$deviationAnalysis = docker exec invest_postgres psql -U invest_user -d invest_db -t -c "
WITH recent AS (
    SELECT fd.field_sources 
    FROM fundamental_data fd 
    WHERE fd.updated_at > NOW() - INTERVAL '2 hours'
),
disc AS (
    SELECT 
        key as field,
        value->'divergentSources' as div 
    FROM recent, jsonb_each(field_sources) 
    WHERE value->'hasDiscrepancy' = 'true'::jsonb
),
devs AS (
    SELECT 
        (jsonb_array_elements(div)->>'deviation')::numeric as deviation 
    FROM disc 
    WHERE div IS NOT NULL
)
SELECT 
    COUNT(*) as total_discrepancies,
    MAX(deviation) as max_deviation,
    AVG(deviation) as avg_deviation,
    COUNT(CASE WHEN deviation > 10000 THEN 1 END) as astronomical_count,
    COUNT(CASE WHEN deviation BETWEEN 100 AND 10000 THEN 1 END) as high_count,
    COUNT(CASE WHEN deviation < 100 THEN 1 END) as reasonable_count
FROM devs;
" 2>&1

$report += @"

### Análise de Desvios (Últimas 2h)
\`\`\`
$deviationAnalysis
\`\`\`

"@

# 3. Taxa de Falhas
$failureStats = docker logs invest_backend --since 30m 2>&1 | Select-String "Low confidence|timed out|ERROR" | Group-Object {$_ -replace '.*ERROR.*', 'ERROR' -replace '.*Low confidence.*', 'Low Confidence' -replace '.*timed out.*', 'Timeout'} | Select-Object Count, Name

$report += @"

### Erros (Últimos 30 min)
"@

$failureStats | ForEach-Object {
    $report += "`n- $($_.Name): $($_.Count)"
}

$report += @"


## Validação das Correções

### ✅ Correções Implementadas
- [x] Cap de desvio (MAX=10,000%)
- [x] Proteção para reference < 0.0001
- [x] FIELD_AVAILABILITY map
- [x] filterSourcesForField() method
- [x] Tolerâncias unificadas

### 📊 Resultados
"@

# Verificar desvios astronômicos
$astronomicalCheck = docker exec invest_postgres psql -U invest_user -d invest_db -t -c "
WITH recent AS (SELECT fd.field_sources FROM fundamental_data fd WHERE fd.updated_at > NOW() - INTERVAL '2 hours'),
disc AS (SELECT value->'divergentSources' as div FROM recent, jsonb_each(field_sources) WHERE value->'hasDiscrepancy' = 'true'::jsonb),
devs AS (SELECT (jsonb_array_elements(div)->>'deviation')::numeric as deviation FROM disc WHERE div IS NOT NULL)
SELECT COUNT(*) FROM devs WHERE deviation > 10000;
" 2>&1

$hasAstronomical = [int]($astronomicalCheck.Trim()) -gt 0

if ($hasAstronomical) {
    $report += "`n❌ **DESVIOS ASTRONÔMICOS DETECTADOS!** $astronomicalCheck registros > 10,000%`n"
} else {
    $report += "`n✅ **ZERO DESVIOS ASTRONÔMICOS** nos dados das últimas 2 horas!`n"
}

# Salvar relatório
$report | Out-File -FilePath $reportFile -Encoding UTF8

Write-Host "✅ Relatório salvo em: $reportFile" -ForegroundColor Green
Write-Host "`n$report"

