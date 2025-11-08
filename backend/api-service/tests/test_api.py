"""
Tests for Scraper Test API
"""
import pytest
from httpx import AsyncClient
from main import app


@pytest.mark.asyncio
async def test_root():
    """Test root endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_scraper_ping():
    """Test scraper ping endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/scrapers/ping")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["total_scrapers"] == 27


@pytest.mark.asyncio
async def test_list_scrapers():
    """Test list scrapers endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/scrapers/list")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 27
        assert "scrapers" in data
        assert "categories" in data


@pytest.mark.asyncio
async def test_list_scrapers_with_filter():
    """Test list scrapers with category filter"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get(
            "/api/scrapers/list?category=fundamental_analysis"
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 5  # 5 fundamental analysis scrapers
        assert all(
            s["category"] == "fundamental_analysis"
            for s in data["scrapers"]
        )


@pytest.mark.asyncio
async def test_get_cookies_status():
    """Test cookies status endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/scrapers/cookies/status")
        assert response.status_code == 200
        data = response.json()
        assert "exists" in data
        assert "valid" in data
        assert "severity" in data


@pytest.mark.asyncio
async def test_get_scrapers_health():
    """Test scrapers health endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/api/scrapers/health")
        assert response.status_code == 200
        data = response.json()
        assert "overall_health" in data
        assert "total_scrapers" in data
        assert data["total_scrapers"] == 27
        assert "scrapers" in data


# Integration tests (requires actual scrapers)

@pytest.mark.asyncio
@pytest.mark.integration
async def test_test_scraper():
    """Test scraper test endpoint (integration test)"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/scrapers/test",
            json={"scraper": "FUNDAMENTUS", "query": "PETR4"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["scraper"] == "FUNDAMENTUS"
        assert data["query"] == "PETR4"


@pytest.mark.asyncio
@pytest.mark.integration
async def test_test_all_scrapers():
    """Test all scrapers endpoint (integration test)"""
    async with AsyncClient(app=app, base_url="http://test", timeout=60) as client:
        response = await client.post(
            "/api/scrapers/test-all",
            json={
                "category": "fundamental_analysis",
                "max_concurrent": 3,
                "query": "PETR4"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_tested" in data
        assert "success" in data
        assert "results" in data
