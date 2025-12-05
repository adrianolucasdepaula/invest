# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
Kinvo Scraper - Portfolio management and tracking
Source: https://app.kinvo.com.br/
Supports login via email/password or Google OAuth

OPTIMIZED: Uses Playwright for browser automation
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class KinvoScraper(BaseScraper):
    """
    Scraper for Kinvo portfolio management platform

    MIGRATED TO PLAYWRIGHT - Uses Playwright for browser automation
    Supports login via email/password credentials
    """

    BASE_URL = "https://app.kinvo.com.br"
    LOGIN_URL = "https://app.kinvo.com.br/login"
    COOKIES_FILE = Path("/app/data/cookies/kinvo_session.json")
    CREDENTIALS_FILE = Path("/app/data/credentials/kinvo.json")

    def __init__(self):
        super().__init__(
            name="Kinvo",
            source="KINVO",
            requires_login=True,
        )
        self._credentials = None

    def _load_credentials(self) -> Optional[Dict[str, str]]:
        """Load credentials from file or environment"""
        import os

        # Try file first
        if self.CREDENTIALS_FILE.exists():
            try:
                with open(self.CREDENTIALS_FILE, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Could not load credentials file: {e}")

        # Try environment variables
        email = os.environ.get('KINVO_EMAIL')
        password = os.environ.get('KINVO_PASSWORD')

        if email and password:
            return {'email': email, 'password': password}

        return None

    async def initialize(self):
        """Initialize Playwright browser and perform login"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            cookies_loaded = False

            # Try to load existing session cookies BEFORE navigation
            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        session_data = json.load(f)

                    # Handle both formats
                    if isinstance(session_data, dict) and 'cookies' in session_data:
                        cookies = session_data['cookies']
                    else:
                        cookies = session_data

                    kinvo_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict):
                            domain = cookie.get('domain', '')
                            if 'kinvo.com.br' in domain:
                                pw_cookie = {
                                    'name': cookie.get('name'),
                                    'value': cookie.get('value'),
                                    'domain': domain,
                                    'path': cookie.get('path', '/'),
                                }
                                if 'expires' in cookie and cookie['expires'] and cookie['expires'] != -1:
                                    pw_cookie['expires'] = cookie['expires']
                                if 'httpOnly' in cookie:
                                    pw_cookie['httpOnly'] = cookie['httpOnly']
                                if 'secure' in cookie:
                                    pw_cookie['secure'] = cookie['secure']
                                if 'sameSite' in cookie:
                                    valid_same_site = ['Strict', 'Lax', 'None']
                                    if cookie['sameSite'] in valid_same_site:
                                        pw_cookie['sameSite'] = cookie['sameSite']

                                kinvo_cookies.append(pw_cookie)

                    if kinvo_cookies:
                        await self.page.context.add_cookies(kinvo_cookies)
                        logger.info(f"Loaded {len(kinvo_cookies)} cookies for Kinvo")
                        cookies_loaded = True

                except Exception as e:
                    logger.warning(f"Could not load Kinvo cookies: {e}")

            # Navigate to main page
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Check if already logged in
            if await self._verify_logged_in():
                logger.success("Kinvo - already logged in via cookies")
                self._initialized = True
                return

            # If not logged in, try credentials
            if not cookies_loaded:
                self._credentials = self._load_credentials()

                if self._credentials:
                    await self._perform_login()
                else:
                    logger.warning("Kinvo - no credentials found, some features may not be available")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Kinvo scraper: {e}")
            raise

    async def _perform_login(self) -> bool:
        """Perform login with email/password credentials"""
        try:
            if not self._credentials:
                return False

            email = self._credentials.get('email')
            password = self._credentials.get('password')

            if not email or not password:
                logger.error("Missing email or password in credentials")
                return False

            logger.info(f"Attempting login with email: {email}")

            # Navigate to login page
            await self.page.goto(self.LOGIN_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Find and fill email field
            email_selectors = [
                "input[type='email']",
                "input[name='email']",
                "input[placeholder*='mail']",
                "input[placeholder*='Email']",
                "#email",
            ]

            email_field = None
            for selector in email_selectors:
                try:
                    email_field = await self.page.query_selector(selector)
                    if email_field:
                        break
                except:
                    continue

            if not email_field:
                logger.error("Could not find email field")
                return False

            await email_field.fill(email)
            await asyncio.sleep(0.5)

            # Find and fill password field
            password_selectors = [
                "input[type='password']",
                "input[name='password']",
                "input[placeholder*='enha']",  # Senha
                "#password",
            ]

            password_field = None
            for selector in password_selectors:
                try:
                    password_field = await self.page.query_selector(selector)
                    if password_field:
                        break
                except:
                    continue

            if not password_field:
                logger.error("Could not find password field")
                return False

            await password_field.fill(password)
            await asyncio.sleep(0.5)

            # Find and click login button
            login_selectors = [
                "button[type='submit']",
                "button:has-text('Entrar')",
                "button:has-text('Login')",
                "button:has-text('Acessar')",
                "input[type='submit']",
            ]

            login_button = None
            for selector in login_selectors:
                try:
                    login_button = await self.page.query_selector(selector)
                    if login_button:
                        break
                except:
                    continue

            if login_button:
                await login_button.click()
            else:
                # Try pressing Enter
                await self.page.keyboard.press("Enter")

            await asyncio.sleep(3)

            # Verify login success
            if await self._verify_logged_in():
                logger.success("Kinvo - login successful!")

                # Save session cookies
                await self._save_session()
                return True
            else:
                logger.error("Login failed - could not verify login")
                return False

        except Exception as e:
            logger.error(f"Error during login: {e}")
            return False

    async def _verify_logged_in(self) -> bool:
        """Check if logged in"""
        try:
            html = await self.page.content()
            html_lower = html.lower()

            # Check for logged-in indicators
            logged_in_indicators = [
                'dashboard',
                'carteira',
                'patrimônio',
                'patrimonio',
                'portfolio',
                'minha-conta',
                'perfil',
                'logout',
                'sair',
            ]

            # Check for login page indicators (if present, NOT logged in)
            login_indicators = [
                'login',
                'entrar',
                'esqueci minha senha',
                'criar conta',
            ]

            has_logged_in = any(ind in html_lower for ind in logged_in_indicators)
            has_login_form = 'input type="password"' in html or 'type="password"' in html

            # Check URL
            current_url = self.page.url.lower()
            on_login_page = 'login' in current_url

            if has_logged_in and not on_login_page:
                return True

            if on_login_page or has_login_form:
                return False

            return has_logged_in

        except Exception as e:
            logger.debug(f"Error verifying login: {e}")
            return False

    async def _save_session(self):
        """Save session cookies for future use"""
        try:
            cookies = await self.page.context.cookies()

            # Filter for Kinvo cookies
            kinvo_cookies = [c for c in cookies if 'kinvo.com.br' in c.get('domain', '')]

            if kinvo_cookies:
                # Ensure directory exists
                self.COOKIES_FILE.parent.mkdir(parents=True, exist_ok=True)

                with open(self.COOKIES_FILE, 'w') as f:
                    json.dump({'cookies': kinvo_cookies}, f, indent=2)

                logger.info(f"Saved {len(kinvo_cookies)} session cookies")

        except Exception as e:
            logger.warning(f"Could not save session: {e}")

    async def scrape(self, section: str = "portfolio") -> ScraperResult:
        """
        Scrape portfolio data from Kinvo

        Args:
            section: Section to scrape - 'portfolio', 'assets', 'performance', 'history'

        Returns:
            ScraperResult with portfolio data
        """
        try:
            if not self.page:
                await self.initialize()

            if section == "portfolio":
                return await self._scrape_portfolio()
            elif section == "assets":
                return await self._scrape_assets()
            elif section == "performance":
                return await self._scrape_performance()
            elif section == "history":
                return await self._scrape_history()
            else:
                return await self._scrape_portfolio()

        except Exception as e:
            logger.error(f"Error scraping Kinvo: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _scrape_portfolio(self) -> ScraperResult:
        """Scrape portfolio summary"""
        try:
            # Navigate to portfolio/dashboard
            await self.page.goto(f"{self.BASE_URL}/carteira", wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            html = await self.page.content()
            soup = BeautifulSoup(html, 'html.parser')

            portfolio_data = {
                'total_value': None,
                'daily_change': None,
                'daily_change_pct': None,
                'monthly_return': None,
                'yearly_return': None,
                'assets': [],
            }

            # Try to extract total value
            value_selectors = [
                '.total-patrimonio',
                '.patrimonio-total',
                '.total-value',
                '[class*="patrimonio"]',
                '[class*="total"]',
            ]

            for selector in value_selectors:
                try:
                    elem = soup.select_one(selector)
                    if elem:
                        text = elem.get_text().strip()
                        if 'R$' in text or any(c.isdigit() for c in text):
                            portfolio_data['total_value'] = text
                            break
                except:
                    continue

            # Extract assets list
            asset_selectors = [
                '.asset-item',
                '.ativo-item',
                '.investment-item',
                '[class*="asset"]',
                'tr[class*="asset"]',
            ]

            for selector in asset_selectors:
                try:
                    elements = soup.select(selector)
                    if elements:
                        for elem in elements[:20]:  # Limit to 20 assets
                            asset_data = self._parse_asset_element(elem)
                            if asset_data:
                                portfolio_data['assets'].append(asset_data)
                        break
                except:
                    continue

            return ScraperResult(
                success=True,
                data={
                    "source": "Kinvo",
                    "section": "portfolio",
                    "portfolio": portfolio_data,
                    "scraped_at": datetime.now().isoformat(),
                },
                source=self.source,
                metadata={
                    "url": f"{self.BASE_URL}/carteira",
                    "assets_count": len(portfolio_data.get('assets', [])),
                },
            )

        except Exception as e:
            logger.error(f"Error scraping portfolio: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _scrape_assets(self) -> ScraperResult:
        """Scrape detailed assets list"""
        try:
            await self.page.goto(f"{self.BASE_URL}/ativos", wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            html = await self.page.content()
            soup = BeautifulSoup(html, 'html.parser')

            assets = []

            # Try different selectors for asset tables/lists
            table = soup.select_one('table')
            if table:
                rows = table.select('tr')
                for row in rows[1:]:  # Skip header
                    cells = row.select('td')
                    if len(cells) >= 3:
                        assets.append({
                            'ticker': cells[0].get_text().strip(),
                            'name': cells[1].get_text().strip() if len(cells) > 1 else '',
                            'quantity': cells[2].get_text().strip() if len(cells) > 2 else '',
                            'current_price': cells[3].get_text().strip() if len(cells) > 3 else '',
                            'total_value': cells[4].get_text().strip() if len(cells) > 4 else '',
                        })

            return ScraperResult(
                success=True,
                data={
                    "source": "Kinvo",
                    "section": "assets",
                    "assets": assets,
                    "count": len(assets),
                    "scraped_at": datetime.now().isoformat(),
                },
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping assets: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _scrape_performance(self) -> ScraperResult:
        """Scrape performance metrics"""
        try:
            await self.page.goto(f"{self.BASE_URL}/rentabilidade", wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            html = await self.page.content()
            soup = BeautifulSoup(html, 'html.parser')

            performance = {
                'daily': None,
                'weekly': None,
                'monthly': None,
                'yearly': None,
                'all_time': None,
            }

            # Extract performance metrics
            metrics = soup.select('[class*="metric"], [class*="performance"], [class*="rentabilidade"]')
            for metric in metrics:
                text = metric.get_text().lower()
                value = self._extract_percentage(metric.get_text())
                if 'diário' in text or 'dia' in text:
                    performance['daily'] = value
                elif 'semanal' in text or 'semana' in text:
                    performance['weekly'] = value
                elif 'mensal' in text or 'mês' in text:
                    performance['monthly'] = value
                elif 'anual' in text or 'ano' in text:
                    performance['yearly'] = value

            return ScraperResult(
                success=True,
                data={
                    "source": "Kinvo",
                    "section": "performance",
                    "performance": performance,
                    "scraped_at": datetime.now().isoformat(),
                },
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping performance: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _scrape_history(self) -> ScraperResult:
        """Scrape transaction history"""
        try:
            await self.page.goto(f"{self.BASE_URL}/historico", wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            html = await self.page.content()
            soup = BeautifulSoup(html, 'html.parser')

            transactions = []

            # Look for transaction table
            table = soup.select_one('table')
            if table:
                rows = table.select('tr')
                for row in rows[1:20]:  # Limit to 20 transactions
                    cells = row.select('td')
                    if len(cells) >= 3:
                        transactions.append({
                            'date': cells[0].get_text().strip(),
                            'type': cells[1].get_text().strip(),
                            'asset': cells[2].get_text().strip() if len(cells) > 2 else '',
                            'quantity': cells[3].get_text().strip() if len(cells) > 3 else '',
                            'price': cells[4].get_text().strip() if len(cells) > 4 else '',
                            'total': cells[5].get_text().strip() if len(cells) > 5 else '',
                        })

            return ScraperResult(
                success=True,
                data={
                    "source": "Kinvo",
                    "section": "history",
                    "transactions": transactions,
                    "count": len(transactions),
                    "scraped_at": datetime.now().isoformat(),
                },
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping history: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    def _parse_asset_element(self, element) -> Optional[Dict[str, Any]]:
        """Parse a single asset element"""
        try:
            asset = {}

            # Try to find ticker
            ticker_elem = element.select_one('[class*="ticker"], [class*="symbol"], strong, b')
            if ticker_elem:
                asset['ticker'] = ticker_elem.get_text().strip()

            # Try to find name
            name_elem = element.select_one('[class*="name"], [class*="nome"]')
            if name_elem:
                asset['name'] = name_elem.get_text().strip()

            # Try to find value
            value_elem = element.select_one('[class*="value"], [class*="valor"]')
            if value_elem:
                asset['value'] = value_elem.get_text().strip()

            if asset.get('ticker'):
                return asset

            return None

        except:
            return None

    def _extract_percentage(self, text: str) -> Optional[str]:
        """Extract percentage from text"""
        import re
        match = re.search(r'[-+]?\d+[,.]?\d*\s*%', text)
        if match:
            return match.group(0).strip()
        return None

    async def health_check(self) -> bool:
        """Check if Kinvo is accessible"""
        try:
            await self.initialize()
            return await self._verify_logged_in()
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_kinvo():
    """Test Kinvo scraper"""
    scraper = KinvoScraper()

    try:
        await scraper.initialize()

        print(f"URL: {scraper.page.url}")
        title = await scraper.page.title()
        print(f"Title: {title}")

        logged_in = await scraper._verify_logged_in()
        print(f"Logged in: {logged_in}")

        if logged_in:
            result = await scraper.scrape("portfolio")
            if result.success:
                print("✅ Success!")
                print(f"Data: {result.data}")
            else:
                print(f"❌ Error: {result.error}")
        else:
            print("⚠️ Not logged in - cannot scrape portfolio")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_kinvo())
