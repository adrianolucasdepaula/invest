"""
Scraper para Bloomberg Línea (www.bloomberglinea.com.br)
Não requer autenticação
Coleta notícias de mercado financeiro
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
import requests
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings
from datetime import datetime


class BloombergLineaScraper(BaseScraper):
    """
    Scraper para Bloomberg Línea
    """

    def __init__(self):
        super().__init__(source_name="bloomberg_linea", requires_auth=False)
        self.base_url = "https://www.bloomberglinea.com.br"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })

    async def authenticate(self) -> bool:
        """
        Não requer autenticação

        Returns:
            True (sempre)
        """
        return True

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta notícias sobre um ativo da Bloomberg Línea

        Args:
            ticker: Código do ativo
            **kwargs: Pode incluir 'company_name' para busca melhor

        Returns:
            Dados de notícias coletados
        """
        self._respect_rate_limit()

        try:
            # Monta query de busca
            company_name = kwargs.get('company_name', ticker)
            search_url = f"{self.base_url}/busca?q={company_name}"

            response = self.session.get(search_url, timeout=30)
            response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extrai notícias
            news_list = self._extract_news(soup, ticker)

            data = {
                'ticker': ticker,
                'source': 'bloomberg_linea',
                'news_count': len(news_list),
                'news': news_list,
                'collected_at': datetime.now().isoformat(),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar notícias da Bloomberg Línea para {ticker}: {str(e)}")
            raise

    def _extract_news(self, soup: BeautifulSoup, ticker: str) -> List[Dict[str, Any]]:
        """Extrai lista de notícias"""
        news_list = []

        try:
            # Bloomberg Línea usa estrutura de artigos
            articles = soup.find_all(['article', 'div'], class_=lambda c: c and any(x in c for x in ['article', 'card', 'story', 'post']) if c else False)

            for article in articles[:20]:
                try:
                    news_item = {}

                    # Título
                    title_elem = article.find(['h2', 'h3', 'h4', 'a'], class_=lambda c: c and any(x in c.lower() for x in ['title', 'headline']) if c else False)
                    if not title_elem:
                        title_elem = article.find(['h2', 'h3', 'h4'])

                    if title_elem:
                        news_item['title'] = title_elem.get_text(strip=True)

                        # URL
                        link = title_elem.find('a') if title_elem.name != 'a' else title_elem
                        if not link:
                            link = article.find('a')

                        if link and link.get('href'):
                            url = link.get('href')
                            if not url.startswith('http'):
                                url = self.base_url + url
                            news_item['url'] = url

                    # Data
                    date_elem = article.find(['time', 'span'], class_=lambda c: c and 'date' in c.lower() if c else False)
                    if date_elem:
                        if date_elem.get('datetime'):
                            news_item['published_at'] = date_elem.get('datetime')
                        else:
                            news_item['published_at'] = date_elem.get_text(strip=True)

                    # Descrição
                    desc_elem = article.find(['p', 'div'], class_=lambda c: c and any(x in c.lower() for x in ['description', 'summary', 'excerpt']) if c else False)
                    if desc_elem:
                        news_item['description'] = desc_elem.get_text(strip=True)

                    # Categoria/Tag
                    tag_elem = article.find(['span', 'a'], class_=lambda c: c and any(x in c.lower() for x in ['tag', 'category']) if c else False)
                    if tag_elem:
                        news_item['category'] = tag_elem.get_text(strip=True)

                    if 'title' in news_item:
                        news_item['ticker'] = ticker
                        news_item['publisher'] = 'Bloomberg Línea'
                        news_list.append(news_item)

                except Exception as e:
                    logger.warning(f"Erro ao extrair artigo individual: {str(e)}")
                    continue

        except Exception as e:
            logger.warning(f"Erro ao extrair notícias: {str(e)}")

        return news_list

    def get_required_fields(self) -> List[str]:
        """Campos obrigatórios"""
        return ['ticker', 'source']
