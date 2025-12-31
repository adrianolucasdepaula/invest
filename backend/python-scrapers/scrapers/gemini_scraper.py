# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
Gemini Scraper - Análise via Google Gemini IA
Fonte: https://gemini.google.com/app
Requer login via Google OAuth

OPTIMIZED: Uses Playwright for browser automation
"""
import asyncio
import json
from datetime import datetime
import pytz
from pathlib import Path
from typing import Optional
from loguru import logger

from bs4 import BeautifulSoup
from base_scraper import BaseScraper, ScraperResult


class GeminiScraper(BaseScraper):
    """
    Scraper for Gemini AI analysis via browser

    MIGRATED TO PLAYWRIGHT - Uses Playwright for browser automation
    """

    BASE_URL = "https://gemini.google.com/app"
    COOKIES_FILE = Path("/app/data/cookies/gemini_session.json")

    def __init__(self):
        super().__init__(
            name="Gemini",
            source="GEMINI",
            requires_login=True,
        )

    async def initialize(self):
        """Initialize Playwright browser and load cookies BEFORE navigation"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            cookies_loaded = False
            local_storage_data = {}

            # Load cookies BEFORE navigation (critical for Google OAuth)
            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        session_data = json.load(f)

                    # Handle both formats: direct cookies array or {cookies, localStorage}
                    if isinstance(session_data, dict) and 'cookies' in session_data:
                        cookies = session_data['cookies']
                        local_storage_data = session_data.get('localStorage', {})
                        logger.info(f"Loaded session file with {len(cookies)} cookies and {len(local_storage_data)} localStorage items")
                    else:
                        cookies = session_data
                        logger.info(f"Loaded session file (old format) with {len(cookies)} cookies")

                    gemini_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict):
                            domain = cookie.get('domain', '')
                            # Accept both google.com and gemini.google.com cookies
                            if 'google.com' in domain:
                                pw_cookie = {
                                    'name': cookie.get('name'),
                                    'value': cookie.get('value'),
                                    'domain': domain,
                                    'path': cookie.get('path', '/'),
                                }
                                if 'expires' in cookie and cookie['expires']:
                                    pw_cookie['expires'] = cookie['expires']
                                if 'httpOnly' in cookie:
                                    pw_cookie['httpOnly'] = cookie['httpOnly']
                                if 'secure' in cookie:
                                    pw_cookie['secure'] = cookie['secure']
                                # Validate sameSite - only valid values
                                if 'sameSite' in cookie:
                                    valid_same_site = ['Strict', 'Lax', 'None']
                                    if cookie['sameSite'] in valid_same_site:
                                        pw_cookie['sameSite'] = cookie['sameSite']

                                gemini_cookies.append(pw_cookie)

                    if gemini_cookies:
                        await self.page.context.add_cookies(gemini_cookies)
                        logger.info(f"Added {len(gemini_cookies)} cookies to browser context BEFORE navigation")
                        cookies_loaded = True

                except Exception as e:
                    logger.warning(f"Could not load Gemini cookies: {e}")
            else:
                logger.debug("Gemini cookies not found. Manual login may be required.")

            # Navigate AFTER cookies are loaded
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)

            # Inject localStorage if available
            if local_storage_data:
                try:
                    for key, value in local_storage_data.items():
                        escaped_value = json.dumps(value)
                        await self.page.evaluate(f'localStorage.setItem("{key}", {escaped_value})')
                    logger.info(f"Injected {len(local_storage_data)} localStorage items")
                    # Reload to apply localStorage
                    await self.page.reload(wait_until="load", timeout=60000)
                except Exception as e:
                    logger.warning(f"Could not inject localStorage: {e}")

            await asyncio.sleep(3)

            if cookies_loaded:
                logger.info(f"Gemini initialized with cookies")
            else:
                logger.warning("Gemini initialized WITHOUT cookies - login may be required")

            logger.success(f"Gemini loaded: {self.page.url}")
            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Gemini scraper: {e}")
            raise

    async def scrape(self, prompt: str) -> ScraperResult:
        """
        Send prompt to Gemini and get response

        Args:
            prompt: Question/prompt for Gemini

        Returns:
            ScraperResult with AI response
        """
        try:
            if not self.page:
                await self.initialize()

            logger.info(f"Sending prompt to Gemini: {prompt[:100]}...")

            # Find input field
            input_selectors = [
                "textarea[placeholder*='Enter a prompt']",
                "textarea",
                "div[contenteditable='true']",
            ]

            input_field = None
            for selector in input_selectors:
                try:
                    input_field = await self.page.query_selector(selector)
                    if input_field and await input_field.is_visible():
                        break
                except:
                    continue

            if not input_field:
                return ScraperResult(
                    success=False,
                    error="Input field not found",
                    source=self.source,
                )

            await input_field.fill(prompt)
            await asyncio.sleep(0.5)
            await self.page.keyboard.press("Enter")

            logger.info("Prompt sent, waiting for response...")
            await asyncio.sleep(5)

            response = await self._extract_response()

            if response:
                return ScraperResult(
                    success=True,
                    data={
                        "prompt": prompt,
                        "response": response,
                        "source": "Gemini",
                        "timestamp": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                    },
                    source=self.source,
                    metadata={
                        "prompt_length": len(prompt),
                        "response_length": len(response),
                    },
                )

            return ScraperResult(
                success=False,
                error="No response received from Gemini",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error getting Gemini response: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_response(self) -> Optional[str]:
        """Extract Gemini response from page

        FASE 7.5: BUG-SCRAPER-EXIT137-001 FIX
        Uses BeautifulSoup single fetch pattern to prevent OOM (Exit Code 137)
        - Single await per iteration (page.content()) instead of multiple query_selector_all()
        - Local parsing with BeautifulSoup (no await)
        """
        max_wait = 60
        waited = 0
        check_interval = 2

        previous_text = ""
        stable_count = 0
        stability_threshold = 3

        while waited < max_wait:
            try:
                # FASE 7.5: BUG-SCRAPER-EXIT137-001 FIX
                # Single HTML fetch per iteration (NOT multiple query_selectors)
                html_content = await self.page.content()  # SINGLE await per iteration
                soup = BeautifulSoup(html_content, 'html.parser')  # Local parsing

                response_selectors = [
                    ".model-response",
                    ".response-container",
                    "[class*='response']",
                    ".markdown",
                ]

                current_text = ""
                for selector in response_selectors:
                    try:
                        elements = soup.select(selector)  # Local, no await
                        if elements:
                            last_element = elements[-1]
                            current_text = last_element.get_text(strip=True)  # Local, no await

                            if current_text and len(current_text) > 20:
                                if current_text == previous_text:
                                    stable_count += 1
                                    if stable_count >= stability_threshold:
                                        logger.info(f"Response received ({len(current_text)} chars)")
                                        return current_text
                                else:
                                    stable_count = 0
                                    previous_text = current_text
                                break
                    except:
                        continue

            except Exception as e:
                logger.debug(f"Error while waiting for response: {e}")

            await asyncio.sleep(check_interval)
            waited += check_interval

        if previous_text:
            return previous_text

        return None

    async def health_check(self) -> bool:
        """Check if Gemini is accessible"""
        try:
            await self.initialize()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_gemini():
    """Test Gemini scraper"""
    scraper = GeminiScraper()

    try:
        result = await scraper.scrape("What is the capital of Brazil?")

        if result.success:
            print("✅ Success!")
            print(f"Response: {result.data['response'][:200]}...")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_gemini())
