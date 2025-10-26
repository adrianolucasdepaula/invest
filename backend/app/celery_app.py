"""
Configuração do Celery para tarefas assíncronas
"""
from celery import Celery
from celery.schedules import crontab
from .core.config import settings

# Criar instância do Celery
celery_app = Celery(
    "invest_platform",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.data_collection",
        "app.tasks.analysis",
        "app.tasks.reports",
    ]
)

# Configurações do Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutos
    task_soft_time_limit=25 * 60,  # 25 minutos
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    result_expires=3600,  # 1 hora
    broker_connection_retry_on_startup=True,
)

# Configurar tarefas periódicas
celery_app.conf.beat_schedule = {
    # Atualizar preços a cada 5 minutos durante horário de mercado
    "update-prices-frequently": {
        "task": "app.tasks.data_collection.update_market_prices",
        "schedule": crontab(minute="*/5", hour="10-17", day_of_week="mon-fri"),
    },
    # Atualizar dados fundamentais diariamente às 19h
    "update-fundamentals-daily": {
        "task": "app.tasks.data_collection.update_fundamentals_batch",
        "schedule": crontab(hour=19, minute=0),
    },
    # Atualizar notícias a cada hora
    "update-news-hourly": {
        "task": "app.tasks.data_collection.update_news_feed",
        "schedule": crontab(minute=0),
    },
    # Análise automática de portfólios diariamente às 20h
    "analyze-portfolios-daily": {
        "task": "app.tasks.analysis.analyze_all_portfolios",
        "schedule": crontab(hour=20, minute=0),
    },
    # Limpar dados antigos semanalmente (domingo às 2h)
    "cleanup-old-data": {
        "task": "app.tasks.data_collection.cleanup_old_data",
        "schedule": crontab(hour=2, minute=0, day_of_week="sunday"),
    },
}

# Configurar rotas de tarefas
celery_app.conf.task_routes = {
    "app.tasks.data_collection.*": {"queue": "data_collection"},
    "app.tasks.analysis.*": {"queue": "analysis"},
    "app.tasks.reports.*": {"queue": "reports"},
}

# Configurar prioridades de filas
celery_app.conf.task_default_priority = 5
celery_app.conf.task_queue_max_priority = 10

if __name__ == "__main__":
    celery_app.start()
