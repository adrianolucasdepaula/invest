"""
Job Scheduling and Queue System for B3 AI Analysis Platform

This module provides a complete job scheduling and queue management system:
- ScraperScheduler: Cron-like job scheduling using APScheduler
- JobQueue: Redis-based priority job queue
- JobProcessor: Worker pool for processing scraper jobs

Author: B3 AI Analysis Platform Team
Date: 2025-11-07
"""

import asyncio
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Callable
from enum import Enum
from dataclasses import dataclass, asdict
import yaml
import time

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.date import DateTrigger
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings
from database import db
from redis_client import redis_client


class JobStatus(str, Enum):
    """Job status enumeration"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRY = "retry"


class JobPriority(str, Enum):
    """Job priority levels"""
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


@dataclass
class Job:
    """Job data structure"""
    id: str
    scraper_name: str
    ticker: str
    priority: JobPriority = JobPriority.NORMAL
    status: JobStatus = JobStatus.PENDING
    created_at: datetime = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.id is None:
            self.id = str(uuid.uuid4())

    def to_dict(self) -> Dict[str, Any]:
        """Convert job to dictionary"""
        data = asdict(self)
        # Convert datetime objects to ISO format
        for key in ['created_at', 'started_at', 'completed_at']:
            if data[key]:
                data[key] = data[key].isoformat() if isinstance(data[key], datetime) else data[key]
        # Convert enums to strings
        data['priority'] = data['priority'].value if isinstance(data['priority'], JobPriority) else data['priority']
        data['status'] = data['status'].value if isinstance(data['status'], JobStatus) else data['status']
        return data

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> 'Job':
        """Create job from dictionary"""
        # Convert ISO strings back to datetime
        for key in ['created_at', 'started_at', 'completed_at']:
            if data.get(key):
                data[key] = datetime.fromisoformat(data[key]) if isinstance(data[key], str) else data[key]
        # Convert strings to enums
        if isinstance(data.get('priority'), str):
            data['priority'] = JobPriority(data['priority'])
        if isinstance(data.get('status'), str):
            data['status'] = JobStatus(data['status'])
        return Job(**data)


class ScraperScheduler:
    """
    Cron-like job scheduler using APScheduler

    Features:
    - Load schedules from YAML config
    - Create recurring jobs with cron expressions
    - Push jobs to Redis queue
    - Track schedule execution history in PostgreSQL
    """

    def __init__(self, config_path: str = "/home/user/invest/config/scraper_schedules.yaml"):
        self.config_path = config_path
        self.scheduler = AsyncIOScheduler()
        self.schedules: Dict[str, Dict[str, Any]] = {}
        self.job_queue: Optional[JobQueue] = None
        self._running = False

    async def initialize(self):
        """Initialize scheduler and load configuration"""
        try:
            logger.info("Initializing ScraperScheduler...")

            # Load schedule configuration
            await self._load_config()

            # Initialize job queue
            self.job_queue = JobQueue()

            # Setup schedules
            await self._setup_schedules()

            logger.success(f"ScraperScheduler initialized with {len(self.schedules)} schedules")

        except Exception as e:
            logger.error(f"Failed to initialize ScraperScheduler: {e}")
            raise

    async def _load_config(self):
        """Load schedule configuration from YAML file"""
        try:
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)

            self.schedules = config.get('schedules', {})
            logger.info(f"Loaded {len(self.schedules)} schedule configurations")

        except FileNotFoundError:
            logger.warning(f"Schedule config file not found: {self.config_path}")
            self.schedules = {}
        except Exception as e:
            logger.error(f"Error loading schedule config: {e}")
            raise

    async def _setup_schedules(self):
        """Setup scheduled jobs in APScheduler"""
        for schedule_name, schedule_config in self.schedules.items():
            try:
                # Parse schedule configuration
                scraper_name = schedule_config.get('scraper')
                tickers = schedule_config.get('tickers', [])
                schedule_type = schedule_config.get('type', 'cron')
                priority = JobPriority(schedule_config.get('priority', 'normal'))
                enabled = schedule_config.get('enabled', True)

                if not enabled:
                    logger.debug(f"Schedule '{schedule_name}' is disabled, skipping")
                    continue

                # Create trigger based on schedule type
                trigger = self._create_trigger(schedule_type, schedule_config)

                if not trigger:
                    logger.warning(f"Invalid trigger for schedule '{schedule_name}'")
                    continue

                # Add job to scheduler
                self.scheduler.add_job(
                    self._execute_schedule,
                    trigger=trigger,
                    id=schedule_name,
                    name=schedule_name,
                    args=[schedule_name, scraper_name, tickers, priority],
                    replace_existing=True,
                    misfire_grace_time=300,  # 5 minutes
                )

                logger.info(f"Scheduled job '{schedule_name}' for {scraper_name} ({schedule_type})")

            except Exception as e:
                logger.error(f"Error setting up schedule '{schedule_name}': {e}")

    def _create_trigger(self, schedule_type: str, config: Dict[str, Any]):
        """Create APScheduler trigger from configuration"""
        try:
            if schedule_type == 'cron':
                # Cron-style scheduling
                return CronTrigger(
                    hour=config.get('hour'),
                    minute=config.get('minute'),
                    second=config.get('second', 0),
                    day=config.get('day'),
                    month=config.get('month'),
                    day_of_week=config.get('day_of_week'),
                    timezone='America/Sao_Paulo',
                )

            elif schedule_type == 'interval':
                # Interval-based scheduling
                kwargs = {}
                if 'hours' in config:
                    kwargs['hours'] = config['hours']
                if 'minutes' in config:
                    kwargs['minutes'] = config['minutes']
                if 'seconds' in config:
                    kwargs['seconds'] = config['seconds']

                return IntervalTrigger(**kwargs)

            elif schedule_type == 'date':
                # One-time scheduled job
                run_date = config.get('run_date')
                if isinstance(run_date, str):
                    run_date = datetime.fromisoformat(run_date)
                return DateTrigger(run_date=run_date)

            else:
                logger.error(f"Unknown schedule type: {schedule_type}")
                return None

        except Exception as e:
            logger.error(f"Error creating trigger: {e}")
            return None

    async def _execute_schedule(self, schedule_name: str, scraper_name: str,
                                tickers: List[str], priority: JobPriority):
        """Execute a scheduled job by pushing to queue"""
        try:
            logger.info(f"Executing schedule '{schedule_name}' for {scraper_name}")

            # Create jobs for each ticker
            job_ids = []
            for ticker in tickers:
                job = Job(
                    id=str(uuid.uuid4()),
                    scraper_name=scraper_name,
                    ticker=ticker,
                    priority=priority,
                    metadata={
                        'schedule_name': schedule_name,
                        'scheduled_at': datetime.now().isoformat(),
                    }
                )

                # Push to queue
                await self.job_queue.push(job)
                job_ids.append(job.id)

            # Record schedule execution in database
            await self._record_execution(schedule_name, scraper_name, tickers, job_ids)

            logger.success(f"Schedule '{schedule_name}' created {len(job_ids)} jobs")

        except Exception as e:
            logger.error(f"Error executing schedule '{schedule_name}': {e}")

    async def _record_execution(self, schedule_name: str, scraper_name: str,
                                tickers: List[str], job_ids: List[str]):
        """Record schedule execution in PostgreSQL"""
        try:
            query = """
                INSERT INTO schedule_executions
                (schedule_name, scraper_name, tickers, job_ids, executed_at)
                VALUES (:schedule_name, :scraper_name, :tickers, :job_ids, :executed_at)
            """

            params = {
                'schedule_name': schedule_name,
                'scraper_name': scraper_name,
                'tickers': json.dumps(tickers),
                'job_ids': json.dumps(job_ids),
                'executed_at': datetime.now(),
            }

            db.execute_update(query, params)

        except Exception as e:
            logger.error(f"Error recording schedule execution: {e}")

    async def start(self):
        """Start the scheduler"""
        try:
            if not self._running:
                self.scheduler.start()
                self._running = True
                logger.success("ScraperScheduler started")
        except Exception as e:
            logger.error(f"Error starting scheduler: {e}")
            raise

    async def stop(self):
        """Stop the scheduler"""
        try:
            if self._running:
                self.scheduler.shutdown(wait=True)
                self._running = False
                logger.info("ScraperScheduler stopped")
        except Exception as e:
            logger.error(f"Error stopping scheduler: {e}")

    def get_jobs(self) -> List[Dict[str, Any]]:
        """Get list of scheduled jobs"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                'id': job.id,
                'name': job.name,
                'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
                'trigger': str(job.trigger),
            })
        return jobs


class JobQueue:
    """
    Redis-based priority job queue

    Features:
    - Priority queue support (high/normal/low)
    - Job status tracking
    - FIFO within same priority level
    - Atomic operations for thread safety
    """

    QUEUE_KEY = "scraper:jobs"
    QUEUE_HIGH = "scraper:jobs:high"
    QUEUE_NORMAL = "scraper:jobs:normal"
    QUEUE_LOW = "scraper:jobs:low"
    JOB_STATUS_KEY = "scraper:job:{job_id}:status"
    JOB_DATA_KEY = "scraper:job:{job_id}:data"

    def __init__(self):
        self.redis = redis_client.client

    async def push(self, job: Job) -> bool:
        """
        Push job to queue based on priority

        Args:
            job: Job instance to push

        Returns:
            True if successful, False otherwise
        """
        try:
            # Determine queue based on priority
            queue_key = self._get_queue_key(job.priority)

            # Store job data
            job_data_key = self.JOB_DATA_KEY.format(job_id=job.id)
            self.redis.setex(job_data_key, 86400, json.dumps(job.to_dict()))  # 24h TTL

            # Store job status
            await self.update_status(job.id, JobStatus.PENDING)

            # Push to queue
            self.redis.lpush(queue_key, job.id)

            logger.info(f"Job {job.id} pushed to {job.priority.value} priority queue")
            return True

        except Exception as e:
            logger.error(f"Error pushing job to queue: {e}")
            return False

    async def pop(self, timeout: int = 5) -> Optional[Job]:
        """
        Pop job from queue (highest priority first)

        Checks queues in priority order: HIGH -> NORMAL -> LOW

        Args:
            timeout: Blocking timeout in seconds

        Returns:
            Job instance or None if queue is empty
        """
        try:
            # Try high priority first
            job_id = self.redis.rpop(self.QUEUE_HIGH)

            if not job_id:
                # Try normal priority
                job_id = self.redis.rpop(self.QUEUE_NORMAL)

            if not job_id:
                # Try low priority
                job_id = self.redis.rpop(self.QUEUE_LOW)

            if not job_id:
                return None

            # Get job data
            job_data_key = self.JOB_DATA_KEY.format(job_id=job_id)
            job_data = self.redis.get(job_data_key)

            if not job_data:
                logger.warning(f"Job data not found for job_id: {job_id}")
                return None

            job = Job.from_dict(json.loads(job_data))
            logger.debug(f"Popped job {job.id} from queue")
            return job

        except Exception as e:
            logger.error(f"Error popping job from queue: {e}")
            return None

    async def update_status(self, job_id: str, status: JobStatus) -> bool:
        """Update job status"""
        try:
            status_key = self.JOB_STATUS_KEY.format(job_id=job_id)
            self.redis.setex(status_key, 86400, status.value)  # 24h TTL
            return True
        except Exception as e:
            logger.error(f"Error updating job status: {e}")
            return False

    async def get_status(self, job_id: str) -> Optional[JobStatus]:
        """Get job status"""
        try:
            status_key = self.JOB_STATUS_KEY.format(job_id=job_id)
            status = self.redis.get(status_key)
            return JobStatus(status) if status else None
        except Exception as e:
            logger.error(f"Error getting job status: {e}")
            return None

    async def get_job(self, job_id: str) -> Optional[Job]:
        """Get job data by ID"""
        try:
            job_data_key = self.JOB_DATA_KEY.format(job_id=job_id)
            job_data = self.redis.get(job_data_key)

            if not job_data:
                return None

            return Job.from_dict(json.loads(job_data))

        except Exception as e:
            logger.error(f"Error getting job: {e}")
            return None

    async def update_job(self, job: Job) -> bool:
        """Update job data"""
        try:
            job_data_key = self.JOB_DATA_KEY.format(job_id=job.id)
            self.redis.setex(job_data_key, 86400, json.dumps(job.to_dict()))
            return True
        except Exception as e:
            logger.error(f"Error updating job: {e}")
            return False

    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a pending job"""
        try:
            # Update status
            await self.update_status(job_id, JobStatus.CANCELLED)

            # Try to remove from all queues
            for queue_key in [self.QUEUE_HIGH, self.QUEUE_NORMAL, self.QUEUE_LOW]:
                self.redis.lrem(queue_key, 0, job_id)

            logger.info(f"Job {job_id} cancelled")
            return True

        except Exception as e:
            logger.error(f"Error cancelling job: {e}")
            return False

    async def get_queue_length(self) -> Dict[str, int]:
        """Get length of each priority queue"""
        try:
            return {
                'high': self.redis.llen(self.QUEUE_HIGH),
                'normal': self.redis.llen(self.QUEUE_NORMAL),
                'low': self.redis.llen(self.QUEUE_LOW),
            }
        except Exception as e:
            logger.error(f"Error getting queue length: {e}")
            return {'high': 0, 'normal': 0, 'low': 0}

    def _get_queue_key(self, priority: JobPriority) -> str:
        """Get Redis queue key for priority level"""
        if priority == JobPriority.HIGH:
            return self.QUEUE_HIGH
        elif priority == JobPriority.LOW:
            return self.QUEUE_LOW
        else:
            return self.QUEUE_NORMAL


class JobProcessor:
    """
    Worker that consumes and processes jobs from the queue

    Features:
    - Worker pool with configurable size
    - Retry logic with exponential backoff
    - Result storage in PostgreSQL
    - Event publishing via Redis pub/sub
    """

    def __init__(self, worker_count: int = None):
        self.worker_count = worker_count or settings.SCRAPER_CONCURRENT_JOBS
        self.job_queue = JobQueue()
        self.workers: List[asyncio.Task] = []
        self._running = False
        self._scrapers: Dict[str, Any] = {}

    async def initialize(self):
        """Initialize job processor"""
        try:
            logger.info("Initializing JobProcessor...")

            # Load all available scrapers
            await self._load_scrapers()

            logger.success(f"JobProcessor initialized with {len(self._scrapers)} scrapers")

        except Exception as e:
            logger.error(f"Failed to initialize JobProcessor: {e}")
            raise

    async def _load_scrapers(self):
        """Dynamically load all scraper classes"""
        try:
            import importlib
            import os
            from pathlib import Path

            scrapers_dir = Path(__file__).parent / "scrapers"

            for file in scrapers_dir.glob("*_scraper.py"):
                module_name = file.stem
                scraper_class_name = ''.join(word.capitalize() for word in module_name.split('_'))

                try:
                    module = importlib.import_module(f"scrapers.{module_name}")
                    scraper_class = getattr(module, scraper_class_name, None)

                    if scraper_class:
                        # Extract scraper name from class
                        scraper_instance = scraper_class()
                        self._scrapers[scraper_instance.name] = scraper_class
                        logger.debug(f"Loaded scraper: {scraper_instance.name}")

                except Exception as e:
                    logger.warning(f"Could not load scraper from {module_name}: {e}")

        except Exception as e:
            logger.error(f"Error loading scrapers: {e}")

    async def start(self):
        """Start worker pool"""
        try:
            if self._running:
                logger.warning("JobProcessor is already running")
                return

            self._running = True
            logger.info(f"Starting {self.worker_count} workers...")

            # Start worker tasks
            for i in range(self.worker_count):
                worker = asyncio.create_task(self._worker_loop(i))
                self.workers.append(worker)

            logger.success(f"JobProcessor started with {self.worker_count} workers")

        except Exception as e:
            logger.error(f"Error starting JobProcessor: {e}")
            raise

    async def stop(self):
        """Stop worker pool"""
        try:
            logger.info("Stopping JobProcessor...")
            self._running = False

            # Wait for workers to finish
            if self.workers:
                await asyncio.gather(*self.workers, return_exceptions=True)

            self.workers.clear()
            logger.success("JobProcessor stopped")

        except Exception as e:
            logger.error(f"Error stopping JobProcessor: {e}")

    async def _worker_loop(self, worker_id: int):
        """Main worker loop"""
        logger.info(f"Worker {worker_id} started")

        while self._running:
            try:
                # Pop job from queue
                job = await self.job_queue.pop(timeout=5)

                if not job:
                    # No job available, wait a bit
                    await asyncio.sleep(1)
                    continue

                # Process job
                await self._process_job(worker_id, job)

            except Exception as e:
                logger.error(f"Worker {worker_id} error: {e}")
                await asyncio.sleep(5)

        logger.info(f"Worker {worker_id} stopped")

    async def _process_job(self, worker_id: int, job: Job):
        """Process a single job"""
        start_time = time.time()

        try:
            logger.info(f"[Worker {worker_id}] Processing job {job.id}: {job.scraper_name} - {job.ticker}")

            # Update job status
            job.status = JobStatus.RUNNING
            job.started_at = datetime.now()
            await self.job_queue.update_job(job)
            await self.job_queue.update_status(job.id, JobStatus.RUNNING)

            # Get scraper class
            scraper_class = self._scrapers.get(job.scraper_name)

            if not scraper_class:
                raise ValueError(f"Scraper not found: {job.scraper_name}")

            # Execute scraper with retry logic
            result = await self._execute_scraper_with_retry(scraper_class, job)

            # Update job with result
            job.completed_at = datetime.now()

            if result.success:
                job.status = JobStatus.COMPLETED
                job.result = result.to_dict()
                logger.success(f"[Worker {worker_id}] Job {job.id} completed successfully")
            else:
                job.status = JobStatus.FAILED
                job.error = result.error
                logger.error(f"[Worker {worker_id}] Job {job.id} failed: {result.error}")

            # Save results to database
            await self._save_result(job, result)

            # Update job in queue
            await self.job_queue.update_job(job)
            await self.job_queue.update_status(job.id, job.status)

            # Publish event
            await self._publish_event(job, result)

            execution_time = time.time() - start_time
            logger.info(f"[Worker {worker_id}] Job {job.id} processed in {execution_time:.2f}s")

        except Exception as e:
            logger.error(f"[Worker {worker_id}] Error processing job {job.id}: {e}")

            # Update job as failed
            job.status = JobStatus.FAILED
            job.error = str(e)
            job.completed_at = datetime.now()

            await self.job_queue.update_job(job)
            await self.job_queue.update_status(job.id, JobStatus.FAILED)

            # Check if should retry
            if job.retry_count < job.max_retries:
                await self._retry_job(job)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _execute_scraper_with_retry(self, scraper_class, job: Job):
        """Execute scraper with retry logic"""
        scraper = scraper_class()

        try:
            await scraper.initialize()
            result = await scraper.scrape(job.ticker)
            return result
        finally:
            await scraper.cleanup()

    async def _save_result(self, job: Job, result):
        """Save scraper result to PostgreSQL"""
        try:
            query = """
                INSERT INTO scraper_results
                (job_id, scraper_name, ticker, success, data, error,
                 response_time, executed_at, metadata)
                VALUES
                (:job_id, :scraper_name, :ticker, :success, :data, :error,
                 :response_time, :executed_at, :metadata)
            """

            params = {
                'job_id': job.id,
                'scraper_name': job.scraper_name,
                'ticker': job.ticker,
                'success': result.success,
                'data': json.dumps(result.data) if result.data else None,
                'error': result.error,
                'response_time': result.response_time,
                'executed_at': job.completed_at,
                'metadata': json.dumps(result.metadata) if result.metadata else None,
            }

            db.execute_update(query, params)
            logger.debug(f"Saved result for job {job.id} to database")

        except Exception as e:
            logger.error(f"Error saving result to database: {e}")

    async def _publish_event(self, job: Job, result):
        """Publish job completion event to Redis pub/sub"""
        try:
            event = {
                'event': 'job_completed',
                'job_id': job.id,
                'scraper_name': job.scraper_name,
                'ticker': job.ticker,
                'status': job.status.value,
                'success': result.success,
                'timestamp': datetime.now().isoformat(),
            }

            redis_client.publish('scraper:events', event)
            logger.debug(f"Published event for job {job.id}")

        except Exception as e:
            logger.error(f"Error publishing event: {e}")

    async def _retry_job(self, job: Job):
        """Retry a failed job"""
        try:
            job.retry_count += 1
            job.status = JobStatus.RETRY

            logger.info(f"Retrying job {job.id} (attempt {job.retry_count}/{job.max_retries})")

            # Push back to queue
            await self.job_queue.push(job)

        except Exception as e:
            logger.error(f"Error retrying job: {e}")


# Convenience function to run the full system
async def run_scheduler_system():
    """Run the complete scheduler system"""
    try:
        # Connect to database and Redis
        db.connect()
        redis_client.connect()

        # Initialize components
        scheduler = ScraperScheduler()
        processor = JobProcessor()

        await scheduler.initialize()
        await processor.initialize()

        # Start components
        await scheduler.start()
        await processor.start()

        logger.success("Scheduler system is running")

        # Keep running
        try:
            while True:
                await asyncio.sleep(60)
        except KeyboardInterrupt:
            logger.info("Received shutdown signal")

        # Stop components
        await scheduler.stop()
        await processor.stop()

        # Disconnect
        db.disconnect()
        redis_client.disconnect()

    except Exception as e:
        logger.error(f"Error running scheduler system: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(run_scheduler_system())
