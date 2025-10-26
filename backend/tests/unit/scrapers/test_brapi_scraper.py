"""
Unit tests for BRAPIScr

aper
"""
import pytest
from unittest.mock import Mock, patch
from app.scrapers.brapi import BRAPIScraper


class TestBRAPIScraper:
    """Test BRAPIScraper class"""

    @pytest.fixture
    def scraper(self):
        """Create scraper instance"""
        return BRAPIScraper()

    def test_scraper_initialization(self, scraper):
        """Test scraper initialization"""
        assert scraper is not None
        assert hasattr(scraper, 'base_url')
        assert hasattr(scraper, 'token')

    @patch('requests.get')
    def test_get_quote_success(self, mock_get, scraper, mock_http_response):
        """Test successful quote retrieval"""
        # Mock response
        mock_data = {
            "results": [{
                "symbol": "PETR4",
                "regularMarketPrice": 38.50,
                "regularMarketChange": 0.75,
                "regularMarketChangePercent": 1.99,
            }]
        }
        mock_get.return_value = mock_http_response(mock_data)

        # Execute
        result = scraper.get_quote("PETR4")

        # Verify
        assert result is not None
        assert result.get("symbol") == "PETR4"
        mock_get.assert_called_once()

    @patch('requests.get')
    def test_get_quote_http_error(self, mock_get, scraper, mock_http_response):
        """Test quote retrieval with HTTP error"""
        # Mock error response
        mock_get.return_value = mock_http_response({}, status_code=404)

        # Execute and verify exception
        with pytest.raises(Exception):
            scraper.get_quote("INVALID")

    def test_get_quote_empty_ticker(self, scraper):
        """Test quote retrieval with empty ticker"""
        with pytest.raises(ValueError):
            scraper.get_quote("")

    @patch('requests.get')
    def test_get_fundamentals(self, mock_get, scraper, mock_http_response):
        """Test fundamentals data retrieval"""
        # Mock response
        mock_data = {
            "results": [{
                "symbol": "PETR4",
                "priceEarnings": 4.5,
                "priceToBook": 1.2,
                "returnOnEquity": 18.5,
            }]
        }
        mock_get.return_value = mock_http_response(mock_data)

        # Execute
        result = scraper.get_fundamentals("PETR4")

        # Verify
        assert result is not None
        assert "priceEarnings" in result or "symbol" in result

    @patch('requests.get')
    def test_rate_limiting(self, mock_get, scraper, mock_http_response):
        """Test rate limiting behavior"""
        mock_get.return_value = mock_http_response({"results": []})

        # Make multiple requests
        for _ in range(3):
            scraper.get_quote("PETR4")

        # Verify calls were made (rate limiting should not block in tests)
        assert mock_get.call_count == 3

    def test_parse_response_valid(self, scraper):
        """Test response parsing with valid data"""
        response = {"results": [{"symbol": "PETR4", "price": 38.50}]}
        result = scraper._parse_response(response)
        assert result is not None

    def test_parse_response_empty(self, scraper):
        """Test response parsing with empty data"""
        response = {"results": []}
        result = scraper._parse_response(response)
        assert result is None or len(result) == 0
