"""
Main FastAPI Application - B3 AI Analysis Platform API
Entry point for the complete B3 AI Analysis Platform with integrated services
"""
import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import time
from datetime import datetime

# Add python-scrapers to path
sys.path.insert(0, str(Path(__file__).parent.parent / "python-scrapers"))

from routes.scraper_test_routes import router as scraper_router
from routes.config_routes import router as config_router
from routes.job_routes import router as job_router
from routes.oauth_routes import router as oauth_router
# Temporarily disabled - requires analysis-service volume mount
# from routes.analysis_routes import router as analysis_router

# Import database and redis clients
try:
    from database import db
    from redis_client import redis_client
except ImportError as e:
    logger.warning(f"Could not import database/redis modules: {e}")
    db = None
    redis_client = None


# Initialize FastAPI app
app = FastAPI(
    title="B3 AI Analysis Platform - Complete API",
    description="""
    Comprehensive REST API for the B3 AI Analysis Platform with full integration.

    ## Features
    - 🔍 **27 Data Scrapers**: Fundamental, Technical, News, AI Analysis
    - 📊 **Data Aggregation**: Multi-source data consolidation
    - 🤖 **AI Analysis**: Automated stock analysis with AI models
    - ⚡ **Real-time Processing**: Job queue and scheduler system
    - 🔄 **Health Monitoring**: Comprehensive service health checks
    - 📈 **REST API**: Complete CRUD operations for all services

    ## Service Categories
    - **Fundamental Analysis**: StatusInvest, Fundamentus, Investsite, Fundamentei, Investidor10
    - **Market Analysis**: Investing.com, ADVFN, Google Finance
    - **Technical Analysis**: TradingView
    - **Official Data**: B3, Banco Central do Brasil (BCB)
    - **Insider Trading**: Griffin
    - **Crypto**: CoinMarketCap
    - **Options**: Opcoes.net.br
    - **AI Analysis**: ChatGPT, Gemini, DeepSeek, Claude, Grok
    - **News**: Bloomberg, Google News, Investing News, Valor, Exame, InfoMoney
    - **Institutional Reports**: Estadão, Mais Retorno

    ## Architecture
    - **Frontend**: Next.js with TypeScript
    - **Backend**: NestJS + FastAPI (Python)
    - **Database**: PostgreSQL with TimescaleDB
    - **Cache**: Redis
    - **Scrapers**: 27 Python scrapers with Selenium/Playwright
    - **Queue**: Redis-based job queue with APScheduler
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS - Updated for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3100",  # Frontend dev
        "http://localhost:3000",  # Next.js default
        "http://frontend:3000",   # Docker frontend
        "*"                       # Allow all (adjust in production)
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Middleware for logging requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing"""
    start_time = time.time()

    # Log request
    logger.info(f"→ {request.method} {request.url.path}")

    # Process request
    response = await call_next(request)

    # Log response
    duration = time.time() - start_time
    logger.info(
        f"← {request.method} {request.url.path} "
        f"[{response.status_code}] {duration:.2f}s"
    )

    return response


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"🚨 EXCEPTION for {request.url.path}: {exc}", exc_info=True)
    logger.error(f"🚨 Exception type: {type(exc).__name__}")
    logger.error(f"🚨 Exception details: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc),
            "path": request.url.path,
        }
    )


# Include routers
app.include_router(scraper_router)
app.include_router(config_router)
app.include_router(job_router)
app.include_router(oauth_router)

# Temporarily disabled - requires analysis-service volume mount
# app.include_router(analysis_router)


# Root endpoint
@app.get(
    "/",
    summary="API Root",
    description="Welcome endpoint with API information",
    tags=["Root"]
)
async def root():
    """API root endpoint"""
    return {
        "name": "B3 AI Analysis Platform - Scraper Test API",
        "version": "1.0.0",
        "description": "REST API for testing and monitoring 27 scrapers with configuration management",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "scrapers": {
                "list_scrapers": "GET /api/scrapers/list",
                "test_scraper": "POST /api/scrapers/test",
                "test_all": "POST /api/scrapers/test-all",
                "health": "GET /api/scrapers/health",
                "cookies_status": "GET /api/scrapers/cookies/status",
                "ping": "GET /api/scrapers/ping",
            },
            "config": {
                "status": "GET /api/config/status",
                "validate": "GET /api/config/validate",
                "reload": "POST /api/config/reload",
                "health": "GET /api/config/health",
                "all": "GET /api/config/all",
                "categories": "GET /api/config/categories",
            },
            "jobs": {
                "create_job": "POST /api/jobs/create",
                "get_job": "GET /api/jobs/{job_id}",
                "list_jobs": "GET /api/jobs/list",
                "cancel_job": "DELETE /api/jobs/{job_id}",
                "retry_job": "POST /api/jobs/{job_id}/retry",
                "queue_status": "GET /api/jobs/queue/status",
                "stats_summary": "GET /api/jobs/stats/summary",
                "stats_by_scraper": "GET /api/jobs/stats/by-scraper",
                "health": "GET /api/jobs/health",
            },
            "analysis": {
                "stock_analysis": "GET /api/analysis/stock/{ticker}",
                "fundamental": "GET /api/analysis/stock/{ticker}/fundamental",
                "technical": "GET /api/analysis/stock/{ticker}/technical",
                "news": "GET /api/analysis/stock/{ticker}/news",
                "insider": "GET /api/analysis/stock/{ticker}/insider",
                "compare": "GET /api/analysis/compare?tickers=PETR4&tickers=VALE3",
                "sector": "GET /api/analysis/sector/{sector}",
                "stats": "GET /api/analysis/stats",
                "health": "GET /api/analysis/health",
            },
            "ai_analysis": {
                "analyze_stock": "POST /api/analysis/ai/{ticker}",
                "latest_analysis": "GET /api/analysis/ai/{ticker}/latest",
                "batch_analysis": "POST /api/analysis/ai/batch",
                "consensus": "GET /api/analysis/ai/consensus/{ticker}",
                "cache_stats": "GET /api/analysis/ai/cache/stats",
                "clear_cache": "DELETE /api/analysis/ai/cache/{ticker}",
                "models": "GET /api/analysis/ai/models",
                "examples": "GET /api/analysis/ai/examples/context",
                "health": "GET /api/analysis/ai/health",
            },
            "oauth": {
                "start_session": "POST /api/oauth/session/start",
                "get_status": "GET /api/oauth/session/status",
                "confirm_login": "POST /api/oauth/session/confirm-login",
                "skip_site": "POST /api/oauth/session/skip-site",
                "go_back": "POST /api/oauth/session/go-back",
                "save_cookies": "POST /api/oauth/session/save",
                "cancel_session": "DELETE /api/oauth/session/cancel",
                "get_vnc_url": "GET /api/oauth/vnc-url",
                "get_sites": "GET /api/oauth/sites",
                "navigate_to_site": "POST /api/oauth/navigate/{site_id}",
                "health": "GET /api/oauth/health",
            }
        }
    }


# Comprehensive health check
@app.get(
    "/health",
    summary="Complete System Health Check",
    description="Check health of all services: API, Database, Redis, Scrapers",
    tags=["Health"]
)
async def health_check():
    """
    Comprehensive health check for all system components

    Checks:
    - API service status
    - Database connectivity
    - Redis connectivity
    - Scraper system readiness

    Returns detailed status for each component
    """
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "b3-ai-analysis-platform-api",
        "version": "2.0.0",
        "components": {}
    }

    issues = []

    # Check API
    health_status["components"]["api"] = {
        "status": "healthy",
        "message": "FastAPI service is running"
    }

    # Check Database
    try:
        if db:
            db.execute_query("SELECT 1")
            health_status["components"]["database"] = {
                "status": "healthy",
                "message": "PostgreSQL connection active"
            }
        else:
            health_status["components"]["database"] = {
                "status": "unavailable",
                "message": "Database module not loaded"
            }
            issues.append("database")
    except Exception as e:
        health_status["components"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
        issues.append("database")

    # Check Redis
    try:
        if redis_client and redis_client.client:
            redis_client.client.ping()
            health_status["components"]["redis"] = {
                "status": "healthy",
                "message": "Redis connection active"
            }
        else:
            health_status["components"]["redis"] = {
                "status": "unavailable",
                "message": "Redis module not loaded"
            }
            issues.append("redis")
    except Exception as e:
        health_status["components"]["redis"] = {
            "status": "unhealthy",
            "message": f"Redis connection failed: {str(e)}"
        }
        issues.append("redis")

    # Check Scrapers
    try:
        from controllers.scraper_test_controller import scraper_controller
        scraper_count = len(scraper_controller.SCRAPERS_REGISTRY)
        health_status["components"]["scrapers"] = {
            "status": "healthy",
            "message": f"{scraper_count} scrapers registered",
            "total_scrapers": scraper_count
        }
    except Exception as e:
        health_status["components"]["scrapers"] = {
            "status": "degraded",
            "message": f"Scraper controller error: {str(e)}"
        }
        issues.append("scrapers")

    # Set overall status
    if len(issues) > 0:
        if len(issues) >= 3:
            health_status["status"] = "unhealthy"
        else:
            health_status["status"] = "degraded"
        health_status["issues"] = issues

    return health_status


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Initialize all services on application startup

    Connects to:
    - PostgreSQL database
    - Redis cache/queue
    - Loads scraper registry
    """
    logger.info("=" * 80)
    logger.info("🚀 B3 AI Analysis Platform - Complete API Starting...")
    logger.info("=" * 80)
    logger.info("Version: 2.0.0")
    logger.info("Environment: Development")
    logger.info("=" * 80)

    # Initialize Database
    try:
        if db:
            db.connect()
            logger.success("✓ Database connected")
        else:
            logger.warning("⚠ Database module not available")
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")

    # Initialize Redis
    try:
        if redis_client:
            redis_client.connect()
            logger.success("✓ Redis connected")
        else:
            logger.warning("⚠ Redis module not available")
    except Exception as e:
        logger.error(f"✗ Redis connection failed: {e}")

    # Load Scrapers
    try:
        from controllers.scraper_test_controller import scraper_controller
        scraper_count = len(scraper_controller.SCRAPERS_REGISTRY)
        logger.success(f"✓ {scraper_count} scrapers registered")
    except Exception as e:
        logger.error(f"✗ Failed to load scrapers: {e}")

    logger.info("=" * 80)
    logger.info("📚 API Documentation:")
    logger.info("   - Swagger UI: http://localhost:8000/docs")
    logger.info("   - ReDoc: http://localhost:8000/redoc")
    logger.info("=" * 80)
    logger.info("🔌 Endpoints:")
    logger.info("   - Scrapers: /api/scrapers/*")
    logger.info("   - Jobs: /api/jobs/*")
    logger.info("   - Config: /api/config/*")
    logger.info("   - Analysis: /api/analysis/*")
    logger.info("   - Health: /health")
    logger.info("=" * 80)
    logger.success("🎉 API is ready to accept requests!")
    logger.info("=" * 80)


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup all services on application shutdown

    Disconnects from:
    - PostgreSQL database
    - Redis cache/queue
    """
    logger.info("=" * 80)
    logger.info("🛑 B3 AI Analysis Platform - API Shutting Down...")
    logger.info("=" * 80)

    # Disconnect Database
    try:
        if db:
            db.disconnect()
            logger.info("✓ Database disconnected")
    except Exception as e:
        logger.error(f"✗ Database disconnect error: {e}")

    # Disconnect Redis
    try:
        if redis_client:
            redis_client.disconnect()
            logger.info("✓ Redis disconnected")
    except Exception as e:
        logger.error(f"✗ Redis disconnect error: {e}")

    logger.info("=" * 80)
    logger.success("👋 Shutdown complete")
    logger.info("=" * 80)


# Run with: uvicorn main:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
