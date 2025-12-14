#!/bin/sh
set -e

echo "🚀 Starting B3 Investment Backend..."

# Check if node_modules exists and has content
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
    echo "📦 Installing dependencies (node_modules empty or missing)..."
    npm ci
    echo "✅ Dependencies installed successfully!"
else
    # Check if package.json is newer than node_modules
    if [ "package.json" -nt "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
        echo "📦 Updating dependencies (package files changed)..."
        npm ci
        echo "✅ Dependencies updated successfully!"
    else
        echo "✅ Dependencies already installed and up to date"
    fi
fi

# Build the application (creates /app/dist)
# TROUBLESHOOTING (2025-12-14):
# ============================
# BUG ENCONTRADO: Código antigo no dist causava hasOptionsOnly=undefined no controller.
# O dist pode ficar desatualizado mesmo com volumes montados porque:
# - nest start --watch pode não detectar todas as mudanças
# - O dist é persistido entre restarts do container
#
# SOLUÇÃO: Verificar se algum arquivo .ts é mais novo que o dist
# Se sim, forçar rebuild para garantir código atualizado.
#
# MANUAL FIX: docker exec invest_backend rm -rf /app/dist && docker-compose restart backend
#
# @see BUG_REPORT_HASOPTIONS_ONLY_2025-12-14.md

NEEDS_BUILD=false

if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "🔨 Building application (dist folder empty or missing)..."
    NEEDS_BUILD=true
elif [ -n "$(find src -name '*.ts' -newer dist -print -quit 2>/dev/null)" ]; then
    # Arquivos TypeScript mais novos que dist - forçar rebuild
    echo "🔨 Source files changed since last build, rebuilding..."
    echo "   (This prevents stale compiled code issues)"
    rm -rf dist
    NEEDS_BUILD=true
else
    echo "✅ Dist folder up to date (build will run in watch mode)"
fi

if [ "$NEEDS_BUILD" = true ]; then
    npm run build
    echo "✅ Build completed successfully!"
fi

echo "🎯 Starting application..."
exec "$@"
