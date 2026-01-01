"""
E-Investidor (Estadão) Scraper - Artigos e análises de investimentos
Fonte: https://einvestidor.estadao.com.br/
Requer login via Google OAuth (gerenciado via VNC)

FASE 102: Novos scrapers para expandir cobertura (30/36 → 34/36)
MIGRATED TO PLAYWRIGHT - OAuth Manager pattern
"""
import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
from loguru import logger
from bs4 import BeautifulSoup
import re

from base_scraper import BaseScraper, ScraperResult


class EInvestidorScraper(BaseScraper):
    """
    Scraper para artigos e análises do E-Investidor (Estadão)

    PADRÃO: OAuth + Cookies (como investidor10_scraper.py)

    Requer login via Google OAuth (VNC porta 6080)

    Dados extraídos:
    - Artigos sobre ticker específico
    - Análises de mercado
    - Recomendações de analistas
    - Notícias relacionadas
    """

    BASE_URL = "https://einvestidor.estadao.com.br"
    COOKIES_FILE = "/app/data/cookies/einvestidor_session.json"

    def __init__(self):
        super().__init__(
            name="EInvestidor",
            source="EINVESTIDOR",
            requires_login=True,  # REQUER OAUTH
        )

    async def initialize(self):
        """Initialize with OAuth cookie management"""
        if self._initialized:
            return

        await super().initialize()

        try:
            # Navigate to base URL first
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
                        logger.info(f"Loaded {len(cookies)} cookies for EInvestidor")

                        # Refresh to apply cookies
                        await self.page.reload(wait_until="load")
                        await asyncio.sleep(2)

                except Exception as e:
                    logger.warning(f"Could not load cookies: {e}")
            else:
                logger.warning("EInvestidor cookies not found - use VNC to login first")

            # Verify login status
            if self.requires_login and not await self._verify_logged_in():
                logger.warning("Login verification failed - some content may be restricted")

        except Exception as e:
            logger.error(f"Error initializing EInvestidor scraper: {e}")
            raise

    async def _verify_logged_in(self) -> bool:
        """Check if logged in"""
        try:
            html = await self.page.content()
            html_lower = html.lower()
            # Check for logout/profile indicators
            login_indicators = ['sair', 'logout', 'minha conta', 'minha-conta', 'perfil', 'profile']
            return any(indicator in html_lower for indicator in login_indicators)
        except Exception:
            return False

    async def scrape(self, ticker: str) -> ScraperResult:
        """
        Scrape articles and analysis for ticker

        Args:
            ticker: Stock ticker (e.g., 'PETR4')

        Returns:
            ScraperResult with articles data
        """
        try:
            # Ensure page is initialized
            if not self.page:
                await self.initialize()

            # Search for ticker articles
            search_url = f"{self.BASE_URL}/busca/?q={ticker.upper()}"
            logger.info(f"Searching EInvestidor for {ticker}")

            await self.page.goto(search_url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # Check if search returned results
            page_source = await self.page.content()
            page_lower = page_source.lower()

            no_results_indicators = [
                "nenhum resultado",
                "não encontramos",
                "sem resultados",
                "0 resultados",
            ]

            if any(indicator in page_lower for indicator in no_results_indicators):
                return ScraperResult(
                    success=False,
                    error=f"No articles found for {ticker}",
                    source=self.source,
                )

            # Extract articles
            data = await self._extract_articles(ticker)

            if data and data.get("articles"):
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={"url": search_url, "requires_login": True},
                )

            return ScraperResult(
                success=False,
                error=f"No articles found for {ticker}",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping EInvestidor for {ticker}: {e}")
            return ScraperResult(success=False, error=str(e), source=self.source)

    async def _extract_articles(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Extract articles using BeautifulSoup Single Fetch pattern

        OPTIMIZATION: Get HTML once and parse locally (~10x faster)
        """
        try:
            data = {
                "ticker": ticker.upper(),
                "source": "EInvestidor",
                "scraped_at": datetime.now().isoformat(),
                "articles": [],
            }

            # OPTIMIZATION: Get HTML once and parse locally
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Find article cards - try multiple selectors
            article_selectors = [
                "article",
                ".article-card",
                ".news-item",
                ".resultado-busca",
                ".card-noticia",
                ".materia",
                "[class*='article']",
                "[class*='noticia']",
                ".lista-materias li",
            ]

            articles_found = []

            for selector in article_selectors:
                articles = soup.select(selector)
                for article in articles:
                    try:
                        article_data = self._parse_article(article)
                        if article_data and article_data.get("title"):
                            # Avoid duplicates
                            if article_data["title"] not in [a["title"] for a in articles_found]:
                                articles_found.append(article_data)
                    except Exception:
                        continue

            # Limit to 15 most recent articles
            data["articles"] = articles_found[:15]
            data["total_found"] = len(articles_found)

            logger.debug(f"Extracted {len(data['articles'])} articles for {ticker}")
            return data

        except Exception as e:
            logger.error(f"Error extracting articles: {e}")
            return None

    def _parse_article(self, article_elem) -> Optional[Dict[str, Any]]:
        """Parse single article element"""
        try:
            # Title
            title_selectors = ["h2", "h3", "h4", ".title", ".headline", ".titulo"]
            title = None
            for selector in title_selectors:
                title_elem = article_elem.select_one(selector)
                if title_elem:
                    title = title_elem.get_text().strip()
                    if len(title) > 10:  # Valid title
                        break
                    title = None

            if not title:
                return None

            # URL
            link_elem = article_elem.select_one("a[href]")
            url = None
            if link_elem:
                href = link_elem.get("href", "")
                if href:
                    if href.startswith("/"):
                        url = f"{self.BASE_URL}{href}"
                    elif href.startswith("http"):
                        url = href

            # Date
            date_selectors = ["time", ".date", ".data", ".published", "[datetime]", ".tempo"]
            date = None
            for selector in date_selectors:
                date_elem = article_elem.select_one(selector)
                if date_elem:
                    date = date_elem.get("datetime") or date_elem.get_text().strip()
                    if date:
                        break

            # Summary/excerpt
            summary_selectors = ["p", ".summary", ".excerpt", ".resumo", ".descricao"]
            summary = None
            for selector in summary_selectors:
                summary_elem = article_elem.select_one(selector)
                if summary_elem:
                    summary_text = summary_elem.get_text().strip()
                    if len(summary_text) > 20:  # Valid summary
                        summary = summary_text[:300]  # Limit length
                        break

            # Category/section
            category_selectors = [".category", ".section", ".tag", ".editoria"]
            category = None
            for selector in category_selectors:
                category_elem = article_elem.select_one(selector)
                if category_elem:
                    category = category_elem.get_text().strip()
                    break

            # Author
            author_selectors = [".author", ".autor", "[rel='author']", ".byline"]
            author = None
            for selector in author_selectors:
                author_elem = article_elem.select_one(selector)
                if author_elem:
                    author = author_elem.get_text().strip()
                    break

            return {
                "title": title,
                "url": url,
                "date": date,
                "summary": summary,
                "category": category,
                "author": author,
            }

        except Exception:
            return None

    async def scrape_market_overview(self) -> ScraperResult:
        """
        Scrape general market overview articles

        Returns:
            ScraperResult with market overview articles
        """
        try:
            if not self.page:
                await self.initialize()

            # Navigate to market section
            market_url = f"{self.BASE_URL}/mercado/"
            logger.info(f"Fetching market overview from EInvestidor")

            await self.page.goto(market_url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # Extract articles
            data = await self._extract_articles("MERCADO")
            data["type"] = "market_overview"

            if data and data.get("articles"):
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={"url": market_url, "type": "market_overview"},
                )

            return ScraperResult(
                success=False,
                error="No market overview articles found",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping market overview: {e}")
            return ScraperResult(success=False, error=str(e), source=self.source)

    async def scrape_recommendations(self) -> ScraperResult:
        """
        Scrape analyst recommendations

        Returns:
            ScraperResult with recommendations
        """
        try:
            if not self.page:
                await self.initialize()

            # Navigate to recommendations section
            rec_url = f"{self.BASE_URL}/recomendacoes/"
            logger.info(f"Fetching recommendations from EInvestidor")

            await self.page.goto(rec_url, wait_until="load", timeout=60000)
            await asyncio.sleep(3)

            # Extract articles
            data = await self._extract_articles("RECOMENDACOES")
            data["type"] = "recommendations"

            if data and data.get("articles"):
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={"url": rec_url, "type": "recommendations"},
                )

            return ScraperResult(
                success=False,
                error="No recommendations found",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping recommendations: {e}")
            return ScraperResult(success=False, error=str(e), source=self.source)

    async def save_cookies(self):
        """Save current cookies for future sessions"""
        try:
            cookies = await self.page.context.cookies()
            cookies_path = Path(self.COOKIES_FILE)
            cookies_path.parent.mkdir(parents=True, exist_ok=True)

            with open(cookies_path, 'w') as f:
                json.dump(cookies, f, indent=2)

            logger.info(f"Saved {len(cookies)} cookies to {self.COOKIES_FILE}")
        except Exception as e:
            logger.error(f"Error saving cookies: {e}")

    async def health_check(self) -> bool:
        """Check if EInvestidor is accessible"""
        try:
            result = await self.scrape("PETR4")
            return result.success
        except Exception as e:
            logger.error(f"EInvestidor health check failed: {e}")
            return False


# Test function
async def test_einvestidor():
    """Test EInvestidor scraper"""
    scraper = EInvestidorScraper()

    try:
        print("Testing EInvestidor scraper...")
        print("=" * 60)

        # Test with PETR4
        print("\nTesting PETR4...")
        result = await scraper.scrape("PETR4")

        if result.success:
            print("✅ PETR4 Success!")
            data = result.data
            print(f"   Total articles: {data.get('total_found', 0)}")
            print(f"   Returned: {len(data.get('articles', []))}")
            for i, article in enumerate(data.get("articles", [])[:3], 1):
                print(f"   {i}. {article.get('title', 'N/A')[:60]}...")
                print(f"      Date: {article.get('date', 'N/A')}")
        else:
            print(f"❌ PETR4 Error: {result.error}")

        # Test market overview
        print("\nTesting market overview...")
        result2 = await scraper.scrape_market_overview()

        if result2.success:
            print(f"✅ Market Overview: {len(result2.data.get('articles', []))} articles")
        else:
            print(f"❌ Market Overview Error: {result2.error}")

        # Test with invalid ticker
        print("\nTesting invalid ticker (XXXXX)...")
        result3 = await scraper.scrape("XXXXX")

        if not result3.success:
            print(f"✅ Correctly returned error: {result3.error}")
        else:
            print("❌ Should have returned error for invalid ticker")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_einvestidor())
