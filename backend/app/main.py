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

# Criar aplicação
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

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
