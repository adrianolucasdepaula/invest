# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
Valor Econômico Scraper - Notícias do mercado financeiro brasileiro
Fonte: https://valor.globo.com/
Requer login via Google OAuth

OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing (~10x faster)
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


class ValorScraper(BaseScraper):
    """
    Scraper for Valor Econômico news

    MIGRATED TO PLAYWRIGHT - Uses BeautifulSoup for local parsing
    """

    BASE_URL = "https://valor.globo.com"
    COOKIES_FILE = Path("/app/data/cookies/valor_session.json")

    def __init__(self):
        super().__init__(
            name="Valor Econômico",
            source="VALOR",
            requires_login=True,
        )

    async def initialize(self):
        """Initialize Playwright browser and optionally load cookies"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Load cookies if available
            if self.COOKIES_FILE.exists():
                try:
                    with open(self.COOKIES_FILE, 'r') as f:
                        cookies = json.load(f)

                    valor_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict) and ('globo.com' in cookie.get('domain', '') or 'valor.globo.com' in cookie.get('domain', '')):
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

                            valor_cookies.append(pw_cookie)

                    if valor_cookies:
                        await self.page.context.add_cookies(valor_cookies)
                        logger.info(f"Loaded {len(valor_cookies)} cookies for Valor")
                        await self.page.reload()
                        await asyncio.sleep(2)

                except Exception as e:
                    logger.warning(f"Could not load Valor cookies: {e}")
            else:
                logger.debug("Valor cookies not found. Using without login.")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Valor scraper: {e}")
            raise

    async def scrape(self, query: str = "mercados") -> ScraperResult:
        """
        Scrape Valor Econômico news

        Args:
            query: Search term or category (default: "mercados")

        Returns:
            ScraperResult with news articles
        """
        try:
            if not self.page:
                await self.initialize()

            # Build URL based on query
            if query.lower() in ["mercado", "mercados"]:
                url = f"{self.BASE_URL}/financas/"
            elif query.lower() in ["empresas", "empresa"]:
                url = f"{self.BASE_URL}/empresas/"
            elif query.lower() in ["economia", "economico"]:
                url = f"{self.BASE_URL}/economia/"
            else:
                url = f"{self.BASE_URL}/busca/?q={query}"

            logger.info(f"Fetching Valor news from: {url}")
            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # OPTIMIZATION: Get HTML once and parse locally with BeautifulSoup
            html_content = await self.page.content()

            # Extract articles using BeautifulSoup
            articles = self._extract_articles(html_content)

            if articles:
                return ScraperResult(
                    success=True,
                    data={
                        "source": "Valor Econômico",
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
            logger.error(f"Error scraping Valor: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    def _extract_articles(self, html_content: str) -> List[Dict[str, Any]]:
        """
        Extract news articles from the page

        OPTIMIZED: Uses BeautifulSoup for local parsing (no await operations)
        """
        articles = []

        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            # Try multiple article selectors
            article_selectors = [
                "article",
                ".feed-post",
                ".bastian-feed-item",
                ".widget--card",
                "[data-type='materia']",
            ]

            article_elements = []
            for selector in article_selectors:
                elements = soup.select(selector)
                if elements:
                    article_elements = elements
                    logger.debug(f"Found {len(elements)} articles using selector: {selector}")
                    break

            if not article_elements:
                logger.warning("No article elements found with any selector")
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
            title_selectors = ["h2", "h3", ".feed-post-body-title", ".widget__title"]
            title = None
            title_link = None

            for selector in title_selectors:
                title_elem = element.select_one(selector)
                if title_elem:
                    title = title_elem.get_text().strip()

                    # Try to get link
                    if title_elem.name == "a":
                        title_link = title_elem.get("href")
                    else:
                        link_elem = title_elem.select_one("a")
                        if link_elem:
                            title_link = link_elem.get("href")

                    if title:
                        break

            if not title:
                # Try to find any link with text
                link = element.select_one("a")
                if link:
                    title = link.get_text().strip()
                    title_link = link.get("href")

            if not title:
                return None

            article["title"] = title

            # Extract link if not found yet
            if not title_link:
                link_elem = element.select_one("a")
                if link_elem:
                    title_link = link_elem.get("href")

            # Make link absolute if relative
            if title_link:
                if title_link.startswith("/"):
                    title_link = f"{self.BASE_URL}{title_link}"
                article["url"] = title_link

            # Extract description/summary
            desc_selectors = ["p", ".feed-post-body-resumo", ".widget__description"]
            for selector in desc_selectors:
                desc_elem = element.select_one(selector)
                if desc_elem:
                    description = desc_elem.get_text().strip()
                    if description and len(description) > 20:
                        article["description"] = description
                        break

            # Extract date/time
            time_selectors = ["time", ".feed-post-datetime", "[datetime]"]
            for selector in time_selectors:
                time_elem = element.select_one(selector)
                if time_elem:
                    published_date = time_elem.get("datetime")
                    if not published_date:
                        published_date = time_elem.get_text().strip()

                    if published_date:
                        article["published_at"] = published_date
                        break

            return article

        except Exception as e:
            logger.debug(f"Error parsing article element: {e}")
            return None

    async def health_check(self) -> bool:
        """Check if Valor Econômico is accessible"""
        try:
            await self.initialize()
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Check if we can find article elements
            for selector in ["article", ".feed-post", ".widget--card"]:
                elements = soup.select(selector)
                if elements:
                    return True

            return False

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_valor():
    """Test Valor scraper"""
    scraper = ValorScraper()

    try:
        result = await scraper.scrape("mercados")

        if result.success:
            print("✅ Success!")
            print(f"Articles found: {result.data['articles_count']}")
            for article in result.data['articles'][:3]:
                print(f"  - {article.get('title', 'No title')}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_valor())
