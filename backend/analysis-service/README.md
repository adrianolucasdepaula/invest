# B3 AI Analysis Platform - Analysis Service

## Overview

The Analysis Service provides comprehensive data aggregation and consolidation for the B3 AI Analysis Platform. It aggregates data from 27+ scrapers, normalizes values, cross-validates information, and calculates confidence scores.

## Features

### 1. Data Aggregation
- Fetches data from multiple scrapers simultaneously
- Normalizes data from different formats and sources
- Handles missing data gracefully
- Caches results for optimal performance

### 2. Cross-Validation
- Compares values from 3+ sources
- Calculates statistical measures (mean, median, stdev)
- Identifies outliers and anomalies
- Provides agreement scores

### 3. Confidence Scoring
- Evaluates data quality (0-1 scale)
- Based on source count and agreement
- Weighted by source reliability
- Per-metric and overall confidence

### 4. Caching Strategy
- **Real-time data**: 5-minute TTL (price, volume, technical indicators)
- **Fundamental data**: 1-day TTL (P/L, ROE, market cap)
- **News**: 10-minute TTL
- **Insider trading**: 1-hour TTL

## Architecture

```
analysis-service/
├── aggregator.py          # Main DataAggregator class
├── __init__.py           # Module initialization
└── README.md             # This file

api-service/routes/
└── analysis_routes.py    # REST API endpoints
```

## DataAggregator Class

### Core Methods

#### `aggregate_stock_data(ticker: str) -> Dict`
Get complete aggregated analysis for a stock.

```python
from aggregator import aggregator

data = aggregator.aggregate_stock_data('PETR4')
# Returns: {
#   'ticker': 'PETR4',
#   'success': True,
#   'fundamental': {...},
#   'technical': {...},
#   'confidence': 0.85,
#   'sources': {'count': 15, 'names': [...]},
#   'timestamp': '2025-11-07T...'
# }
```

#### `get_fundamental_data(ticker: str) -> Dict`
Aggregate fundamental indicators (P/L, P/VP, ROE, etc.).

```python
fundamental = aggregator.get_fundamental_data('VALE3')
# Returns: {
#   'p_l': {'value': 8.5, 'confidence': 0.9, 'source_count': 5, ...},
#   'p_vp': {'value': 1.2, 'confidence': 0.85, 'source_count': 4, ...},
#   'dividend_yield': {'value': 0.065, 'confidence': 0.95, ...},
#   ...
# }
```

#### `get_technical_data(ticker: str) -> Dict`
Aggregate technical indicators (price, volume, RSI, etc.).

```python
technical = aggregator.get_technical_data('ITUB4')
# Returns: {
#   'price': {'value': 32.50, 'confidence': 0.95, ...},
#   'volume': {'value': 15000000, 'confidence': 0.90, ...},
#   'rsi': {'value': 65.2, 'confidence': 0.80, ...},
#   ...
# }
```

#### `get_news_data(ticker: str, limit: int = 20) -> List`
Get recent news articles from multiple sources.

```python
news = aggregator.get_news_data('PETR4', limit=10)
# Returns: [
#   {
#     'title': 'Petrobras anuncia...',
#     'description': '...',
#     'url': 'https://...',
#     'published_at': '2025-11-07T...',
#     'source': 'Bloomberg'
#   },
#   ...
# ]
```

#### `get_insider_data(ticker: str) -> Dict`
Get insider trading transactions.

```python
insider = aggregator.get_insider_data('VALE3')
# Returns: {
#   'transactions': [...],
#   'summary': {
#     'total_transactions': 15,
#     'buy_count': 10,
#     'sell_count': 5,
#     'total_value': 5000000
#   }
# }
```

#### `cross_validate(values: List[float], metric: str) -> Dict`
Cross-validate values from multiple sources.

```python
values = [8.5, 8.7, 8.4, 8.6]  # P/L from 4 sources
result = aggregator.cross_validate(values, 'p_l')
# Returns: {
#   'value': 8.55,              # Median (robust to outliers)
#   'confidence': 0.92,         # High confidence
#   'source_count': 4,
#   'agreement': 0.95,          # 95% agreement
#   'stats': {
#     'mean': 8.55,
#     'median': 8.55,
#     'stdev': 0.13,
#     'cv': 0.015,              # Coefficient of variation
#     'min': 8.4,
#     'max': 8.7
#   }
# }
```

#### `calculate_confidence(data: Dict) -> float`
Calculate overall confidence score for aggregated data.

```python
confidence = aggregator.calculate_confidence(data)
# Returns: 0.87  # 0-1 scale
```

### Normalization

The aggregator automatically normalizes:

- **Percentages**: 5% or 0.05 → 0.05 (decimal format)
- **Currency**: R$ 1.234,56 or $1,234.56 → 1234.56 (float)
- **Dates**: Multiple formats → datetime object

```python
# Percentage normalization
aggregator._normalize_percentage("5%")      # → 0.05
aggregator._normalize_percentage(5)         # → 0.05
aggregator._normalize_percentage(0.05)      # → 0.05

# Currency normalization
aggregator._normalize_currency("R$ 1.234,56")  # → 1234.56
aggregator._normalize_currency("$1,234.56")    # → 1234.56

# Date normalization
aggregator._normalize_date("2025-11-07")    # → datetime(2025, 11, 7)
aggregator._normalize_date("07/11/2025")    # → datetime(2025, 11, 7)
```

## API Endpoints

All endpoints are prefixed with `/api/analysis`.

### 1. Complete Stock Analysis
```http
GET /api/analysis/stock/{ticker}
```

**Example:**
```bash
curl http://localhost:8000/api/analysis/stock/PETR4
```

**Response:**
```json
{
  "ticker": "PETR4",
  "success": true,
  "fundamental": {
    "p_l": {"value": 8.5, "confidence": 0.9, "source_count": 5},
    "p_vp": {"value": 1.2, "confidence": 0.85, "source_count": 4},
    ...
  },
  "technical": {
    "price": {"value": 32.50, "confidence": 0.95, "source_count": 8},
    "volume": {"value": 15000000, "confidence": 0.90, "source_count": 6},
    ...
  },
  "sources": {
    "count": 15,
    "names": ["B3", "StatusInvest", "Fundamentus", ...]
  },
  "confidence": 0.87,
  "timestamp": "2025-11-07T12:30:00"
}
```

### 2. Fundamental Analysis
```http
GET /api/analysis/stock/{ticker}/fundamental
```

**Example:**
```bash
curl http://localhost:8000/api/analysis/stock/VALE3/fundamental
```

### 3. Technical Analysis
```http
GET /api/analysis/stock/{ticker}/technical
```

**Example:**
```bash
curl http://localhost:8000/api/analysis/stock/ITUB4/technical
```

### 4. News
```http
GET /api/analysis/stock/{ticker}/news?limit=20
```

**Example:**
```bash
curl http://localhost:8000/api/analysis/stock/PETR4/news?limit=10
```

### 5. Insider Trading
```http
GET /api/analysis/stock/{ticker}/insider
```

**Example:**
```bash
curl http://localhost:8000/api/analysis/stock/VALE3/insider
```

### 6. Compare Stocks
```http
GET /api/analysis/compare?tickers=PETR4&tickers=VALE3&tickers=ITUB4
```

**Example:**
```bash
curl "http://localhost:8000/api/analysis/compare?tickers=PETR4&tickers=VALE3&tickers=ITUB4"
```

**Response:**
```json
{
  "tickers": ["PETR4", "VALE3", "ITUB4"],
  "data": {
    "PETR4": {...},
    "VALE3": {...},
    "ITUB4": {...}
  },
  "timestamp": "2025-11-07T12:30:00"
}
```

### 7. Sector Overview
```http
GET /api/analysis/sector/{sector}
```

**Example:**
```bash
curl http://localhost:8000/api/analysis/sector/banking
```

### 8. Statistics
```http
GET /api/analysis/stats
```

**Example:**
```bash
curl http://localhost:8000/api/analysis/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "unique_tickers_24h": 150,
    "successful_scrapes_24h": 1200,
    "by_scraper": {
      "B3": 150,
      "StatusInvest": 145,
      "Fundamentus": 140,
      ...
    },
    "cache": {
      "enabled": true,
      "keyspace_hits": 5000,
      "keyspace_misses": 500
    }
  },
  "timestamp": "2025-11-07T12:30:00"
}
```

### 9. Health Check
```http
GET /api/analysis/health
```

**Example:**
```bash
curl http://localhost:8000/api/analysis/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "analysis-service",
  "database": true,
  "redis": true
}
```

## Database Schema

The aggregator fetches data from the `scraper_results` table:

```sql
CREATE TABLE scraper_results (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL UNIQUE,
    scraper_name VARCHAR(255) NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    data JSONB,
    error TEXT,
    response_time FLOAT,
    executed_at TIMESTAMP NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_ticker ON scraper_results(ticker);
CREATE INDEX idx_scraper_name ON scraper_results(scraper_name);
CREATE INDEX idx_executed_at ON scraper_results(executed_at);
CREATE INDEX idx_success ON scraper_results(success);
CREATE INDEX idx_scraper_results_data ON scraper_results USING GIN (data);
```

## Redis Configuration

Cache configuration in `/home/user/invest/backend/python-scrapers/config.py`:

```python
REDIS_HOST: str = "localhost"
REDIS_PORT: int = 6379
REDIS_DB: int = 0
```

Cache keys follow the pattern:
- `stock_data:{TICKER}` - Complete analysis (5 min TTL)
- `fundamental:{TICKER}` - Fundamental data (1 day TTL)
- `technical:{TICKER}` - Technical data (5 min TTL)
- `news:{TICKER}:limit:{N}` - News (10 min TTL)
- `insider:{TICKER}` - Insider trading (1 hour TTL)

## Performance Considerations

### Query Optimization
- Uses indexed columns for filtering
- Limits lookback period (default 24 hours)
- Fetches only successful results
- JSONB indexes for fast data extraction

### Caching Strategy
- TTL based on data volatility
- Cache warming on first request
- Automatic cache invalidation
- Redis pub/sub for cache updates (future)

### Scalability
- Stateless design (horizontal scaling)
- Connection pooling (PostgreSQL, Redis)
- Async-ready architecture
- Batch processing support (future)

## Error Handling

The aggregator handles errors gracefully:

1. **No data available**: Returns error with message
2. **Partial data**: Returns available data with lower confidence
3. **Database errors**: Logs error, returns cached data if available
4. **Redis errors**: Continues without caching
5. **Normalization errors**: Skips invalid values, logs warning

## Confidence Score Calculation

Confidence is calculated using two factors:

1. **Source Count Score** (40% weight):
   - 1 source: 0.2
   - 2 sources: 0.4
   - 3 sources: 0.6
   - 4 sources: 0.8
   - 5+ sources: 1.0

2. **Agreement Score** (60% weight):
   - CV < 5%: 1.0 (perfect agreement)
   - CV < 10%: 0.9 (high agreement)
   - CV < 20%: 0.7 (good agreement)
   - CV < 50%: 0.5 (moderate agreement)
   - CV ≥ 50%: 0.3 (low agreement)

**Formula:**
```
confidence = (source_score * 0.4) + (agreement_score * 0.6)
```

**Example:**
- 5 sources with CV = 8% → (1.0 * 0.4) + (0.9 * 0.6) = 0.94

## Testing

### Unit Tests
```bash
cd /home/user/invest/backend/analysis-service
pytest tests/
```

### Integration Tests
```bash
# Test complete flow
curl http://localhost:8000/api/analysis/stock/PETR4

# Test caching
curl http://localhost:8000/api/analysis/stock/PETR4  # Cache miss
curl http://localhost:8000/api/analysis/stock/PETR4  # Cache hit (faster)

# Test cross-validation
curl http://localhost:8000/api/analysis/stock/PETR4 | jq '.fundamental.p_l'
```

## Dependencies

- **Python**: 3.10+
- **PostgreSQL**: 13+ (with TimescaleDB)
- **Redis**: 6+
- **Libraries**:
  - `sqlalchemy`: Database ORM
  - `redis`: Redis client
  - `pydantic`: Data validation
  - `loguru`: Logging
  - `statistics`: Statistical calculations

## Future Enhancements

1. **Machine Learning**:
   - Anomaly detection
   - Predictive confidence scoring
   - Source reliability learning

2. **Advanced Features**:
   - Sector mapping and aggregation
   - Historical trend analysis
   - Real-time WebSocket updates
   - GraphQL API

3. **Performance**:
   - Query result caching
   - Materialized views
   - Connection pool tuning
   - Distributed caching

4. **Quality**:
   - Source quality scoring
   - Automated testing
   - Performance monitoring
   - Data validation rules

## Support

For issues or questions:
- Documentation: `/docs` endpoint
- Logs: Check `loguru` output
- Health: `/api/analysis/health`

## License

Part of the B3 AI Analysis Platform
