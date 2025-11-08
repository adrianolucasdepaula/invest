"""
Sentiment Analyzer - NLP-based sentiment extraction
Analyzes text for positive, neutral, or negative sentiment using keyword matching
"""
from typing import Dict, List, Tuple
from collections import Counter
import re


class SentimentAnalyzer:
    """
    Simple but effective sentiment analyzer using Portuguese keywords
    Suitable for Brazilian stock market analysis
    """

    # Positive keywords (indicadores positivos)
    POSITIVE_KEYWORDS = [
        # Growth and profits
        "crescimento", "lucro", "lucrativo", "lucros", "rentabilidade", "rentável",
        "oportunidade", "oportunidades", "valorização", "valorizar", "ganho", "ganhos",
        "aumento", "aumentar", "subir", "alta", "positivo", "otimista", "otimismo",

        # Performance
        "recuperação", "recuperar", "melhorar", "melhora", "expansão", "expandir",
        "forte", "sólido", "sólida", "robusto", "robusta", "favorável",
        "promissor", "promissora", "potencial", "bom", "boa", "excelente",

        # Financial health
        "dividendo", "dividendos", "provento", "proventos", "distribuição",
        "receita", "faturamento", "superávit", "margem", "eficiência",
        "inovação", "inovador", "competitivo", "competitiva", "liderança", "líder",

        # Market sentiment
        "comprar", "compra", "recomendação", "positiva", "upgrade", "upside",
        "aceleração", "momentum", "tendência", "alta", "bullish", "bull",
        "confiança", "segurança", "estabilidade", "sustentável", "sustentabilidade",
    ]

    # Negative keywords (indicadores negativos)
    NEGATIVE_KEYWORDS = [
        # Risks and losses
        "risco", "riscos", "perda", "perdas", "prejuízo", "prejuízos",
        "queda", "cair", "baixa", "negativo", "pessimista", "pessimismo",
        "deterioração", "deteriorar", "fraco", "fraca", "vulnerável",

        # Problems
        "problema", "problemas", "dificuldade", "dificuldades", "crise",
        "preocupação", "preocupações", "incerteza", "incerto", "instabilidade",
        "volatilidade", "volátil", "ameaça", "ameaças", "desafio", "desafios",

        # Financial issues
        "déficit", "endividamento", "dívida", "dívidas", "calote", "inadimplência",
        "redução", "reduzir", "corte", "cortar", "diminuição", "diminuir",
        "suspensão", "suspender", "cancelamento", "cancelar",

        # Market sentiment
        "vender", "venda", "venda", "downgrade", "downside", "bearish", "bear",
        "desvalorização", "desvalorizar", "depreciação", "depreciar",
        "contração", "recessão", "desaceleração", "estagnação", "estagnar",
        "fraude", "escândalo", "investigação", "multa", "penalidade",
    ]

    # Neutral/contextual keywords
    NEUTRAL_KEYWORDS = [
        "manter", "manutenção", "estável", "estabilizar", "neutro", "hold",
        "aguardar", "monitorar", "acompanhar", "observar", "avaliar",
    ]

    def __init__(self):
        """Initialize sentiment analyzer"""
        # Compile regex patterns for performance
        self.positive_pattern = self._compile_pattern(self.POSITIVE_KEYWORDS)
        self.negative_pattern = self._compile_pattern(self.NEGATIVE_KEYWORDS)
        self.neutral_pattern = self._compile_pattern(self.NEUTRAL_KEYWORDS)

    def _compile_pattern(self, keywords: List[str]) -> re.Pattern:
        """Compile regex pattern from keyword list"""
        # Word boundaries to avoid partial matches
        pattern = r'\b(' + '|'.join(re.escape(kw) for kw in keywords) + r')\b'
        return re.compile(pattern, re.IGNORECASE)

    def analyze(self, text: str) -> Dict:
        """
        Analyze sentiment of given text

        Args:
            text: Text to analyze (can be Portuguese or English)

        Returns:
            Dict with sentiment analysis results
        """
        if not text or len(text.strip()) < 10:
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "positive_score": 0,
                "negative_score": 0,
                "neutral_score": 0,
                "word_count": 0,
            }

        # Normalize text
        text_lower = text.lower()

        # Count keyword matches
        positive_matches = self.positive_pattern.findall(text_lower)
        negative_matches = self.negative_pattern.findall(text_lower)
        neutral_matches = self.neutral_pattern.findall(text_lower)

        positive_score = len(positive_matches)
        negative_score = len(negative_matches)
        neutral_score = len(neutral_matches)

        # Word count for normalization
        word_count = len(text.split())

        # Calculate sentiment
        sentiment, confidence = self._calculate_sentiment(
            positive_score, negative_score, neutral_score, word_count
        )

        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "positive_score": positive_score,
            "negative_score": negative_score,
            "neutral_score": neutral_score,
            "word_count": word_count,
            "positive_keywords": list(set(positive_matches))[:10],  # Top 10 unique
            "negative_keywords": list(set(negative_matches))[:10],  # Top 10 unique
        }

    def _calculate_sentiment(
        self,
        positive: int,
        negative: int,
        neutral: int,
        word_count: int
    ) -> Tuple[str, float]:
        """
        Calculate overall sentiment and confidence

        Args:
            positive: Count of positive keywords
            negative: Count of negative keywords
            neutral: Count of neutral keywords
            word_count: Total word count

        Returns:
            Tuple of (sentiment, confidence)
        """
        total_signals = positive + negative + neutral

        # No clear signals
        if total_signals == 0:
            return "neutral", 0.5

        # Calculate net sentiment
        net_sentiment = positive - negative

        # Determine sentiment category
        if net_sentiment > 2:
            sentiment = "positive"
        elif net_sentiment < -2:
            sentiment = "negative"
        elif abs(net_sentiment) <= 2 and total_signals > 0:
            sentiment = "neutral"
        else:
            sentiment = "neutral"

        # Calculate confidence (0.0 to 1.0)
        # Based on signal strength relative to text length
        if word_count == 0:
            confidence = 0.5
        else:
            signal_density = total_signals / max(word_count / 100, 1)
            confidence = min(0.5 + (signal_density * 0.1), 1.0)

            # Boost confidence for strong net sentiment
            if abs(net_sentiment) > 5:
                confidence = min(confidence + 0.2, 1.0)
            elif abs(net_sentiment) > 3:
                confidence = min(confidence + 0.1, 1.0)

        return sentiment, round(confidence, 2)

    def extract_sentiment(self, text: str) -> str:
        """
        Simple sentiment extraction (returns only sentiment label)

        Args:
            text: Text to analyze

        Returns:
            Sentiment label: 'positive', 'neutral', or 'negative'
        """
        result = self.analyze(text)
        return result["sentiment"]

    def batch_analyze(self, texts: List[str]) -> List[Dict]:
        """
        Analyze multiple texts in batch

        Args:
            texts: List of texts to analyze

        Returns:
            List of sentiment analysis results
        """
        return [self.analyze(text) for text in texts]

    def get_consensus_sentiment(self, texts: List[str]) -> Dict:
        """
        Get consensus sentiment from multiple texts

        Args:
            texts: List of texts (e.g., multiple AI responses)

        Returns:
            Consensus sentiment analysis
        """
        if not texts:
            return {
                "consensus": "neutral",
                "confidence": 0.0,
                "distribution": {"positive": 0, "neutral": 0, "negative": 0}
            }

        # Analyze all texts
        analyses = self.batch_analyze(texts)

        # Count sentiments
        sentiments = [a["sentiment"] for a in analyses]
        sentiment_counts = Counter(sentiments)

        # Calculate consensus
        total = len(sentiments)
        distribution = {
            "positive": sentiment_counts.get("positive", 0) / total,
            "neutral": sentiment_counts.get("neutral", 0) / total,
            "negative": sentiment_counts.get("negative", 0) / total,
        }

        # Determine consensus
        consensus = max(distribution, key=distribution.get)
        confidence = distribution[consensus]

        # Average confidence from individual analyses
        avg_confidence = sum(a["confidence"] for a in analyses) / len(analyses)

        return {
            "consensus": consensus,
            "confidence": round(confidence, 2),
            "avg_individual_confidence": round(avg_confidence, 2),
            "distribution": {k: round(v, 2) for k, v in distribution.items()},
            "count": total,
        }


# Global instance
sentiment_analyzer = SentimentAnalyzer()
