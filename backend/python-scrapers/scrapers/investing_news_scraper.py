"""
Investing News Scraper - Notícias de investimentos internacionais
Fonte: https://br.investing.com/news/
Requer login via Google OAuth
"""
import asyncio
import pickle
from datetime import datetime
from typing import Dict, Any, List, Optional
from selenium.webdriver.common.by import By
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class InvestingNewsScraper(BaseScraper):
    """Scraper for Investing.com News"""

    BASE_URL = "https://br.investing.com"
    COOKIE_PATH = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="Investing News",
            source="INVESTING",
            requires_login=True,
        )

    async def initialize(self):
        """Initialize scraper with Google OAuth cookies"""
        if self._initialized:
            return

        try:
            logger.info(f"Initializing {self.name} with Google OAuth...")

            if not self.driver:
                self.driver = self._create_driver()

            # Navigate to site
            self.driver.get(self.BASE_URL)
            await asyncio.sleep(2)

            # Load cookies if available
            try:
                with open(self.COOKIE_PATH, 'rb') as f:
                    cookies = pickle.load(f)
                    for cookie in cookies:
                        if cookie.get('domain', '') in ['.investing.com', 'investing.com']:
                            try:
                                self.driver.add_cookie(cookie)
                            except:
                                pass
                logger.info("Google OAuth cookies loaded")
            except FileNotFoundError:
                logger.warning(f"Cookie file not found: {self.COOKIE_PATH}")
            except Exception as e:
                logger.warning(f"Error loading cookies: {e}")

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
        await self.initialize()

        try:
            # Build URL based on query
            if query.lower() in ["latest", "ultimas", "últimas"]:
                url = f"{self.BASE_URL}/news/latest-news"
            elif query.lower() in ["acoes", "ações", "stocks"]:
                url = f"{self.BASE_URL}/news/stock-market-news"
            elif query.lower() in ["commodities", "commodity"]:
                url = f"{self.BASE_URL}/news/commodities-news"
            elif query.lower() in ["forex", "cambio", "câmbio"]:
                url = f"{self.BASE_URL}/news/forex-news"
            elif query.lower() in ["economia", "economy"]:
                url = f"{self.BASE_URL}/news/economy"
            else:
                # Search query
                url = f"{self.BASE_URL}/search/?q={query}&tab=news"

            logger.info(f"Fetching Investing News from: {url}")
            self.driver.get(url)
            await asyncio.sleep(3)

            # Extract articles
            articles = await self._extract_articles()

            if articles:
                return ScraperResult(
                    success=True,
                    data={
                        "source": "Investing News",
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
            logger.error(f"Error scraping Investing News: {e}")
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
                ".largeTitle",
                ".articleItem",
                "[data-test='article']",
                ".js-article-item",
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
            title_selectors = ["h3", "h2", ".textDiv a", ".title"]
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
                if title_link.startswith("/"):
                    title_link = f"{self.BASE_URL}{title_link}"
                article["url"] = title_link

            # Extract description
            desc_selectors = ["p", ".articleDesc", ".summary"]
            for selector in desc_selectors:
                try:
                    desc_elem = element.find_element(By.CSS_SELECTOR, selector)
                    if desc_elem:
                        description = desc_elem.text.strip()
                        if description and len(description) > 20:
                            article["description"] = description
                            break
                except:
                    continue

            # Extract date
            time_selectors = ["time", ".articleDetails span", "[data-test='article-publish-date']"]
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
        """Check if Investing.com is accessible"""
        try:
            await self.initialize()
            self.driver.get(f"{self.BASE_URL}/news/latest-news")
            await asyncio.sleep(2)

            # Check if we can find article elements
            for selector in ["article", ".largeTitle", ".articleItem"]:
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
