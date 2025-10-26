"""
Scraper para Binance (binance.com)
Usa API pública da Binance
Não requer autenticação para dados públicos
Coleta dados de criptomoedas e pares de trading
"""
from typing import Dict, Any, List
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings
import requests


class BinanceScraper(BaseScraper):
    """
    Scraper para Binance via API pública
    """

    def __init__(self):
        super().__init__(source_name="binance", requires_auth=False)
        self.base_url = "https://api.binance.com/api/v3"
        self.session = requests.Session()

    async def authenticate(self) -> bool:
        """
        Não requer autenticação para dados públicos

        Returns:
            True (sempre)
        """
        return True

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados de criptomoeda da Binance

        Args:
            ticker: Par de trading (ex: BTCUSDT, ETHUSDT, BTCBRL)

        Returns:
            Dados do par de trading
        """
        self._respect_rate_limit()

        try:
            # Garante formato correto (ex: BTCUSDT)
            if not ticker.endswith('USDT') and not ticker.endswith('BRL'):
                ticker = f"{ticker}USDT"

            data = {
                'ticker': ticker,
                'source': 'binance',
                **self._get_ticker_24h(ticker),
                **self._get_ticker_price(ticker),
                **self._get_orderbook_depth(ticker),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados da Binance para {ticker}: {str(e)}")
            raise

    def _get_ticker_24h(self, ticker: str) -> Dict[str, Any]:
        """Obtém estatísticas 24h"""
        stats = {}

        try:
            url = f"{self.base_url}/ticker/24hr"
            params = {'symbol': ticker.upper()}

            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            stats['price'] = float(data.get('lastPrice', 0))
            stats['price_change'] = float(data.get('priceChange', 0))
            stats['price_change_percent'] = float(data.get('priceChangePercent', 0))
            stats['high_24h'] = float(data.get('highPrice', 0))
            stats['low_24h'] = float(data.get('lowPrice', 0))
            stats['volume_24h'] = float(data.get('volume', 0))
            stats['quote_volume_24h'] = float(data.get('quoteVolume', 0))
            stats['trades_count'] = int(data.get('count', 0))
            stats['bid_price'] = float(data.get('bidPrice', 0))
            stats['ask_price'] = float(data.get('askPrice', 0))
            stats['open_price'] = float(data.get('openPrice', 0))

        except Exception as e:
            logger.warning(f"Erro ao obter estatísticas 24h: {str(e)}")

        return stats

    def _get_ticker_price(self, ticker: str) -> Dict[str, Any]:
        """Obtém preço atual"""
        price_data = {}

        try:
            url = f"{self.base_url}/ticker/price"
            params = {'symbol': ticker.upper()}

            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            price_data['current_price'] = float(data.get('price', 0))

        except Exception as e:
            logger.warning(f"Erro ao obter preço: {str(e)}")

        return price_data

    def _get_orderbook_depth(self, ticker: str) -> Dict[str, Any]:
        """Obtém profundidade do livro de ofertas"""
        depth_data = {}

        try:
            url = f"{self.base_url}/depth"
            params = {
                'symbol': ticker.upper(),
                'limit': 5,  # Top 5 bids/asks
            }

            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            # Melhores ofertas de compra
            if 'bids' in data and len(data['bids']) > 0:
                best_bid = data['bids'][0]
                depth_data['best_bid_price'] = float(best_bid[0])
                depth_data['best_bid_quantity'] = float(best_bid[1])

            # Melhores ofertas de venda
            if 'asks' in data and len(data['asks']) > 0:
                best_ask = data['asks'][0]
                depth_data['best_ask_price'] = float(best_ask[0])
                depth_data['best_ask_quantity'] = float(best_ask[1])

            # Spread
            if 'best_bid_price' in depth_data and 'best_ask_price' in depth_data:
                spread = depth_data['best_ask_price'] - depth_data['best_bid_price']
                spread_percent = (spread / depth_data['best_ask_price']) * 100
                depth_data['spread'] = spread
                depth_data['spread_percent'] = spread_percent

        except Exception as e:
            logger.warning(f"Erro ao obter orderbook depth: {str(e)}")

        return depth_data

    def get_required_fields(self) -> List[str]:
        """Campos obrigatórios"""
        return ['ticker', 'source']
