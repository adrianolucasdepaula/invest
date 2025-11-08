#!/bin/bash
# Quick start script for B3 Scraper Test API

set -e

echo "🚀 Starting B3 Scraper Test API..."
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Documentation will be available at:"
echo "   - Swagger UI: http://localhost:8000/docs"
echo "   - ReDoc: http://localhost:8000/redoc"
echo ""
echo "🌐 Starting server on http://localhost:8000..."
echo ""

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
