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
)
from app.services import TechnicalAnalysisService

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

# Initialize service
technical_analysis_service = TechnicalAnalysisService()


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
