# MIGRATED TO PLAYWRIGHT - 2025-12-04
# UPDATED: 2025-12-06 - Added localStorage verification
"""
DeepSeek Scraper - AI Analysis via DeepSeek
Source: https://chat.deepseek.com/
Requires login (email or Google OAuth)

OPTIMIZED: Uses Playwright for browser automation with stealth
"""
import asyncio
import json
import time
from datetime import datetime
import pytz
from pathlib import Path
from typing import Optional, Dict, Any
from loguru import logger

from bs4 import BeautifulSoup
from base_scraper import BaseScraper, ScraperResult


class DeepSeekScraper(BaseScraper):
    """
    Scraper for DeepSeek AI analysis via browser

    MIGRATED TO PLAYWRIGHT - Uses Playwright for browser automation
    """

    BASE_URL = "https://chat.deepseek.com/"
    COOKIES_FILE = Path("/app/data/cookies/deepseek_session.json")

    def __init__(self):
        super().__init__(
            name="DeepSeek",
            source="DEEPSEEK",
            requires_login=True,
        )

    async def initialize(self):
        """Initialize Playwright browser and load cookies + localStorage BEFORE navigation"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            # Load session data (cookies + localStorage) BEFORE navigating
            cookies_loaded = False
            local_storage_loaded = False
            local_storage_data = {}

            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        session_data = json.load(f)

                    # Handle both old format (list) and new format (dict with cookies + localStorage)
                    if isinstance(session_data, dict) and 'cookies' in session_data:
                        cookies = session_data['cookies']
                        local_storage_data = session_data.get('localStorage', {})
                        logger.info(f"Loaded session file with {len(cookies)} cookies and {len(local_storage_data)} localStorage items")
                    else:
                        # Old format - just cookies list
                        cookies = session_data
                        local_storage_data = {}
                        logger.info(f"Loaded session file (old format) with {len(cookies)} cookies")

                    deepseek_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict):
                            domain = cookie.get('domain', '')
                            # Accept deepseek.com and google.com cookies
                            if 'deepseek.com' in domain or 'google.com' in domain:
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
                                if 'sameSite' in cookie:
                                    pw_cookie['sameSite'] = cookie['sameSite']

                                deepseek_cookies.append(pw_cookie)

                    if deepseek_cookies:
                        await self.page.context.add_cookies(deepseek_cookies)
                        logger.info(f"Added {len(deepseek_cookies)} cookies to browser context")
                        cookies_loaded = True

                except Exception as e:
                    logger.warning(f"Could not load DeepSeek session: {e}")
            else:
                logger.debug("DeepSeek session file not found. Manual login may be required.")

            # First navigate to set the origin for localStorage
            await self.page.goto(self.BASE_URL, wait_until="domcontentloaded", timeout=60000)

            # Inject localStorage AFTER page loads (required for same-origin policy)
            if local_storage_data:
                try:
                    # Inject each localStorage item
                    for key, value in local_storage_data.items():
                        # Escape the value properly for JavaScript
                        escaped_value = json.dumps(value)
                        await self.page.evaluate(f'localStorage.setItem("{key}", {escaped_value})')
                    logger.info(f"Injected {len(local_storage_data)} localStorage items")
                    local_storage_loaded = True

                    # VERIFICATION: Check if userToken was actually injected
                    verified = await self._verify_local_storage_injection(local_storage_data)
                    if verified:
                        logger.success("localStorage injection VERIFIED")
                    else:
                        logger.warning("localStorage injection FAILED verification")
                        local_storage_loaded = False

                    # Reload page to apply localStorage
                    logger.info("Reloading page to apply localStorage...")
                    await self.page.reload(wait_until="load", timeout=60000)
                except Exception as e:
                    logger.warning(f"Could not inject localStorage: {e}")

            await asyncio.sleep(3)

            # Verify session is active
            session_valid = await self._verify_session()

            # Log session status
            if cookies_loaded or local_storage_loaded:
                logger.info(f"DeepSeek initialized (cookies={cookies_loaded}, localStorage={local_storage_loaded}, session={session_valid})")
            else:
                logger.warning("DeepSeek initialized WITHOUT session data - login may be required")

            # Check final URL
            if 'sign_in' in self.page.url:
                logger.warning(f"DeepSeek redirected to login: {self.page.url}")
            elif session_valid:
                logger.success(f"DeepSeek authenticated: {self.page.url}")
            else:
                logger.warning(f"DeepSeek session may not be valid: {self.page.url}")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing DeepSeek scraper: {e}")
            raise

    async def scrape(self, prompt: str) -> ScraperResult:
        """
        Send prompt to DeepSeek and get response

        Args:
            prompt: Question/prompt for DeepSeek

        Returns:
            ScraperResult with AI response
        """
        try:
            if not self.page:
                await self.initialize()

            logger.info(f"Sending prompt to DeepSeek: {prompt[:100]}...")

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
                    "button[type='submit'], button[aria-label*='Send'], button[class*='send']"
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
                        "source": "DeepSeek",
                        "timestamp": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                    },
                    source=self.source,
                    metadata={
                        "prompt_length": len(prompt),
                        "response_length": len(response_text),
                    },
                )

            return ScraperResult(
                success=False,
                error="No response received from DeepSeek",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error getting DeepSeek response: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _find_input_field(self):
        """Find the chat input field for DeepSeek chat interface"""
        input_selectors = [
            # DeepSeek chat specific selectors
            "textarea#chat-input",
            "textarea[placeholder*='Send a message']",
            "textarea[placeholder*='Message']",
            "textarea[placeholder*='Ask']",
            "textarea[class*='chat']",
            "textarea[class*='input']",
            "#chat-input",
            # Generic fallbacks
            "textarea",
            "div[contenteditable='true']",
            "input[type='text'][placeholder*='message']",
        ]

        for selector in input_selectors:
            try:
                input_field = await self.page.query_selector(selector)
                if input_field and await input_field.is_visible():
                    logger.debug(f"Found input field with selector: {selector}")
                    return input_field
            except:
                continue

        # Log what's on the page for debugging
        try:
            page_text = await self.page.content()
            if "login" in page_text.lower() or "sign in" in page_text.lower():
                logger.warning("DeepSeek login page detected - cookies may be required")
        except:
            pass

        return None

    async def _extract_response(self) -> Optional[str]:
        """Extract DeepSeek response from page

        FASE 7.5: BUG-SCRAPER-EXIT137-001 FIX
        Uses BeautifulSoup single fetch pattern to prevent OOM (Exit Code 137)
        - Single await per iteration (page.content()) instead of query_selector_all()
        - Local parsing with BeautifulSoup (no await)
        """
        max_wait = 60  # 60 seconds max
        waited = 0
        check_interval = 2

        previous_text = ""
        stable_count = 0
        stability_threshold = 3  # Response must be stable for 6 seconds

        while waited < max_wait:
            try:
                # FASE 7.5: BUG-SCRAPER-EXIT137-001 FIX
                # Single HTML fetch per iteration (NOT multiple query_selectors)
                html_content = await self.page.content()  # SINGLE await per iteration
                soup = BeautifulSoup(html_content, 'html.parser')  # Local parsing

                # Primary selector for DeepSeek responses (local, no await)
                elements = soup.select('.ds-markdown')

                if elements:
                    # Get the last (most recent) response
                    last_response = elements[-1]
                    current_text = last_response.get_text(strip=True)  # Local, no await

                    # Check if response exists (min 1 char)
                    if current_text:
                        # Check if text has stopped changing (response complete)
                        if current_text == previous_text:
                            stable_count += 1
                            logger.debug(f"Response stable ({stable_count}/{stability_threshold}): {len(current_text)} chars")

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

    async def _verify_local_storage_injection(self, expected_data: Dict[str, Any]) -> bool:
        """
        Verify that localStorage items were actually injected

        Args:
            expected_data: Dictionary of expected localStorage items

        Returns:
            True if critical items (userToken) are present
        """
        try:
            # Check for userToken specifically (required for DeepSeek auth)
            if 'userToken' in expected_data:
                retrieved_token = await self.page.evaluate('localStorage.getItem("userToken")')
                if retrieved_token:
                    # Compare with expected (first 50 chars to avoid logging full token)
                    expected_preview = str(expected_data['userToken'])[:50]
                    retrieved_preview = str(retrieved_token)[:50]

                    if expected_preview == retrieved_preview:
                        logger.info(f"userToken verified in localStorage: {retrieved_preview}...")
                        return True
                    else:
                        logger.warning("userToken mismatch after injection")
                        return False
                else:
                    logger.warning("userToken NOT found in localStorage after injection")
                    return False

            # If no userToken expected, check other items
            for key in expected_data.keys():
                retrieved = await self.page.evaluate(f'localStorage.getItem("{key}")')
                if retrieved:
                    logger.debug(f"localStorage[{key}] verified")
                    return True

            return False

        except Exception as e:
            logger.error(f"Error verifying localStorage: {e}")
            return False

    async def _verify_session(self) -> bool:
        """
        Verify that DeepSeek session is active (not redirected to login)

        Returns:
            True if session appears to be active
        """
        try:
            await asyncio.sleep(2)  # Wait for any redirects

            current_url = self.page.url.lower()

            # Check for login/signin redirect
            if 'sign_in' in current_url or 'login' in current_url:
                logger.warning("Session invalid - redirected to login page")
                return False

            # Check for chat input field (indicates authenticated session)
            input_field = await self._find_input_field()
            if input_field:
                logger.debug("Session valid - chat input field found")
                return True

            # Check page content for authentication indicators
            html = await self.page.content()
            html_lower = html.lower()

            # Positive indicators
            positive_indicators = ['new chat', 'nova conversa', 'history', 'histórico', 'chat-input']
            if any(indicator in html_lower for indicator in positive_indicators):
                logger.debug("Session valid - authenticated page indicators found")
                return True

            # Negative indicators
            negative_indicators = ['sign in', 'login', 'log in', 'create account', 'register']
            if any(indicator in html_lower for indicator in negative_indicators):
                logger.warning("Session invalid - login page indicators found")
                return False

            # Unknown state
            logger.debug("Session status uncertain")
            return False

        except Exception as e:
            logger.error(f"Error verifying session: {e}")
            return False

    async def health_check(self) -> bool:
        """Check if DeepSeek is accessible and authenticated"""
        try:
            await self.initialize()

            # Check both input field and session validity
            input_field = await self._find_input_field()
            session_valid = await self._verify_session()

            if input_field and session_valid:
                logger.success("DeepSeek health check: PASS")
                return True
            elif input_field:
                logger.warning("DeepSeek health check: Input found but session uncertain")
                return True
            else:
                logger.warning("DeepSeek health check: FAIL - no input field")
                return False

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_deepseek():
    """Test DeepSeek scraper"""
    scraper = DeepSeekScraper()

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
    asyncio.run(test_deepseek())
