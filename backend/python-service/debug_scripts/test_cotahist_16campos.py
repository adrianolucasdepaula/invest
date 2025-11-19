#!/usr/bin/env python3
"""
Teste rápido: Validar parser COTAHIST com 16 campos
"""
import sys
sys.path.insert(0, './backend/python-service')

import asyncio
from app.services.cotahist_service import CotahistService

async def test_16_campos():
    service = CotahistService()
    try:
        print("🔄 Fetching ABEV3 data for 2024...")
        data = await service.fetch_historical_data(
            start_year=2024,
            end_year=2024,
            tickers=['ABEV3']
        )

        print(f"✅ Total records: {len(data)}")

        if data:
            first = data[0]
            print(f"\n📊 First record:")
            print(f"  ticker: {first['ticker']}")
            print(f"  date: {first['date']}")
            print(f"  open: {first['open']}")
            print(f"  high: {first['high']}")
            print(f"  low: {first['low']}")
            print(f"  close: {first['close']}")
            print(f"  volume: {first['volume']}")
            print(f"\n  company_name: {first['company_name']}")
            print(f"  stock_type: {first['stock_type']}")
            print(f"  market_type: {first['market_type']}")
            print(f"  bdi_code: {first['bdi_code']}")
            print(f"  average_price: {first['average_price']}")
            print(f"  best_bid: {first['best_bid']}")
            print(f"  best_ask: {first['best_ask']}")
            print(f"  trades_count: {first['trades_count']}")

            # Validar 16 campos
            expected_fields = [
                'ticker', 'date', 'open', 'high', 'low', 'close', 'volume',
                'company_name', 'stock_type', 'market_type', 'bdi_code',
                'average_price', 'best_bid', 'best_ask', 'trades_count'
            ]

            missing = [f for f in expected_fields if f not in first]
            if missing:
                print(f"\n❌ Missing fields: {missing}")
            else:
                print(f"\n✅ All 15 fields present!")

    finally:
        await service.close()

if __name__ == '__main__':
    asyncio.run(test_16_campos())
