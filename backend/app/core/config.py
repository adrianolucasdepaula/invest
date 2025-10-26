"""
Configurações da aplicação
"""
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Configurações da aplicação"""

    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "B3 Investment Analysis Platform"
    VERSION: str = "1.0.0"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/invest_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL: int = 300  # 5 minutes

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # APIs Externas
    BRAPI_TOKEN: str = "mVcy3EFZaBdza27tPQjdC1"
    BRAPI_BASE_URL: str = "https://brapi.dev/api"

    # Opcoes.net.br
    OPCOES_USER: str = "312.862.178-06"
    OPCOES_PASSWORD: str = "Safra998266@#"
    OPCOES_BASE_URL: str = "https://opcoes.net.br"

    # Scraping
    CHROME_DRIVER_PATH: str = "/usr/local/bin/chromedriver"
    HEADLESS_MODE: bool = True
    USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    SCRAPING_TIMEOUT: int = 30
    MAX_RETRIES: int = 3

    # Data Collection
    MINIMUM_SOURCES: int = 3  # Mínimo de fontes para validação cruzada
    DATA_FRESHNESS_HOURS: int = 24  # Considerar dados frescos se coletados nas últimas 24h

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # AI APIs (opcionais - para análises avançadas)
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
