"""
Fundamentus Extractors Package v2.0

Strategy pattern implementation for extracting data from different asset types.

Usage:
    from scrapers.extractors import detect_asset_type, get_extractor, AssetType

    # Detect asset type from page
    asset_type = detect_asset_type(soup, ticker)

    # Get appropriate extractor
    extractor = get_extractor(asset_type, soup, ticker)

    # Extract data
    data = extractor.extract()
"""

from typing import Optional
from bs4 import BeautifulSoup
from loguru import logger

from .types import (
    AssetType,
    FundamentusBaseData,
    StockData,
    BankData,
    FIIData,
    STOCK_FIELD_MAP,
    BANK_FIELD_MAP,
    FII_FIELD_MAP,
)
from .base import BaseExtractor
from .stock import StockExtractor, HoldingExtractor, InsuranceExtractor
from .bank import BankExtractor
from .fii import FIIExtractor


def detect_asset_type(soup: BeautifulSoup, ticker: str) -> AssetType:
    """
    Detect the asset type based on page content and ticker pattern.

    Detection rules (in order of priority):
    1. FII: ticker ends with 11 + has 'ffo' or 'ffi' or 'segmento' fields
    2. UNT: ticker ends with 11 + NO 'ffo' fields (units like SANB11, TAEE11)
    3. BANK: has 'cart. de crédito', 'depósitos' fields
    4. INSURANCE: subsetor contains 'seguradoras'
    5. HOLDING: setor contains 'holdings'
    6. STOCK: default for everything else

    Args:
        soup: BeautifulSoup parsed HTML
        ticker: Stock/FII ticker

    Returns:
        Detected AssetType
    """
    ticker = ticker.upper()
    page_text = soup.get_text().lower()

    # ================================================================
    # Rule 1: Ticker pattern - ends with 11
    # ================================================================
    if ticker.endswith("11"):
        # Check for FII-specific fields
        fii_indicators = ["ffo", "ffo yield", "segmento", "gestão", "mandato", "nro. cotas"]
        if any(indicator in page_text for indicator in fii_indicators):
            logger.debug(f"Detected {ticker} as FII (has FII-specific fields)")
            return AssetType.FII
        else:
            # Units (SANB11, TAEE11, KLBN11) - treated as stocks
            logger.debug(f"Detected {ticker} as STOCK_UNT (ends with 11, no FII fields)")
            return AssetType.STOCK_UNT

    # ================================================================
    # Rule 2: Bank-specific fields
    # ================================================================
    bank_indicators = ["cart. de crédito", "depósitos", "result int financ"]
    if any(indicator in page_text for indicator in bank_indicators):
        logger.debug(f"Detected {ticker} as BANK (has bank-specific fields)")
        return AssetType.BANK

    # ================================================================
    # Rule 3: Setor/Subsetor based detection
    # ================================================================
    try:
        # Extract setor and subsetor from page
        setor = ""
        subsetor = ""

        first_table = soup.select_one("table.w728")
        if first_table:
            for row in first_table.select("tr"):
                cells = row.select("td")
                for i in range(0, len(cells), 2):
                    if i + 1 >= len(cells):
                        break
                    label_elem = cells[i].select_one(".txt")
                    if not label_elem:
                        continue
                    label = label_elem.get_text().strip().lower()

                    if label == "setor":
                        link = cells[i + 1].select_one("a")
                        if link:
                            setor = link.get_text().strip().lower()
                    elif label == "subsetor":
                        link = cells[i + 1].select_one("a")
                        if link:
                            subsetor = link.get_text().strip().lower()

        # Check for holdings
        if "holdings" in setor:
            logger.debug(f"Detected {ticker} as HOLDING (setor: {setor})")
            return AssetType.HOLDING

        # Check for insurance
        if "seguradoras" in subsetor:
            logger.debug(f"Detected {ticker} as INSURANCE (subsetor: {subsetor})")
            return AssetType.INSURANCE

        # Check for banks (setor-based)
        if "bancos" in subsetor or "intermediários financeiros" in setor:
            # Double-check with bank indicators
            if any(indicator in page_text for indicator in bank_indicators):
                logger.debug(f"Detected {ticker} as BANK (setor: {setor}, subsetor: {subsetor})")
                return AssetType.BANK

    except Exception as e:
        logger.debug(f"Error detecting setor/subsetor: {e}")

    # ================================================================
    # Default: Industrial stock
    # ================================================================
    logger.debug(f"Detected {ticker} as STOCK (default)")
    return AssetType.STOCK


def get_extractor(
    asset_type: AssetType,
    soup: BeautifulSoup,
    ticker: str
) -> BaseExtractor:
    """
    Factory function to get the appropriate extractor for an asset type.

    Args:
        asset_type: The detected or specified AssetType
        soup: BeautifulSoup parsed HTML
        ticker: Stock/FII ticker

    Returns:
        Appropriate extractor instance
    """
    extractors = {
        AssetType.STOCK: StockExtractor,
        AssetType.STOCK_UNT: StockExtractor,  # Units use stock extractor
        AssetType.BANK: BankExtractor,
        AssetType.INSURANCE: InsuranceExtractor,
        AssetType.HOLDING: HoldingExtractor,
        AssetType.FII: FIIExtractor,
    }

    extractor_class = extractors.get(asset_type, StockExtractor)
    return extractor_class(soup, ticker)


__all__ = [
    # Types
    "AssetType",
    "FundamentusBaseData",
    "StockData",
    "BankData",
    "FIIData",
    # Field maps
    "STOCK_FIELD_MAP",
    "BANK_FIELD_MAP",
    "FII_FIELD_MAP",
    # Base class
    "BaseExtractor",
    # Extractors
    "StockExtractor",
    "HoldingExtractor",
    "InsuranceExtractor",
    "BankExtractor",
    "FIIExtractor",
    # Factory functions
    "detect_asset_type",
    "get_extractor",
]
