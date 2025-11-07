"""
Investidor10 Scraper - Análise fundamentalista e rankings
Fonte: https://investidor10.com.br/
Requer login via Google OAuth
"""
import asyncio
import pickle
from datetime import datetime
from typing import Dict, Any, Optional
from selenium.webdriver.common.by import By
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class Investidor10Scraper(BaseScraper):
    """Scraper for Investidor10 fundamental analysis"""

    BASE_URL = "https://investidor10.com.br"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="Investidor10",
            source="INVESTIDOR10",
            requires_login=True,
        )

    async def initialize(self):
        """Load Google OAuth cookies"""
        if self._initialized:
            return

        if not self.driver:
            self.driver = self._create_driver()

        try:
            self.driver.get(self.BASE_URL)
            await asyncio.sleep(2)

            try:
                with open(self.COOKIES_FILE, 'rb') as f:
                    cookies = pickle.load(f)

                for cookie in cookies:
                    if 'investidor10.com.br' in cookie.get('domain', ''):
                        try:
                            self.driver.add_cookie(cookie)
                        except Exception as e:
                            logger.debug(f"Could not add cookie: {e}")

                self.driver.refresh()
                await asyncio.sleep(3)

            except FileNotFoundError:
                logger.warning("Google cookies not found. Will attempt without login.")

            if self.requires_login and not await self._verify_logged_in():
                logger.warning("Login verification failed - some data may not be accessible")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Investidor10 scraper: {e}")
            raise

    async def _verify_logged_in(self) -> bool:
        """Check if logged in"""
        logout_selectors = [
            "//a[contains(text(), 'Sair')]",
            "//a[contains(@href, 'logout')]",
            ".user-avatar",
            ".profile-menu",
        ]

        for selector in logout_selectors:
            try:
                if selector.startswith("//"):
                    elements = self.driver.find_elements(By.XPATH, selector)
                else:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)

                if elements:
                    return True
            except:
                continue

        return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """Scrape fundamental data from Investidor10"""
        await self.initialize()

        try:
            url = f"{self.BASE_URL}/acoes/{ticker.lower()}"
            logger.info(f"Scraping Investidor10 for {ticker}: {url}")

            self.driver.get(url)
            await asyncio.sleep(4)

            if "não encontrada" in self.driver.page_source.lower() or "404" in self.driver.page_source:
                return ScraperResult(
                    success=False,
                    error=f"Ticker {ticker} not found",
                    source=self.source,
                )

            data = await self._extract_data(ticker)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={"url": url, "requires_login": True},
                )

            return ScraperResult(
                success=False,
                error="Failed to extract data",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping Investidor10 for {ticker}: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_data(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Extract fundamental data"""
        data = {
            "ticker": ticker.upper(),
            "source": "Investidor10",
            "scraped_at": datetime.now().isoformat(),
            "indicators": {},
            "scores": {},
        }

        try:
            # Company name
            try:
                name_elem = self.driver.find_element(By.CSS_SELECTOR, "h1, .company-name, ._card-header h2")
                data["company_name"] = name_elem.text.strip()
            except:
                pass

            # Current price
            try:
                price_elem = self.driver.find_element(By.CSS_SELECTOR, "._card-body .value, .cotacao, [data-testid='price']")
                price_text = price_elem.text.strip().replace("R$", "").replace(",", ".").strip()
                data["price"] = self._parse_number(price_text)
            except:
                pass

            # Investidor10 score
            try:
                score_elem = self.driver.find_element(By.CSS_SELECTOR, ".nota, .score, [data-testid='score']")
                score_text = score_elem.text.strip()
                data["scores"]["nota_investidor10"] = self._parse_number(score_text)
            except:
                pass

            # Extract indicators
            indicators = await self._extract_indicators()
            if indicators:
                data["indicators"] = indicators

            # Extract scores/rankings
            scores = await self._extract_scores()
            if scores:
                data["scores"].update(scores)

            return data if (data.get("indicators") or data.get("scores")) else None

        except Exception as e:
            logger.error(f"Error extracting data: {e}")
            return None

    async def _extract_indicators(self) -> Dict[str, Any]:
        """Extract financial indicators"""
        indicators = {}

        indicator_map = {
            "P/L": "pl",
            "P/VP": "pvp",
            "PSR": "psr",
            "Dividend Yield": "dividend_yield",
            "DY": "dividend_yield",
            "P/Ativo": "p_ativo",
            "P/Cap.Giro": "p_cap_giro",
            "P/EBIT": "p_ebit",
            "P/Ativ Circ.Liq": "p_ativo_circ_liq",
            "EV/EBIT": "ev_ebit",
            "EV/EBITDA": "ev_ebitda",
            "Marg. Bruta": "margem_bruta",
            "Marg. EBIT": "margem_ebit",
            "Marg. Líquida": "margem_liquida",
            "EBIT/Ativo": "ebit_ativo",
            "ROIC": "roic",
            "ROE": "roe",
            "ROA": "roa",
            "Liquidez Corr": "liquidez_corrente",
            "Div Br/Patrim": "divida_bruta_patrimonio",
            "Giro Ativos": "giro_ativos",
            "Cresc. Rec 5a": "crescimento_receita_5a",
            "LPA": "lpa",
            "VPA": "vpa",
            "Payout": "payout",
        }

        try:
            # Find all table cells with labels and values
            tables = self.driver.find_elements(By.CSS_SELECTOR, "table, ._table, .indicators-table")

            for table in tables:
                rows = table.find_elements(By.CSS_SELECTOR, "tr")

                for row in rows:
                    try:
                        cells = row.find_elements(By.CSS_SELECTOR, "td, th")

                        if len(cells) >= 2:
                            label = cells[0].text.strip()
                            value_text = cells[1].text.strip()

                            for indicator_label, indicator_key in indicator_map.items():
                                if indicator_label.lower() in label.lower():
                                    value = self._parse_indicator_value(value_text)
                                    if value is not None:
                                        indicators[indicator_key] = value
                                    break

                    except:
                        continue

            # Also try divs with _card-body class (common in Investidor10)
            cards = self.driver.find_elements(By.CSS_SELECTOR, "._card-body, .indicator-card")

            for card in cards:
                try:
                    label_elem = card.find_element(By.CSS_SELECTOR, ".title, .label, ._card-title")
                    value_elem = card.find_element(By.CSS_SELECTOR, ".value, ._card-value")

                    if label_elem and value_elem:
                        label = label_elem.text.strip()
                        value_text = value_elem.text.strip()

                        for indicator_label, indicator_key in indicator_map.items():
                            if indicator_label.lower() in label.lower():
                                value = self._parse_indicator_value(value_text)
                                if value is not None:
                                    indicators[indicator_key] = value
                                break

                except:
                    continue

        except Exception as e:
            logger.error(f"Error extracting indicators: {e}")

        return indicators

    async def _extract_scores(self) -> Dict[str, Any]:
        """Extract ranking scores"""
        scores = {}

        try:
            # Investidor10 has various scoring systems
            score_selectors = [
                ".score-value",
                ".ranking-value",
                "[data-score]",
            ]

            for selector in score_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)

                    for elem in elements:
                        score_name = elem.get_attribute("data-score") or elem.get_attribute("title")
                        score_value = elem.text.strip()

                        if score_name and score_value:
                            scores[score_name] = self._parse_number(score_value)

                except:
                    continue

        except Exception as e:
            logger.debug(f"Error extracting scores: {e}")

        return scores

    def _parse_indicator_value(self, value_text: str) -> Optional[float]:
        """Parse indicator value"""
        try:
            value_text = value_text.replace("%", "").replace("R$", "").replace(".", "").replace(",", ".").strip()

            if value_text in ["-", "N/A", "n/a", "", "—", "–"]:
                return None

            return float(value_text)

        except:
            return None

    def _parse_number(self, text: str) -> Optional[float]:
        """Parse number from text"""
        try:
            text = text.replace(" ", "").replace(".", "").replace(",", ".").strip()
            return float(text)
        except:
            return None

    async def health_check(self) -> bool:
        """Check if Investidor10 is accessible"""
        try:
            await self.initialize()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
