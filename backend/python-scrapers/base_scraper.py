"""
Base scraper class - abstract interface with Playwright
Migrated from Selenium to Playwright on 2025-11-27
Updated 2025-12-04: Added playwright-stealth for Cloudflare bypass
Updated 2025-12-11: FASE 94.3 - Fixed import location, bare except, improved code quality
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
from playwright.async_api import async_playwright, Browser, Page, Playwright
from playwright_stealth import Stealth
from loguru import logger
import time
import asyncio

from config import settings
from resource_monitor import ResourceMonitor  # FASE 94.3: Moved from inside initialize()


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

    # FASE 94: Semáforo de inicialização (permite 3 browsers simultâneos)
    # Anteriormente usava Lock (serializado), agora permite paralelismo controlado
    _initialization_semaphore: asyncio.Semaphore = None
    _max_concurrent_init: int = 3  # Máximo de browsers inicializando ao mesmo tempo

    def __init__(self, name: str, source: str, requires_login: bool = False):
        self.name = name
        self.source = source
        self.requires_login = requires_login
        # Each scraper instance has its own browser and page (not shared)
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        self._stealth_context = None  # Stealth context manager
        self._initialized = False
        # Note: _initialization_queue lock is created lazily in async context

    async def _create_browser_and_page(self):
        """
        Create individual browser and page for this scraper instance (matches backend pattern)

        Updated 2025-12-04: Uses playwright-stealth for Cloudflare bypass
        Updated 2025-12-11: Added 60s timeout to prevent resource leak on hang
        """
        try:
            # FASE 94: Wrap entire browser creation with 60s timeout
            # This prevents zombie processes when browser creation hangs due to memory pressure
            async with asyncio.timeout(60):  # 60s max for browser creation
                # Start Playwright with Stealth (Cloudflare bypass)
                if not self.playwright:
                    # Configure stealth to mimic real browser
                    stealth = Stealth(
                        navigator_languages_override=('pt-BR', 'pt', 'en-US', 'en'),
                        navigator_platform_override='Win32',
                        navigator_user_agent_override='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    )
                    # Use stealth wrapper around async_playwright
                    self._stealth_context = stealth.use_async(async_playwright())
                    self.playwright = await self._stealth_context.__aenter__()
                    logger.debug(f"Playwright with Stealth started for {self.name}")

                # Launch browser with configuration matching backend TypeScript
                # Try Playwright's Chromium first (more stable in Docker)
                # Backend uses: executablePath || undefined (Playwright's own Chromium if env not set)
                import os
                executable_path = os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH')

                launch_args = {
                    'headless': settings.CHROME_HEADLESS,
                    'timeout': 120000,  # FASE 141: Increased from 60s to 120s (high timeout rate 94.7%)
                    'args': [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--disable-gpu',
                        # FASE 102 FIX: Removed --single-process (causes EPIPE crashes)
                        # '--single-process',  # DISABLED - causes pipe communication failures
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
                    ],
                }

                # Only set executable_path if env variable is set
                if executable_path:
                    launch_args['executable_path'] = executable_path

                self.browser = await self.playwright.chromium.launch(**launch_args)
                logger.debug(f"Playwright browser created for {self.name} (with Stealth)")

                # Create page
                self.page = await self.browser.new_page()

                # Set viewport (matches backend: 1920x1080)
                await self.page.set_viewport_size({"width": 1920, "height": 1080})

                # Set user agent
                await self.page.set_extra_http_headers({
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                })

                # Set default timeout (120s for complex pages like Fundamentus)
                self.page.set_default_timeout(120000)

                logger.debug(f"Playwright page created for {self.name}")

        except asyncio.TimeoutError:
            logger.error(f"[TIMEOUT] Browser creation timed out for {self.name} after 120s - cleaning up")
            await self._force_cleanup()  # Force cleanup on timeout
            raise
        except Exception as e:
            logger.error(f"Failed to create browser/page for {self.name}: {e}")
            await self._force_cleanup()  # Force cleanup on error
            raise

    async def initialize(self):
        """
        Initialize the scraper with FASE 94 smart queue

        FASE 94.2: Smart initialization queue with backpressure
        - Semaphore(3) permite 3 browsers simultâneos (antes era Lock serializado)
        - Backpressure: aguarda se memória > 70%
        - Gap reduzido para 0.5s (era 1s)
        - Timeout total de 120s (FASE 141: increased from 90s)
        """
        if self._initialized:
            return

        # FASE 94: Criar semáforo se não existir
        if BaseScraper._initialization_semaphore is None:
            BaseScraper._initialization_semaphore = asyncio.Semaphore(
                BaseScraper._max_concurrent_init
            )

        try:
            # FASE 94: Backpressure - aguardar recursos disponíveis
            if not await ResourceMonitor.wait_until_safe(timeout=60):
                raise Exception(f"Resources unavailable for {self.name} - system under pressure")

            # Timeout total de 120s para inicialização (FASE 141: increased from 90s)
            async with asyncio.timeout(120):
                async with BaseScraper._initialization_semaphore:
                    try:
                        logger.info(f"[INIT] Initializing {self.name}...")

                        # Create browser and page (individual, not shared)
                        await self._create_browser_and_page()

                        if self.requires_login:
                            logger.info(f"Performing login for {self.name}...")
                            await self.login()

                        self._initialized = True
                        logger.info(f"[INIT] ✅ {self.name} initialized successfully")

                        # FASE 94: Gap reduzido para 0.5s (era 1s)
                        await asyncio.sleep(0.5)

                    except Exception as e:
                        logger.error(f"[INIT] ❌ Failed to initialize {self.name}: {e}")
                        await self._force_cleanup()
                        raise

        except asyncio.TimeoutError:
            logger.error(f"[INIT] ⏱️ Timeout for {self.name} after 120s")
            raise Exception(f"Initialization timed out after 120s for {self.name}")

    async def login(self):
        """Override in subclasses that require login"""
        pass

    async def cleanup(self):
        """
        Cleanup resources (page, browser, playwright, and stealth context - individual per scraper)
        FASE 102 FIX: Added EPIPE/BrokenPipeError handling to prevent crashes on browser death
        """
        try:
            if self.page:
                try:
                    await self.page.close()
                except (BrokenPipeError, ConnectionResetError) as e:
                    logger.warning(f"[{self.name}] EPIPE on page close (browser died): {e}")
                except Exception as e:
                    if 'EPIPE' in str(e) or 'Target page, context or browser has been closed' in str(e):
                        logger.warning(f"[{self.name}] Browser already closed during page cleanup")
                    else:
                        logger.debug(f"[{self.name}] Page close error: {e}")
                finally:
                    self.page = None
                logger.debug(f"Page closed for {self.name}")

            if self.browser:
                try:
                    await self.browser.close()
                except (BrokenPipeError, ConnectionResetError) as e:
                    logger.warning(f"[{self.name}] EPIPE on browser close (process died): {e}")
                except Exception as e:
                    if 'EPIPE' in str(e) or 'Browser has been closed' in str(e):
                        logger.warning(f"[{self.name}] Browser already terminated")
                    else:
                        logger.debug(f"[{self.name}] Browser close error: {e}")
                finally:
                    self.browser = None
                logger.debug(f"Browser closed for {self.name}")

            # Close stealth context (which closes playwright internally)
            if self._stealth_context:
                try:
                    await self._stealth_context.__aexit__(None, None, None)
                except (BrokenPipeError, ConnectionResetError):
                    logger.warning(f"[{self.name}] EPIPE on stealth context exit")
                except Exception:
                    pass  # Ignore errors on stealth context cleanup
                finally:
                    self._stealth_context = None
                    self.playwright = None
                logger.debug(f"Stealth context closed for {self.name}")
            elif self.playwright:
                try:
                    await self.playwright.stop()
                except (BrokenPipeError, ConnectionResetError):
                    logger.warning(f"[{self.name}] EPIPE on playwright stop")
                except Exception:
                    pass  # Ignore errors
                finally:
                    self.playwright = None
                logger.debug(f"Playwright stopped for {self.name}")

            self._initialized = False

        except (BrokenPipeError, ConnectionResetError) as e:
            logger.warning(f"[{self.name}] EPIPE during cleanup - browser process died: {e}")
            # Reset all references to allow GC
            self.page = None
            self.browser = None
            self._stealth_context = None
            self.playwright = None
            self._initialized = False
        except Exception as e:
            logger.error(f"Error during cleanup of {self.name}: {e}")

    async def _force_cleanup(self):
        """
        FASE 94: Force cleanup with timeout - used when browser creation fails or times out.
        FASE 102 FIX: Added EPIPE handling for graceful recovery from browser crashes.
        This ensures no zombie processes are left behind even when cleanup itself hangs.
        """
        logger.warning(f"[FORCE CLEANUP] Starting force cleanup for {self.name}")
        try:
            # Wrap cleanup with 10s timeout to prevent cleanup from hanging
            async with asyncio.timeout(10):
                await self.cleanup()
            logger.info(f"[FORCE CLEANUP] ✅ Cleanup completed for {self.name}")
        except asyncio.TimeoutError:
            logger.error(f"[FORCE CLEANUP] ⚠️ Cleanup timed out for {self.name} - resources may leak")
            # Reset references even if cleanup failed to allow GC
            self.page = None
            self.browser = None
            self._stealth_context = None
            self.playwright = None
            self._initialized = False
        except (BrokenPipeError, ConnectionResetError) as e:
            # FASE 102 FIX: Handle EPIPE gracefully - browser process already dead
            logger.warning(f"[FORCE CLEANUP] EPIPE for {self.name} - browser already dead: {e}")
            self.page = None
            self.browser = None
            self._stealth_context = None
            self.playwright = None
            self._initialized = False
        except Exception as e:
            # Check if it's an EPIPE error wrapped in another exception
            if 'EPIPE' in str(e):
                logger.warning(f"[FORCE CLEANUP] EPIPE error for {self.name}: {e}")
            else:
                logger.error(f"[FORCE CLEANUP] ❌ Error during force cleanup of {self.name}: {e}")
            # Reset references even if cleanup failed
            self.page = None
            self.browser = None
            self._stealth_context = None
            self.playwright = None
            self._initialized = False

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
        FASE 102 FIX: Added EPIPE handling with browser restart on pipe failure

        Args:
            ticker: Stock ticker symbol

        Returns:
            ScraperResult
        """
        start_time = time.time()
        last_error = None

        try:
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

                except (BrokenPipeError, ConnectionResetError) as e:
                    # FASE 102 FIX: Handle EPIPE by forcing cleanup and retry with new browser
                    logger.warning(f"[{self.name}] EPIPE error for {ticker} - browser died, restarting: {e}")
                    last_error = f"EPIPE: {str(e)}"
                    await self._force_cleanup()  # Force cleanup to reset state
                    self._initialized = False  # Ensure next iteration creates new browser

                except Exception as e:
                    last_error = str(e)
                    # FASE 102 FIX: Check for EPIPE wrapped in other exceptions
                    if 'EPIPE' in str(e) or 'Target page, context or browser has been closed' in str(e):
                        logger.warning(f"[{self.name}] Browser crash for {ticker}, restarting: {e}")
                        await self._force_cleanup()
                        self._initialized = False
                    else:
                        logger.error(f"[{self.name}] Error scraping {ticker}: {e}")

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
        finally:
            # CRITICAL: Always cleanup browser resources to prevent memory leaks
            try:
                await self.cleanup()
                logger.debug(f"[{self.name}] Cleanup completed for {ticker}")
            except Exception as cleanup_error:
                logger.warning(f"[{self.name}] Cleanup failed: {cleanup_error}")

    async def __aenter__(self):
        """Async context manager entry"""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.cleanup()
