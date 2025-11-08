#!/usr/bin/env python3
"""
Script de validação completa do ambiente

Verifica:
1. Variáveis de ambiente (.env)
2. Diretórios necessários
3. Dependências Python
4. Serviços (PostgreSQL, Redis)
5. Permissões de arquivos
6. Cookies OAuth (se existirem)

USO:
    python validate_setup.py
    python validate_setup.py --detailed
"""

import os
import sys
import json
import pickle
import argparse
from pathlib import Path
from typing import Dict, List, Tuple
from loguru import logger
from dotenv import load_dotenv

# Configurar logger
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    level="INFO"
)


class SetupValidator:
    """Validador de configuração do ambiente"""

    def __init__(self, detailed: bool = False):
        self.detailed = detailed
        self.checks_passed = 0
        self.checks_failed = 0
        self.warnings = 0
        self.errors: List[str] = []
        self.root_dir = Path(__file__).parent

    def check_env_file(self) -> bool:
        """Verificar se arquivo .env existe"""
        logger.info("\n📝 Verificando arquivo .env...")

        env_paths = [
            self.root_dir.parent / ".env",  # backend/.env
            self.root_dir / ".env",  # python-scrapers/.env
        ]

        env_found = False
        for env_path in env_paths:
            if env_path.exists():
                logger.success(f"  ✓ Arquivo .env encontrado: {env_path}")
                env_found = True
                self.env_path = env_path

                # Carregar variáveis de ambiente
                load_dotenv(env_path)
                logger.info(f"  ✓ Variáveis de ambiente carregadas")
                break

        if not env_found:
            logger.error(f"  ✗ Arquivo .env não encontrado!")
            logger.error(f"    Procurados em: {', '.join(str(p) for p in env_paths)}")
            self.errors.append("Arquivo .env não encontrado")
            return False

        return True

    def check_required_env_vars(self) -> bool:
        """Verificar variáveis de ambiente obrigatórias"""
        logger.info("\n🔑 Verificando variáveis de ambiente obrigatórias...")

        # Variáveis obrigatórias
        required_vars = {
            "DB_HOST": "Host do banco de dados",
            "DB_PORT": "Porta do banco de dados",
            "DB_USERNAME": "Usuário do banco",
            "DB_PASSWORD": "Senha do banco",
            "DB_DATABASE": "Nome do banco",
            "REDIS_HOST": "Host do Redis",
            "REDIS_PORT": "Porta do Redis",
            "JWT_SECRET": "Secret do JWT",
            "OPCOES_USERNAME": "Usuário Opcoes.net.br",
            "OPCOES_PASSWORD": "Senha Opcoes.net.br",
        }

        # Variáveis opcionais mas recomendadas
        optional_vars = {
            "OPENAI_API_KEY": "Chave API OpenAI (para IA)",
            "GOOGLE_EMAIL": "Email Google (para OAuth)",
            "GOOGLE_PASSWORD": "Senha Google (para OAuth)",
        }

        all_ok = True

        # Verificar obrigatórias
        logger.info("\n  Variáveis Obrigatórias:")
        for var, description in required_vars.items():
            value = os.getenv(var)
            if value and value != f"your-{var.lower().replace('_', '-')}":
                logger.success(f"    ✓ {var}: {description}")
                self.checks_passed += 1
            else:
                logger.error(f"    ✗ {var}: {description} - NÃO CONFIGURADA")
                self.errors.append(f"{var} não configurada")
                self.checks_failed += 1
                all_ok = False

        # Verificar opcionais
        logger.info("\n  Variáveis Opcionais (Recomendadas):")
        for var, description in optional_vars.items():
            value = os.getenv(var)
            if value and value != f"your-{var.lower().replace('_', '-')}":
                logger.success(f"    ✓ {var}: {description}")
            else:
                logger.warning(f"    ⚠ {var}: {description} - Não configurada")
                self.warnings += 1

        return all_ok

    def check_directories(self) -> bool:
        """Verificar se diretórios necessários existem"""
        logger.info("\n📁 Verificando diretórios necessários...")

        required_dirs = [
            self.root_dir / "browser-profiles",
            self.root_dir / "logs",
            self.root_dir / "data" / "cache",
            self.root_dir / "data" / "results",
            self.root_dir / "scrapers",
            self.root_dir / "tests",
        ]

        all_ok = True
        for dir_path in required_dirs:
            if dir_path.exists():
                # Verificar permissões
                if os.access(dir_path, os.R_OK | os.W_OK):
                    logger.success(f"  ✓ {dir_path.relative_to(self.root_dir)} (R/W)")
                    self.checks_passed += 1
                else:
                    logger.warning(f"  ⚠ {dir_path.relative_to(self.root_dir)} (sem permissões R/W)")
                    self.warnings += 1
            else:
                logger.error(f"  ✗ {dir_path.relative_to(self.root_dir)} - NÃO EXISTE")
                self.errors.append(f"Diretório {dir_path} não existe")
                self.checks_failed += 1
                all_ok = False

        return all_ok

    def check_python_dependencies(self) -> bool:
        """Verificar dependências Python instaladas"""
        logger.info("\n🐍 Verificando dependências Python...")

        # Mapeamento de pacotes que têm nome de import diferente
        package_imports = {
            "selenium": "selenium",
            "aiohttp": "aiohttp",
            "loguru": "loguru",
            "beautifulsoup4": "bs4",  # beautifulsoup4 é importado como bs4
            "lxml": "lxml",
            "pandas": "pandas",
            "redis": "redis",
            "psycopg2": "psycopg2",
            "sqlalchemy": "sqlalchemy",
        }

        all_ok = True
        for package_name, import_name in package_imports.items():
            try:
                __import__(import_name)
                logger.success(f"  ✓ {package_name}")
                self.checks_passed += 1
            except ImportError:
                logger.error(f"  ✗ {package_name} - NÃO INSTALADO")
                self.errors.append(f"Pacote {package_name} não instalado")
                self.checks_failed += 1
                all_ok = False

        return all_ok

    def check_services(self) -> bool:
        """Verificar conectividade com serviços (PostgreSQL, Redis)"""
        logger.info("\n🔌 Verificando conectividade com serviços...")

        # Redis
        try:
            import redis
            redis_host = os.getenv("REDIS_HOST", "localhost")
            redis_port = int(os.getenv("REDIS_PORT", 6379))
            redis_password = os.getenv("REDIS_PASSWORD", "")

            r = redis.Redis(
                host=redis_host,
                port=redis_port,
                password=redis_password if redis_password else None,
                socket_connect_timeout=3
            )
            r.ping()
            logger.success(f"  ✓ Redis: {redis_host}:{redis_port}")
            self.checks_passed += 1
        except Exception as e:
            logger.warning(f"  ⚠ Redis: Não conectado - {str(e)[:50]}")
            self.warnings += 1

        # PostgreSQL
        try:
            import psycopg2
            db_config = {
                "host": os.getenv("DB_HOST", "localhost"),
                "port": int(os.getenv("DB_PORT", 5432)),
                "user": os.getenv("DB_USERNAME", ""),
                "password": os.getenv("DB_PASSWORD", ""),
                "dbname": os.getenv("DB_DATABASE", ""),
            }

            conn = psycopg2.connect(**db_config, connect_timeout=3)
            conn.close()
            logger.success(f"  ✓ PostgreSQL: {db_config['host']}:{db_config['port']}")
            self.checks_passed += 1
        except Exception as e:
            logger.warning(f"  ⚠ PostgreSQL: Não conectado - {str(e)[:50]}")
            self.warnings += 1

        # Nota: Serviços offline não são considerados erros críticos
        return True

    def check_cookies_file(self) -> bool:
        """Verificar se arquivo de cookies OAuth existe"""
        logger.info("\n🍪 Verificando cookies OAuth...")

        cookies_file = self.root_dir / "browser-profiles" / "google_cookies.pkl"

        if cookies_file.exists():
            try:
                with open(cookies_file, 'rb') as f:
                    cookies = pickle.load(f)

                logger.success(f"  ✓ Cookies encontrados: {len(cookies)} sites")
                if self.detailed:
                    for site_name in cookies.keys():
                        logger.info(f"    • {site_name}: {len(cookies[site_name])} cookies")
                self.checks_passed += 1
                return True
            except Exception as e:
                logger.warning(f"  ⚠ Erro ao carregar cookies: {e}")
                self.warnings += 1
        else:
            logger.warning(f"  ⚠ Cookies não encontrados")
            logger.info(f"    Execute: python save_google_cookies.py")
            self.warnings += 1

        return True

    def check_scrapers(self) -> bool:
        """Verificar se scrapers estão implementados"""
        logger.info("\n🔍 Verificando scrapers implementados...")

        scrapers_dir = self.root_dir / "scrapers"
        if not scrapers_dir.exists():
            logger.error("  ✗ Diretório scrapers não encontrado")
            return False

        # Contar scrapers
        scraper_files = list(scrapers_dir.glob("*_scraper.py"))
        logger.info(f"  📊 Total de scrapers: {len(scraper_files)}")

        if len(scraper_files) >= 27:
            logger.success(f"  ✓ {len(scraper_files)} scrapers implementados (meta: 27+)")
            self.checks_passed += 1
        else:
            logger.warning(f"  ⚠ {len(scraper_files)} scrapers implementados (meta: 27)")
            self.warnings += 1

        if self.detailed:
            for scraper_file in sorted(scraper_files):
                logger.info(f"    • {scraper_file.stem}")

        return True

    def print_summary(self):
        """Imprimir resumo da validação"""
        logger.info("\n" + "="*60)
        logger.info("📊 RESUMO DA VALIDAÇÃO")
        logger.info("="*60)

        total_checks = self.checks_passed + self.checks_failed
        success_rate = (self.checks_passed / total_checks * 100) if total_checks > 0 else 0

        logger.info(f"\nEstatísticas:")
        logger.info(f"  Total de verificações: {total_checks}")
        logger.info(f"  ✓ Passou: {self.checks_passed}")
        logger.info(f"  ✗ Falhou: {self.checks_failed}")
        logger.info(f"  ⚠ Avisos: {self.warnings}")
        logger.info(f"  📈 Taxa de sucesso: {success_rate:.1f}%")

        # Status final
        logger.info("")
        if self.checks_failed == 0:
            logger.success("✅ AMBIENTE VÁLIDO E PRONTO PARA USO!")
        else:
            logger.error("❌ AMBIENTE COM PROBLEMAS")
            logger.error("\nErros encontrados:")
            for error in self.errors:
                logger.error(f"  • {error}")

        # Próximos passos
        logger.info("\n🎯 PRÓXIMOS PASSOS:")
        if self.checks_failed > 0:
            logger.info("  1. Corrigir os erros listados acima")
            logger.info("  2. Re-executar validação: python validate_setup.py")
        elif self.warnings > 0:
            logger.info("  1. (Opcional) Corrigir avisos para funcionalidade completa")
            logger.info("  2. Salvar cookies OAuth: python save_google_cookies.py")
            logger.info("  3. Testar scrapers públicos: python tests/test_public_scrapers.py")
        else:
            logger.info("  ✓ Tudo pronto!")
            logger.info("  → Testar scrapers públicos: python tests/test_public_scrapers.py")
            logger.info("  → Testar scrapers OAuth: python tests/test_oauth_scrapers.py")

        logger.info("")

    def run(self):
        """Executar todas as validações"""
        logger.info("\n" + "="*60)
        logger.info("🔍 VALIDAÇÃO DE CONFIGURAÇÃO DO AMBIENTE")
        logger.info("="*60)

        # Executar verificações
        checks = [
            ("Arquivo .env", self.check_env_file),
            ("Variáveis de ambiente", self.check_required_env_vars),
            ("Diretórios", self.check_directories),
            ("Dependências Python", self.check_python_dependencies),
            ("Serviços", self.check_services),
            ("Cookies OAuth", self.check_cookies_file),
            ("Scrapers", self.check_scrapers),
        ]

        for check_name, check_func in checks:
            try:
                check_func()
            except Exception as e:
                logger.error(f"\n❌ Erro ao executar '{check_name}': {e}")
                self.checks_failed += 1
                self.errors.append(f"{check_name}: {str(e)}")

        # Imprimir resumo
        self.print_summary()

        # Retornar código de saída
        return 0 if self.checks_failed == 0 else 1


def main():
    """Função principal"""
    parser = argparse.ArgumentParser(description="Validar configuração do ambiente")
    parser.add_argument("--detailed", action="store_true", help="Mostrar informações detalhadas")
    args = parser.parse_args()

    validator = SetupValidator(detailed=args.detailed)
    exit_code = validator.run()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
