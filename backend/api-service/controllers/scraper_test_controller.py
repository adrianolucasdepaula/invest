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

# Import ONLY Playwright-migrated scrapers (as of 2025-11-29)
# Other scrapers are temporarily disabled pending Playwright migration
from scrapers import (
    # ✅ MIGRATED TO PLAYWRIGHT
    FundamentusScraper,
    BCBScraper,
)

# DISABLED: cookie_manager uses Selenium (needs Playwright migration)
# from cookie_manager import cookie_manager
cookie_manager = None  # Placeholder until migration


class ScraperTestController:
    """Controller for scraper testing operations"""

    # Scraper registry with metadata
    # TEMPORARY: Only Playwright-migrated scrapers (2025-11-29)
    # Other 24 scrapers pending migration
    SCRAPERS_REGISTRY = {
        # ✅ MIGRATED TO PLAYWRIGHT - Fundamental Analysis
        "FUNDAMENTUS": {
            "class": FundamentusScraper,
            "name": "Fundamentus",
            "source": "FUNDAMENTUS",
            "requires_login": False,
            "category": "fundamental_analysis",
            "description": "Dados fundamentalistas públicos",
            "url": "https://www.fundamentus.com.br/",
            "status": "active",
        },
        # ✅ MIGRATED TO PLAYWRIGHT - Official Data
        "BCB": {
            "class": BCBScraper,
            "name": "Banco Central do Brasil",
            "source": "BCB",
            "requires_login": False,
            "category": "official_data",
            "description": "Dados macroeconômicos oficiais (SELIC, IPCA, CDI)",
            "url": "https://www.bcb.gov.br/",
            "status": "active",
        },
    }

    # ⏸️ DISABLED SCRAPERS - Pending Playwright migration
    # 24 scrapers waiting for migration:
    # - StatusInvest, Investsite, Fundamentei, Investidor10
    # - Investing.com, ADVFN, GoogleFinance, TradingView
    # - B3, Griffin, CoinMarketCap, Opcoes.net
    # - ChatGPT, Gemini, DeepSeek, Claude, Grok
    # - Bloomberg, GoogleNews, InvestingNews, Valor, Exame, InfoMoney
    # - Estadão, MaisRetorno

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
            "note": "Cookie manager disabled - pending Playwright migration",
        }

        # Check each scraper (simplified - cookie_manager disabled)
        for scraper_id, metadata in self.SCRAPERS_REGISTRY.items():
            scraper_health = {
                "id": scraper_id,
                "name": metadata["name"],
                "category": metadata["category"],
                "requires_login": metadata["requires_login"],
                "status": "healthy" if not metadata["requires_login"] else "unknown",
                "message": "Playwright-migrated scraper" if metadata.get("status") == "active" else "Pending migration",
            }

            if metadata.get("status") == "active":
                health_results["healthy"] += 1
            else:
                health_results["unknown"] += 1

            health_results["scrapers"].append(scraper_health)

        # Determine overall health
        total = health_results["total_scrapers"]
        healthy_pct = (health_results["healthy"] / total * 100) if total > 0 else 0

        if healthy_pct >= 80:
            health_results["overall_health"] = "healthy"
        elif healthy_pct >= 50:
            health_results["overall_health"] = "warning"
        else:
            health_results["overall_health"] = "partial"

        health_results["healthy_percentage"] = round(healthy_pct, 1)
        health_results["execution_time"] = round(time.time() - start_time, 2)

        return health_results

    async def get_cookies_status(self) -> Dict[str, Any]:
        """
        Get Google OAuth cookies status
        DISABLED: cookie_manager pending Playwright migration

        Returns:
            Dict with cookies status
        """
        return {
            "exists": False,
            "valid": False,
            "disabled": True,
            "message": "Cookie manager disabled - pending Playwright migration",
            "severity": "info",
            "action_required": "Wait for Playwright migration of cookie_manager.py",
        }


# Global instance
scraper_controller = ScraperTestController()
