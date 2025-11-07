#!/usr/bin/env python3
"""
Example Script: Job Scheduling and Queue System Usage

Demonstrates how to use the B3 AI Analysis Platform scheduler system.

Author: B3 AI Analysis Platform Team
Date: 2025-11-07
"""

import asyncio
from loguru import logger

from scheduler import (
    Job, JobQueue, JobProcessor, ScraperScheduler,
    JobStatus, JobPriority
)
from database import db
from redis_client import redis_client


async def example_1_create_single_job():
    """Example 1: Create and execute a single job"""
    print("\n" + "="*60)
    print("Example 1: Create and Execute a Single Job")
    print("="*60)

    # Create job queue
    queue = JobQueue()

    # Create a job
    job = Job(
        id=None,  # Auto-generated
        scraper_name="B3",
        ticker="PETR4",
        priority=JobPriority.HIGH,
        max_retries=3,
        metadata={'example': 'single_job'}
    )

    print(f"\nCreated job: {job.id}")
    print(f"  Scraper: {job.scraper_name}")
    print(f"  Ticker: {job.ticker}")
    print(f"  Priority: {job.priority.value}")

    # Push to queue
    success = await queue.push(job)
    print(f"\nJob pushed to queue: {success}")

    # Check queue status
    status = await queue.get_queue_length()
    print(f"\nQueue status:")
    print(f"  High priority: {status['high']}")
    print(f"  Normal priority: {status['normal']}")
    print(f"  Low priority: {status['low']}")

    # Get job back
    retrieved_job = await queue.get_job(job.id)
    print(f"\nRetrieved job: {retrieved_job.id}")
    print(f"  Status: {retrieved_job.status.value}")


async def example_2_batch_jobs():
    """Example 2: Create multiple jobs with different priorities"""
    print("\n" + "="*60)
    print("Example 2: Create Batch Jobs with Priorities")
    print("="*60)

    queue = JobQueue()

    # Define tickers and priorities
    jobs_config = [
        ("PETR4", JobPriority.HIGH),
        ("VALE3", JobPriority.HIGH),
        ("ITUB4", JobPriority.NORMAL),
        ("BBDC4", JobPriority.NORMAL),
        ("MGLU3", JobPriority.LOW),
    ]

    job_ids = []

    for ticker, priority in jobs_config:
        job = Job(
            id=None,
            scraper_name="B3",
            ticker=ticker,
            priority=priority,
            metadata={'batch': 'example_2'}
        )

        await queue.push(job)
        job_ids.append(job.id)

        print(f"Created {priority.value:6s} priority job for {ticker}: {job.id}")

    print(f"\nCreated {len(job_ids)} jobs")

    # Check queue status
    status = await queue.get_queue_length()
    print(f"\nQueue status:")
    print(f"  High priority: {status['high']}")
    print(f"  Normal priority: {status['normal']}")
    print(f"  Low priority: {status['low']}")
    print(f"  Total: {sum(status.values())}")


async def example_3_process_jobs():
    """Example 3: Start job processor to execute jobs"""
    print("\n" + "="*60)
    print("Example 3: Process Jobs with Worker Pool")
    print("="*60)

    # Initialize job processor
    processor = JobProcessor(worker_count=2)
    await processor.initialize()

    print(f"\nInitialized JobProcessor with {processor.worker_count} workers")
    print(f"Loaded {len(processor._scrapers)} scrapers:")
    for scraper_name in list(processor._scrapers.keys())[:10]:
        print(f"  - {scraper_name}")

    # Start processing (run for 30 seconds)
    print("\nStarting job processor for 30 seconds...")
    await processor.start()

    # Let it run for 30 seconds
    await asyncio.sleep(30)

    # Stop processor
    print("\nStopping job processor...")
    await processor.stop()

    print("Job processor stopped")


async def example_4_scheduler():
    """Example 4: Run scheduler with schedules"""
    print("\n" + "="*60)
    print("Example 4: Run Scheduler with Cron Jobs")
    print("="*60)

    # Initialize scheduler
    scheduler = ScraperScheduler()
    await scheduler.initialize()

    print(f"\nInitialized ScraperScheduler")
    print(f"Loaded {len(scheduler.schedules)} schedules:")

    for name, config in list(scheduler.schedules.items())[:5]:
        enabled = "✓" if config.get('enabled') else "✗"
        print(f"  {enabled} {name}: {config.get('scraper')} ({config.get('type')})")

    # Start scheduler
    await scheduler.start()
    print("\nScheduler started")

    # Get scheduled jobs
    jobs = scheduler.get_jobs()
    print(f"\nScheduled jobs ({len(jobs)}):")
    for job in jobs[:5]:
        print(f"  {job['name']}: next run at {job['next_run_time']}")

    # Run for 60 seconds
    print("\nRunning scheduler for 60 seconds...")
    await asyncio.sleep(60)

    # Stop scheduler
    await scheduler.stop()
    print("Scheduler stopped")


async def example_5_manual_job_execution():
    """Example 5: Manually execute a job without queue"""
    print("\n" + "="*60)
    print("Example 5: Manual Job Execution (Without Queue)")
    print("="*60)

    from scrapers.b3_scraper import B3Scraper

    # Create scraper instance
    scraper = B3Scraper()

    print(f"\nCreated scraper: {scraper.name}")
    print(f"  Source: {scraper.source}")
    print(f"  Requires login: {scraper.requires_login}")

    # Execute scrape
    ticker = "PETR4"
    print(f"\nScraping {ticker}...")

    result = await scraper.scrape_with_retry(ticker)

    print(f"\nResult:")
    print(f"  Success: {result.success}")
    print(f"  Response time: {result.response_time:.2f}s")

    if result.success:
        print(f"  Data keys: {list(result.data.keys()) if result.data else 'None'}")
    else:
        print(f"  Error: {result.error}")

    # Cleanup
    await scraper.cleanup()


async def example_6_job_lifecycle():
    """Example 6: Demonstrate complete job lifecycle"""
    print("\n" + "="*60)
    print("Example 6: Complete Job Lifecycle")
    print("="*60)

    queue = JobQueue()

    # Create job
    job = Job(
        id=None,
        scraper_name="B3",
        ticker="VALE3",
        priority=JobPriority.NORMAL,
    )

    print(f"\n1. Created job: {job.id}")
    print(f"   Status: {job.status.value}")

    # Push to queue
    await queue.push(job)
    print(f"\n2. Pushed to queue")

    # Update status to running
    await queue.update_status(job.id, JobStatus.RUNNING)
    print(f"\n3. Updated status to: RUNNING")

    # Simulate processing
    await asyncio.sleep(2)

    # Update job with results
    job.status = JobStatus.COMPLETED
    job.result = {
        "ticker": "VALE3",
        "company_name": "Vale S.A.",
        "price": 65.50,
    }
    await queue.update_job(job)
    await queue.update_status(job.id, JobStatus.COMPLETED)

    print(f"\n4. Job completed")

    # Retrieve final job state
    final_job = await queue.get_job(job.id)
    print(f"\n5. Final job state:")
    print(f"   Status: {final_job.status.value}")
    print(f"   Result: {final_job.result}")


async def example_7_cancel_job():
    """Example 7: Cancel a pending job"""
    print("\n" + "="*60)
    print("Example 7: Cancel a Pending Job")
    print("="*60)

    queue = JobQueue()

    # Create job
    job = Job(
        id=None,
        scraper_name="B3",
        ticker="ITUB4",
        priority=JobPriority.LOW,
    )

    print(f"\nCreated job: {job.id}")
    print(f"  Status: {job.status.value}")

    # Push to queue
    await queue.push(job)
    print(f"\nPushed to queue")

    # Check queue
    status = await queue.get_queue_length()
    print(f"\nQueue status before cancel:")
    print(f"  Low priority: {status['low']}")

    # Cancel job
    success = await queue.cancel_job(job.id)
    print(f"\nJob cancelled: {success}")

    # Check status
    job_status = await queue.get_status(job.id)
    print(f"Job status: {job_status.value if job_status else 'None'}")

    # Check queue again
    status = await queue.get_queue_length()
    print(f"\nQueue status after cancel:")
    print(f"  Low priority: {status['low']}")


async def main():
    """Run all examples"""
    print("="*60)
    print("Job Scheduling and Queue System - Examples")
    print("="*60)

    # Connect to services
    print("\nConnecting to database and Redis...")
    db.connect()
    redis_client.connect()
    print("✓ Connected")

    # Run examples
    try:
        # Uncomment the examples you want to run

        # Basic examples
        await example_1_create_single_job()
        await example_2_batch_jobs()

        # Lifecycle examples
        await example_6_job_lifecycle()
        await example_7_cancel_job()

        # Manual execution
        await example_5_manual_job_execution()

        # Advanced examples (these take longer)
        # await example_3_process_jobs()  # Runs for 30 seconds
        # await example_4_scheduler()      # Runs for 60 seconds

        print("\n" + "="*60)
        print("All examples completed successfully!")
        print("="*60)

    except Exception as e:
        logger.error(f"Error running examples: {e}")
        raise

    finally:
        # Disconnect
        print("\nDisconnecting...")
        db.disconnect()
        redis_client.disconnect()
        print("✓ Disconnected")


if __name__ == "__main__":
    asyncio.run(main())
