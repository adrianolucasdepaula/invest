"""
Unit tests for AnalysisService
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from app.services.analysis_service import AnalysisService


class TestAnalysisService:
    """Test AnalysisService class"""

    @pytest.fixture
    def service(self):
        """Create service instance"""
        return AnalysisService()

    @pytest.fixture
    def complete_asset_data(self, mock_asset_data, mock_fundamental_data, mock_technical_data):
        """Complete asset data for testing"""
        return {
            **mock_asset_data,
            "fundamental": mock_fundamental_data,
            "technical": mock_technical_data,
        }

    def test_service_initialization(self, service):
        """Test service initialization"""
        assert service is not None
        assert hasattr(service, 'analyze_asset')
        assert hasattr(service, 'compare_assets')

    def test_analyze_asset_complete_data(self, service, complete_asset_data):
        """Test asset analysis with complete data"""
        result = service.analyze_asset(complete_asset_data)

        assert result is not None
        assert "overall_score" in result
        assert "recommendation" in result
        assert "fundamental_analysis" in result
        assert "technical_analysis" in result

    def test_analyze_asset_missing_fundamental(self, service, mock_asset_data, mock_technical_data):
        """Test analysis with missing fundamental data"""
        asset_data = {**mock_asset_data, "technical": mock_technical_data}
        result = service.analyze_asset(asset_data)

        assert result is not None
        assert "overall_score" in result
        # Score should be lower without fundamentals
        assert result["overall_score"] < 10

    def test_analyze_asset_missing_technical(self, service, mock_asset_data, mock_fundamental_data):
        """Test analysis with missing technical data"""
        asset_data = {**mock_asset_data, "fundamental": mock_fundamental_data}
        result = service.analyze_asset(asset_data)

        assert result is not None
        assert "overall_score" in result

    def test_analyze_asset_empty_data(self, service):
        """Test analysis with empty data"""
        with pytest.raises((ValueError, KeyError)):
            service.analyze_asset({})

    def test_calculate_fundamental_score(self, service, mock_fundamental_data):
        """Test fundamental score calculation"""
        score = service._calculate_fundamental_score(mock_fundamental_data)

        assert isinstance(score, (int, float))
        assert 0 <= score <= 10

    def test_calculate_technical_score(self, service, mock_technical_data):
        """Test technical score calculation"""
        score = service._calculate_technical_score(mock_technical_data)

        assert isinstance(score, (int, float))
        assert 0 <= score <= 10

    def test_get_recommendation(self, service):
        """Test recommendation generation"""
        # High score -> COMPRA
        rec_high = service._get_recommendation(8.5)
        assert rec_high in ["COMPRA", "COMPRA FORTE"]

        # Medium score -> NEUTRO
        rec_med = service._get_recommendation(5.5)
        assert rec_med in ["NEUTRO", "MANTER"]

        # Low score -> VENDA
        rec_low = service._get_recommendation(3.0)
        assert rec_low in ["VENDA", "VENDA FORTE"]

    def test_compare_assets_success(self, service, complete_asset_data):
        """Test asset comparison"""
        assets = [
            {**complete_asset_data, "ticker": "PETR4"},
            {**complete_asset_data, "ticker": "VALE3"},
        ]

        result = service.compare_assets(assets)

        assert result is not None
        assert "comparisons" in result or "winner" in result
        assert "rankings" in result or "best" in result

    def test_compare_assets_single(self, service, complete_asset_data):
        """Test comparison with single asset"""
        with pytest.raises(ValueError):
            service.compare_assets([complete_asset_data])

    def test_compare_assets_empty(self, service):
        """Test comparison with empty list"""
        with pytest.raises(ValueError):
            service.compare_assets([])

    def test_analyze_risk(self, service, complete_asset_data):
        """Test risk analysis"""
        risk = service._analyze_risk(complete_asset_data)

        assert risk is not None
        assert "risk_score" in risk or "level" in risk

    def test_calculate_valuation(self, service, mock_fundamental_data):
        """Test valuation calculation"""
        valuation = service._calculate_valuation(mock_fundamental_data)

        assert valuation is not None
        assert isinstance(valuation, (dict, str))

    def test_score_range_validation(self, service, complete_asset_data):
        """Test that all scores are within valid range [0-10]"""
        result = service.analyze_asset(complete_asset_data)

        assert 0 <= result["overall_score"] <= 10

        if "fundamental_analysis" in result:
            assert 0 <= result["fundamental_analysis"].get("score", 5) <= 10

        if "technical_analysis" in result:
            assert 0 <= result["technical_analysis"].get("score", 5) <= 10
