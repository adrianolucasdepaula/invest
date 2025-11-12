/**
 * Script para extrair todos os tickers do IBOV
 * Este script deve ser executado no console do navegador na página:
 * https://sistemaswebb3-listados.b3.com.br/indexPage/day/IBOV?language=pt-br
 */

(async function() {
  const allTickers = [];
  
  // Função para extrair tickers da página atual
  function extractCurrentPage() {
    const rows = document.querySelectorAll('tbody tr');
    const tickers = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const ticker = cells[0]?.textContent?.trim();
        const name = cells[1]?.textContent?.trim();
        if (ticker && name && ticker !== 'Quantidade Teórica Total' && ticker !== 'Redutor') {
          tickers.push(ticker);
        }
      }
    });
    return tickers;
  }
  
  // Página 1
  console.log('Extraindo página 1...');
  allTickers.push(...extractCurrentPage());
  
  // Páginas 2-6
  for (let page = 2; page <= 6; page++) {
    console.log(`Navegando para página ${page}...`);
    const pageLinks = Array.from(document.querySelectorAll('a'));
    const pageLink = pageLinks.find(link => 
      link.textContent.trim() === page.toString() && 
      link.href && !link.href.includes('theorical')
    );
    
    if (pageLink) {
      pageLink.click();
      await new Promise(resolve => setTimeout(resolve, 1500));
      const pageTickers = extractCurrentPage();
      console.log(`Página ${page}: ${pageTickers.length} tickers`);
      allTickers.push(...pageTickers);
    }
  }
  
  console.log('\n=== RESULTADO ===');
  console.log(`Total de tickers: ${allTickers.length}`);
  console.log('\nTickers (array JavaScript):');
  console.log(JSON.stringify(allTickers, null, 2));
  
  console.log('\nTickers (formato para arquivo):');
  console.log(allTickers.join('\n'));
  
  return allTickers;
})();
