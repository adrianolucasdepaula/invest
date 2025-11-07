"""
Mais Retorno Scraper - Análises e educação financeira
Fonte: https://maisretorno.com/
Requer login via Google OAuth
"""
import asyncio
import pickle
from datetime import datetime
from typing import Dict, Any, List, Optional
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class MaisRetornoScraper(BaseScraper):
    """Scraper for Mais Retorno analysis and educational content"""

    BASE_URL = "https://maisretorno.com"
    COOKIES_FILE = "/app/browser-profiles/google_cookies.pkl"

    def __init__(self):
        super().__init__(
            name="Mais Retorno",
            source="MAISRETORNO",
            requires_login=True,
        )

    async def initialize(self):
        """Load Google OAuth cookies"""
        if self._initialized:
            return

        if not self.driver:
            self.driver = self._create_driver()

        try:
            # Navigate to site
            self.driver.get(self.BASE_URL)
            await asyncio.sleep(2)

            # Load Google OAuth cookies
            try:
                with open(self.COOKIES_FILE, 'rb') as f:
                    cookies = pickle.load(f)

                for cookie in cookies:
                    domain = cookie.get('domain', '')
                    if 'maisretorno.com' in domain or 'google.com' in domain:
                        try:
                            self.driver.add_cookie(cookie)
                        except Exception as e:
                            logger.debug(f"Could not add cookie: {e}")

                # Refresh page to apply cookies
                self.driver.refresh()
                await asyncio.sleep(3)

            except FileNotFoundError:
                logger.warning("Google cookies not found. Will attempt without login.")

            # Verify login
            if self.requires_login and not await self._verify_logged_in():
                logger.warning("Login verification failed - some content may not be accessible")

            self._initialized = True

        except Exception as e:
            logger.error(f"Error initializing Mais Retorno scraper: {e}")
            raise

    async def _verify_logged_in(self) -> bool:
        """Check if logged in via Google"""
        login_indicators = [
            "//a[contains(text(), 'Sair')]",
            "//button[contains(text(), 'Sair')]",
            "//a[contains(@href, 'logout')]",
            "//a[contains(@href, 'signout')]",
            ".user-info",
            ".user-menu",
            ".profile-menu",
            "[data-testid='user-menu']",
        ]

        for selector in login_indicators:
            try:
                if selector.startswith("//"):
                    elements = self.driver.find_elements(By.XPATH, selector)
                else:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)

                if elements:
                    logger.info("User logged in to Mais Retorno successfully")
                    return True
            except:
                continue

        return False

    async def scrape(self, query: str = "analise") -> ScraperResult:
        """
        Scrape analysis and reports from Mais Retorno

        Args:
            query: Search term or category (default: "analise")

        Returns:
            ScraperResult with articles/reports
        """
        await self.initialize()

        try:
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
            self.driver.get(url)

            # Wait for content to load
            await asyncio.sleep(4)

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
        """Extract articles and analysis from the page"""
        articles = []

        try:
            # Try multiple article container selectors
            article_selectors = [
                "article",
                ".post",
                ".card",
                ".article-item",
                ".blog-post",
                "[class*='post-']",
                "[class*='article']",
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
                    title_elem = element.find_element(By.CSS_SELECTOR, selector)
                    if title_elem:
                        title = title_elem.text.strip()

                        # Try to get link
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
                ".card-text",
                ".excerpt",
                ".description",
                ".summary",
                "p",
                ".post-excerpt",
            ]

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
                    time_elem = element.find_element(By.CSS_SELECTOR, selector)
                    if time_elem:
                        published_date = time_elem.get_attribute("datetime")
                        if not published_date:
                            published_date = time_elem.text.strip()

                        if published_date:
                            article["published_at"] = published_date
                            break
                except:
                    continue

            # Extract category
            try:
                category_elem = element.find_element(By.CSS_SELECTOR, ".category, .tag, .badge, .label")
                if category_elem:
                    article["category"] = category_elem.text.strip()
            except:
                pass

            # Extract author
            try:
                author_elem = element.find_element(By.CSS_SELECTOR, ".author, .byline, .writer")
                if author_elem:
                    article["author"] = author_elem.text.strip()
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
            self.driver.get(self.BASE_URL)
            await asyncio.sleep(2)

            # Check if we can find article elements
            for selector in ["article", ".post", ".card"]:
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
