"""
Scraper para Yahoo Finance (finance.yahoo.com)
Usa biblioteca yfinance (API)
Não requer autenticação
"""
from typing import Dict, Any, List
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings
import yfinance as yf
from datetime import datetime, timedelta


class YahooFinanceScraper(BaseScraper):
    """
    Scraper para Yahoo Finance usando API yfinance
    """

    def __init__(self):
        super().__init__(source_name="yahoo_finance", requires_auth=False)

    async def authenticate(self) -> bool:
        """
        Não requer autenticação

        Returns:
            True (sempre)
        """
        return True

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados do Yahoo Finance

        Args:
            ticker: Código do ativo (ex: PETR4.SA, VALE3.SA)

        Returns:
            Dados coletados
        """
        self._respect_rate_limit()

        try:
            # Yahoo Finance requer sufixo .SA para ações brasileiras
            yahoo_ticker = ticker if ticker.endswith('.SA') else f"{ticker.upper()}.SA"

            # Cria objeto Ticker
            stock = yf.Ticker(yahoo_ticker)

            # Coleta dados
            data = {
                'ticker': ticker,
                'source': 'yahoo_finance',
                **self._extract_info_data(stock),
                **self._extract_price_data(stock),
                **self._extract_historical_data(stock),
                **self._extract_technical_indicators(stock),
                **self._extract_dividends_data(stock),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados do Yahoo Finance para {ticker}: {str(e)}")
            raise

    def _extract_info_data(self, stock: yf.Ticker) -> Dict[str, Any]:
        """Extrai informações gerais do ativo"""
        info_data = {}
        try:
            info = stock.info

            # Mapeia campos do Yahoo Finance para nosso modelo
            field_mapping = {
                'marketCap': 'market_cap',
                'sector': 'sector',
                'industry': 'industry',
                'longName': 'long_name',
                'currency': 'currency',
                'exchange': 'exchange',
                'quoteType': 'asset_type',
            }

            for yf_field, our_field in field_mapping.items():
                if yf_field in info and info[yf_field]:
                    info_data[our_field] = info[yf_field]

        except Exception as e:
            logger.warning(f"Erro ao extrair info data: {str(e)}")

        return info_data

    def _extract_price_data(self, stock: yf.Ticker) -> Dict[str, Any]:
        """Extrai dados de preço"""
        price_data = {}
        try:
            info = stock.info

            # Preços
            if 'currentPrice' in info:
                price_data['price'] = info['currentPrice']
            elif 'regularMarketPrice' in info:
                price_data['price'] = info['regularMarketPrice']

            # Variações
            if 'regularMarketChange' in info:
                price_data['change'] = info['regularMarketChange']

            if 'regularMarketChangePercent' in info:
                price_data['change_percent'] = info['regularMarketChangePercent']

            # Faixas
            if 'dayHigh' in info:
                price_data['day_high'] = info['dayHigh']

            if 'dayLow' in info:
                price_data['day_low'] = info['dayLow']

            if 'fiftyTwoWeekHigh' in info:
                price_data['week_52_high'] = info['fiftyTwoWeekHigh']

            if 'fiftyTwoWeekLow' in info:
                price_data['week_52_low'] = info['fiftyTwoWeekLow']

            # Volume
            if 'volume' in info:
                price_data['volume'] = info['volume']

            if 'averageVolume' in info:
                price_data['avg_volume'] = info['averageVolume']

            if 'averageVolume10days' in info:
                price_data['avg_volume_10d'] = info['averageVolume10days']

        except Exception as e:
            logger.warning(f"Erro ao extrair price data: {str(e)}")

        return price_data

    def _extract_historical_data(self, stock: yf.Ticker) -> Dict[str, Any]:
        """Extrai dados históricos"""
        hist_data = {}
        try:
            # Últimos 60 dias de histórico
            hist = stock.history(period="60d")

            if not hist.empty:
                # Calcula retornos
                current_price = hist['Close'].iloc[-1]

                if len(hist) >= 5:
                    price_5d_ago = hist['Close'].iloc[-5]
                    hist_data['return_5d'] = ((current_price - price_5d_ago) / price_5d_ago) * 100

                if len(hist) >= 20:
                    price_20d_ago = hist['Close'].iloc[-20]
                    hist_data['return_20d'] = ((current_price - price_20d_ago) / price_20d_ago) * 100

                if len(hist) >= 60:
                    price_60d_ago = hist['Close'].iloc[-60]
                    hist_data['return_60d'] = ((current_price - price_60d_ago) / price_60d_ago) * 100

                # Volatilidade (desvio padrão dos retornos diários)
                returns = hist['Close'].pct_change().dropna()
                if len(returns) > 0:
                    hist_data['volatility_60d'] = returns.std() * 100
                    hist_data['volatility_annualized'] = returns.std() * (252 ** 0.5) * 100

        except Exception as e:
            logger.warning(f"Erro ao extrair historical data: {str(e)}")

        return hist_data

    def _extract_technical_indicators(self, stock: yf.Ticker) -> Dict[str, Any]:
        """Extrai indicadores técnicos"""
        indicators = {}
        try:
            # Pega histórico para calcular indicadores
            hist = stock.history(period="200d")

            if not hist.empty and len(hist) > 0:
                close_prices = hist['Close']

                # Médias Móveis Simples
                if len(close_prices) >= 10:
                    indicators['sma_10'] = close_prices.rolling(window=10).mean().iloc[-1]

                if len(close_prices) >= 20:
                    indicators['sma_20'] = close_prices.rolling(window=20).mean().iloc[-1]

                if len(close_prices) >= 50:
                    indicators['sma_50'] = close_prices.rolling(window=50).mean().iloc[-1]

                if len(close_prices) >= 200:
                    indicators['sma_200'] = close_prices.rolling(window=200).mean().iloc[-1]

                # Médias Móveis Exponenciais
                if len(close_prices) >= 10:
                    indicators['ema_10'] = close_prices.ewm(span=10, adjust=False).mean().iloc[-1]

                if len(close_prices) >= 20:
                    indicators['ema_20'] = close_prices.ewm(span=20, adjust=False).mean().iloc[-1]

                if len(close_prices) >= 50:
                    indicators['ema_50'] = close_prices.ewm(span=50, adjust=False).mean().iloc[-1]

                # RSI (Relative Strength Index)
                if len(close_prices) >= 14:
                    delta = close_prices.diff()
                    gain = delta.where(delta > 0, 0).rolling(window=14).mean()
                    loss = -delta.where(delta < 0, 0).rolling(window=14).mean()
                    rs = gain / loss
                    rsi = 100 - (100 / (1 + rs))
                    indicators['rsi_14'] = rsi.iloc[-1]

                # Bollinger Bands
                if len(close_prices) >= 20:
                    sma_20 = close_prices.rolling(window=20).mean()
                    std_20 = close_prices.rolling(window=20).std()
                    indicators['bb_upper'] = (sma_20 + (std_20 * 2)).iloc[-1]
                    indicators['bb_middle'] = sma_20.iloc[-1]
                    indicators['bb_lower'] = (sma_20 - (std_20 * 2)).iloc[-1]

        except Exception as e:
            logger.warning(f"Erro ao calcular indicadores técnicos: {str(e)}")

        return indicators

    def _extract_dividends_data(self, stock: yf.Ticker) -> Dict[str, Any]:
        """Extrai dados de dividendos"""
        dividend_data = {}
        try:
            info = stock.info

            # Dividend Yield
            if 'dividendYield' in info and info['dividendYield']:
                dividend_data['dividend_yield'] = info['dividendYield'] * 100

            # Taxa de dividendos
            if 'dividendRate' in info:
                dividend_data['dividend_rate'] = info['dividendRate']

            # Payout ratio
            if 'payoutRatio' in info and info['payoutRatio']:
                dividend_data['payout_ratio'] = info['payoutRatio'] * 100

            # Últimos dividendos
            dividends = stock.dividends
            if not dividends.empty and len(dividends) > 0:
                # Soma dos dividendos dos últimos 12 meses
                one_year_ago = datetime.now() - timedelta(days=365)
                recent_dividends = dividends[dividends.index >= one_year_ago]
                if len(recent_dividends) > 0:
                    dividend_data['dividends_12m'] = recent_dividends.sum()

        except Exception as e:
            logger.warning(f"Erro ao extrair dividends data: {str(e)}")

        return dividend_data

    def get_required_fields(self) -> List[str]:
        """Campos obrigatórios"""
        return ['ticker', 'source']
