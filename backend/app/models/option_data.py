"""
Modelo de Dados de Opções
"""
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class OptionData(Base):
    """Modelo de Dados de Opções"""
    __tablename__ = "option_data"

    id = Column(Integer, primary_key=True, index=True)
    underlying_asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)

    # Informações da Opção
    option_ticker = Column(String(20), index=True, nullable=False)
    option_type = Column(String(10))  # CALL ou PUT
    strike = Column(Float, nullable=False)
    expiration_date = Column(Date, nullable=False)

    # Dados de Mercado
    last_price = Column(Float)
    bid = Column(Float)
    ask = Column(Float)
    volume = Column(Integer)
    open_interest = Column(Integer)  # Contratos em aberto

    # Volatilidade
    implied_volatility = Column(Float)  # IV
    historical_volatility = Column(Float)  # HV
    iv_rank = Column(Float)  # IV Rank (0-100)
    iv_percentile = Column(Float)  # IV Percentile (0-100)

    # Greeks
    delta = Column(Float)
    gamma = Column(Float)
    theta = Column(Float)
    vega = Column(Float)
    rho = Column(Float)

    # Análise
    premium = Column(Float)  # Prêmio
    intrinsic_value = Column(Float)  # Valor intrínseco
    extrinsic_value = Column(Float)  # Valor extrínseco
    time_to_expiration = Column(Integer)  # Dias até vencimento
    moneyness = Column(String(10))  # ITM, ATM, OTM

    # Liquidez
    bid_ask_spread = Column(Float)
    liquidity_score = Column(Float)  # Score de liquidez (0-1)

    # Análise de Impacto
    days_to_expiration = Column(Integer)
    expected_impact_score = Column(Float)  # Score de impacto esperado no ativo

    # Data de coleta
    reference_date = Column(Date, nullable=False)
    data_source = Column(String(100))
    collected_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    underlying_asset = relationship("Asset", back_populates="options")

    def __repr__(self):
        return f"<OptionData(ticker={self.option_ticker}, strike={self.strike}, exp={self.expiration_date})>"
