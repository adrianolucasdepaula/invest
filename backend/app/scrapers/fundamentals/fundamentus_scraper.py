"""
Scraper para Fundamentus (www.fundamentus.com.br)
Coleta dados fundamentalistas sem necessidade de login
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
import requests
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings


class FundamentusScraper(BaseScraper):
    """
    Scraper para Fundamentus
    """

    def __init__(self):
        super().__init__(source_name="fundamentus", requires_auth=False)
        self.base_url = "https://www.fundamentus.com.br"

    async def authenticate(self) -> bool:
        """
        Fundamentus não requer autenticação

        Returns:
            True
        """
        return True

    async def collect_data(self, ticker: str, **kwargs) -> Dict[str, Any]:
        """
        Coleta dados fundamentalistas do Fundamentus

        Args:
            ticker: Código do ativo

        Returns:
            Dicionário com dados fundamentalistas
        """
        self._respect_rate_limit()

        url = f"{self.base_url}/detalhes.php?papel={ticker}"

        try:
            response = self.session.get(url, timeout=settings.SCRAPING_TIMEOUT)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Extrai dados da tabela
            data = self._extract_table_data(soup)

            # Adiciona ticker
            data['ticker'] = ticker

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar dados do Fundamentus para {ticker}: {str(e)}")
            raise

    def _extract_table_data(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """
        Extrai dados das tabelas do Fundamentus

        Args:
            soup: BeautifulSoup object

        Returns:
            Dicionário com dados extraídos
        """
        data = {}

        # Encontra todas as tabelas de dados
        tables = soup.find_all('table', class_='w728')

        if not tables:
            return data

        # Mapeia os labels do site para nossos campos
        field_mapping = {
            'Papel': 'ticker',
            'Cotação': 'price',
            'Tipo': 'asset_type',
            'Empresa': 'name',
            'Setor': 'sector',
            'Subsetor': 'subsector',

            # Valor de mercado
            'Valor de mercado': 'market_cap',
            'Patrimônio Líq': 'patrimonio_liquido',
            'Valor da firma': 'enterprise_value',

            # Indicadores de Valuation
            'P/L': 'p_l',
            'P/VP': 'p_vp',
            'P/EBIT': 'p_ebit',
            'PSR': 'p_sr',
            'P/Ativos': 'p_ativo',
            'P/Cap.Giro': 'p_cap_giro',
            'P/Ativ Circ Liq': 'p_ativ_circ_liq',
            'EV/EBIT': 'ev_ebit',
            'EV/EBITDA': 'ev_ebitda',

            # Indicadores de Rentabilidade
            'ROE': 'roe',
            'ROIC': 'roic',
            'ROA': 'roa',
            'Marg. Bruta': 'margem_bruta',
            'Marg. EBIT': 'margem_ebit',
            'Marg. Líquida': 'margem_liquida',

            # Indicadores de Crescimento
            'CAGR Receitas 5a': 'cagr_receita_5anos',
            'CAGR Lucros 5a': 'cagr_lucro_5anos',

            # Indicadores de Endividamento
            'Dív. Bruta': 'divida_bruta',
            'Dív. Líquida': 'divida_liquida',
            'Dív. Bruta/Patrim.': 'divida_bruta_patrimonio',
            'Dív. Líq./Patrim.': 'divida_liquida_patrimonio',
            'Dív. Líq./EBITDA': 'divida_liquida_ebitda',
            'Dív. Líq./EBIT': 'divida_liquida_ebit',

            # Resultados
            'Receita Líquida': 'receita_liquida',
            'EBIT': 'ebit',
            'EBITDA': 'ebitda',
            'Lucro Líquido': 'lucro_liquido',

            # Por ação
            'Cotação': 'price',
            'VPA': 'vpa',
            'LPA': 'lpa',
            'Div. Yield': 'dividend_yield',

            # Liquidez
            'Liquidez Corr.': 'liquidez_corrente',

            # Outros
            'Nro. Ações': 'num_acoes',
        }

        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    label = cells[0].get_text(strip=True)
                    value = cells[1].get_text(strip=True)

                    # Se temos um mapeamento para este campo
                    if label in field_mapping:
                        field_name = field_mapping[label]
                        data[field_name] = self._parse_value(value)

                # Tenta pegar também a segunda coluna se houver 4 células
                if len(cells) >= 4:
                    label = cells[2].get_text(strip=True)
                    value = cells[3].get_text(strip=True)

                    if label in field_mapping:
                        field_name = field_mapping[label]
                        data[field_name] = self._parse_value(value)

        return data

    def _parse_value(self, value: str) -> Any:
        """
        Converte string do Fundamentus para o tipo apropriado

        Args:
            value: Valor como string

        Returns:
            Valor convertido
        """
        if not value or value == '-':
            return None

        # Remove caracteres especiais
        value = value.replace('.', '').replace(',', '.').replace('%', '')

        # Converte multiplicadores
        multipliers = {
            'B': 1_000_000_000,  # Bilhão
            'M': 1_000_000,      # Milhão
            'K': 1_000,          # Mil
        }

        for suffix, multiplier in multipliers.items():
            if value.endswith(suffix):
                try:
                    return float(value[:-1]) * multiplier
                except ValueError:
                    return value

        # Tenta converter para float
        try:
            return float(value)
        except ValueError:
            return value

    def get_required_fields(self) -> List[str]:
        """
        Campos obrigatórios para validação

        Returns:
            Lista de campos obrigatórios
        """
        return ['ticker', 'price']

    async def collect_all_tickers(self) -> List[str]:
        """
        Coleta lista de todos os tickers disponíveis

        Returns:
            Lista de tickers
        """
        url = f"{self.base_url}/detalhes.php"

        try:
            response = self.session.get(url, timeout=settings.SCRAPING_TIMEOUT)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Encontra lista de papéis
            select = soup.find('select', {'name': 'papel'})
            if not select:
                return []

            options = select.find_all('option')
            tickers = [opt.get('value') for opt in options if opt.get('value')]

            return tickers

        except Exception as e:
            logger.error(f"Erro ao coletar lista de tickers do Fundamentus: {str(e)}")
            return []
