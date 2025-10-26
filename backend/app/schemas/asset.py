"""
Schemas Pydantic para Asset
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from ..models.asset import AssetType


class AssetBase(BaseModel):
    """Schema base para Asset"""
    ticker: str = Field(..., max_length=20)
    name: str = Field(..., max_length=200)
    asset_type: AssetType
    sector: Optional[str] = None
    subsector: Optional[str] = None
    segment: Optional[str] = None
    cnpj: Optional[str] = None


class AssetCreate(AssetBase):
    """Schema para criação de Asset"""
    pass


class AssetUpdate(BaseModel):
    """Schema para atualização de Asset"""
    name: Optional[str] = None
    current_price: Optional[float] = None
    market_cap: Optional[float] = None
    free_float: Optional[float] = None
    average_volume: Optional[float] = None


class AssetResponse(AssetBase):
    """Schema de resposta para Asset"""
    id: int
    current_price: Optional[float] = None
    market_cap: Optional[float] = None
    free_float: Optional[float] = None
    average_volume: Optional[float] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssetWithData(AssetResponse):
    """Schema de Asset com dados relacionados"""
    fundamental_data_count: int = 0
    technical_data_count: int = 0
    options_count: int = 0
    news_count: int = 0
