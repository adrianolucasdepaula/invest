# CREATED 2025-12-04
"""
Yahoo Finance Scraper - Market Analysis
Source: https://finance.yahoo.com/
Requires Google OAuth login

OPTIMIZED: Uses Playwright for browser automation with stealth
"""
import asyncio
import json
from datetime import datetime
import pytz
from pathlib import Path
from typing import Optional, Dict, Any
from bs4 import BeautifulSoup
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class YahooFinanceScraper(BaseScraper):
    """
    Scraper for Yahoo Finance market data via browser

    Requires Google OAuth for full access to features
    """

    BASE_URL = "https://finance.yahoo.com/"
    COOKIES_FILE = Path("/app/data/cookies/yahoo_finance_session.json")

    def __init__(self):
        super().__init__(
            name="YahooFinance",
            source="YAHOO_FINANCE",
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

                    yahoo_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict):
                            domain = cookie.get('domain', '')
                            if 'yahoo.com' in domain or 'google.com' in domain:
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
                                yahoo_cookies.append(pw_cookie)

                    if yahoo_cookies:
                        await self.page.context.add_cookies(yahoo_cookies)
                        logger.info(f"Added {len(yahoo_cookies)} cookies to browser context")
                        cookies_loaded = True

                except Exception as e:
                    logger.warning(f"Could not load Yahoo Finance session: {e}")
            else:
                logger.debug("Yahoo Finance session file not found. Manual login may be required.")

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
                logger.info(f"Yahoo Finance initialized (cookies={cookies_loaded}, localStorage={local_storage_loaded})")
            else:
                logger.warning("Yahoo Finance initialized WITHOUT session data - login may be required")

            logger.success(f"Yahoo Finance loaded: {self.page.url}")
            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Yahoo Finance scraper: {e}")
            raise

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape Yahoo Finance data for a ticker

        Args:
            ticker: Stock ticker symbol (e.g., 'PETR4.SA' for Brazilian stocks)

        Returns:
            ScraperResult with market data
        """
        try:
            if not self.page:
                await self.initialize()

            # Convert Brazilian ticker format if needed
            yahoo_ticker = self._convert_ticker(ticker)
            url = f"https://finance.yahoo.com/quote/{yahoo_ticker}"

            logger.info(f"Fetching Yahoo Finance data for {yahoo_ticker}...")
            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Get page content and parse
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            data = await self._extract_quote_data(soup, yahoo_ticker)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "ticker": ticker,
                        "yahoo_ticker": yahoo_ticker,
                        "timestamp": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                    },
                )

            return ScraperResult(
                success=False,
                error=f"Could not extract data for {ticker}",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping Yahoo Finance: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    def _convert_ticker(self, ticker: str) -> str:
        """Convert Brazilian ticker to Yahoo Finance format"""
        ticker = ticker.upper().strip()
        # Brazilian tickers need .SA suffix
        if not ticker.endswith('.SA') and len(ticker) <= 6:
            # Check if it looks like a Brazilian ticker
            if ticker[-1].isdigit() or ticker.endswith('F'):
                return f"{ticker}.SA"
        return ticker

    async def _extract_quote_data(self, soup: BeautifulSoup, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract quote data from Yahoo Finance page"""
        try:
            data = {
                "ticker": ticker,
                "source": "Yahoo Finance",
                "scraped_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
            }

            # Price - look for main price element in the quote header section
            # The main price is usually in a section with the ticker symbol
            # We need to find the price associated with the specific quote, not sidebar indices

            # First try to find the main quote section
            quote_header = soup.select_one('section[data-testid="quote-price"]')
            if quote_header:
                price_el = quote_header.select_one('fin-streamer[data-field="regularMarketPrice"]')
                if price_el:
                    price_text = price_el.get_text(strip=True)
                    try:
                        # Handle both formats: "12.34" and "12,345.67"
                        clean_price = price_text.replace(',', '')
                        data["price"] = float(clean_price)
                    except:
                        data["price_text"] = price_text

            # Fallback: look for price near the company title (h1)
            if "price" not in data:
                h1 = soup.select_one('h1')
                if h1:
                    parent_section = h1.find_parent('section') or h1.find_parent('div')
                    if parent_section:
                        price_el = parent_section.select_one('fin-streamer[data-field="regularMarketPrice"]')
                        if price_el:
                            price_text = price_el.get_text(strip=True)
                            try:
                                clean_price = price_text.replace(',', '')
                                data["price"] = float(clean_price)
                            except:
                                data["price_text"] = price_text

            # Last fallback: get first price fin-streamer that's not in a table
            if "price" not in data:
                for price_el in soup.select('fin-streamer[data-field="regularMarketPrice"]'):
                    # Skip if inside a table (likely sidebar data)
                    if not price_el.find_parent('table'):
                        price_text = price_el.get_text(strip=True)
                        try:
                            clean_price = price_text.replace(',', '')
                            data["price"] = float(clean_price)
                            break
                        except:
                            continue

            # Change
            change_selectors = [
                'fin-streamer[data-field="regularMarketChange"]',
                '[data-test="qsp-price-change"]',
            ]
            for selector in change_selectors:
                change_el = soup.select_one(selector)
                if change_el:
                    data["change"] = change_el.get_text(strip=True)
                    break

            # Change percent
            pct_selectors = [
                'fin-streamer[data-field="regularMarketChangePercent"]',
                '[data-test="qsp-price-change-percent"]',
            ]
            for selector in pct_selectors:
                pct_el = soup.select_one(selector)
                if pct_el:
                    data["change_percent"] = pct_el.get_text(strip=True)
                    break

            # Company name
            name_el = soup.select_one('h1[class*="yf-"]')
            if name_el:
                data["company_name"] = name_el.get_text(strip=True)

            # Market status
            market_el = soup.select_one('[data-test="qsp-market-notice"]')
            if market_el:
                data["market_status"] = market_el.get_text(strip=True)

            # Additional data from summary table
            summary_table = soup.select('td[data-test]')
            for td in summary_table:
                test_id = td.get('data-test', '')
                value = td.get_text(strip=True)

                if 'PREV_CLOSE' in test_id:
                    data["previous_close"] = value
                elif 'OPEN' in test_id:
                    data["open"] = value
                elif 'BID' in test_id:
                    data["bid"] = value
                elif 'ASK' in test_id:
                    data["ask"] = value
                elif 'DAYS_RANGE' in test_id:
                    data["days_range"] = value
                elif 'FIFTY_TWO_WK_RANGE' in test_id:
                    data["52_week_range"] = value
                elif 'VOLUME' in test_id:
                    data["volume"] = value
                elif 'MARKET_CAP' in test_id:
                    data["market_cap"] = value
                elif 'PE_RATIO' in test_id:
                    data["pe_ratio"] = value
                elif 'EPS' in test_id:
                    data["eps"] = value
                elif 'DIVIDEND' in test_id:
                    data["dividend"] = value

            return data if len(data) > 3 else None

        except Exception as e:
            logger.error(f"Error extracting quote data: {e}")
            return None

    async def get_market_summary(self) -> ScraperResult:
        """Get general market summary from Yahoo Finance Markets page"""
        try:
            if not self.page:
                await self.initialize()

            # Navigate to the markets page (has all asset types)
            await self.page.goto("https://finance.yahoo.com/markets/", wait_until="load", timeout=60000)
            await asyncio.sleep(3)  # Wait for dynamic content

            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "source": "Yahoo Finance Markets",
                "url": "https://finance.yahoo.com/markets/",
                "scraped_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                "indices": [],
                "world_indices": [],
                "stocks": [],
                "commodities": [],
                "currencies": [],
                "crypto": [],
            }

            # Try multiple selectors for market data
            # Look for table rows with market data
            tables = soup.select('table')
            for table in tables:
                try:
                    rows = table.select('tr')
                    for row in rows:
                        cells = row.select('td')
                        if len(cells) >= 3:
                            # Get symbol/name from first cell
                            name_cell = cells[0]
                            name_link = name_cell.select_one('a')
                            name = name_link.get_text(strip=True) if name_link else name_cell.get_text(strip=True)

                            # Try to get price and change
                            price = cells[1].get_text(strip=True) if len(cells) > 1 else ""
                            change = cells[2].get_text(strip=True) if len(cells) > 2 else ""

                            if name and price:
                                data["indices"].append({
                                    "name": name,
                                    "price": price,
                                    "change": change,
                                })
                except:
                    continue

            # Also try to extract from fin-streamer elements (Yahoo's custom components)
            fin_streamers = soup.select('fin-streamer[data-field="regularMarketPrice"]')
            for streamer in fin_streamers[:20]:
                try:
                    parent = streamer.find_parent('tr') or streamer.find_parent('div')
                    if parent:
                        name_el = parent.select_one('a[href*="/quote/"]')
                        if name_el:
                            name = name_el.get_text(strip=True)
                            price = streamer.get_text(strip=True)
                            change_el = parent.select_one('fin-streamer[data-field="regularMarketChangePercent"]')
                            change = change_el.get_text(strip=True) if change_el else ""

                            # Avoid duplicates
                            if not any(i["name"] == name for i in data["indices"]):
                                data["indices"].append({
                                    "name": name,
                                    "price": price,
                                    "change": change,
                                })
                except:
                    continue

            return ScraperResult(
                success=True,
                data=data,
                source=self.source,
                metadata={
                    "indices_count": len(data["indices"]),
                    "timestamp": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                },
            )

        except Exception as e:
            logger.error(f"Error getting market summary: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def health_check(self) -> bool:
        """Check if Yahoo Finance is accessible"""
        try:
            await self.initialize()
            return 'finance.yahoo.com' in self.page.url
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_yahoo_finance():
    """Test Yahoo Finance scraper"""
    scraper = YahooFinanceScraper()

    try:
        result = await scraper.scrape("PETR4")

        if result.success:
            print("Success!")
            print(f"Data: {json.dumps(result.data, indent=2)}")
        else:
            print(f"Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_yahoo_finance())
