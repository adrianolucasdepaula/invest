"""
Modelo de Dados Fundamentalistas
"""
from sqlalchemy import Column, String, Float, DateTime, Integer, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class FundamentalData(Base):
    """Modelo de Dados Fundamentalistas"""
    __tablename__ = "fundamental_data"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)

    # Período de referência
    reference_date = Column(Date, nullable=False)
    period_type = Column(String(20))  # quarterly, annual

    # Indicadores de Valuation
    price = Column(Float)
    p_vp = Column(Float)  # Preço/Valor Patrimonial
    p_l = Column(Float)  # Preço/Lucro
    p_ebit = Column(Float)
    p_ativo = Column(Float)
    ev_ebit = Column(Float)
    ev_ebitda = Column(Float)
    peg_ratio = Column(Float)
    dividend_yield = Column(Float)

    # Indicadores de Endividamento
    divida_bruta = Column(Float)
    divida_liquida = Column(Float)
    divida_bruta_patrimonio = Column(Float)
    divida_liquida_patrimonio = Column(Float)
    divida_liquida_ebitda = Column(Float)
    divida_liquida_ebit = Column(Float)
    patrimonio_liquido = Column(Float)

    # Indicadores de Eficiência
    margem_bruta = Column(Float)
    margem_ebit = Column(Float)
    margem_ebitda = Column(Float)
    margem_liquida = Column(Float)
    roe = Column(Float)  # Retorno sobre Patrimônio
    roa = Column(Float)  # Retorno sobre Ativos
    roic = Column(Float)  # Retorno sobre Capital Investido
    giro_ativos = Column(Float)

    # Indicadores de Rentabilidade
    receita_liquida = Column(Float)
    lucro_bruto = Column(Float)
    ebit = Column(Float)
    ebitda = Column(Float)
    lucro_liquido = Column(Float)
    lucro_por_acao = Column(Float)

    # Indicadores de Crescimento
    cagr_receita_5anos = Column(Float)
    cagr_lucro_5anos = Column(Float)
    crescimento_receita = Column(Float)

    # Outros indicadores
    vpa = Column(Float)  # Valor Patrimonial por Ação
    lpa = Column(Float)  # Lucro por Ação
    payout = Column(Float)
    liquidez_corrente = Column(Float)
    liquidez_seca = Column(Float)

    # DRE (Demonstração de Resultado do Exercício)
    receita_bruta = Column(Float)
    deducoes_receita = Column(Float)
    custos_vendas = Column(Float)
    despesas_operacionais = Column(Float)
    despesas_financeiras = Column(Float)
    receitas_financeiras = Column(Float)

    # Balanço Patrimonial
    ativo_total = Column(Float)
    ativo_circulante = Column(Float)
    ativo_nao_circulante = Column(Float)
    passivo_total = Column(Float)
    passivo_circulante = Column(Float)
    passivo_nao_circulante = Column(Float)

    # Fluxo de Caixa
    fluxo_caixa_operacional = Column(Float)
    fluxo_caixa_investimento = Column(Float)
    fluxo_caixa_financiamento = Column(Float)
    fluxo_caixa_livre = Column(Float)

    # Metadados de coleta
    data_source = Column(String(100))  # Fonte dos dados
    collected_at = Column(DateTime(timezone=True), server_default=func.now())
    data_quality_score = Column(Float)  # Score de qualidade (0-1)
    is_validated = Column(String, default=False)  # Se foi validado com outras fontes

    # Relacionamentos
    asset = relationship("Asset", back_populates="fundamental_data")

    def __repr__(self):
        return f"<FundamentalData(asset_id={self.asset_id}, date={self.reference_date})>"
