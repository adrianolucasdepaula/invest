"""
Scraper para Griffin (griffin.app.br)
Não requer autenticação
Coleta dados de transações de insiders (administradores e acionistas)
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
import requests
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings
from datetime import datetime


class GriffinScraper(BaseScraper):
    """
    Scraper para Griffin - Insiders Transactions
    """

    def __init__(self):
        super().__init__(source_name="griffin", requires_auth=False)
        self.base_url = "https://griffin.app.br"
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
        Coleta dados de transações de insiders

        Args:
            ticker: Código do ativo (ex: PETR4, VALE3)

        Returns:
            Dados de insiders coletados
        """
        self._respect_rate_limit()

        try:
            # Acessa página da empresa no Griffin
            url = f"{self.base_url}/empresa/{ticker.lower()}/insiders"

            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extrai dados
            data = {
                'ticker': ticker,
                'source': 'griffin',
                **self._extract_insider_summary(soup),
                'transactions': self._extract_transactions(soup, ticker),
                'collected_at': datetime.now().isoformat(),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados de insiders do Griffin para {ticker}: {str(e)}")
            raise

    def _extract_insider_summary(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extrai resumo de atividade de insiders"""
        summary = {}

        try:
            # Total de transações
            total_elem = soup.find(['div', 'span'], string=lambda t: t and 'Total de transações' in t if t else False)
            if total_elem:
                value_elem = total_elem.find_next(['div', 'span', 'strong'])
                if value_elem:
                    summary['total_transactions'] = int(value_elem.get_text(strip=True))

            # Volume total negociado
            volume_elem = soup.find(['div', 'span'], string=lambda t: t and 'Volume' in t if t else False)
            if volume_elem:
                value_elem = volume_elem.find_next(['div', 'span', 'strong'])
                if value_elem:
                    volume_text = value_elem.get_text(strip=True).replace('R$', '').replace('.', '').replace(',', '.')
                    summary['total_volume'] = self._parse_value(volume_text)

            # Última transação
            last_transaction_elem = soup.find(['div', 'span'], string=lambda t: t and 'Última transação' in t if t else False)
            if last_transaction_elem:
                value_elem = last_transaction_elem.find_next(['div', 'span', 'time'])
                if value_elem:
                    summary['last_transaction_date'] = value_elem.get_text(strip=True)

        except Exception as e:
            logger.warning(f"Erro ao extrair resumo de insiders: {str(e)}")

        return summary

    def _extract_transactions(self, soup: BeautifulSoup, ticker: str) -> List[Dict[str, Any]]:
        """Extrai lista de transações de insiders"""
        transactions = []

        try:
            # Griffin usa tabela para transações
            table = soup.find('table', class_=lambda c: c and 'insiders' in c.lower() if c else False)
            if not table:
                table = soup.find('table')

            if table:
                rows = table.find_all('tr')[1:]  # Pula header

                for row in rows[:50]:  # Limita a 50 transações mais recentes
                    try:
                        cells = row.find_all(['td', 'th'])

                        if len(cells) >= 5:
                            transaction = {
                                'ticker': ticker,
                            }

                            # Data
                            if cells[0]:
                                transaction['date'] = cells[0].get_text(strip=True)

                            # Nome do insider
                            if cells[1]:
                                transaction['insider_name'] = cells[1].get_text(strip=True)

                            # Cargo
                            if cells[2]:
                                transaction['position'] = cells[2].get_text(strip=True)

                            # Tipo de operação (Compra/Venda)
                            if cells[3]:
                                operation = cells[3].get_text(strip=True)
                                transaction['operation_type'] = operation

                            # Quantidade
                            if cells[4]:
                                quantity_text = cells[4].get_text(strip=True).replace('.', '').replace(',', '.')
                                try:
                                    transaction['quantity'] = int(float(quantity_text))
                                except:
                                    pass

                            # Preço (se disponível)
                            if len(cells) >= 6 and cells[5]:
                                price_text = cells[5].get_text(strip=True).replace('R$', '').replace('.', '').replace(',', '.')
                                transaction['price'] = self._parse_value(price_text)

                            # Valor total
                            if len(cells) >= 7 and cells[6]:
                                value_text = cells[6].get_text(strip=True).replace('R$', '').replace('.', '').replace(',', '.')
                                transaction['total_value'] = self._parse_value(value_text)

                            transactions.append(transaction)

                    except Exception as e:
                        logger.warning(f"Erro ao extrair transação individual: {str(e)}")
                        continue

        except Exception as e:
            logger.warning(f"Erro ao extrair transações: {str(e)}")

        return transactions

    def _parse_value(self, value: str) -> Any:
        """
        Parse de valor

        Args:
            value: Valor como string

        Returns:
            Valor convertido
        """
        if not value or value == '-' or value == 'N/A':
            return None

        # Trata multiplicadores (B, M, K, Mi, Bi)
        multipliers = {
            'Bi': 1e9,
            'B': 1e9,
            'Mi': 1e6,
            'M': 1e6,
            'K': 1e3,
        }
        for suffix, mult in multipliers.items():
            if value.endswith(suffix):
                try:
                    return float(value[:-len(suffix)].strip()) * mult
                except ValueError:
                    return None

        try:
            return float(value)
        except ValueError:
            return None

    def get_required_fields(self) -> List[str]:
        """Campos obrigatórios"""
        return ['ticker', 'source']
