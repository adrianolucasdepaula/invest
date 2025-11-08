# 🚀 B3 AI Analysis Platform - Scraper Test API

Comprehensive REST API for testing and monitoring 27 scrapers in the B3 AI Analysis Platform.

## 📋 Overview

This FastAPI service provides a complete REST API for:
- **Listing** all 27 registered scrapers with metadata
- **Testing** individual scrapers with custom queries
- **Testing** all scrapers in parallel with configurable concurrency
- **Monitoring** scraper health status
- **Checking** Google OAuth cookies status

## 🏗️ Architecture

```
api-service/
├── main.py                      # FastAPI application entry point
├── requirements.txt             # Python dependencies
├── routes/
│   └── scraper_test_routes.py  # API endpoints (FastAPI routes)
└── controllers/
    └── scraper_test_controller.py  # Business logic
```

## 📦 Installation

### 1. Install Dependencies

```bash
cd /home/user/invest/backend/api-service
pip install -r requirements.txt
```

### 2. Set Environment Variables

The API automatically imports scrapers from the `python-scrapers` service.

Ensure your environment has:
```env
CHROME_HEADLESS=true
COOKIES_FILE=/app/browser-profiles/google_cookies.pkl
COOKIES_MAX_AGE_DAYS=7
```

## 🚀 Usage

### Start the API Server

```bash
# Development mode (with auto-reload)
cd /home/user/invest/backend/api-service
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Access Documentation

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 📡 API Endpoints

### 1. GET /api/scrapers/list

List all 27 registered scrapers with metadata.

**Query Parameters:**
- `category` (optional): Filter by category

**Example Request:**
```bash
# List all scrapers
curl http://localhost:8000/api/scrapers/list

# Filter by category
curl http://localhost:8000/api/scrapers/list?category=fundamental_analysis
```

**Example Response:**
```json
{
  "total": 27,
  "public": 10,
  "private": 17,
  "categories": {
    "fundamental_analysis": 5,
    "market_analysis": 4,
    "official_data": 2,
    "insider_trading": 1,
    "crypto": 1,
    "options": 1,
    "ai_analysis": 5,
    "news": 6,
    "institutional_reports": 2
  },
  "scrapers": [
    {
      "id": "FUNDAMENTUS",
      "name": "Fundamentus",
      "source": "FUNDAMENTUS",
      "requires_login": false,
      "category": "fundamental_analysis",
      "description": "Dados fundamentalistas públicos",
      "url": "https://www.fundamentus.com.br/"
    }
  ]
}
```

### 2. POST /api/scrapers/test

Test a specific scraper with a query.

**Request Body:**
```json
{
  "scraper": "FUNDAMENTUS",
  "query": "PETR4"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/scrapers/test \
  -H "Content-Type: application/json" \
  -d '{"scraper": "FUNDAMENTUS", "query": "PETR4"}'
```

**Example Response:**
```json
{
  "success": true,
  "scraper": "FUNDAMENTUS",
  "query": "PETR4",
  "data": {
    "ticker": "PETR4",
    "price": 38.50,
    "pl_ratio": 5.2,
    "dividend_yield": 12.5
  },
  "execution_time": 2.34,
  "timestamp": "2025-11-07T12:00:00",
  "metadata": {
    "name": "Fundamentus",
    "category": "fundamental_analysis",
    "requires_login": false
  }
}
```

### 3. POST /api/scrapers/test-all

Test all scrapers in parallel.

**Request Body:**
```json
{
  "category": "fundamental_analysis",
  "max_concurrent": 5,
  "query": "PETR4"
}
```

**Example Request:**
```bash
# Test all scrapers
curl -X POST http://localhost:8000/api/scrapers/test-all \
  -H "Content-Type: application/json" \
  -d '{"query": "PETR4"}'

# Test only fundamental analysis scrapers
curl -X POST http://localhost:8000/api/scrapers/test-all \
  -H "Content-Type: application/json" \
  -d '{
    "category": "fundamental_analysis",
    "max_concurrent": 3,
    "query": "VALE3"
  }'
```

**Example Response:**
```json
{
  "total_tested": 27,
  "success": 20,
  "failures": 7,
  "execution_time": 15.5,
  "query": "PETR4",
  "results": [
    {
      "scraper": "FUNDAMENTUS",
      "success": true,
      "execution_time": 2.3,
      "data": {...}
    },
    {
      "scraper": "STATUSINVEST",
      "success": false,
      "error": "Connection timeout",
      "execution_time": 5.0
    }
  ]
}
```

### 4. GET /api/scrapers/health

Get comprehensive health status of all scrapers.

**Example Request:**
```bash
curl http://localhost:8000/api/scrapers/health
```

**Example Response:**
```json
{
  "overall_health": "healthy",
  "total_scrapers": 27,
  "healthy": 24,
  "unhealthy": 3,
  "unknown": 0,
  "healthy_percentage": 88.9,
  "execution_time": 0.5,
  "scrapers": [
    {
      "id": "FUNDAMENTUS",
      "name": "Fundamentus",
      "category": "fundamental_analysis",
      "requires_login": false,
      "status": "healthy",
      "message": "Public scraper, no authentication required"
    },
    {
      "id": "FUNDAMENTEI",
      "name": "Fundamentei",
      "category": "fundamental_analysis",
      "requires_login": true,
      "status": "healthy",
      "message": "Cookies valid (4 days left)"
    }
  ]
}
```

### 5. GET /api/scrapers/cookies/status

Check Google OAuth cookies status.

**Example Request:**
```bash
curl http://localhost:8000/api/scrapers/cookies/status
```

**Example Response:**
```json
{
  "exists": true,
  "valid": true,
  "age_days": 3,
  "expires_in_days": 4,
  "needs_renewal": false,
  "sites_covered": [
    "fundamentei.com",
    "investidor10.com.br",
    "statusinvest.com.br"
  ],
  "last_modified": "2025-11-04T10:30:00",
  "severity": "ok",
  "action_required": "None - cookies are valid",
  "renewal_command": "docker exec -it invest_scrapers python scripts/save_google_cookies.py"
}
```

### 6. GET /api/scrapers/ping

Simple API health check.

**Example Request:**
```bash
curl http://localhost:8000/api/scrapers/ping
```

**Example Response:**
```json
{
  "status": "ok",
  "message": "Scraper Test API is running",
  "version": "1.0.0",
  "total_scrapers": 27
}
```

## 🎯 Scraper Categories

| Category | Count | Description |
|----------|-------|-------------|
| **fundamental_analysis** | 5 | StatusInvest, Fundamentus, Investsite, Fundamentei, Investidor10 |
| **market_analysis** | 4 | Investing.com, ADVFN, Google Finance, TradingView |
| **technical_analysis** | 1 | TradingView (analysis graphs) |
| **official_data** | 2 | B3, Banco Central do Brasil (BCB) |
| **insider_trading** | 1 | Griffin (insider movements) |
| **crypto** | 1 | CoinMarketCap |
| **options** | 1 | Opcoes.net.br |
| **ai_analysis** | 5 | ChatGPT, Gemini, DeepSeek, Claude, Grok |
| **news** | 6 | Bloomberg, Google News, Investing News, Valor, Exame, InfoMoney |
| **institutional_reports** | 2 | Estadão Investidor, Mais Retorno |

## 🔐 Authentication

### Public Scrapers (10)
No authentication required:
- Fundamentus, Investsite, StatusInvest
- B3, BCB
- Griffin
- CoinMarketCap
- Bloomberg

### OAuth Scrapers (17)
Require Google OAuth cookies:
- Fundamentei, Investidor10
- Investing.com, ADVFN, Google Finance, TradingView
- ChatGPT, Gemini, DeepSeek, Claude, Grok
- Google News, Investing News, Valor, Exame, InfoMoney
- Estadão, Mais Retorno

### Credential-based Scrapers (1)
- Opcoes.net.br (requires username/password)

## 📊 Usage Examples

### Test Public Scrapers

```bash
# Fundamentus
curl -X POST http://localhost:8000/api/scrapers/test \
  -H "Content-Type: application/json" \
  -d '{"scraper": "FUNDAMENTUS", "query": "PETR4"}'

# B3
curl -X POST http://localhost:8000/api/scrapers/test \
  -H "Content-Type: application/json" \
  -d '{"scraper": "B3", "query": "VALE3"}'

# BCB (Banco Central)
curl -X POST http://localhost:8000/api/scrapers/test \
  -H "Content-Type: application/json" \
  -d '{"scraper": "BCB", "query": "all"}'
```

### Test by Category

```bash
# Test all fundamental analysis scrapers
curl -X POST http://localhost:8000/api/scrapers/test-all \
  -H "Content-Type: application/json" \
  -d '{
    "category": "fundamental_analysis",
    "query": "PETR4"
  }'

# Test all news scrapers
curl -X POST http://localhost:8000/api/scrapers/test-all \
  -H "Content-Type: application/json" \
  -d '{
    "category": "news",
    "query": "bolsa de valores"
  }'
```

### Monitor Health

```bash
# Get overall health
curl http://localhost:8000/api/scrapers/health | jq

# Check cookies status
curl http://localhost:8000/api/scrapers/cookies/status | jq

# List all scrapers
curl http://localhost:8000/api/scrapers/list | jq
```

## 🐳 Docker Deployment

### Dockerfile

Create a `Dockerfile` in the api-service directory:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Build and Run

```bash
# Build image
docker build -t b3-scraper-api /home/user/invest/backend/api-service

# Run container
docker run -d \
  --name scraper-api \
  -p 8000:8000 \
  -v /home/user/invest/backend/python-scrapers:/app/scrapers \
  -v /app/browser-profiles:/app/browser-profiles \
  --env-file /home/user/invest/backend/.env \
  b3-scraper-api
```

## 🧪 Testing

### Manual Testing

```bash
# Test API health
curl http://localhost:8000/health

# Test scraper ping
curl http://localhost:8000/api/scrapers/ping

# Test a scraper
curl -X POST http://localhost:8000/api/scrapers/test \
  -H "Content-Type: application/json" \
  -d '{"scraper": "FUNDAMENTUS", "query": "PETR4"}'
```

### Automated Testing

Create `tests/test_api.py`:

```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_list_scrapers():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/scrapers/list")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 27

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/scrapers/health")
        assert response.status_code == 200
```

Run tests:
```bash
pytest tests/ -v
```

## 📝 Logging

The API uses `loguru` for comprehensive logging:

```python
# Logs include:
# - Request method and path
# - Response status and duration
# - Errors with stack traces
# - Scraper execution details

# Example output:
# → POST /api/scrapers/test
# Testing scraper: FUNDAMENTUS with query: PETR4
# ← POST /api/scrapers/test [200] 2.34s
```

## 🔧 Configuration

### Environment Variables

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4

# Scraper Configuration
CHROME_HEADLESS=true
COOKIES_FILE=/app/browser-profiles/google_cookies.pkl
COOKIES_MAX_AGE_DAYS=7

# Opcoes.net.br
OPCOES_USERNAME=312.862.178-06
OPCOES_PASSWORD=Safra998266@#
```

## 📚 API Documentation

Full interactive documentation available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 Integration

### JavaScript/TypeScript

```typescript
// List scrapers
const response = await fetch('http://localhost:8000/api/scrapers/list');
const data = await response.json();

// Test scraper
const result = await fetch('http://localhost:8000/api/scrapers/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    scraper: 'FUNDAMENTUS',
    query: 'PETR4'
  })
});
```

### Python

```python
import httpx

# Test scraper
async with httpx.AsyncClient() as client:
    response = await client.post(
        'http://localhost:8000/api/scrapers/test',
        json={'scraper': 'FUNDAMENTUS', 'query': 'PETR4'}
    )
    data = response.json()
```

## 🎯 Next Steps

1. **Deploy to production**
   - Set up reverse proxy (nginx)
   - Configure SSL/TLS
   - Set up monitoring

2. **Add authentication**
   - API key authentication
   - Rate limiting
   - User management

3. **Enhance features**
   - WebSocket support for real-time updates
   - Scraper scheduling
   - Result caching
   - Historical data storage

## 📄 License

Part of the B3 AI Analysis Platform

---

**Version:** 1.0.0  
**Author:** B3 AI Analysis Platform Team  
**Last Updated:** 2025-11-07
