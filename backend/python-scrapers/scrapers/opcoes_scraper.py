"""
Opcoes.net.br Scraper - Análise de opções
Fonte: https://opcoes.net.br/
Requer login com credenciais específicas
"""
import asyncio
from typing import Dict, Any, Optional, List
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from loguru import logger
import re

from base_scraper import BaseScraper, ScraperResult
from config import settings


class OpcoesNetScraper(BaseScraper):
    """
    Scraper para análise de opções do Opcoes.net.br

    REQUER LOGIN com credenciais específicas

    Dados extraídos:
    - Preços de opções
    - Volatilidade implícita
    - IV Rank
    - Vencimentos
    - Greeks (Delta, Gamma, Theta, Vega)
    - Prêmios
    """

    BASE_URL = "https://opcoes.net.br"
    LOGIN_URL = "https://opcoes.net.br/login"

    def __init__(self):
        super().__init__(
            name="OpcoesNet",
            source="OPCOES_NET",
            requires_login=True,  # REQUER LOGIN!
        )

    async def initialize(self):
        """Initialize with login"""
        if self._initialized:
            return

        try:
            # Create driver
            if not self.driver:
                self.driver = self._create_driver()

            logger.info(f"Logging into {self.name}...")

            # Navigate to login page
            self.driver.get(self.LOGIN_URL)
            await asyncio.sleep(2)

            # Get credentials from settings
            username = getattr(settings, 'OPCOES_USERNAME', None)
            password = getattr(settings, 'OPCOES_PASSWORD', None)

            if not username or not password:
                raise Exception(
                    "Opcoes.net.br credentials not configured. "
                    "Please set OPCOES_USERNAME and OPCOES_PASSWORD in .env"
                )

            # Find login form and fill
            await self._perform_login(username, password)

            # Verify login successful
            await asyncio.sleep(3)

            if not await self._verify_logged_in():
                raise Exception("Login failed - please check credentials")

            logger.success(f"{self.name} logged in successfully")
            self._initialized = True

        except Exception as e:
            logger.error(f"Failed to initialize {self.name}: {e}")
            raise

    async def _perform_login(self, username: str, password: str):
        """Perform login"""
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
                    username_field = self.wait.until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                    )
                    username_field.clear()
                    username_field.send_keys(username)
                    username_filled = True
                    logger.debug(f"Username filled with selector: {selector}")
                    break
                except:
                    continue

            if not username_filled:
                raise Exception("Could not find username/CPF field")

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
                    password_field = self.driver.find_element(By.CSS_SELECTOR, selector)
                    password_field.clear()
                    password_field.send_keys(password)
                    password_filled = True
                    logger.debug(f"Password filled with selector: {selector}")
                    break
                except:
                    continue

            if not password_filled:
                raise Exception("Could not find password field")

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
                    submit_button = self.driver.find_element(By.CSS_SELECTOR, selector)
                    submit_button.click()
                    submitted = True
                    logger.debug(f"Form submitted with selector: {selector}")
                    break
                except:
                    continue

            if not submitted:
                # Try pressing Enter as fallback
                password_field.send_keys(Keys.RETURN)
                logger.debug("Form submitted via Enter key")

        except Exception as e:
            logger.error(f"Error performing login: {e}")
            raise

    async def _verify_logged_in(self) -> bool:
        """Verify that user is logged in"""
        try:
            # Look for indicators of successful login
            # Logout button, user menu, or absence of login form

            # Check for logout/sair button
            logout_indicators = [
                "//a[contains(text(), 'Sair')]",
                "//button[contains(text(), 'Logout')]",
                "//a[contains(text(), 'Logout')]",
                ".logout-button",
                ".user-menu",
            ]

            for indicator in logout_indicators:
                try:
                    if indicator.startswith("//"):
                        # XPath
                        elements = self.driver.find_elements(By.XPATH, indicator)
                    else:
                        # CSS
                        elements = self.driver.find_elements(By.CSS_SELECTOR, indicator)

                    if elements:
                        logger.debug(f"Found logged-in indicator: {indicator}")
                        return True
                except:
                    continue

            # Check if still on login page (indicates failure)
            if "login" in self.driver.current_url.lower():
                return False

            # Check for error messages
            error_indicators = [
                "//div[contains(text(), 'inválid')]",
                "//div[contains(text(), 'incorret')]",
                ".error-message",
                ".alert-danger",
            ]

            for indicator in error_indicators:
                try:
                    if indicator.startswith("//"):
                        elements = self.driver.find_elements(By.XPATH, indicator)
                    else:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, indicator)

                    if elements:
                        logger.warning(f"Found error indicator: {indicator}")
                        return False
                except:
                    continue

            # If we got here and not on login page, assume success
            return "login" not in self.driver.current_url.lower()

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
            # Ensure logged in
            await self.initialize()

            # Navigate to ticker options page
            # Opcoes.net.br URL format may vary
            ticker_clean = re.sub(r'\d+$', '', ticker.upper())  # Remove trailing numbers
            url = f"{self.BASE_URL}/opcoes/{ticker_clean}"

            logger.info(f"Navigating to {url}")
            self.driver.get(url)

            await asyncio.sleep(3)

            # Check if ticker exists
            if "não encontrado" in self.driver.page_source.lower():
                return ScraperResult(
                    success=False,
                    error=f"Options for {ticker} not found",
                    source=self.source,
                )

            # Extract data
            data = await self._extract_data(ticker_clean)

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
            else:
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

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract options data from page"""
        try:
            data = {
                "ticker": ticker.upper(),
                "underlying_price": None,
                "iv_rank": None,  # Implied Volatility Rank
                "iv_percentile": None,
                "options_chain": [],
            }

            # Underlying price
            try:
                price_selectors = [
                    ".underlying-price",
                    ".stock-price",
                    "[data-field='price']",
                ]

                for selector in price_selectors:
                    try:
                        price_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        price_text = price_elem.text.strip().replace("R$", "").replace(",", ".")
                        data["underlying_price"] = float(price_text)
                        break
                    except:
                        continue

            except Exception as e:
                logger.debug(f"Could not extract underlying price: {e}")

            # IV Rank
            try:
                iv_selectors = [
                    ".iv-rank",
                    "[data-field='iv-rank']",
                ]

                for selector in iv_selectors:
                    try:
                        iv_elem = self.driver.find_element(By.CSS_SELECTOR, selector)
                        iv_text = iv_elem.text.strip().replace("%", "")
                        data["iv_rank"] = float(iv_text)
                        break
                    except:
                        continue

            except Exception as e:
                logger.debug(f"Could not extract IV rank: {e}")

            # Options chain (calls and puts)
            try:
                # Look for options table
                tables = self.driver.find_elements(By.TAG_NAME, "table")

                for table in tables:
                    # Check if this is an options table
                    headers = table.find_elements(By.TAG_NAME, "th")
                    header_text = " ".join([h.text.lower() for h in headers])

                    if "strike" in header_text or "vencimento" in header_text or "prêmio" in header_text:
                        # This is likely an options table
                        options = await self._parse_options_table(table)
                        data["options_chain"].extend(options)

            except Exception as e:
                logger.debug(f"Error extracting options chain: {e}")

            logger.debug(f"Extracted Opcoes.net data for {ticker}: {len(data['options_chain'])} options")
            return data

        except Exception as e:
            logger.error(f"Error in _extract_data: {e}")
            return None

    async def _parse_options_table(self, table) -> List[Dict[str, Any]]:
        """Parse options chain table"""
        options = []

        try:
            rows = table.find_elements(By.TAG_NAME, "tr")

            for row in rows[1:]:  # Skip header
                cells = row.find_elements(By.TAG_NAME, "td")

                if len(cells) >= 3:
                    try:
                        option = {
                            "symbol": None,
                            "type": None,  # CALL or PUT
                            "strike": None,
                            "expiration": None,
                            "bid": None,
                            "ask": None,
                            "last": None,
                            "volume": None,
                            "open_interest": None,
                            "iv": None,  # Implied Volatility
                            "delta": None,
                            "gamma": None,
                            "theta": None,
                            "vega": None,
                        }

                        # Extract data from cells
                        # Format varies by site structure
                        cell_texts = [cell.text.strip() for cell in cells]

                        # Try to identify and parse each field
                        for i, text in enumerate(cell_texts):
                            if not text or text == "-":
                                continue

                            # Symbol
                            if i == 0 and len(text) >= 4:
                                option["symbol"] = text
                                # Determine type from symbol
                                if re.search(r'[A-Z]\d+$', text):
                                    # Format like PETRA45 (call) or PETRN45 (put)
                                    option["type"] = "CALL" if text[-3].isalpha() and text[-3] < 'N' else "PUT"

                            # Numeric values
                            num = self._parse_number(text)
                            if num is not None:
                                if option["strike"] is None:
                                    option["strike"] = num
                                elif option["last"] is None:
                                    option["last"] = num
                                elif option["bid"] is None:
                                    option["bid"] = num
                                elif option["ask"] is None:
                                    option["ask"] = num

                        # Only add if has minimum data
                        if option["symbol"] and option["strike"]:
                            options.append(option)

                    except Exception as e:
                        logger.debug(f"Error parsing option row: {e}")
                        continue

        except Exception as e:
            logger.debug(f"Error parsing options table: {e}")

        return options

    def _parse_number(self, text: str) -> Optional[float]:
        """Parse number from text"""
        try:
            # Remove formatting
            text = text.replace("R$", "").replace(".", "").replace(",", ".").strip()
            return float(text)
        except:
            return None


# Example usage
async def test_opcoes():
    """Test Opcoes.net.br scraper"""
    scraper = OpcoesNetScraper()

    try:
        # Test with PETR (PETR4 options)
        result = await scraper.scrape_with_retry("PETR")

        if result.success:
            print("✅ Success!")
            print(f"Underlying price: R$ {result.data.get('underlying_price')}")
            print(f"IV Rank: {result.data.get('iv_rank')}%")
            print(f"Options found: {len(result.data['options_chain'])}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_opcoes())
