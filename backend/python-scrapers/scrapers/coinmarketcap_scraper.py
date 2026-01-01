# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
CoinMarketCap Scraper - Dados de criptomoedas
Fonte: https://coinmarketcap.com/
SEM necessidade de login - dados públicos (API disponível)

OPTIMIZED: Uses aiohttp for API + Playwright fallback with BeautifulSoup
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
import aiohttp
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class CoinMarketCapScraper(BaseScraper):
    """
    Scraper para dados de criptomoedas do CoinMarketCap

    MIGRATED TO PLAYWRIGHT - Uses BeautifulSoup for local parsing

    FONTE PÚBLICA - API disponível

    Dados extraídos:
    - Preço atual
    - Market cap
    - Volume 24h
    - Variações (1h, 24h, 7d)
    - Supply circulante e total
    """

    BASE_URL = "https://coinmarketcap.com/currencies/"
    API_URL = "https://api.coinmarketcap.com/data-api/v3/cryptocurrency/detail"

    # Map common symbols to IDs
    SYMBOL_MAP = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "BNB": "binance-coin",
        "USDT": "tether",
        "SOL": "solana",
        "ADA": "cardano",
        "XRP": "ripple",
        "DOGE": "dogecoin",
        "DOT": "polkadot",
        "AVAX": "avalanche",
        "MATIC": "polygon",
        "LINK": "chainlink",
        "UNI": "uniswap",
        "ATOM": "cosmos",
        "LTC": "litecoin",
    }

    def __init__(self):
        super().__init__(
            name="CoinMarketCap",
            source="COINMARKETCAP",
            requires_login=False,  # PÚBLICO!
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape crypto data from CoinMarketCap

        Args:
            ticker: Crypto symbol (e.g., 'BTC', 'ETH')

        Returns:
            ScraperResult with crypto data
        """
        try:
            # Try API/aiohttp first (faster, no browser needed)
            data = await self._fetch_via_api(ticker)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "method": "api",
                        "requires_login": False,
                    },
                )

            # Fallback to Playwright web scraping
            data = await self._fetch_via_web(ticker)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "method": "web",
                        "requires_login": False,
                    },
                )

            return ScraperResult(
                success=False,
                error=f"Ticker {ticker} not found on CoinMarketCap",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping {ticker} from CoinMarketCap: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _fetch_via_api(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Fetch data via aiohttp (no browser needed)
        """
        try:
            crypto_id = self.SYMBOL_MAP.get(symbol.upper(), symbol.lower())
            url = f"https://coinmarketcap.com/currencies/{crypto_id}/"

            async with aiohttp.ClientSession() as session:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }

                async with session.get(url, headers=headers, timeout=aiohttp.ClientTimeout(total=15)) as response:
                    if response.status == 404:
                        return None

                    html = await response.text()

                    # Parse with BeautifulSoup
                    soup = BeautifulSoup(html, 'html.parser')

                    data = {
                        "symbol": symbol.upper(),
                        "name": crypto_id.replace("-", " ").title(),
                        "price_usd": None,
                        "market_cap": None,
                        "volume_24h": None,
                        "change_1h": None,
                        "change_24h": None,
                        "change_7d": None,
                        "circulating_supply": None,
                        "total_supply": None,
                        "scraped_at": datetime.now().isoformat(),
                    }

                    # Extract price
                    price_selectors = [
                        "[data-test='text-cdp-price-display']",
                        ".priceValue span",
                        ".sc-f70bb44c-0",
                    ]

                    for selector in price_selectors:
                        price_elem = soup.select_one(selector)
                        if price_elem:
                            price_text = price_elem.get_text().strip().replace("$", "").replace(",", "")
                            try:
                                data["price_usd"] = float(price_text)
                                break
                            except:
                                continue

                    # Extract market cap
                    mc_elem = soup.select_one("[data-test='text-cdp-market-cap']")
                    if mc_elem:
                        mc_text = mc_elem.get_text().strip().replace("$", "").replace(",", "")
                        try:
                            if "B" in mc_text:
                                data["market_cap"] = float(mc_text.replace("B", "")) * 1_000_000_000
                            elif "M" in mc_text:
                                data["market_cap"] = float(mc_text.replace("M", "")) * 1_000_000
                            elif "T" in mc_text:
                                data["market_cap"] = float(mc_text.replace("T", "")) * 1_000_000_000_000
                        except:
                            pass

                    # If we got at least the symbol confirmed, return data
                    if crypto_id.lower() in html.lower():
                        logger.info(f"Fetched {symbol} from CoinMarketCap via aiohttp")
                        return data

            return None

        except Exception as e:
            logger.debug(f"API fetch failed: {e}")
            return None

    async def _fetch_via_web(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Fallback: Fetch data via Playwright web scraping
        """
        try:
            if not self.page:
                await self.initialize()

            crypto_id = self.SYMBOL_MAP.get(ticker.upper(), ticker.lower())
            url = f"{self.BASE_URL}{crypto_id}/"

            logger.info(f"Navigating to {url} via Playwright")
            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # OPTIMIZATION: Get HTML once and parse locally
            html_content = await self.page.content()

            # Check if page loaded
            if "404" in html_content or "not found" in html_content.lower():
                return None

            # Parse with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "symbol": ticker.upper(),
                "name": crypto_id.replace("-", " ").title(),
                "price_usd": None,
                "market_cap": None,
                "volume_24h": None,
                "change_24h": None,
                "rank": None,
                "scraped_at": datetime.now().isoformat(),
            }

            # Extract price
            price_selectors = [
                "[data-test='text-cdp-price-display']",
                ".priceValue span",
                ".sc-f70bb44c-0",
            ]

            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price_text = price_elem.get_text().strip().replace("$", "").replace(",", "")
                    try:
                        data["price_usd"] = float(price_text)
                        break
                    except:
                        continue

            # Extract 24h change
            change_selectors = [
                "[data-change]",
                ".sc-15yy2pl-0",
            ]

            for selector in change_selectors:
                change_elem = soup.select_one(selector)
                if change_elem:
                    change_text = change_elem.get_text().strip().replace("%", "")
                    try:
                        data["change_24h"] = float(change_text)
                        break
                    except:
                        continue

            logger.debug(f"Extracted CoinMarketCap data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.debug(f"Web fetch failed: {e}")
            return None

    async def health_check(self) -> bool:
        """Check if CoinMarketCap is accessible"""
        try:
            # Try API first
            data = await self._fetch_via_api("BTC")
            return data is not None
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_coinmarketcap():
    """Test CoinMarketCap scraper"""
    scraper = CoinMarketCapScraper()

    try:
        result = await scraper.scrape("BTC")

        if result.success:
            print("✅ Success!")
            print(f"Symbol: {result.data.get('symbol')}")
            print(f"Price: ${result.data.get('price_usd')}")
            print(f"Method: {result.metadata.get('method')}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_coinmarketcap())
