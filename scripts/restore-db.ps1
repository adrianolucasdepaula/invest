# restore-db.ps1
# Database Restore Script for B3 AI Analysis Platform
# Usage: .\scripts\restore-db.ps1 [-BackupFile <path>] [-Latest] [-Force]

param(
    [string]$BackupFile,  # Specific backup file to restore
    [switch]$Latest,      # Use most recent backup
    [switch]$Force        # Skip confirmation
)

$ErrorActionPreference = "Stop"

# Configuration
$CONTAINER = "invest_postgres"
$DB_USER = "invest_user"
$DB_NAME = "invest_db"
$BACKUP_DIR = Join-Path $PSScriptRoot "..\backups"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  B3 AI Analysis - Database Restore" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Determine backup file to use
if ($BackupFile) {
    if (-not (Test-Path $BackupFile)) {
        Write-Host "[ERROR] Backup file not found: $BackupFile" -ForegroundColor Red
        exit 1
    }
    $restoreFile = $BackupFile
} elseif ($Latest) {
    if (-not (Test-Path $BACKUP_DIR)) {
        Write-Host "[ERROR] Backup directory not found: $BACKUP_DIR" -ForegroundColor Red
        exit 1
    }

    $latestBackup = Get-ChildItem -Path $BACKUP_DIR -Filter "backup_full_*.sql" |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if (-not $latestBackup) {
        Write-Host "[ERROR] No backup files found in $BACKUP_DIR" -ForegroundColor Red
        exit 1
    }

    $restoreFile = $latestBackup.FullName
} else {
    # List available backups
    Write-Host "[INFO] Available backups:" -ForegroundColor Yellow
    Write-Host ""

    if (-not (Test-Path $BACKUP_DIR)) {
        Write-Host "[ERROR] Backup directory not found: $BACKUP_DIR" -ForegroundColor Red
        Write-Host "[TIP] Create a backup first: .\scripts\backup-db.ps1" -ForegroundColor Yellow
        exit 1
    }

    $backups = Get-ChildItem -Path $BACKUP_DIR -Filter "backup_*.sql" |
        Sort-Object LastWriteTime -Descending

    if ($backups.Count -eq 0) {
        Write-Host "[ERROR] No backup files found" -ForegroundColor Red
        Write-Host "[TIP] Create a backup first: .\scripts\backup-db.ps1" -ForegroundColor Yellow
        exit 1
    }

    $i = 1
    foreach ($backup in $backups) {
        $sizeMB = [math]::Round($backup.Length / 1MB, 2)
        Write-Host "  [$i] $($backup.Name) ($sizeMB MB) - $($backup.LastWriteTime)" -ForegroundColor White
        $i++
    }

    Write-Host ""
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  .\scripts\restore-db.ps1 -Latest              # Restore most recent backup" -ForegroundColor Gray
    Write-Host "  .\scripts\restore-db.ps1 -BackupFile <path>   # Restore specific file" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

Write-Host "[INFO] Container: $CONTAINER" -ForegroundColor Yellow
Write-Host "[INFO] Database:  $DB_NAME" -ForegroundColor Yellow
Write-Host "[INFO] Restore:   $restoreFile" -ForegroundColor Yellow

$fileSize = (Get-Item $restoreFile).Length
$fileSizeMB = [math]::Round($fileSize / 1MB, 2)
Write-Host "[INFO] Size:      $fileSizeMB MB" -ForegroundColor Yellow
Write-Host ""

# Check if container is running
$containerStatus = docker ps --filter "name=$CONTAINER" --format "{{.Status}}" 2>$null
if (-not $containerStatus) {
    Write-Host "[ERROR] Container $CONTAINER is not running!" -ForegroundColor Red
    Write-Host "[TIP] Start with: docker-compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Container $CONTAINER is running" -ForegroundColor Green

# Confirmation
if (-not $Force) {
    Write-Host ""
    Write-Host "[WARNING] This will REPLACE all data in the database!" -ForegroundColor Red
    Write-Host ""
    $confirm = Read-Host "Are you sure you want to continue? (yes/no)"

    if ($confirm -ne "yes") {
        Write-Host "[CANCELLED] Restore cancelled by user" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "[...] Dropping existing database..." -ForegroundColor Yellow

try {
    # Terminate existing connections
    docker exec $CONTAINER psql -U $DB_USER -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$DB_NAME' AND pid <> pg_backend_pid();" 2>$null | Out-Null

    # Drop and recreate database
    docker exec $CONTAINER psql -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>$null
    docker exec $CONTAINER psql -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>$null

    Write-Host "[OK] Database recreated" -ForegroundColor Green

} catch {
    Write-Host "[ERROR] Failed to recreate database: $_" -ForegroundColor Red
    exit 1
}

Write-Host "[...] Restoring from backup..." -ForegroundColor Yellow

try {
    # Copy backup file to container and restore
    $containerPath = "/tmp/restore_backup.sql"
    docker cp $restoreFile "${CONTAINER}:${containerPath}"

    docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -f $containerPath 2>&1 | Out-Null

    # Cleanup
    docker exec $CONTAINER rm $containerPath 2>$null

    Write-Host "[OK] Database restored successfully!" -ForegroundColor Green

} catch {
    Write-Host "[ERROR] Restore failed: $_" -ForegroundColor Red
    exit 1
}

# Verify restore
Write-Host ""
Write-Host "[...] Verifying restore..." -ForegroundColor Yellow

try {
    $tableCount = docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
    $assetCount = docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM assets;" 2>$null

    Write-Host "[INFO] Tables: $($tableCount.Trim())" -ForegroundColor Cyan
    Write-Host "[INFO] Assets: $($assetCount.Trim())" -ForegroundColor Cyan

} catch {
    Write-Host "[WARNING] Could not verify restore: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Restore completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "[TIP] Restart backend to reconnect: docker restart invest_backend" -ForegroundColor Yellow
Write-Host ""
