"""
Bloomberg Línea Scraper - Notícias do mercado financeiro
Fonte: https://www.bloomberglinea.com.br/
Acesso público (sem login)
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class BloombergScraper(BaseScraper):
    """Scraper for Bloomberg Línea news"""

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
        await self.initialize()

        try:
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
            self.driver.get(url)

            # Wait for articles to load
            await asyncio.sleep(3)

            # Extract articles
            articles = await self._extract_articles()

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

    async def _extract_articles(self) -> List[Dict[str, Any]]:
        """Extract news articles from the page"""
        articles = []

        try:
            # Try multiple article selectors
            article_selectors = [
                "article",
                ".article-card",
                ".story-card",
                "[data-testid='article']",
                ".post-item",
            ]

            article_elements = []
            for selector in article_selectors:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        article_elements = elements
                        logger.debug(f"Found {len(elements)} articles using selector: {selector}")
                        break
                except:
                    continue

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
        """Parse a single article element"""
        try:
            article = {}

            # Extract title
            title_selectors = [
                "h2", "h3", "h4",
                ".article-title",
                ".story-title",
                "[data-testid='article-title']",
                "a[href*='bloomberg']",
            ]

            title = None
            title_link = None

            for selector in title_selectors:
                try:
                    title_elem = element.find_element(By.CSS_SELECTOR, selector)
                    if title_elem:
                        title = title_elem.text.strip()
                        # Try to get link
                        if title_elem.tag_name == "a":
                            title_link = title_elem.get_attribute("href")
                        else:
                            # Look for link within title element
                            try:
                                link_elem = title_elem.find_element(By.TAG_NAME, "a")
                                title_link = link_elem.get_attribute("href")
                            except:
                                pass

                        if title:
                            break
                except:
                    continue

            if not title:
                return None

            article["title"] = title

            # Extract link if not found yet
            if not title_link:
                try:
                    link_elem = element.find_element(By.TAG_NAME, "a")
                    title_link = link_elem.get_attribute("href")
                except:
                    pass

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

            description = None
            for selector in desc_selectors:
                try:
                    desc_elem = element.find_element(By.CSS_SELECTOR, selector)
                    if desc_elem:
                        description = desc_elem.text.strip()
                        if description and len(description) > 20:
                            break
                except:
                    continue

            if description:
                article["description"] = description

            # Extract date/time
            time_selectors = [
                "time",
                ".article-date",
                ".publish-date",
                "[datetime]",
                ".post-date",
            ]

            published_date = None
            for selector in time_selectors:
                try:
                    time_elem = element.find_element(By.CSS_SELECTOR, selector)
                    if time_elem:
                        # Try datetime attribute first
                        published_date = time_elem.get_attribute("datetime")
                        if not published_date:
                            published_date = time_elem.text.strip()

                        if published_date:
                            break
                except:
                    continue

            if published_date:
                article["published_at"] = published_date

            # Extract category if available
            try:
                category_elem = element.find_element(By.CSS_SELECTOR, ".category, .section, [data-category]")
                if category_elem:
                    article["category"] = category_elem.text.strip()
            except:
                pass

            # Extract author if available
            try:
                author_elem = element.find_element(By.CSS_SELECTOR, ".author, .byline, [data-author]")
                if author_elem:
                    article["author"] = author_elem.text.strip()
            except:
                pass

            return article

        except Exception as e:
            logger.debug(f"Error parsing article element: {e}")
            return None

    async def health_check(self) -> bool:
        """Check if Bloomberg Línea is accessible"""
        try:
            await self.initialize()
            self.driver.get(self.BASE_URL)

            # Wait for page to load
            await asyncio.sleep(2)

            # Check if we can find article elements
            article_found = False
            for selector in ["article", ".article-card", ".story-card"]:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        article_found = True
                        break
                except:
                    continue

            return article_found

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
