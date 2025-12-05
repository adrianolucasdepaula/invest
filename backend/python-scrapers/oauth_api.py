"""
OAuth API - FastAPI endpoints for OAuth session management
Exposes OAuthSessionManager functionality via REST API

Port: 8000 (configured in docker-compose)
"""

import asyncio
import uuid
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from loguru import logger

from oauth_session_manager import OAuthSessionManager, SessionStatus
from oauth_sites_config import get_sites_in_order, OAUTH_CONFIG_METADATA

# Create FastAPI app
app = FastAPI(
    title="OAuth Session Manager API",
    description="API for managing OAuth cookie collection sessions",
    version="1.0.0",
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global session manager instance
oauth_manager: Optional[OAuthSessionManager] = None


# Request/Response models
class SkipSiteRequest(BaseModel):
    reason: Optional[str] = "Usuário optou por pular"


class ApiResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


# Helper function to get or create manager
def get_manager() -> OAuthSessionManager:
    global oauth_manager
    if oauth_manager is None:
        oauth_manager = OAuthSessionManager()
    return oauth_manager


# Health check endpoint
@app.get("/api/oauth/health")
async def health_check():
    """Check if the OAuth API is running"""
    return {
        "success": True,
        "status": "healthy",
        "message": "OAuth API is running",
    }


# Get session status
@app.get("/api/oauth/session/status")
async def get_session_status():
    """Get current OAuth session status"""
    manager = get_manager()

    if manager.current_session is None:
        return {
            "success": True,
            "session": None,
            "message": "No active session",
        }

    return {
        "success": True,
        "session": manager.current_session.to_dict(),
    }


# Start new OAuth session
@app.post("/api/oauth/session/start")
async def start_session():
    """Start a new OAuth cookie collection session"""
    global oauth_manager
    manager = get_manager()

    # Check if session already exists
    if manager.current_session and manager.current_session.status not in [
        SessionStatus.COMPLETED,
        SessionStatus.CANCELLED,
        SessionStatus.ERROR,
    ]:
        raise HTTPException(
            status_code=400,
            detail="Já existe uma sessão OAuth ativa. Cancele-a primeiro.",
        )

    try:
        # Create new session
        session_id = str(uuid.uuid4())
        session = manager.create_session(session_id)

        # Start browser
        logger.info(f"[API] Starting browser for session {session_id}...")
        browser_started = await manager.start_browser()

        if not browser_started:
            raise HTTPException(
                status_code=500,
                detail="Falha ao iniciar navegador Chrome. Verifique os logs.",
            )

        # Navigate to first site
        first_site = session.sites_progress[0]
        logger.info(f"[API] Navigating to first site: {first_site.site_name}")
        await manager.navigate_to_site(first_site.site_id)

        return {
            "success": True,
            "message": f"Sessão iniciada. Navegando para {first_site.site_name}",
            "session": manager.current_session.to_dict(),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error starting session: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao iniciar sessão: {str(e)}",
        )


# Confirm login on current site
@app.post("/api/oauth/session/confirm-login")
async def confirm_login():
    """Confirm login completed on current site and move to next"""
    manager = get_manager()

    if not manager.current_session:
        raise HTTPException(status_code=400, detail="Nenhuma sessão ativa")

    try:
        # Collect cookies from current site
        current_site = manager.current_session.sites_progress[manager.current_session.current_site_index]
        logger.info(f"[API] Confirming login for {current_site.site_name}")

        cookies_count = await manager.collect_cookies_from_current_site()
        logger.info(f"[API] Collected {cookies_count} cookies from {current_site.site_name}")

        # Move to next site
        has_next = await manager.move_to_next_site()

        if has_next:
            next_site = manager.current_session.sites_progress[manager.current_session.current_site_index]
            return {
                "success": True,
                "message": f"Login confirmado. Navegando para {next_site.site_name}",
                "cookies_collected": cookies_count,
                "has_next_site": True,
                "next_site": next_site.site_name,
            }
        else:
            return {
                "success": True,
                "message": "Login confirmado. Todos os sites foram processados!",
                "cookies_collected": cookies_count,
                "has_next_site": False,
            }

    except Exception as e:
        logger.error(f"[API] Error confirming login: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao confirmar login: {str(e)}",
        )


# Skip current site
@app.post("/api/oauth/session/skip-site")
async def skip_site(request: SkipSiteRequest):
    """Skip current site and move to next"""
    manager = get_manager()

    if not manager.current_session:
        raise HTTPException(status_code=400, detail="Nenhuma sessão ativa")

    try:
        current_site = manager.current_session.sites_progress[manager.current_session.current_site_index]
        skipped_site_name = current_site.site_name

        logger.info(f"[API] Skipping site {skipped_site_name}: {request.reason}")
        manager.skip_current_site(request.reason)

        # Move to next site
        has_next = await manager.move_to_next_site()

        if has_next:
            next_site = manager.current_session.sites_progress[manager.current_session.current_site_index]
            return {
                "success": True,
                "message": f"Site pulado. Navegando para {next_site.site_name}",
                "skipped_site": skipped_site_name,
                "has_next_site": True,
                "next_site": next_site.site_name,
            }
        else:
            return {
                "success": True,
                "message": "Site pulado. Todos os sites foram processados!",
                "skipped_site": skipped_site_name,
                "has_next_site": False,
            }

    except Exception as e:
        logger.error(f"[API] Error skipping site: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao pular site: {str(e)}",
        )


# Go back to previous site
@app.post("/api/oauth/session/go-back")
async def go_back():
    """Go back to previous site"""
    manager = get_manager()

    if not manager.current_session:
        raise HTTPException(status_code=400, detail="Nenhuma sessão ativa")

    if manager.current_session.current_site_index == 0:
        raise HTTPException(status_code=400, detail="Já está no primeiro site")

    try:
        # Move to previous site
        prev_index = manager.current_session.current_site_index - 1
        prev_site = manager.current_session.sites_progress[prev_index]

        logger.info(f"[API] Going back to {prev_site.site_name}")

        # Reset previous site status
        prev_site.status = "pending"
        prev_site.cookies_count = 0

        # Navigate
        manager.current_session.current_site_index = prev_index
        await manager.navigate_to_site(prev_site.site_id)

        return {
            "success": True,
            "message": f"Voltando para {prev_site.site_name}",
        }

    except Exception as e:
        logger.error(f"[API] Error going back: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao voltar: {str(e)}",
        )


# Navigate to specific site
@app.post("/api/oauth/navigate/{site_id}")
async def navigate_to_site(site_id: str):
    """Navigate to a specific site by ID"""
    manager = get_manager()

    if not manager.current_session:
        raise HTTPException(status_code=400, detail="Nenhuma sessão ativa")

    try:
        # Find site
        site_progress = next(
            (sp for sp in manager.current_session.sites_progress if sp.site_id == site_id),
            None
        )

        if not site_progress:
            raise HTTPException(status_code=404, detail=f"Site {site_id} não encontrado")

        logger.info(f"[API] Navigating to {site_progress.site_name}")

        success = await manager.navigate_to_site(site_id)

        if success:
            return {
                "success": True,
                "message": f"Navegando para {site_progress.site_name}",
            }
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Falha ao navegar para {site_progress.site_name}",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error navigating to site: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao navegar: {str(e)}",
        )


# Save cookies and finish
@app.post("/api/oauth/session/save")
async def save_cookies():
    """Save collected cookies and finish session"""
    manager = get_manager()

    if not manager.current_session:
        raise HTTPException(status_code=400, detail="Nenhuma sessão ativa")

    try:
        logger.info("[API] Saving cookies and finishing session...")

        success = await manager.save_cookies_to_file(finalize_session=True)

        if success:
            session_summary = {
                "total_cookies": manager.current_session.total_cookies,
                "completed_sites": sum(
                    1 for sp in manager.current_session.sites_progress
                    if sp.status.value == "completed"
                ),
                "skipped_sites": sum(
                    1 for sp in manager.current_session.sites_progress
                    if sp.status.value == "skipped"
                ),
                "failed_sites": sum(
                    1 for sp in manager.current_session.sites_progress
                    if sp.status.value == "failed"
                ),
            }

            # Cleanup browser
            await manager.cleanup()

            return {
                "success": True,
                "message": "Cookies salvos com sucesso!",
                "session_summary": session_summary,
            }
        else:
            raise HTTPException(
                status_code=500,
                detail="Falha ao salvar cookies",
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error saving cookies: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao salvar cookies: {str(e)}",
        )


# Cancel session
@app.delete("/api/oauth/session/cancel")
async def cancel_session():
    """Cancel current OAuth session"""
    global oauth_manager
    manager = get_manager()

    try:
        logger.info("[API] Cancelling OAuth session...")

        if manager.current_session:
            await manager.cancel_session()
            await manager.cleanup()

        # Reset manager
        oauth_manager = None

        return {
            "success": True,
            "message": "Sessão cancelada",
        }

    except Exception as e:
        logger.error(f"[API] Error cancelling session: {e}")
        # Reset manager anyway
        oauth_manager = None
        return {
            "success": True,
            "message": "Sessão cancelada (com erros)",
        }


# Get VNC URL
@app.get("/api/oauth/vnc-url")
async def get_vnc_url():
    """Get VNC viewer URL"""
    return {
        "success": True,
        "vnc_url": "http://localhost:6080/vnc.html",
    }


# Get list of OAuth sites
@app.get("/api/oauth/sites")
async def get_sites():
    """Get list of all OAuth sites"""
    sites = get_sites_in_order()
    return {
        "success": True,
        "sites": sites,
        "metadata": OAUTH_CONFIG_METADATA,
    }


# Run with uvicorn if executed directly
if __name__ == "__main__":
    import uvicorn

    logger.info("Starting OAuth API server on port 8000...")
    uvicorn.run(
        "oauth_api:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info",
    )
