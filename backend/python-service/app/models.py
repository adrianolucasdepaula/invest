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
