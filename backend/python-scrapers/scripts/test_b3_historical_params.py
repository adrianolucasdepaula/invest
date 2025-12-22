"""
Test B3 IDIV Historical URL Parameters

FASE 139.1.1 - Reconnaissance Mission
Testa diferentes padrões de URL para verificar se B3 permite acesso a composições históricas do IDIV

Objetivo: Descobrir se existe date parameter para acessar períodos passados
Período alvo: 2019-2025 (21 quadrimestres)

Uso:
    python test_b3_historical_params.py
"""

import asyncio
from datetime import date
from typing import List, Dict, Any
from playwright.async_api import async_playwright, Browser, Page
from loguru import logger
import sys

# Configure loguru
logger.remove()
logger.add(sys.stdout, format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}", level="INFO")


class B3HistoricalTester:
    """Testa diferentes padrões de URL para acessar dados históricos B3 IDIV"""

    BASE_URL = "https://sistemaswebb3-listados.b3.com.br/indexPage"

    # Padrões de URL para testar
    URL_PATTERNS = [
        # Pattern 1: Date query parameter
        "/day/IDIV?date={date}&language=pt-br",
        "/day/IDIV?language=pt-br&date={date}",

        # Pattern 2: Period parameter
        "/day/IDIV?period={period}&language=pt-br",
        "/day/IDIV?quarter={quarter}&language=pt-br",

        # Pattern 3: Month path
        "/month/IDIV?date={date}&language=pt-br",
        "/quarter/IDIV?date={date}&language=pt-br",

        # Pattern 4: Path-based
        "/day/IDIV/{date}?language=pt-br",
        "/IDIV/{date}/day?language=pt-br",

        # Pattern 5: Archive endpoints
        "/day/IDIV/history?date={date}&language=pt-br",
        "/day/IDIV/archive?date={date}&language=pt-br",
    ]

    # Test dates (um por quadrimestre de anos diferentes)
    TEST_DATES = [
        ("2019-01-15", "2019-Q1"),  # Jan-Apr 2019
        ("2020-05-15", "2020-Q2"),  # May-Aug 2020
        ("2021-09-15", "2021-Q3"),  # Sep-Dec 2021
        ("2024-01-15", "2024-Q1"),  # Recent period
    ]

    async def test_url_pattern(
        self,
        page: Page,
        pattern: str,
        test_date: str,
        period_label: str
    ) -> Dict[str, Any]:
        """
        Testa um padrão de URL específico

        Returns:
            {
                "pattern": str,
                "url": str,
                "success": bool,
                "status_code": int,
                "has_data": bool,
                "data_sample": str,
                "error": str
            }
        """
        # Format URL
        url = self.BASE_URL + pattern.format(
            date=test_date,
            period=period_label,
            quarter=period_label
        )

        logger.info(f"Testing: {url}")

        try:
            # Navigate with timeout
            response = await page.goto(url, wait_until="load", timeout=15000)

            # Check response
            status_code = response.status if response else 0

            # Wait for potential Angular rendering
            await page.wait_for_timeout(2000)

            # Get page content
            html = await page.content()

            # Check for indicators of data presence
            has_table = 'table' in html.lower()
            has_codigo = 'código' in html.lower()  # "Código" column in IDIV table
            has_participacao = 'participação' in html.lower()

            # Extract sample data (first row if exists)
            data_sample = None
            if has_table:
                # Try to find first ticker (pattern: 4-6 uppercase letters + number)
                import re
                ticker_match = re.search(r'[A-Z]{4}\d{1,2}', html)
                if ticker_match:
                    data_sample = ticker_match.group(0)

            has_data = has_table and has_codigo and has_participacao

            return {
                "pattern": pattern,
                "url": url,
                "success": True,
                "status_code": status_code,
                "has_data": has_data,
                "data_sample": data_sample,
                "error": None
            }

        except Exception as e:
            logger.error(f"Error testing {url}: {str(e)}")
            return {
                "pattern": pattern,
                "url": url,
                "success": False,
                "status_code": 0,
                "has_data": False,
                "data_sample": None,
                "error": str(e)
            }

    async def run_tests(self) -> List[Dict[str, Any]]:
        """
        Executa todos os testes de URL patterns

        Returns:
            List of test results
        """
        results = []

        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )

            try:
                page = await browser.new_page()

                # Test each pattern with each date
                for pattern in self.URL_PATTERNS:
                    for test_date, period_label in self.TEST_DATES:
                        result = await self.test_url_pattern(
                            page,
                            pattern,
                            test_date,
                            period_label
                        )
                        results.append(result)

                        # Rate limiting (respeitar B3)
                        await asyncio.sleep(2)

            finally:
                await browser.close()

        return results

    def analyze_results(self, results: List[Dict[str, Any]]) -> None:
        """
        Analisa resultados e imprime relatório

        Args:
            results: List of test results from run_tests()
        """
        logger.info("\n" + "="*80)
        logger.info("B3 HISTORICAL URL PATTERNS - TEST RESULTS")
        logger.info("="*80)

        # Group by success
        successful = [r for r in results if r['has_data']]
        failed = [r for r in results if not r['has_data']]

        logger.info(f"\n✅ SUCCESSFUL PATTERNS: {len(successful)}/{len(results)}")
        if successful:
            for result in successful:
                logger.success(f"  {result['pattern']}")
                logger.success(f"    URL: {result['url']}")
                logger.success(f"    Sample: {result['data_sample']}")

        logger.info(f"\n❌ FAILED PATTERNS: {len(failed)}/{len(results)}")
        if failed:
            for result in failed[:5]:  # Show first 5
                logger.warning(f"  {result['pattern']}")
                if result['error']:
                    logger.warning(f"    Error: {result['error']}")

        logger.info("\n" + "="*80)
        logger.info("RECOMMENDATION:")
        logger.info("="*80)

        if successful:
            logger.success(f"✅ USE PATTERN: {successful[0]['pattern']}")
            logger.success("   Historical backfill via B3 direct scraping is FEASIBLE")
        else:
            logger.error("❌ NO WORKING PATTERNS FOUND")
            logger.error("   Fallback required:")
            logger.error("   1. StatusInvest historical scraper")
            logger.error("   2. Wayback Machine archive parsing")
            logger.error("   3. Manual data entry")

        logger.info("="*80 + "\n")


async def main():
    """Main execution"""
    logger.info("Starting B3 IDIV Historical URL Pattern Test...")
    logger.info(f"Testing {len(B3HistoricalTester.URL_PATTERNS)} patterns × {len(B3HistoricalTester.TEST_DATES)} dates")
    logger.info(f"Total requests: {len(B3HistoricalTester.URL_PATTERNS) * len(B3HistoricalTester.TEST_DATES)}\n")

    tester = B3HistoricalTester()
    results = await tester.run_tests()
    tester.analyze_results(results)

    # Save results to file
    import json
    with open('b3_url_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    logger.info("Results saved to: b3_url_test_results.json")


if __name__ == "__main__":
    asyncio.run(main())
