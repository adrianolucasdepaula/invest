#!/usr/bin/env python3
"""Simple test for fundamentus_scraper with Playwright"""

import asyncio
import sys
sys.path.insert(0, '/app')

from scrapers.fundamentus_scraper import FundamentusScraper

async def test():
    print('='*70)
    print('FUNDAMENTUS SCRAPER TEST - PLAYWRIGHT MIGRATION VALIDATION')
    print('='*70)

    scraper = FundamentusScraper()

    try:
        print('\n[1/5] Scraping PETR4...')
        result = await scraper.scrape_with_retry('PETR4')

        print(f'\n[2/5] Result status: {"✅ SUCCESS" if result.success else "❌ FAILED"}')

        if result.success:
            print(f'[3/5] Source: {result.source}')
            if result.data:
                print(f'[4/5] Data sample (first 15 fields):')
                for i, (key, value) in enumerate(list(result.data.items())[:15], 1):
                    print(f'      {i:2d}. {key:20s} = {value}')
                print(f'\n[5/5] ✅ TOTAL FIELDS EXTRACTED: {len(result.data)}')
                print('\n' + '='*70)
                print('MIGRATION VALIDATION: SUCCESS')
                print('='*70)
            else:
                print('[ERROR] No data returned!')
        else:
            print(f'[ERROR] {result.error}')
            print('\n' + '='*70)
            print('MIGRATION VALIDATION: FAILED')
            print('='*70)

    except Exception as e:
        print(f'\n[EXCEPTION] {type(e).__name__}: {e}')
        import traceback
        traceback.print_exc()
        print('\n' + '='*70)
        print('MIGRATION VALIDATION: EXCEPTION')
        print('='*70)
    finally:
        print('\nCleaning up...')
        await scraper.cleanup()
        print('Done!\n')

if __name__ == '__main__':
    asyncio.run(test())
