"""
Configuration for Python Scrapers
"""
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USERNAME: str = "invest_user"
    DB_PASSWORD: str = "invest_password"
    DB_DATABASE: str = "invest_db"

    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""

    # Scraper Configuration
    CHROME_HEADLESS: bool = True
    SCRAPER_TIMEOUT: int = 30000
    SCRAPER_MAX_RETRIES: int = 3
    SCRAPER_CONCURRENT_JOBS: int = 3
    SCRAPING_CONCURRENT_JOBS: int = 3
    SCRAPING_MAX_RETRIES: int = 3
    SCRAPING_TIMEOUT: int = 30000

    # Chrome/Browser Configuration
    CHROME_USER_DATA_DIR: str = "./browser-profiles"
    CHROME_EXECUTABLE_PATH: str = "/usr/bin/chromium-browser"
    COOKIES_FILE: str = "./cookies.json"

    # File Paths
    LOG_FILE_PATH: str = "./logs"
    REPORTS_DIR: str = "./reports"
    UPLOAD_DIR: str = "./uploads"

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "/app/logs/scrapers.log"

    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # Display (VNC)
    DISPLAY: str = ":99"

    # OAuth/Credentials (optional)
    GOOGLE_EMAIL: str = ""
    GOOGLE_PASSWORD: str = ""
    OPCOES_USERNAME: str = ""
    OPCOES_PASSWORD: str = ""
    BTG_LOGIN_TOKEN: str = ""
    XPI_LOGIN_TOKEN: str = ""

    # Pydantic v2 configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",  # Ignore extra environment variables
    )

    @property
    def database_url(self) -> str:
        """Get database URL"""
        return f"postgresql://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_DATABASE}"

    @property
    def redis_url(self) -> str:
        """Get Redis URL"""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


# Global settings instance
settings = Settings()
