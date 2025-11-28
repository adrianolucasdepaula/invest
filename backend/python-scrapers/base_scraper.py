"""
Base scraper class - abstract interface with Playwright
Migrated from Selenium to Playwright on 2025-11-27
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
from playwright.async_api import async_playwright, Browser, Page, Playwright
from loguru import logger
import time
import asyncio

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
    Implements common functionality using Playwright and defines interface

    MIGRATED FROM SELENIUM TO PLAYWRIGHT (2025-11-27)
    - Better performance (~30% faster)
    - Modern async/await API
    - Auto-wait capabilities
    - Native network interception
    - Unified with backend NestJS stack
    """

    # Fila de inicialização compartilhada (FASE 4 - evitar sobrecarga CDP)
    # Cada scraper cria SEU PRÓPRIO browser (igual backend TypeScript)
    _initialization_queue: asyncio.Lock = None

    def __init__(self, name: str, source: str, requires_login: bool = False):
        self.name = name
        self.source = source
        self.requires_login = requires_login
        # Each scraper instance has its own browser and page (not shared)
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self._initialized = False
        # Note: _initialization_queue lock is created lazily in async context

    async def _create_browser_and_page(self):
        """Create individual browser and page for this scraper instance (matches backend pattern)"""
        try:
            # Start Playwright
            if not self.playwright:
                self.playwright = await async_playwright().start()

            # Launch browser with configuration matching backend TypeScript
            # Try Playwright's Chromium first (more stable in Docker)
            # Backend uses: executablePath || undefined (Playwright's own Chromium if env not set)
            import os
            executable_path = os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH')

            launch_args = {
                'headless': settings.CHROME_HEADLESS,
                'timeout': 180000,  # FASE 5.5: 180s timeout
                'args': [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                ],
            }

            # Only set executable_path if env variable is set
            if executable_path:
                launch_args['executable_path'] = executable_path

            self.browser = await self.playwright.chromium.launch(**launch_args)
            logger.debug(f"Playwright browser created for {self.name}")

            # Create page
            self.page = await self.browser.new_page()

            # Set viewport (matches backend: 1920x1080)
            await self.page.set_viewport_size({"width": 1920, "height": 1080})

            # Set user agent
            await self.page.set_extra_http_headers({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            })

            # Set default timeout (FASE 5.5: 180s)
            self.page.set_default_timeout(180000)

            logger.debug(f"Playwright page created for {self.name}")

        except Exception as e:
            logger.error(f"Failed to create browser/page for {self.name}: {e}")
            raise

    async def initialize(self):
        """
        Initialize the scraper with FASE 4 queue serialization

        FASE 4: Fila de inicialização serializada para evitar sobrecarga CDP
        - Apenas 1 browser inicializado por vez
        - Gap de 2s entre inicializações
        - Evita ProtocolError timeout
        """
        if self._initialized:
            return

        # FASE 4: Aguardar fila de inicialização
        # Create lock lazily in async context (can't create in __init__)
        if BaseScraper._initialization_queue is None:
            BaseScraper._initialization_queue = asyncio.Lock()

        async with BaseScraper._initialization_queue:
            try:
                logger.info(f"[INIT QUEUE] Initializing {self.name}...")

                # Create browser and page (individual, not shared)
                await self._create_browser_and_page()

                if self.requires_login:
                    logger.info(f"Performing login for {self.name}...")
                    # Subclasses should override and implement login logic
                    await self.login()

                self._initialized = True
                logger.info(f"[INIT QUEUE] ✅ {self.name} initialized successfully")

                # FASE 4: Gap de 2s antes de liberar próximo scraper
                await asyncio.sleep(2)

            except Exception as e:
                logger.error(f"[INIT QUEUE] ❌ Failed to initialize {self.name}: {e}")
                raise

    async def login(self):
        """Override in subclasses that require login"""
        pass

    async def cleanup(self):
        """Cleanup resources (page, browser, and playwright - individual per scraper)"""
        try:
            if self.page:
                await self.page.close()
                self.page = None
                logger.debug(f"Page closed for {self.name}")

            if self.browser:
                await self.browser.close()
                self.browser = None
                logger.debug(f"Browser closed for {self.name}")

            if self.playwright:
                await self.playwright.stop()
                self.playwright = None
                logger.debug(f"Playwright stopped for {self.name}")

            self._initialized = False

        except Exception as e:
            logger.error(f"Error during cleanup of {self.name}: {e}")

    @classmethod
    async def cleanup_browser(cls):
        """
        DEPRECATED: No longer needed - each scraper instance has its own browser

        Browser cleanup is now handled by individual scraper.cleanup() method
        This method is kept for backward compatibility but does nothing
        """
        pass

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
        Scrape with automatic retry logic and exponential backoff

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

                # Cleanup page if crashed
                if self.page:
                    try:
                        await self.cleanup()
                    except:
                        pass

            # Wait before retry (exponential backoff)
            if attempt < settings.SCRAPER_MAX_RETRIES - 1:
                wait_time = 2 ** attempt  # 1s, 2s, 4s
                logger.info(f"Waiting {wait_time}s before retry...")
                await asyncio.sleep(wait_time)

        # All attempts failed
        response_time = time.time() - start_time
        return ScraperResult(
            success=False,
            error=f"Failed after {settings.SCRAPER_MAX_RETRIES} attempts: {last_error}",
            source=self.source,
            response_time=response_time,
        )

    async def __aenter__(self):
        """Async context manager entry"""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.cleanup()
