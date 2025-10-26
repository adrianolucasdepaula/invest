"""
Scraper para calendário econômico
Coleta eventos econômicos de múltiplas fontes
Usa Investing.com como fonte principal
"""
from typing import Dict, Any, List
from bs4 import BeautifulSoup
import requests
from loguru import logger
from ..base import BaseScraper
from ...core.config import settings
from datetime import datetime, timedelta


class EconomicCalendarScraper(BaseScraper):
    """
    Scraper para calendário econômico
    """

    def __init__(self):
        super().__init__(source_name="economic_calendar", requires_auth=False)
        self.base_url = "https://br.investing.com"
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

    async def collect_data(self, **kwargs) -> Dict[str, Any]:
        """
        Coleta eventos do calendário econômico

        Args:
            **kwargs:
                - country: País (ex: 'brazil', 'united-states', 'world')
                - importance: Importância mínima (1-3, onde 3 é alta)
                - days: Número de dias a frente (default: 7)

        Returns:
            Dados do calendário econômico
        """
        self._respect_rate_limit()

        country = kwargs.get('country', 'brazil')
        importance = kwargs.get('importance', 2)
        days = kwargs.get('days', 7)

        try:
            # Acessa calendário econômico
            url = f"{self.base_url}/economic-calendar/"

            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            # Parse HTML
            soup = BeautifulSoup(response.content, 'html.parser')

            # Extrai eventos
            events = self._extract_events(soup, country, importance, days)

            data = {
                'source': 'economic_calendar',
                'country': country,
                'importance_filter': importance,
                'days_ahead': days,
                'events_count': len(events),
                'events': events,
                'collected_at': datetime.now().isoformat(),
            }

            return data

        except Exception as e:
            logger.error(f"Erro ao coletar calendário econômico: {str(e)}")
            raise

    def _extract_events(self, soup: BeautifulSoup, country: str, min_importance: int, days: int) -> List[Dict[str, Any]]:
        """Extrai eventos do calendário"""
        events = []

        try:
            # Investing.com usa tabela para o calendário
            table = soup.find('table', id=lambda x: x and 'economicCalendarData' in x if x else False)
            if not table:
                table = soup.find('table', class_=lambda c: c and 'economic' in c.lower() if c else False)

            if table:
                rows = table.find_all('tr', class_=lambda c: c and 'js-event-item' in c if c else False)

                for row in rows[:100]:  # Limita a 100 eventos
                    try:
                        event = {}

                        # Data e hora
                        time_elem = row.find(['td'], class_=lambda c: c and 'time' in c.lower() if c else False)
                        if time_elem:
                            event['time'] = time_elem.get_text(strip=True)

                        # País
                        country_elem = row.find(['td'], class_=lambda c: c and 'flag' in c.lower() if c else False)
                        if country_elem:
                            flag_title = country_elem.find(['span'], attrs={'title': True})
                            if flag_title:
                                event['country'] = flag_title.get('title')

                        # Importância (1-3 estrelas)
                        importance_elem = row.find(['td'], class_=lambda c: c and 'sentiment' in c.lower() if c else False)
                        if importance_elem:
                            bulls = importance_elem.find_all(['i'], class_=lambda c: c and 'grayFullBullishIcon' in c if c else False)
                            event['importance'] = len(bulls)

                        # Nome do evento
                        event_elem = row.find(['td'], class_=lambda c: c and 'event' in c.lower() if c else False)
                        if event_elem:
                            event_link = event_elem.find('a')
                            if event_link:
                                event['name'] = event_link.get_text(strip=True)
                                event['url'] = self.base_url + event_link.get('href', '')

                        # Valores (anterior, consenso, atual)
                        actual_elem = row.find(['td'], attrs={'id': lambda x: x and 'eventActual' in x if x else False})
                        if actual_elem:
                            event['actual'] = actual_elem.get_text(strip=True)

                        forecast_elem = row.find(['td'], attrs={'id': lambda x: x and 'eventForecast' in x if x else False})
                        if forecast_elem:
                            event['forecast'] = forecast_elem.get_text(strip=True)

                        previous_elem = row.find(['td'], attrs={'id': lambda x: x and 'eventPrevious' in x if x else False})
                        if previous_elem:
                            event['previous'] = previous_elem.get_text(strip=True)

                        # Filtro de importância
                        if 'importance' in event and event['importance'] >= min_importance:
                            events.append(event)

                    except Exception as e:
                        logger.warning(f"Erro ao extrair evento individual: {str(e)}")
                        continue

        except Exception as e:
            logger.warning(f"Erro ao extrair eventos: {str(e)}")

        return events

    def get_required_fields(self) -> List[str]:
        """Campos obrigatórios"""
        return ['source']
