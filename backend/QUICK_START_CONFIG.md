# Quick Start - Configuration Manager

Get started with the B3 AI Analysis Platform Configuration Manager in 5 minutes!

## 🚀 1. Installation (1 minute)

```bash
# Navigate to api-service
cd /home/user/invest/backend/api-service

# Install dependencies
pip install -r requirements.txt
```

## ⚙️ 2. Verify Configuration (1 minute)

```bash
# Check your .env file exists
ls -l /home/user/invest/backend/.env

# Test configuration from Python
cd /home/user/invest/backend/python-scrapers
python -c "from config_manager import config_manager; print('Config loaded:', config_manager.status.loaded)"
```

## 🌐 3. Start API Service (1 minute)

```bash
# Start the FastAPI service
cd /home/user/invest/backend/api-service
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open in browser: http://localhost:8000/docs

## ✅ 4. Test Endpoints (1 minute)

### Check Configuration Status
```bash
curl http://localhost:8000/api/config/status | jq
```

### Validate Configuration
```bash
curl http://localhost:8000/api/config/validate | jq
```

### Health Check
```bash
curl http://localhost:8000/api/config/health | jq
```

## 🐍 5. Use in Python (1 minute)

```python
# In your Python scripts
from config_manager import config_manager

# Get configuration values
db_host = config_manager.get("DB_HOST")
redis_port = config_manager.get("REDIS_PORT")

# Get connection URLs
print(f"Database: {config_manager.database_url}")
print(f"Redis: {config_manager.redis_url}")

# Validate configuration
validation = config_manager.validate_config()
if validation['valid']:
    print("✅ Configuration is valid!")
else:
    print("❌ Configuration has errors")
```

## 📝 Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/config/status` | GET | Configuration status |
| `/api/config/validate` | GET | Validate configuration |
| `/api/config/reload` | POST | Reload configuration |
| `/api/config/health` | GET | Health check |
| `/api/config/all` | GET | All config values |
| `/api/config/category/database` | GET | Database config |

## 🔥 Hot-Reload

Enable hot-reload to automatically reload configuration when .env changes:

```bash
# Enable hot-reload
curl -X POST http://localhost:8000/api/config/watch/start

# Edit your .env file
nano /home/user/invest/backend/.env

# Configuration will automatically reload!

# Disable hot-reload
curl -X POST http://localhost:8000/api/config/watch/stop
```

## 📚 Full Documentation

- **Complete Guide:** `/backend/python-scrapers/CONFIG_MANAGER_GUIDE.md`
- **Summary:** `/backend/CONFIG_SYSTEM_SUMMARY.md`
- **API Docs:** http://localhost:8000/docs
- **Examples:** `/backend/python-scrapers/config_example.py`

## 🆘 Quick Troubleshooting

### Missing required variables?
```bash
# Check what's missing
curl http://localhost:8000/api/config/status | jq '.missing_required'

# Add to .env file
echo "DB_PASSWORD=your_password" >> /home/user/invest/backend/.env

# Reload
curl -X POST http://localhost:8000/api/config/reload
```

### Configuration not valid?
```bash
# Check validation details
curl http://localhost:8000/api/config/validate | jq

# Check by category
curl http://localhost:8000/api/config/category/database | jq
```

## ✨ That's It!

You now have a fully functional configuration management system with:
- ✅ Multi-source auto-loading
- ✅ Validation
- ✅ Hot-reload
- ✅ REST API
- ✅ Secret management

For more advanced features, check the full documentation!
