# Tier 2: Limpeza Agressiva (CRITICAL <10%)
# Target: 50-100GB em <15min
# Impacto: Docker restart (2-3min downtime)

param([switch]$DryRun)

$logFile = "$PSScriptRoot\cleanup-tier2-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$totalFreed = 0

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    "$timestamp - $Message" | Tee-Object -FilePath $logFile -Append
}

Write-Log "=== TIER 2 CLEANUP STARTED (CRITICAL) ==="
if ($DryRun) {
    Write-Log "[DRY RUN MODE - No destructive actions will be taken]"
}

# 1. Execute Tier 1 first
Write-Log "[PREREQUISITE] Executing Tier 1 cleanup..."
if (-not $DryRun) {
    & "$PSScriptRoot\disk-cleanup-tier1.ps1" 2>&1 | Out-Null
    Write-Log "  Tier 1 completed"
} else {
    Write-Log "  [DRY RUN] Would execute Tier 1"
}

# 2. Stop Docker Desktop
Write-Log "[1/6] Stopping Docker Desktop..."
if (-not $DryRun) {
    Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    wsl --shutdown
    Start-Sleep -Seconds 5
    Write-Log "  Docker stopped"
} else {
    Write-Log "  [DRY RUN] Would stop Docker Desktop"
}

# 3. Docker system prune -a --volumes
Write-Log "[2/6] Docker system prune (removing unused images)..."
if (-not $DryRun) {
    # Restart Docker temporarily for prune
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -Wait:$false
    Start-Sleep -Seconds 30

    $pruneOutput = docker system df 2>&1
    Write-Log "  Before prune:`n$pruneOutput"

    $pruneResult = docker system prune -a --volumes -f 2>&1
    Write-Log "  Prune output:`n$pruneResult"

    # Extract freed space from output
    if ($pruneResult -match "Total reclaimed space:\s*([\d.]+)\s*(GB|MB)") {
        $freed = [decimal]$matches[1]
        if ($matches[2] -eq "MB") { $freed = $freed / 1024 }
        $totalFreed += $freed
        Write-Log "  Freed: $freed GB"
    }

    # Stop Docker again
    Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    wsl --shutdown
    Start-Sleep -Seconds 5
} else {
    Write-Log "  [DRY RUN] Would execute docker system prune -a --volumes"
}

# 4. Compact WSL VHDX (requires Hyper-V on Pro/Enterprise)
Write-Log "[3/6] Attempting WSL VHDX compaction..."
$vhdxPath = "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx"
if (Test-Path $vhdxPath) {
    $before = (Get-Item $vhdxPath).Length / 1GB
    Write-Log "  VHDX size before: $([math]::Round($before, 2)) GB"

    if (-not $DryRun) {
        # Try Optimize-VHD (requires Hyper-V)
        if (Get-Module -ListAvailable -Name Hyper-V) {
            try {
                Optimize-VHD -Path $vhdxPath -Mode Full -ErrorAction Stop
                $after = (Get-Item $vhdxPath).Length / 1GB
                $freed = [math]::Round($before - $after, 2)
                $totalFreed += $freed
                Write-Log "  VHDX freed: $freed GB"
            } catch {
                Write-Log "  WARNING: Optimize-VHD failed (requires Hyper-V Pro/Enterprise): $_"
            }
        } else {
            Write-Log "  SKIPPED: Hyper-V not available (Windows Home Edition)"
        }
    } else {
        Write-Log "  [DRY RUN] Would compact VHDX"
    }
} else {
    Write-Log "  WARNING: VHDX not found at $vhdxPath"
}

# 5. PostgreSQL VACUUM FULL (if Docker is running)
Write-Log "[4/6] PostgreSQL VACUUM FULL..."
if (-not $DryRun) {
    # Temporarily start Docker for database maintenance
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -Wait:$false
    Write-Log "  Waiting for Docker to start..."
    Start-Sleep -Seconds 60

    try {
        $vacuumOutput = docker exec invest_postgres psql -U invest_user -d invest_db -c "VACUUM FULL ANALYZE;" 2>&1
        Write-Log "  VACUUM output: $vacuumOutput"
    } catch {
        Write-Log "  WARNING: PostgreSQL VACUUM failed: $_"
    }

    # Stop Docker again
    Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    wsl --shutdown
    Start-Sleep -Seconds 5
} else {
    Write-Log "  [DRY RUN] Would execute VACUUM FULL ANALYZE"
}

# 6. Restart Docker Desktop
Write-Log "[5/6] Restarting Docker Desktop..."
if (-not $DryRun) {
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Log "  Docker Desktop started (waiting 90s for initialization)..."
    Start-Sleep -Seconds 90
    Write-Log "  Docker Desktop ready"
} else {
    Write-Log "  [DRY RUN] Would restart Docker Desktop"
}

Write-Log "=== TIER 2 CLEANUP COMPLETED ==="
Write-Log "Total space freed: $totalFreed GB"
Write-Log "Log saved to: $logFile"

if ($DryRun) {
    Write-Host "`n[DRY RUN] No actions taken. Estimated space to free: $totalFreed GB" -ForegroundColor Yellow
} else {
    Write-Host "`nTier 2 cleanup completed: $totalFreed GB freed" -ForegroundColor Green
    Write-Host "Log: $logFile" -ForegroundColor Cyan
    Write-Host "`nDocker Desktop has been restarted and should be operational." -ForegroundColor Green
}
