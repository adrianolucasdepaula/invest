#!/usr/bin/env python3
"""
Converter cookies OAuth de pickle para JSON
Permite scrapers TypeScript/Puppeteer usarem cookies coletados via OAuth Manager

USO:
    python convert_cookies_to_json.py

ENTRADA:
    /app/browser-profiles/google_cookies.pkl (formato Selenium pickle)

SAÍDA:
    /app/data/cookies/fundamentei_session.json
    /app/data/cookies/investidor10_session.json
    /app/data/cookies/statusinvest_session.json
    (formato JSON compatível com Puppeteer setCookie)

CRIADO: 2025-11-24
AUTOR: Claude Code (Análise Ultra-Robusta OAuth)
"""

import pickle
import json
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# Configuração de paths
PICKLE_FILE = Path("/app/browser-profiles/google_cookies.pkl")
JSON_OUTPUT_DIR = Path("/app/data/cookies")

# Mapeamento: Nome do site no pickle → Nome do arquivo JSON
SITE_MAPPING = {
    "Fundamentei": "fundamentei_session.json",
    "Investidor10": "investidor10_session.json",
    "StatusInvest": "statusinvest_session.json",
    # Adicionar mais sites conforme necessário:
    # "Google": "google_session.json",
    # "Investing.com": "investing_session.json",
    # "TradingView": "tradingview_session.json",
}


def convert_cookies_pickle_to_json() -> None:
    """
    Converter cookies pickle para JSON por site

    Processo:
    1. Lê google_cookies.pkl (Dict[site_name, List[cookie]])
    2. Para cada site no mapeamento:
       - Filtra cookies do site
       - Converte formato Selenium → Puppeteer (se necessário)
       - Salva como JSON individual
    3. Exibe resumo da conversão
    """

    print("=" * 70)
    print("🔄 CONVERSOR DE COOKIES: Pickle → JSON")
    print("=" * 70)
    print()

    # 1. Verificar se pickle existe
    if not PICKLE_FILE.exists():
        print(f"❌ ERRO: Arquivo pickle não encontrado!")
        print(f"   Caminho: {PICKLE_FILE}")
        print()
        print("🔧 SOLUÇÃO:")
        print("   1. Acesse: http://localhost:3100/oauth-manager")
        print("   2. Clique em 'Iniciar Renovação de Sessões OAuth'")
        print("   3. Complete o fluxo OAuth via VNC")
        print("   4. Execute este script novamente")
        print()
        sys.exit(1)

    # 2. Carregar cookies do pickle
    print(f"📂 Carregando cookies de: {PICKLE_FILE}")
    try:
        with open(PICKLE_FILE, 'rb') as f:
            all_cookies = pickle.load(f)

        if not isinstance(all_cookies, dict):
            print(f"❌ ERRO: Formato pickle inválido (esperado dict, recebeu {type(all_cookies)})")
            sys.exit(1)

        print(f"✅ Pickle carregado com sucesso!")
        print(f"   Sites disponíveis no pickle: {len(all_cookies)}")
        print(f"   Sites: {', '.join(all_cookies.keys())}")
        print()

    except Exception as e:
        print(f"❌ ERRO ao carregar pickle: {e}")
        sys.exit(1)

    # 3. Criar diretório de saída se não existir
    JSON_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"📁 Diretório de saída: {JSON_OUTPUT_DIR}")
    print()

    # 4. Converter cada site
    print("🔄 Convertendo cookies por site...")
    print("-" * 70)

    converted_sites = 0
    skipped_sites = 0
    total_cookies_converted = 0

    for site_name, json_filename in SITE_MAPPING.items():
        print(f"\n📌 Site: {site_name}")
        print(f"   Arquivo JSON: {json_filename}")

        # Verificar se site existe no pickle
        if site_name not in all_cookies:
            print(f"   ⚠️  Site não encontrado no pickle (pulando)")
            skipped_sites += 1
            continue

        # Obter cookies do site
        site_cookies = all_cookies[site_name]

        if not site_cookies or len(site_cookies) == 0:
            print(f"   ⚠️  Nenhum cookie encontrado (pulando)")
            skipped_sites += 1
            continue

        # Converter cookies (formato Selenium já é compatível com Puppeteer)
        # Ambos usam: {name, value, domain, path, secure, httpOnly, sameSite, expires}
        converted_cookies = []

        for cookie in site_cookies:
            # Garantir que cookie tem campos essenciais
            if 'name' not in cookie or 'value' not in cookie:
                continue

            # Converter expiry (Selenium) para expires (Puppeteer) se necessário
            converted_cookie = dict(cookie)  # Cópia

            if 'expiry' in converted_cookie and 'expires' not in converted_cookie:
                # Selenium usa 'expiry' (timestamp Unix)
                # Puppeteer usa 'expires' (timestamp Unix)
                converted_cookie['expires'] = converted_cookie.pop('expiry')

            converted_cookies.append(converted_cookie)

        # Salvar como JSON
        output_file = JSON_OUTPUT_DIR / json_filename

        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(converted_cookies, f, indent=2, ensure_ascii=False)

            print(f"   ✅ Convertido: {len(converted_cookies)} cookies")
            print(f"   📄 Salvo em: {output_file}")

            converted_sites += 1
            total_cookies_converted += len(converted_cookies)

        except Exception as e:
            print(f"   ❌ ERRO ao salvar JSON: {e}")
            skipped_sites += 1

    # 5. Resumo final
    print()
    print("=" * 70)
    print("📊 RESUMO DA CONVERSÃO")
    print("=" * 70)
    print(f"Sites convertidos com sucesso: {converted_sites}")
    print(f"Sites pulados (sem cookies):   {skipped_sites}")
    print(f"Total de cookies convertidos:  {total_cookies_converted}")
    print()

    if converted_sites > 0:
        print("✅ CONVERSÃO CONCLUÍDA COM SUCESSO!")
        print()
        print("🎯 PRÓXIMOS PASSOS:")
        print("   1. Reiniciar backend NestJS (para carregar novos cookies)")
        print("   2. Testar scrapers TypeScript OAuth:")
        print("      GET http://localhost:3101/api/v1/scrapers/scrape/fundamentei/PETR4")
        print("   3. Verificar logs: sem erros 'NO VALID OAUTH SESSION'")
        print()
        print("📝 MANUTENÇÃO:")
        print("   - Renovar cookies OAuth a cada 7-14 dias")
        print("   - Executar este script após cada renovação")
        print("   - Cookies expiram junto com sessão Google")
        print()
    else:
        print("⚠️  ATENÇÃO: Nenhum site foi convertido!")
        print()
        print("🔧 VERIFICAR:")
        print("   1. Cookies foram coletados via OAuth Manager?")
        print(f"   2. Nomes dos sites no pickle: {', '.join(all_cookies.keys())}")
        print(f"   3. Nomes esperados no script: {', '.join(SITE_MAPPING.keys())}")
        print()


def main():
    """Função principal"""
    try:
        convert_cookies_pickle_to_json()
    except KeyboardInterrupt:
        print("\n\n⚠️  Conversão interrompida pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ ERRO INESPERADO: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
