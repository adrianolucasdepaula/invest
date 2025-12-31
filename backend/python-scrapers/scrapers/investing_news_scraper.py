


# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
Investing News Scraper - Notícias de investimentos internacionais
Fonte: https://br.investing.com/news/
Requer login via Google OAuth

OPTIMIZED: Uses Playwright for browser automation + BeautifulSoup for parsing
"""
import asyncio
import json
from datetime import datetime
import pytz
from pathlib import Path
from typing import Dict, Any, List, Optional
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class InvestingNewsScraper(BaseScraper):
    """
    Scraper for Investing.com News

    MIGRATED TO PLAYWRIGHT - Uses BeautifulSoup for local parsing
    """

    BASE_URL = "https://br.investing.com"
    COOKIES_FILE = Path("/app/data/cookies/investing_session.json")

    def __init__(self):
        super().__init__(
            name="Investing News",
            source="INVESTING",
            requires_login=True,
        )

    async def initialize(self):
        """Initialize Playwright browser and load cookies (optimized - no home page visit)"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page with stealth
        await super().initialize()

        try:
            # Load cookies if available (before any navigation)
            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        cookies = json.load(f)

                    investing_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict) and ('investing.com' in cookie.get('domain', '') or 'google.com' in cookie.get('domain', '')):
                            pw_cookie = {
                                'name': cookie.get('name'),
                                'value': cookie.get('value'),
                                'domain': cookie.get('domain'),
                                'path': cookie.get('path', '/'),
                            }
                            if 'expires' in cookie and cookie['expires']:
                                pw_cookie['expires'] = cookie['expires']
                            if 'httpOnly' in cookie:
                                pw_cookie['httpOnly'] = cookie['httpOnly']
                            if 'secure' in cookie:
                                pw_cookie['secure'] = cookie['secure']

                            investing_cookies.append(pw_cookie)

                    if investing_cookies:
                        await self.page.context.add_cookies(investing_cookies)
                        logger.info(f"Loaded {len(investing_cookies)} cookies for Investing")

                except Exception as e:
                    logger.warning(f"Could not load Investing cookies: {e}")
            else:
                logger.debug("Investing cookies not found. Will scrape without login.")

            self._initialized = True

        except Exception as e:
            logger.error(f"Failed to initialize {self.name}: {e}")
            raise

    async def scrape(self, query: str = "latest") -> ScraperResult:
        """
        Scrape Investing.com news

        Args:
            query: Search term or category (default: "latest")

        Returns:
            ScraperResult with news articles
        """
        try:
            if not self.page:
                await self.initialize()

            # Build URL - Using direct news pages (Cloudflare bypassed via playwright-stealth)
            # Map categories to appropriate URLs
            category_urls = {
                "latest": f"{self.BASE_URL}/news/latest-news",
                "ultimas": f"{self.BASE_URL}/news/latest-news",
                "últimas": f"{self.BASE_URL}/news/latest-news",
                "acoes": f"{self.BASE_URL}/news/stock-market-news",
                "ações": f"{self.BASE_URL}/news/stock-market-news",
                "stocks": f"{self.BASE_URL}/news/stock-market-news",
                "commodities": f"{self.BASE_URL}/news/commodities-news",
                "commodity": f"{self.BASE_URL}/news/commodities-news",
                "forex": f"{self.BASE_URL}/news/forex-news",
                "cambio": f"{self.BASE_URL}/news/forex-news",
                "câmbio": f"{self.BASE_URL}/news/forex-news",
                "economia": f"{self.BASE_URL}/news/economy",
                "economy": f"{self.BASE_URL}/news/economy",
            }

            # Use category URL if available, otherwise search
            url = category_urls.get(query.lower())
            if not url:
                url = f"{self.BASE_URL}/search/?q={query}&tab=news"

            logger.info(f"Fetching Investing News from: {url}")
            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # OPTIMIZATION: Get HTML once and parse locally
            html_content = await self.page.content()

            # Extract articles using BeautifulSoup
            articles = self._extract_articles(html_content)

            if articles:
                return ScraperResult(
                    success=True,
                    data={
                        "source": "Investing News",
                        "query": query,
                        "url": url,
                        "articles_count": len(articles),
                        "articles": articles,
                        "scraped_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                    },
                    source=self.source,
                    metadata={
                        "url": url,
                        "articles_found": len(articles),
                    },
                )

            return ScraperResult(
                success=False,
                error="No articles found",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping Investing News: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    def _extract_articles(self, html_content: str) -> List[Dict[str, Any]]:
        """
        Extract news articles from the page

        OPTIMIZED: Uses BeautifulSoup for local parsing
        """
        articles = []

        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            # Try multiple article selectors
            article_selectors = [
                "article",
                ".largeTitle",
                ".articleItem",
                "[data-test='article']",
                ".js-article-item",
                ".news-item",
            ]

            article_elements = []
            for selector in article_selectors:
                elements = soup.select(selector)
                if elements:
                    article_elements = elements
                    logger.debug(f"Found {len(elements)} articles using selector: {selector}")
                    break

            if not article_elements:
                logger.warning("No article elements found")
                return articles

            # Limit to first 20 articles
            for element in article_elements[:20]:
                try:
                    article_data = self._parse_article(element)
                    if article_data:
                        articles.append(article_data)
                except Exception as e:
                    logger.debug(f"Error parsing article: {e}")
                    continue

            logger.info(f"Successfully extracted {len(articles)} articles")

        except Exception as e:
            logger.error(f"Error extracting articles: {e}")

        return articles

    def _parse_article(self, element) -> Optional[Dict[str, Any]]:
        """Parse a single article element using BeautifulSoup"""
        try:
            article = {}

            # Extract title
            title_selectors = ["h3", "h2", ".textDiv a", ".title", "a"]
            title = None
            title_link = None

            for selector in title_selectors:
                title_elem = element.select_one(selector)
                if title_elem:
                    title = title_elem.get_text().strip()
                    if title_elem.name == "a":
                        title_link = title_elem.get("href")
                    else:
                        link_elem = title_elem.select_one("a")
                        if link_elem:
                            title_link = link_elem.get("href")
                    if title:
                        break

            if not title:
                return None

            article["title"] = title

            # Extract link
            if not title_link:
                link_elem = element.select_one("a")
                if link_elem:
                    title_link = link_elem.get("href")

            if title_link:
                if title_link.startswith("/"):
                    title_link = f"{self.BASE_URL}{title_link}"
                article["url"] = title_link

            # Extract description
            desc_selectors = ["p", ".articleDesc", ".summary", ".excerpt"]
            for selector in desc_selectors:
                desc_elem = element.select_one(selector)
                if desc_elem:
                    description = desc_elem.get_text().strip()
                    if description and len(description) > 20:
                        article["description"] = description
                        break

            # Extract date
            time_selectors = ["time", ".articleDetails span", "[data-test='article-publish-date']", ".date"]
            for selector in time_selectors:
                time_elem = element.select_one(selector)
                if time_elem:
                    published_date = time_elem.get("datetime") or time_elem.get_text().strip()
                    if published_date:
                        article["published_at"] = published_date
                        break

            return article

        except Exception as e:
            logger.debug(f"Error parsing article element: {e}")
            return None

    async def health_check(self) -> bool:
        """Check if Investing.com is accessible"""
        try:
            await self.initialize()
            await self.page.goto(f"{self.BASE_URL}/news/latest-news", wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Check if we can find article elements
            for selector in ["article", ".largeTitle", ".articleItem"]:
                elements = soup.select(selector)
                if elements:
                    return True

            return False

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_investing_news():
    """Test Investing News scraper"""
    scraper = InvestingNewsScraper()

    try:
        result = await scraper.scrape("latest")

        if result.success:
            print("✅ Success!")
            print(f"Articles found: {result.data['articles_count']}")
            for article in result.data['articles'][:3]:
                print(f"  - {article.get('title', 'No title')[:60]}...")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_investing_news())
