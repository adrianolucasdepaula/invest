"""
Fundamentus Scraper - Dados fundamentalistas públicos
Fonte: https://www.fundamentus.com.br/
SEM necessidade de login - dados públicos
"""
import asyncio
from typing import Dict, Any, Optional
from selenium.webdriver.common.by import By
from loguru import logger
import re

from base_scraper import BaseScraper, ScraperResult


class FundamentusScraper(BaseScraper):
    """
    Scraper para dados fundamentalistas do Fundamentus

    FONTE PÚBLICA - SEM LOGIN NECESSÁRIO

    Dados extraídos:
    - Cotação atual
    - P/L, P/VP, PSR, P/Ativos, P/Cap.Giro, P/EBIT, P/Ativ Circ.Liq
    - EV/EBIT, EV/EBITDA
    - Margem Ebit, Margem Líquida
    - Liquidez Corrente, Liquidez 2 meses
    - Dív.Bruta/Patrim., Dív.Líquida/Patrim., Dív.Líquida/EBIT
    - Patrim. Líquido, Receita Líquida
    - EBIT, Lucro Líquido
    - Crescimento Receita (5a), ROE, ROIC, ROA
    - Dividend Yield, Payout
    """

    BASE_URL = "https://www.fundamentus.com.br/detalhes.php"

    def __init__(self):
        super().__init__(
            name="Fundamentus",
            source="FUNDAMENTUS",
            requires_login=False,  # PÚBLICO!
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape fundamental data from Fundamentus

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with comprehensive fundamental data
        """
        try:
            # Create driver if not exists
            if not self.driver:
                self.driver = self._create_driver()

            # Build URL
            url = f"{self.BASE_URL}?papel={ticker.upper()}"
            logger.info(f"Navigating to {url}")

            # Navigate
            self.driver.get(url)

            # Wait for page to load
            await asyncio.sleep(2)

            # Check if ticker exists
            page_source = self.driver.page_source.lower()
            if "não encontrado" in page_source or "papel não encontrado" in page_source:
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found on Fundamentus",
                    source=self.source,
                )

            # Extract data
            data = await self._extract_data(ticker)

            if data and data.get("ticker"):
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
                    error="Failed to extract data from Fundamentus",
                    source=self.source,
                )

        except Exception as e:
            logger.error(f"Error scraping {ticker} from Fundamentus: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract comprehensive fundamental data from Fundamentus page"""
        try:
            data = {
                "ticker": ticker.upper(),
                "company_name": None,

                # Cotação e Valuation
                "price": None,
                "p_l": None,          # P/L
                "p_vp": None,         # P/VP
                "psr": None,          # PSR
                "p_ativos": None,     # P/Ativos
                "p_cap_giro": None,   # P/Cap.Giro
                "p_ebit": None,       # P/EBIT
                "p_ativ_circ_liq": None,  # P/Ativ Circ.Liq

                # EV Multiples
                "ev_ebit": None,      # EV/EBIT
                "ev_ebitda": None,    # EV/EBITDA

                # Margens
                "margem_ebit": None,  # Margem EBIT
                "margem_liquida": None,  # Margem Líquida

                # Liquidez
                "liquidez_corrente": None,  # Liquidez Corrente
                "liquidez_2meses": None,    # Liquidez 2 meses (volume diário)

                # Endividamento
                "div_bruta_patrim": None,    # Dív.Bruta/Patrim.
                "div_liquida_patrim": None,  # Dív.Líquida/Patrim.
                "div_liquida_ebit": None,    # Dív.Líquida/EBIT

                # Patrimônio e Resultados
                "patrim_liquido": None,   # Patrimônio Líquido
                "receita_liquida": None,  # Receita Líquida (12m)
                "ebit": None,             # EBIT (12m)
                "lucro_liquido": None,    # Lucro Líquido (12m)

                # Rentabilidade
                "crescimento_receita_5a": None,  # Crescimento Receita (5a)
                "roe": None,              # ROE
                "roic": None,             # ROIC
                "roa": None,              # ROA

                # Dividendos
                "dy": None,               # Dividend Yield
                "payout": None,           # Payout

                # Número de ações
                "nro_acoes": None,        # Número de ações
            }

            # Company name (from header)
            try:
                name_elements = self.driver.find_elements(By.CSS_SELECTOR, "h1, .resultado h2")
                if name_elements:
                    company_text = name_elements[0].text.strip()
                    # Remove ticker from name if present
                    company_text = re.sub(r'\s*-\s*\w+\d*\s*$', '', company_text)
                    data["company_name"] = company_text
            except Exception as e:
                logger.debug(f"Could not extract company name: {e}")

            # Extract table data (main data is in tables with class "w728")
            try:
                # Fundamentus usa tabelas com spans para labels e valores
                tables = self.driver.find_elements(By.CSS_SELECTOR, "table.w728")

                for table in tables:
                    rows = table.find_elements(By.TAG_NAME, "tr")

                    for row in rows:
                        cells = row.find_elements(By.TAG_NAME, "td")

                        # Processar células em pares (label, value)
                        for i in range(0, len(cells) - 1, 2):
                            try:
                                label_elem = cells[i].find_element(By.CLASS_NAME, "txt")
                                value_elem = cells[i + 1].find_element(By.CLASS_NAME, "txt")

                                label = label_elem.text.strip()
                                value = value_elem.text.strip()

                                # Parse value
                                parsed_value = self._parse_value(value)

                                # Map to data fields
                                self._map_field(data, label, parsed_value)

                            except Exception as e:
                                continue

            except Exception as e:
                logger.error(f"Error extracting table data: {e}")

            logger.debug(f"Extracted Fundamentus data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.error(f"Error in _extract_data: {e}")
            return None

    def _parse_value(self, value_text: str) -> Optional[float]:
        """
        Parse numeric value from text
        Handles Brazilian number format (comma as decimal separator)
        Handles percentages
        Handles billions/millions notation
        """
        if not value_text or value_text == "-":
            return None

        try:
            # Remove common prefixes
            value_text = value_text.replace("R$", "").strip()

            # Check for percentage
            is_percent = "%" in value_text
            value_text = value_text.replace("%", "").strip()

            # Replace Brazilian decimal separator
            value_text = value_text.replace(".", "").replace(",", ".")

            # Parse number
            parsed = float(value_text)

            # Convert percentage to decimal if needed
            # (keep as-is for now, let the consumer decide)

            return parsed

        except Exception as e:
            logger.debug(f"Could not parse value '{value_text}': {e}")
            return None

    def _map_field(self, data: dict, label: str, value: Optional[float]):
        """Map Fundamentus field labels to data dictionary keys"""

        # Normalize label
        label = label.lower().strip().replace("?", "")

        # Mapping dictionary
        field_map = {
            "cotação": "price",
            "p/l": "p_l",
            "p/vp": "p_vp",
            "psr": "psr",
            "p/ativos": "p_ativos",
            "p/cap.giro": "p_cap_giro",
            "p/ebit": "p_ebit",
            "p/ativ circ.liq": "p_ativ_circ_liq",
            "ev/ebit": "ev_ebit",
            "ev/ebitda": "ev_ebitda",
            "mrg ebit": "margem_ebit",
            "marg. ebit": "margem_ebit",
            "mrg. líq.": "margem_liquida",
            "marg. líquida": "margem_liquida",
            "liq. corr.": "liquidez_corrente",
            "liquidez corrente": "liquidez_corrente",
            "liq.2meses": "liquidez_2meses",
            "liquidez 2 meses": "liquidez_2meses",
            "dív.brut/patrim.": "div_bruta_patrim",
            "div. bruta/patrim.": "div_bruta_patrim",
            "dív.líq./patrim.": "div_liquida_patrim",
            "div. líquida/patrim.": "div_liquida_patrim",
            "dív.líq./ebit": "div_liquida_ebit",
            "div. líquida/ebit": "div_liquida_ebit",
            "patrim. líq": "patrim_liquido",
            "patrimônio líquido": "patrim_liquido",
            "receita líquida": "receita_liquida",
            "ebit": "ebit",
            "lucro líquido": "lucro_liquido",
            "cresc. rec.5a": "crescimento_receita_5a",
            "crescimento receita 5a": "crescimento_receita_5a",
            "roe": "roe",
            "roic": "roic",
            "roa": "roa",
            "div. yield": "dy",
            "dividend yield": "dy",
            "payout": "payout",
            "nro. ações": "nro_acoes",
            "número de ações": "nro_acoes",
        }

        # Find matching field
        for key, field in field_map.items():
            if key in label:
                data[field] = value
                return

        # Log unmapped fields for future improvement
        logger.debug(f"Unmapped Fundamentus field: '{label}' = {value}")


# Example usage
async def test_fundamentus():
    """Test Fundamentus scraper"""
    scraper = FundamentusScraper()

    try:
        # Test with PETR4
        result = await scraper.scrape_with_retry("PETR4")

        if result.success:
            print("✅ Success!")
            print(f"Data: {result.data}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_fundamentus())
