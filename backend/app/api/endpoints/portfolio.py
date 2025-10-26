"""
API endpoints para Portfolio (Portfólio)
Endpoints para gerenciamento e análise de portfólios de investimento
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from loguru import logger

from ...core.database import get_db
from ...services.portfolio_service import PortfolioService

router = APIRouter()


# Pydantic Models
class AssetPosition(BaseModel):
    ticker: str
    quantity: float
    average_price: float
    current_price: Optional[float] = None
    asset_type: str = "stock"  # stock, fii, option, crypto


class Portfolio(BaseModel):
    name: str
    description: Optional[str] = None
    positions: List[AssetPosition]
    currency: str = "BRL"
    created_at: Optional[str] = None


class ImportPortfolioRequest(BaseModel):
    source: str  # "cei", "clear", "btg", "xp", "custom"
    data: Dict[str, Any]


class UpdatePositionRequest(BaseModel):
    ticker: str
    quantity: float
    average_price: float
    operation: str = "add"  # add, remove, update


@router.post("/portfolio/create")
async def create_portfolio(portfolio: Portfolio, db: Session = Depends(get_db)):
    """
    Cria um novo portfólio

    Args:
        portfolio: Dados do portfólio
        db: Sessão do banco de dados

    Returns:
        Portfólio criado com ID
    """
    logger.info(f"POST /portfolio/create - {portfolio.name}")

    try:
        service = PortfolioService(db)
        portfolio_data = portfolio.dict()

        # Salvar no database
        result = await service.save_portfolio(portfolio_data)

        logger.info(f"Portfólio '{portfolio.name}' criado com {len(portfolio.positions)} posições")

        return {
            "status": "success",
            "message": "Portfólio criado com sucesso",
            "portfolio": result,
        }

    except Exception as e:
        logger.error(f"Erro ao criar portfólio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/portfolio/import")
async def import_portfolio(request: ImportPortfolioRequest):
    """
    Importa portfólio de diferentes fontes (CEI, Clear, BTG, XP, etc.)

    Args:
        request: Dados da importação (source, data)

    Returns:
        Portfólio importado
    """
    logger.info(f"POST /portfolio/import - source: {request.source}")

    try:
        # TODO: Implementar parsers para cada fonte
        supported_sources = ["cei", "clear", "btg", "xp", "custom"]

        if request.source not in supported_sources:
            raise HTTPException(
                status_code=400,
                detail=f"Fonte '{request.source}' não suportada. Fontes disponíveis: {supported_sources}"
            )

        # Mock de importação
        portfolio_data = {
            "id": "imported_123",
            "source": request.source,
            "imported_at": datetime.utcnow().isoformat(),
            "status": "success",
            "positions": [],  # TODO: Parse data
            "message": f"Portfólio importado de {request.source} (implementação pendente)"
        }

        return portfolio_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao importar portfólio: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/portfolio/{portfolio_id}")
async def get_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    """
    Obtém dados de um portfólio

    Args:
        portfolio_id: ID do portfólio
        db: Sessão do banco de dados

    Returns:
        Dados completos do portfólio
    """
    logger.info(f"GET /portfolio/{portfolio_id}")

    try:
        service = PortfolioService(db)

        # Buscar do database
        portfolio = await service.get_portfolio(portfolio_id)

        if not portfolio:
            raise HTTPException(
                status_code=404,
                detail=f"Portfólio {portfolio_id} não encontrado"
            )

        return {
            "status": "success",
            "portfolio": portfolio,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter portfólio {portfolio_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/portfolio/{portfolio_id}/summary")
async def get_portfolio_summary(portfolio_id: int, db: Session = Depends(get_db)):
    """
    Obtém resumo do portfólio

    Args:
        portfolio_id: ID do portfólio
        db: Sessão do banco de dados

    Returns:
        Resumo financeiro do portfólio
    """
    logger.info(f"GET /portfolio/{portfolio_id}/summary")

    try:
        service = PortfolioService(db)

        # Buscar portfólio do database
        portfolio = await service.get_portfolio(portfolio_id)

        if not portfolio:
            raise HTTPException(
                status_code=404,
                detail=f"Portfólio {portfolio_id} não encontrado"
            )

        # Calcular resumo a partir dos dados do portfólio
        positions = portfolio.get("positions", [])
        total_invested = sum(p.get("total_invested", 0) for p in positions)
        current_value = sum(p.get("current_value", 0) for p in positions)
        total_profit_loss = current_value - total_invested
        total_profit_loss_percent = (total_profit_loss / total_invested * 100) if total_invested > 0 else 0

        # Calcular alocações
        asset_allocation = {}
        sector_allocation = {}

        for position in positions:
            asset_type = position.get("asset_type", "other")
            sector = position.get("sector", "Outros")
            value = position.get("current_value", 0)

            asset_allocation[asset_type] = asset_allocation.get(asset_type, 0) + value
            sector_allocation[sector] = sector_allocation.get(sector, 0) + value

        # Converter para percentuais
        if current_value > 0:
            asset_allocation = {k: (v / current_value * 100) for k, v in asset_allocation.items()}
            sector_allocation = {k: (v / current_value * 100) for k, v in sector_allocation.items()}

        # Top gainers/losers
        positions_with_perf = [(p, p.get("profit_loss_percent", 0)) for p in positions]
        positions_with_perf.sort(key=lambda x: x[1], reverse=True)

        top_gainers = [{"ticker": p[0].get("ticker"), "profit_percent": p[1]}
                       for p in positions_with_perf if p[1] > 0][:5]
        top_losers = [{"ticker": p[0].get("ticker"), "profit_percent": p[1]}
                      for p in positions_with_perf if p[1] < 0][-5:]

        summary = {
            "portfolio_id": portfolio_id,
            "total_invested": total_invested,
            "current_value": current_value,
            "total_profit_loss": total_profit_loss,
            "total_profit_loss_percent": total_profit_loss_percent,
            "total_positions": len(positions),
            "asset_allocation": asset_allocation,
            "sector_allocation": sector_allocation,
            "top_gainers": top_gainers,
            "top_losers": top_losers,
            "updated_at": datetime.utcnow().isoformat()
        }

        return {
            "status": "success",
            "summary": summary,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter resumo do portfólio {portfolio_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/portfolio/{portfolio_id}/performance")
async def get_portfolio_performance(
    portfolio_id: int,
    period: str = "1M",  # 1D, 1W, 1M, 3M, 6M, 1Y, YTD, ALL
    db: Session = Depends(get_db)
):
    """
    Obtém performance histórica do portfólio

    Args:
        portfolio_id: ID do portfólio
        period: Período de análise
        db: Sessão do banco de dados

    Returns:
        Métricas de performance do portfólio
    """
    logger.info(f"GET /portfolio/{portfolio_id}/performance - period: {period}")

    try:
        valid_periods = ["1D", "1W", "1M", "3M", "6M", "1Y", "YTD", "ALL"]
        if period not in valid_periods:
            raise HTTPException(
                status_code=400,
                detail=f"Período inválido. Períodos válidos: {valid_periods}"
            )

        service = PortfolioService(db)

        # Buscar portfólio do database
        portfolio = await service.get_portfolio(portfolio_id)

        if not portfolio:
            raise HTTPException(
                status_code=404,
                detail=f"Portfólio {portfolio_id} não encontrado"
            )

        # Calcular métricas básicas
        positions = portfolio.get("positions", [])
        total_invested = sum(p.get("total_invested", 0) for p in positions)
        current_value = sum(p.get("current_value", 0) for p in positions)
        total_return_value = current_value - total_invested
        total_return_percent = (total_return_value / total_invested * 100) if total_invested > 0 else 0

        # TODO: Buscar dados históricos do database para cálculos reais
        # Por enquanto, usar dados simulados para demonstração dos métodos
        # Simular retornos diários (lista de retornos percentuais)
        mock_returns = [0.005, -0.002, 0.008, -0.003, 0.004] * 10  # 50 dias de retornos simulados
        mock_prices = [total_invested * (1 + sum(mock_returns[:i])) for i in range(1, len(mock_returns) + 1)]
        mock_trades = [{"profit_loss": 150}, {"profit_loss": -50}, {"profit_loss": 100}, {"profit_loss": 75}]

        # Calcular métricas usando o service
        annualized_return = service.calculate_annualized_return(mock_returns, len(mock_returns))
        volatility = service.calculate_volatility(mock_returns)
        sharpe_ratio = service.calculate_sharpe_ratio(mock_returns)
        max_drawdown = service.calculate_max_drawdown(mock_prices)
        win_rate = service.calculate_win_rate(mock_trades)

        performance = {
            "portfolio_id": portfolio_id,
            "period": period,
            "metrics": {
                "total_return": round(total_return_percent, 2),
                "total_return_value": round(total_return_value, 2),
                "annualized_return": round(annualized_return, 2),
                "volatility": round(volatility, 2),
                "sharpe_ratio": sharpe_ratio,
                "max_drawdown": round(max_drawdown, 2),
                "win_rate": round(win_rate, 2),
            },
            "historical_data": [
                # TODO: Implementar busca de dados históricos reais do database
            ],
            "benchmark_comparison": {
                "portfolio_return": round(total_return_percent, 2),
                "ibovespa_return": 3.50,  # TODO: Buscar dados reais
                "cdi_return": 0.89,  # TODO: Buscar dados reais
                "outperformance_ibov": round(total_return_percent - 3.50, 2),
                "outperformance_cdi": round(total_return_percent - 0.89, 2)
            },
            "note": "Métricas calculadas com dados históricos simulados. Implementar busca de dados reais do database.",
            "calculated_at": datetime.utcnow().isoformat()
        }

        return {
            "status": "success",
            "performance": performance,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao calcular performance do portfólio {portfolio_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/portfolio/{portfolio_id}/position")
async def add_or_update_position(
    portfolio_id: int,
    request: UpdatePositionRequest
):
    """
    Adiciona ou atualiza posição no portfólio

    Args:
        portfolio_id: ID do portfólio
        request: Dados da posição

    Returns:
        Posição atualizada
    """
    logger.info(f"POST /portfolio/{portfolio_id}/position - {request.operation} {request.ticker}")

    try:
        valid_operations = ["add", "remove", "update"]
        if request.operation not in valid_operations:
            raise HTTPException(
                status_code=400,
                detail=f"Operação inválida. Operações válidas: {valid_operations}"
            )

        # TODO: Implementar método update_position() no PortfolioService
        # Por enquanto, retornar mock de sucesso
        position = {
            "portfolio_id": portfolio_id,
            "ticker": request.ticker,
            "quantity": request.quantity,
            "average_price": request.average_price,
            "operation": request.operation,
            "updated_at": datetime.utcnow().isoformat(),
            "message": f"Posição {request.operation} com sucesso (implementação pendente)"
        }

        return {
            "status": "success",
            "position": position,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar posição no portfólio {portfolio_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/portfolio/{portfolio_id}/position/{ticker}")
async def remove_position(portfolio_id: int, ticker: str):
    """
    Remove posição do portfólio

    Args:
        portfolio_id: ID do portfólio
        ticker: Ticker da posição a remover

    Returns:
        Confirmação de remoção
    """
    logger.info(f"DELETE /portfolio/{portfolio_id}/position/{ticker}")

    try:
        # TODO: Implementar método remove_position() no PortfolioService
        # Por enquanto, retornar mock de sucesso
        return {
            "status": "success",
            "message": f"Posição {ticker} removida do portfólio {portfolio_id} (implementação pendente)",
            "removed_at": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Erro ao remover posição {ticker} do portfólio {portfolio_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/portfolio/{portfolio_id}/allocation")
async def get_portfolio_allocation(portfolio_id: int, db: Session = Depends(get_db)):
    """
    Obtém alocação detalhada do portfólio

    Args:
        portfolio_id: ID do portfólio
        db: Sessão do banco de dados

    Returns:
        Alocação por tipo de ativo, setor, etc.
    """
    logger.info(f"GET /portfolio/{portfolio_id}/allocation")

    try:
        service = PortfolioService(db)

        # Buscar portfólio do database
        portfolio = await service.get_portfolio(portfolio_id)

        if not portfolio:
            raise HTTPException(
                status_code=404,
                detail=f"Portfólio {portfolio_id} não encontrado"
            )

        # Calcular alocação a partir dos dados do portfólio
        positions = portfolio.get("positions", [])
        total_value = sum(p.get("current_value", 0) for p in positions)

        # Alocação por tipo de ativo
        by_asset_type = {}
        for position in positions:
            asset_type = position.get("asset_type", "other")
            value = position.get("current_value", 0)

            if asset_type not in by_asset_type:
                by_asset_type[asset_type] = {"count": 0, "value": 0.0, "percentage": 0.0}

            by_asset_type[asset_type]["count"] += 1
            by_asset_type[asset_type]["value"] += value

        # Calcular percentuais
        for asset_type in by_asset_type:
            by_asset_type[asset_type]["percentage"] = (
                by_asset_type[asset_type]["value"] / total_value * 100
            ) if total_value > 0 else 0.0

        # Alocação por setor
        by_sector = {}
        for position in positions:
            sector = position.get("sector", "Outros")
            value = position.get("current_value", 0)

            if sector not in by_sector:
                by_sector[sector] = {"count": 0, "value": 0.0, "percentage": 0.0}

            by_sector[sector]["count"] += 1
            by_sector[sector]["value"] += value

        # Calcular percentuais
        for sector in by_sector:
            by_sector[sector]["percentage"] = (
                by_sector[sector]["value"] / total_value * 100
            ) if total_value > 0 else 0.0

        # Calcular índice de concentração (Herfindahl-Hirschman Index)
        hhi = sum((p.get("current_value", 0) / total_value) ** 2 for p in positions) if total_value > 0 else 0

        # Ordenar posições por valor
        sorted_positions = sorted(positions, key=lambda x: x.get("current_value", 0), reverse=True)
        top_5_value = sum(p.get("current_value", 0) for p in sorted_positions[:5])
        top_10_value = sum(p.get("current_value", 0) for p in sorted_positions[:10])

        # Score de diversificação (0-10)
        # Baseado em número de posições e concentração
        num_positions = len(positions)
        diversification_score = min(10, (num_positions / 2) * (1 - hhi))

        # Recomendações
        recommendations = []
        if hhi > 0.25:
            recommendations.append("Portfólio concentrado - considere diversificar em mais ativos")
        if len(by_sector) < 3:
            recommendations.append("Considere diversificar em mais setores")
        if "fii" not in by_asset_type and "fiis" not in by_asset_type:
            recommendations.append("Considere adicionar FIIs para diversificação e renda passiva")
        if diversification_score < 5:
            recommendations.append("Score de diversificação baixo - aumente o número de posições")

        allocation = {
            "portfolio_id": portfolio_id,
            "by_asset_type": by_asset_type,
            "by_sector": by_sector,
            "concentration": {
                "top_5_positions": (top_5_value / total_value * 100) if total_value > 0 else 0.0,
                "top_10_positions": (top_10_value / total_value * 100) if total_value > 0 else 0.0,
                "herfindahl_index": round(hhi, 4)
            },
            "diversification_score": round(diversification_score, 1),
            "recommendations": recommendations,
            "calculated_at": datetime.utcnow().isoformat()
        }

        return {
            "status": "success",
            "allocation": allocation,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao calcular alocação do portfólio {portfolio_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/portfolio/{portfolio_id}/dividends")
async def get_portfolio_dividends(
    portfolio_id: int,
    period: str = "1Y"
):
    """
    Obtém histórico e projeção de dividendos do portfólio

    Args:
        portfolio_id: ID do portfólio
        period: Período de análise

    Returns:
        Dados de dividendos
    """
    logger.info(f"GET /portfolio/{portfolio_id}/dividends - period: {period}")

    try:
        # TODO: Implementar cálculo de dividendos reais no PortfolioService
        # TODO: Buscar histórico de dividendos do database
        # TODO: Projetar próximos pagamentos baseado em histórico
        dividends = {
            "portfolio_id": portfolio_id,
            "period": period,
            "total_received": 250.00,  # Mock
            "dividend_yield": 3.97,  # Mock: 250/6300
            "monthly_average": 20.83,  # Mock
            "by_ticker": [
                {
                    "ticker": "PETR4",
                    "total": 150.00,
                    "yield": 4.92,
                    "payments": 3
                },
                {
                    "ticker": "VALE3",
                    "total": 100.00,
                    "yield": 3.08,
                    "payments": 2
                }
            ],
            "next_payments": [
                # TODO: Próximos pagamentos previstos
            ],
            "projection_12m": 300.00,  # Mock
            "note": "Dados mockados - implementação de dividendos pendente",
            "calculated_at": datetime.utcnow().isoformat()
        }

        return {
            "status": "success",
            "dividends": dividends,
        }

    except Exception as e:
        logger.error(f"Erro ao calcular dividendos do portfólio {portfolio_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/portfolios")
async def list_portfolios():
    """
    Lista todos os portfólios do usuário

    Returns:
        Lista de portfólios
    """
    logger.info(f"GET /portfolios")

    try:
        # TODO: Buscar do database
        portfolios = [
            {
                "id": "portfolio_1",
                "name": "Meu Portfólio Principal",
                "total_value": 6625.00,
                "total_profit_loss": 325.00,
                "total_profit_loss_percent": 5.16,
                "positions_count": 2,
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": datetime.utcnow().isoformat()
            }
        ]

        return {
            "status": "success",
            "total": len(portfolios),
            "portfolios": portfolios,
        }

    except Exception as e:
        logger.error(f"Erro ao listar portfólios: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/portfolio/{portfolio_id}")
async def delete_portfolio(portfolio_id: int, db: Session = Depends(get_db)):
    """
    Remove um portfólio

    Args:
        portfolio_id: ID do portfólio
        db: Sessão do banco de dados

    Returns:
        Confirmação de remoção
    """
    logger.info(f"DELETE /portfolio/{portfolio_id}")

    try:
        service = PortfolioService(db)

        # Remover do database
        success = await service.delete_portfolio(portfolio_id)

        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Portfólio {portfolio_id} não encontrado"
            )

        return {
            "status": "success",
            "message": f"Portfólio {portfolio_id} removido com sucesso",
            "deleted_at": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao remover portfólio {portfolio_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
