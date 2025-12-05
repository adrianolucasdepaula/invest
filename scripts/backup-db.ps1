# backup-db.ps1
# Database Backup Script for B3 AI Analysis Platform
# Usage: .\scripts\backup-db.ps1 [-Full] [-SchemaOnly] [-DataOnly]

param(
    [switch]$Full,        # Full backup (schema + data) - default
    [switch]$SchemaOnly,  # Schema only (structure, no data)
    [switch]$DataOnly,    # Data only (no schema)
    [string]$Output       # Custom output path
)

$ErrorActionPreference = "Stop"

# Configuration
$CONTAINER = "invest_postgres"
$DB_USER = "invest_user"
$DB_NAME = "invest_db"
$BACKUP_DIR = Join-Path $PSScriptRoot "..\backups"
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"

# Create backup directory if not exists
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
    Write-Host "[OK] Created backup directory: $BACKUP_DIR" -ForegroundColor Green
}

# Determine backup type and filename
$backupType = "full"
$pgDumpArgs = @()

if ($SchemaOnly) {
    $backupType = "schema"
    $pgDumpArgs += "-s"
} elseif ($DataOnly) {
    $backupType = "data"
    $pgDumpArgs += "-a"
}

# Set output path
if ($Output) {
    $BACKUP_FILE = $Output
} else {
    $BACKUP_FILE = Join-Path $BACKUP_DIR "backup_${backupType}_${DATE}.sql"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  B3 AI Analysis - Database Backup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] Container: $CONTAINER" -ForegroundColor Yellow
Write-Host "[INFO] Database:  $DB_NAME" -ForegroundColor Yellow
Write-Host "[INFO] Type:      $backupType" -ForegroundColor Yellow
Write-Host "[INFO] Output:    $BACKUP_FILE" -ForegroundColor Yellow
Write-Host ""

# Check if container is running
$containerStatus = docker ps --filter "name=$CONTAINER" --format "{{.Status}}" 2>$null
if (-not $containerStatus) {
    Write-Host "[ERROR] Container $CONTAINER is not running!" -ForegroundColor Red
    Write-Host "[TIP] Start with: docker-compose up -d postgres" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Container $CONTAINER is running" -ForegroundColor Green

# Perform backup
Write-Host "[...] Creating backup..." -ForegroundColor Yellow

try {
    $pgDumpCmd = "pg_dump -U $DB_USER $DB_NAME"
    if ($pgDumpArgs.Count -gt 0) {
        $pgDumpCmd += " " + ($pgDumpArgs -join " ")
    }

    docker exec $CONTAINER sh -c $pgDumpCmd > $BACKUP_FILE

    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed with exit code $LASTEXITCODE"
    }

    # Get file size
    $fileSize = (Get-Item $BACKUP_FILE).Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)

    Write-Host ""
    Write-Host "[OK] Backup created successfully!" -ForegroundColor Green
    Write-Host "[INFO] File: $BACKUP_FILE" -ForegroundColor Cyan
    Write-Host "[INFO] Size: $fileSizeMB MB" -ForegroundColor Cyan

    # Count tables and records
    $tableCount = docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
    $assetCount = docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM assets;" 2>$null

    Write-Host "[INFO] Tables: $($tableCount.Trim())" -ForegroundColor Cyan
    Write-Host "[INFO] Assets: $($assetCount.Trim())" -ForegroundColor Cyan

} catch {
    Write-Host "[ERROR] Backup failed: $_" -ForegroundColor Red
    exit 1
}

# Cleanup old backups (keep last 7)
Write-Host ""
Write-Host "[...] Cleaning old backups (keeping last 7)..." -ForegroundColor Yellow

$oldBackups = Get-ChildItem -Path $BACKUP_DIR -Filter "backup_*.sql" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -Skip 7

if ($oldBackups.Count -gt 0) {
    foreach ($backup in $oldBackups) {
        Remove-Item $backup.FullName -Force
        Write-Host "[DELETED] $($backup.Name)" -ForegroundColor DarkGray
    }
    Write-Host "[OK] Removed $($oldBackups.Count) old backup(s)" -ForegroundColor Green
} else {
    Write-Host "[OK] No old backups to remove" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Backup completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
