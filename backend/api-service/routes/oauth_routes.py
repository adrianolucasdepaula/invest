"""
OAuth Routes
Endpoints FastAPI para gerenciamento de sessões OAuth
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

from controllers.oauth_controller import OAuthController
from loguru import logger


router = APIRouter(prefix="/api/oauth", tags=["OAuth Management"])


# Pydantic Models
class SkipSiteRequest(BaseModel):
    """Request para pular site"""
    reason: str = Field(default="Usuário optou por pular", description="Motivo para pular site")


class NavigateRequest(BaseModel):
    """Request para navegar para site"""
    site_id: str = Field(..., description="ID do site na configuração")


# ==================== ENDPOINTS ====================

@router.post("/session/start")
async def start_session():
    """
    Iniciar nova sessão OAuth

    **Fluxo:**
    1. Cria nova sessão UUID
    2. Inicia Chrome em modo visual (VNC)
    3. Navega automaticamente para Google (primeiro site)
    4. Retorna URL do noVNC e status da sessão

    **Returns:**
    - session: Dados da sessão criada
    - vnc_url: URL para acessar visualizador VNC
    - next_action: Próxima ação que o usuário deve fazer
    """
    logger.info("API: Iniciando nova sessão OAuth")

    result = await OAuthController.start_oauth_session()

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Erro desconhecido"))

    return result


@router.get("/session/status")
async def get_status():
    """
    Obter status da sessão OAuth atual

    **Returns:**
    - session: Dados completos da sessão (ou None se não houver sessão)
        - session_id: ID único da sessão
        - status: Status atual (idle, starting, ready, navigating, waiting_user, etc)
        - current_site_index: Índice do site atual
        - current_site: Nome do site atual
        - sites_progress: Array com progresso de cada site
        - progress_percentage: Porcentagem de conclusão (0-100)
        - total_cookies: Total de cookies coletados
        - vnc_url: URL do noVNC
    """
    logger.info("API: Obtendo status da sessão")

    result = await OAuthController.get_session_status()

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Erro ao obter status"))

    return result


@router.post("/session/confirm-login")
async def confirm_login():
    """
    Confirmar que usuário fez login no site atual

    **Ação:**
    1. Coleta cookies do site atual
    2. Marca site como concluído
    3. Navega automaticamente para o próximo site (se houver)

    **Returns:**
    - cookies_collected: Número de cookies coletados
    - has_next_site: Se há próximo site
    - next_site: Dados do próximo site (se houver)
    """
    logger.info("API: Confirmando login e coletando cookies")

    result = await OAuthController.confirm_site_login()

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Erro ao confirmar login"))

    return result


@router.post("/session/skip-site")
async def skip_site(request: SkipSiteRequest):
    """
    Pular site atual

    **Uso:** Quando usuário não tem conta ou não quer fazer login naquele site

    **Ação:**
    1. Marca site atual como "skipped"
    2. Navega automaticamente para o próximo site (se houver)

    **Args:**
    - reason: Motivo para pular (opcional)

    **Returns:**
    - skipped_site: Nome do site pulado
    - has_next_site: Se há próximo site
    - next_site: Dados do próximo site (se houver)
    """
    logger.info(f"API: Pulando site atual. Motivo: {request.reason}")

    result = await OAuthController.skip_current_site(request.reason)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Erro ao pular site"))

    return result


@router.post("/session/go-back")
async def go_back():
    """
    Voltar para o site anterior

    **Uso:** Quando usuário quer reprocessar site anterior

    **Ação:**
    1. Decrementa current_site_index
    2. Navega para o site anterior
    3. Marca site como "in_progress" novamente

    **Returns:**
    - previous_site: Nome do site anterior
    - current_index: Novo índice atual
    """
    logger.info("API: Voltando para site anterior")

    result = await OAuthController.go_back()

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Erro ao voltar"))

    return result


@router.post("/session/save")
async def save_cookies():
    """
    Salvar cookies coletados e finalizar sessão

    **Ação:**
    1. Salva todos os cookies coletados em /app/browser-profiles/google_cookies.pkl
    2. Fecha navegador Chrome
    3. Finaliza sessão
    4. Retorna resumo (sites concluídos, cookies salvos, etc)

    **Returns:**
    - session_summary: Resumo da sessão
        - total_sites: Total de sites processados
        - completed_sites: Sites com login concluído
        - failed_sites: Sites que falharam
        - skipped_sites: Sites pulados
        - total_cookies: Total de cookies salvos
        - duration_seconds: Duração total da sessão
    """
    logger.info("API: Salvando cookies e finalizando sessão")

    result = await OAuthController.save_cookies()

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Erro ao salvar cookies"))

    return result


@router.delete("/session/cancel")
async def cancel_session():
    """
    Cancelar sessão atual

    **Ação:**
    1. Marca sessão como cancelada
    2. Fecha navegador Chrome
    3. Não salva cookies

    **Uso:** Quando usuário deseja abortar o processo
    """
    logger.info("API: Cancelando sessão OAuth")

    result = await OAuthController.cancel_session()

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Erro ao cancelar sessão"))

    return result


@router.get("/vnc-url")
async def get_vnc_url():
    """
    Obter URL do visualizador noVNC

    **Returns:**
    - vnc_url: URL HTTP do noVNC (http://localhost:6080/vnc.html)
    - vnc_direct: URL VNC direta (vnc://localhost:5900)
    - instructions: Instruções de uso
    """
    logger.info("API: Obtendo URL do VNC")

    result = await OAuthController.get_vnc_url()

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Erro ao obter URL VNC"))

    return result


@router.get("/sites")
async def get_sites():
    """
    Obter lista de todos os sites OAuth configurados

    **Returns:**
    - sites: Array de sites com configuração
    - metadata: Metadados (total, categorias, tempo estimado)
    """
    logger.info("API: Obtendo lista de sites OAuth")

    result = await OAuthController.get_sites_config()

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Erro ao obter sites"))

    return result


@router.post("/navigate/{site_id}")
async def navigate_to_site(site_id: str):
    """
    Navegar para site específico (uso avançado)

    **Args:**
    - site_id: ID do site (ex: "google", "fundamentei", "statusinvest")

    **Returns:**
    - site: Configuração do site
    - instructions: Instruções de login para o site
    """
    logger.info(f"API: Navegando para site {site_id}")

    result = await OAuthController.navigate_to_site(site_id)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result.get("error", "Erro ao navegar"))

    return result


@router.get("/health")
async def health_check():
    """Health check do serviço OAuth"""
    return {
        "status": "healthy",
        "service": "oauth-management",
        "vnc_enabled": True
    }
