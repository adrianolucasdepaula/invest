"""
Pydantic Models for Python Service
Descrição: Schemas para validação de dados de entrada/saída
"""

from typing import List, Optional, Literal
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
        if 'low' in values and v < values['low']:
            raise ValueError('high must be >= low')
        if 'open' in values and v < values['open']:
            raise ValueError('high must be >= open')
        if 'close' in values and v < values['close']:
            raise ValueError('high must be >= close')
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
    macd: float
    signal: float
    histogram: float


class StochasticIndicator(BaseModel):
    """Stochastic Oscillator"""
    k: float
    d: float


class BollingerBandsIndicator(BaseModel):
    """Bollinger Bands"""
    upper: float
    middle: float
    lower: float
    bandwidth: float


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
    """
    # Trend Indicators
    sma_20: float = Field(..., description="Simple Moving Average (20)")
    sma_50: float = Field(..., description="Simple Moving Average (50)")
    sma_200: float = Field(..., description="Simple Moving Average (200)")
    ema_9: float = Field(..., description="Exponential Moving Average (9)")
    ema_21: float = Field(..., description="Exponential Moving Average (21)")

    # Momentum Indicators
    rsi: float = Field(..., ge=0, le=100, description="Relative Strength Index (14)")
    macd: MACDIndicator = Field(..., description="MACD Indicator")
    stochastic: StochasticIndicator = Field(..., description="Stochastic Oscillator (14)")

    # Volatility Indicators
    bollinger_bands: BollingerBandsIndicator = Field(..., description="Bollinger Bands (20, 2)")
    atr: float = Field(..., gt=0, description="Average True Range (14)")

    # Volume Indicators
    obv: float = Field(..., description="On-Balance Volume")
    volume_sma: float = Field(..., ge=0, description="Volume SMA (20)")

    # Support and Resistance
    pivot: PivotPointsIndicator = Field(..., description="Pivot Points")

    # Trend Analysis
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
