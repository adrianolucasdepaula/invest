"""
Portfolio Parsers - Importação de diferentes fontes

Suporta:
- MyProfit (CSV)
- Investidor10 (CSV/Excel)
- NuInvest (JSON)
- CEI (CSV/PDF)
- Clear (CSV)
"""
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
from datetime import datetime
import json
import csv
import io
from loguru import logger


class PortfolioParser(ABC):
    """Classe base abstrata para parsers de portfólio"""

    def __init__(self, source: str):
        self.source = source
        logger.info(f"Parser {self.__class__.__name__} inicializado para fonte: {source}")

    @abstractmethod
    def parse(self, data: Any) -> Dict[str, Any]:
        """
        Parse dos dados da fonte para formato padronizado

        Args:
            data: Dados brutos da fonte (pode ser string, dict, bytes)

        Returns:
            {
                "name": str,
                "description": str,
                "positions": List[Dict],
                "currency": str,
                "imported_at": str,
                "source": str,
                "metadata": Dict
            }
        """
        pass

    def _validate_position(self, position: Dict[str, Any]) -> bool:
        """Valida se uma posição tem os campos obrigatórios"""
        required_fields = ["ticker", "quantity", "average_price"]

        for field in required_fields:
            if field not in position:
                logger.warning(f"Posição inválida - campo '{field}' ausente: {position}")
                return False

            if position[field] is None:
                logger.warning(f"Posição inválida - campo '{field}' é None: {position}")
                return False

        # Validar tipos
        try:
            float(position["quantity"])
            float(position["average_price"])
        except (ValueError, TypeError):
            logger.warning(f"Posição inválida - valores não numéricos: {position}")
            return False

        return True

    def _standardize_ticker(self, ticker: str) -> str:
        """Padroniza ticker (uppercase, remove espaços)"""
        return ticker.strip().upper()

    def _parse_float(self, value: Any, default: float = 0.0) -> float:
        """Parse seguro de float"""
        try:
            if isinstance(value, str):
                # Remove R$, pontos de milhar, substitui vírgula por ponto
                value = value.replace("R$", "").replace(".", "").replace(",", ".").strip()
            return float(value)
        except (ValueError, TypeError, AttributeError):
            logger.warning(f"Não foi possível converter '{value}' para float, usando {default}")
            return default


class MyProfitParser(PortfolioParser):
    """Parser para arquivos CSV do MyProfit"""

    def parse(self, data: Any) -> Dict[str, Any]:
        """
        Parse de CSV do MyProfit

        Formato esperado (CSV):
        Ticker,Quantidade,Preço Médio,Preço Atual,Valor Total,Rentabilidade
        PETR4,100,28.50,30.00,3000.00,5.26
        VALE3,50,65.00,68.00,3400.00,4.62
        """
        logger.info(f"Iniciando parse MyProfit - tipo de dados: {type(data)}")

        try:
            # Se data é dict com campo 'content' ou 'data'
            if isinstance(data, dict):
                csv_content = data.get("content") or data.get("data") or data.get("csv")
                if not csv_content:
                    raise ValueError("Dict não contém 'content', 'data' ou 'csv'")
                data = csv_content

            # Se data é bytes, decodificar
            if isinstance(data, bytes):
                data = data.decode("utf-8")

            # Parse CSV
            positions = []
            csv_reader = csv.DictReader(io.StringIO(data))

            for row_num, row in enumerate(csv_reader, start=1):
                try:
                    # MyProfit pode ter colunas em português
                    ticker = row.get("Ticker") or row.get("ticker") or row.get("Ativo")
                    quantity = row.get("Quantidade") or row.get("quantity") or row.get("Qtd")
                    avg_price = row.get("Preço Médio") or row.get("average_price") or row.get("PM")
                    current_price = row.get("Preço Atual") or row.get("current_price") or row.get("Preço")

                    if not ticker or not quantity or not avg_price:
                        logger.warning(f"Linha {row_num} ignorada - campos obrigatórios faltando: {row}")
                        continue

                    position = {
                        "ticker": self._standardize_ticker(ticker),
                        "quantity": self._parse_float(quantity),
                        "average_price": self._parse_float(avg_price),
                        "current_price": self._parse_float(current_price) if current_price else None,
                        "asset_type": self._detect_asset_type(ticker)
                    }

                    if self._validate_position(position):
                        positions.append(position)
                        logger.info(f"Posição {position['ticker']} parseada com sucesso")

                except Exception as e:
                    logger.error(f"Erro ao processar linha {row_num}: {str(e)}")
                    continue

            logger.info(f"MyProfit: {len(positions)} posições parseadas com sucesso")

            return {
                "name": f"Portfólio MyProfit - {datetime.now().strftime('%d/%m/%Y')}",
                "description": "Importado do MyProfit",
                "positions": positions,
                "currency": "BRL",
                "imported_at": datetime.utcnow().isoformat(),
                "source": "myprofit",
                "metadata": {
                    "total_positions": len(positions),
                    "parser_version": "1.0"
                }
            }

        except Exception as e:
            logger.error(f"Erro ao fazer parse MyProfit: {str(e)}")
            raise ValueError(f"Erro ao processar dados do MyProfit: {str(e)}")

    def _detect_asset_type(self, ticker: str) -> str:
        """Detecta tipo de ativo baseado no ticker"""
        ticker = ticker.upper()

        if ticker.endswith("11"):
            return "fii"
        elif ticker.endswith(("3", "4", "5", "6", "8")):
            return "stock"
        elif "BTC" in ticker or "ETH" in ticker or "USDT" in ticker:
            return "crypto"
        else:
            return "other"


class Investidor10Parser(PortfolioParser):
    """Parser para arquivos CSV/Excel do Investidor10"""

    def parse(self, data: Any) -> Dict[str, Any]:
        """
        Parse de CSV/Excel do Investidor10

        Formato esperado (CSV):
        Ativo,Qtd,PM,Cotação,Valor,Rent. (%)
        PETR4,100,28.50,30.00,R$ 3.000,00,5.26%
        VALE3,50,65.00,68.00,R$ 3.400,00,4.62%
        """
        logger.info(f"Iniciando parse Investidor10 - tipo de dados: {type(data)}")

        try:
            # Se data é dict
            if isinstance(data, dict):
                csv_content = data.get("content") or data.get("data") or data.get("csv")
                if not csv_content:
                    raise ValueError("Dict não contém 'content', 'data' ou 'csv'")
                data = csv_content

            # Se data é bytes, decodificar
            if isinstance(data, bytes):
                data = data.decode("utf-8")

            # Parse CSV
            positions = []
            # Investidor10 pode usar ; como separador
            delimiter = ";" if ";" in data[:200] else ","
            csv_reader = csv.DictReader(io.StringIO(data), delimiter=delimiter)

            for row_num, row in enumerate(csv_reader, start=1):
                try:
                    # Investidor10 usa abreviações
                    ticker = row.get("Ativo") or row.get("Ticker") or row.get("ticker")
                    quantity = row.get("Qtd") or row.get("Quantidade") or row.get("quantity")
                    avg_price = row.get("PM") or row.get("Preço Médio") or row.get("average_price")
                    current_price = row.get("Cotação") or row.get("Preço") or row.get("current_price")

                    if not ticker or not quantity or not avg_price:
                        logger.warning(f"Linha {row_num} ignorada - campos faltando: {row}")
                        continue

                    position = {
                        "ticker": self._standardize_ticker(ticker),
                        "quantity": self._parse_float(quantity),
                        "average_price": self._parse_float(avg_price),
                        "current_price": self._parse_float(current_price) if current_price else None,
                        "asset_type": self._detect_asset_type(ticker)
                    }

                    if self._validate_position(position):
                        positions.append(position)
                        logger.info(f"Posição {position['ticker']} parseada com sucesso")

                except Exception as e:
                    logger.error(f"Erro ao processar linha {row_num}: {str(e)}")
                    continue

            logger.info(f"Investidor10: {len(positions)} posições parseadas com sucesso")

            return {
                "name": f"Portfólio Investidor10 - {datetime.now().strftime('%d/%m/%Y')}",
                "description": "Importado do Investidor10",
                "positions": positions,
                "currency": "BRL",
                "imported_at": datetime.utcnow().isoformat(),
                "source": "investidor10",
                "metadata": {
                    "total_positions": len(positions),
                    "parser_version": "1.0",
                    "delimiter": delimiter
                }
            }

        except Exception as e:
            logger.error(f"Erro ao fazer parse Investidor10: {str(e)}")
            raise ValueError(f"Erro ao processar dados do Investidor10: {str(e)}")

    def _detect_asset_type(self, ticker: str) -> str:
        """Detecta tipo de ativo baseado no ticker"""
        ticker = ticker.upper()

        if ticker.endswith("11"):
            return "fii"
        elif ticker.endswith(("3", "4", "5", "6", "8")):
            return "stock"
        else:
            return "other"


class NuInvestParser(PortfolioParser):
    """Parser para JSON do Nu Invest"""

    def parse(self, data: Any) -> Dict[str, Any]:
        """
        Parse de JSON do Nu Invest

        Formato esperado (JSON):
        {
            "portfolio": {
                "positions": [
                    {
                        "ticker": "PETR4",
                        "quantity": 100,
                        "averagePrice": 28.50,
                        "currentPrice": 30.00
                    }
                ]
            }
        }
        """
        logger.info(f"Iniciando parse NuInvest - tipo de dados: {type(data)}")

        try:
            # Se data é string, fazer parse JSON
            if isinstance(data, str):
                data = json.loads(data)

            # Se data é bytes, decodificar e fazer parse
            if isinstance(data, bytes):
                data = json.loads(data.decode("utf-8"))

            # Validar estrutura
            if not isinstance(data, dict):
                raise ValueError("Dados devem ser um objeto JSON")

            # Nu Invest pode ter diferentes estruturas
            positions_data = (
                data.get("portfolio", {}).get("positions") or
                data.get("positions") or
                data.get("assets") or
                []
            )

            if not isinstance(positions_data, list):
                raise ValueError("Campo 'positions' deve ser uma lista")

            positions = []

            for idx, pos_data in enumerate(positions_data):
                try:
                    # Nu Invest usa camelCase
                    ticker = pos_data.get("ticker") or pos_data.get("symbol") or pos_data.get("asset")
                    quantity = pos_data.get("quantity") or pos_data.get("qty") or pos_data.get("shares")
                    avg_price = (
                        pos_data.get("averagePrice") or
                        pos_data.get("average_price") or
                        pos_data.get("avgPrice") or
                        pos_data.get("costBasis")
                    )
                    current_price = pos_data.get("currentPrice") or pos_data.get("current_price") or pos_data.get("price")

                    if not ticker or quantity is None or avg_price is None:
                        logger.warning(f"Posição {idx} ignorada - campos faltando: {pos_data}")
                        continue

                    position = {
                        "ticker": self._standardize_ticker(str(ticker)),
                        "quantity": float(quantity),
                        "average_price": float(avg_price),
                        "current_price": float(current_price) if current_price else None,
                        "asset_type": self._detect_asset_type(str(ticker))
                    }

                    if self._validate_position(position):
                        positions.append(position)
                        logger.info(f"Posição {position['ticker']} parseada com sucesso")

                except Exception as e:
                    logger.error(f"Erro ao processar posição {idx}: {str(e)}")
                    continue

            logger.info(f"NuInvest: {len(positions)} posições parseadas com sucesso")

            # Extrair nome do portfólio se disponível
            portfolio_name = data.get("portfolio", {}).get("name") or data.get("name")

            return {
                "name": portfolio_name or f"Portfólio Nu Invest - {datetime.now().strftime('%d/%m/%Y')}",
                "description": "Importado do Nu Invest",
                "positions": positions,
                "currency": "BRL",
                "imported_at": datetime.utcnow().isoformat(),
                "source": "nuinvest",
                "metadata": {
                    "total_positions": len(positions),
                    "parser_version": "1.0",
                    "original_data_keys": list(data.keys())
                }
            }

        except json.JSONDecodeError as e:
            logger.error(f"Erro ao decodificar JSON do Nu Invest: {str(e)}")
            raise ValueError(f"JSON inválido do Nu Invest: {str(e)}")
        except Exception as e:
            logger.error(f"Erro ao fazer parse Nu Invest: {str(e)}")
            raise ValueError(f"Erro ao processar dados do Nu Invest: {str(e)}")

    def _detect_asset_type(self, ticker: str) -> str:
        """Detecta tipo de ativo baseado no ticker"""
        ticker = ticker.upper()

        if ticker.endswith("11"):
            return "fii"
        elif ticker.endswith(("3", "4", "5", "6", "8")):
            return "stock"
        elif "BTC" in ticker or "ETH" in ticker:
            return "crypto"
        else:
            return "other"


class CEIParser(PortfolioParser):
    """Parser para CSV do CEI (Canal Eletrônico do Investidor)"""

    def parse(self, data: Any) -> Dict[str, Any]:
        """
        Parse de CSV do CEI

        Formato esperado (CSV):
        Empresa,Código de Negociação,Quantidade,Valor
        PETROBRAS PN,PETR4,100,2850.00
        VALE ON,VALE3,50,3250.00
        """
        logger.info(f"Iniciando parse CEI - tipo de dados: {type(data)}")

        try:
            if isinstance(data, dict):
                csv_content = data.get("content") or data.get("data") or data.get("csv")
                if not csv_content:
                    raise ValueError("Dict não contém 'content', 'data' ou 'csv'")
                data = csv_content

            if isinstance(data, bytes):
                data = data.decode("utf-8")

            positions = []
            # CEI usa ; como separador
            delimiter = ";" if ";" in data[:200] else ","
            csv_reader = csv.DictReader(io.StringIO(data), delimiter=delimiter)

            for row_num, row in enumerate(csv_reader, start=1):
                try:
                    ticker = (
                        row.get("Código de Negociação") or
                        row.get("Ticker") or
                        row.get("Código")
                    )
                    quantity = row.get("Quantidade") or row.get("Qtd")
                    value = row.get("Valor") or row.get("Preço")

                    if not ticker or not quantity:
                        logger.warning(f"Linha {row_num} ignorada: {row}")
                        continue

                    # CEI às vezes tem valor total, não preço médio
                    # Calcular PM se necessário
                    qty = self._parse_float(quantity)
                    val = self._parse_float(value)

                    # Se valor > 1000 e quantidade < 100, provavelmente é valor total
                    if val > 1000 and qty < 100 and qty > 0:
                        avg_price = val / qty
                    else:
                        avg_price = val

                    position = {
                        "ticker": self._standardize_ticker(ticker),
                        "quantity": qty,
                        "average_price": avg_price,
                        "current_price": None,
                        "asset_type": self._detect_asset_type(ticker)
                    }

                    if self._validate_position(position):
                        positions.append(position)
                        logger.info(f"Posição {position['ticker']} parseada com sucesso")

                except Exception as e:
                    logger.error(f"Erro ao processar linha {row_num}: {str(e)}")
                    continue

            logger.info(f"CEI: {len(positions)} posições parseadas com sucesso")

            return {
                "name": f"Portfólio CEI - {datetime.now().strftime('%d/%m/%Y')}",
                "description": "Importado do Canal Eletrônico do Investidor (CEI)",
                "positions": positions,
                "currency": "BRL",
                "imported_at": datetime.utcnow().isoformat(),
                "source": "cei",
                "metadata": {
                    "total_positions": len(positions),
                    "parser_version": "1.0",
                    "delimiter": delimiter
                }
            }

        except Exception as e:
            logger.error(f"Erro ao fazer parse CEI: {str(e)}")
            raise ValueError(f"Erro ao processar dados do CEI: {str(e)}")

    def _detect_asset_type(self, ticker: str) -> str:
        """Detecta tipo de ativo baseado no ticker"""
        ticker = ticker.upper()

        if ticker.endswith("11"):
            return "fii"
        elif ticker.endswith(("3", "4", "5", "6", "8")):
            return "stock"
        else:
            return "other"


class ClearParser(PortfolioParser):
    """Parser para CSV da Clear Corretora"""

    def parse(self, data: Any) -> Dict[str, Any]:
        """
        Parse de CSV da Clear

        Formato esperado (CSV):
        Ativo,Quantidade,Preço Médio,Posição
        PETR4,100,28.50,2850.00
        VALE3,50,65.00,3250.00
        """
        logger.info(f"Iniciando parse Clear - tipo de dados: {type(data)}")

        try:
            if isinstance(data, dict):
                csv_content = data.get("content") or data.get("data") or data.get("csv")
                if not csv_content:
                    raise ValueError("Dict não contém 'content', 'data' ou 'csv'")
                data = csv_content

            if isinstance(data, bytes):
                data = data.decode("utf-8")

            positions = []
            delimiter = ";" if ";" in data[:200] else ","
            csv_reader = csv.DictReader(io.StringIO(data), delimiter=delimiter)

            for row_num, row in enumerate(csv_reader, start=1):
                try:
                    ticker = row.get("Ativo") or row.get("Ticker")
                    quantity = row.get("Quantidade") or row.get("Qtd")
                    avg_price = row.get("Preço Médio") or row.get("PM")

                    if not ticker or not quantity or not avg_price:
                        logger.warning(f"Linha {row_num} ignorada: {row}")
                        continue

                    position = {
                        "ticker": self._standardize_ticker(ticker),
                        "quantity": self._parse_float(quantity),
                        "average_price": self._parse_float(avg_price),
                        "current_price": None,
                        "asset_type": self._detect_asset_type(ticker)
                    }

                    if self._validate_position(position):
                        positions.append(position)
                        logger.info(f"Posição {position['ticker']} parseada com sucesso")

                except Exception as e:
                    logger.error(f"Erro ao processar linha {row_num}: {str(e)}")
                    continue

            logger.info(f"Clear: {len(positions)} posições parseadas com sucesso")

            return {
                "name": f"Portfólio Clear - {datetime.now().strftime('%d/%m/%Y')}",
                "description": "Importado da Clear Corretora",
                "positions": positions,
                "currency": "BRL",
                "imported_at": datetime.utcnow().isoformat(),
                "source": "clear",
                "metadata": {
                    "total_positions": len(positions),
                    "parser_version": "1.0",
                    "delimiter": delimiter
                }
            }

        except Exception as e:
            logger.error(f"Erro ao fazer parse Clear: {str(e)}")
            raise ValueError(f"Erro ao processar dados da Clear: {str(e)}")

    def _detect_asset_type(self, ticker: str) -> str:
        """Detecta tipo de ativo baseado no ticker"""
        ticker = ticker.upper()

        if ticker.endswith("11"):
            return "fii"
        elif ticker.endswith(("3", "4", "5", "6", "8")):
            return "stock"
        else:
            return "other"


class ParserFactory:
    """Factory para criar parsers baseado na fonte"""

    _parsers = {
        "myprofit": MyProfitParser,
        "investidor10": Investidor10Parser,
        "nuinvest": NuInvestParser,
        "cei": CEIParser,
        "clear": ClearParser,
    }

    @classmethod
    def create_parser(cls, source: str) -> PortfolioParser:
        """
        Cria parser apropriado para a fonte

        Args:
            source: Nome da fonte (myprofit, investidor10, nuinvest, cei, clear)

        Returns:
            Instância do parser

        Raises:
            ValueError: Se fonte não for suportada
        """
        source_lower = source.lower()

        if source_lower not in cls._parsers:
            supported = ", ".join(cls._parsers.keys())
            logger.error(f"Fonte '{source}' não suportada. Fontes disponíveis: {supported}")
            raise ValueError(f"Fonte '{source}' não suportada. Fontes disponíveis: {supported}")

        parser_class = cls._parsers[source_lower]
        logger.info(f"Parser criado: {parser_class.__name__} para fonte '{source}'")

        return parser_class(source)

    @classmethod
    def get_supported_sources(cls) -> List[str]:
        """Retorna lista de fontes suportadas"""
        return list(cls._parsers.keys())
