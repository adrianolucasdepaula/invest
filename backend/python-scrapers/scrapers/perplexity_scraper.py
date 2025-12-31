# CREATED 2025-12-04
"""
Perplexity Scraper - AI Search and Analysis
Source: https://www.perplexity.ai/
Requires Google OAuth login

OPTIMIZED: Uses Playwright for browser automation with stealth
Direct browser access (no API - we don't have API access)
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


class PerplexityScraper(BaseScraper):
    """
    Scraper for Perplexity AI search via browser

    Requires Google OAuth for full access
    Direct browser interaction (no API)
    """

    BASE_URL = "https://www.perplexity.ai/"
    COOKIES_FILE = Path("/app/data/cookies/perplexity_session.json")

    def __init__(self):
        super().__init__(
            name="Perplexity",
            source="PERPLEXITY",
            requires_login=True,
        )

    async def initialize(self):
        """Initialize Playwright browser and load cookies + localStorage BEFORE navigation"""
        if self._initialized:
            return

        await super().initialize()

        try:
            cookies_loaded = False
            local_storage_loaded = False
            local_storage_data = {}

            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        session_data = json.load(f)

                    if isinstance(session_data, dict) and 'cookies' in session_data:
                        cookies = session_data['cookies']
                        local_storage_data = session_data.get('localStorage', {})
                        logger.info(f"Loaded session file with {len(cookies)} cookies and {len(local_storage_data)} localStorage items")
                    else:
                        cookies = session_data
                        local_storage_data = {}
                        logger.info(f"Loaded session file (old format) with {len(cookies)} cookies")

                    perplexity_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict):
                            domain = cookie.get('domain', '')
                            if 'perplexity.ai' in domain or 'google.com' in domain:
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
                                perplexity_cookies.append(pw_cookie)

                    if perplexity_cookies:
                        await self.page.context.add_cookies(perplexity_cookies)
                        logger.info(f"Added {len(perplexity_cookies)} cookies to browser context")
                        cookies_loaded = True

                except Exception as e:
                    logger.warning(f"Could not load Perplexity session: {e}")
            else:
                logger.debug("Perplexity session file not found. Manual login may be required.")

            await self.page.goto(self.BASE_URL, wait_until="domcontentloaded", timeout=60000)

            if local_storage_data:
                try:
                    for key, value in local_storage_data.items():
                        escaped_value = json.dumps(value)
                        await self.page.evaluate(f'localStorage.setItem("{key}", {escaped_value})')
                    logger.info(f"Injected {len(local_storage_data)} localStorage items")
                    local_storage_loaded = True
                    await self.page.reload(wait_until="load", timeout=60000)
                except Exception as e:
                    logger.warning(f"Could not inject localStorage: {e}")

            await asyncio.sleep(2)

            if cookies_loaded or local_storage_loaded:
                logger.info(f"Perplexity initialized (cookies={cookies_loaded}, localStorage={local_storage_loaded})")
            else:
                logger.warning("Perplexity initialized WITHOUT session data - login may be required")

            logger.success(f"Perplexity loaded: {self.page.url}")
            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Perplexity scraper: {e}")
            raise

    async def scrape(self, query: str) -> ScraperResult:
        """
        Send search query to Perplexity and get AI response

        Args:
            query: Search query or question for Perplexity

        Returns:
            ScraperResult with AI search response
        """
        try:
            if not self.page:
                await self.initialize()

            logger.info(f"Sending query to Perplexity: {query[:100]}...")

            # Find input field
            input_field = await self._find_input_field()

            if not input_field:
                return ScraperResult(
                    success=False,
                    error="Could not find search input field",
                    source=self.source,
                )

            # Clear any existing text and send query
            await input_field.click()
            await asyncio.sleep(0.5)

            # Use keyboard.type() for contenteditable divs (fill() doesn't work well)
            # First clear any existing text
            await self.page.keyboard.press("Control+a")
            await asyncio.sleep(0.2)

            # Type the query character by character for better compatibility
            await self.page.keyboard.type(query, delay=30)
            await asyncio.sleep(0.5)

            # Submit query with Enter
            await self.page.keyboard.press("Enter")

            logger.info("Query sent, waiting for response...")

            # Wait for response
            response_data = await self._extract_response()

            if response_data:
                return ScraperResult(
                    success=True,
                    data={
                        "query": query,
                        "response": response_data.get("answer", ""),
                        "sources": response_data.get("sources", []),
                        "source": "Perplexity",
                        "timestamp": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                    },
                    source=self.source,
                    metadata={
                        "query_length": len(query),
                        "response_length": len(response_data.get("answer", "")),
                        "sources_count": len(response_data.get("sources", [])),
                    },
                )

            return ScraperResult(
                success=False,
                error="No response received from Perplexity",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error getting Perplexity response: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _find_input_field(self):
        """Find the search input field for Perplexity"""
        input_selectors = [
            # Perplexity specific selectors
            "textarea[placeholder*='Ask']",
            "textarea[placeholder*='Search']",
            "textarea[placeholder*='anything']",
            "textarea[class*='search']",
            "textarea[class*='input']",
            "input[placeholder*='Ask']",
            "input[placeholder*='Search']",
            # Generic fallbacks
            "textarea",
            "div[contenteditable='true']",
            "input[type='text']",
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
                logger.warning("Perplexity login page detected - cookies may be required")
        except:
            pass

        return None

    async def _extract_response(self) -> Optional[dict]:
        """Extract Perplexity response from page

        FASE 7.5: BUG-SCRAPER-EXIT137-001 FIX
        Uses BeautifulSoup single fetch pattern to prevent OOM (Exit Code 137)
        - Single await per iteration (page.content()) instead of multiple query_selector_all()
        - Local parsing with BeautifulSoup (no await)
        """
        max_wait = 60  # 60 seconds max
        waited = 0
        check_interval = 2

        previous_text = ""
        stable_count = 0
        stability_threshold = 3  # Response must be stable for 6 seconds

        # Wait for URL to change (indicates search started)
        initial_url = self.page.url
        while waited < 10:
            await asyncio.sleep(1)
            waited += 1
            if self.page.url != initial_url and '/search/' in self.page.url:
                logger.debug(f"URL changed to: {self.page.url}")
                break

        # Now wait for response content
        waited = 0
        while waited < max_wait:
            try:
                # FASE 7.5: BUG-SCRAPER-EXIT137-001 FIX
                # Single HTML fetch per iteration (NOT multiple query_selectors)
                html_content = await self.page.content()  # SINGLE await per iteration
                soup = BeautifulSoup(html_content, 'html.parser')  # Local parsing

                # Look for the main answer text - Perplexity typically has the answer
                # in a div that contains substantial text about the query
                best_text = ""

                # Strategy 1: Find divs with substantial text content
                for div in soup.select('div'):
                    text = div.get_text(strip=True)
                    # Look for meaningful response (not just UI elements)
                    if len(text) > 100 and len(text) < 10000:
                        # Skip if it's clearly navigation/UI
                        if any(skip in text[:50] for skip in ['Início', 'Descobrir', 'Espaços', 'Finanças', 'Conta']):
                            continue
                        # Check if this looks like an answer
                        if len(text) > len(best_text):
                            best_text = text

                # Strategy 2: Look for prose or markdown content
                prose_elements = soup.select('[class*="prose"], [class*="markdown"]')
                for el in prose_elements:
                    text = el.get_text(strip=True)
                    if len(text) > len(best_text) and len(text) > 50:
                        best_text = text

                # Clean up the response text
                if best_text:
                    # Remove common UI prefixes
                    ui_prefixes = ['InícioInício', 'DescobrirEspaços', 'FinançasConta', 'AtualizarInstalar']
                    for prefix in ui_prefixes:
                        if best_text.startswith(prefix):
                            best_text = best_text[len(prefix):]

                    # Find where the actual answer starts (after "Resposta" label if present)
                    if 'Resposta' in best_text[:100]:
                        idx = best_text.find('Resposta')
                        if idx >= 0:
                            best_text = best_text[idx + len('Resposta'):]

                    current_text = best_text.strip()

                    if len(current_text) > 50:
                        if current_text == previous_text:
                            stable_count += 1
                            logger.debug(f"Response stable ({stable_count}/{stability_threshold}): {len(current_text)} chars")

                            if stable_count >= stability_threshold:
                                logger.info(f"Response received ({len(current_text)} chars)")
                                sources = await self._extract_sources()
                                return {
                                    "answer": current_text,
                                    "sources": sources,
                                }
                        else:
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
            sources = await self._extract_sources()
            return {
                "answer": previous_text,
                "sources": sources,
            }

        return None

    async def _extract_sources(self) -> list:
        """Extract source citations from Perplexity response

        FASE 7.5: BUG-SCRAPER-EXIT137-001 FIX
        Uses BeautifulSoup single fetch pattern to prevent OOM (Exit Code 137)
        - Single await (page.content()) instead of multiple query_selector_all()
        - Local parsing with BeautifulSoup (no await)
        """
        sources = []
        try:
            # FASE 7.5: BUG-SCRAPER-EXIT137-001 FIX
            # Single HTML fetch (NOT multiple query_selectors)
            html_content = await self.page.content()  # SINGLE await
            soup = BeautifulSoup(html_content, 'html.parser')  # Local parsing

            # Look for source links/citations (local, no await)
            source_selectors = [
                'a[href*="http"][class*="source"]',
                'a[href*="http"][class*="citation"]',
                '[class*="sources"] a',
                '[class*="citation"] a',
                '[data-testid*="source"] a',
            ]

            for selector in source_selectors:
                elements = soup.select(selector)  # Local, no await
                for element in elements[:10]:  # Limit to 10 sources
                    try:
                        href = element.get('href')  # Local, no await
                        text = element.get_text(strip=True)  # Local, no await
                        if href and href.startswith('http'):
                            sources.append({
                                "url": href,
                                "title": text if text else "",
                            })
                    except:
                        continue

                if sources:
                    break

        except Exception as e:
            logger.debug(f"Error extracting sources: {e}")

        return sources

    async def search_financial(self, ticker: str, query_type: str = "analysis") -> ScraperResult:
        """
        Search for financial information about a stock

        Args:
            ticker: Stock ticker (e.g., 'PETR4')
            query_type: Type of query ('analysis', 'news', 'fundamentals')

        Returns:
            ScraperResult with financial analysis
        """
        query_templates = {
            "analysis": f"Análise completa da ação {ticker} na B3 Brasil. Fundamentos, perspectivas e recomendações.",
            "news": f"Últimas notícias e eventos relevantes sobre {ticker} na bolsa brasileira B3.",
            "fundamentals": f"Dados fundamentalistas de {ticker}: P/L, ROE, dividend yield, dívida líquida, margem.",
            "technical": f"Análise técnica de {ticker}: suporte, resistência, tendência, médias móveis.",
        }

        query = query_templates.get(query_type, query_templates["analysis"])
        return await self.scrape(query)

    async def health_check(self) -> bool:
        """Check if Perplexity is accessible"""
        try:
            await self.initialize()
            input_field = await self._find_input_field()
            return input_field is not None
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_perplexity():
    """Test Perplexity scraper"""
    scraper = PerplexityScraper()

    try:
        # Test general query
        result = await scraper.scrape("What is the capital of Brazil?")

        if result.success:
            print("Success!")
            print(f"Response: {result.data['response'][:300]}...")
            print(f"Sources: {len(result.data.get('sources', []))} found")
        else:
            print(f"Error: {result.error}")

        # Test financial query
        result = await scraper.search_financial("PETR4", "analysis")

        if result.success:
            print("\nFinancial Query Success!")
            print(f"Response: {result.data['response'][:300]}...")
        else:
            print(f"Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_perplexity())
