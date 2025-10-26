"""
Scraper para StatusInvest (statusinvest.com.br)
Requer login com Google
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings


class StatusInvestScraper(BaseScraper):
    """
    Scraper para StatusInvest
    """

    def __init__(self):
        super().__init__(source_name="statusinvest", requires_auth=True)
        self.base_url = "https://statusinvest.com.br"
        self.is_authenticated = False

    async def authenticate(self) -> bool:
        """
        Realiza login via Google

        Returns:
            True se autenticação foi bem sucedida
        """
        if self.is_authenticated:
            return True

        try:
            if not self.driver:
                self.driver = self._init_selenium()

            # Acessa página de login
            self.driver.get(f"{self.base_url}/login")

            # Aguarda e clica no botão de login com Google
            google_btn = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "a.google-login, button.google-login"))
            )
            google_btn.click()

            # Aguarda redirecionamento e login manual do usuário
            # Em produção, isso seria automatizado com credenciais
            logger.info("Aguardando login manual com Google...")
            WebDriverWait(self.driver, 120).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".user-logged, .header-user"))
            )

            self.is_authenticated = True
            logger.info("Login no StatusInvest realizado com sucesso")
            return True

        except Exception as e:
            logger.error(f"Erro ao autenticar no StatusInvest: {str(e)}")
            return False

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados do StatusInvest

        Args:
            ticker: Código do ativo

        Returns:
            Dados coletados
        """
        if not self.is_authenticated:
            await self.authenticate()

        self._respect_rate_limit()

        try:
            # Acessa página do ativo
            url = f"{self.base_url}/acoes/{ticker.lower()}"
            self.driver.get(url)

            # Aguarda carregamento
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "indicator-today-container"))
            )

            # Extrai HTML
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            # Extrai dados
            data = {
                'ticker': ticker,
                **self._extract_price_data(soup),
                **self._extract_valuation_indicators(soup),
                **self._extract_profitability_indicators(soup),
                **self._extract_debt_indicators(soup),
                **self._extract_efficiency_indicators(soup),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados do StatusInvest para {ticker}: {str(e)}")
            raise

    def _extract_price_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai dados de preço"""
        data = {}
        try:
            price_elem = soup.find('div', class_='value')
            if price_elem:
                price_text = price_elem.get_text(strip=True).replace('R$', '').replace(',', '.')
                data['price'] = float(price_text)
        except Exception as e:
            logger.warning(f"Erro ao extrair preço: {str(e)}")
        return data

    def _extract_valuation_indicators(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai indicadores de valuation"""
        indicators = {}
        valuation_map = {
            'P/L': 'p_l',
            'P/VP': 'p_vp',
            'P/EBIT': 'p_ebit',
            'EV/EBIT': 'ev_ebit',
            'EV/EBITDA': 'ev_ebitda',
            'DY': 'dividend_yield',
        }

        try:
            for label, field in valuation_map.items():
                elem = soup.find('h3', string=lambda t: t and label in t)
                if elem:
                    value_elem = elem.find_next('strong')
                    if value_elem:
                        value = self._parse_value(value_elem.get_text(strip=True))
                        if value is not None:
                            indicators[field] = value
        except Exception as e:
            logger.warning(f"Erro ao extrair indicadores de valuation: {str(e)}")

        return indicators

    def _extract_profitability_indicators(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai indicadores de rentabilidade"""
        indicators = {}
        profitability_map = {
            'ROE': 'roe',
            'ROA': 'roa',
            'ROIC': 'roic',
            'MARGEM BRUTA': 'margem_bruta',
            'MARGEM EBIT': 'margem_ebit',
            'MARGEM LÍQUIDA': 'margem_liquida',
        }

        try:
            for label, field in profitability_map.items():
                elem = soup.find('h3', string=lambda t: t and label.upper() in (t.upper() if t else ''))
                if elem:
                    value_elem = elem.find_next('strong')
                    if value_elem:
                        value = self._parse_value(value_elem.get_text(strip=True))
                        if value is not None:
                            indicators[field] = value
        except Exception as e:
            logger.warning(f"Erro ao extrair indicadores de rentabilidade: {str(e)}")

        return indicators

    def _extract_debt_indicators(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai indicadores de endividamento"""
        indicators = {}
        debt_map = {
            'DÍV. LÍQUIDA/PL': 'divida_liquida_patrimonio',
            'DÍV. LÍQUIDA/EBITDA': 'divida_liquida_ebitda',
        }

        try:
            for label, field in debt_map.items():
                elem = soup.find('h3', string=lambda t: t and label in (t if t else ''))
                if elem:
                    value_elem = elem.find_next('strong')
                    if value_elem:
                        value = self._parse_value(value_elem.get_text(strip=True))
                        if value is not None:
                            indicators[field] = value
        except Exception as e:
            logger.warning(f"Erro ao extrair indicadores de endividamento: {str(e)}")

        return indicators

    def _extract_efficiency_indicators(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai indicadores de eficiência"""
        indicators = {}
        # Implementar lógica específica conforme layout do site
        return indicators

    def _parse_value(self, value: str) -> Any:
        """
        Parse de valor do StatusInvest

        Args:
            value: Valor como string

        Returns:
            Valor convertido
        """
        if not value or value == '-' or value == 'N/A':
            return None

        # Remove caracteres especiais
        value = value.replace('R$', '').replace('%', '').replace('.', '').replace(',', '.').strip()

        # Trata multiplicadores
        multipliers = {'B': 1e9, 'M': 1e6, 'K': 1e3}
        for suffix, mult in multipliers.items():
            if value.endswith(suffix):
                try:
                    return float(value[:-1]) * mult
                except ValueError:
                    return None

        try:
            return float(value)
        except ValueError:
            return value

    def get_required_fields(self) -> List[str]:
        """Campos obrigatórios"""
        return ['ticker', 'price']
