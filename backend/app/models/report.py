"""
Modelo de Relatórios
"""
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Report(Base):
    """Modelo de Relatórios"""
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)

    # Informações do Relatório
    report_type = Column(String(50))  # complete, fundamental, technical, options, etc
    title = Column(String(500))
    summary = Column(Text)

    # Conteúdo do Relatório
    content = Column(Text)  # Conteúdo completo em markdown
    data = Column(JSON)  # Dados estruturados do relatório

    # Análise e Recomendações
    recommendation = Column(String(20))  # buy, sell, hold
    target_price = Column(String)
    confidence_score = Column(String)  # Score de confiança (0-1)

    # Análise de Riscos
    risk_level = Column(String(20))  # low, medium, high
    risk_factors = Column(JSON)  # Lista de fatores de risco

    # Metadados
    generated_by = Column(String(100))  # Sistema, IA, Analista
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    version = Column(String(20))

    # Relacionamentos
    asset = relationship("Asset")

    def __repr__(self):
        return f"<Report(id={self.id}, type={self.report_type}, asset_id={self.asset_id})>"
