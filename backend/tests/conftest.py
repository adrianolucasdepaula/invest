"""
Pytest configuration and shared fixtures
"""
import pytest
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent
sys.path.insert(0, str(backend_path))


@pytest.fixture(scope="session")
def test_config():
    """Test configuration"""
    return {
        "testing": True,
        "database_url": "sqlite:///:memory:",
        "redis_url": "redis://localhost:6379/15",  # Usar DB 15 para testes
        "celery_broker_url": "memory://",
        "celery_result_backend": "cache+memory://",
    }


@pytest.fixture(scope="function")
def mock_ticker():
    """Mock ticker for tests"""
    return "PETR4"


@pytest.fixture(scope="function")
def mock_asset_data():
    """Mock asset data"""
    return {
        "ticker": "PETR4",
        "name": "Petrobras PN",
        "price": 38.50,
        "change": 0.75,
        "changePercent": 1.99,
        "volume": 45000000,
        "marketCap": 500000000000,
    }


@pytest.fixture(scope="function")
def mock_fundamental_data():
    """Mock fundamental data"""
    return {
        "ticker": "PETR4",
        "pl_ratio": 4.5,
        "pvp_ratio": 1.2,
        "roe": 18.5,
        "dividend_yield": 12.3,
        "revenue": 120000000000,
        "net_income": 25000000000,
        "debt_equity": 0.45,
    }


@pytest.fixture(scope="function")
def mock_technical_data():
    """Mock technical data"""
    return {
        "ticker": "PETR4",
        "sma_20": 37.80,
        "sma_50": 36.50,
        "sma_200": 35.20,
        "rsi": 62.5,
        "macd": 0.85,
        "bollinger_upper": 40.20,
        "bollinger_lower": 35.40,
        "volume_avg": 42000000,
    }


@pytest.fixture(scope="function")
def mock_analysis_result():
    """Mock analysis result"""
    return {
        "ticker": "PETR4",
        "overall_score": 7.8,
        "recommendation": "COMPRA",
        "fundamental_analysis": {
            "score": 8.0,
            "valuation": "Atrativo",
        },
        "technical_analysis": {
            "score": 7.5,
            "trend": "Alta",
        },
        "risk_analysis": {
            "score": 7.0,
            "level": "Médio",
        },
    }


@pytest.fixture(scope="function")
def mock_report():
    """Mock report"""
    return {
        "ticker": "PETR4",
        "title": "Relatório de Análise - PETR4",
        "summary": "Análise completa do ativo PETR4",
        "content": "Conteúdo do relatório...",
        "generated_at": "2025-10-26T10:00:00Z",
        "ai_provider": "openai",
    }


@pytest.fixture(scope="session")
def celery_config():
    """Celery configuration for tests"""
    return {
        "broker_url": "memory://",
        "result_backend": "cache+memory://",
        "task_always_eager": True,
        "task_eager_propagates": True,
    }


@pytest.fixture
def mock_http_response():
    """Mock HTTP response"""
    class MockResponse:
        def __init__(self, json_data, status_code=200, text=""):
            self.json_data = json_data
            self.status_code = status_code
            self.text = text or str(json_data)
            self.ok = status_code < 400

        def json(self):
            return self.json_data

        def raise_for_status(self):
            if not self.ok:
                raise Exception(f"HTTP {self.status_code}")

    return MockResponse


@pytest.fixture
def mock_selenium_driver():
    """Mock Selenium WebDriver"""
    class MockDriver:
        def __init__(self):
            self.current_url = ""
            self._page_source = "<html></html>"

        def get(self, url):
            self.current_url = url

        def find_element(self, by, value):
            return MockElement()

        def find_elements(self, by, value):
            return [MockElement(), MockElement()]

        @property
        def page_source(self):
            return self._page_source

        def quit(self):
            pass

    class MockElement:
        def __init__(self):
            self.text = "Mock Text"

        def click(self):
            pass

        def send_keys(self, *args):
            pass

        def get_attribute(self, name):
            return "mock_value"

    return MockDriver
