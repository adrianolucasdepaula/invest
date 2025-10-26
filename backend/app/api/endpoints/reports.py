"""
API endpoints para Reports (Relatórios)
Endpoints para geração de relatórios completos, comparativos e de mercado
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from loguru import logger
from ...services import DataCollectionService, ReportService, AIService
from ...tasks.reports import (
    generate_report_async,
    generate_comparison_report_async,
    generate_portfolio_report_async,
    generate_market_overview_async,
    generate_multi_ai_analysis,
)
from ...tasks.scheduler import TaskScheduler

router = APIRouter()
collection_service = DataCollectionService()
report_service = ReportService()
ai_service = AIService()
scheduler = TaskScheduler()


# Pydantic Models
class GenerateReportRequest(BaseModel):
    ticker: str
    ai_provider: str = "openai"  # openai, anthropic, gemini
    fetch_fresh_data: bool = False


class CompareReportRequest(BaseModel):
    tickers: List[str]
    ai_provider: str = "openai"
    fetch_fresh_data: bool = False


class MarketOverviewRequest(BaseModel):
    tickers: Optional[List[str]] = None  # Se None, usa top ativos
    country: str = "BR"
    importance: str = "high"
    days: int = 7
    ai_provider: str = "openai"


class PortfolioReportRequest(BaseModel):
    portfolio_data: dict  # Dados do portfólio


@router.post("/reports/generate")
async def generate_complete_report(request: GenerateReportRequest):
    """
    Gera relatório completo de um ativo

    Args:
        request: Dados da requisição (ticker, ai_provider, fetch_fresh_data)

    Returns:
        Relatório completo do ativo
    """
    logger.info(f"POST /reports/generate - ticker: {request.ticker}, AI: {request.ai_provider}")

    try:
        # Valida AI provider
        available_providers = ai_service.get_available_providers()
        if request.ai_provider not in available_providers:
            raise HTTPException(
                status_code=400,
                detail=f"AI provider '{request.ai_provider}' não disponível. Disponíveis: {available_providers}"
            )

        # Coleta dados
        if request.fetch_fresh_data:
            asset_data = await collection_service.collect_all_data(request.ticker)
        else:
            # TODO: Buscar do cache/database
            asset_data = await collection_service.collect_all_data(request.ticker)

        # Gera relatório
        report = report_service.generate_complete_report(
            asset_data=asset_data,
            ai_provider=request.ai_provider
        )

        return {
            "status": "success",
            "ticker": request.ticker,
            "report": report,
            "ai_provider": request.ai_provider,
            "data_source": "fresh" if request.fetch_fresh_data else "cached"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar relatório de {request.ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reports/compare")
async def generate_comparison_report(request: CompareReportRequest):
    """
    Gera relatório comparativo de múltiplos ativos

    Args:
        request: Dados da requisição (tickers, ai_provider, fetch_fresh_data)

    Returns:
        Relatório comparativo
    """
    logger.info(f"POST /reports/compare - {len(request.tickers)} tickers, AI: {request.ai_provider}")

    try:
        # Valida número de ativos
        if len(request.tickers) < 2:
            raise HTTPException(
                status_code=400,
                detail="É necessário pelo menos 2 ativos para comparação"
            )

        if len(request.tickers) > 10:
            raise HTTPException(
                status_code=400,
                detail="Máximo de 10 ativos por comparação"
            )

        # Valida AI provider
        available_providers = ai_service.get_available_providers()
        if request.ai_provider not in available_providers:
            raise HTTPException(
                status_code=400,
                detail=f"AI provider '{request.ai_provider}' não disponível. Disponíveis: {available_providers}"
            )

        # Coleta dados de todos os ativos
        assets_data = []
        for ticker in request.tickers:
            if request.fetch_fresh_data:
                data = await collection_service.collect_all_data(ticker)
            else:
                # TODO: Buscar do cache/database
                data = await collection_service.collect_all_data(ticker)
            assets_data.append(data)

        # Gera relatório comparativo
        report = report_service.generate_comparison_report(
            assets_data=assets_data,
            ai_provider=request.ai_provider
        )

        return {
            "status": "success",
            "total_assets": len(request.tickers),
            "tickers": request.tickers,
            "report": report,
            "ai_provider": request.ai_provider,
            "data_source": "fresh" if request.fetch_fresh_data else "cached"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar relatório comparativo: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reports/portfolio")
async def generate_portfolio_report(request: PortfolioReportRequest):
    """
    Gera relatório de portfólio

    Args:
        request: Dados da requisição (portfolio_data)

    Returns:
        Relatório de portfólio
    """
    logger.info(f"POST /reports/portfolio")

    try:
        # Gera relatório de portfólio
        report = report_service.generate_portfolio_report(
            portfolio_data=request.portfolio_data
        )

        return {
            "status": "success",
            "report": report,
        }

    except Exception as e:
        logger.error(f"Erro ao gerar relatório de portfólio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reports/market-overview")
async def generate_market_overview(request: MarketOverviewRequest):
    """
    Gera relatório de visão geral do mercado

    Args:
        request: Dados da requisição (tickers, country, importance, days, ai_provider)

    Returns:
        Relatório de visão geral do mercado
    """
    logger.info(f"POST /reports/market-overview - AI: {request.ai_provider}")

    try:
        # Valida AI provider
        available_providers = ai_service.get_available_providers()
        if request.ai_provider not in available_providers:
            raise HTTPException(
                status_code=400,
                detail=f"AI provider '{request.ai_provider}' não disponível. Disponíveis: {available_providers}"
            )

        # Coleta dados macroeconômicos
        macro_data = await collection_service.collect_macroeconomic_data(
            country=request.country,
            importance=request.importance,
            days=request.days
        )

        # Define tickers
        tickers = request.tickers
        if not tickers:
            # TODO: Buscar top tickers do database
            tickers = ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3",
                      "B3SA3", "WEGE3", "RENT3", "EGIE3", "SUZB3"]

        # Coleta dados dos principais ativos
        top_assets = []
        for ticker in tickers[:10]:  # Limita a 10
            try:
                asset_data = await collection_service.collect_all_data(ticker)
                top_assets.append(asset_data)
            except Exception as e:
                logger.warning(f"Erro ao coletar dados de {ticker}: {str(e)}")

        # Gera relatório de mercado
        report = report_service.generate_market_overview_report(
            macro_data=macro_data,
            top_assets=top_assets,
            ai_provider=request.ai_provider
        )

        return {
            "status": "success",
            "report": report,
            "ai_provider": request.ai_provider,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar relatório de mercado: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/export/{ticker}/markdown")
async def export_report_markdown(
    ticker: str,
    ai_provider: str = "openai"
):
    """
    Gera e exporta relatório em formato Markdown

    Args:
        ticker: Código do ativo
        ai_provider: Provedor de IA

    Returns:
        Relatório em formato Markdown
    """
    logger.info(f"GET /reports/export/{ticker}/markdown - AI: {ai_provider}")

    try:
        # Valida AI provider
        available_providers = ai_service.get_available_providers()
        if ai_provider not in available_providers:
            raise HTTPException(
                status_code=400,
                detail=f"AI provider '{ai_provider}' não disponível. Disponíveis: {available_providers}"
            )

        # Coleta dados
        asset_data = await collection_service.collect_all_data(ticker)

        # Gera relatório
        report = report_service.generate_complete_report(
            asset_data=asset_data,
            ai_provider=ai_provider
        )

        # Exporta para Markdown
        markdown = report_service.export_report_to_markdown(report)

        return {
            "status": "success",
            "ticker": ticker,
            "markdown": markdown,
            "ai_provider": ai_provider,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao exportar relatório de {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/ai-providers")
async def get_available_ai_providers():
    """
    Retorna lista de provedores de IA disponíveis

    Returns:
        Lista de provedores disponíveis
    """
    logger.info(f"GET /reports/ai-providers")

    try:
        providers = ai_service.get_available_providers()

        return {
            "status": "success",
            "available_providers": providers,
            "total": len(providers),
        }

    except Exception as e:
        logger.error(f"Erro ao obter provedores de IA: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reports/multi-ai")
async def generate_multi_ai_analysis(
    ticker: str,
    providers: Optional[List[str]] = None
):
    """
    Gera análise usando múltiplas IAs para comparação

    Args:
        ticker: Código do ativo
        providers: Lista de provedores (opcional, usa todos se não especificado)

    Returns:
        Análises de múltiplas IAs
    """
    logger.info(f"POST /reports/multi-ai - ticker: {ticker}")

    try:
        # Coleta dados
        asset_data = await collection_service.collect_all_data(ticker)

        # Gera análise multi-IA
        multi_ai_result = ai_service.generate_analysis_multi_ai(
            asset_data=asset_data,
            providers=providers
        )

        return {
            "status": "success",
            "ticker": ticker,
            "multi_ai_analysis": multi_ai_result,
        }

    except Exception as e:
        logger.error(f"Erro ao gerar análise multi-IA de {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ===== ASYNC TASK ENDPOINTS =====

@router.post("/reports/async/generate")
async def generate_report_async_endpoint(
    ticker: str,
    ai_provider: str = "openai",
    language: str = "pt-BR"
):
    """
    Gerar relatório de forma assíncrona (via Celery)

    Args:
        ticker: Código do ativo
        ai_provider: Provedor de IA
        language: Idioma do relatório

    Returns:
        Task ID para acompanhamento
    """
    logger.info(f"POST /reports/async/generate - {ticker}")

    try:
        task = generate_report_async.apply_async(
            args=[ticker, ai_provider, language]
        )

        return {
            "status": "queued",
            "task_id": task.id,
            "ticker": ticker,
            "ai_provider": ai_provider,
            "message": "Geração de relatório iniciada"
        }

    except Exception as e:
        logger.error(f"Erro ao iniciar geração de relatório: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reports/async/compare")
async def generate_comparison_report_async_endpoint(
    tickers: List[str],
    ai_provider: str = "openai",
    language: str = "pt-BR"
):
    """
    Gerar relatório comparativo de forma assíncrona

    Args:
        tickers: Lista de tickers
        ai_provider: Provedor de IA
        language: Idioma do relatório

    Returns:
        Task ID para acompanhamento
    """
    logger.info(f"POST /reports/async/compare - {len(tickers)} ativos")

    try:
        task = generate_comparison_report_async.apply_async(
            args=[tickers, ai_provider, language]
        )

        return {
            "status": "queued",
            "task_id": task.id,
            "total_assets": len(tickers),
            "ai_provider": ai_provider,
            "message": "Geração de relatório comparativo iniciada"
        }

    except Exception as e:
        logger.error(f"Erro ao iniciar relatório comparativo: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reports/async/portfolio")
async def generate_portfolio_report_async_endpoint(
    portfolio_id: str,
    ai_provider: str = "openai",
    include_recommendations: bool = True
):
    """
    Gerar relatório de portfólio de forma assíncrona

    Args:
        portfolio_id: ID do portfólio
        ai_provider: Provedor de IA
        include_recommendations: Incluir recomendações

    Returns:
        Task ID para acompanhamento
    """
    logger.info(f"POST /reports/async/portfolio - {portfolio_id}")

    try:
        task = generate_portfolio_report_async.apply_async(
            args=[portfolio_id, ai_provider, include_recommendations]
        )

        return {
            "status": "queued",
            "task_id": task.id,
            "portfolio_id": portfolio_id,
            "message": "Geração de relatório de portfólio iniciada"
        }

    except Exception as e:
        logger.error(f"Erro ao iniciar relatório de portfólio: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reports/async/market-overview")
async def generate_market_overview_async_endpoint(
    market: str = "stocks",
    ai_provider: str = "openai",
    top_n: int = 10
):
    """
    Gerar visão geral do mercado de forma assíncrona

    Args:
        market: Mercado a analisar
        ai_provider: Provedor de IA
        top_n: Número de ativos principais

    Returns:
        Task ID para acompanhamento
    """
    logger.info(f"POST /reports/async/market-overview - market: {market}")

    try:
        task = generate_market_overview_async.apply_async(
            args=[market, ai_provider, top_n]
        )

        return {
            "status": "queued",
            "task_id": task.id,
            "market": market,
            "message": "Geração de visão geral do mercado iniciada"
        }

    except Exception as e:
        logger.error(f"Erro ao iniciar visão geral do mercado: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reports/async/multi-ai")
async def generate_multi_ai_analysis_async_endpoint(
    ticker: str,
    providers: Optional[List[str]] = None
):
    """
    Gerar análise multi-IA de forma assíncrona

    Args:
        ticker: Código do ativo
        providers: Lista de provedores (se None, usa todos)

    Returns:
        Task ID para acompanhamento
    """
    logger.info(f"POST /reports/async/multi-ai - {ticker}")

    try:
        task = generate_multi_ai_analysis.apply_async(
            args=[ticker, providers]
        )

        return {
            "status": "queued",
            "task_id": task.id,
            "ticker": ticker,
            "message": "Análise multi-IA iniciada"
        }

    except Exception as e:
        logger.error(f"Erro ao iniciar análise multi-IA: {e}")
        raise HTTPException(status_code=500, detail=str(e))
