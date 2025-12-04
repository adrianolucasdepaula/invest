"""
Mais Retorno Scraper - Análises e educação financeira
Fonte: https://maisretorno.com/
Requer login via Google OAuth

MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class MaisRetornoScraper(BaseScraper):
    """
    Scraper for Mais Retorno analysis and educational content

    OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing
    instead of multiple Selenium find_element calls. ~10x faster!
    """

    BASE_URL = "https://maisretorno.com"
    COOKIES_FILE = "/app/data/cookies/maisretorno_session.json"

    def __init__(self):
        super().__init__(
            name="Mais Retorno",
            source="MAISRETORNO",
            requires_login=True,
        )

    async def initialize(self):
        """Initialize Playwright browser and load cookies"""
        if self._initialized:
            return

        # Call parent initialize to create browser/page
        await super().initialize()

        try:
            # Navigate to site
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            # Load cookies if available
            cookies_path = Path(self.COOKIES_FILE)
            if cookies_path.exists():
                try:
                    with open(cookies_path, 'r') as f:
                        session_data = json.load(f)

                    # Handle both formats: list [...] or dict {"cookies": [...]}
                    if isinstance(session_data, list):
                        cookies = session_data
                    else:
                        cookies = session_data.get('cookies', [])

                    if cookies:
                        await self.page.context.add_cookies(cookies)
                        logger.info(f"Loaded {len(cookies)} cookies for Mais Retorno")

                        # Refresh to apply cookies
                        await self.page.reload(wait_until="load")
                        await asyncio.sleep(2)

                except Exception as e:
                    logger.warning(f"Could not load cookies: {e}")
            else:
                logger.warning("Mais Retorno cookies not found. Will attempt without login.")

            # Verify login
            if self.requires_login and not await self._verify_logged_in():
                logger.warning("Login verification failed - some content may not be accessible")

        except Exception as e:
            logger.error(f"Error initializing Mais Retorno scraper: {e}")
            raise

    async def _verify_logged_in(self) -> bool:
        """Check if logged in via Google"""
        try:
            html = await self.page.content()
            # Check for logout indicators
            logout_indicators = ['sair', 'logout', 'signout', 'user-menu', 'profile', 'minha-conta']
            html_lower = html.lower()
            return any(indicator in html_lower for indicator in logout_indicators)
        except:
            return False

    async def scrape(self, query: str = "analise") -> ScraperResult:
        """
        Scrape analysis and reports from Mais Retorno

        Args:
            query: Search term or category (default: "analise")

        Returns:
            ScraperResult with articles/reports
        """
        try:
            # Ensure page is initialized
            if not self.page:
                await self.initialize()

            # Build URL based on query
            if query.lower() in ["analise", "análise", "analises"]:
                url = f"{self.BASE_URL}/blog/categoria/analises/"
            elif query.lower() in ["acoes", "ações"]:
                url = f"{self.BASE_URL}/portal/acoes/"
            elif query.lower() in ["fundos", "fii", "fiis"]:
                url = f"{self.BASE_URL}/portal/fundos-imobiliarios/"
            elif query.lower() in ["educacao", "educação", "aprenda"]:
                url = f"{self.BASE_URL}/blog/categoria/aprenda/"
            elif query.lower() in ["noticias", "notícias", "mercado"]:
                url = f"{self.BASE_URL}/blog/categoria/noticias/"
            else:
                # Use search
                url = f"{self.BASE_URL}/?s={query}"

            logger.info(f"Fetching Mais Retorno from: {url}")
            await self.page.goto(url, wait_until="load", timeout=60000)

            # Wait for content to load
            await asyncio.sleep(3)

            # Extract articles/reports
            articles = await self._extract_articles()

            if articles:
                return ScraperResult(
                    success=True,
                    data={
                        "source": "Mais Retorno",
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
                        "requires_login": True,
                    },
                )

            return ScraperResult(
                success=False,
                error="No articles found",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping Mais Retorno: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_articles(self) -> List[Dict[str, Any]]:
        """
        Extract articles and analysis from the page

        OPTIMIZED: Uses single HTML fetch + local parsing (BeautifulSoup)
        """
        articles = []

        try:
            # OPTIMIZATION: Get HTML content once and parse locally
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Try multiple article container selectors
            article_selectors = [
                "article",
                ".post",
                ".card",
                ".article-item",
                ".blog-post",
            ]

            article_elements = []
            for selector in article_selectors:
                try:
                    elements = soup.select(selector)
                    if elements:
                        article_elements = elements
                        logger.debug(f"Found {len(elements)} articles using selector: {selector}")
                        break
                except:
                    continue

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
            title_selectors = [
                "h2", "h3", "h4",
                ".card-title",
                ".post-title",
                ".article-title",
                ".entry-title",
            ]

            title = None
            title_link = None

            for selector in title_selectors:
                try:
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
                except:
                    continue

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
                ".card-text",
                ".excerpt",
                ".description",
                ".summary",
                "p",
                ".post-excerpt",
            ]

            for selector in desc_selectors:
                try:
                    desc_elem = element.select_one(selector)
                    if desc_elem:
                        description = desc_elem.get_text().strip()
                        if description and len(description) > 20:
                            article["description"] = description
                            break
                except:
                    continue

            # Extract date
            time_selectors = [
                "time",
                ".date",
                ".published",
                ".post-date",
                "[datetime]",
                ".entry-date",
            ]

            for selector in time_selectors:
                try:
                    time_elem = element.select_one(selector)
                    if time_elem:
                        published_date = time_elem.get("datetime")
                        if not published_date:
                            published_date = time_elem.get_text().strip()

                        if published_date:
                            article["published_at"] = published_date
                            break
                except:
                    continue

            # Extract category
            try:
                category_elem = element.select_one(".category, .tag, .badge, .label")
                if category_elem:
                    article["category"] = category_elem.get_text().strip()
            except:
                pass

            # Extract author
            try:
                author_elem = element.select_one(".author, .byline, .writer")
                if author_elem:
                    article["author"] = author_elem.get_text().strip()
            except:
                pass

            return article

        except Exception as e:
            logger.debug(f"Error parsing article element: {e}")
            return None

    async def health_check(self) -> bool:
        """Check if Mais Retorno is accessible"""
        try:
            await self.initialize()
            return True
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_maisretorno():
    """Test Mais Retorno scraper"""
    scraper = MaisRetornoScraper()

    try:
        await scraper.initialize()
        result = await scraper.scrape("analise")

        if result.success:
            print("✅ Success!")
            print(f"Articles found: {result.data.get('articles_count', 0)}")
            if result.data.get('articles'):
                for article in result.data['articles'][:3]:
                    print(f"  - {article.get('title', 'N/A')}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_maisretorno())
