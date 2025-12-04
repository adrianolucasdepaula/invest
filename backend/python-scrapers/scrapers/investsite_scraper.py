"""
Investsite Scraper - Dados fundamentalistas publicos
Fonte: https://www.investsite.com.br/
SEM necessidade de login - dados publicos

MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
import asyncio
from typing import Dict, Any, Optional
from loguru import logger
from bs4 import BeautifulSoup
import re

from base_scraper import BaseScraper, ScraperResult


class InvestsiteScraper(BaseScraper):
    """
    Scraper para dados fundamentalistas do Investsite

    FONTE PUBLICA - SEM LOGIN NECESSARIO
    OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing

    Dados extraidos:
    - Cotacao e variacao
    - Indicadores de valuation (P/L, P/VP, EV/EBITDA, etc.)
    - Indicadores de rentabilidade (ROE, ROIC, Margem Liquida, etc.)
    - Indicadores de endividamento
    - Indicadores de eficiencia
    - Dados de balanco e DRE
    """

    BASE_URL = "https://www.investsite.com.br/principais_indicadores.php"

    def __init__(self):
        super().__init__(
            name="Investsite",
            source="INVESTSITE",
            requires_login=False,
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
            # Ensure page is initialized (Playwright)
            if not self.page:
                await self.initialize()

            # Build URL
            url = f"{self.BASE_URL}?cod_negociacao={ticker.upper()}"
            logger.info(f"Navigating to {url}")

            # Navigate (Playwright)
            await self.page.goto(url, wait_until="load", timeout=60000)

            # Small delay for JS execution
            await asyncio.sleep(2)

            # Check if ticker exists
            page_source = await self.page.content()
            if (
                "nao encontrado" in page_source.lower()
                or "ativo nao encontrado" in page_source.lower()
                or "codigo invalido" in page_source.lower()
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
        """
        Extract comprehensive fundamental data from Investsite page

        OPTIMIZED: Uses single HTML fetch + local parsing (BeautifulSoup)
        """
        try:
            data = {
                "ticker": ticker.upper(),
                "company_name": None,

                # Cotacao
                "price": None,
                "price_change": None,
                "price_change_percent": None,

                # Valuation
                "p_l": None,
                "p_vp": None,
                "psr": None,
                "p_ativos": None,
                "p_ebit": None,
                "ev_ebitda": None,
                "ev_ebit": None,

                # Rentabilidade
                "roe": None,
                "roa": None,
                "roic": None,
                "margem_bruta": None,
                "margem_ebitda": None,
                "margem_ebit": None,
                "margem_liquida": None,

                # Endividamento
                "div_liquida_pl": None,
                "div_liquida_ebitda": None,
                "div_liquida_ebit": None,
                "pl_ativo": None,

                # Eficiencia
                "giro_ativos": None,
                "margem_operacional": None,

                # Dividendos
                "dy": None,
                "payout": None,

                # Liquidez
                "liquidez_corrente": None,
                "volume_medio": None,

                # Valores absolutos (em milhares)
                "receita_liquida": None,
                "ebitda": None,
                "ebit": None,
                "lucro_liquido": None,
                "patrimonio_liquido": None,
                "ativos": None,
                "div_liquida": None,
                "market_cap": None,

                # Additional fields
                "lpa": None,
                "vpa": None,

                # Temporary fields for calculation
                "_div_bruta": None,
                "_enterprise_value": None,
                "_ev_receita": None,
                "_ev_ativo": None,
                "_var_ytd": None,
            }

            # OPTIMIZATION: Get HTML content once and parse locally
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Company name - try multiple selectors
            try:
                name_elem = soup.select_one("h1.main-indicator, .company-name, h1, .ticker-info h2")
                if name_elem:
                    company_text = name_elem.get_text().strip()
                    # Clean up company name
                    company_text = re.sub(r'\s*-\s*\w+\d*\s*$', '', company_text)
                    company_text = re.sub(r'\s*\(\s*\w+\d*\s*\)\s*$', '', company_text)
                    data["company_name"] = company_text
            except Exception as e:
                logger.debug(f"Could not extract company name: {e}")

            # Current price
            try:
                price_elem = soup.select_one(".main-indicator .value, .cotacao-atual, [data-field='price']")
                if price_elem:
                    price_text = price_elem.get_text().strip()
                    data["price"] = self._parse_value(price_text)
            except Exception as e:
                logger.debug(f"Could not extract price: {e}")

            # Extract all indicator tables - Investsite organizes data in tables
            try:
                rows = soup.select("tr, .indicator-row")

                for row in rows:
                    try:
                        # Try to extract label and value
                        label_elem = row.select_one("td:first-child, .label, .indicator-label")
                        value_elem = row.select_one("td:last-child, .value, .indicator-value")

                        if label_elem and value_elem:
                            label = label_elem.get_text().strip()
                            value_text = value_elem.get_text().strip()

                            # Parse and map
                            parsed_value = self._parse_value(value_text)
                            self._map_field(data, label, parsed_value, value_text)

                    except Exception:
                        continue

            except Exception as e:
                logger.debug(f"Error extracting indicators: {e}")

            # Alternative extraction - look for data-attribute based elements
            try:
                elements = soup.select("[data-indicator], [data-field]")

                for elem in elements:
                    try:
                        indicator = elem.get("data-indicator") or elem.get("data-field")
                        value_text = elem.get_text().strip()

                        if indicator and value_text:
                            parsed_value = self._parse_value(value_text)
                            self._map_field(data, indicator, parsed_value, value_text)

                    except Exception:
                        continue

            except Exception as e:
                logger.debug(f"Alternative extraction failed: {e}")

            # Extract from specific div containers (common pattern)
            try:
                containers = soup.select(".info-box, .indicator-container, .data-row")
                for container in containers:
                    label_elem = container.select_one(".label, .title, span:first-child")
                    value_elem = container.select_one(".value, strong, span:last-child")

                    if label_elem and value_elem:
                        label = label_elem.get_text().strip()
                        value_text = value_elem.get_text().strip()
                        parsed_value = self._parse_value(value_text)
                        self._map_field(data, label, parsed_value, value_text)

            except Exception as e:
                logger.debug(f"Container extraction failed: {e}")

            # Calculate derived fields
            try:
                # Payout = DY * P/L (derived: DY=DPA/Price, P/L=Price/LPA, so DY*P/L=DPA/LPA=Payout)
                if data.get("payout") is None and data.get("dy") and data.get("p_l"):
                    calculated_payout = data["dy"] * data["p_l"]
                    # Sanity check: payout should be between 0 and 200%
                    if 0 <= calculated_payout <= 200:
                        data["payout"] = round(calculated_payout, 2)
                        logger.debug(f"Calculated payout: {data['payout']}%")

                # div_liquida_ebit = Div Liquida / EBIT
                if data.get("div_liquida_ebit") is None and data.get("div_liquida") and data.get("ebit"):
                    if data["ebit"] != 0:
                        data["div_liquida_ebit"] = round(data["div_liquida"] / data["ebit"], 2)

                # pl_ativo = Patrimonio Liquido / Ativo Total
                if data.get("pl_ativo") is None and data.get("patrimonio_liquido") and data.get("ativos"):
                    if data["ativos"] != 0:
                        data["pl_ativo"] = round(data["patrimonio_liquido"] / data["ativos"], 2)

            except Exception as e:
                logger.debug(f"Error calculating derived fields: {e}")

            # Remove temporary fields
            data.pop("_div_bruta", None)
            data.pop("_enterprise_value", None)
            data.pop("_ev_receita", None)
            data.pop("_ev_ativo", None)
            data.pop("_var_ytd", None)

            logger.debug(f"Extracted Investsite data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.error(f"Error in _extract_data: {e}")
            return None

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
            value_text = value_text.replace("%", "").strip()

            # Handle trillions/billions/millions notation
            multiplier = 1
            if " t" in value_text.lower() or value_text.lower().endswith("t"):
                multiplier = 1_000_000_000_000
                value_text = re.sub(r'\s*[tT]\s*$', '', value_text).strip()
            elif "bi" in value_text.lower() or (len(value_text) > 0 and value_text[-1:].lower() == "b"):
                multiplier = 1_000_000_000
                value_text = re.sub(r'[bB][iI]?', '', value_text).strip()
            elif "mi" in value_text.lower() or (len(value_text) > 0 and value_text[-1:].lower() == "m"):
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
        if value is None:
            return

        # Normalize label - remove accents for matching
        label_normalized = label.lower().strip().replace("?", "")

        # Exact match mappings (priority - Investsite exact labels)
        exact_map = {
            # Valuation - exact Investsite labels
            "p/l": "p_l",
            "preço/lucro": "p_l",
            "p/vp": "p_vp",
            "preço/vpa": "p_vp",
            "preço/valor patrimonial": "p_vp",
            "ev/ebitda": "ev_ebitda",
            "ev/ebit": "ev_ebit",
            "preço/ativos": "p_ativos",
            "preço/ativo total": "p_ativos",
            "p/ebit": "p_ebit",
            "preço/ebit": "p_ebit",
            "preço/receita líquida": "psr",
            "ev/receita líquida": "_ev_receita",
            "ev/ativo total": "_ev_ativo",

            # ROE/ROA/ROIC - exact from Investsite
            "retorno s/ patrimônio líquido inicial": "roe",
            "retorno s/ ativo inicial": "roa",
            "retorno s/ capital investido inicial": "roic",

            # Margins
            "margem bruta": "margem_bruta",
            "margem ebitda": "margem_ebitda",
            "margem ebit": "margem_ebit",
            "margem líquida": "margem_liquida",

            # Debt ratios
            "passivo/patrimônio líquido": "div_liquida_pl",
            "dívida líquida/ebitda": "div_liquida_ebitda",

            # Efficiency
            "giro do ativo inicial": "giro_ativos",

            # Dividends
            "dividend yield": "dy",
            "payout": "payout",

            # Per share values
            "lucro/ação": "lpa",
            "valor patrimonial da ação": "vpa",

            # Price
            "último preço de fechamento": "price",
            "preço atual da ação": "price",

            # Absolutes
            "patrimônio líquido": "patrimonio_liquido",
            "dívida líquida": "div_liquida",
            "dívida bruta": "_div_bruta",
            "market cap empresa": "market_cap",
            "valor de mercado": "market_cap",
            "ativo total": "ativos",
            "volume diário médio (3 meses)": "volume_medio",
            "receita líquida": "receita_liquida",
            "lucro líquido": "lucro_liquido",
            "ebit": "ebit",
            "ebitda": "ebitda",
            "enterprise value": "_enterprise_value",
            "liquidez corrente": "liquidez_corrente",

            # Price variations
            "variação 1 ano": "price_change_percent",
            "variação 2025": "_var_ytd",
        }

        # Check exact match first
        if label_normalized in exact_map:
            field = exact_map[label_normalized]
            if data.get(field) is None:
                data[field] = value
            return

        # Partial match mappings (fallback)
        partial_map = [
            ("preço/lucro", "p_l"),
            ("preco/lucro", "p_l"),
            ("p/l", "p_l"),
            ("preço/vpa", "p_vp"),
            ("preco/vpa", "p_vp"),
            ("preço/valor patrimonial", "p_vp"),
            ("preco/valor patrimonial", "p_vp"),
            ("p/vp", "p_vp"),
            ("preço/receita", "psr"),
            ("preco/receita", "psr"),
            ("preço/ativo total", "p_ativos"),
            ("preco/ativo total", "p_ativos"),
            ("preço/ativos", "p_ativos"),
            ("preço/ebit", "p_ebit"),
            ("preco/ebit", "p_ebit"),
            ("ev/ebitda", "ev_ebitda"),
            ("ev/ebit", "ev_ebit"),
            ("retorno s/ patrimonio liquido", "roe"),
            ("retorno s/ patrimônio líquido", "roe"),
            ("retorno s/ ativo", "roa"),
            ("retorno s/ capital investido", "roic"),
            ("margem liquida", "margem_liquida"),
            ("margem líquida", "margem_liquida"),
            ("margem bruta", "margem_bruta"),
            ("margem ebitda", "margem_ebitda"),
            ("margem ebit", "margem_ebit"),
            ("divida liquida/ebitda", "div_liquida_ebitda"),
            ("dívida líquida/ebitda", "div_liquida_ebitda"),
            ("passivo/patrimonio", "div_liquida_pl"),
            ("passivo/patrimônio", "div_liquida_pl"),
            ("giro do ativo", "giro_ativos"),
            ("dividend yield", "dy"),
            ("div. yield", "dy"),
            ("lucro/acao", "lpa"),
            ("lucro/ação", "lpa"),
            ("valor patrimonial da acao", "vpa"),
            ("valor patrimonial da ação", "vpa"),
            ("ultimo preco", "price"),
            ("último preço", "price"),
            ("preco atual", "price"),
            ("preço atual", "price"),
            ("patrimonio liquido", "patrimonio_liquido"),
            ("patrimônio líquido", "patrimonio_liquido"),
            ("divida liquida", "div_liquida"),
            ("dívida líquida", "div_liquida"),
            ("market cap", "market_cap"),
            ("valor de mercado", "market_cap"),
            ("volume diario medio", "volume_medio"),
            ("volume diário médio", "volume_medio"),
            ("receita liquida", "receita_liquida"),
            ("receita líquida", "receita_liquida"),
            ("lucro liquido", "lucro_liquido"),
            ("lucro líquido", "lucro_liquido"),
            ("variação 1 ano", "price_change_percent"),
            ("variacao 1 ano", "price_change_percent"),
        ]

        for key, field in partial_map:
            if key in label_normalized and data.get(field) is None:
                data[field] = value
                return


# Example usage
async def test_investsite():
    """Test Investsite scraper"""
    scraper = InvestsiteScraper()

    try:
        await scraper.initialize()

        # Test with PETR4
        result = await scraper.scrape("PETR4")

        if result.success:
            print("Success!")
            print(f"Data: {result.data}")
        else:
            print(f"Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_investsite())
