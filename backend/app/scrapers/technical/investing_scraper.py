"""
Scraper para Investing.com (br.investing.com)
Requer login com Google
Coleta dados técnicos, preços, e informações de mercado
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


class InvestingScraper(BaseScraper):
    """
    Scraper para Investing.com
    """

    def __init__(self):
        super().__init__(source_name="investing", requires_auth=True)
        self.base_url = "https://br.investing.com"
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
                EC.presence_of_element_located((By.CSS_SELECTOR, "button.google, .googleSignUp, [data-provider='google']"))
            )
            google_btn.click()

            # Aguarda redirecionamento e login manual do usuário
            logger.info("Aguardando login manual com Google no Investing.com...")
            WebDriverWait(self.driver, 120).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".userAccount, .logged-in, .user-logged"))
            )

            self.is_authenticated = True
            logger.info("Login no Investing.com realizado com sucesso")
            return True

        except Exception as e:
            logger.error(f"Erro ao autenticar no Investing.com: {str(e)}")
            return False

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados técnicos do Investing.com

        Args:
            ticker: Código do ativo (ex: PETR4, VALE3)

        Returns:
            Dados técnicos coletados
        """
        if not self.is_authenticated:
            await self.authenticate()

        self._respect_rate_limit()

        try:
            # Investing.com usa formato ticker-lower case para ações brasileiras
            url = f"{self.base_url}/equities/{ticker.lower()}-technical"

            self.driver.get(url)

            # Aguarda carregamento dos dados técnicos
            WebDriverWait(self.driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, ".technicalSummary, .technical-summary"))
            )

            # Pequeno delay para garantir carregamento completo
            time.sleep(2)

            # Extrai HTML
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            # Extrai dados
            data = {
                'ticker': ticker,
                'source': 'investing',
                **self._extract_price_data(soup),
                **self._extract_technical_indicators(soup),
                **self._extract_moving_averages(soup),
                **self._extract_support_resistance(soup),
                **self._extract_performance_data(soup),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados técnicos do Investing.com para {ticker}: {str(e)}")
            raise

    def _extract_price_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai dados de preço"""
        price_data = {}
        try:
            # Preço atual
            price_elem = soup.find(['span', 'div'], attrs={'data-test': 'instrument-price-last'})
            if not price_elem:
                price_elem = soup.find(['span'], class_=lambda c: c and 'last-price' in c)

            if price_elem:
                price = self._parse_value(price_elem.get_text(strip=True))
                if price:
                    price_data['price'] = price

            # Variação
            change_elem = soup.find(['span'], attrs={'data-test': 'instrument-price-change'})
            if change_elem:
                change = self._parse_value(change_elem.get_text(strip=True))
                if change:
                    price_data['change'] = change

            # Variação %
            change_pct_elem = soup.find(['span'], attrs={'data-test': 'instrument-price-change-percent'})
            if change_pct_elem:
                change_pct = self._parse_value(change_pct_elem.get_text(strip=True).replace('%', ''))
                if change_pct:
                    price_data['change_percent'] = change_pct

            # Volume
            volume_elem = soup.find(['dd', 'div'], string=lambda t: t and 'Volume' in t if t else False)
            if volume_elem:
                value_elem = volume_elem.find_next(['dd', 'span', 'div'])
                if value_elem:
                    volume = self._parse_value(value_elem.get_text(strip=True))
                    if volume:
                        price_data['volume'] = volume

        except Exception as e:
            logger.warning(f"Erro ao extrair dados de preço: {str(e)}")

        return price_data

    def _extract_technical_indicators(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai indicadores técnicos"""
        indicators = {}

        try:
            # Resumo técnico (Strong Buy, Buy, Neutral, Sell, Strong Sell)
            summary_elem = soup.find(['div', 'span'], class_=lambda c: c and 'technicalSummary' in c)
            if summary_elem:
                recommendation = summary_elem.get_text(strip=True)
                indicators['technical_recommendation'] = recommendation

            # RSI
            rsi_elem = soup.find(['td', 'div'], string=lambda t: t and 'RSI' in t if t else False)
            if rsi_elem:
                value_elem = rsi_elem.find_next(['td', 'span'])
                if value_elem:
                    rsi = self._parse_value(value_elem.get_text(strip=True))
                    if rsi:
                        indicators['rsi'] = rsi

            # MACD
            macd_elem = soup.find(['td', 'div'], string=lambda t: t and 'MACD' in t if t else False)
            if macd_elem:
                value_elem = macd_elem.find_next(['td', 'span'])
                if value_elem:
                    macd = self._parse_value(value_elem.get_text(strip=True))
                    if macd:
                        indicators['macd'] = macd

            # Stochastic
            stoch_elem = soup.find(['td', 'div'], string=lambda t: t and 'Stochastic' in t if t else False)
            if stoch_elem:
                value_elem = stoch_elem.find_next(['td', 'span'])
                if value_elem:
                    stoch = self._parse_value(value_elem.get_text(strip=True))
                    if stoch:
                        indicators['stochastic'] = stoch

            # CCI
            cci_elem = soup.find(['td', 'div'], string=lambda t: t and 'CCI' in t if t else False)
            if cci_elem:
                value_elem = cci_elem.find_next(['td', 'span'])
                if value_elem:
                    cci = self._parse_value(value_elem.get_text(strip=True))
                    if cci:
                        indicators['cci'] = cci

        except Exception as e:
            logger.warning(f"Erro ao extrair indicadores técnicos: {str(e)}")

        return indicators

    def _extract_moving_averages(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai médias móveis"""
        ma_data = {}
        ma_periods = [5, 10, 20, 50, 100, 200]

        try:
            for period in ma_periods:
                # Procura SMA
                sma_elem = soup.find(['td'], string=lambda t: t and f'SMA({period})' in t or f'SMA {period}' in t if t else False)
                if sma_elem:
                    value_elem = sma_elem.find_next(['td', 'span'])
                    if value_elem:
                        sma = self._parse_value(value_elem.get_text(strip=True))
                        if sma:
                            ma_data[f'sma_{period}'] = sma

                # Procura EMA
                ema_elem = soup.find(['td'], string=lambda t: t and f'EMA({period})' in t or f'EMA {period}' in t if t else False)
                if ema_elem:
                    value_elem = ema_elem.find_next(['td', 'span'])
                    if value_elem:
                        ema = self._parse_value(value_elem.get_text(strip=True))
                        if ema:
                            ma_data[f'ema_{period}'] = ema

        except Exception as e:
            logger.warning(f"Erro ao extrair médias móveis: {str(e)}")

        return ma_data

    def _extract_support_resistance(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai níveis de suporte e resistência"""
        levels = {}

        try:
            # Pivot points
            pivot_levels = ['S3', 'S2', 'S1', 'PP', 'R1', 'R2', 'R3']

            for level in pivot_levels:
                elem = soup.find(['td'], string=lambda t: t and t.strip() == level if t else False)
                if elem:
                    value_elem = elem.find_next(['td', 'span'])
                    if value_elem:
                        value = self._parse_value(value_elem.get_text(strip=True))
                        if value:
                            levels[f'pivot_{level.lower()}'] = value

        except Exception as e:
            logger.warning(f"Erro ao extrair suporte/resistência: {str(e)}")

        return levels

    def _extract_performance_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai dados de performance (retornos históricos)"""
        performance = {}
        periods = {
            '1 Dia': 'return_1d',
            '1 Semana': 'return_1w',
            '1 Mês': 'return_1m',
            '3 Meses': 'return_3m',
            '6 Meses': 'return_6m',
            'YTD': 'return_ytd',
            '1 Ano': 'return_1y',
            '3 Anos': 'return_3y',
        }

        try:
            for label, field in periods.items():
                elem = soup.find(['td', 'span'], string=lambda t: t and label in t if t else False)
                if elem:
                    value_elem = elem.find_next(['td', 'span'])
                    if value_elem:
                        ret = self._parse_value(value_elem.get_text(strip=True).replace('%', ''))
                        if ret is not None:
                            performance[field] = ret

        except Exception as e:
            logger.warning(f"Erro ao extrair performance: {str(e)}")

        return performance

    def _parse_value(self, value: str) -> Any:
        """
        Parse de valor do Investing.com

        Args:
            value: Valor como string

        Returns:
            Valor convertido
        """
        if not value or value == '-' or value == 'N/A':
            return None

        # Remove caracteres especiais mas mantém sinais negativos
        value = value.replace(',', '').replace('+', '').strip()

        # Trata multiplicadores (K, M, B)
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
            return None

    def get_required_fields(self) -> List[str]:
        """Campos obrigatórios"""
        return ['ticker', 'source']
