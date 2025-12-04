"""
Scrapers package

TEMPORARY: Only importing Playwright-migrated scrapers while migration is in progress
"""
# ✅ MIGRATED TO PLAYWRIGHT - Active
from .fundamentus_scraper import FundamentusScraper
from .bcb_scraper import BCBScraper
from .statusinvest_scraper import StatusInvestScraper
from .investsite_scraper import InvestsiteScraper
from .investidor10_scraper import Investidor10Scraper
from .tradingview_scraper import TradingViewScraper
from .googlefinance_scraper import GoogleFinanceScraper

# ⏳ MIGRATED but needs OAuth/fixes
# from .fundamentei_scraper import FundamenteiScraper  # OAuth session expired
# from .maisretorno_scraper import MaisRetornoScraper  # needs cookies
# from .b3_scraper import B3Scraper  # URL needs CVM code

# ❌ NOT MIGRATED - Still use Selenium (need full migration)
# from .investing_scraper import InvestingScraper
# from .advfn_scraper import ADVFNScraper  # partial migration, _extract_data still Selenium
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
    # ✅ MIGRATED TO PLAYWRIGHT - Active
    "FundamentusScraper",
    "BCBScraper",
    "StatusInvestScraper",
    "InvestsiteScraper",
    "Investidor10Scraper",
    "TradingViewScraper",
    "GoogleFinanceScraper",
]
