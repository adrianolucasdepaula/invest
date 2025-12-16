#!/bin/sh
set -e

echo "🚀 Starting B3 Investment Frontend..."

# FASE 131: Validacao de configuracao do bundler
# Previne erros de webpack/turbopack por configuracao incorreta
validate_bundler_config() {
    echo "🔍 Validating bundler configuration..."

    # Verificar se --turbopack esta no dev script
    if ! grep -q "\-\-turbopack" package.json; then
        echo "❌ ERROR: Dev script missing --turbopack flag!"
        echo "   Expected: \"dev\": \"next dev -p 3000 --turbopack\""
        echo "   Fix: Edit package.json or rebuild container"
        echo ""
        echo "   IMPORTANTE: Se mudou package.json, use:"
        echo "   docker-compose up -d --build frontend"
        echo "   NAO use: docker restart invest_frontend"
        exit 1
    fi

    # Verificar se turbopack config existe em next.config.js
    if ! grep -q "turbopack:" next.config.js 2>/dev/null; then
        echo "⚠️  WARNING: next.config.js missing turbopack config (optional)"
    fi

    echo "✅ Bundler configuration valid (Turbopack)"
}

# FASE 131: Detectar mudancas em scripts (nao apenas dependencias)
# Resolve problema de restart vs rebuild - scripts mudados requerem rebuild
check_script_changes() {
    SCRIPT_HASH_FILE=".script-hash"

    # Calcular hash dos scripts relevantes (sha256 para integridade)
    CURRENT_HASH=$(grep -E '"(dev|build|start)"' package.json | sha256sum | cut -d' ' -f1 2>/dev/null || echo "no-hash")

    if [ -f "$SCRIPT_HASH_FILE" ]; then
        STORED_HASH=$(cat "$SCRIPT_HASH_FILE")
        if [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
            echo "📦 Scripts changed in package.json, clearing cache..."
            rm -rf .next node_modules/.cache 2>/dev/null || true
            echo "$CURRENT_HASH" > "$SCRIPT_HASH_FILE"
            echo "✅ Cache cleared due to script changes"
        fi
    else
        echo "$CURRENT_HASH" > "$SCRIPT_HASH_FILE"
    fi
}

# Executar validacoes ANTES de qualquer outra coisa
validate_bundler_config
check_script_changes

# Check if next binary exists (more reliable than checking node_modules directory)
if [ ! -f "node_modules/.bin/next" ]; then
    echo "📦 Installing dependencies (next binary missing)..."
    # Use npm install as fallback if npm ci fails (missing lock file)
    npm ci || npm install
    echo "✅ Dependencies installed successfully!"
else
    # Check if package.json is newer than node_modules
    if [ "package.json" -nt "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
        echo "📦 Updating dependencies (package files changed)..."
        npm ci || npm install
        echo "✅ Dependencies updated successfully!"
    else
        echo "✅ Dependencies already installed and up to date"
    fi
fi

echo "🎯 Starting application..."
exec "$@"
