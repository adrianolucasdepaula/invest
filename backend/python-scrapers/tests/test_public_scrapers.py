#!/usr/bin/env python3
"""
Script para testar scrapers públicos (sem autenticação)

SCRAPERS TESTADOS (8 total):
1. Fundamentus - Dados fundamentalistas
2. Investsite - Dados de ações
3. B3 - Cotações oficiais
4. BCB - Indicadores macroeconômicos
5. Griffin - Movimentações insiders
6. CoinMarketCap - Criptomoedas
7. Bloomberg Línea - Notícias
8. Google News - Notícias

USO:
    python tests/test_public_scrapers.py
    python tests/test_public_scrapers.py --ticker VALE3
    python tests/test_public_scrapers.py --detailed

REQUISITOS:
    - Nenhuma autenticação necessária
    - Conexão com internet
"""

import asyncio
import sys
import argparse
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from loguru import logger

# Adicionar diretório pai ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Imports dos scrapers
try:
    from scrapers.fundamentus_scraper import FundamentusScraper
    from scrapers.investsite_scraper import InvestsiteScraper
    from scrapers.b3_scraper import B3Scraper
    from scrapers.bcb_scraper import BCBScraper
    from scrapers.griffin_scraper import GriffinScraper
    from scrapers.coinmarketcap_scraper import CoinMarketCapScraper
    from scrapers.bloomberg_scraper import BloombergScraper
    from scrapers.google_news_scraper import GoogleNewsScraper
except ImportError as e:
    logger.error(f"Erro ao importar scrapers: {e}")
    logger.error("Certifique-se de que os scrapers estão implementados")
    sys.exit(1)

# Configurar logger
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    level="INFO"
)


class ScraperTestResult:
    """Resultado de um teste de scraper"""

    def __init__(
        self,
        name: str,
        source: str,
        query: str,
        success: bool,
        data: Optional[Any] = None,
        error: Optional[str] = None,
        duration: float = 0.0,
        data_size: int = 0
    ):
        self.name = name
        self.source = source
        self.query = query
        self.success = success
        self.data = data
        self.error = error
        self.duration = duration
        self.data_size = data_size
        self.timestamp = datetime.now().isoformat()

    def to_dict(self) -> Dict:
        """Converter para dicionário"""
        return {
            "name": self.name,
            "source": self.source,
            "query": self.query,
            "success": self.success,
            "error": self.error,
            "duration": round(self.duration, 2),
            "data_size": self.data_size,
            "timestamp": self.timestamp,
        }


class PublicScraperTester:
    """Classe para testar scrapers públicos"""

    def __init__(self, detailed: bool = False):
        self.detailed = detailed
        self.results: List[ScraperTestResult] = []

    async def test_scraper(
        self,
        scraper,
        query: str,
        name: str
    ) -> ScraperTestResult:
        """
        Testar um scraper específico

        Args:
            scraper: Instância do scraper
            query: Query para buscar
            name: Nome do scraper

        Returns:
            ScraperTestResult com resultado do teste
        """
        logger.info(f"\n{'='*60}")
        logger.info(f"Testando: {name}")
        logger.info(f"Query: {query}")
        logger.info(f"{'='*60}")

        start_time = asyncio.get_event_loop().time()

        try:
            # Executar scraper
            logger.info(f"Executando {name}...")
            result = await scraper.scrape_with_retry(query)

            end_time = asyncio.get_event_loop().time()
            duration = end_time - start_time

            # Verificar resultado
            if result.success:
                data_size = len(result.data) if isinstance(result.data, (list, dict, str)) else 1

                logger.success(f"✓ {name}: SUCESSO")
                logger.info(f"  Tempo: {duration:.2f}s")
                logger.info(f"  Dados: {data_size} item(s)")

                # Mostrar dados se detailed
                if self.detailed and result.data:
                    logger.debug(f"  Preview: {json.dumps(result.data, indent=2, ensure_ascii=False)[:500]}...")

                return ScraperTestResult(
                    name=name,
                    source=scraper.source,
                    query=query,
                    success=True,
                    data=result.data if self.detailed else None,
                    duration=duration,
                    data_size=data_size
                )
            else:
                logger.error(f"✗ {name}: FALHOU")
                logger.error(f"  Erro: {result.error}")
                logger.info(f"  Tempo: {duration:.2f}s")

                return ScraperTestResult(
                    name=name,
                    source=scraper.source,
                    query=query,
                    success=False,
                    error=result.error,
                    duration=duration
                )

        except Exception as e:
            end_time = asyncio.get_event_loop().time()
            duration = end_time - start_time

            logger.error(f"✗ {name}: EXCEÇÃO")
            logger.error(f"  Erro: {str(e)}")
            logger.info(f"  Tempo: {duration:.2f}s")

            return ScraperTestResult(
                name=name,
                source=scraper.source if hasattr(scraper, 'source') else 'unknown',
                query=query,
                success=False,
                error=str(e),
                duration=duration
            )

    async def run_all_tests(self, ticker: str = "PETR4", crypto: str = "BTC", news_query: str = "mercado"):
        """
        Executar todos os testes de scrapers públicos

        Args:
            ticker: Ticker para testar (default: PETR4)
            crypto: Criptomoeda para testar (default: BTC)
            news_query: Query para notícias (default: mercado)
        """
        logger.info("\n" + "="*60)
        logger.info("🧪 TESTE DE SCRAPERS PÚBLICOS")
        logger.info("="*60)
        logger.info(f"Ticker: {ticker}")
        logger.info(f"Crypto: {crypto}")
        logger.info(f"News Query: {news_query}")
        logger.info("="*60 + "\n")

        # Definir scrapers e queries
        tests = [
            (FundamentusScraper(), ticker, "Fundamentus"),
            (InvestsiteScraper(), ticker, "Investsite"),
            (B3Scraper(), ticker, "B3"),
            (BCBScraper(), "all", "BCB"),
            (GriffinScraper(), ticker, "Griffin"),
            (CoinMarketCapScraper(), crypto, "CoinMarketCap"),
            (BloombergScraper(), news_query, "Bloomberg Línea"),
            (GoogleNewsScraper(), ticker, "Google News"),
        ]

        # Executar testes sequencialmente
        for i, (scraper, query, name) in enumerate(tests, 1):
            logger.info(f"\n[{i}/{len(tests)}] Iniciando teste...")

            result = await self.test_scraper(scraper, query, name)
            self.results.append(result)

            # Pausa entre testes para não sobrecarregar
            if i < len(tests):
                await asyncio.sleep(2)

    def print_summary(self):
        """Imprimir resumo dos testes"""
        logger.info("\n" + "="*60)
        logger.info("📊 RESUMO DOS TESTES")
        logger.info("="*60)

        # Estatísticas gerais
        total = len(self.results)
        success = sum(1 for r in self.results if r.success)
        failed = total - success
        success_rate = (success / total * 100) if total > 0 else 0

        logger.info(f"\nEstatísticas Gerais:")
        logger.info(f"  Total testado: {total}")
        logger.info(f"  ✓ Sucesso: {success} ({success_rate:.1f}%)")
        logger.info(f"  ✗ Falhas: {failed} ({100-success_rate:.1f}%)")

        # Tempo médio
        avg_duration = sum(r.duration for r in self.results) / total if total > 0 else 0
        logger.info(f"  ⏱ Tempo médio: {avg_duration:.2f}s")

        # Detalhes por scraper
        logger.info(f"\nDetalhes por Scraper:")
        logger.info(f"{'Scraper':<25} {'Status':<10} {'Tempo':<10} {'Dados':<10} {'Erro'}")
        logger.info("-" * 80)

        for result in self.results:
            status = "✓ OK" if result.success else "✗ FALHA"
            duration_str = f"{result.duration:.2f}s"
            data_str = f"{result.data_size}" if result.success else "-"
            error_str = result.error[:40] if result.error else "-"

            logger.info(
                f"{result.name:<25} {status:<10} {duration_str:<10} {data_str:<10} {error_str}"
            )

        # Falhas detalhadas
        if failed > 0:
            logger.error(f"\n⚠️  SCRAPERS COM FALHAS:")
            for result in self.results:
                if not result.success:
                    logger.error(f"  • {result.name}: {result.error}")

        # Próximos passos
        logger.info(f"\n🎯 PRÓXIMOS PASSOS:")
        if failed > 0:
            logger.warning(f"  1. Investigar e corrigir {failed} scraper(s) com falhas")
            logger.warning(f"  2. Re-executar testes após correções")
        if success == total:
            logger.success(f"  ✓ Todos os scrapers públicos estão funcionando!")
            logger.info(f"  → Próximo: Testar scrapers OAuth (18 scrapers)")

        logger.info(f"  → Documentar resultados em TEST_RESULTS.md")
        logger.info("")

    def save_results(self, filepath: str = "test_results_public.json"):
        """
        Salvar resultados em arquivo JSON

        Args:
            filepath: Caminho do arquivo para salvar
        """
        try:
            results_dict = {
                "timestamp": datetime.now().isoformat(),
                "total": len(self.results),
                "success": sum(1 for r in self.results if r.success),
                "failed": sum(1 for r in self.results if not r.success),
                "tests": [r.to_dict() for r in self.results]
            }

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(results_dict, f, indent=2, ensure_ascii=False)

            logger.success(f"✓ Resultados salvos em: {filepath}")
        except Exception as e:
            logger.error(f"Erro ao salvar resultados: {e}")


async def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description="Testar scrapers públicos")
    parser.add_argument("--ticker", default="PETR4", help="Ticker para testar (default: PETR4)")
    parser.add_argument("--crypto", default="BTC", help="Criptomoeda para testar (default: BTC)")
    parser.add_argument("--news", default="mercado", help="Query para notícias (default: mercado)")
    parser.add_argument("--detailed", action="store_true", help="Mostrar dados detalhados")
    parser.add_argument("--save", default="test_results_public.json", help="Arquivo para salvar resultados")

    args = parser.parse_args()

    # Criar tester
    tester = PublicScraperTester(detailed=args.detailed)

    try:
        # Executar testes
        await tester.run_all_tests(
            ticker=args.ticker,
            crypto=args.crypto,
            news_query=args.news
        )

        # Imprimir resumo
        tester.print_summary()

        # Salvar resultados
        if args.save:
            tester.save_results(args.save)

    except KeyboardInterrupt:
        logger.warning("\n\nTestes interrompidos pelo usuário")
        tester.print_summary()
    except Exception as e:
        logger.error(f"Erro ao executar testes: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
