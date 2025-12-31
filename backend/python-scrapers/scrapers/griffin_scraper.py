# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
Griffin Scraper - Análise de movimentações de insiders
Fonte: https://griffin.app.br/
SEM necessidade de login - dados públicos

OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing (~10x faster)
"""
import asyncio
from datetime import datetime
import pytz
from typing import Dict, Any, Optional, List
from loguru import logger
from bs4 import BeautifulSoup
import re

from base_scraper import BaseScraper, ScraperResult


class GriffinScraper(BaseScraper):
    """
    Scraper para análise de insiders do Griffin

    MIGRATED TO PLAYWRIGHT - Uses BeautifulSoup for local parsing

    FONTE PÚBLICA - SEM LOGIN NECESSÁRIO

    Dados extraídos:
    - Movimentações recentes de insiders
    - Compras e vendas
    - Valores das transações
    - Datas das operações
    """

    BASE_URL = "https://griffin.app.br/acoes/"

    def __init__(self):
        super().__init__(
            name="Griffin",
            source="GRIFFIN",
            requires_login=False,  # PÚBLICO!
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape insider trading data from Griffin

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with insider trading data
        """
        try:
            if not self.page:
                await self.initialize()

            # Build URL
            url = f"{self.BASE_URL}{ticker.lower()}"
            logger.info(f"Navigating to {url}")

            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # OPTIMIZATION: Get HTML once and parse locally with BeautifulSoup
            html_content = await self.page.content()

            # Check if ticker exists
            if "não encontrado" in html_content.lower() or "erro 404" in html_content.lower():
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found on Griffin",
                    source=self.source,
                )

            # Extract data using BeautifulSoup
            data = self._extract_data(html_content, ticker)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "url": url,
                        "requires_login": False,
                    },
                )

            return ScraperResult(
                success=False,
                error="Failed to extract data from Griffin",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping {ticker} from Griffin: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    def _extract_data(self, html_content: str, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Extract insider trading data from Griffin page

        OPTIMIZED: Uses BeautifulSoup for local parsing (no await operations)
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "ticker": ticker.upper(),
                "company_name": None,
                "insider_transactions": [],
                "summary": {
                    "total_transactions": 0,
                    "total_buys": 0,
                    "total_sells": 0,
                    "total_buy_volume": 0,
                    "total_sell_volume": 0,
                },
                "scraped_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
            }

            # Company name
            name_selectors = ["h1", ".company-name", ".ticker-name"]
            for selector in name_selectors:
                name_elem = soup.select_one(selector)
                if name_elem and name_elem.get_text().strip():
                    data["company_name"] = name_elem.get_text().strip()
                    break

            # Extract insider transactions table
            table_selectors = [
                "table.insider-table",
                "table.transactions",
                ".transactions-table table",
                "table"
            ]

            for selector in table_selectors:
                tables = soup.select(selector)
                for table in tables:
                    if self._is_insider_table(table):
                        transactions = self._parse_transactions_table(table)
                        data["insider_transactions"].extend(transactions)
                        break
                if data["insider_transactions"]:
                    break

            # Calculate summary
            if data["insider_transactions"]:
                data["summary"]["total_transactions"] = len(data["insider_transactions"])

                for txn in data["insider_transactions"]:
                    if txn.get("type") == "COMPRA":
                        data["summary"]["total_buys"] += 1
                        data["summary"]["total_buy_volume"] += txn.get("volume", 0)
                    elif txn.get("type") == "VENDA":
                        data["summary"]["total_sells"] += 1
                        data["summary"]["total_sell_volume"] += txn.get("volume", 0)

            logger.debug(f"Extracted Griffin data for {ticker}: {len(data['insider_transactions'])} transactions")
            return data

        except Exception as e:
            logger.error(f"Error in _extract_data: {e}")
            return None

    def _is_insider_table(self, table) -> bool:
        """Check if table contains insider trading data"""
        try:
            headers = table.select("th")
            header_text = " ".join([h.get_text().lower() for h in headers])

            keywords = ["insider", "transação", "transacao", "compra", "venda", "data", "volume"]
            return any(keyword in header_text for keyword in keywords)
        except:
            return False

    def _parse_transactions_table(self, table) -> List[Dict[str, Any]]:
        """Parse insider transactions table using BeautifulSoup"""
        transactions = []

        try:
            rows = table.select("tr")

            for row in rows[1:]:  # Skip header
                cells = row.select("td")

                if len(cells) >= 3:
                    try:
                        transaction = {
                            "date": None,
                            "type": None,  # COMPRA ou VENDA
                            "insider_name": None,
                            "insider_position": None,
                            "volume": 0,
                            "price": 0,
                            "total_value": 0,
                        }

                        cell_texts = [cell.get_text().strip() for cell in cells]

                        # Date (usually first cell)
                        if cell_texts[0]:
                            transaction["date"] = cell_texts[0]

                        # Type (COMPRA/VENDA)
                        for text in cell_texts:
                            if "compra" in text.lower():
                                transaction["type"] = "COMPRA"
                                break
                            elif "venda" in text.lower():
                                transaction["type"] = "VENDA"
                                break

                        # Insider name (usually after type)
                        for text in cell_texts:
                            if text and len(text) > 3 and text.upper() not in ["COMPRA", "VENDA"]:
                                if not transaction["insider_name"]:
                                    transaction["insider_name"] = text

                        # Volume and price (numeric values)
                        for text in cell_texts:
                            if text:
                                num = self._parse_number(text)
                                if num:
                                    if transaction["volume"] == 0:
                                        transaction["volume"] = int(num)
                                    elif transaction["price"] == 0:
                                        transaction["price"] = num
                                    elif transaction["total_value"] == 0:
                                        transaction["total_value"] = num

                        # Only add if has minimum data
                        if transaction["type"] and (transaction["volume"] > 0 or transaction["total_value"] > 0):
                            transactions.append(transaction)

                    except Exception as e:
                        logger.debug(f"Error parsing transaction row: {e}")
                        continue

        except Exception as e:
            logger.debug(f"Error parsing transactions table: {e}")

        return transactions

    def _parse_number(self, text: str) -> Optional[float]:
        """Parse number from text"""
        try:
            text = text.replace("R$", "").replace(".", "").replace(",", ".").strip()
            return float(text)
        except:
            return None

    async def health_check(self) -> bool:
        """Check if Griffin is accessible"""
        try:
            await self.initialize()
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Check for page elements that indicate the site is working
            return len(soup.select("table, .insider-table, h1")) > 0

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_griffin():
    """Test Griffin scraper"""
    scraper = GriffinScraper()

    try:
        result = await scraper.scrape("PETR4")

        if result.success:
            print("✅ Success!")
            print(f"Company: {result.data['company_name']}")
            print(f"Total transactions: {result.data['summary']['total_transactions']}")
            print(f"Buys: {result.data['summary']['total_buys']}")
            print(f"Sells: {result.data['summary']['total_sells']}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_griffin())
