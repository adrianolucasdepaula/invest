"""
Pydantic Models for Python Service
Descrição: Schemas para validação de dados de entrada/saída
"""

from typing import List, Optional, Literal, Union
from datetime import datetime
from pydantic import BaseModel, Field, validator


# ============================================================================
# INPUT MODELS
# ============================================================================

class PriceDataPoint(BaseModel):
    """
    Single OHLCV data point
    """
    date: str = Field(..., description="ISO date string (YYYY-MM-DD)")
    open: float = Field(..., gt=0, description="Opening price")
    high: float = Field(..., gt=0, description="Highest price")
    low: float = Field(..., gt=0, description="Lowest price")
    close: float = Field(..., gt=0, description="Closing price")
    volume: float = Field(..., ge=0, description="Trading volume")

    @validator('high')
    def high_must_be_highest(cls, v, values):
        # Only validate high >= low (strict rule)
        # Note: high can be < open or < close in real market data due to:
        # - Decimal rounding (e.g., open=65.20, high=65.19)
        # - Different data sources
        # - Adjusted prices (splits, dividends)
        if 'low' in values and v < values['low']:
            raise ValueError('high must be >= low')
        return v

    @validator('low')
    def low_must_be_lowest(cls, v, values):
        if 'high' in values and v > values['high']:
            raise ValueError('low must be <= high')
        return v


class IndicatorsRequest(BaseModel):
    """
    Request to calculate technical indicators
    """
    ticker: str = Field(..., min_length=1, max_length=20, description="Asset ticker")
    prices: List[PriceDataPoint] = Field(..., min_items=200, description="Price history (min 200 data points)")

    @validator('prices')
    def prices_must_be_sorted(cls, v):
        """Ensure prices are sorted by date ascending"""
        dates = [datetime.fromisoformat(p.date) for p in v]
        if dates != sorted(dates):
            raise ValueError('prices must be sorted by date (ascending)')
        return v


# ============================================================================
# OUTPUT MODELS
# ============================================================================

class MACDIndicator(BaseModel):
    """MACD Indicator"""
    macd: List[Optional[float]]
    signal: List[Optional[float]]
    histogram: List[Optional[float]]


class StochasticIndicator(BaseModel):
    """Stochastic Oscillator"""
    k: List[Optional[float]]
    d: List[Optional[float]]


class BollingerBandsIndicator(BaseModel):
    """Bollinger Bands"""
    upper: List[Optional[float]]
    middle: List[Optional[float]]
    lower: List[Optional[float]]
    bandwidth: float  # bandwidth é um valor derivado único, não array


class PivotPointsIndicator(BaseModel):
    """Pivot Points"""
    pivot: float
    r1: float
    r2: float
    r3: float
    s1: float
    s2: float
    s3: float


class TechnicalIndicators(BaseModel):
    """
    Complete technical indicators response
    Note: All moving averages and oscillators return full historical arrays
    Arrays may contain None for periods where indicators cannot be calculated
    """
    # Trend Indicators (historical arrays)
    sma_20: List[Optional[float]] = Field(..., description="Simple Moving Average (20) - historical values")
    sma_50: List[Optional[float]] = Field(..., description="Simple Moving Average (50) - historical values")
    sma_200: List[Optional[float]] = Field(..., description="Simple Moving Average (200) - historical values")
    ema_9: List[Optional[float]] = Field(..., description="Exponential Moving Average (9) - historical values")
    ema_21: List[Optional[float]] = Field(..., description="Exponential Moving Average (21) - historical values")

    # Momentum Indicators (historical arrays)
    rsi: List[Optional[float]] = Field(..., description="Relative Strength Index (14) - historical values")
    macd: MACDIndicator = Field(..., description="MACD Indicator - historical arrays")
    stochastic: StochasticIndicator = Field(..., description="Stochastic Oscillator (14) - historical arrays")

    # Volatility Indicators (historical arrays)
    bollinger_bands: BollingerBandsIndicator = Field(..., description="Bollinger Bands (20, 2) - historical arrays")
    atr: List[Optional[float]] = Field(..., description="Average True Range (14) - historical values")

    # Volume Indicators (historical arrays)
    obv: List[Optional[float]] = Field(..., description="On-Balance Volume - historical values")
    volume_sma: List[Optional[float]] = Field(..., description="Volume SMA (20) - historical values")

    # Support and Resistance (latest values only)
    pivot: PivotPointsIndicator = Field(..., description="Pivot Points - latest calculation")

    # Trend Analysis (latest values only)
    trend: Literal['UPTREND', 'DOWNTREND', 'SIDEWAYS'] = Field(..., description="Current trend")
    trend_strength: float = Field(..., ge=0, le=100, description="Trend strength (0-100)")


class IndicatorsResponse(BaseModel):
    """
    Response from /indicators endpoint
    """
    ticker: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    indicators: TechnicalIndicators
    data_points: int = Field(..., description="Number of price points used")


# ============================================================================
# ERROR MODELS
# ============================================================================

class ErrorResponse(BaseModel):
    """
    Standard error response
    """
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ============================================================================
# HEALTH CHECK
# ============================================================================

class HealthResponse(BaseModel):
    """
    Health check response
    """
    status: Literal['healthy', 'unhealthy']
    service: str = "python-technical-analysis"
    version: str = "1.0.0"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    dependencies: dict = Field(default_factory=dict)


# ============================================================================
# HISTORICAL DATA MODELS (YFinance)
# ============================================================================

class HistoricalDataRequest(BaseModel):
    """
    Request to fetch historical data from Yahoo Finance
    """
    ticker: str = Field(..., min_length=1, max_length=20, description="Asset ticker (B3)")
    period: str = Field(default="max", description="Data period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max")
    interval: str = Field(default="1d", description="Data interval: 1d, 1wk, 1mo")


class HistoricalPricePoint(BaseModel):
    """
    Single historical price data point from Yahoo Finance
    """
    date: str = Field(..., description="ISO date string (YYYY-MM-DD)")
    open: float = Field(..., description="Opening price")
    high: float = Field(..., description="Highest price")
    low: float = Field(..., description="Lowest price")
    close: float = Field(..., description="Closing price")
    volume: float = Field(..., description="Trading volume")
    adjustedClose: float = Field(..., description="Adjusted closing price (splits, dividends)")


class HistoricalDataResponse(BaseModel):
    """
    Response from /historical-data endpoint
    """
    ticker: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    period: str
    interval: str
    data_points: int
    prices: List[HistoricalPricePoint]


# ============================================================================
# COTAHIST MODELS (B3 Official Historical Data)
# ============================================================================

class CotahistRequest(BaseModel):
    """
    Request to fetch historical data from COTAHIST (B3 official source)

    COTAHIST provides complete historical data from 1986 to present:
    - Source: https://bvmf.bmfbovespa.com.br/InstDados/SerHist/
    - Coverage: 2000+ assets (all B3 stocks, FIIs, ETFs)
    - Cost: 100% FREE
    """
    start_year: int = Field(default=1986, ge=1986, le=2024, description="Start year (1986-2024)")
    end_year: int = Field(default=2024, ge=1986, le=2024, description="End year (1986-2024)")
    tickers: Optional[List[str]] = Field(default=None, description="List of tickers to filter (optional, all if None)")

    @validator('end_year')
    def end_year_must_be_after_start(cls, v, values):
        """Ensure end_year >= start_year"""
        if 'start_year' in values and v < values['start_year']:
            raise ValueError('end_year must be >= start_year')
        return v


class CotahistPricePoint(BaseModel):
    """
    Single historical price data point from COTAHIST

    Note: COTAHIST prices are NOT adjusted for splits/dividends.
    For adjusted prices, use BRAPI or YFinance.
    """
    ticker: str = Field(..., description="Asset ticker (e.g., ABEV3)")
    date: str = Field(..., description="ISO date string (YYYY-MM-DD)")
    open: float = Field(..., description="Opening price (unadjusted)")
    high: float = Field(..., description="Highest price (unadjusted)")
    low: float = Field(..., description="Lowest price (unadjusted)")
    close: float = Field(..., description="Closing price (unadjusted)")
    volume: int = Field(..., description="Trading volume")


class CotahistResponse(BaseModel):
    """
    Response from /cotahist/fetch endpoint
    """
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    start_year: int
    end_year: int
    years_processed: int
    total_records: int
    tickers_filter: Optional[List[str]]
    data: List[CotahistPricePoint]
