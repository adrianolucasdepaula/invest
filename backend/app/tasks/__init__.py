"""
Módulo de tarefas assíncronas com Celery
"""
from .data_collection import (
    collect_asset_data_async,
    update_market_prices,
    update_fundamentals_batch,
    update_news_feed,
    cleanup_old_data,
)
from .analysis import (
    analyze_asset_async,
    compare_assets_async,
    analyze_all_portfolios,
    calculate_portfolio_metrics,
)
from .reports import (
    generate_report_async,
    generate_comparison_report_async,
    generate_portfolio_report_async,
    generate_market_overview_async,
)

__all__ = [
    # Data Collection
    "collect_asset_data_async",
    "update_market_prices",
    "update_fundamentals_batch",
    "update_news_feed",
    "cleanup_old_data",
    # Analysis
    "analyze_asset_async",
    "compare_assets_async",
    "analyze_all_portfolios",
    "calculate_portfolio_metrics",
    # Reports
    "generate_report_async",
    "generate_comparison_report_async",
    "generate_portfolio_report_async",
    "generate_market_overview_async",
]
