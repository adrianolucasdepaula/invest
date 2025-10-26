"""
Scraper para Google News (news.google.com)
Requer login com Google
Coleta notícias relacionadas a ativos específicos
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings
import time
from datetime import datetime


class GoogleNewsScraper(BaseScraper):
    """
    Scraper para Google News
    """

    def __init__(self):
        super().__init__(source_name="google_news", requires_auth=True)
        self.base_url = "https://news.google.com"
        self.is_authenticated = False

    async def authenticate(self) -> bool:
        """
        Realiza login via Google

        Returns:
            True se autenticação foi bem sucedida
        """
        if self.is_authenticated:
            return True

        try:
            if not self.driver:
                self.driver = self._init_selenium()

            # Acessa Google News
            self.driver.get(self.base_url)

            # Aguarda e clica no botão de login
            try:
                login_btn = WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "a[href*='signin'], .signin-button"))
                )
                login_btn.click()

                # Aguarda login manual do usuário
                logger.info("Aguardando login manual com Google no Google News...")
                WebDriverWait(self.driver, 120).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".gb_d, .user-menu, [aria-label*='conta']"))
                )

                self.is_authenticated = True
                logger.info("Login no Google News realizado com sucesso")
            except:
                # Se não encontrar botão de login, pode já estar logado
                logger.info("Google News pode já estar logado ou não requer login")
                self.is_authenticated = True

            return True

        except Exception as e:
            logger.error(f"Erro ao autenticar no Google News: {str(e)}")
            return False

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta notícias sobre um ativo do Google News

        Args:
            ticker: Código do ativo (ex: PETR4, VALE3)
            **kwargs: Pode incluir 'company_name' para busca melhor

        Returns:
            Dados de notícias coletados
        """
        if not self.is_authenticated:
            await self.authenticate()

        self._respect_rate_limit()

        try:
            # Monta query de busca
            company_name = kwargs.get('company_name', ticker)
            search_query = f"{company_name} ações bolsa"

            # Acessa busca do Google News
            search_url = f"{self.base_url}/search?q={search_query}&hl=pt-BR&gl=BR&ceid=BR:pt-419"
            self.driver.get(search_url)

            # Aguarda carregamento dos resultados
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "article, .article, c-wiz"))
            )

            # Pequeno delay para garantir carregamento completo
            time.sleep(2)

            # Extrai HTML
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            # Extrai notícias
            news_list = self._extract_news(soup, ticker)

            data = {
                'ticker': ticker,
                'source': 'google_news',
                'news_count': len(news_list),
                'news': news_list,
                'collected_at': datetime.now().isoformat(),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar notícias do Google News para {ticker}: {str(e)}")
            raise

    def _extract_news(self, soup: BeautifulSoup, ticker: str) -> List[Dict[str, Any]]:
        """Extrai lista de notícias"""
        news_list = []

        try:
            # Google News usa estrutura de artigos
            articles = soup.find_all(['article', 'div'], class_=lambda c: c and any(x in c for x in ['article', 'item', 'card']) if c else False)

            for article in articles[:20]:  # Limita a 20 notícias mais recentes
                try:
                    news_item = {}

                    # Título
                    title_elem = article.find(['h3', 'h4', 'a'])
                    if title_elem:
                        news_item['title'] = title_elem.get_text(strip=True)

                        # URL
                        link = title_elem.find('a') if title_elem.name != 'a' else title_elem
                        if link and link.get('href'):
                            # Google News usa URLs redirecionadas
                            url = link.get('href')
                            if url.startswith('./'):
                                url = self.base_url + url[1:]
                            news_item['url'] = url

                    # Fonte
                    source_elem = article.find(['a', 'div', 'span'], class_=lambda c: c and 'source' in c.lower() if c else False)
                    if source_elem:
                        news_item['publisher'] = source_elem.get_text(strip=True)

                    # Data/Tempo
                    time_elem = article.find(['time', 'span'], class_=lambda c: c and 'time' in c.lower() if c else False)
                    if time_elem:
                        news_item['published_at'] = time_elem.get_text(strip=True)

                    # Descrição/Snippet
                    desc_elem = article.find(['p', 'div'], class_=lambda c: c and any(x in c.lower() for x in ['snippet', 'description', 'summary']) if c else False)
                    if desc_elem:
                        news_item['description'] = desc_elem.get_text(strip=True)

                    # Só adiciona se tiver pelo menos título
                    if 'title' in news_item:
                        news_item['ticker'] = ticker
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
