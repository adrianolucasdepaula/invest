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
from .perplexity_scraper import PerplexityScraper

# ==============================
# MARKET DATA SCRAPERS
# ==============================
from .yahoo_finance_scraper import YahooFinanceScraper
from .oplab_scraper import OplabScraper
from .kinvo_scraper import KinvoScraper
from .investing_scraper import InvestingScraper  # FASE 95: Works without login
from .b3_scraper import B3Scraper  # FASE 96: CVM codes file exists
from .idiv_scraper import IdivScraper  # FASE Marcação IDIV: Index composition

# ==============================
# OAUTH SCRAPERS (FASE 97)
# ==============================
from .fundamentei_scraper import FundamenteiScraper  # FASE 97: OAuth required
from .maisretorno_scraper import MaisRetornoScraper  # FASE 97: OAuth required

# ==============================
# CREDENTIALS SCRAPERS (FASE 98)
# ==============================
from .advfn_scraper import ADVFNScraper  # FASE 98: Credentials optional

# ==============================
# ECONOMIC DATA SCRAPERS (FASE 100)
# ==============================
from .anbima_scraper import ANBIMAScraper  # FASE 100: Public API (Tesouro Direto)
from .fred_scraper import FREDScraper  # FASE 100: API Key required (free)
from .ipeadata_scraper import IPEADATAScraper  # FASE 100: Public API

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
    "PerplexityScraper",
    # Market Data
    "YahooFinanceScraper",
    "OplabScraper",
    "KinvoScraper",
    "InvestingScraper",  # FASE 95
    "B3Scraper",  # FASE 96
    "IdivScraper",  # FASE Marcação IDIV
    # OAuth Scrapers (FASE 97)
    "FundamenteiScraper",  # FASE 97
    "MaisRetornoScraper",  # FASE 97
    # Credentials Scrapers (FASE 98)
    "ADVFNScraper",  # FASE 98
    # Economic Data Scrapers (FASE 100)
    "ANBIMAScraper",  # FASE 100
    "FREDScraper",  # FASE 100
    "IPEADATAScraper",  # FASE 100
]
