"""
Test script for recently migrated scrapers
Tests: Investidor10, Fundamentei, MaisRetorno, B3, TradingView
"""
import asyncio
import sys
sys.path.insert(0, '/app/scrapers')

from loguru import logger

# Configure logger
logger.remove()
logger.add(sys.stdout, format="{time:HH:mm:ss} | {level} | {message}", level="INFO")


async def test_investidor10():
    """Test Investidor10 Scraper"""
    print("\n" + "="*60)
    print("TESTING: Investidor10Scraper")
    print("="*60)

    try:
        from scrapers.investidor10_scraper import Investidor10Scraper
        scraper = Investidor10Scraper()

        await scraper.initialize()
        result = await scraper.scrape("PETR4")

        if result.success:
            data = result.data
            print(f"✅ SUCCESS - Investidor10")
            print(f"   Ticker: {data.get('ticker')}")
            print(f"   Company: {data.get('company_name', 'N/A')}")
            print(f"   Price: {data.get('price', 'N/A')}")
            print(f"   Indicators: {len(data.get('indicators', {}))} fields")
            if data.get('indicators'):
                for k, v in list(data['indicators'].items())[:5]:
                    print(f"      - {k}: {v}")
            return True
        else:
            print(f"❌ FAILED - Investidor10: {result.error}")
            return False

    except Exception as e:
        print(f"❌ ERROR - Investidor10: {e}")
        return False
    finally:
        try:
            await scraper.cleanup()
        except:
            pass


async def test_fundamentei():
    """Test Fundamentei Scraper"""
    print("\n" + "="*60)
    print("TESTING: FundamenteiScraper")
    print("="*60)

    try:
        from scrapers.fundamentei_scraper import FundamenteiScraper
        scraper = FundamenteiScraper()

        await scraper.initialize()
        result = await scraper.scrape("PETR4")

        if result.success:
            data = result.data
            print(f"✅ SUCCESS - Fundamentei")
            print(f"   Ticker: {data.get('ticker')}")
            print(f"   Company: {data.get('company_name', 'N/A')}")
            print(f"   Price: {data.get('price', 'N/A')}")
            print(f"   Indicators: {len(data.get('indicators', {}))} fields")
            if data.get('indicators'):
                for k, v in list(data['indicators'].items())[:5]:
                    print(f"      - {k}: {v}")
            return True
        else:
            print(f"❌ FAILED - Fundamentei: {result.error}")
            return False

    except Exception as e:
        print(f"❌ ERROR - Fundamentei: {e}")
        return False
    finally:
        try:
            await scraper.cleanup()
        except:
            pass


async def test_maisretorno():
    """Test MaisRetorno Scraper"""
    print("\n" + "="*60)
    print("TESTING: MaisRetornoScraper")
    print("="*60)

    try:
        from scrapers.maisretorno_scraper import MaisRetornoScraper
        scraper = MaisRetornoScraper()

        await scraper.initialize()
        result = await scraper.scrape("analise")

        if result.success:
            data = result.data
            print(f"✅ SUCCESS - MaisRetorno")
            print(f"   Query: {data.get('query')}")
            print(f"   Articles: {data.get('articles_count', 0)}")
            if data.get('articles'):
                for article in data['articles'][:3]:
                    print(f"      - {article.get('title', 'N/A')[:50]}...")
            return True
        else:
            print(f"❌ FAILED - MaisRetorno: {result.error}")
            return False

    except Exception as e:
        print(f"❌ ERROR - MaisRetorno: {e}")
        return False
    finally:
        try:
            await scraper.cleanup()
        except:
            pass


async def test_b3():
    """Test B3 Scraper"""
    print("\n" + "="*60)
    print("TESTING: B3Scraper")
    print("="*60)

    try:
        from scrapers.b3_scraper import B3Scraper
        scraper = B3Scraper()

        await scraper.initialize()
        result = await scraper.scrape("PETR4")

        if result.success:
            data = result.data
            print(f"✅ SUCCESS - B3")
            print(f"   Ticker: {data.get('ticker')}")
            print(f"   Company: {data.get('company_name', 'N/A')}")
            print(f"   Official Name: {data.get('official_name', 'N/A')}")
            print(f"   CNPJ: {data.get('cnpj', 'N/A')}")
            print(f"   Sector: {data.get('sector', 'N/A')}")
            return True
        else:
            print(f"❌ FAILED - B3: {result.error}")
            return False

    except Exception as e:
        print(f"❌ ERROR - B3: {e}")
        return False
    finally:
        try:
            await scraper.cleanup()
        except:
            pass


async def test_tradingview():
    """Test TradingView Scraper"""
    print("\n" + "="*60)
    print("TESTING: TradingViewScraper")
    print("="*60)

    try:
        from scrapers.tradingview_scraper import TradingViewScraper
        scraper = TradingViewScraper()

        await scraper.initialize()
        result = await scraper.scrape("PETR4")

        if result.success:
            data = result.data
            print(f"✅ SUCCESS - TradingView")
            print(f"   Ticker: {data.get('ticker')}")
            print(f"   Recommendation: {data.get('recommendation', 'N/A')}")
            print(f"   Oscillators: {len(data.get('oscillators', {}))} fields")
            print(f"   Moving Averages: {len(data.get('moving_averages', {}))} fields")
            print(f"   Technical Indicators: {len(data.get('technical_indicators', {}))} fields")
            return True
        else:
            print(f"❌ FAILED - TradingView: {result.error}")
            return False

    except Exception as e:
        print(f"❌ ERROR - TradingView: {e}")
        return False
    finally:
        try:
            await scraper.cleanup()
        except:
            pass


async def main():
    """Run all tests"""
    print("\n" + "#"*60)
    print("# TESTING MIGRATED SCRAPERS (Playwright)")
    print("#"*60)

    results = {}

    # Test each scraper
    results['Investidor10'] = await test_investidor10()
    results['Fundamentei'] = await test_fundamentei()
    results['MaisRetorno'] = await test_maisretorno()
    results['B3'] = await test_b3()
    results['TradingView'] = await test_tradingview()

    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {name}: {status}")

    print(f"\n   Total: {passed}/{total} passed")
    print("="*60)

    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
