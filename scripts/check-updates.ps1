# ============================================================================
# CHECK-UPDATES.PS1 - B3 AI Analysis Platform
# Dependency Management Script (Windows PowerShell)
# ============================================================================
# Author: Claude Code (Opus 4.5)
# Created: 2025-11-29
# FASE 60: Dependency Management System
# ============================================================================

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$Python,
    [switch]$All,
    [switch]$SecurityOnly,
    [switch]$Json
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot

# Colors for output
function Write-Header($text) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host " $text" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-Success($text) {
    Write-Host "[OK] $text" -ForegroundColor Green
}

function Write-Warning($text) {
    Write-Host "[!] $text" -ForegroundColor Yellow
}

function Write-Error($text) {
    Write-Host "[X] $text" -ForegroundColor Red
}

function Write-Info($text) {
    Write-Host "[i] $text" -ForegroundColor Blue
}

# Check Backend Dependencies
function Check-BackendDependencies {
    Write-Header "BACKEND DEPENDENCIES (NestJS)"

    $backendPath = Join-Path $ProjectRoot "backend"
    if (!(Test-Path $backendPath)) {
        Write-Error "Backend directory not found: $backendPath"
        return
    }

    Push-Location $backendPath
    try {
        Write-Info "Running npm outdated..."
        $outdated = npm outdated --json 2>$null | ConvertFrom-Json

        if ($outdated) {
            $majorUpdates = @()
            $minorUpdates = @()
            $patchUpdates = @()

            foreach ($pkg in $outdated.PSObject.Properties) {
                $name = $pkg.Name
                $current = $pkg.Value.current
                $wanted = $pkg.Value.wanted
                $latest = $pkg.Value.latest

                if ($current -and $latest) {
                    $currentMajor = ($current -split '\.')[0]
                    $latestMajor = ($latest -split '\.')[0]
                    $currentMinor = ($current -split '\.')[1]
                    $latestMinor = ($latest -split '\.')[1]

                    if ($currentMajor -ne $latestMajor) {
                        $majorUpdates += @{Name=$name; Current=$current; Latest=$latest; Type="MAJOR"}
                    } elseif ($currentMinor -ne $latestMinor) {
                        $minorUpdates += @{Name=$name; Current=$current; Latest=$latest; Type="MINOR"}
                    } else {
                        $patchUpdates += @{Name=$name; Current=$current; Latest=$latest; Type="PATCH"}
                    }
                }
            }

            # Summary
            Write-Host "`nSummary:" -ForegroundColor White
            Write-Host "  Major updates (breaking): $($majorUpdates.Count)" -ForegroundColor Red
            Write-Host "  Minor updates (features): $($minorUpdates.Count)" -ForegroundColor Yellow
            Write-Host "  Patch updates (safe):     $($patchUpdates.Count)" -ForegroundColor Green

            # Details
            if ($majorUpdates.Count -gt 0) {
                Write-Host "`nMAJOR UPDATES (Require Planning):" -ForegroundColor Red
                foreach ($pkg in $majorUpdates) {
                    Write-Host "  $($pkg.Name): $($pkg.Current) -> $($pkg.Latest)" -ForegroundColor Red
                }
            }

            if ($minorUpdates.Count -gt 0) {
                Write-Host "`nMINOR UPDATES (Should Test):" -ForegroundColor Yellow
                foreach ($pkg in $minorUpdates) {
                    Write-Host "  $($pkg.Name): $($pkg.Current) -> $($pkg.Latest)" -ForegroundColor Yellow
                }
            }

            if ($patchUpdates.Count -gt 0) {
                Write-Host "`nPATCH UPDATES (Generally Safe):" -ForegroundColor Green
                foreach ($pkg in $patchUpdates) {
                    Write-Host "  $($pkg.Name): $($pkg.Current) -> $($pkg.Latest)" -ForegroundColor Green
                }
            }
        } else {
            Write-Success "All backend dependencies are up to date!"
        }

        # Check for security vulnerabilities
        Write-Info "`nChecking for security vulnerabilities..."
        npm audit --json 2>$null | Out-Null
        $auditResult = $LASTEXITCODE
        if ($auditResult -eq 0) {
            Write-Success "No known security vulnerabilities found"
        } else {
            Write-Warning "Security vulnerabilities found - run 'npm audit' for details"
        }
    } finally {
        Pop-Location
    }
}

# Check Frontend Dependencies
function Check-FrontendDependencies {
    Write-Header "FRONTEND DEPENDENCIES (Next.js)"

    $frontendPath = Join-Path $ProjectRoot "frontend"
    if (!(Test-Path $frontendPath)) {
        Write-Error "Frontend directory not found: $frontendPath"
        return
    }

    Push-Location $frontendPath
    try {
        Write-Info "Running npm outdated..."
        $outdated = npm outdated --json 2>$null | ConvertFrom-Json

        if ($outdated) {
            $majorUpdates = @()
            $minorUpdates = @()
            $patchUpdates = @()

            foreach ($pkg in $outdated.PSObject.Properties) {
                $name = $pkg.Name
                $current = $pkg.Value.current
                $wanted = $pkg.Value.wanted
                $latest = $pkg.Value.latest

                if ($current -and $latest) {
                    $currentMajor = ($current -split '\.')[0]
                    $latestMajor = ($latest -split '\.')[0]
                    $currentMinor = ($current -split '\.')[1]
                    $latestMinor = ($latest -split '\.')[1]

                    if ($currentMajor -ne $latestMajor) {
                        $majorUpdates += @{Name=$name; Current=$current; Latest=$latest; Type="MAJOR"}
                    } elseif ($currentMinor -ne $latestMinor) {
                        $minorUpdates += @{Name=$name; Current=$current; Latest=$latest; Type="MINOR"}
                    } else {
                        $patchUpdates += @{Name=$name; Current=$current; Latest=$latest; Type="PATCH"}
                    }
                }
            }

            # Summary
            Write-Host "`nSummary:" -ForegroundColor White
            Write-Host "  Major updates (breaking): $($majorUpdates.Count)" -ForegroundColor Red
            Write-Host "  Minor updates (features): $($minorUpdates.Count)" -ForegroundColor Yellow
            Write-Host "  Patch updates (safe):     $($patchUpdates.Count)" -ForegroundColor Green

            # Details
            if ($majorUpdates.Count -gt 0) {
                Write-Host "`nMAJOR UPDATES (Require Planning):" -ForegroundColor Red
                foreach ($pkg in $majorUpdates) {
                    Write-Host "  $($pkg.Name): $($pkg.Current) -> $($pkg.Latest)" -ForegroundColor Red
                }
            }

            if ($minorUpdates.Count -gt 0) {
                Write-Host "`nMINOR UPDATES (Should Test):" -ForegroundColor Yellow
                foreach ($pkg in $minorUpdates) {
                    Write-Host "  $($pkg.Name): $($pkg.Current) -> $($pkg.Latest)" -ForegroundColor Yellow
                }
            }

            if ($patchUpdates.Count -gt 0) {
                Write-Host "`nPATCH UPDATES (Generally Safe):" -ForegroundColor Green
                foreach ($pkg in $patchUpdates) {
                    Write-Host "  $($pkg.Name): $($pkg.Current) -> $($pkg.Latest)" -ForegroundColor Green
                }
            }
        } else {
            Write-Success "All frontend dependencies are up to date!"
        }

        # Check for security vulnerabilities
        Write-Info "`nChecking for security vulnerabilities..."
        npm audit --json 2>$null | Out-Null
        $auditResult = $LASTEXITCODE
        if ($auditResult -eq 0) {
            Write-Success "No known security vulnerabilities found"
        } else {
            Write-Warning "Security vulnerabilities found - run 'npm audit' for details"
        }
    } finally {
        Pop-Location
    }
}

# Check Python Dependencies
function Check-PythonDependencies {
    Write-Header "PYTHON DEPENDENCIES (Scrapers)"

    Write-Info "Checking Python dependencies in Docker container..."

    # Try to run inside Docker container
    $containerName = "invest_scrapers"
    $containerRunning = docker ps --filter "name=$containerName" --format "{{.Names}}" 2>$null

    if ($containerRunning -eq $containerName) {
        Write-Info "Container '$containerName' is running"
        $outdated = docker exec $containerName pip list --outdated --format=json 2>$null | ConvertFrom-Json

        if ($outdated) {
            $majorUpdates = @()
            $minorUpdates = @()

            foreach ($pkg in $outdated) {
                $name = $pkg.name
                $current = $pkg.version
                $latest = $pkg.latest_version

                $currentMajor = ($current -split '\.')[0]
                $latestMajor = ($latest -split '\.')[0]

                if ($currentMajor -ne $latestMajor) {
                    $majorUpdates += @{Name=$name; Current=$current; Latest=$latest; Type="MAJOR"}
                } else {
                    $minorUpdates += @{Name=$name; Current=$current; Latest=$latest; Type="MINOR/PATCH"}
                }
            }

            # Summary
            Write-Host "`nSummary:" -ForegroundColor White
            Write-Host "  Major updates (breaking): $($majorUpdates.Count)" -ForegroundColor Red
            Write-Host "  Minor/Patch updates:      $($minorUpdates.Count)" -ForegroundColor Yellow

            # Details
            if ($majorUpdates.Count -gt 0) {
                Write-Host "`nMAJOR UPDATES (Require Planning):" -ForegroundColor Red
                foreach ($pkg in $majorUpdates) {
                    Write-Host "  $($pkg.Name): $($pkg.Current) -> $($pkg.Latest)" -ForegroundColor Red
                }
            }

            if ($minorUpdates.Count -gt 0) {
                Write-Host "`nMINOR/PATCH UPDATES:" -ForegroundColor Yellow
                foreach ($pkg in $minorUpdates) {
                    Write-Host "  $($pkg.Name): $($pkg.Current) -> $($pkg.Latest)" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Success "All Python dependencies are up to date!"
        }
    } else {
        Write-Warning "Container '$containerName' is not running"
        Write-Info "Start containers with: docker-compose up -d"
    }
}

# Main execution
function Main {
    Write-Host "`n"
    Write-Host "=============================================" -ForegroundColor Magenta
    Write-Host "  B3 AI Analysis - Dependency Update Check   " -ForegroundColor Magenta
    Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                  " -ForegroundColor Magenta
    Write-Host "=============================================" -ForegroundColor Magenta

    # Default to all if no specific flag
    if (!$Backend -and !$Frontend -and !$Python) {
        $All = $true
    }

    if ($All -or $Backend) {
        Check-BackendDependencies
    }

    if ($All -or $Frontend) {
        Check-FrontendDependencies
    }

    if ($All -or $Python) {
        Check-PythonDependencies
    }

    Write-Header "RECOMMENDATIONS"
    Write-Host "1. PATCH updates: Can be applied safely with 'npm update'" -ForegroundColor Green
    Write-Host "2. MINOR updates: Test after updating, check CHANGELOG" -ForegroundColor Yellow
    Write-Host "3. MAJOR updates: Require dedicated migration phase" -ForegroundColor Red
    Write-Host "`nRun 'npm audit fix' to automatically fix security issues" -ForegroundColor Blue
    Write-Host "See DEPENDENCY_MANAGEMENT.md for full process documentation`n" -ForegroundColor Blue
}

Main
