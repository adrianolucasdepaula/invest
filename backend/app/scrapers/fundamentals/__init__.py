"""
Fundamental data scrapers
"""
from .fundamentus_scraper import FundamentusScraper
from .brapi_scraper import BRAPIScraper
from .statusinvest_scraper import StatusInvestScraper
from .investidor10_scraper import Investidor10Scraper
from .fundamentei_scraper import FundamenteiScraper
from .investsite_scraper import InvestSiteScraper

__all__ = [
    "FundamentusScraper",
    "BRAPIScraper",
    "StatusInvestScraper",
    "Investidor10Scraper",
    "FundamenteiScraper",
    "InvestSiteScraper",
]
