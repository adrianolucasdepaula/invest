#!/usr/bin/env python3
"""
Análise Ultra-Robusta de Assets no Banco de Dados
Objetivo: Mapear TODOS os tipos, setores e criar matriz de teste completa
"""

import psycopg2
import os
from collections import defaultdict, Counter
from typing import Dict, List, Tuple
import json


def analyze_database():
    """Analisa distribuição completa de assets no banco de dados"""

    # Conexão com PostgreSQL (usar env vars do Docker)
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "postgres"),
        port=int(os.getenv("DB_PORT", "5432")),
        user=os.getenv("DB_USERNAME", "invest_user"),
        password=os.getenv("DB_PASSWORD", "invest_password"),
        database=os.getenv("DB_DATABASE", "invest_db")
    )

    cursor = conn.cursor()

    try:
        print("=" * 80)
        print("🔍 ANÁLISE ULTRA-ROBUSTA DE ASSETS")
        print("=" * 80)
        print()

        # 1. Total de assets
        cursor.execute("SELECT COUNT(*) FROM assets WHERE is_active = true")
        total_assets = cursor.fetchone()[0]
        print(f"📊 TOTAL DE ASSETS ATIVOS: {total_assets}")
        print()

        # 2. Distribuição por AssetType
        cursor.execute("""
            SELECT type, COUNT(*) as count
            FROM assets
            WHERE is_active = true
            GROUP BY type
            ORDER BY count DESC
        """)

        print("=" * 80)
        print("📈 DISTRIBUIÇÃO POR ASSET TYPE")
        print("=" * 80)
        type_counts = {}
        for row in cursor.fetchall():
            asset_type = row[0]
            count = row[1]
            percentage = (count / total_assets) * 100
            type_counts[asset_type] = count
            print(f"  {asset_type:15s} | {count:4d} assets ({percentage:5.2f}%)")
        print()

        # 3. Distribuição por Setor (apenas STOCKs)
        print("=" * 80)
        print("📊 DISTRIBUIÇÃO POR SETOR (STOCKS)")
        print("=" * 80)

        cursor.execute("""
            SELECT
                sector,
                COUNT(*) as count
            FROM assets
            WHERE is_active = true
            AND type = 'stock'
            AND sector IS NOT NULL
            GROUP BY sector
            ORDER BY count DESC
        """)

        sector_counts = {}
        for row in cursor.fetchall():
            sector = row[0] or 'SEM_SETOR'
            count = row[1]
            sector_counts[sector] = count
            print(f"  {sector:40s} | {count:4d} stocks")
        print()

        # 4. Stocks SEM setor
        cursor.execute("""
            SELECT COUNT(*)
            FROM assets
            WHERE is_active = true
            AND type = 'stock'
            AND sector IS NULL
        """)
        stocks_no_sector = cursor.fetchone()[0]
        print(f"⚠️  STOCKS SEM SETOR: {stocks_no_sector}")
        print()

        # 5. FIIs por setor
        print("=" * 80)
        print("📊 DISTRIBUIÇÃO POR SETOR (FIIs)")
        print("=" * 80)

        cursor.execute("""
            SELECT
                sector,
                COUNT(*) as count
            FROM assets
            WHERE is_active = true
            AND type = 'fii'
            AND sector IS NOT NULL
            GROUP BY sector
            ORDER BY count DESC
        """)

        fii_sector_counts = {}
        for row in cursor.fetchall():
            sector = row[0] or 'SEM_SETOR'
            count = row[1]
            fii_sector_counts[sector] = count
            print(f"  {sector:40s} | {count:4d} FIIs")
        print()

        # 6. FIIs SEM setor
        cursor.execute("""
            SELECT COUNT(*)
            FROM assets
            WHERE is_active = true
            AND type = 'fii'
            AND sector IS NULL
        """)
        fiis_no_sector = cursor.fetchone()[0]
        print(f"⚠️  FIIs SEM SETOR: {fiis_no_sector}")
        print()

        # 7. Amostra de tickers por tipo (para testes)
        print("=" * 80)
        print("🎯 AMOSTRA DE TICKERS PARA TESTE (Top 5 por tipo)")
        print("=" * 80)

        test_matrix = {}

        for asset_type in type_counts.keys():
            # Pegar top 5 tickers mais líquidos de cada tipo
            cursor.execute(f"""
                SELECT
                    ticker,
                    name,
                    sector,
                    subsector
                FROM assets
                WHERE is_active = true
                AND type = '{asset_type}'
                ORDER BY ticker
                LIMIT 5
            """)

            samples = cursor.fetchall()

            print(f"\n{asset_type.upper()}:")
            test_matrix[asset_type] = []
            for sample in samples:
                ticker = sample[0]
                name = sample[1]
                sector = sample[2] or 'N/A'
                print(f"  - {ticker:10s} | {name:40s} | Setor: {sector}")
                test_matrix[asset_type].append({
                    'ticker': ticker,
                    'name': name,
                    'sector': sector
                })

        print()

        # 8. Setores únicos para teste abrangente (STOCKs)
        print("=" * 80)
        print("🎯 MATRIZ DE TESTE COMPLETA - STOCKS POR SETOR")
        print("=" * 80)
        print("(1 ticker representativo de cada setor)")
        print()

        stock_test_matrix = {}
        for sector, count in list(sector_counts.items())[:15]:  # Top 15 setores
            cursor.execute(f"""
                SELECT ticker, name
                FROM assets
                WHERE is_active = true
                AND type = 'stock'
                AND sector = '{sector}'
                ORDER BY ticker
                LIMIT 1
            """)

            representative = cursor.fetchone()
            if representative:
                ticker = representative[0]
                name = representative[1]
                stock_test_matrix[sector] = {
                    'ticker': ticker,
                    'name': name
                }
                print(f"  {sector:40s} | {ticker:10s} | {name}")

        print()

        # 9. Estatísticas de setores
        print("=" * 80)
        print("📊 ESTATÍSTICAS DE COBERTURA")
        print("=" * 80)
        print(f"Total de setores (STOCKS):        {len(sector_counts)}")
        print(f"Total de setores (FIIs):          {len(fii_sector_counts)}")
        print(f"Stocks com setor definido:        {sum(sector_counts.values())}")
        print(f"Stocks sem setor:                 {stocks_no_sector}")
        print(f"FIIs com setor definido:          {sum(fii_sector_counts.values())}")
        print(f"FIIs sem setor:                   {fiis_no_sector}")
        print()

        # 10. Salvar matriz de teste em JSON
        output = {
            'total_assets': total_assets,
            'type_distribution': type_counts,
            'sector_distribution': {
                'stocks': sector_counts,
                'fiis': fii_sector_counts
            },
            'test_matrix_by_type': test_matrix,
            'test_matrix_by_sector': stock_test_matrix,
            'statistics': {
                'total_sectors_stocks': len(sector_counts),
                'total_sectors_fiis': len(fii_sector_counts),
                'stocks_no_sector': stocks_no_sector,
                'fiis_no_sector': fiis_no_sector
            }
        }

        output_file = '/app/asset_analysis_output.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        print("=" * 80)
        print(f"✅ ANÁLISE SALVA EM: {output_file}")
        print("=" * 80)
        print()

        return output

    finally:
        cursor.close()
        conn.close()


def generate_test_plan(analysis: dict):
    """Gera plano de teste ultra-robusto baseado na análise"""

    print("=" * 80)
    print("📋 PLANO DE TESTE ULTRA-ROBUSTO")
    print("=" * 80)
    print()

    # Calcular tamanho da amostra
    total_assets = analysis['total_assets']

    # Estratégia de amostragem:
    # - 100% para tipos pequenos (<20 assets)
    # - 30% para tipos médios (20-100 assets)
    # - 10% para tipos grandes (>100 assets)
    # Mínimo: 5 tickers por tipo

    test_plan = {}
    total_tests = 0

    for asset_type, count in analysis['type_distribution'].items():
        if count < 20:
            sample_size = count  # 100%
        elif count < 100:
            sample_size = max(5, int(count * 0.30))  # 30%
        else:
            sample_size = max(10, int(count * 0.10))  # 10%

        test_plan[asset_type] = {
            'total': count,
            'sample_size': sample_size,
            'percentage': (sample_size / count) * 100
        }
        total_tests += sample_size

    print(f"TOTAL DE TESTES PLANEJADOS: {total_tests} tickers")
    print()
    print("DISTRIBUIÇÃO POR TIPO:")
    for asset_type, plan in test_plan.items():
        print(f"  {asset_type:15s} | {plan['sample_size']:3d}/{plan['total']:4d} ({plan['percentage']:5.1f}%)")

    print()
    print("SETORES A TESTAR (STOCKS):")
    sector_count = len(analysis['test_matrix_by_sector'])
    print(f"  Total de setores: {sector_count}")
    print(f"  Tickers por setor: 1-2 representativos")
    print()

    # Coverage esperado por tipo
    print("=" * 80)
    print("📊 COVERAGE ESPERADO POR TIPO DE ATIVO")
    print("=" * 80)
    print("Baseado em SECTOR_COVERAGE_EXPECTATIONS.md:")
    print()
    print("  STOCK (Industrial):    ≥ 90% (27/30 campos)")
    print("  STOCK (Financeiro):    40-50% (13-15/30 campos)")
    print("  STOCK (Holding):       50-60% (15-18/30 campos)")
    print("  FII:                   30-40% (8-12/30 campos)")
    print("  ETF:                   ⚠️  Não disponível no Fundamentus (erro esperado)")
    print("  BDR:                   ⚠️  Não disponível no Fundamentus (erro esperado)")
    print("  OPTION:                ⚠️  Não disponível no Fundamentus (erro esperado)")
    print("  FUTURE:                ⚠️  Não disponível no Fundamentus (erro esperado)")
    print("  CRYPTO:                ⚠️  Não disponível no Fundamentus (erro esperado)")
    print("  FIXED_INCOME:          ⚠️  Não disponível no Fundamentus (erro esperado)")
    print()

    return test_plan


if __name__ == "__main__":
    print("\n🚀 Iniciando análise ultra-robusta do banco de dados...\n")

    analysis = analyze_database()

    print("\n🎯 Gerando plano de teste...\n")
    test_plan = generate_test_plan(analysis)

    print("\n✅ ANÁLISE COMPLETA!\n")
