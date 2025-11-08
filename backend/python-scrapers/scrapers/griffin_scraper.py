"""
Griffin Scraper - Análise de movimentações de insiders
Fonte: https://griffin.app.br/
SEM necessidade de login - dados públicos
"""
import asyncio
from typing import Dict, Any, Optional, List
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger
import re
from datetime import datetime

from base_scraper import BaseScraper, ScraperResult


class GriffinScraper(BaseScraper):
    """
    Scraper para análise de insiders do Griffin

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
            # Create driver if not exists
            if not self.driver:
                self.driver = self._create_driver()

            # Build URL
            url = f"{self.BASE_URL}{ticker.lower()}"
            logger.info(f"Navigating to {url}")

            # Navigate
            self.driver.get(url)

            # Wait for page to load
            await asyncio.sleep(3)

            # Check if ticker exists
            page_source = self.driver.page_source.lower()
            if "não encontrado" in page_source or "erro 404" in page_source:
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found on Griffin",
                    source=self.source,
                )

            # Extract data
            data = await self._extract_data(ticker)

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
            else:
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

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract insider trading data from Griffin page"""
        try:
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
            }

            # Company name
            try:
                name_elem = self.driver.find_element(
                    By.CSS_SELECTOR,
                    "h1, .company-name, .ticker-name"
                )
                if name_elem.text.strip():
                    data["company_name"] = name_elem.text.strip()
            except Exception as e:
                logger.debug(f"Could not extract company name: {e}")

            # Extract insider transactions table
            try:
                # Griffin geralmente usa tabelas para transações
                table_selectors = [
                    "table.insider-table",
                    "table.transactions",
                    ".transactions-table table",
                    "table"
                ]

                table_found = False
                for selector in table_selectors:
                    try:
                        tables = self.driver.find_elements(By.CSS_SELECTOR, selector)

                        for table in tables:
                            # Check if this is the insider trading table
                            if self._is_insider_table(table):
                                transactions = await self._parse_transactions_table(table)
                                data["insider_transactions"].extend(transactions)
                                table_found = True
                                break

                        if table_found:
                            break

                    except:
                        continue

            except Exception as e:
                logger.debug(f"Error extracting transactions: {e}")

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
            # Check table headers
            headers = table.find_elements(By.TAG_NAME, "th")
            header_text = " ".join([h.text.lower() for h in headers])

            # Look for keywords
            keywords = ["insider", "transação", "transacao", "compra", "venda", "data", "volume"]
            return any(keyword in header_text for keyword in keywords)

        except:
            return False

    async def _parse_transactions_table(self, table) -> List[Dict[str, Any]]:
        """Parse insider transactions table"""
        transactions = []

        try:
            rows = table.find_elements(By.TAG_NAME, "tr")

            for row in rows[1:]:  # Skip header
                cells = row.find_elements(By.TAG_NAME, "td")

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

                        # Try to extract from cells
                        # Format varies, but typically:
                        # [Date, Type, Insider, Position, Volume, Price, Total]

                        cell_texts = [cell.text.strip() for cell in cells]

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
                        for i, text in enumerate(cell_texts):
                            if text and len(text) > 3 and text not in ["COMPRA", "VENDA"]:
                                # Likely a name
                                if not transaction["insider_name"]:
                                    transaction["insider_name"] = text

                        # Volume and price (numeric values)
                        for text in cell_texts:
                            if text:
                                # Try to parse as number
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
            # Remove common formatting
            text = text.replace("R$", "").replace(".", "").replace(",", ".").strip()

            # Try to parse
            return float(text)

        except:
            return None


# Example usage
async def test_griffin():
    """Test Griffin scraper"""
    scraper = GriffinScraper()

    try:
        result = await scraper.scrape_with_retry("PETR4")

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
