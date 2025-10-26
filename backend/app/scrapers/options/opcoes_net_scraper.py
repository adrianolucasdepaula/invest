"""
Scraper para Opcoes.net.br
Coleta dados de opções
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger
from datetime import datetime
from ..base import BaseScraper
from ...core.config import settings


class OpcoesNetScraper(BaseScraper):
    """
    Scraper para Opcoes.net.br
    """

    def __init__(self):
        super().__init__(source_name="opcoes_net", requires_auth=True)
        self.base_url = "https://opcoes.net.br"
        self.is_authenticated = False

    async def authenticate(self) -> bool:
        """
        Realiza login no Opcoes.net.br

        Returns:
            True se autenticação foi bem sucedida
        """
        if self.is_authenticated:
            return True

        try:
            if not self.driver:
                self.driver = self._init_selenium()

            # Acessa página de login
            self.driver.get(f"{self.base_url}/login")

            # Preenche credenciais
            username_field = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "username"))
            )
            password_field = self.driver.find_element(By.ID, "password")

            username_field.send_keys(settings.OPCOES_USER)
            password_field.send_keys(settings.OPCOES_PASSWORD)

            # Clica no botão de login
            login_btn = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
            login_btn.click()

            # Aguarda login
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "user-logged"))
            )

            self.is_authenticated = True
            logger.info("Login no Opcoes.net.br realizado com sucesso")
            return True

        except Exception as e:
            logger.error(f"Erro ao autenticar no Opcoes.net.br: {str(e)}")
            return False

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados de opções

        Args:
            ticker: Código do ativo

        Returns:
            Dados de opções
        """
        if not self.is_authenticated:
            await self.authenticate()

        self._respect_rate_limit()

        try:
            # Acessa página de opções do ativo
            url = f"{self.base_url}/acoes/{ticker.lower()}/opcoes"
            self.driver.get(url)

            # Aguarda carregamento
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "options-table"))
            )

            # Extrai HTML
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')

            # Extrai dados
            data = {
                'ticker': ticker,
                'underlying_price': self._extract_underlying_price(soup),
                'iv_rank': self._extract_iv_rank(soup),
                'historical_volatility': self._extract_historical_volatility(soup),
                'options_chain': self._extract_options_chain(soup),
                'expiration_dates': self._extract_expiration_dates(soup),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados de opções para {ticker}: {str(e)}")
            raise

    def _extract_underlying_price(self, soup: BeautifulSoup) -> float:
        """Extrai preço do ativo subjacente"""
        try:
            price_elem = soup.find('span', class_='underlying-price')
            if price_elem:
                price_text = price_elem.get_text(strip=True).replace('R$', '').replace(',', '.')
                return float(price_text)
        except Exception as e:
            logger.warning(f"Erro ao extrair preço do ativo: {str(e)}")
        return None

    def _extract_iv_rank(self, soup: BeautifulSoup) -> float:
        """Extrai IV Rank"""
        try:
            iv_elem = soup.find('span', class_='iv-rank')
            if iv_elem:
                iv_text = iv_elem.get_text(strip=True).replace('%', '')
                return float(iv_text)
        except Exception as e:
            logger.warning(f"Erro ao extrair IV Rank: {str(e)}")
        return None

    def _extract_historical_volatility(self, soup: BeautifulSoup) -> float:
        """Extrai volatilidade histórica"""
        try:
            hv_elem = soup.find('span', class_='historical-volatility')
            if hv_elem:
                hv_text = hv_elem.get_text(strip=True).replace('%', '')
                return float(hv_text)
        except Exception as e:
            logger.warning(f"Erro ao extrair volatilidade histórica: {str(e)}")
        return None

    def _extract_options_chain(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extrai cadeia de opções"""
        options = []

        try:
            # Encontra tabela de opções
            table = soup.find('table', class_='options-table')
            if not table:
                return options

            rows = table.find_all('tr')[1:]  # Pula cabeçalho

            for row in rows:
                cells = row.find_all('td')
                if len(cells) >= 8:
                    try:
                        option_data = {
                            'option_ticker': cells[0].get_text(strip=True),
                            'strike': float(cells[1].get_text(strip=True).replace(',', '.')),
                            'option_type': cells[2].get_text(strip=True),  # CALL ou PUT
                            'last_price': float(cells[3].get_text(strip=True).replace(',', '.')),
                            'volume': int(cells[4].get_text(strip=True).replace('.', '')),
                            'open_interest': int(cells[5].get_text(strip=True).replace('.', '')),
                            'implied_volatility': float(cells[6].get_text(strip=True).replace('%', '')),
                            'delta': float(cells[7].get_text(strip=True)),
                        }
                        options.append(option_data)
                    except Exception as e:
                        logger.warning(f"Erro ao parsear linha de opção: {str(e)}")
                        continue

        except Exception as e:
            logger.warning(f"Erro ao extrair cadeia de opções: {str(e)}")

        return options

    def _extract_expiration_dates(self, soup: BeautifulSoup) -> List[str]:
        """Extrai datas de vencimento"""
        dates = []

        try:
            date_elements = soup.find_all('option', class_='expiration-date')
            for elem in date_elements:
                date_text = elem.get_text(strip=True)
                dates.append(date_text)
        except Exception as e:
            logger.warning(f"Erro ao extrair datas de vencimento: {str(e)}")

        return dates

    async def get_next_expirations(self, ticker: str, num_expirations: int = 3) -> List[Dict[str, Any]]:
        """
        Obtém próximos vencimentos e análise de impacto

        Args:
            ticker: Código do ativo
            num_expirations: Número de vencimentos a retornar

        Returns:
            Lista de vencimentos com análise
        """
        data = await self.collect_data(ticker)

        expiration_analysis = []
        for date_str in data.get('expiration_dates', [])[:num_expirations]:
            # Calcula dias até vencimento
            exp_date = datetime.strptime(date_str, '%Y-%m-%d')
            days_to_exp = (exp_date - datetime.now()).days

            # Filtra opções deste vencimento
            options_for_date = [
                opt for opt in data.get('options_chain', [])
                if date_str in opt.get('option_ticker', '')
            ]

            # Calcula volume total
            total_volume = sum(opt.get('volume', 0) for opt in options_for_date)
            total_open_interest = sum(opt.get('open_interest', 0) for opt in options_for_date)

            expiration_analysis.append({
                'date': date_str,
                'days_to_expiration': days_to_exp,
                'total_volume': total_volume,
                'total_open_interest': total_open_interest,
                'num_options': len(options_for_date),
                'impact_score': self._calculate_impact_score(total_volume, total_open_interest)
            })

        return expiration_analysis

    def _calculate_impact_score(self, volume: int, open_interest: int) -> float:
        """
        Calcula score de impacto do vencimento

        Args:
            volume: Volume de contratos
            open_interest: Contratos em aberto

        Returns:
            Score de impacto (0-1)
        """
        # Lógica simples: quanto maior o volume e OI, maior o impacto
        volume_score = min(volume / 100000, 1.0) * 0.5
        oi_score = min(open_interest / 500000, 1.0) * 0.5
        return volume_score + oi_score

    def get_required_fields(self) -> List[str]:
        """Campos obrigatórios"""
        return ['ticker', 'options_chain']
