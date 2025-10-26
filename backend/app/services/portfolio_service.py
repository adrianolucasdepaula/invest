"""
Serviço de Gerenciamento de Portfólio
Suporta múltiplos mercados e tipos de ativos
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import pandas as pd
from loguru import logger
from sqlalchemy.orm import Session


class PortfolioService:
    """
    Serviço para gerenciamento de portfólios multi-mercado
    """

    def __init__(self, db: Session):
        self.db = db

    async def import_portfolio(
        self,
        source: str,
        file_path: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Importa portfólio de diferentes fontes

        Args:
            source: Fonte (kinvo, investidor10, b3, myprofit, nuinvest, binance)
            file_path: Caminho do arquivo de importação
            data: Dados já processados

        Returns:
            Portfólio importado
        """
        logger.info(f"Importando portfólio de {source}")

        if source == "kinvo":
            return await self._import_kinvo(file_path, data)
        elif source == "investidor10":
            return await self._import_investidor10(file_path, data)
        elif source == "b3":
            return await self._import_b3(file_path, data)
        elif source == "myprofit":
            return await self._import_myprofit(file_path, data)
        elif source == "nuinvest":
            return await self._import_nuinvest(file_path, data)
        elif source == "binance":
            return await self._import_binance(file_path, data)
        else:
            raise ValueError(f"Fonte não suportada: {source}")

    async def _import_kinvo(
        self,
        file_path: Optional[str],
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Importa portfólio do Kinvo

        Kinvo exporta em Excel com múltiplas abas:
        - Ações
        - FIIs
        - Renda Fixa
        - Fundos
        - Tesouro Direto
        - Criptomoedas
        """
        if not file_path and not data:
            raise ValueError("file_path ou data deve ser fornecido")

        portfolio = {
            "source": "kinvo",
            "positions": [],
            "summary": {},
            "imported_at": datetime.utcnow().isoformat()
        }

        if file_path:
            # Lê arquivo Excel
            xls = pd.ExcelFile(file_path)

            # Processa cada aba
            for sheet_name in xls.sheet_names:
                df = pd.read_excel(xls, sheet_name=sheet_name)
                positions = self._parse_kinvo_sheet(sheet_name, df)
                portfolio["positions"].extend(positions)

        # Calcula summary
        portfolio["summary"] = self._calculate_portfolio_summary(portfolio["positions"])

        return portfolio

    def _parse_kinvo_sheet(self, sheet_name: str, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Parseia uma aba do Excel do Kinvo

        Args:
            sheet_name: Nome da aba
            df: DataFrame com dados

        Returns:
            Lista de posições
        """
        positions = []

        # Mapeamento de tipo de ativo baseado no nome da aba
        asset_type_map = {
            "Ações": "stock",
            "FIIs": "fii",
            "Renda Fixa": "fixed_income",
            "Fundos": "fund",
            "Tesouro Direto": "treasury",
            "Criptomoedas": "crypto",
            "BDRs": "bdr",
        }

        asset_type = asset_type_map.get(sheet_name, "other")

        for _, row in df.iterrows():
            try:
                position = {
                    "ticker": row.get("Código", row.get("Ativo", "")),
                    "name": row.get("Nome", ""),
                    "asset_type": asset_type,
                    "quantity": float(row.get("Quantidade", 0)),
                    "average_price": float(row.get("Preço Médio", 0)),
                    "current_price": float(row.get("Cotação Atual", 0)),
                    "invested_amount": float(row.get("Valor Investido", 0)),
                    "current_amount": float(row.get("Valor Atual", 0)),
                    "profit_loss": float(row.get("Lucro/Prejuízo", 0)),
                    "profit_loss_percentage": float(row.get("Rentabilidade %", 0)),
                }
                positions.append(position)
            except Exception as e:
                logger.warning(f"Erro ao parsear linha do Kinvo: {str(e)}")
                continue

        return positions

    async def _import_b3(
        self,
        file_path: Optional[str],
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Importa portfólio da B3

        B3 exporta notas de corretagem e extrato de posição
        """
        portfolio = {
            "source": "b3",
            "positions": [],
            "transactions": [],
            "imported_at": datetime.utcnow().isoformat()
        }

        if file_path:
            # Detecta tipo de arquivo (nota de corretagem ou extrato)
            if "nota" in file_path.lower():
                portfolio["transactions"] = self._parse_b3_trading_note(file_path)
            else:
                portfolio["positions"] = self._parse_b3_position_extract(file_path)

        return portfolio

    def _parse_b3_trading_note(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parseia nota de corretagem da B3

        Args:
            file_path: Caminho do arquivo

        Returns:
            Lista de transações
        """
        # Implementar parser específico para notas de corretagem
        transactions = []
        # TODO: Implementar leitura de PDF ou TXT da nota de corretagem
        return transactions

    def _parse_b3_position_extract(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parseia extrato de posição da B3

        Args:
            file_path: Caminho do arquivo

        Returns:
            Lista de posições
        """
        positions = []

        try:
            df = pd.read_excel(file_path) if file_path.endswith('.xlsx') else pd.read_csv(file_path)

            for _, row in df.iterrows():
                position = {
                    "ticker": row.get("Código de Negociação"),
                    "name": row.get("Empresa"),
                    "asset_type": self._detect_b3_asset_type(row.get("Tipo de Ativo")),
                    "quantity": float(row.get("Quantidade", 0)),
                    "current_price": float(row.get("Preço Unitário", 0)),
                }
                positions.append(position)

        except Exception as e:
            logger.error(f"Erro ao parsear extrato B3: {str(e)}")

        return positions

    def _detect_b3_asset_type(self, type_str: str) -> str:
        """Detecta tipo de ativo baseado na string"""
        if not type_str:
            return "other"

        type_str = type_str.lower()
        if "ação" in type_str or "on" in type_str or "pn" in type_str:
            return "stock"
        elif "fii" in type_str or "fundo imobiliário" in type_str:
            return "fii"
        elif "bdr" in type_str:
            return "bdr"
        elif "opção" in type_str or "call" in type_str or "put" in type_str:
            return "option"
        return "other"

    async def _import_binance(
        self,
        file_path: Optional[str],
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Importa portfólio da Binance (criptomoedas)

        Binance exporta em CSV
        """
        portfolio = {
            "source": "binance",
            "positions": [],
            "imported_at": datetime.utcnow().isoformat()
        }

        if file_path:
            df = pd.read_csv(file_path)

            for _, row in df.iterrows():
                position = {
                    "ticker": row.get("Coin", row.get("Asset")),
                    "asset_type": "crypto",
                    "quantity": float(row.get("Amount", row.get("Free", 0))),
                    "current_price": float(row.get("Price", 0)),
                    "current_amount": float(row.get("Value", 0)),
                }
                portfolio["positions"].append(position)

        return portfolio

    async def _import_myprofit(
        self,
        file_path: Optional[str],
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Importa portfólio do MyProfit
        """
        # Implementar parser específico do MyProfit
        return {
            "source": "myprofit",
            "positions": [],
            "imported_at": datetime.utcnow().isoformat()
        }

    async def _import_investidor10(
        self,
        file_path: Optional[str],
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Importa portfólio do Investidor10
        """
        # Implementar parser específico do Investidor10
        return {
            "source": "investidor10",
            "positions": [],
            "imported_at": datetime.utcnow().isoformat()
        }

    async def _import_nuinvest(
        self,
        file_path: Optional[str],
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Importa portfólio do NuInvest
        """
        # Implementar parser específico do NuInvest
        return {
            "source": "nuinvest",
            "positions": [],
            "imported_at": datetime.utcnow().isoformat()
        }

    def _calculate_portfolio_summary(self, positions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calcula sumário do portfólio

        Args:
            positions: Lista de posições

        Returns:
            Sumário consolidado
        """
        if not positions:
            return {}

        total_invested = sum(p.get("invested_amount", 0) for p in positions)
        total_current = sum(p.get("current_amount", 0) for p in positions)
        total_profit_loss = total_current - total_invested

        # Agrupa por tipo de ativo
        by_asset_type = {}
        for position in positions:
            asset_type = position.get("asset_type", "other")
            if asset_type not in by_asset_type:
                by_asset_type[asset_type] = {
                    "count": 0,
                    "invested": 0,
                    "current": 0,
                }

            by_asset_type[asset_type]["count"] += 1
            by_asset_type[asset_type]["invested"] += position.get("invested_amount", 0)
            by_asset_type[asset_type]["current"] += position.get("current_amount", 0)

        return {
            "total_positions": len(positions),
            "total_invested": total_invested,
            "total_current": total_current,
            "total_profit_loss": total_profit_loss,
            "total_return_percentage": (total_profit_loss / total_invested * 100) if total_invested > 0 else 0,
            "by_asset_type": by_asset_type,
        }

    def calculate_annualized_return(self, returns: List[float], days: int) -> float:
        """
        Calcula retorno anualizado

        Args:
            returns: Lista de retornos diários (em decimal, ex: 0.05 = 5%)
            days: Número de dias do período

        Returns:
            Retorno anualizado (%)
        """
        if not returns or days == 0:
            return 0.0

        total_return = sum(returns)
        annualized = (1 + total_return) ** (252 / days) - 1  # 252 dias úteis/ano
        return annualized * 100

    def calculate_volatility(self, returns: List[float]) -> float:
        """
        Calcula volatilidade (desvio padrão dos retornos)

        Args:
            returns: Lista de retornos diários

        Returns:
            Volatilidade anualizada (%)
        """
        if not returns or len(returns) < 2:
            return 0.0

        import numpy as np
        daily_volatility = np.std(returns)
        annualized_volatility = daily_volatility * np.sqrt(252)  # Anualiza
        return annualized_volatility * 100

    def calculate_sharpe_ratio(
        self,
        returns: List[float],
        risk_free_rate: float = 0.1075  # CDI aproximado 10.75% ao ano
    ) -> float:
        """
        Calcula Sharpe Ratio (retorno ajustado pelo risco)

        Args:
            returns: Lista de retornos diários
            risk_free_rate: Taxa livre de risco anualizada (CDI)

        Returns:
            Sharpe Ratio
        """
        if not returns or len(returns) < 2:
            return 0.0

        import numpy as np

        excess_returns = [r - (risk_free_rate / 252) for r in returns]  # Excesso sobre CDI
        mean_excess = np.mean(excess_returns)
        std_excess = np.std(excess_returns)

        if std_excess == 0:
            return 0.0

        sharpe = mean_excess / std_excess * np.sqrt(252)  # Anualizado
        return round(sharpe, 2)

    def calculate_max_drawdown(self, prices: List[float]) -> float:
        """
        Calcula Maximum Drawdown (maior queda do pico ao vale)

        Args:
            prices: Lista de valores do portfólio ao longo do tempo

        Returns:
            Max drawdown (%)
        """
        if not prices or len(prices) < 2:
            return 0.0

        import numpy as np

        prices_arr = np.array(prices)
        peak = np.maximum.accumulate(prices_arr)
        drawdown = (prices_arr - peak) / peak
        max_dd = np.min(drawdown)

        return abs(max_dd * 100)  # Retorna como % positivo

    def calculate_win_rate(self, trades: List[Dict[str, Any]]) -> float:
        """
        Calcula taxa de acerto (win rate)

        Args:
            trades: Lista de operações com profit_loss

        Returns:
            Win rate (%)
        """
        if not trades:
            return 0.0

        winning_trades = sum(1 for t in trades if t.get("profit_loss", 0) > 0)
        total_trades = len(trades)

        return (winning_trades / total_trades * 100) if total_trades > 0 else 0.0

    async def save_portfolio(self, portfolio_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Salva portfólio no database

        Args:
            portfolio_data: Dados do portfólio

        Returns:
            Portfólio salvo com ID
        """
        from ..models.portfolio import Portfolio as PortfolioModel

        try:
            portfolio = PortfolioModel(
                name=portfolio_data.get("name"),
                description=portfolio_data.get("description"),
                currency=portfolio_data.get("currency", "BRL"),
                user_id=portfolio_data.get("user_id"),  # TODO: Implementar autenticação
            )

            self.db.add(portfolio)
            self.db.commit()
            self.db.refresh(portfolio)

            logger.info(f"Portfólio '{portfolio.name}' salvo com ID {portfolio.id}")

            return {
                "id": portfolio.id,
                "name": portfolio.name,
                "description": portfolio.description,
                "currency": portfolio.currency,
                "created_at": portfolio.created_at.isoformat() if portfolio.created_at else None,
                "updated_at": portfolio.updated_at.isoformat() if portfolio.updated_at else None,
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao salvar portfólio: {str(e)}")
            raise

    async def get_portfolio(self, portfolio_id: int) -> Optional[Dict[str, Any]]:
        """
        Busca portfólio do database

        Args:
            portfolio_id: ID do portfólio

        Returns:
            Dados do portfólio ou None
        """
        from ..models.portfolio import Portfolio as PortfolioModel

        try:
            portfolio = self.db.query(PortfolioModel).filter(
                PortfolioModel.id == portfolio_id
            ).first()

            if not portfolio:
                return None

            return {
                "id": portfolio.id,
                "name": portfolio.name,
                "description": portfolio.description,
                "currency": portfolio.currency,
                "created_at": portfolio.created_at.isoformat() if portfolio.created_at else None,
                "updated_at": portfolio.updated_at.isoformat() if portfolio.updated_at else None,
            }

        except Exception as e:
            logger.error(f"Erro ao buscar portfólio {portfolio_id}: {str(e)}")
            raise

    async def delete_portfolio(self, portfolio_id: int) -> bool:
        """
        Remove portfólio do database

        Args:
            portfolio_id: ID do portfólio

        Returns:
            True se removido com sucesso
        """
        from ..models.portfolio import Portfolio as PortfolioModel

        try:
            portfolio = self.db.query(PortfolioModel).filter(
                PortfolioModel.id == portfolio_id
            ).first()

            if not portfolio:
                return False

            self.db.delete(portfolio)
            self.db.commit()

            logger.info(f"Portfólio {portfolio_id} removido com sucesso")
            return True

        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao remover portfólio {portfolio_id}: {str(e)}")
            raise

    async def consolidate_portfolios(
        self,
        portfolios: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Consolida múltiplos portfólios em um único

        Args:
            portfolios: Lista de portfólios de diferentes fontes

        Returns:
            Portfólio consolidado
        """
        consolidated = {
            "sources": [p["source"] for p in portfolios],
            "positions": [],
            "summary": {},
            "consolidated_at": datetime.utcnow().isoformat()
        }

        # Consolida posições
        position_map = {}  # ticker -> position

        for portfolio in portfolios:
            for position in portfolio.get("positions", []):
                ticker = position.get("ticker")
                if not ticker:
                    continue

                if ticker not in position_map:
                    position_map[ticker] = position
                else:
                    # Merge positions do mesmo ticker
                    existing = position_map[ticker]
                    existing["quantity"] += position.get("quantity", 0)
                    existing["invested_amount"] = existing.get("invested_amount", 0) + position.get("invested_amount", 0)
                    existing["current_amount"] = existing.get("current_amount", 0) + position.get("current_amount", 0)

        consolidated["positions"] = list(position_map.values())
        consolidated["summary"] = self._calculate_portfolio_summary(consolidated["positions"])

        return consolidated
