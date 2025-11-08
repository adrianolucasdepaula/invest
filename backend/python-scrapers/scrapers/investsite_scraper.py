"""
Investsite Scraper - Dados fundamentalistas públicos
Fonte: https://www.investsite.com.br/
SEM necessidade de login - dados públicos
"""
import asyncio
from typing import Dict, Any, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger
import re

from base_scraper import BaseScraper, ScraperResult


class InvestsiteScraper(BaseScraper):
    """
    Scraper para dados fundamentalistas do Investsite

    FONTE PÚBLICA - SEM LOGIN NECESSÁRIO

    Dados extraídos:
    - Cotação e variação
    - Indicadores de valuation (P/L, P/VP, EV/EBITDA, etc.)
    - Indicadores de rentabilidade (ROE, ROIC, Margem Líquida, etc.)
    - Indicadores de endividamento
    - Indicadores de eficiência
    - Dados de balanço e DRE
    """

    BASE_URL = "https://www.investsite.com.br/principais_indicadores.php"

    def __init__(self):
        super().__init__(
            name="Investsite",
            source="INVESTSITE",
            requires_login=False,  # PÚBLICO!
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape fundamental data from Investsite

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
            url = f"{self.BASE_URL}?cod_negociacao={ticker.upper()}"
            logger.info(f"Navigating to {url}")

            # Navigate
            self.driver.get(url)

            # Wait for page to load
            await asyncio.sleep(3)

            # Check if ticker exists
            page_source = self.driver.page_source.lower()
            if (
                "não encontrado" in page_source
                or "ativo não encontrado" in page_source
                or "código inválido" in page_source
            ):
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found on Investsite",
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
                    error="Failed to extract data from Investsite",
                    source=self.source,
                )

        except Exception as e:
            logger.error(f"Error scraping {ticker} from Investsite: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract comprehensive fundamental data from Investsite page"""
        try:
            data = {
                "ticker": ticker.upper(),
                "company_name": None,

                # Cotação
                "price": None,
                "price_change": None,
                "price_change_percent": None,

                # Valuation
                "p_l": None,          # P/L
                "p_vp": None,         # P/VP
                "psr": None,          # PSR (P/Receita)
                "p_ativos": None,     # P/Ativos
                "p_ebit": None,       # P/EBIT
                "ev_ebitda": None,    # EV/EBITDA
                "ev_ebit": None,      # EV/EBIT

                # Rentabilidade
                "roe": None,              # ROE
                "roa": None,              # ROA
                "roic": None,             # ROIC
                "margem_bruta": None,     # Margem Bruta
                "margem_ebitda": None,    # Margem EBITDA
                "margem_ebit": None,      # Margem EBIT
                "margem_liquida": None,   # Margem Líquida

                # Endividamento
                "div_liquida_pl": None,       # Dív. Líq./PL
                "div_liquida_ebitda": None,   # Dív. Líq./EBITDA
                "div_liquida_ebit": None,     # Dív. Líq./EBIT
                "pl_ativo": None,             # PL/Ativos

                # Eficiência
                "giro_ativos": None,          # Giro Ativos
                "margem_operacional": None,   # Margem Operacional

                # Dividendos
                "dy": None,                   # Dividend Yield
                "payout": None,               # Payout

                # Liquidez
                "liquidez_corrente": None,    # Liquidez Corrente
                "volume_medio": None,         # Volume médio diário

                # Valores absolutos (em milhares)
                "receita_liquida": None,      # Receita Líquida
                "ebitda": None,               # EBITDA
                "ebit": None,                 # EBIT
                "lucro_liquido": None,        # Lucro Líquido
                "patrimonio_liquido": None,   # Patrimônio Líquido
                "ativos": None,               # Ativos Totais
                "div_liquida": None,          # Dívida Líquida
                "market_cap": None,           # Valor de Mercado
            }

            # Company name
            try:
                # Try multiple selectors
                name_selectors = [
                    "h1.main-indicator",
                    ".company-name",
                    "h1",
                    ".ticker-info h2",
                ]

                for selector in name_selectors:
                    try:
                        name_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if name_elem.text.strip():
                            company_text = name_elem.text.strip()
                            # Clean up company name
                            company_text = re.sub(r'\s*-\s*\w+\d*\s*$', '', company_text)
                            company_text = re.sub(r'\s*\(\s*\w+\d*\s*\)\s*$', '', company_text)
                            data["company_name"] = company_text
                            break
                    except:
                        continue

            except Exception as e:
                logger.debug(f"Could not extract company name: {e}")

            # Current price
            try:
                price_selectors = [
                    ".main-indicator .value",
                    ".cotacao-atual",
                    "[data-field='price']",
                ]

                for selector in price_selectors:
                    try:
                        price_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        price_text = price_elem.text.strip()
                        data["price"] = self._parse_value(price_text)
                        if data["price"]:
                            break
                    except:
                        continue

            except Exception as e:
                logger.debug(f"Could not extract price: {e}")

            # Extract all indicator tables
            try:
                # Investsite organiza dados em tabelas
                # Procurar por todas as células de dados
                rows = self.driver.find_elements(By.CSS_SELECTOR, "tr, .indicator-row")

                for row in rows:
                    try:
                        # Tentar extrair label e valor
                        label_elem = row.find_element(By.CSS_SELECTOR, "td:first-child, .label, .indicator-label")
                        value_elem = row.find_element(By.CSS_SELECTOR, "td:last-child, .value, .indicator-value")

                        label = label_elem.text.strip()
                        value_text = value_elem.text.strip()

                        # Parse and map
                        parsed_value = self._parse_value(value_text)
                        self._map_field(data, label, parsed_value, value_text)

                    except Exception as e:
                        continue

            except Exception as e:
                logger.debug(f"Error extracting indicators: {e}")

            # Try alternative extraction if main method didn't work
            if not data.get("p_l"):
                await self._extract_alternative(data)

            logger.debug(f"Extracted Investsite data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.error(f"Error in _extract_data: {e}")
            return None

    async def _extract_alternative(self, data: dict):
        """Alternative extraction method using different selectors"""
        try:
            # Look for data-attribute based elements
            elements = self.driver.find_elements(By.CSS_SELECTOR, "[data-indicator], [data-field]")

            for elem in elements:
                try:
                    indicator = elem.get_attribute("data-indicator") or elem.get_attribute("data-field")
                    value_text = elem.text.strip()

                    if indicator and value_text:
                        parsed_value = self._parse_value(value_text)
                        self._map_field(data, indicator, parsed_value, value_text)

                except Exception as e:
                    continue

        except Exception as e:
            logger.debug(f"Alternative extraction failed: {e}")

    def _parse_value(self, value_text: str) -> Optional[float]:
        """
        Parse numeric value from text
        Handles Brazilian number format
        Handles percentages, billions, millions
        """
        if not value_text or value_text in ["-", "N/D", "N/A", "--"]:
            return None

        try:
            # Remove common prefixes and suffixes
            value_text = value_text.replace("R$", "").strip()

            # Check for percentage
            is_percent = "%" in value_text
            value_text = value_text.replace("%", "").strip()

            # Handle billions/millions notation
            multiplier = 1
            if "bi" in value_text.lower() or "b" == value_text[-1:].lower():
                multiplier = 1_000_000_000
                value_text = re.sub(r'[bB][iI]?', '', value_text).strip()
            elif "mi" in value_text.lower() or "m" == value_text[-1:].lower():
                multiplier = 1_000_000
                value_text = re.sub(r'[mM][iI]?', '', value_text).strip()
            elif "k" in value_text.lower():
                multiplier = 1_000
                value_text = value_text.replace("k", "").replace("K", "").strip()

            # Replace Brazilian decimal separator
            # First remove thousand separators (dots), then replace comma with dot
            value_text = value_text.replace(".", "")
            value_text = value_text.replace(",", ".")

            # Parse number
            parsed = float(value_text) * multiplier

            return parsed

        except Exception as e:
            logger.debug(f"Could not parse value '{value_text}': {e}")
            return None

    def _map_field(self, data: dict, label: str, value: Optional[float], original_text: str = ""):
        """Map Investsite field labels to data dictionary keys"""

        # Normalize label
        label_normalized = label.lower().strip().replace("?", "")

        # Mapping dictionary
        field_map = {
            # Valuation
            "p/l": "p_l",
            "p/vp": "p_vp",
            "p/vpa": "p_vp",
            "psr": "psr",
            "p/receita": "psr",
            "p/ativos": "p_ativos",
            "p/ebit": "p_ebit",
            "ev/ebitda": "ev_ebitda",
            "ev/ebit": "ev_ebit",

            # Rentabilidade
            "roe": "roe",
            "roa": "roa",
            "roic": "roic",
            "margem bruta": "margem_bruta",
            "margem ebitda": "margem_ebitda",
            "mg. ebitda": "margem_ebitda",
            "margem ebit": "margem_ebit",
            "mg. ebit": "margem_ebit",
            "margem líquida": "margem_liquida",
            "mg. líquida": "margem_liquida",
            "margem operacional": "margem_operacional",

            # Endividamento
            "dív. líq./pl": "div_liquida_pl",
            "div. liq./pl": "div_liquida_pl",
            "dív. líq./ebitda": "div_liquida_ebitda",
            "div. liq./ebitda": "div_liquida_ebitda",
            "dív. líq./ebit": "div_liquida_ebit",
            "pl/ativos": "pl_ativo",

            # Eficiência
            "giro ativos": "giro_ativos",

            # Dividendos
            "div. yield": "dy",
            "dividend yield": "dy",
            "dy": "dy",
            "payout": "payout",

            # Liquidez
            "liq. corrente": "liquidez_corrente",
            "liquidez corrente": "liquidez_corrente",
            "volume médio": "volume_medio",
            "vol. médio": "volume_medio",

            # Valores absolutos
            "receita líquida": "receita_liquida",
            "rec. líquida": "receita_liquida",
            "ebitda": "ebitda",
            "ebit": "ebit",
            "lucro líquido": "lucro_liquido",
            "luc. líquido": "lucro_liquido",
            "patrimônio líquido": "patrimonio_liquido",
            "patrim. líquido": "patrimonio_liquido",
            "pl": "patrimonio_liquido",
            "ativos": "ativos",
            "ativo total": "ativos",
            "dívida líquida": "div_liquida",
            "dívi. líquida": "div_liquida",
            "valor de mercado": "market_cap",
            "market cap": "market_cap",

            # Cotação
            "cotação": "price",
            "preço": "price",
            "variação": "price_change_percent",
        }

        # Find matching field
        for key, field in field_map.items():
            if key in label_normalized:
                data[field] = value
                return

        # Log unmapped fields for future improvement
        if value is not None:
            logger.debug(f"Unmapped Investsite field: '{label}' = {value} (original: '{original_text}')")


# Example usage
async def test_investsite():
    """Test Investsite scraper"""
    scraper = InvestsiteScraper()

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
    asyncio.run(test_investsite())
