"""
Stock Lending Scraper - Taxa de aluguel de ações (BTC)
Fonte: https://statusinvest.com.br/acoes/{TICKER}
Requer login: NÃO (dados públicos)

FASE 101.3 - Wheel Turbinada: Aluguel de Ações
CREATED 2025-12-21 - Playwright + BeautifulSoup pattern

Dados extraídos:
- taxa_aluguel_ano: Taxa média anual em %
- taxa_aluguel_dia: Taxa diária (= taxa_ano / 252)
- quantidade_disponivel: Quantidade disponível para aluguel
- quantidade_alugada: Quantidade atualmente alugada (se disponível)
- volume_financeiro: Volume financeiro (se disponível)
"""
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import pytz
from loguru import logger
from bs4 import BeautifulSoup
import re

from base_scraper import BaseScraper, ScraperResult


class StockLendingScraper(BaseScraper):
    """
    Scraper for stock lending rates (BTC - Banco de Títulos)

    OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing (~10x faster)

    Sources (in order of preference):
    1. StatusInvest ticker page (taxa de aluguel section)
    2. StatusInvest aluguel page (general list)

    Dados extraídos:
    - taxa_aluguel_ano: % a.a. (e.g., 5.50 = 5.5% ao ano)
    - taxa_aluguel_dia: % diária (= taxa_ano / 252)
    - taxa_min: taxa mínima do dia (se disponível)
    - taxa_max: taxa máxima do dia (se disponível)
    - quantidade_disponivel: quantidade de ações para aluguel
    - data_referencia: data da coleta
    """

    BASE_URL = "https://statusinvest.com.br/acoes/"
    ALUGUEL_URL = "https://statusinvest.com.br/acoes/aluguel"
    SOURCE_NAME = "STOCK_LENDING"

    # Trading days per year (Brazil)
    TRADING_DAYS_YEAR = 252

    def __init__(self):
        super().__init__(
            name="StockLending",
            source=self.SOURCE_NAME,
            requires_login=False,
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape stock lending data

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with lending rate data
        """
        start_time = datetime.now(pytz.timezone('America/Sao_Paulo'))  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001

        try:
            # Ensure page is initialized (Playwright)
            if not self.page:
                await self.initialize()

            # Strategy 1: Try ticker page first (more detailed data)
            data = await self._scrape_ticker_page(ticker)

            # Strategy 2: Try aluguel page if strategy 1 failed
            if not data or data.get("taxa_aluguel_ano") is None:
                logger.info(f"[{self.name}] Trying aluguel page for {ticker}")
                data = await self._scrape_aluguel_page(ticker)

            if not data or data.get("taxa_aluguel_ano") is None:
                return ScraperResult(
                    success=False,
                    error=f"Stock lending data not found for {ticker}",
                    source=self.source,
                )

            elapsed = (datetime.now(pytz.timezone('America/Sao_Paulo')) - start_time).total_seconds()  # FASE 7.3

            # Add calculated fields
            data["ticker"] = ticker.upper()
            data["data_referencia"] = datetime.now(pytz.timezone('America/Sao_Paulo')).strftime("%Y-%m-%d")  # FASE 7.3
            data["data_coleta"] = datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat()  # FASE 7.3

            # Calculate daily rate from annual
            if data.get("taxa_aluguel_ano") is not None:
                data["taxa_aluguel_dia"] = round(
                    data["taxa_aluguel_ano"] / self.TRADING_DAYS_YEAR, 8
                )

            logger.info(
                f"[{self.name}] {ticker}: rate={data.get('taxa_aluguel_ano')}% in {elapsed:.2f}s"
            )

            return ScraperResult(
                success=True,
                data=data,
                source=self.source,
                response_time=elapsed,
                metadata={
                    "source_url": data.get("source_url"),
                    "requires_login": self.requires_login,
                },
            )

        except Exception as e:
            logger.error(f"[{self.name}] Error scraping {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _scrape_ticker_page(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Scrape lending data from ticker-specific page

        StatusInvest shows lending info in the ticker page under
        a section about "aluguel" or "empréstimo"
        """
        try:
            url = f"{self.BASE_URL}{ticker.lower()}"
            logger.info(f"[{self.name}] Navigating to {url}")

            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Check if page exists
            page_source = await self.page.content()
            if "não encontrado" in page_source.lower():
                return None

            # Single HTML fetch + BeautifulSoup local parsing
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "taxa_aluguel_ano": None,
                "taxa_min": None,
                "taxa_max": None,
                "quantidade_disponivel": None,
                "quantidade_alugada": None,
                "volume_financeiro": None,
                "source_url": url,
                "source_detail": "STATUSINVEST_TICKER",
            }

            # Look for lending section
            # StatusInvest may show this in different ways:
            # 1. Specific section with "aluguel" title
            # 2. Within supplementary data cards

            # Strategy: Look for text containing "aluguel" or "empréstimo"
            lending_selectors = [
                "[title*='aluguel']",
                "[title*='empréstimo']",
                "[title*='taxa de aluguel']",
                "div:contains('Taxa de aluguel')",
                ".lending-rate",
                "[class*='aluguel']",
                "[class*='lending']",
            ]

            for selector in lending_selectors:
                try:
                    section = soup.select_one(selector)
                    if section:
                        rate = self._extract_rate_from_element(section)
                        if rate is not None:
                            data["taxa_aluguel_ano"] = rate
                            break
                except Exception:
                    continue

            # Alternative: Search in all text for rate patterns
            if data["taxa_aluguel_ano"] is None:
                data["taxa_aluguel_ano"] = self._find_lending_rate_in_page(soup)

            # Look for quantity available
            data["quantidade_disponivel"] = self._find_quantity_in_page(soup)

            return data if data["taxa_aluguel_ano"] is not None else None

        except Exception as e:
            logger.debug(f"Ticker page scraping failed: {e}")
            return None

    async def _scrape_aluguel_page(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Scrape lending data from general aluguel listing page

        StatusInvest has a page listing all stocks with lending rates:
        https://statusinvest.com.br/acoes/aluguel
        """
        try:
            url = self.ALUGUEL_URL
            logger.info(f"[{self.name}] Navigating to {url}")

            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Single HTML fetch
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "taxa_aluguel_ano": None,
                "taxa_min": None,
                "taxa_max": None,
                "quantidade_disponivel": None,
                "quantidade_alugada": None,
                "volume_financeiro": None,
                "source_url": url,
                "source_detail": "STATUSINVEST_ALUGUEL",
            }

            # Find table with lending data
            table = soup.select_one("table")
            if not table:
                return None

            # Find ticker in table
            ticker_upper = ticker.upper()

            # Search in tbody rows
            rows = table.select("tbody tr")
            for row in rows:
                row_text = row.get_text().upper()

                if ticker_upper in row_text:
                    cells = row.select("td")
                    if len(cells) >= 2:
                        # Parse rate from cells
                        # Typical structure: [Ticker, Taxa, Volume, ...]
                        for cell in cells:
                            text = cell.get_text().strip()

                            # Check if it's a rate (has % or is a decimal)
                            rate = self._parse_rate(text)
                            if rate is not None and data["taxa_aluguel_ano"] is None:
                                data["taxa_aluguel_ano"] = rate
                                continue

                            # Check if it's a quantity
                            qty = self._parse_quantity(text)
                            if qty is not None and data["quantidade_disponivel"] is None:
                                data["quantidade_disponivel"] = qty
                                continue

                    break

            return data if data["taxa_aluguel_ano"] is not None else None

        except Exception as e:
            logger.debug(f"Aluguel page scraping failed: {e}")
            return None

    def _extract_rate_from_element(self, element) -> Optional[float]:
        """Extract lending rate from an element"""
        try:
            # Look for strong or span with rate value
            value_elem = element.select_one("strong, span.value, .rate")
            if value_elem:
                return self._parse_rate(value_elem.get_text())

            # Or parse directly
            return self._parse_rate(element.get_text())
        except Exception:
            return None

    def _find_lending_rate_in_page(self, soup: BeautifulSoup) -> Optional[float]:
        """
        Search for lending rate in full page text

        Looks for patterns like:
        - "Taxa de aluguel: 5,50%"
        - "Aluguel: 5.50% a.a."
        """
        try:
            page_text = soup.get_text()

            # Patterns for finding lending rate
            patterns = [
                r'taxa\s*(?:de)?\s*aluguel\s*[:=]?\s*([\d,\.]+)\s*%',
                r'aluguel\s*[:=]?\s*([\d,\.]+)\s*%',
                r'empréstimo\s*[:=]?\s*([\d,\.]+)\s*%',
                r'btc\s*[:=]?\s*([\d,\.]+)\s*%',
            ]

            for pattern in patterns:
                match = re.search(pattern, page_text.lower())
                if match:
                    return self._parse_rate(match.group(1))

        except Exception:
            pass

        return None

    def _find_quantity_in_page(self, soup: BeautifulSoup) -> Optional[int]:
        """Find quantity available for lending in page"""
        try:
            page_text = soup.get_text()

            # Patterns for finding quantity
            patterns = [
                r'quantidade\s*(?:disponível)?\s*[:=]?\s*([\d.,]+)',
                r'([\d.,]+)\s*ações?\s*disponíveis?',
            ]

            for pattern in patterns:
                match = re.search(pattern, page_text.lower())
                if match:
                    return self._parse_quantity(match.group(1))

        except Exception:
            pass

        return None

    def _parse_rate(self, text: Optional[str]) -> Optional[float]:
        """
        Parse percentage rate from text

        Examples:
        - "5,50%" → 5.50
        - "5.50% a.a." → 5.50
        - "5,5" → 5.5
        """
        if not text:
            return None

        try:
            # Remove common suffixes
            text = text.strip()
            text = text.replace("%", "").replace("a.a.", "").replace("a.a", "").strip()

            # Handle Brazilian format (comma as decimal)
            text = text.replace(".", "").replace(",", ".")

            value = float(text)

            # Sanity check: rates should be between 0 and 100
            if 0 <= value <= 100:
                return round(value, 4)

        except (ValueError, AttributeError):
            pass

        return None

    def _parse_quantity(self, text: Optional[str]) -> Optional[int]:
        """
        Parse quantity from text

        Examples:
        - "1.234.567" → 1234567
        - "1,2M" → 1200000
        - "1.5K" → 1500
        """
        if not text:
            return None

        try:
            text = text.strip().upper()
            multiplier = 1

            # Handle M/K suffixes
            if "M" in text:
                multiplier = 1_000_000
                text = text.replace("MI", "").replace("M", "")
            elif "K" in text:
                multiplier = 1_000
                text = text.replace("K", "")

            # Remove thousand separators and parse
            text = text.replace(".", "").replace(",", ".")
            value = int(float(text) * multiplier)

            return value if value > 0 else None

        except (ValueError, AttributeError):
            pass

        return None


# Test function
async def test_stock_lending():
    """Test Stock Lending scraper"""
    scraper = StockLendingScraper()

    try:
        # Test with PETR4 (high liquidity, likely has lending data)
        result = await scraper.scrape_with_retry("PETR4")

        if result.success:
            print("✅ Success!")
            data = result.data
            print(f"Ticker: {data.get('ticker')}")
            print(f"Taxa Anual: {data.get('taxa_aluguel_ano')}%")
            print(f"Taxa Diária: {data.get('taxa_aluguel_dia')}%")
            print(f"Qtd Disponível: {data.get('quantidade_disponivel')}")
            print(f"Data Referência: {data.get('data_referencia')}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_stock_lending())
