# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
ChatGPT Scraper - Análise via IA
Fonte: https://chatgpt.com/
Acesso via browser (SEM API oficial para uso gratuito)
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


class ChatGPTScraper(BaseScraper):
    """
    Scraper for ChatGPT AI analysis via browser

    MIGRATED TO PLAYWRIGHT - Uses Playwright for browser automation
    """

    BASE_URL = "https://chatgpt.com"
    COOKIES_FILE = Path("/app/data/cookies/chatgpt_session.json")

    def __init__(self):
        super().__init__(
            name="ChatGPT",
            source="CHATGPT",
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

                    chatgpt_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict) and ('openai.com' in cookie.get('domain', '') or 'chatgpt.com' in cookie.get('domain', '')):
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

                            chatgpt_cookies.append(pw_cookie)

                    if chatgpt_cookies:
                        await self.page.context.add_cookies(chatgpt_cookies)
                        logger.info(f"Loaded {len(chatgpt_cookies)} cookies for ChatGPT")
                        await self.page.reload()
                        await asyncio.sleep(3)

                except Exception as e:
                    logger.warning(f"Could not load ChatGPT cookies: {e}")
            else:
                logger.debug("ChatGPT cookies not found. Manual login may be required.")

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
                element = await self.page.query_selector(selector)
                if element:
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
        try:
            if not self.page:
                await self.initialize()

            logger.info(f"Sending prompt to ChatGPT: {prompt[:100]}...")

            # Navigate to chat (new chat)
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
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
            await input_field.click()
            await asyncio.sleep(0.5)
            await input_field.fill(prompt)
            await asyncio.sleep(0.5)

            # Submit (Enter or button)
            try:
                send_button = await self.page.query_selector("button[data-testid='send-button'], button[aria-label='Send']")
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
                input_field = await self.page.query_selector(selector)
                if input_field and await input_field.is_visible():
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
                        elements = await self.page.query_selector_all(selector)
                        if elements:
                            response_elements = elements
                            break
                    except:
                        continue

                if response_elements:
                    # Get the last (most recent) response
                    last_response = response_elements[-1]
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


# Test function
async def test_chatgpt():
    """Test ChatGPT scraper"""
    scraper = ChatGPTScraper()

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
    asyncio.run(test_chatgpt())
