"""
Tarefas assíncronas para coleta de dados
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from celery import Task
from loguru import logger

from ..celery_app import celery_app
from ..services import DataCollectionService
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
    name="app.tasks.data_collection.collect_asset_data_async",
    max_retries=3,
    default_retry_delay=60,
)
def collect_asset_data_async(self, ticker: str, force_update: bool = False) -> Dict[str, Any]:
    """
    Coletar dados de um ativo de forma assíncrona

    Args:
        ticker: Código do ativo
        force_update: Forçar atualização mesmo se dados estiverem frescos

    Returns:
        Dados coletados do ativo
    """
    try:
        logger.info(f"Iniciando coleta assíncrona de dados para {ticker}")

        service = DataCollectionService()
        result = service.collect_asset_data(ticker, force_update=force_update)

        logger.info(f"Coleta concluída para {ticker}: {result['sources_count']} fontes")
        return result

    except Exception as exc:
        logger.error(f"Erro ao coletar dados de {ticker}: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.data_collection.update_market_prices",
    max_retries=2,
)
def update_market_prices(self, tickers: List[str] = None) -> Dict[str, Any]:
    """
    Atualizar preços de mercado para múltiplos ativos

    Args:
        tickers: Lista de tickers (se None, atualiza todos os ativos ativos)

    Returns:
        Estatísticas da atualização
    """
    try:
        logger.info("Iniciando atualização de preços de mercado")

        service = DataCollectionService()

        # Se não forneceu tickers, buscar do banco
        if tickers is None:
            # TODO: Buscar lista de tickers ativos do banco
            tickers = ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3"]  # Mock

        results = {
            "total": len(tickers),
            "success": 0,
            "failed": 0,
            "errors": []
        }

        for ticker in tickers:
            try:
                service.collect_asset_data(ticker, force_update=True)
                results["success"] += 1
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({"ticker": ticker, "error": str(e)})
                logger.error(f"Erro ao atualizar {ticker}: {e}")

        logger.info(f"Atualização concluída: {results['success']}/{results['total']} sucessos")
        return results

    except Exception as exc:
        logger.error(f"Erro na atualização de preços: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.data_collection.update_fundamentals_batch",
    max_retries=2,
)
def update_fundamentals_batch(self, tickers: List[str] = None) -> Dict[str, Any]:
    """
    Atualizar dados fundamentais em lote

    Args:
        tickers: Lista de tickers (se None, atualiza todos)

    Returns:
        Estatísticas da atualização
    """
    try:
        logger.info("Iniciando atualização em lote de dados fundamentais")

        service = DataCollectionService()

        if tickers is None:
            # TODO: Buscar lista de tickers do banco
            tickers = ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3"]  # Mock

        results = {
            "total": len(tickers),
            "success": 0,
            "failed": 0,
            "updated_at": datetime.utcnow().isoformat()
        }

        for ticker in tickers:
            try:
                data = service.collect_asset_data(ticker, force_update=True)
                if data.get("fundamental_data"):
                    results["success"] += 1
            except Exception as e:
                results["failed"] += 1
                logger.error(f"Erro ao atualizar fundamentals de {ticker}: {e}")

        logger.info(f"Atualização de fundamentals: {results['success']}/{results['total']}")
        return results

    except Exception as exc:
        logger.error(f"Erro na atualização de fundamentals: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.data_collection.update_news_feed",
    max_retries=2,
)
def update_news_feed(self, limit: int = 100) -> Dict[str, Any]:
    """
    Atualizar feed de notícias

    Args:
        limit: Número máximo de notícias a coletar

    Returns:
        Estatísticas da coleta de notícias
    """
    try:
        logger.info(f"Atualizando feed de notícias (limit={limit})")

        service = DataCollectionService()

        # TODO: Implementar coleta de notícias de múltiplas fontes
        # Por enquanto retorna mock
        results = {
            "news_collected": 0,
            "sources": ["InfoMoney", "Valor", "B3"],
            "timestamp": datetime.utcnow().isoformat()
        }

        logger.info(f"Feed atualizado: {results['news_collected']} notícias")
        return results

    except Exception as exc:
        logger.error(f"Erro ao atualizar feed de notícias: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.data_collection.cleanup_old_data",
)
def cleanup_old_data(self, days_to_keep: int = 90) -> Dict[str, Any]:
    """
    Limpar dados antigos do banco

    Args:
        days_to_keep: Número de dias de dados a manter

    Returns:
        Estatísticas da limpeza
    """
    try:
        logger.info(f"Iniciando limpeza de dados antigos (>= {days_to_keep} dias)")

        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)

        # TODO: Implementar limpeza real no banco
        results = {
            "cutoff_date": cutoff_date.isoformat(),
            "tables_cleaned": ["technical_data", "news", "market_data"],
            "rows_deleted": 0,
            "space_freed_mb": 0
        }

        logger.info(f"Limpeza concluída: {results['rows_deleted']} linhas removidas")
        return results

    except Exception as exc:
        logger.error(f"Erro na limpeza de dados: {exc}")
        raise


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.data_collection.batch_collect_assets",
    max_retries=1,
)
def batch_collect_assets(self, tickers: List[str], force_update: bool = False) -> Dict[str, Any]:
    """
    Coletar dados de múltiplos ativos em lote

    Args:
        tickers: Lista de tickers
        force_update: Forçar atualização

    Returns:
        Resultados da coleta em lote
    """
    try:
        logger.info(f"Coleta em lote iniciada: {len(tickers)} ativos")

        service = DataCollectionService()
        results = service.batch_collect(tickers, force_update=force_update)

        logger.info(f"Coleta em lote concluída: {results['success_count']}/{results['total_count']}")
        return results

    except Exception as exc:
        logger.error(f"Erro na coleta em lote: {exc}")
        raise self.retry(exc=exc)
