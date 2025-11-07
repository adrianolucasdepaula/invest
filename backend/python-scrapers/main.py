"""
Main entry point for Python Scrapers Service
"""
import asyncio
import signal
import sys
from loguru import logger
from typing import Dict, Type

from config import settings
from database import db
from redis_client import redis_client
from base_scraper import BaseScraper
from scrapers import (
    StatusInvestScraper,
    FundamentusScraper,
    InvestsiteScraper,
    B3Scraper,
    GriffinScraper,
    CoinMarketCapScraper,
    OpcoesNetScraper,
)


class ScraperService:
    """Main scraper service"""

    def __init__(self):
        self.running = False
        self.scrapers: Dict[str, Type[BaseScraper]] = {}
        self._register_scrapers()

    def _register_scrapers(self):
        """Register available scrapers"""
        # Public scrapers (no login required)
        self.scrapers["FUNDAMENTUS"] = FundamentusScraper
        self.scrapers["INVESTSITE"] = InvestsiteScraper
        self.scrapers["B3"] = B3Scraper
        self.scrapers["GRIFFIN"] = GriffinScraper
        self.scrapers["COINMARKETCAP"] = CoinMarketCapScraper

        # Scrapers with credentials
        self.scrapers["OPCOES_NET"] = OpcoesNetScraper

        # Scrapers with potential login (will use cookies later)
        self.scrapers["STATUSINVEST"] = StatusInvestScraper

        logger.info(f"Registered {len(self.scrapers)} scrapers: {list(self.scrapers.keys())}")

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


def main():
    """Main entry point"""
    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Create and run service
    service = ScraperService()
    asyncio.run(service.run())


if __name__ == "__main__":
    main()
