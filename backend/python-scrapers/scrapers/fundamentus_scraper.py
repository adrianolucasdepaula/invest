"""
Fundamentus Scraper - Dados fundamentalistas públicos
Fonte: https://www.fundamentus.com.br/
SEM necessidade de login - dados públicos

MIGRATED TO PLAYWRIGHT - 2025-11-27
"""
import asyncio
from typing import Dict, Any, Optional
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
            # Ensure page is initialized (Playwright)
            if not self.page:
                await self.initialize()

            # Build URL
            url = f"{self.BASE_URL}?papel={ticker.upper()}"
            logger.info(f"Navigating to {url}")

            # Navigate (Playwright - auto-wait)
            # Using 'load' instead of 'networkidle' to avoid timeout issues with slow analytics
            await self.page.goto(url, wait_until="load", timeout=60000)

            # Wait for page to fully load
            await asyncio.sleep(1)

            # Check if ticker exists (Playwright)
            page_source = (await self.page.content()).lower()
            if ("não encontrado" in page_source or
                "papel não encontrado" in page_source or
                "nenhum papel encontrado" in page_source):
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
        """
        Extract comprehensive fundamental data from Fundamentus page

        OPTIMIZED: Uses single HTML fetch + local parsing (BeautifulSoup)
        instead of multiple await calls. ~10x faster!
        """
        try:
            from bs4 import BeautifulSoup

            data = {
                "ticker": ticker.upper(),
                "company_name": None,

                # Classificação
                "tipo": None,             # Tipo (PN, ON, UNT, etc)
                "setor": None,            # Setor
                "subsetor": None,         # Subsetor

                # Cotação e Valuation
                "price": None,
                "p_l": None,          # P/L
                "p_vp": None,         # P/VP
                "psr": None,          # PSR
                "p_ativos": None,     # P/Ativos
                "p_cap_giro": None,   # P/Cap.Giro
                "p_ebit": None,       # P/EBIT
                "p_ativ_circ_liq": None,  # P/Ativ Circ.Liq
                "market_cap": None,   # Valor de Mercado

                # EV Multiples
                "ev_ebit": None,      # EV/EBIT
                "ev_ebitda": None,    # EV/EBITDA

                # Margens
                "margem_ebit": None,  # Margem EBIT
                "margem_liquida": None,  # Margem Líquida
                "margem_bruta": None,    # Margem Bruta

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

                # Per share values
                "lpa": None,              # Lucro por Ação
                "vpa": None,              # Valor Patrimonial por Ação

                # Rentabilidade
                "crescimento_receita_5a": None,  # Crescimento Receita (5a)
                "roe": None,              # ROE
                "roic": None,             # ROIC
                "roa": None,              # ROA
                "giro_ativos": None,      # Giro dos Ativos

                # Dividendos
                "dy": None,               # Dividend Yield
                "payout": None,           # Payout

                # Número de ações
                "nro_acoes": None,        # Número de ações

                # Temporary fields for calculation
                "_div_bruta": None,       # Dív. Bruta (temporary)
                "_div_liquida": None,     # Dív. Líquida (temporary)
                "_ativo_total": None,     # Ativo Total (temporary)
                "_ebit_ativo": None,      # EBIT/Ativo (temporary)
            }

            # OPTIMIZATION: Get HTML content once and parse locally
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Company name (from header)
            try:
                name_elem = soup.select_one("h1, .resultado h2")
                if name_elem:
                    company_text = name_elem.get_text().strip()
                    # Remove ticker from name if present
                    company_text = re.sub(r'\s*-\s*\w+\d*\s*$', '', company_text)
                    data["company_name"] = company_text
            except Exception as e:
                logger.debug(f"Could not extract company name: {e}")

            # Extract tipo, setor e subsetor from first table
            # Esses campos estão na primeira tabela (table.w728) na primeira linha
            try:
                first_table = soup.select_one("table.w728")
                if first_table:
                    rows = first_table.select("tr")
                    for row in rows:
                        cells = row.select("td")
                        if len(cells) >= 4:
                            # Procurar labels "Tipo", "Setor", "Subsetor"
                            for i in range(0, len(cells), 2):
                                try:
                                    label_elem = cells[i].select_one(".txt")
                                    if not label_elem:
                                        continue

                                    label = label_elem.get_text().strip()

                                    if label == "Tipo":
                                        # Tipo é texto simples
                                        value_elem = cells[i + 1].select_one(".txt")
                                        if value_elem:
                                            data["tipo"] = value_elem.get_text().strip()

                                    elif label == "Setor":
                                        # Setor é link
                                        value_link = cells[i + 1].select_one("a")
                                        if value_link:
                                            data["setor"] = value_link.get_text().strip()

                                    elif label == "Subsetor":
                                        # Subsetor é link
                                        value_link = cells[i + 1].select_one("a")
                                        if value_link:
                                            data["subsetor"] = value_link.get_text().strip()

                                except Exception as e:
                                    continue
            except Exception as e:
                logger.debug(f"Could not extract tipo/setor/subsetor: {e}")

            # Extract table data (main data is in tables with class "w728")
            # MUCH faster: Local parsing instead of multiple await calls
            try:
                tables = soup.select("table.w728")

                for table in tables:
                    rows = table.select("tr")

                    for row in rows:
                        cells = row.select("td")

                        # Handle different table structures:
                        # - Tables 0,1,3,4: 4 columns (2 pairs of label-value)
                        # - Table 2: 6 columns (3 pairs of label-value) OR 2 columns (headers)

                        if len(cells) == 2:
                            # Header row - skip
                            continue
                        elif len(cells) == 4:
                            # Process in pairs: (label, value, label, value)
                            for i in range(0, 4, 2):
                                try:
                                    label_elem = cells[i].select_one(".txt")
                                    value_elem = cells[i + 1].select_one(".txt")

                                    if not label_elem or not value_elem:
                                        continue

                                    label = label_elem.get_text().strip()
                                    value = value_elem.get_text().strip()

                                    # Map to data fields (will parse internally)
                                    self._map_field(data, label, value)

                                except Exception as e:
                                    continue
                        elif len(cells) == 6:
                            # Process in triplets: (label, value, label, value, label, value)
                            for i in range(0, 6, 2):
                                try:
                                    label_elem = cells[i].select_one(".txt")
                                    value_elem = cells[i + 1].select_one(".txt")

                                    if not label_elem or not value_elem:
                                        continue

                                    label = label_elem.get_text().strip()
                                    value = value_elem.get_text().strip()

                                    # Skip empty labels/values
                                    if not label or not value:
                                        continue

                                    # Map to data fields (will parse internally)
                                    self._map_field(data, label, value)

                                except Exception as e:
                                    continue

            except Exception as e:
                logger.error(f"Error extracting table data: {e}")

            # Calculate derived fields
            try:
                # div_liquida_patrim = Dív. Líquida / Patrim. Líq
                if data.get("_div_liquida") and data.get("patrim_liquido"):
                    data["div_liquida_patrim"] = data["_div_liquida"] / data["patrim_liquido"]

                # div_liquida_ebit = Dív. Líquida / EBIT (12 meses)
                if data.get("_div_liquida") and data.get("ebit") and data["ebit"] != 0:
                    data["div_liquida_ebit"] = round(data["_div_liquida"] / data["ebit"], 2)

                # ROA = Lucro Líquido / Ativo Total * 100
                if data.get("roa") is None and data.get("lucro_liquido") and data.get("_ativo_total"):
                    if data["_ativo_total"] != 0:
                        data["roa"] = round((data["lucro_liquido"] / data["_ativo_total"]) * 100, 2)

                # Payout = DY * P/L (derived: DY=DPA/Price, P/L=Price/LPA, so DY*P/L=DPA/LPA=Payout)
                if data.get("payout") is None and data.get("dy") and data.get("p_l"):
                    calculated_payout = data["dy"] * data["p_l"]
                    # Sanity check: payout should be between 0 and 200%
                    if 0 <= calculated_payout <= 200:
                        data["payout"] = round(calculated_payout, 2)
                        logger.debug(f"Calculated payout: {data['payout']}% (DY={data['dy']} * P/L={data['p_l']})")

            except Exception as e:
                logger.debug(f"Error calculating derived fields: {e}")

            # Remove temporary fields
            data.pop("_div_bruta", None)
            data.pop("_div_liquida", None)
            data.pop("_ativo_total", None)
            data.pop("_ebit_ativo", None)

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
        Handles billions/millions/thousands notation (B, BI, M, MI, K, T)
        Returns None for non-numeric values

        Examples:
        - "1.234.567,89" → 1234567.89
        - "1,5 Bi" → 1500000000
        - "500 Mi" → 500000000
        - "10,5 K" → 10500
        - "15,75%" → 15.75
        - "R$ 123,45" → 123.45
        """
        if not value_text or value_text == "-":
            return None

        try:
            # Normalize: lowercase and strip whitespace
            text = value_text.lower().strip()

            # Remove common prefixes
            text = text.replace("r$", "").strip()

            # Check for percentage (preserve info but remove symbol)
            text = text.replace("%", "").strip()

            # Detect and handle magnitude suffixes BEFORE removing letters
            multiplier = 1

            # Quadrillion (Q, QI) - 10^15 (Quadrilhão brasileiro)
            if " qi" in text or text.endswith("qi") or " q" in text or text.endswith("q"):
                multiplier = 1_000_000_000_000_000  # 10^15
                text = re.sub(r'\s*qi?\s*$', '', text, flags=re.IGNORECASE)
            # Trillion (T)
            elif " t" in text or text.endswith("t"):
                multiplier = 1_000_000_000_000
                text = re.sub(r'\s*t\s*$', '', text)
            # Billion (B, BI, Bi)
            elif " bi" in text or text.endswith("bi") or " b" in text or text.endswith("b"):
                multiplier = 1_000_000_000
                # Remove bi/b suffix with optional preceding space
                text = re.sub(r'\s*bi?\s*$', '', text)
            # Million (M, MI, Mi)
            elif " mi" in text or text.endswith("mi") or " m" in text or text.endswith("m"):
                multiplier = 1_000_000
                text = re.sub(r'\s*mi?\s*$', '', text)
            # Thousand (K)
            elif " k" in text or text.endswith("k"):
                multiplier = 1_000
                text = re.sub(r'\s*k\s*$', '', text)

            # After handling suffixes, reject if there are still letters
            # (except for edge cases like company names that slipped through)
            if any(c.isalpha() for c in text):
                return None

            # Replace Brazilian decimal separator
            # Thousands: 1.234.567 → 1234567
            # Decimal: 123,45 → 123.45
            text = text.replace(".", "").replace(",", ".")

            # Handle negative values
            text = text.replace("−", "-").replace("–", "-")  # Unicode minus signs

            # Parse number and apply multiplier
            parsed = float(text) * multiplier

            return parsed

        except Exception as e:
            logger.debug(f"Could not parse value '{value_text}': {e}")
            return None

    def _map_field(self, data: dict, label: str, value: str):
        """Map Fundamentus field labels to data dictionary keys"""

        # Normalize label
        label = label.lower().strip().replace("?", "")

        # Mapping dictionary
        field_map = {
            # Basic info
            "empresa": "company_name",

            # Pricing
            "cotação": "price",

            # Valuation ratios
            "p/l": "p_l",
            "p/vp": "p_vp",
            "psr": "psr",
            "p/ativos": "p_ativos",
            "p/cap. giro": "p_cap_giro",
            "p/cap.giro": "p_cap_giro",
            "p/ebit": "p_ebit",
            "p/ativ circ liq": "p_ativ_circ_liq",
            "p/ativ circ.liq": "p_ativ_circ_liq",

            # EV multiples
            "ev/ebit": "ev_ebit",
            "ev / ebit": "ev_ebit",
            "ev/ebitda": "ev_ebitda",
            "ev / ebitda": "ev_ebitda",

            # Margins
            "mrg ebit": "margem_ebit",
            "marg. ebit": "margem_ebit",
            "mrg. líq.": "margem_liquida",
            "marg. líquida": "margem_liquida",
            "marg. bruta": "margem_bruta",

            # Liquidity
            "liq. corr.": "liquidez_corrente",
            "liquidez corr": "liquidez_corrente",
            "liquidez corrente": "liquidez_corrente",
            "liq.2meses": "liquidez_2meses",
            "liquidez 2 meses": "liquidez_2meses",
            "vol $ méd (2m)": "liquidez_2meses",

            # Debt
            "dív.brut/patrim.": "div_bruta_patrim",
            "div. bruta/patrim.": "div_bruta_patrim",
            "div br/ patrim": "div_bruta_patrim",
            "dív.líq./patrim.": "div_liquida_patrim",
            "div. líquida/patrim.": "div_liquida_patrim",
            "dív.líq./ebit": "div_liquida_ebit",
            "div. líquida/ebit": "div_liquida_ebit",

            # Balance sheet
            "patrim. líq": "patrim_liquido",
            "patrimônio líquido": "patrim_liquido",
            "receita líquida": "receita_liquida",
            "ebit": "ebit",
            "lucro líquido": "lucro_liquido",
            "ativo": "_ativo_total",
            "valor de mercado": "market_cap",

            # Per share values
            "lpa": "lpa",
            "vpa": "vpa",

            # Growth & Returns
            "cresc. rec.5a": "crescimento_receita_5a",
            "cresc. rec (5a)": "crescimento_receita_5a",
            "cres. rec (5a)": "crescimento_receita_5a",
            "crescimento receita 5a": "crescimento_receita_5a",
            "roe": "roe",
            "roic": "roic",
            "roa": "roa",
            "ebit / ativo": "_ebit_ativo",
            "giro ativos": "giro_ativos",

            # Dividends
            "div. yield": "dy",
            "dividend yield": "dy",
            "payout": "payout",

            # Shares
            "nro. ações": "nro_acoes",
            "número de ações": "nro_acoes",

            # Temporary fields for calculations (not exposed in final data)
            "dív. bruta": "_div_bruta",
            "dív. líquida": "_div_liquida",
        }

        # Find matching field
        # Use exact match (==) instead of substring (in) to avoid false matches
        # Example: "ev / ebit" in "ev / ebitda" would incorrectly return True
        for key, field in field_map.items():
            if label == key:
                # For company_name, keep as string. For all others, parse as number
                if field == "company_name":
                    data[field] = value
                else:
                    data[field] = self._parse_value(value)
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
