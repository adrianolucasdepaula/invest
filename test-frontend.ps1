# Frontend Testing Script
# Tests all frontend pages and reports status

$results = @()

$pages = @(
    @{Name='Homepage'; URL='http://localhost:3100/'},
    @{Name='Login Page'; URL='http://localhost:3100/auth/login'},
    @{Name='Register Page'; URL='http://localhost:3100/auth/register'},
    @{Name='Dashboard'; URL='http://localhost:3100/dashboard'},
    @{Name='Assets List'; URL='http://localhost:3100/assets'},
    @{Name='Asset Details (VALE3)'; URL='http://localhost:3100/assets/VALE3'},
    @{Name='Analysis Page'; URL='http://localhost:3100/analysis'},
    @{Name='Portfolio Page'; URL='http://localhost:3100/portfolio'},
    @{Name='Reports Page'; URL='http://localhost:3100/reports'},
    @{Name='Data Sources'; URL='http://localhost:3100/data-sources'},
    @{Name='Data Management'; URL='http://localhost:3100/data-management'},
    @{Name='Settings Page'; URL='http://localhost:3100/settings'}
)

Write-Host "Testing Frontend Pages..." -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

foreach ($page in $pages) {
    Write-Host "Testing: $($page.Name)..." -NoNewline

    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

        $response = Invoke-WebRequest -Uri $page.URL -Method GET -MaximumRedirection 0 -ErrorAction Stop -TimeoutSec 10

        $stopwatch.Stop()

        $status = $response.StatusCode
        $time = $stopwatch.ElapsedMilliseconds
        $hasHtml = $response.Content -match '<html'
        $redirect = 'No'

        Write-Host " OK" -ForegroundColor Green

    } catch {
        $stopwatch.Stop()

        $status = if ($_.Exception.Response) {
            [int]$_.Exception.Response.StatusCode
        } else {
            'Error'
        }

        $time = $stopwatch.ElapsedMilliseconds
        $hasHtml = 'N/A'
        $redirect = if ($status -in 301,302,303,307,308) { 'Yes' } else { 'No' }

        if ($status -in 301,302,303,307,308) {
            Write-Host " REDIRECT" -ForegroundColor Yellow
        } else {
            Write-Host " ERROR" -ForegroundColor Red
        }
    }

    $results += [PSCustomObject]@{
        Page = $page.Name
        Status = $status
        'Time (ms)' = $time
        'Has HTML' = $hasHtml
        Redirect = $redirect
        URL = $page.URL
    }
}

Write-Host ""
Write-Host "Results:" -ForegroundColor Cyan
Write-Host "========" -ForegroundColor Cyan
$results | Format-Table -AutoSize

# Test backend API connection
Write-Host ""
Write-Host "Testing Backend API Connection..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

try {
    $apiResponse = Invoke-WebRequest -Uri "http://localhost:3101/api/v1/health" -Method GET -TimeoutSec 5
    Write-Host "Backend API: " -NoNewline
    Write-Host "OK (Status: $($apiResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "Backend API: " -NoNewline
    Write-Host "ERROR" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "  Status Code: $([int]$_.Exception.Response.StatusCode)"
    }
}

Write-Host ""
