"""
Scraper para CoinMarketCap (coinmarketcap.com)
Usa API pública
Requer API key (configurável)
Coleta dados de criptomoedas
"""
from typing import Dict, Any, List
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings
import requests


class CoinMarketCapScraper(BaseScraper):
    """
    Scraper para CoinMarketCap via API
    """

    def __init__(self):
        super().__init__(source_name="coinmarketcap", requires_auth=False)
        self.base_url = "https://pro-api.coinmarketcap.com/v1"
        self.api_key = getattr(settings, 'COINMARKETCAP_API_KEY', '')
        self.session = requests.Session()
        self.session.headers.update({
            'X-CMC_PRO_API_KEY': self.api_key,
            'Accept': 'application/json',
        })

    async def authenticate(self) -> bool:
        """
        Verifica se API key está configurada

        Returns:
            True se API key está presente
        """
        if not self.api_key:
            logger.warning("CoinMarketCap API key não configurada")
            return False
        return True

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados de criptomoeda do CoinMarketCap

        Args:
            ticker: Símbolo da criptomoeda (ex: BTC, ETH)

        Returns:
            Dados da criptomoeda
        """
        self._respect_rate_limit()

        try:
            # Busca dados da criptomoeda
            data = {
                'ticker': ticker,
                'source': 'coinmarketcap',
                **self._get_quotes(ticker),
                **self._get_metadata(ticker),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados do CoinMarketCap para {ticker}: {str(e)}")
            raise

    def _get_quotes(self, ticker: str) -> Dict[str, Any]:
        """Obtém cotações via API"""
        quotes_data = {}

        try:
            url = f"{self.base_url}/cryptocurrency/quotes/latest"
            params = {
                'symbol': ticker.upper(),
                'convert': 'USD,BRL',
            }

            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            if 'data' in data and ticker.upper() in data['data']:
                crypto_data = data['data'][ticker.upper()]

                # Dados básicos
                quotes_data['name'] = crypto_data.get('name')
                quotes_data['symbol'] = crypto_data.get('symbol')
                quotes_data['cmc_rank'] = crypto_data.get('cmc_rank')
                quotes_data['circulating_supply'] = crypto_data.get('circulating_supply')
                quotes_data['total_supply'] = crypto_data.get('total_supply')
                quotes_data['max_supply'] = crypto_data.get('max_supply')

                # Cotações em USD
                if 'quote' in crypto_data and 'USD' in crypto_data['quote']:
                    usd_quote = crypto_data['quote']['USD']
                    quotes_data['price_usd'] = usd_quote.get('price')
                    quotes_data['volume_24h_usd'] = usd_quote.get('volume_24h')
                    quotes_data['volume_change_24h'] = usd_quote.get('volume_change_24h')
                    quotes_data['percent_change_1h'] = usd_quote.get('percent_change_1h')
                    quotes_data['percent_change_24h'] = usd_quote.get('percent_change_24h')
                    quotes_data['percent_change_7d'] = usd_quote.get('percent_change_7d')
                    quotes_data['percent_change_30d'] = usd_quote.get('percent_change_30d')
                    quotes_data['market_cap_usd'] = usd_quote.get('market_cap')
                    quotes_data['market_cap_dominance'] = usd_quote.get('market_cap_dominance')

                # Cotações em BRL
                if 'quote' in crypto_data and 'BRL' in crypto_data['quote']:
                    brl_quote = crypto_data['quote']['BRL']
                    quotes_data['price_brl'] = brl_quote.get('price')
                    quotes_data['market_cap_brl'] = brl_quote.get('market_cap')

        except Exception as e:
            logger.warning(f"Erro ao obter cotações: {str(e)}")

        return quotes_data

    def _get_metadata(self, ticker: str) -> Dict[str, Any]:
        """Obtém metadados via API"""
        metadata = {}

        try:
            url = f"{self.base_url}/cryptocurrency/info"
            params = {
                'symbol': ticker.upper(),
            }

            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            if 'data' in data and ticker.upper() in data['data']:
                crypto_info = data['data'][ticker.upper()]

                metadata['description'] = crypto_info.get('description')
                metadata['category'] = crypto_info.get('category')
                metadata['logo'] = crypto_info.get('logo')

                # URLs
                if 'urls' in crypto_info:
                    urls = crypto_info['urls']
                    if 'website' in urls and len(urls['website']) > 0:
                        metadata['website'] = urls['website'][0]
                    if 'technical_doc' in urls and len(urls['technical_doc']) > 0:
                        metadata['whitepaper'] = urls['technical_doc'][0]
                    if 'twitter' in urls and len(urls['twitter']) > 0:
                        metadata['twitter'] = urls['twitter'][0]

                # Data de lançamento
                if 'date_added' in crypto_info:
                    metadata['date_added'] = crypto_info['date_added']

        except Exception as e:
            logger.warning(f"Erro ao obter metadados: {str(e)}")

        return metadata

    def get_required_fields(self) -> List[str]:
        """Campos obrigatórios"""
        return ['ticker', 'source']
