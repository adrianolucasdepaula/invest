#!/usr/bin/env python3
"""
Teste de scrapers que funcionam sem Chrome (apenas HTTP/API)
"""
import asyncio
import aiohttp
import json
from datetime import datetime
from loguru import logger

logger.add("test_http_scrapers.log", rotation="1 MB")


async def test_bcb_api():
    """
    Testa API do Banco Central do Brasil
    Séries temporais públicas - SEM autenticação
    """
    print("\n" + "="*60)
    print("🏦 TESTE: Banco Central do Brasil (BCB) - API Pública")
    print("="*60)

    # Códigos das séries do BCB
    series = {
        "selic_meta": 432,
        "ipca_acum_12m": 13522,
        "cambio_usd": 10813,
        "pib": 4380,
    }

    results = {}

    async with aiohttp.ClientSession() as session:
        for name, code in series.items():
            try:
                # API SGS do BCB - últimos 10 valores
                url = f"https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados/ultimos/10"

                print(f"\n📊 Buscando {name} (código {code})...")

                async with session.get(url, params={"formato": "json"}, timeout=15) as response:
                    if response.status == 200:
                        data = await response.json()

                        if data and len(data) > 0:
                            latest = data[-1]  # Último valor
                            print(f"  ✅ {name}: {latest['valor']} (data: {latest['data']})")
                            results[name] = {
                                "valor": latest["valor"],
                                "data": latest["data"],
                                "serie": code,
                            }
                        else:
                            print(f"  ⚠️  {name}: Sem dados disponíveis")
                            results[name] = None
                    else:
                        print(f"  ❌ {name}: Erro HTTP {response.status}")
                        results[name] = None

            except Exception as e:
                print(f"  ❌ {name}: Erro - {e}")
                results[name] = None

    print("\n" + "="*60)
    print("📈 RESUMO BCB:")
    for name, result in results.items():
        status = "✅" if result else "❌"
        print(f"  {status} {name}")
    print("="*60)

    return results


async def test_coinmarketcap_http():
    """
    Testa CoinMarketCap via HTTP (sem Selenium)
    """
    print("\n" + "="*60)
    print("🪙 TESTE: CoinMarketCap - HTTP (sem Chrome)")
    print("="*60)

    cryptos = ["BTC", "ETH"]

    # Mapa de símbolos para slugs
    symbol_map = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "BNB": "binance-coin",
        "SOL": "solana",
    }

    results = {}

    async with aiohttp.ClientSession() as session:
        for symbol in cryptos:
            try:
                crypto_id = symbol_map.get(symbol, symbol.lower())
                url = f"https://coinmarketcap.com/currencies/{crypto_id}/"

                print(f"\n🪙 Buscando {symbol}...")

                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                }

                async with session.get(url, headers=headers, timeout=15) as response:
                    if response.status == 200:
                        html = await response.text()

                        # Verifica se a página carregou
                        if crypto_id.lower() in html.lower() and "price" in html.lower():
                            print(f"  ✅ {symbol}: Página carregada (dados disponíveis no HTML)")

                            # Nota: Para extrair preços, precisaríamos parsear o HTML/JSON
                            # Aqui apenas validamos que a página está acessível
                            results[symbol] = {
                                "status": "accessible",
                                "url": url,
                                "note": "HTML parsing needed for price extraction"
                            }
                        else:
                            print(f"  ⚠️  {symbol}: Página carregou mas dados não encontrados")
                            results[symbol] = None
                    else:
                        print(f"  ❌ {symbol}: HTTP {response.status}")
                        results[symbol] = None

            except Exception as e:
                print(f"  ❌ {symbol}: Erro - {e}")
                results[symbol] = None

    print("\n" + "="*60)
    print("🪙 RESUMO CoinMarketCap:")
    for symbol, result in results.items():
        status = "✅" if result else "❌"
        print(f"  {status} {symbol}")
    print("="*60)

    return results


async def test_yahoo_finance_api():
    """
    Testa Yahoo Finance API (alternativa sem scraper)
    """
    print("\n" + "="*60)
    print("📈 TESTE: Yahoo Finance - API Pública")
    print("="*60)

    tickers = ["VALE3.SA", "PETR4.SA", "ITUB4.SA"]

    results = {}

    async with aiohttp.ClientSession() as session:
        for ticker in tickers:
            try:
                # Yahoo Finance quote endpoint (público)
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"

                print(f"\n📊 Buscando {ticker}...")

                params = {
                    "interval": "1d",
                    "range": "5d",
                }

                async with session.get(url, params=params, timeout=15) as response:
                    if response.status == 200:
                        data = await response.json()

                        if "chart" in data and "result" in data["chart"]:
                            result = data["chart"]["result"][0]
                            meta = result.get("meta", {})

                            price = meta.get("regularMarketPrice")
                            previous_close = meta.get("previousClose")

                            if price:
                                print(f"  ✅ {ticker}: R$ {price:.2f}")
                                print(f"     Fechamento anterior: R$ {previous_close:.2f}")

                                results[ticker] = {
                                    "price": price,
                                    "previous_close": previous_close,
                                    "currency": meta.get("currency"),
                                    "exchange": meta.get("exchangeName"),
                                }
                            else:
                                print(f"  ⚠️  {ticker}: Sem preço disponível")
                                results[ticker] = None
                        else:
                            print(f"  ❌ {ticker}: Formato inesperado")
                            results[ticker] = None
                    else:
                        print(f"  ❌ {ticker}: HTTP {response.status}")
                        results[ticker] = None

            except Exception as e:
                print(f"  ❌ {ticker}: Erro - {e}")
                results[ticker] = None

    print("\n" + "="*60)
    print("📈 RESUMO Yahoo Finance:")
    for ticker, result in results.items():
        status = "✅" if result else "❌"
        print(f"  {status} {ticker}")
    print("="*60)

    return results


async def main():
    """
    Executa todos os testes HTTP (sem Chrome)
    """
    print("\n" + "="*60)
    print("🚀 TESTE DE SCRAPERS HTTP (SEM CHROME)")
    print("="*60)
    print(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    # Testes
    bcb_results = await test_bcb_api()
    yahoo_results = await test_yahoo_finance_api()
    cmc_results = await test_coinmarketcap_http()

    # Resumo final
    print("\n\n" + "="*60)
    print("📊 RESUMO GERAL")
    print("="*60)

    total_tests = (
        len(bcb_results) +
        len(yahoo_results) +
        len(cmc_results)
    )

    successful_tests = (
        sum(1 for r in bcb_results.values() if r) +
        sum(1 for r in yahoo_results.values() if r) +
        sum(1 for r in cmc_results.values() if r)
    )

    success_rate = (successful_tests / total_tests * 100) if total_tests > 0 else 0

    print(f"\n✅ Testes bem-sucedidos: {successful_tests}/{total_tests} ({success_rate:.1f}%)")
    print(f"\n📋 Fontes testadas:")
    print(f"   • BCB (Banco Central): {len(bcb_results)} séries")
    print(f"   • Yahoo Finance: {len(yahoo_results)} ativos")
    print(f"   • CoinMarketCap: {len(cmc_results)} criptos")

    print("\n💡 CONCLUSÃO:")
    if success_rate >= 70:
        print("   ✅ Maioria dos testes HTTP funcionando!")
        print("   ✅ Scrapers HTTP são viáveis como alternativa ao Chrome")
    elif success_rate >= 40:
        print("   ⚠️  Alguns testes HTTP funcionando")
        print("   ⚠️  Recomendado usar Chrome para scrapers completos")
    else:
        print("   ❌ Poucos testes HTTP funcionando")
        print("   ❌ Chrome/Selenium é necessário para maioria dos scrapers")

    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
