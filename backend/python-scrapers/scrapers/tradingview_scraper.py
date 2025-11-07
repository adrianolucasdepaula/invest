"""
TradingView Scraper - Análise técnica e gráficos
Fonte: https://br.tradingview.com/
Requer login via Google OAuth
"""
import asyncio
import pickle
from datetime import datetime
from typing import Dict, Any, Optional
from selenium.webdriver.common.by import By
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class TradingViewScraper(BaseScraper):
    BASE_URL = "https://br.tradingview.com"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(name="TradingView", source="TRADINGVIEW", requires_login=True)

    async def initialize(self):
        if self._initialized:
            return
        if not self.driver:
            self.driver = self._create_driver()
        try:
            self.driver.get(self.BASE_URL)
            await asyncio.sleep(2)
            try:
                with open(self.COOKIES_FILE, 'rb') as f:
                    cookies = pickle.load(f)
                for cookie in cookies:
                    if 'tradingview.com' in cookie.get('domain', ''):
                        try:
                            self.driver.add_cookie(cookie)
                        except:
                            pass
                self.driver.refresh()
                await asyncio.sleep(3)
            except FileNotFoundError:
                logger.warning("Cookies not found")
            self._initialized = True
        except Exception as e:
            logger.error(f"Init error: {e}")
            raise

    async def scrape(self, ticker: str) -> ScraperResult:
        await self.initialize()
        try:
            url = f"{self.BASE_URL}/chart/?symbol=BMFBOVESPA%3A{ticker.upper()}"
            self.driver.get(url)
            await asyncio.sleep(5)
            data = {"ticker": ticker.upper(), "source": "TradingView", "scraped_at": datetime.now().isoformat(), "technical_indicators": {}}
            return ScraperResult(success=True, data=data, source=self.source, metadata={"url": url})
        except Exception as e:
            return ScraperResult(success=False, error=str(e), source=self.source)

    async def health_check(self) -> bool:
        try:
            await self.initialize()
            return True
        except:
            return False
