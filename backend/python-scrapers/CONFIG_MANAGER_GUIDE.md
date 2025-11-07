# ConfigManager - Automated Configuration System

Comprehensive configuration management system for the B3 AI Analysis Platform with auto-loading, validation, hot-reload, and API support.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration Sources](#configuration-sources)
- [Python API](#python-api)
- [REST API](#rest-api)
- [Configuration Variables](#configuration-variables)
- [Hot-Reload](#hot-reload)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Features

### 1. Multi-Source Configuration Loading

Automatically loads from multiple sources with priority:

1. **Environment variables** (highest priority)
2. **Docker secrets** (`/run/secrets/`)
3. **.env file**
4. **config.yaml**
5. **Default values** (lowest priority)

### 2. Comprehensive Validation

- Validates required variables
- Warns about missing optional variables
- Custom validators for specific types
- Category-based validation
- Detailed error reporting

### 3. Hot-Reload Support

- File watching for `.env` and `config.yaml`
- Auto-reload on file changes
- Event listeners for change notifications
- No application restart required

### 4. Security

- Automatic secret detection and hiding
- Passwords and tokens masked in responses
- Docker secrets support
- Separation of sensitive data

### 5. REST API

Complete REST API for configuration management:
- Status checking
- Validation
- Forced reload
- Category filtering
- Health checks

## Installation

### Python Package

```bash
cd /home/user/invest/backend/python-scrapers
pip install -r requirements.txt
```

Required dependencies:
```
python-dotenv==1.0.0
PyYAML==6.0.1
pydantic==2.5.3
pydantic-settings==2.1.0
```

### REST API Service

```bash
cd /home/user/invest/backend/api-service
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Quick Start

### Python Usage

```python
from config_manager import config_manager

# Get configuration value
db_host = config_manager.get("DB_HOST")
redis_port = config_manager.get("REDIS_PORT", default="6379")

# Get connection URLs
db_url = config_manager.database_url
redis_url = config_manager.redis_url

# Get all config (secrets hidden)
all_config = config_manager.get_all(hide_secrets=True)

# Reload configuration
config_manager.reload()

# Check status
status = config_manager.get_status()
print(f"Loaded: {status['loaded']}")
print(f"Sources: {status['sources']}")
```

### REST API Usage

```bash
# Get configuration status
curl http://localhost:8000/api/config/status

# Validate configuration
curl http://localhost:8000/api/config/validate

# Reload configuration
curl -X POST http://localhost:8000/api/config/reload

# Health check
curl http://localhost:8000/api/config/health

# Get all config values
curl http://localhost:8000/api/config/all

# Get config by category
curl http://localhost:8000/api/config/category/database
```

## Configuration Sources

### 1. Environment Variables (Highest Priority)

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_PASSWORD=secret123
```

### 2. Docker Secrets

```bash
# Create secrets
echo "my_password" | docker secret create db_password -

# Use in docker-compose.yml
services:
  app:
    secrets:
      - db_password

secrets:
  db_password:
    external: true
```

Secrets are automatically loaded from `/run/secrets/`

### 3. .env File

```env
# .env file
DB_HOST=localhost
DB_PORT=5432
DB_NAME=invest_db
DB_USER=invest_user
DB_PASSWORD=invest_password

REDIS_HOST=localhost
REDIS_PORT=6379

LOG_LEVEL=INFO
```

### 4. config.yaml File

```yaml
# config.yaml
database:
  host: localhost
  port: 5432
  name: invest_db

redis:
  host: localhost
  port: 6379

application:
  log_level: INFO
```

### 5. Default Values (Lowest Priority)

Defined in `ConfigManager.CONFIG_DEFINITIONS`

## Python API

### Basic Operations

```python
from config_manager import ConfigManager, config_manager

# Get single value
value = config_manager.get("DB_HOST")
value_with_default = config_manager.get("OPTIONAL_VAR", default="default_value")

# Get all configuration
all_config = config_manager.get_all(hide_secrets=True)

# Get by category
db_config = config_manager.get_by_category("database")
redis_config = config_manager.get_by_category("redis")
scraper_config = config_manager.get_by_category("scrapers")
```

### Status and Validation

```python
# Get status
status = config_manager.get_status()
print(f"Loaded: {status['loaded']}")
print(f"Last reload: {status['last_reload']}")
print(f"Sources: {status['sources']}")
print(f"Missing required: {status['missing_required']}")
print(f"Missing optional: {status['missing_optional']}")

# Validate configuration
validation = config_manager.validate_config()
print(f"Valid: {validation['valid']}")
print(f"Summary: {validation['summary']}")

# Category validation
for category, results in validation['categories'].items():
    print(f"{category}: {results['valid']}")
```

### Reload Configuration

```python
# Manual reload
success = config_manager.reload()
if success:
    print("Configuration reloaded successfully")
else:
    print("Configuration reload failed")
    print(f"Errors: {config_manager.status.errors}")
```

### Connection URLs

```python
# Database connection URL
db_url = config_manager.database_url
# Example: postgresql://user:password@localhost:5432/invest_db

# Redis connection URL
redis_url = config_manager.redis_url
# Example: redis://localhost:6379/0
# Or with password: redis://:password@localhost:6379/0
```

### Hot-Reload with Event Listeners

```python
# Create manager with hot-reload
manager = ConfigManager(auto_load=True, watch=True)

# Add event listener
def on_config_change(config):
    print("Configuration changed!")
    print(f"Total variables: {len(config)}")
    # Restart services, reconnect databases, etc.

manager.add_listener(on_config_change)

# Start watching
manager.start_watching()

# Stop watching
manager.stop_watching()
```

### Custom Configuration Manager

```python
from pathlib import Path
from config_manager import ConfigManager, ConfigVariable

# Create custom manager
manager = ConfigManager(
    base_path=Path("/custom/path"),
    auto_load=True,
    watch=True
)

# Add custom configuration variable
manager.CONFIG_DEFINITIONS["MY_CUSTOM_VAR"] = ConfigVariable(
    name="MY_CUSTOM_VAR",
    required=True,
    default="default_value",
    description="My custom variable",
    category="custom",
    secret=False
)

# Load and use
manager.load()
value = manager.get("MY_CUSTOM_VAR")
```

## REST API

### Endpoints

#### GET /api/config/status

Get current configuration status.

```bash
curl http://localhost:8000/api/config/status
```

Response:
```json
{
  "loaded": true,
  "last_reload": "2025-11-07T12:00:00",
  "sources": ["environment", ".env", "config.yaml"],
  "total_variables": 45,
  "missing_required": [],
  "missing_optional": ["OPCOES_USERNAME"],
  "warnings": [],
  "errors": [],
  "watch_enabled": false
}
```

#### GET /api/config/validate

Validate current configuration.

```bash
curl http://localhost:8000/api/config/validate
```

Response:
```json
{
  "valid": true,
  "categories": {
    "database": {
      "total": 7,
      "configured": 7,
      "required": 5,
      "required_configured": 5,
      "valid": true
    }
  },
  "summary": {
    "total": 45,
    "configured": 38,
    "missing_required": 0,
    "missing_optional": 7
  }
}
```

#### POST /api/config/reload

Force reload configuration.

```bash
curl -X POST http://localhost:8000/api/config/reload
```

Response:
```json
{
  "success": true,
  "message": "Configuration reloaded successfully",
  "errors": null,
  "timestamp": "2025-11-07T12:00:00"
}
```

#### GET /api/config/all

Get all configuration values (secrets hidden).

```bash
curl http://localhost:8000/api/config/all?hide_secrets=true
```

#### GET /api/config/categories

List all configuration categories.

```bash
curl http://localhost:8000/api/config/categories
```

#### GET /api/config/category/{category_name}

Get configuration for specific category.

```bash
curl http://localhost:8000/api/config/category/database
curl http://localhost:8000/api/config/category/redis
curl http://localhost:8000/api/config/category/scrapers
```

#### GET /api/config/health

Health check with configuration status.

```bash
curl http://localhost:8000/api/config/health
```

Response:
```json
{
  "status": "healthy",
  "config_loaded": true,
  "config_valid": true,
  "missing_critical": [],
  "timestamp": "2025-11-07T12:00:00"
}
```

Status values:
- `healthy`: All required config present
- `degraded`: Some optional config missing
- `unhealthy`: Required config missing

#### GET /api/config/db-url

Get database connection URL.

```bash
curl http://localhost:8000/api/config/db-url?hide_password=true
```

#### GET /api/config/redis-url

Get Redis connection URL.

```bash
curl http://localhost:8000/api/config/redis-url?hide_password=true
```

#### POST /api/config/watch/start

Enable hot-reload file watching.

```bash
curl -X POST http://localhost:8000/api/config/watch/start
```

#### POST /api/config/watch/stop

Disable hot-reload file watching.

```bash
curl -X POST http://localhost:8000/api/config/watch/stop
```

#### GET /api/config/watch/status

Get file watching status.

```bash
curl http://localhost:8000/api/config/watch/status
```

## Configuration Variables

### Database Category

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DB_HOST | Yes | localhost | Database host |
| DB_PORT | Yes | 5432 | Database port |
| DB_NAME / DB_DATABASE | Yes | invest_db | Database name |
| DB_USER / DB_USERNAME | Yes | invest_user | Database user |
| DB_PASSWORD | Yes | - | Database password (secret) |

### Redis Category

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| REDIS_HOST | Yes | localhost | Redis host |
| REDIS_PORT | Yes | 6379 | Redis port |
| REDIS_PASSWORD | No | - | Redis password (secret) |
| REDIS_DB | No | 0 | Redis database number |

### Scrapers Category

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| OPCOES_USERNAME | No | - | Opcoes.net.br username |
| OPCOES_PASSWORD | No | - | Opcoes.net.br password (secret) |
| GOOGLE_EMAIL | No | - | Google email for OAuth |
| GOOGLE_PASSWORD | No | - | Google password (secret) |
| BTG_LOGIN_TOKEN | No | - | BTG token (secret) |
| XPI_LOGIN_TOKEN | No | - | XPI token (secret) |
| CHROME_HEADLESS | No | true | Chrome headless mode |
| CHROME_EXECUTABLE_PATH | No | /usr/bin/chromium-browser | Chrome path |
| SCRAPER_TIMEOUT | No | 30000 | Timeout in milliseconds |
| SCRAPER_MAX_RETRIES | No | 3 | Max retry attempts |
| SCRAPER_CONCURRENT_JOBS | No | 3 | Concurrent jobs |

### Paths Category

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| COOKIES_FILE | No | ./cookies.json | Cookies file path |
| LOG_FILE | No | /app/logs/scrapers.log | Log file path |
| BROWSER_PROFILES_PATH | No | ./browser-profiles | Browser profiles path |
| UPLOAD_DIR | No | ./uploads | Upload directory |
| REPORTS_DIR | No | ./reports | Reports directory |

### API Keys Category

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| BRAPI_API_KEY | No | - | BRAPI key (secret) |
| OPENAI_API_KEY | No | - | OpenAI key (secret) |
| ANTHROPIC_API_KEY | No | - | Anthropic key (secret) |

## Hot-Reload

### Enable File Watching

```python
from config_manager import ConfigManager

# Create manager with watching enabled
manager = ConfigManager(auto_load=True, watch=True)

# Or start watching on existing manager
config_manager.start_watching()
```

### How It Works

1. ConfigManager monitors `.env` and `config.yaml` files
2. Checks for changes every 2 seconds using MD5 hash
3. Automatically reloads configuration when changes detected
4. Notifies all registered event listeners

### Event Listeners

```python
def on_config_change(config):
    print("Configuration changed!")
    # Reconnect to database with new config
    db.reconnect(config_manager.database_url)
    # Reconnect to Redis
    redis.reconnect(config_manager.redis_url)

config_manager.add_listener(on_config_change)
```

### Best Practices

1. Use hot-reload in development for faster iteration
2. Be careful with hot-reload in production
3. Always validate config after reload
4. Implement graceful reconnection in listeners
5. Log configuration changes

## Examples

### Example 1: Database Connection

```python
from config_manager import config_manager
import psycopg2

# Get database URL
db_url = config_manager.database_url

# Connect to database
conn = psycopg2.connect(db_url)

# Or use individual values
conn = psycopg2.connect(
    host=config_manager.get("DB_HOST"),
    port=config_manager.get("DB_PORT"),
    database=config_manager.get("DB_NAME"),
    user=config_manager.get("DB_USER"),
    password=config_manager.get("DB_PASSWORD")
)
```

### Example 2: Redis Connection

```python
from config_manager import config_manager
import redis

# Get Redis URL
redis_url = config_manager.redis_url

# Connect to Redis
r = redis.from_url(redis_url)

# Or use individual values
r = redis.Redis(
    host=config_manager.get("REDIS_HOST"),
    port=config_manager.get("REDIS_PORT"),
    db=config_manager.get("REDIS_DB", 0),
    password=config_manager.get("REDIS_PASSWORD")
)
```

### Example 3: Scraper Configuration

```python
from config_manager import config_manager

# Get scraper settings
chrome_headless = config_manager.get("CHROME_HEADLESS", "true") == "true"
timeout = int(config_manager.get("SCRAPER_TIMEOUT", 30000))
max_retries = int(config_manager.get("SCRAPER_MAX_RETRIES", 3))

# Get credentials
opcoes_username = config_manager.get("OPCOES_USERNAME")
opcoes_password = config_manager.get("OPCOES_PASSWORD")

if opcoes_username and opcoes_password:
    print("Opcoes credentials available")
else:
    print("Warning: Opcoes credentials not configured")
```

### Example 4: Validation and Error Handling

```python
from config_manager import config_manager

# Check if configuration is valid
validation = config_manager.validate_config()

if not validation['valid']:
    print("❌ Configuration is invalid!")
    print(f"Missing required: {validation['summary']['missing_required']}")
    status = config_manager.get_status()
    for error in status['errors']:
        print(f"  - {error}")
    exit(1)

print("✅ Configuration is valid")
```

### Example 5: Run Examples Script

```bash
cd /home/user/invest/backend/python-scrapers
python config_example.py
```

This will run all example scenarios and show you how to use ConfigManager.

## Best Practices

### 1. Secret Management

**✅ DO:**
- Store secrets in environment variables
- Use Docker secrets in production
- Use `.env` file (add to `.gitignore`)
- Never commit secrets to version control

**❌ DON'T:**
- Hardcode secrets in code
- Store secrets in `config.yaml`
- Commit `.env` file
- Log secret values

### 2. Configuration Hierarchy

Use the right source for the right purpose:

1. **Environment variables**: Production secrets, deployment-specific config
2. **Docker secrets**: Production secrets in Docker environments
3. **.env file**: Local development secrets and config
4. **config.yaml**: Non-sensitive configuration, defaults
5. **Code defaults**: Fallback values

### 3. Validation

Always validate configuration at startup:

```python
# At application startup
validation = config_manager.validate_config()
if not validation['valid']:
    logger.error("Invalid configuration")
    sys.exit(1)
```

### 4. Hot-Reload

Use hot-reload judiciously:

```python
# Development: Enable hot-reload
if os.getenv("NODE_ENV") == "development":
    config_manager.start_watching()

# Production: Disable hot-reload
else:
    config_manager.watch_enabled = False
```

### 5. Error Handling

```python
try:
    db_host = config_manager.get("DB_HOST")
    if not db_host:
        raise ValueError("DB_HOST is required")
except Exception as e:
    logger.error(f"Configuration error: {e}")
    sys.exit(1)
```

### 6. Testing

```python
# Use custom config manager for testing
test_manager = ConfigManager(
    base_path=Path("/path/to/test/config"),
    auto_load=True,
    watch=False
)

# Or override values
test_manager.config["DB_HOST"] = "test-db-host"
```

## Documentation

- API Documentation: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- This guide: `/backend/python-scrapers/CONFIG_MANAGER_GUIDE.md`
- README: `/backend/api-service/README.md`

## Troubleshooting

### Configuration not loading

1. Check if `.env` file exists and is readable
2. Verify environment variables are set: `env | grep DB_`
3. Check logs for errors
4. Use `/api/config/status` to see what's loaded

### Missing required variables

1. Check status: `curl http://localhost:8000/api/config/status`
2. See which variables are missing
3. Add to `.env` or set as environment variables
4. Reload: `curl -X POST http://localhost:8000/api/config/reload`

### Hot-reload not working

1. Check if watching is enabled: `GET /api/config/watch/status`
2. Start watching: `POST /api/config/watch/start`
3. Verify file permissions
4. Check that files are being modified (not moved/replaced)

## Support

For issues and questions:
1. Check this guide
2. Review the API documentation at `/docs`
3. Check the example scripts
4. Review the code comments in `config_manager.py`

## License

Part of the B3 AI Analysis Platform
