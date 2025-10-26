"""
Módulo de agendamento e controle de tarefas periódicas
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from celery import chain, group, chord
from loguru import logger

from ..celery_app import celery_app
from .data_collection import (
    update_market_prices,
    update_fundamentals_batch,
    update_news_feed,
)
from .analysis import (
    analyze_all_portfolios,
    detect_opportunities,
    update_asset_rankings,
)
from .reports import schedule_weekly_reports


class TaskScheduler:
    """Gerenciador de agendamento de tarefas"""

    @staticmethod
    def schedule_market_data_update(tickers: Optional[List[str]] = None) -> str:
        """
        Agendar atualização completa de dados de mercado

        Args:
            tickers: Lista de tickers (se None, atualiza todos)

        Returns:
            ID da tarefa agendada
        """
        logger.info("Agendando atualização de dados de mercado")

        # Criar workflow: preços -> fundamentals -> análise
        workflow = chain(
            update_market_prices.si(tickers),
            update_fundamentals_batch.si(tickers),
            detect_opportunities.si()
        )

        result = workflow.apply_async()
        logger.info(f"Workflow agendado: {result.id}")
        return result.id

    @staticmethod
    def schedule_portfolio_analysis(portfolio_ids: Optional[List[str]] = None) -> str:
        """
        Agendar análise completa de portfólios

        Args:
            portfolio_ids: IDs dos portfólios (se None, analisa todos)

        Returns:
            ID da tarefa agendada
        """
        logger.info("Agendando análise de portfólios")

        task = analyze_all_portfolios.apply_async()
        logger.info(f"Análise de portfólios agendada: {task.id}")
        return task.id

    @staticmethod
    def schedule_daily_routine() -> Dict[str, str]:
        """
        Agendar rotina diária completa

        Returns:
            IDs das tarefas agendadas
        """
        logger.info("Agendando rotina diária")

        tasks = {
            "market_update": update_market_prices.apply_async().id,
            "fundamentals": update_fundamentals_batch.apply_async().id,
            "news": update_news_feed.apply_async().id,
            "portfolios": analyze_all_portfolios.apply_async().id,
        }

        logger.info(f"Rotina diária agendada: {len(tasks)} tarefas")
        return tasks

    @staticmethod
    def schedule_market_scan(markets: Optional[List[str]] = None) -> str:
        """
        Agendar varredura completa do mercado

        Args:
            markets: Lista de mercados a varrer (stocks, fiis, bdrs, cryptos)

        Returns:
            ID do grupo de tarefas
        """
        if markets is None:
            markets = ["stocks", "fiis", "bdrs", "cryptos"]

        logger.info(f"Agendando varredura de {len(markets)} mercados")

        # Criar tarefas paralelas para cada mercado
        tasks = group(
            chain(
                update_asset_rankings.si(market),
                detect_opportunities.si(market)
            )
            for market in markets
        )

        result = tasks.apply_async()
        logger.info(f"Varredura de mercado agendada: {result.id}")
        return result.id

    @staticmethod
    def schedule_weekly_reports_batch(portfolio_ids: Optional[List[str]] = None) -> str:
        """
        Agendar geração de relatórios semanais em lote

        Args:
            portfolio_ids: IDs dos portfólios

        Returns:
            ID da tarefa agendada
        """
        logger.info("Agendando relatórios semanais")

        task = schedule_weekly_reports.apply_async(args=[portfolio_ids])
        logger.info(f"Relatórios semanais agendados: {task.id}")
        return task.id

    @staticmethod
    def get_task_status(task_id: str) -> Dict[str, Any]:
        """
        Obter status de uma tarefa

        Args:
            task_id: ID da tarefa

        Returns:
            Status da tarefa
        """
        from celery.result import AsyncResult

        result = AsyncResult(task_id, app=celery_app)

        status = {
            "task_id": task_id,
            "state": result.state,
            "ready": result.ready(),
            "successful": result.successful() if result.ready() else None,
            "failed": result.failed() if result.ready() else None,
        }

        if result.ready():
            if result.successful():
                status["result"] = result.result
            elif result.failed():
                status["error"] = str(result.info)

        return status

    @staticmethod
    def cancel_task(task_id: str) -> bool:
        """
        Cancelar uma tarefa

        Args:
            task_id: ID da tarefa

        Returns:
            True se cancelada com sucesso
        """
        try:
            celery_app.control.revoke(task_id, terminate=True)
            logger.info(f"Tarefa {task_id} cancelada")
            return True
        except Exception as e:
            logger.error(f"Erro ao cancelar tarefa {task_id}: {e}")
            return False

    @staticmethod
    def get_active_tasks() -> List[Dict[str, Any]]:
        """
        Listar todas as tarefas ativas

        Returns:
            Lista de tarefas ativas
        """
        inspect = celery_app.control.inspect()
        active_tasks = []

        # Obter tarefas ativas de todos os workers
        active = inspect.active()
        if active:
            for worker, tasks in active.items():
                for task in tasks:
                    active_tasks.append({
                        "worker": worker,
                        "task_id": task["id"],
                        "name": task["name"],
                        "args": task["args"],
                        "kwargs": task["kwargs"],
                    })

        return active_tasks

    @staticmethod
    def get_scheduled_tasks() -> List[Dict[str, Any]]:
        """
        Listar todas as tarefas agendadas

        Returns:
            Lista de tarefas agendadas
        """
        inspect = celery_app.control.inspect()
        scheduled_tasks = []

        # Obter tarefas agendadas de todos os workers
        scheduled = inspect.scheduled()
        if scheduled:
            for worker, tasks in scheduled.items():
                for task in tasks:
                    scheduled_tasks.append({
                        "worker": worker,
                        "task_id": task["request"]["id"],
                        "name": task["request"]["name"],
                        "eta": task["eta"],
                    })

        return scheduled_tasks

    @staticmethod
    def purge_queue(queue_name: str) -> int:
        """
        Limpar uma fila de tarefas

        Args:
            queue_name: Nome da fila

        Returns:
            Número de tarefas removidas
        """
        try:
            count = celery_app.control.purge()
            logger.info(f"Fila {queue_name} limpa: {count} tarefas removidas")
            return count
        except Exception as e:
            logger.error(f"Erro ao limpar fila {queue_name}: {e}")
            return 0

    @staticmethod
    def get_queue_stats() -> Dict[str, Any]:
        """
        Obter estatísticas das filas

        Returns:
            Estatísticas das filas
        """
        inspect = celery_app.control.inspect()

        stats = {
            "active_tasks": 0,
            "scheduled_tasks": 0,
            "workers": 0,
        }

        # Contar workers
        workers = inspect.stats()
        if workers:
            stats["workers"] = len(workers)

        # Contar tarefas ativas
        active = inspect.active()
        if active:
            for worker_tasks in active.values():
                stats["active_tasks"] += len(worker_tasks)

        # Contar tarefas agendadas
        scheduled = inspect.scheduled()
        if scheduled:
            for worker_tasks in scheduled.values():
                stats["scheduled_tasks"] += len(worker_tasks)

        return stats


# Funções auxiliares para facilitar o uso

def schedule_task(task_name: str, *args, **kwargs) -> str:
    """
    Agendar uma tarefa específica

    Args:
        task_name: Nome da tarefa
        *args: Argumentos posicionais
        **kwargs: Argumentos nomeados

    Returns:
        ID da tarefa agendada
    """
    task = celery_app.tasks.get(task_name)
    if not task:
        raise ValueError(f"Tarefa {task_name} não encontrada")

    result = task.apply_async(args=args, kwargs=kwargs)
    logger.info(f"Tarefa {task_name} agendada: {result.id}")
    return result.id


def schedule_delayed_task(task_name: str, delay_seconds: int, *args, **kwargs) -> str:
    """
    Agendar uma tarefa com atraso

    Args:
        task_name: Nome da tarefa
        delay_seconds: Segundos de atraso
        *args: Argumentos posicionais
        **kwargs: Argumentos nomeados

    Returns:
        ID da tarefa agendada
    """
    task = celery_app.tasks.get(task_name)
    if not task:
        raise ValueError(f"Tarefa {task_name} não encontrada")

    eta = datetime.utcnow() + timedelta(seconds=delay_seconds)
    result = task.apply_async(args=args, kwargs=kwargs, eta=eta)
    logger.info(f"Tarefa {task_name} agendada para {eta}: {result.id}")
    return result.id


def get_task_result(task_id: str, timeout: int = 300) -> Any:
    """
    Obter resultado de uma tarefa (bloqueante)

    Args:
        task_id: ID da tarefa
        timeout: Timeout em segundos

    Returns:
        Resultado da tarefa
    """
    from celery.result import AsyncResult

    result = AsyncResult(task_id, app=celery_app)
    return result.get(timeout=timeout)
