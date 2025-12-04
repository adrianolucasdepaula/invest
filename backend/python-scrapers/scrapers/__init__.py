"""
Scrapers package

TEMPORARY: Only importing Playwright-migrated scrapers while migration is in progress
"""
# ✅ MIGRATED TO PLAYWRIGHT
from .fundamentus_scraper import FundamentusScraper
from .bcb_scraper import BCBScraper
from .statusinvest_scraper import StatusInvestScraper
from .investsite_scraper import InvestsiteScraper

# ⏸️ TEMPORARILY DISABLED - Awaiting Playwright migration
# from .fundamentei_scraper import FundamenteiScraper
# from .investidor10_scraper import Investidor10Scraper
# from .investing_scraper import InvestingScraper
# from .advfn_scraper import ADVFNScraper
# from .googlefinance_scraper import GoogleFinanceScraper
# from .tradingview_scraper import TradingViewScraper
# from .b3_scraper import B3Scraper
# from .griffin_scraper import GriffinScraper
# from .coinmarketcap_scraper import CoinMarketCapScraper
# from .opcoes_scraper import OpcoesNetScraper
# from .chatgpt_scraper import ChatGPTScraper
# from .gemini_scraper import GeminiScraper
# from .deepseek_scraper import DeepSeekScraper
# from .claude_scraper import ClaudeScraper
# from .grok_scraper import GrokScraper
# from .bloomberg_scraper import BloombergScraper
# from .googlenews_scraper import GoogleNewsScraper
# from .investing_news_scraper import InvestingNewsScraper
# from .valor_scraper import ValorScraper
# from .exame_scraper import ExameScraper
# from .infomoney_scraper import InfoMoneyScraper
# from .estadao_scraper import EstadaoScraper
# from .maisretorno_scraper import MaisRetornoScraper

__all__ = [
    # ✅ MIGRATED TO PLAYWRIGHT
    "FundamentusScraper",
    "BCBScraper",
    "StatusInvestScraper",
    "InvestsiteScraper",
]
