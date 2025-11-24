# Git Hooks Setup Script
# Run this once after cloning the repository
# Usage: .\setup-hooks.ps1

Write-Host "🔧 Setting up Git hooks..." -ForegroundColor Yellow

# Configure Git to use .githooks directory
git config core.hooksPath .githooks

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Git hooks configured successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Enabled hooks:" -ForegroundColor Cyan
    Write-Host "  • pre-commit  - TypeScript + ESLint + Sensitive files check" -ForegroundColor Gray
    Write-Host "  • pre-push    - Build validation (backend + frontend)" -ForegroundColor Gray
    Write-Host "  • commit-msg  - Conventional Commits format validation" -ForegroundColor Gray
    Write-Host ""
    Write-Host "ℹ️  On Windows, hooks will run via Git Bash (bundled with Git for Windows)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to configure Git hooks!" -ForegroundColor Red
    Write-Host "   Make sure you're in the project root directory." -ForegroundColor Red
    exit 1
}

# Make hooks executable (Git for Windows handles this automatically)
Write-Host ""
Write-Host "🎉 Setup complete! Git hooks are now active." -ForegroundColor Green
Write-Host ""
Write-Host "To temporarily disable hooks:" -ForegroundColor Yellow
Write-Host "  git commit --no-verify" -ForegroundColor Gray
Write-Host "  git push --no-verify" -ForegroundColor Gray
