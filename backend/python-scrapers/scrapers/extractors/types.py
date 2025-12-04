"""
Asset Types and Data Classes for Fundamentus Scraper v2.0

Defines:
- AssetType enum for asset categorization
- Data classes for each asset type
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, Any


class AssetType(Enum):
    """
    Enum for asset types supported by Fundamentus

    Detection rules:
    1. FII: ticker ends with 11 + has 'ffo' or 'fii' fields
    2. UNT: ticker ends with 11 + NO 'ffo' fields (units like SANB11, TAEE11)
    3. BANK: has 'cart. de crédito', 'depósitos' fields
    4. INSURANCE: has 'prêmios emitidos', 'sinistralidade' fields
    5. HOLDING: setor contains 'holdings'
    6. STOCK: default for industrial companies
    """
    STOCK = "stock"           # Ações industriais (default)
    STOCK_UNT = "stock_unt"   # Units (SANB11, TAEE11, etc.)
    BANK = "bank"             # Bancos
    INSURANCE = "insurance"   # Seguradoras
    HOLDING = "holding"       # Holdings
    FII = "fii"               # Fundos Imobiliários


@dataclass
class FundamentusBaseData:
    """
    Base data common to ALL asset types
    12 fields shared across all categories
    """
    ticker: str
    asset_type: str  # String representation of AssetType

    # Price and Market
    price: Optional[float] = None
    min_52w: Optional[float] = None
    max_52w: Optional[float] = None
    market_cap: Optional[float] = None

    # Valuation (common)
    p_vp: Optional[float] = None
    dy: Optional[float] = None  # Dividend Yield

    # Liquidity
    liquidity_2m: Optional[float] = None

    # Date
    last_quote_date: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class StockData(FundamentusBaseData):
    """
    Data for industrial stocks (Ações Industriais)
    Includes all 33 fields from current scraper
    Also used for Holdings and Insurance (similar structure)
    """
    # Identification
    company_name: Optional[str] = None
    tipo: Optional[str] = None      # ON, PN, UNT
    setor: Optional[str] = None
    subsetor: Optional[str] = None

    # Valuation Ratios
    p_l: Optional[float] = None
    psr: Optional[float] = None
    p_ativos: Optional[float] = None
    p_cap_giro: Optional[float] = None
    p_ebit: Optional[float] = None
    p_ativ_circ_liq: Optional[float] = None

    # EV Multiples
    ev_ebit: Optional[float] = None
    ev_ebitda: Optional[float] = None

    # Margins
    margem_ebit: Optional[float] = None
    margem_liquida: Optional[float] = None

    # Liquidity Ratios
    liquidez_corrente: Optional[float] = None

    # Debt
    div_bruta_patrim: Optional[float] = None
    div_liquida_patrim: Optional[float] = None
    div_liquida_ebit: Optional[float] = None

    # Balance Sheet
    patrim_liquido: Optional[float] = None
    receita_liquida: Optional[float] = None
    ebit: Optional[float] = None
    lucro_liquido: Optional[float] = None

    # Growth & Returns
    crescimento_receita_5a: Optional[float] = None
    roe: Optional[float] = None
    roic: Optional[float] = None
    roa: Optional[float] = None

    # Dividends
    payout: Optional[float] = None

    # Shares
    nro_acoes: Optional[int] = None


@dataclass
class BankData(FundamentusBaseData):
    """
    Data for Banks (Bancos e Financeiras)
    Has 4 exclusive fields not present in industrial stocks
    """
    # Identification
    company_name: Optional[str] = None
    tipo: Optional[str] = None
    setor: Optional[str] = None
    subsetor: Optional[str] = None

    # Common Valuation (shared with stocks)
    p_l: Optional[float] = None

    # Balance Sheet
    patrim_liquido: Optional[float] = None
    lucro_liquido: Optional[float] = None

    # Returns
    roe: Optional[float] = None
    roic: Optional[float] = None
    roa: Optional[float] = None

    # Bank-specific fields (EXCLUSIVE - 4 campos)
    cart_credito: Optional[float] = None        # Carteira de Crédito
    depositos: Optional[float] = None           # Depósitos
    rec_servicos: Optional[float] = None        # Receita de Serviços
    result_int_financ: Optional[float] = None   # Resultado Intermediação Financeira

    # Dividends
    payout: Optional[float] = None

    # Shares
    nro_acoes: Optional[int] = None


@dataclass
class FIIData(FundamentusBaseData):
    """
    Data for Real Estate Investment Funds (Fundos Imobiliários)
    Has 31 exclusive fields not present in stocks
    """
    # Identification
    nome: Optional[str] = None
    segmento: Optional[str] = None   # Logística, Shopping, Lajes, CRI, etc.
    gestao: Optional[str] = None     # Ativa, Passiva
    mandato: Optional[str] = None

    # Valuation (FII-specific)
    ffo_yield: Optional[float] = None
    ffo_cota: Optional[float] = None
    vp_cota: Optional[float] = None
    dividendo_cota: Optional[float] = None

    # Patrimônio
    patrim_liquido: Optional[float] = None
    nro_cotas: Optional[int] = None

    # Performance
    receita: Optional[float] = None
    ffo: Optional[float] = None
    rend_distribuido: Optional[float] = None
    venda_ativos: Optional[float] = None

    # Imóveis (for brick-and-mortar FIIs)
    qtd_imoveis: Optional[int] = None
    qtd_unidades: Optional[int] = None
    area_m2: Optional[float] = None
    aluguel_m2: Optional[float] = None
    preco_m2: Optional[float] = None
    cap_rate: Optional[float] = None
    vacancia_media: Optional[float] = None
    imoveis_pl_fii: Optional[float] = None

    # Additional info
    ultimo_info_trimestral: Optional[str] = None
    relatorio: Optional[str] = None


# Field mappings for each asset type
# Used for backward compatibility with current scraper output

STOCK_FIELD_MAP = {
    "empresa": "company_name",
    "cotação": "price",
    "p/l": "p_l",
    "p/vp": "p_vp",
    "psr": "psr",
    "p/ativos": "p_ativos",
    "p/cap. giro": "p_cap_giro",
    "p/cap.giro": "p_cap_giro",
    "p/ebit": "p_ebit",
    "p/ativ circ liq": "p_ativ_circ_liq",
    "p/ativ circ.liq": "p_ativ_circ_liq",
    "ev/ebit": "ev_ebit",
    "ev / ebit": "ev_ebit",
    "ev/ebitda": "ev_ebitda",
    "ev / ebitda": "ev_ebitda",
    "mrg ebit": "margem_ebit",
    "marg. ebit": "margem_ebit",
    "mrg. líq.": "margem_liquida",
    "marg. líquida": "margem_liquida",
    "liq. corr.": "liquidez_corrente",
    "liquidez corr": "liquidez_corrente",
    "liquidez corrente": "liquidez_corrente",
    "liq.2meses": "liquidity_2m",
    "liquidez 2 meses": "liquidity_2m",
    "vol $ méd (2m)": "liquidity_2m",
    "dív.brut/patrim.": "div_bruta_patrim",
    "div. bruta/patrim.": "div_bruta_patrim",
    "div br/ patrim": "div_bruta_patrim",
    "dív.líq./patrim.": "div_liquida_patrim",
    "div. líquida/patrim.": "div_liquida_patrim",
    "dív.líq./ebit": "div_liquida_ebit",
    "div. líquida/ebit": "div_liquida_ebit",
    "patrim. líq": "patrim_liquido",
    "patrimônio líquido": "patrim_liquido",
    "receita líquida": "receita_liquida",
    "ebit": "ebit",
    "lucro líquido": "lucro_liquido",
    "cresc. rec.5a": "crescimento_receita_5a",
    "cresc. rec (5a)": "crescimento_receita_5a",
    "cres. rec (5a)": "crescimento_receita_5a",
    "crescimento receita 5a": "crescimento_receita_5a",
    "roe": "roe",
    "roic": "roic",
    "roa": "roa",
    "div. yield": "dy",
    "dividend yield": "dy",
    "payout": "payout",
    "nro. ações": "nro_acoes",
    "número de ações": "nro_acoes",
    "min 52 sem": "min_52w",
    "máx 52 sem": "max_52w",
    "max 52 sem": "max_52w",
    "valor de mercado": "market_cap",
}

BANK_FIELD_MAP = {
    **STOCK_FIELD_MAP,
    # Bank-specific fields
    "cart. de crédito": "cart_credito",
    "carteira de crédito": "cart_credito",
    "depósitos": "depositos",
    "rec serviços": "rec_servicos",
    "receita de serviços": "rec_servicos",
    "result int financ": "result_int_financ",
    "resultado int. financ.": "result_int_financ",
}

FII_FIELD_MAP = {
    # Base fields
    "cotação": "price",
    "p/vp": "p_vp",
    "div. yield": "dy",
    "dividend yield": "dy",
    "min 52 sem": "min_52w",
    "máx 52 sem": "max_52w",
    "max 52 sem": "max_52w",
    "valor de mercado": "market_cap",
    "vol $ méd (2m)": "liquidity_2m",

    # FII-specific fields
    "nome": "nome",
    "fii": "nome",
    "segmento": "segmento",
    "gestão": "gestao",
    "mandato": "mandato",

    # Valuation
    "ffo yield": "ffo_yield",
    "ffo/cota": "ffo_cota",
    "vp/cota": "vp_cota",
    "dividendo/cota": "dividendo_cota",

    # Patrimônio
    "patrim líquido": "patrim_liquido",
    "patrim. líq": "patrim_liquido",
    "nro. cotas": "nro_cotas",

    # Performance
    "receita": "receita",
    "ffo": "ffo",
    "rend. distribuído": "rend_distribuido",
    "venda de ativos": "venda_ativos",

    # Imóveis
    "qtd imóveis": "qtd_imoveis",
    "qtd unidades": "qtd_unidades",
    "área (m2)": "area_m2",
    "aluguel/m2": "aluguel_m2",
    "preço do m2": "preco_m2",
    "cap rate": "cap_rate",
    "vacância média": "vacancia_media",
    "imóveis/pl do fii": "imoveis_pl_fii",

    # Info
    "últ info trimestral": "ultimo_info_trimestral",
    "relatório": "relatorio",
}
