#!/usr/bin/env python3
"""
TEST SUITE ULTRA-ROBUSTA - FUNDAMENTUS_SCRAPER
Objetivo: Validar 100% de cobertura em TODOS tipos de ativos e "setores implícitos"
"""

import asyncio
import time
from typing import List, Dict, Any
from scrapers.fundamentus_scraper import Fundam entus Scraper
from base_scraper import ScraperResult
import json
from collections import defaultdict

# ===================================================================
# MATRIZ DE TESTE ULTRA-COMPLETA
# ===================================================================

TEST_MATRIX = {
    # ======================
    # STOCKS - Por "Setor Implícito" (baseado em conhecimento)
    # ======================
    "stock_industrial": {
        "description": "Empresas industriais/commodities",
        "expected_coverage": 90.0,  # ≥ 90%
        "tickers": [
            "PETR4",  # Petrobras - Petróleo
            "VALE3",  # Vale - Mineração
            "WEGE3",  # WEG - Equipamentos elétricos
            "SUZB3",  # Suzano - Papel e celulose
            "GOAU4",  # Gerdau - Siderurgia
            "USIM5",  # Usiminas - Siderurgia
            "EMBR3",  # Embraer - Aeroespacial
            "BRFS3",  # BRF - Alimentos
            "JBSS3",  # JBS - Alimentos
            "BEEF3",  # Minerva - Alimentos
        ]
    },
    "stock_financeiro": {
        "description": "Bancos e instituições financeiras",
        "expected_coverage": 45.0,  # 40-50%
        "tickers": [
            "ITUB4",  # Itaú
            "BBAS3",  # Banco do Brasil
            "BBDC4",  # Bradesco
            "SANB11", # Santander
            "BPAC11", # BTG Pactual
            "ITSA4",  # Itaúsa (Holding financeira)
            "BBSE3",  # BB Seguridade
        ]
    },
    "stock_varejo": {
        "description": "Varejo e e-commerce",
        "expected_coverage": 90.0,  # Estrutura industrial
        "tickers": [
            "MGLU3",  # Magazine Luiza
            "LREN3",  # Lojas Renner
            "AMER3",  # Americanas
            "PCAR3",  # Grupo Pão de Açúcar
            "CRFB3",  # Carrefour Brasil
            "VIIA3",  # Via (ex-Via Varejo)
            "ASAI3",  # Assaí Atacadista
        ]
    },
    "stock_utilities": {
        "description": "Utilities (energia elétrica, saneamento, gás)",
        "expected_coverage": 90.0,  # Estrutura industrial
        "tickers": [
            "ELET3",  # Eletrobras
            "CMIG4",  # Cemig
            "EGIE3",  # Engie Brasil
            "CPFE3",  # CPFL Energia
            "TAEE11", # Taesa
            "TRPL4",  # Transmissão Paulista
            "SAPR4",  # Sanepar
            "SBSP3",  # Sabesp
            "CPLE6",  # Copel
        ]
    },
    "stock_telecom": {
        "description": "Telecomunicações",
        "expected_coverage": 90.0,  # Estrutura industrial
        "tickers": [
            "VIVT3",  # Vivo
            "TIMS3",  # TIM
            "OIBR3",  # Oi
        ]
    },
    "stock_saude": {
        "description": "Saúde (hospitais, laboratórios)",
        "expected_coverage": 90.0,  # Estrutura industrial
        "tickers": [
            "HAPV3",  # Hapvida
            "RDOR3",  # Rede D'Or
            "FLRY3",  # Fleury
            "PARD3",  # Pardini (IHPARDINI)
        ]
    },
    "stock_construcao": {
        "description": "Construção civil e imobiliário",
        "expected_coverage": 90.0,  # Estrutura industrial
        "tickers": [
            "MRVE3",  # MRV
            "CYRE3",  # Cyrela
            "EZTC3",  # EZTec
            "TEND3",  # Tenda
            "DIRR3",  # Direcional
        ]
    },
    "stock_holding": {
        "description": "Holdings e participações",
        "expected_coverage": 55.0,  # 50-60%
        "tickers": [
            "ITSA4",  # Itaúsa
            "VIVR3",  # Viver (Invepar)
            "CSAN3",  # Cosan
            "UGPA3",  # Ultrapar
        ]
    },
    "stock_tecnologia": {
        "description": "Tecnologia e serviços",
        "expected_coverage": 90.0,  # Estrutura industrial
        "tickers": [
            "TOTS3",  # Totvs
            "LWSA3",  # Locaweb
            "POSI3",  # Positivo
        ]
    },
    "stock_transporte": {
        "description": "Transporte e logística",
        "expected_coverage": 90.0,  # Estrutura industrial
        "tickers": [
            "AZUL4",  # Azul
            "GOLL4",  # Gol
            "RAIL3",  # Rumo
            "CCRO3",  # CCR
            "ECOR3",  # Ecorodovias
        ]
    },

    # ======================
    # FIIs - Por Tipo Implícito
    # ======================
    "fii_lajes_corporativas": {
        "description": "FIIs de lajes corporativas",
        "expected_coverage": 35.0,  # 30-40%
        "tickers": [
            "HGLG11", # CSHG Logística
            "KNRI11", # Kinea Renda Imobiliária
            "MXRF11", # Maxi Renda
            "PVBI11", # VBI Prime Properties
            "VISC11", # Vinci Shopping Centers
        ]
    },
    "fii_shoppings": {
        "description": "FIIs de shopping centers",
        "expected_coverage": 35.0,  # 30-40%
        "tickers": [
            "VISC11", # Vinci Shopping Centers
            "MALL11", # Malls Brasil Plural
            "GGRC11", # GGR Covepi Renda
            "XPML11", # XP Malls
        ]
    },
    "fii_logistica": {
        "description": "FIIs de galpões logísticos",
        "expected_coverage": 35.0,  # 30-40%
        "tickers": [
            "BTLG11", # BTG Pactual Logística
            "LVBI11", # VBI Logístico
            "HGLG11", # CSHG Logística
            "XPLG11", # XP Log
        ]
    },
    "fii_papel": {
        "description": "FIIs de papel (CRI/CRA)",
        "expected_coverage": 35.0,  # 30-40%
        "tickers": [
            "TRXF11", # TRX Real Estate
            "VGIR11", # Valora CRI
            "KNCR11", # Kinea Rendimentos Imobiliários
            "RZTR11", # Riza Terrax
        ]
    },
    "fii_renda_urbana": {
        "description": "FIIs de renda urbana (varejo, residencial)",
        "expected_coverage": 35.0,  # 30-40%
        "tickers": [
            "HGRU11", # CSHG Renda Urbana
            "KNRI11", # Kinea Renda Imobiliária
            "RBRF11", # RBR Rendimento High Grade
        ]
    },
    "fii_hibrido": {
        "description": "FIIs híbridos (tijolo + papel)",
        "expected_coverage": 35.0,  # 30-40%
        "tickers": [
            "XPML11", # XP Malls
            "MXRF11", # Maxi Renda
            "HGRE11", # CSHG Recebíveis Imobiliários
        ]
    },

    # ======================
    # TICKERS INVÁLIDOS - Esperar ERRO
    # ======================
    "invalid_tickers": {
        "description": "Tickers inválidos (não existem)",
        "expected_coverage": None,  # Esperar erro
        "tickers": [
            "INVALID",
            "TESTE99",
            "ABCD1234",
            "XXXXX11",
        ]
    },

    # ======================
    # TICKERS DESLISTADOS - Esperar ERRO ou baixo coverage
    # ======================
    "delisted_tickers": {
        "description": "Tickers deslistados (podem não ter dados)",
        "expected_coverage": None,  # Esperar erro ou baixo coverage
        "tickers": [
            "OIBR3",   # Oi (recuperação judicial, pode estar fora)
            "CIEL3",   # Cielo (pode estar deslistado)
        ]
    },
}


# ===================================================================
# FUNÇÕES DE TESTE
# ===================================================================

async def test_ticker(scraper: FundamentusScraper, ticker: str) -> Dict[str, Any]:
    """Testa um ticker individual e retorna métricas + COLETA SETOR E TIPO"""

    print(f"    Testing {ticker}...", end=" ", flush=True)
    start_time = time.time()

    try:
        result: ScraperResult = await scraper.scrape(ticker)
        elapsed = time.time() - start_time

        if not result.success:
            print(f"❌ ERROR ({elapsed:.2f}s): {result.error}")
            return {
                "ticker": ticker,
                "success": False,
                "error": result.error,
                "time": elapsed,
                "coverage": 0,
                "filled_fields": 0,
                "total_fields": 0,
                # Dados do Fundamentus (não coletados em erro)
                "fundamentus_sector": None,
                "fundamentus_type": None,
                "fundamentus_subsector": None,
                "fundamentus_segment": None,
            }

        # Calcular coverage
        data = result.data
        total_fields = len(data)
        filled_fields = sum(1 for v in data.values() if v is not None)
        coverage = (filled_fields / total_fields) * 100 if total_fields > 0 else 0

        # COLETAR SETOR E TIPO do Fundamentus (se disponível nos dados)
        # O scraper do Fundamentus retorna apenas dados fundamentalistas, NÃO setor/tipo
        # Precisamos coletar da página HTML posteriormente
        # Por enquanto, vamos apenas reportar coverage

        print(f"✅ OK ({elapsed:.2f}s) | Coverage: {coverage:.1f}% ({filled_fields}/{total_fields})")

        return {
            "ticker": ticker,
            "success": True,
            "error": None,
            "time": elapsed,
            "coverage": coverage,
            "filled_fields": filled_fields,
            "total_fields": total_fields,
            "data": data,
            # Setor/tipo (a ser coletado posteriormente do HTML)
            "fundamentus_sector": data.get("setor", None),  # Se estiver nos dados
            "fundamentus_type": data.get("tipo", None),      # Se estiver nos dados
            "fundamentus_subsector": data.get("subsetor", None),
            "fundamentus_segment": data.get("segmento", None),
        }

    except Exception as e:
        elapsed = time.time() - start_time
        print(f"❌ EXCEPTION ({elapsed:.2f}s): {str(e)}")
        return {
            "ticker": ticker,
            "success": False,
            "error": str(e),
            "time": elapsed,
            "coverage": 0,
            "filled_fields": 0,
            "total_fields": 0,
            "fundamentus_sector": None,
            "fundamentus_type": None,
            "fundamentus_subsector": None,
            "fundamentus_segment": None,
        }


async def test_category(scraper: FundamentusScraper, category_name: str, category_info: Dict) -> Dict[str, Any]:
    """Testa uma categoria completa de tickers"""

    print(f"\n{'=' * 80}")
    print(f"📊 TESTANDO: {category_name.upper()}")
    print(f"   Descrição: {category_info['description']}")
    print(f"   Expected Coverage: {category_info['expected_coverage']}%")
    print(f"   Total Tickers: {len(category_info['tickers'])}")
    print(f"{'=' * 80}")

    results = []
    for ticker in category_info['tickers']:
        result = await test_ticker(scraper, ticker)
        results.append(result)
        await asyncio.sleep(0.5)  # Rate limiting

    # Calcular estatísticas da categoria
    successful = [r for r in results if r['success']]
    failed = [r for r in results if not r['success']]

    if successful:
        avg_coverage = sum(r['coverage'] for r in successful) / len(successful)
        avg_time = sum(r['time'] for r in successful) / len(successful)
        min_coverage = min(r['coverage'] for r in successful)
        max_coverage = max(r['coverage'] for r in successful)
    else:
        avg_coverage = 0
        avg_time = 0
        min_coverage = 0
        max_coverage = 0

    category_result = {
        "category": category_name,
        "description": category_info['description'],
        "expected_coverage": category_info['expected_coverage'],
        "total_tickers": len(category_info['tickers']),
        "successful": len(successful),
        "failed": len(failed),
        "avg_coverage": avg_coverage,
        "min_coverage": min_coverage,
        "max_coverage": max_coverage,
        "avg_time": avg_time,
        "results": results,
    }

    # Validação de expectativas
    if category_info['expected_coverage'] is not None:
        if avg_coverage >= category_info['expected_coverage']:
            status = "✅ PASS"
        else:
            status = f"⚠️ FAIL (esperado: {category_info['expected_coverage']}%)"
    else:
        # Tickers inválidos - esperar erro
        if len(failed) == len(results):
            status = "✅ PASS (erro esperado)"
        else:
            status = "⚠️ UNEXPECTED (deveria falhar)"

    print(f"\n📊 RESULTADO DA CATEGORIA:")
    print(f"   Successful: {len(successful)}/{len(results)}")
    print(f"   Failed: {len(failed)}/{len(results)}")
    print(f"   Avg Coverage: {avg_coverage:.1f}%")
    print(f"   Avg Time: {avg_time:.2f}s")
    print(f"   Status: {status}")

    return category_result


async def run_ultra_robust_test():
    """Executa test suite ultra-robusto completo"""

    print("\n")
    print("=" * 80)
    print("🚀 TEST SUITE ULTRA-ROBUSTA - FUNDAMENTUS_SCRAPER")
    print("=" * 80)
    print(f"Total de categorias: {len(TEST_MATRIX)}")
    print(f"Total de tickers: {sum(len(cat['tickers']) for cat in TEST_MATRIX.values())}")
    print("=" * 80)
    print("\n")

    scraper = FundamentusScraper()
    await scraper.start()

    try:
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

        print("\n\n")
        print("=" * 80)
        print("📊 RELATÓRIO FINAL - ULTRA-ROBUST VALIDATION")
        print("=" * 80)
        print()

        total_tickers = 0
        total_successful = 0
        total_failed = 0

        for category_name, cat_result in all_results.items():
            total_tickers += cat_result['total_tickers']
            total_successful += cat_result['successful']
            total_failed += cat_result['failed']

            # Status da categoria
            if cat_result['expected_coverage'] is not None:
                if cat_result['avg_coverage'] >= cat_result['expected_coverage']:
                    status = "✅"
                else:
                    status = "⚠️"
            else:
                # Inválidos
                if cat_result['failed'] == cat_result['total_tickers']:
                    status = "✅"
                else:
                    status = "⚠️"

            print(f"{status} {category_name:30s} | {cat_result['successful']:2d}/{cat_result['total_tickers']:2d} OK | "
                  f"Avg Coverage: {cat_result['avg_coverage']:5.1f}% | Avg Time: {cat_result['avg_time']:5.2f}s")

        print()
        print("=" * 80)
        print(f"TOTAL: {total_successful}/{total_tickers} tickers OK ({(total_successful/total_tickers)*100:.1f}%)")
        print(f"FAILED: {total_failed}/{total_tickers} tickers")
        print(f"TEMPO TOTAL: {total_time:.2f}s")
        print(f"TEMPO MÉDIO POR TICKER: {total_time/total_tickers:.2f}s")
        print("=" * 80)
        print()

        # Salvar resultados em JSON
        output = {
            "summary": {
                "total_categories": len(all_results),
                "total_tickers": total_tickers,
                "total_successful": total_successful,
                "total_failed": total_failed,
                "success_rate": (total_successful / total_tickers) * 100,
                "total_time": total_time,
                "avg_time_per_ticker": total_time / total_tickers,
            },
            "categories": all_results,
        }

        output_file = "test_ultra_robust_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        print(f"✅ RESULTADOS SALVOS EM: {output_file}")
        print()

        return output

    finally:
        await scraper.stop()


if __name__ == "__main__":
    asyncio.run(run_ultra_robust_test())
