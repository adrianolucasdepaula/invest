#!/usr/bin/env python3
"""
Script para testar scrapers com credenciais (username/password)

SCRAPERS TESTADOS (1 total):
1. Opcoes.net.br - Dados de opções

USO:
    python tests/test_credentials_scrapers.py
    python tests/test_credentials_scrapers.py --ticker PETR
    python tests/test_credentials_scrapers.py --detailed

REQUISITOS:
    - Variáveis de ambiente OPCOES_USERNAME e OPCOES_PASSWORD configuradas no .env
    - Credenciais válidas para opcoes.net.br
"""

import asyncio
import sys
import argparse
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
from loguru import logger
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Adicionar diretório pai ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Imports dos scrapers
try:
    from scrapers.opcoes_scraper import OpcoesNetScraper
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
        data_size: int = 0,
        credentials_valid: bool = False,
        login_success: bool = False
    ):
        self.name = name
        self.source = source
        self.query = query
        self.success = success
        self.data = data
        self.error = error
        self.duration = duration
        self.data_size = data_size
        self.credentials_valid = credentials_valid
        self.login_success = login_success
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
            "credentials_valid": self.credentials_valid,
            "login_success": self.login_success,
            "timestamp": self.timestamp,
        }


class CredentialsScraperTester:
    """Classe para testar scrapers com credenciais"""

    def __init__(self, detailed: bool = False):
        self.detailed = detailed
        self.results: List[ScraperTestResult] = []

    def check_credentials(self) -> Dict[str, bool]:
        """Verificar se credenciais estão configuradas"""
        credentials = {
            "OPCOES_USERNAME": os.getenv("OPCOES_USERNAME"),
            "OPCOES_PASSWORD": os.getenv("OPCOES_PASSWORD"),
        }

        missing = []
        for key, value in credentials.items():
            if not value:
                missing.append(key)
                logger.error(f"❌ {key} não configurada no .env")
            else:
                # Mostrar apenas primeiros/últimos caracteres por segurança
                if key.endswith("PASSWORD"):
                    masked = f"{value[:2]}***{value[-2:]}" if len(value) > 4 else "***"
                else:
                    masked = value
                logger.success(f"✓ {key} encontrada: {masked}")

        if missing:
            logger.error(f"\n⚠️  Credenciais faltando: {', '.join(missing)}")
            logger.error(f"Configure no arquivo .env:\n")
            for key in missing:
                logger.error(f"  {key}=seu_valor_aqui")
            return False

        logger.success(f"\n✓ Todas as credenciais configuradas!")
        return True

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
        login_success = False
        credentials_valid = False

        try:
            # Executar scraper
            logger.info(f"Executando {name}...")
            logger.info(f"  → Tentando login...")

            result = await scraper.scrape_with_retry(query)

            end_time = asyncio.get_event_loop().time()
            duration = end_time - start_time

            # Verificar resultado
            if result.success:
                data_size = len(result.data) if isinstance(result.data, (list, dict, str)) else 1

                logger.success(f"✓ {name}: SUCESSO")
                logger.success(f"  ✓ Login realizado com sucesso")
                logger.success(f"  ✓ Dados extraídos")
                logger.info(f"  Tempo: {duration:.2f}s")
                logger.info(f"  Dados: {data_size} item(s)")

                # Mostrar dados se detailed
                if self.detailed and result.data:
                    logger.info(f"\n  📊 Dados extraídos:")
                    if isinstance(result.data, dict):
                        for key, value in result.data.items():
                            logger.info(f"    {key}: {value}")
                    else:
                        logger.debug(f"  {json.dumps(result.data, indent=4, ensure_ascii=False)[:500]}...")

                login_success = True
                credentials_valid = True

                return ScraperTestResult(
                    name=name,
                    source=scraper.source,
                    query=query,
                    success=True,
                    data=result.data if self.detailed else None,
                    duration=duration,
                    data_size=data_size,
                    credentials_valid=True,
                    login_success=True
                )
            else:
                # Verificar se é erro de autenticação
                error_lower = str(result.error).lower()
                is_auth_error = any(keyword in error_lower for keyword in
                                   ['login', 'auth', 'credential', 'password', 'unauthorized',
                                    '401', '403', 'forbidden', 'access denied'])

                logger.error(f"✗ {name}: FALHOU")
                logger.error(f"  Erro: {result.error}")
                logger.info(f"  Tempo: {duration:.2f}s")

                if is_auth_error:
                    logger.error(f"  ✗ Falha de autenticação")
                    logger.warning(f"  ⚠️  Verifique credenciais no .env:")
                    logger.warning(f"     - OPCOES_USERNAME: Correto?")
                    logger.warning(f"     - OPCOES_PASSWORD: Correto?")
                    credentials_valid = False
                else:
                    logger.warning(f"  ⚠️  Erro não relacionado à autenticação")
                    credentials_valid = True

                return ScraperTestResult(
                    name=name,
                    source=scraper.source,
                    query=query,
                    success=False,
                    error=result.error,
                    duration=duration,
                    credentials_valid=credentials_valid,
                    login_success=False
                )

        except Exception as e:
            end_time = asyncio.get_event_loop().time()
            duration = end_time - start_time

            logger.error(f"✗ {name}: EXCEÇÃO")
            logger.error(f"  Erro: {str(e)}")
            logger.info(f"  Tempo: {duration:.2f}s")

            # Verificar se é erro de autenticação na exceção
            error_lower = str(e).lower()
            is_auth_error = any(keyword in error_lower for keyword in
                               ['login', 'auth', 'credential', 'password'])

            if is_auth_error:
                logger.error(f"  ✗ Exceção relacionada à autenticação")

            return ScraperTestResult(
                name=name,
                source=scraper.source if hasattr(scraper, 'source') else 'unknown',
                query=query,
                success=False,
                error=str(e),
                duration=duration,
                credentials_valid=not is_auth_error,
                login_success=False
            )

    async def run_all_tests(self, ticker: str = "PETR"):
        """
        Executar todos os testes de scrapers com credenciais

        Args:
            ticker: Ticker para testar (default: PETR)
        """
        logger.info("\n" + "="*60)
        logger.info("🧪 TESTE DE SCRAPERS COM CREDENCIAIS")
        logger.info("="*60)
        logger.info(f"Ticker: {ticker}")
        logger.info("="*60 + "\n")

        # Verificar credenciais primeiro
        if not self.check_credentials():
            logger.error("\nTestes não podem prosseguir sem credenciais configuradas")
            return

        logger.info("")

        # Definir scrapers e queries
        tests = [
            (OpcoesNetScraper(), ticker, "Opcoes.net.br"),
        ]

        # Executar testes
        for i, (scraper, query, name) in enumerate(tests, 1):
            logger.info(f"\n[{i}/{len(tests)}] Iniciando teste...")

            result = await self.test_scraper(scraper, query, name)
            self.results.append(result)

    def print_summary(self):
        """Imprimir resumo dos testes"""
        logger.info("\n" + "="*60)
        logger.info("📊 RESUMO DOS TESTES COM CREDENCIAIS")
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

        if total > 0:
            # Tempo médio
            avg_duration = sum(r.duration for r in self.results) / total
            logger.info(f"  ⏱ Tempo médio: {avg_duration:.2f}s")

        # Detalhes por scraper
        logger.info(f"\nDetalhes por Scraper:")
        logger.info(f"{'Scraper':<20} {'Status':<10} {'Tempo':<10} {'Login':<10} {'Credenciais'}")
        logger.info("-" * 70)

        for result in self.results:
            status = "✓ OK" if result.success else "✗ FALHA"
            duration_str = f"{result.duration:.2f}s"
            login_str = "✓" if result.login_success else "✗"
            cred_str = "✓" if result.credentials_valid else "✗"

            logger.info(
                f"{result.name:<20} {status:<10} {duration_str:<10} {login_str:<10} {cred_str}"
            )

        # Problemas de credenciais
        cred_issues = [r for r in self.results if not r.success and not r.credentials_valid]
        if cred_issues:
            logger.error(f"\n❌ PROBLEMAS DE CREDENCIAIS ({len(cred_issues)}):")
            for result in cred_issues:
                logger.error(f"  • {result.name}: Credenciais inválidas ou expiradas")
            logger.info(f"\n  💡 Solução: Verifique/atualize credenciais no .env:")
            logger.info(f"     - OPCOES_USERNAME=seu_cpf")
            logger.info(f"     - OPCOES_PASSWORD=sua_senha")

        # Outras falhas
        other_failures = [r for r in self.results if not r.success and r.credentials_valid]
        if other_failures:
            logger.error(f"\n⚠️  OUTRAS FALHAS ({len(other_failures)}):")
            for result in other_failures:
                logger.error(f"  • {result.name}: {result.error[:60]}")

        # Próximos passos
        logger.info(f"\n🎯 PRÓXIMOS PASSOS:")
        if failed > 0:
            logger.warning(f"  1. Investigar e corrigir {failed} scraper(s) com falhas")
            if cred_issues:
                logger.warning(f"  2. Atualizar credenciais para {len(cred_issues)} scraper(s)")
            logger.warning(f"  3. Re-executar testes após correções")
        if success == total:
            logger.success(f"  ✓ Todos os scrapers com credenciais estão funcionando!")
            logger.info(f"  → Próximo: Implementar sistema de jobs e orquestração (Fase 3)")

        logger.info(f"  → Documentar resultados em TEST_RESULTS.md")
        logger.info("")

    def save_results(self, filepath: str = "test_results_credentials.json"):
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
                "credential_issues": sum(1 for r in self.results if not r.success and not r.credentials_valid),
                "login_successes": sum(1 for r in self.results if r.login_success),
                "credentials_configured": {
                    "OPCOES_USERNAME": bool(os.getenv("OPCOES_USERNAME")),
                    "OPCOES_PASSWORD": bool(os.getenv("OPCOES_PASSWORD")),
                },
                "tests": [r.to_dict() for r in self.results]
            }

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(results_dict, f, indent=2, ensure_ascii=False)

            logger.success(f"✓ Resultados salvos em: {filepath}")
        except Exception as e:
            logger.error(f"Erro ao salvar resultados: {e}")


async def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description="Testar scrapers com credenciais")
    parser.add_argument("--ticker", default="PETR", help="Ticker para testar (default: PETR)")
    parser.add_argument("--detailed", action="store_true", help="Mostrar dados detalhados")
    parser.add_argument("--save", default="test_results_credentials.json", help="Arquivo para salvar resultados")

    args = parser.parse_args()

    # Criar tester
    tester = CredentialsScraperTester(detailed=args.detailed)

    try:
        # Executar testes
        await tester.run_all_tests(ticker=args.ticker)

        # Imprimir resumo
        tester.print_summary()

        # Salvar resultados
        if args.save:
            tester.save_results(args.save)

    except KeyboardInterrupt:
        logger.warning("\n\nTestes interrompidos pelo usuário")
        if tester.results:
            tester.print_summary()
    except Exception as e:
        logger.error(f"Erro ao executar testes: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
