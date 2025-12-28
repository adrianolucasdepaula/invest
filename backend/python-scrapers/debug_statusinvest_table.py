"""
Debug script: Capturar estrutura da tabela de dividendos StatusInvest
Objetivo: Identificar qual coluna tem o valor correto (R$ 0.67-0.94 vs R$ 4.00)
"""
import asyncio
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup
from loguru import logger

async def debug_table():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()

        url = "https://statusinvest.com.br/acoes/petr4"
        logger.info(f"Navegando para {url}")

        await page.goto(url, wait_until="load", timeout=60000)
        await asyncio.sleep(3)

        # Scroll para carregar tabela de dividendos
        await page.evaluate("""
            const sections = document.querySelectorAll('[id*="provento"], [id*="dividend"]');
            if (sections.length > 0) {
                sections[0].scrollIntoView({ behavior: 'instant', block: 'center' });
            } else {
                window.scrollTo(0, document.body.scrollHeight / 2);
            }
        """)
        await asyncio.sleep(2)

        # Capturar HTML
        html = await page.content()
        soup = BeautifulSoup(html, 'html.parser')

        # Buscar tabela de dividendos (múltiplas estratégias)
        table_selectors = [
            "table.proventos",
            "table[class*='provento']",
            "table[class*='dividend']",
            "div[id*='provento'] table",
            "#proventos table",
            "section[id*='provento'] table",
        ]

        table = None
        for selector in table_selectors:
            table = soup.select_one(selector)
            if table:
                logger.info(f"✅ Encontrada tabela com selector: {selector}")
                break

        if not table:
            logger.error("❌ Nenhuma tabela encontrada!")
            await browser.close()
            return

        # Extrair cabeçalhos
        headers = []
        header_row = table.select_one("thead tr")
        if header_row:
            for th in header_row.select("th"):
                headers.append(th.get_text().strip())
            logger.info(f"📋 Cabeçalhos: {headers}")
        else:
            logger.warning("⚠️  Sem cabeçalhos (thead)")

        # Extrair primeiras 3 linhas (sample)
        rows = table.select("tbody tr")[:3]
        logger.info(f"📊 Total de linhas: {len(table.select('tbody tr'))}")

        for idx, row in enumerate(rows, 1):
            cells = row.select("td")
            logger.info(f"\n--- LINHA {idx} ---")
            for i, cell in enumerate(cells):
                header = headers[i] if i < len(headers) else f"Coluna {i}"
                value = cell.get_text().strip()
                logger.info(f"  [{i}] {header}: {value}")

        # Salvar HTML da tabela para análise
        with open("statusinvest_table_debug.html", "w", encoding="utf-8") as f:
            f.write(str(table))
        logger.info("\n✅ HTML da tabela salvo em: statusinvest_table_debug.html")

        input("\n⏸️  Pressione ENTER para fechar o navegador...")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(debug_table())
