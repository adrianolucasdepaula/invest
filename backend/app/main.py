"""
Aplicação principal FastAPI
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from .core.config import settings
from .core.database import engine, Base

# Importar routers dos endpoints
from .api.endpoints import assets, analysis, reports, portfolio

# Configurar logger
logger.remove()
logger.add(
    sys.stderr,
    format=settings.LOG_FORMAT,
    level=settings.LOG_LEVEL
)

# Criar tabelas
Base.metadata.create_all(bind=engine)

# Metadata para OpenAPI
description = """
## 🚀 B3 Investment Analysis Platform API

Plataforma completa para coleta, análise e geração de relatórios de investimentos da **Bolsa de Valores Brasileira (B3)**.

### 📊 Principais Funcionalidades

* **Coleta de Dados**: Integração com 17+ fontes de dados (fundamentalistas, técnicos, notícias, opções)
* **Análise com IA**: Análise fundamentalista, técnica e de sentimento usando GPT-4, Claude e Gemini
* **Validação Cruzada**: Validação de dados de múltiplas fontes com scores de qualidade
* **Relatórios**: Geração de relatórios completos em PDF/HTML/Markdown
* **Portfólio**: Gerenciamento multi-mercado com suporte a múltiplas fontes
* **Tarefas Assíncronas**: Processamento em background com Celery

### 🔗 Links Úteis

* **Documentação Interativa**: `/docs` (Swagger UI)
* **Documentação Alternativa**: `/redoc` (ReDoc)
* **Health Check**: `/health`
* **OpenAPI Schema**: `/api/v1/openapi.json`

### 🛡️ Autenticação

A maioria dos endpoints requer autenticação via **Bearer Token** (JWT).

```bash
Authorization: Bearer <seu_token_aqui>
```

### 📝 Convenções

* Todos os endpoints principais estão sob `/api/v1/`
* Respostas de sucesso retornam status `200` ou `201`
* Erros retornam status `4xx` ou `5xx` com detalhes no campo `detail`
* Timestamps estão em formato ISO 8601 (UTC)
* Valores monetários em BRL (R$)

### ⚡ Rate Limiting

* **60 requisições/minuto** por IP
* Header `X-RateLimit-Remaining` indica requisições restantes

### 🔄 Versionamento

API atual: **v1.0.0**

Versões futuras manterão compatibilidade retroativa ou terão prefixo `/api/v2/`
"""

tags_metadata = [
    {
        "name": "Assets",
        "description": """
Operações relacionadas a **ativos** (ações, FIIs, ETFs, BDRs).

* Coleta de dados de múltiplas fontes
* Consulta de dados fundamentalistas, técnicos e de opções
* Busca e filtros avançados
* Atualização em tempo real
        """.strip(),
    },
    {
        "name": "Analysis",
        "description": """
**Análises avançadas** de ativos usando IA e algoritmos proprietários.

* Análise fundamentalista (indicadores, DRE, balanço)
* Análise técnica (médias, RSI, MACD, padrões)
* Análise de sentimento de mercado
* Comparação entre ativos
* Detecção de oportunidades
* Recomendações de compra/venda
        """.strip(),
    },
    {
        "name": "Reports",
        "description": """
**Geração de relatórios** profissionais com análise completa.

* Relatórios completos (todos aspectos)
* Relatórios específicos (fundamentalista, técnico, opções)
* Relatórios comparativos
* Exportação em PDF, HTML, Markdown
* Análises multi-IA (GPT-4 + Claude + Gemini)
* Agendamento de relatórios periódicos
        """.strip(),
    },
    {
        "name": "Portfolio",
        "description": """
**Gerenciamento de portfólio** multi-mercado.

* Importação de múltiplas fontes (Kinvo, Investidor10, B3, etc)
* Consolidação de posições
* Cálculo de rentabilidade
* Análise de alocação
* Sugestões de rebalanceamento
* Alertas de concentração
        """.strip(),
    },
]

# Criar aplicação com metadata OpenAPI completa
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=description,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=tags_metadata,
    contact={
        "name": "B3 Investment Analysis Platform Team",
        "email": "contact@b3analysis.com",
        "url": "https://github.com/yourusername/b3-investment-platform",
    },
    license_info={
        "name": "MIT License",
        "url": "https://opensource.org/licenses/MIT",
    },
    terms_of_service="https://b3analysis.com/terms",
)

# Customizar OpenAPI schema com security schemes
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    from fastapi.openapi.utils import get_openapi

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
        tags=app.openapi_tags,
        servers=[
            {"url": "http://localhost:8000", "description": "Ambiente de Desenvolvimento"},
            {"url": "http://localhost:8000", "description": "Ambiente de Staging"},
            {"url": "https://api.b3analysis.com", "description": "Ambiente de Produção"},
        ],
    )

    # Adicionar security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Token JWT de autenticação. Obtenha o token via endpoint `/api/v1/auth/login`"
        },
        "ApiKeyAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "API Key para integrações. Solicite uma API Key no painel de configurações"
        }
    }

    # Adicionar informações de segurança global
    openapi_schema["security"] = [
        {"BearerAuth": []},
        {"ApiKeyAuth": []}
    ]

    # Adicionar informações de rate limiting
    openapi_schema["info"]["x-rateLimit"] = {
        "limit": settings.RATE_LIMIT_PER_MINUTE,
        "period": "minute"
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """
    Endpoint raiz
    """
    return {
        "message": "B3 Investment Analysis Platform API",
        "version": settings.VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "version": settings.VERSION
    }


# Incluir routers
app.include_router(
    assets.router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Assets"]
)
app.include_router(
    analysis.router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Analysis"]
)
app.include_router(
    reports.router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Reports"]
)
app.include_router(
    portfolio.router,
    prefix=f"{settings.API_V1_STR}",
    tags=["Portfolio"]
)


@app.on_event("startup")
async def startup_event():
    """
    Evento de startup
    """
    logger.info(f"Iniciando {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info("API disponível em: /docs")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Evento de shutdown
    """
    logger.info("Encerrando aplicação")
