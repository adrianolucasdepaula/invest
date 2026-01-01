"""
FRED Scraper - Federal Reserve Economic Data (EUA)
Fonte: https://fred.stlouisfed.org/
Requer API Key (gratuita)
"""
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from loguru import logger
import aiohttp
import json
import os

from base_scraper import BaseScraper, ScraperResult


class FREDScraper(BaseScraper):
    """
    Scraper para indicadores econômicos dos EUA via FRED API

    FONTE OFICIAL - Federal Reserve Bank of St. Louis
    API KEY GRATUITA NECESSÁRIA

    Dados extraídos:
    - Payroll (Non-Farm) - Emprego nos EUA
    - Petróleo Brent - Preço por barril (validação cruzada)
    - Taxa Fed Funds - Taxa de juros básica dos EUA
    - CPI (EUA) - Inflação ao consumidor

    Séries disponíveis:
    - PAYEMS: All Employees, Total Nonfarm (milhares)
    - DCOILBRENTEU: Crude Oil Prices: Brent - Europe (US$/barril)
    - DFF: Federal Funds Effective Rate (% a.a.)
    - CPIAUCSL: Consumer Price Index for All Urban Consumers (índice)
    """

    BASE_URL = "https://api.stlouisfed.org/fred"

    # Códigos das séries temporais
    SERIES = {
        "payroll": "PAYEMS",           # Non-Farm Payroll (milhares de empregos)
        "brent": "DCOILBRENTEU",       # Petróleo Brent (US$/barril)
        "fed_funds": "DFF",             # Taxa Fed Funds (% a.a.)
        "cpi": "CPIAUCSL",              # CPI - Inflação EUA (índice)
    }

    def __init__(self, api_key: Optional[str] = None):
        super().__init__(
            name="FRED",
            source="FRED",
            requires_login=False,  # Não requer login, mas API key sim
        )

        # Get API key from parameter or environment
        self.api_key = api_key or os.getenv("FRED_API_KEY")

        if not self.api_key:
            logger.warning("FRED API key not provided. Set FRED_API_KEY environment variable or pass api_key parameter.")

    async def scrape(self, indicator: str = "all") -> ScraperResult:
        """
        Scrape economic data from FRED

        Args:
            indicator: Specific indicator or "all" for all indicators
                      Options: "payroll", "brent", "fed_funds", "cpi", "all"

        Returns:
            ScraperResult with economic data
        """
        try:
            if not self.api_key:
                return ScraperResult(
                    success=False,
                    error="FRED API key not provided. Register at https://fredaccount.stlouisfed.org/apikeys",
                    source=self.source,
                )

            data = await self._fetch_via_api(indicator)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "method": "api",
                        "requires_login": False,
                        "api_url": self.BASE_URL,
                    },
                )

            return ScraperResult(
                success=False,
                error=f"Failed to fetch data for indicator: {indicator}",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping FRED data: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _fetch_via_api(self, indicator: str) -> Optional[Dict[str, Any]]:
        """
        Fetch data via FRED official API

        API Documentation: https://fred.stlouisfed.org/docs/api/fred/
        """
        try:
            data = {
                "source": "FRED API (Federal Reserve)",
                "updated_at": datetime.now().isoformat(),
                "indicators": {},
            }

            # Determine which indicators to fetch
            if indicator == "all":
                indicators_to_fetch = self.SERIES.keys()
            else:
                # Map friendly names to series
                indicator_map = {
                    "payroll": ["payroll"],
                    "employment": ["payroll"],
                    "nonfarm": ["payroll"],
                    "brent": ["brent"],
                    "oil": ["brent"],
                    "petroleum": ["brent"],
                    "fed": ["fed_funds"],
                    "interest": ["fed_funds"],
                    "inflation": ["cpi"],
                    "cpi": ["cpi"],
                }
                indicators_to_fetch = indicator_map.get(indicator, [indicator])

            # Fetch data for each indicator
            async with aiohttp.ClientSession() as session:
                for indicator_key in indicators_to_fetch:
                    if indicator_key not in self.SERIES:
                        continue

                    serie_code = self.SERIES[indicator_key]

                    # Get last 12 months of data
                    end_date = datetime.now()
                    start_date = end_date - timedelta(days=365)

                    # FRED API endpoint: /fred/series/observations
                    url = f"{self.BASE_URL}/series/observations"

                    params = {
                        "series_id": serie_code,
                        "api_key": self.api_key,
                        "file_type": "json",
                        "observation_start": start_date.strftime("%Y-%m-%d"),
                        "observation_end": end_date.strftime("%Y-%m-%d"),
                        "sort_order": "desc",  # Most recent first
                    }

                    try:
                        logger.debug(f"Fetching {indicator_key} (série {serie_code})")

                        async with session.get(url, params=params, timeout=15) as response:
                            if response.status == 200:
                                api_data = await response.json()

                                observations = api_data.get("observations", [])

                                if observations:
                                    # Get last value
                                    last_entry = observations[0]  # Already sorted desc

                                    # Parse value (FRED returns string, can be "." for missing)
                                    try:
                                        last_value_str = last_entry.get("value", ".")
                                        if last_value_str != ".":
                                            last_value = float(last_value_str)
                                        else:
                                            # Value is missing, try next observation
                                            for obs in observations:
                                                if obs.get("value") != ".":
                                                    last_entry = obs
                                                    last_value = float(obs.get("value"))
                                                    break
                                            else:
                                                # No valid values found
                                                logger.warning(f"No valid values for {indicator_key}")
                                                continue
                                    except (ValueError, TypeError, AttributeError) as e:
                                        logger.warning(f"Could not parse value for {indicator_key}: {last_value_str} - {e}")
                                        continue

                                    data["indicators"][indicator_key] = {
                                        "current_value": last_value,
                                        "date": last_entry.get("date"),
                                        "serie_code": serie_code,
                                        "unit": self._get_unit(indicator_key),
                                        "historical": [
                                            {
                                                "date": obs.get("date"),
                                                "value": float(obs.get("value")) if obs.get("value") != "." else None
                                            }
                                            for obs in observations[:90]  # Last 90 observations
                                            if obs.get("value") != "."
                                        ],
                                    }

                                    logger.debug(f"Fetched {indicator_key}: {last_value} ({last_entry.get('date')})")

                            elif response.status == 400:
                                error_data = await response.json()
                                error_msg = error_data.get("error_message", "Unknown error")
                                logger.warning(f"FRED API error for {indicator_key}: {error_msg}")

                                if "api_key" in error_msg.lower():
                                    logger.error("Invalid FRED API key. Register at https://fredaccount.stlouisfed.org/apikeys")

                            elif response.status == 403:
                                logger.error(f"FRED API: Forbidden (403) for {indicator_key} - check API key permissions")

                            elif response.status == 429:
                                logger.warning(f"FRED API: Rate limit exceeded (429) for {indicator_key} - implement backoff")

                            elif response.status >= 500:
                                logger.warning(f"FRED API: Server error ({response.status}) for {indicator_key} - transient failure")

                            else:
                                logger.warning(f"FRED API returned status {response.status} for {indicator_key}")

                    except Exception as e:
                        logger.debug(f"Error fetching {indicator_key}: {e}")
                        continue

            # Add summary
            if data["indicators"]:
                data["summary"] = self._create_summary(data["indicators"])
                return data

            return None

        except Exception as e:
            logger.debug(f"API fetch failed: {e}")
            return None

    def _get_unit(self, indicator_key: str) -> str:
        """Get unit for indicator"""
        units = {
            "payroll": "Thousands of Persons",
            "brent": "US$/barrel",
            "fed_funds": "% per annum",
            "cpi": "Index 1982-1984=100",
        }
        return units.get(indicator_key, "")

    def _create_summary(self, indicators: Dict) -> Dict[str, Any]:
        """Create a summary of indicators"""
        summary = {
            "employment": {},
            "commodities": {},
            "monetary_policy": {},
            "inflation": {},
        }

        # Employment
        if "payroll" in indicators:
            summary["employment"]["nonfarm_payroll"] = {
                "value": indicators["payroll"]["current_value"],
                "unit": indicators["payroll"]["unit"],
                "date": indicators["payroll"]["date"],
            }

        # Commodities
        if "brent" in indicators:
            summary["commodities"]["brent_oil"] = {
                "price": indicators["brent"]["current_value"],
                "unit": indicators["brent"]["unit"],
                "date": indicators["brent"]["date"],
            }

        # Monetary Policy
        if "fed_funds" in indicators:
            summary["monetary_policy"]["fed_funds_rate"] = {
                "rate": indicators["fed_funds"]["current_value"],
                "date": indicators["fed_funds"]["date"],
            }

        # Inflation
        if "cpi" in indicators:
            summary["inflation"]["cpi_index"] = {
                "index": indicators["cpi"]["current_value"],
                "date": indicators["cpi"]["date"],
            }

        return summary

    async def get_specific_serie(self, serie_code: str, days_back: int = 365) -> List[Dict[str, Any]]:
        """
        Get specific time series data by code

        Args:
            serie_code: FRED series code (e.g., "PAYEMS")
            days_back: Number of days of historical data

        Returns:
            List of date/value pairs
        """
        try:
            if not self.api_key:
                logger.error("FRED API key not provided")
                return []

            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)

            url = f"{self.BASE_URL}/series/observations"

            params = {
                "series_id": serie_code,
                "api_key": self.api_key,
                "file_type": "json",
                "observation_start": start_date.strftime("%Y-%m-%d"),
                "observation_end": end_date.strftime("%Y-%m-%d"),
                "sort_order": "desc",
            }

            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=15) as response:
                    if response.status == 200:
                        api_data = await response.json()
                        observations = api_data.get("observations", [])

                        return [
                            {
                                "date": obs.get("date"),
                                "value": float(obs.get("value")) if obs.get("value") != "." else None
                            }
                            for obs in observations
                            if obs.get("value") != "."
                        ]

            return []

        except Exception as e:
            logger.error(f"Error fetching serie {serie_code}: {e}")
            return []


# Example usage
async def test_fred():
    """Test FRED scraper"""

    # Get API key from environment or prompt user
    api_key = os.getenv("FRED_API_KEY")

    if not api_key:
        print("⚠️  FRED API key not found in environment variable FRED_API_KEY")
        print("📝 Register for free at: https://fredaccount.stlouisfed.org/apikeys")
        print("\nTo test without API key, set environment variable:")
        print("  export FRED_API_KEY='your_api_key_here'  # Linux/Mac")
        print("  set FRED_API_KEY=your_api_key_here       # Windows")
        return

    scraper = FREDScraper(api_key=api_key)

    try:
        # Test fetching all indicators
        print("\n" + "="*60)
        print("Testing FRED (all indicators)...")
        print("="*60)

        result = await scraper.scrape_with_retry("all")

        if result.success:
            print("✅ Success!")
            print(f"\nSource: {result.data['source']}")
            print(f"Updated: {result.data['updated_at']}")

            if 'summary' in result.data:
                print(f"\n📊 SUMMARY:")
                print(json.dumps(result.data['summary'], indent=2, ensure_ascii=False))

            print(f"\n📈 INDICATORS ({len(result.data['indicators'])} found):")
            for key, value in result.data['indicators'].items():
                print(f"  • {key}: {value['current_value']} {value['unit']} ({value['date']})")
                if 'historical' in value:
                    print(f"    Historical data points: {len(value['historical'])}")

        else:
            print(f"❌ Error: {result.error}")

        # Test specific indicator (payroll)
        print("\n\nTesting specific indicator (payroll)...")
        result = await scraper.scrape_with_retry("payroll")

        if result.success:
            print("✅ Success!")
            for key, value in result.data['indicators'].items():
                print(f"  • {key}: {value['current_value']:,.0f} {value['unit']} ({value['date']})")
                if 'historical' in value:
                    print(f"    Historical data points: {len(value['historical'])}")
                    # Show last 5 values
                    print(f"    Last 5 values:")
                    for entry in value['historical'][:5]:
                        if entry['value']:
                            print(f"      {entry['date']}: {entry['value']:,.0f}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_fred())
