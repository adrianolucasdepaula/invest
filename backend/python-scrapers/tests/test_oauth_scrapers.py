#!/usr/bin/env python3
"""
Script para testar scrapers OAuth (com autenticação Google)

SCRAPERS TESTADOS (18 total):

GRUPO 1: Fundamentalistas (3)
1. Fundamentei - Análise fundamentalista
2. Investidor10 - Dados fundamentalistas
3. StatusInvest - Dados fundamentalistas

GRUPO 2: Mercado (4)
4. Investing.com - Dados de mercado
5. ADVFN - Cotações e análises
6. Google Finance - Dados financeiros
7. TradingView - Análise técnica

GRUPO 3: IAs (5)
8. ChatGPT - Análise com IA
9. Gemini - Análise com IA
10. DeepSeek - Análise com IA
11. Claude - Análise com IA
12. Grok - Análise com IA

GRUPO 4: Notícias (4)
13. Investing News - Notícias financeiras
14. Valor - Notícias econômicas
15. Exame - Notícias de negócios
16. InfoMoney - Notícias de investimentos

GRUPO 5: Institucionais (2)
17. Estadão - Notícias econômicas
18. Mais Retorno - Análises e relatórios

USO:
    python tests/test_oauth_scrapers.py
    python tests/test_oauth_scrapers.py --ticker VALE3
    python tests/test_oauth_scrapers.py --group fundamentalistas
    python tests/test_oauth_scrapers.py --detailed

REQUISITOS:
    - Cookies OAuth salvos em browser-profiles/google_cookies.pkl
    - Execute save_google_cookies.py primeiro se não tiver os cookies
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
    # Grupo 1: Fundamentalistas
    from scrapers.fundamentei_scraper import FundamenteiScraper
    from scrapers.investidor10_scraper import Investidor10Scraper
    from scrapers.statusinvest_scraper import StatusInvestScraper

    # Grupo 2: Mercado
    from scrapers.investing_scraper import InvestingScraper
    from scrapers.advfn_scraper import ADVFNScraper
    from scrapers.googlefinance_scraper import GoogleFinanceScraper
    from scrapers.tradingview_scraper import TradingViewScraper

    # Grupo 3: IAs
    from scrapers.chatgpt_scraper import ChatGPTScraper
    from scrapers.gemini_scraper import GeminiScraper
    from scrapers.deepseek_scraper import DeepSeekScraper
    from scrapers.claude_scraper import ClaudeScraper
    from scrapers.grok_scraper import GrokScraper

    # Grupo 4: Notícias
    from scrapers.investing_news_scraper import InvestingNewsScraper
    from scrapers.valor_scraper import ValorScraper
    from scrapers.exame_scraper import ExameScraper
    from scrapers.infomoney_scraper import InfoMoneyScraper

    # Grupo 5: Institucionais
    from scrapers.estadao_scraper import EstadaoScraper
    from scrapers.maisretorno_scraper import MaisRetornoScraper

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
        group: str,
        query: str,
        success: bool,
        data: Optional[Any] = None,
        error: Optional[str] = None,
        duration: float = 0.0,
        data_size: int = 0,
        cookies_valid: bool = False
    ):
        self.name = name
        self.source = source
        self.group = group
        self.query = query
        self.success = success
        self.data = data
        self.error = error
        self.duration = duration
        self.data_size = data_size
        self.cookies_valid = cookies_valid
        self.timestamp = datetime.now().isoformat()

    def to_dict(self) -> Dict:
        """Converter para dicionário"""
        return {
            "name": self.name,
            "source": self.source,
            "group": self.group,
            "query": self.query,
            "success": self.success,
            "error": self.error,
            "duration": round(self.duration, 2),
            "data_size": self.data_size,
            "cookies_valid": self.cookies_valid,
            "timestamp": self.timestamp,
        }


class OAuthScraperTester:
    """Classe para testar scrapers OAuth"""

    def __init__(self, detailed: bool = False):
        self.detailed = detailed
        self.results: List[ScraperTestResult] = []
        self.cookies_file = Path("browser-profiles/google_cookies.pkl")

    def check_cookies(self) -> bool:
        """Verificar se cookies OAuth existem"""
        exists = self.cookies_file.exists()

        if not exists:
            logger.error(f"❌ Cookies OAuth não encontrados em: {self.cookies_file}")
            logger.error("Execute primeiro: python save_google_cookies.py")
            return False

        logger.success(f"✓ Cookies OAuth encontrados em: {self.cookies_file}")
        return True

    async def test_scraper(
        self,
        scraper,
        query: str,
        name: str,
        group: str
    ) -> ScraperTestResult:
        """
        Testar um scraper específico

        Args:
            scraper: Instância do scraper
            query: Query para buscar
            name: Nome do scraper
            group: Grupo do scraper

        Returns:
            ScraperTestResult com resultado do teste
        """
        logger.info(f"\n{'='*60}")
        logger.info(f"Testando: {name} ({group})")
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
                    group=group,
                    query=query,
                    success=True,
                    data=result.data if self.detailed else None,
                    duration=duration,
                    data_size=data_size,
                    cookies_valid=True
                )
            else:
                # Verificar se é erro de autenticação
                is_auth_error = any(keyword in str(result.error).lower() for keyword in
                                   ['cookie', 'auth', 'login', 'unauthorized', '401', '403'])

                logger.error(f"✗ {name}: FALHOU")
                logger.error(f"  Erro: {result.error}")
                logger.info(f"  Tempo: {duration:.2f}s")

                if is_auth_error:
                    logger.warning(f"  ⚠️  Possível problema de autenticação/cookies")

                return ScraperTestResult(
                    name=name,
                    source=scraper.source,
                    group=group,
                    query=query,
                    success=False,
                    error=result.error,
                    duration=duration,
                    cookies_valid=not is_auth_error
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
                group=group,
                query=query,
                success=False,
                error=str(e),
                duration=duration
            )

    async def run_group_tests(
        self,
        group_name: str,
        tests: List[tuple],
        pause_between: int = 3
    ):
        """
        Executar testes de um grupo específico

        Args:
            group_name: Nome do grupo
            tests: Lista de tuplas (scraper, query, name)
            pause_between: Segundos de pausa entre testes
        """
        logger.info(f"\n{'#'*60}")
        logger.info(f"GRUPO: {group_name.upper()}")
        logger.info(f"Total de scrapers: {len(tests)}")
        logger.info(f"{'#'*60}\n")

        for i, (scraper, query, name) in enumerate(tests, 1):
            logger.info(f"\n[{i}/{len(tests)}] Iniciando teste do grupo {group_name}...")

            result = await self.test_scraper(scraper, query, name, group_name)
            self.results.append(result)

            # Pausa entre testes para não sobrecarregar
            if i < len(tests):
                await asyncio.sleep(pause_between)

    async def run_all_tests(
        self,
        ticker: str = "PETR4",
        ai_prompt: str = "Analise PETR4",
        news_query: str = "mercado",
        group_filter: Optional[str] = None
    ):
        """
        Executar todos os testes de scrapers OAuth

        Args:
            ticker: Ticker para testar (default: PETR4)
            ai_prompt: Prompt para IAs (default: Analise PETR4)
            news_query: Query para notícias (default: mercado)
            group_filter: Filtrar por grupo específico (opcional)
        """
        logger.info("\n" + "="*60)
        logger.info("🧪 TESTE DE SCRAPERS OAUTH")
        logger.info("="*60)
        logger.info(f"Ticker: {ticker}")
        logger.info(f"AI Prompt: {ai_prompt}")
        logger.info(f"News Query: {news_query}")
        if group_filter:
            logger.info(f"Filtro de Grupo: {group_filter}")
        logger.info("="*60 + "\n")

        # Verificar cookies primeiro
        if not self.check_cookies():
            logger.error("Testes não podem prosseguir sem cookies OAuth")
            return

        # Definir grupos de testes
        all_groups = {
            "fundamentalistas": [
                (FundamenteiScraper(), ticker, "Fundamentei"),
                (Investidor10Scraper(), ticker, "Investidor10"),
                (StatusInvestScraper(), ticker, "StatusInvest"),
            ],
            "mercado": [
                (InvestingScraper(), ticker, "Investing.com"),
                (ADVFNScraper(), ticker, "ADVFN"),
                (GoogleFinanceScraper(), f"BVMF:{ticker}", "Google Finance"),
                (TradingViewScraper(), ticker, "TradingView"),
            ],
            "ias": [
                (ChatGPTScraper(), ai_prompt, "ChatGPT"),
                (GeminiScraper(), ai_prompt, "Gemini"),
                (DeepSeekScraper(), ai_prompt, "DeepSeek"),
                (ClaudeScraper(), ai_prompt, "Claude"),
                (GrokScraper(), ai_prompt, "Grok"),
            ],
            "noticias": [
                (InvestingNewsScraper(), ticker, "Investing News"),
                (ValorScraper(), news_query, "Valor"),
                (ExameScraper(), news_query, "Exame"),
                (InfoMoneyScraper(), news_query, "InfoMoney"),
            ],
            "institucionais": [
                (EstadaoScraper(), news_query, "Estadão"),
                (MaisRetornoScraper(), ticker, "Mais Retorno"),
            ],
        }

        # Filtrar grupos se necessário
        if group_filter and group_filter.lower() in all_groups:
            groups_to_test = {group_filter.lower(): all_groups[group_filter.lower()]}
        else:
            groups_to_test = all_groups

        # Executar testes por grupo
        for group_name, tests in groups_to_test.items():
            # Pausa maior para IAs (respostas demoram mais)
            pause = 10 if group_name == "ias" else 3

            await self.run_group_tests(group_name, tests, pause_between=pause)

            # Pausa entre grupos
            await asyncio.sleep(5)

    def print_summary(self):
        """Imprimir resumo dos testes"""
        logger.info("\n" + "="*60)
        logger.info("📊 RESUMO DOS TESTES OAUTH")
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

        # Estatísticas por grupo
        logger.info(f"\nEstatísticas por Grupo:")
        groups = {}
        for result in self.results:
            if result.group not in groups:
                groups[result.group] = {"total": 0, "success": 0}
            groups[result.group]["total"] += 1
            if result.success:
                groups[result.group]["success"] += 1

        for group, stats in groups.items():
            rate = (stats["success"] / stats["total"] * 100) if stats["total"] > 0 else 0
            logger.info(f"  {group:20s} {stats['success']:2d}/{stats['total']:2d} ({rate:5.1f}%)")

        # Detalhes por scraper
        logger.info(f"\nDetalhes por Scraper:")
        logger.info(f"{'Scraper':<25} {'Grupo':<15} {'Status':<10} {'Tempo':<10} {'Cookies'}")
        logger.info("-" * 85)

        for result in self.results:
            status = "✓ OK" if result.success else "✗ FALHA"
            duration_str = f"{result.duration:.2f}s"
            cookies_str = "✓" if result.cookies_valid else "✗"

            logger.info(
                f"{result.name:<25} {result.group:<15} {status:<10} {duration_str:<10} {cookies_str}"
            )

        # Problemas de autenticação
        auth_issues = [r for r in self.results if not r.success and not r.cookies_valid]
        if auth_issues:
            logger.warning(f"\n⚠️  PROBLEMAS DE AUTENTICAÇÃO/COOKIES ({len(auth_issues)}):")
            for result in auth_issues:
                logger.warning(f"  • {result.name}: Cookies podem estar expirados")
            logger.info(f"\n  💡 Solução: Execute 'python save_google_cookies.py' para renovar cookies")

        # Falhas detalhadas
        other_failures = [r for r in self.results if not r.success and r.cookies_valid]
        if other_failures:
            logger.error(f"\n❌ OUTRAS FALHAS ({len(other_failures)}):")
            for result in other_failures:
                logger.error(f"  • {result.name}: {result.error[:60]}")

        # Próximos passos
        logger.info(f"\n🎯 PRÓXIMOS PASSOS:")
        if failed > 0:
            logger.warning(f"  1. Investigar e corrigir {failed} scraper(s) com falhas")
            if auth_issues:
                logger.warning(f"  2. Renovar cookies OAuth para {len(auth_issues)} scraper(s)")
            logger.warning(f"  3. Re-executar testes após correções")
        if success == total:
            logger.success(f"  ✓ Todos os scrapers OAuth estão funcionando!")
            logger.info(f"  → Próximo: Testar scraper de credenciais (Opcoes.net.br)")

        logger.info(f"  → Documentar resultados em TEST_RESULTS.md")
        logger.info("")

    def save_results(self, filepath: str = "test_results_oauth.json"):
        """
        Salvar resultados em arquivo JSON

        Args:
            filepath: Caminho do arquivo para salvar
        """
        try:
            # Estatísticas por grupo
            groups_stats = {}
            for result in self.results:
                if result.group not in groups_stats:
                    groups_stats[result.group] = {"total": 0, "success": 0, "failed": 0}
                groups_stats[result.group]["total"] += 1
                if result.success:
                    groups_stats[result.group]["success"] += 1
                else:
                    groups_stats[result.group]["failed"] += 1

            results_dict = {
                "timestamp": datetime.now().isoformat(),
                "total": len(self.results),
                "success": sum(1 for r in self.results if r.success),
                "failed": sum(1 for r in self.results if not r.success),
                "auth_issues": sum(1 for r in self.results if not r.success and not r.cookies_valid),
                "cookies_file": str(self.cookies_file),
                "cookies_exist": self.cookies_file.exists(),
                "groups": groups_stats,
                "tests": [r.to_dict() for r in self.results]
            }

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(results_dict, f, indent=2, ensure_ascii=False)

            logger.success(f"✓ Resultados salvos em: {filepath}")
        except Exception as e:
            logger.error(f"Erro ao salvar resultados: {e}")


async def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description="Testar scrapers OAuth")
    parser.add_argument("--ticker", default="PETR4", help="Ticker para testar (default: PETR4)")
    parser.add_argument("--ai-prompt", default="Analise PETR4", help="Prompt para IAs (default: Analise PETR4)")
    parser.add_argument("--news", default="mercado", help="Query para notícias (default: mercado)")
    parser.add_argument("--group", help="Testar apenas um grupo específico (fundamentalistas, mercado, ias, noticias, institucionais)")
    parser.add_argument("--detailed", action="store_true", help="Mostrar dados detalhados")
    parser.add_argument("--save", default="test_results_oauth.json", help="Arquivo para salvar resultados")

    args = parser.parse_args()

    # Criar tester
    tester = OAuthScraperTester(detailed=args.detailed)

    try:
        # Executar testes
        await tester.run_all_tests(
            ticker=args.ticker,
            ai_prompt=args.ai_prompt,
            news_query=args.news,
            group_filter=args.group
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
