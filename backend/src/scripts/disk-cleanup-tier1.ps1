# Tier 1: Limpeza Leve (WARNING <20%)
# Target: 10-20GB em <5min
# Impacto: Zero downtime

param([switch]$DryRun)

$logFile = "$PSScriptRoot\cleanup-tier1-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$totalFreed = 0

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    "$timestamp - $Message" | Tee-Object -FilePath $logFile -Append
}

Write-Log "=== TIER 1 CLEANUP STARTED ==="
if ($DryRun) {
    Write-Log "[DRY RUN MODE - No files will be deleted]"
}

# 1. Docker logs >7 dias
Write-Log "[1/7] Cleaning Docker logs..."
$dockerLogPath = "$env:LOCALAPPDATA\Docker\log"
if (Test-Path $dockerLogPath) {
    $before = (Get-ChildItem $dockerLogPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum / 1GB

    if (-not $DryRun) {
        Get-ChildItem $dockerLogPath -Recurse -File |
            Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
            Remove-Item -Force -ErrorAction SilentlyContinue
    }

    $after = (Get-ChildItem $dockerLogPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum / 1GB
    $freed = [math]::Round($before - $after, 2)
    $totalFreed += $freed
    Write-Log "  Freed: $freed GB"
}

# 2. Windows temp >7 dias
Write-Log "[2/7] Cleaning Windows temp..."
$tempPaths = @("$env:TEMP", "$env:LOCALAPPDATA\Temp", "C:\Windows\Temp")
foreach ($path in $tempPaths) {
    if (Test-Path $path) {
        $before = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum / 1GB

        if (-not $DryRun) {
            Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue |
                Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
                Remove-Item -Force -ErrorAction SilentlyContinue
        }

        $after = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum / 1GB
        $freed = [math]::Round($before - $after, 2)
        $totalFreed += $freed
    }
}
Write-Log "  Freed: $totalFreed GB total from temp"

# 3. WSL temp files (com timeout de 30s)
Write-Log "[3/7] Cleaning WSL temp..."
if (-not $DryRun) {
    try {
        $wslJob = Start-Job -ScriptBlock {
            wsl -d docker-desktop sh -c "find /tmp -type f -mtime +7 -delete 2>/dev/null || true" 2>&1 | Out-Null
        }
        $wslJob | Wait-Job -Timeout 30 | Out-Null
        if ($wslJob.State -eq 'Running') {
            $wslJob | Stop-Job
            Write-Log "  WSL cleanup timed out after 30s (skipped)"
        } else {
            Write-Log "  WSL temp cleaned"
        }
        $wslJob | Remove-Job -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Log "  WSL cleanup failed: $($_.Exception.Message)"
    }
} else {
    Write-Log "  WSL temp cleanup skipped (dry-run)"
}

# 4. Node.js cache
Write-Log "[4/7] Cleaning Node.js cache..."
$npmCache = "$env:APPDATA\npm-cache"
if (Test-Path $npmCache) {
    $before = (Get-ChildItem $npmCache -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum / 1GB

    if (-not $DryRun) {
        Remove-Item $npmCache -Recurse -Force -ErrorAction SilentlyContinue
    }

    $freed = [math]::Round($before, 2)
    $totalFreed += $freed
    Write-Log "  Freed: $freed GB"
}

# 5. Playwright cache (keep 2 versions)
Write-Log "[5/7] Cleaning Playwright cache..."
$playwrightCache = "$env:LOCALAPPDATA\ms-playwright"
if (Test-Path $playwrightCache) {
    $browsers = Get-ChildItem $playwrightCache -Directory | Sort-Object LastWriteTime -Descending
    $toDelete = $browsers | Select-Object -Skip 2

    if ($toDelete) {
        $before = ($toDelete | Get-ChildItem -Recurse -File | Measure-Object Length -Sum).Sum / 1GB

        if (-not $DryRun) {
            $toDelete | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        }

        $freed = [math]::Round($before, 2)
        $totalFreed += $freed
        Write-Log "  Freed: $freed GB (removed $($toDelete.Count) old versions)"
    }
}

# 6. Python scraper logs >7 dias
Write-Log "[6/7] Cleaning Python scraper logs..."
$scraperLogs = "$PSScriptRoot\..\..\python-scrapers\logs"
if (Test-Path $scraperLogs) {
    $before = (Get-ChildItem $scraperLogs -Recurse -File | Measure-Object Length -Sum).Sum / 1GB

    if (-not $DryRun) {
        Get-ChildItem $scraperLogs -Recurse -File |
            Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } |
            Remove-Item -Force -ErrorAction SilentlyContinue
    }

    $after = (Get-ChildItem $scraperLogs -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum / 1GB
    $freed = [math]::Round($before - $after, 2)
    $totalFreed += $freed
    Write-Log "  Freed: $freed GB"
}

# 7. Frontend .next rebuild
Write-Log "[7/7] Cleaning frontend .next..."
$nextCache = "$PSScriptRoot\..\..\..\frontend\.next"
if (Test-Path $nextCache) {
    $before = (Get-ChildItem $nextCache -Recurse -File | Measure-Object Length -Sum).Sum / 1GB

    if (-not $DryRun) {
        Remove-Item $nextCache -Recurse -Force -ErrorAction SilentlyContinue
    }

    $freed = [math]::Round($before, 2)
    $totalFreed += $freed
    Write-Log "  Freed: $freed GB"
}

Write-Log "=== TIER 1 CLEANUP COMPLETED ==="
Write-Log "Total space freed: $totalFreed GB"
Write-Log "Log saved to: $logFile"

if ($DryRun) {
    Write-Host "`n[DRY RUN] No files were deleted. Total would free: $totalFreed GB" -ForegroundColor Yellow
} else {
    Write-Host "`nTier 1 cleanup completed: $totalFreed GB freed" -ForegroundColor Green
    Write-Host "Log: $logFile" -ForegroundColor Cyan
}
