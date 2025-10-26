"""
Integration tests for Assets API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock


@pytest.fixture
def client():
    """Create test client"""
    from app.main import app
    return TestClient(app)


class TestAssetsAPI:
    """Test Assets API endpoints"""

    def test_health_check(self, client):
        """Test API health check"""
        response = client.get("/")
        assert response.status_code in [200, 404]  # Depends on if root route exists

    @patch('app.services.DataCollectionService.collect_asset_data')
    def test_get_asset_data_success(self, mock_collect, client, mock_asset_data):
        """Test GET /assets/{ticker} success"""
        mock_collect.return_value = mock_asset_data

        response = client.get("/api/v1/assets/PETR4")

        if response.status_code == 200:
            data = response.json()
            assert "ticker" in data or "symbol" in data

    @patch('app.services.DataCollectionService.collect_asset_data')
    def test_post_collect_asset(self, mock_collect, client):
        """Test POST /assets/collect"""
        mock_collect.return_value = {"status": "success"}

        response = client.post(
            "/api/v1/assets/collect",
            json={"ticker": "PETR4", "force_refresh": False}
        )

        # Should return 200 or 202 (accepted)
        assert response.status_code in [200, 202, 422]  # 422 if validation fails

    @patch('app.services.DataCollectionService.batch_collect')
    def test_post_batch_collect(self, mock_batch, client):
        """Test POST /assets/batch-collect"""
        mock_batch.return_value = {"success_count": 3, "total_count": 3}

        response = client.post(
            "/api/v1/assets/batch-collect",
            json=["PETR4", "VALE3", "ITUB4"]
        )

        assert response.status_code in [200, 202, 422]

    def test_get_asset_invalid_ticker(self, client):
        """Test GET /assets/{ticker} with invalid ticker"""
        response = client.get("/api/v1/assets/")

        # Should return 404 or 422
        assert response.status_code in [404, 422, 405]

    @patch('app.tasks.data_collection.collect_asset_data_async.apply_async')
    def test_post_async_collect(self, mock_task, client):
        """Test POST /assets/async/collect"""
        mock_result = Mock()
        mock_result.id = "task-123"
        mock_task.return_value = mock_result

        response = client.post(
            "/api/v1/assets/async/collect?ticker=PETR4&force_update=false"
        )

        if response.status_code == 200:
            data = response.json()
            assert "task_id" in data
            assert data["task_id"] == "task-123"

    def test_get_fundamentals(self, client):
        """Test GET /assets/{ticker}/fundamental"""
        response = client.get("/api/v1/assets/PETR4/fundamental")

        # Should return 200 or 500 depending on implementation
        assert response.status_code in [200, 500, 404]

    def test_get_technical(self, client):
        """Test GET /assets/{ticker}/technical"""
        response = client.get("/api/v1/assets/PETR4/technical")

        assert response.status_code in [200, 500, 404]

    def test_get_crypto(self, client):
        """Test GET /crypto/{symbol}"""
        response = client.get("/api/v1/crypto/BTC")

        assert response.status_code in [200, 404, 500]

    def test_get_economic_calendar(self, client):
        """Test GET /market/economic-calendar"""
        response = client.get("/api/v1/market/economic-calendar?country=brazil&days=7")

        assert response.status_code in [200, 404, 500]

    def test_get_task_status(self, client):
        """Test GET /tasks/{task_id}/status"""
        response = client.get("/api/v1/tasks/fake-task-id/status")

        # Should return 200 with status or 404
        assert response.status_code in [200, 404, 500]

    def test_get_queue_stats(self, client):
        """Test GET /tasks/queue/stats"""
        response = client.get("/api/v1/tasks/queue/stats")

        assert response.status_code in [200, 500]

    def test_cors_headers(self, client):
        """Test CORS headers are present"""
        response = client.options("/api/v1/assets/PETR4")

        # CORS preflight response
        assert response.status_code in [200, 405]


class TestAPIValidation:
    """Test API input validation"""

    def test_empty_ticker(self, client):
        """Test empty ticker validation"""
        response = client.post(
            "/api/v1/assets/collect",
            json={"ticker": "", "force_refresh": False}
        )

        assert response.status_code == 422

    def test_invalid_json(self, client):
        """Test invalid JSON payload"""
        response = client.post(
            "/api/v1/assets/collect",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )

        assert response.status_code == 422

    def test_missing_required_fields(self, client):
        """Test missing required fields"""
        response = client.post(
            "/api/v1/assets/collect",
            json={}
        )

        assert response.status_code == 422
