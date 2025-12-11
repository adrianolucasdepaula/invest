"""
Main entry point for Python Scrapers Service

ALL SCRAPERS MIGRATED TO PLAYWRIGHT - 2025-12-04
OAuth API added - 2025-12-04
"""
import asyncio
import signal
import sys
import threading
from loguru import logger
from typing import Dict, Type

from config import settings
from database import db
from redis_client import redis_client
from base_scraper import BaseScraper
from scrapers import (
    # Fundamental Data Scrapers
    FundamentusScraper,
    BCBScraper,
    StatusInvestScraper,
    InvestsiteScraper,
    Investidor10Scraper,
    TradingViewScraper,
    GoogleFinanceScraper,
    GriffinScraper,
    CoinMarketCapScraper,
    OpcoesNetScraper,
    # News Scrapers
    BloombergScraper,
    GoogleNewsScraper,
    InvestingNewsScraper,
    ValorScraper,
    ExameScraper,
    InfoMoneyScraper,
    EstadaoScraper,
    # AI Scrapers
    ChatGPTScraper,
    GeminiScraper,
    DeepSeekScraper,
    ClaudeScraper,
    GrokScraper,
    PerplexityScraper,
    # Market Data Scrapers
    YahooFinanceScraper,
    OplabScraper,
    KinvoScraper,
    InvestingScraper,  # FASE 95: Works without login for basic market data
)


class ScraperService:
    """Main scraper service"""

    def __init__(self):
        self.running = False
        self.scrapers: Dict[str, Type[BaseScraper]] = {}
        self._register_scrapers()

    def _register_scrapers(self):
        """Register available scrapers - ALL MIGRATED TO PLAYWRIGHT"""

        # ===========================================
        # FUNDAMENTAL DATA SCRAPERS (Public)
        # ===========================================
        self.scrapers["FUNDAMENTUS"] = FundamentusScraper
        self.scrapers["BCB"] = BCBScraper
        self.scrapers["STATUSINVEST"] = StatusInvestScraper
        self.scrapers["INVESTSITE"] = InvestsiteScraper
        self.scrapers["INVESTIDOR10"] = Investidor10Scraper
        self.scrapers["TRADINGVIEW"] = TradingViewScraper
        self.scrapers["GOOGLEFINANCE"] = GoogleFinanceScraper
        self.scrapers["GRIFFIN"] = GriffinScraper
        self.scrapers["COINMARKETCAP"] = CoinMarketCapScraper

        # ===========================================
        # OPTIONS SCRAPER (Requires credentials)
        # ===========================================
        self.scrapers["OPCOES_NET"] = OpcoesNetScraper

        # ===========================================
        # NEWS SCRAPERS
        # ===========================================
        self.scrapers["BLOOMBERG"] = BloombergScraper
        self.scrapers["GOOGLENEWS"] = GoogleNewsScraper
        self.scrapers["INVESTING_NEWS"] = InvestingNewsScraper
        self.scrapers["VALOR"] = ValorScraper
        self.scrapers["EXAME"] = ExameScraper
        self.scrapers["INFOMONEY"] = InfoMoneyScraper
        self.scrapers["ESTADAO"] = EstadaoScraper

        # ===========================================
        # AI SCRAPERS (Require Google OAuth cookies)
        # ===========================================
        self.scrapers["CHATGPT"] = ChatGPTScraper
        self.scrapers["GEMINI"] = GeminiScraper
        self.scrapers["DEEPSEEK"] = DeepSeekScraper
        self.scrapers["CLAUDE"] = ClaudeScraper
        self.scrapers["GROK"] = GrokScraper
        self.scrapers["PERPLEXITY"] = PerplexityScraper

        # ===========================================
        # MARKET DATA SCRAPERS
        # ===========================================
        self.scrapers["YAHOO_FINANCE"] = YahooFinanceScraper
        self.scrapers["OPLAB"] = OplabScraper  # Options market - no login required
        self.scrapers["KINVO"] = KinvoScraper  # Portfolio management - credential login

        # ===========================================
        # FASE 95: INVESTING (works without login)
        # ===========================================
        self.scrapers["INVESTING"] = InvestingScraper  # FASE 95: Works without login

        # ===========================================
        # AWAITING FIXES (Need cookies/config)
        # ===========================================
        # self.scrapers["B3"] = B3Scraper  # URL needs CVM code
        # self.scrapers["FUNDAMENTEI"] = FundamenteiScraper  # OAuth session expired
        # self.scrapers["ADVFN"] = ADVFNScraper  # partial migration needed
        # self.scrapers["MAISRETORNO"] = MaisRetornoScraper  # needs cookies

        logger.info(f"✅ PLAYWRIGHT MIGRATION COMPLETE: Registered {len(self.scrapers)} scrapers")
        logger.info(f"📊 Fundamental: FUNDAMENTUS, BCB, STATUSINVEST, INVESTSITE, INVESTIDOR10, TRADINGVIEW, GOOGLEFINANCE, GRIFFIN, COINMARKETCAP")
        logger.info(f"📰 News: BLOOMBERG, GOOGLENEWS, INVESTING_NEWS, VALOR, EXAME, INFOMONEY, ESTADAO")
        logger.info(f"🤖 AI: CHATGPT, GEMINI, DEEPSEEK, CLAUDE, GROK, PERPLEXITY")
        logger.info(f"📈 Market: YAHOO_FINANCE, OPLAB, OPCOES_NET, KINVO, INVESTING")

    async def initialize(self):
        """Initialize connections and resources"""
        try:
            # Setup logging
            logger.remove()
            logger.add(
                sys.stdout,
                level=settings.LOG_LEVEL,
                format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
            )
            logger.add(
                settings.LOG_FILE,
                rotation="10 MB",
                retention="7 days",
                level=settings.LOG_LEVEL,
            )

            logger.info("Initializing Python Scrapers Service...")
            logger.info(f"Environment: DB={settings.DB_HOST}:{settings.DB_PORT}, Redis={settings.REDIS_HOST}:{settings.REDIS_PORT}")

            # Connect to database
            db.connect()

            # Connect to Redis
            redis_client.connect()

            self.running = True
            logger.success("Python Scrapers Service initialized successfully!")

        except Exception as e:
            logger.error(f"Failed to initialize service: {e}")
            raise

    async def shutdown(self):
        """Graceful shutdown"""
        logger.info("Shutting down Python Scrapers Service...")
        self.running = False

        # Disconnect from database
        db.disconnect()

        # Disconnect from Redis
        redis_client.disconnect()

        logger.success("Python Scrapers Service shut down")

    async def process_scraper_job(self, job: dict):
        """
        Process a scraper job

        Job format:
        {
            "ticker": "PETR4",
            "source": "STATUSINVEST",
            "job_id": "uuid",
            "timestamp": "2024-01-01T00:00:00"
        }
        """
        try:
            ticker = job.get("ticker")
            source = job.get("source", "STATUSINVEST")
            job_id = job.get("job_id", "unknown")

            logger.info(f"Processing job {job_id}: {source} scraper for {ticker}")

            # Get scraper class
            scraper_class = self.scrapers.get(source.upper())
            if not scraper_class:
                logger.error(f"Unknown scraper source: {source}")
                return

            # Create scraper instance and execute
            async with scraper_class() as scraper:
                result = await scraper.scrape_with_retry(ticker)

                # Save result to database
                if result.success:
                    await self._save_result(ticker, result)

                    # Publish success event
                    redis_client.publish(
                        "scraper:results",
                        {
                            "job_id": job_id,
                            "ticker": ticker,
                            "source": source,
                            "success": True,
                            "data": result.data,
                        },
                    )
                else:
                    logger.error(f"Scraper failed for {ticker}: {result.error}")

                    # Publish failure event
                    redis_client.publish(
                        "scraper:results",
                        {
                            "job_id": job_id,
                            "ticker": ticker,
                            "source": source,
                            "success": False,
                            "error": result.error,
                        },
                    )

        except Exception as e:
            logger.error(f"Error processing job: {e}")

    async def _save_result(self, ticker: str, result):
        """Save scraper result to database"""
        try:
            # Example: Save to a scraped_data table
            query = """
                INSERT INTO scraped_data (ticker, source, data, scraped_at)
                VALUES (:ticker, :source, :data, :scraped_at)
                ON CONFLICT (ticker, source)
                DO UPDATE SET data = :data, scraped_at = :scraped_at
            """

            import json

            db.execute_update(
                query,
                {
                    "ticker": ticker,
                    "source": result.source,
                    "data": json.dumps(result.data),
                    "scraped_at": result.timestamp,
                },
            )

            logger.info(f"Saved scraper result for {ticker} to database")

        except Exception as e:
            logger.error(f"Failed to save result to database: {e}")
            # Don't raise - scraping succeeded, just DB save failed

    async def listen_for_jobs(self):
        """Listen for scraper jobs from Redis queue"""
        logger.info("Listening for scraper jobs on Redis queue 'scraper:jobs'...")

        while self.running:
            try:
                # Pop job from Redis list (blocking)
                job = redis_client.rpop("scraper:jobs")

                if job:
                    await self.process_scraper_job(job)
                else:
                    # No jobs, sleep briefly
                    await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"Error in job listener: {e}")
                await asyncio.sleep(5)

    async def run_health_check(self):
        """Periodic health check"""
        while self.running:
            try:
                # Check DB connection
                db.execute_query("SELECT 1")

                # Check Redis connection
                redis_client.client.ping()

                logger.debug("Health check passed")

            except Exception as e:
                logger.error(f"Health check failed: {e}")

            await asyncio.sleep(30)

    async def run(self):
        """Main run loop"""
        try:
            await self.initialize()

            # Run job listener and health check concurrently
            await asyncio.gather(self.listen_for_jobs(), self.run_health_check())

        except KeyboardInterrupt:
            logger.info("Received keyboard interrupt")
        except Exception as e:
            logger.error(f"Service error: {e}")
        finally:
            await self.shutdown()


def signal_handler(sig, frame):
    """Handle shutdown signals"""
    logger.info(f"Received signal {sig}")
    sys.exit(0)


def start_oauth_api():
    """Start OAuth API server in a separate thread"""
    try:
        import uvicorn
        from oauth_api import app

        # Use port 8080 to avoid conflict with api-service (port 8000)
        logger.info("Starting OAuth API server on port 8080...")
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8080,
            log_level="warning",  # Reduce uvicorn logs
        )
    except Exception as e:
        logger.error(f"Failed to start OAuth API: {e}")


def main():
    """Main entry point"""
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Start OAuth API in background thread (port 8080 - separate from api-service)
    oauth_thread = threading.Thread(target=start_oauth_api, daemon=True)
    oauth_thread.start()
    logger.info("OAuth API thread started (port 8080)")

    # Create and run scraper service
    service = ScraperService()
    asyncio.run(service.run())


if __name__ == "__main__":
    main()
