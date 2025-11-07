#!/usr/bin/env pwsh
# Diagnóstico completo do sistema

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DIAGNÓSTICO DO SISTEMA B3 PLATFORM" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Status dos containers
Write-Host "1. STATUS DOS CONTAINERS:" -ForegroundColor Yellow
docker ps -a --filter "name=invest_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

# 2. Logs do backend
Write-Host "2. LOGS DO BACKEND (últimas 100 linhas):" -ForegroundColor Yellow
docker logs invest_backend --tail 100 2>&1
Write-Host ""

# 3. Logs do frontend
Write-Host "3. LOGS DO FRONTEND (últimas 50 linhas):" -ForegroundColor Yellow
docker logs invest_frontend --tail 50 2>&1
Write-Host ""

# 4. Logs do postgres
Write-Host "4. LOGS DO POSTGRES (últimas 30 linhas):" -ForegroundColor Yellow
docker logs invest_postgres --tail 30 2>&1
Write-Host ""

# 5. Verificar se scripts têm line endings corretos
Write-Host "5. LINE ENDINGS DOS SCRIPTS:" -ForegroundColor Yellow
git ls-files --eol | Select-String ".sh"
Write-Host ""

# 6. Verificar imagens Docker
Write-Host "6. IMAGENS DOCKER:" -ForegroundColor Yellow
docker images | Select-String "invest"
Write-Host ""

# 7. Verificar volumes
Write-Host "7. VOLUMES:" -ForegroundColor Yellow
docker volume ls | Select-String "invest"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FIM DO DIAGNÓSTICO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
