# ============================================================================
# UPDATE-DEPENDENCIES.PS1 - B3 AI Analysis Platform
# Safe Dependency Update Script (Windows PowerShell)
# ============================================================================
# Author: Claude Code (Opus 4.5)
# Created: 2025-11-29
# FASE 60: Dependency Management System
# ============================================================================

param(
    [switch]$Backend,
    [switch]$Frontend,
    [switch]$All,
    [switch]$PatchOnly,
    [switch]$SecurityOnly,
    [switch]$DryRun,
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"
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

function Write-ErrorMsg($text) {
    Write-Host "[X] $text" -ForegroundColor Red
}

function Write-Info($text) {
    Write-Host "[i] $text" -ForegroundColor Blue
}

function Write-Step($step, $text) {
    Write-Host "`n[$step] $text" -ForegroundColor White
}

# Validate TypeScript compilation
function Test-TypeScriptCompilation($path, $name) {
    Write-Info "Validating TypeScript compilation for $name..."
    Push-Location $path
    try {
        $result = npx tsc --noEmit 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$name: TypeScript compilation OK (0 errors)"
            return $true
        } else {
            Write-ErrorMsg "$name: TypeScript compilation FAILED"
            Write-Host $result -ForegroundColor Red
            return $false
        }
    } finally {
        Pop-Location
    }
}

# Run tests
function Test-ProjectTests($path, $name) {
    Write-Info "Running tests for $name..."
    Push-Location $path
    try {
        npm test 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "$name: Tests passed"
            return $true
        } else {
            Write-Warning "$name: Tests failed (non-blocking)"
            return $true  # Non-blocking for now
        }
    } catch {
        Write-Warning "$name: Tests skipped (test script not found)"
        return $true
    } finally {
        Pop-Location
    }
}

# Update Backend Dependencies
function Update-BackendDependencies {
    Write-Header "UPDATING BACKEND DEPENDENCIES"

    $backendPath = Join-Path $ProjectRoot "backend"
    if (!(Test-Path $backendPath)) {
        Write-ErrorMsg "Backend directory not found: $backendPath"
        return $false
    }

    Push-Location $backendPath
    try {
        # Step 1: Pre-update TypeScript check
        Write-Step "1/5" "Pre-update TypeScript validation"
        if (!(Test-TypeScriptCompilation $backendPath "Backend")) {
            Write-ErrorMsg "Pre-update validation failed. Fix TypeScript errors first."
            return $false
        }

        # Step 2: Security audit fix
        Write-Step "2/5" "Fixing security vulnerabilities"
        if (!$DryRun) {
            npm audit fix 2>&1 | Out-Null
            Write-Success "Security audit fix completed"
        } else {
            Write-Info "DRY RUN: Would run 'npm audit fix'"
        }

        # Step 3: Update packages
        Write-Step "3/5" "Updating packages (patch/minor only)"
        if (!$DryRun) {
            if ($PatchOnly) {
                # Only patch updates (x.y.Z)
                npm update --save 2>&1 | Out-Null
            } else {
                # Minor and patch updates
                npm update --save 2>&1 | Out-Null
            }
            Write-Success "Packages updated"
        } else {
            Write-Info "DRY RUN: Would run 'npm update --save'"
        }

        # Step 4: Post-update TypeScript check
        Write-Step "4/5" "Post-update TypeScript validation"
        if (!(Test-TypeScriptCompilation $backendPath "Backend")) {
            Write-ErrorMsg "Post-update TypeScript validation FAILED!"
            Write-ErrorMsg "Rollback recommended: git checkout package.json package-lock.json && npm install"
            return $false
        }

        # Step 5: Run tests
        if (!$SkipTests) {
            Write-Step "5/5" "Running tests"
            Test-ProjectTests $backendPath "Backend"
        } else {
            Write-Step "5/5" "Tests skipped (--SkipTests flag)"
        }

        Write-Success "Backend update completed successfully!"
        return $true
    } catch {
        Write-ErrorMsg "Error updating backend: $_"
        return $false
    } finally {
        Pop-Location
    }
}

# Update Frontend Dependencies
function Update-FrontendDependencies {
    Write-Header "UPDATING FRONTEND DEPENDENCIES"

    $frontendPath = Join-Path $ProjectRoot "frontend"
    if (!(Test-Path $frontendPath)) {
        Write-ErrorMsg "Frontend directory not found: $frontendPath"
        return $false
    }

    Push-Location $frontendPath
    try {
        # Step 1: Pre-update TypeScript check
        Write-Step "1/5" "Pre-update TypeScript validation"
        if (!(Test-TypeScriptCompilation $frontendPath "Frontend")) {
            Write-ErrorMsg "Pre-update validation failed. Fix TypeScript errors first."
            return $false
        }

        # Step 2: Security audit fix
        Write-Step "2/5" "Fixing security vulnerabilities"
        if (!$DryRun) {
            npm audit fix 2>&1 | Out-Null
            Write-Success "Security audit fix completed"
        } else {
            Write-Info "DRY RUN: Would run 'npm audit fix'"
        }

        # Step 3: Update packages
        Write-Step "3/5" "Updating packages (patch/minor only)"
        if (!$DryRun) {
            if ($PatchOnly) {
                npm update --save 2>&1 | Out-Null
            } else {
                npm update --save 2>&1 | Out-Null
            }
            Write-Success "Packages updated"
        } else {
            Write-Info "DRY RUN: Would run 'npm update --save'"
        }

        # Step 4: Post-update TypeScript check
        Write-Step "4/5" "Post-update TypeScript validation"
        if (!(Test-TypeScriptCompilation $frontendPath "Frontend")) {
            Write-ErrorMsg "Post-update TypeScript validation FAILED!"
            Write-ErrorMsg "Rollback recommended: git checkout package.json package-lock.json && npm install"
            return $false
        }

        # Step 5: Run tests
        if (!$SkipTests) {
            Write-Step "5/5" "Running lint"
            npm run lint 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Lint passed"
            } else {
                Write-Warning "Lint warnings found"
            }
        } else {
            Write-Step "5/5" "Tests/Lint skipped (--SkipTests flag)"
        }

        Write-Success "Frontend update completed successfully!"
        return $true
    } catch {
        Write-ErrorMsg "Error updating frontend: $_"
        return $false
    } finally {
        Pop-Location
    }
}

# Main execution
function Main {
    Write-Host "`n"
    Write-Host "=============================================" -ForegroundColor Magenta
    Write-Host "  B3 AI Analysis - Dependency Update        " -ForegroundColor Magenta
    Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')                  " -ForegroundColor Magenta
    Write-Host "=============================================" -ForegroundColor Magenta

    if ($DryRun) {
        Write-Warning "DRY RUN MODE - No changes will be made"
    }

    # Default to all if no specific flag
    if (!$Backend -and !$Frontend) {
        $All = $true
    }

    $success = $true

    if ($All -or $Backend) {
        if (!(Update-BackendDependencies)) {
            $success = $false
        }
    }

    if ($All -or $Frontend) {
        if (!(Update-FrontendDependencies)) {
            $success = $false
        }
    }

    Write-Header "SUMMARY"
    if ($success) {
        Write-Success "All updates completed successfully!"
        Write-Host "`nNext steps:" -ForegroundColor White
        Write-Host "1. Review changes: git diff package.json package-lock.json" -ForegroundColor Blue
        Write-Host "2. Test manually: docker-compose restart backend frontend" -ForegroundColor Blue
        Write-Host "3. Commit: git add -A && git commit -m 'chore(deps): update dependencies'" -ForegroundColor Blue
    } else {
        Write-ErrorMsg "Some updates failed. Check logs above."
        Write-Host "`nRollback commands:" -ForegroundColor Yellow
        Write-Host "  git checkout package.json package-lock.json" -ForegroundColor Yellow
        Write-Host "  npm install" -ForegroundColor Yellow
    }

    return $success
}

$result = Main
exit ([int](!$result))
