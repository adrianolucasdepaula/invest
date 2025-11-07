"""
Scrapers package
"""
from .statusinvest_scraper import StatusInvestScraper
from .fundamentus_scraper import FundamentusScraper
from .investsite_scraper import InvestsiteScraper

__all__ = [
    "StatusInvestScraper",
    "FundamentusScraper",
    "InvestsiteScraper",
]
