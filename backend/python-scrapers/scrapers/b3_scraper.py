"""
B3 Scraper - Dados oficiais da bolsa brasileira
Fonte: https://www.b3.com.br/
SEM necessidade de login - dados públicos
"""
import asyncio
from typing import Dict, Any, Optional, List
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger
import re

from base_scraper import BaseScraper, ScraperResult


class B3Scraper(BaseScraper):
    """
    Scraper para dados oficiais da B3

    FONTE PÚBLICA - SEM LOGIN NECESSÁRIO

    Dados extraídos:
    - Informações oficiais da empresa
    - Dados de listagem
    - Últimos negócios
    - Informações corporativas
    """

    BASE_URL = "https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/mercado-a-vista/empresas-listadas/ResumoEmpresaListada.htm"

    def __init__(self):
        super().__init__(
            name="B3",
            source="B3",
            requires_login=False,  # PÚBLICO!
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape official data from B3

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with official B3 data
        """
        try:
            # Create driver if not exists
            if not self.driver:
                self.driver = self._create_driver()

            # Build URL with ticker parameter
            url = f"{self.BASE_URL}?codCVM={self._get_cvm_code(ticker)}"
            logger.info(f"Navigating to {url}")

            # Navigate
            self.driver.get(url)

            # Wait for page to load
            await asyncio.sleep(3)

            # Check if ticker exists
            page_source = self.driver.page_source.lower()
            if "não encontrado" in page_source or "nenhum resultado" in page_source:
                # Try direct search
                search_url = f"https://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/mercado-a-vista/empresas-listadas/Perfil-de-empresa.htm?codigo={ticker.upper()}"
                self.driver.get(search_url)
                await asyncio.sleep(3)

            # Extract data
            data = await self._extract_data(ticker)

            if data and data.get("ticker"):
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "url": self.driver.current_url,
                        "requires_login": False,
                    },
                )
            else:
                return ScraperResult(
                    success=False,
                    error="Failed to extract data from B3",
                    source=self.source,
                )

        except Exception as e:
            logger.error(f"Error scraping {ticker} from B3: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract official data from B3 page"""
        try:
            data = {
                "ticker": ticker.upper(),
                "company_name": None,
                "official_name": None,
                "cnpj": None,
                "sector": None,
                "segment": None,
                "listing_date": None,
                "market_segment": None,
                "governance_level": None,
                "shares_outstanding": None,
                "free_float": None,
                "tag_along": None,
                "website": None,
            }

            # Company name
            try:
                name_selectors = [
                    "h1.page-title",
                    ".company-name",
                    "h2.empresa-nome",
                ]

                for selector in name_selectors:
                    try:
                        name_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if name_elem.text.strip():
                            data["company_name"] = name_elem.text.strip()
                            break
                    except:
                        continue

            except Exception as e:
                logger.debug(f"Could not extract company name: {e}")

            # Extract table data
            try:
                # B3 usa tabelas para informações
                tables = self.driver.find_elements(By.TAG_NAME, "table")

                for table in tables:
                    rows = table.find_elements(By.TAG_NAME, "tr")

                    for row in rows:
                        cells = row.find_elements(By.TAG_NAME, "td")

                        if len(cells) >= 2:
                            label = cells[0].text.strip().lower()
                            value = cells[1].text.strip()

                            # Map fields
                            self._map_field(data, label, value)

            except Exception as e:
                logger.debug(f"Error extracting table data: {e}")

            # Extract from definition lists (dl/dt/dd)
            try:
                dts = self.driver.find_elements(By.TAG_NAME, "dt")
                dds = self.driver.find_elements(By.TAG_NAME, "dd")

                for dt, dd in zip(dts, dds):
                    label = dt.text.strip().lower()
                    value = dd.text.strip()

                    self._map_field(data, label, value)

            except Exception as e:
                logger.debug(f"Error extracting definition list: {e}")

            logger.debug(f"Extracted B3 data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.error(f"Error in _extract_data: {e}")
            return None

    def _map_field(self, data: dict, label: str, value: str):
        """Map B3 field labels to data dictionary keys"""

        # Normalize label
        label = label.lower().strip()

        # Mapping dictionary
        field_map = {
            "razão social": "official_name",
            "razao social": "official_name",
            "nome empresarial": "official_name",
            "cnpj": "cnpj",
            "setor": "sector",
            "sector": "sector",
            "segmento": "segment",
            "segment": "segment",
            "data de listagem": "listing_date",
            "data listagem": "listing_date",
            "segmento de listagem": "market_segment",
            "nível de governança": "governance_level",
            "nivel de governanca": "governance_level",
            "ações em circulação": "shares_outstanding",
            "acoes em circulacao": "shares_outstanding",
            "free float": "free_float",
            "tag along": "tag_along",
            "site": "website",
            "website": "website",
        }

        # Find matching field
        for key, field in field_map.items():
            if key in label:
                data[field] = value
                return

        # Log unmapped fields
        if value:
            logger.debug(f"Unmapped B3 field: '{label}' = {value}")

    def _get_cvm_code(self, ticker: str) -> str:
        """
        Get CVM code for ticker (simplified)
        In production, this should query a mapping table
        """
        # For now, just return ticker - B3 API will handle it
        return ticker.upper()


# Example usage
async def test_b3():
    """Test B3 scraper"""
    scraper = B3Scraper()

    try:
        result = await scraper.scrape_with_retry("PETR4")

        if result.success:
            print("✅ Success!")
            print(f"Data: {result.data}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_b3())
