"""
ChatGPT Scraper - Análise via IA
Fonte: https://chatgpt.com/
Acesso via browser (SEM API oficial para uso gratuito)
Requer login via Google OAuth
"""
import asyncio
import pickle
from datetime import datetime
from typing import Dict, Any, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class ChatGPTScraper(BaseScraper):
    """Scraper for ChatGPT AI analysis via browser"""

    BASE_URL = "https://chatgpt.com"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="ChatGPT",
            source="CHATGPT",
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
                    if 'openai.com' in cookie.get('domain', '') or 'chatgpt.com' in cookie.get('domain', ''):
                        try:
                            self.driver.add_cookie(cookie)
                        except Exception as e:
                            logger.debug(f"Could not add cookie: {e}")

                self.driver.refresh()
                await asyncio.sleep(3)

            except FileNotFoundError:
                logger.warning("Google cookies not found. Manual login may be required.")

            if not await self._verify_logged_in():
                logger.warning("Login verification failed - manual login may be required")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing ChatGPT scraper: {e}")
            raise

    async def _verify_logged_in(self) -> bool:
        """Check if logged in"""
        logout_selectors = [
            "[data-testid='profile-button']",
            ".user-avatar",
            "[aria-label*='Profile']",
            "button[id*='headlessui-menu']",
        ]

        for selector in logout_selectors:
            try:
                elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                if elements:
                    return True
            except:
                continue

        return False

    async def scrape(self, prompt: str) -> ScraperResult:
        """
        Send prompt to ChatGPT and get response

        Args:
            prompt: Question/prompt for ChatGPT

        Returns:
            ScraperResult with AI response
        """
        await self.initialize()

        try:
            logger.info(f"Sending prompt to ChatGPT: {prompt[:100]}...")

            # Navigate to chat (new chat)
            chat_url = f"{self.BASE_URL}"
            self.driver.get(chat_url)
            await asyncio.sleep(3)

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
                # Try to find and click send button
                send_button = self.driver.find_element(By.CSS_SELECTOR, "button[data-testid='send-button'], button[aria-label='Send']")
                send_button.click()
            except:
                # Fallback to Enter key
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
                        "source": "ChatGPT",
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
                error="No response received from ChatGPT",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error getting ChatGPT response: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _find_input_field(self):
        """Find the chat input field"""
        input_selectors = [
            "#prompt-textarea",
            "textarea[placeholder*='Message']",
            "textarea[data-id='root']",
            "textarea",
            "div[contenteditable='true']",
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
        """Extract ChatGPT response from page"""
        max_wait = 120  # 2 minutes max
        waited = 0
        check_interval = 2

        previous_text = ""
        stable_count = 0
        stability_threshold = 3  # Response must be stable for 6 seconds

        while waited < max_wait:
            try:
                # Look for response messages
                response_selectors = [
                    "[data-message-author-role='assistant']",
                    ".agent-turn",
                    ".markdown",
                    "[class*='agent']",
                    "[class*='assistant']",
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

                # Check if we're getting "thinking" indicator
                thinking_selectors = [
                    "[class*='loading']",
                    "[class*='thinking']",
                    ".result-streaming",
                ]

                is_thinking = False
                for selector in thinking_selectors:
                    try:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                        if elements:
                            is_thinking = True
                            logger.debug("ChatGPT is thinking...")
                            break
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
        """Check if ChatGPT is accessible"""
        try:
            await self.initialize()

            # Check if we can find the input field
            input_field = await self._find_input_field()
            return input_field is not None

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
