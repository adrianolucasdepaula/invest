"""
StatusInvest Dividends Scraper - Historical dividends and proventos
Fonte: https://statusinvest.com.br/acoes/{TICKER}
Requer login: NÃO (dados públicos)

FASE 101.2 - Wheel Turbinada: Dividendos
CREATED 2025-12-21 - Playwright + BeautifulSoup pattern

Dados extraídos:
- Tipo de provento (Dividendo, JCP, Bonificação, etc)
- Valor bruto por ação
- Data EX
- Data de Pagamento
- Status (anunciado/pago)
"""
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
import pytz
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class StatusInvestDividendsScraper(BaseScraper):
    """
    Scraper for StatusInvest dividend history

    OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing (~10x faster)

    Dados extraídos:
    - tipo: dividendo, jcp, bonus, rendimento, fracao, subscricao
    - valor_bruto: valor por ação antes de impostos
    - valor_liquido: valor após impostos (calculado)
    - imposto_retido: IR retido (15% para JCP, 0% para dividendos)
    - data_ex: primeira data sem direito
    - data_com: última data com direito
    - data_pagamento: data efetiva de pagamento
    - status: anunciado, pago, projetado
    """

    BASE_URL = "https://statusinvest.com.br/acoes/"
    SOURCE_NAME = "STATUSINVEST_DIVIDENDS"

    # Mapeamento de tipos de proventos
    DIVIDEND_TYPE_MAP = {
        "dividendo": "dividendo",
        "dividendos": "dividendo",
        "jcp": "jcp",
        "jscp": "jcp",
        "juros": "jcp",
        "juros sobre capital": "jcp",
        "juros sobre capital próprio": "jcp",
        "bonificação": "bonus",
        "bonificacao": "bonus",
        "rendimento": "rendimento",
        "fracao": "fracao",
        "fração": "fracao",
        "subscricao": "subscricao",
        "subscrição": "subscricao",
        "direito de subscrição": "subscricao",
    }

    def __init__(self):
        super().__init__(
            name="StatusInvestDividends",
            source=self.SOURCE_NAME,
            requires_login=False,  # FASE 144 NOTE: Cloudflare may require cookies
        )
        # BUGFIX FASE 144: Force non-headless to bypass Cloudflare
        self._force_headed = True

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape dividend history from StatusInvest

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with dividend history
        """
        start_time = datetime.now(pytz.timezone('America/Sao_Paulo'))  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001

        try:
            # Ensure page is initialized (Playwright)
            if not self.page:
                await self.initialize()

            # BUGFIX FASE 144: Anti-Cloudflare detection
            # Set realistic headers and viewport
            await self.page.set_extra_http_headers({
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.google.com/',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'cross-site',
                'Upgrade-Insecure-Requests': '1',
            })

            await self.page.set_viewport_size({"width": 1920, "height": 1080})

            # Build URL
            url = f"{self.BASE_URL}{ticker.lower()}"
            logger.info(f"[{self.name}] Navigating to {url}")

            # Navigate (Playwright) - wait for networkidle to ensure full load
            await self.page.goto(url, wait_until="networkidle", timeout=90000)

            # BUGFIX FASE 144: Wait for potential Cloudflare challenge (10s)
            # Cloudflare typically shows challenge for 5-8 seconds
            logger.info(f"[{self.name}] Waiting for potential Cloudflare challenge...")
            await asyncio.sleep(10)

            # Check if still on challenge page
            current_url = self.page.url
            if "challenge" in current_url.lower() or current_url != url:
                logger.warning(f"[{self.name}] Still on challenge page, waiting additional 10s...")
                await asyncio.sleep(10)

            # Check if ticker exists or Cloudflare blocked
            page_source = await self.page.content()

            # BUGFIX FASE 144: Detectar bloqueio Cloudflare
            if "cloudflare" in page_source.lower() and "blocked" in page_source.lower():
                logger.error(f"[{self.name}] Cloudflare blocked access to {ticker}")
                return ScraperResult(
                    success=False,
                    error=f"Cloudflare blocked access (anti-bot detected). Try with authenticated cookies.",
                    source=self.source,
                )

            if "não encontrado" in page_source.lower() or "erro 404" in page_source.lower():
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found",
                    source=self.source,
                )

            # DEBUG FASE 144: Salvar HTML para análise offline
            try:
                debug_file = f"statusinvest_{ticker.lower()}_debug.html"
                with open(debug_file, "w", encoding="utf-8") as f:
                    f.write(page_source)
                logger.info(f"[{self.name}] HTML salvo em: {debug_file} ({len(page_source):,} bytes)")
            except Exception as e:
                logger.warning(f"[{self.name}] Failed to save debug HTML: {e}")

            # Scroll to load dividend section (may be lazy-loaded)
            await self._scroll_to_dividends()

            # Single HTML fetch + BeautifulSoup local parsing
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Extract dividends
            dividends = self._extract_dividends(soup, ticker)

            elapsed = (datetime.now(pytz.timezone('America/Sao_Paulo')) - start_time).total_seconds()  # FASE 7.3
            logger.info(f"[{self.name}] {ticker}: {len(dividends)} dividends in {elapsed:.2f}s")

            return ScraperResult(
                success=True,
                data={
                    "ticker": ticker.upper(),
                    "dividends": dividends,
                    "count": len(dividends),
                },
                source=self.source,
                response_time=elapsed,
                metadata={
                    "url": url,
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

    async def _scroll_to_dividends(self):
        """Scroll page to load dividend section (may be lazy-loaded)"""
        try:
            # Try to scroll to dividend/provento section
            await self.page.evaluate("""
                // Try to find and scroll to dividend section
                const sections = document.querySelectorAll('[id*="provento"], [id*="dividend"], [class*="provento"], [class*="dividend"]');
                if (sections.length > 0) {
                    sections[0].scrollIntoView({ behavior: 'instant', block: 'center' });
                } else {
                    // Scroll down to middle of page
                    window.scrollTo(0, document.body.scrollHeight / 2);
                }
            """)
            await asyncio.sleep(1)  # Wait for lazy-load
        except Exception as e:
            logger.debug(f"Scroll failed (non-critical): {e}")

    def _extract_dividends(self, soup: BeautifulSoup, ticker: str) -> List[Dict[str, Any]]:
        """
        Extract all dividends from page using BeautifulSoup (local parsing)

        StatusInvest structure:
        - Dividend table in section with id containing 'provento'
        - Each row has: tipo, valor, data_ex, data_pagamento
        """
        dividends = []

        try:
            # Strategy 1: Look for table with dividend data
            # StatusInvest uses different table structures, try multiple selectors
            table_selectors = [
                "table.proventos",
                "table[class*='provento']",
                "table[class*='dividend']",
                "div[id*='provento'] table",
                "div[class*='provento'] table",
                "#proventos table",
                "#dividends table",
                "section[id*='provento'] table",
            ]

            table = None
            for selector in table_selectors:
                table = soup.select_one(selector)
                if table:
                    logger.debug(f"Found dividend table with selector: {selector}")
                    break

            if table:
                logger.info(f"[{ticker}] Usando Strategy 1: _extract_from_table")
                dividends.extend(self._extract_from_table(table, ticker))
            else:
                logger.warning(f"[{ticker}] Nenhuma tabela encontrada! Tentando estratégias alternativas...")

            # Strategy 2: Look for dividend cards/rows (alternative structure)
            if not dividends:
                logger.info(f"[{ticker}] Usando Strategy 2: _extract_from_card")
                card_selectors = [
                    "div[class*='provento'] .card",
                    "div[class*='dividend'] .row",
                    ".dividend-item",
                    ".provento-item",
                ]

                for selector in card_selectors:
                    cards = soup.select(selector)
                    if cards:
                        for card in cards:
                            dividend = self._extract_from_card(card, ticker)
                            if dividend:
                                dividends.append(dividend)

            # Strategy 3: Look for data in structured divs (grid layout)
            if not dividends:
                logger.info(f"[{ticker}] Usando Strategy 3: _extract_from_grid")
                dividends.extend(self._extract_from_grid(soup, ticker))

            # Deduplicate by (data_ex, tipo)
            seen = set()
            unique_dividends = []
            for d in dividends:
                key = (d.get('data_ex'), d.get('tipo'))
                if key not in seen and d.get('data_ex'):
                    seen.add(key)
                    unique_dividends.append(d)

            return unique_dividends

        except Exception as e:
            logger.error(f"Error extracting dividends: {e}")
            return []

    def _extract_from_table(self, table, ticker: str) -> List[Dict[str, Any]]:
        """Extract dividends from table rows"""
        dividends = []

        try:
            rows = table.select("tbody tr")

            for row in rows:
                cells = row.select("td")
                if len(cells) < 3:
                    continue

                try:
                    # StatusInvest table columns (may vary):
                    # [0] Tipo | [1] Data Com | [2] Valor | [3] Data Pagamento | ...
                    # or
                    # [0] Tipo | [1] Data Ex | [2] Valor | ...

                    dividend = {
                        "ticker": ticker.upper(),
                        "tipo": "dividendo",  # default
                        "valor_bruto": None,
                        "valor_liquido": None,
                        "imposto_retido": 0,
                        "data_ex": None,
                        "data_com": None,
                        "data_pagamento": None,
                        "status": "pago",  # assume paid if in history
                    }

                    # BUGFIX FASE 144: Coletar TODOS os valores primeiro, depois validar
                    # Problema anterior: pegava primeiro valor encontrado (podia ser yield% ou total)
                    found_values = []  # Lista de (index, value) para debug
                    all_cells_text = []  # DEBUG: Armazenar texto de todas as células

                    # Parse cells based on content
                    for i, cell in enumerate(cells):
                        text = cell.get_text().strip()
                        all_cells_text.append(f"[{i}]='{text}'")  # DEBUG

                        # Detect type
                        text_lower = text.lower()
                        if text_lower in self.DIVIDEND_TYPE_MAP:
                            dividend["tipo"] = self.DIVIDEND_TYPE_MAP[text_lower]
                            continue

                        # Detect date (DD/MM/YYYY format)
                        parsed_date = self._parse_date(text)
                        if parsed_date:
                            # First date is usually data_com or data_ex
                            if not dividend["data_ex"]:
                                dividend["data_ex"] = parsed_date
                            elif not dividend["data_pagamento"]:
                                dividend["data_pagamento"] = parsed_date
                            continue

                        # Detect value (R$ X,XX format) - COLETAR TODOS
                        parsed_value = self._parse_value(text)
                        if parsed_value is not None and parsed_value > 0:
                            found_values.append((i, parsed_value))

                    # DEBUG: Logar TODAS as células da linha
                    logger.debug(f"{ticker} ROW DEBUG: {' | '.join(all_cells_text)}")

                    # BUGFIX: Selecionar valor correto (valor POR AÇÃO, não total/yield)
                    # Heurística: Para ações brasileiras, dividendos unitários raramente > R$ 2.00
                    # Se encontrou múltiplos valores, pegar o MENOR razoável (ignora yields altos)
                    if found_values:
                        # Filtrar valores < R$ 10.00 (threshold razoável para dividendo unitário)
                        reasonable_values = [(i, v) for i, v in found_values if v < 10.0]

                        if reasonable_values:
                            # Pegar o primeiro valor razoável (geralmente é "valor por ação")
                            chosen_index, chosen_value = reasonable_values[0]
                            dividend["valor_bruto"] = chosen_value

                            # Debug log para investigação
                            if len(found_values) > 1:
                                logger.debug(
                                    f"{ticker} linha com múltiplos valores: {found_values}, "
                                    f"escolhido: R$ {chosen_value:.4f} (coluna {chosen_index})"
                                )
                        else:
                            # Todos os valores > R$ 10 (suspeito), logar aviso
                            logger.warning(
                                f"{ticker} valores suspeitos (todos > R$ 10): {found_values}"
                            )
                            # Usar o menor mesmo assim
                            chosen_index, chosen_value = min(found_values, key=lambda x: x[1])
                            dividend["valor_bruto"] = chosen_value

                    # Calculate valor_liquido based on tipo
                    if dividend["valor_bruto"]:
                        dividend["valor_liquido"], dividend["imposto_retido"] = (
                            self._calculate_net_value(dividend["valor_bruto"], dividend["tipo"])
                        )

                    # Only add if has data_ex and valor_bruto
                    if dividend["data_ex"] and dividend["valor_bruto"]:
                        dividends.append(dividend)

                except Exception as e:
                    logger.debug(f"Error parsing row: {e}")
                    continue

        except Exception as e:
            logger.debug(f"Error extracting from table: {e}")

        return dividends

    def _extract_from_card(self, card, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract dividend from card/row element"""
        try:
            dividend = {
                "ticker": ticker.upper(),
                "tipo": "dividendo",
                "valor_bruto": None,
                "valor_liquido": None,
                "imposto_retido": 0,
                "data_ex": None,
                "data_com": None,
                "data_pagamento": None,
                "status": "pago",
            }

            text = card.get_text()

            # Extract type
            for key, tipo in self.DIVIDEND_TYPE_MAP.items():
                if key in text.lower():
                    dividend["tipo"] = tipo
                    break

            # Extract dates
            dates = self._extract_dates(text)
            if len(dates) > 0:
                dividend["data_ex"] = dates[0]
            if len(dates) > 1:
                dividend["data_pagamento"] = dates[1]

            # Extract value
            value = self._extract_value(text)
            if value:
                dividend["valor_bruto"] = value
                dividend["valor_liquido"], dividend["imposto_retido"] = (
                    self._calculate_net_value(value, dividend["tipo"])
                )

            if dividend["data_ex"] and dividend["valor_bruto"]:
                return dividend

        except Exception as e:
            logger.debug(f"Error extracting from card: {e}")

        return None

    def _extract_from_grid(self, soup: BeautifulSoup, ticker: str) -> List[Dict[str, Any]]:
        """Extract dividends from grid layout (alternative to table)"""
        dividends = []

        try:
            # Look for repeated structures with dividend data
            # StatusInvest sometimes uses divs with class patterns

            # Find all elements containing 'R$' (likely dividend values)
            value_elements = soup.find_all(string=lambda t: t and 'R$' in t)
            logger.debug(f"{ticker} _extract_from_grid: Found {len(value_elements)} elements with R$")

            for idx, elem in enumerate(value_elements):
                parent = elem.parent
                if not parent:
                    continue

                # BUGFIX FASE 144: Subir mais na árvore para capturar contexto completo
                # parent.parent.parent geralmente contém a linha completa com tipo + valor + datas
                container = parent.parent.parent or parent.parent or parent
                container_text = container.get_text(separator=" ", strip=True)

                # DEBUG: Logar primeiros 5 containers
                if idx < 5:
                    logger.debug(f"{ticker} Container {idx} (len={len(container_text)}): {container_text[:200]}...")

                # Skip se container vazio ou muito pequeno
                if not container_text or len(container_text) < 5:
                    continue

                # Check if container has dividend-like data
                if self._looks_like_dividend(container_text):
                    logger.debug(f"{ticker} Container aceito como dividendo: {container_text[:200]}...")
                    dividend = self._parse_dividend_text(container_text, ticker)
                    if dividend:
                        logger.info(f"{ticker} Dividend extracted: valor_bruto=R$ {dividend['valor_bruto']:.4f}, data_ex={dividend['data_ex']}, from text: {container_text[:150]}...")
                        dividends.append(dividend)

        except Exception as e:
            logger.debug(f"Error extracting from grid: {e}")

        return dividends

    def _looks_like_dividend(self, text: str) -> bool:
        """Check if text looks like dividend data"""
        has_value = 'R$' in text or any(c.isdigit() for c in text)
        has_date = '/' in text
        return has_value and has_date

    def _parse_dividend_text(self, text: str, ticker: str) -> Optional[Dict[str, Any]]:
        """Parse dividend from text block"""
        try:
            dividend = {
                "ticker": ticker.upper(),
                "tipo": "dividendo",
                "valor_bruto": None,
                "valor_liquido": None,
                "imposto_retido": 0,
                "data_ex": None,
                "data_com": None,
                "data_pagamento": None,
                "status": "pago",
            }

            # Type
            for key, tipo in self.DIVIDEND_TYPE_MAP.items():
                if key in text.lower():
                    dividend["tipo"] = tipo
                    break

            # Dates
            dates = self._extract_dates(text)
            if dates:
                dividend["data_ex"] = dates[0]
                if len(dates) > 1:
                    dividend["data_pagamento"] = dates[1]

            # Value - with validation logging
            value = self._extract_value(text)
            if value:
                # BUGFIX FASE 145: Log warning for suspicious values
                if value >= 10.0:
                    logger.warning(
                        f"{ticker} valor suspeito >= R$ 10.00: R$ {value:.2f} - "
                        f"pode ser percentual ou total, não valor unitário"
                    )
                dividend["valor_bruto"] = value
                dividend["valor_liquido"], dividend["imposto_retido"] = (
                    self._calculate_net_value(value, dividend["tipo"])
                )

            if dividend["data_ex"] and dividend["valor_bruto"]:
                return dividend

        except Exception:
            pass

        return None

    def _parse_date(self, text: str) -> Optional[str]:
        """
        Parse date from Brazilian format (DD/MM/YYYY) to ISO (YYYY-MM-DD)
        """
        if not text or text == "-":
            return None

        text = text.strip()

        try:
            # Try DD/MM/YYYY format
            if "/" in text:
                parts = text.split("/")
                if len(parts) == 3:
                    day, month, year = parts
                    if len(year) == 2:
                        year = f"20{year}"
                    dt = datetime(int(year), int(month), int(day))
                    return dt.strftime("%Y-%m-%d")
        except (ValueError, IndexError):
            pass

        return None

    def _extract_dates(self, text: str) -> List[str]:
        """Extract all dates from text"""
        import re

        dates = []
        # Pattern: DD/MM/YYYY or DD/MM/YY
        pattern = r'\b(\d{1,2}/\d{1,2}/\d{2,4})\b'
        matches = re.findall(pattern, text)

        for match in matches:
            parsed = self._parse_date(match)
            if parsed:
                dates.append(parsed)

        return dates

    def _parse_value(self, text: str) -> Optional[float]:
        """
        Parse numeric value from text
        Handles Brazilian number format (comma as decimal separator)
        """
        if not text or text == "-" or text.lower() == "n/a":
            return None

        try:
            # Remove R$ prefix
            text = text.replace("R$", "").strip()
            # Remove % suffix
            text = text.replace("%", "").strip()
            # Replace Brazilian format
            text = text.replace(".", "").replace(",", ".").strip()

            value = float(text)
            return value if value > 0 else None

        except (ValueError, AttributeError):
            return None

    def _extract_value(self, text: str) -> Optional[float]:
        """
        Extract monetary value from text with validation

        BUGFIX FASE 145: Apply R$ 10.00 threshold filter to avoid capturing
        percentage values (11.11% → 1111.00) or yield totals instead of
        per-share dividend values.

        Brazilian stock dividends are typically R$ 0.10 - R$ 5.00 per share.
        Values > R$ 10.00 are likely parsing errors (capturing yields/totals).
        """
        import re

        # Pattern: R$ X,XX or X,XX
        pattern = r'R?\$?\s*(\d+[.,]?\d*)'
        matches = re.findall(pattern, text.replace(" ", ""))

        if not matches:
            return None

        # Parse all found values
        valid_values = []
        for match in matches:
            value = self._parse_value(match)
            if value is not None and value > 0:
                valid_values.append(value)

        if not valid_values:
            return None

        # BUGFIX FASE 145: Filter for reasonable dividend values (< R$ 10.00)
        # Same logic as _extract_from_table for consistency
        reasonable_values = [v for v in valid_values if v < 10.0]

        if reasonable_values:
            # Return smallest reasonable value (most likely to be per-share dividend)
            return min(reasonable_values)
        else:
            # All values > R$ 10 - suspicious, but return smallest as fallback
            # This will be logged by caller for investigation
            return min(valid_values)

    def _calculate_net_value(self, gross: float, dividend_type: str) -> tuple:
        """
        Calculate net value after taxes

        - JCP: 15% IR retido na fonte
        - Dividendo: Isento para PF
        - Outros: Isento (simplificado)

        Returns:
            tuple: (valor_liquido, imposto_retido)
        """
        if dividend_type == "jcp":
            tax = round(gross * 0.15, 8)
            net = round(gross * 0.85, 8)
            return (net, tax)

        # Dividendos e outros são isentos
        return (gross, 0)


# Test function
async def test_statusinvest_dividends():
    """Test StatusInvest Dividends scraper"""
    scraper = StatusInvestDividendsScraper()

    try:
        # Test with PETR4 (has rich dividend history)
        result = await scraper.scrape_with_retry("PETR4")

        if result.success:
            print("✅ Success!")
            print(f"Found {result.data['count']} dividends")
            if result.data['dividends']:
                print("\nSample dividends:")
                for div in result.data['dividends'][:5]:
                    print(f"  - {div['data_ex']}: {div['tipo']} R$ {div['valor_bruto']}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_statusinvest_dividends())
