# MIGRATED TO PLAYWRIGHT - 2025-12-04
"""
InfoMoney Scraper - Notícias financeiras e investimentos
Fonte: https://www.infomoney.com.br/
Requer login via Google OAuth

OPTIMIZED: Uses single HTML fetch + BeautifulSoup local parsing (~10x faster)
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from loguru import logger
from bs4 import BeautifulSoup

from base_scraper import BaseScraper, ScraperResult


class InfoMoneyScraper(BaseScraper):
    """
    Scraper for InfoMoney news

    MIGRATED TO PLAYWRIGHT - Uses BeautifulSoup for local parsing
    """

    BASE_URL = "https://www.infomoney.com.br"
    COOKIES_FILE = Path("/app/data/cookies/infomoney_session.json")

    def __init__(self):
        super().__init__(
            name="InfoMoney",
            source="INFOMONEY",
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

                    infomoney_cookies = []
                    for cookie in cookies:
                        if isinstance(cookie, dict) and ('infomoney.com.br' in cookie.get('domain', '')):
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

                            infomoney_cookies.append(pw_cookie)

                    if infomoney_cookies:
                        await self.page.context.add_cookies(infomoney_cookies)
                        logger.info(f"Loaded {len(infomoney_cookies)} cookies for InfoMoney")
                        await self.page.reload()
                        await asyncio.sleep(2)

                except Exception as e:
                    logger.warning(f"Could not load InfoMoney cookies: {e}")
            else:
                logger.debug("InfoMoney cookies not found. Using without login.")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing InfoMoney scraper: {e}")
            raise

    async def scrape(self, query: str = "mercados") -> ScraperResult:
        """
        Scrape InfoMoney news

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
                url = f"{self.BASE_URL}/mercados/"
            elif query.lower() in ["onde-investir", "investir"]:
                url = f"{self.BASE_URL}/onde-investir/"
            elif query.lower() in ["empresa", "empresas"]:
                url = f"{self.BASE_URL}/negocios/"
            else:
                url = f"{self.BASE_URL}/?s={query}"

            logger.info(f"Fetching InfoMoney news from: {url}")
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
                        "source": "InfoMoney",
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
            logger.error(f"Error scraping InfoMoney: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    def _extract_articles(self, html_content: str) -> List[Dict[str, Any]]:
        """
        Extract news articles from the page

        OPTIMIZED: Uses BeautifulSoup for local parsing (no await operations)

        InfoMoney uses link-based structure. Articles are links with
        infomoney.com.br/mercados/ in URL and meaningful text (> 30 chars).
        """
        articles = []
        seen_urls = set()  # Avoid duplicates

        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            # InfoMoney structure: news are links with domain URL and text > 30 chars
            # Filter out landing pages and non-article content
            all_links = soup.select('a')
            logger.debug(f"Found {len(all_links)} total links")

            # URLs patterns to exclude
            exclude_patterns = ['lps.infomoney', '/onde-investir/', '/glossario/', '/calculadora/']

            for link in all_links:
                href = link.get('href', '')
                text = link.get_text(strip=True)

                # Skip if no meaningful text
                if not text or len(text) < 30:
                    continue

                # Must be an infomoney article URL
                if 'www.infomoney.com.br/' not in href:
                    continue

                # Skip excluded patterns
                if any(pattern in href for pattern in exclude_patterns):
                    continue

                # Avoid duplicates
                if href in seen_urls:
                    continue
                seen_urls.add(href)

                # Build article data
                article = {
                    "title": text,
                    "url": href,
                }

                # Try to find date from parent elements
                parent = link.parent
                for _ in range(4):
                    if parent:
                        time_elem = parent.select_one('time, [datetime], .date, .im-date')
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
            title_selectors = ["h2", "h3", ".im-article-card__title", ".post-title"]
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
            desc_selectors = ["p", ".im-article-card__excerpt", ".post-excerpt"]
            for selector in desc_selectors:
                desc_elem = element.select_one(selector)
                if desc_elem:
                    description = desc_elem.get_text().strip()
                    if description and len(description) > 20:
                        article["description"] = description
                        break

            # Extract date/time
            time_selectors = ["time", ".im-article-card__date", "[datetime]"]
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
        """Check if InfoMoney is accessible"""
        try:
            await self.initialize()
            await self.page.goto(self.BASE_URL, wait_until="load", timeout=60000)
            await asyncio.sleep(2)

            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Check if we can find article elements
            for selector in ["article", ".im-article-card", ".post-item"]:
                elements = soup.select(selector)
                if elements:
                    return True

            return False

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False


# Test function
async def test_infomoney():
    """Test InfoMoney scraper"""
    scraper = InfoMoneyScraper()

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
    asyncio.run(test_infomoney())
