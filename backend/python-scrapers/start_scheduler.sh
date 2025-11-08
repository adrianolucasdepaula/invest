#!/bin/bash
# Start the B3 AI Analysis Platform Job Scheduler

set -e

echo "========================================"
echo "B3 AI Analysis Platform - Job Scheduler"
echo "========================================"
echo ""

# Check if config file exists
if [ ! -f "/home/user/invest/config/scraper_schedules.yaml" ]; then
    echo "ERROR: Schedule configuration not found at /home/user/invest/config/scraper_schedules.yaml"
    exit 1
fi

# Check if database is accessible
echo "Checking database connection..."
python3 -c "from database import db; db.connect(); print('✓ Database OK'); db.disconnect()" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "ERROR: Cannot connect to database"
    echo "Make sure PostgreSQL is running and configured correctly"
    exit 1
fi

# Check if Redis is accessible
echo "Checking Redis connection..."
python3 -c "from redis_client import redis_client; redis_client.connect(); print('✓ Redis OK'); redis_client.disconnect()" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "ERROR: Cannot connect to Redis"
    echo "Make sure Redis is running and configured correctly"
    exit 1
fi

echo ""
echo "Starting scheduler..."
echo ""
echo "Components:"
echo "  - ScraperScheduler: Loads schedules from YAML and creates cron jobs"
echo "  - JobQueue: Redis-based priority queue"
echo "  - JobProcessor: Worker pool (3 workers by default)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run scheduler
python3 scheduler.py
