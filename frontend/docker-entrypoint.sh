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

    echo "✅ Bundler configuration valid (Turbopack)"
}

# FASE 131: Detectar mudancas em scripts (nao apenas dependencias)
# FASE 143.0: Enhanced detection - package.json completo + force rebuild se necessário
# Resolve problema de restart vs rebuild - scripts mudados requerem rebuild
check_script_changes() {
    SCRIPT_HASH_FILE=".script-hash"

    # FASE 143.0: Calcular hash de package.json COMPLETO (não apenas scripts)
    # Detecta mudanças em dependencies, devDependencies, scripts, etc
    CURRENT_HASH=$(md5sum package.json 2>/dev/null | cut -d' ' -f1 || sha256sum package.json | cut -d' ' -f1 || echo "no-hash")

    if [ -f "$SCRIPT_HASH_FILE" ]; then
        STORED_HASH=$(cat "$SCRIPT_HASH_FILE")
        if [ "$CURRENT_HASH" != "$STORED_HASH" ]; then
            echo "⚠️  package.json changed! Clearing cache and forcing rebuild..."
            echo "   Previous hash: $STORED_HASH"
            echo "   Current hash:  $CURRENT_HASH"

            # Limpar TODOS os caches
            rm -rf .next node_modules/.cache 2>/dev/null || true

            # FASE 143.0: CRITICAL - Exit with code 0 to trigger container restart
            # Docker restart policy will restart container, killing Node.js process
            # This clears Turbopack IN-MEMORY cache (not just disk cache)
            echo "🔄 Forcing container restart to clear Turbopack in-memory cache..."
            echo "$CURRENT_HASH" > "$SCRIPT_HASH_FILE"
            echo "✅ Cache cleared. Container will restart to apply changes."
            exit 0  # Trigger container restart (clears memory cache)
        fi
    else
        echo "📝 First run, storing package.json hash"
        echo "$CURRENT_HASH" > "$SCRIPT_HASH_FILE"
    fi
}

# Executar validacoes ANTES de qualquer outra coisa
# validate_bundler_config  # TEMPORARIAMENTE DESABILITADO: Turbopack cache infinito
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
