"""
COTAHIST Service - Parser de dados históricos da B3

Este serviço implementa o parser completo para arquivos COTAHIST da B3,
que contém dados históricos de todos os ativos negociados desde 1986.

Layout: 245 bytes fixed position
Fonte: https://bvmf.bmfbovespa.com.br/InstDados/SerHist/
"""

import io
import logging
import zipfile
from datetime import datetime
from typing import Dict, List, Optional

import httpx

logger = logging.getLogger(__name__)


class CotahistService:
    """
    Service para download e parse de arquivos COTAHIST da B3.

    COTAHIST contém dados históricos de todos os ativos desde 1986:
    - Formato: ZIP contendo TXT (245 bytes fixed position)
    - Cobertura: 2000+ ativos
    - Período: 1986-presente
    - Custo: 100% GRATUITO

    Layout (245 bytes):
    - Posições 1-2: TIPREG (tipo de registro, sempre "01" para cotações)
    - Posições 3-10: DATA (AAAAMMDD)
    - Posições 11-12: CODBDI (código BDI: 02=lote padrão, 12=FIIs)
    - Posições 13-24: CODNEG (ticker do ativo, ex: "ABEV3")
    - Posições 57-68: PREABE (preço abertura, dividir por 100)
    - Posições 69-80: PREMAX (preço máximo, dividir por 100)
    - Posições 81-92: PREMIN (preço mínimo, dividir por 100)
    - Posições 109-121: PREULT (preço último, dividir por 100)
    - Posições 153-170: VOLTOT (volume total negociado)
    """

    BASE_URL = "https://bvmf.bmfbovespa.com.br/InstDados/SerHist"
    TIMEOUT = 300  # 5 minutos (download pode demorar)

    def __init__(self):
        """Inicializa o service com HTTP client configurado."""
        self.client = httpx.AsyncClient(timeout=self.TIMEOUT, follow_redirects=True)

    async def download_year(self, year: int) -> bytes:
        """
        Faz download do arquivo COTAHIST para um ano específico.

        Args:
            year: Ano desejado (1986-2024)

        Returns:
            Conteúdo do arquivo ZIP em bytes

        Raises:
            httpx.HTTPError: Se download falhar (404, timeout, etc)
        """
        url = f"{self.BASE_URL}/COTAHIST_A{year}.ZIP"
        logger.info(f"Downloading COTAHIST for year {year} from {url}")

        try:
            response = await self.client.get(url)
            response.raise_for_status()
            logger.info(
                f"Successfully downloaded COTAHIST {year} ({len(response.content)} bytes)"
            )
            return response.content
        except httpx.HTTPError as e:
            logger.error(f"Failed to download COTAHIST {year}: {e}")
            raise

    def parse_line(self, line: str) -> Optional[Dict]:
        """
        Parse uma linha do arquivo COTAHIST (245 bytes fixed position).

        Filtros aplicados:
        - TIPREG = 01 (cotações, ignora header/trailer)
        - CODBDI = 02 (lote padrão) ou 12 (FIIs)

        Args:
            line: Linha do arquivo TXT (245 bytes, pode incluir \n no final = 246)

        Returns:
            Dict com dados parseados ou None se linha deve ser ignorada
            {
                "ticker": str,
                "date": str (ISO format YYYY-MM-DD),
                "open": float,
                "high": float,
                "low": float,
                "close": float,
                "volume": int
            }
        """
        # Validar tamanho da linha (245 ou 246 com \n)
        line_len = len(line)
        if line_len < 245 or line_len > 246:
            return None

        # Garantir que linha tem exatamente 245 caracteres (remover \n se existir)
        if line_len == 246:
            line = line.rstrip('\n\r')

        # Extrair campos (posições são 0-indexed, então subtrair 1)
        tipreg = line[0:2]  # Posições 1-2
        data_pregao = line[2:10]  # Posições 3-10
        codbdi = line[10:12]  # Posições 11-12
        codneg = line[12:24].strip()  # Posições 13-24 (ticker)

        # Filtrar: apenas TIPREG=01 (cotações)
        if tipreg != "01":
            return None

        # Filtrar: apenas CODBDI=02 (lote padrão) ou 12 (FIIs)
        if codbdi not in ("02", "12"):
            return None

        # Extrair preços (dividir por 100 - formato B3)
        preabe = int(line[56:69]) / 100.0  # Posições 57-69 (open)
        premax = int(line[69:82]) / 100.0  # Posições 70-82 (high)
        premin = int(line[82:95]) / 100.0  # Posições 83-95 (low)
        preult = int(line[108:121]) / 100.0  # Posições 109-121 (close)
        voltot = int(line[152:170])  # Posições 153-170 (volume)

        # Converter data AAAAMMDD para ISO (YYYY-MM-DD)
        try:
            date_obj = datetime.strptime(data_pregao, "%Y%m%d")
            date_iso = date_obj.strftime("%Y-%m-%d")
        except ValueError:
            logger.warning(f"Invalid date format: {data_pregao}")
            return None

        return {
            "ticker": codneg,
            "date": date_iso,
            "open": preabe,
            "high": premax,
            "low": premin,
            "close": preult,
            "volume": voltot,
        }

    def parse_file(self, zip_content: bytes) -> List[Dict]:
        """
        Descompacta ZIP e parse o arquivo TXT linha por linha.

        Args:
            zip_content: Conteúdo do arquivo ZIP em bytes

        Returns:
            Lista de dicionários com dados parseados
        """
        records = []

        try:
            # Descompactar ZIP em memória
            with zipfile.ZipFile(io.BytesIO(zip_content)) as zf:
                # Arquivos COTAHIST têm apenas 1 TXT dentro do ZIP
                txt_files = [f for f in zf.namelist() if f.endswith(".TXT")]

                if not txt_files:
                    logger.error("No TXT file found in ZIP")
                    return []

                txt_filename = txt_files[0]
                logger.info(f"Parsing file: {txt_filename}")

                # Ler TXT e processar linha por linha
                with zf.open(txt_filename) as txt_file:
                    # Decodificar ISO-8859-1 (encoding padrão B3)
                    content = txt_file.read().decode("ISO-8859-1")
                    lines = content.split("\n")

                    for line in lines:
                        if not line.strip():
                            continue

                        parsed = self.parse_line(line)
                        if parsed:
                            records.append(parsed)

            logger.info(f"Parsed {len(records)} records from {txt_filename}")
            return records

        except Exception as e:
            logger.error(f"Failed to parse ZIP file: {e}")
            raise

    async def fetch_historical_data(
        self,
        start_year: int = 1986,
        end_year: int = 2024,
        tickers: Optional[List[str]] = None,
    ) -> List[Dict]:
        """
        Faz download e parse de múltiplos anos de COTAHIST.

        Args:
            start_year: Ano inicial (default: 1986)
            end_year: Ano final (default: 2024)
            tickers: Lista de tickers para filtrar (opcional, default: todos)

        Returns:
            Lista consolidada de todos os registros

        Example:
            >>> service = CotahistService()
            >>> data = await service.fetch_historical_data(
            ...     start_year=2020,
            ...     end_year=2024,
            ...     tickers=['ABEV3', 'PETR4']
            ... )
            >>> len(data)
            1340  # ~67 pontos/ano * 5 anos * 2 ativos
        """
        all_records = []
        years_processed = 0

        logger.info(
            f"Fetching COTAHIST data from {start_year} to {end_year} "
            f"(tickers: {tickers or 'ALL'})"
        )

        for year in range(start_year, end_year + 1):
            try:
                # Download ZIP do ano
                zip_content = await self.download_year(year)

                # Parse arquivo TXT
                year_records = self.parse_file(zip_content)

                # Filtrar por tickers se especificado
                if tickers:
                    tickers_upper = [t.upper() for t in tickers]
                    year_records = [
                        r for r in year_records if r["ticker"] in tickers_upper
                    ]

                all_records.extend(year_records)
                years_processed += 1

                logger.info(
                    f"Year {year}: {len(year_records)} records "
                    f"(total: {len(all_records)})"
                )

            except Exception as e:
                logger.error(f"Failed to process year {year}: {e}")
                # Continuar com próximo ano mesmo se um falhar
                continue

        logger.info(
            f"Fetch completed: {len(all_records)} total records "
            f"from {years_processed} years"
        )

        return all_records

    async def close(self):
        """Cleanup HTTP client."""
        if hasattr(self, "client"):
            await self.client.aclose()
