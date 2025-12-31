# CREATED 2025-12-04
"""
Oplab Scraper - Options Market Analysis
Source: https://opcoes.oplab.com.br/mercado-de-opcoes
No login required - direct access

OPTIMIZED: Uses Playwright for browser automation with stealth
"""
import asyncio
import json
from datetime import datetime
import pytz
from pathlib import Path
from typing import Optional, Dict, Any, List
from bs4 import BeautifulSoup
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class OplabScraper(BaseScraper):
    """
    Scraper for Oplab options market data via browser

    No login required - direct access to options data
    """

    BASE_URL = "https://opcoes.oplab.com.br/mercado-de-opcoes"

    def __init__(self):
        super().__init__(
            name="Oplab",
            source="OPLAB",
            requires_login=False,  # No login required
        )

    async def initialize(self):
        """Initialize Playwright browser"""
        if self._initialized:
            return

        await super().initialize()

        try:
            logger.info("Navigating to Oplab options market...")
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(3)  # Wait for dynamic content

            logger.success(f"Oplab loaded: {self.page.url}")
            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Oplab scraper: {e}")
            raise

    async def scrape(self, ticker: Optional[str] = None) -> ScraperResult:
        """
        Scrape Oplab options market data

        Args:
            ticker: Optional specific ticker to filter (e.g., 'PETR4')
                   If None, returns general market overview

        Returns:
            ScraperResult with options market data
        """
        try:
            if not self.page:
                await self.initialize()

            if ticker:
                return await self._scrape_ticker_options(ticker)
            else:
                return await self._scrape_market_overview()

        except Exception as e:
            logger.error(f"Error scraping Oplab: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _scrape_market_overview(self) -> ScraperResult:
        """Scrape general options market overview"""
        try:
            logger.info("Scraping Oplab market overview...")

            # Refresh page to get latest data
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "source": "Oplab",
                "url": self.BASE_URL,
                "scraped_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                "market_overview": {},
                "top_options": [],
                "statistics": {},
            }

            # Extract market statistics
            stats_containers = soup.select('.card, .stat, [class*="summary"]')
            for container in stats_containers:
                try:
                    title_el = container.select_one('h2, h3, h4, .title, [class*="title"]')
                    value_el = container.select_one('.value, .number, [class*="value"]')

                    if title_el and value_el:
                        title = title_el.get_text(strip=True)
                        value = value_el.get_text(strip=True)
                        data["statistics"][title] = value
                except:
                    continue

            # Extract options table data
            tables = soup.select('table')
            for table in tables:
                try:
                    headers = [th.get_text(strip=True) for th in table.select('th')]
                    rows = table.select('tbody tr')

                    for row in rows[:20]:  # Limit to top 20
                        cells = row.select('td')
                        if len(cells) >= 3:
                            option_data = {}
                            for i, cell in enumerate(cells):
                                if i < len(headers):
                                    option_data[headers[i]] = cell.get_text(strip=True)
                                else:
                                    option_data[f"col_{i}"] = cell.get_text(strip=True)

                            if option_data:
                                data["top_options"].append(option_data)
                except:
                    continue

            # Extract any summary text
            summary_text = soup.select_one('[class*="description"], [class*="summary-text"]')
            if summary_text:
                data["market_overview"]["description"] = summary_text.get_text(strip=True)

            return ScraperResult(
                success=True,
                data=data,
                source=self.source,
                metadata={
                    "options_count": len(data["top_options"]),
                    "timestamp": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                },
            )

        except Exception as e:
            logger.error(f"Error scraping market overview: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _scrape_ticker_options(self, ticker: str) -> ScraperResult:
        """Scrape options data for a specific ticker"""
        try:
            ticker = ticker.upper().strip()
            logger.info(f"Scraping Oplab options for {ticker}...")

            # Navigate to ticker-specific options page
            # Format: https://opcoes.oplab.com.br/mercado/acoes/opcoes/VALE3
            ticker_url = f"https://opcoes.oplab.com.br/mercado/acoes/opcoes/{ticker}"
            logger.info(f"Navigating to: {ticker_url}")

            await self.page.goto(ticker_url, wait_until="load", timeout=60000)
            await asyncio.sleep(5)  # Wait longer for dynamic content
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "ticker": ticker,
                "source": "Oplab",
                "scraped_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                "calls": [],
                "puts": [],
                "summary": {},
            }

            # Extract options chains
            tables = soup.select('table')
            for table in tables:
                table_class = table.get('class', [])
                table_text = str(table_class).lower()

                headers = [th.get_text(strip=True) for th in table.select('th')]
                rows = table.select('tbody tr')

                option_type = "calls" if "call" in table_text else "puts" if "put" in table_text else "calls"

                for row in rows:
                    cells = row.select('td')
                    if len(cells) >= 3:
                        option_data = {}
                        for i, cell in enumerate(cells):
                            if i < len(headers):
                                option_data[headers[i]] = cell.get_text(strip=True)

                        if option_data:
                            data[option_type].append(option_data)

            # Extract underlying asset info
            asset_info = soup.select_one('[class*="asset-info"], [class*="underlying"]')
            if asset_info:
                data["summary"]["underlying_info"] = asset_info.get_text(strip=True)

            return ScraperResult(
                success=True,
                data=data,
                source=self.source,
                metadata={
                    "ticker": ticker,
                    "calls_count": len(data["calls"]),
                    "puts_count": len(data["puts"]),
                    "timestamp": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                },
            )

        except Exception as e:
            logger.error(f"Error scraping ticker options: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def get_most_traded(self) -> ScraperResult:
        """Get most traded options"""
        try:
            if not self.page:
                await self.initialize()

            await self.page.goto("https://opcoes.oplab.com.br/mercado-de-opcoes", wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "source": "Oplab",
                "scraped_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                "most_traded": [],
            }

            # Look for ranking or most traded section
            ranking_section = soup.select_one('[class*="ranking"], [class*="most-traded"], [class*="top"]')
            if ranking_section:
                items = ranking_section.select('li, tr, [class*="item"]')
                for item in items[:20]:
                    text = item.get_text(strip=True)
                    if text:
                        data["most_traded"].append(text)

            return ScraperResult(
                success=True,
                data=data,
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error getting most traded: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def health_check(self) -> bool:
        """Check if Oplab is accessible"""
        try:
            await self.initialize()
            return 'oplab.com.br' in self.page.url
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_oplab():
    """Test Oplab scraper"""
    scraper = OplabScraper()

    try:
        # Test market overview
        result = await scraper.scrape()

        if result.success:
            print("Market Overview Success!")
            print(f"Options found: {result.metadata.get('options_count', 0)}")
        else:
            print(f"Error: {result.error}")

        # Test specific ticker
        result = await scraper.scrape("PETR4")

        if result.success:
            print(f"\nPETR4 Options Success!")
            print(f"Calls: {result.metadata.get('calls_count', 0)}")
            print(f"Puts: {result.metadata.get('puts_count', 0)}")
        else:
            print(f"Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_oplab())
