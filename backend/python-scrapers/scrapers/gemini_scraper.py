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
from pathlib import Path
from typing import Optional
from loguru import logger

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
        """Initialize Playwright browser and load cookies"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # Load cookies if available
            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        cookies = json.load(f)

                    gemini_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict) and 'google.com' in cookie.get('domain', ''):
                            pw_cookie = {
                                'name': cookie.get('name'),
                                'value': cookie.get('value'),
                                'domain': cookie.get('domain'),
                                'path': cookie.get('path', '/'),
                            }
                            if 'expires' in cookie and cookie['expires']:
                                pw_cookie['expires'] = cookie['expires']
                            if 'httpOnly' in cookie:
                                pw_cookie['httpOnly'] = cookie['httpOnly']
                            if 'secure' in cookie:
                                pw_cookie['secure'] = cookie['secure']

                            gemini_cookies.append(pw_cookie)

                    if gemini_cookies:
                        await self.page.context.add_cookies(gemini_cookies)
                        logger.info(f"Loaded {len(gemini_cookies)} cookies for Gemini")
                        await self.page.reload()
                        await asyncio.sleep(3)

                except Exception as e:
                    logger.warning(f"Could not load Gemini cookies: {e}")
            else:
                logger.debug("Gemini cookies not found. Manual login may be required.")

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
                        "timestamp": datetime.now().isoformat(),
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
        """Extract Gemini response from page"""
        max_wait = 60
        waited = 0
        check_interval = 2

        previous_text = ""
        stable_count = 0
        stability_threshold = 3

        while waited < max_wait:
            try:
                response_selectors = [
                    ".model-response",
                    ".response-container",
                    "[class*='response']",
                    ".markdown",
                ]

                for selector in response_selectors:
                    try:
                        elements = await self.page.query_selector_all(selector)
                        if elements:
                            last_element = elements[-1]
                            text = await last_element.text_content()
                            text = text.strip() if text else ""

                            if text and len(text) > 20:
                                if text == previous_text:
                                    stable_count += 1
                                    if stable_count >= stability_threshold:
                                        logger.info(f"Response received ({len(text)} chars)")
                                        return text
                                else:
                                    stable_count = 0
                                    previous_text = text
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
