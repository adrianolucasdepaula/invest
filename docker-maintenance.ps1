# docker-maintenance.ps1
# Docker Desktop Maintenance Script - Weekly preventive maintenance
#
# USAGE:
#   .\docker-maintenance.ps1           # Interactive mode
#   .\docker-maintenance.ps1 -Force    # Auto-approve all actions
#   .\docker-maintenance.ps1 -Verbose  # Show detailed output
#
# SCHEDULE: Run weekly via Task Scheduler
# Created: 2025-12-14

param(
    [switch]$Force,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$script:WarningsFound = @()
$script:ErrorsFound = @()

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-Status {
    param(
        [string]$Message,
        [ValidateSet("OK", "WARN", "ERROR", "INFO")]
        [string]$Status = "INFO"
    )

    $color = switch ($Status) {
        "OK" { "Green" }
        "WARN" { "Yellow" }
        "ERROR" { "Red" }
        "INFO" { "White" }
    }

    $prefix = switch ($Status) {
        "OK" { "[OK]" }
        "WARN" { "[WARN]" }
        "ERROR" { "[ERROR]" }
        "INFO" { "[i]" }
    }

    Write-Host "  $prefix $Message" -ForegroundColor $color

    if ($Status -eq "WARN") { $script:WarningsFound += $Message }
    if ($Status -eq "ERROR") { $script:ErrorsFound += $Message }
}

Write-Section "DOCKER DESKTOP MAINTENANCE SCRIPT"
Write-Host "  Version: 1.0.0 | Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ForegroundColor Gray

# ============================================
# 1. Check Disk Space (C:)
# ============================================
Write-Section "1/6 - DISK SPACE CHECK"

try {
    $disk = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='C:'"
    $freeGB = [math]::Round($disk.FreeSpace / 1GB, 2)
    $totalGB = [math]::Round($disk.Size / 1GB, 2)
    $freePercent = [math]::Round(($disk.FreeSpace / $disk.Size) * 100, 2)

    Write-Status "Disk C: $freeGB GB free of $totalGB GB ($freePercent%)" -Status "INFO"

    if ($freePercent -lt 5) {
        Write-Status "CRITICAL: Disk space below 5%!" -Status "ERROR"
    } elseif ($freePercent -lt 10) {
        Write-Status "WARNING: Disk space below 10%" -Status "WARN"
    } else {
        Write-Status "Disk space is healthy" -Status "OK"
    }
} catch {
    Write-Status "Failed to check disk space: $_" -Status "ERROR"
}

# ============================================
# 2. Check Docker VM Memory
# ============================================
Write-Section "2/6 - DOCKER VM MEMORY CHECK"

try {
    $wslStatus = wsl -l -v 2>&1
    $dockerRunning = $wslStatus | Select-String "docker-desktop.*Running"

    if ($dockerRunning) {
        $memInfo = wsl -d docker-desktop cat /proc/meminfo 2>$null
        if ($memInfo) {
            $memTotal = ($memInfo | Where-Object { $_ -match "^MemTotal" }) -replace '\D',''
            $memAvailable = ($memInfo | Where-Object { $_ -match "^MemAvailable" }) -replace '\D',''
            $swapFree = ($memInfo | Where-Object { $_ -match "^SwapFree" }) -replace '\D',''
            $swapTotal = ($memInfo | Where-Object { $_ -match "^SwapTotal" }) -replace '\D',''

            $memTotalGB = [math]::Round([int64]$memTotal / 1024 / 1024, 2)
            $memAvailableMB = [math]::Round([int64]$memAvailable / 1024, 0)
            $memAvailablePercent = [math]::Round(([int64]$memAvailable / [int64]$memTotal) * 100, 1)
            $swapFreeMB = [math]::Round([int64]$swapFree / 1024, 0)
            $swapTotalMB = [math]::Round([int64]$swapTotal / 1024, 0)

            Write-Status "VM Total: $memTotalGB GB | Available: $memAvailableMB MB ($memAvailablePercent%)" -Status "INFO"
            Write-Status "Swap: $swapFreeMB MB free of $swapTotalMB MB" -Status "INFO"

            if ($memAvailableMB -lt 500) {
                Write-Status "CRITICAL: VM memory below 500MB!" -Status "ERROR"
            } elseif ($memAvailableMB -lt 1024) {
                Write-Status "WARNING: VM memory below 1GB" -Status "WARN"
            } else {
                Write-Status "VM memory is healthy" -Status "OK"
            }

            if ($swapFreeMB -lt 100 -and $swapTotalMB -gt 0) {
                Write-Status "WARNING: Swap nearly exhausted" -Status "WARN"
            }
        }
    } else {
        Write-Status "Docker Desktop VM is not running" -Status "WARN"
    }
} catch {
    Write-Status "Failed to check VM memory: $_" -Status "ERROR"
}

# ============================================
# 3. Docker System Status
# ============================================
Write-Section "3/6 - DOCKER SYSTEM STATUS"

try {
    $dockerVersion = docker version --format '{{.Server.Version}}' 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "Docker Engine: $dockerVersion" -Status "OK"

        # Docker disk usage
        $dockerDf = docker system df --format "table {{.Type}}\t{{.Size}}\t{{.Reclaimable}}" 2>$null
        if ($Verbose) {
            Write-Host ""
            $dockerDf | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        }

        # Count containers
        $containers = docker ps -a --format "{{.Status}}" 2>$null
        $running = ($containers | Where-Object { $_ -match "^Up" }).Count
        $stopped = ($containers | Where-Object { $_ -notmatch "^Up" }).Count

        Write-Status "Containers: $running running, $stopped stopped" -Status "INFO"

        if ($stopped -gt 5) {
            Write-Status "Consider removing stopped containers" -Status "WARN"
        }
    } else {
        Write-Status "Docker is not responding!" -Status "ERROR"
    }
} catch {
    Write-Status "Failed to check Docker status: $_" -Status "ERROR"
}

# ============================================
# 4. Check Docker Desktop Logs for Errors
# ============================================
Write-Section "4/6 - DOCKER DESKTOP LOGS ANALYSIS"

try {
    $logPath = "$env:LOCALAPPDATA\Docker\log\host"

    if (Test-Path $logPath) {
        # Check monitor.log for recent errors
        $monitorLog = Join-Path $logPath "monitor.log"
        if (Test-Path $monitorLog) {
            $recentErrors = Get-Content $monitorLog -Tail 100 -ErrorAction SilentlyContinue |
                           Where-Object { $_ -match "error|no route|timeout|failed" -and $_ -notmatch "success" }

            if ($recentErrors) {
                $errorCount = $recentErrors.Count
                Write-Status "Found $errorCount potential issues in monitor.log" -Status "WARN"

                if ($Verbose) {
                    Write-Host ""
                    $recentErrors | Select-Object -First 5 | ForEach-Object {
                        Write-Host "    $_" -ForegroundColor DarkYellow
                    }
                }
            } else {
                Write-Status "No recent errors in monitor.log" -Status "OK"
            }
        }

        # Check log file sizes
        $logFiles = Get-ChildItem $logPath -Filter "*.log" -ErrorAction SilentlyContinue
        $totalLogSizeMB = [math]::Round(($logFiles | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

        Write-Status "Docker Desktop logs: $totalLogSizeMB MB" -Status "INFO"

        if ($totalLogSizeMB -gt 500) {
            Write-Status "Log files are large, consider cleanup" -Status "WARN"
        }
    } else {
        Write-Status "Docker log path not found" -Status "WARN"
    }
} catch {
    Write-Status "Failed to analyze logs: $_" -Status "ERROR"
}

# ============================================
# 5. Cleanup (Optional)
# ============================================
Write-Section "5/6 - CLEANUP (OPTIONAL)"

$shouldCleanup = $Force
if (-not $Force) {
    $response = Read-Host "  Run docker system prune? (y/N)"
    $shouldCleanup = $response -eq 'y' -or $response -eq 'Y'
}

if ($shouldCleanup) {
    try {
        Write-Status "Running docker system prune..." -Status "INFO"
        $pruneResult = docker system prune -f 2>&1
        Write-Status "Prune completed" -Status "OK"

        Write-Status "Running docker builder prune..." -Status "INFO"
        docker builder prune -f 2>&1 | Out-Null
        Write-Status "Builder prune completed" -Status "OK"
    } catch {
        Write-Status "Cleanup failed: $_" -Status "ERROR"
    }
} else {
    Write-Status "Cleanup skipped" -Status "INFO"
}

# ============================================
# 6. Summary
# ============================================
Write-Section "6/6 - MAINTENANCE SUMMARY"

$totalWarnings = $script:WarningsFound.Count
$totalErrors = $script:ErrorsFound.Count

if ($totalErrors -gt 0) {
    Write-Status "ERRORS: $totalErrors" -Status "ERROR"
    $script:ErrorsFound | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

if ($totalWarnings -gt 0) {
    Write-Status "WARNINGS: $totalWarnings" -Status "WARN"
    $script:WarningsFound | ForEach-Object { Write-Host "    - $_" -ForegroundColor Yellow }
}

if ($totalErrors -eq 0 -and $totalWarnings -eq 0) {
    Write-Status "All checks passed - system is healthy!" -Status "OK"
} elseif ($totalErrors -eq 0) {
    Write-Status "System operational with minor warnings" -Status "WARN"
} else {
    Write-Status "System requires attention!" -Status "ERROR"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MAINTENANCE COMPLETE" -ForegroundColor Green
Write-Host "  Next run recommended: $(Get-Date (Get-Date).AddDays(7) -Format 'yyyy-MM-dd')" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Return exit code based on findings
if ($totalErrors -gt 0) { exit 1 }
if ($totalWarnings -gt 0) { exit 2 }
exit 0
