# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
Grok Scraper - AI Analysis via xAI Grok
Source: https://grok.com/
Requires Google OAuth login

OPTIMIZED: Uses Playwright for browser automation
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Optional
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class GrokScraper(BaseScraper):
    """
    Scraper for Grok AI analysis via browser

    MIGRATED TO PLAYWRIGHT - Uses Playwright for browser automation
    """

    BASE_URL = "https://grok.com/"
    COOKIES_FILE = Path("/app/data/cookies/grok_session.json")

    def __init__(self):
        super().__init__(
            name="Grok",
            source="GROK",
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

                    grok_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict) and ('grok.com' in cookie.get('domain', '') or 'x.ai' in cookie.get('domain', '') or 'google.com' in cookie.get('domain', '')):
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

                            grok_cookies.append(pw_cookie)

                    if grok_cookies:
                        await self.page.context.add_cookies(grok_cookies)
                        logger.info(f"Loaded {len(grok_cookies)} cookies for Grok")
                        await self.page.reload()
                        await asyncio.sleep(3)

                except Exception as e:
                    logger.warning(f"Could not load Grok cookies: {e}")
            else:
                logger.debug("Grok cookies not found. Manual login may be required.")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Grok scraper: {e}")
            raise

    async def scrape(self, prompt: str) -> ScraperResult:
        """
        Send prompt to Grok and get response

        Args:
            prompt: Question/prompt for Grok

        Returns:
            ScraperResult with AI response
        """
        try:
            if not self.page:
                await self.initialize()

            logger.info(f"Sending prompt to Grok: {prompt[:100]}...")

            # Find input field
            input_field = await self._find_input_field()

            if not input_field:
                return ScraperResult(
                    success=False,
                    error="Could not find chat input field",
                    source=self.source,
                )

            # Send prompt
            await input_field.click()
            await asyncio.sleep(0.5)
            await input_field.fill(prompt)
            await asyncio.sleep(0.5)

            # Submit (Enter or button)
            try:
                send_button = await self.page.query_selector(
                    "button[aria-label*='Send'], button[type='submit'], button[class*='send']"
                )
                if send_button:
                    await send_button.click()
                else:
                    await self.page.keyboard.press("Enter")
            except:
                await self.page.keyboard.press("Enter")

            logger.info("Prompt sent, waiting for response...")

            # Wait for response
            response_text = await self._extract_response()

            if response_text:
                return ScraperResult(
                    success=True,
                    data={
                        "prompt": prompt,
                        "response": response_text,
                        "source": "Grok",
                        "timestamp": datetime.now().isoformat(),
                    },
                    source=self.source,
                    metadata={
                        "prompt_length": len(prompt),
                        "response_length": len(response_text),
                    },
                )

            return ScraperResult(
                success=False,
                error="No response received from Grok",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error getting Grok response: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _find_input_field(self):
        """Find the chat input field"""
        input_selectors = [
            "textarea[placeholder*='Ask']",
            "textarea[placeholder*='Message']",
            "textarea[class*='input']",
            "textarea",
            "div[contenteditable='true']",
            "input[type='text']",
        ]

        for selector in input_selectors:
            try:
                input_field = await self.page.query_selector(selector)
                if input_field and await input_field.is_visible():
                    return input_field
            except:
                continue

        return None

    async def _extract_response(self) -> Optional[str]:
        """Extract Grok response from page"""
        max_wait = 60  # 60 seconds max
        waited = 0
        check_interval = 2

        previous_text = ""
        stable_count = 0
        stability_threshold = 3  # Response must be stable for 6 seconds

        while waited < max_wait:
            try:
                # Look for response messages
                response_selectors = [
                    "[data-testid*='grok-response']",
                    "[data-testid*='assistant']",
                    "[class*='response']",
                    "[class*='message'][class*='assistant']",
                    "[class*='message'][class*='bot']",
                    "[class*='ai-message']",
                    ".markdown",
                    "[class*='answer']",
                ]

                for selector in response_selectors:
                    try:
                        elements = await self.page.query_selector_all(selector)
                        if elements:
                            # Get the last (most recent) response
                            last_response = elements[-1]
                            current_text = await last_response.text_content()
                            current_text = current_text.strip() if current_text else ""

                            # Check if response is meaningful
                            if current_text and len(current_text) > 20:
                                # Check if text has stopped changing (response complete)
                                if current_text == previous_text:
                                    stable_count += 1

                                    if stable_count >= stability_threshold:
                                        logger.info(f"Response received ({len(current_text)} chars)")
                                        return current_text
                                else:
                                    # Text changed, reset stability counter
                                    stable_count = 0
                                    previous_text = current_text
                                    logger.debug(f"Response growing... ({len(current_text)} chars)")
                    except:
                        continue

            except Exception as e:
                logger.debug(f"Error while waiting for response: {e}")

            await asyncio.sleep(check_interval)
            waited += check_interval

        # Timeout reached, return what we have
        if previous_text:
            logger.warning(f"Timeout reached, returning partial response ({len(previous_text)} chars)")
            return previous_text

        return None

    async def health_check(self) -> bool:
        """Check if Grok is accessible"""
        try:
            await self.initialize()
            input_field = await self._find_input_field()
            return input_field is not None
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_grok():
    """Test Grok scraper"""
    scraper = GrokScraper()

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
    asyncio.run(test_grok())
