"""
Scraper para BRAPI (brapi.dev)
API para dados de ações brasileiras
"""
from typing import Dict, Any, List
import requests
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings


class BRAPIScraper(BaseScraper):
    """
    Scraper para BRAPI API
    """

    def __init__(self):
        super().__init__(source_name="brapi", requires_auth=True)
        self.base_url = settings.BRAPI_BASE_URL
        self.api_token = settings.BRAPI_TOKEN

    async def authenticate(self) -> bool:
        """
        Valida o token da API

        Returns:
            True se token é válido
        """
        try:
            url = f"{self.base_url}/quote/list"
            headers = {"Authorization": f"Bearer {self.api_token}"}

            response = requests.get(url, headers=headers, timeout=10)
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Erro ao validar token BRAPI: {str(e)}")
            return False

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados via BRAPI

        Args:
            ticker: Código do ativo

        Returns:
            Dicionário com dados do ativo
        """
        self._respect_rate_limit()

        try:
            # Coleta dados de cotação
            quote_data = await self._get_quote(ticker)

            # Coleta dados fundamentalistas
            fundamental_data = await self._get_fundamentals(ticker)

            # Combina os dados
            data = {
                **quote_data,
                **fundamental_data,
                'ticker': ticker
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados da BRAPI para {ticker}: {str(e)}")
            raise

    async def _get_quote(self, ticker: str) -> Dict[str, Any]:
        """
        Obtém dados de cotação

        Args:
            ticker: Código do ativo

        Returns:
            Dados de cotação
        """
        url = f"{self.base_url}/quote/{ticker}"
        params = {"token": self.api_token}

        response = requests.get(url, params=params, timeout=settings.SCRAPING_TIMEOUT)
        response.raise_for_status()

        data = response.json()

        if 'results' not in data or not data['results']:
            return {}

        result = data['results'][0]

        return {
            'price': result.get('regularMarketPrice'),
            'market_cap': result.get('marketCap'),
            'volume': result.get('regularMarketVolume'),
            'average_volume': result.get('averageDailyVolume10Day'),
            'previous_close': result.get('regularMarketPreviousClose'),
            'open': result.get('regularMarketOpen'),
            'day_high': result.get('regularMarketDayHigh'),
            'day_low': result.get('regularMarketDayLow'),
            'year_high': result.get('fiftyTwoWeekHigh'),
            'year_low': result.get('fiftyTwoWeekLow'),
            'price_change': result.get('regularMarketChange'),
            'price_change_percent': result.get('regularMarketChangePercent'),
            'name': result.get('longName') or result.get('shortName'),
            'sector': result.get('sector'),
            'currency': result.get('currency'),
            'exchange': result.get('exchange'),
        }

    async def _get_fundamentals(self, ticker: str) -> Dict[str, Any]:
        """
        Obtém dados fundamentalistas

        Args:
            ticker: Código do ativo

        Returns:
            Dados fundamentalistas
        """
        url = f"{self.base_url}/quote/{ticker}"
        params = {
            "token": self.api_token,
            "fundamental": "true"
        }

        try:
            response = requests.get(url, params=params, timeout=settings.SCRAPING_TIMEOUT)
            response.raise_for_status()

            data = response.json()

            if 'results' not in data or not data['results']:
                return {}

            result = data['results'][0]
            summary = result.get('summaryProfile', {})
            financials = result.get('financialData', {})
            valuation = result.get('defaultKeyStatistics', {})

            return {
                # Informações da empresa
                'sector': summary.get('sector'),
                'subsector': summary.get('industry'),
                'employees': summary.get('fullTimeEmployees'),
                'description': summary.get('longBusinessSummary'),

                # Indicadores de Valuation
                'p_l': valuation.get('trailingPE') or valuation.get('forwardPE'),
                'p_vp': valuation.get('priceToBook'),
                'ev_ebitda': valuation.get('enterpriseToEbitda'),
                'peg_ratio': valuation.get('pegRatio'),
                'dividend_yield': valuation.get('dividendYield'),

                # Rentabilidade
                'roe': financials.get('returnOnEquity'),
                'roa': financials.get('returnOnAssets'),
                'margem_bruta': financials.get('grossMargins'),
                'margem_ebit': financials.get('ebitdaMargins'),
                'margem_liquida': financials.get('profitMargins'),

                # Endividamento
                'divida_liquida': financials.get('totalDebt'),
                'patrimonio_liquido': financials.get('totalEquity'),

                # Receitas e Lucros
                'receita_liquida': financials.get('totalRevenue'),
                'ebitda': financials.get('ebitda'),
                'lucro_liquido': financials.get('netIncomeToCommon'),

                # Crescimento
                'crescimento_receita': financials.get('revenueGrowth'),
                'crescimento_lucro': financials.get('earningsGrowth'),

                # Liquidez
                'liquidez_corrente': financials.get('currentRatio'),
                'liquidez_seca': financials.get('quickRatio'),

                # Por ação
                'lpa': valuation.get('trailingEps'),
                'vpa': valuation.get('bookValue'),

                # Free Float
                'free_float': valuation.get('floatShares'),
            }

        except Exception as e:
            logger.warning(f"Erro ao coletar fundamentals da BRAPI para {ticker}: {str(e)}")
            return {}

    async def get_available_tickers(self) -> List[str]:
        """
        Lista todos os tickers disponíveis

        Returns:
            Lista de tickers
        """
        url = f"{self.base_url}/quote/list"
        params = {"token": self.api_token}

        try:
            response = requests.get(url, params=params, timeout=settings.SCRAPING_TIMEOUT)
            response.raise_for_status()

            data = response.json()
            return data.get('stocks', [])

        except Exception as e:
            logger.error(f"Erro ao listar tickers da BRAPI: {str(e)}")
            return []

    def get_required_fields(self) -> List[str]:
        """
        Campos obrigatórios

        Returns:
            Lista de campos obrigatórios
        """
        return ['ticker', 'price']

    async def get_historical_data(self, ticker: str, interval: str = "1d", range_period: str = "1y") -> Dict[str, Any]:
        """
        Obtém dados históricos

        Args:
            ticker: Código do ativo
            interval: Intervalo (1d, 1wk, 1mo)
            range_period: Período (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)

        Returns:
            Dados históricos
        """
        url = f"{self.base_url}/quote/{ticker}"
        params = {
            "token": self.api_token,
            "range": range_period,
            "interval": interval
        }

        try:
            response = requests.get(url, params=params, timeout=settings.SCRAPING_TIMEOUT)
            response.raise_for_status()

            data = response.json()

            if 'results' not in data or not data['results']:
                return {}

            result = data['results'][0]
            return {
                'ticker': ticker,
                'historical_data': result.get('historicalDataPrice', [])
            }

        except Exception as e:
            logger.error(f"Erro ao coletar dados históricos da BRAPI para {ticker}: {str(e)}")
            return {}
