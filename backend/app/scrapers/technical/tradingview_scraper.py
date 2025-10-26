"""
Scraper para TradingView (tradingview.com)
Requer login com Google
Coleta indicadores técnicos e análise de gráficos
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings
import time


class TradingViewScraper(BaseScraper):
    """
    Scraper para TradingView
    """

    def __init__(self):
        super().__init__(source_name="tradingview", requires_auth=True)
        self.base_url = "https://www.tradingview.com"
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
            self.driver.get(f"{self.base_url}/accounts/signin/")

            # Aguarda e clica no botão de login com Google
            google_btn = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "button[name='Google'], .google-sign-in"))
            )
            google_btn.click()

            # Aguarda redirecionamento e login manual do usuário
            logger.info("Aguardando login manual com Google no TradingView...")
            WebDriverWait(self.driver, 120).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".tv-header__user-menu-button, .header-user-menu"))
            )

            self.is_authenticated = True
            logger.info("Login no TradingView realizado com sucesso")
            return True

        except Exception as e:
            logger.error(f"Erro ao autenticar no TradingView: {str(e)}")
            return False

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados técnicos do TradingView

        Args:
            ticker: Código do ativo (ex: PETR4, VALE3)

        Returns:
            Dados técnicos coletados
        """
        if not self.is_authenticated:
            await self.authenticate()

        self._respect_rate_limit()

        try:
            # TradingView usa formato BMFBOVESPA:TICKER para ações brasileiras
            tv_ticker = f"BMFBOVESPA:{ticker.upper()}"
            url = f"{self.base_url}/symbols/{tv_ticker}/technicals/"

            self.driver.get(url)

            # Aguarda carregamento dos indicadores técnicos
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".speedometerSignal, .technicals-root"))
            )

            # Pequeno delay para garantir carregamento completo
            time.sleep(2)

            # Extrai HTML
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            # Extrai dados
            data = {
                'ticker': ticker,
                'source': 'tradingview',
                **self._extract_technical_summary(soup),
                **self._extract_moving_averages(soup),
                **self._extract_oscillators(soup),
                **self._extract_pivot_points(soup),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados técnicos do TradingView para {ticker}: {str(e)}")
            raise

    def _extract_technical_summary(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai resumo técnico geral"""
        summary = {}
        try:
            # TradingView exibe resumo: Strong Buy, Buy, Neutral, Sell, Strong Sell
            summary_elem = soup.find(['div', 'span'], class_=lambda c: c and 'speedometerSignal' in c)
            if summary_elem:
                recommendation = summary_elem.get_text(strip=True)
                summary['technical_recommendation'] = recommendation

            # Conta de indicadores
            buy_count = soup.find(['span'], string=lambda t: t and 'Buy' in t and 'indicators' in t)
            if buy_count:
                import re
                numbers = re.findall(r'\d+', buy_count.get_text())
                if numbers:
                    summary['buy_indicators'] = int(numbers[0])

            sell_count = soup.find(['span'], string=lambda t: t and 'Sell' in t and 'indicators' in t)
            if sell_count:
                import re
                numbers = re.findall(r'\d+', sell_count.get_text())
                if numbers:
                    summary['sell_indicators'] = int(numbers[0])

            neutral_count = soup.find(['span'], string=lambda t: t and 'Neutral' in t and 'indicators' in t)
            if neutral_count:
                import re
                numbers = re.findall(r'\d+', neutral_count.get_text())
                if numbers:
                    summary['neutral_indicators'] = int(numbers[0])

        except Exception as e:
            logger.warning(f"Erro ao extrair resumo técnico: {str(e)}")

        return summary

    def _extract_moving_averages(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai médias móveis"""
        ma_data = {}
        ma_map = {
            'EMA (10)': 'ema_10',
            'SMA (10)': 'sma_10',
            'EMA (20)': 'ema_20',
            'SMA (20)': 'sma_20',
            'EMA (50)': 'ema_50',
            'SMA (50)': 'sma_50',
            'EMA (100)': 'ema_100',
            'SMA (100)': 'sma_100',
            'EMA (200)': 'ema_200',
            'SMA (200)': 'sma_200',
        }

        try:
            for label, field in ma_map.items():
                # Procura linha da tabela com o indicador
                elem = soup.find(['td', 'span'], string=lambda t: t and label in t)
                if elem:
                    # Procura o valor e ação nas células seguintes
                    row = elem.find_parent('tr')
                    if row:
                        cells = row.find_all('td')
                        if len(cells) >= 3:
                            # Segunda célula geralmente tem o valor
                            value_text = cells[1].get_text(strip=True)
                            value = self._parse_value(value_text)
                            if value:
                                ma_data[field] = value

                            # Terceira célula tem a ação (Buy/Sell/Neutral)
                            action = cells[2].get_text(strip=True)
                            ma_data[f"{field}_signal"] = action

        except Exception as e:
            logger.warning(f"Erro ao extrair médias móveis: {str(e)}")

        return ma_data

    def _extract_oscillators(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai osciladores técnicos"""
        oscillators = {}
        oscillator_map = {
            'RSI (14)': 'rsi_14',
            'Stochastic %K': 'stochastic_k',
            'CCI (20)': 'cci_20',
            'ADX (14)': 'adx_14',
            'AO': 'awesome_oscillator',
            'Momentum (10)': 'momentum_10',
            'MACD': 'macd',
            'Williams %R': 'williams_r',
            'Bull Bear Power': 'bull_bear_power',
            'UO': 'ultimate_oscillator',
        }

        try:
            for label, field in oscillator_map.items():
                elem = soup.find(['td', 'span'], string=lambda t: t and label in t)
                if elem:
                    row = elem.find_parent('tr')
                    if row:
                        cells = row.find_all('td')
                        if len(cells) >= 3:
                            value_text = cells[1].get_text(strip=True)
                            value = self._parse_value(value_text)
                            if value:
                                oscillators[field] = value

                            action = cells[2].get_text(strip=True)
                            oscillators[f"{field}_signal"] = action

        except Exception as e:
            logger.warning(f"Erro ao extrair osciladores: {str(e)}")

        return oscillators

    def _extract_pivot_points(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai pivot points (suporte e resistência)"""
        pivots = {}
        pivot_levels = ['S3', 'S2', 'S1', 'P', 'R1', 'R2', 'R3']

        try:
            # Procura tabela de pivot points
            pivot_section = soup.find(['div', 'section'], class_=lambda c: c and 'pivot' in c.lower())
            if pivot_section:
                for level in pivot_levels:
                    elem = pivot_section.find(['td', 'span'], string=lambda t: t and t.strip() == level)
                    if elem:
                        value_elem = elem.find_next(['td', 'span'])
                        if value_elem:
                            value = self._parse_value(value_elem.get_text(strip=True))
                            if value:
                                pivots[f"pivot_{level.lower()}"] = value

        except Exception as e:
            logger.warning(f"Erro ao extrair pivot points: {str(e)}")

        return pivots

    def _parse_value(self, value: str) -> Any:
        """
        Parse de valor do TradingView

        Args:
            value: Valor como string

        Returns:
            Valor convertido
        """
        if not value or value == '—' or value == 'N/A':
            return None

        # Remove caracteres especiais mas mantém sinais negativos
        value = value.replace(',', '').strip()

        try:
            return float(value)
        except ValueError:
            return None

    def get_required_fields(self) -> List[str]:
        """Campos obrigatórios"""
        return ['ticker', 'source']
