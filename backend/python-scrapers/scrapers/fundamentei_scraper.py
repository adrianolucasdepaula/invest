"""
Fundamentei Scraper - Análise fundamentalista de ações
Fonte: https://fundamentei.com/
Requer login via Google OAuth

MIGRATED TO PLAYWRIGHT - 2025-12-04
UPDATED: 2025-12-06 - Fixed cookie loading order (BEFORE navigation)
"""
import asyncio
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class FundamenteiScraper(BaseScraper):
    """
    Scraper for Fundamentei fundamental analysis

    OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing
    instead of multiple Selenium find_element calls. ~10x faster!

    Dados extraídos:
    - Indicadores de valuation (P/L, P/VP, EV/EBITDA, etc.)
    - Indicadores de rentabilidade (ROE, ROIC, Margens, etc.)
    - Indicadores de crescimento (CAGR, etc.)
    - Indicadores de dividendos
    """

    BASE_URL = "https://fundamentei.com"
    COOKIES_FILE = "/app/data/cookies/fundamentei_session.json"

    def __init__(self):
        super().__init__(
            name="Fundamentei",
            source="FUNDAMENTEI",
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
                logger.info("Cookies loaded BEFORE navigation - session should be active")
            else:
                logger.warning("No cookies loaded - will attempt without login")

            # STEP 2: Now navigate with cookies already set
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # STEP 3: Verify login status
            if self.requires_login and not await self._verify_logged_in():
                logger.warning("Login verification failed - OAuth refresh may be needed")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Fundamentei scraper: {e}")
            raise

    async def _load_cookies_to_context(self) -> bool:
        """
        Load cookies to browser context BEFORE navigation

        Supports both formats:
        - List format: [{"name": ..., "value": ...}, ...]
        - Dict format: {"cookies": [...], "localStorage": {...}}

        Returns:
            True if cookies were loaded successfully
        """
        cookies_path = Path(self.COOKIES_FILE)

        if not cookies_path.exists():
            logger.warning(f"Cookies file not found: {self.COOKIES_FILE}")
            return False

        try:
            with open(cookies_path, 'r', encoding='utf-8') as f:
                session_data = json.load(f)

            # Handle both formats
            if isinstance(session_data, list):
                cookies = session_data
            else:
                cookies = session_data.get('cookies', [])

            if not cookies:
                logger.warning("No cookies found in session file")
                return False

            # Filter and validate cookies
            valid_cookies = []
            for cookie in cookies:
                # Check if cookie is for Fundamentei or Google (OAuth)
                domain = cookie.get('domain', '')
                if 'fundamentei.com' in domain or 'google.com' in domain:
                    # Check cookie expiration
                    if self._is_cookie_valid(cookie):
                        converted = self._convert_cookie_for_playwright(cookie)
                        if converted:
                            valid_cookies.append(converted)

            if valid_cookies:
                await self.page.context.add_cookies(valid_cookies)
                logger.info(f"Loaded {len(valid_cookies)} valid cookies BEFORE navigation")
                return True
            else:
                logger.warning("No valid cookies after filtering")
                return False

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in cookies file: {e}")
            return False
        except Exception as e:
            logger.error(f"Error loading cookies: {e}")
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
            if cookie.get('expires') or cookie.get('expirationDate'):
                pw_cookie['expires'] = cookie.get('expires') or cookie.get('expirationDate')

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

    async def _verify_logged_in(self) -> bool:
        """Check if logged in via Google"""
        try:
            html = await self.page.content()
            # Check for logout indicators
            logout_indicators = ['sair', 'logout', 'minha-conta', 'profile', 'avatar', 'user-menu']
            html_lower = html.lower()
            return any(indicator in html_lower for indicator in logout_indicators)
        except:
            return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape fundamental data from Fundamentei

        Args:
            ticker: Stock ticker (e.g., "PETR4")

        Returns:
            ScraperResult with fundamental indicators
        """
        try:
            # Ensure page is initialized
            if not self.page:
                await self.initialize()

            data = {
                "ticker": ticker.upper(),
                "source": "Fundamentei",
                "scraped_at": datetime.now().isoformat(),
                "company_name": None,
                "price": None,
                "sector": None,
                "indicators": {},
            }

            # Step 1: Get company info from main page
            main_url = f"{self.BASE_URL}/br/{ticker.lower()}"
            logger.info(f"Navigating to {main_url}")

            await self.page.goto(main_url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # Check if page loaded correctly
            page_source = await self.page.content()
            page_lower = page_source.lower()

            # Check for "page not available" message
            not_found_indicators = [
                "essa página não está disponível",
                "página não encontrada",
                "ação não encontrada",
                "ativo não encontrado",
                "error 404",
                "<title>404</title>",
                "não foi possível encontrar",
            ]
            if any(indicator in page_lower for indicator in not_found_indicators):
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found",
                    source=self.source,
                )

            # Extract company name from main page
            soup = BeautifulSoup(page_source, 'html.parser')
            h1 = soup.select_one("h1")
            if h1:
                data["company_name"] = h1.get_text().strip()

            # Step 2: Get valuation indicators from /valuation page
            valuation_url = f"{self.BASE_URL}/br/{ticker.lower()}/valuation"
            logger.info(f"Navigating to {valuation_url}")

            await self.page.goto(valuation_url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # Extract indicators from valuation page
            valuation_html = await self.page.content()
            valuation_soup = BeautifulSoup(valuation_html, 'html.parser')

            indicators = self._extract_valuation_indicators(valuation_soup)
            if indicators:
                data["indicators"].update(indicators)

            # Return result
            if data.get("indicators") or data.get("company_name"):
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={"url": main_url, "requires_login": True},
                )

            return ScraperResult(
                success=False,
                error="Failed to extract data",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping Fundamentei for {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Extract fundamental data from page

        Fundamentei uses Next.js with data in __NEXT_DATA__ script
        """
        try:
            data = {
                "ticker": ticker.upper(),
                "source": "Fundamentei",
                "scraped_at": datetime.now().isoformat(),
                "company_name": None,
                "price": None,
                "sector": None,
                "indicators": {},
            }

            # Get HTML content
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Extract company name from H1
            try:
                h1 = soup.select_one("h1")
                if h1:
                    data["company_name"] = h1.get_text().strip()
            except Exception as e:
                logger.debug(f"Could not extract company name: {e}")

            # Try to extract from __NEXT_DATA__ JSON (primary method)
            next_data = await self._extract_next_data(soup)
            if next_data:
                # Extract from Apollo State if available
                apollo_state = next_data.get("props", {}).get("pageProps", {})
                if apollo_state:
                    logger.debug(f"Found pageProps: {list(apollo_state.keys())}")

                # Try to get data from apolloState (contains actual financial data)
                apollo_data = next_data.get("props", {}).get("apolloState", {})
                if apollo_data and isinstance(apollo_data, dict):
                    # apolloState.data contains encoded financial data
                    data_str = apollo_data.get("data", "")
                    if data_str:
                        indicators = self._parse_apollo_data(data_str, ticker)
                        if indicators:
                            data["indicators"] = indicators

            # Fallback: try HTML parsing if no JSON data found
            if not data["indicators"]:
                indicators = self._extract_indicators(soup)
                if indicators:
                    data["indicators"] = indicators

            # Extract price from page (if visible)
            try:
                price_patterns = [
                    'span[class*="price"]',
                    'div[class*="price"]',
                    '[class*="cotacao"]',
                    '[class*="quote"]'
                ]
                for pattern in price_patterns:
                    price_elem = soup.select_one(pattern)
                    if price_elem:
                        price_text = price_elem.get_text().strip()
                        price = self._parse_number(price_text)
                        if price and price > 0:
                            data["price"] = price
                            break
            except Exception as e:
                logger.debug(f"Could not extract price: {e}")

            return data if (data.get("indicators") or data.get("company_name")) else None

        except Exception as e:
            logger.error(f"Error extracting data: {e}")
            return None

    async def _extract_next_data(self, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract __NEXT_DATA__ JSON from page"""
        try:
            script = soup.select_one('script#__NEXT_DATA__')
            if script:
                json_text = script.get_text()
                return json.loads(json_text)
        except Exception as e:
            logger.debug(f"Could not parse __NEXT_DATA__: {e}")
        return None

    def _parse_apollo_data(self, data_str: str, ticker: str) -> Dict[str, Any]:
        """
        Parse encoded Apollo state data

        The apolloState.data is a compressed/encoded string containing financial metrics.
        We need to look for patterns related to the ticker.
        """
        indicators = {}

        try:
            # The data appears to be a custom encoding
            # Look for numeric patterns that could be financial data
            # Common indicators to look for in the decoded data

            # Try to find trailing returns data (common in Fundamentei)
            # Format: trailing returns with dates and values

            ticker_upper = ticker.upper()

            # Check if ticker appears in data
            if ticker_upper.lower() in data_str.lower():
                logger.debug(f"Found ticker {ticker_upper} in Apollo data")

                # Since the data is encoded, we'll need to rely on other methods
                # The encoding appears to be custom, not standard base64
                pass

        except Exception as e:
            logger.debug(f"Error parsing Apollo data: {e}")

        return indicators

    def _extract_valuation_indicators(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """
        Extract valuation indicators from Fundamentei /valuation page

        Structure: H2 contains indicator name, H4 in same parent contains value
        """
        indicators = {}

        # Map indicator names (as they appear in H2) to output keys
        indicator_map = {
            'P/L': 'p_l',
            'P/VPA': 'p_vp',
            'P/VP': 'p_vp',
            'VPA': 'vpa',
            'LPA': 'lpa',
            'ROE': 'roe',
            'ROIC': 'roic',
            'DY': 'dy',
            'DIVIDEND YIELD': 'dy',
            'EV/EBITDA': 'ev_ebitda',
            'EV/EBIT': 'ev_ebit',
            'PAYOUT': 'payout',
            'MARGEM BRUTA': 'margem_bruta',
            'MARGEM EBITDA': 'margem_ebitda',
            'MARGEM LÍQUIDA': 'margem_liquida',
            'PSR': 'psr',
            'P/EBIT': 'p_ebit',
            'P/ATIVOS': 'p_ativos',
            'DÍVIDA LÍQUIDA/PL': 'div_liquida_pl',
            'DÍV. LÍQUIDA/EBITDA': 'div_liquida_ebitda',
        }

        try:
            # Find all H2 elements (indicator names)
            h2_elements = soup.select('h2')

            for h2 in h2_elements:
                h2_text = h2.get_text(strip=True).upper()

                for indicator_name, key in indicator_map.items():
                    if indicator_name in h2_text:
                        # Found an indicator - get the parent container
                        parent = h2.parent
                        if parent:
                            # Look for H4 in the same parent (contains the value)
                            h4 = parent.select_one('h4')
                            if h4:
                                value_text = h4.get_text(strip=True)
                                # Parse value
                                value = self._parse_indicator_value(value_text)
                                if value is not None and key not in indicators:
                                    indicators[key] = value
                                    logger.debug(f"Extracted {indicator_name}: {value}")
                        break  # Found match, move to next H2

        except Exception as e:
            logger.error(f"Error extracting valuation indicators: {e}")

        return indicators

    def _extract_indicators(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract financial indicators using BeautifulSoup (legacy fallback)"""
        indicators = {}

        # Common indicator labels and their keys
        indicator_map = {
            # Valuation
            "p/l": "p_l",
            "p/vp": "p_vp",
            "ev/ebit": "ev_ebit",
            "ev/ebitda": "ev_ebitda",
            "psr": "psr",
            "p/ativo": "p_ativos",
            "p/cap.giro": "p_cap_giro",
            "p/cap. giro": "p_cap_giro",
            "p/ebit": "p_ebit",

            # Profitability
            "marg. bruta": "margem_bruta",
            "margem bruta": "margem_bruta",
            "marg. ebit": "margem_ebit",
            "margem ebit": "margem_ebit",
            "marg. ebitda": "margem_ebitda",
            "margem ebitda": "margem_ebitda",
            "marg. líquida": "margem_liquida",
            "margem líquida": "margem_liquida",
            "roe": "roe",
            "roa": "roa",
            "roic": "roic",

            # Growth
            "cresc. receita 5a": "crescimento_receita_5a",
            "cagr receita": "cagr_receita",
            "cagr lucro": "cagr_lucro",

            # Dividend
            "dividend yield": "dy",
            "dy": "dy",
            "payout": "payout",

            # Debt
            "dív.líq/patrim": "div_liquida_patrim",
            "dív. líquida/patrimônio": "div_liquida_patrim",
            "dív.líq/ebit": "div_liquida_ebit",
            "dív.líq/ebitda": "div_liquida_ebitda",
            "pl/ativos": "pl_ativos",

            # Liquidity
            "liquidez corr": "liquidez_corrente",
            "liquidez corrente": "liquidez_corrente",
            "liquidez 2 meses": "liquidez_2meses",
            "vol. médio": "volume_medio",
            "volume médio": "volume_medio",

            # Per share
            "lpa": "lpa",
            "vpa": "vpa",
        }

        try:
            # Strategy 1: Find table rows with indicator labels
            rows = soup.select("tr, .indicator-row, .metric-row")

            for row in rows:
                try:
                    cells = row.select("td, th, .label, .value, span")

                    if len(cells) >= 2:
                        label = cells[0].get_text().strip().lower()
                        value_text = cells[1].get_text().strip()

                        # Check if label matches known indicator
                        for indicator_label, indicator_key in indicator_map.items():
                            if indicator_label in label:
                                value = self._parse_indicator_value(value_text)
                                if value is not None and indicator_key not in indicators:
                                    indicators[indicator_key] = value
                                break

                except Exception:
                    continue

            # Strategy 2: Find divs/spans with data attributes
            elements = soup.select("[data-indicator], [data-metric], [data-value]")

            for elem in elements:
                try:
                    indicator_name = elem.get("data-indicator") or elem.get("data-metric")
                    value_text = elem.get("data-value") or elem.get_text().strip()

                    if indicator_name and value_text:
                        indicator_name_lower = indicator_name.lower()
                        for indicator_label, indicator_key in indicator_map.items():
                            if indicator_label in indicator_name_lower:
                                value = self._parse_indicator_value(value_text)
                                if value is not None and indicator_key not in indicators:
                                    indicators[indicator_key] = value
                                break

                except Exception:
                    continue

            # Strategy 3: Look for common Fundamentei card patterns
            cards = soup.select(".card, .indicator-card, .metric-card, .info-card")

            for card in cards:
                try:
                    label_elem = card.select_one(".title, .label, .card-title, span:first-child")
                    value_elem = card.select_one(".value, .card-value, span:last-child, strong")

                    if label_elem and value_elem:
                        label = label_elem.get_text().strip().lower()
                        value_text = value_elem.get_text().strip()

                        for indicator_label, indicator_key in indicator_map.items():
                            if indicator_label in label:
                                value = self._parse_indicator_value(value_text)
                                if value is not None and indicator_key not in indicators:
                                    indicators[indicator_key] = value
                                break

                except Exception:
                    continue

        except Exception as e:
            logger.error(f"Error extracting indicators: {e}")

        return indicators

    def _parse_indicator_value(self, value_text: str) -> Optional[float]:
        """Parse indicator value from text"""
        try:
            if not value_text or value_text in ["-", "N/A", "n/a", "", "—", "–"]:
                return None

            # Remove common characters
            value_text = value_text.replace("%", "").replace("R$", "").strip()

            # Handle Brazilian number format
            value_text = value_text.replace(".", "").replace(",", ".")

            return float(value_text)

        except Exception:
            return None

    def _parse_number(self, text: str) -> Optional[float]:
        """Parse number from text"""
        try:
            if not text:
                return None

            # Remove spaces and common characters
            text = text.replace("R$", "").replace("%", "").strip()
            text = text.replace(" ", "").replace(".", "").replace(",", ".")
            return float(text)
        except Exception:
            return None

    async def health_check(self) -> bool:
        """Check if Fundamentei is accessible"""
        try:
            await self.initialize()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_fundamentei():
    """Test Fundamentei scraper"""
    scraper = FundamenteiScraper()

    try:
        await scraper.initialize()
        result = await scraper.scrape("PETR4")

        if result.success:
            print("✅ Success!")
            print(f"Data: {result.data}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_fundamentei())
