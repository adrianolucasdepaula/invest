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

    # ==================== MÉTODOS DE HISTÓRICO ====================

    async def save_snapshot(
        self,
        portfolio_id: int,
        snapshot_date: str,
        total_value: float,
        total_invested: float,
        positions: List[Dict[str, Any]],
        daily_return: Optional[float] = None,
        ibovespa_value: Optional[float] = None,
        cdi_accumulated: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Salva snapshot diário do portfólio para histórico

        Args:
            portfolio_id: ID do portfólio
            snapshot_date: Data do snapshot (YYYY-MM-DD)
            total_value: Valor total do portfólio
            total_invested: Total investido
            positions: Lista de posições
            daily_return: Retorno do dia (%)
            ibovespa_value: Valor do Ibovespa
            cdi_accumulated: CDI acumulado (%)

        Returns:
            Snapshot salvo
        """
        from ..models.portfolio_history import PortfolioHistory
        from datetime import datetime

        try:
            # Converter data string para date object
            date_obj = datetime.strptime(snapshot_date, "%Y-%m-%d").date()

            # Verificar se já existe snapshot para essa data
            existing = self.db.query(PortfolioHistory).filter(
                PortfolioHistory.portfolio_id == portfolio_id,
                PortfolioHistory.snapshot_date == date_obj
            ).first()

            if existing:
                # Atualizar snapshot existente
                existing.total_value = total_value
                existing.total_invested = total_invested
                existing.positions_snapshot = {p["ticker"]: p for p in positions}
                existing.daily_return = daily_return
                existing.ibovespa_value = ibovespa_value
                existing.cdi_accumulated = cdi_accumulated
                snapshot = existing
            else:
                # Criar novo snapshot
                snapshot = PortfolioHistory(
                    portfolio_id=portfolio_id,
                    snapshot_date=date_obj,
                    total_value=total_value,
                    total_invested=total_invested,
                    positions_snapshot={p["ticker"]: p for p in positions},
                    daily_return=daily_return,
                    ibovespa_value=ibovespa_value,
                    cdi_accumulated=cdi_accumulated,
                    accumulated_return=((total_value - total_invested) / total_invested * 100) if total_invested > 0 else 0,
                    accumulated_return_value=total_value - total_invested
                )
                self.db.add(snapshot)

            self.db.commit()
            self.db.refresh(snapshot)

            logger.info(f"Snapshot salvo para portfólio {portfolio_id} em {snapshot_date}")

            return {
                "id": snapshot.id,
                "portfolio_id": snapshot.portfolio_id,
                "snapshot_date": snapshot.snapshot_date.isoformat(),
                "total_value": snapshot.total_value,
                "daily_return": snapshot.daily_return,
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao salvar snapshot: {str(e)}")
            raise

    async def get_historical_data(
        self,
        portfolio_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        period: str = "1M"
    ) -> List[Dict[str, Any]]:
        """
        Busca dados históricos do portfólio

        Args:
            portfolio_id: ID do portfólio
            start_date: Data início (YYYY-MM-DD)
            end_date: Data fim (YYYY-MM-DD)
            period: Período (1D, 1W, 1M, 3M, 6M, 1Y, YTD, ALL)

        Returns:
            Lista de snapshots históricos
        """
        from ..models.portfolio_history import PortfolioHistory
        from datetime import datetime, timedelta

        try:
            # Calcular datas baseado no período
            end = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else datetime.now().date()

            if not start_date:
                period_map = {
                    "1D": 1,
                    "1W": 7,
                    "1M": 30,
                    "3M": 90,
                    "6M": 180,
                    "1Y": 365,
                    "YTD": (datetime.now() - datetime(datetime.now().year, 1, 1)).days,
                    "ALL": 3650  # 10 anos
                }
                days = period_map.get(period, 30)
                start = end - timedelta(days=days)
            else:
                start = datetime.strptime(start_date, "%Y-%m-%d").date()

            # Buscar snapshots
            snapshots = self.db.query(PortfolioHistory).filter(
                PortfolioHistory.portfolio_id == portfolio_id,
                PortfolioHistory.snapshot_date >= start,
                PortfolioHistory.snapshot_date <= end
            ).order_by(PortfolioHistory.snapshot_date).all()

            logger.info(f"Encontrados {len(snapshots)} snapshots para portfólio {portfolio_id}")

            return [
                {
                    "date": s.snapshot_date.isoformat(),
                    "total_value": s.total_value,
                    "total_invested": s.total_invested,
                    "daily_return": s.daily_return,
                    "accumulated_return": s.accumulated_return,
                    "ibovespa_value": s.ibovespa_value,
                    "cdi_accumulated": s.cdi_accumulated,
                }
                for s in snapshots
            ]

        except Exception as e:
            logger.error(f"Erro ao buscar dados históricos: {str(e)}")
            raise

    async def save_dividend(
        self,
        portfolio_id: int,
        ticker: str,
        value_per_share: float,
        total_shares: float,
        payment_date: str,
        dividend_type: str = "dividendo"
    ) -> Dict[str, Any]:
        """
        Salva dividendo recebido

        Args:
            portfolio_id: ID do portfólio
            ticker: Ticker do ativo
            value_per_share: Valor por ação
            total_shares: Quantidade de ações
            payment_date: Data de pagamento (YYYY-MM-DD)
            dividend_type: Tipo (dividendo, jcp, rendimento)

        Returns:
            Dividendo salvo
        """
        from ..models.portfolio_history import PortfolioDividend
        from datetime import datetime

        try:
            date_obj = datetime.strptime(payment_date, "%Y-%m-%d").date()
            total_value = value_per_share * total_shares

            dividend = PortfolioDividend(
                portfolio_id=portfolio_id,
                ticker=ticker,
                dividend_type=dividend_type,
                value_per_share=value_per_share,
                total_shares=total_shares,
                total_value=total_value,
                payment_date=date_obj,
                status="received"
            )

            self.db.add(dividend)
            self.db.commit()
            self.db.refresh(dividend)

            logger.info(f"Dividendo salvo: {ticker} - R$ {total_value:.2f}")

            return {
                "id": dividend.id,
                "ticker": dividend.ticker,
                "total_value": dividend.total_value,
                "payment_date": dividend.payment_date.isoformat(),
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao salvar dividendo: {str(e)}")
            raise

    async def get_dividends(
        self,
        portfolio_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        period: str = "1Y"
    ) -> Dict[str, Any]:
        """
        Busca dividendos recebidos por período

        Args:
            portfolio_id: ID do portfólio
            start_date: Data início (YYYY-MM-DD)
            end_date: Data fim (YYYY-MM-DD)
            period: Período (1M, 3M, 6M, 1Y, ALL)

        Returns:
            Dados de dividendos
        """
        from ..models.portfolio_history import PortfolioDividend
        from datetime import datetime, timedelta
        from collections import defaultdict

        try:
            # Calcular datas
            end = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else datetime.now().date()

            if not start_date:
                period_map = {
                    "1M": 30,
                    "3M": 90,
                    "6M": 180,
                    "1Y": 365,
                    "ALL": 3650
                }
                days = period_map.get(period, 365)
                start = end - timedelta(days=days)
            else:
                start = datetime.strptime(start_date, "%Y-%m-%d").date()

            # Buscar dividendos
            dividends = self.db.query(PortfolioDividend).filter(
                PortfolioDividend.portfolio_id == portfolio_id,
                PortfolioDividend.payment_date >= start,
                PortfolioDividend.payment_date <= end
            ).order_by(PortfolioDividend.payment_date).all()

            # Agrupar por ticker
            by_ticker = defaultdict(lambda: {"total": 0.0, "payments": 0, "dividends": []})

            total_received = 0.0
            for div in dividends:
                total_received += div.total_value
                by_ticker[div.ticker]["total"] += div.total_value
                by_ticker[div.ticker]["payments"] += 1
                by_ticker[div.ticker]["dividends"].append({
                    "date": div.payment_date.isoformat(),
                    "value": div.total_value,
                    "type": div.dividend_type
                })

            # Buscar portfólio para calcular yield
            portfolio = await self.get_portfolio(portfolio_id)
            total_invested = portfolio.get("total_invested", 0) if portfolio else 0
            dividend_yield = (total_received / total_invested * 100) if total_invested > 0 else 0

            # Calcular média mensal
            days_diff = (end - start).days
            months = max(days_diff / 30, 1)
            monthly_average = total_received / months

            logger.info(f"Encontrados {len(dividends)} dividendos para portfólio {portfolio_id}")

            return {
                "portfolio_id": portfolio_id,
                "period": period,
                "total_received": round(total_received, 2),
                "dividend_yield": round(dividend_yield, 2),
                "monthly_average": round(monthly_average, 2),
                "total_payments": len(dividends),
                "by_ticker": [
                    {
                        "ticker": ticker,
                        "total": round(data["total"], 2),
                        "payments": data["payments"],
                        "yield": round((data["total"] / total_invested * 100) if total_invested > 0 else 0, 2)
                    }
                    for ticker, data in sorted(by_ticker.items(), key=lambda x: x[1]["total"], reverse=True)
                ],
                "next_payments": [],  # TODO: Implementar previsão de próximos pagamentos
            }

        except Exception as e:
            logger.error(f"Erro ao buscar dividendos: {str(e)}")
            raise

    async def save_transaction(
        self,
        portfolio_id: int,
        ticker: str,
        transaction_type: str,
        quantity: float,
        price: float,
        transaction_date: str,
        fees: float = 0.0
    ) -> Dict[str, Any]:
        """
        Salva transação (compra/venda) do portfólio

        Args:
            portfolio_id: ID do portfólio
            ticker: Ticker do ativo
            transaction_type: Tipo (buy, sell)
            quantity: Quantidade
            price: Preço unitário
            transaction_date: Data (YYYY-MM-DD)
            fees: Taxas e corretagem

        Returns:
            Transação salva
        """
        from ..models.portfolio_history import PortfolioTransaction
        from datetime import datetime

        try:
            date_obj = datetime.strptime(transaction_date, "%Y-%m-%d").date()
            total_value = quantity * price
            net_value = total_value + fees if transaction_type == "buy" else total_value - fees

            transaction = PortfolioTransaction(
                portfolio_id=portfolio_id,
                ticker=ticker,
                transaction_type=transaction_type,
                quantity=quantity,
                price=price,
                total_value=total_value,
                fees=fees,
                net_value=net_value,
                transaction_date=date_obj
            )

            self.db.add(transaction)
            self.db.commit()
            self.db.refresh(transaction)

            logger.info(f"Transação salva: {transaction_type} {quantity} {ticker} @ R$ {price:.2f}")

            return {
                "id": transaction.id,
                "ticker": transaction.ticker,
                "type": transaction.transaction_type,
                "quantity": transaction.quantity,
                "price": transaction.price,
                "total_value": transaction.total_value,
                "transaction_date": transaction.transaction_date.isoformat(),
            }

        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao salvar transação: {str(e)}")
            raise

    # ==================== MÉTODOS AUXILIARES ====================

    async def update_position(
        self,
        portfolio_id: int,
        ticker: str,
        quantity: float,
        average_price: float,
        operation: str = "add"
    ) -> Dict[str, Any]:
        """
        Atualiza ou adiciona posição no portfólio

        Args:
            portfolio_id: ID do portfólio
            ticker: Ticker do ativo
            quantity: Quantidade
            average_price: Preço médio
            operation: Operação (add, remove, update)

        Returns:
            Posição atualizada
        """
        from ..models.portfolio import Portfolio as PortfolioModel

        try:
            # Buscar portfólio
            portfolio = self.db.query(PortfolioModel).filter(
                PortfolioModel.id == portfolio_id
            ).first()

            if not portfolio:
                raise ValueError(f"Portfólio {portfolio_id} não encontrado")

            # Carregar posições atuais
            positions = portfolio.positions if portfolio.positions else []

            # Encontrar posição existente
            existing_position = None
            position_index = None
            for i, pos in enumerate(positions):
                if pos.get("ticker") == ticker:
                    existing_position = pos
                    position_index = i
                    break

            # Executar operação
            if operation == "add":
                if existing_position:
                    # Atualizar posição existente (média ponderada)
                    old_qty = existing_position.get("quantity", 0)
                    old_price = existing_position.get("average_price", 0)
                    old_invested = old_qty * old_price

                    new_qty = old_qty + quantity
                    new_invested = old_invested + (quantity * average_price)
                    new_avg_price = new_invested / new_qty if new_qty > 0 else 0

                    existing_position["quantity"] = new_qty
                    existing_position["average_price"] = new_avg_price
                    existing_position["total_invested"] = new_invested

                    logger.info(f"Posição {ticker} atualizada: {old_qty} → {new_qty} @ R$ {new_avg_price:.2f}")
                else:
                    # Criar nova posição
                    new_position = {
                        "ticker": ticker,
                        "quantity": quantity,
                        "average_price": average_price,
                        "total_invested": quantity * average_price,
                        "asset_type": "stock"  # Default, pode ser melhorado
                    }
                    positions.append(new_position)
                    logger.info(f"Nova posição criada: {ticker} - {quantity} @ R$ {average_price:.2f}")

            elif operation == "remove":
                if existing_position:
                    old_qty = existing_position.get("quantity", 0)
                    new_qty = old_qty - quantity

                    if new_qty <= 0:
                        # Remover posição completamente
                        positions.pop(position_index)
                        logger.info(f"Posição {ticker} removida completamente")
                    else:
                        # Reduzir quantidade
                        existing_position["quantity"] = new_qty
                        existing_position["total_invested"] = new_qty * existing_position.get("average_price", 0)
                        logger.info(f"Posição {ticker} reduzida: {old_qty} → {new_qty}")
                else:
                    raise ValueError(f"Posição {ticker} não encontrada para remover")

            elif operation == "update":
                if existing_position:
                    existing_position["quantity"] = quantity
                    existing_position["average_price"] = average_price
                    existing_position["total_invested"] = quantity * average_price
                    logger.info(f"Posição {ticker} atualizada diretamente: {quantity} @ R$ {average_price:.2f}")
                else:
                    raise ValueError(f"Posição {ticker} não encontrada para atualizar")

            else:
                raise ValueError(f"Operação inválida: {operation}")

            # Salvar no database
            portfolio.positions = positions
            portfolio.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(portfolio)

            # Retornar posição atualizada
            updated_position = None
            for pos in positions:
                if pos.get("ticker") == ticker:
                    updated_position = pos
                    break

            return {
                "portfolio_id": portfolio_id,
                "ticker": ticker,
                "operation": operation,
                "position": updated_position,
                "updated_at": datetime.utcnow().isoformat()
            }

        except ValueError as e:
            logger.error(f"Erro de validação ao atualizar posição: {str(e)}")
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao atualizar posição: {str(e)}")
            raise

    async def remove_position(
        self,
        portfolio_id: int,
        ticker: str
    ) -> bool:
        """
        Remove posição completamente do portfólio

        Args:
            portfolio_id: ID do portfólio
            ticker: Ticker da posição a remover

        Returns:
            True se removido, False se não encontrado
        """
        from ..models.portfolio import Portfolio as PortfolioModel

        try:
            # Buscar portfólio
            portfolio = self.db.query(PortfolioModel).filter(
                PortfolioModel.id == portfolio_id
            ).first()

            if not portfolio:
                logger.warning(f"Portfólio {portfolio_id} não encontrado")
                return False

            # Carregar posições
            positions = portfolio.positions if portfolio.positions else []

            # Encontrar e remover posição
            original_length = len(positions)
            positions = [pos for pos in positions if pos.get("ticker") != ticker]

            if len(positions) == original_length:
                logger.warning(f"Posição {ticker} não encontrada no portfólio {portfolio_id}")
                return False

            # Salvar no database
            portfolio.positions = positions
            portfolio.updated_at = datetime.utcnow()
            self.db.commit()

            logger.info(f"Posição {ticker} removida do portfólio {portfolio_id}")
            return True

        except Exception as e:
            self.db.rollback()
            logger.error(f"Erro ao remover posição {ticker}: {str(e)}")
            raise

    async def list_portfolios(
        self,
        user_id: Optional[int] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Lista portfólios com paginação

        Args:
            user_id: ID do usuário (opcional, para filtrar)
            limit: Limite de resultados
            offset: Offset para paginação

        Returns:
            Lista de portfólios com metadados
        """
        from ..models.portfolio import Portfolio as PortfolioModel

        try:
            # Construir query
            query = self.db.query(PortfolioModel)

            # Filtrar por usuário se especificado
            if user_id is not None:
                query = query.filter(PortfolioModel.user_id == user_id)

            # Contar total
            total = query.count()

            # Aplicar paginação
            portfolios = query.order_by(
                PortfolioModel.updated_at.desc()
            ).limit(limit).offset(offset).all()

            # Converter para dicionários com cálculos
            portfolio_list = []
            for portfolio in portfolios:
                positions = portfolio.positions if portfolio.positions else []

                # Calcular totais
                total_invested = sum(p.get("total_invested", 0) for p in positions)
                current_value = sum(p.get("current_value", total_invested) for p in positions)
                total_profit_loss = current_value - total_invested
                profit_loss_percent = (total_profit_loss / total_invested * 100) if total_invested > 0 else 0

                portfolio_list.append({
                    "id": portfolio.id,
                    "name": portfolio.name,
                    "description": portfolio.description,
                    "source": portfolio.source,
                    "total_invested": round(total_invested, 2),
                    "current_value": round(current_value, 2),
                    "total_profit_loss": round(total_profit_loss, 2),
                    "profit_loss_percent": round(profit_loss_percent, 2),
                    "positions_count": len(positions),
                    "created_at": portfolio.imported_at.isoformat() if portfolio.imported_at else None,
                    "updated_at": portfolio.updated_at.isoformat() if portfolio.updated_at else None,
                })

            logger.info(f"Listados {len(portfolio_list)} portfólios (total: {total})")

            return {
                "total": total,
                "limit": limit,
                "offset": offset,
                "count": len(portfolio_list),
                "portfolios": portfolio_list,
                "has_more": (offset + len(portfolio_list)) < total
            }

        except Exception as e:
            logger.error(f"Erro ao listar portfólios: {str(e)}")
            raise
