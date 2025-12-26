"""
Oceans14 Scraper - Dados fundamentalistas de ações brasileiras
Fonte: https://oceans14.com.br/
SEM necessidade de login - dados públicos

FASE 102: Novos scrapers para expandir cobertura (30/36 → 34/36)
MIGRATED TO PLAYWRIGHT - BeautifulSoup Single Fetch Pattern
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional
from loguru import logger
from bs4 import BeautifulSoup
import re

from base_scraper import BaseScraper, ScraperResult


class Oceans14Scraper(BaseScraper):
    """
    Scraper para dados fundamentalistas do Oceans14

    PADRÃO: Web-only (Playwright + BeautifulSoup Single Fetch)

    FONTE PÚBLICA - SEM LOGIN NECESSÁRIO

    Dados extraídos:
    - Cotação atual
    - P/L, P/VP, PSR, P/EBIT
    - Dividend Yield
    - ROE, ROIC, ROA
    - EV/EBITDA, EV/EBIT
    - Margens (Bruta, EBIT, Líquida)
    - Liquidez corrente
    - Dívida Líquida/EBITDA
    - LPA, VPA
    """

    BASE_URL = "https://oceans14.com.br/acoes"

    # Mapeamento de labels para campos (case insensitive)
    FIELD_MAP = {
        # Cotação
        "cotação": "price",
        "preço": "price",
        "valor atual": "price",
        # Valuation
        "p/l": "p_l",
        "p/vp": "p_vp",
        "psr": "psr",
        "p/sr": "psr",
        "p/ebit": "p_ebit",
        "p/ativo": "p_ativos",
        "p/ativos": "p_ativos",
        "p/cap.giro": "p_cap_giro",
        "p/cap. giro": "p_cap_giro",
        # EV Multiples
        "ev/ebitda": "ev_ebitda",
        "ev / ebitda": "ev_ebitda",
        "ev/ebit": "ev_ebit",
        "ev / ebit": "ev_ebit",
        # Dividendos
        "dividend yield": "dy",
        "div. yield": "dy",
        "dy": "dy",
        "yield": "dy",
        "payout": "payout",
        # Rentabilidade
        "roe": "roe",
        "roic": "roic",
        "roa": "roa",
        # Margens
        "margem bruta": "margem_bruta",
        "marg. bruta": "margem_bruta",
        "margem ebit": "margem_ebit",
        "marg. ebit": "margem_ebit",
        "margem líquida": "margem_liquida",
        "marg. líquida": "margem_liquida",
        "marg. líq.": "margem_liquida",
        # Endividamento
        "dívida líquida/ebitda": "div_liq_ebitda",
        "dív. líq./ebitda": "div_liq_ebitda",
        "dív. bruta/patrimônio": "div_bruta_patrim",
        "div. bruta/patrim": "div_bruta_patrim",
        "dív. líq./patrimônio": "div_liq_patrim",
        # Liquidez
        "liquidez corrente": "liquidez_corrente",
        "liq. corrente": "liquidez_corrente",
        "liquidez corr": "liquidez_corrente",
        # Per share
        "lpa": "lpa",
        "lucro por ação": "lpa",
        "vpa": "vpa",
        "valor patrimonial": "vpa",
        # Market data
        "valor de mercado": "market_cap",
        "vlr. mercado": "market_cap",
        "patrimônio líquido": "patrim_liquido",
        "patrim. líq.": "patrim_liquido",
        # Crescimento
        "cresc. rec. 5a": "crescimento_receita_5a",
        "cresc. lucro 5a": "crescimento_lucro_5a",
    }

    def __init__(self):
        super().__init__(
            name="Oceans14",
            source="OCEANS14",
            requires_login=False,  # PÚBLICO
        )

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape fundamental data from Oceans14

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with fundamental data
        """
        try:
            # Ensure page is initialized
            if not self.page:
                await self.initialize()

            url = f"{self.BASE_URL}/{ticker.lower()}"
            logger.info(f"Navigating to {url}")

            # Navigate (using 'load' - not 'networkidle' to avoid timeout)
            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(2)  # Wait for dynamic content

            # Check if ticker exists
            page_source = await self.page.content()
            page_lower = page_source.lower()

            not_found_indicators = [
                "não encontrad",
                "404",
                "página não existe",
                "ativo não encontrado",
                "ação não encontrada",
            ]

            if any(indicator in page_lower for indicator in not_found_indicators):
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found on Oceans14",
                    source=self.source,
                )

            # Extract data
            data = await self._extract_data(ticker)

            if data and (data.get("price") or data.get("p_l") or data.get("dy")):
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={"url": url, "requires_login": False},
                )

            return ScraperResult(
                success=False,
                error="Failed to extract data from Oceans14",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping Oceans14 for {ticker}: {e}")
            return ScraperResult(success=False, error=str(e), source=self.source)

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Extract data using BeautifulSoup Single Fetch pattern

        OPTIMIZATION: Get HTML once and parse locally (~10x faster)
        """
        try:
            data = {
                "ticker": ticker.upper(),
                "source": "Oceans14",
                "scraped_at": datetime.now().isoformat(),
            }

            # OPTIMIZATION: Get HTML once and parse locally
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Company name - try multiple selectors
            name_selectors = [
                "h1",
                ".company-name",
                ".ticker-name",
                ".stock-name",
                "[data-company-name]",
            ]
            for selector in name_selectors:
                name_elem = soup.select_one(selector)
                if name_elem:
                    name_text = name_elem.get_text().strip()
                    # Remove ticker from name if present
                    name_text = re.sub(r'\s*-\s*\w+\d*\s*$', '', name_text)
                    if name_text and len(name_text) > 2:
                        data["company_name"] = name_text
                        break

            # Extract indicators from table rows
            rows = soup.select("tr")
            for row in rows:
                try:
                    cells = row.select("td, th")
                    if len(cells) >= 2:
                        label = cells[0].get_text().strip().lower()
                        value_text = cells[1].get_text().strip()

                        self._map_field(data, label, value_text)
                except Exception:
                    continue

            # Also try card-based layout (common in modern sites)
            card_selectors = [
                ".card",
                ".indicator-card",
                ".metric",
                ".kpi",
                ".data-item",
                "[class*='indicator']",
            ]

            for selector in card_selectors:
                cards = soup.select(selector)
                for card in cards:
                    try:
                        label_selectors = [".title", ".label", ".name", "span:first-child", "dt"]
                        value_selectors = [".value", ".number", ".data", "span:last-child", "dd"]

                        label_elem = None
                        value_elem = None

                        for ls in label_selectors:
                            label_elem = card.select_one(ls)
                            if label_elem:
                                break

                        for vs in value_selectors:
                            value_elem = card.select_one(vs)
                            if value_elem:
                                break

                        if label_elem and value_elem:
                            label = label_elem.get_text().strip().lower()
                            value_text = value_elem.get_text().strip()
                            self._map_field(data, label, value_text)
                    except Exception:
                        continue

            # Try definition list (dl/dt/dd) layout
            dt_elements = soup.select("dt")
            for dt in dt_elements:
                try:
                    dd = dt.find_next_sibling("dd")
                    if dd:
                        label = dt.get_text().strip().lower()
                        value_text = dd.get_text().strip()
                        self._map_field(data, label, value_text)
                except Exception:
                    continue

            logger.debug(f"Extracted Oceans14 data for {ticker}: {len(data)} fields")
            return data

        except Exception as e:
            logger.error(f"Error extracting Oceans14 data: {e}")
            return None

    def _map_field(self, data: dict, label: str, value_text: str):
        """Map a label to the appropriate field in data dict"""
        # Normalize label
        label = label.lower().strip()

        for indicator_label, field_key in self.FIELD_MAP.items():
            if indicator_label in label:
                # Only set if not already set (first match wins)
                if field_key not in data or data[field_key] is None:
                    value = self._parse_value(value_text)
                    if value is not None:
                        data[field_key] = value
                return

    def _parse_value(self, value_text: str) -> Optional[float]:
        """
        Parse numeric value from text (Brazilian format)

        Handles:
        - R$ prefix
        - % suffix
        - Thousands separator (.)
        - Decimal separator (,)
        - Billion/Million suffixes (Bi, Mi)
        """
        if not value_text or value_text in ["-", "N/A", "n/a", "", "—", "–", "n/d"]:
            return None

        try:
            text = value_text.lower().strip()

            # Remove currency prefix
            text = text.replace("r$", "").strip()

            # Remove percentage suffix
            text = text.replace("%", "").strip()

            # Handle magnitude suffixes
            multiplier = 1

            if "tri" in text or text.endswith("t"):
                multiplier = 1_000_000_000_000
                text = re.sub(r'\s*tri?l?i?ões?\s*$', '', text)
                text = re.sub(r'\s*t\s*$', '', text)
            elif "bi" in text or text.endswith("b"):
                multiplier = 1_000_000_000
                text = re.sub(r'\s*bi?l?h?ões?\s*$', '', text)
                text = re.sub(r'\s*b\s*$', '', text)
            elif "mi" in text or text.endswith("m"):
                multiplier = 1_000_000
                text = re.sub(r'\s*mi?l?h?ões?\s*$', '', text)
                text = re.sub(r'\s*m\s*$', '', text)
            elif "mil" in text or text.endswith("k"):
                multiplier = 1_000
                text = re.sub(r'\s*mil\s*$', '', text)
                text = re.sub(r'\s*k\s*$', '', text)

            # Remove any remaining letters (reject if still has letters)
            if any(c.isalpha() for c in text):
                return None

            # Remove thousands separator (.) and convert decimal separator (,) to (.)
            text = text.replace(".", "").replace(",", ".")

            # Handle negative values (various Unicode minus signs)
            text = text.replace("−", "-").replace("–", "-")

            # Remove spaces
            text = text.replace(" ", "")

            # Parse and apply multiplier
            return float(text) * multiplier

        except Exception:
            return None

    async def health_check(self) -> bool:
        """Check if Oceans14 is accessible"""
        try:
            result = await self.scrape("PETR4")
            return result.success
        except Exception as e:
            logger.error(f"Oceans14 health check failed: {e}")
            return False


# Test function
async def test_oceans14():
    """Test Oceans14 scraper"""
    scraper = Oceans14Scraper()

    try:
        print("Testing Oceans14 scraper...")
        print("=" * 60)

        # Test with PETR4
        print("\nTesting PETR4...")
        result = await scraper.scrape("PETR4")

        if result.success:
            print("✅ PETR4 Success!")
            data = result.data
            print(f"   Ticker: {data.get('ticker')}")
            print(f"   Company: {data.get('company_name')}")
            print(f"   Price: R$ {data.get('price')}")
            print(f"   P/L: {data.get('p_l')}")
            print(f"   P/VP: {data.get('p_vp')}")
            print(f"   DY: {data.get('dy')}%")
            print(f"   ROE: {data.get('roe')}%")
            print(f"   EV/EBITDA: {data.get('ev_ebitda')}")
            print(f"   Margem Líquida: {data.get('margem_liquida')}%")
        else:
            print(f"❌ PETR4 Error: {result.error}")

        # Test with another stock
        print("\nTesting VALE3...")
        result2 = await scraper.scrape("VALE3")

        if result2.success:
            data = result2.data
            print(f"✅ VALE3: P/L={data.get('p_l')}, DY={data.get('dy')}%")
        else:
            print(f"❌ VALE3 Error: {result2.error}")

        # Test with invalid ticker
        print("\nTesting invalid ticker (XXXXX)...")
        result3 = await scraper.scrape("XXXXX")

        if not result3.success:
            print(f"✅ Correctly returned error: {result3.error}")
        else:
            print("❌ Should have returned error for invalid ticker")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_oceans14())
