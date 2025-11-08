# Docker Deployment Guide

Complete guide for deploying the B3 AI Analysis Platform using Docker and Docker Compose.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Configuration](#configuration)
4. [Development Deployment](#development-deployment)
5. [Production Deployment](#production-deployment)
6. [Service Management](#service-management)
7. [Monitoring and Logs](#monitoring-and-logs)
8. [Troubleshooting](#troubleshooting)
9. [Backup and Restore](#backup-and-restore)
10. [Performance Tuning](#performance-tuning)

---

## Quick Start

### Development Mode (Fastest Way)

```bash
# 1. Clone the repository
git clone <repository-url>
cd invest

# 2. Copy environment file
cp .env.example .env

# 3. Update critical environment variables
# Edit .env and set:
#   - JWT_SECRET (min 32 characters)
#   - OPENAI_API_KEY (if using AI features)

# 4. Start all services
docker-compose up -d

# 5. Wait for services to be ready (30-60 seconds)
docker-compose ps

# 6. Access the application
# Frontend: http://localhost:3100
# Backend:  http://localhost:3101
# API Docs: http://localhost:3101/api/docs
```

### Production Mode

```bash
# 1. Set up SSL certificates (see SSL Setup section)
# 2. Update .env with production values
# 3. Start with production profile
docker-compose --profile production up -d
```

---

## Prerequisites

### Required Software

- **Docker** 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** 2.0+ ([Install Compose](https://docs.docker.com/compose/install/))

Verify installation:

```bash
docker --version
docker-compose --version
```

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Disk: 10 GB free space

**Recommended:**
- CPU: 4+ cores
- RAM: 8+ GB
- Disk: 20+ GB free space (SSD preferred)

### Ports Required

Ensure these ports are available:

| Port | Service | Required |
|------|---------|----------|
| 3100 | Frontend | Yes |
| 3101 | Backend API | Yes |
| 5532 | PostgreSQL | Yes |
| 6479 | Redis | Yes |
| 180 | Nginx HTTP | Production |
| 543 | Nginx HTTPS | Production |
| 5150 | PgAdmin | Dev only |
| 8181 | Redis Commander | Dev only |

Check port availability:

```bash
# Linux/Mac
netstat -tuln | grep -E '3100|3101|5532|6479'

# Windows
netstat -an | findstr "3100 3101 5532 6479"
```

---

## Configuration

### Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

#### Critical Variables (Must Change)

```bash
# JWT Secret (REQUIRED - min 32 chars)
# Generate with: openssl rand -base64 32
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_long

# Database Password (RECOMMENDED to change)
POSTGRES_PASSWORD=your_secure_password
DB_PASSWORD=your_secure_password
```

#### Optional Features

```bash
# OpenAI GPT-4 for AI Analysis
OPENAI_API_KEY=sk-...

# Telegram Notifications
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_CHAT_ID=123456789

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

#### Service Configuration

```bash
# Docker/Local Toggle
# For Docker: Use service names
DB_HOST=postgres
REDIS_HOST=redis

# For Local Development: Use localhost
# DB_HOST=localhost
# REDIS_HOST=localhost
```

### Docker Compose Profiles

The platform uses Docker Compose profiles for different environments:

**Default (Development):**
```bash
docker-compose up -d
# Services: postgres, redis, backend, frontend, scrapers
```

**Development Tools:**
```bash
docker-compose --profile dev up -d
# Adds: pgadmin (port 5050), redis-commander (port 8081)
```

**Production:**
```bash
docker-compose --profile production up -d
# Adds: nginx reverse proxy with SSL
```

---

## Development Deployment

### Step 1: Initial Setup

```bash
# Create .env file
cp .env.example .env

# Generate strong JWT secret
openssl rand -base64 32

# Edit .env and paste the generated secret
nano .env  # or your preferred editor
```

### Step 2: Start Services

```bash
# Start all development services
docker-compose up -d

# Or start with live logs
docker-compose up
```

### Step 3: Verify Services

```bash
# Check service status
docker-compose ps

# All services should show "Up" and "healthy"
```

### Step 4: Initialize Database

```bash
# Run migrations (if needed)
docker-compose exec backend npm run migration:run

# Or seed test data
docker-compose exec backend npm run seed
```

### Step 5: Access Application

- **Frontend**: http://localhost:3100
- **Backend API**: http://localhost:3101
- **Swagger Docs**: http://localhost:3101/api/docs
- **PgAdmin**: http://localhost:5150 (with --profile dev)
  - Email: `admin@invest.com`
  - Password: `admin`
- **Redis Commander**: http://localhost:8181 (with --profile dev)

### Development Tools

```bash
# Start with development tools (PgAdmin, Redis Commander)
docker-compose --profile dev up -d

# View real-time logs
docker-compose logs -f backend frontend

# Restart a service
docker-compose restart backend

# Rebuild after code changes
docker-compose build backend
docker-compose up -d backend
```

---

## Production Deployment

### Step 1: SSL Certificates

#### Option A: Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt-get install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/nginx/ssl/key.pem

# Set permissions
chmod 600 docker/nginx/ssl/key.pem
chmod 644 docker/nginx/ssl/cert.pem
```

#### Option B: Self-Signed (Testing Only)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/ssl/key.pem \
  -out docker/nginx/ssl/cert.pem \
  -subj "/C=BR/ST=State/L=City/O=Org/CN=yourdomain.com"
```

### Step 2: Production Environment

```bash
# Copy production environment template
cp .env.example .env.production

# Edit production settings
nano .env.production
```

**Critical Production Changes:**

```bash
# Environment
NODE_ENV=production

# Strong secrets
JWT_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=strong_password_here
SESSION_SECRET=$(openssl rand -base64 32)

# Production URLs
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_WS_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Disable debug features
DB_LOGGING=false
LOG_LEVEL=warn
```

### Step 3: Deploy Production

```bash
# Use production environment file
cp .env.production .env

# Start with production profile
docker-compose --profile production up -d

# Verify all services are running
docker-compose ps

# Check logs for errors
docker-compose logs --tail=50
```

### Step 4: Production Validation

```bash
# Run comprehensive tests
./docker-test.sh

# Check HTTPS
curl -I https://yourdomain.com

# Test SSL configuration
https://www.ssllabs.com/ssltest/
```

---

## Service Management

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Start with logs
docker-compose up

# Start with rebuild
docker-compose up -d --build
```

### Stopping Services

```bash
# Stop all services (keep data)
docker-compose stop

# Stop and remove containers (keep data)
docker-compose down

# Stop and remove everything (including volumes - DANGEROUS!)
docker-compose down -v
```

### Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# Restart with rebuild
docker-compose up -d --build backend
```

### Scaling Services

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Note: You'll need a load balancer for multiple backend instances
```

---

## Monitoring and Logs

### View Logs

```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs (real-time)
docker-compose logs -f backend frontend

# Last 100 lines
docker-compose logs --tail=100 backend

# Since timestamp
docker-compose logs --since 2024-01-01T00:00:00
```

### Service Status

```bash
# List all containers
docker-compose ps

# Detailed stats (CPU, RAM, Network)
docker stats

# Inspect service
docker-compose exec backend npm run info
```

### Health Checks

```bash
# Check backend health
curl http://localhost:3101/health

# Check PostgreSQL
docker-compose exec postgres pg_isready -U invest_user

# Check Redis
docker-compose exec redis redis-cli ping

# Check all services with test script
./docker-test.sh
```

### Resource Usage

```bash
# Real-time resource usage
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend

# Remove and recreate
docker-compose down
docker-compose up -d
```

#### Port Already in Use

```bash
# Find process using port
# Linux/Mac:
sudo lsof -i :3000

# Windows:
netstat -ano | findstr :3000

# Kill process or change port in docker-compose.yml
```

#### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose exec postgres pg_isready

# Check environment variables
docker-compose exec backend env | grep DB_

# Reset database (CAUTION: Deletes all data)
docker-compose down -v
docker-compose up -d
```

#### Out of Disk Space

```bash
# Check Docker disk usage
docker system df

# Clean up
docker system prune -a --volumes

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a
```

#### Service Crashes on Start

```bash
# Check logs for errors
docker-compose logs backend

# Common fixes:
# 1. Ensure .env file exists
# 2. Check JWT_SECRET is set
# 3. Verify port availability
# 4. Check file permissions

# Try rebuilding
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase resource limits in docker-compose.yml
# Example for backend:
deploy:
  resources:
    limits:
      cpus: '4.0'
      memory: 4G

# Restart with new limits
docker-compose up -d
```

### Database Issues

```bash
# Access PostgreSQL shell
docker-compose exec postgres psql -U invest_user -d invest_db

# Backup database
docker-compose exec postgres pg_dump -U invest_user invest_db > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T postgres psql -U invest_user invest_db

# Check database size
docker-compose exec postgres psql -U invest_user -d invest_db -c "SELECT pg_size_pretty(pg_database_size('invest_db'));"
```

---

## Backup and Restore

### Database Backup

```bash
# Create backup directory
mkdir -p backups

# Backup PostgreSQL
docker-compose exec -T postgres pg_dump -U invest_user invest_db > backups/db_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker-compose exec -T postgres pg_dump -U invest_user invest_db | gzip > backups/db_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Database Restore

```bash
# Restore from backup
cat backups/db_20240101_120000.sql | docker-compose exec -T postgres psql -U invest_user invest_db

# Restore from compressed backup
gunzip < backups/db_20240101_120000.sql.gz | docker-compose exec -T postgres psql -U invest_user invest_db
```

### Volume Backup

```bash
# Backup PostgreSQL volume
docker run --rm -v invest_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz -C /data .

# Backup Redis volume
docker run --rm -v invest_redis_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/redis_data_$(date +%Y%m%d).tar.gz -C /data .
```

### Automated Backups

Create a cron job:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/invest && docker-compose exec -T postgres pg_dump -U invest_user invest_db | gzip > backups/daily_$(date +\%Y\%m\%d).sql.gz

# Add weekly backup on Sunday
0 3 * * 0 cd /path/to/invest && docker run --rm -v invest_postgres_data:/data -v /path/to/backups:/backup alpine tar czf /backup/weekly_$(date +\%Y\%m\%d).tar.gz -C /data .
```

---

## Performance Tuning

### Resource Limits

Adjust in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      cpus: '2.0'      # Max CPU cores
      memory: 2G       # Max RAM
    reservations:
      cpus: '1.0'      # Reserved CPU
      memory: 1G       # Reserved RAM
```

### PostgreSQL Tuning

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U invest_user -d invest_db

# Optimize for your workload
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '128MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis Tuning

Adjust in `docker-compose.yml`:

```yaml
command: redis-server --appendonly yes --maxmemory 768mb --maxmemory-policy allkeys-lru --tcp-backlog 511 --timeout 0
```

### Logging Configuration

Adjust log rotation in `docker-compose.yml`:

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"    # Max log file size
    max-file: "3"      # Number of log files to keep
```

---

## Security Best Practices

1. **Secrets Management**
   ```bash
   # Use strong secrets
   JWT_SECRET=$(openssl rand -base64 48)

   # Never commit .env files
   echo ".env" >> .gitignore
   ```

2. **Network Security**
   ```yaml
   # Use internal networks
   networks:
     invest_network:
       internal: true
   ```

3. **Container Security**
   ```yaml
   # Run as non-root
   user: "1000:1000"

   # Read-only root filesystem
   read_only: true
   ```

4. **Update Regularly**
   ```bash
   # Pull latest base images
   docker-compose pull
   docker-compose up -d
   ```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)

---

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review service logs: `docker-compose logs`
3. Run test script: `./docker-test.sh`
4. Open an issue on GitHub

---

**Last Updated**: 2025-11-06
