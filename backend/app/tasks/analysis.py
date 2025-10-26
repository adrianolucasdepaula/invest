"""
Tarefas assíncronas para análises de ativos e portfólios
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from celery import Task, group
from loguru import logger

from ..celery_app import celery_app
from ..services import AnalysisService
from ..core.database import SessionLocal


class DatabaseTask(Task):
    """Classe base para tarefas que usam banco de dados"""
    _db = None

    @property
    def db(self):
        if self._db is None:
            self._db = SessionLocal()
        return self._db

    def after_return(self, *args, **kwargs):
        if self._db is not None:
            self._db.close()
            self._db = None


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.analysis.analyze_asset_async",
    max_retries=3,
    default_retry_delay=30,
)
def analyze_asset_async(
    self,
    ticker: str,
    include_ai: bool = False,
    cache_result: bool = True
) -> Dict[str, Any]:
    """
    Analisar um ativo de forma assíncrona

    Args:
        ticker: Código do ativo
        include_ai: Incluir análise com IA
        cache_result: Cachear resultado

    Returns:
        Análise completa do ativo
    """
    try:
        logger.info(f"Iniciando análise assíncrona de {ticker}")

        service = AnalysisService()
        result = service.analyze_asset(ticker, include_ai=include_ai)

        logger.info(f"Análise de {ticker} concluída: score={result.get('overall_score', 0):.2f}")
        return result

    except Exception as exc:
        logger.error(f"Erro ao analisar {ticker}: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.analysis.compare_assets_async",
    max_retries=2,
)
def compare_assets_async(
    self,
    tickers: List[str],
    criteria: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Comparar múltiplos ativos de forma assíncrona

    Args:
        tickers: Lista de tickers a comparar
        criteria: Critérios de comparação

    Returns:
        Comparação completa dos ativos
    """
    try:
        logger.info(f"Iniciando comparação assíncrona de {len(tickers)} ativos")

        service = AnalysisService()
        result = service.compare_assets(tickers, criteria=criteria)

        winner = result.get("winner", {})
        logger.info(f"Comparação concluída. Melhor: {winner.get('ticker', 'N/A')}")
        return result

    except Exception as exc:
        logger.error(f"Erro ao comparar ativos: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.analysis.analyze_all_portfolios",
    max_retries=1,
)
def analyze_all_portfolios(self) -> Dict[str, Any]:
    """
    Analisar todos os portfólios ativos

    Returns:
        Estatísticas da análise de portfólios
    """
    try:
        logger.info("Iniciando análise de todos os portfólios")

        # TODO: Buscar todos os portfólios ativos do banco
        portfolio_ids = []  # Mock

        results = {
            "total_portfolios": len(portfolio_ids),
            "analyzed": 0,
            "failed": 0,
            "timestamp": datetime.utcnow().isoformat()
        }

        for portfolio_id in portfolio_ids:
            try:
                # Chamar tarefa de análise de portfólio
                calculate_portfolio_metrics.delay(portfolio_id)
                results["analyzed"] += 1
            except Exception as e:
                results["failed"] += 1
                logger.error(f"Erro ao analisar portfólio {portfolio_id}: {e}")

        logger.info(f"Análise de portfólios: {results['analyzed']}/{results['total_portfolios']}")
        return results

    except Exception as exc:
        logger.error(f"Erro na análise de portfólios: {exc}")
        raise


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.analysis.calculate_portfolio_metrics",
    max_retries=2,
)
def calculate_portfolio_metrics(self, portfolio_id: str) -> Dict[str, Any]:
    """
    Calcular métricas de um portfólio

    Args:
        portfolio_id: ID do portfólio

    Returns:
        Métricas calculadas do portfólio
    """
    try:
        logger.info(f"Calculando métricas do portfólio {portfolio_id}")

        # TODO: Implementar cálculo real de métricas
        metrics = {
            "portfolio_id": portfolio_id,
            "total_value": 0.0,
            "total_invested": 0.0,
            "return_percent": 0.0,
            "sharpe_ratio": 0.0,
            "volatility": 0.0,
            "max_drawdown": 0.0,
            "calculated_at": datetime.utcnow().isoformat()
        }

        logger.info(f"Métricas calculadas para portfólio {portfolio_id}")
        return metrics

    except Exception as exc:
        logger.error(f"Erro ao calcular métricas do portfólio {portfolio_id}: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.analysis.batch_analyze_assets",
    max_retries=1,
)
def batch_analyze_assets(
    self,
    tickers: List[str],
    include_ai: bool = False
) -> Dict[str, Any]:
    """
    Analisar múltiplos ativos em lote usando tarefas paralelas

    Args:
        tickers: Lista de tickers
        include_ai: Incluir análise com IA

    Returns:
        Resultados agregados das análises
    """
    try:
        logger.info(f"Iniciando análise em lote de {len(tickers)} ativos")

        # Criar grupo de tarefas paralelas
        job = group(
            analyze_asset_async.s(ticker, include_ai=include_ai)
            for ticker in tickers
        )

        # Executar em paralelo
        result = job.apply_async()
        analyses = result.get(timeout=300)  # 5 minutos de timeout

        results = {
            "total": len(tickers),
            "success": len([a for a in analyses if a is not None]),
            "analyses": analyses,
            "timestamp": datetime.utcnow().isoformat()
        }

        logger.info(f"Análise em lote concluída: {results['success']}/{results['total']}")
        return results

    except Exception as exc:
        logger.error(f"Erro na análise em lote: {exc}")
        raise


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.analysis.detect_opportunities",
    max_retries=2,
)
def detect_opportunities(
    self,
    market: str = "stocks",
    min_score: float = 7.0
) -> Dict[str, Any]:
    """
    Detectar oportunidades de investimento

    Args:
        market: Mercado a analisar (stocks, fiis, bdrs, cryptos)
        min_score: Score mínimo para considerar oportunidade

    Returns:
        Lista de oportunidades detectadas
    """
    try:
        logger.info(f"Detectando oportunidades no mercado {market} (min_score={min_score})")

        service = AnalysisService()
        opportunities = service.get_opportunities(market=market, min_score=min_score)

        logger.info(f"{len(opportunities)} oportunidades detectadas em {market}")
        return {
            "market": market,
            "min_score": min_score,
            "opportunities": opportunities,
            "count": len(opportunities),
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as exc:
        logger.error(f"Erro ao detectar oportunidades: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.analysis.update_asset_rankings",
    max_retries=1,
)
def update_asset_rankings(self, market: str = "stocks") -> Dict[str, Any]:
    """
    Atualizar rankings de ativos

    Args:
        market: Mercado a atualizar rankings

    Returns:
        Estatísticas da atualização de rankings
    """
    try:
        logger.info(f"Atualizando rankings do mercado {market}")

        service = AnalysisService()
        rankings = service.get_rankings(market=market, limit=100)

        # TODO: Salvar rankings no cache/banco para consulta rápida

        logger.info(f"Rankings atualizados: {len(rankings)} ativos em {market}")
        return {
            "market": market,
            "assets_ranked": len(rankings),
            "top_asset": rankings[0] if rankings else None,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as exc:
        logger.error(f"Erro ao atualizar rankings: {exc}")
        raise
