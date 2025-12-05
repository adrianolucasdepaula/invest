"""
Scraper Test Routes - FastAPI endpoints for scraper testing
Provides comprehensive REST API for testing and monitoring scrapers
"""
from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field
from loguru import logger

from controllers.scraper_test_controller import scraper_controller


# Router instance
router = APIRouter(prefix="/api/scrapers", tags=["Scrapers"])


# Request/Response Models
class TestScraperRequest(BaseModel):
    """Request model for testing a specific scraper"""
    scraper: str = Field(..., description="Scraper name/ID (e.g., 'FUNDAMENTUS')")
    query: str = Field(..., description="Query parameter (ticker, search term, etc.)")

    class Config:
        json_schema_extra = {
            "example": {
                "scraper": "FUNDAMENTUS",
                "query": "PETR4"
            }
        }


class TestAllScrapersRequest(BaseModel):
    """Request model for testing all scrapers"""
    category: Optional[str] = Field(
        None,
        description="Optional category filter (fundamental_analysis, market_analysis, etc.)"
    )
    max_concurrent: int = Field(
        5,
        description="Maximum number of concurrent tests",
        ge=1,
        le=10
    )
    query: str = Field(
        "PETR4",
        description="Default query for all scrapers"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "category": "fundamental_analysis",
                "max_concurrent": 5,
                "query": "PETR4"
            }
        }


class ScraperListResponse(BaseModel):
    """Response model for scraper list"""
    total: int = Field(..., description="Total number of scrapers")
    public: int = Field(..., description="Number of public scrapers")
    private: int = Field(..., description="Number of scrapers requiring login")
    categories: Dict[str, int] = Field(..., description="Count by category")
    scrapers: list = Field(..., description="List of scrapers with metadata")


class TestResultResponse(BaseModel):
    """Response model for test results"""
    success: bool = Field(..., description="Whether the test succeeded")
    scraper: str = Field(..., description="Scraper name")
    query: str = Field(..., description="Query used")
    data: Optional[Any] = Field(None, description="Scraped data")
    error: Optional[str] = Field(None, description="Error message if failed")
    execution_time: float = Field(..., description="Execution time in seconds")


class HealthStatusResponse(BaseModel):
    """Response model for health status"""
    overall_health: str = Field(..., description="Overall health status")
    total_scrapers: int = Field(..., description="Total number of scrapers")
    healthy: int = Field(..., description="Number of healthy scrapers")
    unhealthy: int = Field(..., description="Number of unhealthy scrapers")
    healthy_percentage: float = Field(..., description="Percentage of healthy scrapers")
    scrapers: list = Field(..., description="Detailed health status per scraper")


class CookiesStatusResponse(BaseModel):
    """Response model for cookies status"""
    exists: bool = Field(..., description="Whether cookies file exists")
    valid: bool = Field(..., description="Whether cookies are valid")
    age_days: Optional[int] = Field(None, description="Age of cookies in days")
    expires_in_days: Optional[int] = Field(None, description="Days until expiration")
    needs_renewal: bool = Field(False, description="Whether cookies need renewal")
    severity: str = Field(..., description="Severity level (ok, warning, critical)")
    action_required: str = Field(..., description="Action required message")


class FundamentalScrapeRequest(BaseModel):
    """Request model for fundamental data aggregated scraping"""
    min_sources: int = Field(
        3,
        description="Minimum number of successful sources required",
        ge=1,
        le=6
    )
    timeout_per_scraper: int = Field(
        60,
        description="Timeout per scraper in seconds",
        ge=10,
        le=120
    )

    class Config:
        json_schema_extra = {
            "example": {
                "min_sources": 3,
                "timeout_per_scraper": 60
            }
        }


class FundamentalScrapeResponse(BaseModel):
    """Response model for fundamental data aggregated scraping"""
    ticker: str = Field(..., description="Stock ticker")
    sources_count: int = Field(..., description="Number of successful sources")
    min_sources_met: bool = Field(..., description="Whether minimum sources requirement was met")
    sources: list = Field(..., description="List of successful source names")
    failed_sources: list = Field(..., description="List of failed source names")
    execution_time: float = Field(..., description="Total execution time in seconds")
    data: list = Field(..., description="Data from each successful source")


# Endpoints

@router.get(
    "/list",
    response_model=ScraperListResponse,
    summary="List all registered scrapers",
    description="""
    List all 27 registered scrapers with their metadata.

    Optionally filter by category:
    - fundamental_analysis
    - market_analysis
    - technical_analysis
    - official_data
    - insider_trading
    - crypto
    - options
    - ai_analysis
    - news
    - institutional_reports
    """,
    responses={
        200: {
            "description": "List of scrapers retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "total": 27,
                        "public": 10,
                        "private": 17,
                        "categories": {
                            "fundamental_analysis": 5,
                            "market_analysis": 4,
                            "news": 6
                        },
                        "scrapers": [
                            {
                                "id": "FUNDAMENTUS",
                                "name": "Fundamentus",
                                "source": "FUNDAMENTUS",
                                "requires_login": False,
                                "category": "fundamental_analysis",
                                "description": "Dados fundamentalistas públicos",
                                "url": "https://www.fundamentus.com.br/"
                            }
                        ]
                    }
                }
            }
        }
    }
)
async def list_scrapers(
    category: Optional[str] = Query(
        None,
        description="Filter by category (e.g., 'fundamental_analysis', 'news')"
    )
) -> Dict[str, Any]:
    """
    List all registered scrapers with metadata

    Returns:
    - Total count of scrapers
    - Count by access type (public/private)
    - Count by category
    - Detailed list with metadata for each scraper
    """
    try:
        logger.info(f"Listing scrapers (category={category})")
        result = await scraper_controller.list_scrapers(category=category)
        return result
    except Exception as e:
        logger.error(f"Error listing scrapers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/test",
    response_model=TestResultResponse,
    summary="Test a specific scraper",
    description="""
    Test a specific scraper with a given query.

    Examples:
    - Fundamentus: { "scraper": "FUNDAMENTUS", "query": "PETR4" }
    - BCB: { "scraper": "BCB", "query": "all" }
    - Griffin: { "scraper": "GRIFFIN", "query": "VALE3" }
    """,
    responses={
        200: {
            "description": "Test completed (check 'success' field for result)",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "scraper": "FUNDAMENTUS",
                        "query": "PETR4",
                        "data": {
                            "ticker": "PETR4",
                            "price": 38.50,
                            "pl_ratio": 5.2
                        },
                        "execution_time": 2.34,
                        "timestamp": "2025-11-07T12:00:00"
                    }
                }
            }
        },
        400: {"description": "Invalid request"},
        500: {"description": "Server error"}
    }
)
async def test_scraper(
    request: TestScraperRequest = Body(
        ...,
        example={
            "scraper": "FUNDAMENTUS",
            "query": "PETR4"
        }
    )
) -> Dict[str, Any]:
    """
    Test a specific scraper with a query

    Args:
    - scraper: Name/ID of the scraper (case-insensitive)
    - query: Query parameter (ticker, search term, etc.)

    Returns:
    - Success status
    - Scraped data (if successful)
    - Error message (if failed)
    - Execution time
    - Scraper metadata
    """
    try:
        logger.info(f"Testing scraper: {request.scraper} with query: {request.query}")
        result = await scraper_controller.test_scraper(
            scraper_name=request.scraper,
            query=request.query
        )
        return result
    except Exception as e:
        logger.error(f"Error testing scraper: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/test-all",
    summary="Test all scrapers in parallel",
    description="""
    Test all scrapers in parallel with configurable concurrency.

    Optionally filter by category to test only specific types of scrapers.

    Categories:
    - fundamental_analysis
    - market_analysis
    - technical_analysis
    - official_data
    - insider_trading
    - crypto
    - options
    - ai_analysis
    - news
    - institutional_reports
    """,
    responses={
        200: {
            "description": "All tests completed",
            "content": {
                "application/json": {
                    "example": {
                        "total_tested": 27,
                        "success": 20,
                        "failures": 7,
                        "execution_time": 15.5,
                        "query": "PETR4",
                        "results": [
                            {
                                "scraper": "FUNDAMENTUS",
                                "success": True,
                                "execution_time": 2.3
                            }
                        ]
                    }
                }
            }
        }
    }
)
async def test_all_scrapers(
    request: TestAllScrapersRequest = Body(
        ...,
        example={
            "category": None,
            "max_concurrent": 5,
            "query": "PETR4"
        }
    )
) -> Dict[str, Any]:
    """
    Test all scrapers in parallel

    Args:
    - category: Optional category filter
    - max_concurrent: Maximum number of concurrent tests (1-10)
    - query: Default query for all scrapers

    Returns:
    - Total number of scrapers tested
    - Count of successes and failures
    - Total execution time
    - Individual results for each scraper
    """
    try:
        logger.info(
            f"Testing all scrapers "
            f"(category={request.category}, "
            f"max_concurrent={request.max_concurrent})"
        )
        result = await scraper_controller.test_all_scrapers(
            category=request.category,
            max_concurrent=request.max_concurrent,
            query=request.query
        )
        return result
    except Exception as e:
        logger.error(f"Error testing all scrapers: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/health",
    response_model=HealthStatusResponse,
    summary="Get health status of all scrapers",
    description="""
    Get comprehensive health status for all scrapers.

    Checks:
    - Cookie availability and validity
    - Connectivity (for public scrapers)
    - Authentication status

    Returns overall health rating:
    - healthy: 80%+ scrapers operational
    - warning: 50-80% scrapers operational
    - unhealthy: <50% scrapers operational
    """,
    responses={
        200: {
            "description": "Health status retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "overall_health": "healthy",
                        "total_scrapers": 27,
                        "healthy": 24,
                        "unhealthy": 3,
                        "healthy_percentage": 88.9,
                        "scrapers": [
                            {
                                "id": "FUNDAMENTUS",
                                "name": "Fundamentus",
                                "category": "fundamental_analysis",
                                "requires_login": False,
                                "status": "healthy",
                                "message": "Public scraper, no authentication required"
                            }
                        ]
                    }
                }
            }
        }
    }
)
async def get_scrapers_health() -> Dict[str, Any]:
    """
    Get health status of all scrapers

    Performs comprehensive health checks:
    - Public scrapers: Assumed healthy (could ping URLs)
    - OAuth scrapers: Checks cookie status and expiration

    Returns:
    - Overall health status (healthy/warning/unhealthy)
    - Count of healthy vs unhealthy scrapers
    - Detailed status for each scraper
    - Percentage of operational scrapers
    """
    try:
        logger.info("Checking scrapers health")
        result = await scraper_controller.get_scrapers_health()
        return result
    except Exception as e:
        logger.error(f"Error checking health: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/cookies/status",
    response_model=CookiesStatusResponse,
    summary="Check Google OAuth cookies status",
    description="""
    Check the status of saved Google OAuth cookies.

    Returns:
    - Whether cookies file exists
    - Cookie validity
    - Age in days
    - Days until expiration
    - Whether renewal is needed
    - Action required message
    - Renewal command

    Cookies are used for scrapers requiring Google OAuth authentication.
    They should be renewed every 7 days.
    """,
    responses={
        200: {
            "description": "Cookies status retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "exists": True,
                        "valid": True,
                        "age_days": 3,
                        "expires_in_days": 4,
                        "needs_renewal": False,
                        "severity": "ok",
                        "action_required": "None - cookies are valid",
                        "sites_covered": [
                            "fundamentei.com",
                            "investidor10.com.br"
                        ],
                        "renewal_command": "docker exec -it invest_scrapers python scripts/save_google_cookies.py"
                    }
                }
            }
        }
    }
)
async def get_cookies_status() -> Dict[str, Any]:
    """
    Check Google OAuth cookies status

    Uses the CookieManager to check:
    - Cookie file existence
    - Cookie validity
    - Age and expiration
    - Sites covered by cookies

    Returns:
    - Detailed cookie status
    - Severity level (ok/warning/critical)
    - Action required
    - Renewal instructions
    """
    try:
        logger.info("Checking cookies status")
        result = await scraper_controller.get_cookies_status()
        return result
    except Exception as e:
        logger.error(f"Error checking cookies: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/fundamental/{ticker}",
    response_model=FundamentalScrapeResponse,
    summary="Scrape fundamental data from multiple sources",
    description="""
    Scrape fundamental data for a stock ticker from multiple sources.

    Executes scrapers in priority order until minimum sources requirement is met.

    **Priority Order (Fundamental Scrapers):**
    1. FUNDAMENTUS - Brazilian fundamental data (38 campos)
    2. STATUSINVEST - Comprehensive fundamentals (17 campos)
    3. INVESTSITE - Detailed fundamentals (39 campos)
    4. INVESTIDOR10 - Rankings and indicators
    5. GRIFFIN - Insider trading data
    6. GOOGLEFINANCE - Real-time market data

    **Use Case:**
    This endpoint is designed for fallback scenarios when TypeScript scrapers
    in the NestJS backend fail to meet the minimum sources requirement (3).
    """,
    responses={
        200: {
            "description": "Fundamental data scraped successfully",
            "content": {
                "application/json": {
                    "example": {
                        "ticker": "PETR4",
                        "sources_count": 4,
                        "min_sources_met": True,
                        "sources": ["FUNDAMENTUS", "STATUSINVEST", "INVESTSITE", "INVESTIDOR10"],
                        "failed_sources": ["GRIFFIN"],
                        "execution_time": 25.34,
                        "data": [
                            {
                                "source": "FUNDAMENTUS",
                                "success": True,
                                "execution_time": 5.2,
                                "data": {"ticker": "PETR4", "pl_ratio": 5.2}
                            }
                        ]
                    }
                }
            }
        },
        400: {"description": "Invalid ticker format"},
        500: {"description": "Server error"}
    }
)
async def scrape_fundamental_data(
    ticker: str,
    request: FundamentalScrapeRequest = Body(
        default=FundamentalScrapeRequest(),
        example={
            "min_sources": 3,
            "timeout_per_scraper": 60
        }
    )
) -> Dict[str, Any]:
    """
    Scrape fundamental data from multiple sources with guaranteed minimum sources.

    This endpoint implements the fallback strategy for cross-validation:
    - Executes scrapers in priority order
    - Stops when minimum sources requirement is met
    - Returns both successful and failed sources for debugging

    Args:
    - ticker: Stock ticker (e.g., 'PETR4', 'VALE3')
    - min_sources: Minimum number of successful sources required (default: 3)
    - timeout_per_scraper: Timeout per scraper in seconds (default: 60)

    Returns:
    - ticker: The requested ticker
    - sources_count: Number of successful sources
    - min_sources_met: Whether the minimum was achieved
    - sources: List of successful source names
    - failed_sources: List of failed source names
    - execution_time: Total execution time
    - data: Array of results from each successful source
    """
    import time

    # Validate ticker format
    ticker = ticker.upper().strip()
    if not ticker or len(ticker) < 4 or len(ticker) > 6:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ticker format: {ticker}. Expected 4-6 characters."
        )

    # Priority order for fundamental scrapers
    FUNDAMENTAL_SCRAPERS_PRIORITY = [
        "FUNDAMENTUS",
        "STATUSINVEST",
        "INVESTSITE",
        "INVESTIDOR10",
        "GRIFFIN",
        "GOOGLEFINANCE",
    ]

    logger.info(
        f"Starting fundamental scrape for {ticker} "
        f"(min_sources={request.min_sources}, timeout={request.timeout_per_scraper}s)"
    )

    start_time = time.time()
    successful_results = []
    failed_sources = []

    for scraper_name in FUNDAMENTAL_SCRAPERS_PRIORITY:
        try:
            logger.info(f"Trying {scraper_name} for {ticker}...")
            result = await scraper_controller.test_scraper(
                scraper_name=scraper_name,
                query=ticker
            )

            if result.get("success"):
                successful_results.append({
                    "source": scraper_name,
                    "success": True,
                    "execution_time": result.get("execution_time", 0),
                    "data": result.get("data", {})
                })
                logger.info(
                    f"✅ {scraper_name} succeeded for {ticker} "
                    f"({len(successful_results)}/{request.min_sources} sources)"
                )

                # Check if we have enough sources
                if len(successful_results) >= request.min_sources:
                    logger.info(
                        f"✅ Minimum sources reached ({request.min_sources}). "
                        f"Stopping early."
                    )
                    break
            else:
                failed_sources.append(scraper_name)
                logger.warning(
                    f"❌ {scraper_name} failed for {ticker}: "
                    f"{result.get('error', 'Unknown error')}"
                )

        except Exception as e:
            failed_sources.append(scraper_name)
            logger.error(f"❌ {scraper_name} exception for {ticker}: {e}")

    total_time = time.time() - start_time
    sources_count = len(successful_results)
    min_sources_met = sources_count >= request.min_sources

    logger.info(
        f"Fundamental scrape complete for {ticker}: "
        f"{sources_count}/{request.min_sources} sources "
        f"({'✅ MET' if min_sources_met else '❌ NOT MET'}) "
        f"in {total_time:.2f}s"
    )

    return {
        "ticker": ticker,
        "sources_count": sources_count,
        "min_sources_met": min_sources_met,
        "sources": [r["source"] for r in successful_results],
        "failed_sources": failed_sources,
        "execution_time": round(total_time, 2),
        "data": successful_results
    }


# Health check endpoint for the API itself
@router.get(
    "/ping",
    summary="API health check",
    description="Simple health check endpoint to verify API is running",
    responses={
        200: {
            "description": "API is healthy",
            "content": {
                "application/json": {
                    "example": {
                        "status": "ok",
                        "message": "Scraper Test API is running",
                        "version": "1.0.0"
                    }
                }
            }
        }
    }
)
async def ping() -> Dict[str, Any]:
    """
    Simple health check for the API itself

    Returns:
    - Status: ok
    - Message
    - API version
    """
    return {
        "status": "ok",
        "message": "Scraper Test API is running",
        "version": "1.0.0",
        "total_scrapers": len(scraper_controller.SCRAPERS_REGISTRY)
    }
