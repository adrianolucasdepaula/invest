"""
CoinGecko Scraper - Dados de criptomoedas via API pública
Fonte: https://api.coingecko.com/
SEM necessidade de login - API pública gratuita

FASE 102: Novos scrapers para expandir cobertura (30/36 → 34/36)
"""
import asyncio
from datetime import datetime
import pytz
from typing import Dict, Any, Optional
import aiohttp
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class CoinGeckoScraper(BaseScraper):
    """
    Scraper para dados de criptomoedas do CoinGecko via API

    PADRÃO: API-only (aiohttp) - não usa browser

    Dados extraídos:
    - Preço atual (USD, BRL)
    - Market cap
    - Volume 24h
    - Variações (24h, 7d, 30d)
    - ATH/ATL
    - Supply circulante e total
    """

    API_URL = "https://api.coingecko.com/api/v3"

    # Mapeamento de símbolos comuns para IDs do CoinGecko
    COINS = {
        "btc": "bitcoin",
        "bitcoin": "bitcoin",
        "eth": "ethereum",
        "ethereum": "ethereum",
        "tether": "tether",
        "usdt": "tether",
        "sol": "solana",
        "solana": "solana",
        "bnb": "binancecoin",
        "xrp": "ripple",
        "ripple": "ripple",
        "ada": "cardano",
        "cardano": "cardano",
        "doge": "dogecoin",
        "dogecoin": "dogecoin",
        "dot": "polkadot",
        "polkadot": "polkadot",
        "avax": "avalanche-2",
        "avalanche": "avalanche-2",
        "matic": "matic-network",
        "polygon": "matic-network",
        "link": "chainlink",
        "chainlink": "chainlink",
        "uni": "uniswap",
        "uniswap": "uniswap",
        "atom": "cosmos",
        "cosmos": "cosmos",
        "ltc": "litecoin",
        "litecoin": "litecoin",
    }

    def __init__(self):
        super().__init__(
            name="CoinGecko",
            source="COINGECKO",
            requires_login=False,  # PÚBLICO
        )

    async def scrape(self, coin_id: str = "bitcoin") -> ScraperResult:
        """
        Scrape coin data via CoinGecko API

        Args:
            coin_id: Coin ID or symbol (e.g., 'bitcoin', 'btc', 'ethereum')

        Returns:
            ScraperResult with coin data
        """
        try:
            data = await self._fetch_via_api(coin_id)
            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={"method": "api", "coin_id": coin_id},
                )
            return ScraperResult(
                success=False,
                error=f"Coin {coin_id} not found on CoinGecko",
                source=self.source,
            )
        except Exception as e:
            logger.error(f"Error scraping CoinGecko for {coin_id}: {e}")
            return ScraperResult(success=False, error=str(e), source=self.source)

    async def _fetch_via_api(self, coin_id: str) -> Optional[Dict[str, Any]]:
        """Fetch coin data via CoinGecko API"""
        # Resolve symbol to CoinGecko ID
        resolved_id = self.COINS.get(coin_id.lower(), coin_id.lower())
        url = f"{self.API_URL}/coins/{resolved_id}"
        params = {
            "localization": "false",
            "tickers": "false",
            "community_data": "false",
            "developer_data": "false",
        }

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                }
                timeout = aiohttp.ClientTimeout(total=15)

                async with session.get(
                    url, params=params, headers=headers, timeout=timeout
                ) as response:
                    if response.status == 404:
                        logger.warning(f"Coin {coin_id} not found on CoinGecko")
                        return None

                    if response.status == 429:
                        logger.warning("CoinGecko rate limit hit - try again later")
                        return None

                    if response.status != 200:
                        logger.warning(f"CoinGecko API error: {response.status}")
                        return None

                    data = await response.json()
                    market_data = data.get("market_data", {})

                    return {
                        "coin_id": data.get("id"),
                        "symbol": data.get("symbol", "").upper(),
                        "name": data.get("name"),
                        "price_usd": market_data.get("current_price", {}).get("usd"),
                        "price_brl": market_data.get("current_price", {}).get("brl"),
                        "market_cap_usd": market_data.get("market_cap", {}).get("usd"),
                        "market_cap_brl": market_data.get("market_cap", {}).get("brl"),
                        "volume_24h_usd": market_data.get("total_volume", {}).get("usd"),
                        "volume_24h_brl": market_data.get("total_volume", {}).get("brl"),
                        "change_1h": market_data.get("price_change_percentage_1h_in_currency", {}).get("usd"),
                        "change_24h": market_data.get("price_change_percentage_24h"),
                        "change_7d": market_data.get("price_change_percentage_7d"),
                        "change_30d": market_data.get("price_change_percentage_30d"),
                        "change_1y": market_data.get("price_change_percentage_1y"),
                        "ath_usd": market_data.get("ath", {}).get("usd"),
                        "ath_date": market_data.get("ath_date", {}).get("usd"),
                        "ath_change_percentage": market_data.get("ath_change_percentage", {}).get("usd"),
                        "atl_usd": market_data.get("atl", {}).get("usd"),
                        "atl_date": market_data.get("atl_date", {}).get("usd"),
                        "circulating_supply": market_data.get("circulating_supply"),
                        "total_supply": market_data.get("total_supply"),
                        "max_supply": market_data.get("max_supply"),
                        "market_cap_rank": data.get("market_cap_rank"),
                        "coingecko_rank": data.get("coingecko_rank"),
                        "last_updated": data.get("last_updated"),
                        "scraped_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                    }

        except aiohttp.ClientError as e:
            logger.error(f"Network error fetching CoinGecko: {e}")
            return None
        except Exception as e:
            logger.error(f"Error parsing CoinGecko response: {e}")
            return None

    async def fetch_multiple(self, coin_ids: list) -> Dict[str, ScraperResult]:
        """
        Fetch multiple coins in parallel

        Args:
            coin_ids: List of coin IDs/symbols

        Returns:
            Dict mapping coin_id to ScraperResult
        """
        tasks = [self.scrape(coin_id) for coin_id in coin_ids]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        return {
            coin_id: result if isinstance(result, ScraperResult) else ScraperResult(
                success=False,
                error=str(result),
                source=self.source,
            )
            for coin_id, result in zip(coin_ids, results)
        }

    async def health_check(self) -> bool:
        """Check if CoinGecko API is accessible"""
        try:
            result = await self.scrape("bitcoin")
            return result.success
        except Exception as e:
            logger.error(f"CoinGecko health check failed: {e}")
            return False


# Test function
async def test_coingecko():
    """Test CoinGecko scraper"""
    scraper = CoinGeckoScraper()

    try:
        # Test single coin
        print("Testing single coin (Bitcoin)...")
        result = await scraper.scrape("bitcoin")

        if result.success:
            print("✅ Success!")
            print(f"   Symbol: {result.data.get('symbol')}")
            print(f"   Name: {result.data.get('name')}")
            print(f"   Price USD: ${result.data.get('price_usd'):,.2f}")
            print(f"   Price BRL: R${result.data.get('price_brl'):,.2f}")
            print(f"   Market Cap: ${result.data.get('market_cap_usd'):,.0f}")
            print(f"   24h Change: {result.data.get('change_24h'):.2f}%")
            print(f"   Rank: #{result.data.get('market_cap_rank')}")
        else:
            print(f"❌ Error: {result.error}")

        # Test with symbol
        print("\nTesting with symbol (ETH)...")
        result2 = await scraper.scrape("eth")
        if result2.success:
            print(f"✅ ETH Price: ${result2.data.get('price_usd'):,.2f}")
        else:
            print(f"❌ Error: {result2.error}")

        # Test multiple coins
        print("\nTesting multiple coins...")
        results = await scraper.fetch_multiple(["btc", "eth", "sol"])
        for coin_id, res in results.items():
            if res.success:
                print(f"   ✅ {coin_id.upper()}: ${res.data.get('price_usd'):,.2f}")
            else:
                print(f"   ❌ {coin_id}: {res.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_coingecko())
