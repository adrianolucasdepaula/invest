# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
Google News Scraper - Notícias gerais e financeiras
Fonte: https://news.google.com/
Acesso público (sem login)

OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing (~10x faster)
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class GoogleNewsScraper(BaseScraper):
    """
    Scraper for Google News

    MIGRATED TO PLAYWRIGHT - Uses BeautifulSoup for local parsing
    """

    BASE_URL = "https://news.google.com"

    def __init__(self):
        super().__init__(
            name="Google News",
            source="GOOGLENEWS",
            requires_login=False,
        )

    async def scrape(self, query: str = "mercado financeiro") -> ScraperResult:
        """
        Scrape Google News

        Args:
            query: Search term (default: "mercado financeiro")

        Returns:
            ScraperResult with news articles
        """
        try:
            if not self.page:
                await self.initialize()

            # Build search URL
            if query.lower() in ["brasil", "brazil"]:
                url = f"{self.BASE_URL}/topics/CAAqJQgKIh9DQkFTRVFvSUwyMHZNRFZ4ZERBU0JYQjBMVUpTS0FBUAE?hl=pt-BR&gl=BR&ceid=BR%3Apt-419"
            elif query.lower() in ["negocios", "negócios", "business"]:
                url = f"{self.BASE_URL}/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0JYQjBMVUpTS0FBUAE?hl=pt-BR&gl=BR&ceid=BR%3Apt-419"
            else:
                # Search query
                url = f"{self.BASE_URL}/search?q={query}&hl=pt-BR&gl=BR&ceid=BR%3Apt-419"

            logger.info(f"Fetching Google News from: {url}")
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
                        "source": "Google News",
                        "query": query,
                        "url": url,
                        "articles_count": len(articles),
                        "articles": articles,
                        "scraped_at": datetime.now().isoformat(),
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
            logger.error(f"Error scraping Google News: {e}")
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
                ".xrnccd",
                ".IBr9hb",
                "[data-n-tid]",
                ".JKIgvd",
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
            title_selectors = ["h3", "h4", "a.DY5T1d", ".gPFEn"]
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

            # Google News URLs are redirects, keep them as-is
            if title_link:
                if title_link.startswith("./"):
                    title_link = f"{self.BASE_URL}/{title_link[2:]}"
                article["url"] = title_link

            # Extract source/publisher
            source_elem = element.select_one(".wEwyrc, .vr1PYe")
            if source_elem:
                article["publisher"] = source_elem.get_text().strip()

            # Extract date
            time_selectors = ["time", ".hvbAAd", "[datetime]"]
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
        """Check if Google News is accessible"""
        try:
            await self.initialize()
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Check if we can find article elements
            for selector in ["article", ".xrnccd", ".IBr9hb"]:
                elements = soup.select(selector)
                if elements:
                    return True

            return False

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_googlenews():
    """Test Google News scraper"""
    scraper = GoogleNewsScraper()

    try:
        result = await scraper.scrape("mercado financeiro")

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
    asyncio.run(test_googlenews())
