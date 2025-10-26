"""
Módulo de tarefas assíncronas com Celery
"""
from .data_collection import (
    collect_asset_data_async,
    update_market_prices,
    update_fundamentals_batch,
    update_news_feed,
    cleanup_old_data,
    batch_collect_assets,
)
from .analysis import (
    analyze_asset_async,
    compare_assets_async,
    analyze_all_portfolios,
    calculate_portfolio_metrics,
    batch_analyze_assets,
    detect_opportunities,
    update_asset_rankings,
)
from .reports import (
    generate_report_async,
    generate_comparison_report_async,
    generate_portfolio_report_async,
    generate_market_overview_async,
    export_report_async,
    generate_multi_ai_analysis,
    schedule_weekly_reports,
    batch_export_reports,
)

__all__ = [
    # Data Collection (6 tarefas)
    "collect_asset_data_async",
    "update_market_prices",
    "update_fundamentals_batch",
    "update_news_feed",
    "cleanup_old_data",
    "batch_collect_assets",
    # Analysis (7 tarefas)
    "analyze_asset_async",
    "compare_assets_async",
    "analyze_all_portfolios",
    "calculate_portfolio_metrics",
    "batch_analyze_assets",
    "detect_opportunities",
    "update_asset_rankings",
    # Reports (8 tarefas)
    "generate_report_async",
    "generate_comparison_report_async",
    "generate_portfolio_report_async",
    "generate_market_overview_async",
    "export_report_async",
    "generate_multi_ai_analysis",
    "schedule_weekly_reports",
    "batch_export_reports",
]
