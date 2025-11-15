"""
OAuth Session Manager
Gerencia sessões de navegador para coleta de cookies OAuth
"""

import pickle
import time
import asyncio
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from loguru import logger

from oauth_sites_config import (
    OAUTH_SITES_CONFIG,
    get_site_by_id,
    get_sites_in_order,
    OAUTH_CONFIG_METADATA
)


class SessionStatus(str, Enum):
    """Status da sessão OAuth"""
    IDLE = "idle"
    STARTING = "starting"
    READY = "ready"
    NAVIGATING = "navigating"
    WAITING_USER = "waiting_user"
    COLLECTING = "collecting"
    SAVING = "saving"
    COMPLETED = "completed"
    ERROR = "error"
    CANCELLED = "cancelled"


class SiteStatus(str, Enum):
    """Status de cada site na sessão"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    WAITING_USER = "waiting_user"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    FAILED = "failed"


@dataclass
class SiteProgress:
    """Progresso de um site específico"""
    site_id: str
    site_name: str
    status: SiteStatus = SiteStatus.PENDING
    cookies_count: int = 0
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    user_action_required: bool = False


@dataclass
class OAuthSession:
    """Sessão OAuth ativa"""
    session_id: str
    status: SessionStatus = SessionStatus.IDLE
    current_site_index: int = 0
    sites_progress: List[SiteProgress] = field(default_factory=list)
    total_cookies: int = 0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    vnc_url: str = "http://localhost:6080/vnc.html"

    def to_dict(self) -> Dict[str, Any]:
        """Converter para dicionário serializável"""
        return {
            "session_id": self.session_id,
            "status": self.status.value,
            "current_site_index": self.current_site_index,
            "current_site": self.sites_progress[self.current_site_index].site_name if self.current_site_index < len(self.sites_progress) else None,
            "sites_progress": [
                {
                    "site_id": sp.site_id,
                    "site_name": sp.site_name,
                    "status": sp.status.value,
                    "cookies_count": sp.cookies_count,
                    "error_message": sp.error_message,
                    "user_action_required": sp.user_action_required,
                }
                for sp in self.sites_progress
            ],
            "progress_percentage": int((sum(1 for sp in self.sites_progress if sp.status in [SiteStatus.COMPLETED, SiteStatus.SKIPPED]) / len(self.sites_progress)) * 100) if self.sites_progress else 0,
            "total_sites": len(self.sites_progress),
            "completed_sites": sum(1 for sp in self.sites_progress if sp.status == SiteStatus.COMPLETED),
            "failed_sites": sum(1 for sp in self.sites_progress if sp.status == SiteStatus.FAILED),
            "skipped_sites": sum(1 for sp in self.sites_progress if sp.status == SiteStatus.SKIPPED),
            "total_cookies": self.total_cookies,
            "vnc_url": self.vnc_url,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error_message": self.error_message,
        }


class OAuthSessionManager:
    """Gerenciador de sessões OAuth"""

    COOKIES_FILE = Path("/app/browser-profiles/google_cookies.pkl")
    DISPLAY = ":99"  # Display virtual Xvfb

    def __init__(self):
        self.driver: Optional[webdriver.Chrome] = None
        self.current_session: Optional[OAuthSession] = None
        self.collected_cookies: Dict[str, List[Dict]] = {}

    def create_session(self, session_id: str) -> OAuthSession:
        """Criar nova sessão OAuth"""
        logger.info(f"Criando nova sessão OAuth: {session_id}")

        # Inicializar progresso para cada site
        sites_progress = [
            SiteProgress(
                site_id=site["id"],
                site_name=site["name"],
                status=SiteStatus.PENDING
            )
            for site in get_sites_in_order()
        ]

        session = OAuthSession(
            session_id=session_id,
            status=SessionStatus.IDLE,
            sites_progress=sites_progress,
            started_at=datetime.now()
        )

        self.current_session = session
        return session

    def start_chrome(self) -> bool:
        """Iniciar Chrome em modo visual (VNC)"""
        try:
            start_time = time.time()
            logger.info("=" * 80)
            logger.info(f"[START_CHROME] Iniciando Chrome para sessão OAuth...")
            logger.debug(f"[START_CHROME] Timestamp: {datetime.now().isoformat()}")
            logger.debug(f"[START_CHROME] Display virtual: {self.DISPLAY}")

            # Configurar variável de ambiente DISPLAY
            import os
            os.environ['DISPLAY'] = self.DISPLAY

            chrome_options = Options()

            # NÃO usar headless - queremos visualizar via VNC
            # chrome_options.add_argument("--headless=new")

            # Essenciais para Docker
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            chrome_options.add_argument("--disable-gpu")

            # Display virtual (removido argumento duplicado - variável ambiente já definida acima)
            # chrome_options.add_argument(f"--display={self.DISPLAY}")

            # Tamanho da janela
            chrome_options.add_argument("--window-size=1920,1080")
            chrome_options.add_argument("--start-maximized")

            # Anti-detecção
            chrome_options.add_argument("--disable-blink-features=AutomationControlled")
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option("useAutomationExtension", False)

            # User agent realista
            chrome_options.add_argument(
                "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )

            # Preferências
            prefs = {
                "profile.default_content_setting_values.notifications": 2,  # Bloquear notificações
                "credentials_enable_service": False,  # Desabilitar prompt de salvar senha
                "profile.password_manager_enabled": False,
            }
            chrome_options.add_experimental_option("prefs", prefs)

            # Criar driver
            logger.debug(f"[START_CHROME] Criando WebDriver com chromedriver...")
            service = Service("/usr/local/bin/chromedriver")
            self.driver = webdriver.Chrome(service=service, options=chrome_options)

            # Configurar timeouts
            # IMPORTANTE: 120s para sites pesados (ADVFN, etc) que demoram > 60s
            self.driver.set_page_load_timeout(120)
            self.driver.implicitly_wait(5)
            logger.debug(f"[START_CHROME] Timeouts configurados: page_load=120s, implicit_wait=5s")

            elapsed = time.time() - start_time
            logger.success(f"[START_CHROME] Chrome iniciado com sucesso em {elapsed:.2f}s")
            logger.debug(f"[START_CHROME] Session ID: {self.driver.session_id}")
            logger.info("=" * 80)
            return True

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[START_CHROME] Erro ao iniciar Chrome após {elapsed:.2f}s: {e}")
            logger.exception(e)  # Stack trace completo
            if self.current_session:
                self.current_session.status = SessionStatus.ERROR
                self.current_session.error_message = f"Falha ao iniciar Chrome: {str(e)}"
            return False

    async def navigate_to_site(self, site_id: str) -> bool:
        """
        Navegar para um site específico

        Args:
            site_id: ID do site na configuração

        Returns:
            True se navegação foi bem-sucedida
        """
        if not self.driver or not self.current_session:
            logger.error("[NAVIGATE] Sessão não iniciada ou driver não disponível")
            return False

        navigation_start = time.time()
        site_config = None
        site_progress = None

        try:
            site_config = get_site_by_id(site_id)
            site_progress = next(sp for sp in self.current_session.sites_progress if sp.site_id == site_id)

            # FIX: Atualizar current_site_index para o site navegado manualmente
            # Encontrar índice do site na lista de progresso
            site_index = next(i for i, sp in enumerate(self.current_session.sites_progress) if sp.site_id == site_id)
            self.current_session.current_site_index = site_index
            logger.debug(f"[NAVIGATE] current_site_index atualizado para {site_index} ({site_id})")

            logger.info("=" * 80)
            logger.info(f"[NAVIGATE] Site #{self.current_session.current_site_index + 1}/{len(self.current_session.sites_progress)}: {site_config['name']}")
            logger.debug(f"[NAVIGATE] Timestamp início: {datetime.now().isoformat()}")
            logger.debug(f"[NAVIGATE] URL destino: {site_config['url']}")
            logger.debug(f"[NAVIGATE] Site ID: {site_id}")

            # Verificar estado do Chrome antes de navegar
            try:
                current_url = self.driver.current_url
                logger.debug(f"[NAVIGATE] URL atual do Chrome: {current_url}")
            except Exception as e:
                logger.warning(f"[NAVIGATE] Não foi possível obter URL atual: {e}")

            # Atualizar status
            site_progress.status = SiteStatus.IN_PROGRESS
            site_progress.started_at = datetime.now()
            self.current_session.status = SessionStatus.NAVIGATING

            # Navegar
            logger.info(f"[NAVIGATE] Iniciando navegação para {site_config['name']}...")
            nav_start = time.time()

            try:
                self.driver.get(site_config["url"])
                nav_elapsed = time.time() - nav_start
                logger.info(f"[NAVIGATE] Página carregada em {nav_elapsed:.2f}s")

                # Verificar se navegação demorou muito
                if nav_elapsed > 60:
                    logger.warning(f"[NAVIGATE] ⚠️ Navegação MUITO LENTA: {nav_elapsed:.2f}s (> 60s)")
                elif nav_elapsed > 30:
                    logger.warning(f"[NAVIGATE] ⚠️ Navegação LENTA: {nav_elapsed:.2f}s (> 30s)")

            except Exception as nav_error:
                nav_elapsed = time.time() - nav_start
                logger.warning(f"[NAVIGATE] ⚠️ Timeout/Erro durante carregamento após {nav_elapsed:.2f}s: {nav_error}")
                logger.warning(f"[NAVIGATE] ⚠️ Continuando mesmo assim - site pode ter carregado parcialmente")
                # NÃO lançar exceção - vamos tentar coletar cookies mesmo assim

            # Aguardar carregamento adicional
            logger.debug(f"[NAVIGATE] Aguardando 3s para carregamento completo...")
            await asyncio.sleep(3)

            # Tentar clicar no botão OAuth automaticamente se configurado
            if site_config.get("auto_click_oauth") and site_config.get("oauth_button"):
                try:
                    logger.info(f"[NAVIGATE] Tentando clicar automaticamente no botão OAuth...")
                    logger.debug(f"[NAVIGATE] XPath do botão: {site_config['oauth_button']}")
                    wait = WebDriverWait(self.driver, 10)
                    oauth_button = wait.until(
                        EC.element_to_be_clickable((By.XPATH, site_config["oauth_button"]))
                    )
                    oauth_button.click()
                    logger.success(f"[NAVIGATE] Botão OAuth clicado automaticamente")
                    await asyncio.sleep(2)
                except (TimeoutException, NoSuchElementException) as e:
                    logger.warning(f"[NAVIGATE] Não foi possível clicar automaticamente: {e}")
                    # Não é erro crítico, usuário pode clicar manualmente

            # Marcar como aguardando ação do usuário
            site_progress.status = SiteStatus.WAITING_USER
            site_progress.user_action_required = True
            self.current_session.status = SessionStatus.WAITING_USER

            total_elapsed = time.time() - navigation_start
            logger.success(f"[NAVIGATE] ✓ Navegação concluída em {total_elapsed:.2f}s. Aguardando ação do usuário...")
            logger.info("=" * 80)
            return True

        except Exception as e:
            total_elapsed = time.time() - navigation_start
            logger.error(f"[NAVIGATE] ❌ Erro ao navegar para {site_id} após {total_elapsed:.2f}s")
            logger.error(f"[NAVIGATE] Erro: {e}")
            logger.exception(e)  # Stack trace completo

            if site_progress:
                site_progress.status = SiteStatus.FAILED
                site_progress.error_message = str(e)

            logger.info("=" * 80)
            return False

    async def collect_cookies_from_current_site(self) -> int:
        """
        Coletar cookies do site atual

        Returns:
            Número de cookies coletados
        """
        if not self.driver or not self.current_session:
            logger.error("[COLLECT] Driver ou sessão não disponível")
            return 0

        collect_start = time.time()

        try:
            current_site_progress = self.current_session.sites_progress[self.current_session.current_site_index]
            site_config = get_site_by_id(current_site_progress.site_id)

            logger.info("=" * 80)
            logger.info(f"[COLLECT] Coletando cookies de {site_config['name']}...")
            logger.debug(f"[COLLECT] Timestamp: {datetime.now().isoformat()}")

            self.current_session.status = SessionStatus.COLLECTING

            # Verificar URL atual
            try:
                current_url = self.driver.current_url
                logger.debug(f"[COLLECT] URL atual: {current_url}")
            except Exception as e:
                logger.warning(f"[COLLECT] Não foi possível obter URL: {e}")

            # Coletar todos os cookies
            logger.debug(f"[COLLECT] Executando driver.get_cookies()...")
            cookies = self.driver.get_cookies()
            logger.debug(f"[COLLECT] {len(cookies)} cookies obtidos do navegador")

            # Armazenar cookies do site
            site_name = site_config["name"]
            self.collected_cookies[site_name] = cookies

            # Atualizar progresso
            current_site_progress.cookies_count = len(cookies)
            current_site_progress.status = SiteStatus.COMPLETED
            current_site_progress.completed_at = datetime.now()
            current_site_progress.user_action_required = False

            elapsed = time.time() - collect_start
            logger.success(f"[COLLECT] ✓ {len(cookies)} cookies coletados de {site_name} em {elapsed:.2f}s")
            logger.info("=" * 80)

            return len(cookies)

        except Exception as e:
            elapsed = time.time() - collect_start
            logger.error(f"[COLLECT] ❌ Erro ao coletar cookies após {elapsed:.2f}s: {e}")
            logger.exception(e)
            logger.info("=" * 80)
            return 0

    def skip_current_site(self, reason: str = "Usuário optou por pular"):
        """Pular site atual"""
        if not self.current_session:
            logger.warning("[SKIP] Nenhuma sessão ativa")
            return

        current_site_progress = self.current_session.sites_progress[self.current_session.current_site_index]

        logger.info("=" * 80)
        logger.info(f"[SKIP] Pulando site: {current_site_progress.site_name}")
        logger.info(f"[SKIP] Motivo: {reason}")
        logger.debug(f"[SKIP] Timestamp: {datetime.now().isoformat()}")

        current_site_progress.status = SiteStatus.SKIPPED
        current_site_progress.error_message = reason
        current_site_progress.completed_at = datetime.now()

        logger.info("=" * 80)

    async def move_to_next_site(self) -> bool:
        """
        Mover para o próximo site

        Returns:
            True se há mais sites, False se terminou
        """
        if not self.current_session:
            logger.warning("[NEXT_SITE] Nenhuma sessão ativa")
            return False

        logger.info("=" * 80)
        logger.info(f"[NEXT_SITE] Avançando para próximo site...")
        logger.debug(f"[NEXT_SITE] Índice atual: {self.current_session.current_site_index}")

        self.current_session.current_site_index += 1

        if self.current_session.current_site_index >= len(self.current_session.sites_progress):
            logger.info(f"[NEXT_SITE] 🎉 Todos os sites foram processados!")
            logger.info(f"[NEXT_SITE] Total: {len(self.current_session.sites_progress)} sites")
            logger.info("=" * 80)
            return False

        next_site = self.current_session.sites_progress[self.current_session.current_site_index]
        logger.info(f"[NEXT_SITE] Próximo site: {next_site.site_name} (índice {self.current_session.current_site_index})")
        logger.info("=" * 80)

        # Navegar automaticamente para o próximo
        await self.navigate_to_site(next_site.site_id)

        return True

    async def save_cookies_to_file(self) -> bool:
        """Salvar cookies coletados em arquivo pickle"""
        save_start = time.time()

        try:
            logger.info("=" * 80)
            logger.info("[SAVE] Salvando cookies em arquivo...")
            logger.debug(f"[SAVE] Timestamp: {datetime.now().isoformat()}")

            if not self.current_session:
                logger.error("[SAVE] Nenhuma sessão ativa")
                return False

            self.current_session.status = SessionStatus.SAVING

            # Criar diretório se não existir
            logger.debug(f"[SAVE] Criando diretório: {self.COOKIES_FILE.parent}")
            self.COOKIES_FILE.parent.mkdir(parents=True, exist_ok=True)

            # Salvar cookies
            logger.debug(f"[SAVE] Gravando arquivo: {self.COOKIES_FILE}")
            with open(self.COOKIES_FILE, 'wb') as f:
                pickle.dump(self.collected_cookies, f)

            # Atualizar estatísticas
            total_cookies = sum(len(cookies) for cookies in self.collected_cookies.values())
            self.current_session.total_cookies = total_cookies
            self.current_session.status = SessionStatus.COMPLETED
            self.current_session.completed_at = datetime.now()

            elapsed = time.time() - save_start
            logger.success(f"[SAVE] ✓ Cookies salvos com sucesso em {elapsed:.2f}s!")
            logger.success(f"[SAVE]   Arquivo: {self.COOKIES_FILE}")
            logger.success(f"[SAVE]   Total de sites: {len(self.collected_cookies)}")
            logger.success(f"[SAVE]   Total de cookies: {total_cookies}")

            # Resumo por site
            logger.info("[SAVE] Resumo por site:")
            for site_name, cookies in self.collected_cookies.items():
                logger.info(f"[SAVE]   {site_name}: {len(cookies)} cookies")

            logger.info("=" * 80)
            return True

        except Exception as e:
            elapsed = time.time() - save_start
            logger.error(f"[SAVE] ❌ Erro ao salvar cookies após {elapsed:.2f}s: {e}")
            logger.exception(e)
            if self.current_session:
                self.current_session.status = SessionStatus.ERROR
                self.current_session.error_message = f"Falha ao salvar cookies: {str(e)}"
            logger.info("=" * 80)
            return False

    def cleanup(self):
        """Limpar recursos (fechar Chrome)"""
        try:
            if self.driver:
                logger.info("=" * 80)
                logger.info("[CLEANUP] Fechando navegador...")
                logger.debug(f"[CLEANUP] Timestamp: {datetime.now().isoformat()}")

                self.driver.quit()
                self.driver = None

                logger.success("[CLEANUP] Navegador fechado com sucesso")
                logger.info("=" * 80)
        except Exception as e:
            logger.error(f"[CLEANUP] ❌ Erro ao fechar navegador: {e}")
            logger.exception(e)
            logger.info("=" * 80)

    def cancel_session(self):
        """Cancelar sessão atual"""
        logger.info("=" * 80)
        logger.warning("[CANCEL] Sessão cancelada pelo usuário")
        logger.debug(f"[CANCEL] Timestamp: {datetime.now().isoformat()}")

        if self.current_session:
            self.current_session.status = SessionStatus.CANCELLED
            self.current_session.completed_at = datetime.now()
            logger.info(f"[CANCEL] Session ID: {self.current_session.session_id}")

        self.cleanup()
        logger.info("=" * 80)

    def get_session_status(self) -> Optional[Dict[str, Any]]:
        """Obter status da sessão atual"""
        if not self.current_session:
            return None
        return self.current_session.to_dict()


# Instância global (singleton)
_session_manager: Optional[OAuthSessionManager] = None


def get_session_manager() -> OAuthSessionManager:
    """Obter instância global do session manager"""
    global _session_manager
    if _session_manager is None:
        _session_manager = OAuthSessionManager()
    return _session_manager
