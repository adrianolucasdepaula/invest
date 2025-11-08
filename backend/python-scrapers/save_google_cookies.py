#!/usr/bin/env python3
"""
Script para salvar cookies de autenticação OAuth/Google
Usado por 18 scrapers que requerem login

SITES QUE PRECISAM DE LOGIN:
1. Google (gmail.com) - Base para OAuth
2. Fundamentei (fundamentei.com.br)
3. Investidor10 (investidor10.com.br)
4. StatusInvest (statusinvest.com.br)
5. Investing.com
6. ADVFN (br.advfn.com)
7. Google Finance (google.com/finance)
8. TradingView (tradingview.com)
9. ChatGPT (chat.openai.com)
10. Gemini (gemini.google.com)
11. DeepSeek (chat.deepseek.com)
12. Claude (claude.ai)
13. Grok (grok.x.ai)
14. Investing News (investing.com/news)
15. Valor (valor.globo.com)
16. Exame (exame.com)
17. InfoMoney (infomoney.com.br)
18. Estadão (estadao.com.br)
19. Mais Retorno (maisretorno.com)

USO:
    python save_google_cookies.py

O script abrirá um navegador Chrome. Faça login manualmente em cada site.
Os cookies serão salvos em: /app/browser-profiles/google_cookies.pkl
"""

import pickle
import os
import sys
import time
from pathlib import Path
from typing import List, Dict
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from loguru import logger

# Configurar logger
logger.remove()
logger.add(sys.stdout, format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>")

# Diretório para salvar cookies
COOKIES_DIR = Path("/app/browser-profiles")
COOKIES_FILE = COOKIES_DIR / "google_cookies.pkl"

# Lista de sites para fazer login
LOGIN_SITES = [
    {
        "name": "Google",
        "url": "https://accounts.google.com/",
        "wait_selector": "//div[@data-email]",  # Indica login bem-sucedido
        "instructions": "Faça login com sua conta Google. Esta será a base para OAuth."
    },
    {
        "name": "Fundamentei",
        "url": "https://fundamentei.com.br/",
        "wait_selector": "//a[contains(@href, '/logout')]",
        "instructions": "Clique em 'Login' e use 'Continuar com Google'."
    },
    {
        "name": "Investidor10",
        "url": "https://investidor10.com.br/",
        "wait_selector": "//a[contains(@href, '/sair')]",
        "instructions": "Clique em 'Entrar' e use sua conta Google."
    },
    {
        "name": "StatusInvest",
        "url": "https://statusinvest.com.br/",
        "wait_selector": "//a[contains(text(), 'Sair')]",
        "instructions": "Clique em 'Login' e faça login com Google."
    },
    {
        "name": "Investing.com",
        "url": "https://www.investing.com/",
        "wait_selector": "//a[contains(@href, '/members/')]",
        "instructions": "Clique em 'Sign In' e use Google OAuth."
    },
    {
        "name": "ADVFN",
        "url": "https://br.advfn.com/",
        "wait_selector": "//a[contains(text(), 'Logout')]",
        "instructions": "Faça login com suas credenciais."
    },
    {
        "name": "Google Finance",
        "url": "https://www.google.com/finance/",
        "wait_selector": "//div[@aria-label='Google apps']",
        "instructions": "Já deve estar logado se fez login no Google."
    },
    {
        "name": "TradingView",
        "url": "https://www.tradingview.com/",
        "wait_selector": "//button[contains(@aria-label, 'User')]",
        "instructions": "Clique em 'Sign in' e use Google."
    },
    {
        "name": "ChatGPT",
        "url": "https://chat.openai.com/",
        "wait_selector": "//div[@id='prompt-textarea']",
        "instructions": "Faça login com sua conta OpenAI."
    },
    {
        "name": "Gemini",
        "url": "https://gemini.google.com/app",
        "wait_selector": "//textarea[@placeholder]",
        "instructions": "Já deve estar logado com conta Google."
    },
    {
        "name": "DeepSeek",
        "url": "https://chat.deepseek.com/",
        "wait_selector": "//textarea",
        "instructions": "Faça login com Google ou crie conta."
    },
    {
        "name": "Claude",
        "url": "https://claude.ai/",
        "wait_selector": "//div[@contenteditable='true']",
        "instructions": "Faça login com Google ou email."
    },
    {
        "name": "Grok",
        "url": "https://grok.x.ai/",
        "wait_selector": "//textarea",
        "instructions": "Faça login com conta X (Twitter)."
    },
    {
        "name": "Valor Econômico",
        "url": "https://valor.globo.com/",
        "wait_selector": "//a[contains(@href, '/logout')]",
        "instructions": "Faça login ou assine."
    },
    {
        "name": "Exame",
        "url": "https://exame.com/",
        "wait_selector": "//a[contains(text(), 'Minha conta')]",
        "instructions": "Faça login se tiver conta premium."
    },
    {
        "name": "InfoMoney",
        "url": "https://www.infomoney.com.br/",
        "wait_selector": "//a[contains(@href, '/conta')]",
        "instructions": "Faça login se tiver conta."
    },
    {
        "name": "Estadão",
        "url": "https://www.estadao.com.br/",
        "wait_selector": "//a[contains(@href, '/minha-conta')]",
        "instructions": "Faça login se tiver assinatura."
    },
    {
        "name": "Mais Retorno",
        "url": "https://maisretorno.com/",
        "wait_selector": "//a[contains(text(), 'Perfil')]",
        "instructions": "Faça login com Google."
    },
]


class CookieSaver:
    """Classe para salvar cookies de autenticação OAuth"""

    def __init__(self):
        self.driver = None
        self.cookies = {}

    def setup_driver(self):
        """Configurar driver do Chrome"""
        logger.info("Iniciando Chrome...")

        chrome_options = Options()
        # chrome_options.add_argument("--headless")  # Comentado: precisa ser visível para login manual
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_argument("--window-size=1920,1080")

        # User agent realista
        chrome_options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )

        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            logger.success("Chrome iniciado com sucesso")
            return True
        except Exception as e:
            logger.error(f"Erro ao iniciar Chrome: {e}")
            return False

    def login_to_site(self, site: Dict) -> bool:
        """
        Abrir site e esperar login manual

        Args:
            site: Dicionário com informações do site

        Returns:
            True se login foi bem-sucedido, False caso contrário
        """
        logger.info(f"\n{'='*60}")
        logger.info(f"SITE: {site['name']}")
        logger.info(f"URL: {site['url']}")
        logger.info(f"{'='*60}")
        logger.info(f"INSTRUÇÕES: {site['instructions']}")
        logger.info(f"{'='*60}\n")

        try:
            # Navegar para o site
            logger.info(f"Navegando para {site['url']}...")
            self.driver.get(site['url'])
            time.sleep(3)

            # Esperar login manual
            logger.warning("👉 FAÇA LOGIN MANUALMENTE NO NAVEGADOR 👈")
            logger.warning("Pressione ENTER aqui quando terminar o login...")
            input()

            # Verificar se login foi bem-sucedido (opcional)
            try:
                # Tentar encontrar elemento que indica login
                # wait = WebDriverWait(self.driver, 5)
                # wait.until(EC.presence_of_element_located((By.XPATH, site['wait_selector'])))
                logger.success(f"✓ Login aparentemente bem-sucedido em {site['name']}")
            except Exception:
                logger.warning(f"⚠ Não foi possível verificar login automaticamente")
                logger.warning("Continuando mesmo assim...")

            # Salvar cookies do site
            site_cookies = self.driver.get_cookies()
            self.cookies[site['name']] = site_cookies
            logger.info(f"✓ {len(site_cookies)} cookies salvos para {site['name']}")

            return True

        except Exception as e:
            logger.error(f"Erro ao processar {site['name']}: {e}")
            return False

    def save_cookies(self):
        """Salvar cookies em arquivo pickle"""
        try:
            # Criar diretório se não existir
            COOKIES_DIR.mkdir(parents=True, exist_ok=True)

            # Salvar cookies
            with open(COOKIES_FILE, 'wb') as f:
                pickle.dump(self.cookies, f)

            logger.success(f"\n{'='*60}")
            logger.success(f"✓ COOKIES SALVOS COM SUCESSO!")
            logger.success(f"Arquivo: {COOKIES_FILE}")
            logger.success(f"Total de sites: {len(self.cookies)}")
            logger.success(f"{'='*60}\n")

            # Resumo
            for site_name, site_cookies in self.cookies.items():
                logger.info(f"  {site_name}: {len(site_cookies)} cookies")

            return True

        except Exception as e:
            logger.error(f"Erro ao salvar cookies: {e}")
            return False

    def load_cookies(self) -> bool:
        """Carregar cookies existentes (se houver)"""
        if not COOKIES_FILE.exists():
            logger.info("Nenhum arquivo de cookies existente encontrado")
            return False

        try:
            with open(COOKIES_FILE, 'rb') as f:
                self.cookies = pickle.load(f)

            logger.info(f"Cookies existentes carregados: {len(self.cookies)} sites")
            return True
        except Exception as e:
            logger.error(f"Erro ao carregar cookies: {e}")
            return False

    def close_driver(self):
        """Fechar navegador"""
        if self.driver:
            self.driver.quit()
            logger.info("Navegador fechado")

    def run(self, sites: List[Dict] = None):
        """
        Executar processo completo de coleta de cookies

        Args:
            sites: Lista de sites. Se None, usa todos os sites padrão
        """
        if sites is None:
            sites = LOGIN_SITES

        logger.info("\n" + "="*60)
        logger.info("🔐 SAVE GOOGLE OAUTH COOKIES")
        logger.info("="*60)
        logger.info(f"Sites a processar: {len(sites)}")
        logger.info("="*60 + "\n")

        # Carregar cookies existentes
        self.load_cookies()

        # Perguntar se quer processar todos ou apenas alguns
        logger.info("Opções:")
        logger.info("  1. Processar todos os sites")
        logger.info("  2. Processar apenas sites específicos")
        logger.info("  3. Atualizar apenas sites que falharam anteriormente")
        choice = input("\nEscolha (1/2/3) [1]: ").strip() or "1"

        if choice == "2":
            logger.info("\nSites disponíveis:")
            for i, site in enumerate(sites, 1):
                status = "✓" if site['name'] in self.cookies else "✗"
                logger.info(f"  {i:2d}. [{status}] {site['name']}")

            indices = input("\nDigite os números dos sites (ex: 1,3,5): ").strip()
            try:
                selected_indices = [int(i.strip()) - 1 for i in indices.split(",")]
                sites = [sites[i] for i in selected_indices if 0 <= i < len(sites)]
            except Exception:
                logger.error("Entrada inválida. Processando todos.")

        elif choice == "3":
            # Processar apenas sites sem cookies
            sites = [s for s in sites if s['name'] not in self.cookies]
            if not sites:
                logger.success("Todos os sites já têm cookies!")
                return
            logger.info(f"Processando {len(sites)} sites sem cookies")

        # Iniciar navegador
        if not self.setup_driver():
            logger.error("Falha ao iniciar navegador. Abortando.")
            return

        # Processar cada site
        success_count = 0
        for i, site in enumerate(sites, 1):
            logger.info(f"\n[{i}/{len(sites)}] Processando {site['name']}...")

            if self.login_to_site(site):
                success_count += 1

            # Pausa entre sites
            if i < len(sites):
                logger.info("\nPressione ENTER para continuar para o próximo site...")
                input()

        # Salvar cookies
        self.save_cookies()

        # Fechar navegador
        self.close_driver()

        # Resumo final
        logger.info("\n" + "="*60)
        logger.info("📊 RESUMO FINAL")
        logger.info("="*60)
        logger.info(f"Sites processados: {len(sites)}")
        logger.info(f"Sucessos: {success_count}")
        logger.info(f"Falhas: {len(sites) - success_count}")
        logger.info(f"Total de sites com cookies: {len(self.cookies)}")
        logger.info("="*60 + "\n")

        # Próximos passos
        logger.info("🎯 PRÓXIMOS PASSOS:")
        logger.info("  1. Testar cookies: python test_scrapers.py")
        logger.info("  2. Renovar cookies a cada 7-14 dias")
        logger.info("  3. Verificar logs dos scrapers para problemas de autenticação")
        logger.info("")


def main():
    """Função principal"""
    saver = CookieSaver()

    try:
        saver.run()
    except KeyboardInterrupt:
        logger.warning("\n\nInterrompido pelo usuário")
        logger.info("Salvando cookies coletados até agora...")
        saver.save_cookies()
        saver.close_driver()
    except Exception as e:
        logger.error(f"Erro inesperado: {e}")
        saver.close_driver()


if __name__ == "__main__":
    main()
