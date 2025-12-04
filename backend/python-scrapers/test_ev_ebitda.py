"""
Test específico para investigar o campo ev_ebitda
"""
import asyncio
from scrapers.fundamentus_scraper import FundamentusScraper
from loguru import logger

async def test_ev_ebitda():
    """Test ev_ebitda extraction"""
    scraper = FundamentusScraper()

    try:
        # Test mapping logic
        test_labels = [
            "EV / EBITDA",
            "ev / ebitda",
            "EV / EBIT",
            "ev / ebit",
            "Cres. Rec (5a)",
            "cres. rec (5a)",
        ]

        print("="*70)
        print("LABEL NORMALIZATION TEST")
        print("="*70)

        for label in test_labels:
            normalized = label.lower().strip().replace("?", "")
            print(f"Original: '{label}' → Normalized: '{normalized}'")

        print("\n" + "="*70)
        print("FULL SCRAPE TEST - PETR4")
        print("="*70)

        result = await scraper.scrape_with_retry("PETR4")

        if result.success:
            data = result.data

            # Check specifically for the missing fields
            missing_fields = {
                "ev_ebitda": data.get("ev_ebitda"),
                "div_liquida_ebit": data.get("div_liquida_ebit"),
                "payout": data.get("payout"),
                "roa": data.get("roa"),
            }

            print(f"\n✅ Scrape SUCCESS - Response time: {result.response_time:.2f}s")
            print(f"\nMISSING FIELDS CHECK:")
            print("-"*70)
            for field, value in missing_fields.items():
                status = "✅" if value is not None else "❌"
                print(f"{status} {field}: {value}")

            # Count filled fields
            filled = sum(1 for v in data.values() if v is not None)
            total = len(data)
            print(f"\n📊 COVERAGE: {filled}/{total} ({filled/total*100:.1f}%)")

        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()

if __name__ == "__main__":
    asyncio.run(test_ev_ebitda())
