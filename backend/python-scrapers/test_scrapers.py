#!/usr/bin/env python3
"""
Script para testar scrapers individualmente
"""
import asyncio
import sys
from loguru import logger

from scrapers import FundamentusScraper, InvestsiteScraper, StatusInvestScraper


async def test_scraper(scraper_class, ticker: str):
    """Test a specific scraper"""
    scraper = scraper_class()

    logger.info(f"\n{'=' * 60}")
    logger.info(f"Testing {scraper.name} scraper with {ticker}")
    logger.info(f"Source: {scraper.source}")
    logger.info(f"Requires Login: {scraper.requires_login}")
    logger.info(f"{'=' * 60}\n")

    try:
        result = await scraper.scrape_with_retry(ticker)

        if result.success:
            logger.success(f"✅ {scraper.name}: SUCCESS")
            logger.info(f"Response time: {result.response_time:.2f}s")
            logger.info(f"Data keys: {list(result.data.keys())}")
            logger.info(f"\nExtracted Data:")

            # Print important fields
            important_fields = [
                'ticker', 'company_name', 'price', 'p_l', 'p_vp',
                'dy', 'roe', 'roic', 'margem_liquida'
            ]

            for field in important_fields:
                if field in result.data and result.data[field] is not None:
                    logger.info(f"  {field}: {result.data[field]}")

            logger.info(f"\nAll fields with values:")
            for key, value in result.data.items():
                if value is not None:
                    logger.info(f"  {key}: {value}")

        else:
            logger.error(f"❌ {scraper.name}: FAILED")
            logger.error(f"Error: {result.error}")

        return result

    except Exception as e:
        logger.error(f"❌ {scraper.name}: EXCEPTION")
        logger.error(f"Error: {str(e)}")
        return None

    finally:
        await scraper.cleanup()


async def test_all_scrapers(ticker: str = "PETR4"):
    """Test all scrapers with a single ticker"""
    logger.info(f"\n{'#' * 70}")
    logger.info(f"TESTING ALL SCRAPERS WITH TICKER: {ticker}")
    logger.info(f"{'#' * 70}\n")

    scrapers = [
        FundamentusScraper,
        InvestsiteScraper,
        StatusInvestScraper,
    ]

    results = {}

    for scraper_class in scrapers:
        result = await test_scraper(scraper_class, ticker)
        results[scraper_class.__name__] = result

        # Wait between scrapers to be polite
        await asyncio.sleep(2)

    # Summary
    logger.info(f"\n{'#' * 70}")
    logger.info("SUMMARY")
    logger.info(f"{'#' * 70}\n")

    for scraper_name, result in results.items():
        if result and result.success:
            logger.success(f"✅ {scraper_name}: SUCCESS ({result.response_time:.2f}s)")
        else:
            logger.error(f"❌ {scraper_name}: FAILED")

    # Cross-validation
    logger.info(f"\n{'#' * 70}")
    logger.info("CROSS-VALIDATION")
    logger.info(f"{'#' * 70}\n")

    # Compare P/L values from different sources
    pl_values = {}
    for scraper_name, result in results.items():
        if result and result.success and result.data.get('p_l'):
            pl_values[scraper_name] = result.data['p_l']

    if len(pl_values) >= 2:
        logger.info("P/L comparison:")
        for scraper, value in pl_values.items():
            logger.info(f"  {scraper}: {value}")

        # Calculate variance
        values_list = list(pl_values.values())
        avg = sum(values_list) / len(values_list)
        variance = sum((x - avg) ** 2 for x in values_list) / len(values_list)

        logger.info(f"\n  Average: {avg:.2f}")
        logger.info(f"  Variance: {variance:.2f}")

        if variance < 1.0:
            logger.success("  ✅ Values are consistent across sources")
        else:
            logger.warning("  ⚠️  Significant variance detected")

    else:
        logger.warning("Not enough sources returned P/L for comparison")


async def test_multiple_tickers():
    """Test multiple tickers with all scrapers"""
    tickers = ["PETR4", "VALE3", "BBDC4", "ITUB4", "MGLU3"]

    logger.info(f"\n{'#' * 70}")
    logger.info(f"TESTING MULTIPLE TICKERS")
    logger.info(f"Tickers: {', '.join(tickers)}")
    logger.info(f"{'#' * 70}\n")

    for ticker in tickers:
        await test_all_scrapers(ticker)
        await asyncio.sleep(5)  # Be polite between tickers


def main():
    """Main function"""
    # Configure logger
    logger.remove()
    logger.add(
        sys.stdout,
        level="INFO",
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    )

    # Parse arguments
    if len(sys.argv) > 1:
        mode = sys.argv[1]

        if mode == "all":
            # Test all scrapers with default ticker
            ticker = sys.argv[2] if len(sys.argv) > 2 else "PETR4"
            asyncio.run(test_all_scrapers(ticker))

        elif mode == "multiple":
            # Test multiple tickers
            asyncio.run(test_multiple_tickers())

        elif mode == "fundamentus":
            ticker = sys.argv[2] if len(sys.argv) > 2 else "PETR4"
            asyncio.run(test_scraper(FundamentusScraper, ticker))

        elif mode == "investsite":
            ticker = sys.argv[2] if len(sys.argv) > 2 else "PETR4"
            asyncio.run(test_scraper(InvestsiteScraper, ticker))

        elif mode == "statusinvest":
            ticker = sys.argv[2] if len(sys.argv) > 2 else "PETR4"
            asyncio.run(test_scraper(StatusInvestScraper, ticker))

        else:
            print(f"Unknown mode: {mode}")
            print_usage()

    else:
        # Default: test all with PETR4
        asyncio.run(test_all_scrapers("PETR4"))


def print_usage():
    """Print usage instructions"""
    print("\nUsage:")
    print("  python test_scrapers.py                      # Test all scrapers with PETR4")
    print("  python test_scrapers.py all PETR4             # Test all scrapers with specific ticker")
    print("  python test_scrapers.py multiple              # Test multiple tickers")
    print("  python test_scrapers.py fundamentus PETR4     # Test only Fundamentus")
    print("  python test_scrapers.py investsite VALE3      # Test only Investsite")
    print("  python test_scrapers.py statusinvest BBDC4    # Test only StatusInvest")
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("\nInterrupted by user")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)
