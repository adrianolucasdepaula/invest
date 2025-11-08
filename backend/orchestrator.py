"""
Service Orchestrator for B3 AI Analysis Platform

This module coordinates all services in the platform:
- Scrapers (27 data sources)
- Scheduler (job scheduling and queue management)
- Aggregator (data consolidation)
- AI Analyzer (automated analysis)
- API Service (REST endpoints)

Author: B3 AI Analysis Platform Team
Date: 2025-11-07
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum
from loguru import logger

# Add python-scrapers to path
sys.path.insert(0, str(Path(__file__).parent.parent / "python-scrapers"))

try:
    from database import db
    from redis_client import redis_client
    from scheduler import ScraperScheduler, JobProcessor
    from config import settings
except ImportError as e:
    logger.warning(f"Import error: {e}")
    db = None
    redis_client = None
    ScraperScheduler = None
    JobProcessor = None
    settings = None


class ServiceStatus(str, Enum):
    """Service status enumeration"""
    STARTING = "starting"
    RUNNING = "running"
    STOPPING = "stopping"
    STOPPED = "stopped"
    ERROR = "error"


class ServiceOrchestrator:
    """
    Orchestrates all services in the B3 AI Analysis Platform

    Features:
    - Service initialization and lifecycle management
    - Health monitoring
    - Graceful shutdown handling
    - Unified status reporting
    """

    def __init__(self):
        self.services: Dict[str, Any] = {}
        self.status: Dict[str, ServiceStatus] = {}
        self.start_time: Optional[datetime] = None
        self._running = False

    async def initialize(self):
        """
        Initialize all services

        Order:
        1. Database (PostgreSQL with TimescaleDB)
        2. Redis (cache and queue)
        3. Scheduler (job scheduling)
        4. Job Processor (worker pool)
        """
        try:
            logger.info("=" * 80)
            logger.info("🔧 Initializing B3 AI Analysis Platform Services...")
            logger.info("=" * 80)

            # Initialize Database
            await self._init_database()

            # Initialize Redis
            await self._init_redis()

            # Initialize Scheduler
            await self._init_scheduler()

            # Initialize Job Processor
            await self._init_processor()

            logger.info("=" * 80)
            logger.success("✅ All services initialized successfully!")
            logger.info("=" * 80)

        except Exception as e:
            logger.error(f"Failed to initialize services: {e}")
            raise

    async def _init_database(self):
        """Initialize database connection"""
        try:
            self.status['database'] = ServiceStatus.STARTING
            logger.info("📊 Initializing Database...")

            if db:
                db.connect()
                logger.success("✓ Database connected (PostgreSQL + TimescaleDB)")
                self.services['database'] = db
                self.status['database'] = ServiceStatus.RUNNING
            else:
                logger.warning("⚠ Database module not available")
                self.status['database'] = ServiceStatus.ERROR

        except Exception as e:
            logger.error(f"✗ Database initialization failed: {e}")
            self.status['database'] = ServiceStatus.ERROR
            raise

    async def _init_redis(self):
        """Initialize Redis connection"""
        try:
            self.status['redis'] = ServiceStatus.STARTING
            logger.info("🔴 Initializing Redis...")

            if redis_client:
                redis_client.connect()
                logger.success("✓ Redis connected (Cache & Queue)")
                self.services['redis'] = redis_client
                self.status['redis'] = ServiceStatus.RUNNING
            else:
                logger.warning("⚠ Redis module not available")
                self.status['redis'] = ServiceStatus.ERROR

        except Exception as e:
            logger.error(f"✗ Redis initialization failed: {e}")
            self.status['redis'] = ServiceStatus.ERROR
            raise

    async def _init_scheduler(self):
        """Initialize job scheduler"""
        try:
            self.status['scheduler'] = ServiceStatus.STARTING
            logger.info("⏰ Initializing Scheduler...")

            if ScraperScheduler:
                scheduler = ScraperScheduler()
                await scheduler.initialize()
                logger.success("✓ Scheduler initialized (APScheduler)")
                self.services['scheduler'] = scheduler
                self.status['scheduler'] = ServiceStatus.RUNNING
            else:
                logger.warning("⚠ Scheduler module not available")
                self.status['scheduler'] = ServiceStatus.ERROR

        except Exception as e:
            logger.error(f"✗ Scheduler initialization failed: {e}")
            self.status['scheduler'] = ServiceStatus.ERROR
            # Don't raise - scheduler is optional

    async def _init_processor(self):
        """Initialize job processor"""
        try:
            self.status['processor'] = ServiceStatus.STARTING
            logger.info("⚙️  Initializing Job Processor...")

            if JobProcessor:
                processor = JobProcessor()
                await processor.initialize()
                logger.success("✓ Job Processor initialized (Worker Pool)")
                self.services['processor'] = processor
                self.status['processor'] = ServiceStatus.RUNNING
            else:
                logger.warning("⚠ Job Processor module not available")
                self.status['processor'] = ServiceStatus.ERROR

        except Exception as e:
            logger.error(f"✗ Job Processor initialization failed: {e}")
            self.status['processor'] = ServiceStatus.ERROR
            # Don't raise - processor is optional

    async def start(self):
        """
        Start all services

        Order:
        1. Start scheduler (if available)
        2. Start job processor workers (if available)
        """
        try:
            if self._running:
                logger.warning("Services are already running")
                return

            logger.info("=" * 80)
            logger.info("🚀 Starting B3 AI Analysis Platform Services...")
            logger.info("=" * 80)

            self.start_time = datetime.now()
            self._running = True

            # Start Scheduler
            if 'scheduler' in self.services and self.services['scheduler']:
                try:
                    await self.services['scheduler'].start()
                    logger.success("✓ Scheduler started")
                except Exception as e:
                    logger.error(f"✗ Failed to start scheduler: {e}")

            # Start Job Processor
            if 'processor' in self.services and self.services['processor']:
                try:
                    await self.services['processor'].start()
                    logger.success("✓ Job Processor started")
                except Exception as e:
                    logger.error(f"✗ Failed to start processor: {e}")

            logger.info("=" * 80)
            logger.success("🎉 All services are running!")
            logger.info("=" * 80)
            self._print_status()

        except Exception as e:
            logger.error(f"Failed to start services: {e}")
            raise

    async def stop(self):
        """
        Stop all services gracefully

        Order:
        1. Stop job processor (finish current jobs)
        2. Stop scheduler
        3. Disconnect Redis
        4. Disconnect Database
        """
        try:
            if not self._running:
                logger.warning("Services are not running")
                return

            logger.info("=" * 80)
            logger.info("🛑 Stopping B3 AI Analysis Platform Services...")
            logger.info("=" * 80)

            self._running = False

            # Stop Job Processor
            if 'processor' in self.services and self.services['processor']:
                try:
                    self.status['processor'] = ServiceStatus.STOPPING
                    await self.services['processor'].stop()
                    self.status['processor'] = ServiceStatus.STOPPED
                    logger.info("✓ Job Processor stopped")
                except Exception as e:
                    logger.error(f"✗ Failed to stop processor: {e}")

            # Stop Scheduler
            if 'scheduler' in self.services and self.services['scheduler']:
                try:
                    self.status['scheduler'] = ServiceStatus.STOPPING
                    await self.services['scheduler'].stop()
                    self.status['scheduler'] = ServiceStatus.STOPPED
                    logger.info("✓ Scheduler stopped")
                except Exception as e:
                    logger.error(f"✗ Failed to stop scheduler: {e}")

            # Disconnect Redis
            if 'redis' in self.services and self.services['redis']:
                try:
                    self.status['redis'] = ServiceStatus.STOPPING
                    self.services['redis'].disconnect()
                    self.status['redis'] = ServiceStatus.STOPPED
                    logger.info("✓ Redis disconnected")
                except Exception as e:
                    logger.error(f"✗ Failed to disconnect Redis: {e}")

            # Disconnect Database
            if 'database' in self.services and self.services['database']:
                try:
                    self.status['database'] = ServiceStatus.STOPPING
                    self.services['database'].disconnect()
                    self.status['database'] = ServiceStatus.STOPPED
                    logger.info("✓ Database disconnected")
                except Exception as e:
                    logger.error(f"✗ Failed to disconnect database: {e}")

            logger.info("=" * 80)
            logger.success("👋 All services stopped successfully")
            logger.info("=" * 80)

        except Exception as e:
            logger.error(f"Error stopping services: {e}")

    def get_status(self) -> Dict[str, Any]:
        """
        Get unified status of all services

        Returns:
        - Overall status
        - Status of each service
        - Uptime
        - Service details
        """
        uptime = None
        if self.start_time:
            uptime = (datetime.now() - self.start_time).total_seconds()

        # Determine overall status
        overall_status = "healthy"
        if not self._running:
            overall_status = "stopped"
        elif any(s == ServiceStatus.ERROR for s in self.status.values()):
            overall_status = "unhealthy"
        elif any(s == ServiceStatus.STARTING for s in self.status.values()):
            overall_status = "starting"

        return {
            "overall_status": overall_status,
            "running": self._running,
            "uptime_seconds": uptime,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "services": {
                name: {
                    "status": status.value,
                    "available": name in self.services and self.services[name] is not None
                }
                for name, status in self.status.items()
            }
        }

    def _print_status(self):
        """Print current status of all services"""
        status = self.get_status()

        logger.info("📊 Service Status:")
        logger.info("-" * 80)

        for service_name, service_info in status['services'].items():
            status_icon = "✓" if service_info['status'] == "running" else "✗"
            logger.info(f"   {status_icon} {service_name.capitalize()}: {service_info['status']}")

        logger.info("-" * 80)

        if status['uptime_seconds']:
            logger.info(f"⏱️  Uptime: {status['uptime_seconds']:.2f} seconds")

    async def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on all services

        Returns detailed health status
        """
        health = {
            "timestamp": datetime.now().isoformat(),
            "overall_health": "healthy",
            "services": {}
        }

        issues = []

        # Check Database
        try:
            if db and db.engine:
                db.execute_query("SELECT 1")
                health["services"]["database"] = {
                    "status": "healthy",
                    "message": "PostgreSQL connection active"
                }
            else:
                health["services"]["database"] = {
                    "status": "unavailable",
                    "message": "Database not initialized"
                }
                issues.append("database")
        except Exception as e:
            health["services"]["database"] = {
                "status": "unhealthy",
                "message": f"Database error: {str(e)}"
            }
            issues.append("database")

        # Check Redis
        try:
            if redis_client and redis_client.client:
                redis_client.client.ping()
                health["services"]["redis"] = {
                    "status": "healthy",
                    "message": "Redis connection active"
                }
            else:
                health["services"]["redis"] = {
                    "status": "unavailable",
                    "message": "Redis not initialized"
                }
                issues.append("redis")
        except Exception as e:
            health["services"]["redis"] = {
                "status": "unhealthy",
                "message": f"Redis error: {str(e)}"
            }
            issues.append("redis")

        # Check Scheduler
        if 'scheduler' in self.services:
            scheduler = self.services['scheduler']
            if scheduler and hasattr(scheduler, '_running') and scheduler._running:
                health["services"]["scheduler"] = {
                    "status": "healthy",
                    "message": "Scheduler is running"
                }
            else:
                health["services"]["scheduler"] = {
                    "status": "stopped",
                    "message": "Scheduler is not running"
                }
        else:
            health["services"]["scheduler"] = {
                "status": "unavailable",
                "message": "Scheduler not initialized"
            }

        # Check Job Processor
        if 'processor' in self.services:
            processor = self.services['processor']
            if processor and hasattr(processor, '_running') and processor._running:
                worker_count = len(processor.workers) if hasattr(processor, 'workers') else 0
                health["services"]["processor"] = {
                    "status": "healthy",
                    "message": f"Processor running with {worker_count} workers"
                }
            else:
                health["services"]["processor"] = {
                    "status": "stopped",
                    "message": "Job processor is not running"
                }
        else:
            health["services"]["processor"] = {
                "status": "unavailable",
                "message": "Job processor not initialized"
            }

        # Set overall health
        if len(issues) > 0:
            health["overall_health"] = "unhealthy" if len(issues) >= 2 else "degraded"
            health["issues"] = issues

        return health


# Global orchestrator instance
orchestrator = ServiceOrchestrator()


async def main():
    """
    Main entry point for running the orchestrator

    Usage:
        python orchestrator.py
    """
    try:
        # Initialize services
        await orchestrator.initialize()

        # Start services
        await orchestrator.start()

        # Keep running
        logger.info("Press Ctrl+C to stop...")
        try:
            while True:
                await asyncio.sleep(60)
                # Periodic health check
                health = await orchestrator.health_check()
                if health['overall_health'] != 'healthy':
                    logger.warning(f"Health check: {health['overall_health']}")
        except KeyboardInterrupt:
            logger.info("Received shutdown signal")

        # Stop services
        await orchestrator.stop()

    except Exception as e:
        logger.error(f"Orchestrator error: {e}")
        raise


if __name__ == "__main__":
    # Configure logging
    logger.add(
        "/app/logs/orchestrator.log",
        rotation="100 MB",
        retention="10 days",
        level="INFO"
    )

    # Run orchestrator
    asyncio.run(main())
