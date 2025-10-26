"""
Scraper para InvestSite (investsite.com.br)
Não requer autenticação
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
import requests
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings


class InvestSiteScraper(BaseScraper):
    """
    Scraper para InvestSite
    """

    def __init__(self):
        super().__init__(source_name="investsite", requires_auth=False)
        self.base_url = "https://investsite.com.br"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

    async def authenticate(self) -> bool:
        """
        Não requer autenticação

        Returns:
            True (sempre)
        """
        return True

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados do InvestSite

        Args:
            ticker: Código do ativo

        Returns:
            Dados coletados
        """
        self._respect_rate_limit()

        try:
            # Acessa página do ativo
            url = f"{self.base_url}/acoes/{ticker.lower()}"
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extrai dados
            data = {
                'ticker': ticker,
                'source': 'investsite',
                **self._extract_price_data(soup),
                **self._extract_valuation_indicators(soup),
                **self._extract_profitability_indicators(soup),
                **self._extract_debt_indicators(soup),
                **self._extract_growth_indicators(soup),
                **self._extract_balance_sheet_data(soup),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados do InvestSite para {ticker}: {str(e)}")
            raise

    def _extract_price_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai dados de preço"""
        data = {}
        try:
            # InvestSite usa classe stock-price ou similar
            price_elem = soup.find(['div', 'span'], class_=lambda c: c and ('price' in c.lower() or 'cotacao' in c.lower()))
            if price_elem:
                price_text = price_elem.get_text(strip=True).replace('R$', '').replace(',', '.')
                # Remove qualquer texto extra
                import re
                price_match = re.search(r'[\d,.]+', price_text)
                if price_match:
                    data['price'] = float(price_match.group().replace(',', '.'))

            # Valor de mercado
            market_cap_elem = soup.find(['div', 'span', 'td'], string=lambda t: t and 'Valor de Mercado' in t)
            if market_cap_elem:
                value_elem = market_cap_elem.find_next(['div', 'span', 'td', 'strong'])
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
            'P/Ativo': 'p_ativo',
            'EV/EBIT': 'ev_ebit',
            'EV/EBITDA': 'ev_ebitda',
            'PSR': 'psr',
            'P/Cap Giro': 'p_capital_giro',
            'P/Ativo Circ Liq': 'p_ativo_circulante_liquido',
        }

        try:
            for label, field in valuation_map.items():
                elem = soup.find(['span', 'div', 'td'], string=lambda t: t and label in t)
                if elem:
                    value_elem = elem.find_next(['span', 'div', 'td', 'strong'])
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
                elem = soup.find(['span', 'div', 'td'], string=lambda t: t and label in (t if t else ''))
                if elem:
                    value_elem = elem.find_next(['span', 'div', 'td', 'strong'])
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
            'Dívida Líquida/Ativo': 'divida_liquida_ativo',
            'Liquidez Corrente': 'liquidez_corrente',
            'Liquidez Geral': 'liquidez_geral',
            'Dívida Bruta': 'divida_bruta',
            'Dívida Líquida': 'divida_liquida',
        }

        try:
            for label, field in debt_map.items():
                elem = soup.find(['span', 'div', 'td'], string=lambda t: t and label in (t if t else ''))
                if elem:
                    value_elem = elem.find_next(['span', 'div', 'td', 'strong'])
                    if value_elem:
                        value = self._parse_value(value_elem.get_text(strip=True))
                        if value is not None:
                            indicators[field] = value
        except Exception as e:
            logger.warning(f"Erro ao extrair indicadores de endividamento: {str(e)}")

        return indicators

    def _extract_growth_indicators(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai indicadores de crescimento"""
        indicators = {}
        growth_map = {
            'CAGR Receita 5a': 'cagr_receitas_5_anos',
            'CAGR Lucro 5a': 'cagr_lucros_5_anos',
            'Crescimento': 'crescimento_receita',
        }

        try:
            for label, field in growth_map.items():
                elem = soup.find(['span', 'div', 'td'], string=lambda t: t and label in (t if t else ''))
                if elem:
                    value_elem = elem.find_next(['span', 'div', 'td', 'strong'])
                    if value_elem:
                        value = self._parse_value(value_elem.get_text(strip=True))
                        if value is not None:
                            indicators[field] = value
        except Exception as e:
            logger.warning(f"Erro ao extrair indicadores de crescimento: {str(e)}")

        return indicators

    def _extract_balance_sheet_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai dados do balanço patrimonial"""
        balance_data = {}
        balance_map = {
            'Ativo Total': 'ativo_total',
            'Passivo Total': 'passivo_total',
            'Patrimônio Líquido': 'patrimonio_liquido',
            'Ativo Circulante': 'ativo_circulante',
            'Disponibilidades': 'disponibilidades',
        }

        try:
            for label, field in balance_map.items():
                elem = soup.find(['span', 'div', 'td'], string=lambda t: t and label in (t if t else ''))
                if elem:
                    value_elem = elem.find_next(['span', 'div', 'td', 'strong'])
                    if value_elem:
                        value = self._parse_value(value_elem.get_text(strip=True))
                        if value is not None:
                            balance_data[field] = value
        except Exception as e:
            logger.warning(f"Erro ao extrair dados do balanço: {str(e)}")

        return balance_data

    def _parse_value(self, value: str) -> Any:
        """
        Parse de valor do InvestSite

        Args:
            value: Valor como string

        Returns:
            Valor convertido
        """
        if not value or value == '-' or value == 'N/A' or value == '—':
            return None

        # Remove caracteres especiais
        value = value.replace('R$', '').replace('%', '').replace('.', '').replace(',', '.').strip()

        # Trata multiplicadores
        multipliers = {
            'Trilhão': 1e12,
            'Tri': 1e12,
            'T': 1e12,
            'Bilhão': 1e9,
            'Bi': 1e9,
            'B': 1e9,
            'Milhão': 1e6,
            'Mi': 1e6,
            'M': 1e6,
            'Mil': 1e3,
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
