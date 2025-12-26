"""Test B3 main page for download button and results per page selector"""
import asyncio
from playwright.async_api import async_playwright

async def test_b3_main_page():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print("Navigating to B3 main IDIV page...")
        await page.goto(
            "https://www.b3.com.br/pt_br/market-data-e-indices/indices/indices-de-segmentos-e-setoriais/indice-dividendos-idiv-composicao-da-carteira.htm",
            wait_until="load",
            timeout=60000
        )
        
        # Wait for page to load
        await asyncio.sleep(5)
        
        # Get HTML and search for key elements
        html = await page.content()
        
        # Search for download button
        print("\n=== Searching for download elements ===")
        download_keywords = ["download", "Download", "DOWNLOAD", "baixar", "Baixar", "exportar", "Exportar", "excel", "Excel", "csv", "CSV"]
        for keyword in download_keywords:
            if keyword in html:
                print(f"✓ Found keyword: {keyword}")
        
        # Search for results per page selector
        print("\n=== Searching for results per page selector ===")
        results_keywords = ["por página", "por pagina", "results per page", "Resultados", "itens", "items"]
        for keyword in results_keywords:
            if keyword in html:
                print(f"✓ Found keyword: {keyword}")
        
        # Try to find specific selectors
        print("\n=== Looking for specific HTML elements ===")
        
        # Download button
        download_selectors = [
            'a:has-text("Download")',
            'button:has-text("Download")',
            'a:has-text("Baixar")',
            'button:has-text("Baixar")',
            '[download]',
            '.download',
            '#download'
        ]
        
        for selector in download_selectors:
            try:
                element = await page.query_selector(selector)
                if element:
                    text = await element.text_content()
                    href = await element.get_attribute('href')
                    print(f"✓ Download element found: {selector}")
                    print(f"  Text: {text}")
                    print(f"  Href: {href}")
            except:
                pass
        
        # Results per page selector
        page_size_selectors = [
            'select[name*="page"]',
            'select[name*="size"]',
            'select[name*="results"]',
            'select.page-size',
            '#pageSize',
            'select:has-text("10")',
            'select:has-text("20")',
            'select:has-text("50")',
            'select:has-text("100")'
        ]
        
        for selector in page_size_selectors:
            try:
                element = await page.query_selector(selector)
                if element:
                    options = await element.query_selector_all('option')
                    print(f"✓ Page size selector found: {selector}")
                    print(f"  Options: {len(options)}")
                    for opt in options:
                        value = await opt.get_attribute('value')
                        text = await opt.text_content()
                        print(f"    - {value}: {text}")
            except:
                pass
        
        # Check iframe src
        print("\n=== Checking for iframe ===")
        iframes = await page.query_selector_all('iframe')
        print(f"Found {len(iframes)} iframe(s)")
        for i, iframe in enumerate(iframes):
            src = await iframe.get_attribute('src')
            print(f"  Iframe {i+1}: {src}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_b3_main_page())
