"""
OAuth Session Manager
Gerencia sessões de navegador para coleta de cookies OAuth

Migrado de Selenium para Playwright em 2025-12-03
"""

import pickle
import time
import asyncio
import subprocess
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime
from dataclasses import dataclass, field
from enum import Enum

from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Playwright
from playwright.async_api import TimeoutError as PlaywrightTimeoutError
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
    attempts: int = 0  # Contador de tentativas (máximo 3)


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
                    "attempts": sp.attempts,
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
    """Gerenciador de sessões OAuth - Playwright Edition"""

    COOKIES_FILE = Path("/app/browser-profiles/google_cookies.pkl")
    DISPLAY = ":99"  # Display virtual Xvfb

    def __init__(self):
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        self.current_session: Optional[OAuthSession] = None
        self.collected_cookies: Dict[str, List[Dict]] = {}

    def is_browser_alive(self) -> bool:
        """
        Verificar se o browser ainda está vivo e respondendo.

        Returns:
            True se browser está funcionando, False se crashou
        """
        if not self.browser or not self.page:
            logger.debug("[HEALTH] Browser ou page não existe")
            return False

        try:
            # Verificar se browser está conectado
            if not self.browser.is_connected():
                logger.error("[HEALTH] ❌ Browser desconectado")
                return False

            # Verificar se page ainda está acessível
            _ = self.page.url
            return True
        except Exception as e:
            logger.error(f"[HEALTH] ❌ Browser NÃO está respondendo: {e}")
            logger.warning("[HEALTH] Browser provavelmente crashou")
            return False

    async def ensure_browser_alive(self) -> bool:
        """
        Garantir que browser está vivo, reiniciando se necessário.

        Returns:
            True se browser está funcionando (ou foi reiniciado), False se falhou
        """
        if self.is_browser_alive():
            return True

        logger.warning("[HEALTH] ⚠️ Browser morto detectado - tentando reiniciar...")

        # Limpar recursos antigos
        await self._cleanup_browser()

        # Tentar reiniciar
        success = await self.start_browser()
        if success:
            logger.success("[HEALTH] ✓ Browser reiniciado com sucesso")
        else:
            logger.error("[HEALTH] ❌ Falha ao reiniciar browser")

        return success

    async def _cleanup_browser(self):
        """Limpar recursos do browser de forma segura"""
        try:
            if self.page:
                await self.page.close()
        except:
            pass
        self.page = None

        try:
            if self.context:
                await self.context.close()
        except:
            pass
        self.context = None

        try:
            if self.browser:
                await self.browser.close()
        except:
            pass
        self.browser = None

        try:
            if self.playwright:
                await self.playwright.stop()
        except:
            pass
        self.playwright = None

    async def restart_browser_fresh(self) -> bool:
        """
        Reiniciar browser completamente - mata TODOS os processos e inicia novo.

        Usado entre sites para garantir ambiente 100% limpo.
        Os cookies coletados são preservados em self.collected_cookies (Python).

        Returns:
            True se reiniciou com sucesso, False caso contrário
        """
        logger.info("=" * 80)
        logger.info("[RESTART] 🔄 Reiniciando browser completamente (ambiente limpo)...")

        # 1. Fechar browser Playwright graciosamente
        await self._cleanup_browser()

        # 2. Matar TODOS os processos Chrome (força bruta)
        logger.debug("[RESTART] Matando processos Chrome...")
        try:
            subprocess.run(["pkill", "-9", "-f", "chromium"], capture_output=True, timeout=10)
            subprocess.run(["pkill", "-9", "-f", "chrome"], capture_output=True, timeout=10)
        except Exception as e:
            logger.warning(f"[RESTART] Erro ao matar processos: {e}")

        # 3. Aguardar processos terminarem
        await asyncio.sleep(2)

        # 4. Verificar se ainda há processos Chrome
        try:
            result = subprocess.run(["pgrep", "-f", "chrom"], capture_output=True, timeout=5)
            if result.returncode == 0:
                logger.warning("[RESTART] ⚠️ Ainda há processos Chrome - tentando novamente...")
                subprocess.run(["pkill", "-9", "-f", "chrom"], capture_output=True, timeout=10)
                await asyncio.sleep(1)
        except:
            pass

        # 5. Iniciar novo browser limpo
        logger.debug("[RESTART] Iniciando novo browser...")
        success = await self.start_browser()

        if success:
            logger.success("[RESTART] ✓ Browser reiniciado com ambiente limpo")
        else:
            logger.error("[RESTART] ❌ Falha ao reiniciar browser")

        logger.info("=" * 80)
        return success

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

    async def start_browser(self) -> bool:
        """Iniciar Chromium em modo visual (VNC) usando Playwright"""
        try:
            start_time = time.time()
            logger.info("=" * 80)
            logger.info(f"[START_BROWSER] Iniciando Chromium para sessão OAuth...")
            logger.debug(f"[START_BROWSER] Timestamp: {datetime.now().isoformat()}")
            logger.debug(f"[START_BROWSER] Display virtual: {self.DISPLAY}")

            # Configurar variável de ambiente DISPLAY
            os.environ['DISPLAY'] = self.DISPLAY

            # Iniciar Playwright
            self.playwright = await async_playwright().start()

            # Argumentos do Chromium para Docker + VNC
            browser_args = [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--window-size=1920,1080",
                "--start-maximized",
                "--disable-blink-features=AutomationControlled",
                # Otimizações de performance
                "--disable-extensions",
                "--disable-plugins",
                "--disable-software-rasterizer",
                "--disable-smooth-scrolling",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--disable-hang-monitor",
                "--disable-prompt-on-repost",
                "--disable-domain-reliability",
            ]

            # Iniciar browser (NÃO headless - queremos ver via VNC)
            logger.debug(f"[START_BROWSER] Iniciando Chromium com args: {len(browser_args)} argumentos")
            self.browser = await self.playwright.chromium.launch(
                headless=False,
                args=browser_args,
            )

            # Criar contexto com user agent realista
            self.context = await self.browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1920, "height": 1080},
                ignore_https_errors=True,
            )

            # Criar página
            self.page = await self.context.new_page()

            # Configurar timeout padrão (120s para sites lentos)
            self.page.set_default_timeout(120000)
            self.page.set_default_navigation_timeout(120000)

            # Ativar janela no VNC usando xdotool
            try:
                subprocess.run(
                    ["xdotool", "search", "--name", "Chromium", "windowactivate", "--sync", "windowraise", "windowmove", "0", "0"],
                    capture_output=True, timeout=5, env={"DISPLAY": self.DISPLAY}
                )
                logger.debug(f"[START_BROWSER] Janela Chromium ativada via xdotool")
            except Exception as xdot_err:
                logger.warning(f"[START_BROWSER] Não foi possível ativar janela via xdotool: {xdot_err}")

            elapsed = time.time() - start_time
            logger.success(f"[START_BROWSER] Chromium iniciado com sucesso em {elapsed:.2f}s")
            logger.info("=" * 80)
            return True

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[START_BROWSER] Erro ao iniciar Chromium após {elapsed:.2f}s: {e}")
            logger.exception(e)
            if self.current_session:
                self.current_session.status = SessionStatus.ERROR
                self.current_session.error_message = f"Falha ao iniciar Chromium: {str(e)}"
            return False

    async def navigate_to_site(self, site_id: str) -> bool:
        """
        Navegar para um site específico

        Args:
            site_id: ID do site na configuração

        Returns:
            True se navegação foi bem-sucedida
        """
        if not self.current_session:
            logger.error("[NAVIGATE] Sessão não iniciada")
            return False

        # REINÍCIO COMPLETO: Mata todos os processos e inicia novo para ambiente 100% limpo
        if not await self.restart_browser_fresh():
            logger.error("[NAVIGATE] ❌ Falha ao reiniciar browser - tentando ensure_browser_alive...")
            if not await self.ensure_browser_alive():
                logger.error("[NAVIGATE] ❌ Browser não está disponível e não foi possível reiniciar")
                return False

        navigation_start = time.time()
        site_config = None
        site_progress = None

        try:
            site_config = get_site_by_id(site_id)
            site_progress = next(sp for sp in self.current_session.sites_progress if sp.site_id == site_id)

            # FIX: Atualizar current_site_index para o site navegado manualmente
            site_index = next(i for i, sp in enumerate(self.current_session.sites_progress) if sp.site_id == site_id)
            self.current_session.current_site_index = site_index
            logger.debug(f"[NAVIGATE] current_site_index atualizado para {site_index} ({site_id})")

            logger.info("=" * 80)
            logger.info(f"[NAVIGATE] Site #{self.current_session.current_site_index + 1}/{len(self.current_session.sites_progress)}: {site_config['name']}")
            logger.debug(f"[NAVIGATE] URL destino: {site_config['url']}")

            # Atualizar status e incrementar tentativas
            site_progress.status = SiteStatus.IN_PROGRESS
            site_progress.started_at = datetime.now()
            site_progress.attempts += 1
            self.current_session.status = SessionStatus.NAVIGATING

            logger.debug(f"[NAVIGATE] Tentativa #{site_progress.attempts} para {site_config['name']}")

            # Navegar usando Playwright
            logger.info(f"[NAVIGATE] Iniciando navegação para {site_config['name']}...")
            nav_start = time.time()

            try:
                # wait_until='load' é mais rápido que 'networkidle'
                await self.page.goto(site_config["url"], wait_until="load")
                nav_elapsed = time.time() - nav_start
                logger.info(f"[NAVIGATE] Página carregada em {nav_elapsed:.2f}s")

                if nav_elapsed > 60:
                    logger.warning(f"[NAVIGATE] ⚠️ Navegação MUITO LENTA: {nav_elapsed:.2f}s (> 60s)")
                elif nav_elapsed > 30:
                    logger.warning(f"[NAVIGATE] ⚠️ Navegação LENTA: {nav_elapsed:.2f}s (> 30s)")

            except PlaywrightTimeoutError as nav_error:
                nav_elapsed = time.time() - nav_start
                logger.warning(f"[NAVIGATE] ⚠️ Timeout durante carregamento após {nav_elapsed:.2f}s: {nav_error}")
                logger.warning(f"[NAVIGATE] ⚠️ Continuando mesmo assim - site pode ter carregado parcialmente")

            except Exception as nav_error:
                nav_elapsed = time.time() - nav_start
                logger.warning(f"[NAVIGATE] ⚠️ Erro durante carregamento após {nav_elapsed:.2f}s: {nav_error}")

            # Aguardar carregamento adicional
            logger.debug(f"[NAVIGATE] Aguardando 3s para carregamento completo...")
            await asyncio.sleep(3)

            # Ativar janela do Chromium no VNC
            try:
                subprocess.run(
                    ["xdotool", "search", "--name", "Chromium", "windowactivate", "--sync", "windowraise", "windowmove", "0", "0"],
                    capture_output=True, timeout=5, env={"DISPLAY": self.DISPLAY}
                )
                logger.debug(f"[NAVIGATE] Janela Chromium ativada via xdotool")
            except Exception as xdot_err:
                logger.warning(f"[NAVIGATE] Não foi possível ativar janela via xdotool: {xdot_err}")

            # Tentar clicar no botão OAuth automaticamente se configurado
            if site_config.get("auto_click_oauth") and site_config.get("oauth_button"):
                try:
                    logger.info(f"[NAVIGATE] Tentando clicar automaticamente no botão OAuth...")
                    logger.debug(f"[NAVIGATE] XPath do botão: {site_config['oauth_button']}")

                    # Salvar número de páginas antes do clique
                    pages_before = len(self.context.pages)
                    logger.debug(f"[NAVIGATE] Páginas antes do clique: {pages_before}")

                    # Clicar no botão OAuth usando XPath
                    oauth_button = self.page.locator(f"xpath={site_config['oauth_button']}")
                    await oauth_button.wait_for(state="visible", timeout=10000)
                    await oauth_button.click()
                    logger.success(f"[NAVIGATE] Botão OAuth clicado automaticamente")

                    # Aguardar possível popup/nova janela abrir
                    logger.debug(f"[NAVIGATE] Aguardando popup OAuth abrir...")
                    await asyncio.sleep(3)

                    # Verificar se nova página foi aberta
                    pages_after = len(self.context.pages)
                    logger.debug(f"[NAVIGATE] Páginas após o clique: {pages_after}")

                    if pages_after == pages_before:
                        logger.debug(f"[NAVIGATE] Popup ainda não detectado, aguardando mais 2s...")
                        await asyncio.sleep(2)
                        pages_after = len(self.context.pages)

                    if pages_after > pages_before:
                        # Nova página detectada - popup OAuth
                        logger.info(f"[NAVIGATE] ✅ Nova página detectada (popup OAuth) - mudando foco...")

                        # Encontrar a nova página (popup OAuth)
                        for page in self.context.pages:
                            if page != self.page:
                                self.page = page
                                await self.page.bring_to_front()
                                logger.success(f"[NAVIGATE] ✓ Mudado para página popup OAuth")
                                logger.info(f"[NAVIGATE] URL da popup: {self.page.url}")
                                await asyncio.sleep(1)
                                break
                    else:
                        logger.debug(f"[NAVIGATE] Nenhuma nova página detectada - OAuth na mesma aba")

                except PlaywrightTimeoutError:
                    logger.warning(f"[NAVIGATE] Botão OAuth não encontrado em 10s - usuário pode clicar manualmente")
                except Exception as e:
                    logger.warning(f"[NAVIGATE] Não foi possível clicar automaticamente: {e}")

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
            logger.exception(e)

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
        if not self.current_session:
            logger.error("[COLLECT] Sessão não disponível")
            return 0

        # HEALTH CHECK: Verificar se browser está vivo antes de coletar
        if not self.is_browser_alive():
            logger.error("[COLLECT] ❌ Browser não está respondendo - não é possível coletar cookies")
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
                current_url = self.page.url
                logger.debug(f"[COLLECT] URL atual: {current_url}")
            except Exception as e:
                logger.warning(f"[COLLECT] Não foi possível obter URL: {e}")

            # Coletar todos os cookies usando Playwright
            logger.debug(f"[COLLECT] Executando context.cookies()...")
            cookies = await self.context.cookies()
            logger.debug(f"[COLLECT] {len(cookies)} cookies obtidos do navegador")

            # Coletar localStorage (importante para sites como DeepSeek que usam tokens no localStorage)
            try:
                local_storage_data = await self.page.evaluate('() => JSON.stringify(localStorage)')
                import json as json_module
                local_storage = json_module.loads(local_storage_data)
                logger.debug(f"[COLLECT] {len(local_storage)} itens obtidos do localStorage")

                # Log auth-related keys
                auth_keys = [k for k in local_storage.keys() if 'token' in k.lower() or 'auth' in k.lower() or 'user' in k.lower()]
                if auth_keys:
                    logger.info(f"[COLLECT] Chaves de autenticação encontradas no localStorage: {auth_keys}")
            except Exception as ls_error:
                logger.warning(f"[COLLECT] Não foi possível coletar localStorage: {ls_error}")
                local_storage = {}

            # Armazenar cookies e localStorage do site
            site_name = site_config["name"]
            self.collected_cookies[site_name] = {
                'cookies': cookies,
                'localStorage': local_storage
            }

            # Atualizar progresso
            current_site_progress.cookies_count = len(cookies)
            current_site_progress.status = SiteStatus.COMPLETED
            current_site_progress.completed_at = datetime.now()
            current_site_progress.user_action_required = False

            elapsed = time.time() - collect_start
            logger.success(f"[COLLECT] ✓ {len(cookies)} cookies coletados de {site_name} em {elapsed:.2f}s")
            logger.info("=" * 80)

            # ✅ SALVAMENTO AUTOMÁTICO: Salvar cookies imediatamente
            logger.info(f"[COLLECT] Salvando cookies automaticamente...")
            save_success = await self.save_cookies_to_file(finalize_session=False)
            if save_success:
                logger.debug(f"[COLLECT] Cookies de {site_name} salvos no arquivo")
            else:
                logger.warning(f"[COLLECT] ⚠️ Falha ao salvar cookies de {site_name} (continuando...)")

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

        current_site_progress.status = SiteStatus.SKIPPED
        current_site_progress.error_message = reason
        current_site_progress.completed_at = datetime.now()

        logger.info("=" * 80)

    def find_next_pending_site(self) -> Optional[int]:
        """
        Encontrar o próximo site pendente, aguardando usuário ou com falha (máximo 3 tentativas)

        Returns:
            Índice do próximo site pendente ou None se todos foram processados
        """
        if not self.current_session:
            return None

        for i, site_progress in enumerate(self.current_session.sites_progress):
            if site_progress.status == SiteStatus.PENDING:
                logger.debug(f"[FIND_PENDING] Site pendente encontrado: {site_progress.site_name} (índice {i})")
                return i

            if site_progress.status == SiteStatus.WAITING_USER:
                logger.debug(f"[FIND_PENDING] Site aguardando usuário encontrado: {site_progress.site_name} (índice {i})")
                return i

            if site_progress.status == SiteStatus.FAILED and site_progress.attempts < 3:
                logger.debug(f"[FIND_PENDING] Site com falha encontrado: {site_progress.site_name} (índice {i}, tentativa {site_progress.attempts}/3)")
                return i

        logger.debug("[FIND_PENDING] Nenhum site pendente encontrado")
        return None

    async def move_to_next_site(self) -> bool:
        """
        Mover para o próximo site PENDENTE (não apenas sequencial)

        Returns:
            True se há mais sites, False se terminou
        """
        if not self.current_session:
            logger.warning("[NEXT_SITE] Nenhuma sessão ativa")
            return False

        logger.info("=" * 80)
        logger.info(f"[NEXT_SITE] Buscando próximo site pendente...")
        logger.debug(f"[NEXT_SITE] Índice atual: {self.current_session.current_site_index}")

        next_index = self.find_next_pending_site()

        if next_index is None:
            logger.info(f"[NEXT_SITE] 🎉 Todos os sites foram processados!")
            logger.info(f"[NEXT_SITE] Total: {len(self.current_session.sites_progress)} sites")

            completed = sum(1 for sp in self.current_session.sites_progress if sp.status == SiteStatus.COMPLETED)
            skipped = sum(1 for sp in self.current_session.sites_progress if sp.status == SiteStatus.SKIPPED)
            failed = sum(1 for sp in self.current_session.sites_progress if sp.status == SiteStatus.FAILED)
            logger.info(f"[NEXT_SITE] ✓ Concluídos: {completed}, ⊘ Pulados: {skipped}, ✗ Falhados: {failed}")
            logger.info("=" * 80)
            return False

        self.current_session.current_site_index = next_index
        next_site = self.current_session.sites_progress[next_index]

        logger.info(f"[NEXT_SITE] Próximo site: {next_site.site_name} (índice {next_index})")

        if next_site.status == SiteStatus.FAILED:
            logger.info(f"[NEXT_SITE] ⚠️ Tentativa {next_site.attempts + 1}/3 (site com falha anterior)")

        logger.info("=" * 80)

        await self.navigate_to_site(next_site.site_id)

        return True

    async def save_cookies_to_file(self, finalize_session: bool = True) -> bool:
        """
        Salvar cookies coletados em arquivo pickle E JSON individual por site

        Args:
            finalize_session: Se True, marca sessão como COMPLETED. Se False, apenas salva cookies incrementalmente.

        Returns:
            True se salvou com sucesso, False caso contrário
        """
        import json

        save_start = time.time()

        try:
            logger.info("=" * 80)
            logger.info(f"[SAVE] Salvando cookies em arquivo... (finalize={finalize_session})")

            if not self.current_session:
                logger.error("[SAVE] Nenhuma sessão ativa")
                return False

            previous_status = self.current_session.status
            self.current_session.status = SessionStatus.SAVING

            # Criar diretório se não existir
            logger.debug(f"[SAVE] Criando diretório: {self.COOKIES_FILE.parent}")
            self.COOKIES_FILE.parent.mkdir(parents=True, exist_ok=True)

            # Salvar cookies em pickle (formato legado)
            logger.debug(f"[SAVE] Gravando arquivo pickle: {self.COOKIES_FILE}")
            with open(self.COOKIES_FILE, 'wb') as f:
                pickle.dump(self.collected_cookies, f)

            # Salvar cookies em JSON individual por site (formato usado pelos scrapers)
            json_cookies_dir = Path("/app/data/cookies")
            json_cookies_dir.mkdir(parents=True, exist_ok=True)

            # Mapeamento de nomes de sites para arquivos JSON
            site_to_file = {
                "DeepSeek": "deepseek_session.json",
                "Claude": "claude_session.json",
                "ChatGPT": "chatgpt_session.json",
                "Gemini": "gemini_session.json",
                "Grok": "grok_session.json",
                "Yahoo Finance": "yahoo_finance_session.json",
                "Perplexity": "perplexity_session.json",
            }

            total_cookies = 0
            for site_name, site_data in self.collected_cookies.items():
                # Handle both old format (list of cookies) and new format (dict with cookies + localStorage)
                if isinstance(site_data, dict) and 'cookies' in site_data:
                    cookies = site_data['cookies']
                    local_storage = site_data.get('localStorage', {})
                else:
                    # Old format - just cookies list
                    cookies = site_data
                    local_storage = {}

                total_cookies += len(cookies)

                if site_name in site_to_file:
                    json_file = json_cookies_dir / site_to_file[site_name]
                    # Save both cookies and localStorage
                    save_data = {
                        'cookies': cookies,
                        'localStorage': local_storage
                    }
                    with open(json_file, 'w') as f:
                        json.dump(save_data, f, indent=2)
                    logger.info(f"[SAVE] ✓ {site_name}: {len(cookies)} cookies + {len(local_storage)} localStorage items salvos em: {json_file}")

            # Atualizar estatísticas
            self.current_session.total_cookies = total_cookies

            if finalize_session:
                self.current_session.status = SessionStatus.COMPLETED
                self.current_session.completed_at = datetime.now()
            else:
                self.current_session.status = previous_status

            elapsed = time.time() - save_start
            logger.success(f"[SAVE] ✓ Cookies salvos com sucesso em {elapsed:.2f}s!")
            logger.success(f"[SAVE]   Arquivo pickle: {self.COOKIES_FILE}")
            logger.success(f"[SAVE]   Arquivos JSON: {json_cookies_dir}")
            logger.success(f"[SAVE]   Total de sites: {len(self.collected_cookies)}")
            logger.success(f"[SAVE]   Total de cookies: {total_cookies}")

            if finalize_session:
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

    async def cleanup(self):
        """Limpar recursos (fechar browser)"""
        logger.info("=" * 80)
        logger.info("[CLEANUP] Fechando navegador...")

        try:
            await self._cleanup_browser()

            # Forçar limpeza de processos Chrome zombie
            try:
                if os.name != 'nt':  # Linux/Docker
                    result = subprocess.run(
                        ['pkill', '-9', '-f', 'chrom'],
                        capture_output=True,
                        timeout=5
                    )
                    if result.returncode == 0:
                        logger.debug("[CLEANUP] Processos Chrome órfãos terminados")
            except Exception as kill_error:
                logger.debug(f"[CLEANUP] pkill não executado: {kill_error}")

            logger.success("[CLEANUP] Navegador fechado com sucesso")

        except Exception as e:
            logger.error(f"[CLEANUP] ❌ Erro ao fechar navegador: {e}")
            logger.exception(e)

        logger.info("=" * 80)

    async def cancel_session(self):
        """Cancelar sessão atual"""
        logger.info("=" * 80)
        logger.warning("[CANCEL] Sessão cancelada pelo usuário")

        if self.current_session:
            self.current_session.status = SessionStatus.CANCELLED
            self.current_session.completed_at = datetime.now()
            logger.info(f"[CANCEL] Session ID: {self.current_session.session_id}")

        await self.cleanup()
        logger.info("=" * 80)

    def get_session_status(self) -> Optional[Dict[str, Any]]:
        """Obter status da sessão atual"""
        if not self.current_session:
            return None

        status = self.current_session.to_dict()
        status["chrome_alive"] = self.is_browser_alive()

        return status


# Instância global (singleton)
_session_manager: Optional[OAuthSessionManager] = None


def get_session_manager() -> OAuthSessionManager:
    """Obter instância global do session manager"""
    global _session_manager
    if _session_manager is None:
        _session_manager = OAuthSessionManager()
    return _session_manager
