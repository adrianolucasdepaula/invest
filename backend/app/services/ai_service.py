"""
Serviço de Integração com IAs
Integra OpenAI (GPT-4), Anthropic (Claude) e Google (Gemini)
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from loguru import logger
import openai
import anthropic
import google.generativeai as genai
from ..core.config import settings


class AIService:
    """
    Serviço para integração com múltiplas IAs
    """

    def __init__(self):
        """Inicializa o serviço de IA"""
        # Configura OpenAI
        if hasattr(settings, 'OPENAI_API_KEY') and settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
            self.openai_enabled = True
            logger.info("OpenAI configurado")
        else:
            self.openai_enabled = False
            logger.warning("OpenAI API key não configurada")

        # Configura Anthropic
        if hasattr(settings, 'ANTHROPIC_API_KEY') and settings.ANTHROPIC_API_KEY:
            self.anthropic_client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            self.anthropic_enabled = True
            logger.info("Anthropic (Claude) configurado")
        else:
            self.anthropic_enabled = False
            logger.warning("Anthropic API key não configurada")

        # Configura Google Gemini
        if hasattr(settings, 'GOOGLE_API_KEY') and settings.GOOGLE_API_KEY:
            genai.configure(api_key=settings.GOOGLE_API_KEY)
            self.gemini_model = genai.GenerativeModel('gemini-pro')
            self.gemini_enabled = True
            logger.info("Google Gemini configurado")
        else:
            self.gemini_enabled = False
            logger.warning("Google API key não configurada")

    def generate_analysis_with_openai(
        self,
        asset_data: Dict[str, Any],
        prompt_template: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Gera análise usando OpenAI GPT-4

        Args:
            asset_data: Dados do ativo
            prompt_template: Template personalizado (opcional)

        Returns:
            Análise gerada
        """
        if not self.openai_enabled:
            return {"error": "OpenAI não configurado"}

        ticker = asset_data.get("ticker", "unknown")
        logger.info(f"Gerando análise com OpenAI para {ticker}")

        # Monta prompt
        if not prompt_template:
            prompt_template = self._get_default_analysis_prompt()

        prompt = prompt_template.format(
            ticker=ticker,
            fundamental_data=str(asset_data.get("fundamental", {})),
            technical_data=str(asset_data.get("technical", {})),
            news_data=str(asset_data.get("news", {})),
        )

        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "Você é um analista financeiro expert em mercado brasileiro (B3)."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000,
            )

            analysis = response.choices[0].message.content

            return {
                "provider": "openai",
                "model": "gpt-4",
                "ticker": ticker,
                "analysis": analysis,
                "generated_at": datetime.utcnow().isoformat(),
                "tokens_used": response.usage.total_tokens,
            }

        except Exception as e:
            logger.error(f"Erro ao gerar análise com OpenAI: {str(e)}")
            return {"error": str(e)}

    def generate_analysis_with_claude(
        self,
        asset_data: Dict[str, Any],
        prompt_template: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Gera análise usando Anthropic Claude

        Args:
            asset_data: Dados do ativo
            prompt_template: Template personalizado (opcional)

        Returns:
            Análise gerada
        """
        if not self.anthropic_enabled:
            return {"error": "Anthropic não configurado"}

        ticker = asset_data.get("ticker", "unknown")
        logger.info(f"Gerando análise com Claude para {ticker}")

        # Monta prompt
        if not prompt_template:
            prompt_template = self._get_default_analysis_prompt()

        prompt = prompt_template.format(
            ticker=ticker,
            fundamental_data=str(asset_data.get("fundamental", {})),
            technical_data=str(asset_data.get("technical", {})),
            news_data=str(asset_data.get("news", {})),
        )

        try:
            message = self.anthropic_client.messages.create(
                model="claude-3-opus-20240229",
                max_tokens=2000,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            analysis = message.content[0].text

            return {
                "provider": "anthropic",
                "model": "claude-3-opus",
                "ticker": ticker,
                "analysis": analysis,
                "generated_at": datetime.utcnow().isoformat(),
                "tokens_used": message.usage.input_tokens + message.usage.output_tokens,
            }

        except Exception as e:
            logger.error(f"Erro ao gerar análise com Claude: {str(e)}")
            return {"error": str(e)}

    def generate_analysis_with_gemini(
        self,
        asset_data: Dict[str, Any],
        prompt_template: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Gera análise usando Google Gemini

        Args:
            asset_data: Dados do ativo
            prompt_template: Template personalizado (opcional)

        Returns:
            Análise gerada
        """
        if not self.gemini_enabled:
            return {"error": "Google Gemini não configurado"}

        ticker = asset_data.get("ticker", "unknown")
        logger.info(f"Gerando análise com Gemini para {ticker}")

        # Monta prompt
        if not prompt_template:
            prompt_template = self._get_default_analysis_prompt()

        prompt = prompt_template.format(
            ticker=ticker,
            fundamental_data=str(asset_data.get("fundamental", {})),
            technical_data=str(asset_data.get("technical", {})),
            news_data=str(asset_data.get("news", {})),
        )

        try:
            response = self.gemini_model.generate_content(prompt)
            analysis = response.text

            return {
                "provider": "google",
                "model": "gemini-pro",
                "ticker": ticker,
                "analysis": analysis,
                "generated_at": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Erro ao gerar análise com Gemini: {str(e)}")
            return {"error": str(e)}

    def generate_analysis_multi_ai(
        self,
        asset_data: Dict[str, Any],
        providers: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Gera análise usando múltiplas IAs para comparação

        Args:
            asset_data: Dados do ativo
            providers: Lista de provedores (opcional, usa todos se não especificado)

        Returns:
            Análises de múltiplas IAs
        """
        ticker = asset_data.get("ticker", "unknown")
        logger.info(f"Gerando análise multi-IA para {ticker}")

        if not providers:
            providers = []
            if self.openai_enabled:
                providers.append("openai")
            if self.anthropic_enabled:
                providers.append("anthropic")
            if self.gemini_enabled:
                providers.append("gemini")

        results = {}

        if "openai" in providers and self.openai_enabled:
            results["openai"] = self.generate_analysis_with_openai(asset_data)

        if "anthropic" in providers and self.anthropic_enabled:
            results["claude"] = self.generate_analysis_with_claude(asset_data)

        if "gemini" in providers and self.gemini_enabled:
            results["gemini"] = self.generate_analysis_with_gemini(asset_data)

        return {
            "ticker": ticker,
            "providers_used": list(results.keys()),
            "analyses": results,
            "generated_at": datetime.utcnow().isoformat(),
        }

    def summarize_text(self, text: str, provider: str = "openai") -> Dict[str, Any]:
        """
        Resume um texto usando IA

        Args:
            text: Texto para resumir
            provider: Provedor de IA

        Returns:
            Resumo gerado
        """
        logger.info(f"Resumindo texto com {provider}")

        prompt = f"Resuma o seguinte texto de forma concisa e objetiva:\n\n{text}"

        if provider == "openai" and self.openai_enabled:
            try:
                response = openai.ChatCompletion.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "Você é um assistente que resume textos de forma concisa."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.5,
                    max_tokens=500,
                )
                return {"summary": response.choices[0].message.content}
            except Exception as e:
                logger.error(f"Erro ao resumir com OpenAI: {str(e)}")
                return {"error": str(e)}

        elif provider == "anthropic" and self.anthropic_enabled:
            try:
                message = self.anthropic_client.messages.create(
                    model="claude-3-opus-20240229",
                    max_tokens=500,
                    messages=[{"role": "user", "content": prompt}]
                )
                return {"summary": message.content[0].text}
            except Exception as e:
                logger.error(f"Erro ao resumir com Claude: {str(e)}")
                return {"error": str(e)}

        elif provider == "gemini" and self.gemini_enabled:
            try:
                response = self.gemini_model.generate_content(prompt)
                return {"summary": response.text}
            except Exception as e:
                logger.error(f"Erro ao resumir com Gemini: {str(e)}")
                return {"error": str(e)}

        return {"error": f"Provider {provider} não disponível"}

    def sentiment_analysis(self, texts: List[str], provider: str = "openai") -> Dict[str, Any]:
        """
        Realiza análise de sentimento em textos

        Args:
            texts: Lista de textos para analisar
            provider: Provedor de IA

        Returns:
            Análise de sentimento
        """
        logger.info(f"Analisando sentimento de {len(texts)} textos com {provider}")

        prompt = f"""Analise o sentimento dos seguintes textos e classifique cada um como positivo, negativo ou neutro.
        Retorne em formato JSON.

        Textos:
        {chr(10).join([f'{i+1}. {text}' for i, text in enumerate(texts[:10])])}
        """

        if provider == "openai" and self.openai_enabled:
            try:
                response = openai.ChatCompletion.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "Você é um analista de sentimento especializado em notícias financeiras."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=1000,
                )
                return {"analysis": response.choices[0].message.content}
            except Exception as e:
                logger.error(f"Erro na análise de sentimento com OpenAI: {str(e)}")
                return {"error": str(e)}

        return {"error": f"Provider {provider} não disponível"}

    def _get_default_analysis_prompt(self) -> str:
        """
        Retorna template padrão de prompt para análise

        Returns:
            Template de prompt
        """
        return """
Você é um analista financeiro expert em mercado brasileiro (B3).
Analise o seguinte ativo e forneça uma análise detalhada e recomendação de investimento.

TICKER: {ticker}

DADOS FUNDAMENTALISTAS:
{fundamental_data}

DADOS TÉCNICOS:
{technical_data}

NOTÍCIAS RECENTES:
{news_data}

Por favor, forneça:
1. Análise fundamentalista (valuation, rentabilidade, endividamento, crescimento)
2. Análise técnica (tendência, momentum, suporte/resistência)
3. Análise de sentimento (baseada nas notícias)
4. Pontos fortes e fracos
5. Riscos identificados
6. Recomendação (compra forte, compra, manutenção, venda, venda forte)
7. Preço-alvo estimado (se aplicável)

Seja objetivo, baseie-se nos dados fornecidos e justifique sua recomendação.
"""

    def get_available_providers(self) -> List[str]:
        """
        Retorna lista de provedores disponíveis

        Returns:
            Lista de provedores
        """
        providers = []
        if self.openai_enabled:
            providers.append("openai")
        if self.anthropic_enabled:
            providers.append("anthropic")
        if self.gemini_enabled:
            providers.append("gemini")
        return providers
