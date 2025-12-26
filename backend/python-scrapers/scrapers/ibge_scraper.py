"""
IBGE SIDRA Scraper - Dados macroeconômicos brasileiros
Fonte: https://apisidra.ibge.gov.br/
SEM necessidade de login - API pública

FASE 102: Novos scrapers para expandir cobertura (30/36 → 34/36)
"""
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List
import aiohttp
from loguru import logger

from base_scraper import BaseScraper, ScraperResult


class IBGEScraper(BaseScraper):
    """
    Scraper para dados macroeconômicos do IBGE via API SIDRA

    PADRÃO: API-only (aiohttp) - não usa browser

    Dados extraídos:
    - PIB trimestral
    - IPCA mensal
    - INPC mensal
    - Desemprego (PNAD Contínua)
    - População estimada
    - Produção industrial
    - Vendas do varejo
    """

    API_URL = "https://apisidra.ibge.gov.br/values"

    # Tabelas SIDRA com configurações
    # Documentação: https://apisidra.ibge.gov.br/
    TABLES = {
        # PIB - Sistema de Contas Nacionais Trimestrais
        "pib_trimestral": {
            "table": 5932,
            "params": "/n1/all/v/6561/p/last%201/c11255/90707",
            "description": "PIB - Taxa acumulada em 4 trimestres (%)",
            "frequency": "trimestral",
        },
        "pib_variacao": {
            "table": 5932,
            "params": "/n1/all/v/6564/p/last%204/c11255/90707",
            "description": "PIB - Variação trimestral (%)",
            "frequency": "trimestral",
        },
        # IPCA - Índice Nacional de Preços ao Consumidor Amplo
        "ipca_mensal": {
            "table": 1737,
            "params": "/n1/all/v/2266/p/last%2012",
            "description": "IPCA - Variação mensal (%)",
            "frequency": "mensal",
        },
        "ipca_acumulado_ano": {
            "table": 1737,
            "params": "/n1/all/v/2265/p/last%2012",
            "description": "IPCA - Acumulado no ano (%)",
            "frequency": "mensal",
        },
        "ipca_acumulado_12m": {
            "table": 1737,
            "params": "/n1/all/v/63/p/last%2012",
            "description": "IPCA - Acumulado 12 meses (%)",
            "frequency": "mensal",
        },
        # INPC - Índice Nacional de Preços ao Consumidor
        "inpc_mensal": {
            "table": 1736,
            "params": "/n1/all/v/44/p/last%2012",
            "description": "INPC - Variação mensal (%)",
            "frequency": "mensal",
        },
        # Desemprego - PNAD Contínua
        "desemprego": {
            "table": 4099,
            "params": "/n1/all/v/4099/p/last%206/c2/6794",
            "description": "Taxa de desocupação (%)",
            "frequency": "trimestral",
        },
        # População
        "populacao": {
            "table": 6579,
            "params": "/n1/all/v/9324/p/last%201",
            "description": "População residente estimada",
            "frequency": "anual",
        },
        # Produção Industrial
        "producao_industrial": {
            "table": 8159,
            "params": "/n1/all/v/11602/p/last%2012/c544/129314",
            "description": "Produção Industrial - Variação mensal (%)",
            "frequency": "mensal",
        },
        # Vendas do Varejo
        "vendas_varejo": {
            "table": 8185,
            "params": "/n1/all/v/11709/p/last%2012/c11046/56736",
            "description": "Vendas do Varejo - Variação mensal (%)",
            "frequency": "mensal",
        },
    }

    def __init__(self):
        super().__init__(
            name="IBGE",
            source="IBGE",
            requires_login=False,  # PÚBLICO
        )

    async def scrape(self, indicator: str = "all") -> ScraperResult:
        """
        Scrape IBGE data via API SIDRA

        Args:
            indicator: Indicator name or "all" for all indicators

        Returns:
            ScraperResult with indicator data
        """
        try:
            if indicator == "all":
                data = await self._fetch_all_indicators()
            else:
                data = await self._fetch_indicator(indicator)

            if data:
                return ScraperResult(
                    success=True,
                    data=data,
                    source=self.source,
                    metadata={"indicator": indicator},
                )
            return ScraperResult(
                success=False,
                error=f"Indicator {indicator} not found or unavailable",
                source=self.source,
            )
        except Exception as e:
            logger.error(f"Error scraping IBGE for {indicator}: {e}")
            return ScraperResult(success=False, error=str(e), source=self.source)

    async def _fetch_indicator(self, indicator: str) -> Optional[Dict[str, Any]]:
        """Fetch single indicator from SIDRA API"""
        if indicator not in self.TABLES:
            logger.warning(f"Unknown IBGE indicator: {indicator}")
            logger.info(f"Available indicators: {list(self.TABLES.keys())}")
            return None

        config = self.TABLES[indicator]
        url = f"{self.API_URL}/t/{config['table']}{config['params']}"

        try:
            async with aiohttp.ClientSession() as session:
                headers = {
                    "Accept": "application/json",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                }
                timeout = aiohttp.ClientTimeout(total=30)

                logger.debug(f"Fetching IBGE {indicator}: {url}")

                async with session.get(url, headers=headers, timeout=timeout) as response:
                    if response.status != 200:
                        logger.warning(f"IBGE API error for {indicator}: {response.status}")
                        return None

                    data = await response.json()

                    # SIDRA returns array where first item is header
                    if not data or len(data) < 2:
                        logger.warning(f"No data returned for {indicator}")
                        return None

                    # Skip header (first item)
                    values_raw = data[1:]

                    # Parse values
                    values = []
                    for v in values_raw:
                        period = v.get("D3N") or v.get("D2N") or v.get("D4N")
                        value = self._parse_value(v.get("V"))

                        if period:
                            values.append({
                                "period": period,
                                "value": value,
                                "unit": v.get("MN"),  # Measure name
                            })

                    return {
                        "indicator": indicator,
                        "description": config["description"],
                        "frequency": config["frequency"],
                        "table_id": config["table"],
                        "values": values,
                        "latest_value": values[0]["value"] if values else None,
                        "latest_period": values[0]["period"] if values else None,
                        "scraped_at": datetime.now().isoformat(),
                    }

        except aiohttp.ClientError as e:
            logger.error(f"Network error fetching IBGE {indicator}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error parsing IBGE {indicator} response: {e}")
            return None

    async def _fetch_all_indicators(self) -> Dict[str, Any]:
        """Fetch all indicators in parallel"""
        tasks = [self._fetch_indicator(ind) for ind in self.TABLES.keys()]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        data = {
            "scraped_at": datetime.now().isoformat(),
            "indicators": {},
            "summary": {},
        }

        for ind, result in zip(self.TABLES.keys(), results):
            if isinstance(result, dict):
                data["indicators"][ind] = result
                # Add to summary
                data["summary"][ind] = {
                    "value": result.get("latest_value"),
                    "period": result.get("latest_period"),
                    "description": result.get("description"),
                }
            elif isinstance(result, Exception):
                logger.warning(f"Error fetching {ind}: {result}")

        return data

    async def fetch_category(self, category: str) -> Dict[str, ScraperResult]:
        """
        Fetch indicators by category

        Args:
            category: "inflacao", "emprego", "producao", "pib"

        Returns:
            Dict mapping indicator to ScraperResult
        """
        category_map = {
            "inflacao": ["ipca_mensal", "ipca_acumulado_ano", "ipca_acumulado_12m", "inpc_mensal"],
            "emprego": ["desemprego"],
            "producao": ["producao_industrial", "vendas_varejo"],
            "pib": ["pib_trimestral", "pib_variacao"],
        }

        indicators = category_map.get(category.lower(), [])
        if not indicators:
            return {}

        tasks = [self.scrape(ind) for ind in indicators]
        results = await asyncio.gather(*tasks)

        return {ind: res for ind, res in zip(indicators, results)}

    def _parse_value(self, value: str) -> Optional[float]:
        """
        Parse SIDRA value (handles Brazilian format and special chars)

        Args:
            value: String value from SIDRA API

        Returns:
            Float value or None
        """
        if not value or value in ["-", "...", "X", "....", "..", "S", "C"]:
            return None
        try:
            # Remove thousands separator (.) and convert decimal separator (,) to (.)
            cleaned = value.replace(".", "").replace(",", ".")
            return float(cleaned)
        except ValueError:
            logger.debug(f"Could not parse IBGE value: {value}")
            return None

    def list_indicators(self) -> List[Dict[str, str]]:
        """List all available indicators"""
        return [
            {
                "name": name,
                "description": config["description"],
                "frequency": config["frequency"],
            }
            for name, config in self.TABLES.items()
        ]

    async def health_check(self) -> bool:
        """Check if IBGE API is accessible"""
        try:
            result = await self.scrape("ipca_mensal")
            return result.success
        except Exception as e:
            logger.error(f"IBGE health check failed: {e}")
            return False


# Test function
async def test_ibge():
    """Test IBGE SIDRA scraper"""
    scraper = IBGEScraper()

    try:
        # List available indicators
        print("📊 Available IBGE Indicators:")
        for ind in scraper.list_indicators():
            print(f"   • {ind['name']}: {ind['description']} ({ind['frequency']})")

        print("\n" + "=" * 60)

        # Test single indicator (IPCA)
        print("\nTesting IPCA mensal...")
        result = await scraper.scrape("ipca_mensal")

        if result.success:
            print("✅ IPCA Success!")
            print(f"   Description: {result.data.get('description')}")
            print(f"   Latest: {result.data.get('latest_value')}% ({result.data.get('latest_period')})")
            print(f"   Last 3 values:")
            for v in result.data.get("values", [])[:3]:
                print(f"      {v['period']}: {v['value']}%")
        else:
            print(f"❌ Error: {result.error}")

        # Test desemprego
        print("\nTesting Desemprego...")
        result2 = await scraper.scrape("desemprego")
        if result2.success:
            print(f"✅ Desemprego: {result2.data.get('latest_value')}% ({result2.data.get('latest_period')})")
        else:
            print(f"❌ Error: {result2.error}")

        # Test PIB
        print("\nTesting PIB trimestral...")
        result3 = await scraper.scrape("pib_trimestral")
        if result3.success:
            print(f"✅ PIB: {result3.data.get('latest_value')}% ({result3.data.get('latest_period')})")
        else:
            print(f"❌ Error: {result3.error}")

        # Test category
        print("\nTesting category 'inflacao'...")
        inflation_results = await scraper.fetch_category("inflacao")
        for ind, res in inflation_results.items():
            if res.success:
                print(f"   ✅ {ind}: {res.data.get('latest_value')}%")
            else:
                print(f"   ❌ {ind}: {res.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_ibge())
