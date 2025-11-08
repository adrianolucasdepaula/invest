"""
Claude Scraper - AI Analysis via Anthropic Claude
Source: https://claude.ai/new
Requires Google OAuth login
"""
import asyncio
import pickle
from datetime import datetime
from typing import Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class ClaudeScraper(BaseScraper):
    """Scraper for Claude AI analysis via browser"""

    BASE_URL = "https://claude.ai/new"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="Claude",
            source="CLAUDE",
            requires_login=True,
        )

    async def initialize(self):
        """Load Google OAuth cookies"""
        if self._initialized:
            return

        if not self.driver:
            self.driver = self._create_driver()

        try:
            self.driver.get(self.BASE_URL)
            await asyncio.sleep(3)

            try:
                with open(self.COOKIES_FILE, 'rb') as f:
                    cookies = pickle.load(f)

                for cookie in cookies:
                    if 'claude.ai' in cookie.get('domain', '') or 'anthropic.com' in cookie.get('domain', '') or 'google.com' in cookie.get('domain', ''):
                        try:
                            self.driver.add_cookie(cookie)
                        except Exception as e:
                            logger.debug(f"Could not add cookie: {e}")

                self.driver.refresh()
                await asyncio.sleep(3)

            except FileNotFoundError:
                logger.warning("Google cookies not found. Manual login may be required.")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Claude scraper: {e}")
            raise

    async def scrape(self, prompt: str) -> ScraperResult:
        """
        Send prompt to Claude and get response

        Args:
            prompt: Question/prompt for Claude

        Returns:
            ScraperResult with AI response
        """
        await self.initialize()

        try:
            logger.info(f"Sending prompt to Claude: {prompt[:100]}...")

            # Find input field
            input_field = await self._find_input_field()

            if not input_field:
                return ScraperResult(
                    success=False,
                    error="Could not find chat input field",
                    source=self.source,
                )

            # Send prompt
            input_field.click()
            await asyncio.sleep(0.5)
            input_field.send_keys(prompt)
            await asyncio.sleep(0.5)

            # Submit (Enter or button)
            try:
                send_button = self.driver.find_element(
                    By.CSS_SELECTOR,
                    "button[aria-label*='Send'], button[type='submit'], button[class*='send']"
                )
                send_button.click()
            except:
                input_field.send_keys(Keys.RETURN)

            logger.info("Prompt sent, waiting for response...")

            # Wait for response
            response_text = await self._extract_response()

            if response_text:
                return ScraperResult(
                    success=True,
                    data={
                        "prompt": prompt,
                        "response": response_text,
                        "source": "Claude",
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
                error="No response received from Claude",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error getting Claude response: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _find_input_field(self):
        """Find the chat input field"""
        input_selectors = [
            "div[contenteditable='true'][placeholder*='Talk']",
            "div[contenteditable='true']",
            "textarea[placeholder*='Talk']",
            "textarea[placeholder*='Message']",
            "textarea",
            "input[type='text']",
        ]

        for selector in input_selectors:
            try:
                input_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                if input_field and input_field.is_displayed():
                    return input_field
            except:
                continue

        return None

    async def _extract_response(self) -> Optional[str]:
        """Extract Claude response from page"""
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
                    "[data-is-streaming='false']",
                    "[class*='font-claude-message']",
                    "[class*='prose']",
                    "div[class*='message'][class*='assistant']",
                    ".markdown",
                    "[data-test-render-count]",
                ]

                response_elements = []
                for selector in response_selectors:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            response_elements = elements
                            break
                    except:
                        continue

                if response_elements:
                    # Get the last (most recent) response
                    last_response = response_elements[-1]
                    current_text = last_response.text.strip()

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
        """Check if Claude is accessible"""
        try:
            await self.initialize()
            input_field = await self._find_input_field()
            return input_field is not None
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
