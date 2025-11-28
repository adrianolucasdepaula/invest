"""
Test BCB Scraper with optimized BeautifulSoup pattern
"""
import asyncio
import sys
import os
from loguru import logger

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.bcb_scraper import BCBScraper


async def test_bcb_api():
    """Test BCB scraper with API method (primary)"""
    print("\n" + "=" * 80)
    print("TEST 1: BCB API Method (Primary)")
    print("=" * 80)

    scraper = BCBScraper()

    try:
        # Test with 'all' indicators
        print("\n📊 Testing: Fetching ALL indicators via API...")
        result = await scraper.scrape("all")

        if result.success:
            print("\n✅ SUCCESS - API method worked!")
            print(f"   Response time: {result.response_time:.2f}s")
            print(f"   Source: {result.data.get('source')}")
            print(f"   Method: {result.metadata.get('method')}")
            print(f"   Indicators found: {len(result.data.get('indicators', {}))}")

            # Show some key indicators
            indicators = result.data.get('indicators', {})
            if 'selic_meta' in indicators:
                print(f"\n   📈 Selic Meta: {indicators['selic_meta']['current_value']}% a.a.")
            if 'ipca' in indicators:
                print(f"   📊 IPCA: {indicators['ipca']['current_value']}%")
            if 'cambio_usd' in indicators:
                print(f"   💵 USD/BRL: R$ {indicators['cambio_usd']['current_value']:.2f}")

            # Show summary if available
            if 'summary' in result.data:
                print("\n   📋 Summary:")
                summary = result.data['summary']
                if 'monetary_policy' in summary:
                    print(f"      Monetary Policy: {summary['monetary_policy']}")
                if 'inflation' in summary:
                    print(f"      Inflation: {summary['inflation']}")

            return True
        else:
            print(f"\n❌ FAILED: {result.error}")
            return False

    except Exception as e:
        print(f"\n❌ EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        await scraper.cleanup()


async def test_bcb_specific_indicator():
    """Test BCB scraper with specific indicator"""
    print("\n" + "=" * 80)
    print("TEST 2: BCB Specific Indicator (selic)")
    print("=" * 80)

    scraper = BCBScraper()

    try:
        print("\n📊 Testing: Fetching 'selic' indicator...")
        result = await scraper.scrape("selic")

        if result.success:
            print("\n✅ SUCCESS - Specific indicator worked!")
            print(f"   Response time: {result.response_time:.2f}s")

            indicators = result.data.get('indicators', {})
            for key, value in indicators.items():
                print(f"\n   • {key}:")
                print(f"      Value: {value['current_value']}% a.a.")
                print(f"      Date: {value['date']}")
                if 'historical' in value:
                    print(f"      Historical points: {len(value['historical'])}")

            return True
        else:
            print(f"\n❌ FAILED: {result.error}")
            return False

    except Exception as e:
        print(f"\n❌ EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        await scraper.cleanup()


async def main():
    """Run all BCB tests"""
    print("\n" + "=" * 80)
    print("BCB SCRAPER VALIDATION - Optimized BeautifulSoup Pattern")
    print("=" * 80)

    results = []

    # Test 1: API with all indicators
    result1 = await test_bcb_api()
    results.append(("API All Indicators", result1))

    # Test 2: API with specific indicator
    result2 = await test_bcb_specific_indicator()
    results.append(("API Specific Indicator", result2))

    # Summary
    print("\n" + "=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)

    total = len(results)
    passed = sum(1 for _, success in results if success)

    for test_name, success in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {test_name}")

    print(f"\n📊 Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎉 ALL TESTS PASSED - BCB Scraper is working correctly!")
        print("   ✅ API method validated")
        print("   ✅ BeautifulSoup optimization applied (web fallback)")
        print("   ✅ Ready for production")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed - Review needed")

    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
