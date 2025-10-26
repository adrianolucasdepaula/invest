# Test Suite - B3 Investment Analysis Platform

## Estrutura de Testes

```
tests/
├── conftest.py                  # Fixtures e configuração global
├── unit/                        # Testes unitários
│   ├── scrapers/               # Testes dos scrapers
│   │   ├── test_brapi_scraper.py
│   │   └── ...
│   ├── services/               # Testes dos services
│   │   ├── test_analysis_service.py
│   │   └── ...
│   └── tasks/                  # Testes das tarefas Celery
│       ├── test_data_collection_tasks.py
│       └── ...
├── integration/                # Testes de integração
│   ├── test_api_assets.py
│   └── ...
└── fixtures/                   # Fixtures auxiliares
```

## Executando os Testes

### Todos os Testes

```bash
pytest
```

### Testes Unitários

```bash
pytest tests/unit/
```

### Testes de Integração

```bash
pytest tests/integration/
```

### Testes por Categoria (Markers)

```bash
# Apenas scrapers
pytest -m scraper

# Apenas services
pytest -m service

# Apenas APIs
pytest -m api

# Apenas tasks
pytest -m task
```

### Com Coverage

```bash
# Gerar relatório de coverage
pytest --cov=app --cov-report=html

# Ver relatório
open htmlcov/index.html
```

### Testes Específicos

```bash
# Um arquivo específico
pytest tests/unit/scrapers/test_brapi_scraper.py

# Uma classe específica
pytest tests/unit/scrapers/test_brapi_scraper.py::TestBRAPIScraper

# Um teste específico
pytest tests/unit/scrapers/test_brapi_scraper.py::TestBRAPIScraper::test_get_quote_success
```

## Fixtures Disponíveis

### Dados Mock

- `mock_ticker`: Ticker de teste (PETR4)
- `mock_asset_data`: Dados básicos de ativo
- `mock_fundamental_data`: Dados fundamentalistas
- `mock_technical_data`: Dados técnicos
- `mock_analysis_result`: Resultado de análise
- `mock_report`: Relatório de exemplo

### Mocks de Serviços

- `mock_http_response`: Mock de resposta HTTP
- `mock_selenium_driver`: Mock do Selenium WebDriver

### Configuração

- `test_config`: Configuração para testes
- `celery_config`: Configuração do Celery para testes

## Escrevendo Novos Testes

### Padrão de Nome

- Arquivos: `test_*.py`
- Classes: `Test*`
- Funções: `test_*`

### Exemplo de Teste Unitário

```python
import pytest
from app.services import MyService

class TestMyService:
    @pytest.fixture
    def service(self):
        return MyService()

    def test_method_success(self, service):
        result = service.my_method("input")
        assert result == "expected"

    def test_method_error(self, service):
        with pytest.raises(ValueError):
            service.my_method("")
```

### Exemplo de Teste de Integração

```python
from fastapi.testclient import TestClient

def test_endpoint(client):
    response = client.get("/api/v1/endpoint")
    assert response.status_code == 200
    assert "data" in response.json()
```

## Coverage

Meta: **70%+ de cobertura de código**

Para verificar coverage atual:

```bash
pytest --cov=app --cov-report=term-missing
```

## CI/CD

Os testes são executados automaticamente no CI/CD em cada push e pull request.

Requisitos para merge:
- ✅ Todos os testes passando
- ✅ Coverage >= 70%
- ✅ Sem erros de lint
