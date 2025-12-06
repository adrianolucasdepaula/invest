"""
Validation Script for All Playwright-Migrated Scrapers
Tests each scraper and reports success/failure with data mapping validation

Run: python validate_all_scrapers.py
"""
import asyncio
import json
from datetime import datetime
from typing import Dict, Any, List
from loguru import logger
import sys

# Setup logging
logger.remove()
logger.add(sys.stdout, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>")


class ScraperValidator:
    """Validates all scrapers and their data mapping"""

    def __init__(self):
        self.results: Dict[str, Dict[str, Any]] = {}
        self.start_time = None

    async def validate_scraper(self, scraper_class, test_input: str, expected_fields: List[str], scraper_name: str) -> Dict[str, Any]:
        """
        Validate a single scraper

        Args:
            scraper_class: The scraper class to test
            test_input: Test input (ticker, query, etc)
            expected_fields: List of expected fields in the result data
            scraper_name: Name for logging
        """
        result = {
            "name": scraper_name,
            "input": test_input,
            "success": False,
            "error": None,
            "data_fields": [],
            "missing_fields": [],
            "execution_time": 0,
            "data_sample": None,
        }

        start = datetime.now()
        scraper = None

        try:
            scraper = scraper_class()
            logger.info(f"Testing {scraper_name} with input: {test_input}")

            scrape_result = await scraper.scrape(test_input)

            result["execution_time"] = (datetime.now() - start).total_seconds()

            if scrape_result.success:
                result["success"] = True
                result["data_fields"] = list(scrape_result.data.keys()) if isinstance(scrape_result.data, dict) else ["raw_data"]

                # Check for expected fields
                if isinstance(scrape_result.data, dict):
                    result["missing_fields"] = [f for f in expected_fields if f not in scrape_result.data]

                # Store data sample (truncated for large data)
                result["data_sample"] = self._truncate_data(scrape_result.data)

                logger.success(f"✅ {scraper_name}: SUCCESS in {result['execution_time']:.1f}s")
                if result["missing_fields"]:
                    logger.warning(f"   Missing fields: {result['missing_fields']}")
            else:
                result["error"] = scrape_result.error
                logger.error(f"❌ {scraper_name}: FAILED - {scrape_result.error}")

        except Exception as e:
            result["error"] = str(e)
            result["execution_time"] = (datetime.now() - start).total_seconds()
            logger.error(f"❌ {scraper_name}: EXCEPTION - {e}")

        finally:
            if scraper:
                try:
                    await scraper.cleanup()
                except:
                    pass

        return result

    def _truncate_data(self, data: Any, max_length: int = 500) -> Any:
        """Truncate data for sample display"""
        if isinstance(data, dict):
            truncated = {}
            for k, v in data.items():
                if isinstance(v, str) and len(v) > max_length:
                    truncated[k] = v[:max_length] + "..."
                elif isinstance(v, list) and len(v) > 3:
                    truncated[k] = f"[{len(v)} items]"
                else:
                    truncated[k] = v
            return truncated
        return data

    async def run_all_validations(self):
        """Run validation for all scrapers"""
        self.start_time = datetime.now()

        logger.info("=" * 60)
        logger.info("SCRAPER VALIDATION SUITE")
        logger.info("=" * 60)

        # Import all scrapers
        from scrapers import (
            FundamentusScraper, BCBScraper, StatusInvestScraper,
            InvestsiteScraper, Investidor10Scraper, TradingViewScraper,
            GoogleFinanceScraper, GriffinScraper, CoinMarketCapScraper,
            BloombergScraper, GoogleNewsScraper, InvestingNewsScraper,
            ValorScraper, ExameScraper, InfoMoneyScraper, EstadaoScraper,
            ChatGPTScraper, GeminiScraper, DeepSeekScraper, ClaudeScraper, GrokScraper,
            OpcoesNetScraper,
        )

        # Define test configurations
        # Format: (ScraperClass, test_input, expected_fields, name)
        test_configs = [
            # ===== FUNDAMENTAL DATA SCRAPERS (PUBLIC) =====
            (FundamentusScraper, "PETR4", ["ticker", "cotacao", "pl", "pvp"], "Fundamentus"),
            (BCBScraper, "selic", ["indicator", "value"], "BCB"),
            (StatusInvestScraper, "PETR4", ["ticker"], "StatusInvest"),
            (InvestsiteScraper, "PETR4", ["ticker"], "Investsite"),
            (Investidor10Scraper, "PETR4", ["ticker"], "Investidor10"),
            (TradingViewScraper, "PETR4", ["ticker", "price"], "TradingView"),
            (GoogleFinanceScraper, "PETR4", ["ticker", "price"], "GoogleFinance"),
            (GriffinScraper, "PETR4", ["ticker", "insider_transactions"], "Griffin"),
            (CoinMarketCapScraper, "BTC", ["symbol", "price_usd"], "CoinMarketCap"),

            # ===== NEWS SCRAPERS =====
            (BloombergScraper, "mercado", ["articles"], "Bloomberg"),
            (GoogleNewsScraper, "PETR4", ["articles"], "GoogleNews"),
            (ValorScraper, "mercados", ["articles"], "Valor"),
            (ExameScraper, "mercado", ["articles"], "Exame"),
            (InfoMoneyScraper, "mercados", ["articles"], "InfoMoney"),
            (EstadaoScraper, "mercado", ["articles"], "Estadao"),
            (InvestingNewsScraper, "latest", ["articles"], "InvestingNews"),

            # ===== AI SCRAPERS (Require OAuth cookies) =====
            (ChatGPTScraper, "Qual é a capital do Brasil?", ["response"], "ChatGPT"),
            (GeminiScraper, "Qual é a capital do Brasil?", ["response"], "Gemini"),
            (DeepSeekScraper, "Qual é a capital do Brasil?", ["response"], "DeepSeek"),
            (ClaudeScraper, "Qual é a capital do Brasil?", ["response"], "Claude"),
            (GrokScraper, "Qual é a capital do Brasil?", ["response"], "Grok"),

            # ===== OPTIONS SCRAPER (Requires credentials) =====
            (OpcoesNetScraper, "PETR", ["ticker", "options_chain"], "OpcoesNet"),
        ]

        # Group by category
        categories = {
            "Fundamental Data": test_configs[:9],
            "News": test_configs[9:16],
            "AI": test_configs[16:21],
            "Options": test_configs[21:],
        }

        for category, configs in categories.items():
            logger.info("")
            logger.info(f"{'='*20} {category} {'='*20}")

            for scraper_class, test_input, expected_fields, name in configs:
                result = await self.validate_scraper(
                    scraper_class, test_input, expected_fields, name
                )
                self.results[name] = result

                # Small delay between scrapers to avoid rate limiting
                await asyncio.sleep(1)

        # Generate report
        self._generate_report()

    def _generate_report(self):
        """Generate final validation report"""
        logger.info("")
        logger.info("=" * 60)
        logger.info("VALIDATION REPORT")
        logger.info("=" * 60)

        total = len(self.results)
        successful = sum(1 for r in self.results.values() if r["success"])
        failed = total - successful

        total_time = (datetime.now() - self.start_time).total_seconds()

        logger.info(f"Total Scrapers: {total}")
        logger.info(f"Successful: {successful} ({successful/total*100:.1f}%)")
        logger.info(f"Failed: {failed} ({failed/total*100:.1f}%)")
        logger.info(f"Total Time: {total_time:.1f}s")
        logger.info("")

        # Detailed results
        logger.info("DETAILED RESULTS:")
        logger.info("-" * 60)

        for name, result in self.results.items():
            status = "✅" if result["success"] else "❌"
            time_str = f"{result['execution_time']:.1f}s"

            if result["success"]:
                fields = len(result["data_fields"])
                missing = len(result["missing_fields"])
                logger.info(f"{status} {name:20} | {time_str:6} | {fields} fields | {missing} missing")
            else:
                error = result["error"][:50] if result["error"] else "Unknown"
                logger.info(f"{status} {name:20} | {time_str:6} | Error: {error}")

        # Save report to file
        report_file = f"/app/data/validation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(report_file, 'w') as f:
                json.dump({
                    "timestamp": datetime.now().isoformat(),
                    "total": total,
                    "successful": successful,
                    "failed": failed,
                    "total_time": total_time,
                    "results": self.results,
                }, f, indent=2, default=str)
            logger.info(f"\nReport saved to: {report_file}")
        except Exception as e:
            logger.warning(f"Could not save report: {e}")

        # List failures
        if failed > 0:
            logger.info("")
            logger.info("FAILURES TO INVESTIGATE:")
            for name, result in self.results.items():
                if not result["success"]:
                    logger.error(f"  - {name}: {result['error']}")


async def main():
    """Main entry point"""
    validator = ScraperValidator()
    await validator.run_all_validations()


if __name__ == "__main__":
    asyncio.run(main())
