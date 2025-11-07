"""
Scraper Test Controller - Business logic for scraper testing
Handles all scraper testing operations, health checks, and cookie management
"""
import sys
import asyncio
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
from loguru import logger

# Add python-scrapers to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python-scrapers"))

from scrapers import (
    # Fundamental Analysis
    StatusInvestScraper,
    FundamentusScraper,
    InvestsiteScraper,
    FundamenteiScraper,
    Investidor10Scraper,
    # Market Analysis
    InvestingScraper,
    ADVFNScraper,
    GoogleFinanceScraper,
    TradingViewScraper,
    # Official Data
    B3Scraper,
    BCBScraper,
    # Insider Trading
    GriffinScraper,
    # Crypto
    CoinMarketCapScraper,
    # Options
    OpcoesNetScraper,
    # AI Assistants
    ChatGPTScraper,
    GeminiScraper,
    DeepSeekScraper,
    ClaudeScraper,
    GrokScraper,
    # News
    BloombergScraper,
    GoogleNewsScraper,
    InvestingNewsScraper,
    ValorScraper,
    ExameScraper,
    InfoMoneyScraper,
    # Institutional Reports
    EstadaoScraper,
    MaisRetornoScraper,
)
from cookie_manager import cookie_manager


class ScraperTestController:
    """Controller for scraper testing operations"""

    # Scraper registry with metadata
    SCRAPERS_REGISTRY = {
        # Fundamental Analysis
        "FUNDAMENTUS": {
            "class": FundamentusScraper,
            "name": "Fundamentus",
            "source": "FUNDAMENTUS",
            "requires_login": False,
            "category": "fundamental_analysis",
            "description": "Dados fundamentalistas públicos",
            "url": "https://www.fundamentus.com.br/",
        },
        "INVESTSITE": {
            "class": InvestsiteScraper,
            "name": "Investsite",
            "source": "INVESTSITE",
            "requires_login": False,
            "category": "fundamental_analysis",
            "description": "Análise fundamentalista detalhada",
            "url": "https://www.investsite.com.br/",
        },
        "STATUSINVEST": {
            "class": StatusInvestScraper,
            "name": "StatusInvest",
            "source": "STATUSINVEST",
            "requires_login": False,
            "category": "fundamental_analysis",
            "description": "Análise fundamentalista e valuation",
            "url": "https://statusinvest.com.br/",
        },
        "FUNDAMENTEI": {
            "class": FundamenteiScraper,
            "name": "Fundamentei",
            "source": "FUNDAMENTEI",
            "requires_login": True,
            "category": "fundamental_analysis",
            "description": "Análise fundamentalista premium",
            "url": "https://fundamentei.com/",
        },
        "INVESTIDOR10": {
            "class": Investidor10Scraper,
            "name": "Investidor10",
            "source": "INVESTIDOR10",
            "requires_login": True,
            "category": "fundamental_analysis",
            "description": "Análise fundamentalista completa",
            "url": "https://investidor10.com.br/",
        },
        # Market Analysis
        "INVESTING": {
            "class": InvestingScraper,
            "name": "Investing.com",
            "source": "INVESTING",
            "requires_login": True,
            "category": "market_analysis",
            "description": "Análise de mercado global",
            "url": "https://br.investing.com/",
        },
        "ADVFN": {
            "class": ADVFNScraper,
            "name": "ADVFN",
            "source": "ADVFN",
            "requires_login": True,
            "category": "market_analysis",
            "description": "Análise de mercado e cotações",
            "url": "https://br.advfn.com/",
        },
        "GOOGLEFINANCE": {
            "class": GoogleFinanceScraper,
            "name": "Google Finance",
            "source": "GOOGLEFINANCE",
            "requires_login": True,
            "category": "market_analysis",
            "description": "Dados financeiros do Google",
            "url": "https://www.google.com/finance/",
        },
        "TRADINGVIEW": {
            "class": TradingViewScraper,
            "name": "TradingView",
            "source": "TRADINGVIEW",
            "requires_login": True,
            "category": "technical_analysis",
            "description": "Análise técnica e gráficos",
            "url": "https://br.tradingview.com/",
        },
        # Official Data
        "B3": {
            "class": B3Scraper,
            "name": "B3",
            "source": "B3",
            "requires_login": False,
            "category": "official_data",
            "description": "Dados oficiais da bolsa brasileira",
            "url": "https://www.b3.com.br/",
        },
        "BCB": {
            "class": BCBScraper,
            "name": "Banco Central do Brasil",
            "source": "BCB",
            "requires_login": False,
            "category": "official_data",
            "description": "Dados macroeconômicos oficiais",
            "url": "https://www.bcb.gov.br/",
        },
        # Insider Trading
        "GRIFFIN": {
            "class": GriffinScraper,
            "name": "Griffin",
            "source": "GRIFFIN",
            "requires_login": False,
            "category": "insider_trading",
            "description": "Movimentações de insiders",
            "url": "https://griffin.app.br/",
        },
        # Crypto
        "COINMARKETCAP": {
            "class": CoinMarketCapScraper,
            "name": "CoinMarketCap",
            "source": "COINMARKETCAP",
            "requires_login": False,
            "category": "crypto",
            "description": "Dados de criptomoedas",
            "url": "https://coinmarketcap.com/",
        },
        # Options
        "OPCOES": {
            "class": OpcoesNetScraper,
            "name": "Opcoes.net.br",
            "source": "OPCOES",
            "requires_login": True,
            "category": "options",
            "description": "Options chain e Greeks",
            "url": "https://opcoes.net.br/",
        },
        # AI Assistants
        "CHATGPT": {
            "class": ChatGPTScraper,
            "name": "ChatGPT",
            "source": "CHATGPT",
            "requires_login": True,
            "category": "ai_analysis",
            "description": "Análise via ChatGPT",
            "url": "https://chatgpt.com/",
        },
        "GEMINI": {
            "class": GeminiScraper,
            "name": "Gemini",
            "source": "GEMINI",
            "requires_login": True,
            "category": "ai_analysis",
            "description": "Análise via Google Gemini",
            "url": "https://gemini.google.com/",
        },
        "DEEPSEEK": {
            "class": DeepSeekScraper,
            "name": "DeepSeek",
            "source": "DEEPSEEK",
            "requires_login": True,
            "category": "ai_analysis",
            "description": "Análise via DeepSeek",
            "url": "https://www.deepseek.com/",
        },
        "CLAUDE": {
            "class": ClaudeScraper,
            "name": "Claude",
            "source": "CLAUDE",
            "requires_login": True,
            "category": "ai_analysis",
            "description": "Análise via Claude AI",
            "url": "https://claude.ai/",
        },
        "GROK": {
            "class": GrokScraper,
            "name": "Grok",
            "source": "GROK",
            "requires_login": True,
            "category": "ai_analysis",
            "description": "Análise via Grok",
            "url": "https://grok.com/",
        },
        # News
        "BLOOMBERG": {
            "class": BloombergScraper,
            "name": "Bloomberg Línea",
            "source": "BLOOMBERG",
            "requires_login": False,
            "category": "news",
            "description": "Notícias financeiras Bloomberg",
            "url": "https://www.bloomberglinea.com.br/",
        },
        "GOOGLENEWS": {
            "class": GoogleNewsScraper,
            "name": "Google News",
            "source": "GOOGLENEWS",
            "requires_login": True,
            "category": "news",
            "description": "Notícias do Google",
            "url": "https://news.google.com/",
        },
        "INVESTING_NEWS": {
            "class": InvestingNewsScraper,
            "name": "Investing News",
            "source": "INVESTING_NEWS",
            "requires_login": True,
            "category": "news",
            "description": "Notícias do Investing.com",
            "url": "https://br.investing.com/news/",
        },
        "VALOR": {
            "class": ValorScraper,
            "name": "Valor Econômico",
            "source": "VALOR",
            "requires_login": True,
            "category": "news",
            "description": "Notícias do Valor Econômico",
            "url": "https://valor.globo.com/",
        },
        "EXAME": {
            "class": ExameScraper,
            "name": "Exame",
            "source": "EXAME",
            "requires_login": True,
            "category": "news",
            "description": "Notícias da Exame",
            "url": "https://exame.com/",
        },
        "INFOMONEY": {
            "class": InfoMoneyScraper,
            "name": "InfoMoney",
            "source": "INFOMONEY",
            "requires_login": True,
            "category": "news",
            "description": "Notícias do InfoMoney",
            "url": "https://www.infomoney.com.br/",
        },
        # Institutional Reports
        "ESTADAO": {
            "class": EstadaoScraper,
            "name": "Estadão Investidor",
            "source": "ESTADAO",
            "requires_login": True,
            "category": "institutional_reports",
            "description": "Análises do Estadão",
            "url": "https://einvestidor.estadao.com.br/",
        },
        "MAISRETORNO": {
            "class": MaisRetornoScraper,
            "name": "Mais Retorno",
            "source": "MAISRETORNO",
            "requires_login": True,
            "category": "institutional_reports",
            "description": "Análises e educação financeira",
            "url": "https://maisretorno.com/",
        },
    }

    def __init__(self):
        """Initialize controller"""
        logger.info("ScraperTestController initialized")

    async def list_scrapers(self, category: Optional[str] = None) -> Dict[str, Any]:
        """
        List all registered scrapers with metadata

        Args:
            category: Optional category filter

        Returns:
            Dict with scrapers list and stats
        """
        scrapers = []

        for scraper_id, metadata in self.SCRAPERS_REGISTRY.items():
            # Filter by category if specified
            if category and metadata["category"] != category:
                continue

            scrapers.append({
                "id": scraper_id,
                "name": metadata["name"],
                "source": metadata["source"],
                "requires_login": metadata["requires_login"],
                "category": metadata["category"],
                "description": metadata["description"],
                "url": metadata["url"],
            })

        # Calculate stats
        total = len(scrapers)
        public = len([s for s in scrapers if not s["requires_login"]])
        private = len([s for s in scrapers if s["requires_login"]])

        # Categories count
        categories = {}
        for s in scrapers:
            cat = s["category"]
            categories[cat] = categories.get(cat, 0) + 1

        return {
            "total": total,
            "public": public,
            "private": private,
            "categories": categories,
            "scrapers": scrapers,
        }

    async def test_scraper(
        self, scraper_name: str, query: str
    ) -> Dict[str, Any]:
        """
        Test a specific scraper

        Args:
            scraper_name: Name/ID of the scraper to test
            query: Query parameter (ticker, search term, etc.)

        Returns:
            Dict with test results
        """
        start_time = time.time()

        # Validate scraper exists
        scraper_name = scraper_name.upper()
        if scraper_name not in self.SCRAPERS_REGISTRY:
            return {
                "success": False,
                "error": f"Scraper '{scraper_name}' not found",
                "available_scrapers": list(self.SCRAPERS_REGISTRY.keys()),
                "execution_time": 0,
            }

        scraper_meta = self.SCRAPERS_REGISTRY[scraper_name]

        try:
            # Instantiate scraper
            logger.info(f"Testing scraper: {scraper_name} with query: {query}")
            scraper_class = scraper_meta["class"]
            scraper = scraper_class()

            # Execute scrape
            result = await scraper.scrape_with_retry(query)

            execution_time = time.time() - start_time

            # Build response
            if result.success:
                return {
                    "success": True,
                    "scraper": scraper_name,
                    "query": query,
                    "data": result.data,
                    "execution_time": round(execution_time, 2),
                    "timestamp": result.timestamp.isoformat(),
                    "metadata": scraper_meta,
                }
            else:
                return {
                    "success": False,
                    "scraper": scraper_name,
                    "query": query,
                    "error": result.error,
                    "execution_time": round(execution_time, 2),
                    "metadata": scraper_meta,
                }

        except Exception as e:
            logger.error(f"Error testing scraper {scraper_name}: {e}", exc_info=True)
            execution_time = time.time() - start_time
            return {
                "success": False,
                "scraper": scraper_name,
                "query": query,
                "error": str(e),
                "execution_time": round(execution_time, 2),
            }

    async def test_all_scrapers(
        self,
        category: Optional[str] = None,
        max_concurrent: int = 5,
        query: str = "PETR4",
    ) -> Dict[str, Any]:
        """
        Test all scrapers in parallel

        Args:
            category: Optional category filter
            max_concurrent: Max number of concurrent tests
            query: Default query for testing

        Returns:
            Dict with all test results
        """
        start_time = time.time()

        # Get scrapers to test
        scrapers_to_test = []
        for scraper_id, metadata in self.SCRAPERS_REGISTRY.items():
            if category and metadata["category"] != category:
                continue
            scrapers_to_test.append(scraper_id)

        logger.info(f"Testing {len(scrapers_to_test)} scrapers...")

        # Create semaphore for limiting concurrency
        semaphore = asyncio.Semaphore(max_concurrent)

        async def test_with_semaphore(scraper_name: str):
            async with semaphore:
                return await self.test_scraper(scraper_name, query)

        # Run tests in parallel
        tasks = [test_with_semaphore(scraper) for scraper in scrapers_to_test]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Process results
        success_count = 0
        failure_count = 0
        processed_results = []

        for i, result in enumerate(results):
            scraper_name = scrapers_to_test[i]

            if isinstance(result, Exception):
                failure_count += 1
                processed_results.append({
                    "scraper": scraper_name,
                    "success": False,
                    "error": str(result),
                })
            else:
                if result.get("success"):
                    success_count += 1
                else:
                    failure_count += 1
                processed_results.append(result)

        execution_time = time.time() - start_time

        return {
            "total_tested": len(scrapers_to_test),
            "success": success_count,
            "failures": failure_count,
            "execution_time": round(execution_time, 2),
            "query": query,
            "results": processed_results,
        }

    async def get_scrapers_health(self) -> Dict[str, Any]:
        """
        Get health status of all scrapers

        Returns:
            Dict with health status for each scraper
        """
        start_time = time.time()

        health_results = {
            "overall_health": "unknown",
            "total_scrapers": len(self.SCRAPERS_REGISTRY),
            "healthy": 0,
            "unhealthy": 0,
            "unknown": 0,
            "scrapers": [],
        }

        # Check cookies status first
        cookies_status = await cookie_manager.check_cookies_status()

        # Check each scraper
        for scraper_id, metadata in self.SCRAPERS_REGISTRY.items():
            scraper_health = {
                "id": scraper_id,
                "name": metadata["name"],
                "category": metadata["category"],
                "requires_login": metadata["requires_login"],
                "status": "unknown",
                "message": "",
            }

            # Public scrapers - assume healthy (could ping URL)
            if not metadata["requires_login"]:
                scraper_health["status"] = "healthy"
                scraper_health["message"] = "Public scraper, no authentication required"
                health_results["healthy"] += 1

            # OAuth scrapers - check cookies
            elif metadata["requires_login"]:
                if not cookies_status["exists"]:
                    scraper_health["status"] = "unhealthy"
                    scraper_health["message"] = "Cookies not found"
                    health_results["unhealthy"] += 1
                elif cookies_status["needs_renewal"]:
                    scraper_health["status"] = "warning"
                    scraper_health["message"] = f"Cookies need renewal (age: {cookies_status['age_days']} days)"
                    health_results["unhealthy"] += 1
                else:
                    scraper_health["status"] = "healthy"
                    scraper_health["message"] = f"Cookies valid ({cookies_status['expires_in_days']} days left)"
                    health_results["healthy"] += 1

            health_results["scrapers"].append(scraper_health)

        # Determine overall health
        total = health_results["total_scrapers"]
        healthy_pct = (health_results["healthy"] / total * 100) if total > 0 else 0

        if healthy_pct >= 80:
            health_results["overall_health"] = "healthy"
        elif healthy_pct >= 50:
            health_results["overall_health"] = "warning"
        else:
            health_results["overall_health"] = "unhealthy"

        health_results["healthy_percentage"] = round(healthy_pct, 1)
        health_results["execution_time"] = round(time.time() - start_time, 2)

        return health_results

    async def get_cookies_status(self) -> Dict[str, Any]:
        """
        Get Google OAuth cookies status

        Returns:
            Dict with cookies status
        """
        try:
            status = await cookie_manager.check_cookies_status()

            # Add helpful information
            if not status["exists"]:
                status["action_required"] = "Run script to save Google cookies"
                status["severity"] = "critical"
            elif status["needs_renewal"]:
                status["action_required"] = "Renew Google cookies soon"
                status["severity"] = "warning"
            elif status.get("expires_in_days", 0) <= 2:
                status["action_required"] = "Cookies expire soon, plan renewal"
                status["severity"] = "warning"
            else:
                status["action_required"] = "None - cookies are valid"
                status["severity"] = "ok"

            # Add renewal instructions
            status["renewal_command"] = "docker exec -it invest_scrapers python scripts/save_google_cookies.py"

            return status

        except Exception as e:
            logger.error(f"Error checking cookies status: {e}")
            return {
                "exists": False,
                "valid": False,
                "error": str(e),
                "severity": "critical",
                "action_required": "Fix error and save Google cookies",
            }


# Global instance
scraper_controller = ScraperTestController()
