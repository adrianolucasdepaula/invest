#Requires -RunAsAdministrator

# DEFINITIVE SOLUTION - Create Tasks via XML Import (bypasses special chars issue)

Write-Host ""
Write-Host "================================================================="
Write-Host "  CREATE SCHEDULED TASKS - XML IMPORT METHOD"
Write-Host "================================================================="
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$task1XML = Join-Path $projectRoot "task1-daily.xml"
$task2XML = Join-Path $projectRoot "task2-weekly.xml"

# Verify XML files exist
Write-Host "[STEP 1] Verifying XML files..."

if (-not (Test-Path $task1XML)) {
    Write-Host "[ERROR] Task 1 XML NOT found: $task1XML"
    exit 1
}
Write-Host "[OK] Task 1 XML: $task1XML"

if (-not (Test-Path $task2XML)) {
    Write-Host "[ERROR] Task 2 XML NOT found: $task2XML"
    exit 1
}
Write-Host "[OK] Task 2 XML: $task2XML"

# Remove old tasks
Write-Host ""
Write-Host "[STEP 2] Removing old tasks..."
& schtasks.exe /delete /tn "B3_DiskCleanup_Daily_Tier1" /f 2>$null | Out-Null
& schtasks.exe /delete /tn "B3_DiskCleanup_Weekly_Tier2" /f 2>$null | Out-Null
Write-Host "[OK] Cleanup complete"

# Create Task 1 via XML
Write-Host ""
Write-Host "[STEP 3] Creating Task 1 (Daily Tier 1) via XML import..."

$task1Result = & schtasks.exe /create /tn "B3_DiskCleanup_Daily_Tier1" /xml $task1XML /ru SYSTEM /f 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Task 1 created successfully"
} else {
    Write-Host "[ERROR] Task 1 creation failed"
    Write-Host "Output: $task1Result"
    exit 1
}

# Verify Task 1
$verify1 = & schtasks.exe /query /tn "B3_DiskCleanup_Daily_Tier1" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Task 1 verified in system"
} else {
    Write-Host "[ERROR] Task 1 NOT found after creation!"
    exit 1
}

# Create Task 2 via XML
Write-Host ""
Write-Host "[STEP 4] Creating Task 2 (Weekly Tier 2) via XML import..."

$task2Result = & schtasks.exe /create /tn "B3_DiskCleanup_Weekly_Tier2" /xml $task2XML /ru SYSTEM /f 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Task 2 created successfully"
} else {
    Write-Host "[ERROR] Task 2 creation failed"
    Write-Host "Output: $task2Result"
    exit 1
}

# Verify Task 2
$verify2 = & schtasks.exe /query /tn "B3_DiskCleanup_Weekly_Tier2" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Task 2 verified in system"
} else {
    Write-Host "[ERROR] Task 2 NOT found after creation!"
    exit 1
}

# Detailed verification via PowerShell
Write-Host ""
Write-Host "[STEP 5] Detailed verification (PowerShell)..."
Write-Host ""

try {
    $t1 = Get-ScheduledTask -TaskName "B3_DiskCleanup_Daily_Tier1" -ErrorAction Stop
    $t1info = Get-ScheduledTaskInfo -TaskName "B3_DiskCleanup_Daily_Tier1"

    Write-Host "Task 1 (Daily Tier 1):"
    Write-Host "  State: $($t1.State)"
    Write-Host "  Next Run: $($t1info.NextRunTime)"
    Write-Host "  Triggers: $($t1.Triggers.Count)"
    Write-Host ""
} catch {
    Write-Host "[ERROR] Cannot get Task 1 details: $_"
    Write-Host ""
}

try {
    $t2 = Get-ScheduledTask -TaskName "B3_DiskCleanup_Weekly_Tier2" -ErrorAction Stop
    $t2info = Get-ScheduledTaskInfo -TaskName "B3_DiskCleanup_Weekly_Tier2"

    Write-Host "Task 2 (Weekly Tier 2):"
    Write-Host "  State: $($t2.State)"
    Write-Host "  Next Run: $($t2info.NextRunTime)"
    Write-Host "  Triggers: $($t2.Triggers.Count)"
    Write-Host ""
} catch {
    Write-Host "[ERROR] Cannot get Task 2 details: $_"
    Write-Host ""
}

# Final summary
Write-Host "================================================================="
Write-Host "  SUCCESS - TASKS CREATED VIA XML"
Write-Host "================================================================="
Write-Host ""
Write-Host "Scheduled tasks created:"
Write-Host "  1. B3_DiskCleanup_Daily_Tier1"
Write-Host "     - Schedule: Daily at 2:00 AM"
Write-Host "     - Target: 10-20GB"
Write-Host "     - Impact: Zero downtime"
Write-Host ""
Write-Host "  2. B3_DiskCleanup_Weekly_Tier2"
Write-Host "     - Schedule: Sundays at 3:00 AM"
Write-Host "     - Target: 50-100GB"
Write-Host "     - Impact: Docker restart (2-3 min)"
Write-Host ""
Write-Host "To test Task 1 manually (requires Admin):"
Write-Host "  schtasks.exe /run /tn B3_DiskCleanup_Daily_Tier1"
Write-Host ""
Write-Host "To check logs after execution:"
Write-Host "  Get-Content backend\src\scripts\cleanup-tier1.log -Tail 50"
Write-Host ""
Write-Host "To verify in Task Scheduler GUI:"
Write-Host "  Win + R -> taskschd.msc -> Search 'B3_DiskCleanup'"
Write-Host ""
Write-Host "================================================================="
Write-Host ""
