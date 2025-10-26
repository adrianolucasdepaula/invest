"""
Fundamental data scrapers
"""
from .fundamentus_scraper import FundamentusScraper
from .brapi_scraper import BRAPIScraper
from .statusinvest_scraper import StatusInvestScraper

__all__ = [
    "FundamentusScraper",
    "BRAPIScraper",
    "StatusInvestScraper",
]
