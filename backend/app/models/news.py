"""
Modelo de Notícias
"""
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class News(Base):
    """Modelo de Notícias"""
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=True)

    # Informações da Notícia
    title = Column(Text, nullable=False)
    content = Column(Text)
    summary = Column(Text)
    url = Column(String(500), unique=True)
    source = Column(String(100))  # Fonte da notícia
    author = Column(String(200))

    # Datas
    published_at = Column(DateTime(timezone=True))
    collected_at = Column(DateTime(timezone=True), server_default=func.now())

    # Análise de Sentimento
    sentiment_score = Column(Float)  # -1 a 1 (negativo a positivo)
    sentiment_label = Column(String(20))  # negative, neutral, positive
    sentiment_confidence = Column(Float)  # 0 a 1

    # Categorização
    category = Column(String(100))  # economia, política, empresa, setor, etc
    tags = Column(String(500))  # Tags separadas por vírgula
    relevance_score = Column(Float)  # Score de relevância (0-1)

    # Impacto
    impact_score = Column(Float)  # Score de impacto esperado no ativo (0-1)
    impact_timeframe = Column(String(20))  # short-term, medium-term, long-term

    # Relacionamentos
    asset = relationship("Asset", back_populates="news")

    def __repr__(self):
        return f"<News(title={self.title[:50]}..., source={self.source})>"
