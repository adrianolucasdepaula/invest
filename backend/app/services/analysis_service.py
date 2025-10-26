"""
Serviço de Análise de Ativos
Realiza análises comparativas, cálculo de rankings e identificação de oportunidades
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from loguru import logger


class AnalysisService:
    """
    Serviço para análise de ativos e identificação de oportunidades
    """

    def __init__(self):
        """Inicializa o serviço de análise"""
        pass

    def analyze_asset(self, asset_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Realiza análise completa de um ativo

        Args:
            asset_data: Dados consolidados do ativo

        Returns:
            Análise completa do ativo
        """
        logger.info(f"Analisando ativo: {asset_data.get('ticker')}")

        analysis = {
            "ticker": asset_data.get("ticker"),
            "analyzed_at": datetime.utcnow().isoformat(),
            "fundamental_analysis": self._analyze_fundamentals(asset_data.get("fundamental", {})),
            "technical_analysis": self._analyze_technical(asset_data.get("technical", {})),
            "valuation_analysis": self._analyze_valuation(asset_data.get("fundamental", {})),
            "risk_analysis": self._analyze_risk(asset_data),
            "sentiment_analysis": self._analyze_sentiment(asset_data.get("news", {})),
            "overall_score": 0,  # Será calculado
            "recommendation": "",  # Será calculado
        }

        # Calcula score geral
        analysis["overall_score"] = self._calculate_overall_score(analysis)
        analysis["recommendation"] = self._generate_recommendation(analysis)

        return analysis

    def compare_assets(self, assets_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Compara múltiplos ativos

        Args:
            assets_data: Lista de dados de ativos

        Returns:
            Comparação detalhada
        """
        logger.info(f"Comparando {len(assets_data)} ativos")

        # Analisa cada ativo
        analyzed_assets = [self.analyze_asset(asset) for asset in assets_data]

        # Cria comparação
        comparison = {
            "compared_at": datetime.utcnow().isoformat(),
            "total_assets": len(assets_data),
            "assets": analyzed_assets,
            "rankings": self._generate_rankings(analyzed_assets),
            "best_opportunities": self._identify_opportunities(analyzed_assets),
        }

        return comparison

    def _analyze_fundamentals(self, fundamental_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analisa indicadores fundamentalistas

        Args:
            fundamental_data: Dados fundamentalistas

        Returns:
            Análise fundamentalista
        """
        if not fundamental_data:
            return {"score": 0, "status": "insufficient_data"}

        analysis = {
            "profitability": self._score_profitability(fundamental_data),
            "growth": self._score_growth(fundamental_data),
            "debt": self._score_debt(fundamental_data),
            "efficiency": self._score_efficiency(fundamental_data),
            "overall_score": 0,
        }

        # Calcula score geral ponderado
        scores = [v for v in analysis.values() if isinstance(v, (int, float))]
        analysis["overall_score"] = sum(scores) / len(scores) if scores else 0

        return analysis

    def _analyze_technical(self, technical_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analisa indicadores técnicos

        Args:
            technical_data: Dados técnicos

        Returns:
            Análise técnica
        """
        if not technical_data:
            return {"score": 0, "status": "insufficient_data"}

        analysis = {
            "trend": self._identify_trend(technical_data),
            "momentum": self._score_momentum(technical_data),
            "support_resistance": self._analyze_support_resistance(technical_data),
            "volume_analysis": self._analyze_volume(technical_data),
            "overall_score": 0,
        }

        # Calcula score técnico
        scores = [
            analysis["momentum"],
        ]
        analysis["overall_score"] = sum(s for s in scores if s) / len(scores) if scores else 0

        return analysis

    def _analyze_valuation(self, fundamental_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analisa valuation do ativo

        Args:
            fundamental_data: Dados fundamentalistas

        Returns:
            Análise de valuation
        """
        if not fundamental_data:
            return {"score": 0, "status": "insufficient_data"}

        analysis = {
            "p_l_score": self._score_p_l(fundamental_data.get("p_l")),
            "p_vp_score": self._score_p_vp(fundamental_data.get("p_vp")),
            "dividend_yield_score": self._score_dividend_yield(fundamental_data.get("dividend_yield")),
            "overall_valuation": "",
            "score": 0,
        }

        # Determina valuation geral
        scores = [v for v in analysis.values() if isinstance(v, (int, float))]
        avg_score = sum(scores) / len(scores) if scores else 0
        analysis["score"] = avg_score

        if avg_score >= 7:
            analysis["overall_valuation"] = "undervalued"
        elif avg_score >= 5:
            analysis["overall_valuation"] = "fair"
        else:
            analysis["overall_valuation"] = "overvalued"

        return analysis

    def _analyze_risk(self, asset_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analisa riscos do ativo

        Args:
            asset_data: Dados completos do ativo

        Returns:
            Análise de riscos
        """
        fundamental = asset_data.get("fundamental", {})
        technical = asset_data.get("technical", {})

        risk_analysis = {
            "debt_risk": self._assess_debt_risk(fundamental),
            "volatility_risk": self._assess_volatility_risk(technical),
            "liquidity_risk": self._assess_liquidity_risk(technical),
            "overall_risk": "",
            "score": 0,  # Score alto = baixo risco
        }

        # Calcula score de risco (média invertida - alto score = baixo risco)
        risk_scores = [v for v in risk_analysis.values() if isinstance(v, (int, float))]
        avg_risk = sum(risk_scores) / len(risk_scores) if risk_scores else 5

        if avg_risk >= 7:
            risk_analysis["overall_risk"] = "low"
        elif avg_risk >= 4:
            risk_analysis["overall_risk"] = "medium"
        else:
            risk_analysis["overall_risk"] = "high"

        risk_analysis["score"] = avg_risk
        return risk_analysis

    def _analyze_sentiment(self, news_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analisa sentimento das notícias

        Args:
            news_data: Dados de notícias

        Returns:
            Análise de sentimento
        """
        if not news_data or not news_data.get("recent_news"):
            return {"sentiment": "neutral", "score": 5, "news_count": 0}

        # TODO: Implementar análise de sentimento com NLP
        # Por enquanto retorna neutro
        return {
            "sentiment": "neutral",
            "score": 5,
            "news_count": news_data.get("total_news", 0),
            "positive_count": 0,
            "negative_count": 0,
            "neutral_count": news_data.get("total_news", 0),
        }

    def _score_profitability(self, data: Dict[str, Any]) -> float:
        """Pontua rentabilidade (0-10)"""
        score = 5.0
        roe = data.get("roe")
        roa = data.get("roa")
        margem_liquida = data.get("margem_liquida")

        if roe and roe > 15:
            score += 2
        if roa and roa > 10:
            score += 1
        if margem_liquida and margem_liquida > 10:
            score += 2

        return min(score, 10)

    def _score_growth(self, data: Dict[str, Any]) -> float:
        """Pontua crescimento (0-10)"""
        score = 5.0
        cagr_receitas = data.get("cagr_receitas_5_anos")
        cagr_lucros = data.get("cagr_lucros_5_anos")

        if cagr_receitas and cagr_receitas > 10:
            score += 2.5
        if cagr_lucros and cagr_lucros > 10:
            score += 2.5

        return min(score, 10)

    def _score_debt(self, data: Dict[str, Any]) -> float:
        """Pontua endividamento (0-10, alto = pouco endividado)"""
        score = 5.0
        divida_pl = data.get("divida_liquida_patrimonio")
        divida_ebitda = data.get("divida_liquida_ebitda")

        if divida_pl is not None:
            if divida_pl < 0.5:
                score += 2.5
            elif divida_pl > 2:
                score -= 2.5

        if divida_ebitda is not None:
            if divida_ebitda < 2:
                score += 2.5
            elif divida_ebitda > 4:
                score -= 2.5

        return max(min(score, 10), 0)

    def _score_efficiency(self, data: Dict[str, Any]) -> float:
        """Pontua eficiência (0-10)"""
        score = 5.0
        giro_ativos = data.get("giro_ativos")

        if giro_ativos and giro_ativos > 1:
            score += 3

        return min(score, 10)

    def _identify_trend(self, technical_data: Dict[str, Any]) -> str:
        """Identifica tendência (uptrend, downtrend, sideways)"""
        # TODO: Implementar análise de tendência com médias móveis
        return "neutral"

    def _score_momentum(self, technical_data: Dict[str, Any]) -> float:
        """Pontua momentum (0-10)"""
        indicators = technical_data.get("indicators", {})
        score = 5.0

        # RSI
        rsi = indicators.get("rsi_14", {})
        if isinstance(rsi, dict):
            # Pega RSI de qualquer fonte
            for source_rsi in rsi.values():
                if isinstance(source_rsi, (int, float)):
                    if 30 < source_rsi < 70:
                        score += 2
                    break

        return min(score, 10)

    def _analyze_support_resistance(self, technical_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analisa suporte e resistência"""
        return {
            "supports": [],
            "resistances": [],
            "current_level": "neutral",
        }

    def _analyze_volume(self, technical_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analisa volume"""
        return {
            "trend": "neutral",
            "average_volume": 0,
        }

    def _score_p_l(self, p_l: Optional[float]) -> float:
        """Pontua P/L (0-10, baixo P/L = alto score)"""
        if not p_l or p_l <= 0:
            return 0

        if p_l < 10:
            return 10
        elif p_l < 15:
            return 7
        elif p_l < 20:
            return 5
        else:
            return 2

    def _score_p_vp(self, p_vp: Optional[float]) -> float:
        """Pontua P/VP (0-10, baixo P/VP = alto score)"""
        if not p_vp or p_vp <= 0:
            return 0

        if p_vp < 1:
            return 10
        elif p_vp < 2:
            return 7
        elif p_vp < 3:
            return 5
        else:
            return 2

    def _score_dividend_yield(self, dy: Optional[float]) -> float:
        """Pontua Dividend Yield (0-10, alto DY = alto score)"""
        if not dy or dy <= 0:
            return 0

        if dy > 8:
            return 10
        elif dy > 6:
            return 8
        elif dy > 4:
            return 6
        else:
            return 3

    def _assess_debt_risk(self, data: Dict[str, Any]) -> float:
        """Avalia risco de endividamento (0-10, alto = baixo risco)"""
        return self._score_debt(data)  # Usa mesma lógica

    def _assess_volatility_risk(self, technical_data: Dict[str, Any]) -> float:
        """Avalia risco de volatilidade (0-10, alto = baixa volatilidade)"""
        # TODO: Implementar análise de volatilidade
        return 5.0

    def _assess_liquidity_risk(self, technical_data: Dict[str, Any]) -> float:
        """Avalia risco de liquidez (0-10, alto = alta liquidez)"""
        # TODO: Implementar análise de liquidez baseada em volume
        return 5.0

    def _calculate_overall_score(self, analysis: Dict[str, Any]) -> float:
        """
        Calcula score geral do ativo (0-10)

        Args:
            analysis: Análise completa

        Returns:
            Score geral
        """
        weights = {
            "fundamental_analysis": 0.35,
            "technical_analysis": 0.25,
            "valuation_analysis": 0.25,
            "risk_analysis": 0.10,
            "sentiment_analysis": 0.05,
        }

        total_score = 0
        total_weight = 0

        for key, weight in weights.items():
            if key in analysis and isinstance(analysis[key], dict):
                score = analysis[key].get("overall_score") or analysis[key].get("score", 0)
                if score:
                    total_score += score * weight
                    total_weight += weight

        return (total_score / total_weight) if total_weight > 0 else 0

    def _generate_recommendation(self, analysis: Dict[str, Any]) -> str:
        """
        Gera recomendação baseada na análise

        Args:
            analysis: Análise completa

        Returns:
            Recomendação (strong_buy, buy, hold, sell, strong_sell)
        """
        score = analysis.get("overall_score", 0)

        if score >= 8:
            return "strong_buy"
        elif score >= 6.5:
            return "buy"
        elif score >= 4:
            return "hold"
        elif score >= 2:
            return "sell"
        else:
            return "strong_sell"

    def _generate_rankings(self, analyzed_assets: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Gera rankings de ativos

        Args:
            analyzed_assets: Lista de ativos analisados

        Returns:
            Rankings por categoria
        """
        # Ordena por score geral
        by_overall = sorted(analyzed_assets, key=lambda x: x.get("overall_score", 0), reverse=True)

        # Ordena por fundamentals
        by_fundamentals = sorted(
            analyzed_assets,
            key=lambda x: x.get("fundamental_analysis", {}).get("overall_score", 0),
            reverse=True
        )

        # Ordena por valuation
        by_valuation = sorted(
            analyzed_assets,
            key=lambda x: x.get("valuation_analysis", {}).get("score", 0),
            reverse=True
        )

        return {
            "by_overall_score": [{"ticker": a.get("ticker"), "score": a.get("overall_score")} for a in by_overall],
            "by_fundamentals": [{"ticker": a.get("ticker"), "score": a.get("fundamental_analysis", {}).get("overall_score", 0)} for a in by_fundamentals],
            "by_valuation": [{"ticker": a.get("ticker"), "score": a.get("valuation_analysis", {}).get("score", 0)} for a in by_valuation],
        }

    def _identify_opportunities(self, analyzed_assets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identifica oportunidades de investimento

        Args:
            analyzed_assets: Lista de ativos analisados

        Returns:
            Lista de oportunidades
        """
        opportunities = []

        for asset in analyzed_assets:
            score = asset.get("overall_score", 0)
            recommendation = asset.get("recommendation", "")

            if recommendation in ["strong_buy", "buy"] and score >= 6.5:
                opportunities.append({
                    "ticker": asset.get("ticker"),
                    "score": score,
                    "recommendation": recommendation,
                    "valuation": asset.get("valuation_analysis", {}).get("overall_valuation"),
                    "reasons": self._generate_opportunity_reasons(asset),
                })

        # Ordena por score
        opportunities.sort(key=lambda x: x["score"], reverse=True)

        return opportunities[:10]  # Top 10 oportunidades

    def _generate_opportunity_reasons(self, asset: Dict[str, Any]) -> List[str]:
        """
        Gera razões para a oportunidade

        Args:
            asset: Ativo analisado

        Returns:
            Lista de razões
        """
        reasons = []

        # Valuation
        valuation = asset.get("valuation_analysis", {}).get("overall_valuation")
        if valuation == "undervalued":
            reasons.append("Ativo subvalorizado")

        # Fundamentals
        fundamental_score = asset.get("fundamental_analysis", {}).get("overall_score", 0)
        if fundamental_score >= 7:
            reasons.append("Fundamentos sólidos")

        # Rentabilidade
        profitability = asset.get("fundamental_analysis", {}).get("profitability", 0)
        if profitability >= 7:
            reasons.append("Alta rentabilidade")

        # Crescimento
        growth = asset.get("fundamental_analysis", {}).get("growth", 0)
        if growth >= 7:
            reasons.append("Bom crescimento")

        # Baixo risco
        risk_score = asset.get("risk_analysis", {}).get("score", 0)
        if risk_score >= 7:
            reasons.append("Baixo risco")

        return reasons if reasons else ["Score geral alto"]
