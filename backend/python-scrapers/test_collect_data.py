#!/usr/bin/env python3
"""Script de teste para coletar dados do Fundamentus"""

import sys
import os
import asyncio
sys.path.insert(0, os.path.dirname(__file__))

from scrapers.fundamentus_scraper import FundamentusScraper
import json
import psycopg2
from config import settings

async def test_scraper(ticker='VALE3'):
    print(f"\n{'='*60}")
    print(f"🔍 Coletando dados de {ticker}")
    print(f"{'='*60}\n")
    
    scraper = FundamentusScraper()
    data = await scraper.scrape(ticker)
    
    if data:
        print(f"✅ Dados coletados!")
        print(f"\n📊 Indicadores principais:")
        print(f"  Nome: {data.get('nome', 'N/A')}")
        print(f"  Setor: {data.get('setor', 'N/A')}")
        print(f"  Cotação: R$ {data.get('cotacao', 'N/A')}")
        print(f"  P/L: {data.get('pl', 'N/A')}")
        print(f"  P/VP: {data.get('pvp', 'N/A')}")
        print(f"  DY: {data.get('dy', 'N/A')}%")
        
        # Inserir no banco
        try:
            conn = psycopg2.connect(
                host=settings.DB_HOST,
                port=settings.DB_PORT,
                database=settings.DB_DATABASE,
                user=settings.DB_USERNAME,
                password=settings.DB_PASSWORD
            )
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO assets (ticker, name, type, sector, is_active, created_at, updated_at)
                VALUES (%s, %s, 'stock', %s, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (ticker) DO UPDATE SET updated_at = CURRENT_TIMESTAMP
                RETURNING id
            """, (ticker, data.get('nome', ticker), data.get('setor', 'Desconhecido')))
            
            asset_id = cursor.fetchone()[0]
            print(f"\n✅ Ativo inserido no banco (ID: {asset_id})")
            
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"\n⚠️  Erro ao inserir no banco: {e}")
        
        return data
    else:
        print(f"❌ Nenhum dado coletado")
    return None

async def main():
    print("\n" + "="*60)
    print("🚀 TESTE DE COLETA DE DADOS - FUNDAMENTUS")
    print("="*60)
    
    results = {}
    for ticker in ['VALE3', 'PETR4', 'ITUB4']:
        result = await test_scraper(ticker)
        results[ticker] = result
        print()
    
    print("\n" + "="*60)
    print("📊 RESUMO")
    print("="*60)
    for ticker, result in results.items():
        status = "✅" if result else "❌"
        print(f"  {status} {ticker}")
    print("="*60 + "\n")

if __name__ == '__main__':
    asyncio.run(main())
