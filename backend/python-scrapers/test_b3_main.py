import asyncio
from playwright.async_api import async_playwright

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("Navigating to B3 main page...")
        await page.goto(
            "https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-de-segmentos-e-setoriais/indice-dividendos-idiv-composicao-da-carteira.htm",
            wait_until="load",
            timeout=60000
        )
        
        await asyncio.sleep(5)
        html = await page.content()
        
        # Search for download
        print("\n=== Download keywords ===")
        for kw in ["download", "Download", "baixar", "Baixar", "excel", "csv"]:
            if kw in html:
                print(f"Found: {kw}")
        
        # Search for results per page
        print("\n=== Results per page keywords ===")
        for kw in ["por página", "Resultados", "itens"]:
            if kw in html:
                print(f"Found: {kw}")
        
        # Check iframe
        print("\n=== Iframes ===")
        iframes = await page.query_selector_all("iframe")
        for i, iframe in enumerate(iframes):
            src = await iframe.get_attribute("src")
            print(f"Iframe {i+1}: {src}")
        
        await browser.close()

asyncio.run(test())
