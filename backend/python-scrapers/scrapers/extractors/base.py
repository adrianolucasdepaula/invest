"""
Base Extractor for Fundamentus Scraper v2.0

Provides common extraction logic for all asset types.
Uses BeautifulSoup for fast local parsing (single HTML fetch pattern).
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
from loguru import logger
import re

from .types import AssetType


class BaseExtractor(ABC):
    """
    Abstract base class for all Fundamentus extractors.

    Usage:
        extractor = StockExtractor(soup, ticker)
        data = extractor.extract()

    Subclasses must implement:
        - extract_specific_fields(): Extract category-specific fields
        - get_field_map(): Return field mapping for this category
    """

    def __init__(self, soup: BeautifulSoup, ticker: str):
        """
        Initialize extractor with parsed HTML and ticker.

        Args:
            soup: BeautifulSoup parsed HTML
            ticker: Stock/FII ticker (e.g., 'PETR4', 'HGLG11')
        """
        self.soup = soup
        self.ticker = ticker.upper()
        self.data: Dict[str, Any] = {}

    @property
    @abstractmethod
    def asset_type(self) -> AssetType:
        """Return the asset type this extractor handles"""
        pass

    @abstractmethod
    def get_field_map(self) -> Dict[str, str]:
        """Return the field mapping for this asset type"""
        pass

    def extract(self) -> Dict[str, Any]:
        """
        Extract all data from the page.

        Returns:
            Dictionary with all extracted fields
        """
        self.data = {
            "ticker": self.ticker,
            "asset_type": self.asset_type.value,
        }

        # Extract common fields (present in all asset types)
        self._extract_common_fields()

        # Extract category-specific fields
        self.extract_specific_fields()

        # Post-processing
        self._calculate_derived_fields()
        self._cleanup_data()

        return self.data

    def _extract_common_fields(self):
        """Extract fields common to ALL asset types"""
        # These are always present regardless of asset type
        # Type/Sector/Subsector from first table
        self._extract_classification()

    def _extract_classification(self):
        """
        Extract tipo, setor, subsetor from first table (table.w728).
        Common to stocks and FIIs (though labels differ).
        """
        try:
            first_table = self.soup.select_one("table.w728")
            if not first_table:
                return

            rows = first_table.select("tr")
            for row in rows:
                cells = row.select("td")
                if len(cells) < 4:
                    continue

                # Process in pairs
                for i in range(0, len(cells), 2):
                    if i + 1 >= len(cells):
                        break

                    label_elem = cells[i].select_one(".txt")
                    if not label_elem:
                        continue

                    label = label_elem.get_text().strip().lower()

                    # Tipo (text)
                    if label == "tipo":
                        value_elem = cells[i + 1].select_one(".txt")
                        if value_elem:
                            self.data["tipo"] = value_elem.get_text().strip()

                    # Setor (link)
                    elif label == "setor":
                        value_link = cells[i + 1].select_one("a")
                        if value_link:
                            self.data["setor"] = value_link.get_text().strip()

                    # Subsetor (link)
                    elif label == "subsetor":
                        value_link = cells[i + 1].select_one("a")
                        if value_link:
                            self.data["subsetor"] = value_link.get_text().strip()

                    # For FIIs: Segmento, Gestão, Mandato
                    elif label == "segmento":
                        value_link = cells[i + 1].select_one("a")
                        if value_link:
                            self.data["segmento"] = value_link.get_text().strip()
                        else:
                            value_elem = cells[i + 1].select_one(".txt")
                            if value_elem:
                                self.data["segmento"] = value_elem.get_text().strip()

                    elif label == "gestão":
                        value_elem = cells[i + 1].select_one(".txt")
                        if value_elem:
                            self.data["gestao"] = value_elem.get_text().strip()

                    elif label == "mandato":
                        value_elem = cells[i + 1].select_one(".txt")
                        if value_elem:
                            self.data["mandato"] = value_elem.get_text().strip()

        except Exception as e:
            logger.debug(f"Could not extract classification: {e}")

    @abstractmethod
    def extract_specific_fields(self):
        """
        Extract category-specific fields.
        Must be implemented by each subclass.
        """
        pass

    def extract_table_data(self):
        """
        Extract all data from Fundamentus tables (table.w728).
        Uses the field map from get_field_map() for mapping.
        """
        field_map = self.get_field_map()

        try:
            tables = self.soup.select("table.w728")

            for table in tables:
                rows = table.select("tr")

                for row in rows:
                    cells = row.select("td")

                    # Skip header rows (2 cells) or empty rows
                    if len(cells) < 4:
                        continue

                    # Process cells in pairs (label, value)
                    step = 2
                    for i in range(0, len(cells), step):
                        if i + 1 >= len(cells):
                            break

                        try:
                            label_elem = cells[i].select_one(".txt")
                            value_elem = cells[i + 1].select_one(".txt")

                            if not label_elem or not value_elem:
                                continue

                            label = label_elem.get_text().strip().lower().replace("?", "")
                            value = value_elem.get_text().strip()

                            # Skip empty
                            if not label or not value:
                                continue

                            # Map field
                            self._map_field(field_map, label, value)

                        except Exception:
                            continue

        except Exception as e:
            logger.error(f"Error extracting table data: {e}")

    def _map_field(self, field_map: Dict[str, str], label: str, value: str):
        """
        Map a Fundamentus field to our data dictionary.

        Args:
            field_map: Dictionary mapping labels to field names
            label: The label from Fundamentus (e.g., 'p/l')
            value: The raw value string
        """
        # Find exact match in field map
        if label in field_map:
            field_name = field_map[label]

            # Text fields (keep as string)
            text_fields = {"company_name", "nome", "segmento", "gestao",
                          "mandato", "relatorio", "ultimo_info_trimestral"}

            if field_name in text_fields:
                self.data[field_name] = value
            else:
                # Numeric fields
                parsed = self._parse_value(value)
                if parsed is not None:
                    self.data[field_name] = parsed

    def _parse_value(self, value_text: str) -> Optional[float]:
        """
        Parse numeric value from Brazilian format.

        Handles:
        - Comma as decimal separator (123,45 → 123.45)
        - Period as thousand separator (1.234.567 → 1234567)
        - Percentages (12,5% → 12.5)
        - Currency prefix (R$ 123,45 → 123.45)
        - Dash for missing data (- → None)

        Returns:
            Float value or None if parsing fails
        """
        if not value_text or value_text == "-":
            return None

        # Quick check: if contains letters (except R$), not a number
        if any(c.isalpha() and c not in 'R$' for c in value_text):
            return None

        try:
            # Remove currency prefix
            value_text = value_text.replace("R$", "").strip()

            # Check for percentage
            value_text = value_text.replace("%", "").strip()

            # Convert Brazilian format to float
            # 1.234.567,89 → 1234567.89
            value_text = value_text.replace(".", "").replace(",", ".")

            return float(value_text)

        except Exception as e:
            logger.debug(f"Could not parse value '{value_text}': {e}")
            return None

    def _calculate_derived_fields(self):
        """
        Calculate derived fields from extracted data.
        Override in subclasses for category-specific calculations.
        """
        pass

    def _cleanup_data(self):
        """
        Remove temporary fields and clean up data.
        """
        # Remove private fields (starting with _)
        keys_to_remove = [k for k in self.data.keys() if k.startswith("_")]
        for key in keys_to_remove:
            del self.data[key]

    def has_field(self, *labels: str) -> bool:
        """
        Check if any of the given labels exist on the page.
        Used for asset type detection.

        Args:
            labels: One or more label texts to search for

        Returns:
            True if any label is found on the page
        """
        page_text = self.soup.get_text().lower()
        return any(label.lower() in page_text for label in labels)

    def get_company_name(self) -> Optional[str]:
        """
        Extract company/fund name from header.

        Returns:
            Company name or None
        """
        try:
            name_elem = self.soup.select_one("h1, .resultado h2")
            if name_elem:
                company_text = name_elem.get_text().strip()
                # Remove ticker from name if present
                company_text = re.sub(r'\s*-\s*\w+\d*\s*$', '', company_text)
                return company_text
        except Exception as e:
            logger.debug(f"Could not extract company name: {e}")
        return None
