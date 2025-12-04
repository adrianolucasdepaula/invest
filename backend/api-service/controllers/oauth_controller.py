"""
OAuth Controller
Lógica de controle para gerenciamento de sessões OAuth
"""

import uuid
from typing import Dict, Any, Optional
from datetime import datetime

from loguru import logger

# Import do session manager (volume montado em /app/python-scrapers)
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "python-scrapers"))

from oauth_session_manager import get_session_manager, SessionStatus, SiteStatus
from oauth_sites_config import get_site_by_id, get_sites_in_order, OAUTH_CONFIG_METADATA


class OAuthController:
    """Controller para operações OAuth"""

    @staticmethod
    async def start_oauth_session() -> Dict[str, Any]:
        """
        Iniciar nova sessão OAuth

        Returns:
            Informações da sessão criada
        """
        try:
            logger.info("Iniciando nova sessão OAuth...")

            # Obter session manager
            manager = get_session_manager()

            # Verificar se já existe sessão ativa
            if manager.current_session and manager.current_session.status not in [
                SessionStatus.COMPLETED,
                SessionStatus.ERROR,
                SessionStatus.CANCELLED
            ]:
                return {
                    "success": False,
                    "error": "Já existe uma sessão OAuth ativa",
                    "session": manager.current_session.to_dict()
                }

            # Criar nova sessão
            session_id = str(uuid.uuid4())
            session = manager.create_session(session_id)

            # Iniciar Chrome (usando versão async)
            session.status = SessionStatus.STARTING
            chrome_started = await manager.start_browser()

            if not chrome_started:
                return {
                    "success": False,
                    "error": "Falha ao iniciar navegador Chrome",
                    "session": session.to_dict()
                }

            # Navegar para o primeiro site (Google)
            session.status = SessionStatus.READY
            first_site = get_sites_in_order()[0]
            await manager.navigate_to_site(first_site["id"])

            logger.success(f"Sessão OAuth {session_id} iniciada com sucesso")

            return {
                "success": True,
                "session": session.to_dict(),
                "message": "Sessão iniciada. Navegador aberto via VNC.",
                "next_action": "Faça login no Google através do visualizador VNC"
            }

        except Exception as e:
            logger.error(f"Erro ao iniciar sessão OAuth: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def get_session_status() -> Dict[str, Any]:
        """
        Obter status da sessão atual

        Returns:
            Status da sessão ou None se não houver sessão ativa
        """
        try:
            manager = get_session_manager()

            if not manager.current_session:
                return {
                    "success": True,
                    "session": None,
                    "message": "Nenhuma sessão OAuth ativa"
                }

            # Usar get_session_status() que inclui chrome_alive
            return {
                "success": True,
                "session": manager.get_session_status()
            }

        except Exception as e:
            logger.error(f"Erro ao obter status da sessão: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def navigate_to_site(site_id: str) -> Dict[str, Any]:
        """
        Navegar para site específico

        Args:
            site_id: ID do site na configuração

        Returns:
            Resultado da navegação
        """
        try:
            manager = get_session_manager()

            if not manager.current_session:
                return {
                    "success": False,
                    "error": "Nenhuma sessão OAuth ativa"
                }

            site_config = get_site_by_id(site_id)

            logger.info(f"Navegando para {site_config['name']}...")

            success = await manager.navigate_to_site(site_id)

            if success:
                return {
                    "success": True,
                    "message": f"Navegado para {site_config['name']}",
                    "site": site_config,
                    "instructions": site_config["instructions"]
                }
            else:
                return {
                    "success": False,
                    "error": f"Falha ao navegar para {site_config['name']}"
                }

        except ValueError as e:
            return {
                "success": False,
                "error": f"Site não encontrado: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Erro ao navegar para site: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def confirm_site_login() -> Dict[str, Any]:
        """
        Confirmar que usuário fez login no site atual e coletar cookies

        Returns:
            Resultado da coleta de cookies
        """
        try:
            manager = get_session_manager()

            if not manager.current_session:
                return {
                    "success": False,
                    "error": "Nenhuma sessão OAuth ativa"
                }

            # Coletar cookies do site atual
            cookies_count = await manager.collect_cookies_from_current_site()

            # Verificar se há próximo site
            has_next = manager.current_session.current_site_index < len(manager.current_session.sites_progress) - 1

            result = {
                "success": True,
                "cookies_collected": cookies_count,
                "has_next_site": has_next
            }

            if has_next:
                # Mover para próximo site automaticamente
                await manager.move_to_next_site()
                next_site = manager.current_session.sites_progress[manager.current_session.current_site_index]
                result["next_site"] = {
                    "id": next_site.site_id,
                    "name": next_site.site_name
                }
                result["message"] = f"Cookies coletados. Movendo para {next_site.site_name}..."
            else:
                result["message"] = "Último site concluído. Pronto para salvar cookies."

            return result

        except Exception as e:
            logger.error(f"Erro ao confirmar login: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def skip_current_site(reason: str = "Usuário optou por pular") -> Dict[str, Any]:
        """
        Pular site atual

        Args:
            reason: Motivo para pular

        Returns:
            Resultado da operação
        """
        try:
            manager = get_session_manager()

            if not manager.current_session:
                return {
                    "success": False,
                    "error": "Nenhuma sessão OAuth ativa"
                }

            current_site = manager.current_session.sites_progress[manager.current_session.current_site_index]

            manager.skip_current_site(reason)

            # Verificar se há próximo site
            has_next = manager.current_session.current_site_index < len(manager.current_session.sites_progress) - 1

            result = {
                "success": True,
                "skipped_site": current_site.site_name,
                "reason": reason,
                "has_next_site": has_next
            }

            if has_next:
                await manager.move_to_next_site()
                next_site = manager.current_session.sites_progress[manager.current_session.current_site_index]
                result["next_site"] = {
                    "id": next_site.site_id,
                    "name": next_site.site_name
                }
            else:
                result["message"] = "Último site pulado. Pronto para salvar cookies."

            return result

        except Exception as e:
            logger.error(f"Erro ao pular site: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def go_back() -> Dict[str, Any]:
        """
        Voltar para o site anterior

        Returns:
            Resultado da operação
        """
        try:
            manager = get_session_manager()

            if not manager.current_session:
                return {
                    "success": False,
                    "error": "Nenhuma sessão OAuth ativa"
                }

            # Verificar se não está no primeiro site
            if manager.current_session.current_site_index == 0:
                return {
                    "success": False,
                    "error": "Já está no primeiro site"
                }

            # Decrementar índice
            manager.current_session.current_site_index -= 1

            # Obter site anterior
            previous_site = manager.current_session.sites_progress[manager.current_session.current_site_index]

            # Marcar site como "in_progress" novamente
            previous_site.status = SiteStatus.IN_PROGRESS
            previous_site.user_action_required = False

            logger.info(f"Voltando para site anterior: {previous_site.site_name}")

            # Navegar para site anterior
            await manager.navigate_to_site(previous_site.site_id)

            return {
                "success": True,
                "message": f"Voltou para {previous_site.site_name}",
                "previous_site": previous_site.site_name,
                "current_index": manager.current_session.current_site_index
            }

        except Exception as e:
            logger.error(f"Erro ao voltar para site anterior: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def save_cookies() -> Dict[str, Any]:
        """
        Salvar cookies coletados e finalizar sessão

        Returns:
            Resultado da operação de salvamento
        """
        try:
            manager = get_session_manager()

            if not manager.current_session:
                return {
                    "success": False,
                    "error": "Nenhuma sessão OAuth ativa"
                }

            logger.info("Salvando cookies e finalizando sessão...")

            # Salvar cookies
            success = await manager.save_cookies_to_file()

            if success:
                # Obter estatísticas finais
                session_data = manager.current_session.to_dict()

                # Limpar recursos
                await manager.cleanup()

                return {
                    "success": True,
                    "message": "Cookies salvos com sucesso!",
                    "session_summary": {
                        "total_sites": session_data["total_sites"],
                        "completed_sites": session_data["completed_sites"],
                        "failed_sites": session_data["failed_sites"],
                        "skipped_sites": session_data["skipped_sites"],
                        "total_cookies": session_data["total_cookies"],
                        "duration_seconds": (
                            datetime.fromisoformat(session_data["completed_at"]) -
                            datetime.fromisoformat(session_data["started_at"])
                        ).total_seconds() if session_data["completed_at"] and session_data["started_at"] else 0
                    }
                }
            else:
                return {
                    "success": False,
                    "error": "Falha ao salvar cookies"
                }

        except Exception as e:
            logger.error(f"Erro ao salvar cookies: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def cancel_session() -> Dict[str, Any]:
        """
        Cancelar sessão atual

        Returns:
            Resultado do cancelamento
        """
        try:
            manager = get_session_manager()

            if not manager.current_session:
                return {
                    "success": False,
                    "error": "Nenhuma sessão OAuth ativa"
                }

            await manager.cancel_session()

            return {
                "success": True,
                "message": "Sessão cancelada com sucesso"
            }

        except Exception as e:
            logger.error(f"Erro ao cancelar sessão: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def get_vnc_url() -> Dict[str, Any]:
        """
        Obter URL do noVNC

        Returns:
            URL do visualizador VNC
        """
        try:
            # URL do noVNC (configurado no docker-compose)
            vnc_url = "http://localhost:6080/vnc.html"

            return {
                "success": True,
                "vnc_url": vnc_url,
                "vnc_direct": "vnc://localhost:5900",
                "instructions": "Acesse a URL no navegador para visualizar o Chrome remotamente"
            }

        except Exception as e:
            logger.error(f"Erro ao obter URL VNC: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    @staticmethod
    async def get_sites_config() -> Dict[str, Any]:
        """
        Obter configuração de todos os sites OAuth

        Returns:
            Lista de sites e metadados
        """
        try:
            sites = get_sites_in_order()

            return {
                "success": True,
                "sites": [
                    {
                        "id": site["id"],
                        "name": site["name"],
                        "category": site["category"],
                        "url": site["url"],
                        "login_type": site["login_type"],
                        "required": site["required"],
                        "instructions": site["instructions"],
                        "order": site["order"]
                    }
                    for site in sites
                ],
                "metadata": OAUTH_CONFIG_METADATA
            }

        except Exception as e:
            logger.error(f"Erro ao obter configuração de sites: {e}")
            return {
                "success": False,
                "error": str(e)
            }
