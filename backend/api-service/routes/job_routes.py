"""
Job Management API Routes

Provides REST API endpoints for managing scraper jobs:
- Create one-time jobs
- Get job status
- List recent jobs
- Cancel pending jobs
- Retry failed jobs

Author: B3 AI Analysis Platform Team
Date: 2025-11-07
"""

import sys
from pathlib import Path

# Add python-scrapers to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python-scrapers"))

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from enum import Enum

from fastapi import APIRouter, HTTPException, Query, Path as PathParam
from pydantic import BaseModel, Field
from loguru import logger

from scheduler import Job, JobQueue, JobStatus, JobPriority
from database import db
from redis_client import redis_client


# Pydantic models for API requests/responses
class CreateJobRequest(BaseModel):
    """Request model for creating a new job"""
    scraper_name: str = Field(..., description="Name of the scraper to execute")
    ticker: str = Field(..., description="Stock ticker symbol (e.g., PETR4)")
    priority: str = Field(default="normal", description="Job priority: high, normal, or low")
    max_retries: int = Field(default=3, description="Maximum number of retry attempts")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional job metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "scraper_name": "B3",
                "ticker": "PETR4",
                "priority": "high",
                "max_retries": 3,
                "metadata": {"user_id": "123", "source": "api"}
            }
        }


class JobResponse(BaseModel):
    """Response model for job data"""
    id: str
    scraper_name: str
    ticker: str
    priority: str
    status: str
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    retry_count: int
    max_retries: int
    metadata: Optional[Dict[str, Any]] = None


class JobListResponse(BaseModel):
    """Response model for job list"""
    jobs: List[JobResponse]
    total: int
    page: int
    page_size: int


class QueueStatusResponse(BaseModel):
    """Response model for queue status"""
    high: int
    normal: int
    low: int
    total: int


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: Optional[str] = None


# Create router
router = APIRouter(prefix="/api/jobs", tags=["jobs"])


# Initialize job queue
job_queue = JobQueue()


@router.post("/create", response_model=JobResponse, status_code=201)
async def create_job(request: CreateJobRequest):
    """
    Create a new one-time scraper job

    Creates a job and adds it to the queue for processing.
    The job will be executed by the next available worker.

    Args:
        request: Job creation request with scraper name, ticker, and options

    Returns:
        JobResponse: Created job details

    Raises:
        HTTPException: If job creation fails
    """
    try:
        # Validate priority
        try:
            priority = JobPriority(request.priority.lower())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid priority: {request.priority}. Must be high, normal, or low"
            )

        # Create job
        job = Job(
            id=None,  # Will be auto-generated
            scraper_name=request.scraper_name,
            ticker=request.ticker.upper(),
            priority=priority,
            max_retries=request.max_retries,
            metadata=request.metadata or {},
        )

        # Add API creation metadata
        job.metadata['created_via'] = 'api'
        job.metadata['api_created_at'] = datetime.now().isoformat()

        # Push to queue
        success = await job_queue.push(job)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to add job to queue"
            )

        logger.info(f"Job {job.id} created via API: {job.scraper_name} - {job.ticker}")

        # Return job details
        return JobResponse(**job.to_dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str = PathParam(..., description="Job ID")):
    """
    Get job status and details

    Retrieves complete information about a specific job including
    its current status, results, and execution details.

    Args:
        job_id: Unique job identifier

    Returns:
        JobResponse: Job details

    Raises:
        HTTPException: If job not found
    """
    try:
        # Get job from queue
        job = await job_queue.get_job(job_id)

        if not job:
            raise HTTPException(
                status_code=404,
                detail=f"Job {job_id} not found"
            )

        return JobResponse(**job.to_dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job {job_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list", response_model=JobListResponse)
async def list_jobs(
    status: Optional[str] = Query(None, description="Filter by status"),
    scraper_name: Optional[str] = Query(None, description="Filter by scraper name"),
    ticker: Optional[str] = Query(None, description="Filter by ticker"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """
    List recent jobs with filtering and pagination

    Returns a paginated list of jobs with optional filtering by
    status, scraper name, or ticker symbol.

    Args:
        status: Filter by job status (pending, running, completed, failed)
        scraper_name: Filter by scraper name
        ticker: Filter by stock ticker
        page: Page number (1-indexed)
        page_size: Number of items per page (1-100)

    Returns:
        JobListResponse: Paginated list of jobs

    Raises:
        HTTPException: If query fails
    """
    try:
        # Build query
        conditions = []
        params = {}

        if status:
            conditions.append("status = :status")
            params['status'] = status

        if scraper_name:
            conditions.append("scraper_name = :scraper_name")
            params['scraper_name'] = scraper_name

        if ticker:
            conditions.append("ticker = :ticker")
            params['ticker'] = ticker.upper()

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        # Get total count
        count_query = f"""
            SELECT COUNT(*) as total
            FROM scraper_results
            WHERE {where_clause}
        """
        count_result = db.execute_query(count_query, params)
        total = count_result[0][0] if count_result else 0

        # Get paginated results
        offset = (page - 1) * page_size
        query = f"""
            SELECT
                job_id, scraper_name, ticker, success,
                data, error, response_time, executed_at, metadata
            FROM scraper_results
            WHERE {where_clause}
            ORDER BY executed_at DESC
            LIMIT :limit OFFSET :offset
        """
        params.update({'limit': page_size, 'offset': offset})

        results = db.execute_query(query, params)

        # Convert to JobResponse objects
        jobs = []
        for row in results:
            job_data = {
                'id': row[0],
                'scraper_name': row[1],
                'ticker': row[2],
                'status': 'completed' if row[3] else 'failed',
                'priority': 'normal',
                'created_at': row[7].isoformat() if row[7] else None,
                'started_at': row[7].isoformat() if row[7] else None,
                'completed_at': row[7].isoformat() if row[7] else None,
                'result': row[4] if row[3] else None,
                'error': row[5],
                'retry_count': 0,
                'max_retries': 3,
                'metadata': row[8],
            }
            jobs.append(JobResponse(**job_data))

        return JobListResponse(
            jobs=jobs,
            total=total,
            page=page,
            page_size=page_size,
        )

    except Exception as e:
        logger.error(f"Error listing jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{job_id}")
async def cancel_job(job_id: str = PathParam(..., description="Job ID")):
    """
    Cancel a pending job

    Removes a pending job from the queue. Only jobs with status
    'pending' can be cancelled. Running or completed jobs cannot
    be cancelled.

    Args:
        job_id: Unique job identifier

    Returns:
        dict: Success message

    Raises:
        HTTPException: If job not found or cannot be cancelled
    """
    try:
        # Get job
        job = await job_queue.get_job(job_id)

        if not job:
            raise HTTPException(
                status_code=404,
                detail=f"Job {job_id} not found"
            )

        # Check if job can be cancelled
        if job.status != JobStatus.PENDING:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel job with status {job.status.value}. Only pending jobs can be cancelled."
            )

        # Cancel job
        success = await job_queue.cancel_job(job_id)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to cancel job"
            )

        logger.info(f"Job {job_id} cancelled via API")

        return {
            "message": f"Job {job_id} cancelled successfully",
            "job_id": job_id,
            "status": "cancelled"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling job {job_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{job_id}/retry", response_model=JobResponse)
async def retry_job(job_id: str = PathParam(..., description="Job ID")):
    """
    Retry a failed job

    Creates a new job based on a failed job's configuration.
    The original job is not modified; a new job is created and
    added to the queue.

    Args:
        job_id: Unique identifier of the failed job to retry

    Returns:
        JobResponse: New job details

    Raises:
        HTTPException: If job not found or is not in failed state
    """
    try:
        # Get original job
        original_job = await job_queue.get_job(job_id)

        if not original_job:
            raise HTTPException(
                status_code=404,
                detail=f"Job {job_id} not found"
            )

        # Check if job failed
        if original_job.status != JobStatus.FAILED:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot retry job with status {original_job.status.value}. Only failed jobs can be retried."
            )

        # Create new job with same configuration
        new_job = Job(
            id=None,  # Will be auto-generated
            scraper_name=original_job.scraper_name,
            ticker=original_job.ticker,
            priority=original_job.priority,
            max_retries=original_job.max_retries,
            metadata={
                **(original_job.metadata or {}),
                'retried_from': original_job.id,
                'retry_via': 'api',
                'retry_at': datetime.now().isoformat(),
            }
        )

        # Push to queue
        success = await job_queue.push(new_job)

        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to add retry job to queue"
            )

        logger.info(f"Job {original_job.id} retried as {new_job.id} via API")

        return JobResponse(**new_job.to_dict())

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrying job {job_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/queue/status", response_model=QueueStatusResponse)
async def get_queue_status():
    """
    Get current queue status

    Returns the number of pending jobs in each priority queue.

    Returns:
        QueueStatusResponse: Queue lengths by priority

    Raises:
        HTTPException: If query fails
    """
    try:
        queue_length = await job_queue.get_queue_length()

        total = queue_length['high'] + queue_length['normal'] + queue_length['low']

        return QueueStatusResponse(
            high=queue_length['high'],
            normal=queue_length['normal'],
            low=queue_length['low'],
            total=total,
        )

    except Exception as e:
        logger.error(f"Error getting queue status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_job_stats():
    """
    Get job execution statistics

    Returns summary statistics about job execution including
    success rates, average execution times, and recent activity.

    Returns:
        dict: Job statistics

    Raises:
        HTTPException: If query fails
    """
    try:
        # Get statistics from database
        stats_query = """
            SELECT
                COUNT(*) as total_jobs,
                COUNT(CASE WHEN success = true THEN 1 END) as successful_jobs,
                COUNT(CASE WHEN success = false THEN 1 END) as failed_jobs,
                AVG(response_time) as avg_response_time,
                MAX(executed_at) as last_execution
            FROM scraper_results
            WHERE executed_at >= NOW() - INTERVAL '24 hours'
        """

        result = db.execute_query(stats_query)

        if result:
            row = result[0]
            total_jobs = row[0] or 0
            successful_jobs = row[1] or 0
            failed_jobs = row[2] or 0
            avg_response_time = float(row[3]) if row[3] else 0
            last_execution = row[4].isoformat() if row[4] else None

            success_rate = (successful_jobs / total_jobs * 100) if total_jobs > 0 else 0

            return {
                "period": "last_24_hours",
                "total_jobs": total_jobs,
                "successful_jobs": successful_jobs,
                "failed_jobs": failed_jobs,
                "success_rate": round(success_rate, 2),
                "avg_response_time_seconds": round(avg_response_time, 2),
                "last_execution": last_execution,
            }
        else:
            return {
                "period": "last_24_hours",
                "total_jobs": 0,
                "successful_jobs": 0,
                "failed_jobs": 0,
                "success_rate": 0,
                "avg_response_time_seconds": 0,
                "last_execution": None,
            }

    except Exception as e:
        logger.error(f"Error getting job stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/by-scraper")
async def get_stats_by_scraper():
    """
    Get job statistics grouped by scraper

    Returns execution statistics for each scraper including
    success rates and average execution times.

    Returns:
        dict: Statistics by scraper

    Raises:
        HTTPException: If query fails
    """
    try:
        query = """
            SELECT
                scraper_name,
                COUNT(*) as total_jobs,
                COUNT(CASE WHEN success = true THEN 1 END) as successful_jobs,
                COUNT(CASE WHEN success = false THEN 1 END) as failed_jobs,
                AVG(response_time) as avg_response_time
            FROM scraper_results
            WHERE executed_at >= NOW() - INTERVAL '24 hours'
            GROUP BY scraper_name
            ORDER BY total_jobs DESC
        """

        results = db.execute_query(query)

        scrapers = []
        for row in results:
            scraper_name = row[0]
            total_jobs = row[1] or 0
            successful_jobs = row[2] or 0
            failed_jobs = row[3] or 0
            avg_response_time = float(row[4]) if row[4] else 0

            success_rate = (successful_jobs / total_jobs * 100) if total_jobs > 0 else 0

            scrapers.append({
                "scraper_name": scraper_name,
                "total_jobs": total_jobs,
                "successful_jobs": successful_jobs,
                "failed_jobs": failed_jobs,
                "success_rate": round(success_rate, 2),
                "avg_response_time_seconds": round(avg_response_time, 2),
            })

        return {
            "period": "last_24_hours",
            "scrapers": scrapers,
        }

    except Exception as e:
        logger.error(f"Error getting stats by scraper: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Health check endpoint
@router.get("/health")
async def health_check():
    """
    Health check endpoint

    Verifies that the job management API is operational and can
    connect to required services (Redis, PostgreSQL).

    Returns:
        dict: Health status
    """
    try:
        # Check Redis
        redis_ok = False
        try:
            redis_client.client.ping()
            redis_ok = True
        except:
            pass

        # Check PostgreSQL
        db_ok = False
        try:
            db.execute_query("SELECT 1")
            db_ok = True
        except:
            pass

        # Get queue status
        queue_status = await job_queue.get_queue_length()

        healthy = redis_ok and db_ok

        return {
            "status": "healthy" if healthy else "degraded",
            "redis": "ok" if redis_ok else "error",
            "database": "ok" if db_ok else "error",
            "queue": queue_status,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


# Export router
__all__ = ['router']
