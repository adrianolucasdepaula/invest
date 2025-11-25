"""
Script para extrair TODOS os tickers únicos da B3 usando COTAHIST 2025.

Este script baixa o arquivo COTAHIST do ano atual e extrai a lista completa
de todos os tickers negociados na B3, incluindo:
- Ações (lote padrão - BDI 02)
- FIIs (BDI 12)
- Fracionárias (BDI 96)

Uso:
    python extract_all_b3_tickers.py

Output:
    - all_b3_tickers.json (lista de tickers únicos)
    - all_b3_assets.json (tickers com metadados: nome empresa, tipo)

Data: 2025-11-25
"""

import asyncio
import json
import logging
import sys
from collections import defaultdict
from pathlib import Path

# Adicionar path do serviço para importar CotahistService
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.cotahist_service import CotahistService

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def extract_tickers_from_cotahist(year: int = 2025):
    """
    Extrai todos os tickers únicos do COTAHIST de um ano.

    Args:
        year: Ano do COTAHIST (default: 2025)

    Returns:
        Tuple de (tickers_list, assets_with_metadata)
    """
    logger.info(f"Iniciando extração de tickers do COTAHIST {year}...")

    service = CotahistService()

    # 1. Baixar arquivo COTAHIST
    try:
        logger.info(f"Baixando COTAHIST {year}...")
        zip_content = await service.download_year(year)
        logger.info(f"✅ Download concluído: {len(zip_content)} bytes")
    except Exception as e:
        logger.error(f"❌ Erro ao baixar COTAHIST {year}: {e}")
        raise

    # 2. Parse arquivo completo (sem filtro de tickers)
    logger.info("Parseando arquivo COTAHIST...")
    all_records = service.parse_file(zip_content, tickers=None)
    logger.info(f"✅ Parse concluído: {len(all_records):,} registros")

    # 3. Extrair tickers únicos com metadados
    tickers_metadata = defaultdict(lambda: {
        "ticker": "",
        "company_name": "",
        "stock_type": "",
        "bdi_codes": set(),
        "first_date": None,
        "last_date": None,
        "total_records": 0
    })

    for record in all_records:
        ticker = record["ticker"]
        metadata = tickers_metadata[ticker]

        # Inicializar ticker
        if not metadata["ticker"]:
            metadata["ticker"] = ticker
            metadata["company_name"] = record["company_name"]
            metadata["stock_type"] = record["stock_type"]

        # Adicionar BDI code
        metadata["bdi_codes"].add(record["bdi_code"])

        # Atualizar datas
        current_date = record["date"]
        if metadata["first_date"] is None or current_date < metadata["first_date"]:
            metadata["first_date"] = current_date
        if metadata["last_date"] is None or current_date > metadata["last_date"]:
            metadata["last_date"] = current_date

        # Incrementar contador
        metadata["total_records"] += 1

    # 4. Converter sets para listas (JSON serialization)
    for metadata in tickers_metadata.values():
        metadata["bdi_codes"] = sorted(list(metadata["bdi_codes"]))

    # 5. Ordenar tickers alfabeticamente
    tickers_list = sorted(tickers_metadata.keys())
    assets_with_metadata = {ticker: tickers_metadata[ticker] for ticker in tickers_list}

    logger.info(f"✅ Extração concluída: {len(tickers_list)} tickers únicos")

    return tickers_list, assets_with_metadata


async def main():
    """Função principal do script."""
    year = 2025

    print("=" * 80)
    print(f"🔍 EXTRAÇÃO DE TODOS OS TICKERS B3 (COTAHIST {year})")
    print("=" * 80)
    print()

    # Extrair tickers
    tickers_list, assets_with_metadata = await extract_tickers_from_cotahist(year)

    # Estatísticas
    print(f"\n📊 ESTATÍSTICAS:")
    print(f"  Total de tickers únicos: {len(tickers_list)}")
    print(f"  Primeiro ticker (alfabético): {tickers_list[0]}")
    print(f"  Último ticker (alfabético): {tickers_list[-1]}")

    # Analisar distribuição por BDI
    bdi_distribution = defaultdict(int)
    for metadata in assets_with_metadata.values():
        for bdi_code in metadata["bdi_codes"]:
            bdi_distribution[bdi_code] += 1

    print(f"\n📈 DISTRIBUIÇÃO POR TIPO (BDI):")
    bdi_names = {
        2: "Lote Padrão (Ações)",
        12: "FIIs",
        96: "Fracionárias"
    }
    for bdi_code, count in sorted(bdi_distribution.items()):
        bdi_name = bdi_names.get(bdi_code, f"Desconhecido ({bdi_code})")
        print(f"  BDI {bdi_code:02d} - {bdi_name}: {count}")

    # Salvar em arquivos JSON
    output_dir = Path(__file__).parent.parent.parent.parent / "scripts"
    output_dir.mkdir(exist_ok=True)

    # Arquivo 1: Lista simples de tickers
    tickers_file = output_dir / "all_b3_tickers.json"
    with open(tickers_file, 'w', encoding='utf-8') as f:
        json.dump(tickers_list, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Arquivo criado: {tickers_file}")
    print(f"   Tickers: {len(tickers_list)}")

    # Arquivo 2: Assets com metadados completos
    assets_file = output_dir / "all_b3_assets.json"
    with open(assets_file, 'w', encoding='utf-8') as f:
        json.dump(assets_with_metadata, f, ensure_ascii=False, indent=2)
    print(f"\n✅ Arquivo criado: {assets_file}")
    print(f"   Assets: {len(assets_with_metadata)}")
    print(f"   Metadados: ticker, company_name, stock_type, bdi_codes, dates, total_records")

    # Top 10 ativos com mais registros (mais negociados)
    top_10_most_traded = sorted(
        assets_with_metadata.items(),
        key=lambda x: x[1]["total_records"],
        reverse=True
    )[:10]

    print(f"\n📈 TOP 10 MAIS NEGOCIADOS EM {year}:")
    for ticker, metadata in top_10_most_traded:
        print(f"  {ticker:10s} - {metadata['company_name'][:30]:30s} - {metadata['total_records']:>6,} registros")

    print("\n" + "=" * 80)
    print("✅ EXTRAÇÃO CONCLUÍDA COM SUCESSO!")
    print("=" * 80)

    await CotahistService().client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
