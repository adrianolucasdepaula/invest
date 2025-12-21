import asyncio
from scrapers.idiv_scraper import IdivScraper

async def test():
    scraper = IdivScraper()
    try:
        result = await scraper.scrape()
        print(f'Success: {result.success}')
        if result.success:
            print(f'Total assets: {len(result.data["composition"])}')
            print(f'Valid from: {result.data["valid_from"]}')
            print(f'Valid to: {result.data["valid_to"]}')
            print('\nFirst 5 assets:')
            for asset in result.data['composition'][:5]:
                print(f'  {asset["ticker"]}: {asset["participation"]}%')
        else:
            print(f'Error: {result.error}')
    finally:
        await scraper.cleanup()

asyncio.run(test())
