"""
IPEADATA Scraper - Commodities e Indicadores Internacionais
Fonte: http://www.ipeadata.gov.br/
SEM necessidade de login - API pública
"""
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from loguru import logger
import aiohttp
import json

from base_scraper import BaseScraper, ScraperResult


class IPEADATAScraper(BaseScraper):
    """
    Scraper para commodities e indicadores internacionais do IPEADATA

    FONTE PÚBLICA - SEM LOGIN NECESSÁRIO
    API OFICIAL IPEA (Instituto de Pesquisa Econômica Aplicada)

    Dados extraídos:
    - Petróleo Brent (preço por barril - FOB)
    - Minério de Ferro (índice de preços - Dalian/Singapore)
    - Outras commodities disponíveis

    Séries disponíveis:
    - 1650971490: Petróleo Brent (US$/barril)
    - 1650972160: Minério de Ferro - Dalian (índice)
    - 1650972161: Minério de Ferro - Singapore (índice)
    """

    BASE_URL = "http://www.ipeadata.gov.br/api/odata4"

    # Códigos das séries temporais
    SERIES = {
        "brent": "1650971490",           # Petróleo Brent (US$/barril)
        "iron_ore_dalian": "1650972160", # Minério de Ferro - Dalian
        "iron_ore_singapore": "1650972161", # Minério de Ferro - Singapore
    }

    def __init__(self):
        super().__init__(
            name="IPEADATA",
            source="IPEADATA",
            requires_login=False,  # PÚBLICO!
        )

    async def scrape(self, commodity: str = "all") -> ScraperResult:
        """
        Scrape commodity data from IPEADATA

        Args:
            commodity: Specific commodity or "all" for all commodities
                      Options: "brent", "iron_ore", "all"

        Returns:
            ScraperResult with commodity data
        """
        try:
            data = await self._fetch_via_api(commodity)

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
                error=f"Failed to fetch data for commodity: {commodity}",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping IPEADATA data: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _fetch_via_api(self, commodity: str) -> Optional[Dict[str, Any]]:
        """
        Fetch data via IPEADATA official API

        API Documentation: http://www.ipeadata.gov.br/api/
        """
        try:
            data = {
                "source": "IPEADATA API",
                "updated_at": datetime.now().isoformat(),
                "commodities": {},
            }

            # Determine which commodities to fetch
            if commodity == "all":
                commodities_to_fetch = self.SERIES.keys()
            elif commodity == "iron_ore":
                commodities_to_fetch = ["iron_ore_dalian", "iron_ore_singapore"]
            else:
                # Map friendly names to series
                commodity_map = {
                    "brent": ["brent"],
                    "oil": ["brent"],
                    "petroleum": ["brent"],
                    "iron": ["iron_ore_dalian", "iron_ore_singapore"],
                }
                commodities_to_fetch = commodity_map.get(commodity, [commodity])

            # Fetch data for each commodity
            async with aiohttp.ClientSession() as session:
                for commodity_key in commodities_to_fetch:
                    if commodity_key not in self.SERIES:
                        continue

                    serie_code = self.SERIES[commodity_key]

                    # Get last 12 months of data
                    end_date = datetime.now()
                    start_date = end_date - timedelta(days=365)

                    # IPEADATA API endpoint
                    url = f"{self.BASE_URL}/ValoresSerie(SERCODIGO='{serie_code}')"

                    # Filter by date range
                    filter_query = (
                        f"VALDATA ge {start_date.strftime('%Y-%m-%d')} and "
                        f"VALDATA le {end_date.strftime('%Y-%m-%d')}"
                    )

                    params = {
                        "$filter": filter_query,
                        "$orderby": "VALDATA desc",
                        "$top": 365,  # Max 1 year of daily data
                        "$format": "json",
                    }

                    try:
                        logger.debug(f"Fetching {commodity_key} (série {serie_code})")

                        async with session.get(url, params=params, timeout=15) as response:
                            if response.status == 200:
                                api_data = await response.json()

                                serie_data = api_data.get("value", [])

                                if serie_data:
                                    # Get last value and historical data
                                    last_entry = serie_data[0]  # Already ordered by date desc

                                    # Parse value (IPEADATA returns string)
                                    try:
                                        last_value = float(last_entry.get("VALVALOR", "0").replace(",", "."))
                                    except:
                                        last_value = 0.0

                                    data["commodities"][commodity_key] = {
                                        "current_value": last_value,
                                        "date": last_entry.get("VALDATA"),
                                        "serie_code": serie_code,
                                        "unit": self._get_unit(commodity_key),
                                        "historical": [
                                            {
                                                "date": entry.get("VALDATA"),
                                                "value": float(entry.get("VALVALOR", "0").replace(",", "."))
                                            }
                                            for entry in serie_data[:90]  # Last 90 days
                                        ],
                                    }

                                    logger.debug(f"Fetched {commodity_key}: {last_value} ({last_entry.get('VALDATA')})")

                            else:
                                logger.warning(f"IPEADATA API returned status {response.status} for {commodity_key}")

                    except Exception as e:
                        logger.debug(f"Error fetching {commodity_key}: {e}")
                        continue

            # Add summary
            if data["commodities"]:
                data["summary"] = self._create_summary(data["commodities"])
                return data

            return None

        except Exception as e:
            logger.debug(f"API fetch failed: {e}")
            return None

    def _get_unit(self, commodity_key: str) -> str:
        """Get unit for commodity"""
        units = {
            "brent": "US$/barril",
            "iron_ore_dalian": "Índice Dalian",
            "iron_ore_singapore": "Índice Singapore",
        }
        return units.get(commodity_key, "")

    def _create_summary(self, commodities: Dict) -> Dict[str, Any]:
        """Create a summary of commodities"""
        summary = {
            "energy": {},
            "metals": {},
        }

        # Energy
        if "brent" in commodities:
            summary["energy"]["brent_oil"] = {
                "price": commodities["brent"]["current_value"],
                "unit": commodities["brent"]["unit"],
                "date": commodities["brent"]["date"],
            }

        # Metals
        if "iron_ore_dalian" in commodities:
            summary["metals"]["iron_ore_dalian"] = {
                "index": commodities["iron_ore_dalian"]["current_value"],
                "date": commodities["iron_ore_dalian"]["date"],
            }

        if "iron_ore_singapore" in commodities:
            summary["metals"]["iron_ore_singapore"] = {
                "index": commodities["iron_ore_singapore"]["current_value"],
                "date": commodities["iron_ore_singapore"]["date"],
            }

        return summary

    async def get_specific_serie(self, serie_code: str, days_back: int = 90) -> List[Dict[str, Any]]:
        """
        Get specific time series data by code

        Args:
            serie_code: IPEADATA series code
            days_back: Number of days of historical data

        Returns:
            List of date/value pairs
        """
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)

            url = f"{self.BASE_URL}/ValoresSerie(SERCODIGO='{serie_code}')"

            filter_query = (
                f"VALDATA ge {start_date.strftime('%Y-%m-%d')} and "
                f"VALDATA le {end_date.strftime('%Y-%m-%d')}"
            )

            params = {
                "$filter": filter_query,
                "$orderby": "VALDATA desc",
                "$format": "json",
            }

            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=15) as response:
                    if response.status == 200:
                        api_data = await response.json()
                        serie_data = api_data.get("value", [])

                        return [
                            {
                                "date": entry.get("VALDATA"),
                                "value": float(entry.get("VALVALOR", "0").replace(",", "."))
                            }
                            for entry in serie_data
                        ]

            return []

        except Exception as e:
            logger.error(f"Error fetching serie {serie_code}: {e}")
            return []


# Example usage
async def test_ipeadata():
    """Test IPEADATA scraper"""
    scraper = IPEADATAScraper()

    try:
        # Test fetching all commodities
        print("\n" + "="*60)
        print("Testing IPEADATA (all commodities)...")
        print("="*60)

        result = await scraper.scrape_with_retry("all")

        if result.success:
            print("✅ Success!")
            print(f"\nSource: {result.data['source']}")
            print(f"Updated: {result.data['updated_at']}")

            if 'summary' in result.data:
                print(f"\n📊 SUMMARY:")
                print(json.dumps(result.data['summary'], indent=2, ensure_ascii=False))

            print(f"\n📈 COMMODITIES ({len(result.data['commodities'])} found):")
            for key, value in result.data['commodities'].items():
                print(f"  • {key}: {value['current_value']} {value['unit']} ({value['date']})")
                if 'historical' in value:
                    print(f"    Historical data points: {len(value['historical'])}")

        else:
            print(f"❌ Error: {result.error}")

        # Test specific commodity
        print("\n\nTesting specific commodity (brent)...")
        result = await scraper.scrape_with_retry("brent")

        if result.success:
            print("✅ Success!")
            for key, value in result.data['commodities'].items():
                print(f"  • {key}: US$ {value['current_value']:.2f}/barril ({value['date']})")
                if 'historical' in value:
                    print(f"    Historical data points: {len(value['historical'])}")
                    # Show last 5 values
                    print(f"    Last 5 values:")
                    for entry in value['historical'][:5]:
                        print(f"      {entry['date']}: US$ {entry['value']:.2f}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_ipeadata())
