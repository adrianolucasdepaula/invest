"""
FastAPI Application - Python Technical Analysis Service
Descrição: API REST para cálculo de indicadores técnicos
Performance: 10-50x mais rápido que TypeScript
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from datetime import datetime

# Import models and services
from app.models import (
    IndicatorsRequest,
    IndicatorsResponse,
    ErrorResponse,
    HealthResponse,
    HistoricalDataRequest,
    HistoricalDataResponse,
    CotahistRequest,
    CotahistResponse,
)
from app.services import CotahistService, TechnicalAnalysisService, YFinanceService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Python Technical Analysis Service",
    description="High-performance technical indicators calculation using pandas_ta_classic",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to backend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
cotahist_service = CotahistService()
technical_analysis_service = TechnicalAnalysisService()
yfinance_service = YFinanceService()


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================


@app.exception_handler(ValueError)
async def value_error_handler(request, exc: ValueError):
    """Handle ValueError exceptions"""
    logger.error(f"ValueError: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content=ErrorResponse(error="Validation Error", detail=str(exc)).dict(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="Internal Server Error", detail="An unexpected error occurred"
        ).dict(),
    )


# ============================================================================
# ENDPOINTS
# ============================================================================


@app.get("/", response_model=HealthResponse)
async def root():
    """
    Root endpoint - Service info
    """
    return HealthResponse(
        status="healthy",
        service="python-technical-analysis",
        version="1.0.0",
        dependencies={
            "pandas": "2.2.2",
            "pandas_ta_classic": "0.3.37",
            "numpy": "2.0.0",
        },
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint
    """
    try:
        # Test pandas_ta_classic import
        import pandas_ta_classic as ta

        return HealthResponse(
            status="healthy",
            service="python-technical-analysis",
            version="1.0.0",
            dependencies={"pandas_ta_classic": "available"},
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthResponse(
            status="unhealthy",
            service="python-technical-analysis",
            version="1.0.0",
            dependencies={"error": str(e)},
        )


@app.post("/indicators", response_model=IndicatorsResponse, status_code=status.HTTP_200_OK)
async def calculate_indicators(request: IndicatorsRequest):
    """
    Calculate technical indicators for given price data

    Args:
        request: IndicatorsRequest with ticker and prices

    Returns:
        IndicatorsResponse with all calculated indicators

    Raises:
        HTTPException 400: If validation fails or insufficient data
        HTTPException 500: If calculation fails
    """
    start_time = datetime.utcnow()
    logger.info(f"Calculating indicators for {request.ticker} ({len(request.prices)} data points)")

    try:
        # Calculate indicators
        indicators = technical_analysis_service.calculate_indicators(
            ticker=request.ticker, prices=request.prices
        )

        # Calculate processing time
        end_time = datetime.utcnow()
        processing_time_ms = (end_time - start_time).total_seconds() * 1000

        logger.info(
            f"Indicators calculated successfully for {request.ticker} in {processing_time_ms:.2f}ms"
        )

        return IndicatorsResponse(
            ticker=request.ticker,
            timestamp=end_time,
            indicators=indicators,
            data_points=len(request.prices),
        )

    except ValueError as e:
        logger.error(f"Validation error for {request.ticker}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )

    except Exception as e:
        logger.error(
            f"Error calculating indicators for {request.ticker}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to calculate indicators: {str(e)}",
        )


@app.post("/historical-data", response_model=HistoricalDataResponse, status_code=status.HTTP_200_OK)
async def fetch_historical_data(request: HistoricalDataRequest):
    """
    Fetch historical price data from Yahoo Finance

    Args:
        request: HistoricalDataRequest with ticker, period, and interval

    Returns:
        HistoricalDataResponse with price data

    Raises:
        HTTPException 400: If ticker is invalid or no data found
        HTTPException 500: If fetching fails
    """
    start_time = datetime.utcnow()
    logger.info(f"Fetching historical data for {request.ticker} (period={request.period}, interval={request.interval})")

    try:
        # Fetch historical data
        prices = yfinance_service.fetch_historical_data(
            ticker=request.ticker,
            period=request.period,
            interval=request.interval,
        )

        # Calculate processing time
        end_time = datetime.utcnow()
        processing_time_ms = (end_time - start_time).total_seconds() * 1000

        logger.info(
            f"Historical data fetched successfully for {request.ticker} ({len(prices)} points) in {processing_time_ms:.2f}ms"
        )

        return HistoricalDataResponse(
            ticker=request.ticker,
            timestamp=end_time,
            period=request.period,
            interval=request.interval,
            data_points=len(prices),
            prices=prices,
        )

    except ValueError as e:
        logger.error(f"Validation error for {request.ticker}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )

    except Exception as e:
        logger.error(
            f"Error fetching historical data for {request.ticker}: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch historical data: {str(e)}",
        )


@app.post("/cotahist/fetch", response_model=CotahistResponse, status_code=status.HTTP_200_OK)
async def fetch_cotahist_data(request: CotahistRequest):
    """
    Fetch historical price data from COTAHIST (B3 official source)

    COTAHIST provides complete historical data from 1986 to present:
    - Source: https://bvmf.bmfbovespa.com.br/InstDados/SerHist/
    - Coverage: 2000+ assets (all B3 stocks, FIIs, ETFs)
    - Cost: 100% FREE
    - Format: ZIP containing TXT (245 bytes fixed position layout)

    Args:
        request: CotahistRequest with start_year, end_year, and optional tickers filter

    Returns:
        CotahistResponse with all historical data points

    Raises:
        HTTPException 400: If years are invalid or no data found
        HTTPException 500: If download or parsing fails

    Example:
        POST /cotahist/fetch
        {
            "start_year": 2020,
            "end_year": 2024,
            "tickers": ["ABEV3", "PETR4"]
        }

    Performance:
        - Single year: ~5-10 seconds (download + parse)
        - Multiple years: ~30-60 seconds (5 years)
        - Timeout: 600 seconds (10 minutes)

    Note:
        COTAHIST prices are NOT adjusted for splits/dividends.
        For adjusted prices, use BRAPI or YFinance.
    """
    start_time = datetime.utcnow()
    years_requested = request.end_year - request.start_year + 1

    logger.info(
        f"Fetching COTAHIST data: {request.start_year}-{request.end_year} "
        f"({years_requested} years, tickers: {request.tickers or 'ALL'})"
    )

    try:
        # Fetch historical data from COTAHIST
        data = await cotahist_service.fetch_historical_data(
            start_year=request.start_year,
            end_year=request.end_year,
            tickers=request.tickers,
        )

        # Calculate processing time
        end_time = datetime.utcnow()
        processing_time_sec = (end_time - start_time).total_seconds()

        # Calculate years_processed (based on actual data)
        unique_years = len(set(point["date"][:4] for point in data))

        logger.info(
            f"COTAHIST data fetched successfully: {len(data)} records "
            f"from {unique_years} years in {processing_time_sec:.2f}s"
        )

        return CotahistResponse(
            timestamp=end_time,
            start_year=request.start_year,
            end_year=request.end_year,
            years_processed=unique_years,
            total_records=len(data),
            tickers_filter=request.tickers,
            data=data,
        )

    except ValueError as e:
        logger.error(f"Validation error for COTAHIST fetch: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        )

    except Exception as e:
        logger.error(
            f"Error fetching COTAHIST data: {str(e)}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch COTAHIST data: {str(e)}",
        )


@app.get("/ping")
async def ping():
    """
    Simple ping endpoint for connectivity testing
    """
    return {"message": "pong", "timestamp": datetime.utcnow().isoformat()}


# ============================================================================
# STARTUP / SHUTDOWN EVENTS
# ============================================================================


@app.on_event("startup")
async def startup_event():
    """
    Startup event - Initialize resources
    """
    logger.info("🚀 Python Technical Analysis Service starting...")
    logger.info("📊 pandas_ta_classic loaded successfully")
    logger.info("✅ Service ready to accept requests")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Shutdown event - Cleanup resources
    """
    logger.info("👋 Python Technical Analysis Service shutting down...")


# ============================================================================
# MAIN ENTRY POINT (for local development)
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info",
    )
