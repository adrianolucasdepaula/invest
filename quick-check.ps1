# Quick System Check - No special characters

Write-Host ""
Write-Host "======================================"
Write-Host "  QUICK SYSTEM CHECK"
Write-Host "======================================"
Write-Host ""

# Check 1: Tasks
Write-Host "[1] Checking Scheduled Tasks..."
$task1 = schtasks.exe /query /tn "B3_DiskCleanup_Daily_Tier1" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Task 1 (Daily Tier 1) exists"
} else {
    Write-Host "[FAIL] Task 1 NOT found"
}

$task2 = schtasks.exe /query /tn "B3_DiskCleanup_Weekly_Tier2" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Task 2 (Weekly Tier 2) exists"
} else {
    Write-Host "[FAIL] Task 2 NOT found"
}

# Check 2: Task Details
Write-Host ""
Write-Host "[2] Task 1 Details:"
try {
    $t1 = Get-ScheduledTask -TaskName "B3_DiskCleanup_Daily_Tier1" -ErrorAction Stop
    $t1info = Get-ScheduledTaskInfo -TaskName "B3_DiskCleanup_Daily_Tier1"
    Write-Host "  State: $($t1.State)"
    Write-Host "  Next Run: $($t1info.NextRunTime)"
    if ($t1info.LastRunTime) {
        Write-Host "  Last Run: $($t1info.LastRunTime)"
        Write-Host "  Last Result: $($t1info.LastTaskResult)"
    } else {
        Write-Host "  Last Run: Never"
    }
} catch {
    Write-Host "  Error getting details: $_"
}

Write-Host ""
Write-Host "[3] Task 2 Details:"
try {
    $t2 = Get-ScheduledTask -TaskName "B3_DiskCleanup_Weekly_Tier2" -ErrorAction Stop
    $t2info = Get-ScheduledTaskInfo -TaskName "B3_DiskCleanup_Weekly_Tier2"
    Write-Host "  State: $($t2.State)"
    Write-Host "  Next Run: $($t2info.NextRunTime)"
    if ($t2info.LastRunTime) {
        Write-Host "  Last Run: $($t2info.LastRunTime)"
        Write-Host "  Last Result: $($t2info.LastTaskResult)"
    } else {
        Write-Host "  Last Run: Never"
    }
} catch {
    Write-Host "  Error getting details: $_"
}

# Check 3: Disk Space
Write-Host ""
Write-Host "[4] Disk Space (C: Drive):"
$drive = Get-PSDrive -Name C
$freeGB = [math]::Round($drive.Free / 1GB, 2)
$totalGB = [math]::Round(($drive.Free + $drive.Used) / 1GB, 2)
Write-Host "  Free: $freeGB GB of $totalGB GB"

if ($freeGB -lt 94) {
    Write-Host "  [CRITICAL] Less than 10 percent free"
} elseif ($freeGB -lt 187) {
    Write-Host "  [WARNING] Less than 20 percent free"
} else {
    Write-Host "  [OK] More than 20 percent free"
}

# Check 4: Scripts exist
Write-Host ""
Write-Host "[5] PowerShell Scripts:"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$scripts = Join-Path $root "backend\src\scripts"

$tier1 = Join-Path $scripts "disk-cleanup-tier1.ps1"
$tier2 = Join-Path $scripts "disk-cleanup-tier2.ps1"

if (Test-Path $tier1) {
    Write-Host "[OK] Tier 1 script exists"
} else {
    Write-Host "[FAIL] Tier 1 script NOT found"
}

if (Test-Path $tier2) {
    Write-Host "[OK] Tier 2 script exists"
} else {
    Write-Host "[FAIL] Tier 2 script NOT found"
}

# Check 5: Backend .env
Write-Host ""
Write-Host "[6] Backend Configuration:"
$backendEnv = Join-Path $root "backend\.env"
if (Test-Path $backendEnv) {
    Write-Host "[OK] backend/.env exists"

    $content = Get-Content $backendEnv -Raw

    if ($content -match "CLEANUP_ENABLED\s*=\s*true") {
        Write-Host "[OK] CLEANUP_ENABLED=true"
    } elseif ($content -match "CLEANUP_ENABLED\s*=\s*false") {
        Write-Host "[WARNING] CLEANUP_ENABLED=false (disabled)"
    } else {
        Write-Host "[INFO] CLEANUP_ENABLED not set"
    }

    if ($content -match "CLEANUP_DRY_RUN\s*=\s*true") {
        Write-Host "[WARNING] CLEANUP_DRY_RUN=true (simulation mode)"
    } elseif ($content -match "CLEANUP_DRY_RUN\s*=\s*false") {
        Write-Host "[OK] CLEANUP_DRY_RUN=false"
    } else {
        Write-Host "[INFO] CLEANUP_DRY_RUN not set"
    }
} else {
    Write-Host "[FAIL] backend/.env NOT found"
}

# Summary
Write-Host ""
Write-Host "======================================"
Write-Host "  NEXT STEPS"
Write-Host "======================================"
Write-Host ""
Write-Host "To run Task 1 manually (requires Admin):"
Write-Host "  schtasks.exe /run /tn B3_DiskCleanup_Daily_Tier1"
Write-Host ""
Write-Host "To check logs after execution:"
Write-Host "  Get-Content backend\src\scripts\cleanup-tier1.log -Tail 50"
Write-Host ""
Write-Host "======================================"
Write-Host ""
