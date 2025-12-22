"""
Backfill IDIV Historical Compositions (2019-2025)

FASE 139.3 - Historical Data Collection
Coleta composições históricas do IDIV para os últimos 7 anos (21 períodos quadrimestrais)

Períodos:
- 2019: Q1 (Jan-Apr), Q2 (May-Aug), Q3 (Sep-Dec)
- 2020-2024: Same pattern (3 periods × 5 years = 15)
- 2025: Q1-Q4 (current year)
Total: 21 períodos

Uso:
    python backfill_idiv_historical.py [--start-year YYYY] [--end-year YYYY] [--dry-run]

Exemplos:
    python backfill_idiv_historical.py                    # 2019-2025 (all)
    python backfill_idiv_historical.py --start-year 2023  # 2023-2025 only
    python backfill_idiv_historical.py --dry-run          # Test without saving
"""

import asyncio
import sys
import argparse
from datetime import date, datetime
from typing import List, Tuple, Dict, Any
from loguru import logger
import httpx

# Add parent directory to path for imports
sys.path.insert(0, '..')
from scrapers.idiv_scraper import IdivScraper


class IDIVHistoricalBackfill:
    """Backfill IDIV historical compositions 2019-2025"""

    def __init__(self, backend_api_url: str = "http://localhost:3101/api/v1"):
        self.backend_api_url = backend_api_url
        self.scraper = None
        self.stats = {
            "total_periods": 0,
            "successful_periods": 0,
            "failed_periods": 0,
            "total_assets": 0,
            "errors": []
        }

    def generate_periods(self, start_year: int = 2019, end_year: int = 2025) -> List[Tuple[str, str]]:
        """
        Generate list of (date, label) tuples for quadrimestral periods

        Args:
            start_year: First year to collect (default: 2019)
            end_year: Last year to collect (default: 2025)

        Returns:
            List of (iso_date, period_label) tuples
            Example: [('2019-01-15', 'Q1-2019'), ...]
        """
        periods = []

        for year in range(start_year, end_year + 1):
            # Q1: Jan-Apr (use Jan 15 as midpoint)
            periods.append((f"{year}-01-15", f"Q1-{year}"))

            # Q2: May-Aug (use May 15 as midpoint)
            periods.append((f"{year}-05-15", f"Q2-{year}"))

            # Q3: Sep-Dec (use Sep 15 as midpoint)
            periods.append((f"{year}-09-15", f"Q3-{year}"))

        logger.info(f"Generated {len(periods)} periods from {start_year} to {end_year}")
        return periods

    async def scrape_period(self, iso_date: str, label: str) -> Dict[str, Any]:
        """
        Scrape IDIV composition for a specific period

        Args:
            iso_date: ISO date string (e.g., '2019-01-15')
            label: Human-readable label (e.g., 'Q1-2019')

        Returns:
            ScraperResult data or None if failed
        """
        logger.info(f"[{label}] Scraping IDIV composition for date: {iso_date}")

        try:
            result = await self.scraper.scrape(date_param=iso_date)

            if result.success:
                composition = result.data.get('composition', [])
                logger.success(f"[{label}] ✓ Scraped {len(composition)} assets")
                return result.data
            else:
                logger.error(f"[{label}] ✗ Scraper failed: {result.error}")
                return None

        except Exception as e:
            logger.error(f"[{label}] ✗ Exception: {str(e)}")
            return None

    def map_scraper_data_to_dto(self, scraper_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Map scraper output (snake_case) to backend DTO (camelCase)

        Scraper returns: valid_from, valid_to, company_name, etc
        DTO expects: validFrom, validTo, no company_name

        Args:
            scraper_data: Raw data from IdivScraper

        Returns:
            Mapped data for backend DTO
        """
        # Map composition items
        composition_mapped = []
        for item in scraper_data.get('composition', []):
            mapped_item = {
                "ticker": item.get('ticker'),
                "participation": item.get('participation'),
            }
            # Optional fields
            if 'quantity' in item:
                mapped_item['quantity'] = item['quantity']
            if 'source' in item:
                mapped_item['source'] = item['source']

            composition_mapped.append(mapped_item)

        # Map period data
        return {
            "validFrom": scraper_data.get('valid_from'),  # snake_case → camelCase
            "validTo": scraper_data.get('valid_to'),       # snake_case → camelCase
            "composition": composition_mapped,
            "metadata": scraper_data.get('metadata', {})
        }

    async def sync_to_backend_bulk(
        self,
        all_compositions: List[Dict[str, Any]],
        dry_run: bool = False
    ) -> bool:
        """
        Send all compositions to backend API in a single bulk request

        Args:
            all_compositions: List of composition data from scraper
            dry_run: If True, skip actual API call

        Returns:
            True if sync successful, False otherwise
        """
        if dry_run:
            total_assets = sum(len(comp.get('composition', [])) for comp in all_compositions)
            logger.info(f"DRY RUN - Would sync {len(all_compositions)} periods with {total_assets} total assets")
            return True

        try:
            endpoint = f"{self.backend_api_url}/index-memberships/sync/IDIV/bulk"

            # Map scraper data to DTO format (snake_case → camelCase)
            compositions_mapped = [
                self.map_scraper_data_to_dto(comp) for comp in all_compositions
            ]

            # Prepare bulk payload
            payload = {
                "compositions": compositions_mapped
            }

            logger.info(f"Sending bulk request to {endpoint} with {len(compositions_mapped)} periods...")

            # Send POST request with extended timeout for bulk operation
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(endpoint, json=payload)

                if response.status_code in [200, 201]:
                    result = response.json()
                    logger.success(
                        f"✓ Bulk sync completed: "
                        f"{result.get('successful', 0)}/{result.get('totalPeriods', 0)} periods, "
                        f"{result.get('totalAssets', 0)} total assets"
                    )
                    if result.get('errors'):
                        logger.warning(f"Errors: {len(result['errors'])}")
                        for err in result['errors'][:5]:  # Show first 5
                            logger.warning(f"  - {err.get('validFrom')}: {err.get('error')}")
                    return result.get('successful', 0) > 0
                else:
                    logger.error(f"✗ Bulk sync failed: {response.status_code} - {response.text[:200]}")
                    return False

        except Exception as e:
            logger.error(f"✗ Bulk sync exception: {str(e)}")
            return False

    async def run_backfill(
        self,
        start_year: int = 2019,
        end_year: int = 2025,
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Execute full historical backfill

        Args:
            start_year: First year to backfill (default: 2019)
            end_year: Last year to backfill (default: 2025)
            dry_run: If True, scrape but don't save to database

        Returns:
            Statistics dict
        """
        logger.info("="*80)
        logger.info("IDIV HISTORICAL BACKFILL - FASE 139")
        logger.info("="*80)
        logger.info(f"Period: {start_year} - {end_year}")
        logger.info(f"Dry Run: {dry_run}")
        logger.info("="*80 + "\n")

        # Generate periods
        periods = self.generate_periods(start_year, end_year)
        self.stats["total_periods"] = len(periods)

        # Initialize scraper
        self.scraper = IdivScraper()

        # Collect all compositions first
        all_compositions = []

        try:
            for idx, (iso_date, label) in enumerate(periods, 1):
                logger.info(f"\n[{idx}/{len(periods)}] Scraping {label}...")

                # Scrape
                composition_data = await self.scrape_period(iso_date, label)

                if composition_data:
                    all_compositions.append(composition_data)
                    self.stats["total_assets"] += len(composition_data.get('composition', []))
                else:
                    self.stats["failed_periods"] += 1
                    self.stats["errors"].append({
                        "period": label,
                        "error": "Scraping failed"
                    })

                # Rate limiting (respect B3 servers)
                if idx < len(periods):
                    logger.info(f"Rate limiting: waiting 3 seconds...")
                    await asyncio.sleep(3)

            # Bulk sync to backend (single request)
            if all_compositions:
                logger.info(f"\n{'='*80}")
                logger.info(f"Collected {len(all_compositions)} periods, sending bulk sync...")
                logger.info(f"{'='*80}\n")

                success = await self.sync_to_backend_bulk(all_compositions, dry_run)

                if success:
                    self.stats["successful_periods"] = len(all_compositions)
                else:
                    self.stats["failed_periods"] += len(all_compositions)
                    self.stats["errors"].append({
                        "period": "BULK",
                        "error": "Bulk backend sync failed"
                    })

        finally:
            # Cleanup scraper
            if self.scraper:
                await self.scraper.cleanup()

        return self.stats

    def print_summary(self) -> None:
        """Print final statistics"""
        logger.info("\n" + "="*80)
        logger.info("BACKFILL SUMMARY")
        logger.info("="*80)
        logger.info(f"Total Periods:     {self.stats['total_periods']}")
        logger.info(f"Successful:        {self.stats['successful_periods']}")
        logger.info(f"Failed:            {self.stats['failed_periods']}")
        logger.info(f"Total Assets:      {self.stats['total_assets']}")
        logger.info(f"Avg Assets/Period: {self.stats['total_assets'] / max(self.stats['successful_periods'], 1):.1f}")

        if self.stats['errors']:
            logger.warning(f"\nErrors ({len(self.stats['errors'])}):")
            for error in self.stats['errors']:
                logger.warning(f"  - {error['period']}: {error['error']}")

        success_rate = (self.stats['successful_periods'] / max(self.stats['total_periods'], 1)) * 100
        logger.info(f"\nSuccess Rate: {success_rate:.1f}%")
        logger.info("="*80 + "\n")


async def main():
    """Main execution"""
    # Parse arguments
    parser = argparse.ArgumentParser(description='Backfill IDIV historical compositions')
    parser.add_argument('--start-year', type=int, default=2019, help='Start year (default: 2019)')
    parser.add_argument('--end-year', type=int, default=2025, help='End year (default: 2025)')
    parser.add_argument('--dry-run', action='store_true', help='Test without saving to database')
    parser.add_argument('--backend-url', default='http://backend:3101/api/v1', help='Backend API URL (use backend:3101 inside Docker)')

    args = parser.parse_args()

    # Validate years
    if args.start_year > args.end_year:
        logger.error(f"Start year ({args.start_year}) must be <= end year ({args.end_year})")
        sys.exit(1)

    if args.start_year < 2019:
        logger.warning(f"IDIV launched in 2019, adjusting start year from {args.start_year} to 2019")
        args.start_year = 2019

    # Run backfill
    backfiller = IDIVHistoricalBackfill(backend_api_url=args.backend_url)

    try:
        stats = await backfiller.run_backfill(
            start_year=args.start_year,
            end_year=args.end_year,
            dry_run=args.dry_run
        )

        # Print summary
        backfiller.print_summary()

        # Exit code based on success
        if stats['failed_periods'] == 0:
            logger.success("✅ Backfill completed successfully!")
            sys.exit(0)
        elif stats['successful_periods'] > 0:
            logger.warning("⚠️ Backfill completed with some failures")
            sys.exit(1)
        else:
            logger.error("❌ Backfill failed completely")
            sys.exit(2)

    except KeyboardInterrupt:
        logger.warning("\nBackfill interrupted by user")
        backfiller.print_summary()
        sys.exit(130)

    except Exception as e:
        logger.error(f"Backfill exception: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(3)


if __name__ == "__main__":
    asyncio.run(main())
