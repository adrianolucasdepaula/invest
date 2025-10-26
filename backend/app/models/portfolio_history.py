"""
Modelo de Histórico de Portfólio
Armazena snapshots diários para cálculos de performance histórica
"""
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, JSON, Date, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class PortfolioHistory(Base):
    """
    Modelo de Histórico de Portfólio

    Armazena snapshots diários do portfólio para permitir:
    - Cálculos de performance histórica
    - Análise de volatilidade
    - Comparação com benchmarks
    - Cálculo de drawdown
    """
    __tablename__ = "portfolio_history"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False, index=True)

    # Data do snapshot
    snapshot_date = Column(Date, nullable=False, index=True)

    # Valores do portfólio
    total_value = Column(Float, nullable=False)  # Valor total do portfólio
    total_invested = Column(Float, nullable=False)  # Total investido até aquela data
    cash_balance = Column(Float, default=0.0)  # Saldo em caixa

    # Retornos
    daily_return = Column(Float)  # Retorno do dia (%)
    daily_return_value = Column(Float)  # Retorno do dia (R$)
    accumulated_return = Column(Float)  # Retorno acumulado (%)
    accumulated_return_value = Column(Float)  # Retorno acumulado (R$)

    # Posições (snapshot das posições do dia)
    positions_snapshot = Column(JSON)  # {"PETR4": {"qty": 100, "price": 30.50, "value": 3050}, ...}

    # Métricas de risco
    volatility_30d = Column(Float)  # Volatilidade dos últimos 30 dias
    max_drawdown = Column(Float)  # Drawdown máximo até aquela data

    # Benchmarks (para comparação)
    ibovespa_value = Column(Float)  # Valor do Ibovespa no dia
    cdi_accumulated = Column(Float)  # CDI acumulado (%)

    # Dividendos
    dividends_received = Column(Float, default=0.0)  # Dividendos recebidos no dia

    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamento
    portfolio = relationship("Portfolio", backref="history")

    # Índices compostos para queries eficientes
    __table_args__ = (
        Index('idx_portfolio_date', 'portfolio_id', 'snapshot_date'),
        Index('idx_date_portfolio', 'snapshot_date', 'portfolio_id'),
    )

    def __repr__(self):
        return f"<PortfolioHistory(portfolio_id={self.portfolio_id}, date={self.snapshot_date}, value={self.total_value})>"


class PortfolioDividend(Base):
    """
    Modelo de Dividendos do Portfólio

    Armazena histórico de dividendos recebidos
    """
    __tablename__ = "portfolio_dividends"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)

    # Informações do dividendo
    ticker = Column(String(20), nullable=False, index=True)
    dividend_type = Column(String(50))  # "dividendo", "jcp", "rendimento"

    # Valores
    value_per_share = Column(Float, nullable=False)  # Valor por ação
    total_shares = Column(Float, nullable=False)  # Quantidade de ações
    total_value = Column(Float, nullable=False)  # Valor total recebido

    # Datas
    announcement_date = Column(Date)  # Data de anúncio
    ex_date = Column(Date)  # Data ex-dividendo
    payment_date = Column(Date, nullable=False, index=True)  # Data de pagamento

    # Status
    status = Column(String(20), default="received")  # "announced", "confirmed", "received"

    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relacionamentos
    portfolio = relationship("Portfolio", backref="dividends")
    asset = relationship("Asset")

    # Índices
    __table_args__ = (
        Index('idx_portfolio_payment', 'portfolio_id', 'payment_date'),
        Index('idx_ticker_payment', 'ticker', 'payment_date'),
    )

    def __repr__(self):
        return f"<PortfolioDividend(portfolio_id={self.portfolio_id}, ticker={self.ticker}, value={self.total_value}, date={self.payment_date})>"


class PortfolioTransaction(Base):
    """
    Modelo de Transações do Portfólio

    Armazena todas as operações (compra/venda) do portfólio
    """
    __tablename__ = "portfolio_transactions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"))

    # Informações da transação
    ticker = Column(String(20), nullable=False, index=True)
    transaction_type = Column(String(20), nullable=False)  # "buy", "sell"

    # Valores
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)  # quantity * price
    fees = Column(Float, default=0.0)  # Taxas e corretagem
    net_value = Column(Float)  # total_value + fees

    # Data
    transaction_date = Column(Date, nullable=False, index=True)

    # Resultado (para vendas)
    profit_loss = Column(Float)  # Lucro/prejuízo (apenas para vendas)
    profit_loss_percentage = Column(Float)

    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(500))  # Notas adicionais

    # Relacionamentos
    portfolio = relationship("Portfolio", backref="transactions")
    asset = relationship("Asset")

    # Índices
    __table_args__ = (
        Index('idx_portfolio_date', 'portfolio_id', 'transaction_date'),
        Index('idx_ticker_date', 'ticker', 'transaction_date'),
    )

    def __repr__(self):
        return f"<PortfolioTransaction(portfolio_id={self.portfolio_id}, ticker={self.ticker}, type={self.transaction_type}, qty={self.quantity})>"
