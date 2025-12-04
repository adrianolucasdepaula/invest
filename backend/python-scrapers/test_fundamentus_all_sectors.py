"""
Teste Completo do Fundamentus Scraper
Testa tickers representativos de TODOS os tipos de ativos e setores
"""
import asyncio
import sys
import time

sys.path.insert(0, '.')
from scrapers.fundamentus_scraper import FundamentusScraper


async def test_all_sectors():
    """
    Teste completo do Fundamentus Scraper
    Testa tickers representativos de TODOS os tipos e setores
    """

    print('=' * 80)
    print('TESTE COMPLETO FUNDAMENTUS - TODOS TIPOS E SETORES')
    print('=' * 80)

    # Tickers representativos por tipo/setor
    # Baseado em empresas conhecidas de cada categoria
    test_cases = {
        # === AÇÕES (STOCKS) ===
        'Petroleo e Gas': ['PETR4', 'PRIO3'],
        'Mineracao': ['VALE3', 'CMIN3'],
        'Bancos': ['ITUB4', 'BBAS3', 'BBDC4', 'SANB11'],
        'Seguradoras': ['BBSE3', 'PSSA3'],
        'Energia Eletrica': ['ELET3', 'CPFE3', 'ENGI11', 'TAEE11'],
        'Saneamento': ['SBSP3', 'SAPR11'],
        'Varejo': ['MGLU3', 'LREN3', 'BHIA3'],
        'Alimentos e Bebidas': ['ABEV3', 'JBSS3', 'BRFS3'],
        'Construcao Civil': ['CYRE3', 'MRVE3', 'EZTC3'],
        'Siderurgia': ['CSNA3', 'GGBR4', 'USIM5'],
        'Papel e Celulose': ['SUZB3', 'KLBN11'],
        'Saude': ['HAPV3', 'RDOR3', 'FLRY3'],
        'Tecnologia': ['TOTS3', 'LWSA3'],
        'Transporte': ['CCRO3', 'RAIL3', 'AZUL4'],
        'Telecomunicacoes': ['VIVT3', 'TIMS3'],
        'Educacao': ['YDUQ3', 'COGN3'],
        'Shopping Centers': ['MULT3', 'IGTI11'],
        'Holdings': ['ITSA4', 'BRAP4'],
        'Agronegocio': ['SLCE3', 'AGRO3'],

        # === FIIs ===
        'FII - Logistica': ['HGLG11', 'XPLG11'],
        'FII - Shoppings': ['XPML11', 'VISC11'],
        'FII - Lajes Corp': ['HGRE11', 'BRCR11'],
        'FII - Recebiveis': ['KNCR11', 'MXRF11'],
        'FII - Hibrido': ['KNRI11', 'HGBS11'],
    }

    scraper = FundamentusScraper()
    results = []
    errors = []

    try:
        total_tickers = sum(len(tickers) for tickers in test_cases.values())
        current = 0

        for setor, tickers in test_cases.items():
            print(f'\n--- {setor} ---')

            for ticker in tickers:
                current += 1
                print(f'[{current}/{total_tickers}] {ticker}... ', end='', flush=True)

                start = time.time()
                try:
                    result = await scraper.scrape(ticker)
                    elapsed = time.time() - start

                    if result.success:
                        data = result.data
                        filled = sum(1 for v in data.values() if v is not None)
                        total = len(data)
                        coverage = (filled / total) * 100

                        tipo_extraido = data.get('tipo', 'N/A')
                        setor_extraido = data.get('setor', 'N/A')

                        results.append({
                            'ticker': ticker,
                            'setor_teste': setor,
                            'tipo': tipo_extraido,
                            'setor_fund': setor_extraido[:30] if setor_extraido else 'N/A',
                            'coverage': coverage,
                            'filled': filled,
                            'total': total,
                            'time': elapsed,
                            'price': data.get('price'),
                            'success': True
                        })

                        status = 'OK' if coverage >= 30 else 'LOW'
                        print(f'{status} ({coverage:.0f}%, {elapsed:.1f}s)')
                    else:
                        errors.append({
                            'ticker': ticker,
                            'setor_teste': setor,
                            'error': str(result.error)[:50],
                            'time': elapsed
                        })
                        print(f'ERRO: {result.error[:40]}')

                except Exception as e:
                    elapsed = time.time() - start
                    errors.append({
                        'ticker': ticker,
                        'setor_teste': setor,
                        'error': str(e)[:50],
                        'time': elapsed
                    })
                    print(f'EXCEPTION: {str(e)[:40]}')

        # === RESUMO ===
        print('\n' + '=' * 80)
        print('RESUMO DOS RESULTADOS')
        print('=' * 80)

        # Estatisticas gerais
        total_success = len(results)
        total_errors = len(errors)
        total_tested = total_success + total_errors

        print(f'\nTickers testados: {total_tested}')
        print(f'Sucesso: {total_success} ({100*total_success/total_tested:.1f}%)')
        print(f'Erros: {total_errors} ({100*total_errors/total_tested:.1f}%)')

        if results:
            avg_coverage = sum(r['coverage'] for r in results) / len(results)
            avg_time = sum(r['time'] for r in results) / len(results)
            min_coverage = min(r['coverage'] for r in results)
            max_coverage = max(r['coverage'] for r in results)

            print(f'\nCoverage medio: {avg_coverage:.1f}%')
            print(f'Coverage min/max: {min_coverage:.1f}% / {max_coverage:.1f}%')
            print(f'Tempo medio: {avg_time:.2f}s')

        # Resultados por setor
        print('\n--- RESULTADOS POR SETOR ---')
        print(f'{"Setor":<25} {"Tickers":<8} {"OK":<5} {"Cov.Medio":<10} {"Tempo":<8}')
        print('-' * 60)

        for setor in test_cases.keys():
            setor_results = [r for r in results if r['setor_teste'] == setor]
            setor_errors = [e for e in errors if e['setor_teste'] == setor]

            total_setor = len(setor_results) + len(setor_errors)
            ok_count = len(setor_results)

            if setor_results:
                avg_cov = sum(r['coverage'] for r in setor_results) / len(setor_results)
                avg_t = sum(r['time'] for r in setor_results) / len(setor_results)
                print(f'{setor[:25]:<25} {total_setor:<8} {ok_count:<5} {avg_cov:>6.1f}%    {avg_t:>5.2f}s')
            else:
                print(f'{setor[:25]:<25} {total_setor:<8} {ok_count:<5} {"N/A":>6}     {"N/A":>5}')

        # Erros detalhados
        if errors:
            print('\n--- ERROS DETALHADOS ---')
            for e in errors:
                print(f'{e["ticker"]}: {e["error"]}')

        # Tickers com baixo coverage
        low_coverage = [r for r in results if r['coverage'] < 30]
        if low_coverage:
            print('\n--- TICKERS COM COVERAGE < 30% ---')
            for r in low_coverage:
                print(f'{r["ticker"]}: {r["coverage"]:.1f}% (tipo: {r["tipo"]})')

        print('\n' + '=' * 80)
        success_rate = 100 * total_success / total_tested if total_tested > 0 else 0
        if success_rate >= 90:
            print(f'TESTE COMPLETO: APROVADO ({success_rate:.1f}% sucesso)')
        else:
            print(f'TESTE COMPLETO: REQUER ATENCAO ({success_rate:.1f}% sucesso)')
        print('=' * 80)

        return success_rate >= 90

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    success = asyncio.run(test_all_sectors())
    sys.exit(0 if success else 1)
