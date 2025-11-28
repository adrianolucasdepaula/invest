#!/usr/bin/env python3
"""
TEST SUITE SIMPLIFICADA E ULTRA-ROBUSTA - FUNDAMENTUS_SCRAPER
Objetivo: Validar scraper com 2 tickers por categoria + coletar setor/tipo
"""

import asyncio
import time
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from scrapers.fundamentus_scraper import FundamentusScraper
from base_scraper import ScraperResult
import json


# ===================================================================
# MATRIZ DE TESTE SIMPLIFICADA (2 tickers por categoria)
# ===================================================================

TEST_MATRIX = {
    # STOCKS
    "stock_industrial": {
        "description": "Empresas industriais (90% coverage esperado)",
        "expected_coverage": 90.0,
        "tickers": ["PETR4", "VALE3"],
    },
    "stock_financeiro": {
        "description": "Bancos (40-50% coverage esperado)",
        "expected_coverage": 45.0,
        "tickers": ["ITUB4", "BBAS3"],
    },
    "stock_varejo": {
        "description": "Varejo (90% coverage esperado)",
        "expected_coverage": 90.0,
        "tickers": ["MGLU3", "LREN3"],
    },
    "stock_utilities": {
        "description": "Utilities (90% coverage esperado)",
        "expected_coverage": 90.0,
        "tickers": ["ELET3", "CMIG4"],
    },
    "stock_holding": {
        "description": "Holdings (50-60% coverage esperado)",
        "expected_coverage": 55.0,
        "tickers": ["ITSA4", "CSAN3"],
    },

    # FIIs
    "fii_lajes": {
        "description": "FIIs de lajes corporativas (30-40% coverage esperado)",
        "expected_coverage": 35.0,
        "tickers": ["HGLG11", "KNRI11"],
    },
    "fii_shoppings": {
        "description": "FIIs de shopping centers (30-40% coverage esperado)",
        "expected_coverage": 35.0,
        "tickers": ["VISC11", "MALL11"],
    },

    # INVÁLIDOS - Esperar ERRO
    "invalid": {
        "description": "Tickers inválidos (erro esperado)",
        "expected_coverage": None,
        "tickers": ["INVALID", "TESTE99"],
    },
}


async def test_ticker(scraper: FundamentusScraper, ticker: str) -> dict:
    """Testa um ticker e retorna métricas + SETOR/TIPO"""

    print(f"    {ticker:10s} ... ", end="", flush=True)
    start_time = time.time()

    try:
        result: ScraperResult = await scraper.scrape(ticker)
        elapsed = time.time() - start_time

        if not result.success:
            print(f"❌ ERROR ({elapsed:.2f}s): {result.error[:50]}")
            return {
                "ticker": ticker,
                "success": False,
                "error": result.error,
                "time": elapsed,
                "coverage": 0,
                "filled_fields": 0,
                "total_fields": 0,
                "tipo": None,
                "setor": None,
                "subsetor": None,
            }

        # Calcular coverage
        data = result.data
        total_fields = len(data)
        filled_fields = sum(1 for k, v in data.items() if v is not None and not k.startswith("_"))
        coverage = (filled_fields / total_fields) * 100 if total_fields > 0 else 0

        # Extrair setor/tipo
        tipo = data.get("tipo", None)
        setor = data.get("setor", None)
        subsetor = data.get("subsetor", None)

        print(f"✅ OK ({elapsed:.2f}s) | Coverage: {coverage:.1f}% | Setor: {setor or 'N/A'} | Tipo: {tipo or 'N/A'}")

        return {
            "ticker": ticker,
            "success": True,
            "error": None,
            "time": elapsed,
            "coverage": coverage,
            "filled_fields": filled_fields,
            "total_fields": total_fields,
            "tipo": tipo,
            "setor": setor,
            "subsetor": subsetor,
            "data": data,
        }

    except Exception as e:
        elapsed = time.time() - start_time
        print(f"❌ EXCEPTION ({elapsed:.2f}s): {str(e)[:50]}")
        return {
            "ticker": ticker,
            "success": False,
            "error": str(e),
            "time": elapsed,
            "coverage": 0,
            "filled_fields": 0,
            "total_fields": 0,
            "tipo": None,
            "setor": None,
            "subsetor": None,
        }


async def test_category(scraper: FundamentusScraper, category_name: str, category_info: dict) -> dict:
    """Testa uma categoria completa"""

    print(f"\n{'=' * 80}")
    print(f"📊 {category_name.upper()}")
    print(f"   {category_info['description']}")
    print(f"{'=' * 80}")

    results = []
    for ticker in category_info['tickers']:
        result = await test_ticker(scraper, ticker)
        results.append(result)
        await asyncio.sleep(0.5)  # Rate limiting

    # Estatísticas
    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]

    if successful:
        avg_coverage = sum(r['coverage'] for r in successful) / len(successful)
        avg_time = sum(r['time'] for r in successful) / len(successful)
    else:
        avg_coverage = 0
        avg_time = 0

    # Validação de expectativas
    expected = category_info['expected_coverage']
    if expected is not None:
        if avg_coverage >= expected:
            status = "✅ PASS"
        else:
            status = f"⚠️ FAIL (esperado: {expected}%, obtido: {avg_coverage:.1f}%)"
    else:
        # Inválidos - esperar erro
        if len(failed) == len(results):
            status = "✅ PASS (erro esperado)"
        else:
            status = "⚠️ UNEXPECTED (deveria falhar)"

    print(f"\n   Result: {len(successful)}/{len(results)} OK | Avg Coverage: {avg_coverage:.1f}% | {status}")

    return {
        "category": category_name,
        "description": category_info['description'],
        "expected_coverage": expected,
        "total_tickers": len(results),
        "successful": len(successful),
        "failed": len(failed),
        "avg_coverage": avg_coverage,
        "avg_time": avg_time,
        "status": status,
        "results": results,
    }


async def run_test():
    """Executa test suite simplificada"""

    print("\n" + "=" * 80)
    print("🚀 TEST SUITE SIMPLIFICADA - FUNDAMENTUS_SCRAPER")
    print("=" * 80)
    print(f"Categorias: {len(TEST_MATRIX)}")
    print(f"Total tickers: {sum(len(cat['tickers']) for cat in TEST_MATRIX.values())}")
    print("=" * 80)

    async with FundamentusScraper() as scraper:
        all_results = {}
        start_time = time.time()

        # Testar cada categoria
        for category_name, category_info in TEST_MATRIX.items():
            category_result = await test_category(scraper, category_name, category_info)
            all_results[category_name] = category_result

        total_time = time.time() - start_time

        # ===================================================================
        # RELATÓRIO FINAL
        # ===================================================================

        print("\n\n" + "=" * 80)
        print("📊 RELATÓRIO FINAL ULTRA-ROBUSTO")
        print("=" * 80)
        print()

        total_tickers = 0
        total_successful = 0
        total_failed = 0
        issues = []

        for category_name, cat_result in all_results.items():
            total_tickers += cat_result['total_tickers']
            total_successful += cat_result['successful']
            total_failed += cat_result['failed']

            # Determinar status visual
            if "✅" in cat_result['status']:
                status_icon = "✅"
            else:
                status_icon = "⚠️"
                issues.append({
                    "category": category_name,
                    "issue": cat_result['status'],
                    "avg_coverage": cat_result['avg_coverage'],
                    "expected": cat_result['expected_coverage'],
                })

            print(f"{status_icon} {category_name:25s} | {cat_result['successful']}/{cat_result['total_tickers']} OK | "
                  f"Coverage: {cat_result['avg_coverage']:5.1f}% | Time: {cat_result['avg_time']:5.2f}s")

        print()
        print("=" * 80)
        print(f"TOTAL: {total_successful}/{total_tickers} tickers OK ({(total_successful/total_tickers)*100:.1f}%)")
        print(f"FAILED: {total_failed}/{total_tickers} tickers")
        print(f"TEMPO TOTAL: {total_time:.2f}s")
        print(f"TEMPO MÉDIO POR TICKER: {total_time/total_tickers:.2f}s")
        print("=" * 80)
        print()

        # ===================================================================
        # IDENTIFICAR GAPS/BUGS/WARNINGS
        # ===================================================================

        if issues:
            print("\n⚠️  ISSUES IDENTIFICADOS:")
            print("=" * 80)
            for issue in issues:
                print(f"  - {issue['category']}: {issue['issue']}")
                print(f"    Expected: {issue['expected']}% | Got: {issue['avg_coverage']:.1f}%")
            print()
        else:
            print("\n✅ NENHUM ISSUE IDENTIFICADO - SCRAPER 100% PERFEITO!")
            print()

        # Coletar setores encontrados
        print("=" * 80)
        print("📊 SETORES E TIPOS COLETADOS")
        print("=" * 80)
        setores_encontrados = set()
        tipos_encontrados = set()

        for cat_result in all_results.values():
            for result in cat_result['results']:
                if result['success']:
                    if result['setor']:
                        setores_encontrados.add(result['setor'])
                    if result['tipo']:
                        tipos_encontrados.add(result['tipo'])

        print(f"Setores únicos encontrados: {len(setores_encontrados)}")
        for setor in sorted(setores_encontrados):
            print(f"  - {setor}")

        print(f"\nTipos únicos encontrados: {len(tipos_encontrados)}")
        for tipo in sorted(tipos_encontrados):
            print(f"  - {tipo}")
        print()

        # Salvar resultados
        output = {
            "summary": {
                "total_categories": len(all_results),
                "total_tickers": total_tickers,
                "total_successful": total_successful,
                "total_failed": total_failed,
                "success_rate": (total_successful / total_tickers) * 100,
                "total_time": total_time,
                "avg_time_per_ticker": total_time / total_tickers,
                "issues": issues,
                "setores_found": sorted(list(setores_encontrados)),
                "tipos_found": sorted(list(tipos_encontrados)),
            },
            "categories": all_results,
        }

        output_file = "test_simplified_robust_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        print(f"✅ RESULTADOS SALVOS EM: {output_file}")
        print()

        return output


if __name__ == "__main__":
    print("\n🔍 Iniciando validação ultra-robusta simplificada...\n")
    asyncio.run(run_test())
    print("\n✅ VALIDAÇÃO COMPLETA!\n")
