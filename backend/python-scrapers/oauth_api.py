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


# ==========================================================================
# SENTIMENT ANALYSIS VIA AI SCRAPERS (FASE 85)
# ==========================================================================

from scrapers import (
    ChatGPTScraper,
    GeminiScraper,
    ClaudeScraper,
    DeepSeekScraper,
    GrokScraper,
    PerplexityScraper,
)

# AI Scraper registry
AI_SCRAPERS = {
    "chatgpt": ChatGPTScraper,
    "gemini": GeminiScraper,
    "claude": ClaudeScraper,
    "deepseek": DeepSeekScraper,
    "grok": GrokScraper,
    "perplexity": PerplexityScraper,
}


class SentimentAnalysisRequest(BaseModel):
    """Request for sentiment analysis"""
    ticker: str
    title: str
    summary: Optional[str] = None
    content: Optional[str] = None
    source: Optional[str] = None
    published_at: Optional[str] = None
    providers: Optional[list[str]] = None  # List of AI providers to use


class SentimentAnalysisResult(BaseModel):
    """Result from a single AI provider"""
    provider: str
    success: bool
    sentiment_score: Optional[float] = None  # -1 to +1
    confidence: Optional[float] = None  # 0 to 1
    analysis_text: Optional[str] = None
    key_factors: Optional[dict] = None
    processing_time: Optional[int] = None
    error: Optional[str] = None


def build_sentiment_prompt(request: SentimentAnalysisRequest) -> str:
    """Build standardized sentiment analysis prompt"""
    content_text = ""
    if request.content:
        content_text = f"\nConteúdo: {request.content[:2000]}"

    return f"""Você é um analista financeiro especializado em mercado de ações brasileiro (B3).
Analise a seguinte notícia e determine o sentimento de mercado para o ativo {request.ticker}.

NOTÍCIA:
Título: {request.title}
{f'Resumo: {request.summary}' if request.summary else ''}
{content_text}
{f'Fonte: {request.source}' if request.source else ''}
{f'Data: {request.published_at}' if request.published_at else ''}

INSTRUÇÕES:
1. Analise o impacto potencial no preço da ação
2. Identifique fatores positivos (bullish), negativos (bearish) e neutros
3. Atribua um score de sentimento de -1 (muito bearish) a +1 (muito bullish)
4. Indique sua confiança de 0 a 1

RESPONDA EXATAMENTE no formato JSON:
{{
  "sentimentScore": <número de -1 a 1>,
  "confidence": <número de 0 a 1>,
  "analysisText": "<análise em 2-3 frases>",
  "keyFactors": {{
    "bullish": ["fator1", "fator2"],
    "bearish": ["fator1", "fator2"],
    "neutral": ["fator1"]
  }}
}}"""


def parse_ai_response(response_text: str) -> dict:
    """Parse AI response to extract sentiment data"""
    import json
    import re

    try:
        # Try to find JSON in response
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            parsed = json.loads(json_match.group())
            return {
                "sentiment_score": max(-1, min(1, float(parsed.get("sentimentScore", 0)))),
                "confidence": max(0, min(1, float(parsed.get("confidence", 0.5)))),
                "analysis_text": parsed.get("analysisText", ""),
                "key_factors": parsed.get("keyFactors", {"bullish": [], "bearish": [], "neutral": []}),
            }
    except Exception as e:
        logger.warning(f"Failed to parse JSON from AI response: {e}")

    # Fallback: Simple sentiment from text
    text_lower = response_text.lower()
    if any(word in text_lower for word in ["positivo", "bullish", "alta", "compra", "valorização"]):
        return {"sentiment_score": 0.3, "confidence": 0.4, "analysis_text": response_text[:500], "key_factors": {}}
    elif any(word in text_lower for word in ["negativo", "bearish", "baixa", "venda", "queda"]):
        return {"sentiment_score": -0.3, "confidence": 0.4, "analysis_text": response_text[:500], "key_factors": {}}

    return {"sentiment_score": 0, "confidence": 0.3, "analysis_text": response_text[:500], "key_factors": {}}


@app.post("/api/sentiment/analyze")
async def analyze_sentiment(request: SentimentAnalysisRequest):
    """
    Analyze news sentiment using AI scrapers (ChatGPT, Gemini, Claude, etc.)

    Uses browser-based AI scrapers instead of paid API keys.
    Requires OAuth cookies to be configured for each AI provider.
    """
    logger.info(f"[SENTIMENT] Analyzing news for ticker {request.ticker}")

    # Determine which providers to use
    providers_to_use = request.providers or ["gemini", "chatgpt"]  # Default: Gemini + ChatGPT

    # Validate providers
    valid_providers = [p for p in providers_to_use if p.lower() in AI_SCRAPERS]
    if not valid_providers:
        raise HTTPException(
            status_code=400,
            detail=f"No valid AI providers specified. Available: {list(AI_SCRAPERS.keys())}",
        )

    prompt = build_sentiment_prompt(request)
    results: list[SentimentAnalysisResult] = []

    for provider_name in valid_providers:
        scraper_class = AI_SCRAPERS.get(provider_name.lower())
        if not scraper_class:
            continue

        try:
            import time
            start_time = time.time()

            logger.info(f"[SENTIMENT] Analyzing with {provider_name}...")
            scraper = scraper_class()

            try:
                await scraper.initialize()
                result = await scraper.scrape(prompt)
                processing_time = int((time.time() - start_time) * 1000)

                if result.success and result.data:
                    response_text = result.data.get("response", "")
                    parsed = parse_ai_response(response_text)

                    results.append(SentimentAnalysisResult(
                        provider=provider_name,
                        success=True,
                        sentiment_score=parsed["sentiment_score"],
                        confidence=parsed["confidence"],
                        analysis_text=parsed["analysis_text"],
                        key_factors=parsed["key_factors"],
                        processing_time=processing_time,
                    ))
                    logger.info(f"[SENTIMENT] {provider_name}: score={parsed['sentiment_score']:.2f}")
                else:
                    results.append(SentimentAnalysisResult(
                        provider=provider_name,
                        success=False,
                        error=result.error or "No response from AI",
                        processing_time=processing_time,
                    ))
                    logger.warning(f"[SENTIMENT] {provider_name} failed: {result.error}")

            finally:
                await scraper.cleanup()

        except Exception as e:
            logger.error(f"[SENTIMENT] Error with {provider_name}: {e}")
            results.append(SentimentAnalysisResult(
                provider=provider_name,
                success=False,
                error=str(e),
            ))

    # Calculate consensus if multiple providers succeeded
    successful_results = [r for r in results if r.success]
    consensus = None

    if successful_results:
        avg_score = sum(r.sentiment_score for r in successful_results) / len(successful_results)
        avg_confidence = sum(r.confidence for r in successful_results) / len(successful_results)
        consensus = {
            "sentiment_score": round(avg_score, 3),
            "confidence": round(avg_confidence, 3),
            "providers_used": len(successful_results),
            "providers_total": len(valid_providers),
        }

    return {
        "success": len(successful_results) > 0,
        "ticker": request.ticker,
        "results": [r.model_dump() for r in results],
        "consensus": consensus,
    }


@app.get("/api/sentiment/providers")
async def get_sentiment_providers():
    """Get list of available AI providers for sentiment analysis"""
    return {
        "success": True,
        "providers": list(AI_SCRAPERS.keys()),
        "message": "Use OAuth session to configure cookies for each provider",
    }


@app.get("/api/sentiment/health")
async def check_sentiment_health():
    """Check health of AI scrapers"""
    health_results = {}

    for provider_name, scraper_class in AI_SCRAPERS.items():
        try:
            scraper = scraper_class()
            # Check if cookies file exists
            cookies_exist = scraper.COOKIES_FILE.exists() if hasattr(scraper, 'COOKIES_FILE') else False
            health_results[provider_name] = {
                "available": True,
                "cookies_configured": cookies_exist,
            }
        except Exception as e:
            health_results[provider_name] = {
                "available": False,
                "error": str(e),
            }

    configured_count = sum(1 for h in health_results.values() if h.get("cookies_configured", False))

    return {
        "success": True,
        "providers": health_results,
        "configured_count": configured_count,
        "total_count": len(AI_SCRAPERS),
        "ready": configured_count >= 1,
    }


# ==========================================================================
# FASE 144: DIVIDENDS AND STOCK LENDING ENDPOINTS
# ==========================================================================

from scrapers import StatusInvestDividendsScraper, StockLendingScraper

# Scraper instances (singleton pattern)
_dividends_scraper = None
_lending_scraper = None


async def get_dividends_scraper() -> StatusInvestDividendsScraper:
    """Get or create dividends scraper instance"""
    global _dividends_scraper
    if _dividends_scraper is None:
        _dividends_scraper = StatusInvestDividendsScraper()
        await _dividends_scraper.initialize()
    return _dividends_scraper


async def get_lending_scraper() -> StockLendingScraper:
    """Get or create lending scraper instance"""
    global _lending_scraper
    if _lending_scraper is None:
        _lending_scraper = StockLendingScraper()
        await _lending_scraper.initialize()
    return _lending_scraper


@app.get("/api/scrapers/dividends/{ticker}")
async def scrape_dividends(ticker: str):
    """
    Scrape dividends history for a stock ticker.
    FASE 144 - Wheel Turbinada Integration

    Args:
        ticker: Stock ticker (e.g., 'PETR4', 'VALE3')

    Returns:
        Dict with dividends history
    """
    import time

    ticker = ticker.upper().strip()
    if not ticker or len(ticker) < 4 or len(ticker) > 6:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ticker format: {ticker}. Expected 4-6 characters."
        )

    logger.info(f"[DIVIDENDS] Scraping for {ticker}")
    start_time = time.time()

    try:
        scraper = await get_dividends_scraper()
        result = await scraper.scrape(ticker)

        execution_time = round(time.time() - start_time, 2)

        if result.success:
            dividends = result.data.get("dividends", []) if result.data else []
            logger.info(f"[DIVIDENDS] Found {len(dividends)} dividends for {ticker}")

            return {
                "success": True,
                "ticker": ticker,
                "dividends": dividends,
                "total_count": len(dividends),
                "execution_time": execution_time,
                "source": "STATUSINVEST_DIVIDENDS"
            }
        else:
            logger.warning(f"[DIVIDENDS] Failed for {ticker}: {result.error}")
            return {
                "success": False,
                "ticker": ticker,
                "error": result.error or "Unknown error",
                "execution_time": execution_time
            }

    except Exception as e:
        logger.error(f"[DIVIDENDS] Exception for {ticker}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/scrapers/stock-lending/{ticker}")
async def scrape_stock_lending(ticker: str):
    """
    Scrape stock lending rates for a stock ticker.
    FASE 144 - Wheel Turbinada Integration

    Args:
        ticker: Stock ticker (e.g., 'PETR4', 'VALE3')

    Returns:
        Dict with lending rate data
    """
    import time

    ticker = ticker.upper().strip()
    if not ticker or len(ticker) < 4 or len(ticker) > 6:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid ticker format: {ticker}. Expected 4-6 characters."
        )

    logger.info(f"[STOCK-LENDING] Scraping for {ticker}")
    start_time = time.time()

    try:
        scraper = await get_lending_scraper()
        result = await scraper.scrape(ticker)

        execution_time = round(time.time() - start_time, 2)

        if result.success:
            data = result.data or {}
            logger.info(
                f"[STOCK-LENDING] Found rate for {ticker}: "
                f"{data.get('taxa_aluguel_ano', 'N/A')}% a.a."
            )

            return {
                "success": True,
                "ticker": ticker,
                "data": data,
                "execution_time": execution_time,
                "source": "STOCK_LENDING"
            }
        else:
            logger.warning(f"[STOCK-LENDING] Failed for {ticker}: {result.error}")
            return {
                "success": False,
                "ticker": ticker,
                "error": result.error or "Unknown error",
                "execution_time": execution_time
            }

    except Exception as e:
        logger.error(f"[STOCK-LENDING] Exception for {ticker}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


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
