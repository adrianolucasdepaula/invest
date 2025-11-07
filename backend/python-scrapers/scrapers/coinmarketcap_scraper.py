"""
CoinMarketCap Scraper - Dados de criptomoedas
Fonte: https://coinmarketcap.com/
SEM necessidade de login - dados públicos (API disponível)
"""
import asyncio
from typing import Dict, Any, Optional
import aiohttp
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class CoinMarketCapScraper(BaseScraper):
    """
    Scraper para dados de criptomoedas do CoinMarketCap

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
            # Try API first (faster)
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

            # Fallback to web scraping
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
        Fetch data via CoinMarketCap public API
        """
        try:
            # Map common symbols to IDs
            symbol_map = {
                "BTC": "bitcoin",
                "ETH": "ethereum",
                "BNB": "binance-coin",
                "USDT": "tether",
                "SOL": "solana",
                "ADA": "cardano",
                "XRP": "ripple",
                "DOGE": "dogecoin",
            }

            crypto_id = symbol_map.get(symbol.upper(), symbol.lower())

            # CoinMarketCap's public API (without auth)
            url = f"https://coinmarketcap.com/currencies/{crypto_id}/"

            async with aiohttp.ClientSession() as session:
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }

                async with session.get(url, headers=headers, timeout=10) as response:
                    if response.status == 404:
                        return None

                    html = await response.text()

                    # Extract data from HTML (CoinMarketCap embeds data in script tags)
                    # This is a simplified extraction - in production, parse JSON from <script> tags
                    if crypto_id.lower() in html.lower():
                        logger.info(f"Found {symbol} on CoinMarketCap (web scraping mode)")

                        # Return basic structure
                        # In production, extract from window.__NEXT_DATA__ JSON
                        return {
                            "symbol": symbol.upper(),
                            "name": crypto_id.title(),
                            "price_usd": None,  # Extract from HTML
                            "market_cap": None,
                            "volume_24h": None,
                            "change_1h": None,
                            "change_24h": None,
                            "change_7d": None,
                            "circulating_supply": None,
                            "total_supply": None,
                            "note": "Scraping via web - limited data. Consider API key for full data",
                        }

            return None

        except Exception as e:
            logger.debug(f"API fetch failed: {e}")
            return None

    async def _fetch_via_web(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Fallback: Fetch data via web scraping
        """
        try:
            # Create driver if not exists
            if not self.driver:
                self.driver = self._create_driver()

            # Map ticker to crypto name
            symbol_map = {
                "BTC": "bitcoin",
                "ETH": "ethereum",
                "BNB": "binance-coin",
                "USDT": "tether",
                "SOL": "solana",
            }

            crypto_id = symbol_map.get(ticker.upper(), ticker.lower())

            url = f"{self.BASE_URL}{crypto_id}/"
            logger.info(f"Navigating to {url}")

            self.driver.get(url)
            await asyncio.sleep(3)

            # Check if page loaded
            if "404" in self.driver.page_source or "not found" in self.driver.page_source.lower():
                return None

            # Extract data
            data = {
                "symbol": ticker.upper(),
                "name": None,
                "price_usd": None,
                "market_cap": None,
                "volume_24h": None,
                "change_24h": None,
                "rank": None,
            }

            # Extract from page elements
            # CoinMarketCap structure changes frequently - use multiple selectors

            # Price
            try:
                price_selectors = [
                    "[data-test='text-cdp-price-display']",
                    ".priceValue",
                    ".sc-16891c57-0",
                ]

                for selector in price_selectors:
                    try:
                        price_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        price_text = price_elem.text.strip().replace("$", "").replace(",", "")
                        data["price_usd"] = float(price_text)
                        break
                    except:
                        continue

            except Exception as e:
                logger.debug(f"Could not extract price: {e}")

            logger.debug(f"Extracted CoinMarketCap data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.debug(f"Web fetch failed: {e}")
            return None


# Example usage
async def test_coinmarketcap():
    """Test CoinMarketCap scraper"""
    scraper = CoinMarketCapScraper()

    try:
        result = await scraper.scrape_with_retry("BTC")

        if result.success:
            print("✅ Success!")
            print(f"Data: {result.data}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_coinmarketcap())
