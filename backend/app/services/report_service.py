"""
Serviço de Geração de Relatórios
Gera relatórios completos usando IA e análise de dados
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from loguru import logger
from .ai_service import AIService
from .analysis_service import AnalysisService


class ReportService:
    """
    Serviço para geração de relatórios de investimento
    """

    def __init__(self):
        """Inicializa o serviço de relatórios"""
        self.ai_service = AIService()
        self.analysis_service = AnalysisService()

    def generate_complete_report(
        self,
        asset_data: Dict[str, Any],
        ai_provider: str = "openai"
    ) -> Dict[str, Any]:
        """
        Gera relatório completo de um ativo

        Args:
            asset_data: Dados consolidados do ativo
            ai_provider: Provedor de IA para análise textual

        Returns:
            Relatório completo
        """
        ticker = asset_data.get("ticker", "unknown")
        logger.info(f"Gerando relatório completo para {ticker} com {ai_provider}")

        # Análise quantitativa
        quantitative_analysis = self.analysis_service.analyze_asset(asset_data)

        # Análise qualitativa com IA
        ai_analysis = self.ai_service.generate_analysis_with_openai(asset_data) if ai_provider == "openai" else \
                      self.ai_service.generate_analysis_with_claude(asset_data) if ai_provider == "anthropic" else \
                      self.ai_service.generate_analysis_with_gemini(asset_data)

        # Monta relatório
        report = {
            "ticker": ticker,
            "generated_at": datetime.utcnow().isoformat(),
            "report_type": "complete",
            "ai_provider": ai_provider,

            # Seção 1: Visão Geral
            "overview": self._generate_overview(asset_data, quantitative_analysis),

            # Seção 2: Análise Quantitativa
            "quantitative_analysis": quantitative_analysis,

            # Seção 3: Análise Qualitativa (IA)
            "qualitative_analysis": ai_analysis,

            # Seção 4: Dados Brutos (Fundamentalista, Técnico, Notícias)
            "fundamental_data": asset_data.get("fundamental", {}),
            "technical_data": asset_data.get("technical", {}),
            "news_summary": self._summarize_news(asset_data.get("news", {})),

            # Seção 5: Recomendação Final
            "final_recommendation": self._generate_final_recommendation(quantitative_analysis, ai_analysis),

            # Seção 6: Disclaimers
            "disclaimers": self._get_disclaimers(),
        }

        return report

    def generate_comparison_report(
        self,
        assets_data: List[Dict[str, Any]],
        ai_provider: str = "openai"
    ) -> Dict[str, Any]:
        """
        Gera relatório comparativo de múltiplos ativos

        Args:
            assets_data: Lista de dados de ativos
            ai_provider: Provedor de IA

        Returns:
            Relatório comparativo
        """
        tickers = [asset.get("ticker", "unknown") for asset in assets_data]
        logger.info(f"Gerando relatório comparativo para {len(tickers)} ativos: {', '.join(tickers)}")

        # Análise comparativa
        comparison = self.analysis_service.compare_assets(assets_data)

        # Monta relatório
        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "report_type": "comparison",
            "total_assets": len(assets_data),
            "tickers": tickers,

            # Seção 1: Comparação Quantitativa
            "comparison": comparison,

            # Seção 2: Rankings
            "rankings": comparison.get("rankings", {}),

            # Seção 3: Melhores Oportunidades
            "best_opportunities": comparison.get("best_opportunities", []),

            # Seção 4: Tabela Comparativa
            "comparison_table": self._generate_comparison_table(comparison.get("assets", [])),

            # Seção 5: Análise Qualitativa com IA (opcional)
            "ai_insights": self._generate_ai_comparison_insights(assets_data, comparison, ai_provider),

            # Seção 6: Disclaimers
            "disclaimers": self._get_disclaimers(),
        }

        return report

    def generate_portfolio_report(
        self,
        portfolio_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Gera relatório de portfólio

        Args:
            portfolio_data: Dados do portfólio

        Returns:
            Relatório de portfólio
        """
        logger.info(f"Gerando relatório de portfólio")

        # TODO: Implementar análise de portfólio completa
        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "report_type": "portfolio",
            "portfolio_summary": portfolio_data,
            "performance": {},
            "allocation": {},
            "recommendations": [],
            "disclaimers": self._get_disclaimers(),
        }

        return report

    def generate_market_overview_report(
        self,
        macro_data: Dict[str, Any],
        top_assets: List[Dict[str, Any]],
        ai_provider: str = "openai"
    ) -> Dict[str, Any]:
        """
        Gera relatório de visão geral do mercado

        Args:
            macro_data: Dados macroeconômicos
            top_assets: Principais ativos do mercado
            ai_provider: Provedor de IA

        Returns:
            Relatório de mercado
        """
        logger.info(f"Gerando relatório de visão geral do mercado")

        # Análise com IA sobre cenário macroeconômico
        macro_prompt = f"""
        Analise o seguinte cenário macroeconômico e forneça insights sobre o mercado brasileiro:

        Calendário Econômico:
        {str(macro_data.get('economic_calendar', [])[:10])}

        Por favor, forneça:
        1. Análise do cenário macroeconômico atual
        2. Principais riscos e oportunidades
        3. Setores favorecidos e desfavorecidos
        4. Recomendações estratégicas para investidores
        """

        ai_macro_analysis = {}
        if ai_provider == "openai" and self.ai_service.openai_enabled:
            ai_macro_analysis = self.ai_service.generate_analysis_with_openai(
                {"ticker": "MARKET", "fundamental": macro_data},
                prompt_template=macro_prompt
            )

        report = {
            "generated_at": datetime.utcnow().isoformat(),
            "report_type": "market_overview",

            # Seção 1: Cenário Macroeconômico
            "macroeconomic_scenario": {
                "economic_calendar": macro_data.get('economic_calendar', [])[:20],
                "ai_analysis": ai_macro_analysis,
            },

            # Seção 2: Principais Ativos
            "top_performers": top_assets[:10],

            # Seção 3: Setores em Destaque
            "sectors": self._analyze_sectors(top_assets),

            # Seção 4: Disclaimers
            "disclaimers": self._get_disclaimers(),
        }

        return report

    def _generate_overview(
        self,
        asset_data: Dict[str, Any],
        analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Gera visão geral do ativo

        Args:
            asset_data: Dados do ativo
            analysis: Análise quantitativa

        Returns:
            Visão geral
        """
        fundamental = asset_data.get("fundamental", {})

        return {
            "ticker": asset_data.get("ticker"),
            "company_name": fundamental.get("name", ""),
            "sector": fundamental.get("sector", ""),
            "current_price": fundamental.get("price", 0),
            "market_cap": fundamental.get("market_cap", 0),
            "overall_score": analysis.get("overall_score", 0),
            "recommendation": analysis.get("recommendation", ""),
            "valuation": analysis.get("valuation_analysis", {}).get("overall_valuation", ""),
        }

    def _summarize_news(self, news_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Resume notícias usando IA

        Args:
            news_data: Dados de notícias

        Returns:
            Resumo de notícias
        """
        if not news_data or not news_data.get("recent_news"):
            return {"summary": "Nenhuma notícia recente disponível"}

        news_texts = [news.get("title", "") for news in news_data.get("recent_news", [])[:10]]

        return {
            "total_news": news_data.get("total_news", 0),
            "sources": list(news_data.get("by_source", {}).keys()),
            "recent_headlines": news_texts,
        }

    def _generate_final_recommendation(
        self,
        quantitative: Dict[str, Any],
        qualitative: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Gera recomendação final combinando análises

        Args:
            quantitative: Análise quantitativa
            qualitative: Análise qualitativa (IA)

        Returns:
            Recomendação final
        """
        return {
            "quantitative_recommendation": quantitative.get("recommendation", ""),
            "quantitative_score": quantitative.get("overall_score", 0),
            "qualitative_analysis": qualitative.get("analysis", ""),
            "combined_recommendation": quantitative.get("recommendation", ""),  # Por padrão usa quantitativa
            "confidence": self._calculate_recommendation_confidence(quantitative, qualitative),
        }

    def _calculate_recommendation_confidence(
        self,
        quantitative: Dict[str, Any],
        qualitative: Dict[str, Any]
    ) -> str:
        """
        Calcula confiança da recomendação

        Args:
            quantitative: Análise quantitativa
            qualitative: Análise qualitativa

        Returns:
            Nível de confiança (high, medium, low)
        """
        score = quantitative.get("overall_score", 0)
        data_quality = quantitative.get("fundamental_analysis", {}).get("overall_score", 0)

        if score >= 7 and data_quality >= 7:
            return "high"
        elif score >= 5:
            return "medium"
        else:
            return "low"

    def _generate_comparison_table(self, assets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Gera tabela comparativa

        Args:
            assets: Lista de assets analisados

        Returns:
            Tabela comparativa
        """
        table = []

        for asset in assets:
            table.append({
                "ticker": asset.get("ticker"),
                "overall_score": asset.get("overall_score", 0),
                "fundamental_score": asset.get("fundamental_analysis", {}).get("overall_score", 0),
                "technical_score": asset.get("technical_analysis", {}).get("overall_score", 0),
                "valuation": asset.get("valuation_analysis", {}).get("overall_valuation", ""),
                "risk": asset.get("risk_analysis", {}).get("overall_risk", ""),
                "recommendation": asset.get("recommendation", ""),
            })

        return table

    def _generate_ai_comparison_insights(
        self,
        assets_data: List[Dict[str, Any]],
        comparison: Dict[str, Any],
        ai_provider: str
    ) -> Dict[str, Any]:
        """
        Gera insights comparativos usando IA

        Args:
            assets_data: Dados dos ativos
            comparison: Comparação quantitativa
            ai_provider: Provedor de IA

        Returns:
            Insights da IA
        """
        if not self.ai_service.openai_enabled and ai_provider == "openai":
            return {"error": "OpenAI não configurado"}

        tickers = [asset.get("ticker") for asset in assets_data]

        prompt = f"""
        Compare os seguintes ativos e forneça insights sobre qual seria a melhor opção de investimento:

        Ativos: {', '.join(tickers)}

        Rankings:
        {str(comparison.get('rankings', {}))}

        Oportunidades identificadas:
        {str(comparison.get('best_opportunities', []))}

        Por favor, forneça:
        1. Comparação dos fundamentos de cada ativo
        2. Qual ativo oferece melhor relação risco/retorno
        3. Sugestão de alocação percentual entre os ativos
        4. Justificativa para suas recomendações
        """

        if ai_provider == "openai":
            return self.ai_service.summarize_text(prompt, provider="openai")

        return {}

    def _analyze_sectors(self, assets: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """
        Analisa setores dos ativos

        Args:
            assets: Lista de assets

        Returns:
            Análise por setor
        """
        sectors = {}

        for asset in assets:
            sector = asset.get("sector", "Outros")
            ticker = asset.get("ticker", "")

            if sector not in sectors:
                sectors[sector] = []

            sectors[sector].append(ticker)

        return sectors

    def _get_disclaimers(self) -> List[str]:
        """
        Retorna disclaimers padrão

        Returns:
            Lista de disclaimers
        """
        return [
            "Este relatório é gerado automaticamente e não constitui recomendação de investimento.",
            "Os dados são coletados de fontes públicas e podem conter imprecisões.",
            "Investimentos em ações envolvem riscos. Rentabilidade passada não garante resultados futuros.",
            "Consulte um profissional certificado antes de tomar decisões de investimento.",
            "A análise com IA é baseada em modelos de linguagem e pode conter vieses ou erros.",
        ]

    def export_report_to_markdown(self, report: Dict[str, Any]) -> str:
        """
        Exporta relatório para formato Markdown

        Args:
            report: Relatório gerado

        Returns:
            Relatório em Markdown
        """
        report_type = report.get("report_type", "unknown")

        if report_type == "complete":
            return self._export_complete_report_md(report)
        elif report_type == "comparison":
            return self._export_comparison_report_md(report)
        elif report_type == "portfolio":
            return self._export_portfolio_report_md(report)
        elif report_type == "market_overview":
            return self._export_market_overview_md(report)

        return "# Relatório\n\nFormato não suportado"

    def _export_complete_report_md(self, report: Dict[str, Any]) -> str:
        """Exporta relatório completo para Markdown"""
        ticker = report.get("ticker", "")
        overview = report.get("overview", {})
        quant = report.get("quantitative_analysis", {})
        qual = report.get("qualitative_analysis", {})
        final_rec = report.get("final_recommendation", {})

        md = f"""# Relatório de Análise - {ticker}

**Gerado em**: {report.get('generated_at')}

## 1. Visão Geral

- **Empresa**: {overview.get('company_name')}
- **Setor**: {overview.get('sector')}
- **Preço Atual**: R$ {overview.get('current_price', 0):.2f}
- **Valor de Mercado**: R$ {overview.get('market_cap', 0):,.0f}
- **Score Geral**: {overview.get('overall_score', 0):.1f}/10
- **Valuation**: {overview.get('valuation', '')}
- **Recomendação**: {overview.get('recommendation', '').upper()}

## 2. Análise Quantitativa

### Fundamentos
- **Score**: {quant.get('fundamental_analysis', {}).get('overall_score', 0):.1f}/10
- **Rentabilidade**: {quant.get('fundamental_analysis', {}).get('profitability', 0):.1f}/10
- **Crescimento**: {quant.get('fundamental_analysis', {}).get('growth', 0):.1f}/10
- **Endividamento**: {quant.get('fundamental_analysis', {}).get('debt', 0):.1f}/10

### Valuation
- **Score**: {quant.get('valuation_analysis', {}).get('score', 0):.1f}/10
- **Classificação**: {quant.get('valuation_analysis', {}).get('overall_valuation', '')}

### Risco
- **Score**: {quant.get('risk_analysis', {}).get('score', 0):.1f}/10
- **Nível de Risco**: {quant.get('risk_analysis', {}).get('overall_risk', '')}

## 3. Análise Qualitativa (IA)

{qual.get('analysis', 'Não disponível')}

## 4. Recomendação Final

- **Recomendação**: {final_rec.get('combined_recommendation', '').upper()}
- **Confiança**: {final_rec.get('confidence', '').upper()}

## 5. Disclaimers

{''.join([f'- {d}' + chr(10) for d in report.get('disclaimers', [])])}
"""

        return md

    def _export_comparison_report_md(self, report: Dict[str, Any]) -> str:
        """Exporta relatório comparativo para Markdown"""
        # TODO: Implementar export de comparação
        return "# Relatório Comparativo\n\n(Em desenvolvimento)"

    def _export_portfolio_report_md(self, report: Dict[str, Any]) -> str:
        """Exporta relatório de portfólio para Markdown"""
        # TODO: Implementar export de portfólio
        return "# Relatório de Portfólio\n\n(Em desenvolvimento)"

    def _export_market_overview_md(self, report: Dict[str, Any]) -> str:
        """Exporta relatório de mercado para Markdown"""
        # TODO: Implementar export de mercado
        return "# Visão Geral do Mercado\n\n(Em desenvolvimento)"
