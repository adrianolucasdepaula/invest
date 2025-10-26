"""
Modelo de Fonte de Dados
"""
from sqlalchemy import Column, String, Float, DateTime, Integer, Text
from sqlalchemy.sql import func
from ..core.database import Base


class DataSource(Base):
    """Modelo de Fonte de Dados"""
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)

    # Informações da Fonte
    name = Column(String(100), unique=True, nullable=False)
    url = Column(String(500))
    category = Column(String(50))  # fundamental, technical, news, options, etc
    description = Column(Text)

    # Autenticação
    requires_auth = Column(String, default=False)
    auth_type = Column(String(50))  # google, credentials, api_key, token, none
    auth_config = Column(Text)  # JSON com configurações de auth (criptografado)

    # Configuração de Scraping
    scraping_method = Column(String(50))  # selenium, playwright, scrapy, api, requests
    scraping_config = Column(Text)  # JSON com configurações específicas

    # Confiabilidade
    reliability_score = Column(Float, default=0.0)  # Score de confiabilidade (0-1)
    is_verified = Column(String, default=False)
    is_official = Column(String, default=False)  # Se é fonte oficial (B3, CVM, etc)

    # Status
    is_active = Column(String, default=True)
    last_success = Column(DateTime(timezone=True))
    last_failure = Column(DateTime(timezone=True))
    consecutive_failures = Column(Integer, default=0)

    # Métricas
    total_collections = Column(Integer, default=0)
    successful_collections = Column(Integer, default=0)
    failed_collections = Column(Integer, default=0)
    average_response_time = Column(Float)  # Em segundos

    # Rate Limiting
    rate_limit_per_minute = Column(Integer, default=60)
    rate_limit_per_hour = Column(Integer, default=1000)

    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<DataSource(name={self.name}, category={self.category}, score={self.reliability_score})>"
