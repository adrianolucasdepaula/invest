"""
Valor Econômico Scraper - Notícias do mercado financeiro brasileiro
Fonte: https://valor.globo.com/
Requer login via Google OAuth
"""
import asyncio
import pickle
from datetime import datetime
from typing import Dict, Any, List, Optional
from selenium.webdriver.common.by import By
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class ValorScraper(BaseScraper):
    """Scraper for Valor Econômico news"""

    BASE_URL = "https://valor.globo.com"
    COOKIE_PATH = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="Valor Econômico",
            source="VALOR",
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
                        if cookie.get('domain', '') in ['.globo.com', '.valor.globo.com']:
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

    async def scrape(self, query: str = "mercados") -> ScraperResult:
        """
        Scrape Valor Econômico news

        Args:
            query: Search term or category (default: "mercados")

        Returns:
            ScraperResult with news articles
        """
        await self.initialize()

        try:
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
            self.driver.get(url)
            await asyncio.sleep(3)

            # Extract articles
            articles = await self._extract_articles()

            if articles:
                return ScraperResult(
                    success=True,
                    data={
                        "source": "Valor Econômico",
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
            logger.error(f"Error scraping Valor: {e}")
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
                ".feed-post",
                ".bastian-feed-item",
                ".widget--card",
                "[data-type='materia']",
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
            title_selectors = ["h2", "h3", ".feed-post-body-title", ".widget__title"]
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
            desc_selectors = ["p", ".feed-post-body-resumo", ".widget__description"]
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
            time_selectors = ["time", ".feed-post-datetime", "[datetime]"]
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
        """Check if Valor Econômico is accessible"""
        try:
            await self.initialize()
            self.driver.get(self.BASE_URL)
            await asyncio.sleep(2)

            # Check if we can find article elements
            for selector in ["article", ".feed-post", ".widget--card"]:
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
