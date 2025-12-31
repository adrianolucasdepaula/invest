# MIGRATED TO PLAYWRIGHT - 2025-12-04
# FIXED COLUMN-INDEX MAPPING - 2025-12-13
"""
Opcoes.net.br Scraper - Análise de opções
Fonte: https://opcoes.net.br/
Requer login com credenciais específicas

OPTIMIZED: Uses Playwright for browser automation + BeautifulSoup for parsing

2025-12-13 FIX (WHEEL Strategy Support):
- FIXED: _parse_options_table() now uses COLUMN-INDEX MAPPING instead of sequential parsing
- ADDED: Greeks extraction (Delta, Gamma, Theta, Vega) from columns 13-17
- ADDED: Individual IV extraction from column 12
- ADDED: Volume extraction from column 10
- ADDED: Open Interest calculation from columns 19-21 (Coberto + Travado + Descob)
- ADDED: Expiration date extraction from checkboxes
- IMPROVED: IV Rank extraction from page header (general, CALLs, PUTs)
- IMPROVED: Historical Volatility and Percentile extraction

Column Structure (validated via Playwright 2025-12-13):
  0: Ticker, 1: Tipo, 2: F.M., 3: Mod., 4: Strike, 5: A/I/OTM, 6: Dist.%,
  7: Último, 8: Var.%, 9: Data/Hora, 10: Núm.Neg., 11: Vol.Fin, 12: Vol.Impl%,
  13: Delta, 14: Gamma, 15: Theta$, 16: Theta%, 17: Vega, 18: IQ,
  19: Coberto, 20: Travado, 21: Descob., 22: Tit., 23: Lanç.

This scraper is now aligned with the TypeScript version (opcoes.scraper.ts) for consistency.
"""
import asyncio
import json
from datetime import datetime
import pytz
from pathlib import Path
from typing import Dict, Any, Optional, List
from loguru import logger
from bs4 import BeautifulSoup
import re

from base_scraper import BaseScraper, ScraperResult
from config import settings


class OpcoesNetScraper(BaseScraper):
    """
    Scraper para análise de opções do Opcoes.net.br

    MIGRATED TO PLAYWRIGHT - Uses Playwright for browser automation
    FIXED 2025-12-13 - Column-index mapping for Greeks extraction

    REQUER LOGIN com credenciais específicas

    Dados extraídos (2025-12-13 COMPLETE):
    - Preços de opções (strike, last, bid, ask)
    - Volatilidade implícita individual (column 12)
    - IV Rank (general, CALLs, PUTs) - from page header
    - IV Percentile - from page header
    - Historical Volatility - from page header
    - Vencimentos (expiration dates)
    - Greeks COMPLETOS:
      * Delta (column 13) - CRÍTICO para WHEEL (delta 15)
      * Gamma (column 14)
      * Theta (column 15) - em R$
      * Vega (column 17)
    - Volume (column 10)
    - Open Interest (calculated from columns 19-21)
    - Moneyness (ATM/ITM/OTM)
    """

    BASE_URL = "https://opcoes.net.br"
    LOGIN_URL = "https://opcoes.net.br/login"
    COOKIES_FILE = Path("/app/data/cookies/opcoes_session.json")

    def __init__(self):
        super().__init__(
            name="OpcoesNet",
            source="OPCOES_NET",
            requires_login=True,  # REQUER LOGIN!
        )

    async def initialize(self):
        """Initialize Playwright browser and perform login"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            logger.info(f"Logging into {self.name}...")

            # Navigate to login page
            await self.page.goto(self.LOGIN_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Load cookies if available
            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        cookies = json.load(f)

                    opcoes_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict) and 'opcoes.net.br' in cookie.get('domain', ''):
                            pw_cookie = {
                                'name': cookie.get('name'),
                                'value': cookie.get('value'),
                                'domain': cookie.get('domain'),
                                'path': cookie.get('path', '/'),
                            }
                            if 'expires' in cookie and cookie['expires']:
                                pw_cookie['expires'] = cookie['expires']
                            if 'httpOnly' in cookie:
                                pw_cookie['httpOnly'] = cookie['httpOnly']
                            if 'secure' in cookie:
                                pw_cookie['secure'] = cookie['secure']

                            opcoes_cookies.append(pw_cookie)

                    if opcoes_cookies:
                        await self.page.context.add_cookies(opcoes_cookies)
                        logger.info(f"Loaded {len(opcoes_cookies)} cookies for OpcoesNet")
                        await self.page.reload()
                        await asyncio.sleep(3)

                        # Check if already logged in
                        if await self._verify_logged_in():
                            logger.success(f"{self.name} logged in via cookies")
                            self._initialized = True
                            return

                except Exception as e:
                    logger.warning(f"Could not load OpcoesNet cookies: {e}")

            # Get credentials from settings
            username = getattr(settings, 'OPCOES_USERNAME', None)
            password = getattr(settings, 'OPCOES_PASSWORD', None)

            if not username or not password:
                logger.warning(
                    "Opcoes.net.br credentials not configured. "
                    "Please set OPCOES_USERNAME and OPCOES_PASSWORD in .env"
                )
                self._initialized = True  # Initialize anyway, will fail on scrape
                return

            # Perform login
            await self._perform_login(username, password)

            # Verify login successful
            await asyncio.sleep(3)

            if not await self._verify_logged_in():
                logger.warning("Login failed - please check credentials or manual login required")

            self._initialized = True

        except Exception as e:
            logger.error(f"Failed to initialize {self.name}: {e}")
            raise

    async def _perform_login(self, username: str, password: str):
        """Perform login using Playwright"""
        try:
            # Try multiple selectors for username/CPF field
            username_selectors = [
                "input[name='username']",
                "input[name='cpf']",
                "input[name='email']",
                "input[type='text']",
                "#username",
                "#cpf",
            ]

            username_filled = False
            for selector in username_selectors:
                try:
                    username_field = await self.page.query_selector(selector)
                    if username_field and await username_field.is_visible():
                        await username_field.fill(username)
                        username_filled = True
                        logger.debug(f"Username filled with selector: {selector}")
                        break
                except:
                    continue

            if not username_filled:
                logger.warning("Could not find username/CPF field")
                return

            # Password field
            password_selectors = [
                "input[name='password']",
                "input[name='senha']",
                "input[type='password']",
                "#password",
                "#senha",
            ]

            password_filled = False
            for selector in password_selectors:
                try:
                    password_field = await self.page.query_selector(selector)
                    if password_field and await password_field.is_visible():
                        await password_field.fill(password)
                        password_filled = True
                        logger.debug(f"Password filled with selector: {selector}")
                        break
                except:
                    continue

            if not password_filled:
                logger.warning("Could not find password field")
                return

            # Submit form
            submit_selectors = [
                "button[type='submit']",
                "input[type='submit']",
                "button.btn-login",
                "button.login-button",
                ".btn-primary",
            ]

            submitted = False
            for selector in submit_selectors:
                try:
                    submit_button = await self.page.query_selector(selector)
                    if submit_button and await submit_button.is_visible():
                        await submit_button.click()
                        submitted = True
                        logger.debug(f"Form submitted with selector: {selector}")
                        break
                except:
                    continue

            if not submitted:
                # Try pressing Enter as fallback
                await self.page.keyboard.press("Enter")
                logger.debug("Form submitted via Enter key")

        except Exception as e:
            logger.error(f"Error performing login: {e}")

    async def _verify_logged_in(self) -> bool:
        """Verify that user is logged in"""
        try:
            html_content = await self.page.content()

            # Check for logout/sair indicators
            logout_keywords = ["sair", "logout", "minha conta", "meu perfil"]
            for keyword in logout_keywords:
                if keyword in html_content.lower():
                    logger.debug(f"Found logged-in indicator: {keyword}")
                    return True

            # Check if still on login page (indicates failure)
            current_url = self.page.url
            if "login" in current_url.lower():
                return False

            # Check for error messages
            error_keywords = ["inválid", "incorret", "erro", "falha"]
            for keyword in error_keywords:
                if keyword in html_content.lower():
                    logger.warning(f"Found error indicator: {keyword}")
                    return False

            return "login" not in current_url.lower()

        except Exception as e:
            logger.debug(f"Login verification error: {e}")
            return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape options data

        Args:
            ticker: Stock ticker without number (e.g., 'PETR' for PETR4)

        Returns:
            ScraperResult with options data
        """
        try:
            if not self.page:
                await self.initialize()

            # Navigate to ticker options page
            ticker_clean = re.sub(r'\d+$', '', ticker.upper())  # Remove trailing numbers
            url = f"{self.BASE_URL}/opcoes/{ticker_clean}"

            logger.info(f"Navigating to {url}")
            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # OPTIMIZATION: Get HTML once and parse locally
            html_content = await self.page.content()

            # Check if ticker exists
            if "não encontrado" in html_content.lower():
                return ScraperResult(
                    success=False,
                    error=f"Options for {ticker} not found",
                    source=self.source,
                )

            # Extract data using BeautifulSoup
            data = self._extract_data(html_content, ticker_clean)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "url": url,
                        "requires_login": True,
                    },
                )

            return ScraperResult(
                success=False,
                error="Failed to extract options data",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    def _extract_data(self, html_content: str, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Extract options data from page

        OPTIMIZED: Uses BeautifulSoup for local parsing
        2025-12-13 IMPROVED: Better IV Rank extraction from header, expiration date detection
        """
        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            data = {
                "ticker": ticker.upper(),
                "underlying_price": None,
                "historical_volatility": None,
                "iv_rank": None,  # Implied Volatility Rank (general)
                "iv_percentile": None,
                "iv_rank_calls": None,
                "iv_percentile_calls": None,
                "iv_rank_puts": None,
                "iv_percentile_puts": None,
                "selected_expiration": None,
                "options_chain": [],
                "scraped_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
            }

            # Extract underlying price
            data["underlying_price"] = self._extract_underlying_price(soup)

            # Extract IV Rank and volatility data from page header
            # Pattern: "IV Rank: 26,3%" or "Percentil: 59,0%"
            page_text = soup.get_text()

            # Historical Volatility
            hv_match = re.search(r'Volatilidade\s+Hist[óo]rica[:\s]+(\d+[,.]?\d*)', page_text, re.IGNORECASE)
            if hv_match:
                data["historical_volatility"] = self._parse_number(hv_match.group(1))

            # General IV Rank (from header)
            iv_rank_match = re.search(r'IV\s*Rank[:\s]+(\d+[,.]?\d*)\s*%?', page_text, re.IGNORECASE)
            if iv_rank_match:
                data["iv_rank"] = self._parse_number(iv_rank_match.group(1))

            # General Percentile
            percentile_match = re.search(r'Percentil[:\s]+(\d+[,.]?\d*)\s*%?', page_text, re.IGNORECASE)
            if percentile_match:
                data["iv_percentile"] = self._parse_number(percentile_match.group(1))

            # IV Rank for CALLs
            iv_calls_match = re.search(r'Vol\.\s*Impl[íi]cita\s+CALLs?[:\s]+[\d,.]+'
                                       r'.*?IV\s*Rank[:\s]+(\d+[,.]?\d*)', page_text, re.IGNORECASE)
            if iv_calls_match:
                data["iv_rank_calls"] = self._parse_number(iv_calls_match.group(1))

            # IV Rank for PUTs
            iv_puts_match = re.search(r'Vol\.\s*Impl[íi]cita\s+PUTs?[:\s]+[\d,.]+'
                                      r'.*?IV\s*Rank[:\s]+(\d+[,.]?\d*)', page_text, re.IGNORECASE)
            if iv_puts_match:
                data["iv_rank_puts"] = self._parse_number(iv_puts_match.group(1))

            # Extract selected expiration date from checkboxes/radio buttons
            expiration_date = self._extract_selected_expiration(soup)
            data["selected_expiration"] = expiration_date

            # Options chain (calls and puts)
            tables = soup.select("table")

            for table in tables:
                headers = table.select("th")
                header_text = " ".join([h.get_text().lower() for h in headers])

                # Look for options tables
                if any(keyword in header_text for keyword in ["strike", "ticker", "delta", "theta", "vega"]):
                    options = self._parse_options_table(table, expiration_date)
                    data["options_chain"].extend(options)

            # Log extraction summary
            calls_count = len([o for o in data["options_chain"] if o.get("type") == "CALL"])
            puts_count = len([o for o in data["options_chain"] if o.get("type") == "PUT"])
            greeks_count = len([o for o in data["options_chain"] if o.get("delta") is not None])

            logger.info(
                f"Extracted opcoes.net data for {ticker}: "
                f"{len(data['options_chain'])} options ({calls_count} CALLs, {puts_count} PUTs), "
                f"{greeks_count} with Greeks, IV Rank={data['iv_rank']}%"
            )

            return data

        except Exception as e:
            logger.error(f"Error in _extract_data: {e}")
            return None

    def _extract_underlying_price(self, soup: BeautifulSoup) -> Optional[float]:
        """Extract underlying asset price from page"""
        # Try multiple selectors
        price_selectors = [
            ".underlying-price",
            ".stock-price",
            "[data-field='price']",
            ".cotacao",
            ".preco-ativo",
        ]

        for selector in price_selectors:
            price_elem = soup.select_one(selector)
            if price_elem:
                price_text = price_elem.get_text().strip()
                price_text = re.sub(r'[R$\s]', '', price_text).replace(",", ".")
                try:
                    return float(price_text)
                except ValueError:
                    continue

        # Try to find price in text pattern
        page_text = soup.get_text()
        price_match = re.search(r'R\$\s*(\d+[,.]?\d*)', page_text)
        if price_match:
            return self._parse_number(price_match.group(1))

        return None

    def _extract_selected_expiration(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract the currently selected expiration date from checkboxes/radios"""
        # Look for checked checkbox or selected radio
        checked_selectors = [
            "input[type='checkbox']:checked",
            "input[type='radio']:checked",
            ".expiration-selected",
            ".vencimento-selecionado",
        ]

        for selector in checked_selectors:
            checked = soup.select_one(selector)
            if checked:
                # Try to get associated label or value
                label = checked.find_parent("label")
                if label:
                    return label.get_text().strip()
                if checked.get("value"):
                    return checked.get("value")

        # Look for expiration in text (common format: DD/MM/YYYY)
        page_text = soup.get_text()
        exp_match = re.search(r'Vencimento[:\s]+(\d{2}/\d{2}/\d{4})', page_text, re.IGNORECASE)
        if exp_match:
            return exp_match.group(1)

        return None

    def _parse_options_table(self, table, expiration_date: str = None) -> List[Dict[str, Any]]:
        """
        Parse options chain table using COLUMN-INDEX MAPPING

        2025-12-13 FIXED: Using explicit column indices (aligned with TypeScript opcoes.scraper.ts)

        Column Structure from opcoes.net.br (validated via Playwright 2025-12-13):
        - 0: Ticker (e.g., PETRA326)
        - 1: Tipo (CALL/PUT)
        - 2: F.M. (Formador de Mercado)
        - 3: Mod. (Modalidade A/E)
        - 4: Strike
        - 5: A/I/OTM (ATM/ITM/OTM)
        - 6: Dist. (%) - Distance from spot
        - 7: Último (Last price)
        - 8: Var. (%) - Daily variation
        - 9: Data/Hora - Last trade timestamp
        - 10: Núm. de Neg. (Volume/Trades)
        - 11: Vol. Financeiro (Financial Volume)
        - 12: Vol. Impl. (%) - Implied Volatility
        - 13: Delta
        - 14: Gamma
        - 15: Theta ($)
        - 16: Theta (%)
        - 17: Vega
        - 18: IQ
        - 19: Coberto (Covered OI)
        - 20: Travado (Locked OI)
        - 21: Descob. (Uncovered OI)
        - 22: Tit. (Holders)
        - 23: Lanç. (Writers)
        """
        options = []

        try:
            rows = table.select("tr")

            for row in rows[1:]:  # Skip header row
                cells = row.select("td")

                # Valid option rows have at least 10 columns
                if len(cells) < 10:
                    continue

                try:
                    # Get cell texts
                    cell_texts = [cell.get_text().strip() for cell in cells]

                    # Column 0: Ticker/Symbol
                    ticker_text = cell_texts[0] if len(cell_texts) > 0 else ""

                    # Skip header rows or empty rows
                    if not ticker_text or 'Ticker' in ticker_text or len(ticker_text) < 4:
                        continue

                    # Column 1: Type (CALL/PUT)
                    tipo_text = cell_texts[1].upper() if len(cell_texts) > 1 else ""
                    if tipo_text == "CALL":
                        option_type = "CALL"
                    elif tipo_text == "PUT":
                        option_type = "PUT"
                    else:
                        # Try to determine from symbol (letters A-L = CALL, M-X = PUT)
                        if re.search(r'[A-L]\d+$', ticker_text):
                            option_type = "CALL"
                        elif re.search(r'[M-X]\d+$', ticker_text):
                            option_type = "PUT"
                        else:
                            continue  # Skip if can't determine type

                    # Build option dictionary using COLUMN-INDEX MAPPING
                    option = {
                        "symbol": ticker_text,
                        "type": option_type,
                        "strike": self._parse_number(cell_texts[4]) if len(cell_texts) > 4 else None,
                        "expiration": expiration_date,
                        "moneyness": cell_texts[5] if len(cell_texts) > 5 else None,  # ATM/ITM/OTM
                        "distance_pct": self._parse_number(cell_texts[6]) if len(cell_texts) > 6 else None,
                        "last": self._parse_number(cell_texts[7]) if len(cell_texts) > 7 else None,
                        "variation_pct": self._parse_number(cell_texts[8]) if len(cell_texts) > 8 else None,
                        "last_trade_time": cell_texts[9] if len(cell_texts) > 9 else None,
                        "volume": self._parse_number(cell_texts[10]) if len(cell_texts) > 10 else None,
                        "financial_volume": self._parse_number(cell_texts[11]) if len(cell_texts) > 11 else None,
                        "iv": self._parse_number(cell_texts[12]) if len(cell_texts) > 12 else None,
                        "delta": self._parse_number(cell_texts[13]) if len(cell_texts) > 13 else None,
                        "gamma": self._parse_number(cell_texts[14]) if len(cell_texts) > 14 else None,
                        "theta": self._parse_number(cell_texts[15]) if len(cell_texts) > 15 else None,
                        "theta_pct": self._parse_number(cell_texts[16]) if len(cell_texts) > 16 else None,
                        "vega": self._parse_number(cell_texts[17]) if len(cell_texts) > 17 else None,
                        "bid": None,  # Not directly available in this table format
                        "ask": None,  # Not directly available in this table format
                        "open_interest": None,  # Will be calculated below
                    }

                    # Calculate Open Interest from Coberto + Travado + Descob columns (19, 20, 21)
                    if len(cell_texts) > 21:
                        coberto = self._parse_number(cell_texts[19]) or 0
                        travado = self._parse_number(cell_texts[20]) or 0
                        descob = self._parse_number(cell_texts[21]) or 0
                        option["open_interest"] = int(coberto + travado + descob)

                    # Only add if has minimum required data (symbol and strike)
                    if option["symbol"] and option["strike"]:
                        options.append(option)
                        logger.debug(
                            f"Parsed option: {option['symbol']} "
                            f"Strike={option['strike']} Delta={option['delta']} "
                            f"IV={option['iv']} Volume={option['volume']}"
                        )

                except Exception as e:
                    logger.debug(f"Error parsing option row: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error parsing options table: {e}")

        return options

    def _parse_number(self, text: str) -> Optional[float]:
        """Parse number from text"""
        try:
            text = text.replace("R$", "").replace(".", "").replace(",", ".").strip()
            return float(text)
        except:
            return None

    async def health_check(self) -> bool:
        """Check if Opcoes.net.br is accessible"""
        try:
            await self.initialize()
            return await self._verify_logged_in()
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_opcoes():
    """Test Opcoes.net.br scraper - IMPROVED 2025-12-13"""
    scraper = OpcoesNetScraper()

    try:
        result = await scraper.scrape("PETR")

        if result.success:
            print("=" * 60)
            print("✅ OPCOES.NET.BR SCRAPER TEST - SUCCESS")
            print("=" * 60)

            # Basic info
            print(f"\n📊 TICKER: {result.data.get('ticker')}")
            print(f"💰 Underlying Price: R$ {result.data.get('underlying_price')}")
            print(f"📅 Selected Expiration: {result.data.get('selected_expiration')}")

            # Volatility data
            print(f"\n📈 VOLATILITY DATA:")
            print(f"   Historical Volatility: {result.data.get('historical_volatility')}%")
            print(f"   IV Rank (General): {result.data.get('iv_rank')}%")
            print(f"   IV Percentile: {result.data.get('iv_percentile')}%")
            print(f"   IV Rank (CALLs): {result.data.get('iv_rank_calls')}%")
            print(f"   IV Rank (PUTs): {result.data.get('iv_rank_puts')}%")

            # Options chain summary
            options = result.data.get('options_chain', [])
            calls = [o for o in options if o.get('type') == 'CALL']
            puts = [o for o in options if o.get('type') == 'PUT']
            with_greeks = [o for o in options if o.get('delta') is not None]

            print(f"\n🔗 OPTIONS CHAIN:")
            print(f"   Total Options: {len(options)}")
            print(f"   CALLs: {len(calls)}")
            print(f"   PUTs: {len(puts)}")
            print(f"   With Greeks: {len(with_greeks)}")

            # Sample options with Greeks
            if with_greeks:
                print(f"\n📋 SAMPLE OPTIONS WITH GREEKS (first 5):")
                for opt in with_greeks[:5]:
                    print(f"   {opt['symbol']} | {opt['type']} | Strike={opt['strike']} | "
                          f"Delta={opt['delta']} | Gamma={opt['gamma']} | "
                          f"Theta={opt['theta']} | Vega={opt['vega']} | IV={opt['iv']}%")

            # Delta 15 candidates (for WHEEL strategy)
            delta_15_puts = [o for o in puts if o.get('delta') and abs(o['delta']) <= 0.20 and abs(o['delta']) >= 0.10]
            if delta_15_puts:
                print(f"\n🎯 DELTA ~15 PUT CANDIDATES (for WHEEL):")
                for opt in delta_15_puts[:5]:
                    print(f"   {opt['symbol']} | Strike={opt['strike']} | "
                          f"Delta={opt['delta']} | Premium={opt['last']} | IV={opt['iv']}%")

            print("\n" + "=" * 60)
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_opcoes())
