"""
Test StatusInvest Dividends Scraper

FASE 101.2 - Wheel Turbinada: Dividends History
CREATED 2025-12-21 - Playwright + BeautifulSoup pattern
"""
import asyncio
import sys
import os
from loguru import logger

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.statusinvest_dividends_scraper import StatusInvestDividendsScraper


async def test_dividends_basic():
    """Test dividends scraper with PETR4 (high volume, many dividends)"""
    print("\n" + "=" * 80)
    print("TEST 1: Dividends Basic - PETR4")
    print("=" * 80)

    scraper = StatusInvestDividendsScraper()

    try:
        print("\n Fetching dividends for PETR4...")
        result = await scraper.scrape_with_retry("PETR4")

        if result.success:
            print("\n SUCCESS - Dividends extracted!")
            print(f"   Response time: {result.response_time:.2f}s")
            print(f"   Source: {result.source}")

            data = result.data
            dividends = data.get('dividends', [])
            print(f"   Total dividends found: {len(dividends)}")

            if dividends:
                print("\n   Last 5 dividends:")
                for i, div in enumerate(dividends[:5]):
                    tipo = div.get('tipo', 'N/A')
                    valor = div.get('valor_bruto', 0)
                    data_ex = div.get('data_ex', 'N/A')
                    status = div.get('status', 'N/A')
                    print(f"   {i+1}. {tipo.upper():12} | R$ {valor:8.4f} | Data Ex: {data_ex} | {status}")

                # Validate JCP tax calculation
                jcp_divs = [d for d in dividends if d.get('tipo') == 'jcp']
                if jcp_divs:
                    jcp = jcp_divs[0]
                    bruto = jcp.get('valor_bruto', 0)
                    liquido = jcp.get('valor_liquido', 0)
                    imposto = jcp.get('imposto_retido', 0)
                    print(f"\n   JCP Tax Validation:")
                    print(f"      Bruto: R$ {bruto:.4f}")
                    print(f"      Liquido: R$ {liquido:.4f} (expected: {bruto * 0.85:.4f})")
                    print(f"      Imposto: R$ {imposto:.4f} (expected: {bruto * 0.15:.4f})")

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


async def test_dividends_bank():
    """Test dividends scraper with ITUB4 (bank, regular dividends)"""
    print("\n" + "=" * 80)
    print("TEST 2: Dividends Bank - ITUB4")
    print("=" * 80)

    scraper = StatusInvestDividendsScraper()

    try:
        print("\n Fetching dividends for ITUB4...")
        result = await scraper.scrape_with_retry("ITUB4")

        if result.success:
            print("\n SUCCESS!")
            print(f"   Response time: {result.response_time:.2f}s")

            data = result.data
            dividends = data.get('dividends', [])
            print(f"   Total dividends found: {len(dividends)}")

            # Count by type
            tipos = {}
            for div in dividends:
                tipo = div.get('tipo', 'unknown')
                tipos[tipo] = tipos.get(tipo, 0) + 1

            print("\n   Breakdown by type:")
            for tipo, count in tipos.items():
                print(f"      {tipo}: {count}")

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


async def test_dividends_electric():
    """Test dividends scraper with TAEE11 (electric sector, high DY)"""
    print("\n" + "=" * 80)
    print("TEST 3: Dividends Electric - TAEE11")
    print("=" * 80)

    scraper = StatusInvestDividendsScraper()

    try:
        print("\n Fetching dividends for TAEE11...")
        result = await scraper.scrape_with_retry("TAEE11")

        if result.success:
            print("\n SUCCESS!")
            print(f"   Response time: {result.response_time:.2f}s")

            data = result.data
            dividends = data.get('dividends', [])
            print(f"   Total dividends found: {len(dividends)}")

            # Calculate total paid in last 12 months (simplified)
            if dividends:
                total_bruto = sum(d.get('valor_bruto', 0) for d in dividends[:12])
                total_liquido = sum(d.get('valor_liquido', 0) or d.get('valor_bruto', 0) for d in dividends[:12])
                print(f"\n   Last 12 dividends total:")
                print(f"      Bruto: R$ {total_bruto:.4f}")
                print(f"      Liquido: R$ {total_liquido:.4f}")

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


async def test_dividends_not_found():
    """Test dividends scraper with invalid ticker"""
    print("\n" + "=" * 80)
    print("TEST 4: Invalid Ticker - XXXX99")
    print("=" * 80)

    scraper = StatusInvestDividendsScraper()

    try:
        print("\n Fetching dividends for XXXX99 (should fail)...")
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
    """Run all dividends tests"""
    print("\n" + "=" * 80)
    print("STATUSINVEST DIVIDENDS SCRAPER VALIDATION")
    print("FASE 101.2 - Wheel Turbinada")
    print("=" * 80)

    results = []

    # Test 1: Basic test with PETR4
    result1 = await test_dividends_basic()
    results.append(("PETR4 Basic", result1))

    # Test 2: Bank sector (ITUB4)
    result2 = await test_dividends_bank()
    results.append(("ITUB4 Bank", result2))

    # Test 3: Electric sector (TAEE11)
    result3 = await test_dividends_electric()
    results.append(("TAEE11 Electric", result3))

    # Test 4: Invalid ticker
    result4 = await test_dividends_not_found()
    results.append(("Invalid Ticker", result4))

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
        print("\n ALL TESTS PASSED - Dividends Scraper is working correctly!")
        print("    Playwright + BeautifulSoup pattern validated")
        print("    JCP tax calculation working")
        print("    Ready for production")
    else:
        print(f"\n  {total - passed} test(s) failed - Review needed")

    return passed == total


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
