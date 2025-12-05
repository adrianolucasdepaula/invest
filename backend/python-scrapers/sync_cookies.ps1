# sync_cookies.ps1 - Script to sync cookies from host to Docker container
# This solves the Dropbox + Docker volume sync issue

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$sourceCookiesDir = Join-Path $projectRoot "data\cookies"
$destCookiesDir = "/app/data/cookies"
$containerName = "invest_scrapers"

Write-Host "=== Cookie Sync Script ===" -ForegroundColor Cyan
Write-Host "Source: $sourceCookiesDir"
Write-Host "Destination: $containerName`:$destCookiesDir"

# Get all cookie files
$cookieFiles = Get-ChildItem -Path $sourceCookiesDir -Filter "*.json" -ErrorAction SilentlyContinue

if (-not $cookieFiles) {
    Write-Host "No cookie files found in $sourceCookiesDir" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nFound $($cookieFiles.Count) cookie files:" -ForegroundColor Green
$cookieFiles | ForEach-Object { Write-Host "  - $($_.Name)" }

# Ensure destination directory exists
docker exec $containerName mkdir -p $destCookiesDir 2>$null

# Copy each file
$successCount = 0
$failCount = 0

foreach ($file in $cookieFiles) {
    try {
        # Read file content as bytes and convert to base64
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
        $base64 = [Convert]::ToBase64String($bytes)

        # Write to container via base64 decode
        $destPath = "$destCookiesDir/$($file.Name)"
        $base64 | docker exec -i $containerName sh -c "base64 -d > '$destPath'"

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK] $($file.Name)" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  [FAIL] $($file.Name)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  [ERROR] $($file.Name): $_" -ForegroundColor Red
        $failCount++
    }
}

Write-Host "`n=== Results ===" -ForegroundColor Cyan
Write-Host "Success: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Gray" })

# Verify files in container
Write-Host "`n=== Verification ===" -ForegroundColor Cyan
docker exec $containerName ls -la $destCookiesDir
