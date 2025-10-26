"""
Modelo de Portfólio
"""
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Portfolio(Base):
    """Modelo de Portfólio"""
    __tablename__ = "portfolios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)  # ID do usuário (futuro)

    # Informações do Portfólio
    name = Column(String(200), nullable=False)
    description = Column(String(500))
    source = Column(String(50))  # kinvo, investidor10, b3, myprofit, nuinvest, binance, manual

    # Dados do Portfólio
    positions = Column(JSON)  # Posições no formato estruturado
    total_invested = Column(Float)
    current_value = Column(Float)
    total_return = Column(Float)
    return_percentage = Column(Float)

    # Metadados
    imported_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(String, default=True)

    def __repr__(self):
        return f"<Portfolio(id={self.id}, name={self.name}, source={self.source})>"


class PortfolioPosition(Base):
    """Modelo de Posição em Portfólio"""
    __tablename__ = "portfolio_positions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)

    # Informações da Posição
    quantity = Column(Float, nullable=False)
    average_price = Column(Float)
    current_price = Column(Float)

    # Valores
    invested_amount = Column(Float)
    current_amount = Column(Float)
    profit_loss = Column(Float)
    profit_loss_percentage = Column(Float)

    # Tipo de operação
    operation_type = Column(String(20))  # long, short
    position_type = Column(String(50))  # stock, option, fund, etc

    # Datas
    first_purchase_date = Column(DateTime(timezone=True))
    last_update_date = Column(DateTime(timezone=True), onupdate=func.now())

    # Relacionamentos
    portfolio = relationship("Portfolio")
    asset = relationship("Asset")

    def __repr__(self):
        return f"<PortfolioPosition(asset_id={self.asset_id}, quantity={self.quantity})>"
