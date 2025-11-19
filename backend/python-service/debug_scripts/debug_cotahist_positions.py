#!/usr/bin/env python3
"""
Debug script: Verificar posições corretas dos campos COTAHIST
"""
import sys
sys.path.insert(0, './backend/python-service')

import asyncio
import zipfile
import io
from app.services.cotahist_service import CotahistService

async def debug_positions():
    service = CotahistService()
    try:
        print("🔄 Downloading COTAHIST 2024...")
        zip_content = await service.download_year(2024)
        print(f"✅ Downloaded: {len(zip_content)} bytes\n")

        # Descompactar ZIP
        with zipfile.ZipFile(io.BytesIO(zip_content)) as zf:
            txt_files = [f for f in zf.namelist() if f.endswith(".TXT")]
            if not txt_files:
                print("❌ No TXT file found")
                return

            txt_filename = txt_files[0]
            print(f"📄 File: {txt_filename}\n")

            with zf.open(txt_filename) as txt_file:
                content = txt_file.read().decode("ISO-8859-1")
                lines = content.split("\n")

                # Processar primeiras 10 linhas com TIPREG=01
                count = 0
                for line in lines:
                    if not line.strip():
                        continue

                    if len(line) < 245:
                        continue

                    # Garantir 245 chars
                    if len(line) == 246:
                        line = line.rstrip('\n\r')

                    tipreg = line[0:2]
                    if tipreg != "01":
                        continue

                    count += 1
                    if count > 3:  # Mostrar apenas 3 exemplos
                        break

                    print(f"=== LINHA {count} ===")
                    print(f"Tamanho: {len(line)} chars")
                    print(f"Raw (primeiros 100 chars): {repr(line[:100])}\n")

                    # Extrair campos com posições ATUAIS
                    tipreg = line[0:2]
                    data = line[2:10]
                    codbdi = line[10:12]
                    codneg = line[12:24].strip()
                    tpmerc = line[24:27].strip()
                    nomres = line[27:39].strip()
                    especi = line[39:49].strip()

                    print(f"TIPREG (0:2):    '{tipreg}'")
                    print(f"DATA (2:10):     '{data}'")
                    print(f"CODBDI (10:12):  '{codbdi}'")
                    print(f"CODNEG (12:24):  '{codneg}'")
                    print(f"TPMERC (24:27):  '{tpmerc}'")
                    print(f"NOMRES (27:39):  '{nomres}'")
                    print(f"ESPECI (39:49):  '{especi}'")

                    # Testar conversão de preços
                    try:
                        preabe = line[56:69]
                        premax = line[69:82]
                        premin = line[82:95]
                        premed = line[95:108]
                        preult = line[108:121]
                        preofc = line[121:134]
                        preofv = line[134:147]

                        print(f"\nPREABE (56:69):  '{preabe}' = {int(preabe)/100.0 if preabe.strip() else 0}")
                        print(f"PREMAX (69:82):  '{premax}' = {int(premax)/100.0 if premax.strip() else 0}")
                        print(f"PREMIN (82:95):  '{premin}' = {int(premin)/100.0 if premin.strip() else 0}")
                        print(f"PREMED (95:108): '{premed}' = {int(premed)/100.0 if premed.strip() else 0}")
                        print(f"PREULT (108:121): '{preult}' = {int(preult)/100.0 if preult.strip() else 0}")
                        print(f"PREOFC (121:134): '{preofc}' = {int(preofc)/100.0 if preofc.strip() else 0}")
                        print(f"PREOFV (134:147): '{preofv}' = {int(preofv)/100.0 if preofv.strip() else 0}")
                    except Exception as e:
                        print(f"❌ Erro ao converter preços: {e}")

                    # Testar volumes
                    try:
                        voltot = line[152:170]
                        quatot = line[170:188]
                        print(f"\nVOLTOT (152:170): '{voltot}' = {int(voltot) if voltot.strip() else 0}")
                        print(f"QUATOT (170:188): '{quatot}' = {int(quatot) if quatot.strip() else 0}")
                    except Exception as e:
                        print(f"❌ Erro ao converter volumes: {e}")

                    print("\n" + "="*60 + "\n")

                print(f"✅ Total linhas TIPREG=01 encontradas: {count}")

    finally:
        await service.close()

if __name__ == '__main__':
    asyncio.run(debug_positions())
