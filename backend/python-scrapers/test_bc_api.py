"""
Script de teste para validar as 5 novas séries do BC Brasil
FASE 1.4 - Novos Indicadores Econômicos
"""
import asyncio
import aiohttp
import json
from datetime import datetime, timedelta

# Novas séries adicionadas na FASE 1.4
NEW_SERIES = {
    "ipca_15": 7478,           # IPCA-15 (% mensal)
    "idp_ingressos": 22886,    # Investimento Direto País - Ingressos
    "ide_saidas": 22867,       # Investimento Direto Exterior - Saídas
    "idp_liquido": 22888,      # IDP - Participação capital líquido
    "reservas_ouro": 23044,    # Ouro monetário (milhões)
}

API_SGS_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados"

async def test_serie(session, name, code):
    """Test a single BC series"""
    try:
        # Get last 12 months of data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365)

        url = API_SGS_URL.format(serie=code)
        params = {
            "formato": "json",
            "dataInicial": start_date.strftime("%d/%m/%Y"),
            "dataFinal": end_date.strftime("%d/%m/%Y"),
        }

        print(f"\n{'='*60}")
        print(f"Testing: {name} (código: {code})")
        print(f"URL: {url}")
        print(f"Period: {start_date.strftime('%d/%m/%Y')} to {end_date.strftime('%d/%m/%Y')}")
        print(f"{'='*60}")

        async with session.get(url, params=params, timeout=15) as response:
            status = response.status
            print(f"Status: {status}")

            if status == 200:
                data = await response.json()

                if data:
                    print(f"✅ SUCCESS - Retrieved {len(data)} data points")
                    print(f"\nFirst entry:")
                    print(json.dumps(data[0], indent=2, ensure_ascii=False))
                    print(f"\nLast entry:")
                    print(json.dumps(data[-1], indent=2, ensure_ascii=False))
                    print(f"\nSample values (last 5):")
                    for entry in data[-5:]:
                        print(f"  {entry['data']}: {entry['valor']}")
                    return True
                else:
                    print(f"⚠️  WARNING - No data returned")
                    return False
            else:
                text = await response.text()
                print(f"❌ ERROR - Status {status}")
                print(f"Response: {text[:200]}")
                return False

    except Exception as e:
        print(f"❌ EXCEPTION - {e}")
        return False

async def main():
    """Test all new BC series"""
    print(f"\n🔍 TESTE DE VALIDAÇÃO - 5 NOVAS SÉRIES BC BRASIL")
    print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"FASE 1.4 - Novos Indicadores Econômicos\n")

    results = {}

    async with aiohttp.ClientSession() as session:
        for name, code in NEW_SERIES.items():
            success = await test_serie(session, name, code)
            results[name] = success
            await asyncio.sleep(1)  # Rate limiting - be polite to BC API

    # Summary
    print(f"\n{'='*60}")
    print(f"SUMMARY OF RESULTS")
    print(f"{'='*60}")

    total = len(results)
    success_count = sum(1 for v in results.values() if v)

    for name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        code = NEW_SERIES[name]
        print(f"{status} - {name} (código: {code})")

    print(f"\nTotal: {success_count}/{total} series validated successfully")

    if success_count == total:
        print(f"\n🎉 ALL TESTS PASSED! All 5 new BC series are working correctly.")
        return 0
    else:
        print(f"\n⚠️  SOME TESTS FAILED! Please review the errors above.")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
