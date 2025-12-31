"""
Banco Central do Brasil (BCB) Scraper - Dados macroeconômicos oficiais
Fonte: https://www.bcb.gov.br/
SEM necessidade de login - dados públicos
API SGS (Sistema Gerenciador de Séries Temporais) disponível

MIGRATED TO PLAYWRIGHT - 2025-11-27
"""
import asyncio
from typing import Dict, Any, Optional, List
from loguru import logger
import aiohttp
import json
from datetime import datetime, timedelta
import pytz

from base_scraper import BaseScraper, ScraperResult


class BCBScraper(BaseScraper):
    """
    Scraper para dados macroeconômicos do Banco Central do Brasil

    FONTE PÚBLICA - SEM LOGIN NECESSÁRIO
    API OFICIAL DISPONÍVEL (Sistema Gerenciador de Séries Temporais - SGS)

    Dados extraídos:
    - Taxa Selic (meta e efetiva)
    - Taxa de câmbio (USD/BRL, EUR/BRL)
    - IPCA (inflação mensal e acumulada 12m)
    - IPCA-15 (prévia do IPCA) - FASE 1.4
    - IGP-M (inflação mensal e acumulada 12m)
    - PIB (mensal e trimestral)
    - Reservas internacionais (USD e ouro)
    - Taxa de desemprego
    - CDI (taxa diária)
    - Fluxo de Capital Estrangeiro (IDP/IDE) - FASE 1.4
    - Dólar comercial (compra e venda)

    Total de séries: 17 (12 antigas + 5 novas FASE 1.4)
    """

    BASE_URL = "https://www.bcb.gov.br"
    API_SGS_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{serie}/dados"

    # Códigos das séries temporais principais
    SERIES = {
        # Juros e Política Monetária
        "selic_meta": 432,              # Taxa Selic Meta (% a.a.)
        "selic_efetiva": 4189,          # Taxa Selic Efetiva (% a.a.)
        "cdi": 4391,                    # CDI (% a.m.)

        # Inflação (IPCA)
        "ipca": 433,                    # IPCA (% mensal)
        "ipca_acum_12m": 13522,         # IPCA acumulado 12 meses
        "ipca_15": 7478,                # IPCA-15 (% mensal) - FASE 1.4

        # Inflação (IGP-M)
        "igpm": 189,                    # IGP-M (% mensal)
        "igpm_acum_12m": 28763,         # IGP-M acumulado 12 meses

        # Atividade Econômica
        "pib": 4380,                    # PIB mensal (valores correntes)
        "desemprego": 24369,            # Taxa de desemprego (%)

        # Câmbio
        "cambio_usd": 10813,            # USD/BRL - Ptax venda
        "cambio_eur": 21619,            # EUR/BRL - Ptax venda

        # Fluxo de Capital Estrangeiro - FASE 1.4
        "idp_ingressos": 22886,         # Investimento Direto País - Ingressos mensais
        "ide_saidas": 22867,            # Investimento Direto Exterior - Saídas mensais
        "idp_liquido": 22888,           # IDP - Participação capital líquido

        # Reservas e Ativos
        "reservas": 13621,              # Reservas internacionais (US$ milhões)
        "reservas_ouro": 23044,         # Ouro monetário (milhões) - FASE 1.4
    }

    def __init__(self):
        super().__init__(
            name="BCB",
            source="BCB",
            requires_login=False,  # PÚBLICO!
        )

    async def scrape(self, indicator: str = "all") -> ScraperResult:
        """
        Scrape macroeconomic data from BCB

        Args:
            indicator: Specific indicator or "all" for all indicators
                      Options: "selic", "ipca", "cambio", "pib", "reservas", "desemprego", "all"

        Returns:
            ScraperResult with macroeconomic data
        """
        try:
            # Try API first (faster and more reliable)
            data = await self._fetch_via_api(indicator)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "method": "api",
                        "requires_login": False,
                        "api_url": self.API_SGS_URL,
                    },
                )

            # Fallback to web scraping
            data = await self._fetch_via_web(indicator)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={
                        "method": "web",
                        "requires_login": False,
                    },
                )

            return ScraperResult(
                success=False,
                error=f"Failed to fetch data for indicator: {indicator}",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping BCB data: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _fetch_via_api(self, indicator: str) -> Optional[Dict[str, Any]]:
        """
        Fetch data via BCB official API (SGS - Sistema Gerenciador de Séries Temporais)

        API Documentation: https://www3.bcb.gov.br/sgspub/
        """
        try:
            data = {
                "source": "BCB API (SGS)",
                "updated_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                "indicators": {},
            }

            # Determine which indicators to fetch
            if indicator == "all":
                indicators_to_fetch = self.SERIES.keys()
            else:
                # Map friendly names to series
                indicator_map = {
                    # Juros e Política Monetária
                    "selic": ["selic_meta", "selic_efetiva"],
                    "cdi": ["cdi"],

                    # Inflação
                    "ipca": ["ipca", "ipca_acum_12m", "ipca_15"],  # FASE 1.4: adicionado IPCA-15
                    "igpm": ["igpm", "igpm_acum_12m"],

                    # Atividade Econômica
                    "pib": ["pib"],
                    "desemprego": ["desemprego"],

                    # Câmbio
                    "cambio": ["cambio_usd", "cambio_eur"],
                    "usd": ["cambio_usd"],  # FASE 1.4: atalho específico
                    "eur": ["cambio_eur"],  # FASE 1.4: atalho específico

                    # Fluxo de Capital - FASE 1.4
                    "capital": ["idp_ingressos", "ide_saidas", "idp_liquido"],
                    "idp": ["idp_ingressos", "idp_liquido"],
                    "ide": ["ide_saidas"],

                    # Reservas
                    "reservas": ["reservas", "reservas_ouro"],  # FASE 1.4: adicionado ouro
                }

                indicators_to_fetch = indicator_map.get(indicator, [indicator])

            # Fetch data for each indicator
            async with aiohttp.ClientSession() as session:
                for indicator_key in indicators_to_fetch:
                    if indicator_key not in self.SERIES:
                        continue

                    serie_code = self.SERIES[indicator_key]

                    # Get last 12 months of data
                    end_date = datetime.now(pytz.timezone('America/Sao_Paulo'))  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                    start_date = end_date - timedelta(days=365)

                    url = self.API_SGS_URL.format(serie=serie_code)
                    params = {
                        "formato": "json",
                        "dataInicial": start_date.strftime("%d/%m/%Y"),
                        "dataFinal": end_date.strftime("%d/%m/%Y"),
                    }

                    try:
                        async with session.get(url, params=params, timeout=10) as response:
                            if response.status == 200:
                                serie_data = await response.json()

                                if serie_data:
                                    # Get last value and historical data
                                    last_entry = serie_data[-1]

                                    data["indicators"][indicator_key] = {
                                        "current_value": float(last_entry["valor"]),
                                        "date": last_entry["data"],
                                        "serie_code": serie_code,
                                        "historical": [
                                            {
                                                "date": entry["data"],
                                                "value": float(entry["valor"])
                                            }
                                            for entry in serie_data[-12:]  # Last 12 entries
                                        ],
                                    }

                                    logger.debug(f"Fetched {indicator_key}: {last_entry['valor']} ({last_entry['data']})")

                    except Exception as e:
                        logger.debug(f"Error fetching {indicator_key}: {e}")
                        continue

            # Add summary/highlights
            if data["indicators"]:
                data["summary"] = self._create_summary(data["indicators"])
                return data

            return None

        except Exception as e:
            logger.debug(f"API fetch failed: {e}")
            return None

    def _create_summary(self, indicators: Dict) -> Dict[str, Any]:
        """Create a summary of key indicators"""
        summary = {
            "monetary_policy": {},
            "inflation": {},
            "exchange_rate": {},
            "economic_activity": {},
        }

        # Monetary policy
        if "selic_meta" in indicators:
            summary["monetary_policy"]["selic_meta"] = indicators["selic_meta"]["current_value"]
        if "selic_efetiva" in indicators:
            summary["monetary_policy"]["selic_efetiva"] = indicators["selic_efetiva"]["current_value"]
        if "cdi" in indicators:
            summary["monetary_policy"]["cdi"] = indicators["cdi"]["current_value"]

        # Inflation
        if "ipca" in indicators:
            summary["inflation"]["ipca_monthly"] = indicators["ipca"]["current_value"]
        if "ipca_acum_12m" in indicators:
            summary["inflation"]["ipca_12m"] = indicators["ipca_acum_12m"]["current_value"]
        if "igpm" in indicators:
            summary["inflation"]["igpm_monthly"] = indicators["igpm"]["current_value"]
        if "igpm_acum_12m" in indicators:
            summary["inflation"]["igpm_12m"] = indicators["igpm_acum_12m"]["current_value"]

        # Exchange rate
        if "cambio_usd" in indicators:
            summary["exchange_rate"]["usd_brl"] = indicators["cambio_usd"]["current_value"]
        if "cambio_eur" in indicators:
            summary["exchange_rate"]["eur_brl"] = indicators["cambio_eur"]["current_value"]

        # Economic activity
        if "pib" in indicators:
            summary["economic_activity"]["pib"] = indicators["pib"]["current_value"]
        if "desemprego" in indicators:
            summary["economic_activity"]["unemployment_rate"] = indicators["desemprego"]["current_value"]
        if "reservas" in indicators:
            summary["economic_activity"]["reserves_usd_millions"] = indicators["reservas"]["current_value"]

        return summary

    async def _fetch_via_web(self, indicator: str) -> Optional[Dict[str, Any]]:
        """
        Fallback: Fetch data via web scraping (Playwright)

        OPTIMIZED: Uses single HTML fetch + local parsing (BeautifulSoup)
        instead of multiple await calls. ~10x faster!
        """
        try:
            from bs4 import BeautifulSoup

            # Ensure page is initialized
            if not self.page:
                await self.initialize()

            # Navigate to BCB main page
            url = f"{self.BASE_URL}"
            logger.info(f"Navigating to {url}")

            # Using 'load' instead of 'networkidle' to avoid timeout issues
            await self.page.goto(url, wait_until="load", timeout=60000)
            await asyncio.sleep(1)  # Small delay for any JS to execute

            # OPTIMIZATION: Get HTML content once and parse locally
            html_content = await self.page.content()
            soup = BeautifulSoup(html_content, 'html.parser')

            # Extract data from main page indicators
            data = {
                "source": "BCB Website",
                "updated_at": datetime.now(pytz.timezone('America/Sao_Paulo')).isoformat(),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                "indicators": {},
            }

            # Look for key indicators on the main page
            # BCB displays main indicators on homepage

            # Try to find Selic - Local parsing (no await)
            try:
                selic_selectors = [
                    ".indicator-selic .value",
                    "[class*='selic'] .value",
                    ".value",
                ]

                for selector in selic_selectors:
                    try:
                        elem = soup.select_one(selector)

                        if elem:
                            # Check if this is actually the Selic indicator
                            parent_text = elem.parent.get_text().upper() if elem.parent else ""
                            if 'SELIC' in parent_text or 'TAXA' in parent_text:
                                value_text = elem.get_text().strip().replace(",", ".").replace("%", "")
                                data["indicators"]["selic"] = {
                                    "current_value": float(value_text),
                                    "date": datetime.now(pytz.timezone('America/Sao_Paulo')).strftime("%d/%m/%Y"),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                                }
                                break
                    except:
                        continue

            except Exception as e:
                logger.debug(f"Could not extract Selic from web: {e}")

            # Try to find USD/BRL - Local parsing (no await)
            try:
                cambio_selectors = [
                    ".indicator-cambio .value",
                    "[class*='cambio'] .value",
                    "[class*='dolar'] .value",
                ]

                for selector in cambio_selectors:
                    try:
                        elem = soup.select_one(selector)

                        if elem:
                            # Check if this is actually the USD/BRL indicator
                            parent_text = elem.parent.get_text().upper() if elem.parent else ""
                            if 'DÓLAR' in parent_text or 'DOLAR' in parent_text or 'USD' in parent_text:
                                value_text = elem.get_text().strip().replace(",", ".")
                                data["indicators"]["cambio_usd"] = {
                                    "current_value": float(value_text),
                                    "date": datetime.now(pytz.timezone('America/Sao_Paulo')).strftime("%d/%m/%Y"),  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
                                }
                                break
                    except:
                        continue

            except Exception as e:
                logger.debug(f"Could not extract cambio from web: {e}")

            # If we got some data, return it
            if data["indicators"]:
                logger.debug(f"Extracted BCB data from web: {data['indicators'].keys()}")
                return data

            return None

        except Exception as e:
            logger.debug(f"Web fetch failed: {e}")
            return None

    async def get_specific_serie(self, serie_code: int, days_back: int = 30) -> List[Dict[str, Any]]:
        """
        Get specific time series data by code

        Args:
            serie_code: BCB SGS series code
            days_back: Number of days of historical data

        Returns:
            List of date/value pairs
        """
        try:
            end_date = datetime.now(pytz.timezone('America/Sao_Paulo'))  # FASE 7.3: BUG-SCRAPER-TIMEZONE-001
            start_date = end_date - timedelta(days=days_back)

            url = self.API_SGS_URL.format(serie=serie_code)
            params = {
                "formato": "json",
                "dataInicial": start_date.strftime("%d/%m/%Y"),
                "dataFinal": end_date.strftime("%d/%m/%Y"),
            }

            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=10) as response:
                    if response.status == 200:
                        data = await response.json()
                        return [
                            {
                                "date": entry["data"],
                                "value": float(entry["valor"])
                            }
                            for entry in data
                        ]

            return []

        except Exception as e:
            logger.error(f"Error fetching serie {serie_code}: {e}")
            return []


# Example usage
async def test_bcb():
    """Test BCB scraper"""
    scraper = BCBScraper()

    try:
        # Test fetching all indicators
        result = await scraper.scrape_with_retry("all")

        if result.success:
            print("✅ Success!")
            print(f"\nSource: {result.data['source']}")
            print(f"Updated: {result.data['updated_at']}")

            if 'summary' in result.data:
                print("\n📊 SUMMARY:")
                print(json.dumps(result.data['summary'], indent=2, ensure_ascii=False))

            print(f"\n📈 INDICATORS ({len(result.data['indicators'])} found):")
            for key, value in result.data['indicators'].items():
                print(f"  • {key}: {value['current_value']} ({value['date']})")

        else:
            print(f"❌ Error: {result.error}")

        # Test specific indicator
        print("\n\nTesting specific indicator (selic)...")
        result = await scraper.scrape_with_retry("selic")

        if result.success:
            print("✅ Success!")
            for key, value in result.data['indicators'].items():
                print(f"  • {key}: {value['current_value']}% a.a. ({value['date']})")
                if 'historical' in value:
                    print(f"    Historical data points: {len(value['historical'])}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_bcb())
