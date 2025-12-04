"""
Stock Extractor for Fundamentus Scraper v2.0

Handles extraction for:
- Industrial stocks (default)
- Holdings
- Insurance companies (similar structure)
"""

from typing import Dict

from .base import BaseExtractor
from .types import AssetType, STOCK_FIELD_MAP


class StockExtractor(BaseExtractor):
    """
    Extractor for industrial stocks (Ações Industriais).

    Also used for:
    - Holdings (similar structure)
    - Insurance companies (similar structure)

    Extracts 33+ fields including:
    - Valuation: P/L, P/VP, PSR, P/Ativos, P/Cap.Giro, P/EBIT, EV/EBIT, EV/EBITDA
    - Margins: Margem EBIT, Margem Líquida
    - Liquidity: Liquidez Corrente, Liquidez 2 meses
    - Debt: Dív.Bruta/Patrim, Dív.Líquida/Patrim, Dív.Líquida/EBIT
    - Balance: Patrim. Líquido, Receita Líquida, EBIT, Lucro Líquido
    - Returns: ROE, ROIC, ROA, Crescimento Receita 5a
    - Dividends: Dividend Yield, Payout
    """

    @property
    def asset_type(self) -> AssetType:
        return AssetType.STOCK

    def get_field_map(self) -> Dict[str, str]:
        return STOCK_FIELD_MAP

    def extract_specific_fields(self):
        """Extract all stock-specific fields from tables"""
        # Get company name from header
        company_name = self.get_company_name()
        if company_name:
            self.data["company_name"] = company_name

        # Extract all table data using base class method
        self.extract_table_data()

    def _calculate_derived_fields(self):
        """Calculate derived fields for stocks"""
        # div_liquida_patrim already comes from scraping
        # No additional calculations needed for now
        pass


class HoldingExtractor(StockExtractor):
    """
    Extractor for Holding companies.
    Uses same logic as StockExtractor (similar structure).
    """

    @property
    def asset_type(self) -> AssetType:
        return AssetType.HOLDING


class InsuranceExtractor(StockExtractor):
    """
    Extractor for Insurance companies (Seguradoras).
    Uses same logic as StockExtractor (similar structure).

    Note: Insurance companies have some specific fields not yet mapped:
    - Prêmios Emitidos
    - Sinistralidade
    These can be added in future versions.
    """

    @property
    def asset_type(self) -> AssetType:
        return AssetType.INSURANCE
