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

echo "🎯 Starting application..."
exec "$@"
