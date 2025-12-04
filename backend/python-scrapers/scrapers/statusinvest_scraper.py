"""
StatusInvest Scraper - Fundamental data
Fonte: https://statusinvest.com.br
Requer login: NÃO (dados públicos)

MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
import asyncio
from typing import Dict, Any, Optional
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class StatusInvestScraper(BaseScraper):
    """
    Scraper for StatusInvest fundamental data

    OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing
    instead of multiple Selenium find_element calls. ~10x faster!

    Dados extraídos:
    - company_name, price, dy, p_l, p_vp, roe, roic
    - liquidity, market_cap, ev_ebitda, dividend_yield
    - lpa, vpa, margem_liquida, margem_bruta
    """

    BASE_URL = "https://statusinvest.com.br/acoes/"

    def __init__(self):
        super().__init__(
            name="StatusInvest",
            source="STATUSINVEST",
            requires_login=False,
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape fundamental data from StatusInvest

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with fundamental data
        """
        try:
            # Ensure page is initialized (Playwright)
            if not self.page:
                await self.initialize()

            # Build URL
            url = f"{self.BASE_URL}{ticker.lower()}"
            logger.info(f"Navigating to {url}")

            # Navigate (Playwright)
            # Using 'load' instead of 'networkidle' to avoid timeout issues
            await self.page.goto(url, wait_until="load", timeout=60000)

            # Small delay for JS execution
            await asyncio.sleep(2)

            # Check if ticker exists
            page_source = await self.page.content()
            if "não encontrado" in page_source.lower() or "erro 404" in page_source.lower():
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found",
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
                        "requires_login": self.requires_login,
                    },
                )
            else:
                return ScraperResult(
                    success=False,
                    error="Failed to extract data",
                    source=self.source,
                )

        except Exception as e:
            logger.error(f"Error scraping {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Extract fundamental data from page

        OPTIMIZED: Uses single HTML fetch + local parsing (BeautifulSoup)
        instead of multiple await calls. ~10x faster!

        StatusInvest structure (2024-12):
        - Each indicator is in a container with h3 (title) + strong (value)
        - Price is in div[title="Valor atual do ativo"] > strong
        - Company name is in h1
        """
        try:
            data = {
                "ticker": ticker.upper(),
                "company_name": None,
                "price": None,
                "dy": None,
                "p_l": None,
                "p_vp": None,
                "roe": None,
                "roic": None,
                "liquidity": None,
                "market_cap": None,
                "ev_ebitda": None,
                "lpa": None,
                "vpa": None,
                "margem_liquida": None,
                "margem_bruta": None,
                "div_liquida_ebitda": None,
                "payout": None,
            }

            # OPTIMIZATION: Get HTML content once and parse locally
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Company name - h1 element
            try:
                h1_elem = soup.select_one("h1")
                if h1_elem:
                    data["company_name"] = h1_elem.get_text().strip()
            except Exception as e:
                logger.debug(f"Could not extract company name: {e}")

            # Current price - div with title="Valor atual do ativo" > strong
            try:
                price_container = soup.select_one("[title='Valor atual do ativo']")
                if price_container:
                    price_strong = price_container.select_one("strong")
                    if price_strong:
                        price_text = price_strong.get_text().strip()
                        data["price"] = self._parse_value(price_text)
            except Exception as e:
                logger.debug(f"Could not extract price: {e}")

            # Extract indicators using h3 + strong pattern
            # Each indicator block has: h3 with title, strong with value
            try:
                # Find all h3 elements (indicator titles)
                h3_elements = soup.select("h3")

                for h3 in h3_elements:
                    title = h3.get_text().strip().upper()

                    # Skip empty or irrelevant titles
                    if not title or len(title) < 2:
                        continue

                    # Find the strong element that follows (sibling or in parent)
                    parent = h3.parent
                    if parent:
                        # Look for strong in the parent container
                        strong_elem = parent.select_one("strong")
                        if strong_elem and strong_elem != h3:
                            value_text = strong_elem.get_text().strip()
                            value = self._parse_value(value_text)
                            if value is not None:
                                self._map_field(data, title, value)

            except Exception as e:
                logger.debug(f"Could not extract indicators via h3: {e}")

            # Alternative extraction: look for divs with specific title attributes
            # These are the indicator containers with tooltips
            indicator_titles = {
                "Dividend Yield com base nos últimos 12 meses": "dy",
                "Dá uma ideia do quanto o mercado está disposto a pagar pelos lucros da empresa": "p_l",
                "Facilita a análise e comparação da relação do preço de negociação de um ativo com seu VPA": "p_vp",
                "mostra quanto tempo levaria para o valor calculado no EBITDA pagar": "ev_ebitda",
                "Indica qual o valor patrimonial de uma ação": "vpa",
                "Indicar se a empresa é ou não lucrativa": "lpa",
                "Mede a capacidade de agregar valor": "roe",
                "Mede a rentabilidade de dinheiro": "roic",
                "Mede, objetivamente, o quanto a empresa ganha com a venda": "margem_bruta",
                "Revela a porcentagem de lucro em relação às receitas": "margem_liquida",
                "Indica a capacidade de pagamento da empresa no curto prazo": "liquidity",
                "Indica quanto tempo seria necessário para pagar a dívida líquida": "div_liquida_ebitda",
                "O valor da ação multiplicado pelo número de ações existentes": "market_cap",
            }

            try:
                # Find all divs with title attributes containing indicator descriptions
                for title_substr, field in indicator_titles.items():
                    if data.get(field) is not None:
                        continue  # Skip if already extracted

                    # Find container with matching title
                    container = soup.select_one(f"[title*='{title_substr[:30]}']")
                    if container:
                        strong_elem = container.select_one("strong")
                        if strong_elem:
                            value_text = strong_elem.get_text().strip()
                            value = self._parse_value(value_text)
                            if value is not None:
                                data[field] = value

            except Exception as e:
                logger.debug(f"Could not extract via title attributes: {e}")

            # Fallback: Look for specific link patterns (StatusInvest uses links with format_quote)
            try:
                links = soup.select("a[href*='/termos/']")
                for link in links:
                    title = link.get_text().strip().upper().replace("FORMAT_QUOTE", "").strip()
                    parent = link.parent
                    if parent:
                        # Get the next strong element
                        strong_elem = parent.select_one("strong")
                        if strong_elem:
                            value_text = strong_elem.get_text().strip()
                            value = self._parse_value(value_text)
                            if value is not None:
                                self._map_field(data, title, value)

            except Exception as e:
                logger.debug(f"Could not extract via links: {e}")

            # Calculate payout if not directly available
            # Payout = DY * P/L (derived from DY=DPA/Price and P/L=Price/LPA)
            if data.get("payout") is None and data.get("dy") and data.get("p_l"):
                try:
                    calculated_payout = data["dy"] * data["p_l"]
                    # Sanity check: payout should be between 0 and 200%
                    if 0 <= calculated_payout <= 200:
                        data["payout"] = round(calculated_payout, 2)
                        logger.debug(f"Calculated payout: {data['payout']}% (DY={data['dy']} * P/L={data['p_l']})")
                except Exception as e:
                    logger.debug(f"Could not calculate payout: {e}")

            logger.debug(f"Extracted data for {ticker}: {data}")
            return data

        except Exception as e:
            logger.error(f"Error in _extract_data: {e}")
            return None

    def _parse_value(self, value_text: str) -> Optional[float]:
        """
        Parse numeric value from text
        Handles Brazilian number format (comma as decimal separator)
        """
        if not value_text or value_text == "-" or value_text.lower() == "n/a":
            return None

        try:
            # Remove common prefixes
            value_text = value_text.replace("R$", "").strip()

            # Check for percentage
            value_text = value_text.replace("%", "").strip()

            # Handle billions/millions notation
            multiplier = 1
            if "B" in value_text.upper() or "BI" in value_text.upper():
                multiplier = 1_000_000_000
                value_text = value_text.upper().replace("BI", "").replace("B", "")
            elif "M" in value_text.upper() or "MI" in value_text.upper():
                multiplier = 1_000_000
                value_text = value_text.upper().replace("MI", "").replace("M", "")
            elif "K" in value_text.upper():
                multiplier = 1_000
                value_text = value_text.upper().replace("K", "")

            # Replace Brazilian decimal separator
            value_text = value_text.replace(".", "").replace(",", ".").strip()

            # Parse number
            parsed = float(value_text) * multiplier
            return parsed

        except Exception as e:
            logger.debug(f"Could not parse value '{value_text}': {e}")
            return None

    def _map_field(self, data: dict, title: str, value: Optional[float]):
        """Map field titles to data dictionary keys using exact matching"""
        if value is None:
            return

        # Normalize title - remove special chars and extra spaces
        title = title.strip().upper()
        # Remove icon text that might be included
        for icon in ["FORMAT_QUOTE", "HELP_OUTLINE", "SHOW_CHART"]:
            title = title.replace(icon, "").strip()

        # Exact matching dictionary
        field_map = {
            # Dividend Yield variants
            "D.Y": "dy",
            "DY": "dy",
            "DIVIDEND YIELD": "dy",
            "DIV. YIELD": "dy",
            # P/L variants
            "P/L": "p_l",
            "PREÇO/LUCRO": "p_l",
            # P/VP variants
            "P/VP": "p_vp",
            "P/VPA": "p_vp",
            "PREÇO/VALOR PATRIMONIAL": "p_vp",
            # ROE variants
            "ROE": "roe",
            "RETORNO SOBRE PATRIMÔNIO": "roe",
            # ROIC variants
            "ROIC": "roic",
            "RETORNO SOBRE CAPITAL": "roic",
            # Liquidity variants
            "LIQ. CORRENTE": "liquidity",
            "LIQUIDEZ CORRENTE": "liquidity",
            # Market Cap variants
            "VALOR DE MERCADO": "market_cap",
            "MARKET CAP": "market_cap",
            # EV/EBITDA variants
            "EV/EBITDA": "ev_ebitda",
            "EV / EBITDA": "ev_ebitda",
            # LPA variants
            "LPA": "lpa",
            "LUCRO POR AÇÃO": "lpa",
            # VPA variants
            "VPA": "vpa",
            "VALOR PATRIMONIAL POR AÇÃO": "vpa",
            # Margin variants
            "MARGEM LÍQUIDA": "margem_liquida",
            "MARG. LÍQUIDA": "margem_liquida",
            "M. LÍQUIDA": "margem_liquida",
            "MARGEM BRUTA": "margem_bruta",
            "MARG. BRUTA": "margem_bruta",
            "M. BRUTA": "margem_bruta",
            # Debt variants
            "DÍV. LÍQUIDA/EBITDA": "div_liquida_ebitda",
            "DÍVIDA LÍQUIDA/EBITDA": "div_liquida_ebitda",
            # Payout
            "PAYOUT": "payout",
        }

        # Find exact match first
        if title in field_map:
            field = field_map[title]
            if data.get(field) is None:  # Only set if not already set
                data[field] = value
            return

        # Try partial match as fallback (priority order)
        partial_matches = [
            ("D.Y", "dy"),
            ("P/L", "p_l"),
            ("P/VP", "p_vp"),
            ("EV/EBITDA", "ev_ebitda"),
            ("LPA", "lpa"),
            ("VPA", "vpa"),
            ("ROE", "roe"),
            ("ROIC", "roic"),
            ("M. LÍQUIDA", "margem_liquida"),
            ("M. BRUTA", "margem_bruta"),
            ("LIQ. CORRENTE", "liquidity"),
            ("VALOR DE MERCADO", "market_cap"),
            ("DÍV. LÍQUIDA/EBITDA", "div_liquida_ebitda"),
        ]

        for key, field in partial_matches:
            if key in title and data.get(field) is None:
                data[field] = value
                return


# Test function
async def test_statusinvest():
    """Test StatusInvest scraper"""
    scraper = StatusInvestScraper()

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
    asyncio.run(test_statusinvest())
