#Requires -RunAsAdministrator

# MASTER SCRIPT - Complete Automation System Setup

Write-Host ""
Write-Host "================================================================="
Write-Host "  B3 AI PLATFORM - DISK LIFECYCLE AUTOMATION SETUP"
Write-Host "================================================================="
Write-Host ""
Write-Host "This script will:"
Write-Host "  1. Recreate scheduled tasks (Daily + Weekly)"
Write-Host "  2. Configure backend environment variables"
Write-Host "  3. Verify complete system"
Write-Host "  4. Run test execution"
Write-Host ""

$continue = Read-Host "Continue? (y/n)"
if ($continue -ne "y") {
    Write-Host "Setup cancelled"
    exit 0
}

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# STEP 1: Recreate Tasks
Write-Host ""
Write-Host "================================================================="
Write-Host "  STEP 1: RECREATE SCHEDULED TASKS (XML METHOD)"
Write-Host "================================================================="
Write-Host ""

& "$projectRoot\create-tasks-xml-method.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Task creation failed. Stopping setup."
    exit 1
}

# STEP 2: Configure Environment
Write-Host ""
Write-Host "================================================================="
Write-Host "  STEP 2: CONFIGURE BACKEND ENVIRONMENT"
Write-Host "================================================================="
Write-Host ""

& "$projectRoot\configure-cleanup-env.ps1"

# STEP 3: Verify System
Write-Host ""
Write-Host "================================================================="
Write-Host "  STEP 3: VERIFY COMPLETE SYSTEM"
Write-Host "================================================================="
Write-Host ""

& "$projectRoot\quick-check.ps1"

# STEP 4: Test Execution (Optional)
Write-Host ""
Write-Host "================================================================="
Write-Host "  STEP 4: TEST MANUAL EXECUTION (Optional)"
Write-Host "================================================================="
Write-Host ""
Write-Host "IMPORTANT: This will run Tier 1 cleanup script NOW"
Write-Host "  - Expected duration: 2-5 minutes"
Write-Host "  - Target: Free 10-20GB of disk space"
Write-Host "  - No downtime (containers keep running)"
Write-Host ""

$runTest = Read-Host "Run manual test? (y/n)"

if ($runTest -eq "y") {
    Write-Host ""
    Write-Host "[INFO] Running Task 1 (Daily Tier 1) manually..."
    Write-Host ""

    & schtasks.exe /run /tn "B3_DiskCleanup_Daily_Tier1"

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Task started successfully"
        Write-Host ""
        Write-Host "Monitoring log file (Ctrl+C to stop monitoring)..."
        Write-Host ""

        Start-Sleep -Seconds 3

        $logFile = Join-Path $projectRoot "backend\src\scripts\cleanup-tier1.log"

        if (Test-Path $logFile) {
            Get-Content $logFile -Wait -Tail 20
        } else {
            Write-Host "[WARNING] Log file not created yet. Check manually:"
            Write-Host "  Get-Content backend\src\scripts\cleanup-tier1.log -Tail 50"
        }
    } else {
        Write-Host "[ERROR] Failed to start task"
    }
} else {
    Write-Host ""
    Write-Host "[INFO] Manual test skipped"
    Write-Host ""
    Write-Host "To run later:"
    Write-Host "  schtasks.exe /run /tn B3_DiskCleanup_Daily_Tier1"
}

# Final Summary
Write-Host ""
Write-Host "================================================================="
Write-Host "  SETUP COMPLETE"
Write-Host "================================================================="
Write-Host ""
Write-Host "Automated Cleanup System is now ACTIVE:"
Write-Host ""
Write-Host "  [TASK 1] Daily Tier 1 Cleanup"
Write-Host "    - Schedule: Every day at 2:00 AM"
Write-Host "    - Target: Free 10-20GB"
Write-Host "    - Impact: Zero downtime"
Write-Host ""
Write-Host "  [TASK 2] Weekly Tier 2 Cleanup"
Write-Host "    - Schedule: Sundays at 3:00 AM"
Write-Host "    - Target: Free 50-100GB"
Write-Host "    - Impact: Docker restart (2-3 min downtime)"
Write-Host ""
Write-Host "Backend NestJS @Cron Jobs (if CLEANUP_ENABLED=true):"
Write-Host "  - MinIO Archives Cleanup: Daily 2:00 AM (365 days retention)"
Write-Host "  - Docker Volumes Cleanup: Weekly Sunday 3:00 AM"
Write-Host "  - Monthly Reports: 1st of month 4:00 AM"
Write-Host ""
Write-Host "To monitor:"
Write-Host "  - Logs: backend\src\scripts\cleanup-*.log"
Write-Host "  - Task Scheduler: Win+R -> taskschd.msc -> Search 'B3_DiskCleanup'"
Write-Host ""
Write-Host "================================================================="
Write-Host ""
