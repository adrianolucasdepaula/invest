"""
FII Extractor for Fundamentus Scraper v2.0

Handles extraction for Real Estate Investment Funds (Fundos Imobiliários).
Has 31 exclusive fields not present in stocks:
- FFO Yield, FFO/Cota, VP/Cota, Dividendo/Cota
- Segmento, Gestão, Mandato
- Qtd Imóveis, Área m², Aluguel/m², Cap Rate, Vacância
"""

from typing import Dict

from .base import BaseExtractor
from .types import AssetType, FII_FIELD_MAP


class FIIExtractor(BaseExtractor):
    """
    Extractor for Real Estate Investment Funds (FIIs).

    FIIs have a completely different structure than stocks:
    - No P/L ratio (use FFO Yield instead)
    - Cotas instead of Ações
    - VP/Cota (Net Asset Value per share)
    - Segmento (Logística, Shopping, Lajes, CRI, etc.)
    - Physical asset metrics (área m², vacância, cap rate)

    Categories of FIIs:
    - Tijolo (Brick): Logística, Shopping, Lajes Corporativas, Hospital
    - Papel (Paper): CRI, LCI, Recebíveis
    - Híbrido: Mix of both
    - FOF: Fundo de Fundos

    Exclusive fields (31):
    - Identification: nome, segmento, gestao, mandato
    - Valuation: ffo_yield, ffo_cota, vp_cota, dividendo_cota
    - Patrimônio: patrim_liquido, nro_cotas
    - Performance: receita, ffo, rend_distribuido, venda_ativos
    - Imóveis: qtd_imoveis, qtd_unidades, area_m2, aluguel_m2,
               preco_m2, cap_rate, vacancia_media, imoveis_pl_fii

    Common with stocks:
    - price, p_vp, dy, min_52w, max_52w, market_cap, liquidity_2m
    """

    @property
    def asset_type(self) -> AssetType:
        return AssetType.FII

    def get_field_map(self) -> Dict[str, str]:
        return FII_FIELD_MAP

    def extract_specific_fields(self):
        """Extract all FII-specific fields from tables"""
        # Get fund name from header (different from company name)
        fund_name = self.get_company_name()
        if fund_name:
            self.data["nome"] = fund_name

        # Extract all table data using base class method
        self.extract_table_data()

        # Extract additional FII-specific sections
        self._extract_imoveis_section()

    def _extract_imoveis_section(self):
        """
        Extract "Imóveis" section specific to brick-and-mortar FIIs.
        This section contains physical asset information.
        """
        # The imóveis data usually comes from the regular tables
        # But for FIIs with many properties, there might be a separate table
        # For now, regular table extraction handles most cases
        pass

    def _calculate_derived_fields(self):
        """Calculate derived fields for FIIs"""
        # P/VP is the main valuation metric for FIIs
        # FFO Yield is like dividend yield but based on FFO

        # Calculate implied cap rate if we have the data
        if self.data.get("aluguel_m2") and self.data.get("preco_m2"):
            if self.data["preco_m2"] > 0:
                # Cap Rate = Annual Rent / Price * 100
                annual_rent = self.data["aluguel_m2"] * 12
                self.data["_calculated_cap_rate"] = (
                    annual_rent / self.data["preco_m2"] * 100
                )
