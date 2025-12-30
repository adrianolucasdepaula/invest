# Configure Backend .env for Cleanup System

Write-Host ""
Write-Host "======================================"
Write-Host "  CONFIGURE CLEANUP ENV VARS"
Write-Host "======================================"
Write-Host ""

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendEnv = Join-Path $projectRoot "backend\.env"

if (-not (Test-Path $backendEnv)) {
    Write-Host "[ERROR] backend/.env NOT found: $backendEnv"
    exit 1
}

Write-Host "[INFO] Reading backend/.env..."
$envContent = Get-Content $backendEnv -Raw

# Check and add CLEANUP_ENABLED
if ($envContent -match "CLEANUP_ENABLED") {
    Write-Host "[INFO] CLEANUP_ENABLED already configured"
    Write-Host ""
    Write-Host "Current value:"
    $envContent -split "`n" | Where-Object { $_ -match "CLEANUP_ENABLED" } | ForEach-Object {
        Write-Host "  $_"
    }
    Write-Host ""
    $changeEnabled = Read-Host "Change CLEANUP_ENABLED to 'true'? (y/n)"
    if ($changeEnabled -eq "y") {
        $envContent = $envContent -replace "CLEANUP_ENABLED\s*=\s*\w+", "CLEANUP_ENABLED=true"
        Write-Host "[OK] CLEANUP_ENABLED will be set to 'true'"
    }
} else {
    Write-Host "[INFO] Adding CLEANUP_ENABLED=true"
    $envContent += "`nCLEANUP_ENABLED=true"
}

# Check and add CLEANUP_DRY_RUN
if ($envContent -match "CLEANUP_DRY_RUN") {
    Write-Host "[INFO] CLEANUP_DRY_RUN already configured"
    Write-Host ""
    Write-Host "Current value:"
    $envContent -split "`n" | Where-Object { $_ -match "CLEANUP_DRY_RUN" } | ForEach-Object {
        Write-Host "  $_"
    }
    Write-Host ""
    $changeDryRun = Read-Host "Change CLEANUP_DRY_RUN to 'false' (real mode)? (y/n)"
    if ($changeDryRun -eq "y") {
        $envContent = $envContent -replace "CLEANUP_DRY_RUN\s*=\s*\w+", "CLEANUP_DRY_RUN=false"
        Write-Host "[OK] CLEANUP_DRY_RUN will be set to 'false' (real mode)"
    }
} else {
    Write-Host ""
    $dryRunChoice = Read-Host "Start in DRY RUN mode (simulation, nothing deleted)? (y/n)"
    if ($dryRunChoice -eq "y") {
        Write-Host "[INFO] Adding CLEANUP_DRY_RUN=true (simulation mode)"
        $envContent += "`nCLEANUP_DRY_RUN=true"
        Write-Host ""
        Write-Host "[WARNING] In DRY RUN mode, NO files will be deleted"
        Write-Host "[WARNING] Change to 'false' when ready for production"
    } else {
        Write-Host "[INFO] Adding CLEANUP_DRY_RUN=false (real mode)"
        $envContent += "`nCLEANUP_DRY_RUN=false"
    }
}

# Check and add CLEANUP_MINIO_ARCHIVES_RETENTION_DAYS
if ($envContent -match "CLEANUP_MINIO_ARCHIVES_RETENTION_DAYS") {
    Write-Host "[INFO] CLEANUP_MINIO_ARCHIVES_RETENTION_DAYS already configured"
} else {
    Write-Host "[INFO] Adding CLEANUP_MINIO_ARCHIVES_RETENTION_DAYS=365"
    $envContent += "`nCLEANUP_MINIO_ARCHIVES_RETENTION_DAYS=365"
}

# Save
Write-Host ""
Write-Host "[INFO] Saving backend/.env..."
$envContent | Set-Content -Path $backendEnv -NoNewline

Write-Host "[OK] Configuration saved!"
Write-Host ""
Write-Host "======================================"
Write-Host "  SUMMARY"
Write-Host "======================================"
Write-Host ""
Write-Host "Variables configured in backend/.env:"
$envContent -split "`n" | Where-Object { $_ -match "CLEANUP_" } | ForEach-Object {
    Write-Host "  $_"
}
Write-Host ""
Write-Host "IMPORTANT: Restart backend for changes to take effect"
Write-Host "  docker restart invest_backend"
Write-Host ""
Write-Host "======================================"
Write-Host ""
