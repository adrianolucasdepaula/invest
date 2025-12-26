# Monitor Bulk Update - Real-time Statistics
# Monitora atualização em massa de 861 ativos

param(
    [int]$DurationMinutes = 15,
    [int]$PollIntervalSeconds = 5
)

$ErrorActionPreference = "Continue"
$startTime = Get-Date
$endTime = $startTime.AddMinutes($DurationMinutes)

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  MONITOR BULK UPDATE - 861 ATIVOS" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "Inicio: $startTime"
Write-Host "Duracao: $DurationMinutes minutos"
Write-Host "Intervalo: $PollIntervalSeconds segundos"
Write-Host ""

# Estatísticas
$stats = @{
    TotalAttempts = 0
    Completed = 0
    Failed = 0
    Waiting = 0
    Active = 0
    LowConfidenceErrors = 0
    TimeoutErrors = 0
    OtherErrors = 0
    AstronomicalDeviations = 0
    ReasonableDeviations = 0
}

$iteration = 0

while ((Get-Date) -lt $endTime) {
    $iteration++
    $now = Get-Date -Format "HH:mm:ss"

    Clear-Host
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host "  MONITOR BULK UPDATE - Iteração #$iteration - $now" -ForegroundColor Cyan
    Write-Host "==================================================================" -ForegroundColor Cyan
    Write-Host ""

    # 1. Status da Fila BullMQ
    Write-Host "[1] STATUS DA FILA (BullMQ)" -ForegroundColor Yellow
    Write-Host "-----------------------------------------------------------------" -ForegroundColor DarkGray

    try {
        $queueStatus = docker logs invest_backend --tail 50 2>&1 | Select-String "Queue stats:" | Select-Object -Last 1
        if ($queueStatus) {
            $jsonMatch = $queueStatus -match '\{"counts".*\}'
            if ($jsonMatch) {
                $queueJson = $Matches[0] | ConvertFrom-Json
                $stats.Waiting = $queueJson.counts.waiting
                $stats.Active = $queueJson.counts.active
                $stats.Completed = $queueJson.counts.completed
                $stats.Failed = $queueJson.counts.failed

                Write-Host "  Aguardando:  " -NoNewline; Write-Host ("{0,4}" -f $stats.Waiting) -ForegroundColor Yellow
                Write-Host "  Ativos:      " -NoNewline; Write-Host ("{0,4}" -f $stats.Active) -ForegroundColor Green
                Write-Host "  Completados: " -NoNewline; Write-Host ("{0,4}" -f $stats.Completed) -ForegroundColor Cyan
                Write-Host "  Falhados:    " -NoNewline; Write-Host ("{0,4}" -f $stats.Failed) -ForegroundColor Red
                Write-Host "  Total:       " -NoNewline; Write-Host ("{0,4}" -f ($stats.Waiting + $stats.Active)) -ForegroundColor White

                $progressPct = [math]::Round(($stats.Completed / 861) * 100, 1)
                Write-Host "  Progresso:   " -NoNewline; Write-Host "$progressPct% ($(stats.Completed)/861)" -ForegroundColor Magenta
            }
        }
    } catch {
        Write-Host "  Erro ao obter status da fila" -ForegroundColor Red
    }

    Write-Host ""

    # 2. Erros Recentes
    Write-Host "[2] ERROS RECENTES (Últimos 30s)" -ForegroundColor Yellow
    Write-Host "-----------------------------------------------------------------" -ForegroundColor DarkGray

    $lowConfErrors = docker logs invest_backend --since 30s 2>&1 | Select-String "Low confidence" | Measure-Object | Select-Object -ExpandProperty Count
    $timeoutErrors = docker logs invest_backend --since 30s 2>&1 | Select-String "timed out" | Measure-Object | Select-Object -ExpandProperty Count

    $stats.LowConfidenceErrors += $lowConfErrors
    $stats.TimeoutErrors += $timeoutErrors

    Write-Host "  Low Confidence: " -NoNewline; Write-Host ("{0,3}" -f $lowConfErrors) -ForegroundColor Yellow -NoNewline
    Write-Host " (Total: $($stats.LowConfidenceErrors))"
    Write-Host "  Timeouts:       " -NoNewline; Write-Host ("{0,3}" -f $timeoutErrors) -ForegroundColor Red -NoNewline
    Write-Host " (Total: $($stats.TimeoutErrors))"

    Write-Host ""

    # 3. Sucessos Recentes
    Write-Host "[3] ATUALIZAÇÕES BEM-SUCEDIDAS (Últimos 30s)" -ForegroundColor Yellow
    Write-Host "-----------------------------------------------------------------" -ForegroundColor DarkGray

    $recentSuccess = docker logs invest_backend --since 30s 2>&1 | Select-String "Saved fundamental data for" | ForEach-Object {
        if ($_ -match "Saved fundamental data for (\w+)") {
            $Matches[1]
        }
    } | Select-Object -Unique

    if ($recentSuccess) {
        $recentSuccess | ForEach-Object {
            Write-Host "  ✓ $_" -ForegroundColor Green
        }
    } else {
        Write-Host "  (Nenhuma nos últimos 30s)" -ForegroundColor DarkGray
    }

    Write-Host ""

    # 4. Validação de Desvios (Banco de Dados)
    Write-Host "[4] VALIDAÇÃO DE DESVIOS (Últimos 5 min)" -ForegroundColor Yellow
    Write-Host "-----------------------------------------------------------------" -ForegroundColor DarkGray

    try {
        $deviationCheck = docker exec invest_postgres psql -U invest_user -d invest_db -t -c "WITH recent AS (SELECT fd.field_sources FROM fundamental_data fd WHERE fd.updated_at > NOW() - INTERVAL '5 minutes'), disc AS (SELECT key, value->'divergentSources' as div FROM recent, jsonb_each(field_sources) WHERE value->'hasDiscrepancy' = 'true'::jsonb), devs AS (SELECT (jsonb_array_elements(div)->>'deviation')::numeric as deviation FROM disc WHERE div IS NOT NULL) SELECT COUNT(*) as total, MAX(deviation) as max_dev, AVG(deviation) as avg_dev FROM devs;" 2>&1

        if ($deviationCheck -match "(\d+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)") {
            $totalDisc = $Matches[1]
            $maxDev = [decimal]$Matches[2]
            $avgDev = [decimal]$Matches[3]

            Write-Host "  Total Discrepâncias: " -NoNewline; Write-Host $totalDisc -ForegroundColor Cyan
            Write-Host "  Desvio Máximo:       " -NoNewline
            if ($maxDev -gt 10000) {
                Write-Host ("{0:N2}%" -f $maxDev) -ForegroundColor Red -NoNewline
                Write-Host " ⚠️ ASTRONÔMICO!" -ForegroundColor Red
                $stats.AstronomicalDeviations++
            } elseif ($maxDev -gt 100) {
                Write-Host ("{0:N2}%" -f $maxDev) -ForegroundColor Yellow
            } else {
                Write-Host ("{0:N2}%" -f $maxDev) -ForegroundColor Green
                $stats.ReasonableDeviations++
            }
            Write-Host "  Desvio Médio:        " -NoNewline; Write-Host ("{0:N2}%" -f $avgDev) -ForegroundColor Cyan
        } else {
            Write-Host "  (Nenhuma discrepância nos últimos 5 min)" -ForegroundColor DarkGray
        }
    } catch {
        Write-Host "  Erro ao validar desvios" -ForegroundColor Red
    }

    Write-Host ""

    # 5. Taxa de Sucesso
    Write-Host "[5] MÉTRICAS GERAIS" -ForegroundColor Yellow
    Write-Host "-----------------------------------------------------------------" -ForegroundColor DarkGray

    if ($stats.Completed -gt 0) {
        $successRate = [math]::Round((($stats.Completed - $stats.Failed) / $stats.Completed) * 100, 1)
        Write-Host "  Taxa de Sucesso: " -NoNewline
        if ($successRate -gt 70) {
            Write-Host "$successRate%" -ForegroundColor Green
        } elseif ($successRate -gt 40) {
            Write-Host "$successRate%" -ForegroundColor Yellow
        } else {
            Write-Host "$successRate%" -ForegroundColor Red
        }
    }

    $elapsed = (Get-Date) - $startTime
    Write-Host "  Tempo Decorrido: " -NoNewline; Write-Host ("{0:mm}:{0:ss}" -f $elapsed) -ForegroundColor Cyan
    Write-Host "  Desvios > 10k:   " -NoNewline; Write-Host $stats.AstronomicalDeviations -ForegroundColor $(if ($stats.AstronomicalDeviations -gt 0) { "Red" } else { "Green" })

    Write-Host ""
    Write-Host "Próxima atualização em $PollIntervalSeconds segundos..." -ForegroundColor DarkGray
    Write-Host "(Ctrl+C para cancelar)" -ForegroundColor DarkGray

    Start-Sleep -Seconds $PollIntervalSeconds
}

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "  MONITOR FINALIZADO" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "ESTATÍSTICAS FINAIS:" -ForegroundColor Yellow
Write-Host "  Completados:           $($stats.Completed)"
Write-Host "  Falhados:              $($stats.Failed)"
Write-Host "  Low Confidence Errors: $($stats.LowConfidenceErrors)"
Write-Host "  Timeout Errors:        $($stats.TimeoutErrors)"
Write-Host "  Desvios Astronômicos:  $($stats.AstronomicalDeviations)" -ForegroundColor $(if ($stats.AstronomicalDeviations -gt 0) { "Red" } else { "Green" })
Write-Host ""
