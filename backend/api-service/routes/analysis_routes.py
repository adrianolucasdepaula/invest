"""
Analysis API Routes
B3 AI Analysis Platform

Provides endpoints for aggregated stock analysis, including:
- Complete stock analysis
- Fundamental data
- Technical data
- News aggregation
- Insider trading
- Stock comparison
- Sector overview
- AI-powered analysis (ChatGPT, Gemini, Claude, DeepSeek, Grok)
"""

import sys
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Path as PathParam, Body
from pydantic import BaseModel, Field
from loguru import logger

# Add analysis-service to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "analysis-service"))
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python-scrapers"))

from aggregator import aggregator
from database import db

# Import AI analyzer (lazy import to avoid circular dependencies)
try:
    from ai_analyzer import ai_analyzer
    AI_ANALYZER_AVAILABLE = True
except Exception as e:
    logger.warning(f"AI Analyzer not available: {e}")
    AI_ANALYZER_AVAILABLE = False
    ai_analyzer = None


# Router
router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

# Sub-router for AI analysis endpoints
ai_router = APIRouter(prefix="/ai", tags=["AI Analysis"])


# ============================================================================
# Response Models
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    database: bool
    redis: bool


class ErrorResponse(BaseModel):
    """Error response"""
    success: bool = False
    error: str
    ticker: Optional[str] = None


class MetricResponse(BaseModel):
    """Metric validation response"""
    value: Optional[float]
    confidence: float
    source_count: int
    agreement: float
    sources: List[str]
    stats: dict


class FundamentalResponse(BaseModel):
    """Fundamental data response"""
    p_l: Optional[MetricResponse] = None
    p_vp: Optional[MetricResponse] = None
    dividend_yield: Optional[MetricResponse] = None
    roe: Optional[MetricResponse] = None
    market_cap: Optional[MetricResponse] = None
    ebitda: Optional[MetricResponse] = None
    debt_equity: Optional[MetricResponse] = None


class TechnicalResponse(BaseModel):
    """Technical data response"""
    price: Optional[MetricResponse] = None
    volume: Optional[MetricResponse] = None
    variation: Optional[MetricResponse] = None
    rsi: Optional[MetricResponse] = None
    macd: Optional[MetricResponse] = None


class NewsItem(BaseModel):
    """News item"""
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    published_at: Optional[str] = None
    source: str


class InsiderTransaction(BaseModel):
    """Insider trading transaction"""
    date: str
    insider: str
    type: str
    quantity: float
    price: float
    value: float
    source: str


class InsiderSummary(BaseModel):
    """Insider trading summary"""
    total_transactions: int
    buy_count: int
    sell_count: int
    total_value: float


class InsiderResponse(BaseModel):
    """Insider trading response"""
    transactions: List[InsiderTransaction]
    summary: InsiderSummary


class SourceInfo(BaseModel):
    """Source information"""
    count: int
    names: List[str]


class StockAnalysisResponse(BaseModel):
    """Complete stock analysis response"""
    ticker: str
    success: bool
    fundamental: Optional[dict] = None
    technical: Optional[dict] = None
    sources: Optional[SourceInfo] = None
    confidence: Optional[float] = None
    timestamp: str
    error: Optional[str] = None


class ComparisonResponse(BaseModel):
    """Stock comparison response"""
    tickers: List[str]
    data: dict
    timestamp: str


# ============================================================================
# Endpoints
# ============================================================================

@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    description="Check if the analysis service is running and connections are healthy"
)
async def health_check():
    """
    Health check for the analysis service

    Returns service status and connection health for database and Redis.
    """
    # Check database
    db_healthy = False
    try:
        db.execute_query("SELECT 1")
        db_healthy = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")

    # Check Redis
    redis_healthy = False
    try:
        if aggregator.redis_client:
            aggregator.redis_client.ping()
            redis_healthy = True
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")

    return {
        "status": "healthy" if db_healthy else "degraded",
        "service": "analysis-service",
        "database": db_healthy,
        "redis": redis_healthy,
    }


@router.get(
    "/stock/{ticker}",
    response_model=StockAnalysisResponse,
    summary="Complete Stock Analysis",
    description="Get complete aggregated analysis for a stock including fundamental and technical data"
)
async def get_stock_analysis(
    ticker: str = PathParam(
        ...,
        description="Stock ticker symbol (e.g., PETR4)",
        example="PETR4"
    )
):
    """
    Get complete aggregated analysis for a stock.

    This endpoint aggregates data from all available scrapers and provides:
    - Fundamental indicators (P/L, P/VP, ROE, etc.)
    - Technical indicators (Price, Volume, RSI, etc.)
    - Cross-validated values with confidence scores
    - Source information

    The data is cached for 5 minutes to improve performance.

    **Parameters:**
    - **ticker**: Stock ticker symbol (e.g., PETR4, VALE3, ITUB4)

    **Returns:**
    - Complete aggregated stock analysis with confidence scores
    """
    try:
        logger.info(f"Fetching complete analysis for {ticker}")
        data = aggregator.aggregate_stock_data(ticker)

        if not data.get('success'):
            raise HTTPException(
                status_code=404,
                detail=data.get('error', 'No data available for this ticker')
            )

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis for {ticker}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/stock/{ticker}/fundamental",
    summary="Fundamental Analysis",
    description="Get aggregated fundamental indicators for a stock"
)
async def get_fundamental_analysis(
    ticker: str = PathParam(
        ...,
        description="Stock ticker symbol (e.g., PETR4)",
        example="PETR4"
    )
):
    """
    Get aggregated fundamental indicators for a stock.

    This endpoint provides fundamental analysis including:
    - P/L (Price/Earnings) ratio
    - P/VP (Price/Book) ratio
    - Dividend Yield
    - ROE (Return on Equity)
    - Market Cap
    - EBITDA
    - Debt/Equity ratio

    Each metric includes:
    - Cross-validated value (median of all sources)
    - Confidence score (0-1)
    - Number of sources
    - Agreement level between sources
    - Statistical data (mean, median, stdev, etc.)

    The data is cached for 24 hours as fundamental data changes slowly.

    **Parameters:**
    - **ticker**: Stock ticker symbol (e.g., PETR4, VALE3, ITUB4)

    **Returns:**
    - Aggregated fundamental indicators with confidence scores
    """
    try:
        logger.info(f"Fetching fundamental analysis for {ticker}")
        data = aggregator.get_fundamental_data(ticker)
        return {
            "ticker": ticker.upper(),
            "success": True,
            "data": data,
            "timestamp": aggregator._normalize_date("now")
        }

    except Exception as e:
        logger.error(f"Error fetching fundamental analysis for {ticker}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/stock/{ticker}/technical",
    summary="Technical Analysis",
    description="Get aggregated technical indicators for a stock"
)
async def get_technical_analysis(
    ticker: str = PathParam(
        ...,
        description="Stock ticker symbol (e.g., PETR4)",
        example="PETR4"
    )
):
    """
    Get aggregated technical indicators for a stock.

    This endpoint provides technical analysis including:
    - Current price
    - Volume
    - Price variation
    - RSI (Relative Strength Index)
    - MACD

    Each metric includes cross-validation and confidence scores.

    The data is cached for 5 minutes for near real-time updates.

    **Parameters:**
    - **ticker**: Stock ticker symbol (e.g., PETR4, VALE3, ITUB4)

    **Returns:**
    - Aggregated technical indicators with confidence scores
    """
    try:
        logger.info(f"Fetching technical analysis for {ticker}")
        data = aggregator.get_technical_data(ticker)
        return {
            "ticker": ticker.upper(),
            "success": True,
            "data": data,
            "timestamp": aggregator._normalize_date("now")
        }

    except Exception as e:
        logger.error(f"Error fetching technical analysis for {ticker}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/stock/{ticker}/news",
    response_model=List[NewsItem],
    summary="Stock News",
    description="Get recent news articles for a stock"
)
async def get_stock_news(
    ticker: str = PathParam(
        ...,
        description="Stock ticker symbol (e.g., PETR4)",
        example="PETR4"
    ),
    limit: int = Query(
        20,
        ge=1,
        le=100,
        description="Maximum number of news items to return"
    )
):
    """
    Get recent news articles for a stock.

    This endpoint aggregates news from multiple sources:
    - Bloomberg
    - Google News
    - Investing News
    - Valor
    - Exame
    - InfoMoney
    - Estadão
    - Mais Retorno

    News items are deduplicated by title and sorted by date.

    The data is cached for 10 minutes.

    **Parameters:**
    - **ticker**: Stock ticker symbol (e.g., PETR4, VALE3, ITUB4)
    - **limit**: Maximum number of news items (1-100, default: 20)

    **Returns:**
    - List of recent news articles with title, description, URL, and source
    """
    try:
        logger.info(f"Fetching news for {ticker} (limit: {limit})")
        news_items = aggregator.get_news_data(ticker, limit=limit)
        return news_items

    except Exception as e:
        logger.error(f"Error fetching news for {ticker}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/stock/{ticker}/insider",
    response_model=InsiderResponse,
    summary="Insider Trading Data",
    description="Get insider trading activity for a stock"
)
async def get_insider_trading(
    ticker: str = PathParam(
        ...,
        description="Stock ticker symbol (e.g., PETR4)",
        example="PETR4"
    )
):
    """
    Get insider trading activity for a stock.

    This endpoint provides information about insider transactions:
    - Recent transactions (buy/sell)
    - Transaction details (date, insider, quantity, price, value)
    - Summary statistics (total transactions, buy/sell counts, total value)

    The data is cached for 1 hour.

    **Parameters:**
    - **ticker**: Stock ticker symbol (e.g., PETR4, VALE3, ITUB4)

    **Returns:**
    - List of insider transactions and summary statistics
    """
    try:
        logger.info(f"Fetching insider trading data for {ticker}")
        data = aggregator.get_insider_data(ticker)
        return data

    except Exception as e:
        logger.error(f"Error fetching insider data for {ticker}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/compare",
    response_model=ComparisonResponse,
    summary="Compare Stocks",
    description="Compare multiple stocks side by side"
)
async def compare_stocks(
    tickers: List[str] = Query(
        ...,
        description="List of stock ticker symbols to compare",
        example=["PETR4", "VALE3", "ITUB4"]
    )
):
    """
    Compare multiple stocks side by side.

    This endpoint provides a comparison of fundamental and technical data
    for multiple stocks, allowing easy side-by-side analysis.

    **Parameters:**
    - **tickers**: List of stock ticker symbols (e.g., ["PETR4", "VALE3", "ITUB4"])

    **Returns:**
    - Comparison data for all requested stocks

    **Example:**
    ```
    GET /api/analysis/compare?tickers=PETR4&tickers=VALE3&tickers=ITUB4
    ```
    """
    try:
        if not tickers:
            raise HTTPException(
                status_code=400,
                detail="At least one ticker is required"
            )

        if len(tickers) > 10:
            raise HTTPException(
                status_code=400,
                detail="Maximum 10 tickers allowed for comparison"
            )

        logger.info(f"Comparing stocks: {', '.join(tickers)}")
        comparison = aggregator.compare_stocks(tickers)
        return comparison

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing stocks: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/sector/{sector}",
    summary="Sector Overview",
    description="Get overview of a market sector"
)
async def get_sector_overview(
    sector: str = PathParam(
        ...,
        description="Sector name (e.g., banking, oil, mining)",
        example="banking"
    )
):
    """
    Get overview of a market sector.

    This endpoint provides aggregated data for a market sector.

    **Note:** This feature requires a sector-to-tickers mapping and is
    currently in development.

    **Parameters:**
    - **sector**: Sector name (e.g., banking, oil, mining, retail)

    **Returns:**
    - Sector overview data with aggregated metrics
    """
    try:
        logger.info(f"Fetching sector overview for {sector}")
        data = aggregator.get_sector_overview(sector)

        if not data.get('success'):
            raise HTTPException(
                status_code=501,
                detail="Sector overview feature is not yet implemented"
            )

        return data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching sector overview for {sector}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/stats",
    summary="Analysis Statistics",
    description="Get statistics about available analysis data"
)
async def get_analysis_stats():
    """
    Get statistics about available analysis data.

    This endpoint provides information about:
    - Total number of stocks with data
    - Data freshness
    - Source coverage
    - Cache statistics

    **Returns:**
    - Analysis service statistics
    """
    try:
        # Query database for statistics
        stats = {}

        # Count unique tickers
        ticker_count_query = """
            SELECT COUNT(DISTINCT ticker)
            FROM scraper_results
            WHERE success = true
            AND executed_at >= NOW() - INTERVAL '24 hours'
        """
        result = db.execute_query(ticker_count_query)
        stats['unique_tickers_24h'] = result[0][0] if result else 0

        # Count total successful scrapes
        scrape_count_query = """
            SELECT COUNT(*)
            FROM scraper_results
            WHERE success = true
            AND executed_at >= NOW() - INTERVAL '24 hours'
        """
        result = db.execute_query(scrape_count_query)
        stats['successful_scrapes_24h'] = result[0][0] if result else 0

        # Count by scraper
        scraper_stats_query = """
            SELECT scraper_name, COUNT(*) as count
            FROM scraper_results
            WHERE success = true
            AND executed_at >= NOW() - INTERVAL '24 hours'
            GROUP BY scraper_name
            ORDER BY count DESC
        """
        result = db.execute_query(scraper_stats_query)
        stats['by_scraper'] = {row[0]: row[1] for row in result} if result else {}

        # Redis stats
        if aggregator.redis_client:
            redis_info = aggregator.redis_client.info('stats')
            stats['cache'] = {
                'enabled': True,
                'total_commands': redis_info.get('total_commands_processed', 0),
                'keyspace_hits': redis_info.get('keyspace_hits', 0),
                'keyspace_misses': redis_info.get('keyspace_misses', 0),
            }
        else:
            stats['cache'] = {'enabled': False}

        return {
            "success": True,
            "stats": stats,
            "timestamp": aggregator._normalize_date("now")
        }

    except Exception as e:
        logger.error(f"Error fetching analysis stats: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


# ============================================================================
# AI Analysis Models
# ============================================================================

class AIAnalysisContext(BaseModel):
    """Context data for AI analysis"""
    company_name: Optional[str] = Field(None, description="Company name")
    fundamentals: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Fundamental metrics")
    news: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Recent news articles")
    insider_activity: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Insider trading activity")
    sector: Optional[str] = Field(None, description="Company sector")
    market_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Market context data")


class AIAnalysisResponse(BaseModel):
    """Response model for AI analysis"""
    success: bool
    ticker: str
    timestamp: str
    execution_time_seconds: Optional[float] = None
    consensus: Optional[Dict[str, Any]] = None
    individual_analyses: Optional[List[Dict[str, Any]]] = None
    common_strengths: Optional[List[str]] = None
    common_risks: Optional[List[str]] = None
    models_queried: Optional[int] = None
    models_succeeded: Optional[int] = None
    models_failed: Optional[int] = None
    failed_models: Optional[List[str]] = None
    error: Optional[str] = None


class AIBatchAnalysisRequest(BaseModel):
    """Request model for batch AI analysis"""
    tickers: List[str] = Field(..., description="List of stock tickers")
    context: Optional[Dict[str, AIAnalysisContext]] = Field(
        None,
        description="Context per ticker (optional)"
    )
    use_cache: bool = Field(True, description="Use cached results if available")
    ai_models: Optional[List[str]] = Field(
        None,
        description="AI models to query. Default: all"
    )


class AIConsensusResponse(BaseModel):
    """Response model for AI consensus"""
    ticker: str
    consensus: Dict[str, Any]
    timestamp: str


class AICacheStatsResponse(BaseModel):
    """Response model for cache statistics"""
    total_entries: int
    valid_entries: int
    expired_entries: int
    ttl_hours: float


class AIHealthCheckResponse(BaseModel):
    """AI health check response model"""
    status: str
    service: str
    available: bool
    cache_stats: Optional[Dict[str, Any]] = None
    available_models: List[str]
    timestamp: str


# ============================================================================
# AI Analysis Endpoints
# ============================================================================

@ai_router.post("/{ticker}", response_model=AIAnalysisResponse)
async def analyze_stock_ai(
    ticker: str,
    context: AIAnalysisContext = Body(default_factory=AIAnalysisContext),
    use_cache: bool = Query(True, description="Use cached results if available"),
    ai_models: Optional[str] = Query(
        None,
        description="Comma-separated list of AI models (chatgpt,gemini,claude,deepseek,grok)"
    )
):
    """
    Request AI-powered analysis for a stock

    Queries multiple AI models (ChatGPT, Gemini, Claude, DeepSeek, Grok) in parallel,
    consolidates responses, and returns consensus analysis with confidence scores.

    **Important:** This is an expensive operation. Results are cached for 6 hours.
    """
    if not AI_ANALYZER_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="AI Analyzer service is not available"
        )

    try:
        ticker = ticker.upper()
        models_list = None
        if ai_models:
            models_list = [m.strip().lower() for m in ai_models.split(",")]

        context_dict = context.dict()
        result = await ai_analyzer.analyze_stock(
            ticker=ticker,
            context=context_dict,
            use_cache=use_cache,
            ai_models=models_list
        )

        return AIAnalysisResponse(**result)

    except Exception as e:
        logger.error(f"AI analysis failed for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@ai_router.get("/{ticker}/latest", response_model=AIAnalysisResponse)
async def get_latest_ai_analysis(ticker: str):
    """Get latest cached AI analysis for a stock"""
    if not AI_ANALYZER_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI Analyzer service is not available")

    try:
        ticker = ticker.upper()
        cached = ai_analyzer.cache.get(ticker)

        if cached:
            return AIAnalysisResponse(**cached)
        else:
            raise HTTPException(status_code=404, detail=f"No cached analysis found for {ticker}")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve cached analysis for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve cached analysis: {str(e)}")


@ai_router.post("/batch")
async def analyze_batch_ai(request: AIBatchAnalysisRequest):
    """Analyze multiple stocks in batch with AI"""
    if not AI_ANALYZER_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI Analyzer service is not available")

    try:
        results = []
        for ticker in request.tickers:
            ticker = ticker.upper()
            context_dict = {}
            if request.context and ticker in request.context:
                context_dict = request.context[ticker].dict()

            try:
                result = await ai_analyzer.analyze_stock(
                    ticker=ticker,
                    context=context_dict,
                    use_cache=request.use_cache,
                    ai_models=request.ai_models
                )
                results.append(result)
            except Exception as e:
                logger.error(f"AI analysis failed for {ticker}: {e}")
                results.append({
                    "success": False,
                    "ticker": ticker,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                })

        return {
            "success": True,
            "total_requested": len(request.tickers),
            "total_succeeded": sum(1 for r in results if r.get("success")),
            "total_failed": sum(1 for r in results if not r.get("success")),
            "results": results,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Batch AI analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")


@ai_router.get("/consensus/{ticker}", response_model=AIConsensusResponse)
async def get_ai_consensus(ticker: str):
    """Get AI consensus for a stock"""
    if not AI_ANALYZER_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI Analyzer service is not available")

    try:
        ticker = ticker.upper()
        cached = ai_analyzer.cache.get(ticker)

        if not cached:
            raise HTTPException(status_code=404, detail=f"No analysis found for {ticker}. Run analysis first.")

        consensus = cached.get("consensus", {})
        return AIConsensusResponse(
            ticker=ticker,
            consensus=consensus,
            timestamp=cached.get("timestamp", datetime.now().isoformat())
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve consensus for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve consensus: {str(e)}")


@ai_router.get("/cache/stats", response_model=AICacheStatsResponse)
async def get_ai_cache_stats():
    """Get AI analysis cache statistics"""
    if not AI_ANALYZER_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI Analyzer service is not available")

    try:
        stats = ai_analyzer.get_cache_stats()
        return AICacheStatsResponse(**stats)
    except Exception as e:
        logger.error(f"Failed to get cache stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get cache stats: {str(e)}")


@ai_router.delete("/cache/{ticker}")
async def clear_ai_cache(ticker: str):
    """Clear AI analysis cache for specific ticker"""
    if not AI_ANALYZER_AVAILABLE:
        raise HTTPException(status_code=503, detail="AI Analyzer service is not available")

    try:
        if ticker.lower() == "all":
            ai_analyzer.clear_cache()
            return {"success": True, "message": "All cache cleared", "timestamp": datetime.now().isoformat()}
        else:
            ticker = ticker.upper()
            ai_analyzer.clear_cache(ticker)
            return {"success": True, "message": f"Cache cleared for {ticker}", "ticker": ticker, "timestamp": datetime.now().isoformat()}
    except Exception as e:
        logger.error(f"Failed to clear cache: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear cache: {str(e)}")


@ai_router.get("/health", response_model=AIHealthCheckResponse)
async def ai_health_check():
    """AI Analysis service health check"""
    try:
        if not AI_ANALYZER_AVAILABLE:
            return AIHealthCheckResponse(
                status="unavailable",
                service="ai-analysis",
                available=False,
                available_models=[],
                timestamp=datetime.now().isoformat()
            )

        cache_stats = ai_analyzer.get_cache_stats()
        return AIHealthCheckResponse(
            status="healthy",
            service="ai-analysis",
            available=True,
            cache_stats=cache_stats,
            available_models=["chatgpt", "gemini", "claude", "deepseek", "grok"],
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"AI health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")


@ai_router.get("/models")
async def list_ai_models():
    """List all available AI models"""
    return {
        "models": [
            {"name": "chatgpt", "provider": "OpenAI", "description": "ChatGPT AI analysis"},
            {"name": "gemini", "provider": "Google", "description": "Gemini AI analysis"},
            {"name": "claude", "provider": "Anthropic", "description": "Claude AI analysis"},
            {"name": "deepseek", "provider": "DeepSeek", "description": "DeepSeek AI analysis"},
            {"name": "grok", "provider": "xAI", "description": "Grok AI analysis"}
        ],
        "total": 5
    }


@ai_router.get("/examples/context")
async def get_ai_context_example():
    """Get example context structure for AI analysis"""
    return {
        "example_context": {
            "company_name": "Petrobras",
            "fundamentals": {"p_l": 3.5, "roe": 25.3, "dividend_yield": 12.5, "price": 38.50, "market_cap": "500B", "debt_equity": 0.45},
            "news": [{"title": "Petrobras anuncia lucro recorde no trimestre", "date": "2024-11-01", "source": "Valor Econômico"}],
            "insider_activity": [{"action": "compra", "amount": "R$ 5.2M", "date": "2024-10-25", "insider": "CEO"}],
            "sector": "Energia / Petróleo e Gás",
            "market_context": {"ibovespa": "+2.5%", "selic": 11.75, "inflation": 4.2, "oil_price": "USD 85.50"}
        },
        "minimal_example": {"company_name": "Petrobras"}
    }


# Include AI router in main router
router.include_router(ai_router)
