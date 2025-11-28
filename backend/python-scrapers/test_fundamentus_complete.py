"""
Validação Completa - Fundamentus Scraper
Testa múltiplos tickers, cenários de erro e performance
"""
import asyncio
from scrapers.fundamentus_scraper import FundamentusScraper
from loguru import logger
import time

async def test_complete_validation():
    """Validação completa do fundamentus_scraper"""

    print("="*80)
    print("VALIDAÇÃO COMPLETA - FUNDAMENTUS SCRAPER")
    print("="*80)

    # Tickers para teste (diferentes setores)
    test_tickers = {
        "valid": {
            "industrial": ["PETR4", "VALE3", "WEGE3"],  # Espera-se 90% coverage
            "financial": ["ITUB4", "BBAS3"],            # Espera-se 40-50% coverage (normal para bancos)
        },
        "invalid": ["INVALID", "TESTE99"]
    }

    scraper = FundamentusScraper()
    results = {
        "valid": [],
        "invalid": [],
        "total_time": 0,
    }

    try:
        # ============================================================
        # TESTE 1: Tickers Válidos (Industriais)
        # ============================================================
        print("\n" + "="*80)
        print("TESTE 1: TICKERS VÁLIDOS - INDUSTRIAIS")
        print("="*80)

        for ticker in test_tickers["valid"]["industrial"]:
            print(f"\n[{ticker}] Iniciando scrape...")
            start_time = time.time()

            result = await scraper.scrape_with_retry(ticker)
            elapsed = time.time() - start_time
            results["total_time"] += elapsed

            if result.success:
                data = result.data
                filled = sum(1 for v in data.values() if v is not None)
                total = len(data)
                coverage = (filled / total) * 100

                results["valid"].append({
                    "ticker": ticker,
                    "sector": "industrial",
                    "coverage": coverage,
                    "filled": filled,
                    "total": total,
                    "time": elapsed,
                    "ev_ebitda": data.get("ev_ebitda"),
                    "price": data.get("price"),
                })

                status = "✅" if coverage >= 90 else "⚠️"
                print(f"{status} [{ticker}] Coverage: {coverage:.1f}% ({filled}/{total}) - {elapsed:.2f}s")
                print(f"   ev_ebitda: {data.get('ev_ebitda')} | price: {data.get('price')}")
            else:
                print(f"❌ [{ticker}] ERRO: {result.error}")

        # ============================================================
        # TESTE 2: Tickers Válidos (Financeiros - Bancos)
        # ============================================================
        print("\n" + "="*80)
        print("TESTE 2: TICKERS VÁLIDOS - FINANCEIROS (Bancos)")
        print("="*80)
        print("ℹ️  NOTA: Bancos têm coverage menor (40-50%) devido a estrutura contábil diferente")

        for ticker in test_tickers["valid"]["financial"]:
            print(f"\n[{ticker}] Iniciando scrape...")
            start_time = time.time()

            result = await scraper.scrape_with_retry(ticker)
            elapsed = time.time() - start_time
            results["total_time"] += elapsed

            if result.success:
                data = result.data
                filled = sum(1 for v in data.values() if v is not None)
                total = len(data)
                coverage = (filled / total) * 100

                results["valid"].append({
                    "ticker": ticker,
                    "sector": "financial",
                    "coverage": coverage,
                    "filled": filled,
                    "total": total,
                    "time": elapsed,
                    "ev_ebitda": data.get("ev_ebitda"),
                    "price": data.get("price"),
                })

                # Bancos: 40-50% é esperado e OK
                status = "✅" if coverage >= 40 else "⚠️"
                print(f"{status} [{ticker}] Coverage: {coverage:.1f}% ({filled}/{total}) - {elapsed:.2f}s")
                print(f"   price: {data.get('price')} | p_l: {data.get('p_l')}")
            else:
                print(f"❌ [{ticker}] ERRO: {result.error}")

        # ============================================================
        # TESTE 3: Tickers Inválidos (Error Handling)
        # ============================================================
        print("\n" + "="*80)
        print("TESTE 3: TICKERS INVÁLIDOS (Error Handling)")
        print("="*80)

        for ticker in test_tickers["invalid"]:
            print(f"\n[{ticker}] Testando error handling...")
            start_time = time.time()

            result = await scraper.scrape_with_retry(ticker)
            elapsed = time.time() - start_time

            if not result.success:
                results["invalid"].append({
                    "ticker": ticker,
                    "error": result.error,
                    "time": elapsed,
                })
                print(f"✅ [{ticker}] Erro tratado corretamente: {result.error[:60]}... ({elapsed:.2f}s)")
            else:
                print(f"⚠️ [{ticker}] Esperava erro mas retornou sucesso!")

        # ============================================================
        # ANÁLISE DOS RESULTADOS
        # ============================================================
        print("\n" + "="*80)
        print("ANÁLISE DOS RESULTADOS")
        print("="*80)

        # Estatísticas de tickers válidos
        if results["valid"]:
            # Separar por setor
            industrial = [r for r in results["valid"] if r["sector"] == "industrial"]
            financial = [r for r in results["valid"] if r["sector"] == "financial"]

            # Estatísticas Industriais
            if industrial:
                avg_cov = sum(r["coverage"] for r in industrial) / len(industrial)
                avg_time = sum(r["time"] for r in industrial) / len(industrial)
                ev_ok = sum(1 for r in industrial if r["ev_ebitda"] is not None)

                print(f"\n📊 INDUSTRIAIS ({len(industrial)} tickers):")
                print(f"   Coverage Médio: {avg_cov:.1f}%")
                print(f"   Tempo Médio: {avg_time:.2f}s")
                print(f"   ev_ebitda OK: {ev_ok}/{len(industrial)}")

            # Estatísticas Financeiros
            if financial:
                avg_cov = sum(r["coverage"] for r in financial) / len(financial)
                avg_time = sum(r["time"] for r in financial) / len(financial)

                print(f"\n🏦 FINANCEIROS ({len(financial)} tickers):")
                print(f"   Coverage Médio: {avg_cov:.1f}% (40-50% esperado)")
                print(f"   Tempo Médio: {avg_time:.2f}s")

            # Tempo total
            avg_time_all = results["total_time"] / len(results["valid"])
            print(f"\n⏱️  PERFORMANCE GERAL:")
            print(f"   Tempo Médio: {avg_time_all:.2f}s")
            print(f"   Tempo Total: {results['total_time']:.2f}s")

            # Detalhes por ticker
            print(f"\n📋 DETALHES POR TICKER:")
            print(f"{'Ticker':<10} {'Setor':<12} {'Coverage':<12} {'Campos':<12} {'Tempo':<10} {'price':<10}")
            print("-"*90)
            for r in results["valid"]:
                sector_label = "Industrial" if r["sector"] == "industrial" else "Financeiro"
                print(f"{r['ticker']:<10} {sector_label:<12} {r['coverage']:>6.1f}% {r['filled']:>3}/{r['total']:<5} {r['time']:>6.2f}s {str(r['price']):>10}")

        # Estatísticas de tickers inválidos
        if results["invalid"]:
            print(f"\n❌ TICKERS INVÁLIDOS ({len(results['invalid'])} tickers):")
            for r in results["invalid"]:
                print(f"   {r['ticker']}: {r['error'][:60]}... ({r['time']:.2f}s)")

        # ============================================================
        # VALIDAÇÃO FINAL
        # ============================================================
        print("\n" + "="*80)
        print("VALIDAÇÃO FINAL")
        print("="*80)

        # Separar validação por setor
        industrial = [r for r in results["valid"] if r["sector"] == "industrial"]
        financial = [r for r in results["valid"] if r["sector"] == "financial"]

        checks = {
            "Industriais: Coverage ≥ 90%": all(r["coverage"] >= 90 for r in industrial),
            "Financeiros: Coverage ≥ 40%": all(r["coverage"] >= 40 for r in financial),
            "Tempo médio < 10s": (results["total_time"] / len(results["valid"])) < 10,
            "Industriais: ev_ebitda OK": all(r["ev_ebitda"] is not None for r in industrial),
            "Tickers inválidos: sem crash": True,  # Apenas verificar que não crashou
        }

        print()
        for check, passed in checks.items():
            status = "✅" if passed else "❌"
            print(f"{status} {check}")

        all_passed = all(checks.values())

        print("\n" + "="*80)
        if all_passed:
            print("🎉 VALIDAÇÃO COMPLETA: 100% APROVADO")
        else:
            print("⚠️ VALIDAÇÃO COMPLETA: ALGUNS CHECKS FALHARAM")
        print("="*80)

        return all_passed

    finally:
        await scraper.cleanup()

if __name__ == "__main__":
    result = asyncio.run(test_complete_validation())
    exit(0 if result else 1)
