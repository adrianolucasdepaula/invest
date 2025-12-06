"""
Script para verificar scrapers que usam Google OAuth
"""
from oauth_sites_config import OAUTH_SITES_CONFIG
from pathlib import Path

print("=" * 70)
print("SCRAPERS QUE REQUEREM GOOGLE OAUTH")
print("=" * 70)

cookies_dir = Path("/app/data/cookies")

# Map site names to cookie files
cookie_files = {
    "ChatGPT": "chatgpt_session.json",
    "Gemini": "gemini_session.json",
    "DeepSeek": "deepseek_session.json",
    "Claude": "claude_session.json",
    "Grok": "grok_session.json",
    "Perplexity": "perplexity_session.json",
    "Yahoo Finance": "yahoo_finance_session.json",
    "Fundamentei": "fundamentei_session.json",
    "Investidor10": "investidor10_session.json",
    "StatusInvest": "statusinvest_session.json",
    "TradingView": "tradingview_session.json",
    "Investing.com": "investing_session.json",
    "Mais Retorno": "maisretorno_session.json",
    "Kinvo": "kinvo_session.json",
}

oauth_scrapers = []
for site in OAUTH_SITES_CONFIG:
    login_type = site.get("login_type", "")
    if login_type in ["oauth", "auto"]:
        name = site["name"]
        category = site["category"].value
        required = site["required"]
        order = site["order"]

        # Check if session file exists
        cookie_file = cookie_files.get(name, "")
        has_cookies = False
        if cookie_file:
            cookie_path = cookies_dir / cookie_file
            has_cookies = cookie_path.exists()

        status = "✅ COOKIES" if has_cookies else "❌ SEM COOKIES"

        print(f"{order:2}. {name:20} | {category:15} | required={str(required):5} | {status}")
        oauth_scrapers.append({
            "name": name,
            "has_cookies": has_cookies,
            "required": required,
        })

print()
print("=" * 70)
print("RESUMO")
print("=" * 70)
with_cookies = [s for s in oauth_scrapers if s["has_cookies"]]
without_cookies = [s for s in oauth_scrapers if not s["has_cookies"]]
required_without = [s for s in without_cookies if s["required"]]

print(f"Total sites OAuth: {len(oauth_scrapers)}")
print(f"Com cookies:       {len(with_cookies)}")
print(f"Sem cookies:       {len(without_cookies)}")
print(f"Obrigatórios sem:  {len(required_without)}")

if without_cookies:
    print()
    print("Sites SEM cookies:")
    for s in without_cookies:
        req = "[OBRIGATÓRIO]" if s["required"] else "[opcional]"
        print(f"  - {s['name']} {req}")
