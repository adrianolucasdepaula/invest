"""
Schemas Pydantic para Asset
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from ..models.asset import AssetType


class AssetBase(BaseModel):
    """Schema base para Asset"""
    ticker: str = Field(..., max_length=20, description="Código do ativo na B3", examples=["PETR4", "VALE3", "ITUB4"])
    name: str = Field(..., max_length=200, description="Nome completo do ativo", examples=["Petrobras PN", "Vale ON", "Itaú Unibanco PN"])
    asset_type: AssetType = Field(..., description="Tipo do ativo (STOCK, FII, ETF, BDR)", examples=["STOCK"])
    sector: Optional[str] = Field(None, description="Setor de atuação", examples=["Energia", "Mineração", "Financeiro"])
    subsector: Optional[str] = Field(None, description="Subsetor de atuação", examples=["Petróleo e Gás", "Mineração de Ferro", "Bancos"])
    segment: Optional[str] = Field(None, description="Segmento listagem B3", examples=["Novo Mercado", "Nível 2"])
    cnpj: Optional[str] = Field(None, description="CNPJ da empresa", examples=["33.000.167/0001-01"])


class AssetCreate(AssetBase):
    """Schema para criação de Asset"""

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "ticker": "PETR4",
                    "name": "Petrobras PN",
                    "asset_type": "STOCK",
                    "sector": "Energia",
                    "subsector": "Petróleo e Gás",
                    "segment": "Novo Mercado",
                    "cnpj": "33.000.167/0001-01"
                }
            ]
        }
    }


class AssetUpdate(BaseModel):
    """Schema para atualização de Asset"""
    name: Optional[str] = Field(None, description="Nome completo do ativo")
    current_price: Optional[float] = Field(None, description="Preço atual", examples=[38.50])
    market_cap: Optional[float] = Field(None, description="Valor de mercado em BRL", examples=[515000000000.00])
    free_float: Optional[float] = Field(None, description="Free float em %", examples=[23.5])
    average_volume: Optional[float] = Field(None, description="Volume médio diário", examples=[45000000.00])

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "current_price": 38.50,
                    "market_cap": 515000000000.00,
                    "free_float": 23.5,
                    "average_volume": 45000000.00
                }
            ]
        }
    }


class AssetResponse(AssetBase):
    """Schema de resposta para Asset"""
    id: int = Field(..., description="ID único do ativo", examples=[1])
    current_price: Optional[float] = Field(None, description="Preço atual", examples=[38.50])
    market_cap: Optional[float] = Field(None, description="Valor de mercado em BRL", examples=[515000000000.00])
    free_float: Optional[float] = Field(None, description="Free float em %", examples=[23.5])
    average_volume: Optional[float] = Field(None, description="Volume médio diário", examples=[45000000.00])
    is_active: bool = Field(..., description="Ativo está ativo?", examples=[True])
    created_at: datetime = Field(..., description="Data de criação", examples=["2025-10-26T10:00:00Z"])
    updated_at: Optional[datetime] = Field(None, description="Data última atualização", examples=["2025-10-26T14:30:00Z"])

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "ticker": "PETR4",
                    "name": "Petrobras PN",
                    "asset_type": "STOCK",
                    "sector": "Energia",
                    "subsector": "Petróleo e Gás",
                    "segment": "Novo Mercado",
                    "cnpj": "33.000.167/0001-01",
                    "current_price": 38.50,
                    "market_cap": 515000000000.00,
                    "free_float": 23.5,
                    "average_volume": 45000000.00,
                    "is_active": True,
                    "created_at": "2025-10-26T10:00:00Z",
                    "updated_at": "2025-10-26T14:30:00Z"
                }
            ]
        }
    }


class AssetWithData(AssetResponse):
    """Schema de Asset com dados relacionados"""
    fundamental_data_count: int = Field(0, description="Quantidade de dados fundamentalistas", examples=[150])
    technical_data_count: int = Field(0, description="Quantidade de dados técnicos", examples=[1250])
    options_count: int = Field(0, description="Quantidade de opções disponíveis", examples=[45])
    news_count: int = Field(0, description="Quantidade de notícias coletadas", examples=[320])

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "examples": [
                {
                    "id": 1,
                    "ticker": "PETR4",
                    "name": "Petrobras PN",
                    "asset_type": "STOCK",
                    "sector": "Energia",
                    "subsector": "Petróleo e Gás",
                    "segment": "Novo Mercado",
                    "cnpj": "33.000.167/0001-01",
                    "current_price": 38.50,
                    "market_cap": 515000000000.00,
                    "free_float": 23.5,
                    "average_volume": 45000000.00,
                    "is_active": True,
                    "created_at": "2025-10-26T10:00:00Z",
                    "updated_at": "2025-10-26T14:30:00Z",
                    "fundamental_data_count": 150,
                    "technical_data_count": 1250,
                    "options_count": 45,
                    "news_count": 320
                }
            ]
        }
    }
