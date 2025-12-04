"""
Bank Extractor for Fundamentus Scraper v2.0

Handles extraction for banks and financial institutions.
Has 4 exclusive fields not present in industrial stocks:
- Carteira de Crédito
- Depósitos
- Receita de Serviços
- Resultado Intermediação Financeira
"""

from typing import Dict

from .base import BaseExtractor
from .types import AssetType, BANK_FIELD_MAP


class BankExtractor(BaseExtractor):
    """
    Extractor for Banks (Bancos e Financeiras).

    Banks have a different financial structure than industrial companies:
    - No "Receita Líquida" or "EBIT" (industrial terms)
    - Instead: "Resultado Int. Financ.", "Rec. Serviços"
    - "Carteira de Crédito" instead of "Ativo Total"
    - "Depósitos" as main liability

    Exclusive fields (4):
    - cart_credito: Carteira de Crédito
    - depositos: Depósitos
    - rec_servicos: Receita de Serviços
    - result_int_financ: Resultado Intermediação Financeira

    Shared with stocks:
    - P/L, P/VP, Dividend Yield
    - ROE, ROIC, ROA
    - Patrimônio Líquido, Lucro Líquido
    """

    @property
    def asset_type(self) -> AssetType:
        return AssetType.BANK

    def get_field_map(self) -> Dict[str, str]:
        return BANK_FIELD_MAP

    def extract_specific_fields(self):
        """Extract all bank-specific fields from tables"""
        # Get company name from header
        company_name = self.get_company_name()
        if company_name:
            self.data["company_name"] = company_name

        # Extract all table data using base class method
        self.extract_table_data()

    def _calculate_derived_fields(self):
        """Calculate derived fields for banks"""
        # Banks don't have typical industrial ratios like EV/EBIT
        # Most bank-specific ratios come directly from the page
        pass
