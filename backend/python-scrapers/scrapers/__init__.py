"""
Scrapers package
"""
# Fundamental Analysis
from .statusinvest_scraper import StatusInvestScraper
from .fundamentus_scraper import FundamentusScraper
from .investsite_scraper import InvestsiteScraper
from .fundamentei_scraper import FundamenteiScraper
from .investidor10_scraper import Investidor10Scraper

# Market Analysis
from .investing_scraper import InvestingScraper
from .advfn_scraper import ADVFNScraper
from .googlefinance_scraper import GoogleFinanceScraper
from .tradingview_scraper import TradingViewScraper

# Official Data
from .b3_scraper import B3Scraper
from .bcb_scraper import BCBScraper

# Insider Trading
from .griffin_scraper import GriffinScraper

# Crypto
from .coinmarketcap_scraper import CoinMarketCapScraper

# Options
from .opcoes_scraper import OpcoesNetScraper

# AI Assistants
from .chatgpt_scraper import ChatGPTScraper
from .gemini_scraper import GeminiScraper
from .deepseek_scraper import DeepSeekScraper
from .claude_scraper import ClaudeScraper
from .grok_scraper import GrokScraper

# News
from .bloomberg_scraper import BloombergScraper
from .googlenews_scraper import GoogleNewsScraper
from .investing_news_scraper import InvestingNewsScraper
from .valor_scraper import ValorScraper
from .exame_scraper import ExameScraper
from .infomoney_scraper import InfoMoneyScraper

# Institutional Reports
from .estadao_scraper import EstadaoScraper
from .maisretorno_scraper import MaisRetornoScraper

__all__ = [
    # Fundamental Analysis
    "StatusInvestScraper",
    "FundamentusScraper",
    "InvestsiteScraper",
    "FundamenteiScraper",
    "Investidor10Scraper",
    # Market Analysis
    "InvestingScraper",
    "ADVFNScraper",
    "GoogleFinanceScraper",
    "TradingViewScraper",
    # Official Data
    "B3Scraper",
    "BCBScraper",
    # Insider Trading
    "GriffinScraper",
    # Crypto
    "CoinMarketCapScraper",
    # Options
    "OpcoesNetScraper",
    # AI Assistants
    "ChatGPTScraper",
    "GeminiScraper",
    "DeepSeekScraper",
    "ClaudeScraper",
    "GrokScraper",
    # News
    "BloombergScraper",
    "GoogleNewsScraper",
    "InvestingNewsScraper",
    "ValorScraper",
    "ExameScraper",
    "InfoMoneyScraper",
    # Institutional Reports
    "EstadaoScraper",
    "MaisRetornoScraper",
]
