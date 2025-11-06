"""
Configuration for Python Scrapers
"""
import os
from pydantic import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # Database
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_USERNAME: str = os.getenv("DB_USERNAME", "invest_user")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "invest_password")
    DB_DATABASE: str = os.getenv("DB_DATABASE", "invest_db")

    # Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB: int = 0

    # Scraper Configuration
    CHROME_HEADLESS: bool = os.getenv("CHROME_HEADLESS", "true").lower() == "true"
    SCRAPER_TIMEOUT: int = int(os.getenv("SCRAPER_TIMEOUT", "30000"))
    SCRAPER_MAX_RETRIES: int = int(os.getenv("SCRAPER_MAX_RETRIES", "3"))
    SCRAPER_CONCURRENT_JOBS: int = int(os.getenv("SCRAPER_CONCURRENT_JOBS", "3"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = "/app/logs/scrapers.log"

    @property
    def database_url(self) -> str:
        """Get database URL"""
        return f"postgresql://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_DATABASE}"

    @property
    def redis_url(self) -> str:
        """Get Redis URL"""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
