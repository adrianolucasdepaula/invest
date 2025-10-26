"""
Classe base para scrapers
"""
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from datetime import datetime
import time
from loguru import logger
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
import requests
from ..core.config import settings


class BaseScraper(ABC):
    """
    Classe base para todos os scrapers
    Implementa funcionalidades comuns de scraping
    """

    def __init__(self, source_name: str, requires_auth: bool = False):
        """
        Inicializa o scraper

        Args:
            source_name: Nome da fonte de dados
            requires_auth: Se requer autenticação
        """
        self.source_name = source_name
        self.requires_auth = requires_auth
        self.driver: Optional[webdriver.Chrome] = None
        self.session = requests.Session()
        self.last_request_time = 0
        self.min_request_interval = 1.0  # segundos entre requisições

    def _init_selenium(self) -> webdriver.Chrome:
        """
        Inicializa o Selenium WebDriver

        Returns:
            WebDriver configurado
        """
        chrome_options = Options()

        if settings.HEADLESS_MODE:
            chrome_options.add_argument("--headless")

        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument(f"user-agent={settings.USER_AGENT}")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option("useAutomationExtension", False)

        driver = webdriver.Chrome(options=chrome_options)
        driver.execute_cdp_cmd("Page.addScriptToEvaluateOnNewDocument", {
            "source": """
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
            """
        })

        return driver

    def _respect_rate_limit(self):
        """
        Respeita o limite de taxa de requisições
        """
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time

        if time_since_last_request < self.min_request_interval:
            sleep_time = self.min_request_interval - time_since_last_request
            time.sleep(sleep_time)

        self.last_request_time = time.time()

    def _retry_on_failure(self, func, max_retries: int = 3, *args, **kwargs):
        """
        Executa função com retry em caso de falha

        Args:
            func: Função a ser executada
            max_retries: Número máximo de tentativas

        Returns:
            Resultado da função
        """
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"Falha após {max_retries} tentativas: {str(e)}")
                    raise
                logger.warning(f"Tentativa {attempt + 1} falhou: {str(e)}. Tentando novamente...")
                time.sleep(2 ** attempt)  # Exponential backoff

    @abstractmethod
    async def authenticate(self) -> bool:
        """
        Realiza autenticação na fonte de dados

        Returns:
            True se autenticação foi bem sucedida
        """
        pass

    @abstractmethod
    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados para um ativo específico

        Args:
            ticker: Código do ativo
            **kwargs: Parâmetros adicionais

        Returns:
            Dicionário com os dados coletados
        """
        pass

    async def validate_data(self, data: Dict[str, Any]) -> bool:
        """
        Valida os dados coletados

        Args:
            data: Dados a serem validados

        Returns:
            True se dados são válidos
        """
        if not data:
            return False

        # Validações básicas
        required_fields = self.get_required_fields()
        for field in required_fields:
            if field not in data or data[field] is None:
                logger.warning(f"Campo obrigatório ausente: {field}")
                return False

        return True

    @abstractmethod
    def get_required_fields(self) -> List[str]:
        """
        Retorna lista de campos obrigatórios para validação

        Returns:
            Lista de campos obrigatórios
        """
        pass

    def cleanup(self):
        """
        Limpa recursos utilizados (fecha driver, etc)
        """
        if self.driver:
            try:
                self.driver.quit()
            except Exception as e:
                logger.error(f"Erro ao fechar driver: {str(e)}")

        if self.session:
            self.session.close()

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.cleanup()

    async def collect_with_metadata(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados com metadados adicionais

        Args:
            ticker: Código do ativo
            **kwargs: Parâmetros adicionais

        Returns:
            Dados com metadados
        """
        start_time = time.time()

        try:
            data = await self.collect_data(ticker, **kwargs)
            is_valid = await self.validate_data(data)

            return {
                "data": data,
                "metadata": {
                    "source": self.source_name,
                    "collected_at": datetime.utcnow().isoformat(),
                    "collection_time": time.time() - start_time,
                    "is_valid": is_valid,
                    "ticker": ticker
                }
            }
        except Exception as e:
            logger.error(f"Erro ao coletar dados de {ticker} ({self.source_name}): {str(e)}")
            return {
                "data": None,
                "metadata": {
                    "source": self.source_name,
                    "collected_at": datetime.utcnow().isoformat(),
                    "collection_time": time.time() - start_time,
                    "is_valid": False,
                    "ticker": ticker,
                    "error": str(e)
                }
            }
