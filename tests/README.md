# B3 AI Analysis Platform - Test Suite

## Overview

This directory contains comprehensive tests for the B3 AI Analysis Platform.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
├── integration/             # Integration tests for complete workflows
│   └── test_complete_flow.py
└── README.md               # This file
```

## Integration Tests

### Prerequisites

1. **Start all services:**
   ```bash
   ./start-all.sh
   ```

2. **Install test dependencies:**
   ```bash
   pip install pytest requests
   ```

### Running Integration Tests

Run all integration tests:
```bash
cd tests/integration
pytest test_complete_flow.py -v
```

Run with detailed output:
```bash
pytest test_complete_flow.py -v -s
```

Run specific test:
```bash
pytest test_complete_flow.py::TestCompleteFlow::test_1_health_checks -v
```

## Test Coverage

### Complete Flow Integration Test

The `test_complete_flow.py` includes:

1. **Health Checks** - Verify all services are running
2. **List Scrapers** - Test scraper registry
3. **Scrape Fundamentus** - Test public scraper
4. **Create Job** - Test job queue system
5. **Queue Status** - Monitor job queue
6. **Job Statistics** - Analyze job execution
7. **Scraper Health** - Check scraper availability
8. **Config Validation** - Validate configuration
9. **Parallel Scraping** - Test concurrent operations
10. **End-to-End Flow** - Complete data flow test

### What Gets Tested

- ✅ API Service (FastAPI) endpoints
- ✅ Database connectivity (PostgreSQL + TimescaleDB)
- ✅ Redis cache and queue operations
- ✅ 27 data scrapers (sample tests)
- ✅ Job queue system
- ✅ Job scheduler
- ✅ Configuration management
- ✅ Health monitoring
- ✅ Parallel processing
- ✅ Complete data flow: Scrape → Store → Retrieve

## Test Data

The tests use the following sample stocks:
- **PETR4** (Petrobras)
- **VALE3** (Vale)

These are liquid Brazilian stocks that should have data available in most sources.

## Expected Results

All tests should pass when:
1. All services are running (via `./start-all.sh`)
2. Database is accessible
3. Redis is accessible
4. At least basic scrapers are functional

## Troubleshooting

### Services not ready
If tests fail with connection errors:
```bash
# Check service status
docker compose ps

# Check service logs
docker compose logs api-service
docker compose logs postgres
docker compose logs redis
```

### Tests timing out
Increase timeout in test configuration or wait longer for services to start:
```bash
# Restart services
docker compose restart

# Wait for health checks
docker compose ps
```

### Scraper failures
Some scrapers may fail due to:
- Website changes
- Rate limiting
- Authentication requirements

Check the health endpoint:
```bash
curl http://localhost:8000/api/scrapers/health
```

## Adding New Tests

1. Create test file in appropriate directory
2. Follow pytest conventions
3. Use fixtures for setup/teardown
4. Document test purpose and coverage

Example:
```python
import pytest

class TestNewFeature:
    def test_feature_works(self):
        # Arrange
        expected = "result"

        # Act
        result = my_function()

        # Assert
        assert result == expected
```

## Continuous Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Start services
      run: ./start-all.sh --dev
    - name: Run tests
      run: pytest tests/integration -v
```

## Additional Resources

- [pytest Documentation](https://docs.pytest.org/)
- [requests Documentation](https://requests.readthedocs.io/)
- [B3 API Documentation](http://localhost:8000/docs)
