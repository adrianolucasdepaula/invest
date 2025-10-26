"""
API endpoints para Assets (Ativos)
Endpoints para coleta e consulta de dados de ativos
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from loguru import logger
from ...services import DataCollectionService, AnalysisService

router = APIRouter()
collection_service = DataCollectionService()
analysis_service = AnalysisService()


# Pydantic Models
class AssetDataResponse(BaseModel):
    ticker: str
    collected_at: str
    fundamental: Optional[dict] = None
    technical: Optional[dict] = None
    options: Optional[dict] = None
    news: Optional[dict] = None
    macroeconomic: Optional[dict] = None
    insider: Optional[dict] = None
    errors: List[str] = []
    sources_used: int = 0


class CollectDataRequest(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    force_refresh: bool = False


@router.get("/assets/{ticker}", response_model=AssetDataResponse)
async def get_asset_data(
    ticker: str,
    include_fundamental: bool = Query(True),
    include_technical: bool = Query(True),
    include_news: bool = Query(True),
    include_options: bool = Query(False),
    include_insider: bool = Query(False),
):
    """
    Obtém dados consolidados de um ativo

    Args:
        ticker: Código do ativo (ex: PETR4, VALE3)
        include_*: Flags para incluir/excluir tipos de dados
    """
    logger.info(f"GET /assets/{ticker}")

    try:
        # TODO: Verificar cache primeiro
        # Por enquanto, sempre coleta dados novos
        data = await collection_service.collect_all_data(ticker)

        # Filtra dados conforme flags
        if not include_fundamental:
            data["fundamental"] = None
        if not include_technical:
            data["technical"] = None
        if not include_news:
            data["news"] = None
        if not include_options:
            data["options"] = None
        if not include_insider:
            data["insider"] = None

        return data

    except Exception as e:
        logger.error(f"Erro ao obter dados de {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assets/collect")
async def collect_asset_data(
    request: CollectDataRequest,
    background_tasks: BackgroundTasks
):
    """
    Inicia coleta de dados de um ativo (pode ser executada em background)

    Args:
        request: Dados da requisição
        background_tasks: Para execução em background
    """
    logger.info(f"POST /assets/collect - ticker: {request.ticker}")

    try:
        # Executa coleta em background
        background_tasks.add_task(
            collection_service.collect_all_data,
            request.ticker,
            company_name=request.company_name
        )

        return {
            "status": "collecting",
            "ticker": request.ticker,
            "message": "Coleta iniciada em background"
        }

    except Exception as e:
        logger.error(f"Erro ao iniciar coleta de {request.ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/assets/batch-collect")
async def batch_collect(
    tickers: List[str],
    background_tasks: BackgroundTasks
):
    """
    Inicia coleta de dados de múltiplos ativos em batch

    Args:
        tickers: Lista de tickers
        background_tasks: Para execução em background
    """
    logger.info(f"POST /assets/batch-collect - {len(tickers)} tickers")

    try:
        # Executa coleta em background
        background_tasks.add_task(
            collection_service.update_all_assets,
            tickers
        )

        return {
            "status": "collecting",
            "total_assets": len(tickers),
            "tickers": tickers,
            "message": "Coleta em batch iniciada em background"
        }

    except Exception as e:
        logger.error(f"Erro ao iniciar batch collect: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assets/{ticker}/fundamental")
async def get_fundamental_data(ticker: str):
    """Obtém apenas dados fundamentalistas de um ativo"""
    logger.info(f"GET /assets/{ticker}/fundamental")

    try:
        data = await collection_service.collect_fundamental_data(ticker)
        return {"ticker": ticker, "fundamental": data}

    except Exception as e:
        logger.error(f"Erro ao obter dados fundamentais de {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assets/{ticker}/technical")
async def get_technical_data(ticker: str):
    """Obtém apenas dados técnicos de um ativo"""
    logger.info(f"GET /assets/{ticker}/technical")

    try:
        data = await collection_service.collect_technical_data(ticker)
        return {"ticker": ticker, "technical": data}

    except Exception as e:
        logger.error(f"Erro ao obter dados técnicos de {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assets/{ticker}/news")
async def get_news_data(
    ticker: str,
    company_name: Optional[str] = None
):
    """Obtém apenas notícias de um ativo"""
    logger.info(f"GET /assets/{ticker}/news")

    try:
        data = await collection_service.collect_news_data(
            ticker,
            company_name=company_name
        )
        return {"ticker": ticker, "news": data}

    except Exception as e:
        logger.error(f"Erro ao obter notícias de {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/assets/{ticker}/insider")
async def get_insider_data(ticker: str):
    """Obtém dados de insiders de um ativo"""
    logger.info(f"GET /assets/{ticker}/insider")

    try:
        data = await collection_service.collect_insider_data(ticker)
        return {"ticker": ticker, "insider": data}

    except Exception as e:
        logger.error(f"Erro ao obter dados de insiders de {ticker}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/crypto/{symbol}")
async def get_crypto_data(symbol: str):
    """Obtém dados de criptomoeda"""
    logger.info(f"GET /crypto/{symbol}")

    try:
        data = await collection_service.collect_crypto_data(symbol)
        return {"symbol": symbol, "data": data}

    except Exception as e:
        logger.error(f"Erro ao obter dados de crypto {symbol}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/market/economic-calendar")
async def get_economic_calendar(
    country: str = Query("brazil"),
    importance: int = Query(2, ge=1, le=3),
    days: int = Query(7, ge=1, le=30)
):
    """
    Obtém calendário econômico

    Args:
        country: País (brazil, united-states, world)
        importance: Importância mínima (1-3)
        days: Dias à frente (1-30)
    """
    logger.info(f"GET /market/economic-calendar - country: {country}")

    try:
        data = await collection_service.collect_macroeconomic_data(
            country=country,
            importance=importance,
            days=days
        )
        return data

    except Exception as e:
        logger.error(f"Erro ao obter calendário econômico: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
