"""
ANBIMA / Tesouro Direto Scraper - Curva de Juros NTN-B
Fonte: Tesouro Direto (público) + ANBIMA (opcional com auth)
SEM necessidade de login - dados públicos do Tesouro Direto
API ANBIMA disponível (com Bearer token)
"""
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from loguru import logger
import aiohttp
import json

from base_scraper import BaseScraper, ScraperResult


class ANBIMAScraper(BaseScraper):
    """
    Scraper para Curva de Juros de Títulos Públicos

    FONTE PÚBLICA - SEM LOGIN NECESSÁRIO (Tesouro Direto)
    FONTE ALTERNATIVA - ANBIMA API (requer Bearer token)

    Dados extraídos:
    - Curva de Juros NTN-B / Tesouro IPCA+ (8 vértices)
    - Taxas de vencimento (1y, 2y, 3y, 5y, 10y, 15y, 20y, 30y)
    - Preços unitários diários
    - Inflação implícita (IPCA+)
    - Estrutura a Termo das Taxas de Juros (ETTJ)

    Vértices da Curva:
    - 1 ano  (252 dias úteis)
    - 2 anos (504 dias úteis)
    - 3 anos (756 dias úteis)
    - 5 anos (1260 dias úteis)
    - 10 anos (2520 dias úteis)
    - 15 anos (3780 dias úteis)
    - 20 anos (5040 dias úteis)
    - 30 anos (7560 dias úteis)
    """

    # URLs públicas
    GABRIEL_GASPAR_API = "https://tesouro.gabrielgaspar.com.br/bonds"  # ✅ PRINCIPAL (funciona)
    TESOURO_DIRETO_API = "https://www.tesourodireto.com.br/json/br/com/b3/tesourodireto/service/api/treasurybondsinfo.json"  # ❌ HTTP 410 (descontinuado)

    # ANBIMA API (requer token - opcional)
    ANBIMA_API_BASE = "https://api.anbima.com.br/feed/precos-indices/v1"
    ANBIMA_CURVA_JUROS_URL = f"{ANBIMA_API_BASE}/titulos-publicos/curvas-juros"

    def __init__(self, anbima_token: Optional[str] = None):
        super().__init__(
            name="ANBIMA",
            source="ANBIMA / Tesouro Direto",
            requires_login=False,  # Tesouro Direto é público
        )
        self.anbima_token = anbima_token

    async def scrape(self, source: str = "tesouro") -> ScraperResult:
        """
        Scrape yield curve data

        Args:
            source: "tesouro" (público) ou "anbima" (requer token)

        Returns:
            ScraperResult with yield curve data
        """
        try:
            # Try Tesouro Direto first (public, no auth)
            if source == "tesouro" or not self.anbima_token:
                data = await self._fetch_tesouro_direto()

                if data:
                    return ScraperResult(
                        success=True,
                        data=data,
                        source="Tesouro Direto",
                        metadata={
                            "method": "api",
                            "requires_login": False,
                            "api_url": self.TESOURO_DIRETO_API,
                        },
                    )

            # Try ANBIMA if token is provided
            if source == "anbima" and self.anbima_token:
                data = await self._fetch_anbima()

                if data:
                    return ScraperResult(
                        success=True,
                        data=data,
                        source="ANBIMA",
                        metadata={
                            "method": "api",
                            "requires_login": True,
                            "api_url": self.ANBIMA_CURVA_JUROS_URL,
                        },
                    )

            return ScraperResult(
                success=False,
                error=f"Failed to fetch yield curve data from {source}",
                source=self.source,
            )

        except Exception as e:
            logger.error(f"Error scraping yield curve data: {e}")
            return ScraperResult(
                success=False,
                error=str(e),
                source=self.source,
            )

    async def _fetch_tesouro_direto(self) -> Optional[Dict[str, Any]]:
        """
        Fetch yield curve from Gabriel Gaspar API (Tesouro Direto data)

        API retorna JSON com todos os títulos disponíveis:
        - Tesouro IPCA+ (antiga NTN-B)
        - Tesouro Prefixado (antiga LTN)
        - Tesouro Selic (antiga LFT)
        """
        try:
            async with aiohttp.ClientSession() as session:
                logger.info(f"Fetching Tesouro Direto data from {self.GABRIEL_GASPAR_API}")

                async with session.get(self.GABRIEL_GASPAR_API, timeout=15) as response:
                    if response.status == 200:
                        api_data = await response.json()

                        # Extract relevant data
                        data = {
                            "source": "Gabriel Gaspar API (Tesouro Direto)",
                            "updated_at": api_data.get("updated_at", datetime.now().isoformat()),
                            "yield_curve": {},
                            "bonds": [],
                        }

                        # Filter Tesouro IPCA+ bonds (antiga NTN-B)
                        bonds_list = api_data.get("bonds", [])

                        ipca_bonds = [
                            bond for bond in bonds_list
                            if "IPCA" in bond.get("name", "").upper()
                            and "IPCA+" in bond.get("name", "").upper()
                            and "Semestrais" not in bond.get("name", "")  # Excluir bonds com juros semestrais
                            and "Renda+" not in bond.get("name", "")  # Excluir Renda+
                            and "Educa+" not in bond.get("name", "")  # Excluir Educa+
                        ]

                        logger.info(f"Found {len(ipca_bonds)} Tesouro IPCA+ bonds")

                        # Process each bond
                        for bond in ipca_bonds:
                            # Parse annual yield (format: "IPCA + 7,76%")
                            annual_yield_str = bond.get("annual_redemption_rate", "")
                            annual_yield = None

                            if annual_yield_str and "IPCA +" in annual_yield_str:
                                try:
                                    # Extract percentage: "IPCA + 7,76%" -> 7.76
                                    yield_part = annual_yield_str.split("IPCA +")[1].strip()
                                    yield_part = yield_part.replace("%", "").replace(",", ".")
                                    annual_yield = float(yield_part) / 100  # Convert to decimal
                                except Exception as e:
                                    logger.debug(f"Could not parse yield from '{annual_yield_str}': {e}")

                            bond_data = {
                                "name": bond.get("name"),
                                "maturity_date": bond.get("maturity"),
                                "min_investment": bond.get("minimum_investment_amount"),
                                "unit_price": bond.get("unitary_redemption_value"),
                                "annual_yield": annual_yield,
                                "annual_yield_str": annual_yield_str,
                                "investable": bond.get("investable"),
                            }

                            data["bonds"].append(bond_data)

                            # Calculate years to maturity for curve
                            if bond_data["maturity_date"]:
                                try:
                                    maturity = datetime.strptime(bond_data["maturity_date"], "%d/%m/%Y")
                                    years_to_maturity = (maturity - datetime.now()).days / 365.25

                                    # Map to standard vertices (1y, 2y, 3y, 5y, 10y, 15y, 20y, 30y)
                                    vertex = self._map_to_vertex(years_to_maturity)

                                    if vertex and bond_data["annual_yield"] is not None:
                                        # Store yield for this vertex
                                        if vertex not in data["yield_curve"]:
                                            data["yield_curve"][vertex] = []

                                        data["yield_curve"][vertex].append({
                                            "years_to_maturity": round(years_to_maturity, 2),
                                            "yield": bond_data["annual_yield"],
                                            "bond_name": bond_data["name"],
                                            "maturity_date": bond_data["maturity_date"],
                                        })
                                except Exception as e:
                                    logger.debug(f"Error processing maturity for {bond_data['name']}: {e}")

                        # Average yields for vertices with multiple bonds
                        for vertex in data["yield_curve"]:
                            bonds_at_vertex = data["yield_curve"][vertex]
                            avg_yield = sum(b["yield"] for b in bonds_at_vertex) / len(bonds_at_vertex)

                            data["yield_curve"][vertex] = {
                                "vertex": vertex,
                                "average_yield": round(avg_yield, 4),
                                "num_bonds": len(bonds_at_vertex),
                                "bonds": bonds_at_vertex,
                            }

                        # Add summary
                        data["summary"] = {
                            "total_ipca_bonds": len(ipca_bonds),
                            "curve_vertices": len(data["yield_curve"]),
                            "vertices_available": list(data["yield_curve"].keys()),
                        }

                        logger.info(f"Extracted {len(ipca_bonds)} bonds, {len(data['yield_curve'])} curve vertices")

                        return data
                    else:
                        logger.warning(f"Tesouro Direto API returned status {response.status}")
                        return None

        except Exception as e:
            logger.error(f"Error fetching Tesouro Direto data: {e}")
            return None

    def _map_to_vertex(self, years: float) -> Optional[str]:
        """
        Map years to maturity to standard curve vertex

        Standard vertices:
        - 1y: 0.5-1.5 years
        - 2y: 1.5-2.5 years
        - 3y: 2.5-4 years
        - 5y: 4-7 years
        - 10y: 7-12 years
        - 15y: 12-17 years
        - 20y: 17-25 years
        - 30y: 25+ years
        """
        if 0.5 <= years < 1.5:
            return "1y"
        elif 1.5 <= years < 2.5:
            return "2y"
        elif 2.5 <= years < 4:
            return "3y"
        elif 4 <= years < 7:
            return "5y"
        elif 7 <= years < 12:
            return "10y"
        elif 12 <= years < 17:
            return "15y"
        elif 17 <= years < 25:
            return "20y"
        elif years >= 25:
            return "30y"
        else:
            return None

    async def _fetch_anbima(self) -> Optional[Dict[str, Any]]:
        """
        Fetch yield curve from ANBIMA API (requires Bearer token)

        ANBIMA API é mais detalhada e profissional:
        - ETTJ (Estrutura a Termo das Taxas de Juros)
        - Curvas intradia e de fechamento
        - Inflação implícita calculada
        """
        try:
            if not self.anbima_token:
                logger.warning("ANBIMA token not provided, skipping ANBIMA API")
                return None

            headers = {
                "Authorization": f"Bearer {self.anbima_token}",
                "Accept": "application/json",
            }

            async with aiohttp.ClientSession() as session:
                logger.info(f"Fetching ANBIMA data from {self.ANBIMA_CURVA_JUROS_URL}")

                async with session.get(
                    self.ANBIMA_CURVA_JUROS_URL,
                    headers=headers,
                    timeout=15
                ) as response:
                    if response.status == 200:
                        api_data = await response.json()

                        # Process ANBIMA data (structure depends on API response)
                        data = {
                            "source": "ANBIMA",
                            "updated_at": datetime.now().isoformat(),
                            "raw_data": api_data,  # Store raw for debugging
                        }

                        # NOTE: ANBIMA API returns raw data for debugging/inspection
                        # Full parsing requires official ANBIMA API documentation
                        # Primary data source is Tesouro Direto public API (see scrape method)
                        # This ANBIMA path is optional and provides raw data only
                        logger.info(f"ANBIMA data fetched successfully (raw data - use Tesouro Direto for parsed data)")

                        return data
                    elif response.status == 401:
                        logger.error("ANBIMA API: Unauthorized (invalid token)")
                        return None
                    else:
                        logger.warning(f"ANBIMA API returned status {response.status}")
                        text = await response.text()
                        logger.debug(f"Response: {text[:200]}")
                        return None

        except Exception as e:
            logger.error(f"Error fetching ANBIMA data: {e}")
            return None


# Example usage
async def test_anbima():
    """Test ANBIMA scraper"""
    scraper = ANBIMAScraper()

    try:
        # Test Tesouro Direto (public)
        print("\n" + "="*60)
        print("Testing Tesouro Direto (public API)...")
        print("="*60)

        result = await scraper.scrape_with_retry("tesouro")

        if result.success:
            print("✅ Success!")
            print(f"\nSource: {result.data['source']}")
            print(f"Updated: {result.data['updated_at']}")

            if 'summary' in result.data:
                print(f"\n📊 SUMMARY:")
                print(json.dumps(result.data['summary'], indent=2, ensure_ascii=False))

            if 'yield_curve' in result.data:
                print(f"\n📈 YIELD CURVE ({len(result.data['yield_curve'])} vertices):")
                for vertex, data in sorted(result.data['yield_curve'].items()):
                    print(f"  • {vertex}: {data['average_yield']:.2%} ({data['num_bonds']} bonds)")

            print(f"\n📋 BONDS ({len(result.data['bonds'])} total):")
            for bond in result.data['bonds'][:5]:  # Show first 5
                print(f"  • {bond['name']}")
                print(f"    Maturity: {bond['maturity_date']}")
                print(f"    Yield: {bond['annual_yield']:.2%}")
                print(f"    Price: R$ {bond['unit_price']:,.2f}")
        else:
            print(f"❌ Error: {result.error}")

    finally:
        await scraper.cleanup()


if __name__ == "__main__":
    asyncio.run(test_anbima())
