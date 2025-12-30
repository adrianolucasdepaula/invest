# Tier 3: Shutdown Preventivo (EMERGENCY <5%)
# Target: Prevenir crash do sistema
# Impacto: Sistema para completamente até intervenção manual

param([switch]$DryRun)

$logFile = "$PSScriptRoot\cleanup-tier3-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

function Write-Log {
    param($Message)
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    "$timestamp - $Message" | Tee-Object -FilePath $logFile -Append
}

Write-Log "=== TIER 3 EMERGENCY CLEANUP STARTED ==="
if ($DryRun) {
    Write-Log "[DRY RUN MODE - Emergency procedures would execute]"
}

# 1. Alertar admin via desktop notification
Write-Log "[1/5] Sending desktop notification..."
try {
    Add-Type -AssemblyName System.Windows.Forms
    $notification = New-Object System.Windows.Forms.NotifyIcon
    $notification.Icon = [System.Drawing.SystemIcons]::Warning
    $notification.BalloonTipTitle = "DISK EMERGENCY - B3 AI Platform"
    $notification.BalloonTipText = "C: Drive < 5% free. Emergency shutdown initiated. Check log: $logFile"
    $notification.Visible = $true
    $notification.ShowBalloonTip(30000)
    Write-Log "  Desktop notification sent"
} catch {
    Write-Log "  WARNING: Failed to send desktop notification: $_"
}

# 2. Backup PostgreSQL to local file
Write-Log "[2/5] Backing up PostgreSQL to emergency backup..."
if (-not $DryRun) {
    $backupFile = "$PSScriptRoot\emergency-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').sql"
    Write-Log "  Backup location: $backupFile"

    try {
        docker exec invest_postgres pg_dump -U invest_user invest_db > $backupFile 2>&1
        $backupSize = (Get-Item $backupFile).Length / 1MB
        Write-Log "  Backup completed: $([math]::Round($backupSize, 2)) MB"
    } catch {
        Write-Log "  ERROR: Backup failed: $_"
        Write-Log "  Continuing with emergency procedures..."
    }
} else {
    Write-Log "  [DRY RUN] Would create emergency backup"
}

# 3. Shutdown Docker Desktop
Write-Log "[3/5] Shutting down Docker Desktop..."
if (-not $DryRun) {
    Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
    wsl --shutdown
    Start-Sleep -Seconds 5
    Write-Log "  Docker Desktop shutdown complete"
} else {
    Write-Log "  [DRY RUN] Would shutdown Docker Desktop"
}

# 4. Execute Tier 2 cleanup
Write-Log "[4/5] Executing Tier 2 cleanup..."
if (-not $DryRun) {
    & "$PSScriptRoot\disk-cleanup-tier2.ps1" 2>&1 | ForEach-Object { Write-Log "  [Tier2] $_" }
    Write-Log "  Tier 2 cleanup completed"
} else {
    Write-Log "  [DRY RUN] Would execute Tier 2 cleanup"
}

# 5. Create startup blocker file
Write-Log "[5/5] Creating startup blocker..."
$blockerFile = "$PSScriptRoot\..\..\..\DISK_EMERGENCY_BLOCK"
if (-not $DryRun) {
    $blockerContent = @"
===============================================================================
                       DISK EMERGENCY - STARTUP BLOCKED
===============================================================================

Emergency shutdown executed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

CRITICAL: C: Drive fell below 5% free space

Docker Desktop has been shut down preventively to avoid 500 errors and data
corruption. Manual intervention is REQUIRED before restarting the system.

===============================================================================
                            REQUIRED ACTIONS
===============================================================================

1. FREE AT LEAST 100GB ON C: DRIVE:

   Option A (RECOMMENDED): Move large personal files to D: drive
   - Downloads folder
   - Documents folder
   - Videos/Music folders
   - Old project folders

   Option B: Aggressive Windows cleanup
   - Run: cleanmgr /d C:
   - Enable "System files" option
   - Select: Temp files, Downloads, Recycle Bin, Windows Update Cleanup

   Option C: Uninstall unused applications
   - Settings → Apps → Sort by size
   - Remove large applications you don't use

2. VERIFY DISK SPACE:
   - Target: >20% free (~187GB)
   - Check: Get-PSDrive -Name C

3. REMOVE THIS BLOCKER FILE:
   - Delete: $blockerFile

4. RESTART DOCKER:
   - Run: docker-compose up -d
   - Or use: .\system-manager.ps1 start

===============================================================================
                            EMERGENCY LOG
===============================================================================

Full log: $logFile

Tier 2 cleanup was executed as part of emergency procedures.
Check the log for details on space freed.

===============================================================================
                        PREVENTING FUTURE EMERGENCIES
===============================================================================

After resolving this crisis, the automated disk lifecycle management system
will help prevent recurrence:

- Daily automated cleanup (Tier 1) at 2 AM
- Weekly aggressive cleanup (Tier 2) on Sundays
- Prometheus alerts before reaching critical thresholds
- Auto-shutdown when space drops below 5%

System will auto-restart cleanup when disk space crosses 20% threshold.

===============================================================================

For assistance, check KNOWN-ISSUES.md → #DOCKER_DESKTOP_500
"@
    $blockerContent | Out-File -FilePath $blockerFile -Encoding UTF8
    Write-Log "  Blocker file created: $blockerFile"
} else {
    Write-Log "  [DRY RUN] Would create blocker file"
}

Write-Log "=== TIER 3 EMERGENCY CLEANUP COMPLETED ==="
Write-Log "Docker startup BLOCKED until manual intervention"
Write-Log "Blocker file: $blockerFile"
Write-Log "Log saved to: $logFile"

if ($DryRun) {
    Write-Host "`n[DRY RUN] No actions taken. Emergency procedures would execute." -ForegroundColor Red
} else {
    Write-Host "`n===============================================================================" -ForegroundColor Red
    Write-Host "                    EMERGENCY SHUTDOWN COMPLETED" -ForegroundColor Red
    Write-Host "===============================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "C: Drive fell below 5% free space. Docker has been shut down preventively." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "REQUIRED ACTIONS:" -ForegroundColor Cyan
    Write-Host "1. Free at least 100GB on C: drive (move files to D:, cleanup, uninstall apps)" -ForegroundColor White
    Write-Host "2. Delete blocker file: $blockerFile" -ForegroundColor White
    Write-Host "3. Restart Docker: docker-compose up -d" -ForegroundColor White
    Write-Host ""
    Write-Host "Full instructions in: $blockerFile" -ForegroundColor Cyan
    Write-Host "Log file: $logFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Red
}
