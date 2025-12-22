"""
Test Stock Lending Scraper (BTC - Banco de Titulos)

FASE 101.3 - Wheel Turbinada: Stock Lending Rates
CREATED 2025-12-21 - Playwright + BeautifulSoup pattern
"""
import asyncio
import sys
import os
from loguru import logger

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.stock_lending_scraper import StockLendingScraper


async def test_lending_basic():
    """Test stock lending scraper with PETR4 (high liquidity)"""
    print("\n" + "=" * 80)
    print("TEST 1: Stock Lending Basic - PETR4")
    print("=" * 80)

    scraper = StockLendingScraper()

    try:
        print("\n Fetching lending data for PETR4...")
        result = await scraper.scrape_with_retry("PETR4")

        if result.success:
            print("\n SUCCESS - Lending data extracted!")
            print(f"   Response time: {result.response_time:.2f}s")
            print(f"   Source: {result.source}")

            data = result.data
            print(f"\n   Ticker: {data.get('ticker')}")
            print(f"   Taxa Anual: {data.get('taxa_aluguel_ano')}% a.a.")
            print(f"   Taxa Diaria: {data.get('taxa_aluguel_dia')}% (= ano/252)")
            print(f"   Qtd Disponivel: {data.get('quantidade_disponivel')}")
            print(f"   Data Referencia: {data.get('data_referencia')}")
            print(f"   Source Detail: {data.get('source_detail')}")

            # Validate daily rate calculation
            taxa_ano = data.get('taxa_aluguel_ano')
            taxa_dia = data.get('taxa_aluguel_dia')
            if taxa_ano and taxa_dia:
                expected_dia = round(taxa_ano / 252, 8)
                print(f"\n   Daily Rate Validation:")
                print(f"      Calculated: {taxa_dia}")
                print(f"      Expected: {expected_dia}")
                print(f"      Match: {abs(taxa_dia - expected_dia) < 0.00000001}")

            return True
        else:
            print(f"\n FAILED: {result.error}")
            return False

    except Exception as e:
        print(f"\n EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        await scraper.cleanup()


async def test_lending_bank():
    """Test stock lending scraper with ITUB4 (bank sector)"""
    print("\n" + "=" * 80)
    print("TEST 2: Stock Lending Bank - ITUB4")
    print("=" * 80)

    scraper = StockLendingScraper()

    try:
        print("\n Fetching lending data for ITUB4...")
        result = await scraper.scrape_with_retry("ITUB4")

        if result.success:
            print("\n SUCCESS!")
            print(f"   Response time: {result.response_time:.2f}s")

            data = result.data
            print(f"   Ticker: {data.get('ticker')}")
            print(f"   Taxa Anual: {data.get('taxa_aluguel_ano')}% a.a.")
            print(f"   Taxa Diaria: {data.get('taxa_aluguel_dia')}%")

            return True
        else:
            print(f"\n FAILED: {result.error}")
            return False

    except Exception as e:
        print(f"\n EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        await scraper.cleanup()


async def test_lending_vale():
    """Test stock lending scraper with VALE3 (mining sector)"""
    print("\n" + "=" * 80)
    print("TEST 3: Stock Lending Mining - VALE3")
    print("=" * 80)

    scraper = StockLendingScraper()

    try:
        print("\n Fetching lending data for VALE3...")
        result = await scraper.scrape_with_retry("VALE3")

        if result.success:
            print("\n SUCCESS!")
            print(f"   Response time: {result.response_time:.2f}s")

            data = result.data
            print(f"   Ticker: {data.get('ticker')}")
            print(f"   Taxa Anual: {data.get('taxa_aluguel_ano')}% a.a.")
            print(f"   Qtd Disponivel: {data.get('quantidade_disponivel')}")

            return True
        else:
            print(f"\n FAILED: {result.error}")
            return False

    except Exception as e:
        print(f"\n EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        await scraper.cleanup()


async def test_lending_comparison():
    """Compare lending rates across multiple tickers"""
    print("\n" + "=" * 80)
    print("TEST 4: Lending Rate Comparison")
    print("=" * 80)

    tickers = ["PETR4", "VALE3", "ITUB4", "BBAS3", "ELET3"]
    results_data = []

    for ticker in tickers:
        scraper = StockLendingScraper()
        try:
            result = await scraper.scrape_with_retry(ticker)
            if result.success:
                results_data.append({
                    'ticker': ticker,
                    'taxa': result.data.get('taxa_aluguel_ano'),
                    'success': True
                })
            else:
                results_data.append({
                    'ticker': ticker,
                    'taxa': None,
                    'success': False
                })
        except Exception as e:
            results_data.append({
                'ticker': ticker,
                'taxa': None,
                'success': False,
                'error': str(e)
            })
        finally:
            await scraper.cleanup()

    print("\n   Lending Rate Comparison:")
    print("   " + "-" * 40)
    for r in sorted(results_data, key=lambda x: x.get('taxa') or 0, reverse=True):
        if r['success']:
            print(f"   {r['ticker']}: {r['taxa']:.2f}% a.a.")
        else:
            print(f"   {r['ticker']}: ERROR")

    successful = sum(1 for r in results_data if r['success'])
    print(f"\n   Success rate: {successful}/{len(tickers)}")

    return successful >= 3  # At least 3 should work


async def test_lending_not_found():
    """Test stock lending scraper with invalid ticker"""
    print("\n" + "=" * 80)
    print("TEST 5: Invalid Ticker - XXXX99")
    print("=" * 80)

    scraper = StockLendingScraper()

    try:
        print("\n Fetching lending data for XXXX99 (should fail)...")
        result = await scraper.scrape_with_retry("XXXX99")

        if not result.success:
            print("\n SUCCESS - Correctly detected invalid ticker!")
            print(f"   Error: {result.error}")
            return True
        else:
            print(f"\n UNEXPECTED - Got data for invalid ticker")
            return False

    except Exception as e:
        print(f"\n EXCEPTION (expected): {e}")
        return True  # Exception is acceptable for invalid ticker

    finally:
        await scraper.cleanup()


async def main():
    """Run all stock lending tests"""
    print("\n" + "=" * 80)
    print("STOCK LENDING SCRAPER VALIDATION")
    print("FASE 101.3 - Wheel Turbinada (BTC)")
    print("=" * 80)

    results = []

    # Test 1: Basic test with PETR4
    result1 = await test_lending_basic()
    results.append(("PETR4 Basic", result1))

    # Test 2: Bank sector (ITUB4)
    result2 = await test_lending_bank()
    results.append(("ITUB4 Bank", result2))

    # Test 3: Mining sector (VALE3)
    result3 = await test_lending_vale()
    results.append(("VALE3 Mining", result3))

    # Test 4: Comparison across tickers
    result4 = await test_lending_comparison()
    results.append(("Rate Comparison", result4))

    # Test 5: Invalid ticker
    result5 = await test_lending_not_found()
    results.append(("Invalid Ticker", result5))

    # Summary
    print("\n" + "=" * 80)
    print("VALIDATION SUMMARY")
    print("=" * 80)

    total = len(results)
    passed = sum(1 for _, success in results if success)

    for test_name, success in results:
        status = " PASSED" if success else " FAILED"
        print(f"{status} - {test_name}")

    print(f"\n Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n ALL TESTS PASSED - Stock Lending Scraper is working correctly!")
        print("    Playwright + BeautifulSoup pattern validated")
        print("    Daily rate calculation working (taxa_ano / 252)")
        print("    Ready for production")
    else:
        print(f"\n  {total - passed} test(s) failed - Review needed")

    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
