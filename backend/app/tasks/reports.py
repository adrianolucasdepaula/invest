"""
Tarefas assíncronas para geração de relatórios
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from celery import Task
from loguru import logger

from ..celery_app import celery_app
from ..services import ReportService
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
    name="app.tasks.reports.generate_report_async",
    max_retries=3,
    default_retry_delay=60,
)
def generate_report_async(
    self,
    ticker: str,
    ai_provider: str = "openai",
    language: str = "pt-BR"
) -> Dict[str, Any]:
    """
    Gerar relatório de análise de forma assíncrona

    Args:
        ticker: Código do ativo
        ai_provider: Provedor de IA (openai, anthropic, gemini)
        language: Idioma do relatório

    Returns:
        Relatório gerado
    """
    try:
        logger.info(f"Gerando relatório assíncrono para {ticker} com {ai_provider}")

        service = ReportService()
        report = service.generate_report(ticker, ai_provider=ai_provider, language=language)

        logger.info(f"Relatório gerado para {ticker}: {len(report.get('content', ''))} caracteres")
        return report

    except Exception as exc:
        logger.error(f"Erro ao gerar relatório de {ticker}: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.reports.generate_comparison_report_async",
    max_retries=2,
)
def generate_comparison_report_async(
    self,
    tickers: List[str],
    ai_provider: str = "openai",
    language: str = "pt-BR"
) -> Dict[str, Any]:
    """
    Gerar relatório comparativo de forma assíncrona

    Args:
        tickers: Lista de tickers a comparar
        ai_provider: Provedor de IA
        language: Idioma do relatório

    Returns:
        Relatório comparativo
    """
    try:
        logger.info(f"Gerando relatório comparativo para {len(tickers)} ativos")

        service = ReportService()
        report = service.generate_comparison_report(
            tickers,
            ai_provider=ai_provider,
            language=language
        )

        logger.info(f"Relatório comparativo gerado: {len(tickers)} ativos")
        return report

    except Exception as exc:
        logger.error(f"Erro ao gerar relatório comparativo: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.reports.generate_portfolio_report_async",
    max_retries=2,
)
def generate_portfolio_report_async(
    self,
    portfolio_id: str,
    ai_provider: str = "openai",
    include_recommendations: bool = True
) -> Dict[str, Any]:
    """
    Gerar relatório de portfólio de forma assíncrona

    Args:
        portfolio_id: ID do portfólio
        ai_provider: Provedor de IA
        include_recommendations: Incluir recomendações

    Returns:
        Relatório do portfólio
    """
    try:
        logger.info(f"Gerando relatório de portfólio {portfolio_id}")

        service = ReportService()
        report = service.generate_portfolio_report(
            portfolio_id,
            ai_provider=ai_provider,
            include_recommendations=include_recommendations
        )

        logger.info(f"Relatório de portfólio {portfolio_id} gerado")
        return report

    except Exception as exc:
        logger.error(f"Erro ao gerar relatório de portfólio {portfolio_id}: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.reports.generate_market_overview_async",
    max_retries=2,
)
def generate_market_overview_async(
    self,
    market: str = "stocks",
    ai_provider: str = "openai",
    top_n: int = 10
) -> Dict[str, Any]:
    """
    Gerar visão geral do mercado de forma assíncrona

    Args:
        market: Mercado a analisar
        ai_provider: Provedor de IA
        top_n: Número de ativos principais a incluir

    Returns:
        Visão geral do mercado
    """
    try:
        logger.info(f"Gerando visão geral do mercado {market}")

        service = ReportService()
        overview = service.generate_market_overview(
            market=market,
            ai_provider=ai_provider,
            top_n=top_n
        )

        logger.info(f"Visão geral de {market} gerada com {top_n} ativos principais")
        return overview

    except Exception as exc:
        logger.error(f"Erro ao gerar visão geral do mercado: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.reports.export_report_async",
    max_retries=2,
)
def export_report_async(
    self,
    report_id: str,
    format: str = "pdf",
    include_charts: bool = True
) -> Dict[str, Any]:
    """
    Exportar relatório em formato específico

    Args:
        report_id: ID do relatório
        format: Formato de exportação (pdf, markdown, html)
        include_charts: Incluir gráficos

    Returns:
        Informações do arquivo exportado
    """
    try:
        logger.info(f"Exportando relatório {report_id} para formato {format}")

        # TODO: Implementar exportação real
        export_info = {
            "report_id": report_id,
            "format": format,
            "file_path": f"/tmp/report_{report_id}.{format}",
            "file_size": 0,
            "exported_at": datetime.utcnow().isoformat()
        }

        logger.info(f"Relatório {report_id} exportado: {export_info['file_path']}")
        return export_info

    except Exception as exc:
        logger.error(f"Erro ao exportar relatório {report_id}: {exc}")
        raise self.retry(exc=exc)


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.reports.generate_multi_ai_analysis",
    max_retries=1,
)
def generate_multi_ai_analysis(
    self,
    ticker: str,
    providers: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Gerar análise com múltiplos provedores de IA

    Args:
        ticker: Código do ativo
        providers: Lista de provedores (se None, usa todos)

    Returns:
        Análises de múltiplos provedores
    """
    try:
        logger.info(f"Gerando análise multi-IA para {ticker}")

        if providers is None:
            providers = ["openai", "anthropic", "gemini"]

        service = ReportService()
        analyses = {}

        for provider in providers:
            try:
                result = service.generate_report(ticker, ai_provider=provider)
                analyses[provider] = result
                logger.info(f"Análise {provider} para {ticker} concluída")
            except Exception as e:
                logger.error(f"Erro na análise {provider} de {ticker}: {e}")
                analyses[provider] = {"error": str(e)}

        return {
            "ticker": ticker,
            "providers": providers,
            "analyses": analyses,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as exc:
        logger.error(f"Erro na análise multi-IA de {ticker}: {exc}")
        raise


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.reports.schedule_weekly_reports",
)
def schedule_weekly_reports(self, portfolio_ids: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Agendar geração de relatórios semanais

    Args:
        portfolio_ids: IDs dos portfólios (se None, gera para todos)

    Returns:
        Estatísticas do agendamento
    """
    try:
        logger.info("Agendando relatórios semanais")

        if portfolio_ids is None:
            # TODO: Buscar todos os portfólios ativos
            portfolio_ids = []

        scheduled = []
        for portfolio_id in portfolio_ids:
            task = generate_portfolio_report_async.apply_async(
                args=[portfolio_id],
                kwargs={"include_recommendations": True}
            )
            scheduled.append({
                "portfolio_id": portfolio_id,
                "task_id": task.id
            })

        logger.info(f"{len(scheduled)} relatórios semanais agendados")
        return {
            "scheduled_count": len(scheduled),
            "scheduled_reports": scheduled,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as exc:
        logger.error(f"Erro ao agendar relatórios semanais: {exc}")
        raise


@celery_app.task(
    bind=True,
    base=DatabaseTask,
    name="app.tasks.reports.batch_export_reports",
    max_retries=1,
)
def batch_export_reports(
    self,
    report_ids: List[str],
    format: str = "pdf"
) -> Dict[str, Any]:
    """
    Exportar múltiplos relatórios em lote

    Args:
        report_ids: IDs dos relatórios
        format: Formato de exportação

    Returns:
        Resultados da exportação em lote
    """
    try:
        logger.info(f"Exportando {len(report_ids)} relatórios em lote para {format}")

        results = {
            "total": len(report_ids),
            "success": 0,
            "failed": 0,
            "exports": []
        }

        for report_id in report_ids:
            try:
                export_info = export_report_async(report_id, format=format)
                results["exports"].append(export_info)
                results["success"] += 1
            except Exception as e:
                results["failed"] += 1
                logger.error(f"Erro ao exportar relatório {report_id}: {e}")

        logger.info(f"Exportação em lote: {results['success']}/{results['total']}")
        return results

    except Exception as exc:
        logger.error(f"Erro na exportação em lote: {exc}")
        raise
