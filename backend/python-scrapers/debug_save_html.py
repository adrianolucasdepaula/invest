"""
Debug: Salvar HTML completo da página StatusInvest PETR4
Para análise offline e identificação de seletores corretos
"""
import asyncio
from playwright.async_api import async_playwright
from loguru import logger

async def save_html():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        url = "https://statusinvest.com.br/acoes/petr4"
        logger.info(f"Navegando para {url}")

        await page.goto(url, wait_until="networkidle", timeout=60000)

        # Scroll para carregar seção de dividendos (lazy-load)
        await page.evaluate("""
            // Scroll até o final da página
            window.scrollTo(0, document.body.scrollHeight);
        """)
        await asyncio.sleep(3)

        # Scroll para seção de proventos
        await page.evaluate("""
            const sections = document.querySelectorAll('[id*="provento"], [id*="dividend"], h3');
            for (const section of sections) {
                const text = section.textContent.toLowerCase();
                if (text.includes('provento') || text.includes('dividendo')) {
                    section.scrollIntoView({ behavior: 'instant', block: 'center' });
                    break;
                }
            }
        """)
        await asyncio.sleep(3)

        # Capturar HTML completo
        html = await page.content()

        # Salvar em arquivo
        output_file = "statusinvest_petr4_full.html"
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(html)

        logger.info(f"✅ HTML salvo em: {output_file}")
        logger.info(f"📊 Tamanho: {len(html):,} bytes")

        # Tentar encontrar seção de dividendos
        dividend_section = await page.evaluate("""
            () => {
                // Procurar por texto "DIVIDENDOS" ou "PROVENTOS"
                const allText = document.body.innerText;
                const lines = allText.split('\\n');

                const relevant = lines.filter(line => {
                    const lower = line.toLowerCase();
                    return lower.includes('dividendo') ||
                           lower.includes('provento') ||
                           lower.includes('jcp') ||
                           (lower.includes('r$') && line.includes('/'));
                });

                return relevant.slice(0, 50);
            }
        """)

        logger.info("📋 Linhas relevantes encontradas:")
        for idx, line in enumerate(dividend_section[:20], 1):
            logger.info(f"  {idx}. {line[:100]}")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(save_html())
