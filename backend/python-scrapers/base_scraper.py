"""
Base scraper class - abstract interface
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from loguru import logger
import time

from config import settings


@dataclass
class ScraperResult:
    """Scraper result data structure"""

    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    source: str = ""
    timestamp: datetime = None
    response_time: float = 0.0
    metadata: Optional[Dict[str, Any]] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

    def to_dict(self) -> dict:
        """Convert to dictionary"""
        result = asdict(self)
        result["timestamp"] = self.timestamp.isoformat()
        return result


class BaseScraper(ABC):
    """
    Abstract base class for all scrapers
    Implements common functionality and defines interface
    """

    def __init__(self, name: str, source: str, requires_login: bool = False):
        self.name = name
        self.source = source
        self.requires_login = requires_login
        self.driver: Optional[webdriver.Chrome] = None
        self.wait: Optional[WebDriverWait] = None
        self._initialized = False

    def _create_driver(self) -> webdriver.Chrome:
        """Create Chrome WebDriver with proper configuration"""
        try:
            chrome_options = Options()

            if settings.CHROME_HEADLESS:
                chrome_options.add_argument("--headless=new")

            # Essential arguments for Docker/Linux
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--disable-software-rasterizer")
            chrome_options.add_argument("--disable-extensions")

            # Window size
            chrome_options.add_argument("--window-size=1920,1080")

            # User agent
            chrome_options.add_argument(
                "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )

            # Performance optimizations
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option("useAutomationExtension", False)

            # Create driver
            service = Service("/usr/local/bin/chromedriver")
            driver = webdriver.Chrome(service=service, options=chrome_options)

            # Set timeouts
            driver.set_page_load_timeout(settings.SCRAPER_TIMEOUT / 1000)
            driver.implicitly_wait(10)

            # Create wait object
            self.wait = WebDriverWait(driver, settings.SCRAPER_TIMEOUT / 1000)

            logger.debug(f"Chrome WebDriver created for {self.name}")
            return driver

        except Exception as e:
            logger.error(f"Failed to create Chrome WebDriver: {e}")
            raise

    async def initialize(self):
        """Initialize the scraper (optional override)"""
        if self._initialized:
            return

        try:
            if self.requires_login:
                logger.info(f"Initializing {self.name} with login...")
                # Subclasses should override and implement login logic
            else:
                logger.info(f"Initializing {self.name}...")

            self._initialized = True

        except Exception as e:
            logger.error(f"Failed to initialize {self.name}: {e}")
            raise

    async def cleanup(self):
        """Cleanup resources"""
        try:
            if self.driver:
                self.driver.quit()
                self.driver = None
                logger.debug(f"WebDriver closed for {self.name}")

            self._initialized = False

        except Exception as e:
            logger.error(f"Error during cleanup of {self.name}: {e}")

    @abstractmethod
    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape data for a specific ticker

        Args:
            ticker: Stock ticker symbol (e.g., 'PETR4')

        Returns:
            ScraperResult with scraped data or error
        """
        pass

    def validate(self, data: Any) -> bool:
        """
        Validate scraped data (optional override)

        Args:
            data: Data to validate

        Returns:
            True if valid, False otherwise
        """
        return data is not None

    async def scrape_with_retry(self, ticker: str) -> ScraperResult:
        """
        Scrape with automatic retry logic

        Args:
            ticker: Stock ticker symbol

        Returns:
            ScraperResult
        """
        start_time = time.time()
        last_error = None

        for attempt in range(settings.SCRAPER_MAX_RETRIES):
            try:
                logger.info(f"[{self.name}] Scraping {ticker} (attempt {attempt + 1}/{settings.SCRAPER_MAX_RETRIES})")

                # Ensure initialized
                await self.initialize()

                # Perform scrape
                result = await self.scrape(ticker)

                # Calculate response time
                result.response_time = time.time() - start_time

                if result.success:
                    logger.success(f"[{self.name}] Successfully scraped {ticker} in {result.response_time:.2f}s")
                    return result
                else:
                    logger.warning(f"[{self.name}] Scrape failed for {ticker}: {result.error}")
                    last_error = result.error

            except Exception as e:
                last_error = str(e)
                logger.error(f"[{self.name}] Error scraping {ticker}: {e}")

                # Recreate driver if it crashed
                if self.driver:
                    try:
                        await self.cleanup()
                    except:
                        pass

            # Wait before retry
            if attempt < settings.SCRAPER_MAX_RETRIES - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                logger.info(f"Waiting {wait_time}s before retry...")
                time.sleep(wait_time)

        # All attempts failed
        response_time = time.time() - start_time
        return ScraperResult(
            success=False,
            error=f"Failed after {settings.SCRAPER_MAX_RETRIES} attempts: {last_error}",
            source=self.source,
            response_time=response_time,
        )

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        import asyncio

        asyncio.run(self.cleanup())
