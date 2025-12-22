"""
IDIV Scraper - Composição do Índice de Dividendos (IDIV)
Fonte: https://www.b3.com.br/
SEM necessidade de login - dados públicos

CREATED: 2025-12-20 - FASE Marcação IDIV
"""
import asyncio
from typing import Dict, Any, Optional, List
from datetime import date, datetime
from loguru import logger
from bs4 import BeautifulSoup
import re

from base_scraper import BaseScraper, ScraperResult


class IdivScraper(BaseScraper):
    """
    Scraper para composição do índice IDIV (Índice de Dividendos)

    FONTE PÚBLICA - SEM LOGIN NECESSÁRIO

    Dados extraídos:
    - Lista de ativos (tickers) do IDIV
    - Participação percentual (%) de cada ativo
    - Quantidade teórica (opcional)
    - Vigência quadrimestral (01/Jan, 01/Mai, 01/Set)

    OPTIMIZED: Uses single HTML fetch + BeautifulSoup pattern (~10x faster)
    """

    # URL do iframe que contém os dados reais (descoberto via debug HTML)
    B3_IFRAME_URL = "https://sistemaswebb3-listados.b3.com.br/indexPage/day/IDIV?language=pt-br"
    B3_URL = "https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-de-segmentos-e-setoriais/indice-dividendos-idiv-composicao-da-carteira.htm"
    STATUSINVEST_URL = "https://statusinvest.com.br/indices/indice-dividendos"

    def __init__(self):
        super().__init__(
            name="IDIV Scraper",
            source="B3_IDIV",
            requires_login=False,  # PÚBLICO!
        )

    async def scrape(self, ticker: Optional[str] = None, date_param: Optional[str] = None) -> ScraperResult:
        """
        Scrape IDIV composition from B3

        Args:
            ticker: NOT USED (IDIV is index-level, not ticker-level)
            date_param: Optional date string (YYYY-MM-DD format) for historical data.
                       If provided, fetches the IDIV composition valid on that date.
                       If None, fetches current composition.

        Returns:
            ScraperResult with:
                - composition: List[{ticker, participation, quantity, ...}]
                - valid_from: str (ISO date)
                - valid_to: str (ISO date) or None
                - metadata: {source, scraped_at, confidence, requested_date, period_type}
        """
        try:
            # Ensure page is initialized (Playwright)
            if not self.page:
                await self.initialize()

            # Parse date_param to date object if provided (for validity calculation)
            target_date: Optional[date] = None
            if date_param:
                try:
                    target_date = datetime.strptime(date_param, "%Y-%m-%d").date()
                    logger.info(f"Historical mode: fetching IDIV composition for {date_param}")
                except ValueError as e:
                    logger.error(f"Invalid date format: {date_param}. Expected YYYY-MM-DD")
                    return ScraperResult(
                        success=False,
                        error=f"Invalid date format: {date_param}. Expected YYYY-MM-DD",
                        source=self.source,
                    )

            # Construct URL with optional date parameter
            # B3 API supports: ?date=YYYY-MM-DD&language=pt-br
            if date_param:
                url = f"https://sistemaswebb3-listados.b3.com.br/indexPage/day/IDIV?date={date_param}&language=pt-br"
            else:
                url = self.B3_IFRAME_URL  # Default: ?language=pt-br (current composition)

            logger.info(f"Navigating to B3 IDIV iframe page: {url}")

            # Navigate directly to iframe URL (discovered via HTML debug)
            # This URL contains the actual composition table (Angular app)
            await self.page.goto(url, wait_until="load", timeout=60000)

            # Wait for Angular to render the table
            # The page uses Angular 9 with ngx-pagination
            logger.info("Waiting for composition table to load...")
            try:
                # Wait for the table body to be present (indicates data loaded)
                await self.page.wait_for_selector('table.table tbody tr', timeout=15000)
                logger.info("Table found, waiting for data to stabilize...")
                # Extra wait to ensure all data is rendered
                await asyncio.sleep(3)
            except Exception as e:
                logger.warning(f"Timeout waiting for table: {e}")
                # Try to proceed anyway
                await asyncio.sleep(5)

            # Extract composition data
            composition = await self._extract_b3_composition()

            if composition and len(composition) > 0:
                # Calculate validity period (quadrimestral)
                # Pass target_date for historical queries, None for current
                valid_from, valid_to = self._calculate_validity_period(target_date=target_date)

                # Determine period type for metadata
                period_type = "historical" if date_param else "current"

                return ScraperResult(
                    success=True,
                    data={
                        "composition": composition,
                        "valid_from": valid_from.isoformat(),
                        "valid_to": valid_to.isoformat() if valid_to else None,
                        "index_name": "IDIV",
                    },
                    source=self.source,
                    metadata={
                        "url": url,
                        "requires_login": False,
                        "source": "B3",
                        "scraped_at": datetime.now().isoformat(),
                        "total_assets": len(composition),
                        "confidence": 100,  # Single source (B3 official)
                        "requested_date": date_param,  # None if current, YYYY-MM-DD if historical
                        "period_type": period_type,  # "current" or "historical"
                    },
                )
            else:
                return ScraperResult(
                    success=False,
                    error="Failed to extract IDIV composition - no data found",
                    source=self.source,
                )

        except Exception as e:
            logger.error(f"Error scraping IDIV composition: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _extract_b3_composition(self) -> List[Dict[str, Any]]:
        """
        Extract IDIV composition from B3 page with pagination support

        OPTIMIZED: Uses single HTML fetch + local parsing (BeautifulSoup)
        instead of multiple await calls. ~10x faster!

        Pagination: Iterates through all pages to capture ~60-80 total assets

        Expected B3 structure (2025-12):
        - Table with columns: Código (ticker), Part. (%), Qtde. Teórica
        - Pagination with "next" button (li > a with aria-label or text)

        Returns:
            List of dicts with: {ticker, participation, quantity}
        """
        try:
            composition = []
            current_page = 1
            max_pages = 10  # Safeguard against infinite loop

            while current_page <= max_pages:
                logger.info(f"Extracting page {current_page}...")

                # Get HTML content and parse locally
                html_content = await self.page.content()
                soup = BeautifulSoup(html_content, 'html.parser')

                # Find the IDIV composition table (Angular rendered)
                table = soup.find('table', class_='table')

                if table:
                    # Find tbody (contains data rows)
                    tbody = table.find('tbody')
                    if tbody:
                        rows = tbody.find_all('tr', recursive=False)
                        logger.info(f"Found {len(rows)} rows on page {current_page}")

                        for row in rows:
                            cells = row.find_all('td')

                            # Expected structure:
                            # cells[0] = Código (ticker)
                            # cells[1] = Ação (company name)
                            # cells[2] = Tipo (type)
                            # cells[3] = Qtde. Teórica (quantity)
                            # cells[4] = Part. (%) (participation)

                            if len(cells) >= 5:
                                try:
                                    # Extract ticker (column 0)
                                    ticker = cells[0].get_text().strip().upper()

                                    # Validate ticker pattern (e.g., PETR4, VALE3)
                                    if not re.match(r'^[A-Z]{4}\d{1,2}$', ticker):
                                        logger.debug(f"Skipping invalid ticker: {ticker}")
                                        continue

                                    # Extract participation % (column 4)
                                    participation_text = cells[4].get_text().strip()
                                    participation_clean = participation_text.replace(',', '.').strip()
                                    participation = float(participation_clean) if participation_clean else None

                                    # Extract theoretical quantity (column 3)
                                    quantity_text = cells[3].get_text().strip()
                                    quantity_clean = quantity_text.replace('.', '').replace(',', '').strip()
                                    quantity = int(quantity_clean) if quantity_clean.isdigit() else None

                                    # Extract company name (column 1)
                                    company_name = cells[1].get_text().strip()

                                    if ticker and participation is not None:
                                        composition.append({
                                            "ticker": ticker,
                                            "participation": participation,
                                            "quantity": quantity,
                                            "company_name": company_name,
                                            "source": "B3",
                                        })
                                        logger.debug(f"Extracted: {ticker} - {participation}% ({company_name})")

                                except Exception as e:
                                    logger.debug(f"Error parsing row: {e}")
                                    continue

                # Check for next page button
                # ngx-pagination structure: <li class="pagination-next"><a>›</a></li>
                # When disabled: <li class="pagination-next disabled">
                next_button = await self.page.query_selector('li.pagination-next:not(.disabled) a')

                if next_button:
                    # Click next page (button is already filtered to not be disabled)
                    logger.info(f"Clicking next page button (page {current_page} -> {current_page + 1})...")
                    await next_button.click()

                    # Wait for new page to load
                    await asyncio.sleep(2)  # Give Angular time to render
                    await self.page.wait_for_selector('table.table tbody tr', timeout=10000)

                    current_page += 1
                else:
                    logger.info(f"No next button found, completed pagination at page {current_page}")
                    break

            logger.success(f"Successfully extracted {len(composition)} assets from {current_page} page(s)")
            return composition

        except Exception as e:
            logger.error(f"Error extracting B3 composition: {e}")
            return composition if composition else []

    def _calculate_validity_period(self, target_date: Optional[date] = None) -> tuple[date, Optional[date]]:
        """
        Calculate validity period for IDIV rebalancing

        IDIV rebalances quadrimestrally (every 4 months):
        - 01/Jan - 30/Abr (Jan-Apr)
        - 01/Mai - 31/Ago (May-Aug)
        - 01/Set - 31/Dez (Sep-Dec)

        Args:
            target_date: Optional date to determine the quadrimester.
                        If provided, calculates period for that date (historical).
                        If None, uses today's date (current composition).
                        Supports ANY year (2019-2025+).

        Returns:
            (valid_from, valid_to) - tuple of dates
            valid_to is always populated for historical queries
        """
        # Use target_date if provided, otherwise use today
        reference_date = target_date if target_date else date.today()
        year = reference_date.year

        # Define quadrimestral periods for the reference year
        periods = [
            (date(year, 1, 1), date(year, 4, 30)),    # Jan-Apr
            (date(year, 5, 1), date(year, 8, 31)),    # May-Aug
            (date(year, 9, 1), date(year, 12, 31)),   # Sep-Dec
        ]

        # Find the period containing the reference date
        for valid_from, valid_to in periods:
            if valid_from <= reference_date <= valid_to:
                period_type = "historical" if target_date else "current"
                logger.info(f"{period_type.capitalize()} IDIV period: {valid_from} to {valid_to}")
                return valid_from, valid_to

        # If not in any period (edge case), return next period
        # This happens if we're scraping on transition days
        if reference_date > periods[2][1]:
            # After Dec 31, return next year Jan-Apr
            return date(year + 1, 1, 1), date(year + 1, 4, 30)

        # Fallback (should not happen)
        logger.warning(f"Could not determine IDIV period for {reference_date}, using year {year} Jan-Apr")
        return periods[0]

    async def login(self):
        """
        Login is not required for IDIV scraper (public data)
        """
        pass

    async def _cross_validate(
        self,
        b3_data: List[Dict[str, Any]],
        statusinvest_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Cross-validate IDIV composition from multiple sources

        Future enhancement: Compare B3 vs Status Invest data
        Calculate confidence score based on agreement

        Args:
            b3_data: Composition from B3
            statusinvest_data: Composition from Status Invest

        Returns:
            Validated composition with confidence scores
        """
        # TODO: Implement cross-validation logic
        # For now, just return B3 data (single source)
        return b3_data


# Example usage (for testing)
async def test_idiv_scraper():
    """Test IDIV scraper - current and historical modes"""
    scraper = IdivScraper()
    try:
        # Test 1: Current composition (default behavior)
        print("=" * 60)
        print("TEST 1: Current IDIV composition")
        print("=" * 60)
        result = await scraper.scrape()
        print(f"Success: {result.success}")
        if result.success:
            print(f"Total assets: {len(result.data['composition'])}")
            print(f"Valid from: {result.data['valid_from']}")
            print(f"Valid to: {result.data['valid_to']}")
            print(f"Period type: {result.metadata.get('period_type')}")
            print("\nFirst 5 assets:")
            for asset in result.data['composition'][:5]:
                print(f"  {asset['ticker']}: {asset['participation']}%")
        else:
            print(f"Error: {result.error}")

        # Test 2: Historical composition (2024-05-15 = May-Aug 2024 period)
        print("\n" + "=" * 60)
        print("TEST 2: Historical IDIV composition (2024-05-15)")
        print("=" * 60)
        result_historical = await scraper.scrape(date_param='2024-05-15')
        print(f"Success: {result_historical.success}")
        if result_historical.success:
            print(f"Requested date: {result_historical.metadata.get('requested_date')}")
            print(f"Period type: {result_historical.metadata.get('period_type')}")
            print(f"Total assets: {len(result_historical.data['composition'])}")
            print(f"Valid from: {result_historical.data['valid_from']}")
            print(f"Valid to: {result_historical.data['valid_to']}")
            print("\nFirst 5 assets:")
            for asset in result_historical.data['composition'][:5]:
                print(f"  {asset['ticker']}: {asset['participation']}%")
        else:
            print(f"Error: {result_historical.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_idiv_scraper())
