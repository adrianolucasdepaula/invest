"""
Test Investsite Scraper (Playwright + BeautifulSoup)
"""
import asyncio
import sys
from loguru import logger

# Setup logging
logger.remove()
logger.add(sys.stdout, level="DEBUG", format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>")

from scrapers.investsite_scraper import InvestsiteScraper


async def test_investsite():
    """Test Investsite scraper with multiple tickers"""
    tickers = ["PETR4", "VALE3", "ITUB4"]

    scraper = InvestsiteScraper()

    try:
        await scraper.initialize()

        for ticker in tickers:
            logger.info(f"\n{'='*50}")
            logger.info(f"Testing {ticker}...")
            logger.info(f"{'='*50}")

            result = await scraper.scrape(ticker)

            if result.success:
                logger.success(f"SUCCESS for {ticker}!")
                data = result.data

                # Print key metrics
                logger.info(f"  Company: {data.get('company_name', 'N/A')}")
                logger.info(f"  Price: R$ {data.get('price', 'N/A')}")
                logger.info(f"  P/L: {data.get('p_l', 'N/A')}")
                logger.info(f"  P/VP: {data.get('p_vp', 'N/A')}")
                logger.info(f"  DY: {data.get('dy', 'N/A')}%")
                logger.info(f"  ROE: {data.get('roe', 'N/A')}%")
                logger.info(f"  ROIC: {data.get('roic', 'N/A')}%")
                logger.info(f"  EV/EBITDA: {data.get('ev_ebitda', 'N/A')}")
                logger.info(f"  Market Cap: R$ {data.get('market_cap', 'N/A')}")
                logger.info(f"  LPA: {data.get('lpa', 'N/A')}")
                logger.info(f"  VPA: {data.get('vpa', 'N/A')}")
                logger.info(f"  Margem Liquida: {data.get('margem_liquida', 'N/A')}%")
                logger.info(f"  Margem Bruta: {data.get('margem_bruta', 'N/A')}%")

                # Count non-null fields
                non_null = sum(1 for v in data.values() if v is not None)
                total = len(data)
                logger.info(f"  Fields extracted: {non_null}/{total}")
            else:
                logger.error(f"FAILED for {ticker}: {result.error}")

            # Small delay between requests
            await asyncio.sleep(2)

    finally:
        await scraper.cleanup()
        logger.info("\nTest completed!")


if __name__ == "__main__":
    asyncio.run(test_investsite())
