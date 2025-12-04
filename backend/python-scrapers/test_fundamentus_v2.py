#!/usr/bin/env python3
"""
Test Suite for Fundamentus Scraper v2.0

Tests:
1. Asset type detection (Stock, Bank, FII)
2. Category-specific field extraction
3. Coverage validation (90%+ target)
4. Performance (<10s per ticker)

Usage:
    python test_fundamentus_v2.py
    python test_fundamentus_v2.py --quick    # Quick test (1 ticker per type)
    python test_fundamentus_v2.py --full     # Full test (all tickers)
"""

import asyncio
import sys
import time
from typing import Dict, List, Tuple
from dataclasses import dataclass

from scrapers.fundamentus_scraper import FundamentusScraper


@dataclass
class TestResult:
    """Result of a single ticker test"""
    ticker: str
    expected_type: str
    detected_type: str
    success: bool
    fields_extracted: int
    fields_expected: int
    coverage: float
    time_seconds: float
    error: str = None


# Test tickers by category
TEST_TICKERS = {
    "stock": [
        "PETR4",   # Petróleo
        "VALE3",   # Mineração
        "WEGE3",   # Bens Industriais
        "ABEV3",   # Bebidas
        "RENT3",   # Aluguel de Carros
        "RADL3",   # Farmácias
        "GGBR4",   # Siderurgia
        "SUZB3",   # Papel e Celulose
        "JBSS3",   # Alimentos
        "CSAN3",   # Energia
    ],
    "bank": [
        "ITUB4",   # Itaú
        "BBDC4",   # Bradesco
        "BBAS3",   # Banco do Brasil
        "SANB11",  # Santander (Unit)
        "BPAC11",  # BTG Pactual
    ],
    "holding": [
        "ITSA4",   # Itaúsa
        "BRSR6",   # Banrisul
    ],
    "insurance": [
        "BBSE3",   # BB Seguridade
        "SULA11",  # SulAmérica
        "PSSA3",   # Porto Seguro
    ],
    "fii": [
        "HGLG11",  # Logística
        "XPML11",  # Shopping
        "KNCR11",  # Recebíveis
        "VISC11",  # Shopping
        "MXRF11",  # Papel
        "HGBS11",  # Shopping
        "XPLG11",  # Logística
        "BCFF11",  # FOF
    ],
}

# Expected fields per category (minimum for 90% coverage)
EXPECTED_FIELDS = {
    "stock": [
        "ticker", "asset_type", "company_name", "tipo", "setor", "subsetor",
        "price", "p_l", "p_vp", "dy", "roe",
    ],
    "bank": [
        "ticker", "asset_type", "company_name", "tipo", "setor", "subsetor",
        "price", "p_l", "p_vp", "dy", "roe",
    ],
    "holding": [
        "ticker", "asset_type", "company_name", "tipo", "setor", "subsetor",
        "price", "p_l", "p_vp", "dy", "roe",
    ],
    "insurance": [
        "ticker", "asset_type", "company_name", "tipo", "setor", "subsetor",
        "price", "p_l", "p_vp", "dy", "roe",
    ],
    "fii": [
        "ticker", "asset_type", "price", "p_vp", "dy",
    ],
}

# Asset type mapping (expected -> valid detected values)
TYPE_MAPPING = {
    "stock": ["stock"],
    "bank": ["bank", "stock"],  # Banks may be detected as stock if no specific fields
    "holding": ["holding", "stock"],
    "insurance": ["insurance", "stock"],
    "fii": ["fii"],
}


def print_header(title: str):
    """Print formatted header"""
    print(f"\n{'='*70}")
    print(f" {title}")
    print('='*70)


def print_result(result: TestResult):
    """Print single test result"""
    status = "✅" if result.success else "❌"
    type_match = "✓" if result.detected_type in TYPE_MAPPING.get(result.expected_type, []) else "✗"

    print(f"{status} {result.ticker:8} | "
          f"Type: {result.detected_type:10} [{type_match}] | "
          f"Coverage: {result.coverage:5.1f}% | "
          f"Fields: {result.fields_extracted:2}/{result.fields_expected:2} | "
          f"Time: {result.time_seconds:.2f}s")

    if result.error:
        print(f"   └─ Error: {result.error}")


async def test_ticker(
    scraper: FundamentusScraper,
    ticker: str,
    expected_type: str
) -> TestResult:
    """Test a single ticker"""
    start_time = time.time()

    try:
        result = await scraper.scrape(ticker)
        elapsed = time.time() - start_time

        if not result.success:
            return TestResult(
                ticker=ticker,
                expected_type=expected_type,
                detected_type="unknown",
                success=False,
                fields_extracted=0,
                fields_expected=len(EXPECTED_FIELDS.get(expected_type, [])),
                coverage=0.0,
                time_seconds=elapsed,
                error=result.error,
            )

        data = result.data
        detected_type = data.get("asset_type", "unknown")

        # Count extracted fields
        expected_fields = EXPECTED_FIELDS.get(expected_type, [])
        extracted = sum(1 for f in expected_fields if data.get(f) is not None)
        coverage = (extracted / len(expected_fields) * 100) if expected_fields else 0

        # Check if type detection is correct
        type_ok = detected_type in TYPE_MAPPING.get(expected_type, [expected_type])

        return TestResult(
            ticker=ticker,
            expected_type=expected_type,
            detected_type=detected_type,
            success=type_ok and coverage >= 80,  # 80% minimum for success
            fields_extracted=extracted,
            fields_expected=len(expected_fields),
            coverage=coverage,
            time_seconds=elapsed,
        )

    except Exception as e:
        elapsed = time.time() - start_time
        return TestResult(
            ticker=ticker,
            expected_type=expected_type,
            detected_type="error",
            success=False,
            fields_extracted=0,
            fields_expected=len(EXPECTED_FIELDS.get(expected_type, [])),
            coverage=0.0,
            time_seconds=elapsed,
            error=str(e),
        )


async def run_tests(quick: bool = False):
    """Run all tests"""
    print_header("Fundamentus Scraper v2.0 - Test Suite")
    print(f"Mode: {'Quick (1 ticker per type)' if quick else 'Full (all tickers)'}")

    scraper = FundamentusScraper()
    all_results: List[TestResult] = []
    category_stats: Dict[str, Dict] = {}

    try:
        await scraper.initialize()

        for category, tickers in TEST_TICKERS.items():
            print_header(f"Testing {category.upper()}")

            # In quick mode, only test first ticker
            test_list = tickers[:1] if quick else tickers
            category_results = []

            for ticker in test_list:
                result = await test_ticker(scraper, ticker, category)
                print_result(result)
                all_results.append(result)
                category_results.append(result)

            # Calculate category stats
            success_count = sum(1 for r in category_results if r.success)
            avg_coverage = sum(r.coverage for r in category_results) / len(category_results)
            avg_time = sum(r.time_seconds for r in category_results) / len(category_results)

            category_stats[category] = {
                "total": len(category_results),
                "success": success_count,
                "avg_coverage": avg_coverage,
                "avg_time": avg_time,
            }

    finally:
        await scraper.cleanup()

    # Print summary
    print_header("SUMMARY")

    print("\nBy Category:")
    print(f"{'Category':<12} | {'Success':<10} | {'Avg Coverage':<12} | {'Avg Time':<10}")
    print("-" * 50)

    for category, stats in category_stats.items():
        success_rate = stats['success'] / stats['total'] * 100
        print(f"{category:<12} | "
              f"{stats['success']}/{stats['total']} ({success_rate:.0f}%) | "
              f"{stats['avg_coverage']:>10.1f}% | "
              f"{stats['avg_time']:>8.2f}s")

    # Overall stats
    total_tests = len(all_results)
    total_success = sum(1 for r in all_results if r.success)
    overall_coverage = sum(r.coverage for r in all_results) / total_tests
    overall_time = sum(r.time_seconds for r in all_results) / total_tests

    print("-" * 50)
    print(f"{'TOTAL':<12} | "
          f"{total_success}/{total_tests} ({total_success/total_tests*100:.0f}%) | "
          f"{overall_coverage:>10.1f}% | "
          f"{overall_time:>8.2f}s")

    # Check if 90% target is met
    print_header("VALIDATION")

    passed = overall_coverage >= 90
    print(f"Coverage Target: 90%")
    print(f"Actual Coverage: {overall_coverage:.1f}%")
    print(f"Result: {'✅ PASSED' if passed else '❌ FAILED'}")

    return passed


async def main():
    """Main entry point"""
    quick = "--quick" in sys.argv
    full = "--full" in sys.argv

    if full:
        quick = False
    elif not quick:
        # Default to quick mode
        quick = True

    passed = await run_tests(quick=quick)
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    asyncio.run(main())
