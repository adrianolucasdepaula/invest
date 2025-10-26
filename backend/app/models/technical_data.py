"""
Modelo de Dados Técnicos
"""
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class TechnicalData(Base):
    """Modelo de Dados Técnicos (OHLCV + Indicadores)"""
    __tablename__ = "technical_data"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)

    # Data de referência
    date = Column(Date, nullable=False, index=True)
    timeframe = Column(String(20))  # 1d, 1h, 5m, etc

    # OHLCV (Open, High, Low, Close, Volume)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)
    adj_close = Column(Float)  # Preço ajustado

    # Médias Móveis
    sma_9 = Column(Float)
    sma_20 = Column(Float)
    sma_50 = Column(Float)
    sma_200 = Column(Float)
    ema_9 = Column(Float)
    ema_20 = Column(Float)
    ema_50 = Column(Float)
    ema_200 = Column(Float)

    # Indicadores de Momentum
    rsi_14 = Column(Float)  # RSI
    macd = Column(Float)  # MACD
    macd_signal = Column(Float)  # Sinal MACD
    macd_histogram = Column(Float)  # Histograma MACD
    stoch_k = Column(Float)  # Estocástico %K
    stoch_d = Column(Float)  # Estocástico %D

    # Indicadores de Volatilidade
    atr_14 = Column(Float)  # Average True Range
    bollinger_upper = Column(Float)  # Banda de Bollinger Superior
    bollinger_middle = Column(Float)  # Banda de Bollinger Média
    bollinger_lower = Column(Float)  # Banda de Bollinger Inferior
    bollinger_width = Column(Float)  # Largura das Bandas
    volatility_historical = Column(Float)  # Volatilidade histórica

    # Indicadores de Tendência
    adx = Column(Float)  # ADX
    plus_di = Column(Float)  # +DI
    minus_di = Column(Float)  # -DI
    cci = Column(Float)  # Commodity Channel Index

    # Indicadores de Volume
    obv = Column(Float)  # On Balance Volume
    volume_sma_20 = Column(Float)  # Média móvel de volume
    volume_ratio = Column(Float)  # Razão volume atual/média

    # Suportes e Resistências
    support_1 = Column(Float)
    support_2 = Column(Float)
    resistance_1 = Column(Float)
    resistance_2 = Column(Float)

    # Padrões Gráficos
    pattern_detected = Column(String(100))  # Nome do padrão detectado
    pattern_confidence = Column(Float)  # Confiança na detecção (0-1)

    # Metadados
    data_source = Column(String(100))
    collected_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    asset = relationship("Asset", back_populates="technical_data")

    def __repr__(self):
        return f"<TechnicalData(asset_id={self.asset_id}, date={self.date}, close={self.close})>"
