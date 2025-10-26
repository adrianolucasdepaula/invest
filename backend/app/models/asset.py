"""
Modelo de Ativo (Ações, FIIs, ETFs, etc)
"""
from sqlalchemy import Column, String, Float, DateTime, Integer, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from ..core.database import Base


class AssetType(str, enum.Enum):
    """Tipos de ativos"""
    STOCK = "stock"  # Ação
    FII = "fii"  # Fundo Imobiliário
    ETF = "etf"  # ETF
    BDR = "bdr"  # BDR
    STOCK_OPTION = "stock_option"  # Opção de ação
    INDEX = "index"  # Índice
    CRYPTO = "crypto"  # Criptomoeda
    FIXED_INCOME = "fixed_income"  # Renda fixa
    FUND = "fund"  # Fundo de investimento


class Asset(Base):
    """Modelo de Ativo"""
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    asset_type = Column(Enum(AssetType), nullable=False)

    # Informações básicas
    sector = Column(String(100))
    subsector = Column(String(100))
    segment = Column(String(100))
    cnpj = Column(String(20))

    # Dados de mercado
    current_price = Column(Float)
    market_cap = Column(Float)
    free_float = Column(Float)
    average_volume = Column(Float)

    # Metadados
    is_active = Column(String, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamentos
    fundamental_data = relationship("FundamentalData", back_populates="asset")
    technical_data = relationship("TechnicalData", back_populates="asset")
    options = relationship("OptionData", back_populates="underlying_asset")
    news = relationship("News", back_populates="asset")

    def __repr__(self):
        return f"<Asset(ticker={self.ticker}, name={self.name})>"
