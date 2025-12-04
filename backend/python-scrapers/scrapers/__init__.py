"""
Scrapers package

ALL SCRAPERS MIGRATED TO PLAYWRIGHT - 2025-12-04
Uses single HTML fetch + BeautifulSoup local parsing (~10x faster)
"""

# ==============================
# FUNDAMENTAL DATA SCRAPERS
# ==============================
from .fundamentus_scraper import FundamentusScraper
from .bcb_scraper import BCBScraper
from .statusinvest_scraper import StatusInvestScraper
from .investsite_scraper import InvestsiteScraper
from .investidor10_scraper import Investidor10Scraper
from .tradingview_scraper import TradingViewScraper
from .googlefinance_scraper import GoogleFinanceScraper
from .griffin_scraper import GriffinScraper
from .coinmarketcap_scraper import CoinMarketCapScraper
from .opcoes_scraper import OpcoesNetScraper

# ==============================
# NEWS SCRAPERS
# ==============================
from .bloomberg_scraper import BloombergScraper
from .googlenews_scraper import GoogleNewsScraper
from .investing_news_scraper import InvestingNewsScraper
from .valor_scraper import ValorScraper
from .exame_scraper import ExameScraper
from .infomoney_scraper import InfoMoneyScraper
from .estadao_scraper import EstadaoScraper

# ==============================
# AI SCRAPERS
# ==============================
from .chatgpt_scraper import ChatGPTScraper
from .gemini_scraper import GeminiScraper
from .deepseek_scraper import DeepSeekScraper
from .claude_scraper import ClaudeScraper
from .grok_scraper import GrokScraper

# ==============================
# AWAITING OAUTH/FIXES
# ==============================
# from .fundamentei_scraper import FundamenteiScraper  # OAuth session expired
# from .maisretorno_scraper import MaisRetornoScraper  # needs cookies
# from .b3_scraper import B3Scraper  # URL needs CVM code
# from .investing_scraper import InvestingScraper  # complex login flow
# from .advfn_scraper import ADVFNScraper  # partial migration needed

__all__ = [
    # Fundamental Data
    "FundamentusScraper",
    "BCBScraper",
    "StatusInvestScraper",
    "InvestsiteScraper",
    "Investidor10Scraper",
    "TradingViewScraper",
    "GoogleFinanceScraper",
    "GriffinScraper",
    "CoinMarketCapScraper",
    "OpcoesNetScraper",
    # News
    "BloombergScraper",
    "GoogleNewsScraper",
    "InvestingNewsScraper",
    "ValorScraper",
    "ExameScraper",
    "InfoMoneyScraper",
    "EstadaoScraper",
    # AI
    "ChatGPTScraper",
    "GeminiScraper",
    "DeepSeekScraper",
    "ClaudeScraper",
    "GrokScraper",
]
