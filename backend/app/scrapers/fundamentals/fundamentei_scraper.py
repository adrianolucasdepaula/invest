"""
Scraper para Fundamentei (fundamentei.com)
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


class FundamenteiScraper(BaseScraper):
    """
    Scraper para Fundamentei
    """

    def __init__(self):
        super().__init__(source_name="fundamentei", requires_auth=True)
        self.base_url = "https://fundamentei.com"
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
                EC.presence_of_element_located((By.CSS_SELECTOR, "button[data-provider='google'], .btn-google, a.google-login"))
            )
            google_btn.click()

            # Aguarda redirecionamento e login manual do usuário
            # Em produção, isso seria automatizado com credenciais
            logger.info("Aguardando login manual com Google no Fundamentei...")
            WebDriverWait(self.driver, 120).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".user-menu, .header-user, nav.user-logged"))
            )

            self.is_authenticated = True
            logger.info("Login no Fundamentei realizado com sucesso")
            return True

        except Exception as e:
            logger.error(f"Erro ao autenticar no Fundamentei: {str(e)}")
            return False

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados do Fundamentei

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
                EC.presence_of_element_located((By.CSS_SELECTOR, ".stock-info, .card, .indicators-grid"))
            )

            # Extrai HTML
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            # Extrai dados
            data = {
                'ticker': ticker,
                'source': 'fundamentei',
                **self._extract_price_data(soup),
                **self._extract_valuation_indicators(soup),
                **self._extract_profitability_indicators(soup),
                **self._extract_debt_indicators(soup),
                **self._extract_efficiency_indicators(soup),
                **self._extract_dividend_data(soup),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados do Fundamentei para {ticker}: {str(e)}")
            raise

    def _extract_price_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai dados de preço"""
        data = {}
        try:
            # Fundamentei usa classe stock-price ou similar
            price_elem = soup.find(['div', 'span'], class_=lambda c: c and ('price' in c.lower() or 'valor' in c.lower()))
            if price_elem:
                price_text = price_elem.get_text(strip=True).replace('R$', '').replace(',', '.')
                # Remove qualquer texto extra
                import re
                price_match = re.search(r'[\d,.]+', price_text)
                if price_match:
                    data['price'] = float(price_match.group().replace(',', '.'))

            # Tenta extrair valor de mercado
            market_cap_elem = soup.find(['div', 'span'], string=lambda t: t and 'Valor de Mercado' in t)
            if market_cap_elem:
                value_elem = market_cap_elem.find_next(['div', 'span', 'strong'])
                if value_elem:
                    market_cap = self._parse_value(value_elem.get_text(strip=True))
                    if market_cap:
                        data['market_cap'] = market_cap
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
            'PSR': 'psr',
            'P/Ativo': 'p_ativo',
            'P/Cap. Giro': 'p_capital_giro',
            'P/Ativo Circ. Liq.': 'p_ativo_circulante_liquido',
        }

        try:
            for label, field in valuation_map.items():
                # Procura pelo título do indicador
                elem = soup.find(['span', 'div', 'td', 'label'], string=lambda t: t and label in t)
                if elem:
                    # Procura o valor nas proximidades
                    value_elem = elem.find_next(['span', 'div', 'td', 'strong', 'b'])
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
            'Margem Bruta': 'margem_bruta',
            'Margem EBIT': 'margem_ebit',
            'Margem EBITDA': 'margem_ebitda',
            'Margem Líquida': 'margem_liquida',
            'Giro Ativos': 'giro_ativos',
            'LPA': 'lpa',
            'VPA': 'vpa',
        }

        try:
            for label, field in profitability_map.items():
                elem = soup.find(['span', 'div', 'td', 'label'], string=lambda t: t and label in (t if t else ''))
                if elem:
                    value_elem = elem.find_next(['span', 'div', 'td', 'strong', 'b'])
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
            'Dívida Líquida/PL': 'divida_liquida_patrimonio',
            'Dívida Líquida/EBITDA': 'divida_liquida_ebitda',
            'Liquidez Corrente': 'liquidez_corrente',
            'Liquidez Geral': 'liquidez_geral',
            'Dívida Bruta': 'divida_bruta',
            'Dívida Líquida': 'divida_liquida',
            'PL': 'patrimonio_liquido',
        }

        try:
            for label, field in debt_map.items():
                elem = soup.find(['span', 'div', 'td', 'label'], string=lambda t: t and label in (t if t else ''))
                if elem:
                    value_elem = elem.find_next(['span', 'div', 'td', 'strong', 'b'])
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
        efficiency_map = {
            'Giro Ativos': 'giro_ativos',
            'Receita Líquida': 'receita_liquida',
            'Lucro Bruto': 'lucro_bruto',
            'EBIT': 'ebit',
            'EBITDA': 'ebitda',
            'Lucro Líquido': 'lucro_liquido',
        }

        try:
            for label, field in efficiency_map.items():
                elem = soup.find(['span', 'div', 'td', 'label'], string=lambda t: t and label in (t if t else ''))
                if elem:
                    value_elem = elem.find_next(['span', 'div', 'td', 'strong', 'b'])
                    if value_elem:
                        value = self._parse_value(value_elem.get_text(strip=True))
                        if value is not None:
                            indicators[field] = value
        except Exception as e:
            logger.warning(f"Erro ao extrair indicadores de eficiência: {str(e)}")

        return indicators

    def _extract_dividend_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai dados de dividendos"""
        dividend_data = {}
        dividend_map = {
            'Dividend Yield': 'dividend_yield',
            'DY': 'dividend_yield',
            'Payout': 'payout',
            'Dividendos/Ação': 'dividendo_por_acao',
        }

        try:
            for label, field in dividend_map.items():
                elem = soup.find(['span', 'div', 'td', 'label'], string=lambda t: t and label in (t if t else ''))
                if elem:
                    value_elem = elem.find_next(['span', 'div', 'td', 'strong', 'b'])
                    if value_elem:
                        value = self._parse_value(value_elem.get_text(strip=True))
                        if value is not None:
                            dividend_data[field] = value
        except Exception as e:
            logger.warning(f"Erro ao extrair dados de dividendos: {str(e)}")

        return dividend_data

    def _parse_value(self, value: str) -> Any:
        """
        Parse de valor do Fundamentei

        Args:
            value: Valor como string

        Returns:
            Valor convertido
        """
        if not value or value == '-' or value == 'N/A' or value == '—' or value == 'n/d':
            return None

        # Remove caracteres especiais
        value = value.replace('R$', '').replace('%', '').replace('.', '').replace(',', '.').strip()

        # Trata multiplicadores (T, B, M, K, Tri, Bi, Mi)
        multipliers = {
            'Tri': 1e12,
            'T': 1e12,
            'Bi': 1e9,
            'B': 1e9,
            'Mi': 1e6,
            'M': 1e6,
            'mil': 1e3,
            'K': 1e3,
        }
        for suffix, mult in multipliers.items():
            if value.endswith(suffix):
                try:
                    return float(value[:-len(suffix)].strip()) * mult
                except ValueError:
                    return None

        try:
            return float(value)
        except ValueError:
            return value

    def get_required_fields(self) -> List[str]:
        """Campos obrigatórios"""
        return ['ticker', 'source']
