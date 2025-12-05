# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
Bloomberg Línea Scraper - Notícias do mercado financeiro
Fonte: https://www.bloomberglinea.com.br/
Acesso público (sem login)

OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing (~10x faster)
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class BloombergScraper(BaseScraper):
    """
    Scraper for Bloomberg Línea news

    MIGRATED TO PLAYWRIGHT - Uses BeautifulSoup for local parsing
    """

    BASE_URL = "https://www.bloomberglinea.com.br"

    def __init__(self):
        super().__init__(
            name="Bloomberg Línea",
            source="BLOOMBERG",
            requires_login=False,
        )

    async def scrape(self, query: str = "mercado") -> ScraperResult:
        """
        Scrape Bloomberg Línea news

        Args:
            query: Search term or category (default: "mercado")

        Returns:
            ScraperResult with news articles
        """
        try:
            if not self.page:
                await self.initialize()

            # Build URL based on query type
            if query.lower() in ["mercado", "mercados"]:
                url = f"{self.BASE_URL}/mercados/"
            elif query.lower() in ["economia", "economico"]:
                url = f"{self.BASE_URL}/economia/"
            elif query.lower() in ["politica", "política"]:
                url = f"{self.BASE_URL}/politica/"
            elif query.lower() in ["empresas", "negocios"]:
                url = f"{self.BASE_URL}/negocios/"
            else:
                # General search
                url = f"{self.BASE_URL}/busca/?q={query}"

            logger.info(f"Fetching Bloomberg news from: {url}")
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
                        "source": "Bloomberg Línea",
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
            logger.error(f"Error scraping Bloomberg: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    def _extract_articles(self, html_content: str) -> List[Dict[str, Any]]:
        """
        Extract news articles from the page

        OPTIMIZED: Uses BeautifulSoup for local parsing (no await operations)

        Bloomberg Línea uses a link-based structure without traditional article tags.
        We extract news from anchor elements with meaningful text and news URLs.
        """
        articles = []
        seen_urls = set()  # Avoid duplicates

        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            # Bloomberg Línea structure: news are links with text > 20 chars
            # and URLs containing category paths like /mercados/, /economia/, etc.
            news_categories = ['/mercados/', '/economia/', '/negocios/', '/politica/', '/tecnologia/']

            all_links = soup.select('a')
            logger.debug(f"Found {len(all_links)} total links")

            for link in all_links:
                href = link.get('href', '')
                text = link.get_text(strip=True)

                # Filter: must have text > 20 chars and be a news URL (not category root)
                if not text or len(text) < 20:
                    continue

                # Must be a news URL (contains category but is not just the category)
                is_news_url = any(cat in href for cat in news_categories)
                is_category_root = href in news_categories

                if not is_news_url or is_category_root:
                    continue

                # Avoid duplicates
                if href in seen_urls:
                    continue
                seen_urls.add(href)

                # Build article data
                article = {
                    "title": text,
                    "url": href if href.startswith('http') else f"{self.BASE_URL}{href}",
                }

                # Try to find parent with date/time info
                parent = link.parent
                for _ in range(3):  # Go up 3 levels max
                    if parent:
                        time_elem = parent.select_one('time, [datetime], .date, .time')
                        if time_elem:
                            article["published_at"] = time_elem.get('datetime') or time_elem.get_text(strip=True)
                            break
                        parent = parent.parent

                articles.append(article)

                # Limit to 20 articles
                if len(articles) >= 20:
                    break

            logger.info(f"Successfully extracted {len(articles)} articles")

        except Exception as e:
            logger.error(f"Error extracting articles: {e}")

        return articles

    def _parse_article(self, element) -> Optional[Dict[str, Any]]:
        """Parse a single article element using BeautifulSoup"""
        try:
            article = {}

            # Extract title
            title_selectors = [
                "h2", "h3", "h4",
                ".article-title",
                ".story-title",
                "[data-testid='article-title']",
            ]

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
                        # Look for link within title element
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
            desc_selectors = [
                "p",
                ".article-description",
                ".story-description",
                ".excerpt",
                "[data-testid='article-description']",
            ]

            for selector in desc_selectors:
                desc_elem = element.select_one(selector)
                if desc_elem:
                    description = desc_elem.get_text().strip()
                    if description and len(description) > 20:
                        article["description"] = description
                        break

            # Extract date/time
            time_selectors = [
                "time",
                ".article-date",
                ".publish-date",
                "[datetime]",
                ".post-date",
            ]

            for selector in time_selectors:
                time_elem = element.select_one(selector)
                if time_elem:
                    # Try datetime attribute first
                    published_date = time_elem.get("datetime")
                    if not published_date:
                        published_date = time_elem.get_text().strip()

                    if published_date:
                        article["published_at"] = published_date
                        break

            # Extract category if available
            category_elem = element.select_one(".category, .section, [data-category]")
            if category_elem:
                article["category"] = category_elem.get_text().strip()

            # Extract author if available
            author_elem = element.select_one(".author, .byline, [data-author]")
            if author_elem:
                article["author"] = author_elem.get_text().strip()

            return article

        except Exception as e:
            logger.debug(f"Error parsing article element: {e}")
            return None

    async def health_check(self) -> bool:
        """Check if Bloomberg Línea is accessible"""
        try:
            await self.initialize()
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Check if we can find article elements
            for selector in ["article", ".article-card", ".story-card"]:
                elements = soup.select(selector)
                if elements:
                    return True

            return False

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_bloomberg():
    """Test Bloomberg scraper"""
    scraper = BloombergScraper()

    try:
        result = await scraper.scrape("mercado")

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
    asyncio.run(test_bloomberg())
