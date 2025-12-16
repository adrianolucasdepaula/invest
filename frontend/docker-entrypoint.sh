#!/bin/sh
set -e

echo "🚀 Starting B3 Investment Frontend..."

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
