"""
News scrapers package
"""
from .google_news_scraper import GoogleNewsScraper
from .bloomberg_linea_scraper import BloombergLineaScraper
from .infomoney_scraper import InfoMoneyScraper

__all__ = [
    "GoogleNewsScraper",
    "BloombergLineaScraper",
    "InfoMoneyScraper",
]
