"""
Serviço de Coleta e Consolidação de Dados
Orquestra coleta de múltiplas fontes e consolida resultados
ATUALIZADO FASE 2: Integração com todos os 16 scrapers
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
from loguru import logger
from .data_validation_service import DataValidationService

# Scrapers fundamentalistas (6)
from ..scrapers.fundamentals import (
    FundamentusScraper,
    BRAPIScraper,
    StatusInvestScraper,
    Investidor10Scraper,
    FundamenteiScraper,
    InvestSiteScraper
)

# Scrapers técnicos (3)
from ..scrapers.technical import (
    TradingViewScraper,
    InvestingScraper,
    YahooFinanceScraper
)

# Scrapers de notícias (3)
from ..scrapers.news import (
    GoogleNewsScraper,
    BloombergLineaScraper,
    InfoMoneyScraper
)

# Scrapers de insiders (1)
from ..scrapers.insiders import GriffinScraper

# Scrapers de crypto (2)
from ..scrapers.crypto import (
    CoinMarketCapScraper,
    BinanceScraper
)

# Scrapers macroeconômico (1)
from ..scrapers.macroeconomic import EconomicCalendarScraper

# Scrapers de opções (1)
from ..scrapers.options import OpcoesNetScraper


class DataCollectionService:
    """
    Serviço orquestrador de coleta de dados
    Integra todos os 16 scrapers implementados na FASE 2
    """

    def __init__(self):
        self.validation_service = DataValidationService(minimum_sources=3)

        # Inicializa scrapers fundamentalistas (6 fontes)
        self.fundamental_scrapers = [
            FundamentusScraper(),
            BRAPIScraper(),
            StatusInvestScraper(),
            Investidor10Scraper(),
            FundamenteiScraper(),
            InvestSiteScraper(),
        ]

        # Inicializa scrapers técnicos (3 fontes)
        self.technical_scrapers = [
            TradingViewScraper(),
            InvestingScraper(),
            YahooFinanceScraper(),
        ]

        # Inicializa scrapers de notícias (3 fontes)
        self.news_scrapers = [
            GoogleNewsScraper(),
            BloombergLineaScraper(),
            InfoMoneyScraper(),
        ]

        # Inicializa scraper de insiders (1 fonte)
        self.insider_scrapers = [
            GriffinScraper(),
        ]

        # Inicializa scrapers de crypto (2 fontes)
        self.crypto_scrapers = [
            CoinMarketCapScraper(),
            BinanceScraper(),
        ]

        # Inicializa scraper macroeconômico (1 fonte)
        self.macro_scrapers = [
            EconomicCalendarScraper(),
        ]

        # Inicializa scrapers de opções (1 fonte)
        self.option_scrapers = [
            OpcoesNetScraper(),
        ]

        logger.info(f"DataCollectionService inicializado com {self._count_all_scrapers()} scrapers")

    def _count_all_scrapers(self) -> int:
        """Conta total de scrapers disponíveis"""
        return (
            len(self.fundamental_scrapers) +
            len(self.technical_scrapers) +
            len(self.news_scrapers) +
            len(self.insider_scrapers) +
            len(self.crypto_scrapers) +
            len(self.macro_scrapers) +
            len(self.option_scrapers)
        )

    async def collect_all_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados de todas as fontes disponíveis para um ativo

        Args:
            ticker: Código do ativo
            **kwargs: Parâmetros adicionais (ex: company_name para news)

        Returns:
            Dados consolidados de todas as fontes
        """
        logger.info(f"Iniciando coleta completa de dados para {ticker} com {self._count_all_scrapers()} scrapers")

        # Coleta em paralelo de diferentes tipos de dados
        results = await asyncio.gather(
            self.collect_fundamental_data(ticker),
            self.collect_technical_data(ticker),
            self.collect_options_data(ticker),
            self.collect_news_data(ticker, **kwargs),
            self.collect_macroeconomic_data(**kwargs),
            self.collect_insider_data(ticker),
            return_exceptions=True
        )

        fundamental_data, technical_data, options_data, news_data, macro_data, insider_data = results

        # Consolida tudo
        consolidated_data = {
            "ticker": ticker,
            "collected_at": datetime.utcnow().isoformat(),
            "fundamental": fundamental_data if not isinstance(fundamental_data, Exception) else None,
            "technical": technical_data if not isinstance(technical_data, Exception) else None,
            "options": options_data if not isinstance(options_data, Exception) else None,
            "news": news_data if not isinstance(news_data, Exception) else None,
            "macroeconomic": macro_data if not isinstance(macro_data, Exception) else None,
            "insider": insider_data if not isinstance(insider_data, Exception) else None,
            "errors": self._extract_errors(results),
            "sources_used": self._count_sources_used(results)
        }

        logger.info(f"Coleta completa finalizada para {ticker} - {consolidated_data['sources_used']} fontes bem-sucedidas")
        return consolidated_data

    async def collect_fundamental_data(self, ticker: str) -> Dict[str, Any]:
        """
        Coleta dados fundamentalistas de 6 fontes

        Args:
            ticker: Código do ativo

        Returns:
            Dados fundamentalistas validados e consolidados
        """
        logger.info(f"Coletando dados fundamentalistas de {len(self.fundamental_scrapers)} fontes para {ticker}")

        # Coleta de todas as fontes em paralelo
        collection_tasks = [
            scraper.collect_data(ticker)
            for scraper in self.fundamental_scrapers
        ]

        results = await asyncio.gather(*collection_tasks, return_exceptions=True)

        # Filtra resultados válidos
        valid_results = [
            r for r in results
            if not isinstance(r, Exception) and r
        ]

        logger.info(f"Dados fundamentalistas coletados de {len(valid_results)}/{len(self.fundamental_scrapers)} fontes com sucesso")

        # Valida e consolida dados
        if len(valid_results) >= 3:  # Requisito: mínimo 3 fontes
            consolidated = self.validation_service.validate_fundamental_data(valid_results)
            return consolidated
        else:
            logger.warning(f"Número insuficiente de fontes válidas para {ticker}: {len(valid_results)}/3 requeridas")
            return {
                "error": "Insufficient valid sources",
                "valid_sources": len(valid_results),
                "required_sources": 3,
                "raw_data": valid_results
            }

    async def collect_technical_data(self, ticker: str) -> Dict[str, Any]:
        """
        Coleta dados técnicos de 3 fontes (TradingView, Investing.com, Yahoo Finance)

        Args:
            ticker: Código do ativo

        Returns:
            Dados técnicos consolidados
        """
        logger.info(f"Coletando dados técnicos de {len(self.technical_scrapers)} fontes para {ticker}")

        # Coleta de todas as fontes em paralelo
        collection_tasks = [
            scraper.collect_data(ticker)
            for scraper in self.technical_scrapers
        ]

        results = await asyncio.gather(*collection_tasks, return_exceptions=True)

        # Filtra resultados válidos
        valid_results = [
            r for r in results
            if not isinstance(r, Exception) and r
        ]

        logger.info(f"Dados técnicos coletados de {len(valid_results)}/{len(self.technical_scrapers)} fontes com sucesso")

        # Consolida dados técnicos
        technical_data = {
            "ticker": ticker,
            "sources_count": len(valid_results),
            "indicators": {},
            "moving_averages": {},
            "oscillators": {},
            "pivot_points": {},
            "price_data": {},
            "volume_data": {},
            "performance": {},
            "raw_data": valid_results
        }

        # Merge dados de todas as fontes
        for data in valid_results:
            source = data.get('source', 'unknown')

            # Indicadores
            for key, value in data.items():
                if key not in ['ticker', 'source', 'collected_at']:
                    if key not in technical_data['indicators']:
                        technical_data['indicators'][key] = {}
                    technical_data['indicators'][key][source] = value

        return technical_data

    async def collect_options_data(self, ticker: str) -> Dict[str, Any]:
        """
        Coleta dados de opções de Opcoes.net.br

        Args:
            ticker: Código do ativo

        Returns:
            Dados de opções consolidados
        """
        logger.info(f"Coletando dados de opções de {len(self.option_scrapers)} fontes para {ticker}")

        options_data = {
            "ticker": ticker,
            "options_chain": [],
            "volatility": {},
            "greeks": {},
            "expiration_analysis": [],
            "sources_count": 0
        }

        # Coleta de scrapers de opções
        for scraper in self.option_scrapers:
            try:
                data = await scraper.collect_data(ticker)
                if data:
                    options_data["sources_count"] += 1

                    # Merge dados de opções
                    if 'options_chain' in data:
                        options_data["options_chain"].extend(data.get('options_chain', []))

                    if 'iv_rank' in data:
                        options_data["volatility"] = data.get('iv_rank')

                    # Análise de vencimentos
                    if hasattr(scraper, 'get_next_expirations'):
                        expirations = await scraper.get_next_expirations(ticker)
                        options_data["expiration_analysis"].extend(expirations)

            except Exception as e:
                logger.error(f"Erro ao coletar dados de opções de {scraper.source_name}: {str(e)}")

        logger.info(f"Dados de opções coletados de {options_data['sources_count']} fontes")
        return options_data

    async def collect_news_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta notícias de 3 fontes (Google News, Bloomberg Línea, InfoMoney)

        Args:
            ticker: Código do ativo
            **kwargs: company_name (opcional) para busca melhor

        Returns:
            Notícias consolidadas
        """
        logger.info(f"Coletando notícias de {len(self.news_scrapers)} fontes para {ticker}")

        # Coleta de todas as fontes em paralelo
        collection_tasks = [
            scraper.collect_data(ticker, **kwargs)
            for scraper in self.news_scrapers
        ]

        results = await asyncio.gather(*collection_tasks, return_exceptions=True)

        # Filtra resultados válidos
        valid_results = [
            r for r in results
            if not isinstance(r, Exception) and r
        ]

        logger.info(f"Notícias coletadas de {len(valid_results)}/{len(self.news_scrapers)} fontes com sucesso")

        # Consolida notícias
        all_news = []
        for data in valid_results:
            if 'news' in data:
                all_news.extend(data['news'])

        news_data = {
            "ticker": ticker,
            "sources_count": len(valid_results),
            "total_news": len(all_news),
            "recent_news": all_news,
            "by_source": {
                data.get('source', 'unknown'): {
                    'count': data.get('news_count', 0),
                    'news': data.get('news', [])
                }
                for data in valid_results
            }
        }

        return news_data

    async def collect_macroeconomic_data(self, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados macroeconômicos relevantes (calendário econômico)

        Args:
            **kwargs: country, importance, days (parâmetros para Economic Calendar)

        Returns:
            Dados macroeconômicos
        """
        logger.info(f"Coletando dados macroeconômicos de {len(self.macro_scrapers)} fontes")

        # Coleta de todas as fontes em paralelo
        collection_tasks = [
            scraper.collect_data(**kwargs)
            for scraper in self.macro_scrapers
        ]

        results = await asyncio.gather(*collection_tasks, return_exceptions=True)

        # Filtra resultados válidos
        valid_results = [
            r for r in results
            if not isinstance(r, Exception) and r
        ]

        logger.info(f"Dados macroeconômicos coletados de {len(valid_results)}/{len(self.macro_scrapers)} fontes com sucesso")

        # Consolida dados macroeconômicos
        macro_data = {
            "sources_count": len(valid_results),
            "economic_calendar": [],
            "events_count": 0
        }

        for data in valid_results:
            if 'events' in data:
                macro_data['economic_calendar'].extend(data['events'])
                macro_data['events_count'] += data.get('events_count', 0)

        return macro_data

    async def collect_insider_data(self, ticker: str) -> Dict[str, Any]:
        """
        Coleta dados de insiders (transações de administradores)

        Args:
            ticker: Código do ativo

        Returns:
            Dados de movimentações de insiders
        """
        logger.info(f"Coletando dados de insiders de {len(self.insider_scrapers)} fontes para {ticker}")

        # Coleta de todas as fontes em paralelo
        collection_tasks = [
            scraper.collect_data(ticker)
            for scraper in self.insider_scrapers
        ]

        results = await asyncio.gather(*collection_tasks, return_exceptions=True)

        # Filtra resultados válidos
        valid_results = [
            r for r in results
            if not isinstance(r, Exception) and r
        ]

        logger.info(f"Dados de insiders coletados de {len(valid_results)}/{len(self.insider_scrapers)} fontes com sucesso")

        # Consolida dados de insiders
        all_transactions = []
        for data in valid_results:
            if 'transactions' in data:
                all_transactions.extend(data['transactions'])

        insider_data = {
            "ticker": ticker,
            "sources_count": len(valid_results),
            "total_transactions": len(all_transactions),
            "recent_transactions": all_transactions[:50],  # Limita a 50 mais recentes
            "summary": valid_results[0] if valid_results else {}
        }

        return insider_data

    async def collect_crypto_data(self, symbol: str) -> Dict[str, Any]:
        """
        Coleta dados de criptomoedas (CoinMarketCap, Binance)

        Args:
            symbol: Símbolo da criptomoeda (ex: BTC, ETH)

        Returns:
            Dados de crypto consolidados
        """
        logger.info(f"Coletando dados de crypto de {len(self.crypto_scrapers)} fontes para {symbol}")

        # Coleta de todas as fontes em paralelo
        collection_tasks = [
            scraper.collect_data(symbol)
            for scraper in self.crypto_scrapers
        ]

        results = await asyncio.gather(*collection_tasks, return_exceptions=True)

        # Filtra resultados válidos
        valid_results = [
            r for r in results
            if not isinstance(r, Exception) and r
        ]

        logger.info(f"Dados de crypto coletados de {len(valid_results)}/{len(self.crypto_scrapers)} fontes com sucesso")

        # Consolida dados de crypto
        crypto_data = {
            "symbol": symbol,
            "sources_count": len(valid_results),
            "price_data": {},
            "market_data": {},
            "trading_data": {},
            "raw_data": valid_results
        }

        # Merge dados de todas as fontes
        for data in valid_results:
            source = data.get('source', 'unknown')
            crypto_data[source] = data

        return crypto_data

    def _extract_errors(self, results: List[Any]) -> List[str]:
        """
        Extrai erros dos resultados

        Args:
            results: Lista de resultados

        Returns:
            Lista de mensagens de erro
        """
        errors = []
        for result in results:
            if isinstance(result, Exception):
                errors.append(str(result))
        return errors

    def _count_sources_used(self, results: List[Any]) -> int:
        """
        Conta fontes bem-sucedidas

        Args:
            results: Lista de resultados

        Returns:
            Número de fontes bem-sucedidas
        """
        return sum(1 for r in results if not isinstance(r, Exception))

    async def update_all_assets(self, tickers: List[str], **kwargs) -> Dict[str, Any]:
        """
        Atualiza dados de múltiplos ativos em paralelo

        Args:
            tickers: Lista de tickers
            **kwargs: Parâmetros adicionais

        Returns:
            Resumo da atualização
        """
        logger.info(f"Iniciando atualização de {len(tickers)} ativos")

        results = await asyncio.gather(
            *[self.collect_all_data(ticker, **kwargs) for ticker in tickers],
            return_exceptions=True
        )

        successful = sum(1 for r in results if not isinstance(r, Exception))
        failed = len(results) - successful

        return {
            "total": len(tickers),
            "successful": successful,
            "failed": failed,
            "timestamp": datetime.utcnow().isoformat(),
            "details": results
        }
