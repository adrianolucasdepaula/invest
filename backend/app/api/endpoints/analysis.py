"""
API endpoints para Analysis (Análises)
Endpoints para análise de ativos e comparações
"""
from typing import List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from loguru import logger
from ...services import DataCollectionService, AnalysisService

router = APIRouter()
collection_service = DataCollectionService()
analysis_service = AnalysisService()


# Pydantic Models
class AnalyzeAssetRequest(BaseModel):
    ticker: str
    fetch_fresh_data: bool = False


class CompareAssetsRequest(BaseModel):
    tickers: List[str]
    fetch_fresh_data: bool = False


@router.post("/analysis/analyze")
async def analyze_asset(request: AnalyzeAssetRequest):
    """
    Analisa um ativo completo

    Args:
        request: Dados da requisição (ticker, fetch_fresh_data)

    Returns:
        Análise completa do ativo
    """
    logger.info(f"POST /analysis/analyze - ticker: {request.ticker}")

    try:
        # Coleta dados se necessário
        if request.fetch_fresh_data:
            asset_data = await collection_service.collect_all_data(request.ticker)
        else:
            # TODO: Buscar do cache/database
            asset_data = await collection_service.collect_all_data(request.ticker)

        # Analisa
        analysis = analysis_service.analyze_asset(asset_data)

        return {
            "ticker": request.ticker,
            "analysis": analysis,
            "data_source": "fresh" if request.fetch_fresh_data else "cached"
        }

    except Exception as e:
        logger.error(f"Erro ao analisar {request.ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analysis/compare")
async def compare_assets(request: CompareAssetsRequest):
    """
    Compara múltiplos ativos

    Args:
        request: Dados da requisição (tickers, fetch_fresh_data)

    Returns:
        Comparação detalhada dos ativos
    """
    logger.info(f"POST /analysis/compare - {len(request.tickers)} tickers")

    try:
        # Coleta dados de todos os ativos
        assets_data = []
        for ticker in request.tickers:
            if request.fetch_fresh_data:
                data = await collection_service.collect_all_data(ticker)
            else:
                # TODO: Buscar do cache/database
                data = await collection_service.collect_all_data(ticker)
            assets_data.append(data)

        # Compara
        comparison = analysis_service.compare_assets(assets_data)

        return {
            "total_assets": len(request.tickers),
            "tickers": request.tickers,
            "comparison": comparison,
            "data_source": "fresh" if request.fetch_fresh_data else "cached"
        }

    except Exception as e:
        logger.error(f"Erro ao comparar ativos: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/{ticker}/score")
async def get_asset_score(ticker: str):
    """
    Obtém score geral de um ativo

    Args:
        ticker: Código do ativo

    Returns:
        Score e recomendação
    """
    logger.info(f"GET /analysis/{ticker}/score")

    try:
        # Coleta dados
        asset_data = await collection_service.collect_all_data(ticker)

        # Analisa
        analysis = analysis_service.analyze_asset(asset_data)

        return {
            "ticker": ticker,
            "overall_score": analysis.get("overall_score", 0),
            "recommendation": analysis.get("recommendation", ""),
            "valuation": analysis.get("valuation_analysis", {}).get("overall_valuation", ""),
            "risk": analysis.get("risk_analysis", {}).get("overall_risk", ""),
        }

    except Exception as e:
        logger.error(f"Erro ao obter score de {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/{ticker}/fundamentals")
async def get_fundamental_analysis(ticker: str):
    """
    Obtém análise fundamentalista de um ativo

    Args:
        ticker: Código do ativo

    Returns:
        Análise fundamentalista detalhada
    """
    logger.info(f"GET /analysis/{ticker}/fundamentals")

    try:
        # Coleta dados
        asset_data = await collection_service.collect_all_data(ticker)

        # Analisa
        analysis = analysis_service.analyze_asset(asset_data)

        return {
            "ticker": ticker,
            "fundamental_analysis": analysis.get("fundamental_analysis", {}),
            "valuation_analysis": analysis.get("valuation_analysis", {}),
        }

    except Exception as e:
        logger.error(f"Erro ao obter análise fundamental de {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/{ticker}/technical")
async def get_technical_analysis(ticker: str):
    """
    Obtém análise técnica de um ativo

    Args:
        ticker: Código do ativo

    Returns:
        Análise técnica detalhada
    """
    logger.info(f"GET /analysis/{ticker}/technical")

    try:
        # Coleta dados
        asset_data = await collection_service.collect_all_data(ticker)

        # Analisa
        analysis = analysis_service.analyze_asset(asset_data)

        return {
            "ticker": ticker,
            "technical_analysis": analysis.get("technical_analysis", {}),
        }

    except Exception as e:
        logger.error(f"Erro ao obter análise técnica de {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/{ticker}/risk")
async def get_risk_analysis(ticker: str):
    """
    Obtém análise de risco de um ativo

    Args:
        ticker: Código do ativo

    Returns:
        Análise de risco detalhada
    """
    logger.info(f"GET /analysis/{ticker}/risk")

    try:
        # Coleta dados
        asset_data = await collection_service.collect_all_data(ticker)

        # Analisa
        analysis = analysis_service.analyze_asset(asset_data)

        return {
            "ticker": ticker,
            "risk_analysis": analysis.get("risk_analysis", {}),
        }

    except Exception as e:
        logger.error(f"Erro ao obter análise de risco de {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/opportunities")
async def get_opportunities(
    tickers: List[str] = None,
    min_score: float = 6.5
):
    """
    Identifica oportunidades de investimento

    Args:
        tickers: Lista de tickers para analisar (opcional)
        min_score: Score mínimo para considerar oportunidade

    Returns:
        Lista de oportunidades
    """
    logger.info(f"GET /analysis/opportunities - min_score: {min_score}")

    try:
        if not tickers:
            # TODO: Buscar top tickers do database
            tickers = ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3"]  # Default

        # Coleta dados de todos
        assets_data = []
        for ticker in tickers:
            data = await collection_service.collect_all_data(ticker)
            assets_data.append(data)

        # Compara e identifica oportunidades
        comparison = analysis_service.compare_assets(assets_data)

        # Filtra por score mínimo
        opportunities = [
            opp for opp in comparison.get("best_opportunities", [])
            if opp.get("score", 0) >= min_score
        ]

        return {
            "total_analyzed": len(tickers),
            "opportunities_found": len(opportunities),
            "opportunities": opportunities,
        }

    except Exception as e:
        logger.error(f"Erro ao buscar oportunidades: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analysis/rankings")
async def get_rankings(tickers: List[str] = None):
    """
    Obtém rankings de ativos

    Args:
        tickers: Lista de tickers para rankear

    Returns:
        Rankings por categoria
    """
    logger.info(f"GET /analysis/rankings")

    try:
        if not tickers:
            # TODO: Buscar top tickers do database
            tickers = ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3"]  # Default

        # Coleta dados de todos
        assets_data = []
        for ticker in tickers:
            data = await collection_service.collect_all_data(ticker)
            assets_data.append(data)

        # Compara
        comparison = analysis_service.compare_assets(assets_data)

        return {
            "total_assets": len(tickers),
            "rankings": comparison.get("rankings", {}),
        }

    except Exception as e:
        logger.error(f"Erro ao gerar rankings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
