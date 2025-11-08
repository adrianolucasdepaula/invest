"""
Google News Scraper - Notícias gerais e financeiras
Fonte: https://news.google.com/
Acesso público (sem login)
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from selenium.webdriver.common.by import By
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class GoogleNewsScraper(BaseScraper):
    """Scraper for Google News"""

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
        await self.initialize()

        try:
            # Build search URL
            if query.lower() in ["brasil", "brazil"]:
                url = f"{self.BASE_URL}/topics/CAAqJQgKIh9DQkFTRVFvSUwyMHZNRFZ4ZERBU0JYQjBMVUpTS0FBUAE?hl=pt-BR&gl=BR&ceid=BR%3Apt-419"
            elif query.lower() in ["negocios", "negócios", "business"]:
                url = f"{self.BASE_URL}/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0JYQjBMVUpTS0FBUAE?hl=pt-BR&gl=BR&ceid=BR%3Apt-419"
            else:
                # Search query
                url = f"{self.BASE_URL}/search?q={query}&hl=pt-BR&gl=BR&ceid=BR%3Apt-419"

            logger.info(f"Fetching Google News from: {url}")
            self.driver.get(url)
            await asyncio.sleep(3)

            # Extract articles
            articles = await self._extract_articles()

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

    async def _extract_articles(self) -> List[Dict[str, Any]]:
        """Extract news articles from the page"""
        articles = []

        try:
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
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
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
        """Parse a single article element"""
        try:
            article = {}

            # Extract title
            title_selectors = ["h3", "h4", "a.DY5T1d", ".gPFEn"]
            title = None
            title_link = None

            for selector in title_selectors:
                try:
                    title_elem = element.find_element(By.CSS_SELECTOR, selector)
                    if title_elem:
                        title = title_elem.text.strip()
                        if title_elem.tag_name == "a":
                            title_link = title_elem.get_attribute("href")
                        else:
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

            # Extract link
            if not title_link:
                try:
                    link_elem = element.find_element(By.TAG_NAME, "a")
                    title_link = link_elem.get_attribute("href")
                except:
                    pass

            if title_link:
                # Google News URLs are redirects, keep them as-is
                article["url"] = title_link

            # Extract source/publisher
            try:
                source_elem = element.find_element(By.CSS_SELECTOR, ".wEwyrc, .vr1PYe")
                if source_elem:
                    article["publisher"] = source_elem.text.strip()
            except:
                pass

            # Extract date
            time_selectors = ["time", ".hvbAAd", "[datetime]"]
            for selector in time_selectors:
                try:
                    time_elem = element.find_element(By.CSS_SELECTOR, selector)
                    if time_elem:
                        published_date = time_elem.get_attribute("datetime") or time_elem.text.strip()
                        if published_date:
                            article["published_at"] = published_date
                            break
                except:
                    continue

            return article

        except Exception as e:
            logger.debug(f"Error parsing article element: {e}")
            return None

    async def health_check(self) -> bool:
        """Check if Google News is accessible"""
        try:
            await self.initialize()
            self.driver.get(self.BASE_URL)
            await asyncio.sleep(2)

            # Check if we can find article elements
            for selector in ["article", ".xrnccd", ".IBr9hb"]:
                try:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements:
                        return True
                except:
                    continue

            return False

        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
