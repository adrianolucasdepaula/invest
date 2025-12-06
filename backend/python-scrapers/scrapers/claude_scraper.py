# MIGRATED TO PLAYWRIGHT - 2025-12-04
# UPDATED: 2025-12-06 - Added session validation and dual cookie format support
"""
Claude Scraper - AI Analysis via Anthropic Claude
Source: https://claude.ai/new
Requires Google OAuth login

OPTIMIZED: Uses Playwright for browser automation
"""
import asyncio
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class ClaudeScraper(BaseScraper):
    """
    Scraper for Claude AI analysis via browser

    MIGRATED TO PLAYWRIGHT - Uses Playwright for browser automation
    """

    BASE_URL = "https://claude.ai/new"
    COOKIES_FILE = Path("/app/data/cookies/claude_session.json")

    def __init__(self):
        super().__init__(
            name="Claude",
            source="CLAUDE",
            requires_login=True,
        )

    async def initialize(self):
        """Initialize Playwright browser and load cookies BEFORE navigation"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            # STEP 1: Load cookies BEFORE navigation (critical for OAuth sessions)
            cookies_loaded = await self._load_cookies_to_context()

            if cookies_loaded:
                logger.info("Claude cookies loaded BEFORE navigation")
            else:
                logger.warning("Claude: No cookies loaded - login may be required")

            # STEP 2: Now navigate with cookies already set
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # STEP 3: Verify session is active
            session_valid = await self._verify_session()

            # Log session status
            if session_valid:
                logger.success(f"Claude session verified: {self.page.url}")
            elif cookies_loaded:
                logger.warning("Claude cookies loaded but session may not be valid")
            else:
                logger.warning("Claude: No session - login required")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Claude scraper: {e}")
            raise

    async def _load_cookies_to_context(self) -> bool:
        """
        Load cookies to browser context BEFORE navigation

        Supports both formats:
        - List format: [{name, value, domain, ...}, ...]
        - Dict format: {cookies: [...], localStorage: {...}}

        Returns:
            True if cookies were loaded successfully
        """
        if not self.COOKIES_FILE.exists():
            logger.debug(f"Claude cookies file not found: {self.COOKIES_FILE}")
            return False

        try:
            with open(self.COOKIES_FILE, 'r', encoding='utf-8') as f:
                session_data = json.load(f)

            # Handle both formats (list and dict with cookies key)
            if isinstance(session_data, list):
                cookies = session_data
            else:
                cookies = session_data.get('cookies', [])

            if not cookies:
                return False

            # Filter and validate cookies
            valid_cookies = []
            for cookie in cookies:
                if not isinstance(cookie, dict):
                    continue

                domain = cookie.get('domain', '')
                # Accept claude.ai, anthropic.com and google.com cookies
                if not ('claude.ai' in domain or 'anthropic.com' in domain or 'google.com' in domain):
                    continue

                # Check cookie expiration
                if not self._is_cookie_valid(cookie):
                    continue

                converted = self._convert_cookie_for_playwright(cookie)
                if converted:
                    valid_cookies.append(converted)

            if valid_cookies:
                await self.page.context.add_cookies(valid_cookies)
                logger.info(f"Loaded {len(valid_cookies)} valid cookies BEFORE navigation")
                return True

            return False

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in Claude cookies file: {e}")
            return False
        except Exception as e:
            logger.warning(f"Could not load Claude cookies: {e}")
            return False

    def _is_cookie_valid(self, cookie: dict) -> bool:
        """Check if cookie is not expired"""
        expires = cookie.get('expires') or cookie.get('expirationDate')
        if expires and expires > 0:
            # expires is Unix timestamp
            return expires > time.time()
        # No expiration = session cookie = valid
        return True

    def _convert_cookie_for_playwright(self, cookie: dict) -> Optional[dict]:
        """
        Convert cookie to Playwright format

        Playwright requires: name, value, domain (or url)
        Optional: path, expires, httpOnly, secure, sameSite
        """
        try:
            name = cookie.get('name')
            value = cookie.get('value')
            domain = cookie.get('domain', '')

            if not name or value is None:
                return None

            # Ensure domain starts with dot for wildcard matching
            if domain and not domain.startswith('.') and not domain.startswith('http'):
                domain = '.' + domain

            pw_cookie = {
                'name': name,
                'value': str(value),
                'domain': domain,
                'path': cookie.get('path', '/'),
            }

            # Optional fields
            expires = cookie.get('expires') or cookie.get('expirationDate')
            if expires and expires > 0:
                pw_cookie['expires'] = expires

            if 'httpOnly' in cookie:
                pw_cookie['httpOnly'] = cookie['httpOnly']

            if 'secure' in cookie:
                pw_cookie['secure'] = cookie['secure']

            if cookie.get('sameSite'):
                # Playwright expects: "Strict", "Lax", "None"
                same_site = cookie['sameSite']
                if same_site.lower() in ['strict', 'lax', 'none']:
                    pw_cookie['sameSite'] = same_site.capitalize()
                    if same_site.lower() == 'none':
                        pw_cookie['sameSite'] = 'None'

            return pw_cookie

        except Exception as e:
            logger.debug(f"Error converting cookie: {e}")
            return None

    async def _verify_session(self) -> bool:
        """
        Verify that Claude session is active (not redirected to login)

        Returns:
            True if session appears to be active
        """
        try:
            await asyncio.sleep(2)  # Wait for any redirects

            current_url = self.page.url.lower()

            # Check for login/signin redirect
            login_indicators = ['login', 'sign', 'oauth', 'accounts.google', 'continue with']
            if any(indicator in current_url for indicator in login_indicators):
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
            positive_indicators = ['new chat', 'start a new chat', 'type a message', 'send a message']
            if any(indicator in html_lower for indicator in positive_indicators):
                logger.debug("Session valid - authenticated page indicators found")
                return True

            # Negative indicators
            negative_indicators = ['sign in', 'log in', 'continue with google', 'create account']
            if any(indicator in html_lower for indicator in negative_indicators):
                logger.warning("Session invalid - login page indicators found")
                return False

            # Unknown state
            logger.debug("Session status uncertain")
            return False

        except Exception as e:
            logger.error(f"Error verifying session: {e}")
            return False

    async def scrape(self, prompt: str) -> ScraperResult:
        """
        Send prompt to Claude and get response

        Args:
            prompt: Question/prompt for Claude

        Returns:
            ScraperResult with AI response
        """
        try:
            if not self.page:
                await self.initialize()

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
        """Find the chat input field for Claude.ai interface"""
        input_selectors = [
            # Claude.ai specific selectors (2024-2025 interface)
            "div[contenteditable='true'][data-placeholder]",
            "div.ProseMirror[contenteditable='true']",
            "div[contenteditable='true'][placeholder*='Talk']",
            "div[contenteditable='true'][placeholder*='Message']",
            "div[contenteditable='true'][aria-label*='Message']",
            # Textarea fallbacks
            "textarea[placeholder*='Talk']",
            "textarea[placeholder*='Message']",
            "textarea[aria-label*='Message']",
            # Generic contenteditable
            "div[contenteditable='true']",
            "textarea",
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
            if "login" in page_text.lower() or "sign in" in page_text.lower() or "continue with" in page_text.lower():
                logger.warning("Claude login page detected - cookies may be required")
        except:
            pass

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
        """Check if Claude is accessible and authenticated"""
        try:
            await self.initialize()

            # Check both input field and session validity
            input_field = await self._find_input_field()
            session_valid = await self._verify_session()

            if input_field and session_valid:
                logger.success("Claude health check: PASS")
                return True
            elif input_field:
                logger.warning("Claude health check: Input found but session uncertain")
                return True
            else:
                logger.warning("Claude health check: FAIL - no input field")
                return False

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_claude():
    """Test Claude scraper"""
    scraper = ClaudeScraper()

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
    asyncio.run(test_claude())
