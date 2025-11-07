"""
Scrapers package
"""
from .statusinvest_scraper import StatusInvestScraper
from .fundamentus_scraper import FundamentusScraper
from .investsite_scraper import InvestsiteScraper
from .b3_scraper import B3Scraper
from .griffin_scraper import GriffinScraper
from .coinmarketcap_scraper import CoinMarketCapScraper
from .opcoes_scraper import OpcoesNetScraper
from .bcb_scraper import BCBScraper

__all__ = [
    "StatusInvestScraper",
    "FundamentusScraper",
    "InvestsiteScraper",
    "B3Scraper",
    "GriffinScraper",
    "CoinMarketCapScraper",
    "OpcoesNetScraper",
    "BCBScraper",
]
