"""
AI Analyzer - Comprehensive AI-powered stock analysis system
Queries multiple AI models (ChatGPT, Gemini, Claude, DeepSeek, Grok)
Consolidates responses and generates consensus analysis with confidence scores
"""
import sys
from pathlib import Path
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import re
from collections import Counter
from loguru import logger

# Add python-scrapers to path
sys.path.insert(0, str(Path(__file__).parent.parent / "python-scrapers"))

from scrapers.chatgpt_scraper import ChatGPTScraper
from scrapers.gemini_scraper import GeminiScraper
from scrapers.claude_scraper import ClaudeScraper
from scrapers.deepseek_scraper import DeepSeekScraper
from scrapers.grok_scraper import GrokScraper

from sentiment_analyzer import sentiment_analyzer


class AIAnalysisCache:
    """Simple in-memory cache for AI analysis results (6 hour TTL)"""

    def __init__(self, ttl_hours: int = 6):
        self.cache: Dict[str, Dict] = {}
        self.ttl = timedelta(hours=ttl_hours)

    def get(self, ticker: str) -> Optional[Dict]:
        """Get cached analysis for ticker"""
        if ticker in self.cache:
            entry = self.cache[ticker]
            if datetime.now() - entry["timestamp"] < self.ttl:
                logger.info(f"Cache HIT for {ticker}")
                return entry["data"]
            else:
                # Expired
                logger.info(f"Cache EXPIRED for {ticker}")
                del self.cache[ticker]
        return None

    def set(self, ticker: str, data: Dict):
        """Cache analysis for ticker"""
        self.cache[ticker] = {
            "data": data,
            "timestamp": datetime.now()
        }
        logger.info(f"Cached analysis for {ticker}")

    def clear(self, ticker: Optional[str] = None):
        """Clear cache for specific ticker or all"""
        if ticker:
            if ticker in self.cache:
                del self.cache[ticker]
        else:
            self.cache.clear()

    def stats(self) -> Dict:
        """Get cache statistics"""
        total = len(self.cache)
        valid = sum(
            1 for entry in self.cache.values()
            if datetime.now() - entry["timestamp"] < self.ttl
        )
        return {
            "total_entries": total,
            "valid_entries": valid,
            "expired_entries": total - valid,
            "ttl_hours": self.ttl.total_seconds() / 3600
        }


class AIAnalyzer:
    """
    Comprehensive AI-powered stock analysis system
    Queries multiple AI models and consolidates their responses
    """

    def __init__(self):
        """Initialize AI Analyzer with all AI scrapers"""
        self.scrapers = {
            "chatgpt": ChatGPTScraper(),
            "gemini": GeminiScraper(),
            "claude": ClaudeScraper(),
            "deepseek": DeepSeekScraper(),
            "grok": GrokScraper(),
        }
        self.cache = AIAnalysisCache(ttl_hours=6)
        self.sentiment_analyzer = sentiment_analyzer

    async def analyze_stock(
        self,
        ticker: str,
        context: Dict,
        use_cache: bool = True,
        ai_models: Optional[List[str]] = None
    ) -> Dict:
        """
        Complete AI analysis of a stock

        Args:
            ticker: Stock ticker (e.g., 'PETR4')
            context: Context data (fundamentals, news, insider activity, etc.)
            use_cache: Whether to use cached results (default: True)
            ai_models: List of AI models to query (default: all)

        Returns:
            Consolidated AI analysis with consensus
        """
        logger.info(f"Starting AI analysis for {ticker}")

        # Check cache
        if use_cache:
            cached = self.cache.get(ticker)
            if cached:
                return cached

        # Create analysis prompt
        prompt = self.create_analysis_prompt(ticker, context)

        # Determine which AI models to use
        if ai_models is None:
            ai_models = list(self.scrapers.keys())
        else:
            ai_models = [m for m in ai_models if m in self.scrapers]

        # Query all AI models in parallel
        logger.info(f"Querying {len(ai_models)} AI models: {ai_models}")
        tasks = []
        for model_name in ai_models:
            if model_name == "chatgpt":
                tasks.append(self.get_chatgpt_analysis(prompt))
            elif model_name == "gemini":
                tasks.append(self.get_gemini_analysis(prompt))
            elif model_name == "claude":
                tasks.append(self.get_claude_analysis(prompt))
            elif model_name == "deepseek":
                tasks.append(self.get_deepseek_analysis(prompt))
            elif model_name == "grok":
                tasks.append(self.get_grok_analysis(prompt))

        # Execute in parallel
        start_time = datetime.now()
        analyses = await asyncio.gather(*tasks, return_exceptions=True)
        execution_time = (datetime.now() - start_time).total_seconds()

        # Filter out failed analyses
        valid_analyses = []
        failed_models = []
        for i, result in enumerate(analyses):
            if isinstance(result, Exception):
                logger.error(f"AI model {ai_models[i]} failed: {result}")
                failed_models.append(ai_models[i])
            elif result and result.get("success"):
                valid_analyses.append(result)
            else:
                failed_models.append(ai_models[i])

        logger.info(f"Received {len(valid_analyses)}/{len(ai_models)} successful AI responses")

        # Consolidate analyses
        if not valid_analyses:
            return {
                "success": False,
                "error": "All AI models failed to provide analysis",
                "ticker": ticker,
                "failed_models": failed_models,
                "timestamp": datetime.now().isoformat()
            }

        consolidated = self.consolidate_analyses(valid_analyses)

        # Add metadata
        result = {
            "success": True,
            "ticker": ticker,
            "timestamp": datetime.now().isoformat(),
            "execution_time_seconds": round(execution_time, 2),
            "models_queried": len(ai_models),
            "models_succeeded": len(valid_analyses),
            "models_failed": len(failed_models),
            "failed_models": failed_models,
            "prompt": prompt[:500] + "..." if len(prompt) > 500 else prompt,
            **consolidated
        }

        # Cache result
        if use_cache:
            self.cache.set(ticker, result)

        return result

    def create_analysis_prompt(self, ticker: str, context: Dict) -> str:
        """
        Build contextualized prompt for AI analysis

        Args:
            ticker: Stock ticker
            context: Context data with fundamentals, news, etc.

        Returns:
            Structured prompt for AI models
        """
        # Extract context data
        company_name = context.get("company_name", ticker)
        fundamentals = context.get("fundamentals", {})
        news = context.get("news", [])
        insider_activity = context.get("insider_activity", [])
        sector = context.get("sector", "N/A")
        market_context = context.get("market_context", {})

        # Build structured prompt
        prompt = f"""Análise Completa de Ações: {ticker} - {company_name}

Por favor, analise esta ação brasileira (B3) considerando os seguintes dados:

📊 DADOS FUNDAMENTALISTAS:
"""

        # Add fundamental metrics
        if fundamentals:
            if "p_l" in fundamentals:
                prompt += f"- P/L (Preço/Lucro): {fundamentals['p_l']}\n"
            if "roe" in fundamentals or "ROE" in fundamentals:
                roe = fundamentals.get("roe") or fundamentals.get("ROE")
                prompt += f"- ROE (Return on Equity): {roe}%\n"
            if "dividend_yield" in fundamentals:
                prompt += f"- Dividend Yield: {fundamentals['dividend_yield']}%\n"
            if "price" in fundamentals:
                prompt += f"- Preço Atual: R$ {fundamentals['price']}\n"
            if "market_cap" in fundamentals:
                prompt += f"- Market Cap: R$ {fundamentals['market_cap']}\n"
            if "debt_equity" in fundamentals:
                prompt += f"- Dívida/Patrimônio: {fundamentals['debt_equity']}\n"

        prompt += f"\n🏢 SETOR: {sector}\n"

        # Add news headlines
        if news and len(news) > 0:
            prompt += "\n📰 NOTÍCIAS RECENTES:\n"
            for i, article in enumerate(news[:5], 1):  # Top 5 news
                title = article.get("title", "")
                date = article.get("date", "")
                prompt += f"{i}. [{date}] {title}\n"

        # Add insider activity
        if insider_activity and len(insider_activity) > 0:
            prompt += "\n👔 MOVIMENTAÇÕES DE INSIDERS:\n"
            for i, activity in enumerate(insider_activity[:3], 1):  # Top 3
                action = activity.get("action", "")
                amount = activity.get("amount", "")
                date = activity.get("date", "")
                prompt += f"{i}. [{date}] {action}: {amount}\n"

        # Add market context
        if market_context:
            prompt += "\n📈 CONTEXTO DE MERCADO:\n"
            if "ibovespa" in market_context:
                prompt += f"- Ibovespa: {market_context['ibovespa']}\n"
            if "selic" in market_context:
                prompt += f"- Taxa Selic: {market_context['selic']}%\n"
            if "inflation" in market_context:
                prompt += f"- Inflação: {market_context['inflation']}%\n"

        # Request structured output
        prompt += """

📋 POR FAVOR, FORNEÇA UMA ANÁLISE ESTRUTURADA:

1. RESUMO (2-3 sentenças):
   - Visão geral sobre a empresa e situação atual

2. SENTIMENTO:
   - Positivo / Neutro / Negativo

3. RECOMENDAÇÃO:
   - Comprar / Manter / Vender

4. PONTOS FORTES (3 principais):
   - Liste os principais pontos positivos

5. RISCOS (3 principais):
   - Liste os principais riscos e preocupações

6. PREÇO ALVO (se aplicável):
   - Estimativa de preço justo ou alvo

Por favor, seja objetivo, baseado em dados, e forneça uma análise prática para investidores.
"""

        return prompt

    async def get_chatgpt_analysis(self, prompt: str) -> Dict:
        """
        Query ChatGPT scraper for analysis

        Args:
            prompt: Analysis prompt

        Returns:
            Analysis result from ChatGPT
        """
        try:
            logger.info("Querying ChatGPT...")
            result = await self.scrapers["chatgpt"].scrape(prompt)

            if result.success and result.data:
                response_text = result.data.get("response", "")
                return {
                    "success": True,
                    "model": "ChatGPT",
                    "response": response_text,
                    "sentiment": self.extract_sentiment(response_text),
                    "recommendation": self.extract_recommendation(response_text),
                    "metadata": result.metadata or {}
                }

            return {
                "success": False,
                "model": "ChatGPT",
                "error": result.error or "Unknown error"
            }

        except Exception as e:
            logger.error(f"ChatGPT analysis failed: {e}")
            return {
                "success": False,
                "model": "ChatGPT",
                "error": str(e)
            }

    async def get_gemini_analysis(self, prompt: str) -> Dict:
        """
        Query Gemini scraper for analysis

        Args:
            prompt: Analysis prompt

        Returns:
            Analysis result from Gemini
        """
        try:
            logger.info("Querying Gemini...")
            result = await self.scrapers["gemini"].scrape(prompt)

            if result.success and result.data:
                response_text = result.data.get("response", "")
                return {
                    "success": True,
                    "model": "Gemini",
                    "response": response_text,
                    "sentiment": self.extract_sentiment(response_text),
                    "recommendation": self.extract_recommendation(response_text),
                    "metadata": result.metadata or {}
                }

            return {
                "success": False,
                "model": "Gemini",
                "error": result.error or "Unknown error"
            }

        except Exception as e:
            logger.error(f"Gemini analysis failed: {e}")
            return {
                "success": False,
                "model": "Gemini",
                "error": str(e)
            }

    async def get_claude_analysis(self, prompt: str) -> Dict:
        """
        Query Claude scraper for analysis

        Args:
            prompt: Analysis prompt

        Returns:
            Analysis result from Claude
        """
        try:
            logger.info("Querying Claude...")
            result = await self.scrapers["claude"].scrape(prompt)

            if result.success and result.data:
                response_text = result.data.get("response", "")
                return {
                    "success": True,
                    "model": "Claude",
                    "response": response_text,
                    "sentiment": self.extract_sentiment(response_text),
                    "recommendation": self.extract_recommendation(response_text),
                    "metadata": result.metadata or {}
                }

            return {
                "success": False,
                "model": "Claude",
                "error": result.error or "Unknown error"
            }

        except Exception as e:
            logger.error(f"Claude analysis failed: {e}")
            return {
                "success": False,
                "model": "Claude",
                "error": str(e)
            }

    async def get_deepseek_analysis(self, prompt: str) -> Dict:
        """
        Query DeepSeek scraper for analysis

        Args:
            prompt: Analysis prompt

        Returns:
            Analysis result from DeepSeek
        """
        try:
            logger.info("Querying DeepSeek...")
            result = await self.scrapers["deepseek"].scrape(prompt)

            if result.success and result.data:
                response_text = result.data.get("response", "")
                return {
                    "success": True,
                    "model": "DeepSeek",
                    "response": response_text,
                    "sentiment": self.extract_sentiment(response_text),
                    "recommendation": self.extract_recommendation(response_text),
                    "metadata": result.metadata or {}
                }

            return {
                "success": False,
                "model": "DeepSeek",
                "error": result.error or "Unknown error"
            }

        except Exception as e:
            logger.error(f"DeepSeek analysis failed: {e}")
            return {
                "success": False,
                "model": "DeepSeek",
                "error": str(e)
            }

    async def get_grok_analysis(self, prompt: str) -> Dict:
        """
        Query Grok scraper for analysis

        Args:
            prompt: Analysis prompt

        Returns:
            Analysis result from Grok
        """
        try:
            logger.info("Querying Grok...")
            result = await self.scrapers["grok"].scrape(prompt)

            if result.success and result.data:
                response_text = result.data.get("response", "")
                return {
                    "success": True,
                    "model": "Grok",
                    "response": response_text,
                    "sentiment": self.extract_sentiment(response_text),
                    "recommendation": self.extract_recommendation(response_text),
                    "metadata": result.metadata or {}
                }

            return {
                "success": False,
                "model": "Grok",
                "error": result.error or "Unknown error"
            }

        except Exception as e:
            logger.error(f"Grok analysis failed: {e}")
            return {
                "success": False,
                "model": "Grok",
                "error": str(e)
            }

    def consolidate_analyses(self, analyses: List[Dict]) -> Dict:
        """
        Consolidate multiple AI analyses into single consensus

        Args:
            analyses: List of AI analysis results

        Returns:
            Consolidated analysis with consensus
        """
        if not analyses:
            return {
                "consensus": None,
                "individual_analyses": []
            }

        # Extract individual responses
        individual_analyses = []
        for analysis in analyses:
            individual_analyses.append({
                "model": analysis.get("model"),
                "sentiment": analysis.get("sentiment"),
                "recommendation": analysis.get("recommendation"),
                "response_preview": analysis.get("response", "")[:200] + "...",
            })

        # Calculate consensus
        consensus = self.calculate_consensus(analyses)

        # Extract common themes
        all_responses = [a.get("response", "") for a in analyses]
        strengths, risks = self._extract_common_themes(all_responses)

        return {
            "consensus": consensus,
            "individual_analyses": individual_analyses,
            "common_strengths": strengths[:3],  # Top 3
            "common_risks": risks[:3],  # Top 3
            "full_responses": {
                a.get("model"): a.get("response", "")
                for a in analyses
            }
        }

    def calculate_consensus(self, analyses: List[Dict]) -> Dict:
        """
        Calculate AI consensus from multiple analyses

        Args:
            analyses: List of AI analysis results

        Returns:
            Consensus with confidence scores
        """
        if not analyses:
            return {
                "sentiment": "neutral",
                "recommendation": "hold",
                "confidence": 0.0,
                "agreement_level": "none"
            }

        # Extract sentiments and recommendations
        sentiments = [a.get("sentiment", "neutral") for a in analyses]
        recommendations = [a.get("recommendation", "hold") for a in analyses]

        # Count occurrences
        sentiment_counts = Counter(sentiments)
        recommendation_counts = Counter(recommendations)

        # Get most common
        consensus_sentiment = sentiment_counts.most_common(1)[0][0]
        consensus_recommendation = recommendation_counts.most_common(1)[0][0]

        # Calculate confidence (agreement percentage)
        total = len(analyses)
        sentiment_confidence = sentiment_counts[consensus_sentiment] / total
        recommendation_confidence = recommendation_counts[consensus_recommendation] / total

        # Average confidence
        avg_confidence = (sentiment_confidence + recommendation_confidence) / 2

        # Determine agreement level
        if avg_confidence >= 0.8:
            agreement_level = "strong"
        elif avg_confidence >= 0.6:
            agreement_level = "moderate"
        elif avg_confidence >= 0.4:
            agreement_level = "weak"
        else:
            agreement_level = "divergent"

        return {
            "sentiment": consensus_sentiment,
            "recommendation": consensus_recommendation,
            "confidence": round(avg_confidence, 2),
            "agreement_level": agreement_level,
            "sentiment_distribution": dict(sentiment_counts),
            "recommendation_distribution": dict(recommendation_counts),
            "models_count": total
        }

    def extract_sentiment(self, text: str) -> str:
        """
        Extract sentiment from AI response text

        Args:
            text: AI response text

        Returns:
            Sentiment: 'positive', 'neutral', or 'negative'
        """
        if not text:
            return "neutral"

        # Use sentiment analyzer
        return self.sentiment_analyzer.extract_sentiment(text)

    def extract_recommendation(self, text: str) -> str:
        """
        Extract investment recommendation from AI response

        Args:
            text: AI response text

        Returns:
            Recommendation: 'buy', 'hold', or 'sell'
        """
        if not text:
            return "hold"

        text_lower = text.lower()

        # Keyword patterns for recommendations
        buy_patterns = [
            r'\bcompra\b', r'\bcomprar\b', r'\bbuy\b',
            r'\brecomend.*compra\b', r'\bboa oportunidade\b',
            r'\bpositiv.*investimento\b'
        ]

        sell_patterns = [
            r'\bvenda\b', r'\bvender\b', r'\bsell\b',
            r'\brecomend.*venda\b', r'\bdesfazer.*posição\b',
            r'\breduz.*exposição\b'
        ]

        hold_patterns = [
            r'\bmanter\b', r'\bhold\b', r'\baguardar\b',
            r'\bmonitorar\b', r'\bneutro\b'
        ]

        # Score each recommendation type
        buy_score = sum(1 for pattern in buy_patterns if re.search(pattern, text_lower))
        sell_score = sum(1 for pattern in sell_patterns if re.search(pattern, text_lower))
        hold_score = sum(1 for pattern in hold_patterns if re.search(pattern, text_lower))

        # Also consider sentiment
        sentiment = self.extract_sentiment(text)
        if sentiment == "positive":
            buy_score += 1
        elif sentiment == "negative":
            sell_score += 1
        else:
            hold_score += 1

        # Determine recommendation
        max_score = max(buy_score, sell_score, hold_score)

        if max_score == 0:
            return "hold"
        elif buy_score == max_score:
            return "buy"
        elif sell_score == max_score:
            return "sell"
        else:
            return "hold"

    def _extract_common_themes(self, responses: List[str]) -> tuple:
        """
        Extract common strengths and risks from multiple responses

        Args:
            responses: List of AI response texts

        Returns:
            Tuple of (strengths, risks)
        """
        # Simplified theme extraction
        # In production, this could use more sophisticated NLP

        all_text = " ".join(responses).lower()

        # Common strength keywords
        strength_keywords = [
            "crescimento", "lucro", "dividendo", "forte", "líder",
            "competitivo", "inovação", "margem", "eficiência"
        ]

        # Common risk keywords
        risk_keywords = [
            "risco", "dívida", "volatilidade", "concorrência", "regulação",
            "incerteza", "desafio", "pressão", "queda"
        ]

        # Count occurrences
        strengths = [
            kw for kw in strength_keywords
            if kw in all_text
        ]

        risks = [
            kw for kw in risk_keywords
            if kw in all_text
        ]

        return strengths, risks

    async def cleanup(self):
        """Cleanup all scraper resources"""
        logger.info("Cleaning up AI scrapers...")
        for scraper in self.scrapers.values():
            try:
                await scraper.cleanup()
            except Exception as e:
                logger.error(f"Error cleaning up scraper: {e}")

    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        return self.cache.stats()

    def clear_cache(self, ticker: Optional[str] = None):
        """Clear cache for ticker or all"""
        self.cache.clear(ticker)


# Global instance
ai_analyzer = AIAnalyzer()
